import Stripe from "npm:stripe@17";
import { corsHeaders } from "../_shared/cors.ts";
import { stripe, getPlanNameFromPriceId } from "../_shared/stripe.ts";
import { createAdminClient } from "../_shared/supabase.ts";

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not set");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createAdminClient();

  try {
    // 1. Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Verify webhook signature (async for Deno)
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("[stripe-webhook] Signature verification failed:", (err as Error).message);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Idempotency check - skip already-processed events
    const { data: existingEvent } = await supabaseAdmin
      .from("webhook_events")
      .select("id, processed")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existingEvent?.processed) {
      console.log(`[stripe-webhook] Event ${event.id} already processed, skipping`);
      return new Response(
        JSON.stringify({ received: true, skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Log the event (upsert to handle retries)
    await supabaseAdmin.from("webhook_events").upsert(
      {
        stripe_event_id: event.id,
        type: event.type,
        data: event.data as unknown as Record<string, unknown>,
        processed: false,
      },
      { onConflict: "stripe_event_id" }
    );

    // 5. Route to handler
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutComplete(supabaseAdmin, event);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabaseAdmin, event);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabaseAdmin, event);
        break;
      case "invoice.paid":
        await handleInvoicePaid(supabaseAdmin, event);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(supabaseAdmin, event);
        break;
      case "payment_method.attached":
        await handlePaymentMethodAttached(supabaseAdmin, event);
        break;
      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    // 6. Mark as processed
    await supabaseAdmin
      .from("webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[stripe-webhook] Handler error:", error);

    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================
// Event Handlers
// ============================================

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

async function handleCheckoutComplete(supabaseAdmin: SupabaseAdmin, event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.mode !== "subscription" || !session.subscription) return;

  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error("[stripe-webhook] checkout.session.completed: missing user_id in metadata");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const priceId = subscription.items.data[0]?.price?.id;
  const planName = session.metadata?.plan_name || getPlanNameFromPriceId(priceId || "");
  const planType = session.metadata?.billing_interval || "monthly";

  // Insert subscription record
  await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      price_id: priceId || "",
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      plan_type: planType,
      plan_name: planName,
    },
    { onConflict: "stripe_subscription_id" }
  );

  // Create success notification
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type: "payment_success",
    title: "Subscription Activated",
    message: `Your ${planName} subscription has been successfully activated.`,
    metadata: { subscription_id: subscription.id },
  });
}

async function handleSubscriptionUpdated(supabaseAdmin: SupabaseAdmin, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleSubscriptionDeleted(supabaseAdmin: SupabaseAdmin, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  // Get user_id before updating
  const { data: subData } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      ended_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  // Create cancellation notification
  if (subData) {
    await supabaseAdmin.from("notifications").insert({
      user_id: subData.user_id,
      type: "subscription_canceled",
      title: "Subscription Canceled",
      message: "Your subscription has been canceled. You can resubscribe at any time.",
      metadata: { subscription_id: subscription.id },
    });
  }
}

async function handleInvoicePaid(supabaseAdmin: SupabaseAdmin, event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("user_id")
    .eq("stripe_customer_id", invoice.customer as string)
    .single();

  if (!customer) return;

  // Insert invoice record (upsert in case of retry)
  await supabaseAdmin.from("invoices").upsert(
    {
      user_id: customer.user_id,
      stripe_invoice_id: invoice.id,
      stripe_customer_id: invoice.customer as string,
      stripe_subscription_id: (invoice.subscription as string) || null,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status!,
      invoice_pdf: invoice.invoice_pdf || null,
      hosted_invoice_url: invoice.hosted_invoice_url || null,
      billing_reason: invoice.billing_reason || null,
      created_at: new Date(invoice.created * 1000).toISOString(),
      period_start: invoice.period_start
        ? new Date(invoice.period_start * 1000).toISOString()
        : null,
      period_end: invoice.period_end
        ? new Date(invoice.period_end * 1000).toISOString()
        : null,
      paid_at: new Date().toISOString(),
    },
    { onConflict: "stripe_invoice_id" }
  );

  // Create payment notification
  const amountFormatted = (invoice.amount_paid / 100).toFixed(2);
  await supabaseAdmin.from("notifications").insert({
    user_id: customer.user_id,
    type: "payment_success",
    title: "Payment Successful",
    message: `Your payment of \u20AC${amountFormatted} has been processed.`,
    metadata: { invoice_id: invoice.id },
  });
}

async function handlePaymentFailed(supabaseAdmin: SupabaseAdmin, event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("user_id")
    .eq("stripe_customer_id", invoice.customer as string)
    .single();

  if (!customer) return;

  // Update subscription status to past_due
  if (invoice.subscription) {
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "past_due" })
      .eq("stripe_subscription_id", invoice.subscription as string);
  }

  // Create payment failure notification
  await supabaseAdmin.from("notifications").insert({
    user_id: customer.user_id,
    type: "payment_failed",
    title: "Payment Failed",
    message: "Your recent payment failed. Please update your payment method to avoid service interruption.",
    metadata: { invoice_id: invoice.id },
  });
}

async function handlePaymentMethodAttached(supabaseAdmin: SupabaseAdmin, event: Stripe.Event) {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;

  if (!paymentMethod.customer) return;

  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("user_id")
    .eq("stripe_customer_id", paymentMethod.customer as string)
    .single();

  if (!customer || !paymentMethod.card) return;

  await supabaseAdmin.from("payment_methods").upsert(
    {
      user_id: customer.user_id,
      stripe_payment_method_id: paymentMethod.id,
      stripe_customer_id: paymentMethod.customer as string,
      type: paymentMethod.type,
      card_brand: paymentMethod.card.brand,
      card_last4: paymentMethod.card.last4,
      card_exp_month: paymentMethod.card.exp_month,
      card_exp_year: paymentMethod.card.exp_year,
    },
    { onConflict: "stripe_payment_method_id" }
  );
}
