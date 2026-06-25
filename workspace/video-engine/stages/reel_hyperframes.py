#!/usr/bin/env python3
"""
HyperFrames reel renderer — HTML-composition-based video generation.

Replaces reel_ffmpeg.py's PIL→PNG→ffmpeg concat with a single HTML composition
rendered by HyperFrames (Puppeteer + FFmpeg). Produces the same 1080×1920 MP4
output with real GSAP animations: smooth Ken Burns, crossfade transitions,
staggered text reveals, and animated brand/value cards.

Usage (standalone):
  python3 reel_hyperframes.py --job ../jobs/queue/example.json --out output/reel.mp4

Usage (from worker.py):
  Called automatically when renderer="hyperframes" in the job or worker config.
"""
from __future__ import annotations
import argparse, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RENDER_JS = ROOT / "hyperframes" / "render.js"


def run(job_path: str, out: str, audio: str | None = None, music: str | None = None) -> str:
    cmd = ["node", str(RENDER_JS), "--job", str(Path(job_path).resolve()), "--out", str(Path(out).resolve())]
    if audio:
        cmd += ["--audio", str(Path(audio).resolve())]
    if music:
        cmd += ["--music", str(Path(music).resolve())]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr[-1500:] + "\n")
        raise SystemExit(f"hyperframes render failed ({proc.returncode})")
    result = proc.stdout.strip()
    if result and Path(result).exists():
        return result
    raise SystemExit("hyperframes render produced no output")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--job", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--audio", default=None)
    ap.add_argument("--music", default=None)
    a = ap.parse_args()
    print(run(a.job, a.out, a.audio, a.music))


if __name__ == "__main__":
    main()
