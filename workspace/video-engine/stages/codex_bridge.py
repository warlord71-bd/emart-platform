#!/usr/bin/env python3
"""
Codex image bridge — automated request/fulfilment handoff for "model holding the real product" shots.

The engine can't run Codex, but it CAN hand Codex a complete, machine-readable work order every time:
a full image prompt + the real product reference + the exact output path + size. Codex drains the
queue, generates each image with its own image-gen, and saves it to `output_path`. The engine then
auto-consumes it (file existence = fulfilled). No manual step per asset.

Request file: workspace/video-engine/codex-assets/requests/<key>.json
Fulfilled image: workspace/video-engine/codex-assets/holding/<key>.png   (Codex writes this)

CLI:
  codex_bridge.py --emit --product "..." [--persona dr-rumana] [--product-image PATH]   # engine side
  codex_bridge.py --list            # Codex side: print pending work orders (prompt + output path)
  codex_bridge.py --status          # show pending vs fulfilled counts
"""
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REQ_DIR = ROOT / "codex-assets" / "requests"
OUT_DIR = ROOT / "codex-assets" / "holding"

PERSONA_LOOK = {
    "dr-rumana": "a 32-year-old Bangladeshi woman, warm medium-tan natural skin (not whitened), sleek low "
                 "bun of black hair, gentle confident smile, soft sage-green modest high-neck blouse",
    "nusrat": "a 23-year-old Bangladeshi woman, warm light-brown glowing skin (not whitened), long wavy "
              "dark hair worn down, bright friendly smile, simple pastel casual top",
    "ayesha-hijabi": "a 25-year-old Bangladeshi woman in a neatly draped warm rose-beige hijab, warm "
                     "medium skin (not whitened), gentle smile, modest elegant styling",
}


def key_for(product: str, persona: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", product.lower()).strip("-")[:48]
    return f"{persona}__{slug}"


def build_prompt(product: str, persona: str) -> str:
    look = PERSONA_LOOK.get(persona, PERSONA_LOOK["dr-rumana"])
    return (
        f"Photorealistic vertical 9:16 beauty portrait. {look}, holding the skincare product "
        f"'{product}' up beside her cheek with the product clearly facing the camera and recognizable. "
        f"Soft studio lighting, clean minimal warm background, premium commercial campaign photography. "
        f"IMPORTANT: a CLEAN photo only — NO added text, NO logos, NO watermark, NO poster graphics, "
        f"NO edge callouts, NO borders. Natural fingers around the product, no distorted hands. "
        f"Frame head-to-chest, product and face both fully inside the frame."
    )


def emit(product: str, persona: str, product_image: str | None) -> Path:
    REQ_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    key = key_for(product, persona)
    out_img = OUT_DIR / f"{key}.png"
    req = REQ_DIR / f"{key}.json"
    if out_img.exists():
        return out_img  # already fulfilled
    req.write_text(json.dumps({
        "request_id": key,
        "status": "pending",
        "product": product,
        "persona": persona,
        "product_image_reference": product_image or "",
        "size": "1080x1920",
        "prompt": build_prompt(product, persona),
        "output_path": str(out_img),
        "instructions": "Generate the image per 'prompt', referencing 'product_image_reference' for the "
                        "real product look, and SAVE it to 'output_path' (1080x1920). Then this request "
                        "is fulfilled (the engine detects the file).",
    }, ensure_ascii=False, indent=2))
    return out_img  # not yet present; engine proceeds without and reuses once Codex fills it


def list_pending():
    REQ_DIR.mkdir(parents=True, exist_ok=True)
    pending = []
    for r in sorted(REQ_DIR.glob("*.json")):
        spec = json.loads(r.read_text())
        if not Path(spec["output_path"]).exists():
            pending.append(spec)
    print(json.dumps(pending, ensure_ascii=False, indent=2))
    return pending


def status():
    REQ_DIR.mkdir(parents=True, exist_ok=True)
    reqs = list(REQ_DIR.glob("*.json"))
    done = sum(1 for r in reqs if Path(json.loads(r.read_text())["output_path"]).exists())
    print(f"requests: {len(reqs)} | fulfilled: {done} | pending: {len(reqs) - done}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--emit", action="store_true")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--status", action="store_true")
    ap.add_argument("--product")
    ap.add_argument("--persona", default="dr-rumana")
    ap.add_argument("--product-image", default=None)
    a = ap.parse_args()
    if a.emit:
        if not a.product:
            sys.exit("--emit needs --product")
        print(emit(a.product, a.persona, a.product_image))
    elif a.list:
        list_pending()
    elif a.status:
        status()
    else:
        ap.error("pass --emit / --list / --status")


if __name__ == "__main__":
    main()
