"""
baseline_snapshot.py
====================
Run ONCE before any content humanization begins.

What it does:
  1. Pulls all thin/template products from the humanizer audit scores CSV
  2. Selects ~10% as a stratified holdout (by brand + product line)
  3. Saves holdout product IDs to holdout-products-YYYYMMDD.json
  4. Pulls current GSC metrics (impressions, clicks, CTR, position) for
     ALL products in scope (treated + holdout) and saves as baseline
  5. Marks holdout products with a WordPress meta so the orchestrator skips them

Run again at +4 weeks and +8 weeks to measure treatment effect:
  python baseline_snapshot.py --mode=remeasure --baseline=<path-to-original-json>

Dependencies: pip install google-auth google-api-python-client mysql-connector-python
"""

import os, sys, json, re, math, random, argparse
from datetime import datetime, timedelta
from pathlib import Path
from googleapiclient.discovery import build
from google.oauth2 import service_account
import mysql.connector

# ── Config ────────────────────────────────────────────────────────────────────

DATE_TODAY  = datetime.today().strftime("%Y-%m-%d")
DATE_90_AGO = (datetime.today() - timedelta(days=90)).strftime("%Y-%m-%d")

SITE_URL    = "https://e-mart.com.bd/"
KEY_FILE    = os.environ.get(
    "GOOGLE_SERVICE_ACCOUNT_KEY",
    "/var/www/emart-platform/apps/web/google-service-account.json"
)
DB_CONFIG   = {
    "host":     "localhost",
    "database": "emart_live",
    "user":     "emart_user",
    "password": os.environ["EMART_DB_PASSWORD"],
}
TABLE_PREFIX   = "wp4h_"
HOLDOUT_RATIO  = 0.10   # 10% holdout
AUDIT_DIR      = Path("workspace/audit/active")
SCRIPTS_DIR    = Path("workspace/scripts/active")

LINE_KEYWORDS = [
    'shampoo', 'conditioner', 'serum', 'toner', 'essence', 'moisturiser',
    'moisturizer', 'cleanser', 'sunscreen', 'eye cream', 'mask',
    'sheet mask', 'ampoule', 'lotion', 'cream', 'gel', 'mist', 'oil',
    'lip balm', 'scrub', 'exfoliant', 'treatment', 'booster',
]


# ── DB helpers ────────────────────────────────────────────────────────────────

def get_db():
    return mysql.connector.connect(**DB_CONFIG)


def load_products_for_scope(cursor) -> list[dict]:
    """
    Pull all published products that need enrichment (content_score >= 2,
    total_sales <= 20). These are the full population for treated + holdout.
    """
    cursor.execute(f"""
        SELECT
            p.ID        AS post_id,
            p.post_name AS slug,
            p.post_title AS title,
            MAX(CASE WHEN pm.meta_key='total_sales'    THEN pm.meta_value END) AS total_sales,
            MAX(CASE WHEN pm.meta_key='_sku'           THEN pm.meta_value END) AS sku
        FROM {TABLE_PREFIX}posts p
        JOIN {TABLE_PREFIX}postmeta pm ON pm.post_id = p.ID
        WHERE p.post_type='product' AND p.post_status='publish'
        GROUP BY p.ID, p.post_name, p.post_title
        HAVING CAST(IFNULL(total_sales, 0) AS UNSIGNED) <= 20
    """)
    rows = cursor.fetchall()
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in rows]


def get_product_brand_line(product: dict) -> str:
    title = (product.get('title') or '').lower()
    line  = next((kw for kw in LINE_KEYWORDS if kw in title), 'other')
    return line


def get_brand(cursor, post_id: int) -> str:
    cursor.execute(f"""
        SELECT t.name FROM {TABLE_PREFIX}terms t
        JOIN {TABLE_PREFIX}term_taxonomy tt ON tt.term_id = t.term_id
        JOIN {TABLE_PREFIX}term_relationships tr ON tr.term_taxonomy_id = tt.term_taxonomy_id
        WHERE tr.object_id = %s AND tt.taxonomy = 'pa_brand'
        LIMIT 1
    """, (post_id,))
    row = cursor.fetchone()
    return row[0].lower() if row else 'unknown'


# ── Holdout selection ─────────────────────────────────────────────────────────

def select_holdout(products: list[dict], cursor) -> tuple[list[dict], list[dict]]:
    """
    Stratified holdout: within each brand+line stratum, hold out ~10%.
    Returns (treated_products, holdout_products).
    """
    # Enrich with brand and line
    for p in products:
        p['brand'] = get_brand(cursor, p['post_id'])
        p['line']  = get_product_brand_line(p)
        p['stratum'] = f"{p['brand']}|{p['line']}"

    # Group by stratum
    strata: dict[str, list] = {}
    for p in products:
        strata.setdefault(p['stratum'], []).append(p)

    treated, holdout = [], []
    rng = random.Random(42)   # fixed seed for reproducibility

    for stratum, members in strata.items():
        rng.shuffle(members)
        n_holdout = max(1, math.ceil(len(members) * HOLDOUT_RATIO))
        # Only hold out if stratum has enough products to make comparison meaningful
        if len(members) < 5:
            treated.extend(members)   # too small — all to treated
        else:
            holdout.extend(members[:n_holdout])
            treated.extend(members[n_holdout:])

    print(f"Population: {len(products)} products")
    print(f"  Treated:  {len(treated)} ({len(treated)/len(products):.0%})")
    print(f"  Holdout:  {len(holdout)} ({len(holdout)/len(products):.0%}) — DO NOT ENRICH")
    return treated, holdout


def mark_holdout_in_db(cursor, conn, holdout: list[dict]) -> None:
    """Write _emart_holdout meta to each holdout product so orchestrator skips them."""
    for p in holdout:
        cursor.execute(
            f"INSERT INTO {TABLE_PREFIX}postmeta (post_id, meta_key, meta_value) "
            "VALUES (%s, '_emart_holdout', %s) "
            "ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)",
            (p['post_id'], DATE_TODAY)
        )
    conn.commit()
    print(f"  Holdout flag (_emart_holdout) written to DB for {len(holdout)} products.")


# ── GSC pull ──────────────────────────────────────────────────────────────────

OAUTH_TOKEN_FILE = "/var/www/emart-platform/apps/web/gsc-oauth-token.json"

def build_gsc_service():
    import json as _json
    from google.oauth2.credentials import Credentials
    # Prefer OAuth user token (works without service account GSC property grant)
    if Path(OAUTH_TOKEN_FILE).exists():
        d = _json.loads(Path(OAUTH_TOKEN_FILE).read_text())
        creds = Credentials(
            token         = d["token"],
            refresh_token = d["refresh_token"],
            token_uri     = "https://oauth2.googleapis.com/token",
            client_id     = d["client_id"],
            client_secret = d["client_secret"],
        )
        return build("searchconsole", "v1", credentials=creds)
    # Fallback to service account
    from google.oauth2 import service_account as _sa
    creds = _sa.Credentials.from_service_account_file(
        KEY_FILE, scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
    )
    return build("searchconsole", "v1", credentials=creds)


def pull_gsc_metrics(service, product_slugs: list[str]) -> dict:
    """
    Batch pull with dimensions=["page","query"] filtered to /shop/ + Bangladesh.
    Returns {"/shop/slug": {"impressions", "clicks", "ctr", "position", "top_queries"}}
    """
    slug_set = {f"/shop/{s}" for s in product_slugs if s}
    raw_map: dict[str, list] = {}
    start_row = 0
    PAGE_SIZE = 25_000

    while True:
        body = {
            "startDate":  DATE_90_AGO,
            "endDate":    DATE_TODAY,
            "dimensions": ["page", "query"],
            "dimensionFilterGroups": [{
                "filters": [
                    {"dimension": "page", "operator": "contains", "expression": "/shop/"},
                    {"dimension": "country", "operator": "equals", "expression": "bgd"},
                ]
            }],
            "rowLimit":  PAGE_SIZE,
            "startRow":  start_row,
        }
        resp = service.searchanalytics().query(siteUrl=SITE_URL, body=body).execute()
        rows = resp.get("rows", [])
        if not rows:
            break

        for row in rows:
            page_url, query = row["keys"]
            path = page_url.replace(SITE_URL.rstrip("/"), "")
            if path not in slug_set:
                continue
            raw_map.setdefault(path, []).append({
                "query":       query,
                "clicks":      row["clicks"],
                "impressions": row["impressions"],
                "ctr":         round(row["ctr"] * 100, 2),
                "position":    round(row["position"], 1),
            })

        if len(rows) < PAGE_SIZE:
            break
        start_row += PAGE_SIZE

    # Aggregate to page level + keep top queries
    metrics: dict[str, dict] = {}
    for path, query_rows in raw_map.items():
        metrics[path] = {
            "impressions":  sum(r["impressions"] for r in query_rows),
            "clicks":       sum(r["clicks"]      for r in query_rows),
            "ctr":          round(
                sum(r["clicks"] for r in query_rows)
                / max(sum(r["impressions"] for r in query_rows), 1) * 100, 2
            ),
            "avg_position": round(
                sum(r["position"] * r["impressions"] for r in query_rows)
                / max(sum(r["impressions"] for r in query_rows), 1), 1
            ),
            "top_queries": sorted(query_rows, key=lambda x: x["impressions"], reverse=True)[:10],
        }

    # Products with no GSC data at all
    for path in slug_set:
        if path not in metrics:
            metrics[path] = {
                "impressions": 0, "clicks": 0, "ctr": 0.0,
                "avg_position": None, "top_queries": []
            }

    return metrics


# ── Remeasure / compare ───────────────────────────────────────────────────────

def compare_snapshots(baseline_path: str, current_metrics: dict) -> dict:
    """
    Compare current GSC metrics against the baseline snapshot.
    Returns a summary of treated vs holdout movement.
    """
    with open(baseline_path) as f:
        baseline = json.load(f)

    b_metrics = baseline.get("gsc_metrics", {})
    holdout_slugs = set(baseline.get("holdout_slugs", []))

    treated_delta, holdout_delta = [], []

    for path, curr in current_metrics.items():
        base = b_metrics.get(path)
        if not base:
            continue
        delta = {
            "path":          path,
            "imp_delta":     curr["impressions"] - base["impressions"],
            "click_delta":   curr["clicks"]      - base["clicks"],
            "pos_delta":     (
                (curr["avg_position"] or 0) - (base["avg_position"] or 0)
                if curr["avg_position"] and base["avg_position"] else None
            ),
        }
        if path in holdout_slugs:
            holdout_delta.append(delta)
        else:
            treated_delta.append(delta)

    def avg(lst, key):
        vals = [x[key] for x in lst if x[key] is not None]
        return round(sum(vals) / len(vals), 2) if vals else None

    return {
        "snapshot_date":  DATE_TODAY,
        "baseline_date":  baseline.get("snapshot_date"),
        "treated": {
            "count":           len(treated_delta),
            "avg_imp_delta":   avg(treated_delta, "imp_delta"),
            "avg_click_delta": avg(treated_delta, "click_delta"),
            "avg_pos_delta":   avg(treated_delta, "pos_delta"),
        },
        "holdout": {
            "count":           len(holdout_delta),
            "avg_imp_delta":   avg(holdout_delta, "imp_delta"),
            "avg_click_delta": avg(holdout_delta, "click_delta"),
            "avg_pos_delta":   avg(holdout_delta, "pos_delta"),
        },
        "interpretation": (
            "Content drove the movement" if (
                avg(treated_delta, "imp_delta") and
                avg(holdout_delta, "imp_delta") and
                avg(treated_delta, "imp_delta") > avg(holdout_delta, "imp_delta") * 1.5
            ) else "Inconclusive — check for algo updates or routing changes"
        ),
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["baseline", "remeasure"], default="baseline")
    parser.add_argument("--baseline", help="Path to baseline JSON (for remeasure mode)")
    args = parser.parse_args()

    AUDIT_DIR.mkdir(parents=True, exist_ok=True)

    conn   = get_db()
    cursor = conn.cursor()

    print(f"\n=== Baseline Snapshot — {DATE_TODAY} ===\n")

    # Load all in-scope products
    products = load_products_for_scope(cursor)
    print(f"Total in-scope products: {len(products)}")

    if args.mode == "baseline":
        # Select holdout
        treated, holdout = select_holdout(products, cursor)
        mark_holdout_in_db(cursor, conn, holdout)

        # Pull GSC metrics for ALL products (treated + holdout)
        all_slugs = [p['slug'] for p in products if p.get('slug')]
        print(f"\nPulling GSC metrics for {len(all_slugs)} product pages...")
        gsc_service = build_gsc_service()
        metrics     = pull_gsc_metrics(gsc_service, all_slugs)
        print(f"  GSC data: {len(metrics)} pages with data")

        # Save baseline snapshot
        snapshot = {
            "snapshot_date":   DATE_TODAY,
            "gsc_date_range":  f"{DATE_90_AGO} to {DATE_TODAY}",
            "total_products":  len(products),
            "treated_count":   len(treated),
            "holdout_count":   len(holdout),
            "holdout_slugs":   [f"/shop/{p['slug']}" for p in holdout if p.get('slug')],
            "treated_slugs":   [f"/shop/{p['slug']}" for p in treated if p.get('slug')],
            "gsc_metrics":     metrics,
        }
        out_path = AUDIT_DIR / f"baseline-snapshot-{DATE_TODAY}.json"
        with open(out_path, "w") as f:
            json.dump(snapshot, f, ensure_ascii=False, indent=2)
        print(f"\nBaseline saved → {out_path}")
        print("\nNext steps:")
        print("  1. Complete L1 routing fix — wait 7 days for GSC to settle")
        print("  2. Run content humanizer (see CODEX-TASK-product-content-humanizer.md)")
        print(f"  3. Re-measure at +4 weeks: python baseline_snapshot.py --mode=remeasure --baseline={out_path}")
        print(f"  4. Re-measure at +8 weeks: same command")

    elif args.mode == "remeasure":
        if not args.baseline:
            print("ERROR: --baseline path required for remeasure mode")
            sys.exit(1)

        all_slugs = [p['slug'] for p in products if p.get('slug')]
        print(f"\nRe-pulling GSC metrics for {len(all_slugs)} pages...")
        gsc_service  = build_gsc_service()
        curr_metrics = pull_gsc_metrics(gsc_service, all_slugs)

        comparison = compare_snapshots(args.baseline, curr_metrics)

        out_path = AUDIT_DIR / f"measurement-{DATE_TODAY}.json"
        with open(out_path, "w") as f:
            json.dump(comparison, f, ensure_ascii=False, indent=2)

        print(f"\n=== Results vs baseline ({comparison['baseline_date']}) ===")
        print(f"Treated ({comparison['treated']['count']} products):")
        print(f"  Avg impression delta:  {comparison['treated']['avg_imp_delta']:+}")
        print(f"  Avg click delta:       {comparison['treated']['avg_click_delta']:+}")
        print(f"  Avg position delta:    {comparison['treated']['avg_pos_delta']} (negative = improved)")
        print(f"Holdout ({comparison['holdout']['count']} products):")
        print(f"  Avg impression delta:  {comparison['holdout']['avg_imp_delta']:+}")
        print(f"  Avg click delta:       {comparison['holdout']['avg_click_delta']:+}")
        print(f"  Avg position delta:    {comparison['holdout']['avg_pos_delta']}")
        print(f"\nInterpretation: {comparison['interpretation']}")
        print(f"Full results → {out_path}")

    cursor.close()
    conn.close()


if __name__ == "__main__":
    main()
