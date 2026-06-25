#!/usr/bin/env python3
"""Fresh read-only SEO data-gap audit for Emart.

Produces a current, review-batched audit report that joins GSC, GA4, sitemap
crawl, rendered DOM samples, and existing local SEO state. It does not write to
WordPress/WooCommerce, deploy, restart services, or edit TASKS.md.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import html
import json
import math
import os
import re
import subprocess
import sys
import tempfile
import textwrap
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parents[2]
SITE = "https://e-mart.com.bd"
HOSTS = ("https://e-mart.com.bd", "http://e-mart.com.bd", "https://www.e-mart.com.bd", "http://www.e-mart.com.bd")
OUT_DIR = REPO / "audit/active"
SEO_REVIEW = REPO / "seo-review"
GSC_DAILY = SEO_REVIEW / "gsc-daily"
AGENTIC_FILE = SEO_REVIEW / "agentic-score.jsonl"
GA4_CREDENTIALS = "/root/.config/gcloud/emart-ga4-reader.json"
GA4_PROPERTY = "properties/310219799"
GSC_KEY_FILE = "/root/.gmc/service-account.json"
GSC_TOKEN_FILE = "/root/.gmc/gsc_token.json"
GSC_SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

BRAND_QUERY_PATTERNS = (
    "emart",
    "e mart",
    "e-mart",
    "emartbd",
    "emart bd",
    "emart skincare",
    "e mart bd",
    "e mart way",
    "emarrt",
    "dhaka e mart",
)

GOOGLE_UPDATES = [
    {"name": "March 2026 spam update", "type": "spam", "start": "2026-03-24", "end": "2026-03-25"},
    {"name": "March 2026 core update", "type": "core", "start": "2026-03-27", "end": "2026-04-08"},
    {"name": "May 2026 core update", "type": "core", "start": "2026-05-21", "end": "2026-06-02"},
    {"name": "June 2026 spam update", "type": "spam", "start": "2026-06-24", "end": None},
]

OWNER_GSC_INDEXING_EVIDENCE = {
    "source": "Owner-provided Google Search Console Page indexing screenshot",
    "captured_at_local": "2026-06-26 04:03",
    "property": "https://e-mart.com.bd/",
    "rows": [
        {"reason": "Page with redirect", "source": "Website", "validation": "Failed", "pages": 5641},
        {"reason": "Not found (404)", "source": "Website", "validation": "Failed", "pages": 3195},
        {"reason": "Blocked by robots.txt", "source": "Website", "validation": "Failed", "pages": 2264},
        {"reason": "Alternate page with proper canonical tag", "source": "Website", "validation": "Failed", "pages": 1732},
        {"reason": "Excluded by 'noindex' tag", "source": "Website", "validation": "Failed", "pages": 225},
        {"reason": "Soft 404", "source": "Website", "validation": "Failed", "pages": 106},
        {"reason": "Server error (5xx)", "source": "Website", "validation": "Failed", "pages": 57},
        {"reason": "Duplicate without user-selected canonical", "source": "Website", "validation": "Failed", "pages": 23},
        {"reason": "Crawled - currently not indexed", "source": "Google systems", "validation": "Failed", "pages": 32584},
        {"reason": "Blocked due to access forbidden (403)", "source": "Website", "validation": "Not Started", "pages": 5},
    ],
}

EXPECTED_CTR = [
    (1.5, 0.28),
    (2.5, 0.16),
    (3.5, 0.11),
    (5.5, 0.07),
    (8.5, 0.035),
    (12.5, 0.018),
    (20.5, 0.008),
    (math.inf, 0.003),
]


@dataclass(frozen=True)
class Period:
    start: dt.date
    end: dt.date

    def as_api(self) -> tuple[str, str]:
        return self.start.isoformat(), self.end.isoformat()

    def label(self) -> str:
        return f"{self.start.isoformat()} to {self.end.isoformat()}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a read-only SEO data-gap audit")
    parser.add_argument("--days", type=int, default=90, help="Complete-day lookback window")
    parser.add_argument("--end-date", help="Inclusive end date, defaults to yesterday")
    parser.add_argument("--no-api", action="store_true", help="Skip live GSC/GA4 calls and use local snapshots where possible")
    parser.add_argument("--no-render", action="store_true", help="Skip Playwright rendered DOM samples")
    parser.add_argument("--crawl-limit-per-segment", type=int, default=8)
    parser.add_argument("--render-limit", type=int, default=28)
    parser.add_argument("--ga4-limit", type=int, default=10000)
    parser.add_argument("--gsc-row-limit", type=int, default=25000)
    parser.add_argument("--stamp", help="Output date stamp, defaults to today YYYYMMDD")
    return parser.parse_args()


def today() -> dt.date:
    return dt.date.today()


def periods(days: int, end_date: str | None) -> tuple[Period, Period, Period]:
    end = dt.date.fromisoformat(end_date) if end_date else today() - dt.timedelta(days=1)
    current = Period(end - dt.timedelta(days=days - 1), end)
    yoy = Period(current.start.replace(year=current.start.year - 1), current.end.replace(year=current.end.year - 1))
    previous = Period(current.start - dt.timedelta(days=days), current.start - dt.timedelta(days=1))
    return current, yoy, previous


def normalize_query(query: str) -> str:
    return " ".join(query.lower().replace("-", " ").replace(".", " ").split())


def is_brand_query(query: str) -> bool:
    q = normalize_query(query)
    compact = q.replace(" ", "")
    if q == "mart" or " com bd" in q or q.endswith(" com"):
        return True
    return any(pattern in q or pattern.replace(" ", "") in compact for pattern in BRAND_QUERY_PATTERNS)


def normalize_path(value: str) -> str:
    value = (value or "").strip()
    for host in HOSTS:
        if value.startswith(host):
            value = value[len(host):] or "/"
    if not value.startswith("/"):
        value = urllib.parse.urlparse(value).path or "/"
    if value.startswith("/product/"):
        value = "/shop/" + value[len("/product/"):]
    if value != "/" and value.endswith("/"):
        value = value.rstrip("/")
    return value


def clean_path(value: str) -> str:
    parsed = urllib.parse.urlparse(value)
    return normalize_path(parsed.path or value)


def page_type(path: str) -> str:
    path = normalize_path(path)
    if path == "/":
        return "home"
    if path == "/shop":
        return "shop"
    if path.startswith("/shop/"):
        return "product"
    if path.startswith("/category/"):
        return "category"
    if path.startswith("/brands/"):
        return "brand"
    if path.startswith("/concerns/"):
        return "concern"
    if path.startswith("/ingredients/"):
        return "ingredient"
    if path.startswith("/skin-type/"):
        return "skin_type"
    if path.startswith("/origins/"):
        return "origin"
    if path.startswith("/blog/"):
        return "blog"
    if path in {"/contact", "/faq", "/about", "/return-policy", "/shipping-policy", "/privacy-policy", "/terms-conditions"}:
        return "service"
    return "other"


def pct(value: float) -> str:
    return f"{value * 100:.1f}%"


def delta_pct(current: float, previous: float) -> float | None:
    if previous == 0:
        return None
    return (current - previous) / previous


def http_get(url: str, timeout: int = 30, method: str = "GET") -> tuple[int, str, dict[str, str], str]:
    req = urllib.request.Request(url, method=method, headers={"User-Agent": "EmartSeoGapAudit/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", "replace") if method != "HEAD" else ""
            return resp.status, resp.geturl(), dict(resp.headers.items()), body
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace") if method != "HEAD" else ""
        return exc.code, exc.geturl(), dict(exc.headers.items()), body


def extract_sitemap_urls() -> tuple[list[str], dict[str, Any]]:
    try:
        status, final_url, headers, body = http_get(f"{SITE}/sitemap.xml")
    except Exception as exc:
        return [], {"available": False, "error": str(exc)}
    urls = re.findall(r"<loc>([^<]+)</loc>", body)
    return urls, {
        "available": True,
        "status": status,
        "final_url": final_url,
        "content_type": headers.get("content-type") or headers.get("Content-Type"),
        "url_count": len(urls),
        "segments": count_by([page_type(clean_path(u)) for u in urls]),
    }


def count_by(values: list[str]) -> dict[str, int]:
    out: dict[str, int] = {}
    for value in values:
        out[value] = out.get(value, 0) + 1
    return dict(sorted(out.items()))


def get_gsc_service():
    import httplib2
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account
    from google.oauth2.credentials import Credentials
    from google_auth_httplib2 import AuthorizedHttp
    from googleapiclient.discovery import build

    if os.path.exists(GSC_TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(GSC_TOKEN_FILE, GSC_SCOPES)
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            Path(GSC_TOKEN_FILE).write_text(creds.to_json())
        if creds and creds.valid:
            return build("searchconsole", "v1", http=AuthorizedHttp(creds, httplib2.Http(timeout=90)), cache_discovery=False)
    creds = service_account.Credentials.from_service_account_file(GSC_KEY_FILE, scopes=GSC_SCOPES)
    return build("searchconsole", "v1", http=AuthorizedHttp(creds, httplib2.Http(timeout=90)), cache_discovery=False)


def get_gsc_site(service: Any) -> str:
    result = service.sites().list().execute()
    sites = result.get("siteEntry", [])
    for site in sites:
        if site.get("siteUrl", "").startswith("sc-domain:"):
            return site["siteUrl"]
    return sites[0]["siteUrl"] if sites else SITE


def gsc_query(service: Any, site: str, period: Period, dimensions: list[str], limit: int) -> list[dict[str, Any]]:
    start, end = period.as_api()
    body = {
        "startDate": start,
        "endDate": end,
        "dimensions": dimensions,
        "rowLimit": limit,
        "dataState": "all",
    }
    return service.searchanalytics().query(siteUrl=site, body=body).execute().get("rows", [])


def merge_page_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    for row in rows:
        path = normalize_path(row["keys"][0])
        item = merged.setdefault(path, {"path": path, "clicks": 0.0, "impressions": 0.0, "_pos_sum": 0.0})
        item["clicks"] += float(row.get("clicks", 0))
        item["impressions"] += float(row.get("impressions", 0))
        item["_pos_sum"] += float(row.get("position", 0)) * float(row.get("impressions", 0))
    out = []
    for item in merged.values():
        impressions = max(item["impressions"], 1)
        out.append({
            "path": item["path"],
            "url": SITE + item["path"],
            "clicks": round(item["clicks"], 3),
            "impressions": round(item["impressions"], 3),
            "ctr": round(item["clicks"] / impressions, 5),
            "position": round(item["_pos_sum"] / impressions, 2),
            "segment": page_type(item["path"]),
        })
    return sorted(out, key=lambda x: -x["impressions"])


def merge_page_query_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: dict[tuple[str, str], dict[str, Any]] = {}
    for row in rows:
        path = normalize_path(row["keys"][0])
        query = row["keys"][1]
        key = (path, query)
        item = merged.setdefault(key, {"page": path, "query": query, "clicks": 0.0, "impressions": 0.0, "_pos_sum": 0.0})
        item["clicks"] += float(row.get("clicks", 0))
        item["impressions"] += float(row.get("impressions", 0))
        item["_pos_sum"] += float(row.get("position", 0)) * float(row.get("impressions", 0))
    out = []
    for item in merged.values():
        impressions = max(item["impressions"], 1)
        out.append({
            "page": item["page"],
            "query": item["query"],
            "query_class": "brand" if is_brand_query(item["query"]) else "non_brand",
            "clicks": round(item["clicks"], 3),
            "impressions": round(item["impressions"], 3),
            "ctr": round(item["clicks"] / impressions, 5),
            "position": round(item["_pos_sum"] / impressions, 2),
            "segment": page_type(item["page"]),
        })
    return sorted(out, key=lambda x: -x["impressions"])


def query_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out = []
    for row in rows:
        query = row["keys"][0]
        impressions = max(float(row.get("impressions", 0)), 1)
        out.append({
            "query": query,
            "query_class": "brand" if is_brand_query(query) else "non_brand",
            "clicks": round(float(row.get("clicks", 0)), 3),
            "impressions": round(float(row.get("impressions", 0)), 3),
            "ctr": round(float(row.get("clicks", 0)) / impressions, 5),
            "position": round(float(row.get("position", 0)), 2),
        })
    return sorted(out, key=lambda x: -x["impressions"])


def fetch_gsc_periods(args: argparse.Namespace, current: Period, yoy: Period, previous: Period) -> dict[str, Any]:
    if args.no_api:
        latest = load_latest_gsc_snapshot()
        return {"source": "local_latest_snapshot", "available": bool(latest), "current": latest or {}, "yoy": {}, "previous": {}, "errors": ["--no-api set"]}
    errors = []
    try:
        service = get_gsc_service()
        site = get_gsc_site(service)
        result = {"source": "searchconsole_api", "site": site, "available": True, "errors": errors}
        for label, period in (("current", current), ("yoy", yoy), ("previous", previous)):
            pages = merge_page_rows(gsc_query(service, site, period, ["page"], args.gsc_row_limit))
            page_queries = merge_page_query_rows(gsc_query(service, site, period, ["page", "query"], args.gsc_row_limit))
            queries = query_rows(gsc_query(service, site, period, ["query"], args.gsc_row_limit))
            result[label] = {
                "period": {"start": period.start.isoformat(), "end": period.end.isoformat()},
                "summary": summarize_gsc(pages, queries),
                "pages": pages,
                "page_queries": page_queries,
                "queries": queries,
            }
        return result
    except Exception as exc:
        latest = load_latest_gsc_snapshot()
        return {
            "source": "local_latest_snapshot_fallback",
            "available": bool(latest),
            "current": latest or {},
            "yoy": {},
            "previous": {},
            "errors": [str(exc)],
        }


def load_latest_gsc_snapshot() -> dict[str, Any] | None:
    files = sorted(GSC_DAILY.glob("*.json"), reverse=True)
    if not files:
        return None
    data = json.loads(files[0].read_text())
    pages = [
        {**p, "segment": page_type(p.get("path", clean_path(p.get("url", ""))))}
        for p in data.get("pages", [])
    ]
    page_queries = [
        {
            **pq,
            "query_class": "brand" if is_brand_query(pq.get("query", "")) else "non_brand",
            "segment": page_type(pq.get("page", "")),
        }
        for pq in data.get("page_queries", [])
    ]
    queries = [
        {**q, "query_class": "brand" if is_brand_query(q.get("query", "")) else "non_brand"}
        for q in data.get("queries", [])
    ]
    return {
        "period": data.get("period", {}),
        "summary": data.get("summary", summarize_gsc(pages, queries)),
        "pages": pages,
        "page_queries": page_queries,
        "queries": queries,
        "fallback_file": str(files[0]),
    }


def summarize_gsc(pages: list[dict[str, Any]], queries: list[dict[str, Any]]) -> dict[str, Any]:
    clicks = sum(float(p.get("clicks", 0)) for p in pages)
    impressions = sum(float(p.get("impressions", 0)) for p in pages)
    return {
        "total_clicks": round(clicks, 3),
        "total_impressions": round(impressions, 3),
        "avg_ctr": round(clicks / max(impressions, 1), 5),
        "page_count": len(pages),
        "query_count": len(queries),
        "segments": summarize_by(pages, "segment"),
    }


def summarize_by(rows: list[dict[str, Any]], key: str) -> dict[str, Any]:
    groups: dict[str, dict[str, float]] = defaultdict(lambda: {"rows": 0, "clicks": 0.0, "impressions": 0.0})
    for row in rows:
        group = row.get(key) or "unknown"
        groups[group]["rows"] += 1
        groups[group]["clicks"] += float(row.get("clicks", 0))
        groups[group]["impressions"] += float(row.get("impressions", 0))
    return {
        group: {
            "rows": int(vals["rows"]),
            "clicks": round(vals["clicks"], 3),
            "impressions": round(vals["impressions"], 3),
            "ctr": round(vals["clicks"] / max(vals["impressions"], 1), 5),
        }
        for group, vals in sorted(groups.items())
    }


def fetch_ga4(args: argparse.Namespace, current: Period) -> dict[str, Any]:
    if args.no_api:
        return {"available": False, "source": "skipped", "rows": [], "errors": ["--no-api set"]}
    try:
        os.environ.setdefault("GOOGLE_APPLICATION_CREDENTIALS", GA4_CREDENTIALS)
        from google.analytics.data_v1beta import BetaAnalyticsDataClient
        from google.analytics.data_v1beta.types import DateRange, Dimension, Filter, FilterExpression, Metric, OrderBy, RunReportRequest

        client = BetaAnalyticsDataClient()
        request = RunReportRequest(
            property=os.environ.get("GA4_PROPERTY", GA4_PROPERTY),
            date_ranges=[DateRange(start_date=current.start.isoformat(), end_date=current.end.isoformat())],
            dimensions=[Dimension(name="landingPage"), Dimension(name="sessionDefaultChannelGroup")],
            metrics=[
                Metric(name="sessions"),
                Metric(name="screenPageViews"),
                Metric(name="engagementRate"),
                Metric(name="bounceRate"),
                Metric(name="averageSessionDuration"),
                Metric(name="conversions"),
                Metric(name="purchaseRevenue"),
            ],
            dimension_filter=FilterExpression(filter=Filter(
                field_name="landingPage",
                string_filter=Filter.StringFilter(match_type=Filter.StringFilter.MatchType.BEGINS_WITH, value="/"),
            )),
            order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="sessions"), desc=True)],
            limit=args.ga4_limit,
        )
        report = client.run_report(request)
        rows = []
        for row in report.rows:
            landing = row.dimension_values[0].value
            channel = row.dimension_values[1].value
            path = clean_path(landing)
            metrics = [numeric(v.value) for v in row.metric_values]
            rows.append({
                "landing_page": landing,
                "path": path,
                "segment": page_type(path),
                "channel": channel,
                "sessions": metrics[0],
                "views": metrics[1],
                "engagement_rate": metrics[2],
                "bounce_rate": metrics[3],
                "avg_session_duration": metrics[4],
                "conversions": metrics[5],
                "revenue": metrics[6],
            })
        return {
            "available": True,
            "source": "ga4_api",
            "property": os.environ.get("GA4_PROPERTY", GA4_PROPERTY),
            "period": {"start": current.start.isoformat(), "end": current.end.isoformat()},
            "rows": rows,
            "summary": summarize_ga4(rows),
            "errors": [],
        }
    except Exception as exc:
        fallback = load_ga4_product_fallback()
        return {
            "available": bool(fallback),
            "source": "ga4_product_latest_fallback",
            "rows": fallback,
            "summary": summarize_ga4(fallback),
            "errors": [str(exc)],
        }


def load_ga4_product_fallback() -> list[dict[str, Any]]:
    file = REPO / "social-engine/performance/ga4-product-latest.jsonl"
    if not file.exists():
        return []
    rows = []
    for line in file.read_text().splitlines():
        if not line.strip():
            continue
        data = json.loads(line)
        path = clean_path(data.get("path") or data.get("landing_page") or "")
        rows.append({
            "landing_page": data.get("landing_page") or path,
            "path": path,
            "segment": page_type(path),
            "channel": data.get("channel", "all"),
            "sessions": numeric(data.get("sessions")),
            "views": numeric(data.get("views")),
            "engagement_rate": 0.0,
            "bounce_rate": 0.0,
            "avg_session_duration": 0.0,
            "conversions": numeric(data.get("conversions")),
            "revenue": numeric(data.get("revenue")),
        })
    return rows


def summarize_ga4(rows: list[dict[str, Any]]) -> dict[str, Any]:
    sessions = sum(r["sessions"] for r in rows)
    conversions = sum(r["conversions"] for r in rows)
    revenue = sum(r["revenue"] for r in rows)
    return {
        "rows": len(rows),
        "sessions": round(sessions, 3),
        "conversions": round(conversions, 3),
        "revenue": round(revenue, 3),
        "segments": summarize_ga4_by(rows, "segment"),
        "channels": summarize_ga4_by(rows, "channel"),
    }


def summarize_ga4_by(rows: list[dict[str, Any]], key: str) -> dict[str, Any]:
    groups: dict[str, dict[str, float]] = defaultdict(lambda: {"rows": 0, "sessions": 0.0, "conversions": 0.0, "revenue": 0.0})
    for row in rows:
        group = row.get(key) or "unknown"
        groups[group]["rows"] += 1
        groups[group]["sessions"] += row["sessions"]
        groups[group]["conversions"] += row["conversions"]
        groups[group]["revenue"] += row["revenue"]
    return {k: {kk: round(vv, 3) for kk, vv in vals.items()} for k, vals in sorted(groups.items())}


def numeric(value: Any) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def strip_tags(value: str) -> str:
    value = re.sub(r"<script[\s\S]*?</script>", " ", value, flags=re.I)
    value = re.sub(r"<style[\s\S]*?</style>", " ", value, flags=re.I)
    return html.unescape(re.sub(r"<[^>]+>", " ", value))


def first_match(pattern: str, value: str) -> str | None:
    match = re.search(pattern, value, flags=re.I)
    return html.unescape(match.group(1)).strip() if match else None


def audit_static_page(url: str) -> dict[str, Any]:
    started = dt.datetime.now(dt.timezone.utc).isoformat()
    try:
        status, final_url, headers, body = http_get(url, timeout=30)
    except Exception as exc:
        return {"input_url": url, "error": str(exc), "checked_at": started}
    text = re.sub(r"\s+", " ", strip_tags(body)).strip()
    canonical = first_match(r"<link[^>]+rel=[\"']canonical[\"'][^>]+href=[\"']([^\"']+)[\"']", body) or first_match(r"<link[^>]+href=[\"']([^\"']+)[\"'][^>]+rel=[\"']canonical[\"']", body)
    description = first_match(r"<meta[^>]+name=[\"']description[\"'][^>]+content=[\"']([^\"']*)[\"']", body) or first_match(r"<meta[^>]+content=[\"']([^\"']*)[\"'][^>]+name=[\"']description[\"']", body)
    robots = first_match(r"<meta[^>]+name=[\"']robots[\"'][^>]+content=[\"']([^\"']+)['\"]", body)
    links = re.findall(r"<a\b[^>]*href=[\"']([^\"']+)[\"']", body, flags=re.I)
    internal = []
    for href in links:
        try:
            u = urllib.parse.urljoin(SITE, href)
            if urllib.parse.urlparse(u).netloc in {"e-mart.com.bd", "www.e-mart.com.bd"}:
                internal.append(normalize_path(urllib.parse.urlparse(u).path))
        except Exception:
            pass
    jsonld_raw = re.findall(r"<script[^>]+type=[\"']application/ld\+json[\"'][^>]*>([\s\S]*?)</script>", body, flags=re.I)
    schema_types = []
    schema_errors = []
    for raw in jsonld_raw:
        try:
            parsed = json.loads(raw)
            nodes = parsed if isinstance(parsed, list) else [parsed]
            if isinstance(parsed, dict) and isinstance(parsed.get("@graph"), list):
                nodes.extend(parsed["@graph"])
            for node in nodes:
                t = node.get("@type") if isinstance(node, dict) else None
                if isinstance(t, list):
                    schema_types.extend(str(x) for x in t)
                elif t:
                    schema_types.append(str(t))
        except Exception as exc:
            schema_errors.append(str(exc))
    path = clean_path(final_url)
    return {
        "input_url": url,
        "final_url": final_url,
        "path": path,
        "segment": page_type(path),
        "status": status,
        "headers": {
            "content_type": headers.get("content-type") or headers.get("Content-Type"),
            "x_robots_tag": headers.get("x-robots-tag") or headers.get("X-Robots-Tag"),
            "cache_control": headers.get("cache-control") or headers.get("Cache-Control"),
        },
        "title": first_match(r"<title[^>]*>([\s\S]*?)</title>", body),
        "description": description,
        "canonical": canonical,
        "canonical_matches_final": normalize_path(urllib.parse.urlparse(canonical or "").path) == path if canonical else False,
        "robots": robots,
        "h1": re.findall(r"<h1\b[^>]*>([\s\S]*?)</h1>", body, flags=re.I),
        "word_count": len(re.findall(r"\b[\w'-]+\b", text)),
        "estimated_reading_seconds": round(len(re.findall(r"\b[\w'-]+\b", text)) / 220 * 60, 1),
        "internal_link_count": len(internal),
        "unique_internal_link_count": len(set(internal)),
        "query_internal_links": [p for p in internal if "?" in p][:10],
        "schema_types": sorted(set(schema_types)),
        "schema_errors": schema_errors[:5],
        "checked_at": started,
    }


def select_crawl_urls(sitemap_urls: list[str], current_pages: list[dict[str, Any]], limit_per_segment: int) -> list[str]:
    by_segment: dict[str, list[str]] = defaultdict(list)
    for url in sitemap_urls:
        by_segment[page_type(clean_path(url))].append(url)
    selected: list[str] = [SITE, f"{SITE}/shop"]
    for segment in ("product", "category", "brand", "concern", "ingredient", "blog", "service", "shop"):
        selected.extend(by_segment.get(segment, [])[:limit_per_segment])
    # Add top GSC pages that may not be represented early in the sitemap.
    for page in current_pages[:40]:
        selected.append(SITE + normalize_path(page["path"]))
    seen = set()
    out = []
    for url in selected:
        if url not in seen:
            seen.add(url)
            out.append(url)
    return out


def run_static_crawl(urls: list[str]) -> list[dict[str, Any]]:
    return [audit_static_page(url) for url in urls]


def run_render_crawl(urls: list[str]) -> dict[str, Any]:
    if not urls:
        return {"available": False, "rows": [], "errors": ["no urls"]}
    js = r"""
const fs = require('node:fs');
function findPlaywrightModule() {
  const base = '/root/.npm/_npx';
  const candidates = [];
  if (fs.existsSync(base)) {
    for (const entry of fs.readdirSync(base)) {
      const pkg = `${base}/${entry}/node_modules/playwright/package.json`;
      if (fs.existsSync(pkg)) candidates.push(`${base}/${entry}/node_modules/playwright`);
    }
  }
  candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (!candidates[0]) throw new Error('No cached Playwright module');
  return candidates[0];
}
const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3];
(async () => {
  const { chromium } = require(findPlaywrightModule());
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36 EmartSeoGapAudit/1.0'
  });
  const rows = [];
  for (const url of input.urls) {
    const page = await context.newPage();
    const consoleMessages = [];
    const failedRequests = [];
    page.on('console', msg => { if (['error', 'warning'].includes(msg.type())) consoleMessages.push({type: msg.type(), text: msg.text().slice(0, 220)}); });
    page.on('requestfailed', req => failedRequests.push({url: req.url().slice(0, 180), error: req.failure()?.errorText || 'unknown'}));
    let status = null, audit = {};
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      status = response ? response.status() : null;
      audit = await page.evaluate(() => {
        const text = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null;
        const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content') || null;
        const links = [...document.querySelectorAll('a[href]')].map(a => a.href);
        const internal = links.filter(href => { try { return new URL(href).hostname === location.hostname; } catch { return false; } });
        return {
          title: document.title,
          canonical,
          robots,
          h1: [...document.querySelectorAll('h1')].map(h => h.innerText.trim()).filter(Boolean),
          h2Count: document.querySelectorAll('h2').length,
          wordCount: text ? text.split(/\s+/).length : 0,
          internalLinkCount: internal.length,
          uniqueInternalLinkCount: new Set(internal.map(href => {
            const u = new URL(href);
            return `${u.origin}${u.pathname.replace(/\/+$/, '') || '/'}${u.search}`;
          })).size,
          schemaCount: document.querySelectorAll('script[type="application/ld+json"]').length,
          buttons: [...document.querySelectorAll('button,a,[role="button"]')].map(el => ({
            tag: el.tagName.toLowerCase(),
            text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 80),
            href: el.getAttribute('href') || null,
            disabled: Boolean(el.disabled || el.getAttribute('aria-disabled') === 'true'),
          })).slice(0, 80),
          dynamicTextSample: text.slice(0, 800),
        };
      });
    } catch (error) {
      audit.error = error.message;
    }
    rows.push({ inputUrl: url, finalUrl: page.url(), status, ...audit, consoleMessages: consoleMessages.slice(0, 12), failedRequests: failedRequests.slice(0, 12) });
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(out, JSON.stringify({available: true, rows}, null, 2));
})().catch(error => {
  fs.writeFileSync(out, JSON.stringify({available: false, rows: [], errors: [error.message]}, null, 2));
  process.exit(0);
});
"""
    with tempfile.TemporaryDirectory() as tmp:
        script = Path(tmp) / "render.js"
        input_file = Path(tmp) / "input.json"
        output_file = Path(tmp) / "out.json"
        script.write_text(js)
        input_file.write_text(json.dumps({"urls": urls}))
        subprocess.run(["node", str(script), str(input_file), str(output_file)], cwd=str(REPO.parent), check=False, timeout=240)
        if output_file.exists():
            return json.loads(output_file.read_text())
    return {"available": False, "rows": [], "errors": ["render helper produced no output"]}


def expected_ctr(position: float) -> float:
    for upper, ctr in EXPECTED_CTR:
        if position <= upper:
            return ctr
    return 0.003


def join_ga4_by_path(rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    joined: dict[str, dict[str, Any]] = defaultdict(lambda: {
        "sessions": 0.0,
        "views": 0.0,
        "conversions": 0.0,
        "revenue": 0.0,
        "_engagement_rate_sessions": 0.0,
        "_bounce_rate_sessions": 0.0,
        "_avg_duration_sessions": 0.0,
    })
    for row in rows:
        path = normalize_path(row.get("path", ""))
        item = joined[path]
        sessions = row["sessions"]
        item["sessions"] += sessions
        item["views"] += row["views"]
        item["conversions"] += row["conversions"]
        item["revenue"] += row["revenue"]
        item["_engagement_rate_sessions"] += row.get("engagement_rate", 0.0) * sessions
        item["_bounce_rate_sessions"] += row.get("bounce_rate", 0.0) * sessions
        item["_avg_duration_sessions"] += row.get("avg_session_duration", 0.0) * sessions
    out = {}
    for path, item in joined.items():
        sessions = max(item["sessions"], 1)
        out[path] = {
            "sessions": round(item["sessions"], 3),
            "views": round(item["views"], 3),
            "conversions": round(item["conversions"], 3),
            "revenue": round(item["revenue"], 3),
            "engagement_rate": round(item["_engagement_rate_sessions"] / sessions, 5),
            "bounce_rate": round(item["_bounce_rate_sessions"] / sessions, 5),
            "avg_session_duration": round(item["_avg_duration_sessions"] / sessions, 3),
        }
    return out


def click_gap(pages: list[dict[str, Any]], ga4_by_path: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    gaps = []
    for page in pages:
        impressions = float(page.get("impressions", 0))
        if impressions < 50:
            continue
        exp_ctr = expected_ctr(float(page.get("position", 99)))
        expected_clicks = impressions * exp_ctr
        gap = expected_clicks - float(page.get("clicks", 0))
        if gap < 10:
            continue
        gaps.append({
            **page,
            "expected_ctr": round(exp_ctr, 5),
            "expected_clicks": round(expected_clicks, 2),
            "click_gap": round(gap, 2),
            "ga4": ga4_by_path.get(page["path"], {}),
        })
    return sorted(gaps, key=lambda x: -x["click_gap"])


def decay(current_rows: list[dict[str, Any]], compare_rows: list[dict[str, Any]], key: str, ga4_by_path: dict[str, dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    current = {r[key]: r for r in current_rows}
    compare = {r[key]: r for r in compare_rows}
    out = []
    for k, prev in compare.items():
        curr = current.get(k)
        if not curr:
            curr = {key: k, "clicks": 0, "impressions": 0, "ctr": 0, "position": 99, "segment": page_type(k) if key in {"path", "page"} else "unknown"}
        click_loss = float(prev.get("clicks", 0)) - float(curr.get("clicks", 0))
        impr_loss = float(prev.get("impressions", 0)) - float(curr.get("impressions", 0))
        if click_loss < 5 and impr_loss < 100:
            continue
        item = {
            key: k,
            "segment": curr.get("segment") or prev.get("segment"),
            "current_clicks": curr.get("clicks", 0),
            "previous_clicks": prev.get("clicks", 0),
            "click_loss": round(click_loss, 3),
            "current_impressions": curr.get("impressions", 0),
            "previous_impressions": prev.get("impressions", 0),
            "impression_loss": round(impr_loss, 3),
            "current_position": curr.get("position"),
            "previous_position": prev.get("position"),
        }
        if ga4_by_path and key in {"path", "page"}:
            item["ga4"] = ga4_by_path.get(k, {})
        out.append(item)
    return sorted(out, key=lambda x: (-x["click_loss"], -x["impression_loss"]))


def update_impact(gsc: dict[str, Any], args: argparse.Namespace) -> list[dict[str, Any]]:
    if args.no_api or not gsc.get("available") or gsc.get("source") != "searchconsole_api":
        return [{"name": u["name"], "status": "not_run", "reason": "GSC API unavailable or skipped"} for u in GOOGLE_UPDATES]
    try:
        service = get_gsc_service()
        site = get_gsc_site(service)
    except Exception as exc:
        return [{"name": u["name"], "status": "not_run", "reason": f"GSC API unavailable for update windows: {exc}"} for u in GOOGLE_UPDATES]
    impacts = []
    now_end = dt.date.fromisoformat(gsc["current"]["period"]["end"])
    for update in GOOGLE_UPDATES:
        start = dt.date.fromisoformat(update["start"])
        end = dt.date.fromisoformat(update["end"]) if update["end"] else start
        post_start = end + dt.timedelta(days=1)
        post_end = end + dt.timedelta(days=14)
        pre = Period(start - dt.timedelta(days=14), start - dt.timedelta(days=1))
        if post_end > now_end:
            impacts.append({**update, "status": "insufficient_post_data", "pre_period": pre.label(), "post_period": f"{post_start.isoformat()} to {post_end.isoformat()}"})
            continue
        try:
            pre_pages = merge_page_rows(gsc_query(service, site, pre, ["page"], args.gsc_row_limit))
            post_pages = merge_page_rows(gsc_query(service, site, Period(post_start, post_end), ["page"], args.gsc_row_limit))
            pre_summary = summarize_gsc(pre_pages, [])
            post_summary = summarize_gsc(post_pages, [])
            impacts.append({
                **update,
                "status": "measured",
                "pre_period": pre.label(),
                "post_period": Period(post_start, post_end).label(),
                "pre_clicks": pre_summary["total_clicks"],
                "post_clicks": post_summary["total_clicks"],
                "click_delta_pct": delta_pct(post_summary["total_clicks"], pre_summary["total_clicks"]),
                "pre_impressions": pre_summary["total_impressions"],
                "post_impressions": post_summary["total_impressions"],
                "impression_delta_pct": delta_pct(post_summary["total_impressions"], pre_summary["total_impressions"]),
                "top_page_losses": decay(post_pages, pre_pages, "path", {})[:10],
            })
        except Exception as exc:
            impacts.append({**update, "status": "error", "error": str(exc)})
    return impacts


def load_agentic_by_slug() -> dict[str, dict[str, Any]]:
    out = {}
    if not AGENTIC_FILE.exists():
        return out
    for line in AGENTIC_FILE.read_text().splitlines():
        if line.strip():
            data = json.loads(line)
            out[data.get("slug", "")] = data
    return out


def content_usefulness(static_rows: list[dict[str, Any]], page_queries: list[dict[str, Any]], ga4_by_path: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    query_count: dict[str, set[str]] = defaultdict(set)
    for row in page_queries:
        query_count[row["page"]].add(row["query"])
    out = []
    for row in static_rows:
        path = row.get("path")
        if not path or row.get("status") != 200:
            continue
        ga4 = ga4_by_path.get(path, {})
        words = row.get("word_count", 0)
        duration = ga4.get("avg_session_duration", 0)
        wpm_consumed = round(words / max(duration / 60, 0.1), 1) if duration else None
        flags = []
        if words < 120 and page_type(path) in {"blog", "category", "concern", "ingredient"}:
            flags.append("thin_rendered_text")
        if duration and wpm_consumed and wpm_consumed > 800:
            flags.append("unlikely_content_consumption")
        if ga4.get("sessions", 0) >= 10 and ga4.get("bounce_rate", 0) > 0.65:
            flags.append("high_bounce")
        if row.get("unique_internal_link_count", 0) < 8 and page_type(path) in {"blog", "category", "concern", "ingredient"}:
            flags.append("weak_internal_links")
        if flags:
            out.append({
                "path": path,
                "segment": row.get("segment"),
                "word_count": words,
                "estimated_reading_seconds": row.get("estimated_reading_seconds"),
                "ga4": ga4,
                "wpm_consumed": wpm_consumed,
                "query_count": len(query_count.get(path, set())),
                "internal_links": row.get("unique_internal_link_count"),
                "flags": flags,
            })
    return sorted(out, key=lambda x: (-(x.get("ga4", {}).get("sessions", 0)), x["word_count"]))


def index_performance(sitemap_urls: list[str], current_pages: list[dict[str, Any]], static_rows: list[dict[str, Any]]) -> dict[str, Any]:
    sitemap_paths = {clean_path(u) for u in sitemap_urls}
    gsc_paths = {p["path"] for p in current_pages}
    crawl_by_path = {r.get("path"): r for r in static_rows if r.get("path")}
    dead_sitemap = [p for p in sitemap_paths if crawl_by_path.get(p, {}).get("status", 200) >= 400]
    gsc_not_sitemap = sorted(gsc_paths - sitemap_paths)[:100]
    sitemap_no_gsc_sample = sorted(sitemap_paths - gsc_paths)[:100]
    weak = [
        p for p in current_pages
        if p.get("impressions", 0) < 5 and page_type(p["path"]) in {"product", "category", "blog", "brand"}
    ][:100]
    non_200_crawl = [r for r in static_rows if r.get("status") and r["status"] >= 300]
    return {
        "sitemap_url_count": len(sitemap_paths),
        "gsc_page_count": len(gsc_paths),
        "owner_gsc_page_indexing_evidence": OWNER_GSC_INDEXING_EVIDENCE,
        "owner_gsc_page_indexing_total_rows_visible": sum(row["pages"] for row in OWNER_GSC_INDEXING_EVIDENCE["rows"]),
        "gsc_urls_not_in_sitemap_sample": gsc_not_sitemap,
        "sitemap_urls_without_gsc_sample": sitemap_no_gsc_sample,
        "dead_sitemap_sample": dead_sitemap[:50],
        "weak_gsc_urls_sample": weak,
        "non_200_crawl": non_200_crawl,
    }


def high_impact_proposals(analysis: dict[str, Any]) -> list[dict[str, Any]]:
    proposals = []
    click_gaps = analysis["click_gap"][:10]
    if click_gaps:
        gap_sum = sum(x["click_gap"] for x in click_gaps)
        proposals.append({
            "id": "SEO-GAP-1",
            "title": "Resolve highest non-brand CTR/click gaps",
            "owner": "[X]+[C]",
            "status": "proposed",
            "evidence": f"Top 10 URLs show ~{gap_sum:.0f} estimated missing clicks in the current 90-day GSC window.",
            "next_action": "Review title/meta intent fit for listed URLs, then propose page-specific changes through the existing title/content review gates.",
        })
    decays = analysis["decaying_pages_yoy"][:10]
    if decays:
        loss = sum(max(0, x.get("click_loss", 0)) for x in decays)
        proposals.append({
            "id": "SEO-GAP-2",
            "title": "Triage YoY decaying pages with measurable click loss",
            "owner": "[X]+[C]",
            "status": "proposed",
            "evidence": f"Top 10 decaying URLs lost {loss:.0f} clicks YoY in the same-period 90-day comparison.",
            "next_action": "Classify each loss as ranking slip, CTR decline, query loss, inventory mismatch, or content freshness gap before changing copy.",
        })
    content = analysis["content_usefulness"][:10]
    if content:
        proposals.append({
            "id": "SEO-GAP-3",
            "title": "Join content usefulness signals into SEO action ledger",
            "owner": "[X]",
            "status": "proposed",
            "evidence": f"{len(content)} crawled URLs have high-impact usefulness flags from word count, engagement, consumption speed, or internal links.",
            "next_action": "Promote only URLs with GSC/GA4 impact into the durable SEO ledger; do not mass rewrite low-traffic pages.",
        })
    index = analysis["index_performance"]
    crawled_not_indexed = next((row["pages"] for row in OWNER_GSC_INDEXING_EVIDENCE["rows"] if row["reason"] == "Crawled - currently not indexed"), 0)
    if index["gsc_urls_not_in_sitemap_sample"] or index["non_200_crawl"] or crawled_not_indexed >= 1000:
        proposals.append({
            "id": "SEO-GAP-4",
            "title": "Refresh technical SEO control loop for sitemap/index/crawl drift",
            "owner": "[C]",
            "status": "proposed",
            "evidence": f"GSC UI shows {crawled_not_indexed:,} Crawled-currently-not-indexed URLs; audit sample also found {len(index['gsc_urls_not_in_sitemap_sample'])} GSC-not-sitemap URLs and {len(index['non_200_crawl'])} non-200 crawl samples.",
            "next_action": "Fold these checks into SEO-ORCH-3 rather than making one-off route changes.",
        })
    return proposals


def render_markdown(result: dict[str, Any]) -> str:
    analysis = result["analysis"]
    gsc = result["data_sources"]["gsc"]
    ga4 = result["data_sources"]["ga4"]
    lines = [
        "# Fresh SEO Data-Gap Audit",
        "",
        f"- Generated: {result['generated_at']}",
        f"- Current window: {result['periods']['current']}",
        f"- YoY window: {result['periods']['yoy']}",
        f"- Previous-period window: {result['periods']['previous']}",
        "- Mode: read-only; no WordPress/Woo writes, deploy, PM2 restart, or TASKS.md edit.",
        "",
        "## Data Sources",
        f"- GSC: {gsc.get('source')} available={gsc.get('available')} errors={len(gsc.get('errors', []))}",
        f"- GA4: {ga4.get('source')} available={ga4.get('available')} rows={ga4.get('rows_count', len(ga4.get('rows', [])))} errors={len(ga4.get('errors', []))}",
        f"- Sitemap crawl: {result['data_sources']['sitemap'].get('url_count', 0)} sitemap URLs",
        f"- Static crawl pages: {len(result['crawl']['static_pages'])}",
        f"- Render crawl: available={result['crawl']['render'].get('available')} rows={len(result['crawl']['render'].get('rows', []))}",
        "",
        "## Already Covered In Last 15 Days",
    ]
    for item in result["coverage"]["covered_recently"]:
        lines.append(f"- {item}")
    lines.extend(["", "## Refresh Findings"])
    if gsc.get("current", {}).get("summary"):
        summary = gsc["current"]["summary"]
        lines.append(f"- Current GSC: {summary.get('total_clicks', 0):.0f} clicks, {summary.get('total_impressions', 0):.0f} impressions, CTR {pct(summary.get('avg_ctr', 0))}.")
    if gsc.get("yoy", {}).get("summary"):
        curr = gsc["current"]["summary"]
        yoy = gsc["yoy"]["summary"]
        lines.append(f"- YoY clicks: {yoy.get('total_clicks', 0):.0f} -> {curr.get('total_clicks', 0):.0f}; impressions: {yoy.get('total_impressions', 0):.0f} -> {curr.get('total_impressions', 0):.0f}.")
    if ga4.get("summary"):
        lines.append(f"- GA4 joined rows: {ga4['summary'].get('rows', 0)}, sessions {ga4['summary'].get('sessions', 0):.0f}, conversions {ga4['summary'].get('conversions', 0):.0f}.")
    lines.extend(["", "## Top Click Gaps"])
    for row in analysis["click_gap"][:15]:
        lines.append(f"- `{row['path']}` ({row['segment']}): gap {row['click_gap']:.1f} clicks, pos {row['position']}, CTR {pct(row['ctr'])}, expected {pct(row['expected_ctr'])}.")
    lines.extend(["", "## Top YoY Decaying Pages"])
    for row in analysis["decaying_pages_yoy"][:15]:
        lines.append(f"- `{row['path']}` ({row.get('segment')}): clicks {row['previous_clicks']} -> {row['current_clicks']} (loss {row['click_loss']}); impressions loss {row['impression_loss']}.")
    lines.extend(["", "## Top YoY Decaying Queries"])
    for row in analysis["decaying_queries_yoy"][:15]:
        lines.append(f"- `{row['query']}`: clicks {row['previous_clicks']} -> {row['current_clicks']} (loss {row['click_loss']}); impressions loss {row['impression_loss']}.")
    lines.extend(["", "## Google Update Impact"])
    for item in analysis["google_update_impact"]:
        if item.get("status") == "measured":
            lines.append(f"- {item['name']}: clicks {item['pre_clicks']} -> {item['post_clicks']} ({pct(item['click_delta_pct'] or 0)}), impressions {item['pre_impressions']} -> {item['post_impressions']} ({pct(item['impression_delta_pct'] or 0)}).")
        else:
            lines.append(f"- {item['name']}: {item.get('status')} ({item.get('reason') or item.get('post_period') or item.get('error', '')}).")
    lines.extend(["", "## Content Usefulness Flags"])
    for row in analysis["content_usefulness"][:15]:
        lines.append(f"- `{row['path']}`: {row['word_count']} words, {row.get('ga4', {}).get('avg_session_duration', 0)}s avg session, WPM proxy {row['wpm_consumed']}, flags={', '.join(row['flags'])}.")
    lines.extend(["", "## Index / Crawl Performance"])
    idx = analysis["index_performance"]
    lines.append(f"- Sitemap URLs: {idx['sitemap_url_count']}; GSC page rows: {idx['gsc_page_count']}.")
    lines.append(f"- GSC-not-sitemap sample: {len(idx['gsc_urls_not_in_sitemap_sample'])}; sitemap-no-GSC sample: {len(idx['sitemap_urls_without_gsc_sample'])}; non-200 crawl samples: {len(idx['non_200_crawl'])}.")
    lines.append(f"- Owner-provided GSC Page Indexing visible rows total: {idx['owner_gsc_page_indexing_total_rows_visible']:,}.")
    for row in idx["owner_gsc_page_indexing_evidence"]["rows"]:
        lines.append(f"- GSC UI `{row['reason']}`: {row['pages']:,} pages, validation {row['validation']}, source {row['source']}.")
    lines.extend(["", "## API / Scope Limits"])
    for item in result["coverage"]["uncovered_external"]:
        lines.append(f"- {item}")
    lines.extend(["", "## Proposed Task-Board Rows"])
    if result["taskboard_proposals"]:
        for prop in result["taskboard_proposals"]:
            lines.append(f"- **{prop['id']}** {prop['title']} — {prop['evidence']} Next: {prop['next_action']}")
    else:
        lines.append("- No high-impact task-board proposals met threshold.")
    lines.append("")
    return "\n".join(lines)


def render_proposals(proposals: list[dict[str, Any]], result: dict[str, Any]) -> str:
    lines = [
        "# SEO Gap Audit — Task Board Proposals",
        "",
        "Review-batched proposals only. Do not paste into `workspace/TASKS.md` without owner/agent review.",
        "",
        "| ID | Proposed task | Owner | Status | Evidence | Next action |",
        "|---|---|---|---|---|---|",
    ]
    for p in proposals:
        lines.append(f"| {p['id']} | {p['title']} | {p['owner']} | 🔲 proposed | {p['evidence']} | {p['next_action']} |")
    if not proposals:
        lines.append("| — | No high-impact proposal met threshold | — | — | — | — |")
    lines.extend([
        "",
        "Source audit:",
        f"- `{result['outputs']['json']}`",
        f"- `{result['outputs']['markdown']}`",
        "",
    ])
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    current, yoy, previous = periods(args.days, args.end_date)
    stamp = args.stamp or today().strftime("%Y%m%d")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    sitemap_urls, sitemap_info = extract_sitemap_urls()
    gsc = fetch_gsc_periods(args, current, yoy, previous)
    ga4 = fetch_ga4(args, current)
    current_pages = gsc.get("current", {}).get("pages", [])
    current_page_queries = gsc.get("current", {}).get("page_queries", [])
    ga4_by_path = join_ga4_by_path(ga4.get("rows", []))
    crawl_urls = select_crawl_urls(sitemap_urls, current_pages, args.crawl_limit_per_segment)
    static_pages = run_static_crawl(crawl_urls)
    render_urls = crawl_urls[:args.render_limit]
    render = {"available": False, "rows": [], "errors": ["--no-render set"]} if args.no_render else run_render_crawl(render_urls)

    analysis = {
        "brand_nonbrand": {
            "current_queries": summarize_by(gsc.get("current", {}).get("queries", []), "query_class"),
            "current_page_queries": summarize_by(current_page_queries, "query_class"),
        },
        "segment_performance": gsc.get("current", {}).get("summary", {}).get("segments", {}),
        "click_gap": click_gap([p for p in current_pages if not any(is_brand_query(q.get("query", "")) for q in current_page_queries if q.get("page") == p.get("path"))], ga4_by_path),
        "decaying_pages_yoy": decay(current_pages, gsc.get("yoy", {}).get("pages", []), "path", ga4_by_path),
        "decaying_pages_previous": decay(current_pages, gsc.get("previous", {}).get("pages", []), "path", ga4_by_path),
        "decaying_queries_yoy": decay(gsc.get("current", {}).get("queries", []), gsc.get("yoy", {}).get("queries", []), "query"),
        "google_update_impact": update_impact(gsc, args),
        "index_performance": index_performance(sitemap_urls, current_pages, static_pages),
        "content_usefulness": content_usefulness(static_pages, current_page_queries, ga4_by_path),
        "agentic_score_summary": summarize_agentic(load_agentic_by_slug()),
    }
    proposals = high_impact_proposals(analysis)
    result: dict[str, Any] = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "periods": {"current": current.label(), "yoy": yoy.label(), "previous": previous.label()},
        "coverage": {
            "covered_recently": [
                "SEO data contract and full-catalog agentic scoring: covered 2026-06-25.",
                "GA4 product export and Social Engine performance import: covered 2026-06-25.",
                "Storefront visual safety audit: covered 2026-06-25.",
                "Trust-data contract: covered 2026-06-25.",
            ],
            "refreshed_now": [
                "Technical crawl/render checks.",
                "Canonical/query parameter/status/header checks through sampled live crawl.",
                "Title/meta CTR gap export through GSC click-gap analysis.",
                "Index weak/dead URL proxy through sitemap/GSC/crawl joins.",
                "Content decay joined to word count, internal links, and GA4 engagement where available.",
                "SEO measurement loop join of GSC + GA4 for audited URLs.",
            ],
            "uncovered_external": [
                "GSC URL Inspection API is not used for DOM; rendered DOM comes from Playwright.",
                "URL Inspection/Crawl Stats require a separate quota-aware phase if owner wants per-URL coverage reasons at scale.",
                "Backlinks, topical trust flow, PBN/network checks, lost links, disavow, and OBL context require Ahrefs/Serpstat/external-link phase approval.",
                "Heat/click/scroll maps require a behavior analytics provider; GA4 engagement is used as the available proxy.",
            ],
        },
        "data_sources": {"gsc": scrub_large(gsc), "ga4": scrub_large(ga4), "sitemap": sitemap_info},
        "crawl": {"static_pages": static_pages, "render": render},
        "analysis": analysis,
        "taskboard_proposals": proposals,
        "outputs": {},
    }

    json_path = OUT_DIR / f"seo-gap-audit-{stamp}.json"
    md_path = OUT_DIR / f"seo-gap-audit-{stamp}.md"
    proposals_path = OUT_DIR / f"seo-gap-taskboard-proposals-{stamp}.md"
    result["outputs"] = {
        "json": str(json_path.relative_to(REPO.parent)),
        "markdown": str(md_path.relative_to(REPO.parent)),
        "taskboard_proposals": str(proposals_path.relative_to(REPO.parent)),
    }
    json_path.write_text(json.dumps(result, indent=2, ensure_ascii=False))
    md_path.write_text(render_markdown(result))
    proposals_path.write_text(render_proposals(proposals, result))
    print(json.dumps({
        "json": result["outputs"]["json"],
        "markdown": result["outputs"]["markdown"],
        "taskboard_proposals": result["outputs"]["taskboard_proposals"],
        "gsc_source": gsc.get("source"),
        "ga4_source": ga4.get("source"),
        "static_pages": len(static_pages),
        "render_available": render.get("available"),
        "proposals": len(proposals),
    }, indent=2))
    return 0


def summarize_agentic(rows: dict[str, dict[str, Any]]) -> dict[str, Any]:
    tiers = count_by([str(row.get("tier", "unknown")) for row in rows.values()])
    return {"rows": len(rows), "tiers": tiers}


def scrub_large(source: dict[str, Any]) -> dict[str, Any]:
    out = dict(source)
    for key in ("rows",):
        if key in out:
            out[f"{key}_count"] = len(out[key])
            out.pop(key)
    for key in ("current", "yoy", "previous"):
        if isinstance(out.get(key), dict):
            item = dict(out[key])
            for large_key in ("pages", "page_queries", "queries"):
                if large_key in item:
                    item[f"{large_key}_count"] = len(item[large_key])
                    item[f"{large_key}_sample"] = item[large_key][:25]
                    item.pop(large_key)
            out[key] = item
    return out


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(130)
