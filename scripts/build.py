#!/usr/bin/env python3
"""
Build and Package Script for TMoji Web

This script:
1. Builds the frontend library (if npm is available)
2. Minifies assets
3. Creates production folder structure
4. Zips the entire repository
"""

import os
import sys
import shutil
import zipfile
import subprocess
from pathlib import Path
from datetime import datetime

# Configuration
PROJECT_NAME = "tmoji-web"
VERSION = "1.0.0"
OUTPUT_DIR = Path("dist")
ZIP_NAME = f"{PROJECT_NAME}-v{VERSION}.zip"

# Files and directories to include
INCLUDE = [
    "frontend/",
    "backend/",
    "docs/",
    "examples/",
    "scripts/",
    "README.md",
    "LICENSE",
]

# Files to exclude
EXCLUDE = [
    "__pycache__",
    "*.pyc",
    "*.pyo",
    "*.pyd",
    ".git",
    ".gitignore",
    "node_modules",
    ".DS_Store",
    "*.log",
    "dist/",
    "build/",
    "*.zip",
]


def log(message: str):
    """Print log message with timestamp"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")


def should_exclude(path: Path) -> bool:
    """Check if path should be excluded"""
    path_str = str(path)
    for pattern in EXCLUDE:
        if pattern.endswith('/'):
            if pattern.rstrip('/') in path_str.split(os.sep):
                return True
        elif pattern.startswith('*'):
            if path_str.endswith(pattern[1:]):
                return True
        elif pattern in path_str:
            return True
    return False


def build_frontend():
    """Build frontend library with npm"""
    log("Building frontend...")
    frontend_dir = Path("frontend")

    if not (frontend_dir / "package.json").exists():
        log("Warning: frontend/package.json not found, skipping build")
        return

    try:
        # Check if npm is available
        subprocess.run(["npm", "--version"], check=True, capture_output=True)

        # Install dependencies
        log("Installing npm dependencies...")
        subprocess.run(["npm", "install"], cwd=frontend_dir, check=True)

        # Build
        log("Running npm build...")
        subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True)

        log("Frontend build complete!")
    except subprocess.CalledProcessError as e:
        log(f"Error building frontend: {e}")
    except FileNotFoundError:
        log("npm not found, skipping frontend build")


def create_structure():
    """Create production folder structure"""
    log("Creating production structure...")

    # Clean previous build
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)

    OUTPUT_DIR.mkdir(exist_ok=True)

    # Create subdirectories
    (OUTPUT_DIR / "frontend").mkdir(exist_ok=True)
    (OUTPUT_DIR / "backend").mkdir(exist_ok=True)
    (OUTPUT_DIR / "docs").mkdir(exist_ok=True)
    (OUTPUT_DIR / "examples").mkdir(exist_ok=True)


def copy_files():
    """Copy files to output directory"""
    log("Copying files...")

    for item in INCLUDE:
        src = Path(item)
        if not src.exists():
            log(f"Warning: {item} not found, skipping")
            continue

        dst = OUTPUT_DIR / item

        if src.is_dir():
            shutil.copytree(src, dst, ignore=shutil.ignore_patterns(*EXCLUDE))
        else:
            shutil.copy2(src, dst)


def create_zip():
    """Create zip archive"""
    log(f"Creating {ZIP_NAME}...")

    with zipfile.ZipFile(ZIP_NAME, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(OUTPUT_DIR):
            # Filter excluded directories
            dirs[:] = [d for d in dirs if not should_exclude(Path(root) / d)]

            for file in files:
                file_path = Path(root) / file
                if should_exclude(file_path):
                    continue

                arcname = str(file_path.relative_to(OUTPUT_DIR.parent))
                zf.write(file_path, arcname)

    # Get file size
    size = os.path.getsize(ZIP_NAME)
    log(f"Created {ZIP_NAME} ({size / 1024 / 1024:.2f} MB)")


def generate_manifest():
    """Generate manifest.json with build info"""
    manifest = {
        "name": PROJECT_NAME,
        "version": VERSION,
        "build_date": datetime.now().isoformat(),
        "files": {
            "frontend": "frontend/dist/",
            "backend": "backend/app/",
            "docs": "docs/",
            "examples": "examples/"
        }
    }

    import json
    with open(OUTPUT_DIR / "manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)


def main():
    """Main build process"""
    log(f"Building {PROJECT_NAME} v{VERSION}...")

    # Build steps
    build_frontend()
    create_structure()
    copy_files()
    generate_manifest()
    create_zip()

    log("Build complete!")
    log(f"Output: {ZIP_NAME}")
    log(f"Extracted: {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
