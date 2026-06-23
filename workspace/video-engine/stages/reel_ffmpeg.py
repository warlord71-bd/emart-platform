#!/usr/bin/env python3
"""
Free-tier vertical reel generator (Ken-Burns over product stills).

Zero marginal cost: CPU-only ffmpeg. Produces a 1080x1920 (9:16) MP4 suitable for
Instagram Reels, YouTube Shorts, TikTok, and Facebook.

Pipeline per image: cover-scale -> slow zoom/pan (zoompan) -> optional headline caption.
Multiple images are cross-faded (xfade). A silent AAC track is muxed so every platform
accepts the upload (a music/VO bed is a separate pluggable stage added later).

Usage:
  python3 reel_ffmpeg.py --image a.png [--image b.png ...] \
    --headline "COSRX Salicylic Cleanser" --sub "Gentle daily cleanse · COD" \
    --out output/cosrx.mp4 [--seconds 6] [--font /path/to/font.ttf]

Exit 0 + prints output path on success.
"""
from __future__ import annotations
import argparse, json, os, subprocess, sys
from pathlib import Path

W, H, FPS = 1080, 1920, 30
DEFAULT_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
BENGALI_FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/noto/NotoSansBengali-Bold.ttf",
    "/usr/share/fonts/truetype/noto/NotoSerifBengali-Bold.ttf",
]


def pick_font(text: str, override: str | None) -> str:
    if override and Path(override).exists():
        return override
    # Bengali range U+0980–U+09FF -> need a Bengali-capable font
    if any("ঀ" <= ch <= "৿" for ch in text):
        for f in BENGALI_FONT_CANDIDATES:
            if Path(f).exists():
                return f
    return DEFAULT_FONT


def _esc(text: str) -> str:
    # escape for ffmpeg drawtext
    return text.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace("%", "\\%")


def build_segment(image: str, seconds: float, idx: int) -> str:
    """filter chain producing one zoompan segment scaled to WxH."""
    frames = int(seconds * FPS)
    # scale-cover to 2x then zoompan for smooth motion; alternate zoom-in / zoom-out
    zexpr = "min(zoom+0.0009,1.18)" if idx % 2 == 0 else "if(eq(on,0),1.18,max(zoom-0.0009,1.0))"
    return (
        f"[{idx}:v]scale={W*2}:{H*2}:force_original_aspect_ratio=increase,"
        f"crop={W*2}:{H*2},"
        f"zoompan=z='{zexpr}':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
        f"s={W}x{H}:fps={FPS},setsar=1[v{idx}]"
    )


def _draw(text, font, size, color, y, t0, t1, box=False):
    """one timed drawtext filter fragment."""
    enable = f":enable='between(t,{t0:.2f},{t1:.2f})'"
    boxpart = "box=1:boxcolor=black@0.5:boxborderw=22:" if box else ""
    return (
        f"drawtext=fontfile={font}:text='{_esc(text)}':fontcolor={color}:fontsize={size}:"
        f"{boxpart}x=(w-text_w)/2:y={y}:shadowcolor=black@0.85:shadowx=2:shadowy=2{enable}"
    )


def timed_captions(script: dict, total: float, font: str) -> list[str]:
    """hook -> benefits (staggered) -> cta, sequenced across the clip."""
    d = []
    hook = script.get("hook", "")
    benefits = [b for b in (script.get("benefits") or []) if b][:3]
    cta = script.get("cta", "")
    if hook:
        d.append(_draw(hook, font, 70, "white", "h*0.12", 0.2, total * 0.45, box=True))
    n = max(1, len(benefits))
    seg = (total * 0.88 - total * 0.30) / n
    for i, b in enumerate(benefits):
        t0 = total * 0.30 + i * seg
        d.append(_draw(b, font, 56, "0xF5D060", "h*0.70", t0, t0 + seg, box=True))
    if cta:
        d.append(_draw(cta, font, 60, "white", "h*0.84", total * 0.62, total, box=True))
    return d


def run(images, headline, sub, out, seconds, font, script=None):
    images = [str(Path(i).resolve()) for i in images]
    for i in images:
        if not Path(i).exists():
            raise SystemExit(f"Image not found: {i}")
    Path(out).parent.mkdir(parents=True, exist_ok=True)

    inputs = []
    for img in images:
        inputs += ["-loop", "1", "-t", str(seconds), "-i", img]
    # silent audio source
    inputs += ["-f", "lavfi", "-t", str(seconds * len(images)), "-i", "anullsrc=r=44100:cl=stereo"]

    fc = [build_segment(img, seconds, i) for i, img in enumerate(images)]

    # chain segments with xfade, or single passthrough
    if len(images) == 1:
        vlabel = "[v0]"
    else:
        prev = "[v0]"
        for i in range(1, len(images)):
            off = seconds * i - 0.5 * i  # 0.5s overlap each transition
            lbl = f"[x{i}]"
            fc.append(f"{prev}[v{i}]xfade=transition=fade:duration=0.5:offset={off:.2f}{lbl}")
            prev = lbl
        vlabel = prev

    # captions: timed script (hook->benefits->cta) if provided, else static headline/sub
    total = seconds * len(images)
    if script:
        draw = timed_captions(script, total, font)
    else:
        draw = []
        if headline:
            draw.append(
                f"drawtext=fontfile={font}:text='{_esc(headline)}':fontcolor=white:fontsize=64:"
                f"box=1:boxcolor=black@0.45:boxborderw=24:x=(w-text_w)/2:y=h*0.74:"
                f"shadowcolor=black@0.8:shadowx=2:shadowy=2"
            )
        if sub:
            draw.append(
                f"drawtext=fontfile={font}:text='{_esc(sub)}':fontcolor=0xF5D060:fontsize=40:"
                f"x=(w-text_w)/2:y=h*0.82:shadowcolor=black@0.8:shadowx=2:shadowy=2"
            )
    if draw:
        fc.append(f"{vlabel}{','.join(draw)}[vout]")
        final_v = "[vout]"
    else:
        # ensure a labeled output
        fc.append(f"{vlabel}null[vout]")
        final_v = "[vout]"

    filtergraph = ";".join(fc)
    audio_idx = len(images)
    cmd = [
        "ffmpeg", "-y", *inputs,
        "-filter_complex", filtergraph,
        "-map", final_v, "-map", f"{audio_idx}:a",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p", "-r", str(FPS),
        "-c:a", "aac", "-b:a", "128k", "-shortest",
        "-movflags", "+faststart",
        out,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr[-1500:])
        raise SystemExit(f"ffmpeg failed ({proc.returncode})")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", action="append", required=True, dest="images")
    ap.add_argument("--headline", default="")
    ap.add_argument("--sub", default="")
    ap.add_argument("--out", required=True)
    ap.add_argument("--seconds", type=float, default=6.0)
    ap.add_argument("--font", default=None)
    ap.add_argument("--script-json", default=None, help="reel script (hook/benefits/cta) for timed captions")
    a = ap.parse_args()
    script = None
    if a.script_json and Path(a.script_json).exists():
        script = json.loads(Path(a.script_json).read_text())
    caption_text = a.headline + a.sub
    if script:
        caption_text = (script.get("hook", "") + " " + " ".join(script.get("benefits") or [])
                        + " " + script.get("cta", ""))
    font = pick_font(caption_text, a.font)
    out = run(a.images, a.headline, a.sub, a.out, a.seconds, font, script=script)
    print(out)


if __name__ == "__main__":
    main()
