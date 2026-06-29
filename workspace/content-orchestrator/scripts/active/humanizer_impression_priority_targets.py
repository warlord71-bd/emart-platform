#!/usr/bin/env python3
"""
Build the freeze-safe humanizer target list from GSC impression priority.

This is read-only. It does not start OpenRouter, edit WooCommerce, write DB
rows, change URLs, or interrupt the active face-cleanser batch.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
from pathlib import Path
from typing import Any

import mysql.connector

PREFIX = "wp4h_"
WP_PATH = "/var/www/wordpress"
DATE = "2026-06-05"
OUT_DIR = Path("workspace/audit/active")
GSC_PATH = Path("workspace/audit/active/gsc-query-map-2026-05-31.json")

TARGET_BRANDS = ["Cerave", "Skin1004", "Medicube", "Innisfree", "CosRx"]
BRAND_PRIORITY = {
    "cerave": 1,
    "skin1004": 2,
    "medicube": 3,
    "innisfree": 4,
    "cosrx": 5,
}


def wp_config(name: str) -> str:
    result = subprocess.run(
        ["wp", f"--path={WP_PATH}", "--allow-root", "config", "list", "--format=json"],
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    for row in json.loads(result.stdout):
        if row.get("name") == name:
            return str(row.get("value", ""))
    raise KeyError(f"Missing WordPress config value: {name}")


def db_connection():
    host = wp_config("DB_HOST")
    if ":" in host:
        host = host.split(":", 1)[0]
    return mysql.connector.connect(
        host=host,
        database=wp_config("DB_NAME"),
        user=wp_config("DB_USER"),
        password=wp_config("DB_PASSWORD"),
    )


def canonical_brand(raw: str) -> str:
    value = (raw or "").strip()
    low = value.lower()
    if "cerave" in low:
        return "CeraVe"
    if "skin1004" in low:
        return "SKIN1004"
    if "medicube" in low:
        return "Medicube"
    if "innisfree" in low:
        return "Innisfree"
    if "cosrx" in low or "cosrx" in re.sub(r"[^a-z0-9]", "", low):
        return "COSRX"
    return value


def load_gsc() -> dict[str, dict[str, Any]]:
    data = json.loads(GSC_PATH.read_text())
    out: dict[str, dict[str, Any]] = {}
    for path, rows in data.items():
        impressions = sum(int(row.get("impressions") or 0) for row in rows)
        clicks = sum(int(row.get("clicks") or 0) for row in rows)
        top_query = rows[0].get("query", "") if rows else ""
        avg_position = rows[0].get("position", "") if rows else ""
        out[path] = {
            "impressions": impressions,
            "clicks": clicks,
            "top_query": top_query,
            "top_position": avg_position,
            "query_count": len(rows),
        }
    return out


def fetch_products() -> list[dict[str, Any]]:
    sql = f"""
        SELECT
          p.ID AS post_id,
          p.post_title AS title,
          p.post_name AS slug,
          p.post_status AS status,
          MAX(CASE WHEN pm.meta_key='_emart_humanized' THEN pm.meta_value END) AS humanized,
          GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR '|') AS brand_terms
        FROM {PREFIX}posts p
        JOIN {PREFIX}term_relationships tr ON tr.object_id=p.ID
        JOIN {PREFIX}term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id
        JOIN {PREFIX}terms t ON t.term_id=tt.term_id
        LEFT JOIN {PREFIX}postmeta pm ON pm.post_id=p.ID
        WHERE p.post_type='product'
          AND p.post_status='publish'
          AND tt.taxonomy='pa_brand'
          AND (
            LOWER(t.name) LIKE '%cerave%'
            OR LOWER(t.name) LIKE '%skin1004%'
            OR LOWER(t.name) LIKE '%medicube%'
            OR LOWER(t.name) LIKE '%innisfree%'
            OR LOWER(t.name) LIKE '%cosrx%'
          )
        GROUP BY p.ID
    """
    conn = db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(sql)
    rows = list(cur.fetchall())
    cur.close()
    conn.close()
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="Optional row limit for preview only")
    args = parser.parse_args()

    gsc = load_gsc()
    rows = []
    for product in fetch_products():
        brand_terms = product.get("brand_terms") or ""
        brands = [canonical_brand(x) for x in brand_terms.split("|") if x]
        brand = next((b for b in brands if b.lower() in BRAND_PRIORITY), brands[0] if brands else "")
        path = f"/shop/{product['slug']}"
        metrics = gsc.get(path, {})
        impressions = int(metrics.get("impressions") or 0)
        humanized = bool(product.get("humanized"))
        if humanized:
            next_action = "skip_already_humanized"
        elif impressions > 0:
            next_action = "dry_run_first_after_face_cleanser_batch"
        else:
            next_action = "backlog_no_gsc_impressions"
        rows.append({
            "post_id": product["post_id"],
            "title": product["title"],
            "slug": product["slug"],
            "brand": brand,
            "brand_terms": brand_terms,
            "humanized": "yes" if humanized else "no",
            "gsc_impressions": impressions,
            "gsc_clicks": int(metrics.get("clicks") or 0),
            "top_query": metrics.get("top_query", ""),
            "top_position": metrics.get("top_position", ""),
            "query_count": int(metrics.get("query_count") or 0),
            "priority_rank_key": f"{BRAND_PRIORITY.get(brand.lower(), 99):02d}",
            "next_action": next_action,
            "review_gate": "dry_run_validate_apply_only_after_owner_review",
        })

    rows.sort(
        key=lambda r: (
            r["humanized"] == "yes",
            r["gsc_impressions"] == 0,
            -int(r["gsc_impressions"]),
            r["priority_rank_key"],
            str(r["title"]).lower(),
        )
    )
    if args.limit:
        rows = rows[: args.limit]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"humanizer-impression-priority-targets-{DATE}.csv"
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=[
                "post_id",
                "title",
                "slug",
                "brand",
                "brand_terms",
                "humanized",
                "gsc_impressions",
                "gsc_clicks",
                "top_query",
                "top_position",
                "query_count",
                "priority_rank_key",
                "next_action",
                "review_gate",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {path}")
    print(f"Rows: {len(rows)}")
    print(f"Ready after cleanser batch: {sum(1 for r in rows if r['next_action'] == 'dry_run_first_after_face_cleanser_batch')}")
    print(f"Already humanized: {sum(1 for r in rows if r['humanized'] == 'yes')}")
    print(f"Backlog/no GSC impressions: {sum(1 for r in rows if r['next_action'] == 'backlog_no_gsc_impressions')}")


if __name__ == "__main__":
    main()
