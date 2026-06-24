#!/usr/bin/env python3
"""
Free voiceover stage — turns the script's `voiceover` text into bn-BD (or en) neural narration.

Uses edge-tts (Microsoft Neural voices): no API key, no cost, native Bangla voices
(bn-BD-NabanitaNeural female / bn-BD-PradeepNeural male). The pipeline already generates a
30-40 word voiceover on every job and was throwing it away into silence — this consumes it.

Graceful: if edge-tts can't reach the service (offline), exits non-zero with no file so the
worker falls back to a silent track (never blocks the free pipeline).

Output: an mp3 at --out. Prints the audio duration (seconds) on success.

Usage:
  python3 voice_gen.py --text "..." --language bn --gender female --out vo.mp3
"""
from __future__ import annotations
import argparse, asyncio, subprocess, sys
from pathlib import Path

VOICES = {
    ("bn", "female"): "bn-BD-NabanitaNeural",
    ("bn", "male"): "bn-BD-PradeepNeural",
    ("en", "female"): "en-US-AriaNeural",
    ("en", "male"): "en-US-GuyNeural",
}


def pick_voice(language: str, gender: str) -> str:
    lang = "bn" if str(language).lower() in ("bn", "banglish", "bangla") else "en"
    return VOICES.get((lang, gender), VOICES[(lang, "female")])


async def synth(text: str, voice: str, out: str, rate: str, pitch: str):
    import edge_tts
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await comm.save(out)


def duration(path: str) -> float:
    try:
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                            "-of", "default=nw=1:nk=1", path], capture_output=True, text=True, timeout=30)
        return float(r.stdout.strip() or 0)
    except Exception:
        return 0.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", required=True)
    ap.add_argument("--language", default="bn")
    ap.add_argument("--gender", default="female", choices=("female", "male"))
    ap.add_argument("--rate", default="+0%", help="speech rate, e.g. -5% for slightly slower")
    ap.add_argument("--pitch", default="+0Hz")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    text = a.text.strip()
    if not text:
        sys.exit("no voiceover text")
    voice = pick_voice(a.language, a.gender)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    try:
        asyncio.run(synth(text, voice, a.out, a.rate, a.pitch))
    except Exception as e:
        sys.stderr.write(f"voice_gen failed (offline?) -> silent fallback: {e}\n")
        sys.exit(2)
    if not Path(a.out).exists() or Path(a.out).stat().st_size == 0:
        sys.exit("voice_gen produced no audio")
    print(f"{duration(a.out):.2f}")


if __name__ == "__main__":
    main()
