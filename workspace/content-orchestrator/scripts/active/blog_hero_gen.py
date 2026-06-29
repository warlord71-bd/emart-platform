#!/usr/bin/env python3
"""Generate branded blog hero images (1200x630) and optionally upload to WordPress.

Uses the Creative Engine's blog_og_1200x630 format to produce branded OG images
instead of raw product photos.

Usage:
    # Generate from product ID
    python3 blog_hero_gen.py --product-id 2591 --title "Best Snail Mucin Products"

    # Generate + upload to WP as featured image for a post
    python3 blog_hero_gen.py --product-id 2591 --title "Best Snail Mucin" --post-id 94840

    # Generate for a WP post (auto-detect title, pick product from category)
    python3 blog_hero_gen.py --post-id 94840

    # Batch: generate for all posts missing featured images
    python3 blog_hero_gen.py --backfill --limit 10 --dry-run

Output: workspace/audit/active/blog-heroes/<slug>.png
"""

import argparse, json, os, re, sys, base64
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "workspace"))

OUTPUT_DIR = ROOT / "workspace" / "audit" / "active" / "blog-heroes"

WP_BASE = "https://e-mart.com.bd"

CATEGORY_TO_WC = {
    "skincare": 806, "kbeauty": 3529, "korean-skincare-routine": 3529,
    "acne": 7999, "j-beauty-skincare": 7976, "cosmetics-ingredients": 7996,
    "men-skincare": 9677,
}


def _load_creds():
    if not hasattr(_load_creds, "_mod"):
        sys.path.insert(0, "/root/.openclaw/workspace-emart")
        import importlib
        _load_creds._mod = importlib.import_module("creds")
    return _load_creds._mod


def _wp_auth():
    c = _load_creds()
    return base64.b64encode(f"{c.WP_USER}:{c.WP_PASS}".encode()).decode()


def _wc_auth():
    c = _load_creds()
    return (c.WC_KEY, c.WC_SECRET)


def get_post(post_id: int) -> dict | None:
    import requests
    r = requests.get(
        f"{WP_BASE}/wp-json/wp/v2/posts/{post_id}",
        headers={"Authorization": f"Basic {_wp_auth()}"},
        params={"_fields": "id,title,slug,categories,featured_media"},
        timeout=15,
    )
    if r.ok:
        return r.json()
    return None


def pick_product_for_category(wc_category_id: int) -> dict | None:
    import requests, urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    try:
        r = requests.get(
            "https://127.0.0.1/wp-json/wc/v3/products",
            auth=_wc_auth(),
            headers={"Host": "e-mart.com.bd", "X-Forwarded-Proto": "https"},
            params={"category": wc_category_id, "per_page": 1, "orderby": "popularity",
                    "order": "desc", "status": "publish"},
            timeout=15, verify=False, allow_redirects=False,
        )
        if r.ok and r.json():
            return r.json()[0]
    except Exception as e:
        print(f"  WC product fetch failed: {e}")
    return None


def render_blog_hero(title: str, product_id: int | None = None, badge: str = "SKINCARE GUIDE",
                     product: dict | None = None, out: str | None = None) -> str | None:
    from workspace_creative_engine import render, CreativeRequest

    req = CreativeRequest(
        product_id=product_id,
        product=product,
        format="blog_og_1200x630",
        badge=badge,
        value_spec={"title": title, "badge": badge},
        qa=False,
        render_scale=1,
        out=out,
    )
    try:
        result = render(req)
        return result.asset_path
    except Exception as e:
        print(f"  Render failed: {e}")
        return None


def upload_to_wp(image_path: str, alt_text: str) -> int | None:
    import requests
    with open(image_path, "rb") as f:
        img_data = f.read()

    filename = re.sub(r"[^a-z0-9]", "-", alt_text.lower())[:40] + ".png"
    r = requests.post(
        f"{WP_BASE}/wp-json/wp/v2/media",
        headers={
            "Authorization": f"Basic {_wp_auth()}",
            "Content-Type": "image/png",
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
        data=img_data, timeout=30,
    )
    if r.ok:
        media_id = r.json().get("id")
        if media_id:
            requests.post(
                f"{WP_BASE}/wp-json/wp/v2/media/{media_id}",
                headers={"Authorization": f"Basic {_wp_auth()}", "Content-Type": "application/json"},
                json={"alt_text": alt_text},
                timeout=10,
            )
        return media_id
    print(f"  Upload failed: {r.status_code} {r.text[:100]}")
    return None


def set_featured_image(post_id: int, media_id: int) -> bool:
    import requests
    r = requests.post(
        f"{WP_BASE}/wp-json/wp/v2/posts/{post_id}",
        headers={"Authorization": f"Basic {_wp_auth()}", "Content-Type": "application/json"},
        json={"featured_media": media_id},
        timeout=15,
    )
    return r.ok


def get_posts_without_featured(limit: int = 50) -> list[dict]:
    import requests
    posts = []
    page = 1
    while len(posts) < limit:
        r = requests.get(
            f"{WP_BASE}/wp-json/wp/v2/posts",
            headers={"Authorization": f"Basic {_wp_auth()}"},
            params={"per_page": 20, "page": page, "_fields": "id,title,slug,categories,featured_media",
                    "status": "publish"},
            timeout=15,
        )
        if not r.ok or not r.json():
            break
        for p in r.json():
            if not p.get("featured_media"):
                posts.append(p)
                if len(posts) >= limit:
                    break
        page += 1
        if page > 10:
            break
    return posts


def detect_badge(title: str) -> str:
    title_lower = title.lower()
    if "best" in title_lower or "top" in title_lower:
        return "BEST PICKS"
    if "routine" in title_lower or "step" in title_lower:
        return "SKINCARE ROUTINE"
    if "review" in title_lower:
        return "PRODUCT REVIEW"
    if "vs" in title_lower or "compare" in title_lower:
        return "COMPARISON"
    if "ingredient" in title_lower or "guide" in title_lower:
        return "SKINCARE GUIDE"
    return "SKINCARE GUIDE"


def main():
    ap = argparse.ArgumentParser(description="Generate branded blog hero images (1200x630)")
    ap.add_argument("--product-id", type=int, help="WooCommerce product ID for the hero image")
    ap.add_argument("--title", help="Blog post title (used as headline on the image)")
    ap.add_argument("--badge", help="Badge text (auto-detected from title if omitted)")
    ap.add_argument("--post-id", type=int, help="WP post ID — auto-detect title and upload as featured")
    ap.add_argument("--backfill", action="store_true", help="Generate heroes for posts missing featured images")
    ap.add_argument("--limit", type=int, default=10, help="Max posts to backfill")
    ap.add_argument("--dry-run", action="store_true", help="Generate images but don't upload to WP")
    ap.add_argument("--out", help="Output path (default: blog-heroes/<slug>.png)")
    args = ap.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.backfill:
        print(f"Backfilling up to {args.limit} posts without featured images...")
        posts = get_posts_without_featured(args.limit)
        print(f"Found {len(posts)} posts without featured images")
        for p in posts:
            title = p["title"]["rendered"]
            slug = p.get("slug", "unknown")
            post_id = p["id"]
            print(f"\n[{post_id}] {title[:60]}")

            badge = detect_badge(title)
            wc_cat = 806
            for cat_id in p.get("categories", []):
                for name, wc in CATEGORY_TO_WC.items():
                    if cat_id == CATEGORY_TO_WC.get(name):
                        wc_cat = wc
                        break

            product = pick_product_for_category(wc_cat)
            out_path = str(OUTPUT_DIR / f"{slug}.png")
            img = render_blog_hero(title, product_id=product.get("id") if product else None,
                                   badge=badge, product=product, out=out_path)
            if img:
                print(f"  Generated: {img}")
                if not args.dry_run:
                    media_id = upload_to_wp(img, title)
                    if media_id:
                        set_featured_image(post_id, media_id)
                        print(f"  Set as featured image (media_id={media_id})")
            else:
                print(f"  FAILED to render")
        return

    title = args.title
    product_id = args.product_id
    product = None

    if args.post_id:
        post = get_post(args.post_id)
        if not post:
            print(f"Post {args.post_id} not found")
            sys.exit(1)
        if not title:
            title = post["title"]["rendered"]
        slug = post.get("slug", "unknown")
    else:
        slug = re.sub(r"[^a-z0-9]+", "-", (title or "blog-hero").lower())[:50]

    if not title:
        print("Need --title or --post-id")
        sys.exit(1)

    badge = args.badge or detect_badge(title)

    if product_id:
        from workspace_creative_engine import render as _r  # noqa: ensure loaded
        from importlib import import_module
        _ce = import_module("creative-engine.data.product_source")
        fetch_product = _ce.fetch_product
        product = fetch_product(product_id)
    elif not product_id:
        product = pick_product_for_category(806)
        if product:
            product_id = product.get("id")

    out_path = args.out or str(OUTPUT_DIR / f"{slug}.png")
    print(f"Generating blog hero: {title[:60]}")
    print(f"  Badge: {badge} | Product: {product_id}")

    img = render_blog_hero(title, product_id=product_id, badge=badge, product=product, out=out_path)
    if not img:
        print("FAILED")
        sys.exit(1)

    print(f"  Generated: {img}")

    if args.post_id and not args.dry_run:
        media_id = upload_to_wp(img, title)
        if media_id:
            set_featured_image(args.post_id, media_id)
            print(f"  Set as featured image for post {args.post_id} (media_id={media_id})")
        else:
            print("  Upload failed")


if __name__ == "__main__":
    main()
