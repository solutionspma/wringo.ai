import { Router } from "express";
import { stripe } from "../stripe.js";
import { grantEntitlement } from "../services/entitlements.js";

const router = Router();

/**
 * GET /api/stripe/pricing
 * Fetch all WringoAI products (subscriptions + reloads)
 */
router.get("/pricing", async (req, res) => {
  try {
    // Fetch ALL active prices (Stripe default is 10, max is 100 per request)
    let allPrices = [];
    let hasMore = true;
    let startingAfter = undefined;

    while (hasMore) {
      const batch = await stripe.prices.list({
        active: true,
        expand: ["data.product"],
        limit: 100,
        starting_after: startingAfter,
      });
      
      allPrices = allPrices.concat(batch.data);
      hasMore = batch.has_more;
      if (hasMore) {
        startingAfter = batch.data[batch.data.length - 1].id;
      }
    }

    // Filter for WringoAI products only
    const scoped = allPrices.filter(p => {
      const prod = p.product;
      return prod?.metadata?.app === "wringoai";
    });

    res.json(scoped.map(p => ({
      priceId: p.id,
      name: p.product.name,
      description: p.product.description,
      amount: p.unit_amount,
      interval: p.recurring?.interval || "one_time",
      type: p.product.metadata.type,
      category: p.product.metadata.category,
    })));
  } catch (err) {
    console.error("[Stripe Pricing]", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/stripe/checkout
 * Create subscription checkout session
 */
router.post("/checkout", async (req, res) => {
  try {
    const { priceId, userId } = req.body;

    if (!priceId || !userId) {
      return res.status(400).json({ error: "Missing priceId or userId" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || "https://wringoai.com"}/success`,
      cancel_url: `${process.env.FRONTEND_URL || "https://wringoai.com"}/pricing`,
      metadata: { userId },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("[Stripe Checkout]", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/stripe/reload
 * Create one-time reload purchase (daily spend mechanics)
 */
router.post("/reload", async (req, res) => {
  try {
    const { priceId, userId } = req.body;

    if (!priceId || !userId) {
      return res.status(400).json({ error: "Missing priceId or userId" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || "https://wringoai.com"}/store`,
      cancel_url: `${process.env.FRONTEND_URL || "https://wringoai.com"}/store`,
      metadata: { userId },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("[Stripe Reload]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
