def forge_video(payload):
    """
    Wrapper for video generation pipeline
    Calls server/python/video/generate.py
    """
    from server.python.video.generate import run_video
    return run_video(payload)
