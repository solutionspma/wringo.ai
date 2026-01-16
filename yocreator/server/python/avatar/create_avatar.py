# ======================================
# YOcreator — Avatar Creation Engine
# server/python/avatar/create_avatar.py
# ======================================
# Extracts face mesh from photos and prepares avatar data for lip-sync

import os
import cv2
import numpy as np
from pathlib import Path

try:
    from insightface.app import FaceAnalysis
    INSIGHTFACE_AVAILABLE = True
except ImportError:
    INSIGHTFACE_AVAILABLE = False
    print("Warning: InsightFace not installed. Using fallback face detection.")

AVATAR_OUT = os.path.join(os.path.dirname(__file__), "../../../pipeline/cache/avatar")
Path(AVATAR_OUT).mkdir(parents=True, exist_ok=True)


def create_avatar(image_dir: str, output_name: str = "avatar"):
    """
    Process multiple face images to create avatar data.
    
    Args:
        image_dir: Directory containing 10-20 face photos
        output_name: Name for the output avatar data file
        
    Returns:
        dict with success status and output path
    """
    
    if INSIGHTFACE_AVAILABLE:
        return _create_avatar_insightface(image_dir, output_name)
    else:
        return _create_avatar_fallback(image_dir, output_name)


def _create_avatar_insightface(image_dir: str, output_name: str):
    """Use InsightFace for high-quality face mesh extraction"""
    
    app = FaceAnalysis(providers=['CPUExecutionProvider', 'CUDAExecutionProvider'])
    app.prepare(ctx_id=0)

    faces = []
    processed = 0
    
    for img_name in os.listdir(image_dir):
        if not img_name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            continue
            
        img_path = os.path.join(image_dir, img_name)
        img = cv2.imread(img_path)
        
        if img is None:
            print(f"Warning: Could not read {img_path}")
            continue

        results = app.get(img)
        if len(results) == 0:
            print(f"Warning: No face detected in {img_name}")
            continue

        face = results[0]
        faces.append({
            "img": img,
            "img_path": img_path,
            "landmarks": face.landmark_2d_106.tolist() if hasattr(face, 'landmark_2d_106') else [],
            "bbox": face.bbox.tolist(),
            "embedding": face.embedding.tolist() if hasattr(face, 'embedding') else [],
            "age": int(face.age) if hasattr(face, 'age') else None,
            "gender": face.gender if hasattr(face, 'gender') else None,
        })
        processed += 1
        print(f"Processed: {img_name} ({processed} faces)")

    if len(faces) == 0:
        return {
            "success": False,
            "error": "No faces detected in any images"
        }

    # Save avatar data
    avatar_data_path = os.path.join(AVATAR_OUT, f"{output_name}_data.npy")
    np.save(avatar_data_path, faces, allow_pickle=True)

    # Save reference frame (first good face)
    reference_path = os.path.join(AVATAR_OUT, f"{output_name}_reference.jpg")
    cv2.imwrite(reference_path, faces[0]["img"])

    return {
        "success": True,
        "message": f"Avatar created from {len(faces)} faces",
        "output": avatar_data_path,
        "reference": reference_path,
        "face_count": len(faces)
    }


def _create_avatar_fallback(image_dir: str, output_name: str):
    """Fallback using OpenCV Haar cascades"""
    
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    
    faces = []
    processed = 0
    
    for img_name in os.listdir(image_dir):
        if not img_name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            continue
            
        img_path = os.path.join(image_dir, img_name)
        img = cv2.imread(img_path)
        
        if img is None:
            continue

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        detected = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(detected) == 0:
            continue

        x, y, w, h = detected[0]
        faces.append({
            "img": img,
            "img_path": img_path,
            "bbox": [x, y, x+w, y+h],
            "landmarks": [],  # Not available with Haar
        })
        processed += 1

    if len(faces) == 0:
        return {
            "success": False,
            "error": "No faces detected"
        }

    avatar_data_path = os.path.join(AVATAR_OUT, f"{output_name}_data.npy")
    np.save(avatar_data_path, faces, allow_pickle=True)

    reference_path = os.path.join(AVATAR_OUT, f"{output_name}_reference.jpg")
    cv2.imwrite(reference_path, faces[0]["img"])

    return {
        "success": True,
        "message": f"Avatar created (fallback mode) from {len(faces)} faces",
        "output": avatar_data_path,
        "reference": reference_path,
        "face_count": len(faces)
    }


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        result = create_avatar(sys.argv[1])
        print(result)
    else:
        print("Usage: python create_avatar.py <image_directory>")
