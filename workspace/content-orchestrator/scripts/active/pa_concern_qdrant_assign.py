#!/usr/bin/env python3
"""Qdrant-crosschecked pa_concern assignment for published skincare products.

Dry-run is the default. --apply writes only high-confidence pa_concern term
relationships for products that currently have none. Every applied relationship
is recorded in a rollback JSON file before insertion.
"""

import argparse
import csv
import json
import os
import re
import subprocess
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

import numpy as np

ROOT = Path('/root/emart-platform')
OUT = ROOT / 'workspace/audit/active'
QDRANT = 'http://127.0.0.1:6333'
COLLECTION = 'emart_products'

CONCERNS = {
    'acne-blemish': 9690,
    'anti-aging-repair': 9689,
    'brightening': 9694,
    'dryness-hydration': 9691,
    'hyperpigmentation': 9693,
    'pores-blackheads': 9692,
    'sensitivity': 9696,
    'sunscreen': 9697,
    'wrinkle': 9695,
}

CATEGORY_RULES = {
    'acne-blemish-care': 'acne-blemish', 'acne': 'acne-blemish',
    'dryness-hydration': 'dryness-hydration', 'melasma': 'hyperpigmentation',
    'anti-aging-repair': 'anti-aging-repair', 'anti-aging': 'anti-aging-repair',
    'pores-oil-control': 'pores-blackheads', 'sunscreen': 'sunscreen',
    'sun-care': 'sunscreen', 'brightening': 'brightening',
    'whitening': 'brightening', 'sensitivity': 'sensitivity',
    'sensitive-skin': 'sensitivity', 'wrinkle': 'wrinkle',
}

INGREDIENT_RULES = {
    'niacinamide': ('brightening', 'pores-blackheads', 'hyperpigmentation'),
    'vitamin-c': ('brightening', 'hyperpigmentation'),
    'bha': ('acne-blemish', 'pores-blackheads'),
    'aha': ('brightening', 'acne-blemish'),
    'retinol': ('anti-aging-repair', 'wrinkle', 'acne-blemish'),
    'bakuchiol': ('anti-aging-repair', 'wrinkle'),
    'peptide': ('anti-aging-repair', 'wrinkle'),
    'collagen': ('anti-aging-repair', 'dryness-hydration'),
    'hyaluronic-acid': ('dryness-hydration',),
    'ceramide': ('dryness-hydration', 'sensitivity'),
    'centella': ('sensitivity', 'acne-blemish'),
    'mugwort': ('sensitivity', 'acne-blemish'),
    'tea-tree': ('acne-blemish',), 'propolis': ('acne-blemish', 'brightening'),
    'snail-mucin': ('anti-aging-repair', 'dryness-hydration'),
    'ginseng': ('anti-aging-repair', 'brightening'),
    'azelaic-acid': ('acne-blemish', 'hyperpigmentation'),
    'vitamin-e': ('dryness-hydration', 'anti-aging-repair'),
    'rice': ('brightening',), 'bifida': ('anti-aging-repair', 'sensitivity'),
    'egf': ('anti-aging-repair', 'wrinkle'),
}

TITLE_RULES = [
    (r'\b(sunscreen|sun ?cream|sunblock|sun fluid|spf\s*\d|uv protect)', 'sunscreen'),
    (r'\b(melasma|hyperpigmentation|dark spot|pigment)', 'hyperpigmentation'),
    (r'\b(acne|blemish|pimple|salicylic|spot patch|anti-acne)', 'acne-blemish'),
    (r'\b(blackhead|whitehead|sebum|pore)', 'pores-blackheads'),
    (r'\b(retinol|retinal|retinoid|anti-aging|anti aging|firming|elasticity)', 'anti-aging-repair'),
    (r'\b(wrinkle|fine line|eye cream|eye serum|eye patch)', 'wrinkle'),
    (r'\b(vitamin c|vita c|niacinamide|bright|whitening|radiance|glow serum)', 'brightening'),
    (r'\b(sensitive skin|hypoallergenic|calming|redness|barrier repair|soothing)', 'sensitivity'),
    (r'\b(gentle|kind to skin)', 'sensitivity'),
    (r'\b(oily skin|normal to oily|oil control)', 'pores-blackheads'),
    (r'\b(hydrating|hydration|deep moisture|moisture barrier|moisturising|moisturizing|'
     r'body lotion|hand cream|lip mask|lip sleeping mask|intensive care|anti-dry)', 'dryness-hydration'),
]

SKIN_TYPE_RULES = {
    'oily': 'pores-blackheads', 'acne-prone': 'acne-blemish',
    'dry': 'dryness-hydration', 'sensitive': 'sensitivity',
}

SKINCARE_CATS = {
    'face-cleansers', 'serums-ampoules-essences', 'toners-mists', 'face-masks',
    'wash-off-mask', 'eye-care', 'sunscreen', 'soothing-gel', 'makeup-remover',
    'cream-moisturizer', 'acne-blemish-care', 'anti-aging-repair',
    'dryness-hydration', 'pores-oil-control', 'melasma', 'brightening',
    'sensitivity', 'wrinkle', 'skincare-kit-set', 'skin-care', 'lips',
}

SKINCARE_RE = re.compile(
    r'cleanser|cleansing|face wash|facial wash|foam wash|toner|essence|serum|'
    r'ampoule|emulsion|moisturi[sz]er|face cream|eye cream|eye serum|eye gel|'
    r'eye patch|face gel|sun cream|sunscreen|sunblock|spf|sheet mask|face mask|'
    r'wash-off mask|sleeping mask|peeling|exfol|scrub|micellar|cleansing oil|'
    r'cleansing balm|skin ?care|acne|blemish|pimple|blackhead|pore|retinol|'
    r'niacinamide|hyaluronic|ceramide|centella|mugwort|snail mucin|brightening|'
    r'anti-aging|anti aging|wrinkle|spot cream|spot gel|spot serum|barrier cream|'
    r'soothing gel|facial mist|face mist|lip balm|lip mask|lip serum|body lotion|'
    r'body cream|hand cream', re.I)

NON_SKIN_RE = re.compile(
    r'shampoo|conditioner|hair oil|hair mask|hair serum|hair essence|hair tonic|'
    r'hair treatment|hair vinegar|keratin treatment|hair loss|hair colou?r|scalp|'
    r'lipstick|lip tint|lip gloss|lip liner|cushion|foundation|mascara|eye ?liner|'
    r'eye ?shadow|blush|highlighter|concealer|primer|setting powder|face powder|'
    r'skinfinish|bronzer|contour|\bnail\b|false lash|lash glue|perfume|cologne|eau de|'
    r'\bedp\b|\bedt\b|deodorant|antiperspirant|toothpaste|toothbrush|mouthwash|'
    r'diaper|sanitary pad|wet wipe|intimate wash|noodle|ramen|chocolate|'
    r'comforter|blanket|glove|heater|cosmetic pad|cotton (pad|round|wool|ball)|puff|beauty device|'
    r'booster pro|hair remov|wax strip|slimming|cellulite|supplement|tablet|'
    r'vibrating|bullet for women|makeup brush|concealer brush', re.I)


def is_non_skin_title(title):
    if not NON_SKIN_RE.search(title):
        return False
    # Product-purpose phrases override incidental fragrance/tool words.
    if re.search(r'body lotion|body cream|hand cream|face scrub|facial scrub', title, re.I):
        return False
    if re.search(r'foundation-skip.*sun cream', title, re.I):
        return False
    return True


def parse_env(path):
    values = {}
    for line in path.read_text().splitlines():
        if not line or line.lstrip().startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        values[key.strip()] = value.strip().strip('"\'')
    return values


def db_credentials():
    config = Path('/var/www/wordpress/wp-config.php').read_text()
    def value(name):
        match = re.search(rf"define\s*\(\s*'{name}'\s*,\s*'([^']*)'", config)
        if not match:
            raise RuntimeError(f'{name} missing from wp-config.php')
        return match.group(1)
    return value('DB_NAME'), value('DB_USER'), value('DB_PASSWORD')


def sql(query):
    name, user, password = db_credentials()
    result = subprocess.run(
        ['mysql', name, f'-u{user}', f'-p{password}', '--batch', '--skip-column-names', '-e', query],
        text=True, capture_output=True, check=True)
    return [line.split('\t') for line in result.stdout.splitlines() if line]


def load_products():
    query = """
    SELECT p.ID, REPLACE(REPLACE(p.post_title,CHAR(9),' '),CHAR(10),' '),
      COALESCE(GROUP_CONCAT(DISTINCT IF(tt.taxonomy='product_cat',t.slug,NULL)),''),
      COALESCE(GROUP_CONCAT(DISTINCT IF(tt.taxonomy='pa_ingredient',t.slug,NULL)),''),
      COALESCE(GROUP_CONCAT(DISTINCT IF(tt.taxonomy='pa_skin_type',t.slug,NULL)),''),
      COALESCE(GROUP_CONCAT(DISTINCT IF(tt.taxonomy='pa_concern',t.slug,NULL)),'')
    FROM wp4h_posts p
    LEFT JOIN wp4h_term_relationships tr ON tr.object_id=p.ID
    LEFT JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id
    LEFT JOIN wp4h_terms t ON t.term_id=tt.term_id
    WHERE p.post_type='product' AND p.post_status='publish'
    GROUP BY p.ID,p.post_title ORDER BY p.ID
    """
    products = {}
    for pid, title, cats, ingredients, skin_types, concerns in sql(query):
        products[int(pid)] = {
            'id': int(pid), 'title': title,
            'cats': set(filter(None, cats.split(','))),
            'ingredients': set(filter(None, ingredients.split(','))),
            'skin_types': set(filter(None, skin_types.split(','))),
            'concerns': set(filter(None, concerns.split(','))),
        }
    return products


def qdrant_request(path, key, body):
    request = Request(
        f'{QDRANT}{path}', data=json.dumps(body).encode(), method='POST',
        headers={'api-key': key, 'Content-Type': 'application/json'})
    with urlopen(request, timeout=60) as response:
        return json.loads(response.read())['result']


def load_vectors(key):
    vectors = {}
    offset = None
    while True:
        body = {'limit': 256, 'with_payload': True, 'with_vector': True}
        if offset is not None:
            body['offset'] = offset
        result = qdrant_request(f'/collections/{COLLECTION}/points/scroll', key, body)
        for point in result['points']:
            pid = int(point.get('payload', {}).get('product_id', 0) or 0)
            if pid and point.get('vector'):
                vectors[pid] = np.asarray(point['vector'], dtype=np.float32)
        offset = result.get('next_page_offset')
        if offset is None:
            break
    return vectors


def is_skincare(product):
    # Product identity wins over polluted/broad categories and generic words such
    # as "serum" or "SPF" used by haircare and makeup.
    if is_non_skin_title(product['title']):
        return False
    return bool(
        product['cats'] & SKINCARE_CATS or product['ingredients'] or
        product['skin_types'] or SKINCARE_RE.search(product['title']))


def rule_evidence(product):
    evidence = defaultdict(list)
    for cat in product['cats']:
        if cat in CATEGORY_RULES:
            evidence[CATEGORY_RULES[cat]].append(f'category:{cat}')
    for ingredient in product['ingredients']:
        for concern in INGREDIENT_RULES.get(ingredient, ()):
            evidence[concern].append(f'ingredient:{ingredient}')
    title = product['title'].lower()
    for pattern, concern in TITLE_RULES:
        if re.search(pattern, title):
            evidence[concern].append(f'title:{pattern}')
    for skin_type in product['skin_types']:
        if skin_type in SKIN_TYPE_RULES:
            evidence[SKIN_TYPE_RULES[skin_type]].append(f'skin-type:{skin_type}')
    return evidence


def vector_votes(vector, matrix, labels, product_ids, k=20):
    sims = matrix @ (vector / max(np.linalg.norm(vector), 1e-9))
    take = min(k, len(sims))
    indices = np.argpartition(sims, -take)[-take:]
    indices = indices[np.argsort(sims[indices])[::-1]]
    scores, counts = Counter(), Counter()
    neighbors = []
    total = 0.0
    for index in indices:
        similarity = float(sims[index])
        weight = max(similarity - 0.35, 0.0)
        if not weight:
            continue
        total += weight
        neighbor_labels = labels[index]
        for label in neighbor_labels:
            scores[label] += weight / max(len(neighbor_labels), 1)
            counts[label] += 1
        neighbors.append((product_ids[index], round(similarity, 4), '|'.join(sorted(neighbor_labels))))
    shares = {label: score / max(total, 1e-9) for label, score in scores.items()}
    return shares, counts, neighbors[:5]


def decide(product, shares, counts):
    evidence = rule_evidence(product)
    chosen, reasons = set(), []
    for concern, items in evidence.items():
        category = any(item.startswith('category:') for item in items)
        title = any(item.startswith('title:') for item in items)
        ingredient = any(item.startswith('ingredient:') for item in items)
        skin_type = any(item.startswith('skin-type:') for item in items)
        share = shares.get(concern, 0.0)
        count = counts.get(concern, 0)
        sunscreen_category_only = (
            category and concern == 'sunscreen' and
            not re.search(r'\b(sunscreen|sun ?cream|sunblock|sun fluid|spf\s*\d|uv protect)', product['title'], re.I)
        )
        if ((category and not sunscreen_category_only) or
                (title and share >= 0.08) or
                (ingredient and share >= 0.10) or
                (skin_type and share >= 0.14)):
            chosen.add(concern)
            reasons.append(f'{concern}:rules={"+".join(items)};q={share:.3f}/{count}')

    return sorted(chosen), '; '.join(reasons)


def apply_rows(rows, stamp):
    rollback = {'created_at': stamp, 'relationships': []}
    values = []
    for row in rows:
        for concern in row['assigned']:
            ttid = CONCERNS[concern]
            rollback['relationships'].append({'product_id': row['id'], 'term_taxonomy_id': ttid, 'concern': concern})
            values.append(f"({row['id']},{ttid},0)")
    rollback_path = OUT / f'pa-concern-qdrant-rollback-{stamp}.json'
    rollback_path.write_text(json.dumps(rollback, indent=2) + '\n')
    if values:
        sql('INSERT IGNORE INTO wp4h_term_relationships (object_id,term_taxonomy_id,term_order) VALUES ' + ','.join(values))
        for ttid in sorted(set(CONCERNS.values())):
            sql(f"UPDATE wp4h_term_taxonomy tt SET count=(SELECT COUNT(*) FROM wp4h_term_relationships tr WHERE tr.term_taxonomy_id=tt.term_taxonomy_id) WHERE tt.term_taxonomy_id={ttid}")
    return rollback_path, len(values)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')
    OUT.mkdir(parents=True, exist_ok=True)

    env = parse_env(ROOT / 'apps/web/.env.local')
    key = env.get('QDRANT_API_KEY', os.environ.get('QDRANT_API_KEY', ''))
    if not key:
        raise SystemExit('QDRANT_API_KEY missing')

    products = load_products()
    missing = [p for p in products.values() if not p['concerns']]
    candidates = [p for p in missing if is_skincare(p)]
    vectors = load_vectors(key)
    labeled = [p for p in products.values() if p['concerns'] and p['id'] in vectors]
    matrix = np.vstack([vectors[p['id']] / max(np.linalg.norm(vectors[p['id']]), 1e-9) for p in labeled])
    labels = [p['concerns'] for p in labeled]
    labeled_ids = [p['id'] for p in labeled]

    rows = []
    for product in candidates:
        if product['id'] not in vectors:
            rows.append({**product, 'assigned': [], 'reason': 'missing-qdrant-vector', 'neighbors': []})
            continue
        shares, counts, neighbors = vector_votes(vectors[product['id']], matrix, labels, labeled_ids)
        assigned, reason = decide(product, shares, counts)
        rows.append({**product, 'assigned': assigned, 'reason': reason or 'insufficient-consensus', 'neighbors': neighbors})

    csv_path = OUT / f'pa-concern-qdrant-review-{stamp}.csv'
    with csv_path.open('w', newline='', encoding='utf-8') as handle:
        writer = csv.DictWriter(handle, fieldnames=['product_id','title','categories','ingredients','skin_types','assigned','reason','top_neighbors'])
        writer.writeheader()
        for row in rows:
            writer.writerow({
                'product_id': row['id'], 'title': row['title'],
                'categories': '|'.join(sorted(row['cats'])),
                'ingredients': '|'.join(sorted(row['ingredients'])),
                'skin_types': '|'.join(sorted(row['skin_types'])),
                'assigned': '|'.join(row['assigned']), 'reason': row['reason'],
                'top_neighbors': json.dumps(row['neighbors'], separators=(',', ':')),
            })

    approved = [row for row in rows if row['assigned']]
    distribution = Counter(c for row in approved for c in row['assigned'])
    print(json.dumps({
        'published_missing': len(missing), 'skincare_candidates': len(candidates),
        'qdrant_vectors': len(vectors), 'trusted_labeled_vectors': len(labeled),
        'approved_products': len(approved), 'held_for_review': len(rows)-len(approved),
        'assignment_distribution': distribution, 'review_csv': str(csv_path),
    }, indent=2))

    if args.apply:
        rollback_path, relationships = apply_rows(approved, stamp)
        print(json.dumps({'applied_products': len(approved), 'relationships': relationships, 'rollback': str(rollback_path)}, indent=2))


if __name__ == '__main__':
    main()
