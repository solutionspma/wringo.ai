import { WebSocketServer, WebSocket } from "ws";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

/**
 * Bridge Telnyx Media Stream to ElevenLabs Conversational AI
 * 
 * Flow:
 * 1. Telnyx sends audio frames via WebSocket
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
    let callControlId = null;

    // Connect to ElevenLabs Conversational AI WebSocket
    try {
      const signedUrlResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${ELEVENLABS_AGENT_ID}`,
        {
          headers: { "xi-api-key": ELEVENLABS_API_KEY }
        }
      );
      
      if (!signedUrlResponse.ok) {
        console.error("Failed to get ElevenLabs signed URL");
        return;
      }
      
      const { signed_url } = await signedUrlResponse.json();
      elevenLabsWs = new WebSocket(signed_url);

      elevenLabsWs.on("open", () => {
        console.log("🎙️ Connected to ElevenLabs Conversational AI");
        
        // Configure the conversation for phone audio format
        elevenLabsWs.send(JSON.stringify({
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: "You are Jason, a friendly AI assistant for Wringo.ai helping callers learn about voice AI solutions."
              }
            },
            tts: {
              voice_id: "JBFqnCBsd6RMkjVDRZzb" // George voice - good for phone
            }
          },
          custom_llm_extra_body: {
            caller_phone: callControlId
          }
        }));
      });

      elevenLabsWs.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          
          if (msg.type === "audio" && msg.audio?.chunk) {
            // ElevenLabs sends base64 audio - forward to Telnyx
            if (telnyxWs.readyState === WebSocket.OPEN && streamSid) {
              telnyxWs.send(JSON.stringify({
                event: "media",
                streamSid: streamSid,
                media: {
                  payload: msg.audio.chunk // base64 audio
                }
              }));
            }
          } else if (msg.type === "agent_response") {
            console.log(`🤖 Jason: ${msg.agent_response?.substring(0, 100)}...`);
          } else if (msg.type === "user_transcript") {
            console.log(`👤 Caller: ${msg.user_transcript}`);
          }
        } catch (err) {
          // Ignore parse errors
        }
      });

      elevenLabsWs.on("close", () => {
        console.log("🔇 ElevenLabs connection closed");
      });

      elevenLabsWs.on("error", (err) => {
        console.error("ElevenLabs WS error:", err.message);
      });

    } catch (err) {
      console.error("Failed to connect to ElevenLabs:", err.message);
    }

    // Handle Telnyx media stream messages
    telnyxWs.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString("utf8"));

        if (msg.event === "start") {
          // Telnyx stream started
          streamSid = msg.streamSid || msg.start?.streamSid;
          callControlId = msg.start?.callSid || msg.callControlId;
          console.log(`📞 Call started - Stream: ${streamSid}`);
        }
        
        if (msg.event === "media" && msg.media?.payload) {
          // Forward caller audio to ElevenLabs
          if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
            elevenLabsWs.send(JSON.stringify({
              type: "audio",
              audio: {
                chunk: msg.media.payload // base64 mulaw/pcm audio
              }
            }));
          }
        }

        if (msg.event === "stop") {
          console.log("📴 Telnyx stream stopped");
          if (elevenLabsWs) {
            elevenLabsWs.close();
          }
        }
      } catch {
        // ignore non-JSON
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
