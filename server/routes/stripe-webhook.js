import { Router } from "express";
import { stripe } from "../stripe.js";

const router = Router();

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[Webhook Signature Error]", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Webhook] Received: ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      console.log(`[Webhook] Payment successful for user: ${session.metadata?.userId}`);
      // TODO: Grant subscription access
      break;

    case "customer.subscription.deleted":
      console.log(`[Webhook] Subscription cancelled`);
      // TODO: Revoke access
      break;

    default:
      console.log(`[Webhook] Unhandled event: ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
