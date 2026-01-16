import { Router } from "express";
import { stripe } from "./stripe.js";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const supabase = createClient(
  process.env.WRINGO_SUPABASE_URL,
  process.env.WRINGO_SUPABASE_SERVICE_KEY
);

/**
 * POST /api/stripe/create-checkout-session
 * Create a Stripe Checkout session
 */
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { priceId, userId, purchaseType, entitlementKey, successUrl, cancelUrl } = req.body;

    if (!priceId || !userId || !purchaseType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get or create Stripe customer
    const { data: user } = await supabase
      .from("users")
      .select("stripe_customer_id, email")
      .eq("id", userId)
      .single();

    let customerId = user?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: userId },
      });
      customerId = customer.id;

      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: purchaseType === "subscription" ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.BASE_URL}/pricing`,
      metadata: {
        user_id: userId,
        purchase_type: purchaseType,
        entitlement_key: entitlementKey || "",
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("[Stripe Checkout]", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/stripe/pricing
 * Get all active prices from Stripe
 */
router.get("/pricing", async (req, res) => {
  try {
    const { getActivePricing } = await import("./stripe.js");
    const pricing = await getActivePricing();
    res.json(pricing);
  } catch (err) {
    console.error("[Stripe Pricing]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
