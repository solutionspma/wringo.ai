import { WebSocketServer, WebSocket } from "ws";
import { ulawToPcm16k, pcm16kToUlaw } from "../audio/convert.js";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

// ElevenLabs recommended chunk size: 4000 samples @ 16kHz = 250ms = 8000 bytes (16-bit)
// Telnyx sends 160 bytes μ-law (20ms) → converts to 640 bytes PCM
// We need to buffer ~12-13 Telnyx chunks to hit 8000 bytes
const ELEVENLABS_CHUNK_SIZE = 8000; // bytes (4000 samples * 2 bytes per sample)

// Log env var status at startup
console.log("==========================================");
console.log("🎙️ [v6.5] Telnyx-Media Bridge - Explicit Little Endian");
console.log("==========================================");
console.log(`🔑 ELEVENLABS_API_KEY: ${ELEVENLABS_API_KEY ? `${ELEVENLABS_API_KEY.substring(0, 8)}...` : '⚠️ NOT SET'}`);
console.log(`🤖 ELEVENLABS_AGENT_ID: ${ELEVENLABS_AGENT_ID || '⚠️ NOT SET'}`);
console.log(`📦 Audio chunk size: ${ELEVENLABS_CHUNK_SIZE} bytes (250ms)`);
console.log("==========================================");

/**
 * Bridge Telnyx Media Stream to ElevenLabs Conversational AI (v6.5)
 * 
 * v6.5: BUFFERED AUDIO CHUNKS
 * - ElevenLabs recommends 4000 samples (250ms) per chunk
 * - Telnyx sends 160 bytes (20ms) per chunk
 * - We buffer PCM until we have 8000 bytes, then send
 * 
 * Flow:
 * 1. Telnyx sends μ-law 8kHz audio via WebSocket
 * 2. We convert μ-law 8kHz → PCM 16kHz
 * 3. Buffer PCM until we have 8000 bytes (250ms)
 * 4. Forward buffered PCM to ElevenLabs
 * 5. ElevenLabs responds with PCM 16kHz
 * 6. We convert PCM 16kHz → μ-law 8kHz
 * 7. Send back to Telnyx
 */
export function attachTelnyxMediaWs(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    const { url = "" } = req;
    console.log(`🔌 [v6.5] WebSocket upgrade request for: ${url}`);
    if (url.startsWith("/ws/telnyx-media")) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        console.log(`✅ [v6.5] WebSocket upgrade completed`);
        wss.emit("connection", ws, req);
      });
      return;
    }
    console.log(`❌ WebSocket upgrade rejected - unknown path: ${url}`);
    socket.destroy();
  });

  wss.on("connection", async (telnyxWs, req) => {
    console.log("📡 [v6.5] Telnyx media WS connected");
    console.log(`📡 Request URL: ${req.url}`);
    
    let elevenLabsWs = null;
    let streamId = null;
    let isElevenLabsReady = false;
    let messageCount = 0;
    let audioForwardCount = 0;
    let audioReturnCount = 0;
    let pcmBuffer = Buffer.alloc(0); // Buffer for accumulating PCM audio
    let pendingAudioChunks = []; // Buffer audio chunks until ElevenLabs is ready

    // Check env vars before attempting connection
    if (!ELEVENLABS_API_KEY) {
      console.error("❌ ELEVENLABS_API_KEY is not set! Cannot connect to ElevenLabs.");
      return;
    }
    if (!ELEVENLABS_AGENT_ID) {
      console.error("❌ ELEVENLABS_AGENT_ID is not set! Cannot connect to ElevenLabs.");
      return;
    }

    // Helper function to send buffered PCM to ElevenLabs
    function sendPcmToElevenLabs(pcmChunk) {
      if (!elevenLabsWs || elevenLabsWs.readyState !== WebSocket.OPEN) return;
      
      const pcmBase64 = pcmChunk.toString("base64");
      elevenLabsWs.send(JSON.stringify({
        user_audio_chunk: pcmBase64
      }));
      audioForwardCount++;
      
      if (audioForwardCount <= 5 || audioForwardCount % 20 === 0) {
        console.log(`🎵 [v6.5] Sent audio chunk #${audioForwardCount} to ElevenLabs (${pcmChunk.length} bytes = ${pcmChunk.length / 32}ms)`);
      }
    }

    // Helper to process PCM buffer and send when we have enough
    function processPcmBuffer() {
      while (pcmBuffer.length >= ELEVENLABS_CHUNK_SIZE) {
        const chunk = pcmBuffer.subarray(0, ELEVENLABS_CHUNK_SIZE);
        pcmBuffer = pcmBuffer.subarray(ELEVENLABS_CHUNK_SIZE);
        sendPcmToElevenLabs(chunk);
      }
    }

    // Connect to ElevenLabs Conversational AI WebSocket
    try {
      console.log("🔗 [v6.5] Getting ElevenLabs signed URL...");
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
      console.log("✅ [v6.5] Got signed URL, connecting to ElevenLabs WebSocket...");
      
      elevenLabsWs = new WebSocket(signed_url);

      elevenLabsWs.on("open", () => {
        console.log("🎙️ [v6.5] Connected to ElevenLabs Conversational AI ✅");
        // DON'T set isElevenLabsReady yet - wait for metadata response!
        
        // Send conversation initiation - only override TTS output format
        // Don't override agent settings like first_message (not allowed by agent config)
        elevenLabsWs.send(JSON.stringify({
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            tts: {
              output_format: "pcm_16000"
            }
          }
        }));
        console.log("🎙️ [v6.5] Sent ElevenLabs config (TTS pcm_16000) - waiting for metadata...");
      });
      
      elevenLabsWs.on("error", (err) => {
        console.error("❌ ElevenLabs WS error:", err.message);
        isElevenLabsReady = false;
      });
      
      elevenLabsWs.on("close", (code, reason) => {
        const reasonStr = reason ? reason.toString() : 'no reason';
        console.log(`📴 ElevenLabs WS closed (code: ${code}, reason: ${reasonStr})`);
        isElevenLabsReady = false;
      });

      // Handle messages FROM ElevenLabs (AI voice response)
      elevenLabsWs.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          
          // Handle conversation metadata - NOW we're ready to send audio!
          if (msg.type === "conversation_initiation_metadata") {
            console.log("📋 [v6.5] ElevenLabs conversation confirmed:", JSON.stringify(msg.conversation_initiation_metadata_event || msg));
            
            // NOW we're ready to receive/send audio
            isElevenLabsReady = true;
            console.log("✅ [v6.5] ElevenLabs ready - now accepting audio");
            
            // Flush any pending audio chunks (already converted to PCM)
            if (pendingAudioChunks.length > 0) {
              console.log(`🎵 [v6.5] Flushing ${pendingAudioChunks.length} pending audio chunks`);
              for (const chunk of pendingAudioChunks) {
                pcmBuffer = Buffer.concat([pcmBuffer, chunk]);
              }
              pendingAudioChunks = [];
              processPcmBuffer();
            }
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
                console.log(`🔊 [v6.5] Sent audio #${audioReturnCount} to Telnyx (${pcmBuffer.length}→${ulawBuffer.length} bytes)`);
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
          console.log(`📨 [v6.5] Telnyx msg #${messageCount}: event="${eventType}", ready=${isElevenLabsReady}`);
        } else if (messageCount % 100 === 0) {
          console.log(`📨 Telnyx msg #${messageCount} (event: ${eventType})`);
        }
        
        // Handle stream start
        if (eventType === "start" || eventType === "connected") {
          streamId = msg.stream_id;
          console.log(`📞 [v6.5] Telnyx stream STARTED - ID: ${streamId}`);
          console.log(`📞 Media format:`, JSON.stringify(msg.start?.media_format || 'not specified'));
          return;
        }
        
        // Capture stream_id from any message if we don't have it
        if (!streamId && msg.stream_id) {
          streamId = msg.stream_id;
          console.log(`📞 [v6.5] Captured stream_id: ${streamId}`);
        }
        
        // Handle media (audio) from caller
        if (eventType === "media" && msg.media?.payload) {
          // Decode base64 μ-law from Telnyx
          const ulawBuffer = Buffer.from(msg.media.payload, "base64");
          
          // 🔥 CONVERT μ-law 8kHz → PCM 16kHz
          const pcmChunk = ulawToPcm16k(ulawBuffer);
          
          if (!isElevenLabsReady) {
            // Buffer converted PCM until ElevenLabs is ready (max ~2 seconds)
            if (pendingAudioChunks.length < 100) {
              pendingAudioChunks.push(pcmChunk);
              if (messageCount <= 10) {
                console.log(`📦 Buffering audio (ElevenLabs not ready) - ${pendingAudioChunks.length} chunks`);
              }
            }
            return;
          }
          
          // Add to PCM buffer and send when we have enough
          pcmBuffer = Buffer.concat([pcmBuffer, pcmChunk]);
          processPcmBuffer();
          return;
        }
        
        // Handle stream stop
        if (eventType === "stop" || eventType === "disconnected") {
          console.log("📴 Telnyx stream stopped");
          
          // Flush any remaining buffered audio
          if (pcmBuffer.length > 0 && elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
            console.log(`🎵 [v6.5] Flushing final ${pcmBuffer.length} bytes of audio`);
            sendPcmToElevenLabs(pcmBuffer);
            pcmBuffer = Buffer.alloc(0);
          }
          
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
      console.log(`📊 Stats: ${messageCount} msgs received, ${audioForwardCount} audio chunks sent to EL, ${audioReturnCount} audio returned`);
      if (elevenLabsWs) {
        elevenLabsWs.close();
      }
    });

    telnyxWs.on("error", (err) => {
      console.error("❌ Telnyx WS error:", err.message);
    });
  });

  console.log("🎧 [v6.5] Telnyx Media WebSocket handler attached with buffered audio");
}
