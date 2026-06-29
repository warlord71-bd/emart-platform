#!/usr/bin/env python3
"""
CLI entrypoint:
  python3 -m creative_engine --product-id 26134 --format post_1x1
  python3 -m creative_engine --product-id 26134 --format post_4x5 --variant podium
"""
import argparse, json
from .api import render, CreativeRequest

def main():
    ap = argparse.ArgumentParser(description="Emart Creative Asset Engine")
    ap.add_argument("--product-id", type=int, required=True)
    ap.add_argument("--format", default="post_1x1", choices=[
        "post_1x1", "post_4x5", "hero_vertical", "model_holding_real_product", "scene_value", "scene_brand_end",
        "blog_og_1200x630"])
    ap.add_argument("--variant", default="studio", choices=[
        "studio", "podium", "hijabi-lifestyle", "model-scene"])
    ap.add_argument("--badge", default="SHOP NOW")
    ap.add_argument("--background", default="studio_ai", choices=[
        "studio_ai", "external_file", "gradient", "solid"])
    ap.add_argument("--background-file", default=None)
    ap.add_argument("--locale", default="en", choices=["en", "bn"])
    ap.add_argument("--image-override", default=None,
        help="URL or local path to use instead of WC product image (for higher quality)")
    ap.add_argument("--title", default=None,
        help="Title for scene_value or blog_og_1200x630")
    ap.add_argument("--kicker", default=None,
        help="Kicker/badge for scene_value or blog_og_1200x630")
    ap.add_argument("--bullet", action="append", default=[],
        help="Bullet for scene_value; repeat up to 6 times")
    ap.add_argument("--bangla", default=None,
        help="Bangla support line for hero_vertical or scene_brand_end")
    ap.add_argument("--no-qa", action="store_true")
    ap.add_argument("--render-scale", type=int, default=2, choices=[1, 2, 3],
        help="Internal screenshot scale before downsampling. 2 is sharper for AMOLED/iPhone.")
    ap.add_argument("--out", default=None)
    a = ap.parse_args()

    req = CreativeRequest(
        product_id=a.product_id,
        format=a.format,
        variant=a.variant,
        badge=a.badge,
        background=a.background,
        background_file=a.background_file,
        image_override=a.image_override,
        locale=a.locale,
        value_spec={
            k: v for k, v in {
                "title": a.title,
                "kicker": a.kicker,
                "badge": a.kicker,
                "bullets": a.bullet,
                "bangla": a.bangla,
            }.items() if v
        },
        qa=not a.no_qa,
        render_scale=a.render_scale,
        out=a.out,
    )
    result = render(req)
    print(json.dumps({
        "asset_path": result.asset_path,
        "width": result.width,
        "height": result.height,
        "format": result.format,
        "variant": result.variant,
        "render_scale": result.render_scale,
        "product": result.product_snapshot,
        "qa": result.qa_report,
        "tokens_version": result.tokens_version,
    }, indent=2))

if __name__ == "__main__":
    main()
