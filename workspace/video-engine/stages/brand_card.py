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
import argparse, base64, glob, subprocess, sys, tempfile
from pathlib import Path

W, H = 1080, 1920
FONT = "'Noto Sans Bengali','Inter','Segoe UI',sans-serif"
# Emart brand palette (source of truth: apps/web/tailwind.config.js)
ROSE, WINE, INK = "#9f1239", "#5e1130", "#2a0a18"
GOLD, SOFT_ROSE = "#e7b24a", "#f3c9d6"


def find_chromium() -> str:
    c = sorted(glob.glob("/root/.cache/ms-playwright/chromium-*/chrome-linux64/chrome"))
    if not c:
        raise SystemExit("no playwright chromium found")
    return c[-1]


def logo_data_uri() -> str:
    """embed the real colorful Emart logo (apps/web/public/logo.png) so the card carries the brand mark."""
    for p in (Path(__file__).resolve().parents[3] / "apps/web/public/logo.png",
              Path("/root/emart-platform/apps/web/public/logo.png"),
              Path("/var/www/emart-platform/apps/web/public/logo.png")):
        if p.exists():
            return "data:image/png;base64," + base64.b64encode(p.read_bytes()).decode()
    return ""


def esc(t: str) -> str:
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def html(product, price, original, tagline, bangla, url):
    logo = logo_data_uri()
    logo_block = (f'<img class="logo" src="{logo}">' if logo
                  else '<div class="logotext"><span class="e">e</span>Mart</div>')
    if price:
        has_offer = False
        try:
            has_offer = bool(original and int(float(original)) > int(float(price)))
        except ValueError:
            pass
        orig = f'<span class="orig">৳{esc(str(original))}</span>' if has_offer else ""
        save = (f'<div class="save">৳{int(float(original))-int(float(price))} সাশ্রয়</div>'
                if has_offer else "")
        label = "অফার মূল্য" if has_offer else "মূল্য"
        price_block = (f'<div class="offerlabel">{label}</div>'
                       f'<div class="pricerow"><span class="offer">৳{esc(str(price))}</span>{orig}'
                       f'<span class="cod">COD</span></div>{save}')
    else:
        price_block = ""
    bangla_block = f'<div class="bn">{esc(bangla)}</div>' if bangla else ""
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box;}}
html,body{{width:{W}px;height:{H}px;font-family:{FONT};
  background:linear-gradient(160deg,{ROSE} 0%,{WINE} 55%,{INK} 100%);color:#fff;overflow:hidden;}}
.wrap{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;text-align:center;padding:0 90px;}}
.logo{{width:248px;height:248px;border-radius:40px;margin-bottom:42px;
  box-shadow:0 18px 50px rgba(0,0,0,0.45);}}
.logotext{{font-size:84px;font-weight:900;letter-spacing:2px;margin-bottom:42px;color:#fff;}}
.logotext .e{{color:{GOLD};}}
.rule{{width:96px;height:4px;background:{GOLD};border-radius:2px;margin:0 auto 40px;}}
.product{{font-size:64px;font-weight:800;line-height:1.25;margin-bottom:24px;}}
.bn{{font-size:40px;font-weight:600;color:{SOFT_ROSE};line-height:1.4;margin-bottom:38px;}}
.offerlabel{{font-size:30px;font-weight:800;letter-spacing:4px;color:{GOLD};
  text-transform:uppercase;margin-bottom:10px;}}
.pricerow{{display:flex;align-items:center;justify-content:center;gap:24px;margin-bottom:14px;}}
.offer{{font-size:96px;font-weight:900;color:{GOLD};}}
.orig{{font-size:50px;font-weight:700;color:{SOFT_ROSE};text-decoration:line-through;opacity:.85;}}
.cod{{font-size:30px;font-weight:800;color:{INK};background:{GOLD};border-radius:14px;
  padding:8px 20px;letter-spacing:1px;}}
.save{{font-size:32px;font-weight:800;color:#fff;background:rgba(255,255,255,0.16);
  border-radius:30px;padding:8px 26px;margin-bottom:46px;display:inline-block;}}
.url{{font-size:46px;font-weight:800;letter-spacing:1px;margin:8px 0 18px;}}
.tag{{font-size:30px;font-style:italic;color:{SOFT_ROSE};}}
.foot{{position:absolute;bottom:70px;left:0;right:0;font-size:26px;color:{SOFT_ROSE};text-align:center;}}
</style></head><body><div class="wrap">
{logo_block}<div class="rule"></div>
<div class="product">{esc(product)}</div>
{bangla_block}
{price_block}
<div class="url">{esc(url)}</div>
<div class="tag">{esc(tagline)}</div>
</div><div class="foot">সারা বাংলাদেশে ক্যাশ অন ডেলিভারি · অরিজিনাল প্রোডাক্ট</div></body></html>"""


def render(product, price, original, tagline, bangla, url, out):
    hp = Path(tempfile.mktemp(suffix=".html"))
    hp.write_text(html(product, price, original, tagline, bangla, url), encoding="utf-8")
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
    ap.add_argument("--original-price", dest="original", default="")
    ap.add_argument("--tagline", default="Global Beauty. Local Trust.")
    ap.add_argument("--bangla", default="")
    ap.add_argument("--url", default="e-mart.com.bd")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    print(render(a.product, a.price, a.original, a.tagline, a.bangla, a.url, a.out))


if __name__ == "__main__":
    main()
