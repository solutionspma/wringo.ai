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
    const prices = await stripe.prices.list({
      active: true,
      expand: ["data.product"],
      limit: 20,
    });

    // DEBUG MODE: Return raw Stripe data to verify what we're getting
    res.json({
      count: prices.data.length,
      raw: prices.data.map(p => ({
        id: p.id,
        product: p.product?.id,
        name: p.product?.name,
        metadata: p.product?.metadata,
      })),
    });
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
