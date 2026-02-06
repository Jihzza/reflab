import { corsHeaders } from "../_shared/cors.ts";
import { stripe, PRICE_IDS } from "../_shared/stripe.ts";
import { createAdminClient, getAuthenticatedUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    const { planType, billingInterval } = await req.json();

    if (!planType || !["standard", "pro"].includes(planType)) {
      return new Response(
        JSON.stringify({ error: "Invalid plan type. Must be 'standard' or 'pro'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!billingInterval || !["monthly", "yearly"].includes(billingInterval)) {
      return new Response(
        JSON.stringify({ error: "Invalid billing interval. Must be 'monthly' or 'yearly'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve price ID server-side (never trust client-provided price IDs)
    const priceId = PRICE_IDS[planType as keyof typeof PRICE_IDS][billingInterval as "monthly" | "yearly"];
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Price not configured for this plan." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Get or create Stripe customer
    let customerId: string;

    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      // Store in Supabase (upsert to handle race condition with concurrent requests)
      const { data: upsertedCustomer } = await supabaseAdmin.from("customers").upsert(
        {
          user_id: user.id,
          stripe_customer_id: customer.id,
          email: user.email!,
        },
        { onConflict: "user_id" }
      ).select("stripe_customer_id").single();

      // If another request already created a customer, use that one
      customerId = upsertedCustomer?.stripe_customer_id || customer.id;
    }

    // Check for existing active subscription
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (existingSub) {
      return new Response(
        JSON.stringify({ error: "You already have an active subscription." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const appUrl = Deno.env.get("APP_URL") || "http://localhost:5173";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          user_id: user.id,
          billing_interval: billingInterval,
          plan_name: planType,
        },
      },
      success_url: `${appUrl}/app/settings?checkout=success`,
      cancel_url: `${appUrl}/app/settings?checkout=canceled`,
      metadata: {
        user_id: user.id,
        billing_interval: billingInterval,
        plan_name: planType,
      },
      allow_promotion_codes: true,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[create-checkout] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
