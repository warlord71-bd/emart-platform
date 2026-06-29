#!/usr/bin/env python3
"""
Emart Social Media Image Generator — thin shim over creative_engine.

Same CLI as before. All composition, tokens, QA, and rendering now live in
workspace/content-orchestrator/creative-engine/. This file is kept for backward
compatibility so existing Codex/agent calls don't break.

Usage (unchanged):
  python3 social_image_gen.py --product-id 2591
  python3 social_image_gen.py --product-id 2591 --badge "BESTSELLER"
  python3 social_image_gen.py --product-id 2591 --out apps/web/public/images/social/2026-06-25/foo.png
  python3 social_image_gen.py --product-id 2591 --creative-style podium
  python3 social_image_gen.py --product-id 2591 --format 4x5
  python3 social_image_gen.py --product-id 2591 --image-override https://example.com/better.png
  python3 social_image_gen.py --product-id 2591 --render-scale 2
"""
import argparse, json, sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from workspace_creative_engine import render, CreativeRequest

TIMESTAMP = datetime.now().strftime("%Y%m%d-%H%M%S")
OUTPUT_DIR = Path("workspace/audit/active/social")

VARIANT_MAP = {
    "studio": "studio",
    "podium": "podium",
    "hijabi-lifestyle": "hijabi-lifestyle",
}

FORMAT_MAP = {
    "1x1": "post_1x1",
    "4x5": "post_4x5",
    "square": "post_1x1",
    "portrait": "post_4x5",
}


def main():
    parser = argparse.ArgumentParser(description="Emart Social Image Generator")
    parser.add_argument("--product-id", type=int, required=True)
    parser.add_argument("--badge", default="SHOP NOW")
    parser.add_argument("--allow-model-scene", action="store_true",
        help="Allow AI model scenes for small products. Default is real product composite only.")
    parser.add_argument("--creative-style", choices=("studio", "hijabi-lifestyle", "podium"),
        default="studio")
    parser.add_argument("--format", choices=("1x1", "4x5", "square", "portrait"),
        default="1x1", help="Output format: 1x1 (1080x1080 FB) or 4x5 (1080x1350 IG)")
    parser.add_argument("--background-file", type=Path,
        help="Optional AI/background image file to use behind the real product.")
    parser.add_argument("--image-override", type=str, default=None,
        help="URL or local path to use instead of WC product image (for higher quality)")
    parser.add_argument("--render-scale", type=int, choices=(1, 2, 3), default=2,
        help="Internal screenshot scale before downsampling. 2 is sharper for AMOLED/iPhone.")
    parser.add_argument("--out", type=Path,
        help="Optional final output path (.png/.jpg). Parent directory is created.")
    args = parser.parse_args()

    variant = VARIANT_MAP.get(args.creative_style, "studio")
    if args.allow_model_scene:
        variant = "model-scene"

    fmt = FORMAT_MAP.get(args.format, "post_1x1")

    output_file = args.out or (OUTPUT_DIR / f"product-{args.product_id}-{TIMESTAMP}.png")
    output_file.parent.mkdir(parents=True, exist_ok=True)

    req = CreativeRequest(
        product_id=args.product_id,
        format=fmt,
        variant=variant,
        badge=args.badge,
        background_file=str(args.background_file) if args.background_file else None,
        image_override=args.image_override,
        render_scale=args.render_scale,
        out=str(output_file),
    )

    print(f"Fetching product {args.product_id}...")
    result = render(req)
    dims = f"{result.width}x{result.height}"
    print(f"  {result.product_snapshot.get('name', '')}")
    print(f"  Mode: CREATIVE ENGINE ({result.variant})")
    print(f"  Render scale: {result.render_scale}x")
    print(f"  Rendering screenshot...")
    print(f"Done: {result.asset_path} ({dims})")

    if not result.qa_report.get("passed", True):
        print(f"  QA issues: {'; '.join(result.qa_report.get('issues', []))}", file=sys.stderr)


if __name__ == "__main__":
    main()
