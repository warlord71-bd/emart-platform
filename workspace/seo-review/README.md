# SEO Review System — Emart Skincare Bangladesh

## What This System Does

Automated SEO pipeline that pulls Google Search Console data, scores every product by opportunity, identifies trending queries, prioritizes content humanization, and feeds blog topic selection — all with zero server load.

---

## Working Tree

```
workspace/seo-review/
  |
  |-- gsc_tracker.py              <-- ORCHESTRATOR (run this)
  |-- internal_seo_tool.py        <-- On-page SEO quality scorer
  |
  |-- gsc-daily/                  <-- Daily GSC snapshots
  |     '-- YYYY-MM-DD.json
  |
  |-- priority-queue.json         <-- Top 50 products by SEO opportunity
  |-- humanizer-queue.json        <-- Products needing description work
  |-- search-trends.json          <-- Google Trends + YouTube trends
  |-- blog-topic-candidates.json  <-- Queries without dedicated content
  |-- position-trends.json        <-- Day-over-day position changes
  |
  |-- agentic-score.jsonl         <-- On-page SEO scores per product
  |-- content-gaps.jsonl          <-- Product cluster → buyer guide candidates
  |-- internal-links.jsonl        <-- Cross-linking suggestions
  |-- duplicate-flags.jsonl       <-- Near-duplicate product detection
  |
  '-- README.md                   <-- This file

workspace/humanizer/
  |-- face-cleansers/             <-- Completed: 64 products humanized
  '-- impression-priority/        <-- GSC-driven humanization targets

workspace/scripts/active/
  |-- blog_generator_run.sh       <-- Blog post generator launcher
  |-- humanizer_*.py              <-- Humanizer target scripts
  '-- meta_gen_batch.sh           <-- Meta description generator
```

---

## Tool-by-Tool Working Serial

Any LLM agent working on Emart SEO should follow this exact serial order. Each step feeds the next. Do not skip steps or run out of order.

### STEP 1: GSC Data Pull
```
Tool:     gsc_tracker.py pull
Reads:    Google Search Console API (service account auth)
Writes:   gsc-daily/YYYY-MM-DD.json
Contains: All pages + queries + positions + impressions + CTR (28-day window)
Load:     Zero (one HTTP call to Google)
When:     Daily at 2:30 AM via cron (or manually)
```

### STEP 2: Priority Scoring
```
Tool:     gsc_tracker.py score
Reads:    gsc-daily/YYYY-MM-DD.json + agentic-score.jsonl
Writes:   priority-queue.json
Contains: Top 50 products ranked by opportunity score
Formula:  impressions × (1 - CTR) × position_weight × seo_gap_multiplier
Logic:    Position 1-3 = 3x weight (CTR-fixable via title/desc)
          Position 4-5 = 2.5x weight
          Position 6-10 = 1.5x weight
          Position 10+ = diminishing (needs authority, not title tweaks)
          THIN agentic tier = 1.5x boost (more on-page work to do)
Load:     Zero (reads local JSON files)
```

### STEP 3: Position Trends
```
Tool:     gsc_tracker.py trends
Reads:    Last 2 files in gsc-daily/
Writes:   position-trends.json
Contains: Risers (position improved), fallers (position dropped),
          new pages appearing in search, pages dropped from search
Logic:    Compares same page across two snapshots, flags ±1+ position change
Load:     Zero
Needs:    At least 2 daily snapshots to compare
```

### STEP 4: Blog Topic Gaps
```
Tool:     gsc_tracker.py blog-gaps
Reads:    gsc-daily/YYYY-MM-DD.json
Writes:   blog-topic-candidates.json
Contains: Queries with ≥10 impressions landing on homepage/category
          instead of a dedicated product/blog/guide page
Logic:    Filters out brand searches, classifies as:
          listicle | comparison | how-to | review | buying-guide | skin-type-guide
Feeds:    blog_generator.py topic selection
Load:     Zero
```

### STEP 5: Search Trends (Google + YouTube)
```
Tool:     gsc_tracker.py search-trends
Reads:    gsc-daily/YYYY-MM-DD.json (top 15 non-brand queries)
Writes:   search-trends.json
Contains: Google Trends interest + YouTube search interest per query
          Each classified as: HOT | STEADY | COOLING
Logic:    Compares last-7-day avg vs prior-7-day avg
          >15% rise = rising, >15% fall = falling
          If Google OR YouTube rising → HOT
          If both falling → COOLING
Load:     Zero on VPS (calls Google Trends API, 2s rate limit between queries)
Duration: ~60 seconds for 15 queries
```

### STEP 6: Humanizer Queue
```
Tool:     gsc_tracker.py humanizer-queue
Reads:    gsc-daily/YYYY-MM-DD.json + agentic-score.jsonl + search-trends.json
          + humanizer batch files (to exclude already-done products)
Writes:   humanizer-queue.json
Contains: Products needing description humanization, ranked by priority
Formula:  opportunity_score × content_needs_work_mult × trend_boost
Logic:    THIN tier = 2x content multiplier
          HOT trend query = 1.5x trend boost
          Already humanized = excluded
          Top items = high impressions + poor content + rising search interest
Feeds:    humanizer_face_cleansers.py / humanizer_impression_priority.py
Load:     Zero
```

### STEP 7: On-Page SEO Scoring (weekly, separate tool)
```
Tool:     internal_seo_tool.py
Reads:    Qdrant vectors + WooCommerce API + OpenRouter LLM
Writes:   agentic-score.jsonl, content-gaps.jsonl, internal-links.jsonl,
          duplicate-flags.jsonl
Contains: Per-product agentic-shopping readiness score (0-100),
          tier (THIN/PARTIAL/STRONG/GOLDEN),
          missing fields, content gap clusters, internal link suggestions
Logic:    Scores weighted SEO/AEO dimensions per product:
          locked title, description quality, GTIN/identifier status,
          MPN/brand+productID, Offer price validity, concern tags,
          ingredients, skin type/use case, size, origin, brand,
          FAQ quality, related links, routine compatibility
Load:     Moderate (Qdrant queries + LLM calls) — run weekly, not daily
```

### FULL RUN (Steps 1-4 + 6 in sequence)
```
Tool:     gsc_tracker.py full
Runs:     pull → score → trends → blog-gaps → humanizer-queue
Duration: ~10 seconds
Note:     search-trends is NOT included in full (takes 60s, rate-limited)
          Run search-trends separately before content sprints
```

---

## How Each Output Gets Used

```
priority-queue.json ──────→ HUMAN REVIEW: title/description fixes for top 10
                             "These products rank well but nobody clicks"
                             Action: update meta title, description, or schema

humanizer-queue.json ─────→ CONTENT HUMANIZER: rewrite product descriptions
                             "These products need better content AND have search demand"
                             Action: run humanizer pipeline on top targets

blog-topic-candidates.json → BLOG GENERATOR: new blog post topics
                             "People search these queries but we have no page for them"
                             Action: add to blog_generator.py topic queue

search-trends.json ───────→ PRIORITY BOOST: identifies what's trending NOW
                             "These queries are rising on Google/YouTube right now"
                             Action: fast-track content for HOT queries

position-trends.json ─────→ MONITORING: catch ranking drops early
                             "These products lost position since last snapshot"
                             Action: investigate and fix before traffic drops

agentic-score.jsonl ──────→ ON-PAGE QUALITY: per-product SEO health
                             "These products have thin/missing schema fields"
                             Action: fill missing GTIN, concern tags, FAQ, descriptions
```

---

## Integration Map

```
                    ┌─────────────────────────────────────────┐
                    │           NIGHTLY CRON 2:30 AM          │
                    │     gsc_tracker.py full (10 seconds)    │
                    └──────────────┬──────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
              v                    v                     v
      GSC API (Google)    agentic-score.jsonl    search-trends.json
              │                    │                     │
              v                    v                     v
       gsc-daily/*.json ──→ priority-queue.json ←── trend boost
              │                    │
              │                    ├──→ humanizer-queue.json
              │                    │         │
              │                    │         v
              │                    │    humanizer_*.py ──→ WooCommerce
              │                    │    (rewrite product descriptions)
              │                    │
              v                    v
    blog-topic-candidates.json   Title/desc fixes
              │                  (manual review → deploy)
              v
    blog_generator.py ──→ WordPress blog posts


    WEEKLY (separate):
    internal_seo_tool.py ──→ agentic-score.jsonl
                             content-gaps.jsonl
                             internal-links.jsonl
                             duplicate-flags.jsonl
```

---

## External SEO Scope (not automated — see SEO_MASTER.md §E1-E6)

These require human action, not tooling:

| ID | Task | Owner |
|----|------|-------|
| E1 | BD business directory submissions | Warlord |
| E2 | Google Business Profile verification | Warlord |
| E3 | Product image gallery expansion (3-5 shots per top-100) | Warlord |
| E4 | Social profile backlinks (FB/IG/YT bio → e-mart.com.bd) | Warlord |
| E5 | Beauty blogger/influencer outreach for backlinks | Warlord |
| E6 | Post-purchase review request email activation | Warlord |

---

## Quick Reference

```bash
# Daily full run
python3 workspace/seo-review/gsc_tracker.py full

# Check what's trending before a content sprint
python3 workspace/seo-review/gsc_tracker.py search-trends

# View top 10 priority products
python3 -c "import json; q=json.loads(open('workspace/seo-review/priority-queue.json').read()); [print(f\"{i+1}. {x['slug'][:50]} score:{x['opportunity_score']} pos:{x['position']} impr:{x['impressions']}\") for i,x in enumerate(q['priority_queue'][:10])]"

# View humanizer targets
python3 -c "import json; q=json.loads(open('workspace/seo-review/humanizer-queue.json').read()); [print(f\"{i+1}. {x['slug'][:50]} priority:{x['humanizer_priority']} tier:{x['content_tier']}\") for i,x in enumerate(q['queue'][:10])]"

# Weekly on-page re-score
python3 workspace/seo-review/internal_seo_tool.py
```

## Cron

```
30 2 * * *  cd /root/emart-platform && python3 workspace/seo-review/gsc_tracker.py full >> /tmp/emart-gsc-tracker.log 2>&1
```
