#!/usr/bin/env python3
"""
Browser-rendered caption overlays — proper Bangla (or English), NO romanized Banglish.

ffmpeg drawtext/libass on this box lack HarfBuzz so they mangle Bangla conjuncts. Chromium
shapes Bangla perfectly (same engine that makes the static social posts correct). This stage
renders each caption line to a transparent 1080x1920 PNG via Chromium, with timing, so the reel
stage can composite them with ffmpeg `overlay ... enable='between(t,t0,t1)'`.

Output: JSON list [{png, t0, t1}] written to --out; PNGs in the same dir.

Usage:
  python3 caption_overlay.py --script script.json --total 10 --outdir /tmp/caps --out overlays.json
"""
from __future__ import annotations
import argparse, glob, json, subprocess, sys, tempfile
from pathlib import Path

W, H = 1080, 1920
FONT_STACK = "'Noto Sans Bengali','Hind Siliguri','Inter','Segoe UI',sans-serif"

# Platform UI safe zones — FB/IG Reels overlay their own chrome on the top ~13% (profile/name) and
# bottom ~22-30% (caption, like/comment/share, audio). Captions MUST sit inside the safe middle band
# or they get clipped on mobile. Values are `top:` for hook/benefit/cta.
#   wide = intersection that's safe on BOTH platforms (default, single-version safe)
#   fb   = tuned for Facebook Reels   |   ig = tuned for Instagram Reels (taller bottom UI)
# Platform-specific caption safe zones (% from top of 1080x1920).
# Each platform overlays its own UI chrome:
#   FB Reels:  top ~13% (profile), bottom ~25% (caption/actions)
#   IG Reels:  top ~12% (profile), bottom ~30% (caption/actions/audio — tallest)
#   YT Shorts: top ~10% (search), bottom ~22% (title/subscribe/actions)
#   TikTok:    top ~10% (FYP tabs), bottom ~28% (caption/buttons/music)
#   wide:      intersection safe on ALL platforms (conservative default)
SAFE_ZONES = {
    "wide":    {"hook": "17%", "benefit": "50%", "cta": "60%"},
    "fb":      {"hook": "17%", "benefit": "56%", "cta": "66%"},
    "ig":      {"hook": "16%", "benefit": "48%", "cta": "58%"},
    "youtube": {"hook": "14%", "benefit": "54%", "cta": "66%"},
    "tiktok":  {"hook": "14%", "benefit": "50%", "cta": "60%"},
}
# wider side margins keep lower captions clear of the right-edge action buttons
SIDE = 80


def find_chromium() -> str:
    cands = sorted(glob.glob("/root/.cache/ms-playwright/chromium-*/chrome-linux64/chrome"))
    if not cands:
        raise SystemExit("no playwright chromium found")
    return cands[-1]


def css(zone: str = "wide") -> str:
    z = SAFE_ZONES.get(zone, SAFE_ZONES["wide"])
    return f"""
*{{margin:0;padding:0;box-sizing:border-box;}}
html,body{{width:{W}px;height:{H}px;background:transparent;font-family:{FONT_STACK};}}
.wrap{{position:absolute;inset:0;}}
.cap{{position:absolute;left:{SIDE}px;right:{SIDE}px;text-align:center;line-height:1.25;
  font-weight:800;text-shadow:0 3px 12px rgba(0,0,0,.55);}}
.pill{{display:inline-block;padding:14px 30px;border-radius:22px;
  background:rgba(0,0,0,.46);backdrop-filter:blur(2px);}}
.hook   {{top:{z['hook']};}}   .hook .pill  {{font-size:72px;color:#fff;}}
.benefit{{top:{z['benefit']};}}  .benefit .pill{{font-size:58px;color:#F5D060;}}
.cta    {{top:{z['cta']};}}  .cta .pill   {{font-size:60px;color:#fff;background:rgba(20,20,30,.62);
  border:2px solid #F5D060;}}
"""


def build_elements(script: dict, total: float) -> list[dict]:
    """timed caption elements: hook -> benefits (staggered) -> cta."""
    els = []
    hook = (script.get("hook") or "").strip()
    benefits = [b.strip() for b in (script.get("benefits") or []) if b and b.strip()][:3]
    cta = (script.get("cta") or "").strip()
    if hook:
        els.append({"text": hook, "cls": "hook", "t0": 0.2, "t1": round(total * 0.45, 2)})
    n = max(1, len(benefits))
    seg = (total * 0.88 - total * 0.30) / n
    for i, b in enumerate(benefits):
        t0 = total * 0.30 + i * seg
        els.append({"text": b, "cls": "benefit", "t0": round(t0, 2), "t1": round(t0 + seg, 2)})
    if cta:
        els.append({"text": cta, "cls": "cta", "t0": round(total * 0.62, 2), "t1": round(total, 2)})
    return els


def html_for(text: str, cls: str, zone: str = "wide") -> str:
    safe = (text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
    return (f"<!DOCTYPE html><html><head><meta charset='utf-8'><style>{css(zone)}</style></head>"
            f"<body><div class='wrap'><div class='cap {cls}'><span class='pill'>{safe}</span>"
            f"</div></div></body></html>")


def render(elements: list[dict], outdir: Path, zone: str = "wide") -> list[dict]:
    outdir.mkdir(parents=True, exist_ok=True)
    manifest = []
    for i, el in enumerate(elements):
        hp = outdir / f"cap-{i}.html"
        pp = outdir / f"cap-{i}.png"
        hp.write_text(html_for(el["text"], el["cls"], zone), encoding="utf-8")
        manifest.append({"html": str(hp), "png": str(pp), "t0": el["t0"], "t1": el["t1"]})
    # one browser launch renders all caption PNGs (transparent)
    job = {"chromium": find_chromium(), "w": W, "h": H,
           "items": [{"html": m["html"], "png": m["png"]} for m in manifest]}
    jf = Path(tempfile.mktemp(suffix=".json"))
    jf.write_text(json.dumps(job))
    node = r"""
const pw = require('/usr/lib/node_modules/playwright');
const fs = require('fs');
(async () => {
  const job = JSON.parse(fs.readFileSync(process.argv[2],'utf-8'));
  const browser = await pw.chromium.launch({executablePath: job.chromium,
    args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage({viewport:{width:job.w,height:job.h},
    deviceScaleFactor:1});
  for (const it of job.items) {
    await page.goto('file://'+it.html, {waitUntil:'networkidle'});
    await page.waitForTimeout(250);
    await page.screenshot({path: it.png, omitBackground: true});
  }
  await browser.close();
})().catch(e=>{console.error(e); process.exit(1);});
"""
    nf = Path(tempfile.mktemp(suffix=".js"))
    nf.write_text(node)
    r = subprocess.run(["node", str(nf), str(jf)], capture_output=True, text=True, timeout=120)
    jf.unlink(missing_ok=True); nf.unlink(missing_ok=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-1000:])
        raise SystemExit("caption render failed")
    return [{"png": m["png"], "t0": m["t0"], "t1": m["t1"]} for m in manifest]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", required=True)
    ap.add_argument("--total", type=float, required=True)
    ap.add_argument("--outdir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--safe-zone", dest="safe_zone", default="wide", choices=list(SAFE_ZONES))
    a = ap.parse_args()
    script = json.loads(Path(a.script).read_text())
    els = build_elements(script, a.total)
    overlays = render(els, Path(a.outdir), a.safe_zone)
    Path(a.out).write_text(json.dumps(overlays, indent=2))
    print(a.out)


if __name__ == "__main__":
    main()
