import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

/**
 * Fetch all active prices from Stripe
 * This is the single source of truth for pricing
 */
export async function getActivePricing() {
  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
  });

  return prices.data.map(p => {
    const product = p.product;
    return {
      priceId: p.id,
      productId: product.id,
      productName: product.name,
      productDescription: product.description,
      amount: p.unit_amount,
      currency: p.currency,
      interval: p.recurring?.interval ?? "one_time",
      metadata: product.metadata,
    };
  });
}

/**
 * Get prices grouped by product type
 */
export async function getPricingByCategory() {
  const prices = await getActivePricing();
  
  return {
    subscriptions: prices.filter(p => p.interval !== "one_time"),
    oneTime: prices.filter(p => p.interval === "one_time" && !p.metadata.is_credit_bundle),
    creditBundles: prices.filter(p => p.metadata.is_credit_bundle === "true"),
  };
}
