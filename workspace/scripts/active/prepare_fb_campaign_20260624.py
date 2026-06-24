#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import shutil

ROOT = Path("/root/emart-platform")
SRC = ROOT / "workspace/audit/active/social"
CAL = ROOT / "workspace/social-calendar/2026-06-24"
PUBLIC = ROOT / "apps/web/public/images/social/2026-06-24/fb-18-v3"

POSTS = [
    ("pipeline", 18095, "cosrx-acne-pimple-master-patch", None),
    ("codex", 2611, "innisfree-super-volcanic-clay-mask", "01-innisfree-super-volcanic-clay-mask-model-real.png"),
    ("pipeline", 26653, "3w-clinic-intensive-uv-sunblock", None),
    ("codex", 58162, "dr-althea-345na-relief-cream", "02-dr-althea-345na-relief-cream-model-real.png"),
    ("pipeline", 26327, "welcos-confume-argan-hair-shampoo", None),
    ("codex", 4324, "cosrx-aloe-soothing-sun-cream", "03-cosrx-aloe-sun-cream-model-real.png"),
    ("pipeline", 3018, "missha-airy-fit-sheet-mask-rice", None),
    ("codex", 57130, "dr-althea-vitamin-c-boosting-serum", "04-dr-althea-vitamin-c-serum-model-real.png"),
    ("pipeline", 26933, "cosrx-pure-fit-cica-serum", None),
    ("codex", 47846, "missha-aqua-sun-spf", "05-missha-aqua-sun-model-real.png"),
    ("pipeline", 56475, "apieu-raspberry-hair-vinegar", None),
    ("codex", 4092, "iunik-centella-calming-gel-cream", "06-iunik-centella-calming-gel-model-real.png"),
    ("pipeline", 4140, "mise-en-scene-perfect-hair-serum", None),
    ("codex", 2972, "purito-pure-vitamin-c-serum", "07-purito-pure-vitamin-c-model-real.png"),
    ("pipeline", 26400, "tiam-anti-blemish-body-lotion", None),
    ("codex", 3106, "coxir-ultra-hyaluronic-cleansing-oil", "08-coxir-cleansing-oil-model-real.png"),
    ("pipeline", 43841, "cosrx-ac-collection-acne-patch", None),
    ("pipeline", 58268, "wskin-lab-triple-care-sun-cream", None),
]

def font(size, bold=False):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for item in candidates:
        if Path(item).exists():
            return ImageFont.truetype(item, size=size)
    return ImageFont.load_default()

def latest_png(product_id):
    matches = sorted(SRC.glob(f"product-{product_id}-20260624-*.png"))
    if not matches:
        raise FileNotFoundError(f"missing generated PNG for {product_id}")
    return matches[-1]

def draw_icon(draw, kind, x, y, fill):
    if kind == "shield":
        draw.polygon([(x+18, y+4), (x+34, y+10), (x+31, y+32), (x+18, y+42), (x+5, y+32), (x+2, y+10)], outline=fill, width=3)
        draw.line([(x+10, y+23), (x+16, y+29), (x+28, y+16)], fill=fill, width=3)
    elif kind == "cod":
        draw.rounded_rectangle((x+3, y+11, x+34, y+32), radius=6, outline=fill, width=3)
        draw.ellipse((x+13, y+16, x+24, y+27), outline=fill, width=3)
    elif kind == "truck":
        draw.rounded_rectangle((x+1, y+12, x+25, y+30), radius=4, outline=fill, width=3)
        draw.line((x+25, y+18, x+35, y+18), fill=fill, width=3)
        draw.line((x+35, y+18, x+39, y+30), fill=fill, width=3)
        draw.ellipse((x+7, y+28, x+16, y+37), outline=fill, width=3)
        draw.ellipse((x+29, y+28, x+38, y+37), outline=fill, width=3)
    else:
        draw.line((x+19, y+4, x+19, y+40), fill=fill, width=3)
        draw.line((x+1, y+22, x+37, y+22), fill=fill, width=3)
        draw.line((x+7, y+10, x+31, y+34), fill=fill, width=2)
        draw.line((x+31, y+10, x+7, y+34), fill=fill, width=2)

def add_badges(img, kind):
    img = ImageOps.fit(img.convert("RGB"), (1080, 1080), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    if kind == "pipeline":
        return img
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    label_font = font(23, bold=True)
    small_font = font(17, bold=False)
    badges = [
        ("shield", "AUTHENTIC", "KOREAN PICK"),
        ("cod", "COD", "BD DELIVERY"),
        ("truck", "FAST", "DISPATCH"),
        ("spark", "ROUTINE", "READY"),
    ]
    x = 54
    y = 928
    for kind, top, bottom in badges:
        w = 226
        draw.rounded_rectangle((x, y, x + w, y + 78), radius=24, fill=(255, 255, 255, 226), outline=(245, 208, 96, 230), width=2)
        draw_icon(draw, kind, x + 16, y + 17, (25, 34, 52, 255))
        draw.text((x + 64, y + 16), top, font=label_font, fill=(20, 26, 39, 255))
        draw.text((x + 64, y + 45), bottom, font=small_font, fill=(87, 96, 112, 255))
        x += w + 20
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

def main():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for old_file in PUBLIC.glob("*.jpg"):
        old_file.unlink()
    for sub in ["pipeline", "codex", "public-v3"]:
        (CAL / sub).mkdir(parents=True, exist_ok=True)
    for old_file in (CAL / "public-v3").glob("*.jpg"):
        old_file.unlink()

    model_dir = CAL / "codex-model-samples"
    for index, (kind, product_id, slug, model_file) in enumerate(POSTS, start=1):
        src = model_dir / model_file if model_file else latest_png(product_id)
        if not src.exists():
            raise FileNotFoundError(src)
        png_name = f"{index:02d}-{slug}-1x1.png"
        jpg_name = f"{index:02d}-{slug}-1x1.jpg"
        cal_png = CAL / kind / png_name
        shutil.copy2(src, cal_png)
        img = add_badges(Image.open(src), kind)
        img.save(PUBLIC / jpg_name, "JPEG", quality=88, optimize=True, progressive=True)
        shutil.copy2(PUBLIC / jpg_name, CAL / "public-v3" / jpg_name)
        print(f"{index:02d} {kind:8s} {product_id} -> {jpg_name}")

if __name__ == "__main__":
    main()
