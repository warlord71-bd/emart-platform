#!/usr/bin/env python3
"""
Emart Whole-Catalog Meta Description Generator
Generates proper 2-clause Rank Math meta descriptions for all published products
that don't have valid (130-158 char) metas yet.

Same quality standard as the face-cleanser humanizer:
  Clause 1 (75-95c): [Brand] [short product type] for [skin/use context] with [1 key ingredient/feature]
  Clause 2 (45-65c): Buy authentic at Emart Bangladesh — COD available.
                  OR: Authentic [origin] import — buy at Emart Bangladesh, COD.
                  OR: Shop at Emart Bangladesh — COD, fast delivery.

Run:
  EMART_DB_PASSWORD=... OPENROUTER_API_KEY=... python3 meta_generator.py --dry-run --limit 20
  EMART_DB_PASSWORD=... OPENROUTER_API_KEY=... python3 meta_generator.py --apply --limit 100
"""

import argparse, json, os, re, sys, time
from datetime import date, datetime
from pathlib import Path

try:
    import mysql.connector
except ImportError:
    import subprocess; subprocess.run([sys.executable,"-m","pip","install","mysql-connector-python","-q"])
    import mysql.connector

try:
    from openai import OpenAI
except ImportError:
    import subprocess; subprocess.run([sys.executable,"-m","pip","install","openai","-q"])
    from openai import OpenAI

# ── Config ────────────────────────────────────────────────────────────────────

PREFIX   = "wp4h_"
DB_HOST  = "localhost"
DB_USER  = "emart_user"
DB_NAME  = "emart_live"
MODEL    = "deepseek/deepseek-chat-v3.1"
FALLBACK_MODELS = [
    "deepseek/deepseek-v3.2",
    "moonshotai/kimi-k2.6:free",
    "openai/gpt-oss-120b:free",
]
AUDIT = Path("workspace/audit/active")
TIMESTAMP = datetime.now().strftime("%Y-%m-%d-%H%M%S")
DATE      = datetime.now().strftime("%Y-%m-%d")

_db_password = os.environ.get("EMART_DB_PASSWORD")
API_KEY      = os.environ.get("OPENROUTER_API_KEY", "")

if not _db_password:
    print("ERROR: EMART_DB_PASSWORD not set"); sys.exit(1)
if not API_KEY:
    print("ERROR: OPENROUTER_API_KEY not set"); sys.exit(1)

# ── DB ────────────────────────────────────────────────────────────────────────

def _db():
    return mysql.connector.connect(
        host=DB_HOST, user=DB_USER, password=_db_password, database=DB_NAME,
        charset="utf8mb4", use_unicode=True,
    )

def load_products(cur, limit, post_ids=None, force=False):
    """Load products that need meta generation. Skips humanized and already-valid metas.
    When force=True and post_ids are provided, bypasses the validity HAVING clause
    so already-stored bad metas (e.g. 'original pack', 'buy original at') are regenerated.
    """
    id_filter = f"AND p.ID IN ({','.join(str(i) for i in post_ids)})" if post_ids else ""
    cur.execute(f"""
        SELECT
            p.ID        AS post_id,
            p.post_name AS slug,
            p.post_title AS title,
            -- _emart_meta_description is read FIRST by frontend (product.ts:42)
            COALESCE(
                MAX(CASE WHEN pm.meta_key='_emart_meta_description' THEN pm.meta_value END),
                MAX(CASE WHEN pm.meta_key='_rank_math_description'  THEN pm.meta_value END)
            )                                                               AS current_meta,
            MAX(CASE WHEN pm.meta_key='_emart_mini_parent_id'   THEN pm.meta_value END) AS mini_parent_id,
            MAX(CASE WHEN pm.meta_key='_emart_humanizer_skip'   THEN pm.meta_value END) AS humanizer_skip,
            MAX(CASE WHEN pm.meta_key='_price'                  THEN pm.meta_value END) AS price
        FROM {PREFIX}posts p
        JOIN {PREFIX}postmeta pm ON pm.post_id = p.ID
        WHERE p.post_type='product' AND p.post_status='publish'
        {id_filter}
        GROUP BY p.ID, p.post_name, p.post_title
        {'-- force mode: skip validity HAVING' if (force and post_ids) else '''HAVING
            IFNULL(MAX(CASE WHEN pm.meta_key=\'_emart_humanized\'      THEN 1 END), 0) = 0
            AND (
                MAX(CASE WHEN pm.meta_key=\'_emart_humanizer_skip\' THEN pm.meta_value END) IS NULL
                OR MAX(CASE WHEN pm.meta_key=\'_emart_humanizer_skip\' THEN pm.meta_value END) = \'\'
            )
            AND (
                COALESCE(
                    MAX(CASE WHEN pm.meta_key=\'_emart_meta_description\' THEN pm.meta_value END),
                    MAX(CASE WHEN pm.meta_key=\'_rank_math_description\'  THEN pm.meta_value END)
                ) IS NULL
                OR CHAR_LENGTH(TRIM(COALESCE(
                    MAX(CASE WHEN pm.meta_key=\'_emart_meta_description\' THEN pm.meta_value END),
                    MAX(CASE WHEN pm.meta_key=\'_rank_math_description\'  THEN pm.meta_value END)
                ))) < 130
                OR CHAR_LENGTH(TRIM(COALESCE(
                    MAX(CASE WHEN pm.meta_key=\'_emart_meta_description\' THEN pm.meta_value END),
                    MAX(CASE WHEN pm.meta_key=\'_rank_math_description\'  THEN pm.meta_value END)
                ))) > 158
                OR COALESCE(
                    MAX(CASE WHEN pm.meta_key=\'_emart_meta_description\' THEN pm.meta_value END),
                    MAX(CASE WHEN pm.meta_key=\'_rank_math_description\'  THEN pm.meta_value END)
                ) REGEXP \'৳[0-9,]+\'
            )'''}
        ORDER BY p.ID
        LIMIT {limit * 3}
    """)
    cols = [d[0] for d in cur.description]
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]

    result = []
    for r in rows:
        if len(result) >= limit:
            break
        # Skip bundle/manual-skip products
        if r.get('humanizer_skip'):
            continue
        meta = (r.get('current_meta') or '').strip()
        meta_len = len(meta)
        has_price = bool(re.search(r'৳[\d,]+', meta))
        # Skip already-valid metas (unless force mode)
        if not force and meta_len >= 130 and meta_len <= 158 and not has_price:
            continue
        r['current_meta'] = meta
        r['meta_len']     = meta_len
        r['has_price']    = has_price
        r['ptype']        = detect_type(r['title'])

        # Resolve mini parent title
        parent_id = r.get('mini_parent_id')
        if parent_id and parent_id not in ('none', None, ''):
            try:
                cur.execute(f"SELECT post_title FROM {PREFIX}posts WHERE ID=%s", (int(parent_id),))
                row = cur.fetchone()
                r['parent_title'] = row[0] if row else ''
            except Exception:
                r['parent_title'] = ''
        else:
            r['parent_title'] = ''

        result.append(r)

    return result

def load_taxonomy(cur, post_id):
    """Get brand, origin, concerns, categories for a product."""
    cur.execute(f"""
        SELECT tt.taxonomy, t.name, t.slug
        FROM {PREFIX}term_relationships tr
        JOIN {PREFIX}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
        JOIN {PREFIX}terms t ON t.term_id = tt.term_id
        WHERE tr.object_id = %s
          AND tt.taxonomy IN ('product_cat','pa_brand','pa_origin','pa_concern','pa_skin_type')
    """, (post_id,))
    tax = {'product_cat': [], 'pa_brand': [], 'pa_origin': [], 'pa_concern': [], 'pa_skin_type': []}
    for taxonomy, name, slug in cur.fetchall():
        if taxonomy in tax:
            tax[taxonomy].append(name)
    return tax

# ── Clause-2 pool: each must contain at least one variable ────────────────────
# Variables: {brand}, {origin}, {category}, {size}
# Rule: same template ≤ 50 uses per product category (enforced via clause2_usage)

CLAUSE2_POOL = [
    "Authentic {origin} import — shop {brand} at Emart Bangladesh, COD.",
    "{brand} {category} — buy original at Emart Bangladesh with COD.",
    "For Bangladesh shoppers — original {brand} {category}, COD available.",
    "Shop {brand} {category} at Emart Bangladesh — original stock, COD.",
    "{size} — buy original {brand} at Emart Bangladesh, COD available.",
    "Official {brand} — authentic {origin} import from Emart Bangladesh, COD.",
    "Original {origin} {category} — buy {brand} at Emart Bangladesh, COD.",
    "Get original {brand} at Emart Bangladesh — authentic stock, COD.",
    "{brand} original — shop at Emart Bangladesh with nationwide COD.",
    "Authentic {brand} {category} — order at Emart Bangladesh, COD.",
]

# Brand-free pool — used when pa_brand is empty to avoid "original original" patterns
CLAUSE2_NO_BRAND = [
    "Authentic {origin} import — shop at Emart Bangladesh, COD.",
    "Original {origin} {category} — buy at Emart Bangladesh, COD.",
    "Shop {category} from {origin} at Emart Bangladesh — COD available.",
    "Genuine {origin} skincare — order at Emart Bangladesh, COD.",
    "Authentic {origin} {category} — fast delivery, COD at Emart Bangladesh.",
]

# Per-category clause usage counter: {(category, clause_idx): count}
clause2_usage: dict = {}
CLAUSE2_PER_CATEGORY_LIMIT = 50

# Banned filler phrases — presence in clause 1 triggers a warning/retry
BANNED_FILLER = [
    "nourishing formula", "deep conditioning properties", "advanced care",
    "premium quality", "perfect solution", "specially formulated",
    "carefully crafted", "expertly blended", "ultimate experience",
    "comprehensive formula", "revolutionary", "transformative",
    "state-of-the-art", "cutting-edge", "innovative formula",
    "deeply nourishing", "intensely moisturizing",
]

# Product-type context overrides
TYPE_CONTEXT = {
    'body_wash':  "body wash for skin softening",
    'toner':      "toner/essence for skin prep",
    'oil':        "facial/cleansing oil for deep cleanse",
    'mini':       "mini travel-size version",
    'bundle':     "skincare set",
    'shampoo':    "shampoo for hair care",
    'conditioner':"conditioner for hair care",
    'sunscreen':  "sunscreen SPF protection",
    'serum':      "serum/ampoule for targeted treatment",
    'moisturizer':"moisturizer for hydration",
    'eye_cream':  "eye cream for dark circles",
    'mask':       "face mask for deep treatment",
}

def detect_type(title):
    t = title.lower()
    if re.search(r'\bbody wash\b|\bbody cleanser\b', t):    return 'body_wash'
    if re.search(r'\btoner\b|\bmist\b|\bessence\b', t):     return 'toner'
    if re.search(r'\b(cleansing oil|facial oil|face oil)\b', t): return 'oil'
    if re.search(r'\b(mini|travel.?size|sample)\b', t):     return 'mini'
    if re.search(r'\bshampoo\b', t):                        return 'shampoo'
    if re.search(r'\bconditioner\b', t):                    return 'conditioner'
    if re.search(r'\bsunscreen\b|\bspf\b|\bsun.?block\b', t): return 'sunscreen'
    if re.search(r'\bserum\b|\bampoule\b', t):              return 'serum'
    if re.search(r'\b(moisturi[sz]er|lotion|cream)\b', t):  return 'moisturizer'
    if re.search(r'\beye (cream|gel|serum)\b', t):          return 'eye_cream'
    if re.search(r'\b(mask|pack|sheet)\b', t):              return 'mask'
    return 'generic'

# ── Prompt ────────────────────────────────────────────────────────────────────

SYSTEM = """You are an SEO copywriter for Emart Skincare Bangladesh.
Write ONE meta description for a WooCommerce product.

FORMAT — 2 clauses, total 130-158 characters:
  Clause 1 (80-115c): [Brand] [specific product type] for [1-2 specific use cases] with [1 named ingredient]
  Clause 2 (35-55c):  Use the EXACT suggested clause 2 provided in the prompt — do not invent your own.

CLAUSE 1 RULES — must all be true:
- Start with brand name
- Name a specific ingredient (e.g. "argan oil", "red propolis", "salicylic acid") — not a vague benefit
- Name a specific use case (e.g. "damaged hair", "oily scalp", "thinning hair") — not "hair care"
- No filler: BANNED words → nourishing formula, deeply nourishing, advanced care, premium quality,
  perfect solution, clinic-grade (unless on label), deep conditioning properties, specially formulated

CLAUSE 2 RULES:
- Copy the suggested clause 2 EXACTLY as given — it contains brand/origin/category variables already filled in
- Do not modify it

HARD LIMITS:
- Total 130-158 characters — count before outputting
- NO price (schema handles it)
- Bangladesh + Emart + COD must all appear
- Output ONLY the meta string"""

def pick_clause2(brand, origin, category, size, clause2_idx, product_cats):
    """Pick the least-used clause-2 template for this category batch.
    Uses CLAUSE2_NO_BRAND when brand is empty to prevent 'original original' patterns.
    """
    primary_cat = product_cats[0] if product_cats else 'general'
    pool = CLAUSE2_NO_BRAND if not brand else CLAUSE2_POOL
    best_idx   = clause2_idx % len(pool)
    best_count = clause2_usage.get((primary_cat, best_idx), 0)

    for i in range(len(pool)):
        count = clause2_usage.get((primary_cat, i), 0)
        if count < best_count:
            best_idx   = i
            best_count = count

    cat_label = category.split(',')[0].strip() if category else 'skincare'
    template  = pool[best_idx]
    filled    = template.format(
        brand=brand,
        origin=origin,
        category=cat_label,
        size=size if size else '',
    )

    clause2_usage[(primary_cat, best_idx)] = best_count + 1
    return filled, best_idx


def build_prompt(product, taxonomy, clause2_idx=0):
    brand    = (taxonomy['pa_brand']    or [''])[0]
    origin   = (taxonomy['pa_origin']   or ['South Korea'])[0]
    cats     = taxonomy['product_cat']
    cats_str = ', '.join(cats[:2])
    concerns = ', '.join(taxonomy['pa_concern'][:2]) or 'general skincare'
    ptype    = detect_type(product['title'])
    type_ctx = TYPE_CONTEXT.get(ptype, 'skincare product')

    # Extract size from title (e.g. "150ml", "100g")
    size_m = re.search(r'\b(\d+\s*(?:ml|g|oz|gm|fl\.?oz))\b', product['title'], re.I)
    size   = size_m.group(1) if size_m else ''

    # Pre-fill clause 2 with variables — model copies it exactly
    clause2, used_idx = pick_clause2(brand, origin, cats_str, size, clause2_idx, cats)
    product['_clause2_used'] = clause2
    product['_clause2_idx']  = used_idx

    # Mini hint
    parent_hint = ""
    if ptype == 'mini' and product.get('parent_title'):
        parent_hint = f"\nThis is the MINI/TRAVEL SIZE of: {product['parent_title']}"
        parent_hint += "\nMention mini/travel size in clause 1."

    return f"""Product: {product['title'][:70]}
Brand: {brand or 'see title'}
Type: {type_ctx}
Categories: {cats_str}
Origin: {origin}
Skin/hair concerns: {concerns}{parent_hint}

Clause 2 (copy exactly): "{clause2}"

Write clause 1 (80-115c) then the exact clause 2 above.
Clause 1 must name a specific ingredient and a specific use case.
Output ONLY the complete meta string (130-158 chars total)."""

# ── Deterministic repair ───────────────────────────────────────────────────────

# Variable-free fallback clauses for repair() — no {brand}/{category}/{size} to KeyError on
REPAIR_CLAUSE2 = [
    "Buy authentic at Emart Bangladesh — COD available.",
    "Buy original at Emart Bangladesh with COD delivery.",
    f"Shop at Emart Bangladesh — authentic import, COD.",
    "Get authentic at Emart Bangladesh — fast COD.",
    "Order original at Emart Bangladesh — COD available.",
]


def repair(meta, origin, clause2_idx=0):
    """Post-process: fix common model failures without re-calling the API."""
    meta = meta.strip().strip('"\'')

    # Unescape HTML entities the model sometimes emits literally (e.g. "&amp;")
    meta = meta.replace('&amp;', '&').replace('&#39;', "'").replace('&quot;', '"')

    # Remove price if slipped through
    meta = re.sub(r'\s*for\s*৳[\d,]+', '', meta)
    meta = re.sub(r'৳[\d,]+', '', meta)

    # If Bangladesh or Emart missing — replace clause 2 with a safe variable-free fallback
    if 'bangladesh' not in meta.lower() or 'emart' not in meta.lower():
        suffix = REPAIR_CLAUSE2[clause2_idx % len(REPAIR_CLAUSE2)]
        parts  = re.split(r'\.\s+', meta, maxsplit=1)
        clause1 = parts[0].rstrip('.')
        meta = f"{clause1}. {suffix}"

    # Trim if over 158
    if len(meta) > 158:
        cut = meta.rfind(' ', 0, 156)
        meta = meta[:cut] + "." if cut > 100 else meta[:155] + "."

    # Pad if under 130
    if len(meta) < 130:
        parts = re.split(r'\.\s+', meta, maxsplit=1)
        if len(parts) == 2:
            c1, c2 = parts
            if len(c1) < 90:
                c1 = c1 + f" — authentic {origin} import"
            meta = f"{c1}. {c2}"

    return meta.strip()

# ── LLM call ─────────────────────────────────────────────────────────────────

def generate_meta(client, product, taxonomy, retry_note="", clause2_idx=0):
    prompt = build_prompt(product, taxonomy, clause2_idx)
    if retry_note:
        prompt += f"\n\nPrevious attempt failed: {retry_note}\nAdjust accordingly."

    models = [MODEL] + FALLBACK_MODELS
    for model in models:
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role":"system","content":SYSTEM}, {"role":"user","content":prompt}],
                max_tokens=120, temperature=0.75,
            )
            content = resp.choices[0].message.content
            if not content:
                time.sleep(1); continue
            raw = content.strip().strip('"\'')
            origin = (taxonomy['pa_origin'] or ['South Korea'])[0]
            return repair(raw, origin, clause2_idx)
        except Exception as e:
            if any(c in str(e) for c in ['429','503','404']):
                time.sleep(2); continue
            raise
    raise RuntimeError("All models failed")

# ── Validate ──────────────────────────────────────────────────────────────────

def validate(meta):
    errors   = []
    warnings = []
    meta     = meta.strip()
    length   = len(meta)

    # Hard errors — block apply
    if length < 130: errors.append(f"short:{length}c")
    if length > 158: errors.append(f"long:{length}c")

    # Price in meta — any currency format
    if re.search(r'৳[\d,]+|৳\s*\d|\bBDT\s*\d|\bTk\.?\s*\d|\btaka\s*\d', meta, re.I):
        errors.append("price in meta")

    if 'bangladesh' not in meta.lower():
        errors.append("missing Bangladesh")
    if 'emart' not in meta.lower():
        errors.append("missing Emart")
    if not re.search(r'\bcod\b|cash on delivery', meta, re.I):
        errors.append("missing COD")
    if re.search(r'(treat|cure|clinically proven to|dermatologist tested to)\b.{0,40}\b(acne|disease|condition)', meta, re.I):
        errors.append("medical claim")

    # Length warning band
    if 120 <= length < 130:
        warnings.append(f"short-warn:{length}c (130 minimum)")

    # Filler word warnings
    for filler in BANNED_FILLER:
        if filler.lower() in meta.lower():
            warnings.append(f"filler:'{filler}'")
            break  # one filler warning per meta is enough

    # Emart Bangladesh — not Emart BD
    if re.search(r'\bemart bd\b', meta, re.I) and 'emart bangladesh' not in meta.lower():
        warnings.append("brand variant: use 'Emart Bangladesh' not 'Emart BD'")

    return errors, warnings

# ── Apply ─────────────────────────────────────────────────────────────────────

def _upsert_meta(cur, post_id, key, value):
    cur.execute(f"""SELECT meta_id FROM {PREFIX}postmeta
                WHERE post_id=%s AND meta_key=%s ORDER BY meta_id LIMIT 1""",
                (post_id, key))
    row = cur.fetchone()
    if row:
        cur.execute(f"UPDATE {PREFIX}postmeta SET meta_value=%s WHERE meta_id=%s",
                    (value, row[0]))
        cur.execute(f"""DELETE FROM {PREFIX}postmeta
                    WHERE post_id=%s AND meta_key=%s AND meta_id!=%s""",
                    (post_id, key, row[0]))
    else:
        cur.execute(f"""INSERT INTO {PREFIX}postmeta (post_id,meta_key,meta_value)
                    VALUES (%s,%s,%s)""", (post_id, key, value))


def _revalidate(slug: str):
    """Ping Next.js ISR revalidate so stale meta doesn't serve for up to 1hr."""
    import urllib.request, urllib.error
    secret = os.environ.get('REVALIDATE_SECRET', '')
    if not secret or not slug:
        return
    try:
        body = json.dumps({'slug': slug, 'type': 'product'}).encode()
        req  = urllib.request.Request(
            'https://e-mart.com.bd/api/revalidate',
            data=body,
            headers={'Content-Type': 'application/json', 'x-revalidate-secret': secret},
            method='POST',
        )
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass  # revalidation failure is non-fatal


def apply_meta(cur, conn, post_id, meta, slug=''):
    # Frontend reads _emart_meta_description FIRST (product.ts:42), then _rank_math_description.
    # Must write both — writing only _rank_math_description leaves old _emart_meta_description active.
    _upsert_meta(cur, post_id, '_emart_meta_description', meta)
    _upsert_meta(cur, post_id, '_rank_math_description',  meta)
    conn.commit()
    _revalidate(slug)

# ── Apply-reviewed (safe path) ────────────────────────────────────────────────

def apply_reviewed(jsonl_path: str):
    """
    Apply only rows from a validator-approved clean JSONL.
    This is the ONLY safe apply path — never call --apply directly at scale.
    """
    conn = _db(); cur = conn.cursor()
    applied = failed = skipped = 0

    with open(jsonl_path, encoding='utf-8') as f:
        rows = [json.loads(l) for l in f if l.strip()]

    print(f"Applying {len(rows)} reviewed rows from {jsonl_path}")

    for r in rows:
        pid  = r.get('post_id')
        meta = (r.get('meta_desc') or '').strip()
        slug = r.get('slug', '')

        if not pid or not meta:
            print(f"  ✗ Skip invalid row: {r}"); skipped += 1; continue
        if len(meta) < 130 or len(meta) > 158:
            print(f"  ✗ Skip {pid}: length {len(meta)}c out of range"); skipped += 1; continue

        try:
            apply_meta(cur, conn, pid, meta, r.get("slug",""))
            print(f"  ✓ {pid} ({len(meta)}c) {slug[:45]}")
            applied += 1
        except Exception as e:
            print(f"  ✗ {pid} failed: {e}"); failed += 1

    cur.close(); conn.close()
    print(f"\nApplied:{applied}  Skipped:{skipped}  Failed:{failed}")
    print("Next step: meta_validator --catalog --changed-today")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description='Emart meta description generator.',
        epilog="""
Safe workflow:
  1. python3 meta_generator.py --dry-run --limit 100
  2. python3 meta_validator.py --input workspace/audit/active/meta-generator-YYYY-MM-DD.jsonl
  3. python3 meta_generator.py --apply-reviewed workspace/audit/active/meta-generator-YYYY-MM-DD.clean.jsonl
  4. python3 meta_validator.py --catalog --changed-today
        """
    )
    parser.add_argument('--dry-run',        action='store_true', help='Generate candidates to JSONL, no DB write')
    parser.add_argument('--apply-reviewed', metavar='JSONL',     help='Apply validator-approved clean JSONL (safe path)')
    parser.add_argument('--apply',          action='store_true', help='Direct apply (small batches only, use --apply-reviewed instead)')
    parser.add_argument('--limit',          type=int, default=50)
    parser.add_argument('--post-id',   type=int, action='append', dest='post_ids')
    parser.add_argument('--ids-file',  metavar='FILE', help='File with one product ID per line (used with --force)')
    parser.add_argument('--force',     action='store_true', help='Regenerate even for valid-length metas (use with --ids-file to fix bad patterns)')
    args = parser.parse_args()

    # Load IDs from file if provided
    if args.ids_file:
        with open(args.ids_file) as f:
            file_ids = [int(l.strip()) for l in f if l.strip().isdigit()]
        args.post_ids = (args.post_ids or []) + file_ids
        print(f"Loaded {len(file_ids)} product IDs from {args.ids_file}")

    if args.apply_reviewed:
        apply_reviewed(args.apply_reviewed)
        return

    if not args.dry_run and not args.apply:
        print("Pass --dry-run, --apply-reviewed <jsonl>, or --apply"); sys.exit(1)

    conn = _db(); cur = conn.cursor()

    # Pre-populate clause2_usage from existing live metas so dedup is accurate across 3,000 products
    print("Loading existing clause-2 usage from live DB...")
    cur.execute(f"""
        SELECT
            t.name AS category,
            COALESCE(em.meta_value, rm.meta_value) AS meta
        FROM {PREFIX}posts p
        LEFT JOIN {PREFIX}postmeta em ON em.post_id=p.ID AND em.meta_key='_emart_meta_description'
        LEFT JOIN {PREFIX}postmeta rm ON rm.post_id=p.ID AND rm.meta_key='_rank_math_description'
        JOIN {PREFIX}term_relationships tr ON tr.object_id=p.ID
        JOIN {PREFIX}term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id AND tt.taxonomy='product_cat'
        JOIN {PREFIX}terms t ON t.term_id=tt.term_id
        WHERE p.post_type='product' AND p.post_status='publish'
          AND COALESCE(em.meta_value, rm.meta_value) IS NOT NULL
    """)
    for cat, meta in cur.fetchall():
        if not meta: continue
        parts = re.split(r'\.\s+', meta.strip(), maxsplit=1)
        c2 = parts[1].strip().lower() if len(parts) == 2 else ''
        if not c2: continue
        # Find closest matching pool template index
        for idx, tmpl in enumerate(CLAUSE2_POOL):
            tmpl_base = re.sub(r'\{[^}]+\}', '', tmpl).strip().lower()[:20]
            if tmpl_base and tmpl_base[:15] in c2[:40]:
                clause2_usage[(cat, idx)] = clause2_usage.get((cat, idx), 0) + 1
                break
    print(f"  Clause-2 usage loaded: {sum(clause2_usage.values())} tracked entries")

    products = load_products(cur, args.limit, args.post_ids, force=args.force)
    print(f"Products needing meta: {len(products)} (limit={args.limit})")
    if not products:
        print("Nothing to do."); return

    client = OpenAI(
        api_key=API_KEY,
        base_url="https://openrouter.ai/api/v1",
        default_headers={"HTTP-Referer": "https://e-mart.com.bd", "X-Title": "Emart Meta Generator"},
    )

    applied = failed = already_ok = 0
    jsonl_path = AUDIT / f"meta-generator-{TIMESTAMP}.jsonl"
    AUDIT.mkdir(parents=True, exist_ok=True)

    for i, product in enumerate(products, 1):
        pid   = product['post_id']
        title = product['title'][:55]
        ptype = product.get('ptype', 'generic')
        print(f"\n[{i}/{len(products)}] {title} (ID {pid}, type={ptype})")
        print(f"  Current: {product['meta_len']}c | price={product['has_price']}")

        taxonomy = load_taxonomy(cur, pid)
        origin   = (taxonomy['pa_origin'] or ['South Korea'])[0]
        time.sleep(1.2)

        try:
            c2_idx = (i - 1) % len(CLAUSE2_POOL)
            meta   = generate_meta(client, product, taxonomy, clause2_idx=c2_idx)
            errors, warns = validate(meta)

            if errors:
                meta          = generate_meta(client, product, taxonomy,
                                              retry_note="; ".join(errors),
                                              clause2_idx=(c2_idx + 1) % len(CLAUSE2_POOL))
                errors, warns = validate(meta)

            if errors:
                meta          = repair(meta, origin, c2_idx)
                errors, warns = validate(meta)

            if errors:
                print(f"  ✗ FAILED: {errors}")
                failed += 1
                continue

            warn_str = f" ⚠ {warns}" if warns else ""
            print(f"  ✓ {len(meta)}c: {meta[:110]}{warn_str}")

            with open(jsonl_path, 'a', encoding='utf-8') as f:
                json.dump({"post_id": pid, "slug": product['slug'], "title": product['title'],
                           "meta_desc": meta, "meta_len": len(meta), "ptype": ptype,
                           "warnings": warns, "clause2": product.get('_clause2_used','')},
                          f, ensure_ascii=False)
                f.write('\n')

            if args.apply:
                apply_meta(cur, conn, pid, meta, r.get("slug",""))
                applied += 1

        except Exception as e:
            print(f"  ✗ Error: {e}")
            failed += 1

    cur.close(); conn.close()
    print(f"\n{'='*50}")
    print(f"Applied:{applied}  Failed:{failed}")
    print(f"JSONL: {jsonl_path}")

if __name__ == '__main__':
    main()
