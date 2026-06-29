#!/usr/bin/env python3
"""Classify technical SEO crawl/index drift from the latest SEO gap audit.

This is intentionally read-only. It consumes the saved `seo_gap_audit.py` JSON
output and writes a review report plus CSV/JSON artifacts. It does not call
WordPress, WooCommerce, GSC URL Inspection, deploy, or edit routes.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parents[2]
DEFAULT_AUDIT = REPO / "audit/active/seo-gap-audit-20260626.json"
OUT_DIR = REPO / "audit/active"
SITE = "https://e-mart.com.bd"


DEPRECATED_CATEGORY_SLUGS = {
    "k-beauty-j-beauty",
    "shop-by-concern",
    "skincare-essentials",
}

PROTECTED_PATH_PREFIXES = (
    "/account",
    "/cart",
    "/checkout",
    "/my-account",
    "/my-orders",
    "/order",
    "/orders",
    "/wishlist",
    "/wp-admin",
    "/wp-json",
    "/wp-login.php",
)

TRACKING_OR_FILTER_PARAMS = {
    "add-to-cart",
    "brand",
    "concern",
    "country",
    "filter_brand",
    "filter_concern",
    "orderby",
    "page",
    "paged",
    "per_page",
    "shop_view",
    "srsltid",
    "utm_campaign",
    "utm_medium",
    "utm_source",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a read-only technical SEO control-loop report")
    parser.add_argument("--audit-json", default=str(DEFAULT_AUDIT), help="Saved seo_gap_audit.py JSON output")
    parser.add_argument("--stamp", help="Output date stamp, defaults to today YYYYMMDD")
    parser.add_argument("--verify-live", action="store_true", help="Fetch bounded P0/P1 rows and record live status/canonical/robots/schema signals")
    parser.add_argument("--verify-limit", type=int, default=20, help="Maximum P0/P1 rows to live-verify")
    parser.add_argument("--timeout", type=int, default=20, help="HTTP timeout per live verification URL")
    return parser.parse_args()


def today_stamp() -> str:
    return dt.date.today().strftime("%Y%m%d")


def normalize_path(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return "/"
    parsed = urllib.parse.urlparse(value)
    path = (parsed.path or "/") if parsed.scheme else (parsed.path or value)
    if path.startswith("/product/"):
        path = "/shop/" + path[len("/product/") :]
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
    query = parsed.query
    return f"{path}?{query}" if query else path


def query_keys(url_or_path: str) -> set[str]:
    parsed = urllib.parse.urlparse(url_or_path)
    return {key for key, _ in urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)}


def path_without_query(url_or_path: str) -> str:
    return urllib.parse.urlparse(url_or_path).path or "/"


def equivalent_path(left: str, right: str) -> bool:
    return urllib.parse.unquote(normalize_path(left)) == urllib.parse.unquote(normalize_path(right))


def route_family(path: str) -> str:
    base = path_without_query(path)
    if base == "/":
        return "home"
    if re.match(r"^/\d{4}/\d{2}/\d{2}/", base):
        return "legacy_wp_date_post"
    if base.startswith("/shop/"):
        return "product"
    if base.startswith("/blog/"):
        return "blog"
    if base.startswith("/category/"):
        return "category"
    if base.startswith("/concerns/"):
        return "concern"
    if base.startswith("/ingredients/"):
        return "ingredient"
    if base.startswith("/brands/"):
        return "brand"
    if base.startswith("/brand/"):
        return "legacy_brand_singular"
    if base.startswith("/origins/"):
        return "origin"
    if base.startswith(PROTECTED_PATH_PREFIXES):
        return "protected"
    if base in {"/about-us-3"}:
        return "legacy_page"
    if base.startswith("/best/"):
        return "best"
    return "other"


def absolute_url(path: str) -> str:
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return SITE + path


def first_match(pattern: str, value: str) -> str:
    match = re.search(pattern, value, flags=re.I)
    return match.group(1).strip() if match else ""


def schema_types(body: str) -> list[str]:
    found: list[str] = []
    for raw in re.findall(r"<script[^>]+type=[\"']application/ld\+json[\"'][^>]*>([\s\S]*?)</script>", body, flags=re.I):
        try:
            parsed = json.loads(raw)
        except Exception:
            continue
        nodes = parsed if isinstance(parsed, list) else [parsed]
        if isinstance(parsed, dict) and isinstance(parsed.get("@graph"), list):
            nodes.extend(parsed["@graph"])
        for node in nodes:
            if not isinstance(node, dict):
                continue
            node_type = node.get("@type")
            if isinstance(node_type, list):
                found.extend(str(item) for item in node_type)
            elif node_type:
                found.append(str(node_type))
    return sorted(set(found))


def fetch_live(url: str, timeout: int) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "EmartSeoTechnicalControlLoop/1.0"},
    )
    started = dt.datetime.now(dt.timezone.utc).isoformat()
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8", "replace")
            status = response.status
            final_url = response.geturl()
            headers = dict(response.headers.items())
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
        status = exc.code
        final_url = exc.geturl()
        headers = dict(exc.headers.items())
    except Exception as exc:
        return {"input_url": url, "checked_at": started, "error": str(exc)}

    canonical = first_match(r"<link[^>]+rel=[\"']canonical[\"'][^>]+href=[\"']([^\"']+)[\"']", body)
    if not canonical:
        canonical = first_match(r"<link[^>]+href=[\"']([^\"']+)[\"'][^>]+rel=[\"']canonical[\"']", body)
    robots = first_match(r"<meta[^>]+name=[\"']robots[\"'][^>]+content=[\"']([^\"']+)['\"]", body)
    title = first_match(r"<title[^>]*>([\s\S]*?)</title>", body)
    final_path = normalize_path(final_url)
    canonical_path = normalize_path(canonical) if canonical else ""

    return {
        "input_url": url,
        "checked_at": started,
        "status": status,
        "final_url": final_url,
        "final_path": final_path,
        "redirected": final_url != url,
        "canonical": canonical,
        "canonical_path": canonical_path,
        "canonical_matches_final": bool(canonical_path and equivalent_path(canonical_path, final_path)),
        "robots": robots,
        "x_robots_tag": headers.get("x-robots-tag") or headers.get("X-Robots-Tag", ""),
        "cache_control": headers.get("cache-control") or headers.get("Cache-Control", ""),
        "title": re.sub(r"\s+", " ", title),
        "schema_types": schema_types(body),
        "body_bytes": len(body.encode("utf-8", "ignore")),
    }


def classify_url(path: str, source: str, extra: dict[str, Any] | None = None) -> dict[str, Any]:
    normalized = normalize_path(path)
    base = path_without_query(normalized)
    family = route_family(normalized)
    params = query_keys(normalized)
    slug = base.strip("/").split("/")[-1] if base.strip("/") else ""
    extra = extra or {}

    action_class = "review_live_status"
    severity = "P2"
    recommendation = "Verify status/canonical/indexability before any route or sitemap change."
    commercial_risk = "unknown"

    if source in {"dead_sitemap", "non_200_crawl"} or extra.get("status", 0) >= 400:
        action_class = "sitemap_or_internal_404"
        severity = "P0"
        recommendation = "Remove from sitemap/internal source or restore/redirect after confirming the canonical replacement."
        commercial_risk = "high" if family == "product" else "medium"
    elif params & TRACKING_OR_FILTER_PARAMS:
        action_class = "query_parameter_policy"
        severity = "P1"
        recommendation = "Fold into the URL-policy registry: strip, canonicalize, noindex, or redirect by parameter class."
        commercial_risk = "medium"
    elif family in {"legacy_wp_date_post", "legacy_brand_singular", "legacy_page"}:
        action_class = "legacy_url_cleanup"
        severity = "P1"
        recommendation = "Map legacy URL to current canonical or leave as intentional 404 only after GSC impact review."
        commercial_risk = "medium"
    elif family == "category" and slug in DEPRECATED_CATEGORY_SLUGS:
        action_class = "deprecated_taxonomy_cleanup"
        severity = "P1"
        recommendation = "Confirm existing redirect/noindex policy and add this class to URL-policy monitoring."
        commercial_risk = "medium"
    elif family == "protected":
        action_class = "expected_private_exclusion"
        severity = "P3"
        recommendation = "Keep excluded/noindex; monitor only for unexpected impressions."
        commercial_risk = "low"
    elif source == "sitemap_without_gsc":
        action_class = "low_or_new_search_demand"
        severity = "P3"
        recommendation = "Do not treat as an error by itself; prioritize only if commercially important and indexed poorly after inspection."
        commercial_risk = "low"
    elif source == "gsc_not_sitemap" and family in {"product", "category", "brand", "concern", "origin", "best", "blog"}:
        action_class = "canonical_coverage_review"
        severity = "P1"
        recommendation = "Check whether this clean URL should be in sitemap, redirected, or deliberately excluded."
        commercial_risk = "high" if family == "product" else "medium"

    return {
        "source": source,
        "url_or_path": normalized,
        "base_path": base,
        "route_family": family,
        "query_params": ",".join(sorted(params)),
        "action_class": action_class,
        "severity": severity,
        "commercial_risk": commercial_risk,
        "status": extra.get("status", ""),
        "robots": extra.get("robots", ""),
        "canonical": extra.get("canonical", ""),
        "recommendation": recommendation,
    }


def collect_rows(audit: dict[str, Any]) -> list[dict[str, Any]]:
    idx = audit["analysis"]["index_performance"]
    rows: list[dict[str, Any]] = []
    non_200_paths = {
        normalize_path(crawl.get("path") or crawl.get("input_url") or "")
        for crawl in idx.get("non_200_crawl", [])
    }
    for path in idx.get("gsc_urls_not_in_sitemap_sample", []):
        rows.append(classify_url(path, "gsc_not_sitemap"))
    for path in idx.get("sitemap_urls_without_gsc_sample", []):
        rows.append(classify_url(path, "sitemap_without_gsc"))
    for path in idx.get("dead_sitemap_sample", []):
        if normalize_path(path) in non_200_paths:
            continue
        rows.append(classify_url(path, "dead_sitemap"))
    for crawl in idx.get("non_200_crawl", []):
        rows.append(classify_url(crawl.get("path") or crawl.get("input_url") or "", "non_200_crawl", crawl))
    return rows


def owner_index_rows(audit: dict[str, Any]) -> list[dict[str, Any]]:
    evidence = audit["analysis"]["index_performance"].get("owner_gsc_page_indexing_evidence", {})
    return sorted(evidence.get("rows", []), key=lambda row: -int(row.get("pages", 0)))


def summarize(rows: list[dict[str, Any]], owner_rows: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "total_classified_sample_rows": len(rows),
        "by_source": dict(Counter(row["source"] for row in rows)),
        "by_action_class": dict(Counter(row["action_class"] for row in rows)),
        "by_route_family": dict(Counter(row["route_family"] for row in rows)),
        "by_severity": dict(Counter(row["severity"] for row in rows)),
        "owner_gsc_indexing_reasons": owner_rows,
        "owner_visible_indexing_rows": sum(int(row.get("pages", 0)) for row in owner_rows),
    }


def priority_groups(rows: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        grouped[row["severity"]].append(row)
    return {key: sorted(vals, key=lambda r: (r["action_class"], r["url_or_path"])) for key, vals in sorted(grouped.items())}


def render_markdown(audit: dict[str, Any], rows: list[dict[str, Any]], summary: dict[str, Any]) -> str:
    periods = audit.get("periods", {})
    grouped = priority_groups(rows)
    owner_rows = summary["owner_gsc_indexing_reasons"]
    lines = [
        "# SEO Technical Control Loop",
        "",
        f"- Generated: {dt.datetime.now(dt.timezone.utc).isoformat()}",
        f"- Source audit: `{audit.get('outputs', {}).get('json') or 'workspace/audit/active/seo-gap-audit-20260626.json'}`",
        f"- GSC window: {periods.get('current', 'unknown')}",
        "- Mode: read-only; no route, robots, canonical, sitemap, WordPress/Woo, deploy, or PM2 changes.",
        "",
        "## Why This Matters",
        "",
        "Technical crawl/index drift is now the highest SEO risk because Google is reporting tens of thousands of excluded URLs while the sitemap has 4,205 canonical URLs. The immediate business goal is not to rewrite pages blindly; it is to isolate which URL classes are wasting crawl budget or hiding sellable pages.",
        "",
        "## GSC Page Indexing Buckets",
        "",
    ]
    for row in owner_rows:
        lines.append(f"- {row['reason']}: {int(row['pages']):,} pages ({row['source']}, validation {row['validation']}).")

    lines.extend([
        "",
        "## Classified Sample Summary",
        "",
        f"- Classified rows: {summary['total_classified_sample_rows']}",
        f"- By source: {summary['by_source']}",
        f"- By action class: {summary['by_action_class']}",
        f"- By route family: {summary['by_route_family']}",
        f"- By severity: {summary['by_severity']}",
        "",
        "## Priority Actions",
        "",
        "1. P0: fix sitemap/internal 404 evidence first. These are canonical-looking URLs in the crawl sample that return non-200 and can directly waste crawl budget or hurt product discovery.",
        "2. P1: formalize URL-policy classes for query parameters, legacy WordPress/date URLs, singular `/brand/*`, and deprecated taxonomy URLs before changing redirects.",
        "3. P1: review clean commercial URLs seen by GSC but absent from sitemap. Decide whether each is canonical, redirected, or intentionally excluded.",
        "4. P3: treat sitemap URLs without GSC impressions as demand/indexing triage, not automatic errors.",
        "",
    ])

    for severity in ("P0", "P1", "P2", "P3"):
        items = grouped.get(severity, [])
        if not items:
            continue
        lines.extend([f"## {severity} Sample Rows", ""])
        for row in items[:25]:
            suffix = f" status={row['status']}" if row["status"] else ""
            lines.append(
                f"- `{row['url_or_path']}` — {row['action_class']} / {row['route_family']}{suffix}. {row['recommendation']}"
            )
        if len(items) > 25:
            lines.append(f"- ... {len(items) - 25} more in CSV.")
        lines.append("")

    lines.extend([
        "## Next Control-Loop Phase",
        "",
        "- Add a quota-aware live verification batch for the P0/P1 rows: status, final URL, canonical, robots meta/header, schema type, sitemap membership, and GSC clicks/impressions.",
        "- Convert repeated classes into `SEO-ORCH-6` URL-policy registry rows before route/middleware edits.",
        "- Only after class evidence is reviewed, propose targeted fixes for canonical product/category/brand URLs that affect commercial discovery.",
        "",
    ])
    return "\n".join(lines)


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    fieldnames = [
        "severity",
        "commercial_risk",
        "source",
        "action_class",
        "route_family",
        "url_or_path",
        "base_path",
        "query_params",
        "status",
        "robots",
        "canonical",
        "recommendation",
    ]
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fieldnames})


def verification_candidates(rows: list[dict[str, Any]], limit: int) -> list[dict[str, Any]]:
    action_priority = {
        "sitemap_or_internal_404": 0,
        "query_parameter_policy": 1,
        "legacy_url_cleanup": 2,
        "deprecated_taxonomy_cleanup": 3,
        "canonical_coverage_review": 4,
    }
    ranked = sorted(
        [row for row in rows if row["severity"] in {"P0", "P1"}],
        key=lambda row: (
            {"P0": 0, "P1": 1}.get(row["severity"], 9),
            action_priority.get(row["action_class"], 9),
            row["url_or_path"],
        ),
    )
    return ranked[: max(limit, 0)]


def interpret_verification(row: dict[str, Any], live: dict[str, Any]) -> str:
    if live.get("error"):
        return "fetch_error_retry_or_verify_from_vps"
    status = int(live.get("status") or 0)
    robots = (live.get("robots") or live.get("x_robots_tag") or "").lower()
    schemas = set(live.get("schema_types") or [])
    if status >= 500:
        return "server_error_fix_first"
    if status == 404 and row["route_family"] == "product":
        return "commercial_product_404_needs_restore_redirect_or_sitemap_removal"
    if status == 404:
        return "404_review_redirect_or_leave_intentional"
    if status in {301, 302, 307, 308}:
        return "redirect_policy_review"
    if status == 200 and row["action_class"] == "query_parameter_policy":
        if live.get("redirected"):
            return "query_url_redirects_to_canonical"
        if "noindex" in robots:
            return "query_url_returns_200_noindex_policy_registry_candidate"
        return "query_url_returns_200_indexable_policy_gap"
    if status == 200 and row["action_class"] in {"legacy_url_cleanup", "deprecated_taxonomy_cleanup"}:
        return "legacy_url_returns_200_policy_registry_candidate"
    if status == 200 and row["action_class"] == "canonical_coverage_review":
        if live.get("canonical_matches_final") and not ("noindex" in robots):
            return "clean_indexable_url_absent_from_sitemap_review_inclusion_or_demand"
        return "canonical_or_noindex_mismatch_review"
    if status == 200 and "Product" in schemas and "noindex" in robots:
        return "product_like_noindex_review"
    return "manual_review"


def verify_live_rows(rows: list[dict[str, Any]], limit: int, timeout: int) -> list[dict[str, Any]]:
    verified = []
    for row in verification_candidates(rows, limit):
        live = fetch_live(absolute_url(row["url_or_path"]), timeout)
        verified.append({**row, "live": live, "live_interpretation": interpret_verification(row, live)})
    return verified


def summarize_verification(rows: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "verified_rows": len(rows),
        "by_live_interpretation": dict(Counter(row["live_interpretation"] for row in rows)),
        "by_status": dict(Counter(str(row.get("live", {}).get("status", "error")) for row in rows)),
        "errors": [row for row in rows if row.get("live", {}).get("error")],
    }


def write_verification_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    fieldnames = [
        "severity",
        "action_class",
        "route_family",
        "url_or_path",
        "live_status",
        "live_final_url",
        "live_canonical",
        "live_robots",
        "live_x_robots_tag",
        "live_schema_types",
        "live_interpretation",
        "recommendation",
    ]
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            live = row.get("live", {})
            writer.writerow({
                "severity": row.get("severity", ""),
                "action_class": row.get("action_class", ""),
                "route_family": row.get("route_family", ""),
                "url_or_path": row.get("url_or_path", ""),
                "live_status": live.get("status", "error"),
                "live_final_url": live.get("final_url", ""),
                "live_canonical": live.get("canonical", ""),
                "live_robots": live.get("robots", ""),
                "live_x_robots_tag": live.get("x_robots_tag", ""),
                "live_schema_types": ",".join(live.get("schema_types", [])),
                "live_interpretation": row.get("live_interpretation", ""),
                "recommendation": row.get("recommendation", ""),
            })


def render_live_markdown(rows: list[dict[str, Any]], summary: dict[str, Any]) -> str:
    lines = [
        "# SEO Technical Control Loop Live Verification",
        "",
        f"- Generated: {dt.datetime.now(dt.timezone.utc).isoformat()}",
        "- Mode: read-only HTTP fetches only; no route, robots, canonical, sitemap, WordPress/Woo, deploy, or PM2 changes.",
        f"- Verified rows: {summary['verified_rows']}",
        f"- By status: {summary['by_status']}",
        f"- By interpretation: {summary['by_live_interpretation']}",
        "",
        "## Verified Rows",
        "",
    ]
    for row in rows:
        live = row.get("live", {})
        status = live.get("status", "error")
        canonical = live.get("canonical") or "none"
        robots = live.get("robots") or live.get("x_robots_tag") or "none"
        lines.append(
            f"- `{row['url_or_path']}` — {row['severity']} {row['action_class']} -> status {status}, robots `{robots}`, canonical `{canonical}`, interpretation `{row['live_interpretation']}`."
        )
    lines.extend([
        "",
        "## Next Actions",
        "",
        "- Convert repeated verified interpretations into SEO-ORCH-6 URL-policy registry rows.",
        "- For product 404s or product-like noindex pages, confirm catalog/Woo canonical replacement before sitemap or redirect changes.",
        "- For query URLs returning 200/indexable, decide strip/noindex/canonical behavior before middleware edits.",
        "",
    ])
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    audit_path = Path(args.audit_json)
    audit = json.loads(audit_path.read_text())
    stamp = args.stamp or today_stamp()
    rows = collect_rows(audit)
    owner_rows = owner_index_rows(audit)
    summary = summarize(rows, owner_rows)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    base = OUT_DIR / f"seo-technical-control-loop-{stamp}"
    json_path = base.with_suffix(".json")
    csv_path = base.with_suffix(".csv")
    md_path = base.with_suffix(".md")

    result = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "source_audit": str(audit_path),
        "summary": summary,
        "rows": rows,
        "outputs": {"json": str(json_path), "csv": str(csv_path), "markdown": str(md_path)},
    }
    live_summary = None
    live_rows: list[dict[str, Any]] = []
    if args.verify_live:
        live_rows = verify_live_rows(rows, args.verify_limit, args.timeout)
        live_summary = summarize_verification(live_rows)
        live_base = OUT_DIR / f"seo-technical-control-loop-live-{stamp}"
        live_json_path = live_base.with_suffix(".json")
        live_csv_path = live_base.with_suffix(".csv")
        live_md_path = live_base.with_suffix(".md")
        live_result = {
            "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            "source_audit": str(audit_path),
            "source_classification": str(json_path),
            "summary": live_summary,
            "rows": live_rows,
            "outputs": {"json": str(live_json_path), "csv": str(live_csv_path), "markdown": str(live_md_path)},
        }
        live_json_path.write_text(json.dumps(live_result, indent=2, ensure_ascii=False))
        write_verification_csv(live_csv_path, live_rows)
        live_md_path.write_text(render_live_markdown(live_rows, live_summary))
        result["live_verification"] = live_result["outputs"]
    json_path.write_text(json.dumps(result, indent=2, ensure_ascii=False))
    write_csv(csv_path, rows)
    md_path.write_text(render_markdown(audit, rows, summary))

    print(json.dumps({
        "ok": True,
        "classified_rows": len(rows),
        "outputs": result["outputs"],
        "by_action_class": summary["by_action_class"],
        "by_severity": summary["by_severity"],
        "live_verification": live_summary,
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
