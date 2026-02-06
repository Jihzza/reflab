import { corsHeaders } from "../_shared/cors.ts";
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

    const supabaseAdmin = createAdminClient();

    // Get user's subscription (active, trialing, or past_due)
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .maybeSingle();

    // Get customer record
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    return new Response(
      JSON.stringify({ subscription, customer }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[get-subscription] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get subscription" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
