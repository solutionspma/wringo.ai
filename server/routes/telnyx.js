import express from "express";

const router = express.Router();

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

  if (!eventType) {
    return res.sendStatus(200);
  }

  // Answer incoming calls
  if (eventType === "call.initiated" && callControlId) {
    console.log(`[Telnyx] Answering call from ${payload?.from}`);
    return res.json({
      data: {
        commands: [{ command: "answer", call_control_id: callControlId }],
      },
    });
  }

  // Start media streaming after call is answered
  if (eventType === "call.answered" && callControlId) {
    // Use Render's WebSocket URL or construct from environment
    const renderUrl = process.env.RENDER_EXTERNAL_URL || process.env.TELNYX_MEDIA_WS_URL;
    
    let wsUrl;
    if (renderUrl) {
      // Convert https:// to wss:// 
      wsUrl = renderUrl.replace('https://', 'wss://').replace('http://', 'ws://');
      if (!wsUrl.includes('/ws/telnyx-media')) {
        wsUrl = `${wsUrl}/ws/telnyx-media`;
      }
    } else {
      // Fallback - this won't work but at least shows in logs
      wsUrl = 'wss://wringo-backend.onrender.com/ws/telnyx-media';
    }

    console.log(`[Telnyx] Starting media stream to ${wsUrl}`);
    
    return res.json({
      data: {
        commands: [
          {
            command: "start_stream",
            call_control_id: callControlId,
            stream_url: wsUrl,
            stream_track: "both_tracks", // Send both inbound and outbound audio
            enable_dialogflow: false
          },
        ],
      },
    });
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

  return res.sendStatus(200);
});

/**
 * GET /api/telnyx/status
 * Check Telnyx configuration status
 */
router.get("/status", (req, res) => {
  const renderUrl = process.env.RENDER_EXTERNAL_URL;
  const wsUrl = process.env.TELNYX_MEDIA_WS_URL;
  
  res.json({
    configured: Boolean(process.env.TELNYX_API_KEY),
    webhookUrl: `${renderUrl || 'https://wringo-backend.onrender.com'}/api/telnyx/inbound`,
    mediaWsUrl: wsUrl || `${renderUrl?.replace('https://', 'wss://') || 'wss://wringo-backend.onrender.com'}/ws/telnyx-media`,
    hasApiKey: Boolean(process.env.TELNYX_API_KEY)
  });
});

export default router;
