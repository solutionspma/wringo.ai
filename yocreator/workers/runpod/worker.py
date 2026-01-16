# ======================================
# YOcreator — RunPod GPU Worker
# workers/runpod/worker.py
# ======================================
# Processes avatar rendering jobs on RunPod GPU infrastructure

import os
import sys
import time
import json
import requests

# Add project paths
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../server/python"))

# Import pipeline modules
try:
    from server.python.avatar.create_avatar import create_avatar
    from server.python.avatar.lipsync import lipsync_avatar, frames_to_video
    from server.python.voice.inference import synthesize_voice, run_voice
    from pipeline.render_final import render_final, render_from_frames
except ImportError as e:
    print(f"Import warning: {e}")
    # Fallback imports for container environment
    from avatar.create_avatar import create_avatar
    from avatar.lipsync import lipsync_avatar, frames_to_video
    from voice.inference import synthesize_voice, run_voice

# Environment
SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE") or os.getenv("SERVICE_KEY")
RUNPOD_MODE = os.getenv("RUNPOD_POD_ID") is not None


def fetch_job():
    """Fetch next queued job from Supabase"""
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/render_jobs?status=eq.queued&order=created_at.asc&limit=1&select=*",
            headers={"apikey": SERVICE_KEY},
            timeout=10
        )
        jobs = r.json()
        return jobs[0] if isinstance(jobs, list) and jobs else None
    except Exception as e:
        print(f"Error fetching job: {e}")
        return None


def update_job(job_id, status, result=None, error=None, progress=None):
    """Update job status in Supabase"""
    payload = {"status": status}
    if result:
        payload["result_url"] = result
        payload["output_url"] = result
    if error:
        payload["error"] = error
    if progress is not None:
        payload["progress"] = progress

    try:
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/render_jobs?id=eq.{job_id}",
            headers={"apikey": SERVICE_KEY, "Content-Type": "application/json"},
            data=json.dumps(payload),
            timeout=10
        )
    except Exception as e:
        print(f"Error updating job: {e}")


def process_voice_job(payload):
    """Process voice synthesis job"""
    text = payload.get("text", "")
    voice_id = payload.get("voice_id")
    
    if not text:
        raise ValueError("No text provided for voice synthesis")
    
    output_path = synthesize_voice(text, voice_id)
    return output_path


def process_avatar_job(payload):
    """Process avatar creation job"""
    image_dir = payload.get("image_dir") or payload.get("images")
    output_name = payload.get("name", "avatar")
    
    if not image_dir:
        raise ValueError("No image directory provided for avatar creation")
    
    result = create_avatar(image_dir, output_name)
    
    if not result.get("success"):
        raise Exception(result.get("error", "Avatar creation failed"))
    
    return result.get("output")


def process_full_avatar_job(payload):
    """
    Full avatar pipeline: photos + script → talking avatar video
    
    payload = {
        "script": "Text to speak",
        "images": "/path/to/face/photos",
        "voice_id": "optional_elevenlabs_voice_id"
    }
    """
    script = payload.get("script", "")
    images = payload.get("images") or payload.get("image_dir")
    voice_id = payload.get("voice_id")
    
    if not script:
        raise ValueError("No script provided")
    if not images:
        raise ValueError("No images provided")
    
    # Step 1: Generate voice
    print("Step 1: Generating voice...")
    audio_path = synthesize_voice(script, voice_id)
    
    # Step 2: Create avatar from photos
    print("Step 2: Creating avatar mesh...")
    avatar_result = create_avatar(images)
    if not avatar_result.get("success"):
        raise Exception(avatar_result.get("error", "Avatar creation failed"))
    avatar_data = avatar_result["output"]
    
    # Step 3: Lip sync
    print("Step 3: Applying lip sync...")
    lipsync_result = lipsync_avatar(avatar_data, audio_path)
    if not lipsync_result.get("success"):
        raise Exception(lipsync_result.get("error", "Lip sync failed"))
    lipsynced_frames = lipsync_result["output"]
    
    # Step 4: Render final video
    print("Step 4: Rendering final video...")
    final_video = render_from_frames(lipsynced_frames, audio_path)
    
    return final_video


def process_video_job(payload):
    """Process video generation job"""
    # For now, create a storyboard or placeholder
    script = payload.get("script", "")
    template = payload.get("template", "default")
    
    # This would integrate with video generation models
    # For now, return a placeholder
    return f"video_placeholder_{template}"


def handler(event):
    """RunPod serverless handler function"""
    job_input = event.get("input", {})
    
    job_type = job_input.get("type", "voice")
    
    try:
        if job_type == "voice":
            result = process_voice_job(job_input)
        elif job_type == "avatar":
            result = process_avatar_job(job_input)
        elif job_type == "full_avatar":
            result = process_full_avatar_job(job_input)
        elif job_type == "video":
            result = process_video_job(job_input)
        else:
            raise ValueError(f"Unknown job type: {job_type}")
        
        return {"status": "success", "output": result}
    
    except Exception as e:
        return {"status": "error", "error": str(e)}


def run_polling_worker():
    """Run as polling worker (for non-serverless deployments)"""
    print("Starting YOcreator GPU Worker (polling mode)...")
    print(f"Supabase URL: {SUPABASE_URL}")
    
    while True:
        job = fetch_job()
        
        if not job:
            time.sleep(3)
            continue
        
        print(f"Processing job: {job['id']} ({job['type']})")
        update_job(job["id"], "processing", progress=0)
        
        try:
            payload = job.get("payload", {})
            job_type = job.get("type", "")
            
            if job_type == "voice":
                out = process_voice_job(payload)
            elif job_type == "avatar":
                out = process_avatar_job(payload)
            elif job_type == "full_avatar":
                out = process_full_avatar_job(payload)
            elif job_type == "video":
                out = process_video_job(payload)
            elif job_type == "final":
                out = render_final(payload)
            else:
                raise Exception(f"Unknown job type: {job_type}")
            
            update_job(job["id"], "completed", result=out, progress=100)
            print(f"Job {job['id']} completed: {out}")
            
        except Exception as e:
            error_msg = str(e)
            update_job(job["id"], "error", error=error_msg)
            print(f"Job {job['id']} failed: {error_msg}")


# Entry point
if __name__ == "__main__":
    if RUNPOD_MODE:
        # RunPod serverless mode
        import runpod
        runpod.serverless.start({"handler": handler})
    else:
        # Polling mode
        run_polling_worker()