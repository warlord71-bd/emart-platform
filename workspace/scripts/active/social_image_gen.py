#!/usr/bin/env python3
"""
Emart Social Media Image Generator

Two modes:
  1. Small products (creams, masks, balms) → AI model holding product (full scene)
  2. Larger products (bottles, tubes) → AI muted background + real product composited (bg removed)

Both: Emart branding overlay (logo, price, product name, badge, COD)

Usage:
  python3 social_image_gen.py --product-id 2591
  python3 social_image_gen.py --product-id 2591 --badge "BESTSELLER"
  python3 social_image_gen.py --product-id 2591 --out apps/web/public/images/social/2026-06-25/foo.jpg
  python3 social_image_gen.py --product-id 50630 --badge "NIGHT CARE"

Output default: workspace/audit/active/social/product-{id}-{timestamp}.png (1080x1080)
"""

import argparse, base64, html, json, os, re, sys, urllib.request, urllib.parse, ssl
from datetime import datetime
from pathlib import Path

TEMPLATE_DIR = Path(__file__).parent / "social-templates"
OUTPUT_DIR = Path("workspace/audit/active/social")
TIMESTAMP = datetime.now().strftime("%Y%m%d-%H%M%S")
LOGO_PATHS = [
    Path("apps/web/public/logo.png"),
    Path("/var/www/emart-platform/apps/web/public/logo.png"),
]

# ── SSL + WC helpers ─────────────────────────────────────────────────────────

def _ssl_ctx():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx

def fetch_product(product_id):
    env_file = Path("/var/www/emart-platform/apps/web/.env.local")
    wc_key = wc_secret = ""
    if env_file.exists():
        for line in env_file.read_text().strip().split("\n"):
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                k = k.strip()
                if k in ("WOO_CONSUMER_KEY", "WC_CONSUMER_KEY"):
                    wc_key = v.strip()
                elif k in ("WOO_CONSUMER_SECRET", "WC_CONSUMER_SECRET"):
                    wc_secret = v.strip()
    url = (f"https://127.0.0.1/wp-json/wc/v3/products/{product_id}"
           f"?consumer_key={wc_key}&consumer_secret={wc_secret}")
    req = urllib.request.Request(url, headers={"Host": "e-mart.com.bd"})
    resp = urllib.request.urlopen(req, context=_ssl_ctx(), timeout=15)
    return json.loads(resp.read())

ORIGIN_FLAGS = {
    "South Korea": "🇰🇷", "Japan": "🇯🇵", "United States": "🇺🇸",
    "France": "🇫🇷", "Germany": "🇩🇪", "United Kingdom": "🇬🇧",
    "Canada": "🇨🇦", "India": "🇮🇳", "Thailand": "🇹🇭",
    "Taiwan": "🇹🇼", "China": "🇨🇳", "Bangladesh": "🇧🇩",
    "Indonesia": "🇮🇩", "Italy": "🇮🇹", "Australia": "🇦🇺",
}

# ── AI image generation (Pollinations.ai, free) ──────────────────────────────

def generate_ai_image(prompt, output_path, seed=42):
    url = f"https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt)}?width=1080&height=1080&nologo=true&seed={seed}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    resp = urllib.request.urlopen(req, context=_ssl_ctx(), timeout=120)
    Path(output_path).write_bytes(resp.read())

def logo_data_uri():
    for path in LOGO_PATHS:
        if path.exists():
            encoded = base64.b64encode(path.read_bytes()).decode()
            return f"data:image/png;base64,{encoded}"
    return ""

# ── Small product detection (→ model holding product) ─────────────────────────

SMALL_PRODUCT_CATEGORIES = {
    "night-cream", "eye-care", "face-masks", "lip-care", "lips",
    "lipstick-tint", "blush", "concealer", "primer", "powder",
    "balm", "spot-treatment",
}

SMALL_PRODUCT_KEYWORDS = [
    "cream", "mask", "balm", "sleeping pack", "eye ", "lip ", "pot", "jar",
    " 30g", " 40g", " 48g", " 50g", " 60g", " 15g", " 10g", " 20g", " 25g",
    " 15ml", " 20ml", " 30ml",
]

MODEL_SCENE_PROMPTS = {
    "night-cream": "young south asian bangladeshi woman with glowing dewy skin holding small white cream jar close to face, soft purple bedroom bokeh lights background, nighttime skincare routine, beauty ad photography, warm soft lighting, commercial quality, no text no watermark no logo",
    "face-masks": "young south asian bangladeshi woman with glowing skin holding small white jar near face smiling, clean spa towel on head, fresh natural look, minimal warm background, beauty product photography, commercial quality, no text no watermark no logo",
    "eye-care": "close up young south asian bangladeshi woman with perfect skin gently applying product under eye holding small white tube, clean soft background, beauty skincare ad, commercial quality, no text no watermark no logo",
    "lips": "young south asian bangladeshi woman with glossy lips holding small cosmetic product near mouth, clean soft pink background, beauty makeup ad, commercial quality, no text no watermark no logo",
    "_default": "young south asian bangladeshi woman with glowing healthy skin holding small white cream jar close to face, soft smile, clean minimal warm beige background, beauty skincare ad photography, soft natural lighting, commercial quality, no text no watermark no logo",
}

def _is_small_product(name, cat_slugs):
    if cat_slugs & SMALL_PRODUCT_CATEGORIES:
        return True
    return any(kw in name.lower() for kw in SMALL_PRODUCT_KEYWORDS)

def _get_model_prompt(cat_slugs):
    for slug in cat_slugs:
        if slug in MODEL_SCENE_PROMPTS:
            return MODEL_SCENE_PROMPTS[slug]
    return MODEL_SCENE_PROMPTS["_default"]

# ── Background prompts for larger products (muted, not busy) ──────────────────

CATEGORY_BG_PROMPTS = {
    "sunscreen": "minimal soft beige sand surface with very subtle ocean blur far background, muted pastel tones, low saturation, clean flat beauty photography backdrop, no objects no people no text, out of focus",
    "face-cleansers": "plain soft white marble surface, very minimal muted tones, subtle water drop texture, clean flat backdrop, no objects no people no text, extremely blurred",
    "serums-ampoules-essences": "simple dark gray concrete surface with very subtle warm light, minimal muted tones, clean flat premium backdrop, no objects no people no text, soft out of focus",
    "toners-mists": "simple soft sage green blurred surface, very minimal muted pastel, clean flat botanical backdrop, no objects no people no text, extremely out of focus",
    "night-cream": "simple dark navy blue soft fabric surface, very minimal muted tones, clean flat nighttime backdrop, no objects no people no text, extremely blurred",
    "face-masks": "simple warm beige stone surface, very minimal muted earth tones, clean flat spa backdrop, no objects no people no text, extremely out of focus",
    "shampoos": "simple soft teal water surface, very minimal muted tones, clean flat fresh backdrop, no objects no people no text, extremely blurred",
    "makeup-cosmetics": "simple warm rose gold surface, very minimal muted tones, clean flat glamour backdrop, no objects no people no text, extremely out of focus",
    "_default": "simple clean light gray surface with very soft natural light, extremely minimal muted tones, flat professional studio backdrop, no objects no people no text, out of focus",
}

CATEGORY_BG_GRADIENT = {
    "sunscreen": "linear-gradient(160deg, #87CEEB 0%, #4a90b8 30%, #d4a574 70%, #c2956a 100%)",
    "serums-ampoules-essences": "linear-gradient(135deg, #2d1b4e 0%, #4a2d6e 40%, #6b4190 100%)",
    "night-cream": "linear-gradient(145deg, #1a1a3e 0%, #2d2d5e 40%, #3d3d7e 100%)",
    "_default": "linear-gradient(150deg, #1a2744 0%, #2a4060 30%, #3a6080 60%, #80b0d0 100%)",
}

HIJABI_LIFESTYLE_BG_PROMPTS = {
    "sunscreen": "close-up modest Bangladeshi hijabi young woman in a warm rose-beige hijab and modest dress, smiling softly, clean bright skincare campaign photo, relaxed hands away from face, no product in hands, no bottles, no jars, no tubes, no packaging, pale soft studio background, no readable text no watermark no logo",
    "face-cleansers": "close-up modest Bangladeshi hijabi young woman in a warm rose-beige hijab and modest dress, smiling softly, fresh cleanser skincare campaign photo, relaxed hands away from face, no product in hands, no bottles, no jars, no tubes, no packaging, pale soft studio background, no readable text no watermark no logo",
    "serums-ampoules-essences": "close-up modest Bangladeshi hijabi young woman in a warm rose-beige hijab and modest dress, smiling softly, premium skincare campaign photo, relaxed hands away from face, no product in hands, no bottles, no jars, no tubes, no packaging, pale soft studio background, no readable text no watermark no logo",
    "toners-mists": "close-up modest Bangladeshi hijabi young woman in a warm rose-beige hijab and modest dress, smiling softly, fresh toner skincare campaign photo, relaxed hands away from face, no product in hands, no bottles, no jars, no tubes, no packaging, pale soft studio background, no readable text no watermark no logo",
    "night-cream": "close-up modest Bangladeshi hijabi young woman in a warm rose-beige hijab and modest dress, smiling softly, warm skincare campaign photo, relaxed hands away from face, no product in hands, no bottles, no jars, no tubes, no packaging, pale soft studio background, no readable text no watermark no logo",
    "_default": "close-up modest Bangladeshi hijabi young woman in a warm rose-beige hijab and modest dress, smiling softly, premium skincare campaign photo, relaxed hands away from face, no product in hands, no bottles, no jars, no tubes, no packaging, pale soft studio background, no readable text no watermark no logo",
}

def _get_bg_prompt(cat_slugs, creative_style="studio"):
    if creative_style == "hijabi-lifestyle":
        for slug in cat_slugs:
            if slug in HIJABI_LIFESTYLE_BG_PROMPTS:
                return HIJABI_LIFESTYLE_BG_PROMPTS[slug]
        return HIJABI_LIFESTYLE_BG_PROMPTS["_default"]

    for slug in cat_slugs:
        if slug in CATEGORY_BG_PROMPTS:
            return CATEGORY_BG_PROMPTS[slug]
    return CATEGORY_BG_PROMPTS["_default"]

def _get_gradient_fallback(cat_slugs):
    for slug in cat_slugs:
        if slug in CATEGORY_BG_GRADIENT:
            return CATEGORY_BG_GRADIENT[slug]
    return CATEGORY_BG_GRADIENT["_default"]

# ── Background removal ────────────────────────────────────────────────────────

def remove_bg(image_url):
    from PIL import Image
    from rembg import remove
    import io
    req = urllib.request.Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
    resp = urllib.request.urlopen(req, context=_ssl_ctx(), timeout=15)
    input_img = Image.open(io.BytesIO(resp.read())).convert("RGBA")
    output_img = remove(input_img)
    alpha_box = output_img.getchannel("A").getbbox()
    if alpha_box:
        pad = 18
        left = max(0, alpha_box[0] - pad)
        top = max(0, alpha_box[1] - pad)
        right = min(output_img.width, alpha_box[2] + pad)
        bottom = min(output_img.height, alpha_box[3] + pad)
        output_img = output_img.crop((left, top, right, bottom))
    out_path = f"/tmp/product_nobg_{os.getpid()}.png"
    output_img.save(out_path, "PNG")
    return out_path

# ── Name splitter ─────────────────────────────────────────────────────────────

def _split_product_name(name):
    m = re.search(r'(\d+\s*(?:ml|g|gm|oz|pcs|kg|l))\b', name, re.I)
    size_part = m.group(1).upper() if m else ""
    clean_name = name.replace(m.group(0), '').strip() if m else name
    words = clean_name.split()
    mid = max(2, len(words) // 2)
    return " ".join(words[:mid]).strip(), " ".join(words[mid:]).strip(), size_part

# ── Branding overlay template ─────────────────────────────────────────────────

OVERLAY_HTML = """<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width:1080px; height:1080px;
  font-family:'Inter','Segoe UI',sans-serif;
  overflow:hidden; position:relative;
  background: {{BG}};
}
.product-img {
  position:absolute; top:50%; left:50%; transform:translate(-50%,-48%);
  width:900px; height:860px;
  display:flex; align-items:center; justify-content:center;
  filter: drop-shadow(0 30px 60px rgba(0,0,0,0.45)) drop-shadow(0 10px 25px rgba(0,0,0,0.25));
}
.product-img img { width:auto; height:650px; max-width:860px; max-height:830px; object-fit:contain; }
.podium-base { display:none; }
body.podium .podium-base {
  display:block;
  position:absolute; left:146px; right:146px; bottom:134px; height:126px;
  border-radius:50%;
  background:
    radial-gradient(ellipse at 50% 24%, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.42) 38%, rgba(255,255,255,0) 68%),
    linear-gradient(180deg, rgba(248,249,247,0.76) 0%, rgba(201,212,209,0.64) 58%, rgba(115,132,133,0.30) 100%);
  border:1px solid rgba(255,255,255,0.56);
  box-shadow:
    inset 0 9px 18px rgba(255,255,255,0.50),
    inset 0 -10px 22px rgba(60,74,76,0.12),
    0 30px 54px rgba(0,0,0,0.20);
}
body.podium .podium-base::before {
  content:"";
  position:absolute; left:12%; right:12%; top:18%; height:24%;
  border-radius:50%;
  background:rgba(255,255,255,0.46);
  filter:blur(8px);
}
body.podium .product-img {
  top:auto; bottom:176px; transform:translateX(-50%);
  width:760px; height:710px; align-items:flex-end;
  filter: drop-shadow(0 28px 30px rgba(0,0,0,0.22)) drop-shadow(0 8px 10px rgba(0,0,0,0.14));
}
body.podium .product-img img {
  height:630px; max-width:700px; max-height:710px; object-fit:contain;
}
body.hijabi-lifestyle .product-img {
  top:70%; left:67%; transform:translate(-50%,-50%) rotate(7deg);
  width:430px; height:520px;
}
body.hijabi-lifestyle .product-img img {
  height:430px; max-width:420px; max-height:500px;
}
body.hijabi-lifestyle .overlay {
  background: linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.04) 28%, rgba(0,0,0,0.04) 55%, rgba(0,0,0,0.22) 78%, rgba(0,0,0,0.58) 100%);
}
.overlay {
  position:absolute; inset:0;
  background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.0) 45%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.55) 100%);
}
.brand-logo {
  position:absolute; top:34px; left:38px;
  display:flex; align-items:center; gap:12px;
  padding:8px 14px 8px 8px;
  border-radius:20px;
  background:rgba(255,255,255,0.18);
  border:1px solid rgba(255,255,255,0.28);
  backdrop-filter:blur(8px);
  box-shadow:0 8px 24px rgba(0,0,0,0.22);
}
.brand-logo img {
  width:58px; height:58px; border-radius:16px; display:block;
  box-shadow:0 4px 14px rgba(0,0,0,0.22);
}
.brand-lockup {
  display:flex; flex-direction:column; gap:2px;
}
.brand-lockup strong {
  font-size:24px; line-height:1; font-weight:900; color:white; letter-spacing:0;
  text-shadow:0 2px 8px rgba(0,0,0,0.72);
}
.brand-lockup span {
  font-size:10px; line-height:1.1; font-weight:800; color:rgba(255,255,255,0.82);
  text-transform:uppercase; letter-spacing:0.8px;
  text-shadow:0 2px 6px rgba(0,0,0,0.65);
}
.info-right {
  position:absolute; top:38px; right:42px; text-align:right; width:480px;
}
.brand-name {
  font-size:24px; font-weight:700; color:white; letter-spacing:2px;
  text-shadow: 0 2px 6px rgba(0,0,0,0.7);
  margin-bottom:4px;
}
.highlight {
  font-size:66px; font-weight:900; color:#F5D060; line-height:1.06;
  text-shadow: 0 3px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.9);
  text-transform:uppercase; margin-bottom:8px;
  overflow-wrap:anywhere; word-break:break-word;
}
.sub-text {
  font-size:26px; font-weight:700; color:white; letter-spacing:0;
  text-shadow: 0 2px 6px rgba(0,0,0,0.7); margin-bottom:10px;
  overflow-wrap:break-word;
}
.size-badge {
  display:inline-block; border:2px solid white; padding:3px 14px;
  font-size:18px; font-weight:700; color:white;
}
.price-area { position:absolute; bottom:94px; left:42px; max-width:420px; }
.old-price {
  font-size:34px; font-weight:800; color:rgba(255,255,255,0.6);
  text-decoration:line-through; text-decoration-color:#e53e3e; text-decoration-thickness:3px;
}
.new-price {
  font-size:92px; font-weight:900; color:#F5D060; line-height:.95;
  text-shadow: 0 4px 16px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.9);
}
.taka { font-size:42px; font-weight:800; color:#F5D060; letter-spacing:2px;
  text-shadow: 0 3px 10px rgba(0,0,0,0.6); }
.save-badge {
  display:inline-block; background:#F5D060; color:#1a1a2e;
  padding:5px 14px; font-size:18px; font-weight:800; letter-spacing:0; margin-top:4px;
}
.pills {
  position:absolute; bottom:128px; right:42px;
  display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; max-width:380px;
}
.pill {
  background:rgba(255,255,255,0.15); backdrop-filter:blur(4px);
  border:1px solid rgba(255,255,255,0.3); color:white;
  padding:5px 14px; border-radius:14px; font-size:14px; font-weight:600;
}
.origin {
  position:absolute; bottom:85px; right:42px;
  font-size:18px; color:rgba(255,255,255,0.85); font-weight:600;
  text-shadow: 0 2px 6px rgba(0,0,0,0.6);
}
.bottom-bar {
  position:absolute; bottom:0; left:0; right:0;
  background:rgba(0,0,0,0.58); backdrop-filter:blur(8px);
  padding:16px 42px; display:flex; justify-content:space-between; align-items:center;
  border-top:1px solid rgba(255,255,255,0.12);
}
.bottom-left {
  font-size:18px; color:rgba(255,255,255,0.92); font-weight:700;
  text-shadow:0 2px 8px rgba(0,0,0,0.55);
}
.bottom-right { display:flex; align-items:center; gap:20px; }
.bottom-url {
  font-size:24px; font-weight:900; color:white; letter-spacing:0.6px;
  text-shadow:0 2px 8px rgba(0,0,0,0.62);
}
.bottom-cod {
  font-size:18px; color:#F5D060; font-weight:900;
  text-shadow:0 2px 8px rgba(0,0,0,0.62);
}
</style></head>
<body class="{{BODY_CLASS}}">
<div class="overlay"></div>
<div class="podium-base"></div>
<div class="product-img"><img src="{{IMAGE_DATA}}" alt="product"></div>
<div class="brand-logo"><img src="{{LOGO_DATA}}" alt="Emart logo"><span class="brand-lockup"><strong>Emart</strong><span>Skincare Bangladesh</span></span></div>
<div class="info-right">
  <div class="brand-name">{{BRAND}}</div>
  <div class="highlight">{{HIGHLIGHT}}</div>
  <div class="sub-text">{{SUB}}</div>
  <div class="size-badge">{{SIZE}}</div>
</div>
<div class="price-area">
  {{OLD_PRICE_HTML}}
  <div class="new-price">{{PRICE}}</div>
  <div class="taka">TAKA</div>
  {{SAVE_HTML}}
</div>
<div class="pills">{{CHIPS}}</div>
<div class="origin">{{FLAG}} {{ORIGIN}}</div>
<div class="bottom-bar">
  <span class="bottom-left">Global Beauty. Local Trust.</span>
  <span class="bottom-right"><span class="bottom-url">E-MART.COM.BD</span><span class="bottom-cod">COD Available</span></span>
</div>
</body></html>"""

# ── Model scene overlay (no product image — full AI scene) ────────────────────

MODEL_OVERLAY_HTML = """<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width:1080px; height:1080px;
  font-family:'Inter','Segoe UI',sans-serif;
  overflow:hidden; position:relative;
  background: {{BG}};
}
.overlay {
  position:absolute; inset:0;
  background: linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.0) 60%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,0.6) 100%);
}
.brand-logo {
  position:absolute; top:34px; left:38px;
  display:flex; align-items:center; gap:12px;
  padding:8px 14px 8px 8px;
  border-radius:20px;
  background:rgba(255,255,255,0.18);
  border:1px solid rgba(255,255,255,0.28);
  backdrop-filter:blur(8px);
  box-shadow:0 8px 24px rgba(0,0,0,0.26);
}
.brand-logo img {
  width:58px; height:58px; border-radius:16px; display:block;
  box-shadow:0 4px 14px rgba(0,0,0,0.24);
}
.brand-lockup {
  display:flex; flex-direction:column; gap:2px;
}
.brand-lockup strong {
  font-size:24px; line-height:1; font-weight:900; color:white; letter-spacing:0;
  text-shadow:0 2px 9px rgba(0,0,0,0.78);
}
.brand-lockup span {
  font-size:10px; line-height:1.1; font-weight:800; color:rgba(255,255,255,0.84);
  text-transform:uppercase; letter-spacing:0.8px;
  text-shadow:0 2px 6px rgba(0,0,0,0.68);
}
.product-name {
  position:absolute; top:38px; right:42px; text-align:right; max-width:500px;
  font-size:28px; font-weight:800; color:white; line-height:1.3;
  text-shadow: 0 2px 10px rgba(0,0,0,0.8);
}
.price-area { position:absolute; bottom:94px; left:42px; max-width:420px; }
.old-price {
  font-size:34px; font-weight:800; color:rgba(255,255,255,0.6);
  text-decoration:line-through; text-decoration-color:#e53e3e; text-decoration-thickness:3px;
}
.new-price {
  font-size:92px; font-weight:900; color:#F5D060; line-height:.95;
  text-shadow: 0 4px 16px rgba(0,0,0,0.8);
}
.taka { font-size:42px; font-weight:800; color:#F5D060;
  text-shadow: 0 3px 10px rgba(0,0,0,0.7); }
.save-badge {
  display:inline-block; background:#F5D060; color:#1a1a2e;
  padding:5px 14px; font-size:18px; font-weight:800; margin-top:4px;
}
.pills {
  position:absolute; bottom:128px; right:42px;
  display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; max-width:380px;
}
.pill {
  background:rgba(255,255,255,0.2); backdrop-filter:blur(4px);
  border:1px solid rgba(255,255,255,0.3); color:white;
  padding:5px 14px; border-radius:14px; font-size:14px; font-weight:600;
}
.origin {
  position:absolute; bottom:85px; right:42px;
  font-size:18px; color:rgba(255,255,255,0.85); font-weight:600;
  text-shadow: 0 2px 6px rgba(0,0,0,0.7);
}
.bottom-bar {
  position:absolute; bottom:0; left:0; right:0;
  background:rgba(0,0,0,0.58); backdrop-filter:blur(8px);
  padding:16px 42px; display:flex; justify-content:space-between; align-items:center;
  border-top:1px solid rgba(255,255,255,0.12);
}
.bottom-left {
  font-size:18px; color:rgba(255,255,255,0.92); font-weight:700;
  text-shadow:0 2px 8px rgba(0,0,0,0.55);
}
.bottom-right { display:flex; align-items:center; gap:20px; }
.bottom-url {
  font-size:24px; font-weight:900; color:white; letter-spacing:0.6px;
  text-shadow:0 2px 8px rgba(0,0,0,0.62);
}
.bottom-cod {
  font-size:18px; color:#F5D060; font-weight:900;
  text-shadow:0 2px 8px rgba(0,0,0,0.62);
}
</style></head>
<body>
<div class="overlay"></div>
<div class="brand-logo"><img src="{{LOGO_DATA}}" alt="Emart logo"><span class="brand-lockup"><strong>Emart</strong><span>Skincare Bangladesh</span></span></div>
<div class="product-name">{{PRODUCT_NAME}}</div>
<div class="price-area">
  {{OLD_PRICE_HTML}}
  <div class="new-price">{{PRICE}}</div>
  <div class="taka">TAKA</div>
  {{SAVE_HTML}}
</div>
<div class="pills">{{CHIPS}}</div>
<div class="origin">{{FLAG}} {{ORIGIN}}</div>
<div class="bottom-bar">
  <span class="bottom-left">Global Beauty. Local Trust.</span>
  <span class="bottom-right"><span class="bottom-url">E-MART.COM.BD</span><span class="bottom-cod">COD Available</span></span>
</div>
</body></html>"""

# ── Screenshot ────────────────────────────────────────────────────────────────

def screenshot_html(html_content, output_path):
    import subprocess
    temp_id = f"{os.getpid()}_{Path(output_path).stem}"
    temp = Path(f"/tmp/social_post_temp_{temp_id}.html")
    temp.write_text(html_content, encoding="utf-8")
    script = f"""
const pw = require('/usr/lib/node_modules/playwright');
(async () => {{
    const browser = await pw.chromium.launch({{
        executablePath: '/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }});
    const page = await browser.newPage({{ viewport: {{ width: 1080, height: 1080 }} }});
    await page.setContent(require('fs').readFileSync('{temp.absolute()}', 'utf-8'), {{ waitUntil: 'networkidle', timeout: 10000 }});
    await page.waitForTimeout(1500);
    const problems = await page.evaluate(() => {{
        const selectors = ['.brand-logo', '.info-right', '.product-name', '.price-area', '.pills', '.origin', '.bottom-bar'];
        const rects = selectors.map((selector) => {{
            const el = document.querySelector(selector);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {{
                selector,
                left: r.left,
                top: r.top,
                right: r.right,
                bottom: r.bottom,
                width: r.width,
                height: r.height,
                scrollWidth: el.scrollWidth,
                scrollHeight: el.scrollHeight,
                clientWidth: el.clientWidth,
                clientHeight: el.clientHeight
            }};
        }}).filter(Boolean);
        const by = Object.fromEntries(rects.map((r) => [r.selector, r]));
        const overlap = (a, b, pad = 8) => a && b && a.left < b.right - pad && a.right > b.left + pad && a.top < b.bottom - pad && a.bottom > b.top + pad;
        const issues = [];
        for (const selector of ['.price-area', '.pills', '.origin']) {{
            if (overlap(by[selector], by['.bottom-bar'], 0)) issues.push(`${{selector}} overlaps bottom bar`);
        }}
        if (overlap(by['.product-name'], by['.price-area'], 24)) issues.push('.product-name overlaps price area');
        for (const r of rects) {{
            if (r.right > 1080 || r.left < 0 || r.bottom > 1080 || r.top < 0) issues.push(`${{r.selector}} escapes canvas`);
            if (r.scrollWidth > r.clientWidth + 2 || r.scrollHeight > r.clientHeight + 2) issues.push(`${{r.selector}} clips text`);
        }}
        if (document.body.innerText.includes('&amp;')) issues.push('escaped entity visible in rendered text');
        return issues;
    }});
    if (problems.length) {{
        throw new Error('Social image layout validation failed: ' + problems.join('; '));
    }}
    await page.screenshot({{ path: '{output_path}', type: 'png' }});
    await browser.close();
}})().catch(e => {{ console.error(e); process.exit(1); }});
"""
    sf = Path(f"/tmp/social_screenshot_{temp_id}.js")
    sf.write_text(script)
    result = subprocess.run(["node", str(sf)], capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise RuntimeError(result.stderr[:200])
    sf.unlink(missing_ok=True)
    temp.unlink(missing_ok=True)

# ── Shared helpers ────────────────────────────────────────────────────────────

def _h(value):
    return html.escape(html.unescape(str(value or "")), quote=True)

def _extract_product_data(product):
    name = product["name"]
    brand = product["brands"][0]["name"] if product.get("brands") else ""
    origin = ""
    for attr in product.get("attributes", []):
        if attr.get("name", "").lower() in ("origin", "pa_origin") and attr.get("options"):
            origin = attr["options"][0]

    price = product.get("price", "")
    regular = product.get("regular_price", "")
    sale = product.get("sale_price", "")

    old_html = save_html = ""
    if sale and regular and sale != regular:
        try:
            saved = int(float(regular)) - int(float(sale))
            old_html = f'<div class="old-price">{int(float(regular))}</div>'
            save_html = f'<div class="save-badge">SAVE {saved} TAKA</div>'
        except (ValueError, TypeError):
            pass
        price = sale

    try:
        price_display = str(int(float(price)))
    except (ValueError, TypeError):
        price_display = str(price)

    cat_slugs = set()
    chips = []
    for cat in product.get("categories", []):
        cat_slugs.add(cat.get("slug", ""))
        if cat["name"] not in ("Korean Beauty", "Japanese Beauty", "Uncategorized") and len(chips) < 3:
            chips.append(cat["name"])

    # Emoji flags render as missing-font boxes in the Playwright/Chromium runtime.
    flag = ""
    chips_html = "\n".join(f'<span class="pill">{_h(c)}</span>' for c in chips)
    image_url = product["images"][0]["src"] if product.get("images") else ""

    return {
        "name": name, "brand": brand, "origin": origin, "flag": flag,
        "price": price_display, "old_html": old_html, "save_html": save_html,
        "cat_slugs": cat_slugs, "chips_html": chips_html, "image_url": image_url,
    }

# ── Main generation ───────────────────────────────────────────────────────────

def generate(product, badge_text="SHOP NOW", force_composite=False, creative_style="studio", background_file=None):
    d = _extract_product_data(product)
    logo_uri = logo_data_uri()
    is_small = False if force_composite else _is_small_product(d["name"], d["cat_slugs"])

    if is_small:
        print("  Mode: MODEL SCENE (small product)")
        prompt = _get_model_prompt(d["cat_slugs"])
        bg_path = f"/tmp/social_model_{product['id']}.png"
        print("  Generating AI model scene...")
        generate_ai_image(prompt, bg_path, seed=product["id"])
        with open(bg_path, "rb") as f:
            bg_b64 = base64.b64encode(f.read()).decode()
        Path(bg_path).unlink(missing_ok=True)

        html = MODEL_OVERLAY_HTML
        html = html.replace("{{BG}}", f"url(data:image/png;base64,{bg_b64}) center/cover no-repeat")
        html = html.replace("{{LOGO_DATA}}", logo_uri)
        html = html.replace("{{PRODUCT_NAME}}", _h(d["name"]))
        html = html.replace("{{PRICE}}", d["price"])
        html = html.replace("{{OLD_PRICE_HTML}}", d["old_html"])
        html = html.replace("{{SAVE_HTML}}", d["save_html"])
        html = html.replace("{{CHIPS}}", d["chips_html"])
        html = html.replace("{{FLAG}}", d["flag"])
        html = html.replace("{{ORIGIN}}", _h(d["origin"] or "Imported"))
    else:
        print("  Mode: COMPOSITE (bg-removed product on muted background)")
        if not d["image_url"]:
            raise ValueError("Composite social images require a product image URL")

        # Remove product background
        img_b64 = ""
        if d["image_url"]:
            try:
                print("  Removing product background...")
                local_path = remove_bg(d["image_url"])
                with open(local_path, "rb") as f:
                    img_b64 = base64.b64encode(f.read()).decode()
                Path(local_path).unlink(missing_ok=True)
            except Exception as e:
                print(f"  BG removal failed ({e}), using original")

        # Generate or load muted AI background
        bg_path = f"/tmp/social_bg_{product['id']}.png"
        try:
            if background_file:
                print(f"  Using external AI background: {background_file}")
                with open(background_file, "rb") as f:
                    bg_b64 = base64.b64encode(f.read()).decode()
                bg_css = f"url(data:image/png;base64,{bg_b64}) center/cover no-repeat"
            else:
                print("  Generating muted AI background...")
                prompt_style = "studio" if creative_style == "podium" else creative_style
                generate_ai_image(_get_bg_prompt(d["cat_slugs"], prompt_style), bg_path, seed=product["id"])
                with open(bg_path, "rb") as f:
                    bg_b64 = base64.b64encode(f.read()).decode()
                bg_css = f"url(data:image/png;base64,{bg_b64}) center/cover no-repeat"
                Path(bg_path).unlink(missing_ok=True)
        except Exception as e:
            print(f"  AI bg failed ({e}), gradient fallback")
            bg_css = _get_gradient_fallback(d["cat_slugs"])

        highlight, sub, size = _split_product_name(d["name"])
        if d["brand"] and highlight.lower().startswith(d["brand"].lower()):
            highlight = highlight[len(d["brand"]):].strip()

        img_src = f"data:image/png;base64,{img_b64}" if img_b64 else d["image_url"]

        html = OVERLAY_HTML
        html = html.replace("{{BODY_CLASS}}", _h(creative_style))
        html = html.replace("{{BG}}", bg_css)
        html = html.replace("{{LOGO_DATA}}", logo_uri)
        html = html.replace("{{IMAGE_DATA}}", img_src)
        html = html.replace("{{BRAND}}", _h(d["brand"].upper()))
        html = html.replace("{{HIGHLIGHT}}", _h(highlight))
        html = html.replace("{{SUB}}", _h(sub))
        html = html.replace("{{SIZE}}", _h(size))
        html = html.replace("{{PRICE}}", d["price"])
        html = html.replace("{{OLD_PRICE_HTML}}", d["old_html"])
        html = html.replace("{{SAVE_HTML}}", d["save_html"])
        html = html.replace("{{CHIPS}}", d["chips_html"])
        html = html.replace("{{FLAG}}", d["flag"])
        html = html.replace("{{ORIGIN}}", _h(d["origin"] or "Imported"))

    return html.replace("{{BODY_CLASS}}", "")

def main():
    parser = argparse.ArgumentParser(description="Emart Social Image Generator")
    parser.add_argument("--product-id", type=int, required=True)
    parser.add_argument("--badge", default="SHOP NOW")
    parser.add_argument("--allow-model-scene", action="store_true", help="Allow AI model scenes for small products. Default is real product composite only.")
    parser.add_argument("--creative-style", choices=("studio", "hijabi-lifestyle", "podium"), default="studio")
    parser.add_argument("--background-file", type=Path, help="Optional AI/background image file to use behind the real product.")
    parser.add_argument("--out", type=Path, help="Optional final output path (.png/.jpg). Parent directory is created.")
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Fetching product {args.product_id}...")
    product = fetch_product(args.product_id)
    print(f"  {product['name']}")

    html = generate(product, args.badge, force_composite=not args.allow_model_scene, creative_style=args.creative_style, background_file=args.background_file)
    output_file = args.out or (OUTPUT_DIR / f"product-{args.product_id}-{TIMESTAMP}.png")
    output_file.parent.mkdir(parents=True, exist_ok=True)
    print("  Rendering screenshot...")
    screenshot_html(html, output_file)
    print(f"Done: {output_file} (1080x1080)")

if __name__ == "__main__":
    main()
