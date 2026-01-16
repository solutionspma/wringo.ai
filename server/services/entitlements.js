import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.WRINGO_SUPABASE_URL,
  process.env.WRINGO_SUPABASE_SERVICE_KEY
);

/**
 * Entitlement Resolution System
 * Order: Subscription → Credits → One-time Purchase → Block
 */

/**
 * Grant subscription entitlement
 */
export async function grantEntitlement(userId, subscriptionId) {
  if (!userId || !subscriptionId) return;
  
  await supabase.from("subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: subscriptionId,
    status: "active",
    created_at: new Date().toISOString(),
  });
  
  console.log(`[Entitlements] Granted subscription ${subscriptionId} to user ${userId}`);
}

/**
 * Add credits from reload purchase
 * Converts cents to credits (100 cents = 1 credit)
 */
export async function addUsage(userId, cents) {
  if (!userId || !cents) return;
  
  const credits = Math.floor(cents / 100);
  
  const { data: existing } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", userId)
    .eq("credit_type", "general")
    .single();
    
  if (existing) {
    await supabase
      .from("credits")
      .update({ balance: existing.balance + credits })
      .eq("user_id", userId)
      .eq("credit_type", "general");
  } else {
    await supabase
      .from("credits")
      .insert({
        user_id: userId,
        credit_type: "general",
        balance: credits,
      });
  }
  
  console.log(`[Usage] Added ${credits} credits to user ${userId}`);
}

export async function checkEntitlement(userId, action) {
  // 1. Check active subscription
  const hasSubscription = await hasActiveSubscription(userId, action);
  if (hasSubscription) {
    return { allowed: true, source: "subscription" };
  }

  // 2. Check available credits
  const hasCredits = await hasAvailableCredits(userId, action);
  if (hasCredits) {
    return { allowed: true, source: "credits" };
  }

  // 3. Check one-time purchase
  const hasOnetime = await hasOnetimePurchase(userId, action);
  if (hasOnetime) {
    return { allowed: true, source: "onetime" };
  }

  // 4. Block and prompt purchase
  return { allowed: false, source: null };
}

/**
 * Deduct usage atomically
 */
export async function deductUsage(userId, action, amount = 1) {
  const entitlement = await checkEntitlement(userId, action);

  if (!entitlement.allowed) {
    throw new Error("Insufficient entitlements");
  }

  // Log usage
  await supabase.from("usage_log").insert({
    user_id: userId,
    usage_type: action,
    amount,
    metadata: { source: entitlement.source },
  });

  // Deduct from source
  if (entitlement.source === "credits") {
    const creditType = getActionCreditType(action);
    await deductCredits(userId, creditType, amount);
  }

  if (entitlement.source === "onetime") {
    await consumeOnetimePurchase(userId, action);
  }

  return { success: true, source: entitlement.source };
}

/**
 * Check if user has active subscription for action
 */
async function hasActiveSubscription(userId, action) {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!sub) return false;

  // Check if subscription plan covers this action
  const actionMap = {
    avatar_creation: ["subscription_creative", "subscription_pro"],
    scene_generation: ["subscription_creative"],
    scene_stitching: ["subscription_creative"],
    voice_performance: ["subscription_pro"],
    voice_minutes: ["subscription_pro"],
  };

  const requiredKeys = actionMap[action] || [];
  if (requiredKeys.length === 0) return false;

  const { data: entitlements } = await supabase
    .from("entitlements")
    .select("key")
    .eq("user_id", userId)
    .in("key", requiredKeys);

  return entitlements && entitlements.length > 0;
}

/**
 * Check if user has available credits
 */
async function hasAvailableCredits(userId, action) {
  const creditType = getActionCreditType(action);
  const { data } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", userId)
    .eq("credit_type", creditType)
    .single();

  return data && data.balance > 0;
}

/**
 * Check if user has unused one-time purchase
 */
async function hasOnetimePurchase(userId, action) {
  const { data } = await supabase
    .from("entitlements")
    .select("*")
    .eq("user_id", userId)
    .eq("key", `action_${action}`)
    .single();

  return !!data;
}

/**
 * Deduct credits from user balance
 */
async function deductCredits(userId, creditType, amount) {
  const { data } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", userId)
    .eq("credit_type", creditType)
    .single();

  if (!data || data.balance < amount) {
    throw new Error("Insufficient credits");
  }

  await supabase
    .from("credits")
    .update({ balance: data.balance - amount, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("credit_type", creditType);
}

/**
 * Consume one-time purchase
 */
async function consumeOnetimePurchase(userId, action) {
  await supabase
    .from("entitlements")
    .delete()
    .eq("user_id", userId)
    .eq("key", `action_${action}`);
}

/**
 * Map action to credit type
 */
function getActionCreditType(action) {
  const map = {
    avatar_creation: "creative_credits",
    scene_generation: "creative_credits",
    scene_stitching: "creative_credits",
    voice_performance: "voice_minutes",
    scene_remix: "creative_credits",
  };
  return map[action] || "creative_credits";
}

/**
 * Get user entitlement summary
 */
export async function getEntitlementSummary(userId) {
  const [subscription, credits, entitlements] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", userId).eq("status", "active").single(),
    supabase.from("credits").select("*").eq("user_id", userId),
    supabase.from("entitlements").select("*").eq("user_id", userId),
  ]);

  return {
    subscription: subscription.data,
    credits: credits.data || [],
    entitlements: entitlements.data || [],
  };
}
