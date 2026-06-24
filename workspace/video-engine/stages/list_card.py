#!/usr/bin/env python3
"""
Value / bullet-point template card generator — the "reason to keep watching" frames.

Renders a branded 1080x1920 infographic card (Chromium → proper Bangla) with a kicker, a punchy
title, and 3-5 bullet points. Use it to deliver actual value (tips, ingredient facts, mistakes,
myths) intercut with the persona so the reel earns the watch instead of just praising a product.

Styles: numbered (1/2/3) | check (✓) | tip (💡-ish dot). All branded, native-Bangla capable.

Usage:
  python3 list_card.py --kicker "জেনে নিন" --title "স্নেইল মিউসিন আসলে কী করে?" \
    --bullet "ত্বকের আর্দ্রতা লক করে" --bullet "ড্যামেজ রিপেয়ারে সাহায্য করে" \
    --bullet "ত্বক রাখে প্লাম্প ও গ্লোয়ি" --style numbered --out card.png
"""
from __future__ import annotations
import argparse, glob, json, subprocess, sys, tempfile
from pathlib import Path

W, H = 1080, 1920
FONT = "'Noto Sans Bengali','Inter','Segoe UI',sans-serif"


def find_chromium() -> str:
    c = sorted(glob.glob("/root/.cache/ms-playwright/chromium-*/chrome-linux64/chrome"))
    if not c:
        raise SystemExit("no playwright chromium found")
    return c[-1]


def esc(t: str) -> str:
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def bullet_html(bullets, style):
    rows = []
    for i, b in enumerate(bullets, 1):
        mark = {"numbered": str(i), "check": "✓", "tip": "•"}.get(style, "•")
        rows.append(
            f'<div class="row"><div class="mark">{mark}</div><div class="txt">{esc(b)}</div></div>')
    return "\n".join(rows)


def html(kicker, title, bullets, style, footer):
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box;}}
html,body{{width:{W}px;height:{H}px;font-family:{FONT};color:#fff;overflow:hidden;
  background:linear-gradient(160deg,#10222b 0%,#1b3946 50%,#244b5c 100%);}}
.wrap{{position:absolute;inset:0;padding:130px 86px;display:flex;flex-direction:column;}}
.kicker{{align-self:flex-start;font-size:32px;font-weight:800;letter-spacing:3px;color:#10222b;
  background:#F5D060;border-radius:14px;padding:10px 26px;margin-bottom:40px;}}
.title{{font-size:74px;font-weight:900;line-height:1.22;margin-bottom:64px;}}
.title .hl{{color:#F5D060;}}
.row{{display:flex;align-items:center;gap:30px;margin-bottom:38px;
  background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);
  border-radius:22px;padding:30px 34px;}}
.mark{{flex:0 0 84px;height:84px;border-radius:50%;background:#F5D060;color:#10222b;
  font-size:44px;font-weight:900;display:flex;align-items:center;justify-content:center;}}
.txt{{font-size:50px;font-weight:700;line-height:1.3;}}
.foot{{margin-top:auto;display:flex;align-items:center;justify-content:space-between;
  font-size:30px;color:#aac3d0;}}
.foot .logo{{font-weight:900;letter-spacing:4px;color:#fff;}}
.foot .logo .e{{color:#F5D060;}}
</style></head><body><div class="wrap">
<div class="kicker">{esc(kicker)}</div>
<div class="title">{esc(title)}</div>
{bullet_html(bullets, style)}
<div class="foot"><span class="logo"><span class="e">E</span>MART</span><span>{esc(footer)}</span></div>
</div></body></html>"""


def render(kicker, title, bullets, style, footer, out):
    hp = Path(tempfile.mktemp(suffix=".html"))
    hp.write_text(html(kicker, title, bullets, style, footer), encoding="utf-8")
    node = r"""
const pw=require('/usr/lib/node_modules/playwright');const fs=require('fs');
(async()=>{const j=JSON.parse(fs.readFileSync(process.argv[2],'utf-8'));
const b=await pw.chromium.launch({executablePath:j.chromium,args:['--no-sandbox','--disable-setuid-sandbox']});
const p=await b.newPage({viewport:{width:j.w,height:j.h}});
await p.goto('file://'+j.html,{waitUntil:'networkidle'});await p.waitForTimeout(250);
await p.screenshot({path:j.out});await b.close();})().catch(e=>{console.error(e);process.exit(1);});
"""
    jf = Path(tempfile.mktemp(suffix=".json"))
    jf.write_text(json.dumps({"chromium": find_chromium(), "w": W, "h": H, "html": str(hp), "out": out}))
    nf = Path(tempfile.mktemp(suffix=".js"))
    nf.write_text(node)
    r = subprocess.run(["node", str(nf), str(jf)], capture_output=True, text=True, timeout=120)
    for f in (hp, jf, nf):
        f.unlink(missing_ok=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-800:]); raise SystemExit("list card render failed")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--kicker", default="জেনে নিন")
    ap.add_argument("--title", required=True)
    ap.add_argument("--bullet", action="append", dest="bullets", required=True)
    ap.add_argument("--style", default="numbered", choices=("numbered", "check", "tip"))
    ap.add_argument("--footer", default="e-mart.com.bd · COD")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    print(render(a.kicker, a.title, a.bullets[:5], a.style, a.footer, a.out))


if __name__ == "__main__":
    main()
