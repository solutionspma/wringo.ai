import { Router } from "express";
import { stripe } from "../stripe.js";
import { grantEntitlement, addUsage } from "../services/entitlements.js";

const router = Router();

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] Received: ${event.type}`);

  const data = event.data.object;

  try {
    if (event.type === "checkout.session.completed") {
      const userId = data.metadata.userId;

      if (data.mode === "subscription") {
        await grantEntitlement(userId, data.subscription);
        console.log(`[Webhook] Granted subscription entitlement to user ${userId}`);
      }

      if (data.mode === "payment") {
        await addUsage(userId, data.amount_total);
        console.log(`[Webhook] Added ${data.amount_total} cents credits to user ${userId}`);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
