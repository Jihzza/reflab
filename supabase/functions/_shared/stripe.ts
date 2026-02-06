import Stripe from "npm:stripe@17";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

export const stripe = new Stripe(stripeSecretKey, {
  httpClient: Stripe.createFetchHttpClient(),
});

// Price ID mapping - resolved server-side, never sent from client
export const PRICE_IDS = {
  standard: {
    monthly: Deno.env.get("STRIPE_PRICE_STANDARD_MONTHLY") ?? "",
    yearly: Deno.env.get("STRIPE_PRICE_STANDARD_YEARLY") ?? "",
  },
  pro: {
    monthly: Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") ?? "",
    yearly: Deno.env.get("STRIPE_PRICE_PRO_YEARLY") ?? "",
  },
} as const;

// Reverse lookup: price ID → plan name
export function getPlanNameFromPriceId(priceId: string): "standard" | "pro" {
  for (const [planName, intervals] of Object.entries(PRICE_IDS)) {
    if (intervals.monthly === priceId || intervals.yearly === priceId) {
      return planName as "standard" | "pro";
    }
  }
  // Default fallback - should not happen if prices are configured correctly
  return "standard";
}
