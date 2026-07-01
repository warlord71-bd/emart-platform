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
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
WORKSPACE = ROOT.parent
REQUESTS = ROOT / "generated-assets" / "model-shots" / "requests"
HOLDING = ROOT / "generated-assets" / "model-shots" / "holding"
EXTERNAL = ROOT / "generated-assets" / "model-shots" / "external"
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

    if getattr(emit_request, "_render_external_free", False) and ok and (force or not out_img.exists()):
        render_external_free_composite(
            product=product,
            product_image=str(product_image),
            out=str(out_img),
            persona=persona,
            seed=getattr(emit_request, "_external_seed", None),
            prompt_note=getattr(emit_request, "_external_prompt_note", ""),
        )
        request["status"] = "fulfilled"
        request["fulfilled_by"] = "pollinations_free_plus_exact_product_composite"
        request["fulfilled_at"] = datetime.now().isoformat(timespec="seconds")
        request["force_render"] = bool(force)
        if "pollinations_free_plus_exact_product_composite" not in request["fulfillment_modes"]:
            request["fulfillment_modes"].append("pollinations_free_plus_exact_product_composite")

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


def _open_image(value: str):
    from PIL import Image
    import io

    if is_url(value):
        req = Request(value, headers={"User-Agent": "EmartModelShot/1.0"})
        with urlopen(req, timeout=90) as resp:
            return Image.open(io.BytesIO(resp.read())).convert("RGBA")
    return Image.open(value).convert("RGBA")


def _cover(img, size: tuple[int, int]):
    from PIL import Image

    w, h = img.size
    tw, th = size
    scale = max(tw / w, th / h)
    nw, nh = int(w * scale), int(h * scale)
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, (nw - tw) // 2)
    top = max(0, (nh - th) // 2)
    return img.crop((left, top, left + tw, top + th))


def _pollinations_prompt(product: str, persona: str, prompt_note: str = "") -> str:
    look = PERSONA_LOOK.get(persona, PERSONA_LOOK["nusrat"])
    return (
        f"Photorealistic vertical 9:16 beauty ad portrait, {look}, clean warm studio lighting, "
        "modest fully covered neckline and sleeves, upper body composition, one hand open near "
        "the right side of the frame in a natural presentation pose, empty hand only, leave clean "
        "space near the hand for the real product layer, no product, no bottle, "
        "no text, no logo, no watermark, no poster graphics, natural fingers, elegant skincare ad. "
        f"Product to be composited later by system: {product}. {prompt_note}".strip()
    )


def _fetch_pollinations_base(prompt: str, out: Path, seed: int | None = None) -> Path:
    EXTERNAL.mkdir(parents=True, exist_ok=True)
    qs = f"width=1080&height=1920&model=flux&nologo=true"
    if seed is not None:
        qs += f"&seed={int(seed)}"
    url = f"https://image.pollinations.ai/prompt/{quote(prompt)}?{qs}"
    try:
        req = Request(url, headers={"User-Agent": "EmartModelShot/1.0"})
        with urlopen(req, timeout=120) as resp:
            data = resp.read()
        out.write_bytes(data)
    except Exception as exc:
        curl = subprocess.run(
            ["curl", "-L", "--fail", "--max-time", "180", "-A", "EmartModelShot/1.0", "-o", str(out), url],
            check=False,
            capture_output=True,
            text=True,
        )
        if curl.returncode != 0 or not out.exists() or out.stat().st_size < 1024:
            raise RuntimeError(
                f"pollinations_fetch_failed: urllib={exc!r}; curl={curl.stderr.strip()}"
            ) from exc
    return out


def render_external_free_composite(
    *,
    product: str,
    product_image: str,
    out: str,
    persona: str = "nusrat",
    seed: int | None = None,
    prompt_note: str = "",
) -> str:
    """Free external lane: generate human/background outside, keep product identity local.

    Pollinations provides a no-key model/person pose. The exact real product image is then
    composited locally, so the outside model never invents packaging or label text.
    """
    from PIL import Image, ImageDraw, ImageFilter

    key = key_for(product, persona)
    raw_path = EXTERNAL / f"{key}-pollinations-base.jpg"
    prompt = _pollinations_prompt(product, persona, prompt_note)
    _fetch_pollinations_base(prompt, raw_path, seed=seed)

    base = _cover(_open_image(str(raw_path)).convert("RGBA"), (1080, 1920))
    prod = _open_image(product_image)
    target_h = 650
    target_w = round(prod.width * target_h / prod.height)
    prod = prod.resize((target_w, target_h), Image.Resampling.LANCZOS)
    px, py = 675, 760

    veil = Image.new("RGBA", base.size, (0, 0, 0, 0))
    vd = ImageDraw.Draw(veil)
    vd.ellipse((595, 575, 1115, 1495), fill=(248, 228, 206, 58))
    veil = veil.filter(ImageFilter.GaussianBlur(30))
    base.alpha_composite(veil)

    shadow_mask = prod.split()[-1].filter(ImageFilter.GaussianBlur(18))
    shadow = Image.new("RGBA", prod.size, (0, 0, 0, 90))
    shadow.putalpha(shadow_mask)
    base.alpha_composite(shadow, (px + 20, py + 24))

    plate = Image.new("RGBA", base.size, (0, 0, 0, 0))
    pd = ImageDraw.Draw(plate)
    pd.rounded_rectangle((px - 34, py + 500, px + target_w + 34, py + 618), radius=42, fill=(255, 244, 238, 118))
    plate = plate.filter(ImageFilter.GaussianBlur(1.2))
    base.alpha_composite(plate)
    base.alpha_composite(prod, (px, py))

    result = Path(out)
    result.parent.mkdir(parents=True, exist_ok=True)
    base.convert("RGB").save(result, "PNG", optimize=True)
    sidecar = {
        "provider": "pollinations_free_plus_exact_product_composite",
        "composition_mode": "model_presenting_exact_product",
        "prompt": prompt,
        "base_image": str(raw_path),
        "product_image_reference": product_image,
        "product_layer_owned_by": "emart_local_compositor",
        "checks": {
            "outside_provider_may_generate_model_only": True,
            "outside_provider_may_generate_product_label": False,
            "woocommerce_write": False,
            "meta_publish": False,
        },
    }
    (result.with_suffix(".provider.json")).write_text(json.dumps(sidecar, ensure_ascii=False, indent=2))
    return str(result)


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
    ap.add_argument("--render-external-free", action="store_true",
                    help="use no-key Pollinations for model/background, then locally composite exact product")
    ap.add_argument("--external-seed", type=int, default=None)
    ap.add_argument("--external-prompt-note", default="")
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
        emit_request._render_external_free = bool(args.render_external_free)
        emit_request._external_seed = args.external_seed
        emit_request._external_prompt_note = args.external_prompt_note
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
