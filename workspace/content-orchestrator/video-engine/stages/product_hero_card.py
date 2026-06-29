#!/usr/bin/env python3
"""
Compatibility shim for the shared Creative Asset Engine hero_vertical format.
"""
from __future__ import annotations
import argparse, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from workspace_creative_engine import CreativeRequest, render as render_creative  # noqa: E402


def product_payload(product: str, price: str, original: str, image: str) -> dict:
    return {
        "id": 0,
        "name": product,
        "price": price,
        "regular_price": original or price,
        "sale_price": price if original and original != price else "",
        "images": [{"src": image}] if image else [],
        "categories": [{"name": "Skincare", "slug": "skincare"}],
    }


def render(product: str, price: str, original: str, product_image: str, bangla: str, badge: str, out: str) -> str:
    result = render_creative(CreativeRequest(
        product=product_payload(product, price, original, product_image),
        format="hero_vertical",
        badge=badge,
        image_override=product_image,
        locale="bn",
        value_spec={"bangla": bangla},
        out=out,
    ))
    return result.asset_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--product", required=True)
    ap.add_argument("--price", default="")
    ap.add_argument("--original-price", default="")
    ap.add_argument("--product-image", required=True)
    ap.add_argument("--bangla", default="")
    ap.add_argument("--badge", default="Daily Pick")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    print(render(a.product, a.price, a.original_price, a.product_image, a.bangla, a.badge, a.out))


if __name__ == "__main__":
    main()
