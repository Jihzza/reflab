import { corsHeaders } from "../_shared/cors.ts";
import { stripe } from "../_shared/stripe.ts";
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

    const { cancelAtPeriodEnd } = await req.json();

    if (typeof cancelAtPeriodEnd !== "boolean") {
      return new Response(
        JSON.stringify({ error: "cancelAtPeriodEnd must be a boolean" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Look up user's active subscription
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .single();

    if (!subscription) {
      return new Response(
        JSON.stringify({ error: "No active subscription found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update in Stripe (the webhook will sync the DB)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[cancel-subscription] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update subscription" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
