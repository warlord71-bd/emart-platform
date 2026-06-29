#!/usr/bin/env python3
from __future__ import annotations

import csv
import io
import json
import math
import textwrap
import urllib.request
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[3]
SRC_DIR = ROOT / "workspace/audit/active/social-reel-approval-20260630-brand-fresh-product-base-v4"
OUT_DIR = ROOT / "workspace/audit/active/social-reel-approval-20260630-brand-fresh-product-base-v6"
CANDIDATES = ROOT / "workspace/audit/active/social-brand-fresh-candidates-20260629.json"
LOGO = ROOT / "apps/web/public/logo.png"

SIZES = {
    "1x1": (1080, 1080),
    "4x5": (1080, 1350),
}

REPLACEMENTS_BY_SLOT = {
    13: 62370,  # Medicube Pdrn Booster Gel 300ml
    14: 53311,  # ANUA Heartleaf 77% Soothing Toner 40ml
    15: 61900,  # celimax Pore+Dark Spot Brightening Serum 30ml
}

SOURCE_URL_OVERRIDES = {
    57127: "https://media.ulta.com/i/ulta/2634279",  # Current Anua Peach 70 bottle; no old packaging/swatch
    62310: "https://cosibella.hu/hpeciai/994ab93f7b613ecdf2a0ed9015f0bfa0/hun_pl_Celimax-The-Real-Noni-Energy-Ampoule-Taplalo-Ampulla-Nonikivonattal-30ml-17183_3.webp",
}

SOURCE_CROP_OVERRIDES = {
    # Product-only crops from real source images: remove boxes, swatches, and texture blobs.
    4375: (0.53, 0.17, 0.75, 0.88),   # 3W Clinic Honey Eye Cream tube only
    61902: (0.14, 0.03, 0.60, 0.96),  # Celimax Heart Pink tube only
    62306: (0.45, 0.03, 0.60, 0.94),  # Celimax Noni Eye Cream tube only
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    names = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for name in names:
        p = Path(name)
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


F_BRAND = font(44, True)
F_PRICE_LABEL = font(22, True)
F_PRICE = font(50, True)
F_SMALL = font(24, True)


def slug_name(path_value: str, suffix: str) -> str:
    return Path(path_value).name.replace(f"-{suffix}.png", "")


def fetch_image(url: str) -> Image.Image:
    req = urllib.request.Request(url, headers={"User-Agent": "Emart social renderer"})
    with urllib.request.urlopen(req, timeout=45) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGBA")


def source_image(row: dict[str, str], cmap: dict[int, dict]) -> tuple[Image.Image, str]:
    product_id = int(row["product_id"])
    url = SOURCE_URL_OVERRIDES.get(product_id, cmap[product_id]["image"])
    img = fetch_image(url)
    if product_id in SOURCE_CROP_OVERRIDES:
        w, h = img.size
        x0, y0, x1, y1 = SOURCE_CROP_OVERRIDES[product_id]
        img = img.crop((int(w * x0), int(h * y0), int(w * x1), int(h * y1)))
        return img, "real product image; product-only crop"
    if product_id in SOURCE_URL_OVERRIDES:
        return img, "real product-only web image replacement"
    return img, "Emart product image; v6 real product cutout"


def load_rows() -> list[dict[str, str]]:
    with (SRC_DIR / "approval-table.csv").open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def candidate_map() -> dict[int, dict]:
    data = json.loads(CANDIDATES.read_text(encoding="utf-8"))
    return {int(item["id"]): item for item in data["candidates"]}


def filename_for(slot: int, slug: str, suffix: str) -> str:
    return f"{slot:02d}-{slug}-{suffix}.png"


def apply_replacements(rows: list[dict[str, str]], cmap: dict[int, dict]) -> list[dict[str, str]]:
    out = []
    for row in rows:
        slot = int(row["slot"])
        if slot in REPLACEMENTS_BY_SLOT:
            item = cmap[REPLACEMENTS_BY_SLOT[slot]]
            row = dict(row)
            row["product_id"] = str(item["id"])
            row["brand"] = item["brand"]
            row["product"] = item["name"]
            row["price_bdt"] = str(int(float(item["price"])))
            row["image_source"] = "Emart product image; replaces out-of-stock Innisfree item"
            row["fb_image"] = str(Path("workspace/audit/active/social-reel-approval-20260630-brand-fresh-product-base-v6/images") / filename_for(slot, item["slug"], "1x1"))
            row["ig_image"] = str(Path("workspace/audit/active/social-reel-approval-20260630-brand-fresh-product-base-v6/images") / filename_for(slot, item["slug"], "4x5"))
            row["link"] = f"https://e-mart.com.bd/shop/{item['slug']}"
        out.append(row)
    return out


def trim_and_alpha(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    rgb = img.convert("RGB")
    px = rgb.load()
    w, h = img.size
    mask = Image.new("L", (w, h), 255)
    mp = mask.load()

    def bgish(x: int, y: int) -> bool:
        r, g, b = px[x, y]
        return (
            (r > 224 and g > 224 and b > 218 and max(r, g, b) - min(r, g, b) < 48)
            or (r > 238 and g > 232 and b > 218 and abs(r - g) < 28)
        )

    seen = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if bgish(x, y):
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if bgish(x, y):
                q.append((x, y))
    while q:
        x, y = q.popleft()
        idx = y * w + x
        if seen[idx]:
            continue
        seen[idx] = 1
        if not bgish(x, y):
            continue
        mp[x, y] = 0
        if x > 0:
            q.append((x - 1, y))
        if x < w - 1:
            q.append((x + 1, y))
        if y > 0:
            q.append((x, y - 1))
        if y < h - 1:
            q.append((x, y + 1))

    mask = mask.filter(ImageFilter.GaussianBlur(0.7))
    img.putalpha(ImageChops.multiply(img.getchannel("A"), mask))
    bbox = img.getbbox()
    if bbox:
        pad = 12
        bbox = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad),
        )
        img = img.crop(bbox)
    return img


def rembg_cutout(img: Image.Image) -> Image.Image:
    try:
        import os
        os.environ.setdefault("NUMBA_CACHE_DIR", "/tmp/numba-cache")
        os.environ.setdefault("XDG_CACHE_HOME", "/tmp/xdg-cache")
        from rembg import remove
        cut = remove(img.convert("RGBA"))
        if not isinstance(cut, Image.Image):
            cut = Image.open(io.BytesIO(cut)).convert("RGBA")
        bbox = cut.getbbox()
        if bbox:
            pad = 10
            cut = cut.crop((
                max(0, bbox[0] - pad),
                max(0, bbox[1] - pad),
                min(cut.width, bbox[2] + pad),
                min(cut.height, bbox[3] + pad),
            ))
        return cut.convert("RGBA")
    except Exception:
        return trim_and_alpha(img)


def background(w: int, h: int) -> Image.Image:
    img = Image.new("RGB", (w, h), "#cabda7")
    p = img.load()
    for y in range(h):
        for x in range(w):
            nx = x / max(1, w - 1)
            ny = y / max(1, h - 1)
            shade = int(26 * ny + 18 * abs(nx - 0.55))
            warm = int(16 * math.sin((nx + ny) * math.pi))
            r = 214 - shade + warm
            g = 202 - shade
            b = 181 - shade - warm // 3
            p[x, y] = (max(140, r), max(130, g), max(112, b))
    draw = ImageDraw.Draw(img, "RGBA")
    draw.ellipse((-160, -130, 520, 430), fill=(255, 248, 230, 84))
    draw.ellipse((w - 360, 70, w + 180, 700), fill=(98, 80, 62, 45))
    draw.rectangle((0, int(h * 0.73), w, h), fill=(219, 210, 193, 118))
    return img.convert("RGBA")


def logo_chip() -> Image.Image:
    logo = Image.open(LOGO).convert("RGBA")
    chip = Image.new("RGBA", (164, 54), (255, 255, 255, 0))
    d = ImageDraw.Draw(chip, "RGBA")
    d.rounded_rectangle((0, 0, 164, 54), radius=12, fill=(255, 255, 255, 210), outline=(255, 255, 255, 150), width=1)
    cropped = logo.crop((28, 82, 236, 174)).resize((148, 66), Image.LANCZOS)
    chip.alpha_composite(cropped, (8, -6))
    return chip


def classify_product(name: str, cutout: Image.Image) -> str:
    n = name.lower()
    ratio = cutout.width / max(1, cutout.height)
    if any(word in n for word in ("cream", "jar", "balm")) and ratio > 0.62:
        return "jar"
    if ratio > 0.9 or "box" in n:
        return "wide"
    if any(word in n for word in ("toner", "lotion", "ampoule", "serum", "cleanser", "sun cream")):
        return "tall"
    return "tube"


def product_target(name: str, cutout: Image.Image, w: int, h: int) -> tuple[int, int, str]:
    kind = classify_product(name, cutout)
    max_h = 500 if h == 1080 else 665
    max_w = 610
    if kind == "jar":
        max_h = 390 if h == 1080 else 500
        max_w = 660
    elif kind == "wide":
        max_h = 430 if h == 1080 else 540
        max_w = 690
    elif kind == "tall":
        max_h = 560 if h == 1080 else 735
        max_w = 470
    scale = min(max_w / cutout.width, max_h / cutout.height)
    return max(1, int(cutout.width * scale)), max(1, int(cutout.height * scale)), kind


def wooden_podium(w: int, base_w: int, base_h: int) -> Image.Image:
    top_h = int(base_h * 0.42)
    img = Image.new("RGBA", (base_w + 70, base_h + 50), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    x0, x1 = 35, 35 + base_w
    y0 = 14
    y1 = y0 + base_h
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow, "RGBA")
    sd.ellipse((14, y1 - 18, base_w + 56, y1 + 38), fill=(35, 26, 20, 62))
    shadow = shadow.filter(ImageFilter.GaussianBlur(11))
    img.alpha_composite(shadow)
    d.rounded_rectangle((x0, y0 + top_h // 2, x1, y1), radius=18, fill=(133, 87, 50, 255))
    d.ellipse((x0, y0, x1, y0 + top_h), fill=(181, 125, 75, 255), outline=(226, 178, 121, 200), width=3)
    d.arc((x0 + 18, y0 + 9, x1 - 18, y0 + top_h - 4), 0, 180, fill=(236, 188, 129, 135), width=3)
    for i in range(8):
        yy = y0 + top_h + 9 + i * max(5, base_h // 11)
        col = (94, 58, 33, 55) if i % 2 else (221, 155, 91, 44)
        d.arc((x0 + 15, yy - 18, x1 - 15, yy + 30), 5, 175, fill=col, width=2)
    d.line((x0 + 16, y0 + top_h, x0 + 16, y1 - 12), fill=(90, 55, 34, 70), width=2)
    d.line((x1 - 16, y0 + top_h, x1 - 16, y1 - 12), fill=(245, 177, 103, 55), width=2)
    return img


def wrap_title(draw: ImageDraw.ImageDraw, text: str, max_width: int, start_size: int, max_lines: int = 2) -> tuple[list[str], ImageFont.FreeTypeFont]:
    size = start_size
    while size >= 28:
        f = font(size, True)
        words = text.split()
        lines: list[str] = []
        cur = ""
        for word in words:
            trial = f"{cur} {word}".strip()
            if draw.textbbox((0, 0), trial, font=f)[2] <= max_width:
                cur = trial
            else:
                if cur:
                    lines.append(cur)
                cur = word
        if cur:
            lines.append(cur)
        if len(lines) <= max_lines and all(draw.textbbox((0, 0), line, font=f)[2] <= max_width for line in lines):
            return lines, f
        size -= 2
    return textwrap.wrap(text, width=24)[:max_lines], font(28, True)


def render_card(row: dict[str, str], source: Image.Image, suffix: str) -> Path:
    w, h = SIZES[suffix]
    img = background(w, h)
    d = ImageDraw.Draw(img, "RGBA")
    img.alpha_composite(logo_chip(), (42, 34))
    d.text((54, 130), row["brand"].upper(), font=F_BRAND, fill=(36, 37, 38, 255))

    cut = rembg_cutout(source)
    tw, th, kind = product_target(row["product"], cut, w, h)
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
    podium = wooden_podium(w, base_w, base_h)
    bx = w // 2 - podium.width // 2
    top_h = int(base_h * 0.42)
    surface_y = 14 + int(top_h * (0.64 if kind == "jar" else 0.58))
    by = product_bottom - surface_y
    img.alpha_composite(podium, (bx, by))
    img.alpha_composite(product, (px, py))
    shadow = Image.new("RGBA", (tw + 60, 34), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow, "RGBA")
    sd.ellipse((12, 5, tw + 48, 30), fill=(42, 28, 18, 72 if kind == "jar" else 44))
    shadow = shadow.filter(ImageFilter.GaussianBlur(7))
    img.alpha_composite(shadow, (cx - shadow.width // 2, product_bottom - 16))

    price_x = 54
    price_y = text_y + 30
    d.rounded_rectangle((price_x, price_y, price_x + 265, price_y + 112), radius=16, fill=(18, 18, 17, 250))
    d.text((price_x + 24, price_y + 18), "PRICE", font=F_PRICE_LABEL, fill=(246, 214, 115, 255))
    d.text((price_x + 24, price_y + 48), f"TK {int(float(row['price_bdt']))}", font=F_PRICE, fill=(255, 255, 255, 255))

    title_x = price_x + 305
    lines, tf = wrap_title(d, row["product"], w - title_x - 54, 40 if h == 1080 else 43)
    for i, line in enumerate(lines):
        d.text((title_x, price_y + 8 + i * (tf.size + 8)), line, font=tf, fill=(34, 34, 34, 255))
    d.text((54, h - 70), "COD available", font=F_SMALL, fill=(61, 61, 61, 255))
    site_text = "E-MART.COM.BD"
    site_w = d.textbbox((0, 0), site_text, font=F_SMALL)[2]
    d.text((w - 54 - site_w, h - 70), site_text, font=F_SMALL, fill=(61, 61, 61, 255))

    out_name = Path(row["fb_image" if suffix == "1x1" else "ig_image"]).name
    out_path = OUT_DIR / "images" / out_name
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(out_path, quality=94)
    return out_path


def contact_sheet(rows: list[dict[str, str]]) -> None:
    thumbs = []
    for row in rows:
        p = OUT_DIR / "images" / Path(row["fb_image"]).name
        im = Image.open(p).convert("RGB").resize((260, 260), Image.LANCZOS)
        thumbs.append((row, im))
    cols = 6
    cell_w, cell_h = 300, 360
    sheet = Image.new("RGB", (cols * cell_w, math.ceil(len(thumbs) / cols) * cell_h + 70), "white")
    d = ImageDraw.Draw(sheet)
    d.text((24, 20), "Fresh brand pack v6 - darker warm background + wooden podium adjusted for jars", font=font(32, True), fill=(30, 30, 30))
    for i, (row, im) in enumerate(thumbs):
        x = (i % cols) * cell_w + 20
        y = (i // cols) * cell_h + 70
        sheet.paste(im, (x, y))
        d.text((x, y + 268), f"{int(row['slot']):02d} {row['brand']}", font=font(23, True), fill=(24, 24, 24))
        d.text((x, y + 300), f"TK {int(float(row['price_bdt']))}", font=font(22), fill=(60, 60, 60))
    sheet.save(OUT_DIR / "contact-sheet.jpg", quality=92)


def main() -> None:
    cmap = candidate_map()
    rows = apply_replacements(load_rows(), cmap)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "images").mkdir(exist_ok=True)

    generated_rows = []
    checks = []
    for row in rows:
        source, source_note = source_image(row, cmap)
        fb = render_card(row, source, "1x1")
        ig = render_card(row, source, "4x5")
        new_row = dict(row)
        new_row["fb_image"] = str(fb.relative_to(ROOT))
        new_row["ig_image"] = str(ig.relative_to(ROOT))
        new_row["image_source"] = source_note
        generated_rows.append(new_row)
        checks.append({"slot": int(row["slot"]), "product_id": int(row["product_id"]), "fb_image": new_row["fb_image"], "ig_image": new_row["ig_image"], "status": "rendered"})

    with (OUT_DIR / "approval-table.csv").open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=generated_rows[0].keys())
        writer.writeheader()
        writer.writerows(generated_rows)

    with (OUT_DIR / "approval-pack.md").open("w", encoding="utf-8") as f:
        f.write("# Fresh Brand Product Base v6 Approval Pack\n\n")
        f.write("Review only. Darker warm background, wooden podium/base, jar-specific podium sizing, real Emart logo, no upper-right text badge.\n\n")
        for row in generated_rows:
            f.write(f"- {int(row['slot']):02d}. {row['brand']} - {row['product']} - TK {int(float(row['price_bdt']))}\n")

    (OUT_DIR / "image-fit-check.json").write_text(json.dumps(checks, indent=2), encoding="utf-8")
    contact_sheet(generated_rows)
    print(OUT_DIR)


if __name__ == "__main__":
    main()
