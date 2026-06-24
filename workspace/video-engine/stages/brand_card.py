#!/usr/bin/env python3
"""
Branded end-card generator — a 1080x1920 closing frame so a reel reads as a finished ad.

Rendered via Chromium (proper Bangla + crisp type, same engine as the static social posts):
EMART logo, product name, price (৳), COD badge, site URL, tagline. Opaque PNG used as the
last "image" in the reel.

Usage:
  python3 brand_card.py --product "COSRX Snail Mucin Essence" --price 1250 \
    --tagline "Global Beauty. Local Trust." --out card.png [--bangla "অরিজিনাল কোরিয়ান স্কিনকেয়ার"]
"""
from __future__ import annotations
import argparse, glob, subprocess, sys, tempfile
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


def html(product, price, tagline, bangla, url):
    price_block = f'<div class="price">৳{esc(str(price))} <span class="cod">COD</span></div>' if price else ""
    bangla_block = f'<div class="bn">{esc(bangla)}</div>' if bangla else ""
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box;}}
html,body{{width:{W}px;height:{H}px;font-family:{FONT};
  background:linear-gradient(155deg,#0f2027 0%,#1c3a4a 45%,#2c5364 100%);color:#fff;overflow:hidden;}}
.wrap{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;text-align:center;padding:0 90px;}}
.logo{{font-size:62px;font-weight:900;letter-spacing:8px;margin-bottom:46px;}}
.logo .e{{color:#F5D060;}}
.rule{{width:90px;height:4px;background:#F5D060;border-radius:2px;margin:0 auto 40px;}}
.product{{font-size:64px;font-weight:800;line-height:1.25;margin-bottom:26px;}}
.bn{{font-size:40px;font-weight:600;color:#d8e6ef;line-height:1.4;margin-bottom:40px;}}
.price{{font-size:78px;font-weight:900;color:#F5D060;margin-bottom:54px;display:flex;
  align-items:center;justify-content:center;gap:22px;}}
.cod{{font-size:30px;font-weight:800;color:#0f2027;background:#F5D060;border-radius:14px;
  padding:8px 20px;letter-spacing:1px;}}
.url{{font-size:46px;font-weight:800;letter-spacing:1px;margin-bottom:18px;}}
.tag{{font-size:30px;font-style:italic;color:#bcd2de;}}
.foot{{position:absolute;bottom:70px;left:0;right:0;font-size:26px;color:#9fb8c6;text-align:center;}}
</style></head><body><div class="wrap">
<div class="logo"><span class="e">E</span>MART</div><div class="rule"></div>
<div class="product">{esc(product)}</div>
{bangla_block}
{price_block}
<div class="url">{esc(url)}</div>
<div class="tag">{esc(tagline)}</div>
</div><div class="foot">সারা বাংলাদেশে ক্যাশ অন ডেলিভারি · অরিজিনাল প্রোডাক্ট</div></body></html>"""


def render(product, price, tagline, bangla, url, out):
    hp = Path(tempfile.mktemp(suffix=".html"))
    hp.write_text(html(product, price, tagline, bangla, url), encoding="utf-8")
    node = r"""
const pw=require('/usr/lib/node_modules/playwright');const fs=require('fs');
(async()=>{const j=JSON.parse(fs.readFileSync(process.argv[2],'utf-8'));
const b=await pw.chromium.launch({executablePath:j.chromium,args:['--no-sandbox','--disable-setuid-sandbox']});
const p=await b.newPage({viewport:{width:j.w,height:j.h}});
await p.goto('file://'+j.html,{waitUntil:'networkidle'});await p.waitForTimeout(250);
await p.screenshot({path:j.out});await b.close();})().catch(e=>{console.error(e);process.exit(1);});
"""
    import json as _j
    jf = Path(tempfile.mktemp(suffix=".json"))
    jf.write_text(_j.dumps({"chromium": find_chromium(), "w": W, "h": H, "html": str(hp), "out": out}))
    nf = Path(tempfile.mktemp(suffix=".js"))
    nf.write_text(node)
    r = subprocess.run(["node", str(nf), str(jf)], capture_output=True, text=True, timeout=120)
    for f in (hp, jf, nf):
        f.unlink(missing_ok=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-800:])
        raise SystemExit("brand card render failed")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--product", required=True)
    ap.add_argument("--price", default="")
    ap.add_argument("--tagline", default="Global Beauty. Local Trust.")
    ap.add_argument("--bangla", default="")
    ap.add_argument("--url", default="e-mart.com.bd")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    print(render(a.product, a.price, a.tagline, a.bangla, a.url, a.out))


if __name__ == "__main__":
    main()
