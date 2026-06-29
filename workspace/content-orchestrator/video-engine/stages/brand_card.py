#!/usr/bin/env python3
"""
Compatibility shim for the shared Creative Asset Engine scene_brand_end format.
"""
from __future__ import annotations
import argparse, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from workspace_creative_engine import CreativeRequest, render as render_creative  # noqa: E402


def product_payload(product: str, price: str, original: str) -> dict:
    return {
        "id": 0,
        "name": product,
        "price": price,
        "regular_price": original or price,
        "sale_price": price if original and original != price else "",
        "categories": [{"name": "Skincare", "slug": "skincare"}],
    }


def render(product, price, original, tagline, bangla, url, out):
    result = render_creative(CreativeRequest(
        product=product_payload(product, price, original),
        format="scene_brand_end",
        value_spec={"product": product, "bangla": bangla, "url": url},
        out=out,
    ))
    return result.asset_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--product", required=True)
    ap.add_argument("--price", default="")
    ap.add_argument("--original-price", dest="original", default="")
    ap.add_argument("--tagline", default="Global Beauty. Local Trust.")
    ap.add_argument("--bangla", default="")
    ap.add_argument("--url", default="E-MART.COM.BD")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    print(render(a.product, a.price, a.original, a.tagline, a.bangla, a.url, a.out))


if __name__ == "__main__":
    main()
