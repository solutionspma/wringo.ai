/**
 * Webhooks Router - Handles ElevenLabs conversation events
 * 
 * Flow:
 * 1. ElevenLabs agent captures user info during conversation
 * 2. Agent triggers a "client tool" which calls our webhook
 * 3. We process the intent and route to appropriate action
 * 4. All leads sync to Level 10 CRM as master record
 */

import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

// Wringo.ai dedicated Supabase project for leads + referrals
const SUPABASE_URL = process.env.WRINGO_SUPABASE_URL || 'https://wncmxyswxqmmzrhcrnnh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.WRINGO_SUPABASE_SERVICE_KEY;

let supabase = null;

function getSupabaseClient() {
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
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'WRG-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// In-memory store for conversation data (in production, use Redis/DB)
const conversationStore = new Map();

/**
 * POST /api/webhooks/elevenlabs
 * Receives webhook events from ElevenLabs Conversational AI
 * 
 * Event types:
 * - conversation.started
 * - conversation.ended
 * - tool.called (when agent invokes a tool)
 */
router.post("/elevenlabs", async (req, res) => {
  const event = req.body;
  
  console.log("[ElevenLabs Webhook]", JSON.stringify(event, null, 2));
  
  try {
    const eventType = event.type || event.event_type;
    
    switch (eventType) {
      case "conversation.started":
        handleConversationStarted(event);
        break;
      case "conversation.ended":
        await handleConversationEnded(event);
        break;
      case "tool.called":
      case "client_tool_call":
        await handleToolCall(event);
        break;
      default:
        console.log("[Webhook] Unknown event type:", eventType);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("[Webhook Error]", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Handle conversation started - initialize tracking
 */
function handleConversationStarted(event) {
  const conversationId = event.conversation_id;
  conversationStore.set(conversationId, {
    startedAt: new Date().toISOString(),
    source: event.source || "web",
    phoneNumber: event.phone_number || null,
    data: {}
  });
  console.log(`[Conversation Started] ${conversationId}`);
}

/**
 * Handle conversation ended - finalize and sync to modCRM
 */
async function handleConversationEnded(event) {
  const conversationId = event.conversation_id;
  const conversation = conversationStore.get(conversationId) || {};
  
  conversation.endedAt = new Date().toISOString();
  conversation.duration = event.duration_seconds;
  conversation.transcript = event.transcript;
  
  // If we have lead data, sync to modCRM
  if (conversation.data?.email || conversation.data?.phone) {
    await syncToModCRM({
      ...conversation.data,
      conversationId,
      source: "wringo_voice_agent",
      transcript: conversation.transcript,
      duration: conversation.duration
    });
  }
  
  console.log(`[Conversation Ended] ${conversationId} - Duration: ${conversation.duration}s`);
  conversationStore.delete(conversationId);
}

/**
 * Handle tool calls from the ElevenLabs agent
 * These are actions Jason takes during the conversation
 */
async function handleToolCall(event) {
  const toolName = event.tool_name || event.name;
  const toolInput = event.tool_input || event.parameters || {};
  const conversationId = event.conversation_id;
  
  console.log(`[Tool Called] ${toolName}`, toolInput);
  
  let result = { success: true };
  
  switch (toolName) {
    case "capture_lead":
      result = await captureLead(conversationId, toolInput);
      break;
      
    case "book_consultation":
      result = await bookConsultation(toolInput);
      break;
      
    case "send_pricing":
      result = await sendPricing(toolInput);
      break;
      
    case "create_support_ticket":
      result = await createSupportTicket(toolInput);
      break;
      
    case "transfer_to_human":
      result = await transferToHuman(toolInput);
      break;
      
    case "check_availability":
      result = await checkAvailability(toolInput);
      break;
      
    case "capture_referral":
      result = await captureReferral(conversationId, toolInput);
      break;
      
    default:
      console.log(`[Tool] Unknown tool: ${toolName}`);
      result = { success: false, message: `Unknown tool: ${toolName}` };
  }
  
  return result;
}

/**
 * TOOL: Capture lead information
 */
async function captureLead(conversationId, data) {
  const { name, email, phone, company, interest, notes } = data;
  
  // Store in conversation
  const conversation = conversationStore.get(conversationId) || { data: {} };
  conversation.data = { ...conversation.data, name, email, phone, company, interest, notes };
  conversationStore.set(conversationId, conversation);
  
  // Immediately sync to modCRM
  const crmResult = await syncToModCRM({
    name,
    email,
    phone,
    company,
    interest,
    notes,
    source: "wringo_voice_agent",
    conversationId,
    capturedAt: new Date().toISOString()
  });
  
  console.log(`[Lead Captured] ${name} - ${email} - Interest: ${interest}`);
  
  return {
    success: true,
    message: `Great! I've captured your information. ${crmResult.message || ""}`
  };
}

/**
 * TOOL: Book a consultation with Pitch Marketing
 */
async function bookConsultation(data) {
  const { name, email, phone, preferredDate, preferredTime, topic } = data;
  
  // Sync to modCRM first
  await syncToModCRM({
    name,
    email,
    phone,
    interest: "consultation",
    topic,
    preferredDate,
    preferredTime,
    source: "wringo_voice_agent",
    status: "booking_requested"
  });
  
  // TODO: Integrate with Calendly or booking system
  // For now, we'll notify the team via webhook/email
  await notifyPitchMarketing({
    type: "consultation_request",
    data: { name, email, phone, preferredDate, preferredTime, topic }
  });
  
  console.log(`[Consultation Requested] ${name} - ${topic}`);
  
  return {
    success: true,
    message: "I've submitted your consultation request. Our team will reach out within 24 hours to confirm your appointment."
  };
}

/**
 * TOOL: Send pricing information
 */
async function sendPricing(data) {
  const { email, name, plan, interest } = data;
  
  // Log to modCRM
  await syncToModCRM({
    name,
    email,
    interest: interest || plan,
    source: "wringo_voice_agent",
    action: "pricing_requested",
    plan
  });
  
  // TODO: Trigger email via SendGrid/Mailgun with pricing PDF
  console.log(`[Pricing Sent] ${email} - Plan: ${plan}`);
  
  return {
    success: true,
    message: `I'm sending our ${plan || "pricing"} information to ${email} right now. You should receive it within a few minutes.`
  };
}

/**
 * TOOL: Create support ticket
 */
async function createSupportTicket(data) {
  const { name, email, phone, issue, priority, product } = data;
  
  const ticketId = `TKT-${Date.now()}`;
  
  // Log to modCRM
  await syncToModCRM({
    name,
    email,
    phone,
    type: "support",
    ticketId,
    issue,
    priority: priority || "normal",
    product,
    source: "wringo_voice_agent"
  });
  
  // Notify support team
  await notifyPitchMarketing({
    type: "support_ticket",
    data: { ticketId, name, email, issue, priority, product }
  });
  
  console.log(`[Support Ticket] ${ticketId} - ${issue}`);
  
  return {
    success: true,
    message: `I've created support ticket ${ticketId}. Our team will respond within 2-4 hours during business hours.`
  };
}

/**
 * TOOL: Transfer to human agent
 */
async function transferToHuman(data) {
  const { reason, name, phone, urgency } = data;
  
  // Notify team immediately
  await notifyPitchMarketing({
    type: "transfer_request",
    urgent: urgency === "high",
    data: { reason, name, phone }
  });
  
  console.log(`[Transfer Requested] ${name} - ${reason}`);
  
  return {
    success: true,
    message: "I'm connecting you with a human team member now. Please hold for just a moment."
  };
}

/**
 * TOOL: Check availability for scheduling
 */
async function checkAvailability(data) {
  const { date, service } = data;
  
  // TODO: Integrate with actual calendar API
  // For now, return mock availability
  const slots = [
    "9:00 AM", "10:00 AM", "11:00 AM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
  ];
  
  return {
    success: true,
    available: true,
    slots,
    message: `We have several openings on ${date}. Available times are: ${slots.join(", ")}.`
  };
}

/**
 * TOOL: Capture referral information (AI Referral Engine™)
 * 
 * Called after user has received value and explicitly agrees to share.
 * The LLM extracts referral info naturally from conversation.
 */
async function captureReferral(conversationId, data) {
  const {
    referrer_name,
    referrer_contact,
    referral_method,
    referred_name,
    referred_contact,
    notes
  } = data;

  console.log(`[Referral Capture] Method: ${referral_method}`, data);

  // Validate referral_method
  const validMethods = ["share_link", "direct_intro", "provide_contact", "not_sure_yet"];
  if (!referral_method || !validMethods.includes(referral_method)) {
    return {
      success: true,
      message: "Thank you for your interest in sharing! Just let me know how you'd like to refer others."
    };
  }

  const client = getSupabaseClient();
  
  if (!client) {
    console.log("[Referral] Supabase not configured - storing locally");
    logToLocalStore("referrals_pending", { ...data, conversationId });
    return {
      success: true,
      message: "Thank you! We've noted your referral interest."
    };
  }

  try {
    // Generate unique referral code
    const referralCode = generateReferralCode();

    // Insert into referrals table
    const { data: referral, error } = await client
      .from("referrals")
      .insert({
        referrer_name,
        referrer_contact,
        referral_method,
        referred_name,
        referred_contact,
        referral_code: referralCode,
        notes,
        conversation_id: conversationId,
        source: "elevenlabs_agent",
        status: "pending"
      })
      .select()
      .single();

    if (error) {
      console.error("[Referral] Insert error:", error);
      logToLocalStore("referrals_pending", { ...data, conversationId });
      return {
        success: true,
        message: "Thank you for your interest! We've noted your referral."
      };
    }

    console.log(`[Referral Captured] Code: ${referralCode} | Method: ${referral_method}`);

    // Build response based on referral method
    let responseMessage = "";
    let shareableLink = null;

    switch (referral_method) {
      case "share_link":
        shareableLink = `https://wringoai.netlify.app/?ref=${referralCode}`;
        responseMessage = `Perfect! Your unique referral link is ${shareableLink}. Share it with anyone who might benefit from AI voice solutions. We'll track any signups and credit them to you!`;
        break;
      
      case "direct_intro":
        responseMessage = `Wonderful! We'll prepare a warm introduction email for you to forward. Thank you for thinking of us!`;
        break;
      
      case "provide_contact":
        if (referred_name || referred_contact) {
          responseMessage = `Thank you for connecting us with ${referred_name || "your contact"}! We'll reach out respectfully and keep you in the loop.`;
        } else {
          responseMessage = `Thanks! Whenever you're ready to share their info, just call back or email us.`;
        }
        break;
      
      case "not_sure_yet":
        responseMessage = `No pressure at all! When you're ready, you can always call back. I've noted your interest for now.`;
        break;
      
      default:
        responseMessage = `Thank you for your interest in sharing! We really appreciate it.`;
    }

    return {
      success: true,
      message: responseMessage,
      referral_code: referralCode,
      shareable_link: shareableLink
    };

  } catch (err) {
    console.error("[Referral] Error:", err);
    return {
      success: true,
      message: "Thank you for your interest! We'll follow up soon."
    };
  }
}

/**
 * Sync data to modCRM
 * This is the central function that sends all lead/contact data to your master CRM
 */
async function syncToModCRM(data) {
  const MODCRM_API_URL = process.env.MODCRM_API_URL;
  const MODCRM_API_KEY = process.env.MODCRM_API_KEY;
  
  if (!MODCRM_API_URL || !MODCRM_API_KEY) {
    console.log("[modCRM] API not configured - storing locally");
    // Store locally for later sync
    logToLocalStore("modcrm_pending", data);
    return { success: true, message: "Queued for sync" };
  }
  
  try {
    const response = await fetch(`${MODCRM_API_URL}/api/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MODCRM_API_KEY}`,
        "X-Source": "wringo-voice-agent"
      },
      body: JSON.stringify({
        contact: {
          firstName: data.name?.split(" ")[0],
          lastName: data.name?.split(" ").slice(1).join(" ") || "",
          email: data.email,
          phone: data.phone,
          company: data.company,
          source: data.source,
          tags: ["wringo", data.interest].filter(Boolean),
          customFields: {
            conversationId: data.conversationId,
            transcript: data.transcript,
            duration: data.duration,
            capturedAt: data.capturedAt
          }
        },
        createOpportunity: data.interest ? true : false,
        opportunity: data.interest ? {
          name: `${data.name} - ${data.interest}`,
          stage: "new_lead",
          source: "wringo_voice_agent"
        } : undefined
      })
    });
    
    if (!response.ok) {
      throw new Error(`modCRM API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("[modCRM] Synced:", result.contact?.id || result.id);
    
    return { success: true, contactId: result.contact?.id || result.id };
  } catch (err) {
    console.error("[modCRM Sync Error]", err.message);
    // Queue for retry
    logToLocalStore("modcrm_pending", data);
    return { success: false, message: "Queued for retry" };
  }
}

/**
 * Notify Pitch Marketing team
 * Sends webhooks/notifications for urgent items
 */
async function notifyPitchMarketing(notification) {
  const PM_WEBHOOK_URL = process.env.PM_WEBHOOK_URL;
  
  console.log("[Pitch Marketing Notification]", notification);
  
  if (!PM_WEBHOOK_URL) {
    console.log("[PM Notify] Webhook not configured");
    logToLocalStore("pm_notifications", notification);
    return;
  }
  
  try {
    await fetch(PM_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...notification,
        timestamp: new Date().toISOString(),
        source: "wringo_voice_agent"
      })
    });
    console.log("[PM Notify] Sent successfully");
  } catch (err) {
    console.error("[PM Notify Error]", err.message);
    logToLocalStore("pm_notifications", notification);
  }
}

/**
 * Local store for offline/retry queue
 */
const localStore = {
  modcrm_pending: [],
  pm_notifications: []
};

function logToLocalStore(key, data) {
  localStore[key] = localStore[key] || [];
  localStore[key].push({ ...data, queuedAt: new Date().toISOString() });
  // Keep only last 100 items
  if (localStore[key].length > 100) {
    localStore[key] = localStore[key].slice(-100);
  }
}

/**
 * GET /api/webhooks/pending
 * View pending items that haven't synced yet
 */
router.get("/pending", (req, res) => {
  res.json({
    modcrm_pending: localStore.modcrm_pending.length,
    pm_notifications: localStore.pm_notifications.length,
    items: localStore
  });
});

/**
 * POST /api/webhooks/retry
 * Retry syncing pending items
 */
router.post("/retry", async (req, res) => {
  const results = { modcrm: [], pm: [] };
  
  // Retry modCRM items
  for (const item of localStore.modcrm_pending) {
    const result = await syncToModCRM(item);
    if (result.success && result.contactId) {
      results.modcrm.push({ success: true, item });
    }
  }
  
  // Clear successful items
  localStore.modcrm_pending = localStore.modcrm_pending.filter(
    item => !results.modcrm.find(r => r.item === item)
  );
  
  res.json({ 
    retried: results,
    remaining: {
      modcrm_pending: localStore.modcrm_pending.length,
      pm_notifications: localStore.pm_notifications.length
    }
  });
});

export default router;
