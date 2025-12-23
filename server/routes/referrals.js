/**
 * Referrals Router - AI Referral Engine™
 * 
 * Handles referral capture from ElevenLabs voice agent.
 * The agent naturally asks for referrals after providing value,
 * then captures referral info via this endpoint.
 * 
 * Endpoint: POST /api/referrals/capture
 */

import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

// Supabase client for direct table access (leads + referrals tables)
const SUPABASE_URL = process.env.MODCRM_SUPABASE_URL || 'https://jchwuzfsztaxeautzprz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.MODCRM_SUPABASE_SERVICE_KEY;

let supabase = null;

function getClient() {
  if (!supabase && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    });
  }
  return supabase;
}

/**
 * Generate a referral code like WRG-8F3A2
 */
function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 for readability
  let code = 'WRG-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * POST /api/referrals/capture
 * 
 * Captures referral from ElevenLabs voice agent conversation.
 * 
 * Expected body:
 * {
 *   "referrer_name": "string | null",
 *   "referrer_contact": "string | null", 
 *   "referral_method": "share_link | direct_intro | provide_contact | not_sure_yet",
 *   "referred_name": "string | null",
 *   "referred_contact": "string | null",
 *   "notes": "string | null",
 *   "conversation_id": "string | null"
 * }
 */
router.post("/capture", async (req, res) => {
  const {
    referrer_name,
    referrer_contact,
    referral_method,
    referred_name,
    referred_contact,
    notes,
    conversation_id
  } = req.body;

  console.log("[Referral Capture]", JSON.stringify(req.body, null, 2));

  // Validate required field
  if (!referral_method) {
    return res.status(400).json({ 
      error: "referral_method is required",
      valid_methods: ["share_link", "direct_intro", "provide_contact", "not_sure_yet"]
    });
  }

  // Validate referral_method value
  const validMethods = ["share_link", "direct_intro", "provide_contact", "not_sure_yet"];
  if (!validMethods.includes(referral_method)) {
    return res.status(400).json({
      error: `Invalid referral_method. Must be one of: ${validMethods.join(", ")}`,
      received: referral_method
    });
  }

  const client = getClient();
  
  if (!client) {
    console.error("[Referral] Supabase not configured");
    // Still return success to ElevenLabs so conversation continues
    return res.json({ 
      success: true, 
      message: "Thank you for your interest in sharing! We'll follow up soon.",
      warning: "Database not configured"
    });
  }

  try {
    // Generate a unique referral code
    const referralCode = generateReferralCode();

    // Insert into referrals table
    const { data, error } = await client
      .from("referrals")
      .insert({
        referrer_name,
        referrer_contact,
        referral_method,
        referred_name,
        referred_contact,
        referral_code: referralCode,
        notes,
        conversation_id,
        source: "elevenlabs_agent",
        status: "pending"
      })
      .select()
      .single();

    if (error) {
      console.error("[Referral] Supabase insert error:", error);
      // Return success to keep conversation flowing
      return res.json({
        success: true,
        message: "Thank you! We've noted your referral interest.",
        error: error.message
      });
    }

    console.log(`[Referral Captured] Code: ${referralCode} | Method: ${referral_method} | Referrer: ${referrer_name || "Anonymous"}`);

    // Build response based on referral method
    let responseMessage = "";
    let shareableLink = null;

    switch (referral_method) {
      case "share_link":
        shareableLink = `https://wringoai.netlify.app/?ref=${referralCode}`;
        responseMessage = `Perfect! Here's your unique referral link: ${shareableLink}. Share it with anyone who might benefit from AI voice solutions. We'll track any signups automatically!`;
        break;
      
      case "direct_intro":
        responseMessage = `Wonderful! We'll prepare a warm introduction email for you to forward. Keep an eye on your inbox, and thank you for thinking of us!`;
        break;
      
      case "provide_contact":
        if (referred_name || referred_contact) {
          responseMessage = `Thank you for connecting us with ${referred_name || "your contact"}! We'll reach out respectfully and keep you posted on how it goes.`;
        } else {
          responseMessage = `Thanks! If you want to share their info later, just call back or email us at hello@pitchmarketing.agency.`;
        }
        break;
      
      case "not_sure_yet":
        responseMessage = `No pressure at all! When you're ready to share, you can always call back or visit our website. I've noted your interest for now.`;
        break;
      
      default:
        responseMessage = `Thank you for your interest in sharing! We really appreciate it.`;
    }

    res.json({
      success: true,
      message: responseMessage,
      referral: {
        id: data.id,
        code: referralCode,
        method: referral_method,
        shareable_link: shareableLink
      }
    });

  } catch (err) {
    console.error("[Referral] Error:", err);
    res.json({
      success: true,
      message: "Thank you for your interest! We'll follow up soon.",
      error: err.message
    });
  }
});

/**
 * GET /api/referrals/stats
 * 
 * Get referral statistics (for admin dashboard)
 */
router.get("/stats", async (req, res) => {
  const client = getClient();
  
  if (!client) {
    return res.status(503).json({ error: "Database not configured" });
  }

  try {
    // Get counts by method
    const { data: methodStats, error: methodError } = await client
      .from("referrals")
      .select("referral_method, status")
      .order("created_at", { ascending: false });

    if (methodError) throw methodError;

    // Aggregate stats
    const stats = {
      total: methodStats.length,
      byMethod: {},
      byStatus: {},
      recent: []
    };

    methodStats.forEach((ref, idx) => {
      // Count by method
      stats.byMethod[ref.referral_method] = (stats.byMethod[ref.referral_method] || 0) + 1;
      // Count by status
      stats.byStatus[ref.status] = (stats.byStatus[ref.status] || 0) + 1;
    });

    // Get 10 most recent
    const { data: recent } = await client
      .from("referrals")
      .select("id, referrer_name, referral_method, referral_code, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    stats.recent = recent || [];

    res.json(stats);

  } catch (err) {
    console.error("[Referral Stats] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/referrals/lookup/:code
 * 
 * Look up a referral by code (for attribution)
 */
router.get("/lookup/:code", async (req, res) => {
  const { code } = req.params;
  const client = getClient();
  
  if (!client) {
    return res.status(503).json({ error: "Database not configured" });
  }

  try {
    const { data, error } = await client
      .from("referrals")
      .select("id, referrer_name, referral_method, referral_code, created_at")
      .eq("referral_code", code.toUpperCase())
      .single();

    if (error) {
      return res.status(404).json({ error: "Referral code not found" });
    }

    res.json({
      valid: true,
      referral: data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/referrals/track
 * 
 * Track when a referral link is used (for conversion tracking)
 */
router.post("/track", async (req, res) => {
  const { referral_code, action, lead_id } = req.body;
  const client = getClient();

  if (!client) {
    return res.json({ success: true, tracked: false });
  }

  try {
    // Update the referral status if we have a code
    if (referral_code) {
      await client
        .from("referrals")
        .update({ 
          status: action === "converted" ? "converted" : "contacted",
          updated_at: new Date().toISOString()
        })
        .eq("referral_code", referral_code.toUpperCase());
    }

    res.json({ success: true, tracked: true });
  } catch (err) {
    res.json({ success: true, tracked: false, error: err.message });
  }
});

export default router;
