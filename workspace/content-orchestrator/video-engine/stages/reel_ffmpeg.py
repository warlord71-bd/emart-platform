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

W, H, FPS = 1080, 1920, 24
# loudness normalize to the ~-14 LUFS target IG Reels / YT Shorts / TikTok expect (true peak -1.5)
LOUDNORM = "loudnorm=I=-14:TP=-1.5:LRA=11"
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


def build_segment(image: str, seconds: float, idx: int, fit: bool = False) -> str:
    """one motion segment.

    CROP-PAN mode (default): scale ONCE to a slightly larger canvas, then animate a 1080x1920 crop
    window across it. crop does no per-frame resampling -> near-static encode cost (zoompan was
    pathologically slow on this GPU-less box). Direction alternates per clip for variety.

    FIT mode (fit=True): for images whose edges carry content (e.g. branded product cards with a
    heading/price at the margins) — show the WHOLE image centered (contain) over a darkened blurred
    fill of itself, so nothing is cropped off. Used for non-9:16 product imagery.
    """
    if fit:
        return (
            f"[{idx}:v]split=2[bg{idx}][fg{idx}];"
            f"[bg{idx}]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
            f"boxblur=26:2,eq=brightness=-0.07[bgb{idx}];"
            f"[fg{idx}]scale={W}:{H}:force_original_aspect_ratio=decrease[fgs{idx}];"
            f"[bgb{idx}][fgs{idx}]overlay=(W-w)/2:(H-h)/2,setsar=1,fps={FPS}[v{idx}]"
        )
    cw = (int(W * 1.12) // 2) * 2
    ch = (int(H * 1.12) // 2) * 2
    d = idx % 4
    if d == 0:      # pan left -> right
        x, y = f"(iw-ow)*t/{seconds}", "(ih-oh)/2"
    elif d == 1:    # pan top -> bottom
        x, y = "(iw-ow)/2", f"(ih-oh)*t/{seconds}"
    elif d == 2:    # pan right -> left
        x, y = f"(iw-ow)*(1-t/{seconds})", "(ih-oh)/2"
    else:           # pan bottom -> top
        x, y = "(iw-ow)/2", f"(ih-oh)*(1-t/{seconds})"
    return (
        f"[{idx}:v]scale={cw}:{ch}:force_original_aspect_ratio=increase,crop={cw}:{ch},"
        f"crop={W}:{H}:x='{x}':y='{y}',setsar=1,fps={FPS}[v{idx}]"
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


def run(images, headline, sub, out, seconds, font, script=None, overlays=None, audio=None, music=None,
        fit_images=None):
    images = [str(Path(i).resolve()) for i in images]
    fit_set = {str(Path(p).resolve()) for p in (fit_images or [])}
    for i in images:
        if not Path(i).exists():
            raise SystemExit(f"Image not found: {i}")
    Path(out).parent.mkdir(parents=True, exist_ok=True)

    total = seconds * len(images)
    inputs = []
    for img in images:
        inputs += ["-loop", "1", "-t", str(seconds), "-i", img]
    # audio: real voiceover when provided (padded/trimmed to total), else silence
    if audio:
        inputs += ["-i", audio]
    else:
        inputs += ["-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=44100:cl=stereo"]
    audio_idx = len(images)
    # browser-rendered caption PNGs (proper Bangla/English) as looped inputs after audio
    if overlays:
        for ov in overlays:
            inputs += ["-loop", "1", "-t", str(total), "-i", ov["png"]]
    # music bed (looped) as the last input
    music_idx = None
    if music and Path(music).exists():
        music_idx = len(images) + 1 + (len(overlays) if overlays else 0)
        inputs += ["-stream_loop", "-1", "-i", music]

    fc = [build_segment(img, seconds, i, fit=(img in fit_set)) for i, img in enumerate(images)]

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

    # captions: browser PNG overlays (proper Bangla/English) > drawtext script > static headline/sub
    if overlays:
        # subtle grade + vignette on the BASE so captions stay crisp on top
        fc.append(f"{vlabel}eq=saturation=1.08:contrast=1.03:brightness=0.01,"
                  f"vignette=PI/4.6[graded]")
        prev = "[graded]"
        FADE = 0.35
        for k, ov in enumerate(overlays):
            in_idx = audio_idx + 1 + k
            t0, t1 = float(ov["t0"]), float(ov["t1"])
            fo = max(t0 + 0.1, t1 - FADE)  # fade-out start
            # fade caption alpha in/out -> alpha 0 outside its window, so overlay can run full-time
            fc.append(f"[{in_idx}:v]format=rgba,fade=t=in:st={t0:.2f}:d={FADE}:alpha=1,"
                      f"fade=t=out:st={fo:.2f}:d={FADE}:alpha=1[cap{k}]")
            lbl = f"[ov{k}]"
            fc.append(f"{prev}[cap{k}]overlay=0:0{lbl}")
            prev = lbl
        fc.append(f"{prev}null[vout]")
        final_v = "[vout]"
    else:
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
        else:
            fc.append(f"{vlabel}null[vout]")
        final_v = "[vout]"

    # audio map: voiceover (padded to total) + optional ducked music bed under it
    if audio:
        if music_idx is not None:
            # split VO: one copy drives the ducking sidechain, one copy is mixed in
            fc.append(f"[{audio_idx}:a]apad=whole_dur={total},atrim=0:{total},asetpts=N/SR/TB,"
                      f"asplit=2[vo1][vo2]")
            fc.append(f"[{music_idx}:a]atrim=0:{total},asetpts=N/SR/TB,volume=0.22[mraw]")
            fc.append(f"[mraw][vo1]sidechaincompress=threshold=0.02:ratio=6:attack=20:release=350[mduck]")
            fc.append(f"[vo2][mduck]amix=inputs=2:duration=first:dropout_transition=0,"
                      f"{LOUDNORM}[aout]")
        else:
            fc.append(f"[{audio_idx}:a]apad=whole_dur={total},atrim=0:{total},asetpts=N/SR/TB,"
                      f"{LOUDNORM}[aout]")
        amap = "[aout]"
    elif music_idx is not None:
        fc.append(f"[{music_idx}:a]atrim=0:{total},asetpts=N/SR/TB,volume=0.5,{LOUDNORM}[aout]")
        amap = "[aout]"
    else:
        amap = f"{audio_idx}:a"

    filtergraph = ";".join(fc)
    cmd = [
        "ffmpeg", "-y", *inputs,
        "-filter_complex", filtergraph,
        "-map", final_v, "-map", amap,
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "24",
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
    ap.add_argument("--overlays-json", default=None, help="browser-rendered caption PNGs [{png,t0,t1}]")
    ap.add_argument("--audio", default=None, help="voiceover audio file (mp3/wav); replaces silence")
    ap.add_argument("--music", default=None, help="background music loop; ducked under the voiceover")
    ap.add_argument("--fit-image", action="append", dest="fit_images", default=[],
                    help="image to show whole (blurred-fill) instead of crop — for branded/product frames")
    a = ap.parse_args()
    script = None
    if a.script_json and Path(a.script_json).exists():
        script = json.loads(Path(a.script_json).read_text())
    overlays = None
    if a.overlays_json and Path(a.overlays_json).exists():
        overlays = json.loads(Path(a.overlays_json).read_text())
    caption_text = a.headline + a.sub
    if script:
        caption_text = (script.get("hook", "") + " " + " ".join(script.get("benefits") or [])
                        + " " + script.get("cta", ""))
    font = pick_font(caption_text, a.font)
    out = run(a.images, a.headline, a.sub, a.out, a.seconds, font, script=script, overlays=overlays,
              audio=a.audio, music=a.music, fit_images=a.fit_images)
    print(out)


if __name__ == "__main__":
    main()
