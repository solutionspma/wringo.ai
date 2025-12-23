import express from "express";

const router = express.Router();

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

/**
 * Make a Telnyx Call Control API request
 */
async function telnyxCommand(callControlId, command, params = {}) {
  const url = `https://api.telnyx.com/v2/calls/${callControlId}/actions/${command}`;
  
  console.log(`[Telnyx API] ${command} -> ${callControlId}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TELNYX_API_KEY}`
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`[Telnyx API] Error: ${response.status} - ${error}`);
      return { success: false, error };
    }
    
    const data = await response.json();
    console.log(`[Telnyx API] ${command} success`);
    return { success: true, data };
  } catch (err) {
    console.error(`[Telnyx API] ${command} failed:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Telnyx Inbound Call Webhook
 * 
 * Handles call events and bridges to ElevenLabs via WebSocket
 */
router.post("/inbound", async (req, res) => {
  const body = req.body;
  const eventType = body?.data?.event_type;
  const payload = body?.data?.payload;
  const callControlId = payload?.call_control_id;

  console.log(`[Telnyx] Event: ${eventType}`, payload?.from ? `From: ${payload.from}` : '');

  // Always respond 200 quickly to acknowledge webhook
  res.sendStatus(200);

  if (!eventType || !callControlId) {
    return;
  }

  // Answer incoming calls
  if (eventType === "call.initiated" && payload?.direction === "incoming") {
    console.log(`[Telnyx] Answering call from ${payload?.from}`);
    await telnyxCommand(callControlId, 'answer');
    return;
  }

  // Start media streaming after call is answered
  if (eventType === "call.answered") {
    const renderUrl = process.env.RENDER_EXTERNAL_URL || 'https://wringo-backend.onrender.com';
    const wsUrl = renderUrl.replace('https://', 'wss://') + '/ws/telnyx-media';

    console.log(`[Telnyx] Starting media stream to ${wsUrl}`);
    
    await telnyxCommand(callControlId, 'streaming_start', {
      stream_url: wsUrl,
      stream_track: 'both_tracks'
    });
    return;
  }

  // Handle call hangup
  if (eventType === "call.hangup") {
    console.log(`[Telnyx] Call ended - Duration: ${payload?.duration_secs}s`);
  }

  // Handle streaming started
  if (eventType === "streaming.started") {
    console.log(`[Telnyx] Media streaming started`);
  }

  // Handle streaming stopped  
  if (eventType === "streaming.stopped") {
    console.log(`[Telnyx] Media streaming stopped`);
  }
});

/**
 * GET /api/telnyx/status
 * Check Telnyx configuration status
 */
router.get("/status", (req, res) => {
  const renderUrl = process.env.RENDER_EXTERNAL_URL || 'https://wringo-backend.onrender.com';
  
  res.json({
    configured: Boolean(TELNYX_API_KEY),
    webhookUrl: `${renderUrl}/api/telnyx/inbound`,
    mediaWsUrl: `${renderUrl.replace('https://', 'wss://')}/ws/telnyx-media`,
    hasApiKey: Boolean(TELNYX_API_KEY)
  });
});

export default router;
