import { Router } from "express";
import { stripe } from "../stripe.js";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const supabase = createClient(
  process.env.WRINGO_SUPABASE_URL,
  process.env.WRINGO_SUPABASE_SERVICE_KEY
);

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

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Handle checkout.session.completed
 */
async function handleCheckoutCompleted(session) {
  const { user_id, purchase_type, entitlement_key } = session.metadata;

  if (!user_id) {
    console.error("[Webhook] Missing user_id in metadata");
    return;
  }

  if (purchase_type === "subscription") {
    // Subscription will be handled by invoice.paid
    return;
  }

  // Handle one-time purchases and credit bundles
  if (purchase_type === "action") {
    await grantOneTimeEntitlement(user_id, entitlement_key);
  }

  if (purchase_type === "credits") {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const price = lineItems.data[0]?.price;
    if (price?.metadata?.credit_amount && price?.metadata?.credit_type) {
      await addCredits(
        user_id,
        price.metadata.credit_type,
        parseInt(price.metadata.credit_amount, 10)
      );
    }
  }
}

/**
 * Handle invoice.paid (subscription activation/renewal)
 */
async function handleInvoicePaid(invoice) {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const customerId = subscription.customer;
  const customer = await stripe.customers.retrieve(customerId);
  const userId = customer.metadata.user_id;

  if (!userId) {
    console.error("[Webhook] No user_id in customer metadata");
    return;
  }

  const price = subscription.items.data[0]?.price;
  const product = await stripe.products.retrieve(price.product);

  // Upsert subscription
  await supabase.from("subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: price.id,
    plan: product.name,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  });

  // Grant subscription entitlements
  await grantSubscriptionEntitlements(userId, product.metadata);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;
  const customer = await stripe.customers.retrieve(customerId);
  const userId = customer.metadata.user_id;

  if (!userId) return;

  await supabase.from("subscriptions").update({
    status: subscription.status,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }).eq("stripe_subscription_id", subscription.id);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription) {
  await supabase.from("subscriptions").delete().eq("stripe_subscription_id", subscription.id);

  const customerId = subscription.customer;
  const customer = await stripe.customers.retrieve(customerId);
  const userId = customer.metadata.user_id;

  if (userId) {
    // Revoke subscription entitlements
    await supabase.from("entitlements").delete().eq("user_id", userId).like("key", "subscription_%");
  }
}

/**
 * Grant subscription-based entitlements
 */
async function grantSubscriptionEntitlements(userId, metadata) {
  const entitlements = [];

  if (metadata.creative_enabled === "true") {
    entitlements.push({
      user_id: userId,
      key: "subscription_creative",
      value: { enabled: true },
    });
  }

  if (metadata.pro_enabled === "true") {
    entitlements.push({
      user_id: userId,
      key: "subscription_pro",
      value: { enabled: true },
    });
  }

  if (entitlements.length > 0) {
    await supabase.from("entitlements").upsert(entitlements);
  }
}

/**
 * Grant one-time entitlement
 */
async function grantOneTimeEntitlement(userId, key) {
  await supabase.from("entitlements").upsert({
    user_id: userId,
    key: `action_${key}`,
    value: { granted_at: new Date().toISOString() },
  });
}

/**
 * Add credits to user balance
 */
async function addCredits(userId, creditType, amount) {
  const { data: existing } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", userId)
    .eq("credit_type", creditType)
    .single();

  const newBalance = (existing?.balance || 0) + amount;

  await supabase.from("credits").upsert({
    user_id: userId,
    credit_type: creditType,
    balance: newBalance,
    updated_at: new Date().toISOString(),
  });
}

export default router;
