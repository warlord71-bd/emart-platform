#!/usr/bin/env python3
"""
Content Orchestrator model-shot service.

Owns the cron-safe handoff for "model holding exact real product" assets:

  orchestrator plan/dispatch or video producer
      -> emit a request with the real product image
      -> optionally render a system composite through Creative Engine
      -> save output + metadata under generated-assets/model-shots/
      -> owner review gate before campaign use

This file does not publish and does not write Woo data.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
WORKSPACE = ROOT.parent
REQUESTS = ROOT / "generated-assets" / "model-shots" / "requests"
HOLDING = ROOT / "generated-assets" / "model-shots" / "holding"
META = ROOT / "generated-assets" / "model-shots" / "metadata"
DEFAULT_PERSONA_IMAGE = ROOT / "video-engine" / "personas" / "emart-model" / "clean-portrait.png"

PERSONA_LOOK = {
    "dr-rumana": (
        "a 32-year-old Bangladeshi woman, warm medium-tan natural skin, sleek low bun "
        "of black hair, gentle confident smile, soft sage-green modest high-neck blouse"
    ),
    "nusrat": (
        "a 23-year-old Bangladeshi woman, warm light-brown natural skin, long wavy dark "
        "hair worn down, bright friendly smile, simple pastel casual top"
    ),
    "ayesha-hijabi": (
        "a 25-year-old Bangladeshi woman in a neatly draped warm rose-beige hijab, warm "
        "medium skin, gentle smile, modest elegant styling"
    ),
}


def slugify(value: str, limit: int = 56) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (value or "").lower()).strip("-")
    return slug[:limit] or "product"


def key_for(product: str, persona: str = "dr-rumana") -> str:
    return f"{slugify(persona, 24)}__{slugify(product)}"


def is_url(value: str | None) -> bool:
    if not value:
        return False
    return urlparse(str(value)).scheme in {"http", "https"}


def build_prompt(product: str, persona: str = "dr-rumana") -> str:
    look = PERSONA_LOOK.get(persona, PERSONA_LOOK["dr-rumana"])
    return (
        f"Photorealistic vertical 9:16 beauty portrait. {look}, holding the skincare product "
        f"'{product}' beside her cheek with the product front facing the camera. The model/background "
        f"may be generated, but the visible product must come from the supplied real product reference. "
        f"Do not invent replacement packaging, label text, logo, claims, offer text, price, COD badge, "
        f"watermark, poster border, or callouts. Natural hand anatomy, product not distorted, product "
        f"clear enough for owner identity review."
    )


def _rel(path: Path | str) -> str:
    p = Path(path)
    try:
        return str(p.resolve().relative_to(Path.cwd().resolve()))
    except Exception:
        return str(path)


def _product_ref_ok(product_image: str | None) -> tuple[bool, str]:
    if not product_image:
        return False, "missing_product_image"
    if is_url(product_image):
        return True, "url_reference"
    if Path(product_image).exists():
        return True, "local_reference"
    return False, "product_image_not_found"


def emit_request(
    *,
    product: str,
    persona: str = "dr-rumana",
    product_image: str | None = None,
    product_id: int | None = None,
    source: str = "content-orchestrator",
    render_composite: bool = False,
    force: bool = False,
    label: str = "Original product",
    bangla: str = "",
) -> dict:
    REQUESTS.mkdir(parents=True, exist_ok=True)
    HOLDING.mkdir(parents=True, exist_ok=True)
    META.mkdir(parents=True, exist_ok=True)

    key = key_for(product, persona)
    out_img = HOLDING / f"{key}.png"
    meta_path = META / f"{key}.json"
    req_path = REQUESTS / f"{key}.json"
    ok, ref_status = _product_ref_ok(product_image)

    status = "fulfilled" if out_img.exists() else ("ready_to_generate" if ok else "blocked")
    request = {
        "request_id": key,
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "status": status,
        "publish_gate": "owner_review_required",
        "source": source,
        "product": product,
        "product_id": product_id,
        "persona": persona,
        "product_image_reference": product_image or "",
        "product_reference_status": ref_status,
        "size": "1080x1920",
        "asset_type": "model_holding_real_product",
        "fulfillment_modes": ["system_composite", "codex_imagegen"],
        "prompt": build_prompt(product, persona),
        "output_path": str(out_img),
        "metadata_path": str(meta_path),
        "instructions": (
            "Use a generated/model background if needed, but keep the final product layer grounded "
            "in product_image_reference. No price/COD/brand overlay text inside the raw model shot. "
            "Owner review is required before campaign use."
        ),
    }

    if render_composite and ok and (force or not out_img.exists()):
        render_system_composite(
            product=product,
            product_image=str(product_image),
            out=str(out_img),
            label=label,
            bangla=bangla,
        )
        request["status"] = "fulfilled"
        request["fulfilled_by"] = "system_composite"
        request["fulfilled_at"] = datetime.now().isoformat(timespec="seconds")
        request["force_render"] = bool(force)

    req_path.write_text(json.dumps(request, ensure_ascii=False, indent=2))
    meta = {
        "asset": str(out_img),
        "request": str(req_path),
        "status": request["status"],
        "publish_gate": request["publish_gate"],
        "product": product,
        "product_id": product_id,
        "product_image_reference": product_image or "",
        "checks": {
            "product_reference_available": ok,
            "embedded_price_or_offer_text_allowed": False,
            "woocommerce_write": False,
            "meta_publish": False,
        },
    }
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    return {**request, "request_path": str(req_path)}


def render_system_composite(*, product: str, product_image: str, out: str, label: str, bangla: str = "") -> str:
    sys.path.insert(0, str(WORKSPACE))
    from workspace_creative_engine import CreativeRequest, render

    snapshot = {
        "id": 0,
        "name": product,
        "price": "",
        "regular_price": "",
        "images": [{"src": product_image}],
        "brands": [],
        "categories": [{"name": "Skincare", "slug": "skincare"}],
        "attributes": [],
    }
    render(
        CreativeRequest(
            product=snapshot,
            format="model_holding_real_product",
            image_override=product_image,
            product_cutout=True,
            value_spec={
                "persona_image": str(DEFAULT_PERSONA_IMAGE),
                "label": label,
                "bangla": bangla,
                "clean_asset": True,
            },
            render_scale=1,
            out=out,
        )
    )
    return out


def list_pending() -> list[dict]:
    REQUESTS.mkdir(parents=True, exist_ok=True)
    pending = []
    for path in sorted(REQUESTS.glob("*.json")):
        data = json.loads(path.read_text())
        if not Path(data.get("output_path", "")).exists():
            pending.append({**data, "request_path": str(path)})
    print(json.dumps(pending, ensure_ascii=False, indent=2))
    return pending


def status() -> dict:
    REQUESTS.mkdir(parents=True, exist_ok=True)
    reqs = sorted(REQUESTS.glob("*.json"))
    fulfilled = 0
    blocked = 0
    for path in reqs:
        data = json.loads(path.read_text())
        if Path(data.get("output_path", "")).exists():
            fulfilled += 1
        elif data.get("status") == "blocked":
            blocked += 1
    result = {
        "requests": len(reqs),
        "fulfilled": fulfilled,
        "pending": len(reqs) - fulfilled - blocked,
        "blocked": blocked,
        "request_dir": str(REQUESTS),
        "holding_dir": str(HOLDING),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


def main() -> None:
    ap = argparse.ArgumentParser(description="Content Orchestrator model-shot service")
    ap.add_argument("--emit", action="store_true", help="write/update one model-shot request")
    ap.add_argument("--list", action="store_true", help="print pending requests")
    ap.add_argument("--status", action="store_true", help="print request counts")
    ap.add_argument("--render-composite", action="store_true", help="render system composite immediately")
    ap.add_argument("--force", action="store_true", help="overwrite an existing output when rendering")
    ap.add_argument("--product")
    ap.add_argument("--product-id", type=int)
    ap.add_argument("--persona", default="dr-rumana")
    ap.add_argument("--product-image", default=None)
    ap.add_argument("--source", default="manual")
    ap.add_argument("--label", default="Original product")
    ap.add_argument("--bangla", default="")
    args = ap.parse_args()

    if args.emit:
        if not args.product:
            ap.error("--emit needs --product")
        result = emit_request(
            product=args.product,
            persona=args.persona,
            product_image=args.product_image,
            product_id=args.product_id,
            source=args.source,
            render_composite=args.render_composite,
            force=args.force,
            label=args.label,
            bangla=args.bangla,
        )
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.list:
        list_pending()
    elif args.status:
        status()
    else:
        ap.error("pass --emit, --list, or --status")


if __name__ == "__main__":
    main()
