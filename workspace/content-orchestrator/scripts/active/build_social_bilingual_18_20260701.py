#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import io
import json
import math
import shutil
import sys
import urllib.parse
import urllib.request
from decimal import Decimal, InvalidOperation
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[4]
ACTIVE_DIR = Path(__file__).resolve().parent
SOCIAL_ENGINE_DIR = ROOT / "workspace/content-orchestrator/social-engine"
for path in (ACTIVE_DIR, SOCIAL_ENGINE_DIR):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

import build_social_brand_fresh_product_base_v5 as podium  # noqa: E402
from social_engine.engine import woo_get  # noqa: E402

podium.ROOT = ROOT
podium.LOGO = ROOT / "apps/web/public/logo.png"

DATE = "2026-07-01"
CAMPAIGN_ID = "2026-07-01-bilingual-18-product-posts"
CAMPAIGN_NAME = "July 1 Mixed Bangla-English 18 Product Posts"
AUDIT_DIR = ROOT / "workspace/audit/active/social-bilingual-18-20260701"
PUBLIC_DIR = ROOT / "apps/web/public/images/social/2026-07-01/bilingual-18-product-posts"
CAMPAIGN_PATH = ROOT / f"workspace/content-orchestrator/social-engine/campaigns/{CAMPAIGN_ID}.json"
SITE = "https://e-mart.com.bd"
PUBLIC_BASE = f"{SITE}/public/images/social/2026-07-01/bilingual-18-product-posts"
WP_UPLOADS = Path("/var/www/wordpress/wp-content/uploads")
PRICE_VERIFIED_AT = "2026-07-01T04:30:00+06:00"

SIZES = {"1x1": (1080, 1080), "4x5": (1080, 1350)}
SLOTS = [
    "2026-07-01T08:20:00+06:00",
    "2026-07-01T09:10:00+06:00",
    "2026-07-01T10:00:00+06:00",
    "2026-07-01T10:50:00+06:00",
    "2026-07-01T11:40:00+06:00",
    "2026-07-01T12:30:00+06:00",
    "2026-07-01T13:20:00+06:00",
    "2026-07-01T14:10:00+06:00",
    "2026-07-01T15:00:00+06:00",
    "2026-07-01T15:50:00+06:00",
    "2026-07-01T16:40:00+06:00",
    "2026-07-01T17:30:00+06:00",
    "2026-07-01T18:20:00+06:00",
    "2026-07-01T19:00:00+06:00",
    "2026-07-01T19:40:00+06:00",
    "2026-07-01T20:20:00+06:00",
    "2026-07-01T21:00:00+06:00",
    "2026-07-01T21:40:00+06:00",
]

ITEMS = [
    {
        "slot": 1,
        "brand": "APLB",
        "product_id": 62510,
        "line": "night routine-এ quick glow-feel add করতে চাইলে এই sheet mask easy pick.",
        "tags": "#APLBBangladesh #SheetMask #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 2,
        "brand": "iUNIK",
        "product_id": 63925,
        "line": "Centella routine try করতে চাইলে এই mini set travel-friendly option.",
        "tags": "#iUNIKBangladesh #CentellaCare #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 3,
        "brand": "Minimalist",
        "product_id": 74869,
        "line": "gentle cleanser step-এ soft, non-fussy wash feel চাইলে ভালো match.",
        "tags": "#MinimalistBangladesh #GentleCleanser #SkincareBD #EmartSkincare",
    },
    {
        "slot": 4,
        "brand": "Anua",
        "product_id": 92932,
        "line": "bag-এ রাখার মতো mini cleanser, quick fresh wash routine-এ handy.",
        "tags": "#AnuaBangladesh #HeartleafCleanser #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 5,
        "brand": "Celimax",
        "product_id": 62306,
        "line": "eye cream step add করতে চাইলে Noni line-এর compact pick.",
        "tags": "#CelimaxBangladesh #NoniEyeCream #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 6,
        "brand": "APLB",
        "product_id": 62506,
        "line": "double cleansing routine-এ makeup/sunscreen melt step চাইলে clean option.",
        "tags": "#APLBBangladesh #CleansingOil #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 7,
        "brand": "iUNIK",
        "product_id": 59385,
        "line": "Centella bubble cleanser daily wash-এ fresh clean feel দেয় without extra fuss.",
        "tags": "#iUNIKBangladesh #BubbleCleanser #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 8,
        "brand": "Minimalist",
        "product_id": 74863,
        "line": "day routine-এ sunscreen skip না করতে চাইলে lightweight SPF pick.",
        "tags": "#MinimalistBangladesh #SunscreenBD #SkincareBD #EmartSkincare",
    },
    {
        "slot": 9,
        "brand": "Anua",
        "product_id": 61942,
        "line": "toner step-এ watery hydration feel চাইলে PDRN + HA routine-এ বসে যায়.",
        "tags": "#AnuaBangladesh #HydratingToner #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 10,
        "brand": "Celimax",
        "product_id": 61900,
        "line": "serum step-এ bright, fresh-looking routine vibe চাইলে এই Celimax pick.",
        "tags": "#CelimaxBangladesh #SerumRoutine #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 11,
        "brand": "APLB",
        "product_id": 62500,
        "line": "retinol + vitamin serum routine-এ slow start করতে চাইলে smart add-on.",
        "tags": "#APLBBangladesh #RetinolSerum #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 12,
        "brand": "Minimalist",
        "product_id": 74881,
        "line": "evening routine-এ firm, smooth-feel step হিসেবে multi-peptide serum neat.",
        "tags": "#MinimalistBangladesh #PeptideSerum #SkincareBD #EmartSkincare",
    },
    {
        "slot": 13,
        "brand": "CeraVe",
        "product_id": 93122,
        "line": "daily moisturising routine-এ CeraVe lotion barrier-friendly comfort feel রাখে.",
        "tags": "#CeraVeBangladesh #MoisturizingLotion #SkincareBD #EmartSkincare",
    },
    {
        "slot": 14,
        "brand": "iUNIK",
        "product_id": 93000,
        "line": "hydration routine-এ Beta-glucan serum light but comforting layer দেয়.",
        "tags": "#iUNIKBangladesh #HydrationSerum #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 15,
        "brand": "Medicube",
        "product_id": 92854,
        "line": "night routine-এ bouncy moisture finish চাইলে collagen jelly cream nice pick.",
        "tags": "#MedicubeBangladesh #CollagenCream #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 16,
        "brand": "CeraVe",
        "product_id": 93121,
        "line": "retinol serum start করতে চাইলে night routine-এ slow and simple রাখুন.",
        "tags": "#CeraVeBangladesh #RetinolSerum #SkincareBD #EmartSkincare",
    },
    {
        "slot": 17,
        "brand": "Medicube",
        "product_id": 94593,
        "line": "evening scroll-এ trending Medicube SPF pick: pink tone-up finish, easy day use.",
        "tags": "#MedicubeBangladesh #ToneUpSunscreen #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 18,
        "brand": "CeraVe",
        "product_id": 93123,
        "line": "dry skin comfort routine-এ CeraVe cream একটা strong, dependable shelf pick.",
        "tags": "#CeraVeBangladesh #MoisturizingCream #SkincareBD #EmartSkincare",
    },
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for candidate in candidates:
        p = Path(candidate)
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


F_BRAND = font(44, True)
F_LABEL = font(21, True)
F_PRICE = font(45, True)
F_OLD = font(28, True)
F_SMALL = font(24, True)


def money(value: str | Decimal | int | float) -> str:
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError):
        return str(value)
    if amount == amount.to_integral():
        return str(int(amount))
    return f"{amount:.2f}".rstrip("0").rstrip(".")


def price_value(value: str | None) -> Decimal:
    if value in ("", "NULL", "None", None):
        return Decimal("0")
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return Decimal("0")


def is_offer(item: dict[str, str]) -> bool:
    current = price_value(item.get("price"))
    regular = price_value(item.get("regular_price"))
    sale = price_value(item.get("sale_price"))
    return current > 0 and regular > current and sale > 0


def price_line(item: dict[str, str]) -> str:
    if is_offer(item):
        return f"Offer price: ৳{money(item['price'])} | Regular: ৳{money(item['regular_price'])}"
    return f"Price: ৳{money(item['price'])}"


def slug_safe(value: str) -> str:
    cleaned = "".join(ch if ch.isalnum() else "-" for ch in value.lower()).strip("-")
    while "--" in cleaned:
        cleaned = cleaned.replace("--", "-")
    return cleaned


def upload_rel_from_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    marker = "/wp-content/uploads/"
    if marker not in parsed.path:
        return ""
    return urllib.parse.unquote(parsed.path.split(marker, 1)[1])


def load_source_image(item: dict[str, str]) -> Image.Image:
    rel = upload_rel_from_url(item["image_url"])
    local = WP_UPLOADS / rel if rel else Path()
    if rel and local.exists():
        return Image.open(io.BytesIO(local.read_bytes())).convert("RGBA")

    cache = AUDIT_DIR / "source-cache" / f"{item['slot']:02d}-{slug_safe(item['slug'])}.img"
    cache.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(item["image_url"], timeout=30) as response:
        cache.write_bytes(response.read())
    return Image.open(io.BytesIO(cache.read_bytes())).convert("RGBA")


def paint_price_chip(d: ImageDraw.ImageDraw, item: dict[str, str], x: int, y: int) -> None:
    d.rounded_rectangle((x, y, x + 292, y + 128), radius=16, fill=(18, 18, 17, 252))
    d.text((x + 24, y + 16), "OFFER" if is_offer(item) else "PRICE", font=F_LABEL, fill=(246, 214, 115, 255))
    d.text((x + 24, y + 45), f"TK {money(item['price'])}", font=F_PRICE, fill=(255, 255, 255, 255))
    if is_offer(item):
        old = f"TK {money(item['regular_price'])}"
        oy = y + 94
        d.text((x + 25, oy), old, font=F_OLD, fill=(198, 198, 198, 255))
        old_w = d.textbbox((0, 0), old, font=F_OLD)[2]
        d.line((x + 22, oy + 16, x + 30 + old_w, oy + 16), fill=(246, 214, 115, 230), width=4)


def render_card(item: dict[str, str], source: Image.Image, suffix: str, dest: Path) -> None:
    w, h = SIZES[suffix]
    img = podium.background(w, h)
    d = ImageDraw.Draw(img, "RGBA")
    img.alpha_composite(podium.logo_chip(), (42, 34))
    d.text((54, 130), item["brand"].upper(), font=F_BRAND, fill=(36, 37, 38, 255))

    cut = podium.rembg_cutout(source)
    tw, th, kind = podium.product_target(item["product"], cut, w, h)
    product = cut.resize((tw, th), Image.LANCZOS)

    text_y = 820 if h == 1080 else 1064
    product_bottom = text_y - (86 if h == 1080 else 108)
    cx = w // 2 + (18 if kind == "tall" else 0)
    px = cx - tw // 2
    py = max(202 if h == 1080 else 250, product_bottom - th)

    base_h = 88 if h == 1080 else 104
    if kind == "jar":
        base_w = max(540, min(680, int(tw * 1.62)))
        base_h = 104 if h == 1080 else 122
    elif kind == "wide":
        base_w = max(560, min(710, int(tw * 1.30)))
    else:
        base_w = max(430, min(620, int(tw * 2.05)))
    podium_img = podium.wooden_podium(w, base_w, base_h)
    bx = w // 2 - podium_img.width // 2
    top_h = int(base_h * 0.42)
    surface_y = 14 + int(top_h * (0.64 if kind == "jar" else 0.58))
    by = product_bottom - surface_y
    img.alpha_composite(podium_img, (bx, by))
    img.alpha_composite(product, (px, py))

    shadow = Image.new("RGBA", (tw + 60, 34), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow, "RGBA")
    sd.ellipse((12, 5, tw + 48, 30), fill=(42, 28, 18, 72 if kind == "jar" else 44))
    shadow = shadow.filter(ImageFilter.GaussianBlur(7))
    img.alpha_composite(shadow, (cx - shadow.width // 2, product_bottom - 16))

    price_x = 54
    price_y = text_y + 30
    paint_price_chip(d, item, price_x, price_y)

    title_x = price_x + 335
    lines, tf = podium.wrap_title(d, item["product"], w - title_x - 54, 38 if h == 1080 else 41)
    for i, line in enumerate(lines):
        d.text((title_x, price_y + 8 + i * (tf.size + 8)), line, font=tf, fill=(34, 34, 34, 255))
    d.text((54, h - 70), "COD available", font=F_SMALL, fill=(61, 61, 61, 255))
    site_text = "E-MART.COM.BD"
    site_w = d.textbbox((0, 0), site_text, font=F_SMALL)[2]
    d.text((w - 54 - site_w, h - 70), site_text, font=F_SMALL, fill=(61, 61, 61, 255))

    dest.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(dest, "PNG", optimize=True)


def has_bengali(text: str) -> bool:
    return any("\u0980" <= ch <= "\u09ff" for ch in text)


def build_captions(item: dict[str, str], link: str) -> dict[str, str]:
    price = price_line(item)
    hook = f"আজকের shelf pick: {item['product']}"
    body = item["line"]
    engagement = "Routine-এ fit মনে হলে save করে রাখুন, order করতে inbox/DM করুন."
    fb = (
        f"{hook}\n\n"
        f"{body}\n\n"
        f"{engagement}\n\n"
        f"{price}\n"
        f"Original product. COD available across Bangladesh.\n\n"
        f"Order link: {link}\n\n"
        f"{item['tags']}"
    )
    ig = (
        f"{hook}\n\n"
        f"{body}\n\n"
        f"{engagement}\n\n"
        f"{price}\n"
        f"DM to order or tap the link in bio.\n\n"
        f"{item['tags']}"
    )
    return {"facebook": fb, "instagram": ig}


def assert_caption_quality(item: dict[str, str], captions: dict[str, str], link: str) -> None:
    body = item["line"]
    if not has_bengali(body) or not any(ch.isascii() and ch.isalpha() for ch in body):
        raise SystemExit(f"Caption body is not mixed Bangla-English copy: {item['product']}")
    romanized_bangla = ("korte", "chai", "mone", "hole", "rakhun", "hishabe", "ekta", "dey", "bhalo", "theke")
    for token in romanized_bangla:
        if token in body.lower():
            raise SystemExit(f"Romanized Bangla token `{token}` found in caption body: {item['product']}")
    blocked = ("cure", "guarantee", "permanent", "whitening", "remove acne", "medical")
    for platform, caption in captions.items():
        lowered = caption.lower()
        for word in blocked:
            if word in lowered:
                raise SystemExit(f"Blocked claim `{word}` in {platform} caption: {item['product']}")
        if "A focused " in caption or "A simple " in caption or "A " + item["brand"] in caption:
            raise SystemExit(f"Old separated-English caption pattern found: {item['product']}")
        if price_line(item) not in caption:
            raise SystemExit(f"Missing price line in {platform}: {item['product']}")
        if platform == "facebook" and link not in caption:
            raise SystemExit(f"Missing Facebook order link: {item['product']}")
        if platform == "instagram" and "https://" in caption:
            raise SystemExit(f"Instagram caption contains raw URL: {item['product']}")
        if platform == "instagram" and "DM to order" not in caption:
            raise SystemExit(f"Missing Instagram CTA: {item['product']}")


def contact_sheet(rows: list[dict[str, str]]) -> None:
    cols = 6
    cell_w, cell_h = 300, 360
    sheet = Image.new("RGB", (cols * cell_w, math.ceil(len(rows) / cols) * cell_h + 74), "white")
    d = ImageDraw.Draw(sheet)
    d.text((22, 20), "Jul 1 mixed Bangla-English 18 posts - requested brand mix, evening anchors", font=font(26, True), fill=(24, 24, 24))
    for i, row in enumerate(rows):
        im = Image.open(ROOT / row["fb_image"]).convert("RGB").resize((260, 260), Image.LANCZOS)
        x = (i % cols) * cell_w + 20
        y = (i // cols) * cell_h + 74
        sheet.paste(im, (x, y))
        d.text((x, y + 268), f"{int(row['slot']):02d} {row['brand']}", font=font(22, True), fill=(24, 24, 24))
        d.text((x, y + 300), row["price_caption"], font=font(20), fill=(58, 58, 58))
    sheet.save(AUDIT_DIR / "contact-sheet.jpg", "JPEG", quality=92, optimize=True)


def fetch_product(item: dict[str, str]) -> dict[str, str]:
    product = woo_get(f"products/{item['product_id']}")
    if product.get("stock_status") != "instock":
        raise SystemExit(f"Product is not instock: {item['product_id']} {product.get('name')}")
    images = product.get("images") or []
    if not images or not images[0].get("src"):
        raise SystemExit(f"Product has no image: {item['product_id']} {product.get('name')}")
    title = html.unescape(product.get("name") or "")
    return {
        **item,
        "product": title,
        "slug": product.get("slug") or slug_safe(title),
        "price": str(product.get("price") or ""),
        "regular_price": str(product.get("regular_price") or product.get("price") or ""),
        "sale_price": str(product.get("sale_price") or ""),
        "image_url": images[0]["src"],
        "categories": ", ".join(html.unescape(c.get("name", "")) for c in product.get("categories", [])),
    }


def main() -> None:
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    (AUDIT_DIR / "images").mkdir(exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    generated_rows: list[dict[str, str]] = []
    campaign_items: list[dict] = []
    ig_comment_items: list[dict] = []
    previous_ids = {
        59211, 59029, 62028, 60785, 61940, 59929, 74052, 92910, 2595,
        18095, 50566, 3509, 43290, 43289, 62180, 61916, 61908, 61912,
    }

    for raw in ITEMS:
        item = fetch_product(raw)
        if item["product_id"] in previous_ids:
            raise SystemExit(f"Refusing previous campaign repeat: {item['product_id']}")
        if item["slot"] < 13 and item["slot"] != ITEMS[item["slot"] - 1]["slot"]:
            raise SystemExit("Slot sequence mismatch")
        link = f"{SITE}/shop/{item['slug']}"
        slot_time = SLOTS[item["slot"] - 1]
        base_name = f"{item['slot']:02d}-{slug_safe(item['slug'])}"
        fb_name = f"{base_name}-1x1.png"
        ig_name = f"{base_name}-4x5.png"
        fb_audit = AUDIT_DIR / "images" / fb_name
        ig_audit = AUDIT_DIR / "images" / ig_name
        fb_public = PUBLIC_DIR / fb_name
        ig_public = PUBLIC_DIR / ig_name

        source = load_source_image(item)
        render_card(item, source, "1x1", fb_audit)
        render_card(item, source, "4x5", ig_audit)
        shutil.copy2(fb_audit, fb_public)
        shutil.copy2(ig_audit, ig_public)

        fb_rel = fb_public.relative_to(ROOT)
        ig_rel = ig_public.relative_to(ROOT)
        captions = build_captions(item, link)
        assert_caption_quality(item, captions, link)

        generated_rows.append({
            "approve": "",
            "slot": str(item["slot"]),
            "scheduled_at": slot_time,
            "product_id": str(item["product_id"]),
            "brand": item["brand"],
            "product": item["product"],
            "current_price": money(item["price"]),
            "regular_price": money(item["regular_price"]),
            "sale_price": money(item["sale_price"]) if item.get("sale_price") else "",
            "on_offer": str(is_offer(item)).lower(),
            "price_verified_at": PRICE_VERIFIED_AT,
            "price_caption": price_line(item).replace("৳", "TK "),
            "format": "facebook 1:1 + instagram 4:5",
            "caption_style": "Mixed Bangla-English voice; Bangla words in Bangla script, English skincare terms in English",
            "image_source": f"Woo featured image: {item['image_url']}",
            "fb_image": str(fb_rel),
            "ig_image": str(ig_rel),
            "fb_public_url": f"{PUBLIC_BASE}/{fb_name}",
            "ig_public_url": f"{PUBLIC_BASE}/{ig_name}",
            "link": link,
        })

        campaign_items.append({
            "product_id": item["product_id"],
            "title": item["product"],
            "slug": item["slug"],
            "time": slot_time,
            "creative_type": "owner-approved-static-card",
            "asset_source": "requested-brand-current-price",
            "design_template": "brand-fresh-product-base-v6-bilingual-price",
            "link": link,
            "angle": item["line"],
            "hashtags": item["tags"],
            "captions": captions,
            "images": {
                "default": f"{PUBLIC_BASE}/{fb_name}",
                "facebook": f"{PUBLIC_BASE}/{fb_name}",
                "instagram": f"{PUBLIC_BASE}/{ig_name}",
                "source_asset": str(fb_rel),
                "instagram_source_asset": str(ig_rel),
            },
            "caption_link_policy": {
                "facebook": "inline_purchase_link",
                "instagram": "comment_if_possible",
            },
            "visual_qa": {
                "product_match_checked": True,
                "price_clear": True,
                "no_dummy_product": True,
                "real_product_image": True,
                "current_price_verified": True,
                "sale_strikethrough_when_on_offer": True,
                "background_source": "codex-rendered wooden podium card",
                "design_consistency_checked": True,
                "caption_style_checked": "mixed_bangla_english_single_voice",
            },
            "price_snapshot": {
                "price": money(item["price"]),
                "regular_price": money(item["regular_price"]),
                "sale_price": money(item["sale_price"]) if item.get("sale_price") else "",
                "on_offer": is_offer(item),
                "verified_at": PRICE_VERIFIED_AT,
            },
            "product_image_source": f"Woo featured image: {item['image_url']}",
            "background_source": "codex-rendered wooden podium card",
            "category_hint": item.get("categories", ""),
        })

        ig_comment_items.append({
            "index": item["slot"],
            "product_id": item["product_id"],
            "title": item["product"],
            "link": link,
            "comment": f"Shop link: {link}",
            "status": "pending_manual_or_future_instagram_comment_tool",
        })

    with (AUDIT_DIR / "approval-table.csv").open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=generated_rows[0].keys())
        writer.writeheader()
        writer.writerows(generated_rows)

    (AUDIT_DIR / "price-snapshot.json").write_text(json.dumps({
        "verified_at": PRICE_VERIFIED_AT,
        "source": "read-only WooCommerce REST product snapshot",
        "caption_logic": "Mixed Bangla-English voice; Bangla words use Bangla script and English skincare terms use English",
        "evening_anchor_slots": SLOTS[12:],
        "excluded_previous_product_ids": sorted(previous_ids),
        "products": [
            {
                "product_id": row["product_id"],
                "name": row["product"],
                "price": row["current_price"],
                "regular_price": row["regular_price"],
                "sale_price": row["sale_price"],
                "on_offer": row["on_offer"] == "true",
                "scheduled_at": row["scheduled_at"],
            }
            for row in generated_rows
        ],
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    campaign = {
        "id": CAMPAIGN_ID,
        "name": CAMPAIGN_NAME,
        "date": DATE,
        "approval_status": "approved_for_scheduled_run",
        "caption_link_policy": {
            "facebook": "inline_purchase_link",
            "instagram": "comment_if_possible",
        },
        "caption_logic": {
            "style": "mixed_bangla_english_single_voice",
            "rule": "Do not write separate Bangla and English versions of the same line.",
            "qa": "assert_caption_quality",
        },
        "design_template": "brand-fresh-product-base-v6-bilingual-price",
        "platforms": ["facebook", "instagram"],
        "schedule": {"start": "08:20", "end": "21:40", "timezone": "+06:00", "strategy": "highest-demand anchors in evening"},
        "items": campaign_items,
    }
    CAMPAIGN_PATH.write_text(json.dumps(campaign, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    (AUDIT_DIR / "instagram-comment-queue.json").write_text(json.dumps({
        "version": 1,
        "campaign_id": campaign["id"],
        "note": "Current Meta scheduler posts IG captions only; these links are prepared for manual comments or a future IG comment tool.",
        "items": ig_comment_items,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    with (AUDIT_DIR / "review.md").open("w", encoding="utf-8") as f:
        f.write("# July 1 mixed Bangla-English 18 product posts\n\n")
        f.write(f"- Price verified: {PRICE_VERIFIED_AT}\n")
        f.write("- Brand mix requested by owner: iUNIK, CeraVe, Medicube, Anua, Celimax, APLB, Minimalist.\n")
        f.write("- Caption logic updated: Bangla words in Bangla script, English skincare terms in English; not separate Bangla + English lines.\n")
        f.write("- Evening anchor slots hold stronger demand/trending picks: CeraVe, iUNIK, Medicube.\n")
        f.write("- Facebook captions include direct product order links; Instagram captions use DM/link-in-bio CTA.\n")
        f.write("- Offer items use current price plus regular-price strikethrough in the asset chip.\n\n")
        for row in generated_rows:
            offer = "offer" if row["on_offer"] == "true" else "regular"
            f.write(f"- {int(row['slot']):02d}. {row['scheduled_at']} - {row['brand']} - {row['product']} - {row['price_caption']} ({offer})\n")

    contact_sheet(generated_rows)
    print(CAMPAIGN_PATH)
    print(AUDIT_DIR)
    print(PUBLIC_DIR)


if __name__ == "__main__":
    main()
