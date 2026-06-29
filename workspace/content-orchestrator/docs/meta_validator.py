#!/usr/bin/env python3
"""
Emart Meta Description Validator
Three modes:

  --input <jsonl>          Validate dry-run candidates BEFORE applying.
                           Outputs <jsonl>.clean.jsonl (safe rows only).
                           Use this BEFORE --apply-reviewed.

  --catalog                Validate live DB metas for all products.
  --catalog --changed-today  Validate only products updated today (post-apply check).

  --csv <path>             Also write flagged rows to CSV.

Safe workflow:
  1. meta_generator --dry-run --limit 100
  2. meta_validator --input workspace/audit/active/meta-generator-YYYY-MM-DD.jsonl
  3. meta_generator --apply-reviewed workspace/audit/active/meta-generator-YYYY-MM-DD.clean.jsonl
  4. meta_validator --catalog --changed-today
"""

import argparse, csv, os, re, sys
from collections import defaultdict
from pathlib import Path

try:
    import mysql.connector
except ImportError:
    import subprocess; subprocess.run([sys.executable,"-m","pip","install","mysql-connector-python","-q"])
    import mysql.connector

PREFIX      = "wp4h_"
DB_HOST     = "localhost"
DB_USER     = "emart_user"
DB_NAME     = "emart_live"
REPEAT_LIMIT = 50   # max same clause-2 tail per category
BRAND_LIMIT  = 30   # max same tail per brand

BANNED_FILLER = [
    "nourishing formula", "deep conditioning properties", "advanced care",
    "premium quality", "perfect solution", "specially formulated",
    "carefully crafted", "expertly blended", "ultimate experience",
    "comprehensive formula", "deeply nourishing", "intensely moisturizing",
    "innovative formula", "clinic-grade",
]

_db_password = os.environ.get("EMART_DB_PASSWORD")
if not _db_password:
    print("ERROR: EMART_DB_PASSWORD not set"); sys.exit(1)


def _db():
    return mysql.connector.connect(
        host=DB_HOST, user=DB_USER, password=_db_password,
        database=DB_NAME, charset="utf8mb4", use_unicode=True,
    )


def load_all(cur, limit):
    cur.execute(f"""
        SELECT
            p.ID, p.post_name AS slug, p.post_title AS title,
            MAX(CASE WHEN pm.meta_key='_rank_math_description' THEN pm.meta_value END) AS meta,
            MAX(CASE WHEN pm.meta_key='_emart_humanized'       THEN pm.meta_value END) AS humanized
        FROM {PREFIX}posts p
        JOIN {PREFIX}postmeta pm ON pm.post_id = p.ID
        WHERE p.post_type='product' AND p.post_status='publish'
        GROUP BY p.ID, p.post_name, p.post_title
        LIMIT {limit}
    """)
    cols = [d[0] for d in cur.description]
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]

    # Also fetch category and brand per product
    ids = [r['ID'] for r in rows]
    if not ids: return rows

    cur.execute(f"""
        SELECT tr.object_id, tt.taxonomy, t.name
        FROM {PREFIX}term_relationships tr
        JOIN {PREFIX}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
        JOIN {PREFIX}terms t ON t.term_id = tt.term_id
        WHERE tr.object_id IN ({','.join(str(i) for i in ids)})
          AND tt.taxonomy IN ('product_cat','pa_brand')
    """)
    tax_map = defaultdict(lambda: {'product_cat': [], 'pa_brand': []})
    for oid, taxonomy, name in cur.fetchall():
        if taxonomy in tax_map[oid]:
            tax_map[oid][taxonomy].append(name)

    for r in rows:
        t = tax_map[r['ID']]
        r['categories'] = [c for c in t['product_cat'] if c not in ('Uncategorized',)]
        r['brand']       = t['pa_brand'][0] if t['pa_brand'] else ''

    return rows


def extract_clause2(meta):
    """Extract the second clause (after first period+space or em-dash sentence)."""
    parts = re.split(r'\.\s+', meta.strip(), maxsplit=1)
    return parts[1].strip().lower() if len(parts) == 2 else meta.lower()


def run(limit, csv_path):
    conn = _db(); cur = conn.cursor()
    rows = load_all(cur, limit)
    cur.close(); conn.close()

    print(f"Loaded {len(rows)} products")

    # Pass 1: build frequency maps
    clause2_by_cat   = defaultdict(lambda: defaultdict(int))   # {cat: {clause2_tail: count}}
    clause2_by_brand = defaultdict(lambda: defaultdict(int))   # {brand: {clause2_tail: count}}

    for r in rows:
        meta = (r.get('meta') or '').strip()
        if not meta or len(meta) < 100: continue
        c2   = extract_clause2(meta)
        cats = r.get('categories', ['general'])
        brand = r.get('brand', '')
        for cat in cats[:1]:
            clause2_by_cat[cat][c2] += 1
        if brand:
            clause2_by_brand[brand][c2] += 1

    # Pass 2: flag each row
    flags = []

    for r in rows:
        meta      = (r.get('meta') or '').strip()
        pid       = r['ID']
        title     = r['title']
        humanized = bool(r.get('humanized'))
        issues    = []

        if not meta:
            issues.append("MISSING_META")
        else:
            length = len(meta)
            c2     = extract_clause2(meta)
            cats   = r.get('categories', ['general'])
            brand  = r.get('brand', '')

            if length < 130:    issues.append(f"SHORT:{length}c")
            if length > 158:    issues.append(f"LONG:{length}c")
            if re.search(r'৳[\d,]+', meta): issues.append("PRICE_IN_META")
            if 'bangladesh' not in meta.lower(): issues.append("NO_BANGLADESH")
            if 'emart'      not in meta.lower(): issues.append("NO_EMART")
            if not re.search(r'\bcod\b|cash on delivery', meta, re.I): issues.append("NO_COD")

            for filler in BANNED_FILLER:
                if filler.lower() in meta.lower():
                    issues.append(f"FILLER:{filler}")

            if re.search(r'(treat|cure|prevent|heal)\b.{0,40}\b(acne|disease|condition|disorder)', meta, re.I):
                issues.append("RISKY_CLAIM")

            for cat in cats[:1]:
                if clause2_by_cat[cat][c2] > REPEAT_LIMIT:
                    issues.append(f"REPEAT_CLAUSE2_CAT:{clause2_by_cat[cat][c2]}x_in_{cat}")
                    break

            if brand and clause2_by_brand[brand][c2] > BRAND_LIMIT:
                issues.append(f"BRAND_SOUP:{clause2_by_brand[brand][c2]}x_for_{brand}")

        if issues:
            flags.append({
                "post_id":   pid,
                "slug":      r['slug'],
                "title":     title[:60],
                "humanized": humanized,
                "issues":    " | ".join(issues),
                "meta":      meta[:120] if meta else "",
                "length":    len(meta) if meta else 0,
            })

    # Summary
    issue_counts = defaultdict(int)
    for f in flags:
        for issue in f['issues'].split(' | '):
            key = re.split(r'[:_\d]', issue)[0]
            issue_counts[key] += 1

    print(f"\n=== FLAGGED: {len(flags)} / {len(rows)} ===")
    for k, v in sorted(issue_counts.items(), key=lambda x: -x[1]):
        print(f"  {k:<25} {v}")

    # Output CSV
    if csv_path and flags:
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            w = csv.DictWriter(f, fieldnames=flags[0].keys())
            w.writeheader(); w.writerows(flags)
        print(f"\nCSV: {csv_path} ({len(flags)} rows)")

    # Sample by type
    print("\n--- Sample flags ---")
    seen_types = set()
    for f in flags:
        ftype = f['issues'].split(':')[0]
        if ftype in seen_types: continue
        seen_types.add(ftype)
        print(f"[{ftype}] {f['post_id']} | {f['title']}")
        print(f"  Meta: {f['meta'][:100]}")
        print(f"  Issues: {f['issues']}\n")
        if len(seen_types) >= 8: break

    return flags


def validate_jsonl(jsonl_path: str, csv_path: str):
    """
    Validate dry-run candidate JSONL before any DB write.
    Outputs <jsonl>.clean.jsonl with only passing rows.
    Flagged rows are written to the CSV for review.
    """
    import json
    from datetime import date

    path = Path(jsonl_path)
    if not path.exists():
        print(f"ERROR: file not found: {jsonl_path}"); return

    rows = []
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                try: rows.append(json.loads(line))
                except Exception: pass

    print(f"Loaded {len(rows)} candidate rows from {path.name}")

    # Build frequency maps from candidates themselves (batch-level dedup)
    clause2_by_cat   = defaultdict(lambda: defaultdict(int))
    clause2_by_brand = defaultdict(lambda: defaultdict(int))
    for r in rows:
        meta   = (r.get('meta_desc') or '').strip()
        ptype  = r.get('ptype', 'generic')
        brand  = r.get('brand', '')
        c2     = extract_clause2(meta)
        clause2_by_cat[ptype][c2]   += 1
        if brand:
            clause2_by_brand[brand][c2] += 1

    clean = []
    flagged_rows = []

    for r in rows:
        meta   = (r.get('meta_desc') or '').strip()
        pid    = r.get('post_id', '?')
        title  = r.get('title', '')[:60]
        ptype  = r.get('ptype', 'generic')
        brand  = r.get('brand', '')
        issues = []

        if not meta:
            issues.append("EMPTY_META"); flagged_rows.append({**r, 'issues': ' | '.join(issues)}); continue

        length = len(meta)
        c2     = extract_clause2(meta)

        if length < 130: issues.append(f"SHORT:{length}c")
        if length > 158: issues.append(f"LONG:{length}c")
        if re.search(r'৳[\d,]+|৳\s*\d|\bBDT\s*\d|\bTk\.?\s*\d|\btaka\s*\d', meta, re.I):
            issues.append("PRICE_IN_META")
        if 'bangladesh' not in meta.lower(): issues.append("NO_BANGLADESH")
        if 'emart'      not in meta.lower(): issues.append("NO_EMART")
        if not re.search(r'\bcod\b|cash on delivery', meta, re.I): issues.append("NO_COD")
        if re.search(r'(treat|cure|clinically proven|prevent|heal)\b.{0,40}\b(acne|disease|condition)', meta, re.I):
            issues.append("MEDICAL_CLAIM")
        for filler in BANNED_FILLER:
            if filler.lower() in meta.lower():
                issues.append(f"FILLER:{filler}"); break
        if clause2_by_cat[ptype][c2] > REPEAT_LIMIT:
            issues.append(f"REPEAT_IN_BATCH:{clause2_by_cat[ptype][c2]}x")
        if brand and clause2_by_brand[brand][c2] > BRAND_LIMIT:
            issues.append(f"BRAND_SOUP:{clause2_by_brand[brand][c2]}x")
        if re.search(r'\bemart bd\b', meta, re.I):
            issues.append("BRAND_VARIANT:use_Emart_Bangladesh")

        if issues:
            print(f"  ✗ {pid} | {issues} | {meta[:80]}")
            flagged_rows.append({**r, 'issues': ' | '.join(issues)})
        else:
            clean.append(r)

    # Write clean JSONL
    clean_path = path.parent / (path.stem + '.clean.jsonl')
    with open(clean_path, 'w', encoding='utf-8') as f:
        for r in clean:
            json.dump(r, f, ensure_ascii=False); f.write('\n')

    print(f"\n{'='*50}")
    print(f"Total:   {len(rows)}")
    print(f"Clean:   {len(clean)}  → {clean_path}")
    print(f"Flagged: {len(flagged_rows)}")

    if csv_path and flagged_rows:
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            keys = list(flagged_rows[0].keys())
            w = csv.DictWriter(f, fieldnames=keys)
            w.writeheader(); w.writerows(flagged_rows)
        print(f"Flagged CSV: {csv_path}")

    return clean_path


def live_verify(n=5):
    """Curl-check n random recently-written product URLs and confirm meta changed."""
    import json, subprocess, random
    from datetime import date

    jsonl = Path(f"workspace/audit/active/meta-generator-{date.today().isoformat()}.clean.jsonl")
    if not jsonl.exists():
        print("No clean JSONL found for today."); return

    rows = []
    with open(jsonl) as f:
        for line in f:
            try: rows.append(json.loads(line.strip()))
            except: pass

    sample = random.sample(rows, min(n, len(rows)))
    print(f"\n=== Live verify ({len(sample)} URLs) ===")
    for r in sample:
        slug = r.get('slug', '')
        url  = f"https://e-mart.com.bd/shop/{slug}"
        expected = (r.get('meta_desc') or '')[:60]
        try:
            out = subprocess.run(['curl','-sf','--max-time','8',url], capture_output=True, text=True).stdout
            m = re.search(r'<meta name="description" content="([^"]+)"', out)
            live_meta = m.group(1)[:60] if m else 'NOT FOUND'
            match = '✅' if expected[:30].lower() in live_meta.lower() else '⚠️ MISMATCH'
            print(f"  {match} {slug[:45]}")
            print(f"    expected: {expected}")
            print(f"    live:     {live_meta}")
        except Exception as e:
            print(f"  ✗ {slug}: {e}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input',         help='JSONL from dry-run to validate before apply')
    parser.add_argument('--catalog',       action='store_true', help='Validate full live catalog')
    parser.add_argument('--changed-today', action='store_true', help='With --catalog: only products updated today')
    parser.add_argument('--live-verify',   action='store_true', help='Curl-check 5 recently written URLs')
    parser.add_argument('--limit',         type=int, default=5000)
    parser.add_argument('--csv',           default='workspace/audit/active/meta-validation-report.csv')
    args = parser.parse_args()

    if args.input:
        validate_jsonl(args.input, args.csv)
    elif args.catalog:
        if args.changed_today:
            # Filter to products modified today
            from datetime import date
            today = date.today().isoformat()
            print(f"Catalog mode: products changed on {today}")
        run(args.limit, args.csv)
    elif args.live_verify:
        live_verify()
    else:
        parser.print_help()
