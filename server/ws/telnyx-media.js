import { WebSocketServer, WebSocket } from "ws";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

/**
 * Bridge Telnyx Media Stream to ElevenLabs Conversational AI
 * 
 * Telnyx Call Control Streaming format:
 * - Messages are JSON with "event" field
 * - Audio is base64 encoded mulaw 8kHz
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
    console.log(`🔌 WebSocket upgrade request for: ${url}`);
    if (url.startsWith("/ws/telnyx-media")) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        console.log(`✅ WebSocket upgrade completed`);
        wss.emit("connection", ws, req);
      });
      return;
    }
    console.log(`❌ WebSocket upgrade rejected - unknown path: ${url}`);
    socket.destroy();
  });

  wss.on("connection", async (telnyxWs, req) => {
    console.log("📡 Telnyx media WS connected");
    console.log(`📡 Request URL: ${req.url}`);
    console.log(`📡 Request headers:`, JSON.stringify(req.headers, null, 2));
    console.log("📡 Waiting for Telnyx stream messages...");
    
    let elevenLabsWs = null;
    let streamId = null;
    let callControlId = null;
    let isElevenLabsReady = false;
    let messageCount = 0;

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
        
        // Send initial configuration to ElevenLabs
        elevenLabsWs.send(JSON.stringify({
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: "You are Jason, a friendly and efficient voice AI assistant for Wringo.ai. You help with lead capture and referrals for Pitch Marketing Agency. Be conversational but concise."
              },
              first_message: "Hey there! This is Jason from Wringo. How can I help you today?"
            },
            tts: {
              voice_id: "pNInz6obpgDQGcFmaJgB" // Adam voice
            }
          }
        }));
      });

      elevenLabsWs.on("message", (data) => {
        try {
          // ElevenLabs can send binary audio directly
          if (Buffer.isBuffer(data)) {
            // Binary audio from ElevenLabs - send back to Telnyx
            if (telnyxWs.readyState === WebSocket.OPEN && streamId) {
              const base64Audio = data.toString('base64');
              // Telnyx expects this format for streaming audio
              telnyxWs.send(JSON.stringify({
                event: "media",
                stream_id: streamId,
                media: {
                  track: "outbound",
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
            if (telnyxWs.readyState === WebSocket.OPEN && streamId) {
              telnyxWs.send(JSON.stringify({
                event: "media",
                stream_id: streamId,
                media: {
                  track: "outbound",
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
            console.log(`[ElevenLabs] ${msg.type || 'unknown'}:`, JSON.stringify(msg).substring(0, 200));
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
    telnyxWs.on("message", (data, isBinary) => {
      messageCount++;
      
      console.log(`📨 Telnyx msg #${messageCount} - isBinary: ${isBinary}, type: ${typeof data}, length: ${data?.length || 0}`);
      
      try {
        // Handle binary data
        if (isBinary || Buffer.isBuffer(data)) {
          console.log(`📨 Binary message #${messageCount}: ${data.length} bytes`);
          // Binary audio data - forward to ElevenLabs
          if (elevenLabsWs && isElevenLabsReady) {
            elevenLabsWs.send(JSON.stringify({
              user_audio_chunk: data.toString('base64')
            }));
          }
          return;
        }
        
        // Log EVERY message for debugging
        const rawStr = data.toString("utf8");
        
        // Log first 10 messages in detail
        if (messageCount <= 10) {
          console.log(`📨 Telnyx msg #${messageCount}:`, rawStr.substring(0, 500));
        } else if (messageCount % 100 === 0) {
          console.log(`📨 Telnyx msg #${messageCount} (periodic log)`);
        }

        const msg = JSON.parse(rawStr);

        // Telnyx Call Control streaming message types
        const eventType = msg.event || msg.type || msg.event_type;
        
        // Handle stream start/connected
        if (eventType === "start" || eventType === "connected" || eventType === "stream.started") {
          streamId = msg.stream_id || msg.streamSid || msg.start?.streamSid || msg.start?.stream_id;
          callControlId = msg.call_control_id || msg.start?.call_control_id;
          console.log(`📞 Telnyx stream STARTED - ID: ${streamId}, CallControl: ${callControlId}`);
          console.log(`📞 Full start message:`, JSON.stringify(msg));
        }
        
        // Handle audio media
        if (eventType === "media") {
          const audioPayload = msg.media?.payload || msg.payload;
          
          if (audioPayload && elevenLabsWs && isElevenLabsReady) {
            // Forward caller audio to ElevenLabs
            elevenLabsWs.send(JSON.stringify({
              user_audio_chunk: audioPayload
            }));
            
            // Log occasionally
            if (messageCount <= 10 || messageCount % 500 === 0) {
              console.log(`🔊 Forwarded audio chunk #${messageCount} to ElevenLabs`);
            }
          }
        }

        // Handle stream stop
        if (eventType === "stop" || eventType === "disconnected" || eventType === "stream.stopped") {
          console.log("📴 Telnyx stream stopped");
          if (elevenLabsWs) {
            elevenLabsWs.close();
          }
        }
      } catch (err) {
        // Might be binary data
        if (Buffer.isBuffer(data)) {
          console.log(`📨 Telnyx binary msg #${messageCount}: ${data.length} bytes`);
          // Could be raw audio - try forwarding to ElevenLabs
          if (elevenLabsWs && isElevenLabsReady) {
            elevenLabsWs.send(JSON.stringify({
              user_audio_chunk: data.toString('base64')
            }));
          }
        } else {
          console.error(`[Telnyx] Parse error on msg #${messageCount}:`, err.message);
          console.error(`[Telnyx] Raw data:`, data.toString("utf8").substring(0, 200));
        }
      }
    });

    telnyxWs.on("close", (code, reason) => {
      console.log(`📴 Telnyx media WS disconnected (code: ${code}, reason: ${reason?.toString() || 'none'})`);
      console.log(`📊 Total messages received from Telnyx: ${messageCount}`);
      if (messageCount === 0) {
        console.log(`⚠️  WARNING: No messages received from Telnyx! This suggests:`);
        console.log(`   1. WebSocket upgrade succeeded but Telnyx never sent data`);
        console.log(`   2. Possibly a Render proxy issue or Telnyx config issue`);
      }
      if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
        elevenLabsWs.close();
      }
    });

    telnyxWs.on("error", (err) => {
      console.error("Telnyx WS error:", err.message);
    });
    
    // Handle ping/pong for keep-alive
    telnyxWs.on("ping", (data) => {
      console.log("📡 Received ping from Telnyx");
      telnyxWs.pong(data);
    });
    
    telnyxWs.on("pong", () => {
      console.log("📡 Received pong from Telnyx");
    });
  });

  return wss;
}
