#!/usr/bin/env python3
"""Read-only whole-catalog pa_concern audit using concern-free embeddings."""

import csv
import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

sys.path.insert(0, str(Path(__file__).parent))
from pa_concern_qdrant_assign import (  # noqa: E402
    CATEGORY_RULES, COLLECTION, OUT, ROOT, is_non_skin_title,
    load_products, load_vectors, parse_env, rule_evidence, vector_votes,
)

BROAD_CATS = {
    'korean-beauty', 'japanese-beauty', 'makeup-cosmetics', 'emart-combos',
    'hair-personal-care', 'mother-baby-care', 'general-health', 'health-wellbeing',
} | set(CATEGORY_RULES)


def clean_text(product):
    product_cats = sorted(product['cats'] - BROAD_CATS)
    parts = [product['title']]
    if product_cats:
        parts.append('Product type: ' + ', '.join(product_cats))
    if product['ingredients']:
        parts.append('Ingredients: ' + ', '.join(sorted(product['ingredients'])))
    if product['skin_types']:
        parts.append('Skin types: ' + ', '.join(sorted(product['skin_types'])))
    return ' | '.join(parts)


def classify(product, shares, counts):
    current = product['concerns']
    evidence = rule_evidence(product)
    explicit = set(evidence)
    ranked = sorted(shares.items(), key=lambda item: item[1], reverse=True)
    top = ranked[0] if ranked else ('', 0.0)
    second = ranked[1][1] if len(ranked) > 1 else 0.0
    margin = top[1] - second
    supported_explicit = {
        concern for concern in explicit
        if shares.get(concern, 0) >= 0.08 and counts.get(concern, 0) >= 2
    }

    flags = []
    severity = 'OK'
    non_skin = is_non_skin_title(product['title'])
    if current and non_skin:
        flags.append('NON_SKIN_PRODUCT_HAS_CONCERN')
        severity = 'CRITICAL'
    if current and supported_explicit and not (current & supported_explicit):
        flags.append('EXPLICIT_RULE_CONFLICT')
        severity = 'HIGH' if severity == 'OK' else severity
    if (current and top[1] >= 0.40 and margin >= 0.15 and
            top[0] not in current and not (current & supported_explicit)):
        flags.append('STRONG_NEIGHBOR_CONTRADICTION')
        severity = 'HIGH' if severity == 'OK' else severity
    if current and max((shares.get(c, 0) for c in current), default=0) < 0.05:
        flags.append('CURRENT_CONCERN_LOW_VECTOR_SUPPORT')
        severity = 'MEDIUM' if severity == 'OK' else severity
    if not current and supported_explicit and not non_skin:
        flags.append('MISSING_WITH_SUPPORTED_RULE')
        severity = 'HIGH'
    if (not current and not non_skin and top[1] >= 0.48 and margin >= 0.25 and
            counts.get(top[0], 0) >= 8):
        flags.append('MISSING_WITH_STRONG_NEIGHBORS')
        severity = 'MEDIUM' if severity == 'OK' else severity
    return severity, flags, supported_explicit, top, margin


def main():
    stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')
    OUT.mkdir(parents=True, exist_ok=True)
    env = parse_env(ROOT / 'apps/web/.env.local')
    key = env.get('QDRANT_API_KEY', '')
    if not key:
        raise SystemExit('QDRANT_API_KEY missing')

    print('[1/5] Loading WooCommerce catalog and Qdrant vectors...', flush=True)
    products = load_products()
    vectors = load_vectors(key)
    labeled = [p for p in products.values() if p['concerns'] and p['id'] in vectors]
    labeled_matrix = np.vstack([
        vectors[p['id']] / max(np.linalg.norm(vectors[p['id']]), 1e-9) for p in labeled
    ])
    labeled_labels = [p['concerns'] for p in labeled]
    labeled_ids = [p['id'] for p in labeled]

    print('[2/5] Generating concern-free catalog embeddings...', flush=True)
    ordered = list(products.values())
    model = SentenceTransformer('all-mpnet-base-v2')
    clean_vectors = model.encode(
        [clean_text(p) for p in ordered], batch_size=32,
        show_progress_bar=True, normalize_embeddings=True)

    print('[3/5] Comparing every product to trusted labeled neighbors...', flush=True)
    rows = []
    for product, vector in zip(ordered, clean_vectors):
        shares, counts, neighbors = vector_votes(
            np.asarray(vector, dtype=np.float32), labeled_matrix,
            labeled_labels, labeled_ids, k=20)
        severity, flags, explicit, top, margin = classify(product, shares, counts)
        rows.append({
            'product_id': product['id'], 'title': product['title'],
            'categories': '|'.join(sorted(product['cats'])),
            'current_concerns': '|'.join(sorted(product['concerns'])),
            'explicit_supported': '|'.join(sorted(explicit)),
            'top_qdrant_concern': top[0], 'top_qdrant_share': f'{top[1]:.4f}',
            'top_margin': f'{margin:.4f}', 'severity': severity,
            'flags': '|'.join(flags),
            'top_neighbors': json.dumps(neighbors, separators=(',', ':')),
        })

    report = OUT / f'pa-concern-qdrant-catalog-audit-{stamp}.csv'
    print('[4/5] Writing audit report...', flush=True)
    with report.open('w', newline='', encoding='utf-8') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(sorted(rows, key=lambda r: (
            {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'OK': 3}[r['severity']],
            r['product_id'])))

    severity = Counter(r['severity'] for r in rows)
    flags = Counter(flag for r in rows for flag in r['flags'].split('|') if flag)
    summary = {
        'catalog_products': len(products), 'qdrant_points': len(vectors),
        'products_with_concern': sum(bool(p['concerns']) for p in products.values()),
        'products_missing_concern': sum(not p['concerns'] for p in products.values()),
        'severity': severity, 'flags': flags, 'report': str(report),
    }
    summary_path = OUT / f'pa-concern-qdrant-catalog-audit-{stamp}-summary.json'
    summary_path.write_text(json.dumps(summary, indent=2) + '\n')
    print('[5/5] Complete', flush=True)
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
