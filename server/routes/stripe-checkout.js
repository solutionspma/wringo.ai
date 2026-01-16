import { Router } from "express";
import { stripe } from "../stripe.js";

const router = Router();

/**
 * GET /api/stripe/pricing
 * Returns WringoAI products only - hardcoded product IDs
 */
router.get("/pricing", async (req, res) => {
  try {
    const wringoProductIds = [
      "prod_Tnu5BMbJd3Gpeo", // Starter
      "prod_Tnu52zUp9iulUV", // Creator
      "prod_Tnu6nJL29mbNZ0"  // Pro
    ];

    const prices = await stripe.prices.list({
      active: true,
      expand: ["data.product"],
      limit: 100
    });

    const wringoPrices = prices.data.filter(p => 
      wringoProductIds.includes(p.product?.id)
    );

    res.json(wringoPrices.map(p => ({
      priceId: p.id,
      productId: p.product.id,
      name: p.product.name,
      description: p.product.description || "",
      amount: p.unit_amount,
      currency: p.currency,
      interval: p.recurring?.interval || "one_time"
    })));
  } catch (err) {
    console.error("[Stripe Pricing Error]", err.message);
    res.status(500).json({ error: "Failed to fetch pricing" });
  }
});

/**
 * POST /api/stripe/checkout
 * Create checkout session
 */
router.post("/checkout", async (req, res) => {
  try {
    const { priceId, userId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "priceId required" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || "https://wringoai.com"}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "https://wringoai.com"}/pricing`,
      metadata: { userId: userId || "anonymous" }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("[Stripe Checkout Error]", err.message);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

export default router;
