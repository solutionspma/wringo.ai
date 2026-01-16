def forge_avatar(payload):
    """
    Wrapper for avatar generation pipeline
    Calls server/python/avatar/render.py
    """
    from server.python.avatar.render import run_avatar
    return run_avatar(payload)
