#!/usr/bin/env python3
"""Export GA4 product landing-page metrics for Social Engine scoring.

Default output is JSONL rows accepted by:
  python3 workspace/social-engine/social_engine.py import-performance --ga4 <file>

This script reads the GA4 service-account credential path from the same runtime
default used by ga4_report.py. It never prints credential values.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.parse
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parents[2]
DEFAULT_CREDENTIALS = "/root/.config/gcloud/emart-ga4-reader.json"
DEFAULT_PROPERTY = "properties/310219799"
DEFAULT_OUT = REPO / "social-engine/performance/ga4-product-latest.jsonl"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export GA4 /shop product landing-page metrics as JSONL")
    parser.add_argument("--days", type=int, default=28, help="Lookback window ending yesterday")
    parser.add_argument("--property", default=os.environ.get("GA4_PROPERTY", DEFAULT_PROPERTY))
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--limit", type=int, default=1000)
    parser.add_argument("--channel", default="", help="Optional sessionDefaultChannelGroup filter, e.g. Organic Search")
    parser.add_argument("--credentials", default=os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", DEFAULT_CREDENTIALS))
    parser.add_argument("--dry-run", action="store_true", help="Fetch and summarize without writing output")
    return parser.parse_args()


def slug_from_landing_page(value: str) -> str:
    path = urllib.parse.urlparse(value).path
    if not path.startswith("/shop/"):
        return ""
    slug = path.removeprefix("/shop/").strip("/")
    if not slug or "/" in slug:
        return ""
    return slug


def numeric(value: str) -> float:
    try:
        return float(value or 0)
    except ValueError:
        return 0.0


def build_filter(channel: str):
    from google.analytics.data_v1beta.types import Filter, FilterExpression, FilterExpressionList

    product_filter = FilterExpression(filter=Filter(
        field_name="landingPage",
        string_filter=Filter.StringFilter(match_type=Filter.StringFilter.MatchType.BEGINS_WITH, value="/shop/"),
    ))
    if not channel:
        return product_filter
    channel_filter = FilterExpression(filter=Filter(
        field_name="sessionDefaultChannelGroup",
        string_filter=Filter.StringFilter(value=channel),
    ))
    return FilterExpression(and_group=FilterExpressionList(expressions=[product_filter, channel_filter]))


def run_report(args: argparse.Namespace):
    os.environ.setdefault("GOOGLE_APPLICATION_CREDENTIALS", args.credentials)

    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import DateRange, Dimension, Metric, OrderBy, RunReportRequest

    client = BetaAnalyticsDataClient()
    return client.run_report(RunReportRequest(
        property=args.property,
        date_ranges=[DateRange(start_date=f"{args.days}daysAgo", end_date="yesterday")],
        dimensions=[Dimension(name="landingPage")],
        metrics=[
            Metric(name="sessions"),
            Metric(name="screenPageViews"),
            Metric(name="conversions"),
            Metric(name="purchaseRevenue"),
        ],
        dimension_filter=build_filter(args.channel),
        order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="sessions"), desc=True)],
        limit=args.limit,
    ))


def rows_from_report(report: Any, args: argparse.Namespace) -> list[dict[str, Any]]:
    exported_at = dt.datetime.now(dt.timezone.utc).isoformat()
    date_to = (dt.date.today() - dt.timedelta(days=1)).isoformat()
    date_from = (dt.date.today() - dt.timedelta(days=args.days)).isoformat()
    rows: list[dict[str, Any]] = []
    for row in report.rows:
        landing_page = row.dimension_values[0].value
        slug = slug_from_landing_page(landing_page)
        if not slug:
            continue
        sessions = numeric(row.metric_values[0].value)
        views = numeric(row.metric_values[1].value)
        conversions = numeric(row.metric_values[2].value)
        revenue = numeric(row.metric_values[3].value)
        rows.append({
            "slug": slug,
            "landing_page": landing_page,
            "path": re.sub(r"[?#].*$", "", landing_page),
            "sessions": sessions,
            "views": views,
            "conversions": conversions,
            "revenue": revenue,
            "date_from": date_from,
            "date_to": date_to,
            "channel": args.channel or "all",
            "source": "ga4_product_landing_pages",
            "exported_at": exported_at,
        })
    return rows


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows))


def main() -> int:
    args = parse_args()
    if args.days < 1:
        raise SystemExit("--days must be >= 1")
    report = run_report(args)
    rows = rows_from_report(report, args)
    if not args.dry_run:
        write_jsonl(args.out, rows)
    total_sessions = sum(row["sessions"] for row in rows)
    total_conversions = sum(row["conversions"] for row in rows)
    print(json.dumps({
        "dry_run": args.dry_run,
        "out": str(args.out),
        "rows": len(rows),
        "days": args.days,
        "channel": args.channel or "all",
        "sessions": round(total_sessions, 3),
        "conversions": round(total_conversions, 3),
    }, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        sys.exit(130)
