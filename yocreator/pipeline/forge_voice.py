def forge_voice(payload):
    """
    Wrapper for voice generation pipeline
    Calls server/python/voice/inference.py
    """
    from server.python.voice.inference import run_voice
    return run_voice(payload)
