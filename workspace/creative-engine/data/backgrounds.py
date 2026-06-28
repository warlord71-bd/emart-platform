"""
Background removal + AI background generation helpers.

Extracted from social_image_gen.py. Category-aware prompt tables for AI backgrounds
and model scenes, shared across social and video formats.
"""
from __future__ import annotations
import base64, os, ssl, urllib.request, urllib.parse
from pathlib import Path


def _ssl_ctx():
    return ssl.create_default_context()


# ── Background removal ──────────────────────────────────────────────────

def remove_bg(image_url: str) -> str:
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


def image_to_data_uri(src: str) -> str:
    if not src:
        return ""
    if src.startswith("data:"):
        return src
    if src.startswith(("http://", "https://")):
        req = urllib.request.Request(src, headers={"User-Agent": "EmartCreativeEngine/1.0"})
        data = urllib.request.urlopen(req, context=_ssl_ctx(), timeout=30).read()
        return f"data:image/jpeg;base64,{base64.b64encode(data).decode()}"
    p = Path(src)
    if p.exists():
        import mimetypes
        mime = mimetypes.guess_type(str(p))[0] or "image/png"
        return f"data:{mime};base64,{base64.b64encode(p.read_bytes()).decode()}"
    return ""


# ── AI background generation (Pollinations.ai, free) ────────────────────

def generate_ai_image(prompt: str, output_path: str, seed: int = 42):
    url = f"https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt)}?width=1080&height=1080&nologo=true&seed={seed}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    resp = urllib.request.urlopen(req, context=_ssl_ctx(), timeout=120)
    Path(output_path).write_bytes(resp.read())


# ── Small-product detection (→ model-scene mode) ────────────────────────

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


def is_small_product(name: str, cat_slugs: set) -> bool:
    if cat_slugs & SMALL_PRODUCT_CATEGORIES:
        return True
    return any(kw in name.lower() for kw in SMALL_PRODUCT_KEYWORDS)


# ── Category-aware prompt tables ────────────────────────────────────────

MODEL_SCENE_PROMPTS = {
    "night-cream": "young south asian bangladeshi woman with glowing dewy skin holding small white cream jar close to face, soft purple bedroom bokeh lights background, nighttime skincare routine, beauty ad photography, warm soft lighting, commercial quality, no text no watermark no logo",
    "face-masks": "young south asian bangladeshi woman with glowing skin holding small white jar near face smiling, clean spa towel on head, fresh natural look, minimal warm background, beauty product photography, commercial quality, no text no watermark no logo",
    "eye-care": "close up young south asian bangladeshi woman with perfect skin gently applying product under eye holding small white tube, clean soft background, beauty skincare ad, commercial quality, no text no watermark no logo",
    "lips": "young south asian bangladeshi woman with glossy lips holding small cosmetic product near mouth, clean soft pink background, beauty makeup ad, commercial quality, no text no watermark no logo",
    "_default": "young south asian bangladeshi woman with glowing healthy skin holding small white cream jar close to face, soft smile, clean minimal warm beige background, beauty skincare ad photography, soft natural lighting, commercial quality, no text no watermark no logo",
}

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


def get_bg_prompt(cat_slugs: set, creative_style: str = "studio") -> str:
    table = HIJABI_LIFESTYLE_BG_PROMPTS if creative_style == "hijabi-lifestyle" else CATEGORY_BG_PROMPTS
    for slug in cat_slugs:
        if slug in table:
            return table[slug]
    return table["_default"]


def get_model_prompt(cat_slugs: set) -> str:
    for slug in cat_slugs:
        if slug in MODEL_SCENE_PROMPTS:
            return MODEL_SCENE_PROMPTS[slug]
    return MODEL_SCENE_PROMPTS["_default"]


def get_gradient_fallback(cat_slugs: set) -> str:
    for slug in cat_slugs:
        if slug in CATEGORY_BG_GRADIENT:
            return CATEGORY_BG_GRADIENT[slug]
    return CATEGORY_BG_GRADIENT["_default"]
