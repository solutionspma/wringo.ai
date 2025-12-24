import { WebSocketServer, WebSocket } from "ws";
import { ulawToPcm16k, pcm16kToUlaw } from "../audio/convert.js";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

// Log env var status at startup
console.log("==========================================");
console.log("🎙️ [v6.0] Telnyx-Media Bridge with Audio Conversion");
console.log("==========================================");
console.log(`🔑 ELEVENLABS_API_KEY: ${ELEVENLABS_API_KEY ? `${ELEVENLABS_API_KEY.substring(0, 8)}...` : '⚠️ NOT SET'}`);
console.log(`🤖 ELEVENLABS_AGENT_ID: ${ELEVENLABS_AGENT_ID || '⚠️ NOT SET'}`);
console.log("==========================================");

/**
 * Bridge Telnyx Media Stream to ElevenLabs Conversational AI (v6.0)
 * 
 * v6.0: PROPER AUDIO CONVERSION
 * - Telnyx sends: μ-law (G.711 PCMU) 8kHz mono
 * - ElevenLabs expects: PCM 16-bit 16kHz mono
 * - We now convert between formats properly!
 * 
 * Flow:
 * 1. Telnyx sends μ-law 8kHz audio via WebSocket
 * 2. We convert μ-law 8kHz → PCM 16kHz
 * 3. Forward PCM to ElevenLabs
 * 4. ElevenLabs responds with PCM 16kHz
 * 5. We convert PCM 16kHz → μ-law 8kHz
 * 6. Send back to Telnyx
 */
export function attachTelnyxMediaWs(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    const { url = "" } = req;
    console.log(`🔌 [v6.0] WebSocket upgrade request for: ${url}`);
    if (url.startsWith("/ws/telnyx-media")) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        console.log(`✅ [v6.0] WebSocket upgrade completed`);
        wss.emit("connection", ws, req);
      });
      return;
    }
    console.log(`❌ WebSocket upgrade rejected - unknown path: ${url}`);
    socket.destroy();
  });

  wss.on("connection", async (telnyxWs, req) => {
    console.log("📡 [v6.0] Telnyx media WS connected");
    console.log(`📡 Request URL: ${req.url}`);
    
    let elevenLabsWs = null;
    let streamId = null;
    let isElevenLabsReady = false;
    let messageCount = 0;
    let audioForwardCount = 0;
    let audioReturnCount = 0;

    // Check env vars before attempting connection
    if (!ELEVENLABS_API_KEY) {
      console.error("❌ ELEVENLABS_API_KEY is not set! Cannot connect to ElevenLabs.");
      return;
    }
    if (!ELEVENLABS_AGENT_ID) {
      console.error("❌ ELEVENLABS_AGENT_ID is not set! Cannot connect to ElevenLabs.");
      return;
    }

    // Connect to ElevenLabs Conversational AI WebSocket
    try {
      console.log("🔗 [v6.0] Getting ElevenLabs signed URL...");
      console.log(`🔗 Using Agent ID: ${ELEVENLABS_AGENT_ID}`);
      
      const signedUrlResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${ELEVENLABS_AGENT_ID}`,
        {
          headers: { "xi-api-key": ELEVENLABS_API_KEY }
        }
      );
      
      console.log(`🔗 ElevenLabs API response status: ${signedUrlResponse.status}`);
      
      if (!signedUrlResponse.ok) {
        const errText = await signedUrlResponse.text();
        console.error("❌ Failed to get ElevenLabs signed URL:", errText);
        return;
      }
      
      const { signed_url } = await signedUrlResponse.json();
      console.log("✅ [v6.0] Got signed URL, connecting to ElevenLabs WebSocket...");
      
      elevenLabsWs = new WebSocket(signed_url);

      elevenLabsWs.on("open", () => {
        console.log("🎙️ [v6.0] Connected to ElevenLabs Conversational AI ✅");
        isElevenLabsReady = true;
        
        // CRITICAL: Tell ElevenLabs we're sending PCM 16kHz
        elevenLabsWs.send(JSON.stringify({
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: "You are Jason, a friendly and efficient voice AI assistant for Wringo.ai. You help with lead capture and referrals for Pitch Marketing Agency. Be conversational but concise."
              },
              first_message: "Hey there! This is Jason from Wringo. How can I help you today?"
            }
          },
          custom_llm_extra_body: {}
        }));
        console.log("🎙️ [v6.0] Sent ElevenLabs config - expecting PCM 16kHz I/O");
      });
      
      elevenLabsWs.on("error", (err) => {
        console.error("❌ ElevenLabs WS error:", err.message);
        isElevenLabsReady = false;
      });
      
      elevenLabsWs.on("close", (code, reason) => {
        console.log(`📴 ElevenLabs WS closed (code: ${code})`);
        isElevenLabsReady = false;
      });

      // Handle messages FROM ElevenLabs (AI voice response)
      elevenLabsWs.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          
          // Handle conversation metadata
          if (msg.type === "conversation_initiation_metadata") {
            console.log("📋 [v6.0] ElevenLabs conversation started:", JSON.stringify(msg.conversation_initiation_metadata_event || msg));
            return;
          }
          
          // Handle audio response from ElevenLabs
          if (msg.type === "audio" && msg.audio_event?.audio_base_64) {
            audioReturnCount++;
            
            // Decode base64 PCM from ElevenLabs
            const pcmBuffer = Buffer.from(msg.audio_event.audio_base_64, "base64");
            
            // Convert PCM 16kHz → μ-law 8kHz for Telnyx
            const ulawBuffer = pcm16kToUlaw(pcmBuffer);
            
            // Send to Telnyx as media event
            if (telnyxWs.readyState === WebSocket.OPEN && streamId) {
              telnyxWs.send(JSON.stringify({
                event: "media",
                stream_id: streamId,
                media: {
                  payload: ulawBuffer.toString("base64")
                }
              }));
              
              if (audioReturnCount <= 5 || audioReturnCount % 50 === 0) {
                console.log(`🔊 [v6.0] Sent audio #${audioReturnCount} to Telnyx (${pcmBuffer.length}→${ulawBuffer.length} bytes)`);
              }
            }
            return;
          }
          
          // Handle agent response text
          if (msg.type === "agent_response") {
            console.log(`🤖 Jason: ${msg.agent_response_event?.agent_response || 'speaking...'}`);
            return;
          }
          
          // Handle user transcript
          if (msg.type === "user_transcript") {
            console.log(`👤 Caller: ${msg.user_transcription_event?.user_transcript || ''}`);
            return;
          }
          
          // Handle ping/pong
          if (msg.type === "ping") {
            elevenLabsWs.send(JSON.stringify({
              type: "pong",
              event_id: msg.ping_event?.event_id
            }));
            return;
          }
          
          // Log other message types
          if (msg.type) {
            console.log(`📨 ElevenLabs event: ${msg.type}`);
          }
          
        } catch (err) {
          console.error("❌ Error processing ElevenLabs message:", err.message);
        }
      });

    } catch (err) {
      console.error("❌ Failed to connect to ElevenLabs:", err.message);
    }

    // Handle messages FROM Telnyx (caller audio)
    telnyxWs.on("message", (data, isBinary) => {
      messageCount++;
      
      try {
        // Parse JSON message from Telnyx
        const msg = JSON.parse(data.toString());
        const eventType = msg.event;
        
        // Log first few messages
        if (messageCount <= 5) {
          console.log(`📨 [v6.0] Telnyx msg #${messageCount}: event="${eventType}", ready=${isElevenLabsReady}`);
        } else if (messageCount % 100 === 0) {
          console.log(`📨 Telnyx msg #${messageCount} (event: ${eventType})`);
        }
        
        // Handle stream start
        if (eventType === "start" || eventType === "connected") {
          streamId = msg.stream_id;
          console.log(`📞 [v6.0] Telnyx stream STARTED - ID: ${streamId}`);
          console.log(`📞 Media format:`, JSON.stringify(msg.start?.media_format || 'not specified'));
          return;
        }
        
        // Handle media (audio) from caller
        if (eventType === "media" && msg.media?.payload) {
          if (!elevenLabsWs || !isElevenLabsReady) {
            if (messageCount <= 5) {
              console.log(`⚠️ ElevenLabs not ready, skipping audio`);
            }
            return;
          }
          
          // Decode base64 μ-law from Telnyx
          const ulawBuffer = Buffer.from(msg.media.payload, "base64");
          
          // 🔥 CONVERT μ-law 8kHz → PCM 16kHz
          const pcmBuffer = ulawToPcm16k(ulawBuffer);
          
          // Encode as base64 for ElevenLabs
          const pcmBase64 = pcmBuffer.toString("base64");
          
          // Send to ElevenLabs
          elevenLabsWs.send(JSON.stringify({
            user_audio_chunk: pcmBase64
          }));
          
          audioForwardCount++;
          if (audioForwardCount <= 5 || audioForwardCount % 100 === 0) {
            console.log(`🎵 [v6.0] Forwarded audio #${audioForwardCount} to ElevenLabs (${ulawBuffer.length}→${pcmBuffer.length} bytes)`);
          }
          return;
        }
        
        // Handle stream stop
        if (eventType === "stop" || eventType === "disconnected") {
          console.log("📴 Telnyx stream stopped");
          if (elevenLabsWs) {
            elevenLabsWs.close();
          }
          return;
        }
        
      } catch (err) {
        // Handle binary data (shouldn't happen with Telnyx streaming, but just in case)
        if (Buffer.isBuffer(data)) {
          console.log(`📨 Binary data received: ${data.length} bytes (unexpected)`);
        } else {
          console.error(`❌ Parse error on msg #${messageCount}:`, err.message);
        }
      }
    });

    telnyxWs.on("close", (code, reason) => {
      console.log(`📴 Telnyx media WS disconnected (code: ${code})`);
      console.log(`📊 Stats: ${messageCount} msgs received, ${audioForwardCount} audio sent to EL, ${audioReturnCount} audio returned`);
      if (elevenLabsWs) {
        elevenLabsWs.close();
      }
    });

    telnyxWs.on("error", (err) => {
      console.error("❌ Telnyx WS error:", err.message);
    });
  });

  console.log("🎧 [v6.0] Telnyx Media WebSocket handler attached with audio conversion");
}
