#!/usr/bin/env python3
"""
Presenter composite — FREE, automatic "model + real product" frame (no Codex, no AI dummy).

Codex's image-gen makes the nicest "model holding the product" shot, but Codex only runs when a
human invokes it — so it can't be part of an autonomous pipeline. The free Pollinations path
hallucinates a fake bottle (dummy). This stage avoids both: it COMPOSITES the REAL product photo
onto a consistent persona still, so every reel gets a genuine "influencer + the real product"
frame deterministically, for $0.

Layout (1080x1920, Chromium-rendered, same engine as the cards):
  persona still full-bleed (cover) -> bottom dark scrim -> real product photo on a white rounded
  tile floating in the lower third (where a hand would hold it) with soft shadow -> small brand chip.

Usage:
  python3 presenter_card.py --persona persona.png --product product.png --out out.png \
    [--label "ডাঃ রুমানার পছন্দ"]
"""
from __future__ import annotations
import argparse, base64, glob, subprocess, sys, tempfile
from pathlib import Path

W, H = 1080, 1920
FONT = "'Noto Sans Bengali','Inter','Segoe UI',sans-serif"
GOLD, ROSE, INK = "#e7b24a", "#9f1239", "#2a0a18"


def find_chromium() -> str:
    c = sorted(glob.glob("/root/.cache/ms-playwright/chromium-*/chrome-linux64/chrome"))
    if not c:
        raise SystemExit("no playwright chromium found")
    return c[-1]


def data_uri(p: str) -> str:
    b = Path(p).read_bytes()
    ext = "png" if Path(p).suffix.lower() == ".png" else "jpeg"
    return f"data:image/{ext};base64," + base64.b64encode(b).decode()


def logo_uri() -> str:
    for p in (Path(__file__).resolve().parents[3] / "apps/web/public/logo.png",
              Path("/root/emart-platform/apps/web/public/logo.png"),
              Path("/var/www/emart-platform/apps/web/public/logo.png")):
        if p.exists():
            return data_uri(str(p))
    return ""


def esc(t: str) -> str:
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def html(persona, product, label):
    persona_uri = data_uri(persona)
    product_uri = data_uri(product)
    logo = logo_uri()
    logo_block = f'<img class="logo" src="{logo}">' if logo else ''
    label_block = f'<div class="label">{esc(label)}</div>' if label else ''
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box;}}
html,body{{width:{W}px;height:{H}px;font-family:{FONT};overflow:hidden;background:{INK};}}
.bg{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}}
.scrim{{position:absolute;inset:0;background:linear-gradient(180deg,
  rgba(0,0,0,0) 38%,rgba(20,4,12,0.20) 58%,rgba(20,4,12,0.82) 100%);}}
.logo{{position:absolute;top:54px;left:54px;width:104px;height:104px;border-radius:22px;
  box-shadow:0 8px 24px rgba(0,0,0,0.4);}}
.label{{position:absolute;top:78px;right:54px;font-size:34px;font-weight:800;color:#fff;
  background:{ROSE};border-radius:30px;padding:12px 30px;box-shadow:0 8px 24px rgba(0,0,0,0.35);}}
.tile{{position:absolute;left:50%;bottom:150px;transform:translateX(-50%);
  width:560px;background:#fff;border-radius:36px;padding:26px;
  box-shadow:0 26px 70px rgba(0,0,0,0.55);border:4px solid {GOLD};}}
.tile img{{width:100%;height:520px;object-fit:contain;display:block;}}
</style></head><body>
<img class="bg" src="{persona_uri}">
<div class="scrim"></div>
{logo_block}{label_block}
<div class="tile"><img src="{product_uri}"></div>
</body></html>"""


def render(persona, product, label, out):
    hp = Path(tempfile.mktemp(suffix=".html"))
    hp.write_text(html(persona, product, label), encoding="utf-8")
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
        raise SystemExit("presenter card render failed")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--persona", required=True)
    ap.add_argument("--product", required=True)
    ap.add_argument("--label", default="")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    print(render(a.persona, a.product, a.label, a.out))


if __name__ == "__main__":
    main()
