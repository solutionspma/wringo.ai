import { WebSocketServer, WebSocket } from "ws";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

/**
 * Bridge Telnyx Media Stream to ElevenLabs Conversational AI
 * 
 * Flow:
 * 1. Telnyx sends audio frames via WebSocket (mulaw 8kHz)
 * 2. We forward audio to ElevenLabs WebSocket
 * 3. ElevenLabs responds with AI audio
 * 4. We send AI audio back to Telnyx
 */
export function attachTelnyxMediaWs(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    const { url = "" } = req;
    if (url.startsWith("/ws/telnyx-media")) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
      return;
    }
    socket.destroy();
  });

  wss.on("connection", async (telnyxWs) => {
    console.log("📡 Telnyx media WS connected");
    
    let elevenLabsWs = null;
    let streamSid = null;
    let isElevenLabsReady = false;

    // Connect to ElevenLabs Conversational AI WebSocket
    try {
      console.log("🔗 Getting ElevenLabs signed URL...");
      const signedUrlResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${ELEVENLABS_AGENT_ID}`,
        {
          headers: { "xi-api-key": ELEVENLABS_API_KEY }
        }
      );
      
      if (!signedUrlResponse.ok) {
        const errText = await signedUrlResponse.text();
        console.error("Failed to get ElevenLabs signed URL:", errText);
        return;
      }
      
      const { signed_url } = await signedUrlResponse.json();
      console.log("🔗 Got signed URL, connecting to ElevenLabs...");
      
      elevenLabsWs = new WebSocket(signed_url);

      elevenLabsWs.on("open", () => {
        console.log("🎙️ Connected to ElevenLabs Conversational AI");
        isElevenLabsReady = true;
      });

      elevenLabsWs.on("message", (data) => {
        try {
          // ElevenLabs can send binary audio directly
          if (Buffer.isBuffer(data)) {
            // Binary audio from ElevenLabs - send back to Telnyx
            if (telnyxWs.readyState === WebSocket.OPEN && streamSid) {
              const base64Audio = data.toString('base64');
              telnyxWs.send(JSON.stringify({
                event: "media",
                streamSid: streamSid,
                media: {
                  payload: base64Audio
                }
              }));
            }
            return;
          }

          const msg = JSON.parse(data.toString());
          
          // Handle different ElevenLabs message types
          if (msg.type === "audio" && msg.audio_event?.audio_base_64) {
            // Audio chunk from ElevenLabs
            if (telnyxWs.readyState === WebSocket.OPEN && streamSid) {
              telnyxWs.send(JSON.stringify({
                event: "media",
                streamSid: streamSid,
                media: {
                  payload: msg.audio_event.audio_base_64
                }
              }));
            }
          } else if (msg.type === "agent_response") {
            console.log(`🤖 Jason: ${msg.agent_response_event?.agent_response?.substring(0, 100) || 'speaking...'}`);
          } else if (msg.type === "user_transcript") {
            console.log(`👤 Caller: ${msg.user_transcription_event?.user_transcript || msg.user_transcript || ''}`);
          } else if (msg.type === "conversation_initiation_metadata") {
            console.log("🎙️ ElevenLabs conversation initialized");
          } else if (msg.type === "ping") {
            // Respond to ping
            elevenLabsWs.send(JSON.stringify({ type: "pong" }));
          } else {
            console.log(`[ElevenLabs] ${msg.type}:`, JSON.stringify(msg).substring(0, 200));
          }
        } catch (err) {
          console.error("[ElevenLabs] Parse error:", err.message);
        }
      });

      elevenLabsWs.on("close", (code, reason) => {
        console.log(`🔇 ElevenLabs connection closed: ${code} ${reason}`);
        isElevenLabsReady = false;
      });

      elevenLabsWs.on("error", (err) => {
        console.error("ElevenLabs WS error:", err.message);
        isElevenLabsReady = false;
      });

    } catch (err) {
      console.error("Failed to connect to ElevenLabs:", err.message);
    }

    // Handle Telnyx media stream messages
    telnyxWs.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString("utf8"));

        if (msg.event === "start" || msg.event === "connected") {
          // Telnyx stream started
          streamSid = msg.streamSid || msg.start?.streamSid || msg.stream_id;
          console.log(`📞 Telnyx stream started - SID: ${streamSid}`);
          console.log(`📞 Stream details:`, JSON.stringify(msg).substring(0, 300));
        }
        
        if (msg.event === "media" && msg.media?.payload) {
          // Forward caller audio to ElevenLabs
          if (elevenLabsWs && isElevenLabsReady) {
            // Send raw audio to ElevenLabs
            // ElevenLabs expects base64 encoded audio
            elevenLabsWs.send(JSON.stringify({
              user_audio_chunk: msg.media.payload
            }));
          }
        }

        if (msg.event === "stop" || msg.event === "disconnected") {
          console.log("📴 Telnyx stream stopped");
          if (elevenLabsWs) {
            elevenLabsWs.close();
          }
        }
      } catch (err) {
        console.error("[Telnyx] Parse error:", err.message);
      }
    });

    telnyxWs.on("close", () => {
      console.log("📴 Telnyx media WS disconnected");
      if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
        elevenLabsWs.close();
      }
    });

    telnyxWs.on("error", (err) => {
      console.error("Telnyx WS error:", err.message);
    });
  });

  return wss;
}
