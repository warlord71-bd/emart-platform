#!/usr/bin/env python3
"""
GSC Position Tracker + SEO Priority Queue for Emart.

Pulls daily search performance from Google Search Console API,
scores every product page by opportunity, enriches with Google Trends
and YouTube search trends, and writes a priority queue that integrates
with the existing seo-review pipeline and content humanizer.

Usage:
  python3 workspace/seo-review/gsc_tracker.py pull         # daily GSC snapshot
  python3 workspace/seo-review/gsc_tracker.py score        # score + priority queue
  python3 workspace/seo-review/gsc_tracker.py full         # pull + score + trends + blog-gaps
  python3 workspace/seo-review/gsc_tracker.py trends       # 7-day position deltas
  python3 workspace/seo-review/gsc_tracker.py blog-gaps    # content gaps → blog topics
  python3 workspace/seo-review/gsc_tracker.py search-trends # Google+YouTube trend signals
  python3 workspace/seo-review/gsc_tracker.py humanizer-queue # prioritized humanizer targets

Outputs:
  gsc-daily/YYYY-MM-DD.json        — raw GSC page+query data
  priority-queue.json               — top opportunities ranked by score
  position-trends.json              — 7-day movers (up/down)
  blog-topic-candidates.json        — queries with impressions but no matching page
  search-trends.json                — Google Trends + YouTube trend data for top queries
  humanizer-queue.json              — products needing description humanization, by priority

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
HUMANIZER_BATCHES = [
    HUMANIZER_DIR / "face-cleansers/active/current-batch.jsonl",
    HUMANIZER_DIR / "face-cleansers/archive/batches/batch-2026-06-01.jsonl",
    HUMANIZER_DIR / "face-cleansers/archive/batches/batch-2026-05-31.jsonl",
    HUMANIZER_DIR / "impression-priority/active/impression-priority-2026-06-05.jsonl",
]

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

    snapshot = {
        "date": today_str(),
        "period": {"start": start, "end": end},
        "site": site,
        "summary": {
            "total_clicks": sum(r["clicks"] for r in pages),
            "total_impressions": sum(r["impressions"] for r in pages),
            "avg_ctr": sum(r["clicks"] for r in pages) / max(sum(r["impressions"] for r in pages), 1),
            "page_count": len(pages),
            "query_count": len(queries),
        },
        "pages": [
            {
                "url": r["keys"][0],
                "path": r["keys"][0].replace(SITE_URL, ""),
                "clicks": r["clicks"],
                "impressions": r["impressions"],
                "ctr": round(r["ctr"], 4),
                "position": round(r["position"], 1),
            }
            for r in sorted(pages, key=lambda x: -x["impressions"])
        ],
        "page_queries": [
            {
                "page": r["keys"][0].replace(SITE_URL, ""),
                "query": r["keys"][1],
                "clicks": r["clicks"],
                "impressions": r["impressions"],
                "ctr": round(r["ctr"], 4),
                "position": round(r["position"], 1),
            }
            for r in sorted(page_queries, key=lambda x: -x["impressions"])
        ],
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

# ── Humanizer Queue command ──────────────────────────────────────────────────

def load_humanized_ids() -> set[str]:
    """Load product IDs that have already been humanized."""
    ids = set()
    for f in HUMANIZER_BATCHES:
        if f.exists():
            for line in f.read_text().strip().split("\n"):
                if line.strip():
                    d = json.loads(line)
                    pid = d.get("post_id", "")
                    if pid:
                        ids.add(str(pid))
    return ids

def cmd_humanizer_queue():
    """
    Build a prioritized queue of products needing description humanization.

    Priority = GSC opportunity score × content-needs-work multiplier.
    Products already humanized are excluded.
    Trend signals boost products with rising search interest.
    """
    snapshot = load_latest_snapshot()
    agentic = load_agentic_scores()
    humanized = load_humanized_ids()

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

        # Check if already humanized (by matching slug patterns in humanized IDs)
        # We can't perfectly match slug→ID without WC API, so track by agentic data
        is_humanized = False
        if a and a.get("tier") in ("GOOD", "EXCELLENT"):
            is_humanized = True  # good agentic score suggests content is done

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
        "already_humanized": len(done),
        "needs_humanization": len(todo),
        "queue": todo[:50],
    }

    HUMANIZER_FILE.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    print(f"Humanizer queue: {HUMANIZER_FILE}")
    print(f"  Products in search: {len(product_pages)}")
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

    # ── AUTO: Report title fixes (already done in cmd_fix_titles) ──
    if TITLE_FIX_LOG.exists():
        try:
            tfl = json.loads(TITLE_FIX_LOG.read_text())
            today_fixes = [f for f in tfl.get("fixes", []) if f.get("date") == today_str()]
            if today_fixes:
                slugs = ", ".join(f["slug"][:25] for f in today_fixes[:3])
                auto_done.append(f"Fixed {len(today_fixes)} titles: {slugs}")
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
                "standard": "Title must include 'Buy' prefix + product name + 'Best Price in Bangladesh' + '| Emart'. Under 65 chars.",
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

# ── Auto title fix command ────────────────────────────────────────────────────

TITLE_FIX_LOG = OUTPUT_DIR / "title-fixes.json"

def cmd_fix_titles():
    """
    Auto-fix meta titles for top CTR-gap products.

    Standard:
      Buy {Product Name} | Best Price in Bangladesh - Emart
      Max 65 chars. Drop size first if over, then truncate name.
      Writes _rank_math_title to WooCommerce (buildProductSeoTitle reads it first).
      Only fixes products with position ≤5 and CTR <2%.
      Max 5 per run.
    """
    import ssl, urllib.request, urllib.parse

    queue = json.loads(QUEUE_FILE.read_text()) if QUEUE_FILE.exists() else {}
    targets = [
        p for p in queue.get("priority_queue", [])
        if p["position"] <= 5 and p["ctr"] < 0.02 and p["impressions"] >= 50
    ][:5]

    if not targets:
        print("No title fix targets (no products with pos ≤5 and CTR <2%)")
        return

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    wc_key = os.environ.get("WC_CONSUMER_KEY", "") or os.environ.get("WOO_CONSUMER_KEY", "")
    wc_secret = os.environ.get("WC_CONSUMER_SECRET", "") or os.environ.get("WOO_CONSUMER_SECRET", "")
    if not wc_key or not wc_secret:
        env_file = Path("/var/www/emart-platform/apps/web/.env.local")
        if env_file.exists():
            for line in env_file.read_text().strip().split("\n"):
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    if k.strip() in ("WOO_CONSUMER_KEY", "WC_CONSUMER_KEY"):
                        wc_key = v.strip()
                    elif k.strip() in ("WOO_CONSUMER_SECRET", "WC_CONSUMER_SECRET"):
                        wc_secret = v.strip()
    if not wc_key or not wc_secret:
        print("WooCommerce credentials not found, skipping title fixes")
        return

    fixes = []
    for item in targets:
        slug = item["slug"]

        # Fetch current product name from WC
        try:
            url = (f"https://127.0.0.1/wp-json/wc/v3/products?slug={slug}"
                   f"&consumer_key={wc_key}&consumer_secret={wc_secret}"
                   f"&_fields=id,name,meta_data")
            req = urllib.request.Request(url, headers={"Host": "e-mart.com.bd"})
            resp = urllib.request.urlopen(req, context=ctx, timeout=10)
            products = json.loads(resp.read())
            if not products:
                continue
            product = products[0]
        except Exception as e:
            print(f"  Skip {slug}: fetch failed ({e})")
            continue

        pid = product["id"]
        name = product["name"]

        # Check if _rank_math_title already set to our format
        existing_rm_title = ""
        for m in product.get("meta_data", []):
            if m.get("key") == "_rank_math_title":
                existing_rm_title = m.get("value", "")
        if existing_rm_title.startswith("Buy "):
            continue  # already fixed

        # Build new title: Buy {Name} | Price in Bangladesh - Emart
        # Target: 60-65 chars. Keep as much product name as possible.
        import re

        title_name = name
        suffix = " | Price in Bangladesh - Emart"
        prefix = "Buy "
        max_total = 65

        full = f"{prefix}{title_name}{suffix}"
        if len(full) <= max_total:
            new_title = full
        else:
            # Step 1: drop size from name
            size_match = re.search(r'\s+\d+\s*(ml|g|gm|oz|pcs|kg|l|pack|sheets?)\s*$', title_name, re.I)
            if size_match:
                title_name = title_name[:size_match.start()].strip()
            full = f"{prefix}{title_name}{suffix}"
            if len(full) <= max_total:
                new_title = full
            else:
                # Step 2: truncate name at word boundary
                avail = max_total - len(prefix) - len(suffix)
                title_name = title_name[:avail].rsplit(" ", 1)[0]
                new_title = f"{prefix}{title_name}{suffix}"

        # Write to WooCommerce
        try:
            put_url = (f"https://127.0.0.1/wp-json/wc/v3/products/{pid}"
                       f"?consumer_key={wc_key}&consumer_secret={wc_secret}")
            put_data = json.dumps({
                "meta_data": [{"key": "_rank_math_title", "value": new_title}]
            }).encode()
            put_req = urllib.request.Request(
                put_url, data=put_data, method="PUT",
                headers={"Host": "e-mart.com.bd", "Content-Type": "application/json"},
            )
            urllib.request.urlopen(put_req, context=ctx, timeout=15)
            fixes.append({
                "slug": slug, "product_id": pid,
                "old_title": existing_rm_title or f"{name} Price in Bangladesh | Emart",
                "new_title": new_title,
                "position": item["position"], "impressions": item["impressions"],
            })
            print(f"  ✅ {slug[:45]} → {new_title[:55]}")
        except Exception as e:
            print(f"  ❌ {slug}: write failed ({e})")

    if fixes:
        # Save log
        log = json.loads(TITLE_FIX_LOG.read_text()) if TITLE_FIX_LOG.exists() else {"fixes": []}
        log["fixes"].extend([{**f, "date": today_str()} for f in fixes])
        TITLE_FIX_LOG.write_text(json.dumps(log, indent=2))

        # Revalidate ISR cache
        try:
            secret = os.environ.get("REVALIDATE_SECRET", "")
            if secret:
                urllib.request.urlopen(urllib.request.Request(
                    "https://e-mart.com.bd/api/revalidate",
                    data=json.dumps({"tag": "products"}).encode(),
                    headers={"Content-Type": "application/json", "x-revalidate-secret": secret},
                ), timeout=10)
                print("  Cache revalidated")
        except Exception:
            pass

    print(f"Title fixes: {len(fixes)} applied")
    return fixes

# ── Full command ──────────────────────────────────────────────────────────────

def cmd_full():
    """Run pull + score + trends + blog-gaps + humanizer-queue + fix-titles + actions."""
    cmd_pull()
    print()
    cmd_score()
    print()
    cmd_trends()
    print()
    cmd_blog_gaps()
    print()
    cmd_humanizer_queue()
    print()
    cmd_fix_titles()
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
    "humanizer-queue": cmd_humanizer_queue,
    "actions": cmd_actions,
    "fix-titles": cmd_fix_titles,
}

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "full"
    if cmd not in COMMANDS:
        print(f"Usage: {sys.argv[0]} [{' | '.join(COMMANDS)}]")
        sys.exit(1)
    COMMANDS[cmd]()
