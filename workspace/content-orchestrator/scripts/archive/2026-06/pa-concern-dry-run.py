"""
pa_concern Fresh Dry-Run — Emart Skincare Bangladesh
=====================================================
Generates a CSV of proposed pa_concern assignments for 1,406 products
currently missing the concern attribute.

Logic layers (applied in order, all applicable concerns collected):
  L1  WC concern category membership → direct concern mapping
  L2  pa_ingredient cross-reference → ingredient-based concern inference
  L3  Product title keyword matching → name-based concern inference
  L4  Skincare category type fallback → dryness-hydration for general skincare
  L5  pa_skin_type inference → last resort

SKIP: hair, makeup-only, non-skin accessories.
Multiple concerns per product: YES (all applicable concerns assigned).

Output:
  workspace/audit/active/pa-concern-dry-run-{timestamp}.csv
  workspace/audit/active/pa-concern-dry-run-{timestamp}-summary.txt

2026-05-21 — live term slugs + term_taxonomy_ids verified from DB.
"""

import subprocess, re, csv, json
from datetime import datetime
from pathlib import Path
from collections import defaultdict

# ── DB connection ──────────────────────────────────────────────────────────────
wp_conf = open('/var/www/wordpress/wp-config.php').read()
DB_PASS = re.search(r"define\s*\(\s*'DB_PASSWORD'\s*,\s*'([^']*)'\s*\)", wp_conf).group(1)
DB_USER = "emart_user"
DB_NAME = "emart_live"
PREFIX  = "wp4h_"

def sql(query):
    r = subprocess.run(
        ["mysql", DB_NAME, f"-u{DB_USER}", f"-p{DB_PASS}", "--batch", "--silent", "-e", query],
        capture_output=True, text=True
    )
    if r.returncode != 0:
        raise RuntimeError(r.stderr[:300])
    rows = []
    for line in r.stdout.strip().split('\n'):
        if line:
            rows.append(line.split('\t'))
    return rows

# ── Live pa_concern term_taxonomy_ids (verified 2026-05-21) ───────────────────
CONCERN_TTID = {
    'dryness-hydration':  9691,
    'acne-blemish':       9690,
    'sensitivity':        9696,
    'hyperpigmentation':  9693,
    'sunscreen':          9697,
    'anti-aging-repair':  9689,
    'wrinkle':            9695,
    'brightening':        9694,
    'pores-blackheads':   9692,
}

# ── L1: WC concern category → pa_concern ──────────────────────────────────────
WC_CAT_TO_CONCERN = {
    'acne-blemish-care':  'acne-blemish',
    'acne':               'acne-blemish',
    'dryness-hydration':  'dryness-hydration',
    'melasma':            'hyperpigmentation',
    'anti-aging-repair':  'anti-aging-repair',
    'anti-aging':         'anti-aging-repair',
    'pores-oil-control':  'pores-blackheads',
    'sunscreen':          'sunscreen',
    'sun-care':           'sunscreen',
    'brightening':        'brightening',
    'whitening':          'brightening',
    'sensitivity':        'sensitivity',
    'sensitive-skin':     'sensitivity',
    'wrinkle':            'wrinkle',
    'anti-wrinkle':       'wrinkle',
}

# ── L2: pa_ingredient → concerns ──────────────────────────────────────────────
INGREDIENT_TO_CONCERN = {
    'niacinamide':    ['brightening', 'pores-blackheads', 'hyperpigmentation'],
    'vitamin-c':      ['brightening', 'hyperpigmentation'],
    'bha':            ['acne-blemish', 'pores-blackheads'],
    'aha':            ['brightening', 'acne-blemish'],
    'retinol':        ['anti-aging-repair', 'wrinkle', 'acne-blemish'],
    'bakuchiol':      ['anti-aging-repair', 'wrinkle'],
    'peptide':        ['anti-aging-repair', 'wrinkle'],
    'collagen':       ['anti-aging-repair', 'dryness-hydration'],
    'hyaluronic-acid':['dryness-hydration'],
    'ceramide':       ['dryness-hydration', 'sensitivity'],
    'centella':       ['sensitivity', 'acne-blemish'],
    'mugwort':        ['sensitivity', 'acne-blemish'],
    'tea-tree':       ['acne-blemish'],
    'propolis':       ['acne-blemish', 'brightening'],
    'snail-mucin':    ['anti-aging-repair', 'dryness-hydration'],
    'ginseng':        ['anti-aging-repair', 'brightening'],
    'azelaic-acid':   ['acne-blemish', 'hyperpigmentation'],
    'vitamin-e':      ['dryness-hydration', 'anti-aging-repair'],
    'rice':           ['brightening'],
    'rosemary':       ['anti-aging-repair'],
    'bifida':         ['anti-aging-repair', 'sensitivity'],
    'egf':            ['anti-aging-repair', 'wrinkle'],
}

# ── L3: Product title keyword patterns (specific → general order) ──────────────
# Based on learned correlations from 2,235 existing assignments (2026-05-21).
# (keywords_list, concern_slug_or_None)
# None = "confirmed skincare" marker for L4 fallback only.
TITLE_KEYWORD_CONCERNS = [
    # High-signal specific product identifiers
    (['sunscreen', 'sun cream', 'sunblock', 'sun block', 'sun protection', 'spf ', ' spf', 'pa+', 'uv shield', 'uv protect'], 'sunscreen'),
    (['melasma', 'hyperpigmentation'], 'hyperpigmentation'),
    (['acne', 'blemish', 'pimple', 'spot patch', 'spot cream', 'spot gel', 'spot serum',
      'ac collection', 'anti-bacterial', 'salicylic', 'blackhead strip', 'anti-acne'], 'acne-blemish'),
    (['blackhead', 'whitehead', 'pore cleansing', 'pore pack', 'sebum control', 'oil control pad'], 'pores-blackheads'),
    (['anti-aging', 'anti aging', 'antiaging', 'firming', 'lifting cream', 'elasticity',
      'snail recovery', 'snail repair', 'snail mucin', 'snail extract',
      'retinol', 'retinoic', 'peptide complex', 'collagen ampoule', 'collagen serum'], 'anti-aging-repair'),
    (['wrinkle', 'fine line', 'crow\'s feet', 'crow feet'], 'wrinkle'),
    (['vitamin c', 'vitamin-c', 'ascorbic acid', 'l-ascorbic'], 'brightening'),
    # Eye care products → wrinkle + anti-aging (data shows wrinkle:35, anti-aging:32 for eye-care)
    (['eye cream', 'eye patch', 'eye serum', 'eye gel', 'eye mask', 'dark circle', 'under eye'], 'wrinkle'),
    # Serum without specific signal → brightening (data shows serum→hyperpigmentation:100, brightening:80)
    (['niacinamide serum', 'vitamin c serum', 'brightening serum', 'whitening serum',
      'glow serum', 'radiance serum', 'tone up serum'], 'brightening'),
    (['retinol serum', 'anti-aging serum', 'anti aging serum', 'firming serum',
      'peptide serum', 'collagen serum', 'snail serum'], 'anti-aging-repair'),
    (['brightening toner', 'brightening cream', 'whitening', 'glow cream',
      'radiance', 'luminous', 'even skin', 'dark spot', 'spot brightening'], 'brightening'),
    (['glow', 'brightening'], 'brightening'),
    (['sensitive skin', 'hypoallergenic', 'for sensitive', 'calming serum', 'calming toner',
      'redness relief', 'rosacea', 'barrier repair', 'barrier cream'], 'sensitivity'),
    (['soothing', 'calming'], 'sensitivity'),
    (['pore', 'sebum', 'matte', 'mattifying'], 'pores-blackheads'),
    (['hydrating', 'hydration', 'moisture barrier', 'deep moisture', 'ultra moisture',
      'intensive moisture', 'intensive hydration'], 'dryness-hydration'),
    # Confirmed-skincare markers — no direct concern, just marks product for L4
    (['toner', 'essence', 'serum', 'ampoule', 'emulsion', 'moisturizer', 'moisturising',
      'sheet mask', 'face mask', 'sleeping mask', 'sleeping pack',
      'lip balm', 'lip mask', 'lip serum', 'cleanser', 'cleansing', 'foam cleanser',
      'foam wash', 'micellar', 'cleansing oil', 'scrub', 'exfoliant', 'peeling',
      'toning pad', 'face lotion', 'face cream', 'face gel', 'skin care', 'skincare',
      'body lotion', 'body cream', 'hand cream', 'neck cream',
      ' cream', 'gel cream', 'water cream', 'night cream', 'day cream',
      'recovery gel', 'recovery cream', 'snail cream', 'snail gel',
      ' gel ', ' mask ', ' kit ', ' set ', ' pack ', 'trial kit', 'starter kit',
      'repair cream', 'multi cream', 'all-in-one',
      'mist', 'tonic', 'lotion', 'emollient', 'ointment', 'balm',
    ], None),
]

# ── L4 category-specific defaults (from empirical data on 2,235 existing assignments) ──
# Instead of always defaulting to dryness-hydration, use the most common concern
# for each category type based on observed assignment patterns.
CATEGORY_SPECIFIC_DEFAULTS = {
    # Serums → brightening (data: hyperpigmentation:115, anti-aging:109, acne:101)
    'serums-ampoules-essences': 'brightening',
    'serums': 'brightening',
    'ampoule': 'sensitivity',  # data: sensitivity:39
    # Eye care → wrinkle (data: wrinkle:35, anti-aging:32)
    'eye-care': 'wrinkle',
    'eye-cream': 'wrinkle',
    'eye-patch': 'wrinkle',
    # Cleansers → sensitivity (data: sensitivity:57, acne:49)
    'face-cleansers': 'sensitivity',
    'face-cleanser': 'sensitivity',
    'cleanser': 'sensitivity',
    'cleansing': 'sensitivity',
    # Soothing gel → sensitivity (data: sensitivity:41, dryness:34)
    'soothing-gel': 'sensitivity',
    # Toners → dryness-hydration (data: dryness:56, acne:43, sensitivity:41)
    'toners-mists': 'dryness-hydration',
    # Acne/blemish care cats (shouldn't appear in missing list but just in case)
    'acne-blemish-care': 'acne-blemish',
    # Lip care → dryness-hydration (data: dryness:38)
    'lips': 'dryness-hydration',
    'lip-balm-care': 'dryness-hydration',
    # Default for all others
    '__default__': 'dryness-hydration',
}

# ── Skip category patterns ─────────────────────────────────────────────────────
HAIR_CAT_SLUGS = {
    'hair', 'shampoo', 'shampoos', 'conditioner', 'conditioners', 'hair-oil',
    'hair-mask', 'scalp', 'hair-color', 'hair-serum', 'hair-treatment',
    'hair-tonic', 'hair-care', 'hair-styling',
}
MAKEUP_CAT_SLUGS = {
    'makeup', 'makeup-cosmetics', 'foundation', 'mascara', 'eye-liner', 'eyeliner',
    'eye-shadow', 'eyeshadow', 'blush', 'highlighter', 'primer', 'contour',
    'setting-powder', 'lip-color', 'lipstick', 'lip-gloss', 'lip-tint',
    'concealer', 'brow', 'eyebrow',
}
SKINCARE_FALLBACK_CATS = {
    # Specific skincare product types
    'moisturizer', 'moisturizers', 'toner', 'toners', 'serum', 'serums',
    'essence', 'essences', 'ampoule', 'emulsion', 'face-cream', 'face-gel',
    'sheet-mask', 'face-mask', 'face-masks', 'eye-cream', 'eye-patch', 'eye-care',
    'lip-care', 'lip-balm-care', 'cleanser', 'cleansers', 'cleansing',
    'foam-cleanser', 'foam-cleansers', 'face-cleansers', 'face-cleanser',
    'oil-cleanser', 'micellar-water', 'exfoliant', 'exfoliants', 'peeling',
    'scrub', 'toning-pad', 'soothing-gel', 'sleeping-mask', 'sleeping-pack',
    'face-oil', 'bb-cream', 'cc-cream', 'cushion', 'body-lotion', 'body-cream',
    'body-wash', 'hand-cream', 'hand-care', 'neck-cream', 'skincare',
    'skincare-kit-set', 'skincare-kits', 'skincare-sets',
    # WooCommerce product-type category slugs (specific enough to signal skincare)
    'serums-ampoules-essences', 'toners-mists', 'face-masks', 'makeup-remover',
    'beauty-supplements', 'eye-care', 'lips', 'emart-combos',
    # Origin categories are intentionally NOT included — too broad to infer concern
    # (korean-beauty covers 2,100+ products spanning all concerns)
}

# ── L5: pa_skin_type → concern ─────────────────────────────────────────────────
SKIN_TYPE_TO_CONCERN = {
    'oily':       'pores-blackheads',
    'acne-prone': 'acne-blemish',
    'dry':        'dryness-hydration',
    'sensitive':  'sensitivity',
}

# ── Assignment logic ───────────────────────────────────────────────────────────
def assign_concerns(row):
    pid, title, cat_slugs_raw, origin_slugs_raw, brand_slugs_raw, ing_slugs_raw, skin_type_raw = row

    cats    = set(x for x in cat_slugs_raw.split(',') if x) if cat_slugs_raw and cat_slugs_raw != 'NULL' else set()
    ings    = set(x for x in ing_slugs_raw.split(',')  if x) if ing_slugs_raw  and ing_slugs_raw  != 'NULL' else set()
    stypes  = set(x for x in skin_type_raw.split(',')  if x) if skin_type_raw  and skin_type_raw  != 'NULL' else set()
    title_l = title.lower()

    concerns = set()
    layers_fired = []

    # SKIP check
    non_skip_cats = cats - HAIR_CAT_SLUGS - MAKEUP_CAT_SLUGS
    is_hair_only    = bool(cats & HAIR_CAT_SLUGS) and not non_skip_cats
    is_makeup_only  = bool(cats & MAKEUP_CAT_SLUGS) and not non_skip_cats
    hair_in_title   = any(k in title_l for k in ['shampoo', 'conditioner', 'hair oil', 'hair mask', 'scalp treatment'])
    makeup_in_title = any(k in title_l for k in ['foundation', 'mascara', 'eyeliner', 'eyeshadow', 'blush', 'highlighter', 'lipstick'])

    # Non-skin product title guard
    non_skin_title_kws = [
        # Non-skin tools
        'false nail', 'nail glue', 'nail tip', 'nail art', 'nail drill',
        'false lash', 'lash glue', 'hair clip', 'hair band', 'hair tie',
        'razor', 'shaver', 'epilator', 'tweezer', 'lint roller',
        'cellulite', 'intimate wash',
        # Makeup product types (not skincare)
        'lipstick', 'lip gloss', 'lip tint', 'lip liner', 'lip color', 'lip colour',
        ' blusher', ' blush ', 'highlighter pen', 'face highlighter',
        'foundation stick', 'bb fit foundation', 'fit foundation',
        'mascara', 'eye liner', 'eyeshadow', 'eye shadow palette',
        'setting powder', 'face powder', 'bronzer', 'contour stick',
        'eyelid primer', 'face primer',
        # Non-skincare personal care
        'diaper', 'nappy', 'wet wipe', 'baby wipe', 'baby diaper',
        'toothpaste', 'toothbrush', 'mouthwash', 'dental floss',
        'deodorant', 'antiperspirant', 'perfume', 'cologne', 'edp', 'edt',
    ]
    if any(k in title_l for k in non_skin_title_kws):
        return [], 'SKIP', 'non-skin-product', ''

    if is_hair_only and not bool(cats & SKINCARE_FALLBACK_CATS):
        return [], 'SKIP', 'hair-category', ''
    if is_makeup_only and not bool(cats & SKINCARE_FALLBACK_CATS):
        return [], 'SKIP', 'makeup-only', ''
    if not cats and hair_in_title and not makeup_in_title:
        return [], 'SKIP', 'hair-title', ''

    # L1
    l1_hits = []
    for cat in cats:
        if cat in WC_CAT_TO_CONCERN:
            c = WC_CAT_TO_CONCERN[cat]
            concerns.add(c)
            l1_hits.append(f'{cat}→{c}')
    if l1_hits:
        layers_fired.append(f'L1:{"|".join(l1_hits)}')

    # L2
    l2_hits = []
    for ing in ings:
        if ing in INGREDIENT_TO_CONCERN:
            for c in INGREDIENT_TO_CONCERN[ing]:
                concerns.add(c)
            l2_hits.append(f'{ing}→{",".join(INGREDIENT_TO_CONCERN[ing])}')
    if l2_hits:
        layers_fired.append(f'L2:{"|".join(l2_hits[:3])}')  # cap notes length

    # L3
    skincare_marker = False
    l3_hits = []
    for keywords, concern in TITLE_KEYWORD_CONCERNS:
        if any(kw in title_l for kw in keywords):
            if concern is not None:
                concerns.add(concern)
                matched_kw = next(kw for kw in keywords if kw in title_l)
                l3_hits.append(f'"{matched_kw}"→{concern}')
            else:
                skincare_marker = True
    if l3_hits:
        layers_fired.append(f'L3:{"|".join(l3_hits[:3])}')

    # L4: category-specific fallback (learned from 2,235 existing assignments)
    # Specific categories are checked in priority order before falling back to __default__.
    L4_PRIORITY_CATS = [
        'serums-ampoules-essences', 'serums', 'ampoule',
        'eye-care', 'eye-cream', 'eye-patch',
        'face-cleansers', 'face-cleanser', 'cleanser',
        'soothing-gel', 'toners-mists',
        'lips', 'lip-balm-care',
    ]
    if not concerns:
        has_skincare_cat = bool(cats & SKINCARE_FALLBACK_CATS)
        # Require an actual specific skincare category — title words alone (cream/gel/toner)
        # are not sufficient signal when the product is only in a broad origin category.
        if has_skincare_cat:
            assigned_default = None
            for priority_cat in L4_PRIORITY_CATS:
                if priority_cat in cats:
                    assigned_default = CATEGORY_SPECIFIC_DEFAULTS.get(priority_cat)
                    break
            if assigned_default is None:
                # Check title words for product-type-specific defaults
                if any(k in title_l for k in ['eye cream', 'eye serum', 'eye gel', 'eye patch', 'eye mask', 'dark circle', 'under eye']):
                    assigned_default = 'wrinkle'
                elif any(k in title_l for k in ['ampoule', ' ampule']):
                    assigned_default = 'sensitivity'
                elif ' serum' in title_l or title_l.endswith('serum'):
                    assigned_default = 'brightening'
                else:
                    assigned_default = CATEGORY_SPECIFIC_DEFAULTS['__default__']
            concerns.add(assigned_default)
            # Eye products also get anti-aging-repair
            if any(c in cats for c in ('eye-care', 'eye-cream', 'eye-patch')) or \
               any(k in title_l for k in ('eye cream', 'eye serum', 'eye gel', 'dark circle', 'under eye')):
                concerns.add('anti-aging-repair')
            layers_fired.append(f'L4:cat-default→{assigned_default}')

    # L5: skin type — only if still no concern
    if not concerns:
        l5_hits = []
        for st in stypes:
            if st in SKIN_TYPE_TO_CONCERN:
                concerns.add(SKIN_TYPE_TO_CONCERN[st])
                l5_hits.append(f'{st}→{SKIN_TYPE_TO_CONCERN[st]}')
        if l5_hits:
            layers_fired.append(f'L5:{"|".join(l5_hits)}')

    if not concerns:
        return [], 'SKIP', 'no-signal', ''

    # Confidence
    if layers_fired and layers_fired[0].startswith('L1'):
        confidence = 'HIGH'
    elif any(f.startswith(('L1', 'L2', 'L3')) for f in layers_fired) and not all(f.startswith('L4') for f in layers_fired):
        confidence = 'MED'
    else:
        confidence = 'LOW'

    return sorted(concerns), None, None, ' + '.join(layers_fired)


# ── Main ───────────────────────────────────────────────────────────────────────
def load_taxonomy_map(taxonomy):
    """Returns {product_id: [slug, ...]} for all published products."""
    rows = sql(f"""
        SELECT tr.object_id, t.slug
        FROM {PREFIX}term_relationships tr
        JOIN {PREFIX}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
        JOIN {PREFIX}terms t ON t.term_id = tt.term_id
        JOIN {PREFIX}posts p ON p.ID = tr.object_id
        WHERE tt.taxonomy = '{taxonomy}'
          AND p.post_status = 'publish' AND p.post_type = 'product'
    """)
    result = defaultdict(list)
    for row in rows:
        if len(row) == 2:
            result[int(row[0])].append(row[1])
    return result


def main():
    ts = datetime.now().strftime('%Y%m%d-%H%M%S')
    out_dir = Path('/var/www/emart-platform/workspace/audit/active')
    out_dir.mkdir(parents=True, exist_ok=True)
    csv_path = out_dir / f'pa-concern-dry-run-{ts}.csv'
    summary_path = out_dir / f'pa-concern-dry-run-{ts}-summary.txt'

    print("Loading products missing pa_concern...")
    # Simple base query — no joins
    base_rows = sql(f"""
        SELECT p.ID, p.post_title
        FROM {PREFIX}posts p
        WHERE p.post_status = 'publish' AND p.post_type = 'product'
          AND p.ID NOT IN (
            SELECT DISTINCT object_id FROM {PREFIX}term_relationships tr2
            JOIN {PREFIX}term_taxonomy tt2 ON tt2.term_taxonomy_id = tr2.term_taxonomy_id
            WHERE tt2.taxonomy = 'pa_concern'
          )
        ORDER BY p.ID
    """)
    missing_ids = set(int(r[0]) for r in base_rows if len(r) >= 1)
    print(f"Found {len(base_rows)} products missing pa_concern.")

    print("Loading taxonomy maps...")
    cat_map      = load_taxonomy_map('product_cat')
    origin_map   = load_taxonomy_map('pa_origin')
    brand_map    = load_taxonomy_map('pa_brand')
    ing_map      = load_taxonomy_map('pa_ingredient')
    skintype_map = load_taxonomy_map('pa_skin_type')
    print("Taxonomy maps loaded.")

    # Rebuild rows with taxonomy data
    rows = []
    for r in base_rows:
        if len(r) < 2:
            continue
        pid_int = int(r[0])
        rows.append((
            r[0], r[1],
            ','.join(cat_map.get(pid_int, [])),
            ','.join(origin_map.get(pid_int, [])),
            ','.join(brand_map.get(pid_int, [])),
            ','.join(ing_map.get(pid_int, [])),
            ','.join(skintype_map.get(pid_int, [])),
        ))
    print(f"Processing {len(rows)} products...")

    print(f"Found {len(rows)} products missing pa_concern. Processing...")

    results = []
    stats = defaultdict(int)
    concern_dist = defaultdict(int)

    for row in rows:
        if len(row) < 7:
            row = row + [''] * (7 - len(row))
        pid, title, cat_slugs, origin_slugs, brand_slugs, ing_slugs, skin_type = row

        concerns, skip_action, skip_reason, notes = assign_concerns(row)

        if skip_action == 'SKIP':
            stats[f'skip_{skip_reason}'] += 1
            stats['total_skip'] += 1
            results.append({
                'product_id': pid,
                'product_title': title,
                'cat_slugs': cat_slugs,
                'origin_slugs': origin_slugs,
                'brand_slugs': brand_slugs,
                'ingredient_slugs': ing_slugs,
                'concerns_assigned': 'SKIP',
                'confidence': 'SKIP',
                'skip_reason': skip_reason,
                'notes': notes,
            })
        else:
            confidence = 'LOW'
            if notes.startswith('L1'):
                confidence = 'HIGH'
            elif any(n in notes for n in ['L1', 'L2', 'L3']):
                confidence = 'MED'
            stats[f'assign_{confidence.lower()}'] += 1
            stats['total_assign'] += 1
            for c in concerns:
                concern_dist[c] += 1
            results.append({
                'product_id': pid,
                'product_title': title,
                'cat_slugs': cat_slugs,
                'origin_slugs': origin_slugs,
                'brand_slugs': brand_slugs,
                'ingredient_slugs': ing_slugs,
                'concerns_assigned': '|'.join(concerns),
                'confidence': confidence,
                'skip_reason': '',
                'notes': notes,
            })

    # Write CSV
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=[
            'product_id', 'product_title', 'cat_slugs', 'origin_slugs',
            'brand_slugs', 'ingredient_slugs', 'concerns_assigned',
            'confidence', 'skip_reason', 'notes'
        ])
        w.writeheader()
        w.writerows(results)

    # Write summary
    total = len(rows)
    summary = f"""pa_concern Dry-Run Summary
Generated: {ts}
Total products processed: {total}

=== SKIP ===
Total skipped: {stats['total_skip']}
  hair-category:  {stats.get('skip_hair-category', 0)}
  hair-title:     {stats.get('skip_hair-title', 0)}
  makeup-only:    {stats.get('skip_makeup-only', 0)}
  no-signal:      {stats.get('skip_no-signal', 0)}
  other:          {stats['total_skip'] - stats.get('skip_hair-category', 0) - stats.get('skip_hair-title', 0) - stats.get('skip_makeup-only', 0) - stats.get('skip_no-signal', 0)}

=== TO ASSIGN ===
Total to assign: {stats['total_assign']}
  HIGH confidence (L1 WC concern cat):  {stats.get('assign_high', 0)}
  MED  confidence (L2/L3 ingredient/kw): {stats.get('assign_med', 0)}
  LOW  confidence (L4/L5 fallback):      {stats.get('assign_low', 0)}

=== CONCERN DISTRIBUTION (products to add) ===
"""
    for concern, count in sorted(concern_dist.items(), key=lambda x: -x[1]):
        summary += f"  {concern}: {count}\n"

    summary += f"""
=== VALIDATION ===
Rows in CSV: {len(results)}
SKIP + ASSIGN = {stats['total_skip'] + stats['total_assign']} (should = {total})

Review LOW-confidence rows before approving apply.
Run: grep ',LOW,' {csv_path.name} | head -30
"""
    with open(summary_path, 'w') as f:
        f.write(summary)

    print(summary)
    print(f"\nCSV: {csv_path}")
    print(f"Summary: {summary_path}")
    print(f"\nReview LOW-confidence rows:")
    print(f"  grep ',LOW,' {csv_path} | head -20")
    print(f"\nWhen satisfied, run: python3 pa-concern-apply.py {csv_path}")


if __name__ == '__main__':
    main()
