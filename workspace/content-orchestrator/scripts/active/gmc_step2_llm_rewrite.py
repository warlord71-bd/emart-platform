#!/usr/bin/env python3
"""
GMC Step 2 LLM rewrite dry-run.

Humanizer-style workflow:
  1. DRY-RUN  - generate rewritten descriptions, JSONL + CSV, no DB writes
  2. REVIEW   - owner samples/edits output
  3. APPLY    - intentionally not implemented here; use a separate reviewed apply script

Scope:
  - 44 products from CODEX-GMC-FIX-20260605 Step 2
  - Rewrite Woo post_content only in proposal output
  - No Woo writes, no title/price/URL/image/meta changes, no GMC sync
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import mysql.connector
from bs4 import BeautifulSoup
from openai import OpenAI

PREFIX = "wp4h_"
WP_PATH = "/var/www/wordpress"
DATE = "2026-06-05"
OUT_DIR = Path("workspace/audit/active")
CONTROL_CSV = OUT_DIR / "gmc-policy-control-dryrun-2026-06-05.csv"
CREDENTIALS = Path("/root/.openclaw/credentials/openrouter_default.json")

GROUP_A_IDS = [
    34069, 58018, 62592, 3822, 59015, 61765, 74088, 63377, 60156, 74879, 62899,
]

MODEL = os.environ.get("OPENROUTER_MODEL", "deepseek/deepseek-chat-v3.1")
BATCH_SIZE = 5
BATCH_DELAY_SECONDS = 10

RISK_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("prescription", re.compile(r"\bprescription(?:[- ]strength)?\b", re.I)),
    ("medical_treat", re.compile(r"\b(treats?|cures?|heals?|medicinal|therapeutic)\b", re.I)),
    ("unsupported_clinical", re.compile(r"\b(clinically proven|dermatologist-tested|doctor recommended)\b", re.I)),
    ("personal_hardship", re.compile(r"\b(problem[- ]prone|skin problems?|skin issues?|suffering from|struggling with|acne[- ]prone|blemish[- ]prone|irritated skin|sensitive,?\s+problem[- ]prone)\b", re.I)),
    ("strong_outcome", re.compile(r"\b(miracle|repairs? damaged|restores? youth|anti[- ]aging miracle|flawless|perfect skin)\b", re.I)),
    ("identity_tone", re.compile(r"\b(fairness|whiten(?:ing|s)?|skin tone matching|medium skin tones?|light skin tones?|dark skin tones?)\b", re.I)),
]


def load_api_key() -> str:
    if os.environ.get("OPENROUTER_API_KEY"):
        return os.environ["OPENROUTER_API_KEY"]
    data = json.loads(CREDENTIALS.read_text())
    key = data.get("apiKey") or data.get("OPENROUTER_API_KEY")
    if not key:
        raise RuntimeError(f"No OpenRouter key found in {CREDENTIALS}")
    return key


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


def short_hash(value: str) -> str:
    return hashlib.sha256((value or "").encode("utf-8")).hexdigest()[:16]


def strip_html(value: str) -> str:
    text = BeautifulSoup(value or "", "html.parser").get_text(" ")
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def excerpt(value: str, limit: int = 300) -> str:
    text = strip_html(value)
    return text[:limit].replace("\n", " ")


def risk_terms(value: str) -> list[str]:
    text = strip_html(value)
    found: list[str] = []
    for label, pattern in RISK_PATTERNS:
        matches = sorted(set(m.group(0).lower() for m in pattern.finditer(text)))
        for match in matches:
            found.append(f"{label}:{match}")
    return found


def html_shape(value: str) -> dict[str, int]:
    return {
        "p": len(re.findall(r"<p\b", value or "", re.I)),
        "h3": len(re.findall(r"<h3\b", value or "", re.I)),
        "li": len(re.findall(r"<li\b", value or "", re.I)),
        "chars": len(strip_html(value)),
    }


def load_target_ids() -> list[int]:
    rows = list(csv.DictReader(CONTROL_CSV.open(encoding="utf-8")))
    group_b = [int(r["wc_id"]) for r in rows if r["action"] == "copy_review_no_rule_change_found" and r["wc_id"].isdigit()]
    ids = GROUP_A_IDS + group_b
    if len(ids) != 44:
        raise RuntimeError(f"Expected 44 Step 2 IDs, got {len(ids)}")
    if len(set(ids)) != len(ids):
        raise RuntimeError("Duplicate IDs in Step 2 target list")
    return ids


def load_control_map() -> dict[int, dict[str, str]]:
    out: dict[int, dict[str, str]] = {}
    for row in csv.DictReader(CONTROL_CSV.open(encoding="utf-8")):
        if row.get("wc_id", "").isdigit():
            out[int(row["wc_id"])] = row
    return out


def fetch_products(ids: list[int]) -> dict[int, dict[str, Any]]:
    placeholders = ",".join(["%s"] * len(ids))
    sql = f"""
        SELECT
          p.ID AS post_id,
          p.post_title AS title,
          p.post_name AS slug,
          p.post_status AS status,
          p.post_content AS content,
          GROUP_CONCAT(DISTINCT CASE WHEN tt.taxonomy='pa_brand' THEN t.name END SEPARATOR '|') AS brands
        FROM {PREFIX}posts p
        LEFT JOIN {PREFIX}term_relationships tr ON tr.object_id=p.ID
        LEFT JOIN {PREFIX}term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id
        LEFT JOIN {PREFIX}terms t ON t.term_id=tt.term_id
        WHERE p.ID IN ({placeholders})
        GROUP BY p.ID
    """
    conn = db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(sql, ids)
    rows = {int(row["post_id"]): row for row in cur.fetchall()}
    cur.close()
    conn.close()
    missing = [i for i in ids if i not in rows]
    if missing:
        raise RuntimeError(f"Missing products in DB: {missing}")
    return rows


def system_prompt() -> str:
    return """You rewrite ecommerce product HTML to comply with Google Merchant Center policy.

Return ONLY valid JSON with:
{
  "content_html": "<rewritten HTML>",
  "change_summary": ["short change", "..."]
}

Strict rules:
- Preserve the existing HTML structure as much as possible.
- Keep product name, brand, size, origin, shipping/COD/authenticity statements if present.
- Do not invent ingredients, studies, certifications, testing, medical benefits, or brand facts.
- Do not add new sections.
- Same length as original within roughly +/-20%.
- Neutral ingredient/function language only.
- Remove personal hardship targeting, prescription/medical treatment claims, unsupported clinical claims, and miracle/outcome claims.
- Avoid title/URL/price/image/meta changes; this output is description HTML only."""


def user_prompt(product: dict[str, Any], control: dict[str, str], before_terms: list[str]) -> str:
    shape = html_shape(product["content"])
    min_chars = int(shape["chars"] * 0.8)
    max_chars = int(shape["chars"] * 1.2)
    return f"""Product ID: {product['post_id']}
Title: {product['title']}
Slug: {product['slug']}
Brand terms: {product.get('brands') or ''}
GMC issue codes: {control.get('gmc_codes', '')}
Detected risky wording: {', '.join(before_terms) or 'none'}
Original plain-text length: {shape['chars']} characters
Target plain-text length: {min_chars}-{max_chars} characters
Original HTML shape: {shape['p']} <p>, {shape['h3']} <h3>, {shape['li']} <li>

Rewrite the current WooCommerce product description HTML below.

Remove examples:
- "for sensitive, problem-prone skin" -> "formulated for simple, barrier-supportive routines"
- "treats acne" -> "contains clarifying cosmetic ingredients"
- "prescription-strength" -> "concentrated formula"
- "repairs damaged skin barrier" -> "supports the skin barrier"
- "clinically proven" -> "formulated" unless the description already cites a specific study

Do not summarize. Keep the rewritten description close to the original length and section density.

Current HTML:
{product['content']}
"""


def parse_response(text: str) -> dict[str, Any]:
    raw = text.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    data = json.loads(raw)
    if not isinstance(data, dict) or not data.get("content_html"):
        raise ValueError("Response JSON missing content_html")
    if not isinstance(data.get("change_summary", []), list):
        data["change_summary"] = [str(data.get("change_summary"))]
    return data


def generate(client: OpenAI, product: dict[str, Any], control: dict[str, str]) -> dict[str, Any]:
    before_terms = risk_terms(product["content"])
    resp = client.chat.completions.create(
        model=MODEL,
        temperature=0.3,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt()},
            {"role": "user", "content": user_prompt(product, control, before_terms)},
        ],
    )
    content = resp.choices[0].message.content or ""
    return parse_response(content)


def validate(original: str, proposed: str) -> tuple[str, list[str], list[str]]:
    before = risk_terms(original)
    after = risk_terms(proposed)
    warnings: list[str] = []
    status = "ready_for_owner_sample"
    orig_shape = html_shape(original)
    prop_shape = html_shape(proposed)
    if not proposed.strip():
        return "failed_empty", before, ["empty proposed content"]
    if after:
        status = "manual_review_risk_terms_remaining"
    if orig_shape["chars"]:
        ratio = prop_shape["chars"] / max(1, orig_shape["chars"])
        if ratio < 0.75 or ratio > 1.25:
            warnings.append(f"length_ratio_{ratio:.2f}")
            if status == "ready_for_owner_sample":
                status = "manual_review_length_shift"
    for tag in ["p", "h3", "li"]:
        if orig_shape[tag] and abs(prop_shape[tag] - orig_shape[tag]) > max(2, orig_shape[tag] // 3):
            warnings.append(f"{tag}_count_shift_{orig_shape[tag]}_to_{prop_shape[tag]}")
            if status == "ready_for_owner_sample":
                status = "manual_review_structure_shift"
    return status, after, warnings


def existing_jsonl_ids(path: Path) -> set[int]:
    if not path.exists():
        return set()
    ids: set[int] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            item = json.loads(line)
            ids.add(int(item.get("wc_id") or item.get("post_id") or 0))
        except Exception:
            continue
    return ids


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--post-id", type=int, default=0)
    parser.add_argument("--force", action="store_true", help="Regenerate even if JSONL already has the product")
    parser.add_argument("--reset", action="store_true", help="Overwrite existing Step 2 output files")
    args = parser.parse_args()
    if not args.dry_run:
        raise SystemExit("Only --dry-run is implemented for Step 2.")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    jsonl_path = OUT_DIR / f"gmc-step2-llm-rewrite-proposals-{DATE}.jsonl"
    csv_path = OUT_DIR / f"gmc-step2-llm-rewrite-dryrun-{DATE}.csv"
    if args.reset:
        jsonl_path.write_text("", encoding="utf-8")
        csv_path.write_text("", encoding="utf-8")

    target_ids = load_target_ids()
    if args.post_id:
        if args.post_id not in target_ids:
            raise SystemExit(f"Post ID {args.post_id} is not in Step 2 target list")
        target_ids = [args.post_id]
    if args.limit:
        target_ids = target_ids[: args.limit]

    done = existing_jsonl_ids(jsonl_path)
    if done and not args.force:
        target_ids = [i for i in target_ids if i not in done]

    products = fetch_products(target_ids) if target_ids else {}
    control = load_control_map()
    client = OpenAI(
        api_key=load_api_key(),
        base_url="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": "https://e-mart.com.bd",
            "X-Title": "Emart GMC policy rewrite dry-run",
        },
    )

    write_header = not csv_path.exists() or csv_path.stat().st_size == 0
    csv_fh = csv_path.open("a", newline="", encoding="utf-8")
    writer = csv.DictWriter(
        csv_fh,
        fieldnames=[
            "wc_id", "title", "slug", "gmc_codes", "original_hash", "proposed_hash",
            "original_300c", "proposed_300c", "violations_before", "violations_after",
            "status", "warnings", "change_summary", "approval_gate",
        ],
    )
    if write_header:
        writer.writeheader()

    total = ok = failed = 0
    with jsonl_path.open("a", encoding="utf-8") as jsonl:
        for index, pid in enumerate(target_ids, start=1):
            product = products[pid]
            total += 1
            print(f"[{index}/{len(target_ids)}] {pid} {product['title'][:70]}")
            try:
                generated = generate(client, product, control.get(pid, {}))
                proposed = generated["content_html"]
                before_terms = risk_terms(product["content"])
                status, after_terms, warnings = validate(product["content"], proposed)
                row = {
                    "wc_id": pid,
                    "title": product["title"],
                    "slug": product["slug"],
                    "gmc_codes": control.get(pid, {}).get("gmc_codes", ""),
                    "original_hash": short_hash(product["content"]),
                    "proposed_hash": short_hash(proposed),
                    "original_300c": excerpt(product["content"]),
                    "proposed_300c": excerpt(proposed),
                    "violations_before": "|".join(before_terms),
                    "violations_after": "|".join(after_terms),
                    "status": status,
                    "warnings": "|".join(warnings),
                    "change_summary": "; ".join(str(x) for x in generated.get("change_summary", [])),
                    "approval_gate": "owner_sample_10_before_apply_batches_of_10",
                }
                writer.writerow(row)
                csv_fh.flush()
                jsonl.write(json.dumps({
                    **row,
                    "current_content": product["content"],
                    "proposed_content": proposed,
                    "model": MODEL,
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                }, ensure_ascii=False) + "\n")
                jsonl.flush()
                print(f"  -> {status}; after_terms={len(after_terms)}; warnings={warnings}")
                ok += 1
            except Exception as exc:
                failed += 1
                err = str(exc)
                writer.writerow({
                    "wc_id": pid,
                    "title": product["title"],
                    "slug": product["slug"],
                    "gmc_codes": control.get(pid, {}).get("gmc_codes", ""),
                    "original_hash": short_hash(product["content"]),
                    "proposed_hash": "",
                    "original_300c": excerpt(product["content"]),
                    "proposed_300c": "",
                    "violations_before": "|".join(risk_terms(product["content"])),
                    "violations_after": "",
                    "status": "generation_failed",
                    "warnings": err[:300],
                    "change_summary": "",
                    "approval_gate": "regenerate_before_review",
                })
                csv_fh.flush()
                print(f"  !! failed: {err}")

            if index % BATCH_SIZE == 0 and index < len(target_ids):
                print(f"Batch pause: {BATCH_DELAY_SECONDS}s")
                time.sleep(BATCH_DELAY_SECONDS)
            else:
                time.sleep(2)

    csv_fh.close()
    print(f"\nWrote: {csv_path}")
    print(f"Wrote: {jsonl_path}")
    print(f"Generated: {ok}; Failed: {failed}; Remaining skipped existing: {len(done) if not args.force else 0}")


if __name__ == "__main__":
    main()
