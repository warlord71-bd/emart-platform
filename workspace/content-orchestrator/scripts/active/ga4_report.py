#!/usr/bin/env python3
"""GA4 SEO intelligence report for Emart.
Usage: python3 ga4_report.py [days]    (default: 14)
"""

import os, sys

os.environ.setdefault(
    "GOOGLE_APPLICATION_CREDENTIALS",
    "/root/.config/gcloud/emart-ga4-reader.json",
)

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest, DateRange, Dimension, Metric, OrderBy,
    FilterExpression, Filter,
)

PROPERTY = "properties/310219799"
DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 14

client = BetaAnalyticsDataClient()

def run(dimensions, metrics, limit=30, dim_filter=None, order_metric="sessions", order_dim=None):
    if order_dim:
        ob = [OrderBy(dimension=OrderBy.DimensionOrderBy(dimension_name=order_dim))]
    else:
        ob = [OrderBy(metric=OrderBy.MetricOrderBy(metric_name=order_metric), desc=True)]
    return client.run_report(RunReportRequest(
        property=PROPERTY,
        date_ranges=[DateRange(start_date=f"{DAYS}daysAgo", end_date="yesterday")],
        dimensions=[Dimension(name=d) for d in dimensions],
        metrics=[Metric(name=m) for m in metrics],
        dimension_filter=dim_filter,
        order_bys=ob,
        limit=limit,
    ))

def country_filter(country):
    return FilterExpression(filter=Filter(
        field_name="country",
        string_filter=Filter.StringFilter(value=country),
    ))

def channel_filter(channel):
    return FilterExpression(filter=Filter(
        field_name="sessionDefaultChannelGroup",
        string_filter=Filter.StringFilter(value=channel),
    ))

def pct(v): return f"{float(v)*100:.0f}%"
def secs(v): return f"{float(v):.0f}s"
def hdr(title): print(f"\n{'='*70}\n  {title} (last {DAYS} days)\n{'='*70}")

# ── 1. Daily sessions ────────────────────────────────────────────────
hdr("DAILY SESSIONS")
r = run(["date"], ["sessions","activeUsers","newUsers"],
        limit=DAYS+1, order_dim="date")
rows = r.rows
print(f"{'Date':<12} {'Sess':>7} {'Users':>7} {'New':>7}")
print("-"*36)
for row in rows:
    d = row.dimension_values[0].value
    print(f"{d[:4]}-{d[4:6]}-{d[6:]:<6} {row.metric_values[0].value:>7} "
          f"{row.metric_values[1].value:>7} {row.metric_values[2].value:>7}")

# ── 2. Channels (all countries) ──────────────────────────────────────
hdr("CHANNELS — ALL")
r = run(["sessionDefaultChannelGroup"],
        ["sessions","activeUsers","engagementRate","conversions"])
print(f"{'Channel':<25} {'Sess':>7} {'Users':>7} {'Eng%':>6} {'Conv':>6}")
print("-"*55)
for row in r.rows:
    print(f"{row.dimension_values[0].value:<25} {row.metric_values[0].value:>7} "
          f"{row.metric_values[1].value:>7} {pct(row.metric_values[2].value):>6} "
          f"{row.metric_values[3].value:>6}")

# ── 3. Channels (Bangladesh only) ───────────────────────────────────
hdr("CHANNELS — BANGLADESH ONLY")
r = run(["sessionDefaultChannelGroup"],
        ["sessions","activeUsers","engagementRate","conversions"],
        dim_filter=country_filter("Bangladesh"))
print(f"{'Channel':<25} {'Sess':>7} {'Users':>7} {'Eng%':>6} {'Conv':>6}")
print("-"*55)
for row in r.rows:
    print(f"{row.dimension_values[0].value:<25} {row.metric_values[0].value:>7} "
          f"{row.metric_values[1].value:>7} {pct(row.metric_values[2].value):>6} "
          f"{row.metric_values[3].value:>6}")

# ── 4. Countries ─────────────────────────────────────────────────────
hdr("TOP COUNTRIES")
r = run(["country"], ["sessions","activeUsers","engagementRate"], limit=15)
print(f"{'Country':<25} {'Sess':>7} {'Users':>7} {'Eng%':>6}")
print("-"*48)
for row in r.rows:
    print(f"{row.dimension_values[0].value:<25} {row.metric_values[0].value:>7} "
          f"{row.metric_values[1].value:>7} {pct(row.metric_values[2].value):>6}")

# ── 5. Devices ───────────────────────────────────────────────────────
hdr("DEVICES")
r = run(["deviceCategory"],
        ["sessions","engagementRate","averageSessionDuration","conversions"])
print(f"{'Device':<12} {'Sess':>7} {'Eng%':>6} {'AvgSec':>7} {'Conv':>6}")
print("-"*42)
for row in r.rows:
    print(f"{row.dimension_values[0].value:<12} {row.metric_values[0].value:>7} "
          f"{pct(row.metric_values[1].value):>6} {secs(row.metric_values[2].value):>7} "
          f"{row.metric_values[3].value:>6}")

# ── 6. Top organic landing pages ─────────────────────────────────────
hdr("TOP ORGANIC SEARCH LANDING PAGES")
r = run(["landingPage"],
        ["sessions","engagementRate","averageSessionDuration","conversions"],
        dim_filter=channel_filter("Organic Search"))
print(f"{'Page':<50} {'Sess':>5} {'Eng%':>6} {'Dur':>6} {'Conv':>5}")
print("-"*76)
for row in r.rows:
    print(f"{row.dimension_values[0].value[:49]:<50} {row.metric_values[0].value:>5} "
          f"{pct(row.metric_values[1].value):>6} {secs(row.metric_values[2].value):>6} "
          f"{row.metric_values[3].value:>5}")

# ── 7. Top AI assistant landing pages ────────────────────────────────
hdr("TOP AI ASSISTANT LANDING PAGES")
r = run(["landingPage"],
        ["sessions","engagementRate","averageSessionDuration"],
        dim_filter=channel_filter("AI Assistant"))
print(f"{'Page':<50} {'Sess':>5} {'Eng%':>6} {'Dur':>6}")
print("-"*70)
for row in r.rows:
    print(f"{row.dimension_values[0].value[:49]:<50} {row.metric_values[0].value:>5} "
          f"{pct(row.metric_values[1].value):>6} {secs(row.metric_values[2].value):>6}")

# ── 8. High-traffic pages with bounce problems ──────────────────────
hdr("PAGES WITH HIGH BOUNCE (>50%, ≥5 sessions)")
r = run(["landingPage"],
        ["sessions","bounceRate","engagementRate","averageSessionDuration"],
        limit=50)
print(f"{'Page':<50} {'Sess':>5} {'Bnc%':>6} {'Eng%':>6} {'Dur':>6}")
print("-"*76)
for row in r.rows:
    sess = int(row.metric_values[0].value)
    bounce = float(row.metric_values[1].value)
    if sess >= 5 and bounce > 0.50:
        print(f"{row.dimension_values[0].value[:49]:<50} {sess:>5} "
              f"{pct(row.metric_values[1].value):>6} {pct(row.metric_values[2].value):>6} "
              f"{secs(row.metric_values[3].value):>6}")

# ── 9. Top events ────────────────────────────────────────────────────
hdr("TOP EVENTS")
r = run(["eventName"], ["eventCount"], limit=15, order_metric="eventCount")
print(f"{'Event':<35} {'Count':>8}")
print("-"*45)
for row in r.rows:
    print(f"{row.dimension_values[0].value:<35} {row.metric_values[0].value:>8}")

print(f"\n{'─'*70}")
print(f"  Report complete. Period: last {DAYS} days (excluding today)")
print(f"{'─'*70}")
