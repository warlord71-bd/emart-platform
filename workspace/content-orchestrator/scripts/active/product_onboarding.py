#!/usr/bin/env python3
"""
Emart Product Onboarding Pipeline

Generates all missing product content for new or incomplete products:
  - Meta description (140-160 chars)
  - Product description draft (800-1200 words)
  - Product FAQ (5 Q&A)
  - pa_concern, pa_skin_type, pa_ingredient taxonomy
  - Marks non-applicable categories (hair, makeup, fragrance, supplements, tools)
    as intentionally blank for skincare-only taxonomies.

Input: product name + price already in WooCommerce.
Output: fully SEO-ready product with all metadata populated.

Usage:
  python3 product_onboarding.py --dry-run --limit 5     # preview on 5 products
  python3 product_onboarding.py --dry-run --ids 50630,2591  # preview specific IDs
  python3 product_onboarding.py --apply --reviewed-file workspace/audit/active/onboarding-...json
  python3 product_onboarding.py --status                 # show coverage stats

Does NOT touch: product name, slug, price, stock, images, orders.
"""

import argparse, json, os, re, sys
from datetime import datetime
from pathlib import Path

try:
    import mysql.connector
except ImportError as exc:
    raise SystemExit("Missing dependency: install mysql-connector-python") from exc

try:
    from openai import OpenAI
except ImportError as exc:
    raise SystemExit("Missing dependency: install openai") from exc

# ── Config ────────────────────────────────────────────────────────────────────

PREFIX = "wp4h_"
DB_HOST = "localhost"
DB_USER = "emart_user"
DB_NAME = "emart_live"
MODEL = "deepseek/deepseek-v3.2"
FALLBACK_MODELS = ["deepseek/deepseek-v4-flash"]

AUDIT_DIR = Path("workspace/audit/active")
TIMESTAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

_db_password = os.environ.get("EMART_DB_PASSWORD")
API_KEY = os.environ.get("OPENROUTER_API_KEY", "")

# ── Concern terms (skincare-only) ─────────────────────────────────────────────

CONCERN_SLUGS = [
    "dryness-hydration", "acne-blemish", "sensitivity", "anti-aging-repair",
    "hyperpigmentation", "brightening", "sunscreen", "wrinkle", "pores-blackheads",
]

# Categories where pa_concern does NOT apply
NON_CONCERN_CATEGORIES = {
    "hair-care", "shampoos", "hair-treatments", "hair-oil", "conditioner",
    "makeup-cosmetics", "face-makeup", "eye-makeup", "lipstick-tint", "lips",
    "foundation", "concealer", "primer", "blush", "bronzer", "powder",
    "fragrances", "beauty-supplements", "health-wellbeing",
    "tools", "accessories", "hair-personal-care",
}

# Categories where pa_skin_type does NOT apply
NON_SKINTYPE_CATEGORIES = NON_CONCERN_CATEGORIES

# Brand → origin mapping (top brands, covers ~80% of catalog)
BRAND_ORIGIN_MAP = {
    "cosrx": "South Korea", "some by mi": "South Korea", "innisfree": "South Korea",
    "beauty of joseon": "South Korea", "axis-y": "South Korea", "anua": "South Korea",
    "isntree": "South Korea", "torriden": "South Korea", "round lab": "South Korea",
    "cerave": "United States", "neutrogena": "United States", "cetaphil": "United States",
    "the ordinary": "Canada", "la roche-posay": "France", "bioderma": "France",
    "eucerin": "Germany", "nivea": "Germany", "hada labo": "Japan",
    "rohto": "Japan", "shiseido": "Japan", "canmake": "Japan",
    "garnier": "France", "loreal": "France", "maybelline": "United States",
}

SKIN_TYPE_SLUGS = ["oily", "dry", "sensitive", "normal"]

INGREDIENT_KEYWORD_MAP = {
    "aha": ["alpha hydroxy", "aha", "lactic acid", "mandelic acid", "glycolic acid"],
    "azelaic-acid": ["azelaic acid"],
    "bakuchiol": ["bakuchiol"],
    "bha": ["beta hydroxy", "bha", "salicylic acid"],
    "bifida": ["bifida"],
    "centella": ["centella", "cica", "madecassoside"],
    "ceramide": ["ceramide"],
    "collagen": ["collagen"],
    "egf": ["epidermal growth factor", "egf"],
    "ginseng": ["ginseng"],
    "hyaluronic-acid": ["hyaluronic acid", "sodium hyaluronate"],
    "mugwort": ["mugwort", "artemisia"],
    "niacinamide": ["niacinamide"],
    "peptide": ["peptide"],
    "propolis": ["propolis"],
    "retinol": ["retinol", "retinal", "retinoid"],
    "rice": ["rice extract", "oryza sativa"],
    "rosemary": ["rosemary", "rosmarinus officinalis"],
    "snail-mucin": ["snail mucin", "snail secretion filtrate"],
    "tea-tree": ["tea tree", "melaleuca alternifolia"],
    "vitamin-c": ["vitamin c", "ascorbic acid", "ascorbyl"],
    "vitamin-e": ["vitamin e", "tocopherol"],
}

# ── Source 1: Woo product_cat → pa_concern (most authoritative) ───────────────
CAT_CONCERN_MAP = {
    "acne-blemish-care": "acne-blemish",
    "anti-aging-repair": "anti-aging-repair",
    "dryness-hydration": "dryness-hydration",
    "pores-oil-control": "pores-blackheads",
    "melasma": "hyperpigmentation",
    "sunscreen": "sunscreen",
    "spot-treatment": "acne-blemish",
    "eye-care": "anti-aging-repair",
}

# ── Source 2: TKM (thekoreanmall.com) competitor concern data ─────────────────
TKM_CONCERN_MAP = {
    "acne": "acne-blemish",
    "aging": "anti-aging-repair",
    "dryness": "dryness-hydration",
    "spot": "brightening",
    "pores": "pores-blackheads",
    "melasma": "hyperpigmentation",
}

BRAND_PHILOSOPHY_FILE = Path("/root/emart-platform/workspace/content-orchestrator/scripts/active/brand_philosophies.json")

def _get_brand_context(brand_name: str) -> dict:
    """Load brand philosophy for LLM context."""
    if not BRAND_PHILOSOPHY_FILE.exists():
        return {"philosophy": "", "tone": "Informative, product-focused", "origin": ""}
    data = json.loads(BRAND_PHILOSOPHY_FILE.read_text())
    for key in [brand_name, brand_name.title(), brand_name.lower(), brand_name.upper()]:
        if key in data:
            return data[key]
    return data.get("_default", {"philosophy": "", "tone": "Informative, product-focused", "origin": ""})

TKM_FILE = Path("/root/.attic-2026-05-15/emart-archive/tkm-concern-progress.json")
_tkm_data = None

def _load_tkm():
    global _tkm_data
    if _tkm_data is None:
        if TKM_FILE.exists():
            raw = json.loads(TKM_FILE.read_text())
            _tkm_data = {}
            for slug, label in raw.items():
                if isinstance(label, str) and label in TKM_CONCERN_MAP:
                    _tkm_data[slug] = TKM_CONCERN_MAP[label]
        else:
            _tkm_data = {}
    return _tkm_data

# ── Source 3: Title/ingredient keyword fallback ───────────────────────────────
CONCERN_KEYWORD_MAP = {
    "dryness-hydration": ["hydrat", "moistur", "dry", "ceramide", "hyaluronic"],
    "acne-blemish": ["acne", "blemish", "salicylic", "bha", "tea tree", "pimpl"],
    "sensitivity": ["sensitive", "soothing", "calming", "centella", "cica", "aloe"],
    "anti-aging-repair": ["anti-aging", "retinol", "peptide", "collagen", "wrinkle", "firming"],
    "hyperpigmentation": ["pigment", "dark spot", "melasma", "tranexamic", "arbutin"],
    "brightening": ["brighten", "vitamin c", "niacinamide", "glow", "radian",
                    "arbutin", "dark spot", "whitening", "luminous", "radiance", "azelaic"],
    "sunscreen": ["spf", "sunscreen", "sun block", "uv protect", "sun cream"],
    "wrinkle": ["wrinkle", "fine line", "retinol", "peptide", "anti-wrinkle",
                "lifting", "firming", "elastin"],
    "pores-blackheads": ["pore", "blackhead", "oil control", "mattif", "bha", "clay"],
}

# Explicit title phrases (highest confidence — product says what it's for)
TITLE_SKIN_PHRASES = {
    "for oily skin": "oily",
    "for oily": "oily",
    "oil control": "oily",
    "for combination skin": "combination",
    "for dry skin": "dry",
    "for dryness": "dry",
    "for normal skin": "normal",
    "for sensitive skin": "sensitive",
    "for sensitive": "sensitive",
    "for all skin": "normal",
}

SKIN_TYPE_KEYWORD_MAP = {
    "oily": ["oily", "oil control", "mattif", "shine-free", "sebum"],
    "dry": ["dry", "hydrat", "moistur", "nourish"],
    "sensitive": ["sensitive", "gentle", "soothing", "fragrance-free", "hypoallergenic"],
    "normal": ["all skin", "normal skin", "every skin"],
}

# ── DB ────────────────────────────────────────────────────────────────────────

_conn = None

def db():
    global _conn
    if _conn is None or not _conn.is_connected():
        if not _db_password:
            raise RuntimeError("EMART_DB_PASSWORD is required")
        _conn = mysql.connector.connect(
            host=DB_HOST, user=DB_USER, password=_db_password,
            database=DB_NAME, charset="utf8mb4",
        )
    return _conn


def query(sql, params=None):
    cur = db().cursor(dictionary=True)
    cur.execute(sql, params or ())
    rows = cur.fetchall()
    cur.close()
    return rows


def execute(sql, params=None):
    cur = db().cursor()
    cur.execute(sql, params or ())
    db().commit()
    cur.close()


# ── Product loading ───────────────────────────────────────────────────────────

def get_product_meta(product_id, key):
    rows = query(
        f"SELECT meta_value FROM {PREFIX}postmeta WHERE post_id=%s AND meta_key=%s LIMIT 1",
        (product_id, key),
    )
    return rows[0]["meta_value"] if rows else ""


def get_product_taxonomies(product_id, taxonomy):
    return query(f"""
        SELECT t.name, t.slug FROM {PREFIX}terms t
        JOIN {PREFIX}term_taxonomy tt ON t.term_id = tt.term_id
        JOIN {PREFIX}term_relationships tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
        WHERE tr.object_id = %s AND tt.taxonomy = %s
    """, (product_id, taxonomy))


def get_products_needing_work(limit=20, product_ids=None):
    """Find published products missing content."""
    if product_ids:
        placeholders = ",".join(["%s"] * len(product_ids))
        where = f"AND p.ID IN ({placeholders})"
        params = tuple(product_ids)
    else:
        where = ""
        params = ()

    rows = query(f"""
        SELECT p.ID, p.post_title as name, p.post_name as slug, p.post_content, p.post_excerpt
        FROM {PREFIX}posts p
        WHERE p.post_type = 'product' AND p.post_status = 'publish'
        {where}
        ORDER BY p.ID ASC
    """, params)

    products = []
    for r in rows:
        pid = r["ID"]
        cats = get_product_taxonomies(pid, "product_cat")
        cat_slugs = {c["slug"] for c in cats}
        brands = get_product_taxonomies(pid, "product_brand")
        concerns = get_product_taxonomies(pid, "pa_concern")
        skin_types = get_product_taxonomies(pid, "pa_skin_type")
        ingredients_tax = get_product_taxonomies(pid, "pa_ingredient")
        meta_desc = get_product_meta(pid, "_rank_math_description")
        faq_raw = get_product_meta(pid, "_emart_product_faq")
        ingredients = get_product_meta(pid, "_emart_ingredients")
        how_to_use = get_product_meta(pid, "_emart_how_to_use")
        content_words = len(re.findall(r"\w+", re.sub(r"<[^>]+>", " ", r.get("post_content") or "")))

        is_non_skincare = bool(cat_slugs & NON_CONCERN_CATEGORIES)
        needs_concern = not concerns and not is_non_skincare
        needs_skin_type = not skin_types and not is_non_skincare
        needs_meta = not meta_desc or len(meta_desc) < 100
        needs_faq = not faq_raw
        needs_ingredient = not ingredients_tax and bool(re.sub(r"<[^>]+>", " ", ingredients or "").strip())
        needs_description = content_words < 800

        if not (needs_concern or needs_skin_type or needs_meta or needs_faq or needs_ingredient or needs_description):
            continue

        products.append({
            "id": pid,
            "name": r["name"],
            "slug": r["slug"],
            "categories": [c["name"] for c in cats],
            "cat_slugs": cat_slugs,
            "brand": brands[0]["name"] if brands else "",
            "is_non_skincare": is_non_skincare,
            "has_concern": bool(concerns),
            "has_skin_type": bool(skin_types),
            "has_ingredients_tax": bool(ingredients_tax),
            "has_meta_desc": bool(meta_desc) and len(meta_desc) >= 100,
            "has_faq": bool(faq_raw),
            "has_ingredients": bool(ingredients),
            "has_how_to_use": bool(how_to_use),
            "content_words": content_words,
            "short_description": re.sub(r"<[^>]+>", " ", r.get("post_excerpt") or "")[:500],
            "ingredients_text": (ingredients or "")[:500],
            "needs": {
                "concern": needs_concern,
                "skin_type": needs_skin_type,
                "meta_desc": needs_meta,
                "faq": needs_faq,
                "ingredient": needs_ingredient,
                "description": needs_description,
            },
        })

        # Limit gaps, not the first N catalog rows. The old query silently missed
        # every gap whose product ID fell after its SQL LIMIT window.
        if len(products) >= limit:
            break

    return products


# ── Stage 1: Rule-based assignment (no LLM) ──────────────────────────────────

def rule_assign_concern(product):
    """Three-source priority: (1) Woo category, (2) TKM data, (3) keyword fallback."""
    if product["is_non_skincare"] or product["has_concern"]:
        return []

    matched = set()

    # Source 1: Woo product_cat → concern (most authoritative)
    for cat_slug in product.get("cat_slugs", set()):
        if cat_slug in CAT_CONCERN_MAP:
            matched.add(CAT_CONCERN_MAP[cat_slug])

    # Source 2: TKM competitor data (slug-based lookup)
    if not matched:
        tkm = _load_tkm()
        product_slug = product.get("slug", "")
        if product_slug in tkm:
            matched.add(tkm[product_slug])

    # Source 3: title + ingredient keyword fallback (only when 1 and 2 miss)
    if not matched:
        text = f"{product['name']} {product.get('ingredients_text', '')}".lower()
        for slug, keywords in CONCERN_KEYWORD_MAP.items():
            if any(kw in text for kw in keywords):
                matched.add(slug)

    return sorted(matched)[:3]


def rule_assign_skin_type(product):
    """Two-pass: (1) explicit title phrases, (2) keyword fallback."""
    if product["is_non_skincare"] or product["has_skin_type"]:
        return []

    matched = set()
    title_lower = product["name"].lower()

    # Pass 1: explicit title phrases (highest confidence)
    for phrase, slug in TITLE_SKIN_PHRASES.items():
        if phrase in title_lower:
            matched.add(slug)

    # Pass 2: keyword fallback from name + ingredients
    if not matched:
        text = f"{product['name']} {product.get('ingredients_text', '')}".lower()
        for slug, keywords in SKIN_TYPE_KEYWORD_MAP.items():
            if any(kw in text for kw in keywords):
                matched.add(slug)

    return sorted(matched)[:2]


def rule_assign_ingredients(product):
    """Extract only existing ingredient terms from sourced ingredient metadata."""
    if product["has_ingredients_tax"] or not product["has_ingredients"]:
        return []
    text = re.sub(r"<[^>]+>", " ", product.get("ingredients_text", "")).lower()
    matched = []
    for slug, keywords in INGREDIENT_KEYWORD_MAP.items():
        if any(re.search(rf"(?<![a-z]){re.escape(keyword)}(?![a-z])", text) for keyword in keywords):
            matched.append(slug)
    return matched[:5]


# ── Stage 2: LLM generation ──────────────────────────────────────────────────

def build_llm_prompt(product):
    """Build a structured prompt for missing content."""
    parts = []

    if product["needs"]["meta_desc"]:
        parts.append("""META DESCRIPTION (required):
  - 140-160 characters exactly
  - Format: {Brand} {product type} for {use/benefit}. Buy authentic at Emart Bangladesh — COD available.
  - Must mention brand name and Bangladesh
  - No quotes, no line breaks""")

    if product["needs"].get("description") and not product["is_non_skincare"]:
        parts.append("""DESCRIPTION_HTML (required):
  Write a 900-1200 word product page in safe HTML (h2, h3, p, strong, ul, li only).
  Write like a real product page from a trusted skincare retailer — NOT like AI-generated filler.
  AIM FOR 1000+ WORDS. Skinnora.com averages 1,250 words per product. Match that depth.

  STRUCTURE (vary the headings — don't use exact same words every time):

  Opening (2 paragraphs, 150-200 words total):
    - Paragraph 1: What this product is, what it does, who should care. Start with the product
      name and a concrete statement. Short sentences mixed with longer ones.
    - Paragraph 2: Why the formula works — name 2-3 ingredients and explain what they do in
      plain language. Mention one product to pair it with.

  Ingredients section (3-5 ingredients, 150-200 words):
    - Bold ingredient name, then 1-2 sentences on what it does IN THIS PRODUCT
    - Be specific: "draws water into the upper epidermis" not "hydrates skin"

  Who it's for (80-100 words):
    - List 3-4 skin types/concerns this actually helps, with a one-line reason each
    - Include 1 honest "skip this if..." note

  How to use (60-80 words):
    - 3-4 short steps. When (AM/PM). Where in routine. One real tip.

  Routine Fit (80-120 words):
    - Where this product sits in a full AM or PM routine (step 1, 2, 3...)
    - Name 2-3 specific complementary products from the same brand or popular pairings
    - Example: "After cleansing with [X], apply this before [Y] moisturizer"
    - This is what makes Skinnora pages sticky — readers discover other products to buy

  Local note (50-70 words):
    - Origin + authenticity. One climate-relevant sentence. COD mention.
    - Make it feel like a real store's guarantee, not marketing copy

  RULES:
  - "Bangladesh" appears 2-3 times naturally
  - "COD" or "Cash on Delivery" once
  - Brand name 3+ times
  - No medical cure claims, no prices, no fake review references
  - Every sentence must be specific to THIS product — not swappable with another product
  - Include one honest limitation (texture, scent, not suitable for X)
  - MINIMUM 900 WORDS in description_html. Count your output. If under 900, expand the
    ingredients section (add 2-3 more ingredients), add more detail to routine fit, and
    flesh out the how-to-use with a longer pro tip. Our competitor Skinnora averages 1,250
    words. Do not submit under 900.""")

    if product["needs"]["faq"] and not product["is_non_skincare"]:
        parts.append("""FAQ (required):
  - Exactly 5 Q&A pairs about THIS specific product
  - Use the product's full name in at least 3 questions (e.g. "Is the COSRX Low pH Good Morning Gel Cleanser suitable for sensitive skin?")
  - Topics: (1) what it does/main benefit, (2) skin type suitability, (3) daily use/frequency, (4) specific concern it addresses, (5) size/how long it lasts or layering advice
  - Answers: 2-3 sentences, actionable, mention one complementary product if relevant
  - No delivery/COD/return/price questions — product-only
  - Tone: knowledgeable friend, not marketing copy""")

    if product["needs"]["concern"] and not product["is_non_skincare"]:
        parts.append(f"""CONCERNS (required):
  - Pick 1-3 from ONLY these: {', '.join(CONCERN_SLUGS)}
  - Based on what the product actually treats/addresses
  - If none genuinely apply, return empty list""")

    if product["needs"]["skin_type"] and not product["is_non_skincare"]:
        parts.append(f"""SKIN TYPES (required):
  - Pick 1-3 from ONLY these: {', '.join(SKIN_TYPE_SLUGS)}
  - Based on who the product is formulated for
  - If truly for all types, return ["oily", "dry", "sensitive", "normal"]""")

    if not parts:
        return None

    category_str = ", ".join(product["categories"][:3])
    ingredients_str = product.get("ingredients_text", "")[:300]
    brand_name = product.get("brand", "")
    brand_ctx = _get_brand_context(brand_name) if brand_name else {"philosophy": "", "tone": "Informative", "origin": ""}

    return f"""Product: {product['name']}
Brand: {brand_name or 'Unknown'}
Brand philosophy: {brand_ctx.get('philosophy', '')}
Brand tone: {brand_ctx.get('tone', 'Informative, product-focused')}
Origin: {brand_ctx.get('origin', '')}
Categories: {category_str}
Ingredients: {ingredients_str or 'Not available'}
Existing short description: {product.get('short_description') or 'Not available'}

EMART WRITING STYLE — CRITICAL RULES:

ANTI-AI-DETECTION (if you violate these, the content is useless):
- NEVER use these words/phrases: "formulated with", "designed to", "perfect for", "making it ideal",
  "powerhouse", "game-changer", "holy grail", "elevate", "unlock", "journey", "transform your",
  "dive into", "harness", "embark", "delve", "realm", "seamless", "ensuring", "boasting",
  "it is worth noting", "furthermore", "moreover", "in conclusion", "whether you're"
- VARY sentence structure — mix short punchy sentences (5-8 words) with longer ones. Never start
  3+ sentences in a row the same way. Use fragments occasionally. Ask a question mid-paragraph.
- VARY section order and headings — do NOT always use the exact same H2 headings in the same order.
  Rename headings naturally: "What's Inside" instead of always "Key Ingredients", "Who Should Use This"
  instead of always "Best For", "The Emart Take" instead of always "Why Buy from Emart".
- Use contractions (it's, doesn't, won't, you'll). Never write "it is" when "it's" works.
- Include 1-2 slightly informal expressions per description ("this stuff works", "not gonna lie",
  "here's the deal", "the short version")
- Mention a specific limitation or honest drawback — real reviews always note one downside
- Vary paragraph lengths: 2 sentences, then 4, then 1, then 3 — never uniform blocks

VOICE:
- Write like a skincare-obsessed friend in Dhaka who actually uses the products and knows the science
- First sentence: state what the product IS and what it DOES — no preamble, no "Are you looking for"
- Bangladesh climate: pick ONE that fits this product (humidity, summer heat, AC-dried skin, pollution,
  winter dryness). NOT monsoon on every product.
- Origin authenticity: mention once naturally
- "COD" or "Cash on Delivery": mention once
- Brand philosophy informs the language subtly — don't announce it

CONTENT:
- Every claim must be product-specific — if you can swap in another product name and the sentence
  still works, rewrite it
- Name 3+ specific ingredients with what they actually do (not "powerful ingredient")
- Include one honest "this won't work for..." note
- Reference one complementary product from the same brand for routine pairing

Generate the following for this product. Return ONLY valid JSON, no markdown fences.

{chr(10).join(parts)}

Return JSON:
{{
  "meta_description": "...",
  "description_html": "<h2>...</h2><p>...</p>",
  "faq": [{{"q": "...", "a": "..."}}, ...],
  "concerns": ["slug1", "slug2"],
  "skin_types": ["slug1", "slug2"]
}}

Only include keys you were asked to generate. Omit keys not listed above."""


def call_llm(prompt, models=None):
    """Call OpenRouter with fallback models."""
    api_key = os.environ.get("OPENROUTER_API_KEY", "") or API_KEY
    if not api_key:
        return None
    client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=api_key)
    model_list = models or [MODEL] + FALLBACK_MODELS

    for model in model_list:
        try:
            print(f"    LLM call: {model}...")
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=6000,
                timeout=120,
            )
            text = resp.choices[0].message.content.strip()
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
            return json.loads(text)
        except Exception as e:
            print(f"  LLM {model}: {e}")
            continue
    return None


# ── Stage 2 validation ────────────────────────────────────────────────────────

def validate_meta(meta, product=None):
    if not meta or not isinstance(meta, str):
        return False
    if len(meta) < 140 or len(meta) > 160:
        return False
    if "xyz" in meta.lower() or "{" in meta:
        return False
    if "bangladesh" not in meta.lower():
        return False
    if product and product.get("brand") and product["brand"].lower() not in meta.lower():
        return False
    return True


def validate_faq(faq):
    if not faq or not isinstance(faq, list):
        return False
    if len(faq) != 5:
        return False
    for item in faq:
        if not item.get("q") or not item.get("a"):
            return False
        if len(item["q"]) < 10 or len(item["a"]) < 20:
            return False
    return True


def validate_description_html(description):
    if not description or not isinstance(description, str):
        return False
    text = re.sub(r"<[^>]+>", " ", description)
    word_count = len(re.findall(r"\w+", text))
    if word_count < 700 or word_count > 1500:
        return False
    if re.search(r"<script|<iframe|onerror=|onclick=", description, re.I):
        return False
    if re.search(r"\b(cure|guaranteed|permanent cure|treats disease)\b", text, re.I):
        return False
    return True


def serialize_faq(faq):
    """Store the Q:/A: text contract consumed by the PDP parser and WP editor."""
    return "\n\n".join(f"Q: {item['q'].strip()}\nA: {item['a'].strip()}" for item in faq)


def validate_concerns(concerns):
    if not isinstance(concerns, list):
        return False
    return all(c in CONCERN_SLUGS for c in concerns)


def validate_skin_types(types):
    if not isinstance(types, list):
        return False
    return all(t in SKIN_TYPE_SLUGS for t in types)


# ── Stage 3: Write-back ──────────────────────────────────────────────────────

def get_or_create_term(name, slug, taxonomy):
    """Get existing term ID or create it."""
    rows = query(
        f"SELECT t.term_id FROM {PREFIX}terms t "
        f"JOIN {PREFIX}term_taxonomy tt ON t.term_id = tt.term_id "
        f"WHERE t.slug = %s AND tt.taxonomy = %s",
        (slug, taxonomy),
    )
    if rows:
        return rows[0]["term_id"]
    execute(f"INSERT INTO {PREFIX}terms (name, slug) VALUES (%s, %s)", (name, slug))
    term_id = query("SELECT LAST_INSERT_ID() as id")[0]["id"]
    execute(
        f"INSERT INTO {PREFIX}term_taxonomy (term_id, taxonomy) VALUES (%s, %s)",
        (term_id, taxonomy),
    )
    return term_id


def assign_taxonomy_terms(product_id, taxonomy, slugs):
    """Assign taxonomy terms to a product."""
    for slug in slugs:
        name = slug.replace("-", " ").title()
        rows = query(
            f"SELECT tt.term_taxonomy_id FROM {PREFIX}terms t "
            f"JOIN {PREFIX}term_taxonomy tt ON t.term_id = tt.term_id "
            f"WHERE t.slug = %s AND tt.taxonomy = %s",
            (slug, taxonomy),
        )
        if not rows:
            continue
        ttid = rows[0]["term_taxonomy_id"]
        existing = query(
            f"SELECT 1 FROM {PREFIX}term_relationships WHERE object_id=%s AND term_taxonomy_id=%s",
            (product_id, ttid),
        )
        if not existing:
            execute(
                f"INSERT INTO {PREFIX}term_relationships (object_id, term_taxonomy_id) VALUES (%s, %s)",
                (product_id, ttid),
            )
            execute(
                f"UPDATE {PREFIX}term_taxonomy SET count = count + 1 WHERE term_taxonomy_id = %s",
                (ttid,),
            )


def set_product_meta(product_id, key, value):
    """Set or update product meta."""
    existing = query(
        f"SELECT meta_id FROM {PREFIX}postmeta WHERE post_id=%s AND meta_key=%s",
        (product_id, key),
    )
    if existing:
        execute(
            f"UPDATE {PREFIX}postmeta SET meta_value=%s WHERE post_id=%s AND meta_key=%s",
            (value, product_id, key),
        )
    else:
        execute(
            f"INSERT INTO {PREFIX}postmeta (post_id, meta_key, meta_value) VALUES (%s, %s, %s)",
            (product_id, key, value),
        )


def set_product_description(product_id, description_html):
    execute(
        f"UPDATE {PREFIX}posts SET post_content=%s, post_modified=NOW(), post_modified_gmt=UTC_TIMESTAMP() WHERE ID=%s AND post_type='product'",
        (description_html, product_id),
    )


# ── Main pipeline ─────────────────────────────────────────────────────────────

def process_product(product, dry_run=True):
    """Process one product through all stages."""
    result = {
        "id": product["id"],
        "name": product["name"],
        "is_non_skincare": product["is_non_skincare"],
        "actions": [],
        "proposed": {},
    }

    # Stage 1: rule-based
    rule_concerns = rule_assign_concern(product)
    rule_skin_types = rule_assign_skin_type(product)
    rule_ingredients = rule_assign_ingredients(product)

    # Stage 2: LLM (only for things rules can't solve)
    llm_data = {}
    needs_llm = product["needs"]["meta_desc"] or product["needs"]["faq"] or product["needs"].get("description")
    needs_llm_concern = product["needs"]["concern"] and not rule_concerns and not product["is_non_skincare"]
    needs_llm_skin = product["needs"]["skin_type"] and not rule_skin_types and not product["is_non_skincare"]

    if needs_llm or needs_llm_concern or needs_llm_skin:
        prompt = build_llm_prompt(product)
        if prompt:
            llm_data = call_llm(prompt) or {}
            if llm_data:
                result["actions"].append("llm_called")

    # Merge: prefer rules, fall back to LLM
    final_concerns = rule_concerns or llm_data.get("concerns", [])
    final_skin_types = rule_skin_types or llm_data.get("skin_types", [])
    final_meta = llm_data.get("meta_description", "")
    final_description = llm_data.get("description_html", "")
    final_faq = llm_data.get("faq", [])

    # Validate
    if final_concerns and not validate_concerns(final_concerns):
        final_concerns = [c for c in final_concerns if c in CONCERN_SLUGS]
    if final_skin_types and not validate_skin_types(final_skin_types):
        final_skin_types = [t for t in final_skin_types if t in SKIN_TYPE_SLUGS]
    meta_valid = validate_meta(final_meta, product)
    description_valid = validate_description_html(final_description)
    faq_valid = validate_faq(final_faq)

    # Stage 3: write-back
    if product["needs"]["concern"] and final_concerns:
        result["actions"].append(f"pa_concern: {final_concerns}")
        result["proposed"]["pa_concern"] = final_concerns
        if not dry_run:
            assign_taxonomy_terms(product["id"], "pa_concern", final_concerns)

    if product["needs"]["skin_type"] and final_skin_types:
        result["actions"].append(f"pa_skin_type: {final_skin_types}")
        result["proposed"]["pa_skin_type"] = final_skin_types
        if not dry_run:
            assign_taxonomy_terms(product["id"], "pa_skin_type", final_skin_types)

    if product["needs"]["ingredient"] and rule_ingredients:
        result["actions"].append(f"pa_ingredient: {rule_ingredients}")
        result["proposed"]["pa_ingredient"] = rule_ingredients
        if not dry_run:
            assign_taxonomy_terms(product["id"], "pa_ingredient", rule_ingredients)

    if product["needs"]["meta_desc"] and meta_valid:
        result["actions"].append(f"meta_desc: {final_meta[:60]}...")
        result["proposed"]["meta_description"] = final_meta
        if not dry_run:
            set_product_meta(product["id"], "_rank_math_description", final_meta)

    if product["needs"].get("description") and description_valid:
        word_count = len(re.findall(r"\w+", re.sub(r"<[^>]+>", " ", final_description)))
        result["actions"].append(f"description_html: {word_count} words")
        result["proposed"]["description_html"] = final_description
        if not dry_run:
            set_product_description(product["id"], final_description)

    if product["needs"]["faq"] and faq_valid:
        result["actions"].append(f"faq: {len(final_faq)} Q&A")
        result["proposed"]["faq"] = final_faq
        if not dry_run:
            faq_serialized = serialize_faq(final_faq)
            set_product_meta(product["id"], "_emart_product_faq", faq_serialized)

    if product["is_non_skincare"] and product["needs"]["concern"]:
        result["actions"].append("skipped: non-skincare (hair/makeup/fragrance/supplement)")

    if not result["actions"]:
        unresolved = [key for key, needed in product["needs"].items() if needed]
        result["actions"].append(f"unresolved: {', '.join(unresolved)}")

    return result


def apply_reviewed_results(reviewed_file):
    """Apply only owner/agent-reviewed proposals from a saved dry-run JSON file."""
    data = json.loads(Path(reviewed_file).read_text())
    applied = 0
    skipped = 0

    for item in data:
        approved = item.get("approved") is True or str(item.get("review_action", "")).upper() == "APPROVE"
        proposed = item.get("proposed") or {}
        product_id = int(item.get("id") or 0)
        if not approved or not product_id or not proposed:
            skipped += 1
            continue

        concerns = proposed.get("pa_concern", [])
        if validate_concerns(concerns):
            assign_taxonomy_terms(product_id, "pa_concern", concerns)

        skin_types = proposed.get("pa_skin_type", [])
        if validate_skin_types(skin_types):
            assign_taxonomy_terms(product_id, "pa_skin_type", skin_types)

        ingredients = proposed.get("pa_ingredient", [])
        if isinstance(ingredients, list):
            assign_taxonomy_terms(product_id, "pa_ingredient", [i for i in ingredients if i in INGREDIENT_KEYWORD_MAP])

        meta_description = proposed.get("meta_description", "")
        if validate_meta(meta_description):
            set_product_meta(product_id, "_rank_math_description", meta_description)

        faq = proposed.get("faq", [])
        if validate_faq(faq):
            set_product_meta(product_id, "_emart_product_faq", serialize_faq(faq))

        description_html = proposed.get("description_html", "")
        if validate_description_html(description_html):
            set_product_description(product_id, description_html)

        applied += 1

    print(f"Applied reviewed onboarding proposals: {applied}; skipped: {skipped}")
    if applied:
        print("Revalidate ISR cache after review/apply: tag=products")


def cmd_status():
    """Print coverage stats."""
    total = query(f"SELECT COUNT(*) as c FROM {PREFIX}posts WHERE post_type='product' AND post_status='publish'")[0]["c"]

    has_concern = query(f"""
        SELECT COUNT(DISTINCT tr.object_id) as c FROM {PREFIX}term_relationships tr
        JOIN {PREFIX}term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
        JOIN {PREFIX}posts p ON p.ID = tr.object_id
        WHERE tt.taxonomy='pa_concern' AND p.post_type='product' AND p.post_status='publish'
    """)[0]["c"]

    has_skin = query(f"""
        SELECT COUNT(DISTINCT tr.object_id) as c FROM {PREFIX}term_relationships tr
        JOIN {PREFIX}term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
        JOIN {PREFIX}posts p ON p.ID = tr.object_id
        WHERE tt.taxonomy='pa_skin_type' AND p.post_type='product' AND p.post_status='publish'
    """)[0]["c"]

    has_ingredient = query(f"""
        SELECT COUNT(DISTINCT tr.object_id) as c FROM {PREFIX}term_relationships tr
        JOIN {PREFIX}term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
        JOIN {PREFIX}posts p ON p.ID = tr.object_id
        WHERE tt.taxonomy='pa_ingredient' AND p.post_type='product' AND p.post_status='publish'
    """)[0]["c"]

    has_meta = query(f"""
        SELECT COUNT(DISTINCT post_id) as c FROM {PREFIX}postmeta
        JOIN {PREFIX}posts p ON p.ID = {PREFIX}postmeta.post_id
        WHERE meta_key='_rank_math_description' AND CHAR_LENGTH(meta_value) >= 100
          AND p.post_type='product' AND p.post_status='publish'
    """)[0]["c"]

    has_faq = query(f"""
        SELECT COUNT(DISTINCT post_id) as c FROM {PREFIX}postmeta
        JOIN {PREFIX}posts p ON p.ID = {PREFIX}postmeta.post_id
        WHERE meta_key='_emart_product_faq' AND meta_value != '' AND meta_value IS NOT NULL
          AND p.post_type='product' AND p.post_status='publish'
    """)[0]["c"]

    has_brand = query(f"""
        SELECT COUNT(DISTINCT tr.object_id) as c FROM {PREFIX}term_relationships tr
        JOIN {PREFIX}term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
        JOIN {PREFIX}posts p ON p.ID = tr.object_id
        WHERE tt.taxonomy='product_brand' AND p.post_type='product' AND p.post_status='publish'
    """)[0]["c"]

    has_origin = query(f"""
        SELECT COUNT(DISTINCT tr.object_id) as c FROM {PREFIX}term_relationships tr
        JOIN {PREFIX}term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
        JOIN {PREFIX}posts p ON p.ID = tr.object_id
        WHERE tt.taxonomy='pa_origin' AND p.post_type='product' AND p.post_status='publish'
    """)[0]["c"]

    # Count non-skincare (where concern shouldn't apply)
    non_skincare = query(f"""
        SELECT COUNT(DISTINCT p.ID) as c FROM {PREFIX}posts p
        JOIN {PREFIX}term_relationships tr ON p.ID = tr.object_id
        JOIN {PREFIX}term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
        JOIN {PREFIX}terms t ON tt.term_id = t.term_id
        WHERE p.post_type='product' AND p.post_status='publish'
        AND tt.taxonomy='product_cat'
        AND t.slug IN ({','.join(['%s']*len(NON_CONCERN_CATEGORIES))})
    """, tuple(NON_CONCERN_CATEGORIES))[0]["c"]

    concern_gap = total - has_concern

    print(f"\n{'='*55}")
    print(f"  EMART PRODUCT ONBOARDING COVERAGE ({total} published)")
    print(f"{'='*55}")
    print(f"  {'Layer':<30} {'Done':>6} / {'Total':>5}  {'%':>5}")
    print(f"  {'-'*50}")
    print(f"  {'pa_brand':<30} {has_brand:>6} / {total:>5}  {has_brand/total*100:>5.1f}%")
    print(f"  {'pa_origin':<30} {has_origin:>6} / {total:>5}  {has_origin/total*100:>5.1f}%")
    print(f"  {'pa_concern':<30} {has_concern:>6} / {total:>5}  {has_concern/total*100 if total else 0:>5.1f}%")
    print(f"    (global unassigned)          {concern_gap:>6} products")
    print(f"    (non-skincare candidates)    {non_skincare:>6} products; review, do not auto-fill")
    print(f"  {'pa_skin_type':<30} {has_skin:>6} / {total:>5}  {has_skin/total*100:>5.1f}%")
    print(f"  {'pa_ingredient':<30} {has_ingredient:>6} / {total:>5}  {has_ingredient/total*100:>5.1f}%")
    print(f"  {'Meta description (100+ chars)':<30} {has_meta:>6} / {total:>5}  {has_meta/total*100:>5.1f}%")
    print(f"  {'Product FAQ':<30} {has_faq:>6} / {total:>5}  {has_faq/total*100:>5.1f}%")
    print(f"{'='*55}\n")


def main():
    parser = argparse.ArgumentParser(description="Emart Product Onboarding Pipeline")
    parser.add_argument("--dry-run", action="store_true", help="Preview only, no writes")
    parser.add_argument("--apply", action="store_true", help="Apply changes to WooCommerce")
    parser.add_argument("--reviewed-file", help="Reviewed dry-run JSON; rows need approved=true or review_action=APPROVE")
    parser.add_argument("--status", action="store_true", help="Show coverage stats")
    parser.add_argument("--limit", type=int, default=10, help="Max products to process")
    parser.add_argument("--ids", type=str, help="Comma-separated product IDs")
    args = parser.parse_args()

    if args.status:
        cmd_status()
        return

    if not args.dry_run and not args.apply:
        print("Specify --dry-run or --apply")
        return

    if args.apply:
        if not args.reviewed_file:
            sys.exit("--apply requires --reviewed-file. Generate dry-run JSON, review rows, then mark approved=true or review_action=APPROVE.")
        apply_reviewed_results(args.reviewed_file)
        return

    dry_run = not args.apply
    product_ids = [int(x) for x in args.ids.split(",")] if args.ids else None

    print(f"{'[DRY RUN]' if dry_run else '[APPLY]'} Processing up to {args.limit} products...")
    products = get_products_needing_work(limit=args.limit, product_ids=product_ids)
    print(f"Found {len(products)} products needing work\n")

    results = []
    for i, p in enumerate(products):
        print(f"[{i+1}/{len(products)}] {p['name'][:50]}")
        if p["is_non_skincare"]:
            print(f"  type: non-skincare ({', '.join(list(p['cat_slugs'] & NON_CONCERN_CATEGORIES)[:2])})")

        result = process_product(p, dry_run=dry_run)
        results.append(result)
        for a in result["actions"]:
            print(f"  → {a}")
        print()

    # Save results
    out_file = AUDIT_DIR / f"onboarding-{TIMESTAMP}.json"
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    out_file.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"Results: {out_file}")

    applied = sum(1 for r in results if any("skipped" not in a and "nothing" not in a for a in r["actions"]))
    skipped = sum(1 for r in results if any("skipped" in a for a in r["actions"]))
    print(f"\nSummary: {applied} products {'would be ' if dry_run else ''}updated, {skipped} non-skincare skipped")

    if not dry_run and applied:
        print("\nRevalidate ISR cache to see changes live:")
        print("  curl -X POST https://e-mart.com.bd/api/revalidate -H 'x-revalidate-secret: $REVALIDATE_SECRET' -H 'Content-Type: application/json' -d '{\"tag\":\"products\"}'")


if __name__ == "__main__":
    main()
