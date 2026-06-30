#!/usr/bin/env python3
"""
GSC Position Tracker + SEO Priority Queue for Emart.

Pulls daily search performance from Google Search Console API,
scores every product page by opportunity, enriches with Google Trends
and YouTube search trends, and writes a priority queue that integrates
with the existing seo-review pipeline and content humanizer.

Usage:
  python3 workspace/seo-review/gsc_tracker.py pull            # daily GSC snapshot
  python3 workspace/seo-review/gsc_tracker.py score           # score + priority queue
  python3 workspace/seo-review/gsc_tracker.py full            # pull + score + trends + propose-titles + actions
  python3 workspace/seo-review/gsc_tracker.py trends          # 7-day position deltas
  python3 workspace/seo-review/gsc_tracker.py blog-gaps       # content gaps → blog topics
  python3 workspace/seo-review/gsc_tracker.py search-trends   # Google+YouTube trend signals
  python3 workspace/seo-review/gsc_tracker.py completed-registry # refresh completed humanizer registry
  python3 workspace/seo-review/gsc_tracker.py agentic-score # full-catalog deterministic product scoring
  python3 workspace/seo-review/gsc_tracker.py humanizer-queue # prioritized humanizer targets
  python3 workspace/seo-review/gsc_tracker.py propose-titles  # propose title fixes (read-only)
  python3 workspace/seo-review/gsc_tracker.py review-titles   # print pending title queue
  python3 workspace/seo-review/gsc_tracker.py apply-titles    # write approved titles to Woo

Outputs:
  gsc-daily/YYYY-MM-DD.json        — raw GSC page+query data
  priority-queue.json               — top opportunities ranked by score
  position-trends.json              — 7-day movers (up/down)
  blog-topic-candidates.json        — queries with impressions but no matching page
  search-trends.json                — Google Trends + YouTube trend data for top queries
  ../humanizer/completed-content-registry.json — products already humanized
  humanizer-queue.json              — products needing description humanization, by priority
  title_fixes_pending.json          — proposed title changes awaiting review

Integrates with:
  agentic-score.jsonl               — merges on-page SEO score with search position
  content-gaps.jsonl                — feeds blog generator topic selection
  internal_seo_tool.py              — shared Qdrant/product infrastructure
  humanizer_face_cleansers.py       — content humanizer pipeline
  blog_generator.py                 — topic selection from search gaps
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httplib2
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_httplib2 import AuthorizedHttp
from googleapiclient.discovery import build

# ── Config ────────────────────────────────────────────────────────────────────

KEY_FILE   = "/root/.gmc/service-account.json"
TOKEN_FILE = "/root/.gmc/gsc_token.json"
SCOPES     = ["https://www.googleapis.com/auth/webmasters.readonly"]
SITE_URL   = "https://e-mart.com.bd"

OUTPUT_DIR        = Path("workspace/seo-review")
DAILY_DIR         = OUTPUT_DIR / "gsc-daily"
QUEUE_FILE        = OUTPUT_DIR / "priority-queue.json"
TRENDS_FILE       = OUTPUT_DIR / "position-trends.json"
BLOG_FILE         = OUTPUT_DIR / "blog-topic-candidates.json"
SEARCH_TRENDS_FILE = OUTPUT_DIR / "search-trends.json"
HUMANIZER_FILE    = OUTPUT_DIR / "humanizer-queue.json"
AGENTIC_FILE      = OUTPUT_DIR / "agentic-score.jsonl"

HUMANIZER_DIR     = Path("workspace/humanizer")
COMPLETED_REGISTRY_FILE = HUMANIZER_DIR / "completed-content-registry.json"
HUMANIZER_BATCHES = [
    HUMANIZER_DIR / "face-cleansers/active/current-batch.jsonl",
    HUMANIZER_DIR / "face-cleansers/archive/batches/batch-2026-06-01.jsonl",
    HUMANIZER_DIR / "face-cleansers/archive/batches/batch-2026-05-31.jsonl",
    HUMANIZER_DIR / "impression-priority/active/impression-priority-2026-06-05.jsonl",
]
WP_PATH           = os.environ.get("WP_PATH", "/var/www/wordpress")

PRODUCT_PREFIX = "/shop/"
BLOG_PREFIX    = "/blog/"
BEST_PREFIX    = "/best/"

TRENDS_GEO     = "BD"
TRENDS_TIMEFRAME = "today 3-m"
TRENDS_MAX_QUERIES = 15  # top queries to check trends for (rate limit friendly)

BRAND_QUERY_PATTERNS = (
    "emart",
    "e mart",
    "e-mart",
    "emartbd",
    "emart bd",
    "emart skincare",
    "e mart bd",
    "e mart way",
    "us mart",
    "korea mart",
    "korean mart",
    "imarket",
    "emarrt",
    "dhaka e mart",
)

AGENTIC_WEIGHTS = {
    "locked_title": 8,
    "description_150_words_not_templated": 8,
    "gtin_or_identifier_exists_false": 12,
    "mpn_or_brand_product_id": 6,
    "offer_price_valid_until": 6,
    "concern_tags": 8,
    "key_ingredients": 6,
    "skin_type_or_use_case": 5,
    "size_volume": 4,
    "origin_country": 4,
    "brand": 3,
    "real_qna": 12,
    "related_substitute_links": 10,
    "routine_compatibility_care": 8,
}

# ── GSC Auth ──────────────────────────────────────────────────────────────────

def get_service():
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(TOKEN_FILE, "w") as f:
                f.write(creds.to_json())
        if creds and creds.valid:
            return build("searchconsole", "v1",
                         http=AuthorizedHttp(creds, httplib2.Http(timeout=60)),
                         cache_discovery=False)

    creds = service_account.Credentials.from_service_account_file(KEY_FILE, scopes=SCOPES)
    return build("searchconsole", "v1",
                 http=AuthorizedHttp(creds, httplib2.Http(timeout=60)),
                 cache_discovery=False)

def get_site(svc):
    result = svc.sites().list().execute()
    sites = result.get("siteEntry", [])
    for s in sites:
        if s.get("siteUrl", "").startswith("sc-domain:"):
            return s["siteUrl"]
    return sites[0]["siteUrl"] if sites else None

# ── Date helpers ──────────────────────────────────────────────────────────────

def date_range(days=28, end_offset=3):
    end = datetime.now(timezone.utc) - timedelta(days=end_offset)
    start = end - timedelta(days=days - 1)
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")

def today_str():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")

def normalize_query(query: str) -> str:
    return " ".join(query.lower().replace("-", " ").replace(".", " ").split())

def is_brand_query(query: str) -> bool:
    q = normalize_query(query)
    compact = q.replace(" ", "")
    if q == "mart" or " com bd" in q or q.endswith(" com"):
        return True
    return any(pattern in q or pattern.replace(" ", "") in compact for pattern in BRAND_QUERY_PATTERNS)

def normalize_page_path(page: str) -> str:
    page = page.strip()
    for host in ("https://e-mart.com.bd", "http://www.e-mart.com.bd", "https://www.e-mart.com.bd"):
        if page.startswith(host):
            page = page[len(host):] or "/"
    # GSC still reports legacy /product/slug — canonicalize to /shop/slug
    if page.startswith("/product/"):
        page = "/shop/" + page[len("/product/"):]
    return page

# ── GSC API calls ─────────────────────────────────────────────────────────────

def fetch_page_data(svc, site, start, end):
    """All pages with their aggregate metrics."""
    body = {
        "startDate": start,
        "endDate": end,
        "dimensions": ["page"],
        "rowLimit": 5000,
        "dataState": "final",
    }
    resp = svc.searchanalytics().query(siteUrl=site, body=body).execute()
    return resp.get("rows", [])

def fetch_page_query_data(svc, site, start, end):
    """Page × query breakdown for detailed analysis."""
    body = {
        "startDate": start,
        "endDate": end,
        "dimensions": ["page", "query"],
        "rowLimit": 10000,
        "dataState": "final",
    }
    resp = svc.searchanalytics().query(siteUrl=site, body=body).execute()
    return resp.get("rows", [])

def fetch_query_data(svc, site, start, end):
    """All queries with aggregate metrics."""
    body = {
        "startDate": start,
        "endDate": end,
        "dimensions": ["query"],
        "rowLimit": 5000,
        "dataState": "final",
    }
    resp = svc.searchanalytics().query(siteUrl=site, body=body).execute()
    return resp.get("rows", [])

# ── Pull command ──────────────────────────────────────────────────────────────

def cmd_pull():
    """Pull today's GSC snapshot and save to gsc-daily/."""
    DAILY_DIR.mkdir(parents=True, exist_ok=True)

    svc = get_service()
    site = get_site(svc)
    start, end = date_range(28)

    print(f"Pulling GSC data for {site} ({start} → {end})...")

    pages = fetch_page_data(svc, site, start, end)
    page_queries = fetch_page_query_data(svc, site, start, end)
    queries = fetch_query_data(svc, site, start, end)

    # Merge pages that share the same canonical path (e.g. /product/slug → /shop/slug)
    merged_pages = {}
    for r in pages:
        path = normalize_page_path(r["keys"][0])
        if path in merged_pages:
            m = merged_pages[path]
            m["clicks"] += r["clicks"]
            m["impressions"] += r["impressions"]
            # Weighted average position by impressions
            total_impr = m["impressions"]
            if total_impr > 0:
                m["position"] = (m["_pos_sum"] + r["position"] * r["impressions"]) / total_impr
                m["_pos_sum"] += r["position"] * r["impressions"]
        else:
            merged_pages[path] = {
                "path": path,
                "clicks": r["clicks"],
                "impressions": r["impressions"],
                "position": r["position"],
                "_pos_sum": r["position"] * r["impressions"],
            }
    page_list = []
    for p in merged_pages.values():
        total_impr = max(p["impressions"], 1)
        page_list.append({
            "url": SITE_URL + p["path"],
            "path": p["path"],
            "clicks": p["clicks"],
            "impressions": p["impressions"],
            "ctr": round(p["clicks"] / total_impr, 4),
            "position": round(p["position"], 1),
        })
    page_list.sort(key=lambda x: -x["impressions"])

    # Merge page_queries with canonical paths
    merged_pq = {}
    for r in page_queries:
        path = normalize_page_path(r["keys"][0])
        query = r["keys"][1]
        key = (path, query)
        if key in merged_pq:
            m = merged_pq[key]
            m["clicks"] += r["clicks"]
            m["impressions"] += r["impressions"]
            total_impr = m["impressions"]
            if total_impr > 0:
                m["position"] = (m["_pos_sum"] + r["position"] * r["impressions"]) / total_impr
                m["_pos_sum"] += r["position"] * r["impressions"]
        else:
            merged_pq[key] = {
                "page": path,
                "query": query,
                "clicks": r["clicks"],
                "impressions": r["impressions"],
                "position": r["position"],
                "_pos_sum": r["position"] * r["impressions"],
            }
    pq_list = []
    for m in merged_pq.values():
        total_impr = max(m["impressions"], 1)
        pq_list.append({
            "page": m["page"],
            "query": m["query"],
            "clicks": m["clicks"],
            "impressions": m["impressions"],
            "ctr": round(m["clicks"] / total_impr, 4),
            "position": round(m["position"], 1),
        })
    pq_list.sort(key=lambda x: -x["impressions"])

    total_clicks = sum(p["clicks"] for p in page_list)
    total_impressions = sum(p["impressions"] for p in page_list)

    snapshot = {
        "date": today_str(),
        "period": {"start": start, "end": end},
        "site": site,
        "summary": {
            "total_clicks": total_clicks,
            "total_impressions": total_impressions,
            "avg_ctr": total_clicks / max(total_impressions, 1),
            "page_count": len(page_list),
            "query_count": len(queries),
        },
        "pages": page_list,
        "page_queries": pq_list,
        "queries": [
            {
                "query": r["keys"][0],
                "clicks": r["clicks"],
                "impressions": r["impressions"],
                "ctr": round(r["ctr"], 4),
                "position": round(r["position"], 1),
            }
            for r in sorted(queries, key=lambda x: -x["impressions"])
        ],
    }

    out_file = DAILY_DIR / f"{today_str()}.json"
    out_file.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False))
    print(f"Saved: {out_file}")
    print(f"  Pages: {len(pages)} | Queries: {len(queries)} | "
          f"Page×Query: {len(page_queries)}")
    print(f"  Clicks: {snapshot['summary']['total_clicks']} | "
          f"Impressions: {snapshot['summary']['total_impressions']}")
    return snapshot

# ── Score command ─────────────────────────────────────────────────────────────

def load_latest_snapshot():
    """Load most recent daily snapshot."""
    files = sorted(DAILY_DIR.glob("*.json"), reverse=True)
    if not files:
        print("No snapshots found. Run 'pull' first.")
        sys.exit(1)
    return json.loads(files[0].read_text())

def load_agentic_scores():
    """Load agentic SEO scores by slug."""
    scores = {}
    if AGENTIC_FILE.exists():
        for line in AGENTIC_FILE.read_text().strip().split("\n"):
            if line.strip():
                d = json.loads(line)
                scores[d["slug"]] = d
    return scores

def slug_from_path(path: str) -> str:
    """Extract product slug from URL path."""
    if path.startswith(PRODUCT_PREFIX):
        return path[len(PRODUCT_PREFIX):].rstrip("/")
    return ""

def score_opportunity(page: dict, agentic: dict | None) -> dict:
    """
    Score a product page by SEO opportunity.

    Formula: impressions × (1 - CTR) × position_weight × seo_gap_multiplier

    - position_weight: higher for pages already in top 10 (CTR-fixable)
    - seo_gap_multiplier: boost pages with poor agentic scores (more to fix)
    """
    impressions = page["impressions"]
    ctr = page["ctr"]
    position = page["position"]

    # Pages in top 5 are CTR-fixable (title/desc changes help)
    # Pages in 6-10 are borderline
    # Pages 10+ need authority/content, not just title tweaks
    if position <= 3:
        position_weight = 3.0
    elif position <= 5:
        position_weight = 2.5
    elif position <= 10:
        position_weight = 1.5
    elif position <= 20:
        position_weight = 0.8
    else:
        position_weight = 0.3

    # Agentic score multiplier: lower on-page score = more room to improve
    seo_gap_mult = 1.0
    if agentic:
        agentic_score = agentic.get("score", 70)
        if agentic_score < 40:
            seo_gap_mult = 1.5  # THIN pages get priority
        elif agentic_score < 60:
            seo_gap_mult = 1.2

    opportunity = impressions * (1 - ctr) * position_weight * seo_gap_mult

    slug = slug_from_path(page["path"])
    result = {
        "slug": slug,
        "path": page["path"],
        "impressions": impressions,
        "clicks": page["clicks"],
        "ctr": ctr,
        "position": position,
        "opportunity_score": round(opportunity, 1),
        "position_bucket": (
            "top3" if position <= 3 else
            "top5" if position <= 5 else
            "top10" if position <= 10 else
            "top20" if position <= 20 else
            "deep"
        ),
    }

    if agentic:
        result["agentic_score"] = agentic.get("score")
        result["agentic_tier"] = agentic.get("tier")
        result["highest_fix"] = agentic.get("highest_value_fix")
        result["missing_fields"] = agentic.get("missing_fields", [])

    return result

def cmd_score():
    """Score all product pages and write priority queue."""
    snapshot = load_latest_snapshot()
    agentic = load_agentic_scores()

    product_pages = [
        p for p in snapshot["pages"]
        if p["path"].startswith(PRODUCT_PREFIX)
    ]

    scored = []
    for page in product_pages:
        slug = slug_from_path(page["path"])
        a = agentic.get(slug)
        scored.append(score_opportunity(page, a))

    scored.sort(key=lambda x: -x["opportunity_score"])

    # Attach top queries for each product
    pq_by_page = {}
    for pq in snapshot.get("page_queries", []):
        path = pq["page"]
        if path not in pq_by_page:
            pq_by_page[path] = []
        pq_by_page[path].append(pq)

    for item in scored:
        queries = pq_by_page.get(item["path"], [])
        queries.sort(key=lambda x: -x["impressions"])
        item["top_queries"] = [
            {"query": q["query"], "impressions": q["impressions"],
             "clicks": q["clicks"], "position": q["position"]}
            for q in queries[:5]
        ]

    queue = {
        "generated": today_str(),
        "period": snapshot["period"],
        "total_product_pages": len(product_pages),
        "total_scored": len(scored),
        "priority_queue": scored[:50],
    }

    QUEUE_FILE.write_text(json.dumps(queue, indent=2, ensure_ascii=False))
    print(f"Priority queue: {QUEUE_FILE}")
    print(f"  Scored {len(scored)} product pages")
    print(f"  Top 5 opportunities:")
    for i, item in enumerate(scored[:5], 1):
        print(f"    {i}. {item['slug'][:50]} — "
              f"score:{item['opportunity_score']} pos:{item['position']} "
              f"impr:{item['impressions']} ctr:{item['ctr']:.1%}")

# ── Trends command ────────────────────────────────────────────────────────────

def cmd_trends():
    """Compare last two snapshots for position changes."""
    files = sorted(DAILY_DIR.glob("*.json"), reverse=True)
    if len(files) < 2:
        print("Need at least 2 daily snapshots to compute trends.")
        print("Run 'pull' on different days first.")
        # Generate baseline from single snapshot if available
        if files:
            snap = json.loads(files[0].read_text())
            trends = {
                "generated": today_str(),
                "note": "Baseline only — no prior snapshot to compare",
                "current_period": snap["period"],
                "product_pages": len([p for p in snap["pages"] if p["path"].startswith(PRODUCT_PREFIX)]),
            }
            TRENDS_FILE.write_text(json.dumps(trends, indent=2))
            print(f"Baseline saved: {TRENDS_FILE}")
        return

    current = json.loads(files[0].read_text())
    previous = json.loads(files[1].read_text())

    curr_pages = {p["path"]: p for p in current["pages"] if p["path"].startswith(PRODUCT_PREFIX)}
    prev_pages = {p["path"]: p for p in previous["pages"] if p["path"].startswith(PRODUCT_PREFIX)}

    movers = []
    for path, curr in curr_pages.items():
        if path in prev_pages:
            prev = prev_pages[path]
            pos_delta = prev["position"] - curr["position"]  # positive = improved
            impr_delta = curr["impressions"] - prev["impressions"]
            movers.append({
                "path": path,
                "slug": slug_from_path(path),
                "position_now": curr["position"],
                "position_prev": prev["position"],
                "position_delta": round(pos_delta, 1),
                "impressions_now": curr["impressions"],
                "impressions_delta": impr_delta,
                "direction": "up" if pos_delta > 1 else "down" if pos_delta < -1 else "stable",
            })

    new_pages = [
        {"path": p, "slug": slug_from_path(p), **curr_pages[p]}
        for p in curr_pages if p not in prev_pages
    ]
    lost_pages = [
        {"path": p, "slug": slug_from_path(p), **prev_pages[p]}
        for p in prev_pages if p not in curr_pages
    ]

    movers.sort(key=lambda x: -abs(x["position_delta"]))

    trends = {
        "generated": today_str(),
        "current_period": current["period"],
        "previous_period": previous["period"],
        "risers": [m for m in movers if m["direction"] == "up"][:20],
        "fallers": [m for m in movers if m["direction"] == "down"][:20],
        "new_in_search": new_pages[:20],
        "dropped_from_search": lost_pages[:20],
    }

    TRENDS_FILE.write_text(json.dumps(trends, indent=2, ensure_ascii=False))
    print(f"Trends: {TRENDS_FILE}")
    print(f"  Risers: {len(trends['risers'])} | "
          f"Fallers: {len(trends['fallers'])} | "
          f"New: {len(new_pages)} | Lost: {len(lost_pages)}")

# ── Blog gaps command ─────────────────────────────────────────────────────────

def cmd_blog_gaps():
    """
    Find queries with impressions but no matching product/blog page.
    These are blog topic candidates — queries people search but we
    don't have content for.

    Feeds directly into blog_generator.py topic selection.
    """
    snapshot = load_latest_snapshot()

    existing_paths = {p["path"] for p in snapshot["pages"]}

    # Queries where our only appearance is homepage or category pages
    # (not a dedicated product or blog post)
    dedicated_prefixes = (PRODUCT_PREFIX, "/product/", BLOG_PREFIX, BEST_PREFIX,
                          "/ingredients/", "/concerns/", "/brands/")

    gaps = []
    for pq in snapshot.get("page_queries", []):
        page_path = normalize_page_path(pq["page"])
        if any(page_path.startswith(p) for p in dedicated_prefixes):
            continue  # already have a dedicated page
        if pq["impressions"] < 10:
            continue
        if is_brand_query(pq["query"]):
            continue
        gaps.append({
            "query": pq["query"],
            "current_page": page_path,
            "impressions": pq["impressions"],
            "clicks": pq["clicks"],
            "position": pq["position"],
            "suggestion": classify_blog_topic(pq["query"]),
        })

    gaps.sort(key=lambda x: -x["impressions"])

    # Deduplicate by query
    seen = set()
    unique_gaps = []
    for g in gaps:
        if g["query"] not in seen:
            seen.add(g["query"])
            unique_gaps.append(g)

    output = {
        "generated": today_str(),
        "period": snapshot["period"],
        "total_gaps": len(unique_gaps),
        "candidates": unique_gaps[:30],
    }

    BLOG_FILE.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    print(f"Blog topic candidates: {BLOG_FILE}")
    print(f"  Found {len(unique_gaps)} query gaps")
    for g in unique_gaps[:5]:
        print(f"    \"{g['query']}\" — impr:{g['impressions']} pos:{g['position']:.1f} "
              f"→ {g['suggestion']}")

def classify_blog_topic(query: str) -> str:
    """Simple heuristic to classify a query into blog topic type."""
    q = query.lower()
    if any(w in q for w in ["best", "top", "recommended"]):
        return "listicle"
    if any(w in q for w in ["vs", "difference", "compare"]):
        return "comparison"
    if any(w in q for w in ["how to", "how do", "routine", "use"]):
        return "how-to"
    if any(w in q for w in ["review", "honest", "worth"]):
        return "review"
    if any(w in q for w in ["price", "buy", "cost", "cheap"]):
        return "buying-guide"
    if any(w in q for w in ["for oily", "for dry", "for acne", "for sensitive"]):
        return "skin-type-guide"
    return "informational"

# ── Search Trends command (Google Trends + YouTube) ──────────────────────────

def cmd_search_trends():
    """
    Pull Google Trends + YouTube search trends for top GSC queries.
    Identifies rising/falling interest to inform content priority.
    """
    import time as _time

    snapshot = load_latest_snapshot()

    # Get top non-brand queries by impressions
    top_queries = [
        q for q in snapshot["queries"]
        if q["impressions"] >= 20
        and not is_brand_query(q["query"])
    ][:TRENDS_MAX_QUERIES]

    if not top_queries:
        print("No non-brand queries with sufficient impressions.")
        return

    try:
        from pytrends.request import TrendReq
    except ImportError:
        print("pytrends not installed. Run: pip3 install pytrends")
        return

    pt = TrendReq(hl="en-US", tz=360, timeout=(10, 25))

    results = []
    for i, q in enumerate(top_queries):
        query = q["query"]
        entry = {
            "query": query,
            "gsc_impressions": q["impressions"],
            "gsc_position": q["position"],
            "gsc_ctr": q["ctr"],
        }

        # Google web search trend
        try:
            pt.build_payload([query], geo=TRENDS_GEO, timeframe=TRENDS_TIMEFRAME)
            df = pt.interest_over_time()
            if not df.empty:
                values = df[query].tolist()
                recent_7 = values[-7:] if len(values) >= 7 else values
                prior_7 = values[-14:-7] if len(values) >= 14 else values[:len(values)//2]
                avg_recent = sum(recent_7) / max(len(recent_7), 1)
                avg_prior = sum(prior_7) / max(len(prior_7), 1)
                if avg_prior > 0:
                    change_pct = round((avg_recent - avg_prior) / avg_prior * 100, 1)
                else:
                    change_pct = 100.0 if avg_recent > 0 else 0.0
                entry["google_trend"] = {
                    "recent_avg": round(avg_recent, 1),
                    "prior_avg": round(avg_prior, 1),
                    "change_pct": change_pct,
                    "direction": "rising" if change_pct > 15 else "falling" if change_pct < -15 else "stable",
                    "peak": max(values),
                    "current": values[-1] if values else 0,
                }
        except Exception as e:
            entry["google_trend"] = {"error": str(e)[:80]}

        _time.sleep(2)  # rate limit

        # YouTube search trend
        try:
            pt.build_payload([query], geo=TRENDS_GEO, timeframe=TRENDS_TIMEFRAME, gprop="youtube")
            df = pt.interest_over_time()
            if not df.empty:
                values = df[query].tolist()
                recent_7 = values[-7:] if len(values) >= 7 else values
                prior_7 = values[-14:-7] if len(values) >= 14 else values[:len(values)//2]
                avg_recent = sum(recent_7) / max(len(recent_7), 1)
                avg_prior = sum(prior_7) / max(len(prior_7), 1)
                if avg_prior > 0:
                    change_pct = round((avg_recent - avg_prior) / avg_prior * 100, 1)
                else:
                    change_pct = 100.0 if avg_recent > 0 else 0.0
                entry["youtube_trend"] = {
                    "recent_avg": round(avg_recent, 1),
                    "prior_avg": round(avg_prior, 1),
                    "change_pct": change_pct,
                    "direction": "rising" if change_pct > 15 else "falling" if change_pct < -15 else "stable",
                }
            else:
                entry["youtube_trend"] = {"direction": "no_data"}
        except Exception as e:
            entry["youtube_trend"] = {"error": str(e)[:80]}

        _time.sleep(2)

        # Combined trend signal
        g_dir = entry.get("google_trend", {}).get("direction", "stable")
        y_dir = entry.get("youtube_trend", {}).get("direction", "stable")
        if g_dir == "rising" or y_dir == "rising":
            entry["combined_signal"] = "HOT"
        elif g_dir == "falling" and y_dir == "falling":
            entry["combined_signal"] = "COOLING"
        else:
            entry["combined_signal"] = "STEADY"

        results.append(entry)
        print(f"  [{i+1}/{len(top_queries)}] \"{query}\" — "
              f"google:{g_dir} youtube:{y_dir} → {entry['combined_signal']}")

    output = {
        "generated": today_str(),
        "geo": TRENDS_GEO,
        "timeframe": TRENDS_TIMEFRAME,
        "queries_checked": len(results),
        "hot_queries": [r for r in results if r.get("combined_signal") == "HOT"],
        "cooling_queries": [r for r in results if r.get("combined_signal") == "COOLING"],
        "all_trends": results,
    }

    SEARCH_TRENDS_FILE.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    print(f"\nSearch trends: {SEARCH_TRENDS_FILE}")
    print(f"  HOT: {len(output['hot_queries'])} | "
          f"COOLING: {len(output['cooling_queries'])} | "
          f"STEADY: {len(results) - len(output['hot_queries']) - len(output['cooling_queries'])}")

# ── Completed content registry + Humanizer Queue command ─────────────────────

def wp_db_prefix() -> str:
    result = subprocess.run(
        ["wp", f"--path={WP_PATH}", "--allow-root", "db", "prefix"],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()

def wp_db_query(sql: str) -> str:
    result = subprocess.run(
        ["wp", f"--path={WP_PATH}", "--allow-root", "db", "query", sql],
        capture_output=True,
        text=True,
        check=True,
    )
    lines = [line for line in result.stdout.splitlines() if not line.startswith("Success:")]
    return "\n".join(lines[1:] if lines else [])

def strip_html(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value or "")
    value = value.replace("&nbsp;", " ")
    return re.sub(r"\s+", " ", value).strip()

def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", strip_html(text)))

def looks_templated(text: str) -> bool:
    lowered = strip_html(text).lower()
    if not lowered:
        return True
    template_bits = (
        "apply as directed",
        "this product type",
        "premium quality",
        "original product",
        "buy online in bangladesh",
        "cash on delivery",
        "suitable for all skin types",
    )
    return any(bit in lowered for bit in template_bits)

def agentic_tier(score: int) -> str:
    if score >= 95:
        return "GOLDEN"
    if score >= 75:
        return "STRONG"
    if score >= 50:
        return "PARTIAL"
    return "THIN"

def split_terms(value: str) -> list[str]:
    return [part.strip() for part in re.split(r"[,|;]", value or "") if part.strip()]

def has_size(name: str, meta: dict[str, str], terms: dict[str, list[str]]) -> bool:
    if meta.get("_product_size") or terms.get("pa_size"):
        return True
    return bool(re.search(r"\b\d+(?:\.\d+)?\s?(ml|g|gm|gram|kg|oz|fl oz|pcs|pads|sheets|tablets|capsules)\b", name.lower()))

def has_use_case(meta: dict[str, str], terms: dict[str, list[str]], content: str) -> bool:
    if terms.get("pa_skin_type") or meta.get("_emart_how_to_use"):
        return True
    joined = " ".join(terms.get("product_cat", []) + [content]).lower()
    return any(word in joined for word in ("dry", "oily", "sensitive", "acne", "baby", "hair", "lip", "eye", "routine", "cleanser"))

def has_routine_info(meta: dict[str, str], content: str) -> bool:
    text = " ".join([meta.get("_emart_how_to_use", ""), content]).lower()
    return any(word in text for word in ("routine", "after cleansing", "before moisturizer", "use with", "pair", "compatible", "how to use", "apply"))

def has_real_qna(meta: dict[str, str]) -> bool:
    faq = meta.get("_emart_product_faq", "")
    if not faq:
        return False
    lowered = faq.lower()
    if "apply as directed" in lowered or "this product type" in lowered:
        return False
    return lowered.count("?") >= 3 or len(faq) > 400

def has_identifier(meta: dict[str, str]) -> bool:
    return bool(meta.get("_global_unique_id") or meta.get("_gtin") or meta.get("_ean") or meta.get("_mpn") or meta.get("_sku"))

def title_locked(name: str, meta: dict[str, str]) -> bool:
    title = meta.get("_rank_math_title", "")
    expected = f"{name} Price in Bangladesh | Emart"
    return title == expected or (not title and len(expected) <= 70)

def agentic_score_for_product(product: dict, meta: dict[str, str], terms: dict[str, list[str]], related_counts: dict[str, int]) -> dict:
    name = product["name"]
    content = " ".join([product.get("content", ""), product.get("excerpt", ""), meta.get("_rank_math_description", "")])
    checks = {
        "locked_title": title_locked(name, meta),
        "description_150_words_not_templated": word_count(content) > 150 and not looks_templated(content),
        "gtin_or_identifier_exists_false": has_identifier(meta),
        "mpn_or_brand_product_id": bool(meta.get("_mpn") or meta.get("_sku") or terms.get("product_brand")),
        "offer_price_valid_until": True,
        "concern_tags": bool(terms.get("pa_concern")),
        "key_ingredients": bool(terms.get("pa_ingredient") or meta.get("_emart_ingredients")),
        "skin_type_or_use_case": has_use_case(meta, terms, content),
        "size_volume": has_size(name, meta, terms),
        "origin_country": bool(terms.get("pa_origin") or meta.get("Origin")),
        "brand": bool(terms.get("product_brand")),
        "real_qna": has_real_qna(meta),
        "related_substitute_links": related_counts.get(str(product["id"]), 0) >= 4,
        "routine_compatibility_care": has_routine_info(meta, content),
    }
    missing = [field for field, present in checks.items() if not present]
    score = sum(AGENTIC_WEIGHTS[field] for field, present in checks.items() if present)
    highest = max(missing, key=lambda field: AGENTIC_WEIGHTS.get(field, 0), default="")
    notes = []
    if "description_150_words_not_templated" in missing:
        notes.append("Description is short or templated.")
    if "real_qna" in missing:
        notes.append("Product FAQ/Q&A is missing or generic.")
    if "gtin_or_identifier_exists_false" in missing:
        notes.append("Identifier/SKU signal is missing.")
    return {
        "slug": product["slug"],
        "score": score,
        "tier": agentic_tier(score),
        "missing_fields": missing,
        "highest_value_fix": highest,
        "llm_note": " ".join(notes) or "Core Woo fields look usable; review missing structured fields before marking golden.",
        "source": "deterministic_wp_catalog",
        "product_id": product["id"],
    }

def cmd_agentic_score():
    """Run deterministic full-catalog agentic scoring from read-only WordPress/Woo data."""
    prefix = wp_db_prefix()
    products_sql = (
        "SELECT ID, post_name, HEX(post_title), HEX(post_content), HEX(post_excerpt) "
        f"FROM {prefix}posts WHERE post_type='product' AND post_status='publish' ORDER BY ID"
    )
    products = []
    for line in wp_db_query(products_sql).splitlines():
        if not line.strip():
            continue
        post_id, slug, name_hex, content_hex, excerpt_hex = (line.split("\t") + ["", "", "", "", ""])[:5]
        if not post_id.isdigit():
            continue
        name = bytes.fromhex(name_hex).decode("utf-8", errors="replace") if name_hex else ""
        content = bytes.fromhex(content_hex).decode("utf-8", errors="replace") if content_hex else ""
        excerpt = bytes.fromhex(excerpt_hex).decode("utf-8", errors="replace") if excerpt_hex else ""
        products.append({"id": int(post_id), "slug": slug, "name": name, "content": content, "excerpt": excerpt})

    ids = ",".join(str(p["id"]) for p in products)
    meta_by_id = {str(p["id"]): {} for p in products}
    terms_by_id = {str(p["id"]): {} for p in products}
    related_counts = {str(p["id"]): 0 for p in products}
    if ids:
        meta_sql = (
            "SELECT post_id, meta_key, HEX(meta_value) "
            f"FROM {prefix}postmeta WHERE post_id IN ({ids}) "
            "AND meta_key IN ("
            "'_rank_math_title','_rank_math_description','_sku','_mpn','_global_unique_id',"
            "'_gtin','_ean','_emart_product_faq','_emart_ingredients','_emart_how_to_use',"
            "'_product_size','Origin','_crosssell_ids','_upsell_ids')"
        )
        for line in wp_db_query(meta_sql).splitlines():
            if not line.strip():
                continue
            post_id, key, value_hex = (line.split("\t", 2) + [""])[:3]
            if not post_id.isdigit():
                continue
            value = bytes.fromhex(value_hex).decode("utf-8", errors="replace") if value_hex else ""
            if key in {"_crosssell_ids", "_upsell_ids"}:
                related_counts[post_id] = related_counts.get(post_id, 0) + len(re.findall(r"\d+", value or ""))
            else:
                meta_by_id.setdefault(post_id, {})[key] = value

        terms_sql = (
            "SELECT tr.object_id, tt.taxonomy, GROUP_CONCAT(t.name SEPARATOR '|') "
            f"FROM {prefix}term_relationships tr "
            f"JOIN {prefix}term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id "
            f"JOIN {prefix}terms t ON t.term_id=tt.term_id "
            f"WHERE tr.object_id IN ({ids}) "
            "AND tt.taxonomy IN ('product_cat','product_brand','pa_brand','pa_concern','pa_ingredient','pa_skin_type','pa_origin','pa_size') "
            "GROUP BY tr.object_id, tt.taxonomy"
        )
        for line in wp_db_query(terms_sql).splitlines():
            if not line.strip():
                continue
            post_id, taxonomy, value = (line.split("\t", 2) + [""])[:3]
            terms_by_id.setdefault(post_id, {})[taxonomy] = split_terms(value)

    rows = [
        agentic_score_for_product(product, meta_by_id.get(str(product["id"]), {}), terms_by_id.get(str(product["id"]), {}), related_counts)
        for product in products
    ]
    rows.sort(key=lambda row: (row["score"], row["slug"]))
    with AGENTIC_FILE.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")

    tiers = {}
    for row in rows:
        tiers[row["tier"]] = tiers.get(row["tier"], 0) + 1
    print(f"Agentic score: {AGENTIC_FILE}")
    print(f"  Products scored: {len(rows)}")
    print(f"  Tiers: {json.dumps(tiers, sort_keys=True)}")

def refresh_completed_content_registry() -> dict:
    """Refresh the durable registry from the read-only _emart_humanized marker."""
    prefix = wp_db_prefix()
    sql = """
        SELECT p.ID, p.post_name, MAX(pm.meta_value)
        FROM {prefix}posts p
        JOIN {prefix}postmeta pm
          ON pm.post_id=p.ID AND pm.meta_key='_emart_humanized'
        WHERE p.post_type='product'
          AND p.post_status='publish'
          AND pm.meta_value<>''
        GROUP BY p.ID, p.post_name
        ORDER BY p.ID
    """.format(prefix=prefix)
    cmd = [
        "wp", f"--path={WP_PATH}", "--allow-root", "db", "query",
        sql, "--skip-column-names",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)

    entries = []
    for line in result.stdout.splitlines():
        if not line.strip():
            continue
        post_id, slug, marker = line.split("\t", 2)
        entries.append({
            "post_id": int(post_id),
            "slug": slug,
            "path": f"{PRODUCT_PREFIX}{slug}",
            "completed_marker": marker,
            "source": "wp_postmeta:_emart_humanized",
        })

    registry = {
        "generated": today_str(),
        "source": "read-only WordPress _emart_humanized postmeta",
        "total_completed": len(entries),
        "entries": entries,
    }
    COMPLETED_REGISTRY_FILE.write_text(json.dumps(registry, indent=2, ensure_ascii=False))
    return registry

def load_completed_content_registry(refresh_if_missing: bool = False) -> dict:
    """Load completed products by canonical path/slug/id."""
    if refresh_if_missing and not COMPLETED_REGISTRY_FILE.exists():
        try:
            refresh_completed_content_registry()
        except Exception as e:
            print(f"  Registry refresh skipped: {e}")

    registry = {"total_completed": 0, "entries": []}
    if COMPLETED_REGISTRY_FILE.exists():
        try:
            registry = json.loads(COMPLETED_REGISTRY_FILE.read_text())
        except Exception as e:
            print(f"  Registry read skipped: {e}")

    entries = registry.get("entries", [])
    registry["ids"] = {str(e.get("post_id")) for e in entries if e.get("post_id")}
    registry["slugs"] = {e.get("slug") for e in entries if e.get("slug")}
    registry["paths"] = {normalize_page_path(e.get("path", "")) for e in entries if e.get("path")}
    return registry

def cmd_completed_registry():
    """Refresh the completed-content registry from read-only live product metadata."""
    try:
        registry = refresh_completed_content_registry()
    except Exception as e:
        if not COMPLETED_REGISTRY_FILE.exists():
            raise
        registry = load_completed_content_registry()
        print(f"Completed-content registry refresh skipped: {e}")
        print("  Using existing registry file.")
    print(f"Completed-content registry: {COMPLETED_REGISTRY_FILE}")
    print(f"  Products marked humanized: {registry['total_completed']}")
    print(f"  Source: {registry['source']}")

def cmd_humanizer_queue():
    """
    Build a prioritized queue of products needing description humanization.

    Priority = GSC opportunity score × content-needs-work multiplier.
    Products already humanized are excluded.
    Trend signals boost products with rising search interest.
    """
    snapshot = load_latest_snapshot()
    agentic = load_agentic_scores()
    completed = load_completed_content_registry(refresh_if_missing=True)
    completed_paths = completed.get("paths", set())
    completed_slugs = completed.get("slugs", set())

    # Load trend signals if available
    trend_signals = {}
    if SEARCH_TRENDS_FILE.exists():
        try:
            trends_data = json.loads(SEARCH_TRENDS_FILE.read_text())
            for t in trends_data.get("all_trends", []):
                trend_signals[t["query"]] = t.get("combined_signal", "STEADY")
        except Exception:
            pass

    product_pages = [
        p for p in snapshot["pages"]
        if p["path"].startswith(PRODUCT_PREFIX) and p["impressions"] >= 5
    ]

    # Build page→queries map
    pq_map = {}
    for pq in snapshot.get("page_queries", []):
        path = pq["page"]
        if path not in pq_map:
            pq_map[path] = []
        pq_map[path].append(pq)

    queue = []
    for page in product_pages:
        slug = slug_from_path(page["path"])
        a = agentic.get(slug)
        scored = score_opportunity(page, a)

        is_humanized = page["path"] in completed_paths or slug in completed_slugs

        # Check queries for trend signals
        page_queries = pq_map.get(page["path"], [])
        has_hot_query = False
        for pq in page_queries:
            if trend_signals.get(pq["query"]) == "HOT":
                has_hot_query = True
                break

        # Content needs work multiplier
        content_mult = 1.0
        if a:
            tier = a.get("tier", "")
            if tier == "THIN":
                content_mult = 2.0
            elif tier in ("WEAK", ""):
                content_mult = 1.5
            missing = a.get("missing_fields", [])
            if "description_150_words_not_templated" in missing:
                content_mult *= 1.3
        else:
            content_mult = 1.5  # no agentic score = likely needs work

        # Trend boost
        trend_mult = 1.5 if has_hot_query else 1.0

        humanizer_score = scored["opportunity_score"] * content_mult * trend_mult

        entry = {
            "slug": slug,
            "path": page["path"],
            "humanizer_priority": round(humanizer_score, 1),
            "opportunity_score": scored["opportunity_score"],
            "impressions": page["impressions"],
            "clicks": page["clicks"],
            "position": page["position"],
            "ctr": page["ctr"],
            "is_humanized": is_humanized,
            "completed_source": "completed-content-registry" if is_humanized else None,
            "has_hot_trend": has_hot_query,
            "content_tier": a.get("tier", "UNKNOWN") if a else "UNSCORED",
        }

        if page_queries:
            entry["top_queries"] = [
                {"query": pq["query"], "impressions": pq["impressions"]}
                for pq in sorted(page_queries, key=lambda x: -x["impressions"])[:3]
            ]

        queue.append(entry)

    # Filter out already-humanized, sort by priority
    todo = [q for q in queue if not q["is_humanized"]]
    done = [q for q in queue if q["is_humanized"]]
    todo.sort(key=lambda x: -x["humanizer_priority"])

    output = {
        "generated": today_str(),
        "period": snapshot["period"],
        "total_products_in_search": len(product_pages),
        "completed_registry_total": completed.get("total_completed", len(completed_paths)),
        "already_humanized": len(done),
        "needs_humanization": len(todo),
        "queue": todo[:50],
    }

    HUMANIZER_FILE.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    print(f"Humanizer queue: {HUMANIZER_FILE}")
    print(f"  Products in search: {len(product_pages)}")
    print(f"  Completed registry: {completed.get('total_completed', len(completed_paths))}")
    print(f"  Already humanized:  {len(done)}")
    print(f"  Needs work:         {len(todo)}")
    print(f"  Top 5 humanizer targets:")
    for i, item in enumerate(todo[:5], 1):
        hot = " 🔥" if item["has_hot_trend"] else ""
        print(f"    {i}. {item['slug'][:50]} — "
              f"priority:{item['humanizer_priority']:.0f} "
              f"tier:{item['content_tier']} "
              f"pos:{item['position']:.1f}{hot}")

# ── Actions + Telegram report ─────────────────────────────────────────────────

ACTIONS_FILE = OUTPUT_DIR / "actions.json"
TG_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TG_CHAT_IDS = [
    "6906852635",   # @Emart_official (business)
    "6639867372",   # @WARLORD_71 (owner/admin)
]

def _load_env_from_openclaw():
    global TG_TOKEN
    if TG_TOKEN:
        return
    env_file = Path("/root/.openclaw/openclaw.env")
    if env_file.exists():
        for line in env_file.read_text().strip().split("\n"):
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                if k.strip() == "TELEGRAM_BOT_TOKEN":
                    TG_TOKEN = v.strip()

def send_telegram(text: str):
    _load_env_from_openclaw()
    if not TG_TOKEN:
        print("  (Telegram bot token not found, skipping)")
        return
    import urllib.request, urllib.parse
    for chat_id in TG_CHAT_IDS:
        try:
            url = f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage"
            data = urllib.parse.urlencode({
                "chat_id": chat_id, "text": text,
                "parse_mode": "HTML", "disable_web_page_preview": "true",
            }).encode()
            urllib.request.urlopen(url, data, timeout=10)
        except Exception as e:
            print(f"  (Telegram → {chat_id} failed: {e})")

def cmd_actions():
    """
    Unified action engine:
    1. Reads all pipeline outputs
    2. Categorizes actions by WHO does them and HOW
    3. Auto-executes safe actions (blog topic feed, humanizer queue write)
    4. Sends structured Telegram report with context
    5. Writes actions.json for agent consumption
    """
    queue = json.loads(QUEUE_FILE.read_text()) if QUEUE_FILE.exists() else {}
    trends = json.loads(TRENDS_FILE.read_text()) if TRENDS_FILE.exists() else {}
    search = json.loads(SEARCH_TRENDS_FILE.read_text()) if SEARCH_TRENDS_FILE.exists() else {}
    blog = json.loads(BLOG_FILE.read_text()) if BLOG_FILE.exists() else {}
    humanizer = json.loads(HUMANIZER_FILE.read_text()) if HUMANIZER_FILE.exists() else {}
    snap = load_latest_snapshot()

    auto_done = []    # executed automatically
    agent_tasks = []  # for Claude/Codex to execute on next session
    owner_tasks = []  # only the owner can do these

    brand_words = {"emart", "e mart", "e-mart", "us mart", "e mart way"}

    # ── AUTO: Feed blog topics to blog_generator state ──
    blog_state_file = Path("/root/.openclaw/workspace-emart/blog_generator_state.json")
    if blog_state_file.exists() and blog.get("candidates"):
        non_brand_gaps = [
            g for g in blog.get("candidates", [])
            if not any(bw in g["query"].lower() for bw in brand_words)
            and g["impressions"] >= 10
        ]
        if non_brand_gaps:
            try:
                state = json.loads(blog_state_file.read_text())
                gsc_topics = state.get("gsc_topics", [])
                existing = {t.get("query", "") for t in gsc_topics}
                added = 0
                for g in non_brand_gaps[:5]:
                    if g["query"] not in existing:
                        gsc_topics.append({
                            "query": g["query"],
                            "impressions": g["impressions"],
                            "position": g["position"],
                            "type": g["suggestion"],
                            "added": today_str(),
                        })
                        added += 1
                if added:
                    state["gsc_topics"] = gsc_topics
                    blog_state_file.write_text(json.dumps(state, indent=2))
                    auto_done.append(f"Fed {added} blog topics to generator: {', '.join(g['query'] for g in non_brand_gaps[:added])}")
            except Exception as e:
                auto_done.append(f"Blog topic feed failed: {e}")

    # ── AUTO: Update humanizer queue file (already done in cmd_humanizer_queue) ──
    hq_count = humanizer.get("needs_humanization", 0)
    if hq_count > 0:
        auto_done.append(f"Humanizer queue updated: {hq_count} products prioritized")

    # ── AUTO: Report title proposals (from cmd_propose_titles) ──
    if TITLE_PENDING_FILE.exists():
        try:
            tp = json.loads(TITLE_PENDING_FILE.read_text())
            pending_count = sum(1 for e in tp if e.get("status") == "pending")
            if pending_count:
                auto_done.append(f"{pending_count} title fixes proposed — awaiting review")
        except Exception:
            pass

    # ── AGENT TASKS: Title/description CTR fixes ──
    for item in queue.get("priority_queue", [])[:5]:
        if item["position"] <= 5 and item["ctr"] < 0.02:
            agent_tasks.append({
                "type": "title_fix",
                "priority": "HIGH",
                "slug": item["slug"],
                "who": "Claude/Codex",
                "how": "Edit buildProductSeoTitle() or set _rank_math_title in WooCommerce",
                "why": f"Position {item['position']:.1f} with {item['impressions']} impressions but only {item['ctr']*100:.1f}% CTR — Google shows this product but users don't click because the title/snippet isn't compelling vs competitors",
                "standard": "Title: '{Product Name} Price in Bangladesh | Emart'. Max 70 chars. Review via: python3 gsc_tracker.py review-titles",
                "data": {"position": item["position"], "impressions": item["impressions"], "ctr": item["ctr"], "clicks": item["clicks"]},
            })

    # ── AGENT TASKS: Content humanization ──
    for item in humanizer.get("queue", [])[:5]:
        is_hot = item.get("has_hot_trend", False)
        agent_tasks.append({
            "type": "humanize",
            "priority": "HIGH" if is_hot else "MEDIUM",
            "slug": item["slug"],
            "who": "Claude/Codex (via humanizer_impression_priority.py)",
            "how": "Run humanizer on this product — rewrite WooCommerce description with specific ingredients, benefits, localized usage tips for Bangladesh climate",
            "why": f"Position {item['position']:.1f}, {item['impressions']} impressions, content tier: {item['content_tier']} — {'🔥 trending query, act now' if is_hot else 'generic description hurts CTR and AI citation potential'}",
            "standard": "150+ words, mention brand + origin + key ingredients + skin type + 'Bangladesh' + 'COD'. No generic AI filler. Must pass humanizer quality check.",
            "data": {"humanizer_priority": item["humanizer_priority"], "content_tier": item["content_tier"], "hot_trend": is_hot},
        })

    # ── AGENT TASKS: Investigate ranking drops ──
    for item in trends.get("fallers", [])[:3]:
        if abs(item.get("position_delta", 0)) >= 5:
            agent_tasks.append({
                "type": "investigate_drop",
                "priority": "HIGH",
                "slug": item["slug"],
                "who": "Claude/Codex",
                "how": "Check: (1) page still returns 200, (2) canonical intact, (3) schema valid, (4) competitor content changes, (5) GSC coverage report for errors",
                "why": f"Lost {abs(item['position_delta']):.1f} positions ({item['position_prev']:.1f} → {item['position_now']:.1f}) — if this continues, impressions will drop next week",
                "standard": "Report findings. Only fix if a technical issue is found. Position fluctuations <3 are normal.",
                "data": item,
            })

    # ── AGENT TASKS: Hot trend content ──
    for item in search.get("hot_queries", []):
        agent_tasks.append({
            "type": "trend_content",
            "priority": "HIGH",
            "query": item["query"],
            "who": "Claude/Codex",
            "how": "Check if existing product/blog page covers this query. If yes, optimize title+description. If no, create blog post or add to /best/ guide.",
            "why": f"Rising on Google/YouTube right now — {item['gsc_impressions']} impressions at position {item['gsc_position']:.1f}. Content created now will catch the wave.",
            "standard": "Match the query intent. Product query → optimize PDP. Informational query → blog post. Comparison query → /best/ guide.",
            "data": item,
        })

    # ── OWNER TASKS: Things only the owner can do ──
    # Check review count
    owner_tasks.append({
        "type": "collect_reviews",
        "priority": "MEDIUM",
        "why": "Only 16 product reviews across 3,500+ products. Review stars in Google SERP require AggregateRating + individual Review schema (now deployed). More reviews = more stars = more clicks.",
        "action": "Activate post-purchase review request emails via MailPoet. Target: 100 reviews in 60 days.",
    })

    # GBP
    owner_tasks.append({
        "type": "google_business_profile",
        "priority": "HIGH",
        "why": "Google Business Profile establishes Emart as a verified entity. LLMs check GBP for 'is this business real'. Without it, AI search won't cite Emart as a trusted retailer.",
        "action": "Claim/verify GBP at Dhanmondi address. Add store photos, hours, phone. Link to https://e-mart.com.bd",
    })

    # Social backlinks
    owner_tasks.append({
        "type": "social_backlinks",
        "priority": "LOW",
        "why": "Facebook/Instagram/YouTube bio links should point to e-mart.com.bd/shop/ URLs. Bidirectional social→site links strengthen entity recognition.",
        "action": "Update FB/IG/YT/TikTok profile bios to link to https://e-mart.com.bd",
    })

    # ── Write actions.json ──
    output = {
        "generated": today_str(),
        "period": queue.get("period", {}),
        "summary": {
            "total_clicks": snap["summary"]["total_clicks"],
            "total_impressions": snap["summary"]["total_impressions"],
            "pages_in_search": snap["summary"]["page_count"],
            "risers": len(trends.get("risers", [])),
            "fallers": len(trends.get("fallers", [])),
            "hot_trends": len(search.get("hot_queries", [])),
            "cooling_trends": len(search.get("cooling_queries", [])),
        },
        "auto_executed": auto_done,
        "agent_tasks": agent_tasks,
        "owner_tasks": owner_tasks,
    }

    ACTIONS_FILE.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    print(f"Actions: {ACTIONS_FILE}")
    print(f"  Auto-executed: {len(auto_done)}")
    print(f"  Agent tasks:   {len(agent_tasks)}")
    print(f"  Owner tasks:   {len(owner_tasks)}")

    # ── Build Telegram report ──
    s = output["summary"]
    tg = []
    tg.append(f"<b>📊 Emart SEO — {today_str()}</b>")
    tg.append(f"Clicks: {s['total_clicks']} | Impr: {s['total_impressions']:,}")
    tg.append(f"▲{s['risers']} risers | ▼{s['fallers']} fallers")
    if s['hot_trends']:
        tg.append(f"🔥 {s['hot_trends']} trending queries")

    if auto_done:
        tg.append(f"\n<b>✅ Auto-done:</b>")
        for a in auto_done:
            tg.append(f"  • {a[:70]}")

    if agent_tasks:
        high = [t for t in agent_tasks if t["priority"] == "HIGH"]
        med = [t for t in agent_tasks if t["priority"] != "HIGH"]
        tg.append(f"\n<b>🤖 Agent tasks ({len(agent_tasks)}):</b>")
        for t in high[:4]:
            name = t.get("slug", t.get("query", "?"))[:30]
            tg.append(f"  🔴 {t['type']}: {name}")
            tg.append(f"     ↳ {t['why'][:80]}")
        if med:
            tg.append(f"  + {len(med)} medium priority")

    if owner_tasks:
        high_owner = [t for t in owner_tasks if t["priority"] == "HIGH"]
        if high_owner:
            tg.append(f"\n<b>👤 Owner action needed:</b>")
            for t in high_owner[:2]:
                tg.append(f"  ⚡ {t['action'][:80]}")

    tg.append(f"\n<i>Reply /report for full report</i>")

    send_telegram("\n".join(tg))
    print(f"  Telegram sent to {len(TG_CHAT_IDS)} recipients")

# ── Title propose / review / apply pipeline ──────────────────────────────────

TITLE_PENDING_FILE = OUTPUT_DIR / "title_fixes_pending.json"
TITLE_SUFFIX = " Price in Bangladesh | Emart"
TITLE_MAX = 70


def _build_title(name: str) -> str:
    """Match Next.js buildProductSeoTitle format exactly."""
    full = f"{name}{TITLE_SUFFIX}"
    if len(full) <= TITLE_MAX:
        return full
    avail = TITLE_MAX - len(TITLE_SUFFIX)
    truncated = name[:avail].rsplit(" ", 1)[0]
    return f"{truncated}{TITLE_SUFFIX}"


def _wc_ssl_ctx():
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def _load_wc_creds():
    key = os.environ.get("WOO_CONSUMER_KEY", "") or os.environ.get("WC_CONSUMER_KEY", "")
    secret = os.environ.get("WOO_CONSUMER_SECRET", "") or os.environ.get("WC_CONSUMER_SECRET", "")
    if key and secret:
        return key, secret
    env_file = Path(__file__).resolve().parents[2] / "apps" / "web" / ".env.local"
    if not env_file.exists():
        env_file = Path("/var/www/emart-platform/apps/web/.env.local")
    if env_file.exists():
        for line in env_file.read_text().strip().split("\n"):
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                k = k.strip()
                if k in ("WOO_CONSUMER_KEY", "WC_CONSUMER_KEY"):
                    key = v.strip()
                elif k in ("WOO_CONSUMER_SECRET", "WC_CONSUMER_SECRET"):
                    secret = v.strip()
    return key, secret


def _wc_get_product(slug: str, wc_key: str, wc_secret: str, ctx):
    """Fetch one product by slug (read-only GET)."""
    import urllib.request
    url = (f"https://127.0.0.1/wp-json/wc/v3/products?slug={slug}"
           f"&consumer_key={wc_key}&consumer_secret={wc_secret}"
           f"&_fields=id,name,meta_data")
    req = urllib.request.Request(url, headers={"Host": "e-mart.com.bd"})
    resp = urllib.request.urlopen(req, context=ctx, timeout=10)
    products = json.loads(resp.read())
    return products[0] if products else None


def _load_pending():
    if TITLE_PENDING_FILE.exists():
        return json.loads(TITLE_PENDING_FILE.read_text())
    return []


def _save_pending(entries):
    TITLE_PENDING_FILE.write_text(json.dumps(entries, indent=2, ensure_ascii=False))


def cmd_propose_titles():
    """Propose title fixes for high-opportunity products. READ-ONLY — never writes to WooCommerce."""

    wc_key, wc_secret = _load_wc_creds()
    if not wc_key or not wc_secret:
        print("WooCommerce credentials not found, skipping title proposals")
        return 0

    ctx = _wc_ssl_ctx()
    queue = json.loads(QUEUE_FILE.read_text()) if QUEUE_FILE.exists() else {}
    targets = [
        p for p in queue.get("priority_queue", [])
        if p["position"] <= 10 and p["impressions"] >= 50
    ][:20]

    if not targets:
        print("No title proposal targets")
        return 0

    pending = _load_pending()
    already = {e["slug"] for e in pending if e.get("status") in ("pending", "approved", "applied")}
    proposed = 0

    for item in targets:
        slug = item["slug"]
        if slug in already:
            continue

        try:
            product = _wc_get_product(slug, wc_key, wc_secret, ctx)
        except Exception as e:
            print(f"  Skip {slug}: fetch failed ({e})")
            continue
        if not product:
            continue

        name = product["name"]
        current_rm = ""
        for m in product.get("meta_data", []):
            if m.get("key") == "_rank_math_title":
                current_rm = m.get("value", "")

        expected = _build_title(name)
        if current_rm == expected:
            continue

        pending.append({
            "product_id": product["id"],
            "slug": slug,
            "old_title": current_rm or f"(none — fallback: {name}{TITLE_SUFFIX})",
            "new_title": expected,
            "reason": f"pos {item['position']:.1f}, {item['impressions']} impr, {item['ctr']*100:.1f}% CTR",
            "proposed_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "status": "pending",
        })
        proposed += 1

    _save_pending(pending)
    print(f"Title proposals: {proposed} new, {len(pending)} total in queue → {TITLE_PENDING_FILE}")
    return proposed


def cmd_review_titles():
    """Print the pending title review queue."""
    pending = _load_pending()
    by_status = {}
    for e in pending:
        by_status.setdefault(e.get("status", "?"), []).append(e)

    for status in ("pending", "approved", "applied", "rejected"):
        items = by_status.get(status, [])
        if not items:
            continue
        print(f"\n── {status.upper()} ({len(items)}) ──")
        for i, e in enumerate(items):
            print(f"  [{i}] {e['slug']}")
            print(f"      old: {e['old_title'][:70]}")
            print(f"      new: {e['new_title'][:70]}")
            print(f"      why: {e.get('reason', '')}")

    if not pending:
        print("No title proposals in queue")


def cmd_apply_titles():
    """Write approved titles to WooCommerce. Only touches entries with status=approved."""
    import urllib.request

    wc_key, wc_secret = _load_wc_creds()
    if not wc_key or not wc_secret:
        print("WooCommerce credentials not found")
        return

    ctx = _wc_ssl_ctx()
    pending = _load_pending()
    approved = [e for e in pending if e.get("status") == "approved"]

    if not approved:
        print("No approved titles to apply. Edit title_fixes_pending.json: set status to 'approved'.")
        return

    applied = 0
    for entry in approved:
        pid = entry["product_id"]
        new_title = entry["new_title"]
        try:
            put_url = (f"https://127.0.0.1/wp-json/wc/v3/products/{pid}"
                       f"?consumer_key={wc_key}&consumer_secret={wc_secret}")
            put_data = json.dumps({"meta_data": [{"key": "_rank_math_title", "value": new_title}]}).encode()
            put_req = urllib.request.Request(
                put_url, data=put_data, method="PUT",
                headers={"Host": "e-mart.com.bd", "Content-Type": "application/json"},
            )
            resp = urllib.request.urlopen(put_req, context=ctx, timeout=15)
            result = json.loads(resp.read())

            written = ""
            for m in result.get("meta_data", []):
                if m.get("key") == "_rank_math_title":
                    written = m.get("value", "")
            if written != new_title:
                print(f"  ⚠ {entry['slug']}: verify mismatch (wrote '{new_title}', read back '{written}')")
                continue

            entry["status"] = "applied"
            entry["applied_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            applied += 1
            print(f"  ✅ {entry['slug']} → {new_title[:60]}")
        except Exception as e:
            print(f"  ❌ {entry['slug']}: {e}")

    _save_pending(pending)

    if applied:
        try:
            secret = os.environ.get("REVALIDATE_SECRET", "")
            if secret:
                urllib.request.urlopen(urllib.request.Request(
                    "https://e-mart.com.bd/api/revalidate",
                    data=json.dumps({"tag": "products"}).encode(),
                    headers={"Content-Type": "application/json", "x-revalidate-secret": secret},
                ), timeout=10)
                print(f"  Cache revalidated (tag:products)")
        except Exception:
            pass

    print(f"Applied: {applied}/{len(approved)}")

# ── Striking-distance command ────────────────────────────────────────────────

STRIKING_FILE = OUTPUT_DIR / "striking-distance.json"

def cmd_striking_distance():
    """Pages ranking 11-20 sorted by impressions — lowest-hanging page-1 candidates."""
    snapshot = load_latest_snapshot()

    pages = [p for p in snapshot["pages"] if 11 <= p["position"] <= 20]
    pages.sort(key=lambda x: -x["impressions"])

    pq_map = {}
    for pq in snapshot.get("page_queries", []):
        path = pq["page"]
        if path not in pq_map:
            pq_map[path] = []
        pq_map[path].append(pq)

    results = []
    for page in pages:
        queries = sorted(pq_map.get(page["path"], []), key=lambda x: -x["impressions"])
        top_query = queries[0] if queries else None
        results.append({
            "path": page["path"],
            "position": page["position"],
            "impressions": page["impressions"],
            "clicks": page["clicks"],
            "ctr": page["ctr"],
            "top_query": top_query["query"] if top_query else None,
            "top_query_position": top_query["position"] if top_query else None,
            "top_queries": [
                {"query": q["query"], "impressions": q["impressions"], "position": q["position"]}
                for q in queries[:5]
            ],
        })

    output = {
        "generated": today_str(),
        "period": snapshot["period"],
        "total_pages_11_to_20": len(results),
        "pages": results,
    }

    STRIKING_FILE.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    print(f"Striking distance: {STRIKING_FILE}")
    print(f"  Pages in position 11-20: {len(results)}")
    print(f"\n  Top 10 by impressions:")
    for i, item in enumerate(results[:10], 1):
        q = f'  ← "{item["top_query"]}"' if item["top_query"] else ""
        print(f"    {i}. pos={item['position']:.1f} impr={item['impressions']} "
              f"clicks={item['clicks']} — {item['path']}{q}")

# ── Full command ──────────────────────────────────────────────────────────────

def cmd_full():
    """Run pull + agentic-score + score + trends + blog-gaps + completed-registry + humanizer-queue + propose-titles + actions."""
    cmd_pull()
    print()
    try:
        cmd_agentic_score()
    except Exception as e:
        print(f"  agentic-score refresh skipped: {e}")
    print()
    cmd_score()
    print()
    cmd_trends()
    print()
    cmd_blog_gaps()
    print()
    try:
        cmd_completed_registry()
    except Exception as e:
        print(f"  completed-registry refresh skipped: {e}")
    print()
    cmd_humanizer_queue()
    print()
    cmd_propose_titles()
    print()
    cmd_actions()

# ── Entry point ───────────────────────────────────────────────────────────────

COMMANDS = {
    "pull": cmd_pull,
    "score": cmd_score,
    "full": cmd_full,
    "trends": cmd_trends,
    "blog-gaps": cmd_blog_gaps,
    "search-trends": cmd_search_trends,
    "agentic-score": cmd_agentic_score,
    "completed-registry": cmd_completed_registry,
    "humanizer-queue": cmd_humanizer_queue,
    "actions": cmd_actions,
    "propose-titles": cmd_propose_titles,
    "review-titles": cmd_review_titles,
    "apply-titles": cmd_apply_titles,
    "striking-distance": cmd_striking_distance,
}

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "full"
    if cmd not in COMMANDS:
        print(f"Usage: {sys.argv[0]} [{' | '.join(COMMANDS)}]")
        sys.exit(1)
    COMMANDS[cmd]()
