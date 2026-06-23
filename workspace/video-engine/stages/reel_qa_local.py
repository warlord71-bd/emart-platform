#!/usr/bin/env python3
"""
Free local QA gate for generated reels.

Checks the MP4 container with ffprobe: dimensions, duration, stream presence, and file size.
This is not creative review, but it catches broken renders before publish without any paid API.
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path


def ffprobe(path: Path) -> dict:
    proc = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-print_format", "json",
            "-show_format", "-show_streams",
            str(path),
        ],
        capture_output=True,
        text=True,
        timeout=30,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip()[-500:] or "ffprobe failed")
    return json.loads(proc.stdout)


def run(video: str) -> dict:
    path = Path(video)
    issues = []
    fixes = []
    if not path.exists():
        return {
            "status": "fail",
            "score": 0,
            "summary": "Video file is missing.",
            "issues": ["missing_file"],
            "fixes": ["Regenerate the reel stage."],
            "publishable": False,
        }

    size = path.stat().st_size
    if size < 100_000:
        issues.append(f"file_too_small:{size}")
        fixes.append("Regenerate the MP4; output is unexpectedly small.")

    meta = ffprobe(path)
    streams = meta.get("streams") or []
    videos = [s for s in streams if s.get("codec_type") == "video"]
    audios = [s for s in streams if s.get("codec_type") == "audio"]
    duration = float((meta.get("format") or {}).get("duration") or 0)

    if not videos:
        issues.append("missing_video_stream")
        fixes.append("Regenerate with ffmpeg video mapping.")
        width = height = 0
    else:
        width = int(videos[0].get("width") or 0)
        height = int(videos[0].get("height") or 0)
        if (width, height) != (1080, 1920):
            issues.append(f"wrong_dimensions:{width}x{height}")
            fixes.append("Regenerate as 1080x1920 vertical reel.")

    if not audios:
        issues.append("missing_audio_stream")
        fixes.append("Regenerate with silent AAC track or voice/music stage.")

    if duration < 3 or duration > 90:
        issues.append(f"duration_out_of_range:{duration:.2f}")
        fixes.append("Use a reel duration between 3 and 90 seconds.")

    status = "pass" if not issues else ("fail" if any(i.startswith(("missing_", "wrong_dimensions")) for i in issues) else "warn")
    score = 96 if status == "pass" else (55 if status == "warn" else 20)
    return {
        "status": status,
        "score": score,
        "summary": f"Local media QA {status}: {width}x{height}, {duration:.2f}s, {size} bytes.",
        "strengths": [] if issues else ["Valid vertical MP4 with video and audio streams."],
        "issues": issues,
        "fixes": fixes,
        "publishable": status != "fail",
        "_provider": "local-ffprobe",
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    data = run(a.video)
    Path(a.out).write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(a.out)
    raise SystemExit(0 if data["publishable"] else 1)


if __name__ == "__main__":
    main()
