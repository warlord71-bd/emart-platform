#!/usr/bin/env python3
"""
Compatibility shim for the shared Creative Asset Engine scene_value format.
"""
from __future__ import annotations
import argparse, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from workspace_creative_engine import CreativeRequest, render as render_creative  # noqa: E402


def render(kicker, title, bullets, style, footer, out):
    result = render_creative(CreativeRequest(
        product={"id": 0, "name": title, "categories": [{"name": "Skincare", "slug": "skincare"}]},
        format="scene_value",
        value_spec={
            "kicker": kicker,
            "title": title,
            "bullets": bullets[:6],
            "style": style,
            "footer": footer,
        },
        out=out,
    ))
    return result.asset_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--kicker", default="জেনে নিন")
    ap.add_argument("--title", required=True)
    ap.add_argument("--bullet", action="append", dest="bullets", required=True)
    ap.add_argument("--style", default="numbered", choices=("numbered", "check", "tip"))
    ap.add_argument("--footer", default="E-MART.COM.BD · COD")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    print(render(a.kicker, a.title, a.bullets, a.style, a.footer, a.out))


if __name__ == "__main__":
    main()
