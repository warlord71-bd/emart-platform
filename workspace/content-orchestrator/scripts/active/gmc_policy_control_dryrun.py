#!/usr/bin/env python3
"""
GMC policy control dry-run for Emart.

Reads live Google Merchant Center product status, maps issue rows back to
WooCommerce products, and writes review artifacts. It does not mutate Woo,
GMC, URLs, prices, titles, analytics, or frontend code.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any

import mysql.connector
from bs4 import BeautifulSoup

PREFIX = "wp4h_"
WP_PATH = "/var/www/wordpress"
MERCHANT_ID = "436245109"
KEY_FILE = "/root/.gmc/service-account.json"
SCOPES = ["https://www.googleapis.com/auth/content"]
DATE = "2026-06-05"
OUT_DIR = Path("workspace/audit/active")

COPY_FIX_CODES = {
    "personal_hardships_policy_violation",
    "healthcare_pdt_policy_violation",
    "healthcare_misleading_claims_policy_violation",
}

DOCUMENT_ONLY_CODES = {
    "identity_and_belief_policy_violation",
    "sexual_interests_policy_violation",
    "restricted_adult_policy_violation",
    "restricted_nfs_policy_violation",
    "illegal_drugs_policy_violation",
}

DATA_OR_ASSET_CODES = {
    "missing_price",
    "price_missing",
    "landing_page_error",
    "product_page_unavailable",
    "image_link_broken",
    "image_too_small",
    "low_image_quality",
    "missing_availability_date",
}

TITLE_RISK = re.compile(
    r"\b(acne|eczema|pimple|blemish|whitening|fairness|dark spot|melasma|"
    r"benzoyl peroxide|kojic acid|retinol|prescription)\b",
    re.I,
)

REPLACEMENTS: list[tuple[re.Pattern[str], str, str]] = [
    (re.compile(r"\bprescription[- ]strength\b", re.I), "concentrated", "prescription-strength -> concentrated"),
    (re.compile(r"\bprescription\b", re.I), "high-active", "prescription -> high-active"),
    (re.compile(r"\btreats?\s+(acne|pimples?|eczema|melasma|rosacea|skin problems?)\b", re.I), "contains targeted cosmetic ingredients for", "treats condition -> ingredient-focused"),
    (re.compile(r"\bcures?\s+[^<.]{0,80}", re.I), "supports the look and feel of skin", "cure claim -> support wording"),
    (re.compile(r"\bheals?\s+[^<.]{0,80}", re.I), "supports skin comfort", "heal claim -> support wording"),
    (re.compile(r"\brepairs?\s+(a\s+)?(damaged\s+)?skin barrier\b", re.I), "supports the skin barrier", "repair barrier -> support barrier"),
    (re.compile(r"\brestores?\s+(a\s+)?(damaged\s+)?skin barrier\b", re.I), "supports the skin barrier", "restore barrier -> support barrier"),
    (re.compile(r"\banti[- ]aging miracle\b", re.I), "retinol and peptide-focused", "miracle anti-aging -> ingredient-focused"),
    (re.compile(r"\bmiracle\b", re.I), "targeted", "miracle -> targeted"),
    (re.compile(r"\bclinically proven\b", re.I), "formulated", "unsupported clinically proven -> formulated"),
    (re.compile(r"\bproblem[- ]prone skin\b", re.I), "skin that prefers a simple routine", "problem-prone skin -> neutral routine wording"),
    (re.compile(r"\bacne[- ]prone skin\b", re.I), "clarifying routines", "acne-prone skin -> clarifying routines"),
    (re.compile(r"\bblemish[- ]prone skin\b", re.I), "clarifying routines", "blemish-prone skin -> clarifying routines"),
    (re.compile(r"\bsensitive,?\s+problem[- ]prone skin\b", re.I), "simple, barrier-supportive routines", "sensitive/problem-prone -> barrier routine"),
    (re.compile(r"\birritated skin\b", re.I), "skin that feels stressed", "irritated skin -> stressed-feeling skin"),
    (re.compile(r"\birritation\b", re.I), "discomfort", "irritation -> discomfort"),
    (re.compile(r"\bwhitens?\b", re.I), "brightens the look of", "whitening -> cosmetic brightening"),
    (re.compile(r"\bfairness\b", re.I), "radiance", "fairness -> radiance"),
]

RISK_TERMS = re.compile(
    r"\b(prescription|treat|cure|heal|repair|restore|miracle|clinically proven|"
    r"acne-prone|blemish-prone|problem-prone|eczema|rosacea|melasma|fairness|whiten)\b",
    re.I,
)


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


def fetch_live_gmc() -> list[dict[str, Any]]:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    import httplib2
    from google_auth_httplib2 import AuthorizedHttp

    creds = service_account.Credentials.from_service_account_file(KEY_FILE, scopes=SCOPES)
    authed_http = AuthorizedHttp(creds, httplib2.Http(timeout=120))
    svc = build("content", "v2.1", http=authed_http, cache_discovery=False)
    rows: list[dict[str, Any]] = []
    page_token = None
    while True:
        resp = svc.productstatuses().list(
            merchantId=MERCHANT_ID,
            maxResults=250,
            pageToken=page_token,
        ).execute()
        for item in resp.get("resources", []):
            statuses = [d.get("status") for d in item.get("destinationStatuses", [])]
            if "disapproved" not in statuses:
                continue
            pid = item.get("productId") or item.get("id") or ""
            wc_id = pid.rsplit(":", 1)[-1] if pid else ""
            issues = item.get("itemLevelIssues", [])
            rows.append({
                "wc_id": wc_id,
                "title": item.get("title", ""),
                "link": item.get("link", ""),
                "statuses": statuses,
                "issues": issues,
                "codes": sorted({i.get("code", "") for i in issues if i.get("code")}),
            })
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return rows


def fetch_local_gmc() -> list[dict[str, Any]]:
    data = json.loads(Path("/root/.gmc/policy_list.json").read_text())
    return [
        {
            "wc_id": str(row.get("wc_id", "")),
            "title": row.get("title", ""),
            "link": "",
            "statuses": ["local_export"],
            "issues": [],
            "codes": sorted(row.get("codes") or []),
        }
        for row in data
    ]


def fetch_products(ids: list[int]) -> dict[int, dict[str, Any]]:
    if not ids:
        return {}
    placeholders = ",".join(["%s"] * len(ids))
    sql = f"""
        SELECT
          p.ID,
          p.post_title,
          p.post_name,
          p.post_status,
          p.post_content,
          p.post_excerpt,
          MAX(CASE WHEN pm.meta_key='_price' THEN pm.meta_value END) AS price,
          MAX(CASE WHEN pm.meta_key='_emart_humanized' THEN pm.meta_value END) AS humanized,
          GROUP_CONCAT(DISTINCT CASE WHEN tt.taxonomy='pa_brand' THEN t.name END SEPARATOR '|') AS brands
        FROM {PREFIX}posts p
        LEFT JOIN {PREFIX}postmeta pm ON pm.post_id=p.ID
        LEFT JOIN {PREFIX}term_relationships tr ON tr.object_id=p.ID
        LEFT JOIN {PREFIX}term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id
        LEFT JOIN {PREFIX}terms t ON t.term_id=tt.term_id
        WHERE p.ID IN ({placeholders})
        GROUP BY p.ID
    """
    conn = db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(sql, ids)
    out = {int(row["ID"]): row for row in cur.fetchall()}
    cur.close()
    conn.close()
    return out


def strip_text(value: str) -> str:
    soup = BeautifulSoup(value or "", "html.parser")
    text = soup.get_text(" ")
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def sanitize_html(content: str) -> tuple[str, list[str]]:
    updated = content or ""
    changes: list[str] = []
    for pattern, replacement, label in REPLACEMENTS:
        updated, count = pattern.subn(replacement, updated)
        if count:
            changes.append(f"{label} ({count})")
    return updated, changes


def classify(codes: set[str], title: str, changed: bool) -> str:
    if codes & DOCUMENT_ONLY_CODES:
        return "document_owner_decision"
    if codes and codes <= DATA_OR_ASSET_CODES:
        return "data_asset_owner_fix"
    if codes & COPY_FIX_CODES:
        if TITLE_RISK.search(title):
            return "copy_dry_run_title_risk_owner_review"
        if changed:
            return "copy_dry_run_ready_for_review"
        return "copy_review_no_rule_change_found"
    return "mixed_manual_review"


def digest(value: str) -> str:
    return hashlib.sha256((value or "").encode("utf-8")).hexdigest()[:16]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", choices=["api", "local"], default="api")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    gmc_rows = fetch_live_gmc() if args.source == "api" else fetch_local_gmc()
    ids = sorted({int(r["wc_id"]) for r in gmc_rows if str(r.get("wc_id", "")).isdigit()})
    products = fetch_products(ids)

    summary_path = OUT_DIR / f"gmc-policy-control-dryrun-{DATE}.csv"
    jsonl_path = OUT_DIR / f"gmc-policy-copy-proposals-{DATE}.jsonl"

    with summary_path.open("w", newline="", encoding="utf-8") as fh, jsonl_path.open("w", encoding="utf-8") as jh:
        writer = csv.DictWriter(
            fh,
            fieldnames=[
                "wc_id",
                "status",
                "title",
                "slug",
                "brand",
                "gmc_codes",
                "action",
                "changed_phrases",
                "risk_terms_before",
                "risk_terms_after",
                "price_present",
                "humanized",
                "current_hash",
                "proposed_hash",
                "review_gate",
            ],
        )
        writer.writeheader()
        for row in sorted(gmc_rows, key=lambda r: (",".join(r["codes"]), r["title"])):
            wc_id = int(row["wc_id"]) if str(row.get("wc_id", "")).isdigit() else 0
            product = products.get(wc_id, {})
            current = product.get("post_content") or ""
            proposed, changes = sanitize_html(current)
            before_terms = sorted(set(m.group(0).lower() for m in RISK_TERMS.finditer(strip_text(current))))
            after_terms = sorted(set(m.group(0).lower() for m in RISK_TERMS.finditer(strip_text(proposed))))
            codes = set(row.get("codes") or [])
            action = classify(codes, row.get("title") or product.get("post_title") or "", bool(changes))
            writer.writerow({
                "wc_id": wc_id or "",
                "status": product.get("post_status", "missing_in_woo"),
                "title": product.get("post_title") or row.get("title", ""),
                "slug": product.get("post_name", ""),
                "brand": product.get("brands") or "",
                "gmc_codes": "|".join(row.get("codes") or []),
                "action": action,
                "changed_phrases": "; ".join(changes),
                "risk_terms_before": "|".join(before_terms),
                "risk_terms_after": "|".join(after_terms),
                "price_present": "yes" if product.get("price") not in (None, "") else "no",
                "humanized": "yes" if product.get("humanized") else "no",
                "current_hash": digest(current),
                "proposed_hash": digest(proposed),
                "review_gate": "owner_review_required_before_any_apply",
            })
            if action.startswith("copy_") or changes:
                jh.write(json.dumps({
                    "wc_id": wc_id,
                    "title": product.get("post_title") or row.get("title", ""),
                    "slug": product.get("post_name", ""),
                    "gmc_codes": row.get("codes") or [],
                    "action": action,
                    "changed_phrases": changes,
                    "risk_terms_before": before_terms,
                    "risk_terms_after": after_terms,
                    "current_content": current,
                    "proposed_content": proposed,
                }, ensure_ascii=False) + "\n")

    print(f"Wrote {summary_path}")
    print(f"Wrote {jsonl_path}")
    print(f"Rows: {len(gmc_rows)}")


if __name__ == "__main__":
    main()
