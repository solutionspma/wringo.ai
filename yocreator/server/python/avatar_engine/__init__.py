"""
YoCreator Avatar Engine
=======================

Backend module for avatar generation and processing.
"""

from .generator import (
    generate_avatar,
    generate_avatar_with_face,
    export_avatar,
    get_available_assets,
    AvatarMorphParams,
    GeneratedAvatar,
    parse_frontend_params,
)

__all__ = [
    "generate_avatar",
    "generate_avatar_with_face", 
    "export_avatar",
    "get_available_assets",
    "AvatarMorphParams",
    "GeneratedAvatar",
    "parse_frontend_params",
]
