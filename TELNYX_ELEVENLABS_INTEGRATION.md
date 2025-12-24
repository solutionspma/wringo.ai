# Telnyx + ElevenLabs Voice AI Integration Guide

## Overview

This document details the complete integration of Telnyx telephony with ElevenLabs Conversational AI for voice agent functionality. This took ~30 hours to debug and get working correctly.

**Working Version:** v6.6 (December 24, 2025)

---

## Architecture

```
Phone Call → Telnyx → WebSocket → Node.js Server → WebSocket → ElevenLabs AI
                ↑                      ↓
                └──────────────────────┘
                   (Bidirectional Audio)
```

### Audio Format Bridge

| Direction | Telnyx Format | ElevenLabs Format | Conversion |
|-----------|---------------|-------------------|------------|
| Caller → AI | μ-law (G.711 PCMU) 8kHz mono | PCM 16-bit 16kHz mono | Decode μ-law → Upsample 2x |
| AI → Caller | PCM 16-bit 16kHz mono | μ-law (G.711 PCMU) 8kHz mono | Downsample 2x → Encode μ-law |

---

## Critical Configuration Points

### 1. Telnyx Streaming Setup

**CRITICAL:** Must enable bidirectional RTP mode to send audio back to the call!

```javascript
await telnyxCommand(callControlId, 'streaming_start', {
  stream_url: 'wss://your-server.com/ws/telnyx-media',
  stream_track: 'inbound_track',
  stream_bidirectional_mode: 'rtp',      // ← REQUIRED for sending audio back
  stream_bidirectional_codec: 'PCMU'     // ← Match μ-law format
});
```

**Without `stream_bidirectional_mode: 'rtp'`:**
- Telnyx only accepts MP3 files for playback (1 per second max)
- Raw audio chunks will be silently ignored

### 2. Two-Step Call Answering

Telnyx requires answering the call BEFORE starting media streaming:

```javascript
// Step 1: Answer the call (webhook for call.initiated)
await telnyxCommand(callControlId, 'answer', {});

// Step 2: Start streaming (webhook for call.answered)  
await telnyxCommand(callControlId, 'streaming_start', { ... });
```

**Why:** The streaming_start command fails if called before the call is answered.

### 3. ElevenLabs Configuration

**DO NOT override agent settings that aren't allowed:**

```javascript
// ❌ WRONG - Will cause 1008 Policy Violation error
elevenLabsWs.send(JSON.stringify({
  type: "conversation_initiation_client_data",
  conversation_config_override: {
    agent: {
      first_message: "Hello!",  // ← NOT ALLOWED unless enabled in agent config
      prompt: { prompt: "..." } // ← NOT ALLOWED unless enabled in agent config
    },
    tts: { output_format: "pcm_16000" }
  }
}));

// ✅ CORRECT - Only override TTS output format
elevenLabsWs.send(JSON.stringify({
  type: "conversation_initiation_client_data",
  conversation_config_override: {
    tts: {
      output_format: "pcm_16000"  // ← Get raw PCM instead of MP3
    }
  }
}));
```

### 4. Audio Conversion Requirements

ElevenLabs expects **PCM 16-bit signed Little Endian at 16kHz mono**.

**Use explicit Little Endian encoding:**

```javascript
// ❌ WRONG - Native endianness may vary
const pcm16k = new Int16Array(samples);
return Buffer.from(pcm16k.buffer);

// ✅ CORRECT - Explicit Little Endian
const outputBuffer = Buffer.alloc(numSamples * 2);
const view = new DataView(outputBuffer.buffer);
for (let i = 0; i < numSamples; i++) {
  view.setInt16(i * 2, samples[i], true); // true = Little Endian
}
return outputBuffer;
```

### 5. Audio Chunk Buffering

ElevenLabs recommends **4000 samples (250ms) per chunk**.

Telnyx sends 160 bytes (20ms) per chunk, so buffer until you have 8000 bytes:

```javascript
const ELEVENLABS_CHUNK_SIZE = 8000; // bytes (4000 samples * 2 bytes)
let pcmBuffer = Buffer.alloc(0);

// Accumulate chunks
pcmBuffer = Buffer.concat([pcmBuffer, newChunk]);

// Send when we have enough
while (pcmBuffer.length >= ELEVENLABS_CHUNK_SIZE) {
  const chunk = pcmBuffer.subarray(0, ELEVENLABS_CHUNK_SIZE);
  pcmBuffer = pcmBuffer.subarray(ELEVENLABS_CHUNK_SIZE);
  sendToElevenLabs(chunk);
}
```

---

## Common Errors and Solutions

### Error: ElevenLabs WebSocket closes with code 1008

**Cause:** Policy violation - trying to override agent config fields that aren't allowed.

**Solution:** Only override `tts.output_format`, don't override `agent.first_message` or `agent.prompt`.

### Error: No audio heard by caller (silence)

**Cause:** Missing `stream_bidirectional_mode: 'rtp'` in streaming_start.

**Solution:** Add bidirectional RTP mode and codec to streaming_start command.

### Error: ElevenLabs receives 0 messages

**Cause:** Using `streaming_start` in the `answer` command (Telnyx Call Control v1 style).

**Solution:** Use two-step process - answer first, then streaming_start as separate command.

### Error: Audio sounds garbled or wrong pitch

**Cause:** Byte order (endianness) mismatch or wrong sample rate conversion.

**Solution:** 
- Use explicit Little Endian with DataView
- Properly upsample 8kHz → 16kHz (interpolate, don't just duplicate)
- Properly downsample 16kHz → 8kHz (average adjacent samples)

### Error: Telnyx WebSocket never receives messages

**Cause:** WebSocket path mismatch or server not handling upgrade.

**Solution:** Ensure WebSocket server handles `/ws/telnyx-media` path and completes upgrade.

---

## Environment Variables Required

```env
# Telnyx
TELNYX_API_KEY=KEY_xxx           # v2 API key

# ElevenLabs
ELEVENLABS_API_KEY=sk_xxx        # API key from ElevenLabs dashboard
ELEVENLABS_AGENT_ID=agent_xxx    # Conversational AI agent ID

# Server
PORT=10000
RENDER_EXTERNAL_URL=https://your-backend.onrender.com
```

---

## File Structure

```
server/
├── index.js                 # Express server setup
├── routes/
│   └── telnyx.js           # Webhook handlers (answer, streaming_start)
├── ws/
│   └── telnyx-media.js     # WebSocket bridge (Telnyx ↔ ElevenLabs)
└── audio/
    └── convert.js          # μ-law ↔ PCM conversion utilities
```

---

## Audio Conversion Code (convert.js)

### μ-law to PCM (Telnyx → ElevenLabs)

```javascript
export function ulawToPcm16k(ulawBuffer) {
  // Step 1: Decode μ-law to PCM 16-bit (8kHz) using lookup table
  const pcm8k = new Int16Array(ulawBuffer.length);
  for (let i = 0; i < ulawBuffer.length; i++) {
    pcm8k[i] = MULAW_DECODE_TABLE[ulawBuffer[i]];
  }
  
  // Step 2: Upsample 8kHz → 16kHz with linear interpolation
  const outputBuffer = Buffer.alloc(pcm8k.length * 4);
  const view = new DataView(outputBuffer.buffer, outputBuffer.byteOffset, outputBuffer.byteLength);
  
  for (let i = 0; i < pcm8k.length; i++) {
    const sample = pcm8k[i];
    view.setInt16(i * 4, sample, true); // Original sample (LE)
    
    // Interpolated sample
    if (i < pcm8k.length - 1) {
      const interpolated = Math.round((pcm8k[i] + pcm8k[i + 1]) / 2);
      view.setInt16(i * 4 + 2, interpolated, true);
    } else {
      view.setInt16(i * 4 + 2, sample, true);
    }
  }
  
  return outputBuffer;
}
```

### PCM to μ-law (ElevenLabs → Telnyx)

```javascript
export function pcm16kToUlaw(pcmBuffer) {
  const view = new DataView(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.byteLength);
  const numSamples = pcmBuffer.length / 2;
  
  // Downsample 16kHz → 8kHz and encode to μ-law
  const pcm8kLength = Math.floor(numSamples / 2);
  const ulawBuffer = Buffer.alloc(pcm8kLength);
  
  for (let i = 0; i < pcm8kLength; i++) {
    const sample1 = view.getInt16(i * 4, true);     // LE
    const sample2 = view.getInt16(i * 4 + 2, true); // LE
    const avgSample = Math.round((sample1 + sample2) / 2);
    ulawBuffer[i] = MULAW_ENCODE_TABLE[avgSample + 32768];
  }
  
  return ulawBuffer;
}
```

---

## Testing Checklist

- [ ] Call connects and is answered
- [ ] WebSocket upgrade succeeds for `/ws/telnyx-media`
- [ ] ElevenLabs signed URL obtained (status 200)
- [ ] ElevenLabs WebSocket connects
- [ ] Conversation metadata received (confirms audio formats)
- [ ] Audio chunks sent to ElevenLabs (8000 bytes each)
- [ ] AI response text logged (`🤖 Jason: ...`)
- [ ] Audio returned to Telnyx (bytes logged)
- [ ] Caller can HEAR the AI speaking
- [ ] Caller speech is transcribed (`👤 Caller: ...`)
- [ ] Two-way conversation works

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v6.6 | 2024-12-24 | ✅ **WORKING** - Added bidirectional RTP mode |
| v6.5 | 2024-12-24 | Removed agent config overrides (1008 fix) |
| v6.4 | 2024-12-24 | Explicit Little Endian PCM encoding |
| v6.3 | 2024-12-24 | Audio buffering to 250ms chunks |
| v6.2 | 2024-12-24 | Wait for metadata before sending audio |
| v6.1 | 2024-12-24 | Audio buffering while ElevenLabs connects |
| v6.0 | 2024-12-24 | Added μ-law ↔ PCM conversion |
| v5.x | 2024-12-24 | Diagnostic logging for audio flow |
| v4.0 | 2024-12-24 | Two-step answer then streaming_start |
| v3.x | 2024-12-24 | Discovered streaming in answer doesn't work |

---

## Key Learnings

1. **Telnyx Call Control v2** requires separate commands for answer and streaming
2. **Bidirectional streaming** requires explicit `stream_bidirectional_mode: 'rtp'`
3. **ElevenLabs agents** may lock certain config fields - only override what's allowed
4. **Audio format conversion** must handle endianness explicitly
5. **Chunk sizing** matters - ElevenLabs prefers 250ms chunks, not tiny 20ms ones
6. **Debug logging** is essential - log every step to identify where things fail

---

## Support Resources

- [Telnyx Media Streaming Docs](https://developers.telnyx.com/docs/voice/programmable-voice/media-streaming)
- [ElevenLabs Conversational AI](https://elevenlabs.io/docs/conversational-ai)
- [ElevenLabs Python SDK](https://github.com/elevenlabs/elevenlabs-python) (reference for message formats)

---

*Document created: December 24, 2025*
*Last working version: v6.6-bidirectional-rtp*
