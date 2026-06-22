"""
Upload frontend/public images to Cloudinary and generate mapping JSON.
Run from backend/: python upload_to_cloudinary.py
"""

import json
from pathlib import Path

import cloudinary
import cloudinary.uploader

from . import API_KEY, API_SECRET, CLOUD_NAME

cloudinary.config(
    cloud_name=CLOUD_NAME,
    api_key=API_KEY,
    api_secret=API_SECRET,
)

BASE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = BASE_DIR / "frontend" / "public"
MAPPING_PATH = BASE_DIR / "frontend" / "src" / "assets" / "cloudinary-images.json"
MAPPING: dict[str, str] = {}


def upload(file_path: Path, public_id: str, resource_type: str = "image") -> str:
    result = cloudinary.uploader.upload(
        str(file_path),
        public_id=public_id,
        resource_type=resource_type,
        overwrite=False,
        unique_filename=False,
    )
    return result["secure_url"]


def main():
    logo_path = PUBLIC_DIR / "logo.png"
    if logo_path.exists():
        print(f"Uploading {logo_path.name}...")
        url = upload(logo_path, "battle-cursor/logo")
        MAPPING["logo.png"] = url
        print(f"  → {url}")

    cursors_dir = PUBLIC_DIR / "images" / "cursors"
    for f in sorted(cursors_dir.glob("*.png")):
        print(f"Uploading {f.name}...")
        url = upload(f, f"battle-cursor/images/cursors/{f.stem}")
        MAPPING[f"images/cursors/{f.name}"] = url
        print(f"  → {url}")

    canvas_dir = PUBLIC_DIR / "images" / "canvas"
    for f in sorted(canvas_dir.glob("*.svg")):
        print(f"Uploading {f.name}...")
        url = upload(f, f"battle-cursor/images/canvas/{f.stem}")
        MAPPING[f"images/canvas/{f.name}"] = url
        print(f"  → {url}")

    MAPPING_PATH.parent.mkdir(parents=True, exist_ok=True)
    MAPPING_PATH.write_text(json.dumps(MAPPING, indent=2, ensure_ascii=False))
    print(f"\nMapping saved to {MAPPING_PATH} ({len(MAPPING)} entries)")


if __name__ == "__main__":
    main()
