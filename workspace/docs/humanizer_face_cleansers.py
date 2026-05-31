#!/usr/bin/env python3
"""
Face Cleanser Category Humanizer — Final Production Script
===========================================================
Category: https://e-mart.com.bd/category/face-cleansers

WORKFLOW (always follow this order):
  1. DRY-RUN  — generates content, saves to JSONL, no DB writes
  2. REVIEW   — read the JSONL, fix any issues manually
  3. APPLY    — reads reviewed JSONL, writes to DB via WP-CLI

Usage:
  # Generate for next batch of 20 (saves to JSONL):
  OPENROUTER_API_KEY=sk-... python3 humanizer_face_cleansers.py --dry-run --limit 20

  # Review: open workspace/audit/active/face-cleansers-YYYYMMDD.jsonl
  # Fix any issues in the file manually

  # Apply reviewed JSONL to DB:
  OPENROUTER_API_KEY=sk-... python3 humanizer_face_cleansers.py --apply

  # Single product dry-run:
  OPENROUTER_API_KEY=sk-... python3 humanizer_face_cleansers.py --dry-run --post-id 2595

  # Single product apply (must be in JSONL first):
  OPENROUTER_API_KEY=sk-... python3 humanizer_face_cleansers.py --apply --post-id 2595
"""

from __future__ import annotations
import argparse, json, os, re, subprocess, sys, time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from bs4 import BeautifulSoup
from openai import OpenAI
import mysql.connector

# ── Config ─────────────────────────────────────────────────────────────────

API_KEY  = os.environ.get("OPENROUTER_API_KEY", "")
MODEL    = "deepseek/deepseek-v4-flash"
DB_CFG   = dict(host="localhost", database="emart_live",
                user="emart_user", password=os.environ.get("EMART_DB_PASSWORD","Emart@123456"))
PREFIX   = "wp4h_"
WP_PATH  = "/var/www/wordpress"
DATE     = datetime.today().strftime("%Y-%m-%d")
AUDIT    = Path("workspace/audit/active")
JSONL    = AUDIT / f"face-cleansers-{DATE}.jsonl"

COMBINED_DISCLAIMER = (
    '\n<aside class="product-disclaimer">'
    '\n<p><strong>Check on Delivery:</strong> Inspect the product carefully when you receive your order. '
    'Packaging can vary between batches — the tube, box, or label may look slightly different from photos '
    'while the product remains the same original item.</p>'
    '\n<p><strong>Returns:</strong> After delivery is accepted, returns or exchanges depend on '
    "Emart's active return policy and product condition.</p>"
    '\n<p><strong>Storage:</strong> Store in a cool, dry place away from direct sunlight. '
    'Keep out of reach of children. Check expiry date on packaging before use.</p>'
    '\n<p><strong>Patch Test:</strong> If you have sensitive skin, apply a small amount to your '
    'inner wrist and wait 24 hours before full use. Stop use if irritation occurs.</p>'
    '\n</aside>'
)

CLEANSER_TYPES = {
    'oil_balm':    ['oil cleanser','cleansing oil','cleansing balm','balm cleanser'],
    'micellar':    ['micellar'],
    'clay':        ['clay'],
    'foam':        ['foam','foaming','whipping','whipped'],
    'gel':         ['gel'],
    'cream':       ['cream','creamy','milk'],
    'exfoliating': ['powder','exfoliant','scrub'],
}
PAIRING_BY_TYPE = {
    'foam':        "an alcohol-free toner while skin is still slightly damp",
    'gel':         "an alcohol-free toner or lightweight essence after cleansing",
    'cream':       "a gentle hydrating toner or serum — cream cleansers suit dry skin routines",
    'oil_balm':    "a foam or gel cleanser as the second step — this works best as part of a double cleanse",
    'micellar':    "a gentle foam cleanser as a follow-up — micellar water alone may not fully remove SPF or heavy makeup",
    'clay':        "a hydrating toner immediately after — clay tightens skin so moisture replenishment right away helps",
    'exfoliating': "a soothing toner without alcohol — avoid additional acid products on the same day",
}

# ── SEO SCORER ─────────────────────────────────────────────────────────────

@dataclass
class SEOScore:
    post_id:    int
    title:      str
    total:      int = 0
    max_score:  int = 100
    breakdown:  dict = field(default_factory=dict)
    issues:     list = field(default_factory=list)
    warnings:   list = field(default_factory=list)

    @property
    def grade(self) -> str:
        pct = self.total / self.max_score * 100
        if pct >= 90: return "A"
        if pct >= 75: return "B"
        if pct >= 60: return "C"
        if pct >= 45: return "D"
        return "F"

    def summary(self) -> str:
        lines = [f"SEO Score: {self.total}/{self.max_score} ({self.grade}) — {self.title[:45]}"]
        for section, pts in self.breakdown.items():
            lines.append(f"  {section}: {pts['earned']}/{pts['max']} pts")
        for iss in self.issues:
            lines.append(f"  ✗ {iss}")
        for w in self.warnings:
            lines.append(f"  ⚠ {w}")
        return "\n".join(lines)


def seo_score(product: dict, generated: dict) -> SEOScore:
    """
    Score a generated product description on 5 dimensions (100 pts total).
    Returns SEOScore with per-section breakdown and issues list.
    """
    score  = SEOScore(post_id=product.get('post_id',0), title=product.get('title',''))
    html   = generated.get('content_html','')
    meta   = generated.get('meta_desc','')
    plain  = _strip(html)
    ml     = meta.lower()
    pl     = plain.lower()

    # ── 1. STRUCTURE (20 pts) ───────────────────────────────────────────────
    s1 = 0
    REQUIRED = ['Key Benefits','Key Ingredients','Best For','Not Recommended For','How to Use','Routine Fit']
    h3s = [_strip(h) for h in re.findall(r'<h3[^>]*>(.*?)</h3>', html, re.I|re.S)]
    missing = [r for r in REQUIRED if not any(r.lower() in h.lower() for h in h3s)]
    if not missing:        s1 += 10
    elif len(missing) <=2: s1 += 5
    else:                  score.issues.append(f"missing sections: {missing}")
    if not re.search(r'^\s*<h2', html, re.I): s1 += 2
    else: score.issues.append("H2 opener found — duplicates page H1")
    if 'product-disclaimer' in html or 'Check on Delivery' in html: s1 += 3
    else: score.issues.append("no disclaimer block")
    if html.strip().startswith('<p'): s1 += 3
    else: score.warnings.append("description doesn't open with <p>")
    if len(plain) >= 800: s1 += 2
    else: score.issues.append(f"content length {len(plain)} < 800 chars")
    score.breakdown['Structure'] = {'earned': s1, 'max': 20}

    # ── 2. KEYWORD SIGNALS (20 pts) ─────────────────────────────────────────
    s2 = 0
    brand = (product.get('brand') or '').lower()
    if brand and brand in pl[:300]:       s2 += 5
    else: score.warnings.append("brand not in first 300 chars")
    focus_kw = (product.get('focus_keyword') or '').lower()
    if focus_kw and any(w in pl for w in focus_kw.split() if len(w)>4): s2 += 4
    gsc = product.get('gsc_queries') or []
    covered = sum(1 for q in gsc[:3] if q['query'].lower() in pl)
    s2 += min(6, covered * 2)
    if 'price in bangladesh' in ml or 'price at emart' in ml: s2 += 5
    else: score.issues.append("meta missing 'price in Bangladesh' keyword")
    score.breakdown['Keywords'] = {'earned': s2, 'max': 20}

    # ── 3. E-E-A-T (25 pts) ─────────────────────────────────────────────────
    s3 = 0
    # Experience — sensory/observational detail
    EXP_SIGNALS = [r'\d+\s*(second|minute|hour|day|week)',r'absorbs in',r'rinses (clean|well)',
                   r'feels? (light|heavy|tight|smooth|soft|sticky)',r'lather',r'texture',
                   r'coin.sized',r'hazelnut',r'pea.sized',r'\d+\s*(ml|pump|drop)']
    if any(re.search(p, pl, re.I) for p in EXP_SIGNALS): s3 += 5
    else: score.warnings.append("no experience/sensory signal (E-E-A-T: Experience)")
    # Expertise — ingredient mechanism
    EXP2 = [r'(penetrat|dissolv|exfoliat|clarif|absorb|hydrat|sooth|barrier|pH)\w*',
             r'\d+%\s+\w+',r'beta hydroxy',r'humectant',r'surfactant']
    if any(re.search(p, pl, re.I) for p in EXP2): s3 += 5
    else: score.warnings.append("no ingredient mechanism (E-E-A-T: Expertise)")
    # Avoid-if with mechanism
    if re.search(r'(avoid|not recommended|skip this|not for)\b.{10,100}(because|—|may cause|can|will)', pl, re.I): s3 += 6
    elif re.search(r'(avoid|not recommended|not for)\b', pl, re.I): s3 += 3
    else: score.warnings.append("no avoid-if guidance (E-E-A-T: Trustworthiness)")
    # No banned phrases
    BANNED = ['seamlessly','leverage','revolutionize','game-changer','cutting-edge',
              'Furthermore','Moreover','In conclusion','multifaceted','meticulous',
              'unparalleled','comprehensive solution','innovative formula',
              'transform your routine','elevate your skincare','emart-verified',
              'emart team has verified','emart team personally']
    bad = [w for w in BANNED if w.lower() in pl]
    if not bad: s3 += 5
    else: score.issues.append(f"banned phrases: {bad}")
    # No fabricated claims
    FAB = [r'emart.{0,20}(verified|tested|confirmed)',r'our\s+(tester|team)\s+(found|tested)',
           r'during\s+(our|dhaka)\s+\w+\s+tests']
    fab_found = [p for p in FAB if re.search(p, pl, re.I)]
    if not fab_found: s3 += 4
    else: score.issues.append(f"fabricated authority claim: {fab_found}")
    score.breakdown['E-E-A-T'] = {'earned': s3, 'max': 25}

    # ── 4. CONTENT DEPTH (20 pts) ────────────────────────────────────────────
    s4 = 0
    # Ingredient specificity
    ing_html = product.get('ingredients_html','') or ''
    if ing_html and not any(x in ing_html for x in ['carefully selected','আছে','Unknown Brand']):
        ing_plain = _strip(ing_html).lower()
        ing_words = set(re.findall(r'\b[a-z]{4,}\b', ing_plain))
        desc_words = set(re.findall(r'\b[a-z]{4,}\b', pl))
        overlap = len(ing_words & desc_words)
        s4 += min(6, overlap)
    else:
        s4 += 3  # partial credit when ingredients not available
    # Bangladesh context
    BD = [r'dhaka',r'bangladesh',r'humid',r'pollution',r'heat.*skin',r'skin.*heat',r'monsoon']
    if any(re.search(p, pl, re.I) for p in BD): s4 += 5
    else: score.warnings.append("no Bangladesh context")
    # Safe pairing (correct category — face products only)
    HAIR_WORDS = ['shampoo','conditioner','hair mask','scalp','hair oil','leave-in conditioner']
    if any(w in pl for w in HAIR_WORDS):
        score.issues.append("hair product language in a face cleanser description")
    else:
        if re.search(r'(toner|serum|moistur|essenc|double cleans)', pl, re.I): s4 += 5
        else: score.warnings.append("no pairing suggestion")
    # Language — English only
    bengali_chars = sum(1 for c in plain if 'ঀ' <= c <= '৿')
    if bengali_chars < 5: s4 += 4
    else: score.issues.append(f"Bengali content present ({bengali_chars} chars)")
    score.breakdown['Content Depth'] = {'earned': s4, 'max': 20}

    # ── 5. META QUALITY (15 pts) ─────────────────────────────────────────────
    s5 = 0
    m  = re.sub(r'\s+', ' ', meta).strip()
    if 130 <= len(m) <= 160: s5 += 3
    elif 120 <= len(m) <= 165: s5 += 1; score.warnings.append(f"meta borderline length: {len(m)}")
    else: score.issues.append(f"meta length {len(m)} out of range")
    if not ml.startswith('buy '): s5 += 3
    else: score.issues.append("meta starts with 'Buy'")
    if '৳' not in m and not re.search(r'\b\d{3,5}\s*(tk|bdt|taka)\b', m, re.I): s5 += 3
    else: score.issues.append("price amount in meta")
    if 'emart' in ml: s5 += 3
    else: score.issues.append("'Emart' missing from meta")
    # Second clause not just category type
    parts = re.split(r'\.\s+|\s+—\s+', m, maxsplit=1)
    if len(parts) == 2:
        s2nd = parts[1].lower()
        GENERIC_2ND = ['foam cleanser','gel cleanser','face wash','cleanser price',
                       'korean cleanser','best price in bangladesh at emart']
        if not any(s2nd.strip().startswith(g) for g in GENERIC_2ND): s5 += 3
        else: score.warnings.append(f"generic second clause: '{parts[1][:50]}'")
    else:
        score.issues.append("meta missing second clause separator")
    score.breakdown['Meta'] = {'earned': s5, 'max': 15}

    score.total = sum(v['earned'] for v in score.breakdown.values())
    return score


# ── Helpers ─────────────────────────────────────────────────────────────────

def _strip(html: str) -> str:
    return re.sub(r'\s+', ' ', BeautifulSoup(html or '', 'html.parser').get_text(' ')).strip()

def _db():
    return mysql.connector.connect(**DB_CFG)

def _detect_type(title: str) -> str:
    t = title.lower()
    for ctype, kws in CLEANSER_TYPES.items():
        if any(k in t for k in kws):
            return ctype
    return 'foam'

def _check_ingredients(raw: str) -> str:
    if not raw or len(raw.strip()) < 30:
        return "Ingredient list not available — describe only what is stated in the product title. Do NOT invent ingredient names."
    plain = _strip(raw).lower()
    THIN = ['carefully selected','full inci','original packaging','আছে','unknown brand','এর এই product']
    if any(s in plain for s in THIN):
        return "Ingredient data is a placeholder — use only the key actives visible in the product title. Do NOT invent concentrations or ingredient names."
    return raw

def _taxonomy(cur, post_id: int) -> dict:
    cur.execute(f"""
        SELECT t.name, tt.taxonomy
        FROM {PREFIX}terms t
        JOIN {PREFIX}term_taxonomy tt ON tt.term_id=t.term_id
        JOIN {PREFIX}term_relationships tr ON tr.term_taxonomy_id=tt.term_taxonomy_id
        WHERE tr.object_id=%s AND tt.taxonomy IN ('pa_brand','pa_origin','pa_concern','product_cat')
    """, (post_id,))
    out = {'pa_brand':[],'pa_origin':[],'pa_concern':[],'product_cat':[]}
    for name, tax in cur.fetchall():
        out[tax].append(name)
    return out

def _siblings(cur, brand: str, post_id: int, limit=5) -> list[str]:
    if not brand: return []
    cur.execute(f"""
        SELECT DISTINCT p.post_title FROM {PREFIX}posts p
        JOIN {PREFIX}term_relationships tr ON tr.object_id=p.ID
        JOIN {PREFIX}term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id
        JOIN {PREFIX}terms t ON t.term_id=tt.term_id
        WHERE p.post_type='product' AND p.post_status='publish'
          AND tt.taxonomy='product_cat' AND t.slug='face-cleansers'
          AND p.post_title LIKE %s AND p.ID!=%s LIMIT %s
    """, (f'%{brand}%', post_id, limit))
    return [r[0] for r in cur.fetchall()]

def _load_products(cur, post_id_filter=None) -> list[dict]:
    where = f"AND p.ID={post_id_filter}" if post_id_filter else ""
    cur.execute(f"""
        SELECT p.ID AS post_id, p.post_name AS slug, p.post_title AS title, p.post_content,
          MAX(CASE WHEN pm.meta_key='_emart_ingredients'       THEN pm.meta_value END) AS ingredients_html,
          MAX(CASE WHEN pm.meta_key='_emart_how_to_use'        THEN pm.meta_value END) AS how_to_use_html,
          MAX(CASE WHEN pm.meta_key='_emart_product_faq'       THEN pm.meta_value END) AS faq_raw,
          MAX(CASE WHEN pm.meta_key='_rank_math_description'   THEN pm.meta_value END) AS meta_desc,
          MAX(CASE WHEN pm.meta_key='_rank_math_focus_keyword' THEN pm.meta_value END) AS focus_keyword,
          MAX(CASE WHEN pm.meta_key='_sku'                     THEN pm.meta_value END) AS sku,
          MAX(CASE WHEN pm.meta_key='_stock_status'            THEN pm.meta_value END) AS stock_status,
          MAX(CASE WHEN pm.meta_key='total_sales'              THEN pm.meta_value END) AS total_sales,
          MAX(CASE WHEN pm.meta_key='_emart_humanized'         THEN pm.meta_value END) AS already_humanized
        FROM {PREFIX}posts p
        JOIN {PREFIX}postmeta pm ON pm.post_id=p.ID
        JOIN {PREFIX}term_relationships tr ON tr.object_id=p.ID
        JOIN {PREFIX}term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id
        JOIN {PREFIX}terms t ON t.term_id=tt.term_id
        WHERE p.post_type='product' AND p.post_status='publish'
          AND tt.taxonomy='product_cat' AND t.slug='face-cleansers'
          {where}
        GROUP BY p.ID, p.post_name, p.post_title, p.post_content
        ORDER BY CAST(IFNULL(MAX(CASE WHEN pm.meta_key='total_sales' THEN pm.meta_value END),0) AS UNSIGNED) DESC
    """)
    cols = [d[0] for d in cur.description]
    out  = []
    for row in cur.fetchall():
        d = dict(zip(cols, row))
        d['post_id']      = int(d['post_id'])
        d['total_sales']  = int(d.get('total_sales') or 0)
        d['skip_auto']    = d['total_sales'] > 20
        d['cleanser_type']= _detect_type(d['title'])
        d['post_content_plain'] = _strip(d.get('post_content') or '')
        d['brand']  = ''
        d['origin'] = 'South Korea'
        d['concerns'] = []
        out.append(d)
    return out

def _load_reviewed(post_id: int) -> dict | None:
    try:
        with open(JSONL) as f:
            for line in f:
                d = json.loads(line)
                if int(d.get('post_id',0)) == post_id:
                    return d
    except FileNotFoundError:
        pass
    return None

# ── Generation ───────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a senior skincare copywriter for Emart Bangladesh.

ANTI-FABRICATION RULE (highest priority — never break):
Use ONLY facts from provided product data and ingredients.
NEVER invent: concentrations, pH values, award claims, sales figures, SPF values,
clinical results, or test data. If a detail is not in your inputs, write about what IS there.
NEVER use "Emart team verified", "Emart-verified", "our tester", "our team tested".

LANGUAGE: English only. Never output Bengali even if current description is Bengali.

REQUIRED SECTIONS in this exact order (all 6 must be present):
1. <p> Opening paragraph — product + key ingredient + Bangladesh climate context
2. <p> Second paragraph — safe pairing for face cleansers + routine position
3. <h3>Key Benefits</h3> <ul> — "Label — Mechanism" em-dash format, from provided data only
4. <h3>Key Ingredients</h3> — <p><strong>Name</strong> — role</p> per ingredient (provided data only)
5. <h3>Best For</h3> <ul> — skin types this suits
6. <h3>Not Recommended For</h3> <ul> — who should avoid + mechanism reason
7. <h3>How to Use</h3> <ol> — specific steps with timing/amounts
8. <h3>Routine Fit</h3> <p> — when to use, what comes before/after

PAIRING RULES (face cleanser category):
- Suggest face skincare products only: toner, serum, moisturiser, essence
- NEVER suggest hair products, body products, or SPF as the only step
- For foam/gel: pair with alcohol-free toner applied to damp skin
- For oil/balm: pair with foam cleanser as double-cleanse second step
- For micellar: follow-up with foam cleanser
- For clay: hydrating toner immediately after

META RULES:
- 20-28 words (130-160 chars exactly)
- First clause: specific product claim (ingredient, concentration, skin benefit)
- Second clause: product-specific attribute (pH value, %, fragrance-free, origin, dermatologist, bestseller)
  NOT just the product category type ("foam cleanser", "gel cleanser" alone is NOT acceptable)
- Must contain "price in Bangladesh" or "price at Emart"
- Must contain "Emart"
- Must NOT start with "Buy"
- Must NOT contain ৳ or price numbers

BANNED words: delve, seamlessly, leverage, revolutionize, Furthermore, Moreover,
In conclusion, multifaceted, meticulous, unparalleled, comprehensive solution,
innovative formula, transform your routine, elevate your skincare

OUTPUT: valid JSON only, no markdown:
{"content_html":"<p>...</p>...<h3>Routine Fit</h3><p>...</p>","meta_desc":"130-160 chars"}"""


def _build_prompt(product: dict, taxonomy: dict, siblings: list[str]) -> str:
    brand   = (taxonomy['pa_brand']  or [''])[0]
    origin  = (taxonomy['pa_origin'] or ['South Korea'])[0]
    concerns= taxonomy['pa_concern'] or ['Cleansing']
    ctype   = product['cleanser_type']
    pairing = PAIRING_BY_TYPE.get(ctype, "an alcohol-free toner after cleansing")

    sib_txt = ""
    if siblings:
        sib_txt = "\nSibling cleansers from same brand (differentiate from these):\n" + \
                  "\n".join(f"- {s}" for s in siblings[:5])

    return f"""Write a product description for this face cleanser at Emart Bangladesh.

Product: {product['title']}
Brand: {brand}
Origin: {origin}
Skin concerns: {', '.join(concerns)}
Cleanser type: {ctype}
Stock: {product.get('stock_status','instock')}

Ingredients (from Emart data):
{_check_ingredients(product.get('ingredients_html',''))}

How to use (from Emart data):
{product.get('how_to_use_html') or 'Not available — write appropriate cleansing steps.'}
{sib_txt}

Pairing instruction for second paragraph: follow with {pairing}
Do NOT suggest hair products, body products, or non-face items.

Meta second clause must use a SPECIFIC product attribute, not just the category type.
Good examples: "Low pH 5.5 formula", "Fragrance-free UK import", "1% Salicylic BHA",
"Authentic South Korean import", "Dermatologist-tested", "96% snail filtrate"
BAD examples: "foam cleanser", "gel cleanser", "Korean cleanser" (too generic)"""


def _generate(client, product: dict, taxonomy: dict, siblings: list[str],
              retry_note: str = "") -> dict:
    prompt = _build_prompt(product, taxonomy, siblings)
    if retry_note:
        prompt += retry_note
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role":"system","content":SYSTEM_PROMPT},
                  {"role":"user","content":prompt}],
        max_tokens=2000,
        temperature=0.7,
        response_format={"type":"json_object"},
    )
    raw = resp.choices[0].message.content
    if not raw:
        raise ValueError(f"API returned empty. Finish reason: {resp.choices[0].finish_reason}")
    return json.loads(raw.strip())


# ── Validation ───────────────────────────────────────────────────────────────

def _validate(product: dict, generated: dict, seen_second: set) -> tuple[list,list,SEOScore]:
    """Returns (errors, warnings, seo_score)."""
    score   = seo_score(product, generated)
    errors  = list(score.issues)
    warnings= list(score.warnings)

    html = generated.get('content_html','')
    meta = re.sub(r'\s+', ' ', generated.get('meta_desc','')).strip()
    ml   = meta.lower()

    # Hard structural errors not already in SEO score
    if len(meta) < 130 or len(meta) > 160:
        if f"meta length" not in str(errors):
            errors.append(f"meta {len(meta)} chars (need 130-160)")
    if ml.startswith('buy ') and "starts with 'Buy'" not in str(errors):
        errors.append("meta starts with 'Buy'")
    if '৳' in meta:
        errors.append("price ৳ in meta")
    if 'u2014' in html or 'u2014' in meta:
        errors.append("u2014 encoding bug — use ensure_ascii=False")
    if 'emart' not in ml:
        errors.append("'Emart' missing from meta")
    if 'price in bangladesh' not in ml and 'price at emart' not in ml:
        errors.append("missing 'price in Bangladesh' keyword in meta")

    # Duplicate second clause check
    parts = re.split(r'\.\s+|\s+—\s+', meta, maxsplit=1)
    if len(parts) == 2:
        second = parts[1].strip().lower()
        for prior in seen_second:
            from rapidfuzz import fuzz
            if fuzz.ratio(second, prior) >= 82:
                errors.append(f"near-duplicate second clause ({fuzz.ratio(second,prior):.0f}% similar)")
                break
        if not errors:
            seen_second.add(second)

    return errors, warnings, score


# ── Apply via direct MySQL ───────────────────────────────────────────────────
# Uses direct MySQL (not wp_update_post) to bypass kses filtering that strips <aside>.
# post_modified is updated so WordPress object cache invalidates correctly.

def _apply(post_id: int, content_html: str, meta_desc: str) -> bool:
    full = content_html.rstrip() + COMBINED_DISCLAIMER
    now  = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
    conn = _db()
    cur  = conn.cursor()
    try:
        cur.execute(
            f"UPDATE {PREFIX}posts "
            "SET post_content=%s, post_modified=%s, post_modified_gmt=%s WHERE ID=%s",
            (full, now, now, post_id)
        )
        for key in ('_rank_math_description', '_emart_meta_description'):
            cur.execute(
                f"SELECT meta_id FROM {PREFIX}postmeta WHERE post_id=%s AND meta_key=%s ORDER BY meta_id LIMIT 1",
                (post_id, key)
            )
            row = cur.fetchone()
            if row:
                cur.execute(f"UPDATE {PREFIX}postmeta SET meta_value=%s WHERE meta_id=%s",
                            (meta_desc, row[0]))
                # Delete any extra duplicate rows
                cur.execute(
                    f"DELETE FROM {PREFIX}postmeta WHERE post_id=%s AND meta_key=%s AND meta_id!=%s",
                    (post_id, key, row[0])
                )
            else:
                cur.execute(
                    f"INSERT INTO {PREFIX}postmeta (post_id, meta_key, meta_value) VALUES (%s,%s,%s)",
                    (post_id, key, meta_desc)
                )
        cur.execute(
            f"INSERT INTO {PREFIX}postmeta (post_id, meta_key, meta_value) VALUES (%s,'_emart_humanized',%s) "
            "ON DUPLICATE KEY UPDATE meta_value=VALUES(meta_value)",
            (post_id, now)
        )
        conn.commit()
        return True
    except Exception as e:
        print(f"    DB error: {e}")
        conn.rollback()
        return False
    finally:
        cur.close(); conn.close()


def _flush_cache(batch_n: int):
    if batch_n % 25 == 0:
        subprocess.run(['wp','cache','flush',f'--path={WP_PATH}','--allow-root'],
                       capture_output=True)


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--apply',   action='store_true')
    parser.add_argument('--limit',   type=int, default=9999)
    parser.add_argument('--post-id', type=int)
    args = parser.parse_args()

    if not args.dry_run and not args.apply:
        print("Specify --dry-run or --apply"); sys.exit(1)

    if args.dry_run and not API_KEY:
        print("ERROR: set OPENROUTER_API_KEY"); sys.exit(1)

    AUDIT.mkdir(parents=True, exist_ok=True)
    conn = _db(); cur = conn.cursor()
    products = _load_products(cur, args.post_id)
    eligible = [p for p in products if not p['skip_auto'] and not p.get('already_humanized')]
    print(f"Face Cleansers: {len(products)} total | {len(eligible)} eligible | "
          f"{sum(p['skip_auto'] for p in products)} high-sales skip | "
          f"{sum(bool(p.get('already_humanized')) for p in products)} already done")

    to_do = eligible[:args.limit]
    if not to_do:
        print("Nothing to process."); cur.close(); conn.close(); return

    client = OpenAI(api_key=API_KEY, base_url="https://openrouter.ai/api/v1",
                    default_headers={"HTTP-Referer":"https://e-mart.com.bd","X-Title":"Emart Humanizer"}) \
             if args.dry_run else None

    applied = failed = skipped = 0
    seen_second: set[str] = set()
    score_total = score_count = 0

    for i, product in enumerate(to_do, 1):
        pid = product['post_id']
        print(f"\n[{i}/{len(to_do)}] {product['title'][:60]} (ID {pid})")

        # ── APPLY from reviewed JSONL ──────────────────────────────────────
        if args.apply:
            reviewed = _load_reviewed(pid)
            if reviewed is None:
                print(f"  ⏭  Not in reviewed JSONL — run --dry-run first")
                skipped += 1; continue
            errors, warnings, sc = _validate(product, reviewed, seen_second)
            if warnings: print(f"  ⚠  {warnings}")
            if errors:
                print(f"  ✗  Validation failed: {errors}")
                failed += 1; continue
            if _apply(pid, reviewed['content_html'], reviewed['meta_desc']):
                print(f"  ✓  Applied  SEO:{sc.total}/{sc.max_score}({sc.grade})")
                applied += 1
                score_total += sc.total; score_count += 1
            else:
                print(f"  ✗  DB write failed"); failed += 1
            _flush_cache(i)
            continue

        # ── DRY-RUN: generate + score + save ──────────────────────────────
        taxonomy = _taxonomy(cur, pid)
        product['brand']   = (taxonomy['pa_brand']  or [''])[0]
        product['origin']  = (taxonomy['pa_origin'] or ['South Korea'])[0]
        product['concerns']= taxonomy['pa_concern'] or []
        siblings = _siblings(cur, product['brand'], pid)

        try:
            generated = _generate(client, product, taxonomy, siblings)
            errors, warnings, sc = _validate(product, generated, seen_second)

            if errors:
                retry = "\n\nPrevious output failed validation:\n" + \
                        "\n".join(f"- {e}" for e in errors)
                generated = _generate(client, product, taxonomy, siblings, retry)
                errors, warnings, sc = _validate(product, generated, seen_second)

            if errors:
                print(f"  ✗  FAILED after retry: {errors}"); failed += 1; continue
            if warnings: print(f"  ⚠  {warnings}")

            print(f"  ✓  SEO Score: {sc.total}/{sc.max_score} ({sc.grade})")
            print(f"  META: {generated['meta_desc']}")
            score_total += sc.total; score_count += 1

            with open(JSONL, 'a') as f:
                f.write(json.dumps({
                    'post_id':      pid,
                    'title':        product['title'],
                    'cleanser_type':product['cleanser_type'],
                    'seo_score':    sc.total,
                    'seo_grade':    sc.grade,
                    'seo_breakdown':sc.breakdown,
                    'content_html': generated['content_html'],
                    'meta_desc':    generated['meta_desc'],
                    'warnings':     warnings,
                }, ensure_ascii=False) + '\n')

        except Exception as e:
            print(f"  ✗  Error: {e}"); failed += 1

        time.sleep(2)

    cur.close(); conn.close()

    if args.apply and applied > 0:
        subprocess.run(['wp','cache','flush',f'--path={WP_PATH}','--allow-root'],capture_output=True)

    avg_score = round(score_total/score_count) if score_count else 0
    print(f"\n{'='*55}")
    print(f"Applied:{applied}  Skipped:{skipped}  Failed:{failed}")
    if score_count:
        print(f"Avg SEO score: {avg_score}/100 across {score_count} products")
    if args.dry_run:
        print(f"Review: {JSONL}")
        print(f"Then apply: python3 {Path(__file__).name} --apply")


if __name__ == '__main__':
    main()
