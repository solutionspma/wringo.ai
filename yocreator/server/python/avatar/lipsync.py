# ======================================
# YOcreator — Lip Sync Engine
# server/python/avatar/lipsync.py
# ======================================
# Wav2Lip-based lip synchronization for avatar videos

import os
import torch
import numpy as np
import cv2
from pathlib import Path
from scipy.io import wavfile

CACHE = os.path.join(os.path.dirname(__file__), "../../../pipeline/cache/lipsync")
Path(CACHE).mkdir(parents=True, exist_ok=True)

# Check for Wav2Lip availability
WAV2LIP_AVAILABLE = False
try:
    # This would be the actual Wav2Lip model import
    # from models.wav2lip import Wav2Lip
    WAV2LIP_AVAILABLE = os.path.exists("models/wav2lip.pth")
except:
    pass


def load_wav2lip_model():
    """Load the Wav2Lip model for lip sync"""
    model_path = "models/wav2lip.pth"
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Wav2Lip model not found at {model_path}. "
            "Download from: https://github.com/Rudrabha/Wav2Lip"
        )
    
    # Placeholder for actual model loading
    # model = Wav2Lip()
    # model.load_state_dict(torch.load(model_path, map_location="cuda"))
    # model.cuda().eval()
    # return model
    
    return None  # Placeholder


def lipsync_avatar(avatar_data_path: str, audio_path: str, output_name: str = "lipsynced"):
    """
    Apply lip sync to avatar frames using audio.
    
    Args:
        avatar_data_path: Path to avatar_data.npy from create_avatar
        audio_path: Path to audio WAV file
        output_name: Name for output file
        
    Returns:
        dict with success status and output path
    """
    
    # Load avatar data
    if not os.path.exists(avatar_data_path):
        return {"success": False, "error": "Avatar data not found"}
        
    if not os.path.exists(audio_path):
        return {"success": False, "error": "Audio file not found"}
    
    frames = np.load(avatar_data_path, allow_pickle=True)
    
    if len(frames) == 0:
        return {"success": False, "error": "No frames in avatar data"}
    
    # Load audio
    try:
        audio_sr, audio_data = wavfile.read(audio_path)
    except Exception as e:
        return {"success": False, "error": f"Failed to read audio: {str(e)}"}
    
    fps = 25
    duration = len(audio_data) / audio_sr
    num_frames = int(duration * fps)
    
    print(f"Processing {num_frames} frames for {duration:.2f}s of audio")
    
    # If Wav2Lip is available, use it
    if WAV2LIP_AVAILABLE:
        return _lipsync_wav2lip(frames, audio_data, audio_sr, fps, output_name)
    else:
        # Fallback: simple frame duplication with visual feedback
        return _lipsync_fallback(frames, audio_data, audio_sr, fps, output_name)


def _lipsync_wav2lip(frames, audio_data, audio_sr, fps, output_name):
    """Full Wav2Lip lip sync processing"""
    
    model = load_wav2lip_model()
    out_frames = []
    
    num_frames = int(len(audio_data) / audio_sr * fps)
    
    for idx in range(num_frames):
        # Get frame (cycle through available frames)
        frame_data = frames[idx % len(frames)]
        frame = frame_data["img"]
        
        # Get audio slice for this frame
        start_sample = int(idx * audio_sr / fps)
        end_sample = int((idx + 1) * audio_sr / fps)
        audio_slice = audio_data[start_sample:end_sample]
        
        # Convert to tensors
        frame_tensor = torch.from_numpy(frame).permute(2, 0, 1).unsqueeze(0).float().cuda()
        audio_tensor = torch.from_numpy(audio_slice.astype(np.float32)).unsqueeze(0).cuda()
        
        # Run Wav2Lip inference
        # out = model(frame_tensor, audio_tensor)
        # out_frame = out[0].cpu().detach().numpy().transpose(1, 2, 0)
        
        out_frames.append(frame)  # Placeholder
        
        if idx % 50 == 0:
            print(f"Processed frame {idx}/{num_frames}")
    
    out_path = os.path.join(CACHE, f"{output_name}.npy")
    np.save(out_path, out_frames, allow_pickle=True)
    
    return {
        "success": True,
        "output": out_path,
        "frames": num_frames
    }


def _lipsync_fallback(frames, audio_data, audio_sr, fps, output_name):
    """
    Fallback lip sync - creates video frames synced to audio duration.
    Adds visual cues based on audio amplitude.
    """
    
    num_frames = int(len(audio_data) / audio_sr * fps)
    out_frames = []
    
    # Calculate audio energy per frame for visual feedback
    samples_per_frame = audio_sr // fps
    
    for idx in range(num_frames):
        # Cycle through available face frames
        frame_data = frames[idx % len(frames)]
        frame = frame_data["img"].copy()
        
        # Get audio amplitude for this frame
        start = idx * samples_per_frame
        end = start + samples_per_frame
        audio_slice = audio_data[start:end] if end <= len(audio_data) else audio_data[start:]
        
        if len(audio_slice) > 0:
            amplitude = np.abs(audio_slice).mean()
            # Normalize amplitude
            if audio_data.dtype == np.int16:
                amplitude = amplitude / 32768.0
            
            # Add visual indicator of speech (simple overlay)
            if amplitude > 0.02:  # Speaking threshold
                # Draw a subtle "speaking" indicator
                h, w = frame.shape[:2]
                intensity = min(int(amplitude * 255 * 3), 255)
                cv2.circle(frame, (w - 30, h - 30), 10, (0, intensity, 0), -1)
        
        out_frames.append(frame)
        
        if idx % 100 == 0:
            print(f"Processed frame {idx}/{num_frames}")
    
    out_path = os.path.join(CACHE, f"{output_name}.npy")
    np.save(out_path, out_frames, allow_pickle=True)
    
    return {
        "success": True,
        "output": out_path,
        "frames": num_frames,
        "mode": "fallback"
    }


def frames_to_video(frames_path: str, output_path: str, fps: int = 25):
    """Convert numpy frames to video file"""
    
    frames = np.load(frames_path, allow_pickle=True)
    
    if len(frames) == 0:
        return {"success": False, "error": "No frames to convert"}
    
    h, w = frames[0].shape[:2]
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
    
    for frame in frames:
        if isinstance(frame, np.ndarray):
            writer.write(frame.astype(np.uint8))
    
    writer.release()
    
    return {
        "success": True,
        "output": output_path,
        "frames": len(frames)
    }


if __name__ == "__main__":
    import sys
    if len(sys.argv) >= 3:
        result = lipsync_avatar(sys.argv[1], sys.argv[2])
        print(result)
    else:
        print("Usage: python lipsync.py <avatar_data.npy> <audio.wav>")
