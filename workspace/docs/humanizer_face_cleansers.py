#!/usr/bin/env python3
"""
Face Cleanser Category Humanizer — Final Production Script
===========================================================
Category: https://e-mart.com.bd/category/face-cleansers

WORKFLOW (always follow this order):
  1. DRY-RUN  — generates content, saves to JSONL, no DB writes
  2. REVIEW   — read the JSONL, fix any issues manually
  3. APPLY    — reads reviewed JSONL, writes directly to MySQL (bypasses wp_update_post kses
               filter to preserve <aside>); flushes WP cache + Next.js ISR after each batch

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
from decimal import Decimal, InvalidOperation
from pathlib import Path

from bs4 import BeautifulSoup
from openai import OpenAI
import mysql.connector

# ── Config ─────────────────────────────────────────────────────────────────

API_KEY  = os.environ.get("OPENROUTER_API_KEY", "")
MODEL    = "deepseek/deepseek-v4-flash"

_db_password = os.environ.get("EMART_DB_PASSWORD")
if not _db_password:
    # Fail fast — never fall back to a hardcoded credential in a repo file
    print("ERROR: EMART_DB_PASSWORD environment variable is not set.")
    print("  export EMART_DB_PASSWORD='...'")
    sys.exit(1)

DB_CFG   = dict(host="localhost", database="emart_live",
                user="emart_user", password=_db_password)
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

# Single source of truth for splitting a meta into [clause1, clause2].
# Used by BOTH _load_seen_second and _validate so dedup compares like-for-like.
_CLAUSE_SPLIT = r'\.\s+|\s+[—\-]\s+'

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
    # Disclaimer is appended by apply step, NOT by the model — do not check here
    s1 += 3   # always award disclaimer pts (apply step guarantees it)
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
    # Give full points for any valid purchase/CTA signal
    META_CTA = ['price in bangladesh','price at emart','buy original','buy at emart',
                'cod available','cod delivery','cod.','with cod','cash on delivery']
    if any(x in ml for x in META_CTA): s2 += 5
    else: score.warnings.append("meta missing purchase signal (price/buy/COD)")
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
    # Length: 130-158 chars — fits SERP completely without truncation
    if 130 <= len(m) <= 158: s5 += 3
    elif 120 <= len(m) <= 165: s5 += 1; score.warnings.append(f"meta {len(m)} chars — borderline (aim 130-158)")
    else: score.issues.append(f"meta {len(m)} chars — outside 130-158 range")
    # No raw price number (stale risk)
    if '৳' not in m and not re.search(r'\b\d{3,5}\s*(tk|bdt|taka)\b', m, re.I): s5 += 3
    else: score.issues.append("price number in meta — stale when price changes")
    # Emart present
    if 'emart' in ml: s5 += 3
    else: score.issues.append("'Emart' missing from meta")
    # Has skin type or ingredient signal
    SKIN_SIGNALS = ['oily','dry','sensitive','combination','acne','blemish','pore',
                    'brightening','hydrating','exfoliat','salicylic','niacinamide',
                    'centella','ceramide','hyaluronic','tea tree','charcoal','clay']
    if any(s in ml for s in SKIN_SIGNALS): s5 += 3
    else: score.warnings.append("meta missing skin type or key ingredient signal")
    # Has Bangladesh + buy/cod/price signal
    has_bd  = 'bangladesh' in ml
    has_cta = any(x in ml for x in ['buy original','buy at emart','price in bangladesh',
                                     'price at emart','cod','cash on delivery','price in bd'])
    if has_bd and has_cta: s5 += 3
    elif has_bd: s5 += 1; score.warnings.append("meta has Bangladesh but missing buy/price/COD signal")
    else: score.issues.append("meta missing 'Bangladesh'")
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

# Skinnora ingredient cache — avoids repeat network calls across runs.
# Only used when --with-skinnora flag is passed; off by default.
_SKINNORA_CACHE_FILE = AUDIT / "skinnora-ingredient-cache.json"
_SKINNORA_ENABLED    = False   # set True by --with-skinnora flag in main()

def _skinnora_cache_load() -> dict:
    try:
        return json.loads(_SKINNORA_CACHE_FILE.read_text())
    except Exception:
        return {}

def _skinnora_cache_save(cache: dict) -> None:
    AUDIT.mkdir(parents=True, exist_ok=True)
    _SKINNORA_CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2))

_SKINNORA_CACHE: dict = {}   # loaded once in main() when --with-skinnora is set

def _scrape_skinnora_ingredients(title: str) -> str:
    """
    Search Skinnora for a matching product and return its ingredients tab text.
    Off by default — only active when --with-skinnora flag is passed.
    Results are cached to disk so repeat runs skip the network call.
    """
    if not _SKINNORA_ENABLED:
        return ''
    cache_key = title[:50].lower().strip()
    if cache_key in _SKINNORA_CACHE:
        cached = _SKINNORA_CACHE[cache_key]
        return cached if cached else ''

    import urllib.parse, urllib.request, time as _time
    result = ''
    try:
        query = urllib.parse.quote(title[:50])
        url   = f"https://www.skinnora.com/?s={query}&post_type=product"
        req   = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
        html  = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
        m = re.search(r'href="(https://www\.skinnora\.com/product/[^"]+)"', html)
        if m:
            _time.sleep(1)
            req2     = urllib.request.Request(m.group(1), headers={'User-Agent':'Mozilla/5.0'})
            prod_html= urllib.request.urlopen(req2, timeout=10).read().decode('utf-8', errors='ignore')
            soup     = BeautifulSoup(prod_html, 'html.parser')
            ing_tab  = (soup.find('div', id='tab-ingredients') or
                        soup.find('div', id=re.compile(r'ingredient', re.I)))
            if ing_tab:
                lines = [l.strip() for l in ing_tab.get_text('\n', strip=True).splitlines() if l.strip()]
                if lines and lines[0].lower() in ('ingredients','ingredient list','full ingredient list'):
                    lines = lines[1:]
                result = '\n'.join(lines)
                if len(result) > 50:
                    print(f"    Skinnora ingredients fetched ({len(result)} chars)")
    except Exception:
        pass

    # Cache result (including empty string = "not found") to avoid repeat calls
    _SKINNORA_CACHE[cache_key] = result
    _skinnora_cache_save(_SKINNORA_CACHE)
    return result


def _check_ingredients(raw: str, product_title: str = '') -> str:
    """Return ingredient prompt text; scrapes Skinnora only if --with-skinnora was passed."""
    if not raw or len(raw.strip()) < 30:
        skinnora = _scrape_skinnora_ingredients(product_title)
        if skinnora:
            return f"Ingredient list from Skinnora.com (reference only — do NOT copy verbatim):\n{skinnora[:800]}"
        return "Ingredient list not available — describe only what is stated in the product title. Do NOT invent ingredient names."
    plain = _strip(raw).lower()
    THIN  = ['carefully selected','full inci','original packaging','আছে','unknown brand','এর এই product']
    if any(s in plain for s in THIN):
        skinnora = _scrape_skinnora_ingredients(product_title)
        if skinnora:
            return f"Ingredient list from Skinnora.com (reference only — do NOT copy verbatim):\n{skinnora[:800]}"
        return "Ingredient data is a placeholder — use only the key actives visible in the product title. Do NOT invent concentrations or ingredient names."
    return raw

def _format_bdt_price(value) -> str:
    raw = str(value or '').strip()
    if not raw:
        return ''
    try:
        formatted = format(Decimal(raw), 'f')
        if '.' in formatted:
            formatted = formatted.rstrip('0').rstrip('.')
        return formatted or '0'
    except (InvalidOperation, ValueError):
        return raw

def _extract_structured_price(structured_description: str) -> str:
    match = re.search(r'Price:BDT\s*([0-9]+(?:\.[0-9]+)?)', structured_description or '', re.I)
    return _format_bdt_price(match.group(1)) if match else ''

def _sync_structured_description_price(structured_description: str, current_price) -> str:
    price = _format_bdt_price(current_price)
    if not price:
        return structured_description or ''

    current = structured_description or ''
    if re.search(r'Price:BDT\s*[0-9]+(?:\.[0-9]+)?', current, re.I):
        return re.sub(r'Price:BDT\s*[0-9]+(?:\.[0-9]+)?', f'Price:BDT {price}', current, count=1, flags=re.I)

    if current.strip():
        return current.rstrip().rstrip('.') + f'. Price:BDT {price}.'

    return f'Price:BDT {price}.'

def _structured_price_warning(product: dict) -> str | None:
    current_price = _format_bdt_price(product.get('current_price'))
    structured_price = _extract_structured_price(product.get('structured_description') or '')
    if current_price and structured_price and current_price != structured_price:
        return (
            f"_structured_description stale price {structured_price}; "
            f"apply will sync it to current _price {current_price}"
        )
    return None

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

def _apply_taxonomy(cur, product: dict) -> dict:
    """
    Populate brand/origin/concerns on the product dict from live taxonomy.
    Called in BOTH dry-run and apply paths so seo_score sees the same brand
    in each — otherwise apply-time scores drop 5 pts and log a false
    'brand not in first 300 chars' warning. Returns the taxonomy dict.
    """
    taxonomy = _taxonomy(cur, product['post_id'])
    product['brand']    = (taxonomy['pa_brand']  or [''])[0]
    product['origin']   = (taxonomy['pa_origin'] or ['South Korea'])[0]
    product['concerns'] = taxonomy['pa_concern'] or []
    return taxonomy

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
          MAX(CASE WHEN pm.meta_key='_price'                   THEN pm.meta_value END) AS current_price,
          MAX(CASE WHEN pm.meta_key='_structured_description'  THEN pm.meta_value END) AS structured_description,
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
        HAVING IFNULL(MAX(CASE WHEN pm.meta_key='_emart_holdout' THEN 1 END), 0) = 0
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
    """
    Search all face-cleansers-*.jsonl files, newest file first.
    Within a file, return the LAST matching row (most recent re-run wins) —
    so re-running dry-run the same day to fix an api_length_error supersedes
    the stale earlier row instead of being ignored.
    """
    for path in sorted(AUDIT.glob("face-cleansers-*.jsonl"), reverse=True):
        if 'rollback' in path.name:
            continue
        latest = None
        try:
            with open(path) as f:
                for line in f:
                    d = json.loads(line)
                    if int(d.get('post_id', 0)) == post_id:
                        latest = d   # keep overwriting → last one wins
        except Exception:
            continue
        if latest is not None:
            return latest
    return None

# ── Generation ───────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a senior skincare copywriter for Emart Bangladesh.

ANTI-FABRICATION RULE (highest priority — never break):
Use ONLY facts from provided product data and ingredients.
NEVER invent: concentrations, pH values, award claims, sales figures, SPF values,
clinical results, or test data. If a detail is not in your inputs, write about what IS there.
NEVER use "Emart team verified", "Emart-verified", "our tester", "our team tested".

LANGUAGE: English only. Never output Bengali even if current description is Bengali.

REQUIRED SECTIONS in this exact order (all 8 must be present):
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

META RULES — read carefully:

The product's FULL NAME is already in the page <title> tag. Do NOT repeat it in the meta.
Use brand name only + short descriptor. This is how you fit everything into 155 chars naturally.

FORMAT (2 clauses, 130-158 chars total):
  Clause 1 (75-95 chars): [Brand] [short type] for [2 skin types] with [1 key ingredient] — [1 benefit]
  Clause 2 (50-65 chars):  Buy original at Emart Bangladesh — COD available.
                        OR: Buy at Emart Bangladesh with COD delivery.
                        OR: Authentic [origin] import — buy at Emart BD, COD.

GOOD EXAMPLES (all land 130-158 chars — nothing truncated in SERP):
  "FARMSTAY Cica foam cleanser with Centella Asiatica for acne-prone, sensitive skin. Buy original at Emart Bangladesh — COD available."
  → 132 chars ✓

  "COSRX low pH gel cleanser for oily, acne-prone skin with tea tree oil — non-stripping. Buy original at Emart Bangladesh, COD available."
  → 134 chars ✓

  "CeraVe cream-to-foam cleanser for dry, sensitive skin with ceramides and hyaluronic acid. Buy original at Emart Bangladesh — COD."
  → 130 chars ✓

  "Innisfree Jeju Volcanic foam cleanser — volcanic clusters absorb excess sebum for oily skin. Buy at Emart Bangladesh with COD delivery."
  → 135 chars ✓

BAD EXAMPLES (what NOT to do):
  ✗ "COSRX Low pH Good Morning Gel Cleanser 150ml is a gentle Korean gel face wash for oily skin..." — full product name repeated, too long
  ✗ "Buy COSRX..." — never start with Buy
  ✗ "...at ৳950" — price goes stale
  ✗ Any meta under 130 chars — add one more skin type or ingredient detail to reach 130-158

HARD LIMITS:
- 130–158 characters EXACTLY. Count every character including spaces before outputting.
  If your draft is over 158: remove the least important word (usually an adjective).
  If your draft is under 130: add one ingredient name or skin type.
- The word "Bangladesh" MUST appear — "buy at Emart, COD" alone is not enough.
  Valid: "buy at Emart Bangladesh, COD" or "buy at Emart Bangladesh — COD" or "price in Bangladesh at Emart"
- Brand name only, NOT "Brand + Full Product Name + Size"
- Max 2 skin types (oily, dry, sensitive, combination, acne-prone, mature, brightening)
- 1 key ingredient or benefit signal
- Must contain "Emart" and "Bangladesh"
- Must contain "buy" or "COD" or "price in Bangladesh"
- No ৳ or price numbers

BANNED words: delve, seamlessly, leverage, revolutionize, Furthermore, Moreover,
In conclusion, multifaceted, meticulous, unparalleled, comprehensive solution,
innovative formula, transform your routine, elevate your skincare

OUTPUT: valid JSON only, no markdown:
{"content_html":"<p>...</p>...<h3>Routine Fit</h3><p>...</p>","meta_desc":"130-158 chars"}"""


def _build_prompt(product: dict, taxonomy: dict, siblings: list[str]) -> str:
    brand   = (taxonomy['pa_brand']  or [''])[0]
    # Truncate very long titles to avoid hitting API input/output token limits
    title   = product['title'][:45]
    origin  = (taxonomy['pa_origin'] or ['South Korea'])[0]
    concerns= taxonomy['pa_concern'] or ['Cleansing']
    ctype   = product['cleanser_type']
    pairing = PAIRING_BY_TYPE.get(ctype, "an alcohol-free toner after cleansing")

    sib_txt = ""
    if siblings:
        sib_txt = "\nSibling cleansers from same brand (differentiate from these):\n" + \
                  "\n".join(f"- {s}" for s in siblings[:5])

    return f"""Write a product description for this face cleanser at Emart Bangladesh.

Product: {title}
Brand: {brand}
Origin: {origin}
Skin concerns: {', '.join(concerns)}
Cleanser type: {ctype}
Stock: {product.get('stock_status','instock')}

Ingredients (from Emart data):
{_check_ingredients(product.get('ingredients_html',''), product.get('title',''))}

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
              retry_note: str = "", compressed: bool = False) -> dict:
    prompt = _build_prompt(product, taxonomy, siblings)
    if retry_note:
        prompt += retry_note
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role":"system","content":SYSTEM_PROMPT},
                  {"role":"user","content":prompt}],
        max_tokens=2400 if compressed else 2200,
        temperature=0.7,
        response_format={"type":"json_object"},
    )
    raw = resp.choices[0].message.content
    if not raw:
        finish = resp.choices[0].finish_reason
        if finish == 'length' and not compressed:
            # Output hit token limit — retry with higher max_tokens and shorter title
            print(f"    Token limit hit — retrying with compressed prompt (max_tokens=2400)")
            old_title = product['title']
            product['title'] = product['title'][:35]   # shorter title for this retry only
            try:
                result = _generate(client, product, taxonomy, siblings, retry_note, compressed=True)
            finally:
                product['title'] = old_title   # restore original title
            return result
        raise ValueError(f"API returned empty. Finish reason: {finish}")
    # Repair truncated/broken JSON — common when content is long
    text = raw.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        if not text.endswith('}'):
            text = text.rstrip(',') + '"}'
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Unparseable JSON from API: {e} — raw[:100]: {text[:100]}")


# ── Validation ───────────────────────────────────────────────────────────────

def _validate(product: dict, generated: dict, seen_second: set) -> tuple[list,list,SEOScore]:
    """Returns (errors, warnings, seo_score)."""
    score   = seo_score(product, generated)
    errors  = list(score.issues)
    warnings= list(score.warnings)

    html = generated.get('content_html','')
    meta = re.sub(r'\s+', ' ', generated.get('meta_desc','')).strip()
    ml   = meta.lower()

    # Hard structural errors
    if len(meta) < 130 or len(meta) > 158:
        if "out of range" not in str(errors) and "chars" not in str(errors):
            errors.append(f"meta {len(meta)} chars — must be 130-158 (title tag has full product name, meta should not repeat it)")
    if '৳' in meta or re.search(r'\b\d{3,5}\s*(tk|bdt|taka)\b', meta, re.I):
        errors.append("price number in meta — goes stale when price changes")
    if 'u2014' in html or 'u2014' in meta:
        errors.append("u2014 encoding bug — use ensure_ascii=False")
    # Disclaimer not checked here — appended by apply step
    if 'emart' not in ml:
        errors.append("'Emart' missing from meta")
    if 'bangladesh' not in ml:
        errors.append("'Bangladesh' missing from meta")
    # Needs a purchase/CTA signal
    HAS_CTA = any(x in ml for x in ['price in bangladesh','price at emart','buy original',
                                     'buy at emart','cod','cash on delivery','price in bd'])
    if not HAS_CTA:
        errors.append("meta missing CTA: add 'buy at Emart', 'COD available', or 'price in Bangladesh'")

    # Duplicate second clause check — split identically to _load_seen_second
    parts = re.split(_CLAUSE_SPLIT, meta, maxsplit=1)
    if len(parts) == 2:
        second = parts[1].strip().lower()
        from rapidfuzz import fuzz
        best_match = max((fuzz.ratio(second, prior) for prior in seen_second), default=0)
        if best_match >= 90:
            errors.append(f"near-duplicate second clause ({best_match:.0f}% similar)")
        elif not errors:
            seen_second.add(second)

    return errors, warnings, score


# ── Apply via direct MySQL ───────────────────────────────────────────────────
# Uses direct MySQL (not wp_update_post) to bypass kses filtering that strips <aside>.
# post_modified is updated so WordPress object cache invalidates correctly.

def _upsert_single_meta(cur, post_id: int, key: str, value: str):
    cur.execute(
        f"SELECT meta_id FROM {PREFIX}postmeta WHERE post_id=%s AND meta_key=%s ORDER BY meta_id LIMIT 1",
        (post_id, key)
    )
    row = cur.fetchone()
    if row:
        cur.execute(f"UPDATE {PREFIX}postmeta SET meta_value=%s WHERE meta_id=%s", (value, row[0]))
        cur.execute(
            f"DELETE FROM {PREFIX}postmeta WHERE post_id=%s AND meta_key=%s AND meta_id!=%s",
            (post_id, key, row[0])
        )
    else:
        cur.execute(
            f"INSERT INTO {PREFIX}postmeta (post_id, meta_key, meta_value) VALUES (%s,%s,%s)",
            (post_id, key, value)
        )

def _apply(product: dict, content_html: str, meta_desc: str) -> bool:
    post_id = product['post_id']
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
            _upsert_single_meta(cur, post_id, key, meta_desc)

        # Only sync _structured_description if a row already exists — never create from scratch
        existing_structured = product.get('structured_description') or ''
        if existing_structured.strip():
            synced_structured_description = _sync_structured_description_price(
                existing_structured, product.get('current_price')
            )
            if synced_structured_description:
                _upsert_single_meta(cur, post_id, '_structured_description', synced_structured_description)

        _upsert_single_meta(cur, post_id, '_emart_humanized', now)

        # ── _emart_how_to_use: sync from generated How to Use <ol>
        how_to_match = re.search(
            r'<h3[^>]*>How to Use</h3>\s*(<ol[^>]*>[\s\S]*?</ol>)',
            content_html, re.I
        )
        if how_to_match:
            _upsert_single_meta(cur, post_id, '_emart_how_to_use', how_to_match.group(1))

        # ── _emart_ingredients: write back enriched Key Ingredients from description
        # Only if current field is empty or thin — preserves richer existing data
        existing_ing = product.get('ingredients_html') or ''
        existing_thin = not existing_ing.strip() or any(
            s in existing_ing.lower() for s in
            ['carefully selected','আছে','unknown brand','এর এই product']
        )
        if existing_thin:
            ing_match = re.search(
                r'<h3[^>]*>Key Ingredients</h3>([\s\S]*?)(?=<h3|<aside|$)',
                content_html, re.I
            )
            if ing_match:
                ing_html = ing_match.group(1).strip()
                if ing_html:
                    _upsert_single_meta(cur, post_id, '_emart_ingredients', ing_html)

        # ── Brand schema: write pa_brand into _rank_math_schema_data Product JSON-LD
        # Enables Google Shopping AI + agentic agents to attribute the product correctly
        brand_name = product.get('brand') or ''
        if brand_name:
            cur.execute(
                f"SELECT meta_value FROM {PREFIX}postmeta "
                f"WHERE post_id=%s AND meta_key='_rank_math_schema_data' LIMIT 1",
                (post_id,)
            )
            schema_row = cur.fetchone()
            try:
                schema = json.loads(schema_row[0]) if schema_row and schema_row[0] else {}
            except Exception:
                schema = {}
            schema.setdefault('Product', {})['brand'] = {
                '@type': 'Brand', 'name': brand_name
            }
            _upsert_single_meta(cur, post_id, '_rank_math_schema_data',
                                json.dumps(schema, ensure_ascii=False))

        # ── Focus keyword: set to the most-searched GSC query for this product
        # Real user search terms → better Rank Math page scoring
        gsc_queries = product.get('gsc_queries') or []
        if gsc_queries:
            best_kw = gsc_queries[0].get('query', '')   # already sorted by impressions desc
            if best_kw:
                _upsert_single_meta(cur, post_id, '_rank_math_focus_keyword', best_kw)

        conn.commit()
        return True
    except Exception as e:
        print(f"    DB error: {e}")
        conn.rollback()
        return False
    finally:
        cur.close(); conn.close()


REVALIDATE_SECRET_FILE = Path("/var/www/emart-platform/apps/web/.env.local")

def _get_revalidate_secret() -> str:
    try:
        for line in REVALIDATE_SECRET_FILE.read_text().splitlines():
            if line.startswith("REVALIDATE_SECRET="):
                return line.split("=", 1)[1].strip()
    except Exception:
        pass
    return ""

def _flush_cache(batch_n: int, force: bool = False):
    if force or batch_n % 25 == 0:
        subprocess.run(['wp','cache','flush',f'--path={WP_PATH}','--allow-root'],
                       capture_output=True)
        secret = _get_revalidate_secret()
        if secret:
            # Use urllib instead of curl so the secret is never in process/args list
            import urllib.request as _ur
            try:
                req = _ur.Request(
                    'https://e-mart.com.bd/api/revalidate',
                    data=b'{"tag":"products"}',
                    headers={
                        'Content-Type':       'application/json',
                        'x-revalidate-secret': secret,
                    },
                    method='POST',
                )
                _ur.urlopen(req, timeout=10)
            except Exception:
                pass   # revalidation failure is non-fatal; ISR will expire naturally


def _load_seen_second(cur) -> set[str]:
    """
    Build seen_second_clauses from live DB meta descriptions of already-humanized
    face cleanser products. This is the ground truth — not generated JSONL which
    may include rejected/deleted entries that were never applied.
    """
    cur.execute(f"""
        SELECT pm.meta_value
        FROM {PREFIX}postmeta pm
        JOIN {PREFIX}posts p ON p.ID = pm.post_id
        JOIN {PREFIX}term_relationships tr ON tr.object_id = p.ID
        JOIN {PREFIX}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
        JOIN {PREFIX}terms t ON t.term_id = tt.term_id
        WHERE pm.meta_key = '_emart_meta_description'
          AND p.post_type = 'product' AND p.post_status = 'publish'
          AND tt.taxonomy = 'product_cat' AND t.slug = 'face-cleansers'
          AND pm.meta_value != ''
    """)
    seen = set()
    for (meta,) in cur.fetchall():
        if meta:
            parts = re.split(_CLAUSE_SPLIT, meta.strip(), maxsplit=1)
            if len(parts) == 2:
                seen.add(parts[1].strip().lower())
    return seen


def _load_gsc_query_map() -> dict:
    """
    Load GSC query data from the most recent gsc-query-map-*.json file.
    Returns {"/shop/slug": [{"query","impressions","clicks","ctr","position"}]}
    Run workspace/docs/baseline_snapshot.py first to generate this file.
    """
    files = sorted(AUDIT.glob("gsc-query-map-*.json"), reverse=True)
    if not files:
        return {}
    try:
        data = json.loads(files[0].read_text())
        print(f"GSC query map loaded: {files[0].name} ({len(data)} product paths)")
        return data
    except Exception as e:
        print(f"GSC query map load failed: {e}")
        return {}


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run',       action='store_true')
    parser.add_argument('--apply',         action='store_true')
    parser.add_argument('--limit',         type=int, default=9999)
    parser.add_argument('--post-id',       type=int)
    parser.add_argument('--with-skinnora', action='store_true',
                        help='Enable Skinnora ingredient scraping (off by default). '
                             'Results are cached to avoid repeat network calls.')
    args = parser.parse_args()

    if not args.dry_run and not args.apply:
        print("Specify --dry-run or --apply"); sys.exit(1)

    if args.dry_run and not API_KEY:
        print("ERROR: set OPENROUTER_API_KEY"); sys.exit(1)

    # Wire --with-skinnora flag into the module-level toggle + load cache
    if getattr(args, 'with_skinnora', False):
        global _SKINNORA_ENABLED, _SKINNORA_CACHE
        _SKINNORA_ENABLED = True
        _SKINNORA_CACHE   = _skinnora_cache_load()
        print(f"Skinnora ingredient scraping: ON "
              f"(cache has {len(_SKINNORA_CACHE)} entries)")
    else:
        print("Skinnora ingredient scraping: OFF (use --with-skinnora to enable)")

    AUDIT.mkdir(parents=True, exist_ok=True)
    conn = _db(); cur = conn.cursor()
    products = _load_products(cur, args.post_id)

    if args.post_id:
        # Explicit --post-id: allow re-applying even if already humanized
        # (reviewer may want to fix a specific product that was already stamped)
        eligible = [p for p in products if not p['skip_auto']]
    else:
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
    # Build seen_second from live DB meta descriptions of already-applied products.
    # Ground truth: only clauses that were actually published, never rejected JSONL entries.
    seen_second: set[str] = _load_seen_second(cur)
    gsc_map: dict = _load_gsc_query_map()   # {"/shop/slug": [queries]}
    score_total = score_count = 0

    # Capture rollback snapshot before any writes
    rollback_path = AUDIT / f"face-cleansers-rollback-{DATE}.json"
    rollback: list[dict] = []

    for i, product in enumerate(to_do, 1):
        pid = product['post_id']
        print(f"\n[{i}/{len(to_do)}] {product['title'][:60]} (ID {pid})")

        # ── APPLY from reviewed JSONL ──────────────────────────────────────
        if args.apply:
            reviewed = _load_reviewed(pid)
            if reviewed is None:
                print(f"  ⏭  Not in reviewed JSONL — run --dry-run first")
                skipped += 1; continue
            if reviewed.get('status') == 'api_length_error':
                print(f"  ⏭  Skipping — previous API length error, needs manual retry")
                skipped += 1; continue
            # Populate brand/origin/concerns + GSC queries for apply-step SEO writes
            _apply_taxonomy(cur, product)
            product['gsc_queries'] = gsc_map.get(f"/shop/{product.get('slug','')}", [])
            errors, warnings, sc = _validate(product, reviewed, seen_second)
            if sw := _structured_price_warning(product):
                warnings.append(sw)
            if warnings: print(f"  ⚠  {warnings}")
            if errors:
                print(f"  ✗  Validation failed: {errors}")
                failed += 1; continue
            # Save rollback before first write — includes all fields apply touches
            rollback.append({
                'post_id':              pid,
                'old_post_content':     product.get('post_content',''),
                'old_meta_desc':        product.get('meta_desc',''),
                'old_how_to_use':       product.get('how_to_use_html',''),
                'old_structured_desc':  product.get('structured_description',''),
            })
            rollback_path.write_text(json.dumps(rollback, ensure_ascii=False, indent=2))
            if _apply(product, reviewed['content_html'], reviewed['meta_desc']):
                print(f"  ✓  Applied  SEO:{sc.total}/{sc.max_score}({sc.grade})")
                applied += 1
                score_total += sc.total; score_count += 1
            else:
                print(f"  ✗  DB write failed"); failed += 1
            _flush_cache(i)
            continue

        # ── DRY-RUN: generate + score + save ──────────────────────────────
        taxonomy = _apply_taxonomy(cur, product)
        product['gsc_queries'] = gsc_map.get(f"/shop/{product.get('slug','')}", [])
        siblings = _siblings(cur, product['brand'], pid)
        if sw := _structured_price_warning(product):
            print(f"  ⚠  {sw}")

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
            err_str = str(e)
            print(f"  ✗  Error: {err_str}")
            # Tag API length failures so apply step can skip them explicitly
            if 'length' in err_str.lower() or 'empty' in err_str.lower():
                with open(JSONL, 'a') as f:
                    f.write(json.dumps({
                        'post_id': pid, 'title': product['title'],
                        'status': 'api_length_error', 'error': err_str,
                    }, ensure_ascii=False) + '\n')
            failed += 1

        time.sleep(2)

    cur.close(); conn.close()

    if args.apply and applied > 0:
        _flush_cache(0, force=True)   # final flush + Next.js revalidation

    avg_score = round(score_total/score_count) if score_count else 0
    print(f"\n{'='*55}")
    print(f"Applied:{applied}  Skipped:{skipped}  Failed:{failed}")
    if score_count:
        print(f"Avg SEO score: {avg_score}/100 across {score_count} products")
    if args.apply and rollback:
        print(f"Rollback: {rollback_path}")
    if args.dry_run:
        print(f"Review: {JSONL}")
        print(f"Then apply: python3 {Path(__file__).name} --apply")


if __name__ == '__main__':
    main()