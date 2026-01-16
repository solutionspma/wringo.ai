# ======================================
# YOcreator — Final Render Pipeline
# pipeline/render_final.py
# ======================================
# Assembles avatar video + voice audio into final MP4

import os
import subprocess
import uuid
import cv2
import numpy as np
from pathlib import Path

# Use relative paths that work in both local and container environments
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BASE_DIR, "cache")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")

Path(CACHE_DIR).mkdir(parents=True, exist_ok=True)
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)


def render_from_frames(lipsynced_frames_path: str, audio_path: str, output_name: str = None):
    """
    Render final video from lip-synced frames and audio.
    
    Args:
        lipsynced_frames_path: Path to .npy file containing frames
        audio_path: Path to audio file (wav/mp3)
        output_name: Optional name for output file
        
    Returns:
        Path to final video with audio
    """
    
    if not os.path.exists(lipsynced_frames_path):
        raise FileNotFoundError(f"Frames not found: {lipsynced_frames_path}")
    
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio not found: {audio_path}")
    
    # Load frames
    frames = np.load(lipsynced_frames_path, allow_pickle=True)
    
    if len(frames) == 0:
        raise ValueError("No frames to render")
    
    out_id = output_name or str(uuid.uuid4())
    video_only_path = os.path.join(CACHE_DIR, f"{out_id}_video.mp4")
    final_path = os.path.join(OUTPUT_DIR, f"{out_id}.mp4")
    
    # Get dimensions from first frame
    first_frame = frames[0]
    if isinstance(first_frame, dict):
        first_frame = first_frame.get("img", first_frame)
    
    h, w = first_frame.shape[:2]
    fps = 25
    
    # Write frames to video
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(video_only_path, fourcc, fps, (w, h))
    
    for frame in frames:
        if isinstance(frame, dict):
            frame = frame.get("img", frame)
        if isinstance(frame, np.ndarray):
            writer.write(frame.astype(np.uint8))
    
    writer.release()
    print(f"Video frames written: {video_only_path}")
    
    # Merge audio with video using FFmpeg
    cmd = [
        "ffmpeg", "-y",
        "-i", video_only_path,
        "-i", audio_path,
        "-c:v", "libx264",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        final_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"FFmpeg error: {result.stderr}")
        # Return video without audio as fallback
        return video_only_path
    
    # Clean up intermediate file
    if os.path.exists(video_only_path) and os.path.exists(final_path):
        os.remove(video_only_path)
    
    print(f"Final video rendered: {final_path}")
    return final_path


def render_final(inputs):
    """
    Legacy interface for worker.py compatibility.
    
    inputs = {
        "voice_path": "/path/to/voice.wav",
        "avatar_path": "/path/to/avatar.mp4",
        "background_path": "/path/to/bg.mp4",  # optional
        "music_path": "/path/to/music.mp3",     # optional
        "volume": 1.0,
        "music_volume": 0.4
    }
    """

    voice = inputs.get("voice_path")
    avatar = inputs.get("avatar_path")
    bg = inputs.get("background_path", None)
    music = inputs.get("music_path", None)

    out_id = str(uuid.uuid4())
    out_path = f"{FINAL_DIR}/{out_id}.mp4"

    # ======================================================
    # 1. BASE VIDEO (avatar only)
    # ======================================================
    base_video = avatar

    # ======================================================
    # 2. Optional background composite
    # ======================================================
    if bg:
        composite_video = f"{FINAL_DIR}/{out_id}_composite.mp4"
        cmd = [
            "ffmpeg", "-y",
            "-i", bg,
            "-i", base_video,
            "-filter_complex", "[1:v]scale=1280:720[scaled];[0:v][scaled]overlay=0:0",
            composite_video
        ]
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        base_video = composite_video

    # ======================================================
    # 3. Add VOICE + optional MUSIC
    # ======================================================
    audio_inputs = []
    filter_complex = []
    map_flags = []

    idx = 0

    # voice
    if voice:
        audio_inputs.extend(["-i", voice])
        filter_complex.append(f"[{idx}:a]volume=1.0[aud1]")
        idx += 1

    # music
    if music:
        audio_inputs.extend(["-i", music])
        filter_complex.append(f"[{idx}:a]volume=0.4[aud2]")
        idx += 1

    # audio combining logic
    if music:
        filter_complex.append("[aud1][aud2]amix=inputs=2:dropout_transition=3[aout]")
        audio_map = "[aout]"
    else:
        audio_map = "[aud1]"

    cmd = [
        "ffmpeg", "-y",
        "-i", base_video,
        *audio_inputs,
        "-filter_complex", ";".join(filter_complex),
        "-map", "0:v",
        "-map", audio_map,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        out_path
    ]

    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    return out_path
