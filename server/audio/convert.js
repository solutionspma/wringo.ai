/**
 * Audio Conversion Utilities for Telephony ↔ ElevenLabs
 * 
 * Telnyx sends: μ-law (G.711 PCMU) 8kHz mono
 * ElevenLabs expects: PCM 16-bit 16kHz mono
 * 
 * This module handles the bidirectional conversion.
 */

import g711 from "g711";

/**
 * μ-law decoding table (ITU-T G.711)
 * Converts 8-bit μ-law to 16-bit linear PCM
 */
const MULAW_DECODE_TABLE = new Int16Array([
  -32124, -31100, -30076, -29052, -28028, -27004, -25980, -24956,
  -23932, -22908, -21884, -20860, -19836, -18812, -17788, -16764,
  -15996, -15484, -14972, -14460, -13948, -13436, -12924, -12412,
  -11900, -11388, -10876, -10364, -9852, -9340, -8828, -8316,
  -7932, -7676, -7420, -7164, -6908, -6652, -6396, -6140,
  -5884, -5628, -5372, -5116, -4860, -4604, -4348, -4092,
  -3900, -3772, -3644, -3516, -3388, -3260, -3132, -3004,
  -2876, -2748, -2620, -2492, -2364, -2236, -2108, -1980,
  -1884, -1820, -1756, -1692, -1628, -1564, -1500, -1436,
  -1372, -1308, -1244, -1180, -1116, -1052, -988, -924,
  -876, -844, -812, -780, -748, -716, -684, -652,
  -620, -588, -556, -524, -492, -460, -428, -396,
  -372, -356, -340, -324, -308, -292, -276, -260,
  -244, -228, -212, -196, -180, -164, -148, -132,
  -120, -112, -104, -96, -88, -80, -72, -64,
  -56, -48, -40, -32, -24, -16, -8, 0,
  32124, 31100, 30076, 29052, 28028, 27004, 25980, 24956,
  23932, 22908, 21884, 20860, 19836, 18812, 17788, 16764,
  15996, 15484, 14972, 14460, 13948, 13436, 12924, 12412,
  11900, 11388, 10876, 10364, 9852, 9340, 8828, 8316,
  7932, 7676, 7420, 7164, 6908, 6652, 6396, 6140,
  5884, 5628, 5372, 5116, 4860, 4604, 4348, 4092,
  3900, 3772, 3644, 3516, 3388, 3260, 3132, 3004,
  2876, 2748, 2620, 2492, 2364, 2236, 2108, 1980,
  1884, 1820, 1756, 1692, 1628, 1564, 1500, 1436,
  1372, 1308, 1244, 1180, 1116, 1052, 988, 924,
  876, 844, 812, 780, 748, 716, 684, 652,
  620, 588, 556, 524, 492, 460, 428, 396,
  372, 356, 340, 324, 308, 292, 276, 260,
  244, 228, 212, 196, 180, 164, 148, 132,
  120, 112, 104, 96, 88, 80, 72, 64,
  56, 48, 40, 32, 24, 16, 8, 0
]);

/**
 * Convert μ-law 8kHz → PCM 16-bit 16kHz
 * @param {Buffer} ulawBuffer - Raw μ-law bytes from Telnyx
 * @returns {Buffer} PCM 16-bit 16kHz buffer for ElevenLabs
 */
export function ulawToPcm16k(ulawBuffer) {
  // Step 1: Decode μ-law to PCM 16-bit (8kHz)
  const pcm8k = new Int16Array(ulawBuffer.length);
  for (let i = 0; i < ulawBuffer.length; i++) {
    pcm8k[i] = MULAW_DECODE_TABLE[ulawBuffer[i]];
  }
  
  // Step 2: Upsample 8kHz → 16kHz (linear interpolation)
  const pcm16k = new Int16Array(pcm8k.length * 2);
  for (let i = 0; i < pcm8k.length; i++) {
    pcm16k[i * 2] = pcm8k[i];
    // Interpolate between samples
    if (i < pcm8k.length - 1) {
      pcm16k[i * 2 + 1] = Math.round((pcm8k[i] + pcm8k[i + 1]) / 2);
    } else {
      pcm16k[i * 2 + 1] = pcm8k[i];
    }
  }
  
  // Convert to Buffer
  return Buffer.from(pcm16k.buffer);
}

/**
 * μ-law encoding table
 */
const MULAW_ENCODE_TABLE = new Uint8Array(65536);
(function buildMulawEncodeTable() {
  const BIAS = 0x84;
  const CLIP = 32635;
  
  for (let i = 0; i < 65536; i++) {
    let sample = i - 32768; // Convert to signed
    let sign = (sample >> 8) & 0x80;
    if (sign !== 0) sample = -sample;
    if (sample > CLIP) sample = CLIP;
    sample += BIAS;
    
    let exponent = 7;
    for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; exponent--, expMask >>= 1) {}
    
    let mantissa = (sample >> (exponent + 3)) & 0x0F;
    MULAW_ENCODE_TABLE[i] = ~(sign | (exponent << 4) | mantissa) & 0xFF;
  }
})();

/**
 * Convert PCM 16-bit 16kHz → μ-law 8kHz
 * @param {Buffer} pcmBuffer - PCM 16-bit 16kHz buffer from ElevenLabs
 * @returns {Buffer} μ-law 8kHz buffer for Telnyx
 */
export function pcm16kToUlaw(pcmBuffer) {
  const pcm16k = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.length / 2);
  
  // Step 1: Downsample 16kHz → 8kHz (take every other sample)
  const pcm8k = new Int16Array(Math.floor(pcm16k.length / 2));
  for (let i = 0; i < pcm8k.length; i++) {
    // Average adjacent samples for better quality
    pcm8k[i] = Math.round((pcm16k[i * 2] + pcm16k[i * 2 + 1]) / 2);
  }
  
  // Step 2: Encode to μ-law
  const ulawBuffer = Buffer.alloc(pcm8k.length);
  for (let i = 0; i < pcm8k.length; i++) {
    // Convert signed to unsigned for table lookup
    ulawBuffer[i] = MULAW_ENCODE_TABLE[pcm8k[i] + 32768];
  }
  
  return ulawBuffer;
}

/**
 * Alternative: Use g711 library for encoding/decoding
 */
export function ulawToPcm16kG711(ulawBuffer) {
  // Decode μ-law to PCM using g711 library
  const pcm8k = g711.decode(ulawBuffer);
  
  // Upsample 8kHz → 16kHz
  const pcm16k = new Int16Array(pcm8k.length * 2);
  for (let i = 0; i < pcm8k.length; i++) {
    pcm16k[i * 2] = pcm8k[i];
    if (i < pcm8k.length - 1) {
      pcm16k[i * 2 + 1] = Math.round((pcm8k[i] + pcm8k[i + 1]) / 2);
    } else {
      pcm16k[i * 2 + 1] = pcm8k[i];
    }
  }
  
  return Buffer.from(pcm16k.buffer);
}

export function pcm16kToUlawG711(pcmBuffer) {
  const pcm16k = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.length / 2);
  
  // Downsample 16kHz → 8kHz
  const pcm8k = new Int16Array(Math.floor(pcm16k.length / 2));
  for (let i = 0; i < pcm8k.length; i++) {
    pcm8k[i] = Math.round((pcm16k[i * 2] + pcm16k[i * 2 + 1]) / 2);
  }
  
  // Encode to μ-law using g711 library
  return Buffer.from(g711.encode(pcm8k));
}
