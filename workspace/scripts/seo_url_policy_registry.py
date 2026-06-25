#!/usr/bin/env python3
"""Validate the SEO URL-policy registry against saved control-loop artifacts.

Read-only by design: this script does not fetch live URLs and does not edit
middleware, metadata, robots, sitemap, WordPress, or WooCommerce state.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parents[1]
DEFAULT_REGISTRY = REPO / "seo/url-policy-registry.json"
DEFAULT_CLASSIFICATION = REPO / "audit/active/seo-technical-control-loop-20260626.json"
DEFAULT_LIVE = REPO / "audit/active/seo-technical-control-loop-live-20260626.json"
OUT_DIR = REPO / "audit/active"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate URL-policy registry against saved SEO artifacts")
    parser.add_argument("--registry", default=str(DEFAULT_REGISTRY))
    parser.add_argument("--classification-json", default=str(DEFAULT_CLASSIFICATION))
    parser.add_argument("--live-json", default=str(DEFAULT_LIVE))
    parser.add_argument("--stamp", default=dt.date.today().strftime("%Y%m%d"))
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


def csv_list(value: str) -> list[str]:
    return [item for item in (value or "").split(",") if item]


def row_live_status(row: dict[str, Any]) -> int | None:
    live = row.get("live") or {}
    status = live.get("status")
    if status in ("", None):
        status = row.get("status")
    try:
        return int(status)
    except (TypeError, ValueError):
        return None


def params_match(row_params: list[str], rule_match: dict[str, Any]) -> bool:
    wanted = set(rule_match.get("params_any") or [])
    if not wanted:
        return True
    row_set = set(row_params)
    if not (row_set & wanted):
        return False
    if rule_match.get("params_exact"):
        return row_set == wanted
    return True


def rule_matches(row: dict[str, Any], rule: dict[str, Any]) -> bool:
    match = rule.get("match") or {}
    if match.get("base_paths") and row.get("base_path") not in set(match["base_paths"]):
        return False
    if match.get("route_families") and row.get("route_family") not in set(match["route_families"]):
        return False
    if not params_match(csv_list(row.get("query_params", "")), match):
        return False
    live_statuses = match.get("live_status")
    if live_statuses is not None:
        status = row_live_status(row)
        if status not in set(int(item) for item in live_statuses):
            return False
    return True


def first_matching_rule(row: dict[str, Any], rules: list[dict[str, Any]]) -> dict[str, Any] | None:
    for rule in sorted(rules, key=lambda item: int(item.get("priority", 999))):
        if rule_matches(row, rule):
            return rule
    return None


def merge_live_rows(classification: dict[str, Any], live: dict[str, Any]) -> list[dict[str, Any]]:
    by_path = {row["url_or_path"]: row for row in classification.get("rows", [])}
    merged: list[dict[str, Any]] = []
    live_paths = set()
    for live_row in live.get("rows", []):
        path = live_row["url_or_path"]
        live_paths.add(path)
        base = by_path.get(path, {})
        merged.append({**base, **live_row})
    for path, row in by_path.items():
        if path not in live_paths:
            merged.append(row)
    return merged


def policy_state(row: dict[str, Any], rule: dict[str, Any] | None) -> str:
    if not rule:
        return "unmatched"
    if row.get("live_interpretation"):
        return "live_verified"
    evidence = rule.get("evidence") or {}
    if evidence.get("live_verified"):
        return "registry_verified_elsewhere"
    return "needs_live_verification"


def assess_row(row: dict[str, Any], rule: dict[str, Any] | None) -> str:
    if not rule:
        return "registry_missing"
    status = row_live_status(row)
    interpretation = row.get("live_interpretation", "")
    rule_id = rule["id"]
    if rule_id == "collection-valid-pagination" and status == 200:
        return "matches_target_policy"
    if rule_id == "collection-out-of-range-pagination" and status == 404:
        return "matches_target_policy"
    route_action = (rule.get("target_policy") or {}).get("route_action", "")
    if "redirect" in route_action or route_action.startswith("301_"):
        if interpretation == "query_url_redirects_to_canonical":
            return "matches_target_policy"
        if row.get("live"):
            return "live_drift_review"
        return "needs_live_verification"
    if route_action.startswith("verify_then"):
        if not row.get("live"):
            return "needs_live_verification"
        return "review"
    if not row.get("live"):
        return "needs_live_verification"
    return "review"


def build_rows(merged_rows: list[dict[str, Any]], rules: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    query_rows = [row for row in merged_rows if row.get("action_class") == "query_parameter_policy"]
    for row in query_rows:
        rule = first_matching_rule(row, rules)
        target = (rule or {}).get("target_policy") or {}
        out.append({
            "url_or_path": row.get("url_or_path", ""),
            "base_path": row.get("base_path", ""),
            "route_family": row.get("route_family", ""),
            "query_params": row.get("query_params", ""),
            "live_status": row_live_status(row) or "",
            "live_interpretation": row.get("live_interpretation", ""),
            "registry_rule": rule["id"] if rule else "",
            "target_route_action": target.get("route_action", ""),
            "target_canonical": target.get("canonical", ""),
            "target_robots": target.get("robots", ""),
            "policy_state": policy_state(row, rule),
            "assessment": assess_row(row, rule),
            "recommended_change": (rule or {}).get("recommended_change", ""),
        })
    return out


def summarize(rows: list[dict[str, Any]], registry: dict[str, Any]) -> dict[str, Any]:
    by_rule: dict[str, int] = dict(Counter(row["registry_rule"] or "unmatched" for row in rows))
    by_assessment: dict[str, int] = dict(Counter(row["assessment"] for row in rows))
    needs_live = [row["url_or_path"] for row in rows if row["assessment"] == "needs_live_verification"]
    unmatched = [row["url_or_path"] for row in rows if row["assessment"] == "registry_missing"]
    live_drift = [row["url_or_path"] for row in rows if row["assessment"] == "live_drift_review"]
    return {
        "registry_version": registry.get("version"),
        "query_policy_rows": len(rows),
        "by_registry_rule": by_rule,
        "by_assessment": by_assessment,
        "needs_live_verification": needs_live,
        "unmatched": unmatched,
        "live_drift_review": live_drift,
    }


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    fields = [
        "url_or_path",
        "base_path",
        "route_family",
        "query_params",
        "live_status",
        "live_interpretation",
        "registry_rule",
        "target_route_action",
        "target_canonical",
        "target_robots",
        "policy_state",
        "assessment",
        "recommended_change",
    ]
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fields})


def render_markdown(rows: list[dict[str, Any]], summary: dict[str, Any], registry_path: Path) -> str:
    by_rule: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_rule[row["registry_rule"] or "unmatched"].append(row)

    lines = [
        "# SEO URL-Policy Registry Validation",
        "",
        f"- Generated: {dt.datetime.now(dt.timezone.utc).isoformat()}",
        f"- Registry: `{registry_path}`",
        f"- Registry version: `{summary['registry_version']}`",
        "- Mode: read-only; no route, canonical, robots, sitemap, WordPress/Woo, deploy, or PM2 changes.",
        f"- Query-policy rows assessed: {summary['query_policy_rows']}",
        f"- By registry rule: {summary['by_registry_rule']}",
        f"- By assessment: {summary['by_assessment']}",
        "",
        "## Policy Findings",
        "",
    ]

    for rule_id, items in sorted(by_rule.items()):
        lines.append(f"### {rule_id}")
        for item in items[:20]:
            live = f" status {item['live_status']}" if item["live_status"] else ""
            lines.append(
                f"- `{item['url_or_path']}`{live}: {item['assessment']}; target `{item['target_route_action']}`."
            )
        if len(items) > 20:
            lines.append(f"- ... {len(items) - 20} more in CSV.")
        lines.append("")

    lines.extend([
        "## Smallest Safe Fix Proposal",
        "",
        "1. Do not change valid collection pagination now. The live-verified `?page=N` category URLs return 200, self-canonicalize, expose CollectionPage/ItemList schema, and match the intentional `paginationSeo.ts` contract. Reclassify them from generic query noise to intentional collection pagination in future control-loop reports.",
        "2. Keep out-of-range collection pagination as 404/noindex. `/category/korean-beauty?page=89` already returns 404 with `noindex`; no redirect or canonical change is safer than sending Google to an arbitrary last page.",
        "3. Do not change the live-verified crawl-noise redirects. `/?add-to-cart=*` and `/brands?brand=*` already collapse to clean canonical URLs. The registry should treat these as compliant, not open route bugs.",
        "4. Before any route edit, live-verify the remaining classified query classes: `/concerns?concern=*`, `/concerns?concern=*&page=N`, and `/origins?country=*`. If any return 200/indexable instead of 301 to the clean entity URL, make the smallest fix in middleware/redirect config for that class only.",
        "",
        "## Follow-Up Checks",
        "",
        "- Feed this registry into `seo_technical_control_loop.py` so query rows are classified by declared URL policy before severity is assigned.",
        "- Add a bounded live-verification batch for the unverified concern/origin query rows.",
        "- Keep the confirmed product 404 separate; it still needs catalog/Woo replacement confirmation before redirect or sitemap removal.",
        "",
    ])
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    registry_path = Path(args.registry)
    classification_path = Path(args.classification_json)
    live_path = Path(args.live_json)
    registry = load_json(registry_path)
    classification = load_json(classification_path)
    live = load_json(live_path)
    rows = build_rows(merge_live_rows(classification, live), registry.get("rules", []))
    summary = summarize(rows, registry)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    base = OUT_DIR / f"seo-url-policy-registry-validation-{args.stamp}"
    json_path = base.with_suffix(".json")
    csv_path = base.with_suffix(".csv")
    md_path = base.with_suffix(".md")
    result = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "registry": str(registry_path),
        "classification": str(classification_path),
        "live_verification": str(live_path),
        "summary": summary,
        "rows": rows,
        "outputs": {
            "json": str(json_path),
            "csv": str(csv_path),
            "markdown": str(md_path),
        },
    }
    json_path.write_text(json.dumps(result, indent=2, ensure_ascii=False))
    write_csv(csv_path, rows)
    md_path.write_text(render_markdown(rows, summary, registry_path))
    print(json.dumps({"ok": True, **summary, "outputs": result["outputs"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
