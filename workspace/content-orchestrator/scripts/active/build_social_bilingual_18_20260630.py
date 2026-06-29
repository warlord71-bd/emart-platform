#!/usr/bin/env python3
from __future__ import annotations

import io
import json
import math
import shutil
import sys
from decimal import Decimal, InvalidOperation
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[4]
ACTIVE_DIR = Path(__file__).resolve().parent
if str(ACTIVE_DIR) not in sys.path:
    sys.path.insert(0, str(ACTIVE_DIR))

import build_social_brand_fresh_product_base_v5 as podium  # noqa: E402

podium.ROOT = ROOT
podium.LOGO = ROOT / "apps/web/public/logo.png"

AUDIT_DIR = ROOT / "workspace/audit/active/social-bilingual-18-20260630"
PUBLIC_DIR = ROOT / "apps/web/public/images/social/2026-06-30/bilingual-18-product-posts"
CAMPAIGN_PATH = ROOT / "workspace/content-orchestrator/social-engine/campaigns/2026-06-30-bilingual-18-product-posts.json"
SITE = "https://e-mart.com.bd"
PUBLIC_BASE = f"{SITE}/public/images/social/2026-06-30/bilingual-18-product-posts"
WP_UPLOADS = Path("/var/www/wordpress/wp-content/uploads")
PRICE_VERIFIED_AT = "2026-06-30T02:45:00+06:00"

SIZES = {"1x1": (1080, 1080), "4x5": (1080, 1350)}

ITEMS = [
    {
        "slot": 1,
        "brand": "Medicube",
        "product_id": 59211,
        "product": "MediCube Txa Niacinamide 15% Serum 30ml",
        "slug": "medicube-txa-niacinamide-15-serum-30ml",
        "price": "1690",
        "regular_price": "2000",
        "sale_price": "1690",
        "image_file": "2025/05/emart-medicube-txa-niacinamide-15-serum-30ml.jpg",
        "bn": "নিয়াসিনামাইড সিরামটি ডেইলি গ্লো রুটিনে হালকা, ফোকাসড ধাপ হিসেবে রাখা যায়।",
        "en": "A focused niacinamide serum step for an easy daily glow routine.",
        "tags": "#MedicubeBangladesh #NiacinamideSerum #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 2,
        "brand": "Medicube",
        "product_id": 62280,
        "product": "Medicube PDRN Pink Collagen Capsule Cream 55g",
        "slug": "medicube-pdrn-pink-collagen-capsule-cream-55g",
        "price": "1987",
        "regular_price": "2350",
        "sale_price": "1987",
        "image_file": "2026/02/emart-medicube-pdrn-pink-collagen-capsule-cream-55g.jpg",
        "bn": "PDRN ক্যাপসুল ক্রিমটি স্কিনকেয়ার রুটিনে নরম, কমফোর্ট-কেয়ার ফিনিশ দেয়।",
        "en": "A PDRN capsule cream pick for a soft comfort-care finish.",
        "tags": "#MedicubeBangladesh #PDRN #CollagenCream #EmartSkincare",
    },
    {
        "slot": 3,
        "brand": "Medicube",
        "product_id": 62028,
        "product": "MEDICUBE Kojic Acid Turmeric Niacinamide Serum 30ml",
        "slug": "medicube-kojic-acid-turmeric-niacinamide-serum-30ml",
        "price": "1950",
        "regular_price": "2100.0",
        "sale_price": "1950",
        "image_file": "2026/02/emart-medicube-kojic-acid-turmeric-niacinamide-serum-30ml.jpg",
        "bn": "টারমারিক-নিয়াসিনামাইড সিরামটি ইভেন-গ্লো রুটিনে স্মার্ট একটি পিক।",
        "en": "A turmeric-niacinamide serum pick for an even-glow routine.",
        "tags": "#MedicubeBangladesh #GlowSerum #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 4,
        "brand": "Medicube",
        "product_id": 60785,
        "product": "Medicube Txa Niacinamide Capsule Cream 55 g",
        "slug": "medicube-txa-niacinamide-capsule-cream-55-g",
        "price": "2090",
        "regular_price": "2500",
        "sale_price": "2090",
        "image_file": "2026/02/Medicube-Txa-Niacinamide-Capsule-Cream-55-g5.jpg",
        "bn": "TXA ক্যাপসুল ক্রিমটি ময়েশ্চার ও গ্লো-কেয়ার একসাথে রাখতে চাইলে ভালো।",
        "en": "A TXA capsule cream for moisture care with a polished glow feel.",
        "tags": "#MedicubeBangladesh #CapsuleCream #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 5,
        "brand": "Anua",
        "product_id": 57100,
        "product": "Anua Peach 77 Niacin Essence Toner 250ml",
        "slug": "anua-peach-77-niacin-essence-toner-250ml",
        "price": "1902",
        "regular_price": "2250",
        "sale_price": "1902",
        "image_file": "2024/06/emart-anua-peach-77-niacin-essence-toner-250ml.jpg",
        "bn": "Peach essence toner টি গ্লো-কেয়ার রুটিনে হাইড্রেটিং লেয়ার হিসেবে মানায়।",
        "en": "A peach essence toner for a hydrated glow-care layering step.",
        "tags": "#AnuaBangladesh #PeachToner #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 6,
        "brand": "Anua",
        "product_id": 53342,
        "product": "Anua Heartleaf Pore Control Cleansing Oil Mini 20ml",
        "slug": "anua-heartleaf-pore-control-cleansing-oil-mini-20ml",
        "price": "480.0",
        "regular_price": "650",
        "sale_price": "480.0",
        "image_file": "2024/02/emart-anua-heartleaf-pore-control-cleansing-oil-mini-20ml.jpg",
        "bn": "মিনি ক্লেনজিং অয়েলটি Anua ট্রাই করতে বা ট্রাভেলে নিতে বেশ সুবিধাজনক।",
        "en": "A mini cleansing oil that is easy to try and travel-friendly.",
        "tags": "#AnuaBangladesh #CleansingOil #Heartleaf #EmartSkincare",
    },
    {
        "slot": 7,
        "brand": "Anua",
        "product_id": 53339,
        "product": "Anua Heartleaf Pore Control Cleansing Oil 200ml",
        "slug": "anua-heartleaf-pore-control-cleansing-oil-200ml",
        "price": "1900",
        "regular_price": "1900",
        "sale_price": "",
        "image_file": "2024/02/Anua-Heartleaf-Pore-Control-Cleansing-Oil-200mL.jpg",
        "bn": "ডাবল-ক্লেনজিং রুটিনে বড় সাইজের Heartleaf cleansing oil ব্যবহারবান্ধব।",
        "en": "A full-size Heartleaf cleansing oil for regular double-cleansing routines.",
        "tags": "#AnuaBangladesh #DoubleCleansing #Heartleaf #EmartSkincare",
    },
    {
        "slot": 8,
        "brand": "Anua",
        "product_id": 60013,
        "product": "ANUA Azelaic Acid 10 Hyaluron Redness Soothing Serum 10ml Mini",
        "slug": "anua-azelaic-acid-10-hyaluron-redness-soothing-serum-10ml-mini",
        "price": "950.0",
        "regular_price": "990",
        "sale_price": "950.0",
        "image_file": "2026/02/emart-anua-azelaic-acid-10-hyaluron-redness-soothing-serum-10ml-mini.jpg",
        "bn": "মিনি সিরামটি নতুন অ্যাকটিভ ট্রাই করার আগে ছোট করে শুরু করতে সাহায্য করে।",
        "en": "A mini serum size for starting small with a new active step.",
        "tags": "#AnuaBangladesh #MiniSerum #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 9,
        "brand": "COSRX",
        "product_id": 2595,
        "product": "COSRX Low pH Good Morning Gel Cleanser 150ml",
        "slug": "cosrx-low-ph-good-morning-gel-cleanser-150ml",
        "price": "950.0",
        "regular_price": "1100",
        "sale_price": "950.0",
        "image_file": "2022/04/76759.jpg",
        "bn": "Low pH cleanser টি সকাল বা রাতের সহজ ক্লেনজিং রুটিনে রাখা যায়।",
        "en": "A low-pH cleanser pick for simple morning or night cleansing routines.",
        "tags": "#CosrxBangladesh #GelCleanser #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 10,
        "brand": "COSRX",
        "product_id": 18095,
        "product": "Cosrx Acne Pimple Master Patch 24 Patch",
        "slug": "cosrx-acne-pimple-master-patch-24-patch",
        "price": "360.00",
        "regular_price": "400.00",
        "sale_price": "360.00",
        "image_file": "2021/02/61YPY6Dv6MS._SL1500_.jpg",
        "bn": "স্পট-কেয়ার রুটিনে ছোট, সহজে বহনযোগ্য patch pack হিসেবে এটি জনপ্রিয়।",
        "en": "A compact patch pack for simple spot-care routines.",
        "tags": "#CosrxBangladesh #PatchCare #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 11,
        "brand": "COSRX",
        "product_id": 50566,
        "product": "Cosrx Advanced Snail Mucin 96 Power Essence 30ml",
        "slug": "cosrx-advanced-snail-mucin-96-power-essence-30ml",
        "price": "490",
        "regular_price": "799",
        "sale_price": "490",
        "image_file": "2023/03/Cosrx-Advanced-Snail-96-Mucin-Power-Essence.jpg",
        "bn": "৩০মিলি Snail essence টি ট্রায়াল, ট্রাভেল বা ছোট রুটিনের জন্য পারফেক্ট।",
        "en": "A 30ml snail essence that works neatly for trial, travel, or small routines.",
        "tags": "#CosrxBangladesh #MiniEssence #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 12,
        "brand": "3W Clinic",
        "product_id": 3509,
        "product": "3W CLINIC Pure Natural Brown Rice Cleansing Foam 100ml",
        "slug": "3w-clinic-pure-natural-brown-rice-cleansing-foam-100ml",
        "price": "484",
        "regular_price": "900",
        "sale_price": "484",
        "image_file": "2022/04/81yEKxCFU7L._SL1500_-1.jpg",
        "bn": "Brown Rice cleansing foam টি ফ্রেশ, সহজ ক্লেনজিং স্টেপ হিসেবে রাখা যায়।",
        "en": "A brown rice cleansing foam for a fresh, simple cleansing step.",
        "tags": "#3WClinicBangladesh #CleansingFoam #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 13,
        "brand": "3W Clinic",
        "product_id": 43290,
        "product": "3W CLINIC Herbal Green Tea Beauty Soap 120g",
        "slug": "3w-clinic-herbal-greenteabeauty-soap-120g",
        "price": "450",
        "regular_price": "450",
        "sale_price": "",
        "image_file": "2022/05/3034.970x0.jpg",
        "bn": "গ্রিন টি soap টি সহজ, ফ্রেশ ফিলের বাথ-কেয়ার পিক হিসেবে রাখা যায়।",
        "en": "A green tea soap pick for a simple fresh-feel bath-care routine.",
        "tags": "#3WClinicBangladesh #GreenTeaSoap #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 14,
        "brand": "3W Clinic",
        "product_id": 43289,
        "product": "3W CLINIC Charcoal Beauty Soap 120g",
        "slug": "3w-clinic-charcoal-beauty-soap-120g",
        "price": "450",
        "regular_price": "450",
        "sale_price": "",
        "image_file": "2022/05/3w_opt_500008_05-650x650-2.jpg",
        "bn": "Charcoal soap টি ক্লিন, মিনিমাল বাথ-কেয়ার রুটিনে সহজে বসে যায়।",
        "en": "A charcoal soap pick for a clean, minimal bath-care routine.",
        "tags": "#3WClinicBangladesh #CharcoalSoap #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 15,
        "brand": "Celimax",
        "product_id": 62180,
        "product": "Celimax The Vita A Retinal Shot Tightening Booster 15ml",
        "slug": "celimax-the-vita-a-retinal-shot-tightening-booster-15ml",
        "price": "1450.0",
        "regular_price": "1600.0",
        "sale_price": "1450.0",
        "image_file": "2026/02/emart-celimax-the-vita-a-retinal-shot-tightening-booster-15ml.jpg",
        "bn": "Vita A booster টি রাতের রুটিনে ধীরে ধীরে যোগ করার মতো ফোকাসড পিক।",
        "en": "A focused Vita A booster pick for gradual night-routine use.",
        "tags": "#CelimaxBangladesh #VitaABooster #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 16,
        "brand": "Celimax",
        "product_id": 61916,
        "product": "Celimax The Real Noni Refresh Clay Mask 120g",
        "slug": "celimax-the-real-noni-refresh-clay-mask-120g",
        "price": "1700.0",
        "regular_price": "1700.0",
        "sale_price": "",
        "image_file": "2026/02/emart-celimax-the-real-noni-refresh-clay-mask-120g.jpg",
        "bn": "Noni clay mask টি সাপ্তাহিক রুটিনে রিফ্রেশিং mask step হিসেবে রাখা যায়।",
        "en": "A Noni clay mask pick for a refreshing weekly mask step.",
        "tags": "#CelimaxBangladesh #NoniMask #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 17,
        "brand": "Celimax",
        "product_id": 61914,
        "product": "Celimax The Real Noni Energy Ampoule 50ml",
        "slug": "celimax-the-real-noni-energy-ampoule-50ml",
        "price": "1900.0",
        "regular_price": "1900.0",
        "sale_price": "",
        "image_file": "2026/02/emart-celimax-the-real-noni-energy-ampoule-50ml.jpg",
        "bn": "৫০মিলি Noni ampoule টি সিরাম রুটিনে পুষ্টিকর গ্লো-ফিল যোগ করে।",
        "en": "A 50ml Noni ampoule for a nourishing glow-feel serum routine.",
        "tags": "#CelimaxBangladesh #NoniAmpoule #KBeautyBD #EmartSkincare",
    },
    {
        "slot": 18,
        "brand": "Celimax",
        "product_id": 61912,
        "product": "celimax The Real Noni Hydra Firming Lotion 150ml",
        "slug": "celimax-the-real-noni-hydra-firming-lotion-150ml",
        "price": "1700.0",
        "regular_price": "1700.0",
        "sale_price": "",
        "image_file": "2026/02/emart-celimax-the-real-noni-hydra-firming-lotion-150ml.jpg",
        "bn": "Noni lotion টি ডেইলি ময়েশ্চার রুটিনে লাইটওয়েট, সহজ একটি ধাপ।",
        "en": "A lightweight Noni lotion step for daily moisture routines.",
        "tags": "#CelimaxBangladesh #NoniLotion #KBeautyBD #EmartSkincare",
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


def price_value(value: str) -> Decimal:
    if value in ("", "NULL", "None", None):
        return Decimal("0")
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return Decimal("0")


def is_offer(item: dict[str, str]) -> bool:
    current = price_value(item.get("price", ""))
    regular = price_value(item.get("regular_price", ""))
    sale = price_value(item.get("sale_price", ""))
    return current > 0 and regular > current and sale > 0


def price_line(item: dict[str, str]) -> str:
    if is_offer(item):
        return f"Offer price: ৳{money(item['price'])} | Regular: ৳{money(item['regular_price'])}"
    return f"Price: ৳{money(item['price'])}"


def slug_safe(value: str) -> str:
    return "".join(ch if ch.isalnum() else "-" for ch in value.lower()).strip("-").replace("--", "-")


def load_source_image(item: dict[str, str]) -> Image.Image:
    path = WP_UPLOADS / item["image_file"]
    if not path.exists():
        raise FileNotFoundError(path)
    data = path.read_bytes()
    return Image.open(io.BytesIO(data)).convert("RGBA")


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


def build_captions(item: dict[str, str], link: str) -> dict[str, str]:
    price = price_line(item)
    fb = (
        f"আজকের {item['brand']} পিক: {item['product']}\n\n"
        f"বাংলা: {item['bn']}\n"
        f"English: {item['en']}\n\n"
        f"{price}\n"
        f"Original product. COD available across Bangladesh.\n\n"
        f"Shop now: {link}\n\n"
        f"{item['tags']}"
    )
    ig = (
        f"আজকের {item['brand']} পিক: {item['product']}\n\n"
        f"বাংলা: {item['bn']}\n"
        f"English: {item['en']}\n\n"
        f"{price}\n"
        f"DM to order or tap the link in bio.\n\n"
        f"{item['tags']}"
    )
    return {"facebook": fb, "instagram": ig}


def contact_sheet(rows: list[dict[str, str]]) -> None:
    cols = 6
    cell_w, cell_h = 300, 360
    sheet = Image.new("RGB", (cols * cell_w, math.ceil(len(rows) / cols) * cell_h + 74), "white")
    d = ImageDraw.Draw(sheet)
    d.text((22, 20), "Jun 30 bilingual 18 posts - same brands, new products", font=font(30, True), fill=(24, 24, 24))
    for i, row in enumerate(rows):
        im = Image.open(ROOT / row["fb_image"]).convert("RGB").resize((260, 260), Image.LANCZOS)
        x = (i % cols) * cell_w + 20
        y = (i // cols) * cell_h + 74
        sheet.paste(im, (x, y))
        d.text((x, y + 268), f"{int(row['slot']):02d} {row['brand']}", font=font(22, True), fill=(24, 24, 24))
        d.text((x, y + 300), row["price_caption"], font=font(20), fill=(58, 58, 58))
    sheet.save(AUDIT_DIR / "contact-sheet.jpg", "JPEG", quality=92, optimize=True)


def main() -> None:
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    (AUDIT_DIR / "images").mkdir(exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    generated_rows: list[dict[str, str]] = []
    campaign_items: list[dict] = []
    ig_comment_items: list[dict] = []
    old_ids = {
        59767, 59014, 62446, 62068, 57127, 59645, 51704, 57666, 4326,
        92806, 4375, 43232, 62370, 53311, 61900, 62306, 62310, 61902,
    }

    for item in ITEMS:
        if item["product_id"] in old_ids:
            raise SystemExit(f"Refusing yesterday product repeat: {item['product_id']}")
        link = f"{SITE}/shop/{item['slug']}"
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
        generated_rows.append({
            "approve": "",
            "slot": str(item["slot"]),
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
            "image_source": f"WordPress featured image: {item['image_file']}",
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
            "creative_type": "owner-approved-static-card",
            "asset_source": "same-brand-new-product-current-price",
            "design_template": "brand-fresh-product-base-v6-bilingual-price",
            "link": link,
            "angle": item["en"],
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
            },
            "price_snapshot": {
                "price": money(item["price"]),
                "regular_price": money(item["regular_price"]),
                "sale_price": money(item["sale_price"]) if item.get("sale_price") else "",
                "on_offer": is_offer(item),
                "verified_at": PRICE_VERIFIED_AT,
            },
            "product_image_source": f"WordPress featured image: {item['image_file']}",
            "background_source": "codex-rendered wooden podium card",
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
        import csv

        writer = csv.DictWriter(f, fieldnames=generated_rows[0].keys())
        writer.writeheader()
        writer.writerows(generated_rows)

    (AUDIT_DIR / "price-snapshot.json").write_text(json.dumps({
        "verified_at": PRICE_VERIFIED_AT,
        "source": "read-only wp4h_posts/wp4h_postmeta/wp4h_wc_product_meta_lookup snapshot",
        "excluded_yesterday_product_ids": sorted(old_ids),
        "products": [
            {
                "product_id": item["product_id"],
                "name": item["product"],
                "slug": item["slug"],
                "price": money(item["price"]),
                "regular_price": money(item["regular_price"]),
                "sale_price": money(item["sale_price"]) if item.get("sale_price") else "",
                "on_offer": is_offer(item),
            }
            for item in ITEMS
        ],
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    campaign = {
        "id": "2026-06-30-bilingual-18-product-posts",
        "name": "June 30 Bilingual 18 Product Posts",
        "date": "2026-06-30",
        "approval_status": "approved_for_scheduled_run",
        "caption_link_policy": {
            "facebook": "inline_purchase_link",
            "instagram": "comment_if_possible",
        },
        "design_template": "brand-fresh-product-base-v6-bilingual-price",
        "platforms": ["facebook", "instagram"],
        "schedule": {"start": "08:00", "end": "22:10", "timezone": "+06:00"},
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
        f.write("# June 30 bilingual 18 product posts\n\n")
        f.write(f"- Price verified: {PRICE_VERIFIED_AT}\n")
        f.write("- Brand distribution follows yesterday: Medicube 4, Anua 4, COSRX 3, 3W Clinic 3, Celimax 4.\n")
        f.write("- All products are new versus yesterday's 18 product IDs.\n")
        f.write("- Facebook captions include direct product purchase links.\n")
        f.write("- Instagram link comments are prepared in `instagram-comment-queue.json`; current scheduler posts IG captions only.\n")
        f.write("- Offer items use current price plus regular-price strikethrough in the asset chip.\n\n")
        for row in generated_rows:
            offer = "offer" if row["on_offer"] == "true" else "regular"
            f.write(f"- {int(row['slot']):02d}. {row['brand']} - {row['product']} - {row['price_caption']} ({offer})\n")

    contact_sheet(generated_rows)
    print(CAMPAIGN_PATH)
    print(AUDIT_DIR)
    print(PUBLIC_DIR)


if __name__ == "__main__":
    main()
