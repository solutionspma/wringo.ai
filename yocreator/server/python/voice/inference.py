# ======================================
# YOcreator — Voice Inference Engine
# server/python/voice/inference.py
# ======================================
# Supports ElevenLabs (primary) and OpenAI TTS (fallback)

import os
import uuid
import requests
from pathlib import Path

# Environment variables
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Rachel default
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../../../pipeline/cache/audio")
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)


def synthesize_voice(text: str, voice_id: str = None, output_format: str = "wav"):
    """
    Generate speech from text using ElevenLabs or OpenAI TTS.
    
    Args:
        text: The text to convert to speech
        voice_id: ElevenLabs voice ID (optional)
        output_format: 'wav' or 'mp3'
        
    Returns:
        Path to generated audio file
    """
    
    # Try ElevenLabs first (better voice cloning)
    if ELEVENLABS_API_KEY:
        try:
            return _synthesize_elevenlabs(text, voice_id or ELEVENLABS_VOICE_ID, output_format)
        except Exception as e:
            print(f"ElevenLabs failed: {e}, trying OpenAI...")
    
    # Fallback to OpenAI TTS
    if OPENAI_API_KEY:
        try:
            return _synthesize_openai(text, output_format)
        except Exception as e:
            print(f"OpenAI TTS failed: {e}")
    
    # Last resort: gTTS (free but lower quality)
    return _synthesize_gtts(text)


def _synthesize_elevenlabs(text: str, voice_id: str, output_format: str = "wav"):
    """Generate speech using ElevenLabs API"""
    
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg" if output_format == "mp3" else "audio/wav"
    }
    
    payload = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.55,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True
        }
    }
    
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    
    if response.status_code != 200:
        raise Exception(f"ElevenLabs API error: {response.status_code} - {response.text}")
    
    file_id = str(uuid.uuid4())
    ext = "mp3" if output_format == "mp3" else "wav"
    out_path = os.path.join(OUTPUT_DIR, f"{file_id}.{ext}")
    
    with open(out_path, "wb") as f:
        f.write(response.content)
    
    print(f"ElevenLabs voice generated: {out_path}")
    return out_path


def _synthesize_openai(text: str, output_format: str = "wav"):
    """Generate speech using OpenAI TTS API"""
    
    url = "https://api.openai.com/v1/audio/speech"
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "tts-1-hd",
        "input": text,
        "voice": "alloy",  # Options: alloy, echo, fable, onyx, nova, shimmer
        "response_format": "mp3" if output_format == "mp3" else "wav"
    }
    
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    
    if response.status_code != 200:
        raise Exception(f"OpenAI TTS error: {response.status_code} - {response.text}")
    
    file_id = str(uuid.uuid4())
    ext = "mp3" if output_format == "mp3" else "wav"
    out_path = os.path.join(OUTPUT_DIR, f"{file_id}.{ext}")
    
    with open(out_path, "wb") as f:
        f.write(response.content)
    
    print(f"OpenAI TTS voice generated: {out_path}")
    return out_path


def _synthesize_gtts(text: str):
    """Fallback: Generate speech using Google TTS (free)"""
    
    try:
        from gtts import gTTS
    except ImportError:
        raise Exception("No TTS engine available. Install gtts or provide API keys.")
    
    file_id = str(uuid.uuid4())
    out_path = os.path.join(OUTPUT_DIR, f"{file_id}.mp3")
    
    tts = gTTS(text=text, lang="en")
    tts.save(out_path)
    
    print(f"gTTS voice generated: {out_path}")
    return out_path


def run_voice(payload):
    """
    Legacy interface for worker.py compatibility.
    
    payload = {
        "text": "hello world",
        "voice_id": "custom_voice_id",
        "speed": 1.0,
        "emotion": "neutral"
    }
    """
    
    text = payload.get("text", "")
    voice_id = payload.get("voice_id")
    
    if not text:
        raise Exception("No text provided for voice synthesis")
    
    return synthesize_voice(text, voice_id)


def list_elevenlabs_voices():
    """Get list of available ElevenLabs voices"""
    
    if not ELEVENLABS_API_KEY:
        return {"error": "ElevenLabs API key not configured"}
    
    url = "https://api.elevenlabs.io/v1/voices"
    headers = {"xi-api-key": ELEVENLABS_API_KEY}
    
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        return {"error": f"API error: {response.status_code}"}
    
    data = response.json()
    voices = [
        {"id": v["voice_id"], "name": v["name"], "category": v.get("category", "unknown")}
        for v in data.get("voices", [])
    ]
    
    return {"voices": voices}


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        text = " ".join(sys.argv[1:])
        result = synthesize_voice(text)
        print(f"Generated: {result}")
    else:
        print("Usage: python inference.py <text to speak>")
        print("\nAvailable voices:")
        print(list_elevenlabs_voices())#
# audio = model.tts(text=text, speaker_wav="models/voice/jason.wav")
# audio.save(out_path)
#
# ===========================================================
