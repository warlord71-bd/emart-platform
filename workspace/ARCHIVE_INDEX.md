# Emart Archive Index
> **For any LLM/agent:** Read this before doing any audit, fix, or research task.
> Nothing is deleted — only filed. Search here to find what is in store.
> Last updated: 2026-06-04

---

## Quick lookup

| What you need | Where to look |
|---|---|
| GSC keyword/traffic data | `audit/archive/gsc-exports/` |
| Product size/brand/SKU fixes | `audit/archive/product-audits/` |
| Face cleanser humanizer history | `audit/archive/face-cleansers-*` |
| SEO origin/concern taxonomy | `audit/archive/pa-origin-*, pa-concern-*` |
| Old Codex job specs | `scripts/archive/2026-06/CODEX_*` |
| Applied PHP scripts | `scripts/archive/2026-06/*.php` |
| Lighthouse/perf reports | `audit/archive/lighthouse-*` |
| Currently active files | Bottom of this file — "Active Quick Ref" |

## Current Workspace Consistency Baseline — 2026-06-04

Before starting any new job, verify these five layers and do not recreate stale
paths:

1. Live site: homepage, product page, sitemap, robots.txt, WP post-SEO API,
   newsletter, and checkout were confirmed HTTP 200.
2. PM2 jobs: `emartweb`, `emart-presence`, `emart-meta-gen`,
   `emart-serp-checker`, `emart-seo-autoscan`, `emart-checkout-monitor`,
   and `emart-competitor-prices` are the expected active jobs. Old
   `emart-humanizer-rest` and `emart-humanizer-regular` jobs were removed and
   their scripts archived.
3. Active script/doc layout: face-cleanser humanizer source of truth is
   `workspace/humanizer/face-cleansers/`; do not use the old
   `workspace/docs/humanizer_face_cleansers.py` path.
4. Active face-cleanser run files live under
   `workspace/humanizer/face-cleansers/active/`; do not use old
   `workspace/audit/active/face-cleansers-*` paths for new work.
5. Memory/state: face-cleansers progress is `185/218`; holdout remains 13 and
   should not be touched.

For new files or scripts: check this archive index, project rules, and existing
scripts first; reuse or move an existing tool before creating a new one.

---

## GSC Exports (`audit/archive/gsc-exports/`)

| File | Date | Contents | Use for |
|---|---|---|---|
| `organic-traffic-non-product-2026-06-02.csv` | Jun 2 | Clicks/impressions for non-product pages | Blog SEO gap analysis |
| `gsc-search-queries-summary-2026-06-02.csv` | Jun 2 | Top queries — summary view | Quick keyword check |
| `gsc-search-queries-full-2026-06-02.csv` | Jun 2 | Top queries — full export | Keyword research, content gaps |
| `gsc-product-description-opportunities-2026-05-28.csv.gz` | May 28 | Products Google flagged for thin descriptions | Humanizer prioritization |

---

## Product Audits (`audit/archive/product-audits/`)

| File | Date | Contents | Status |
|---|---|---|---|
| `product-data-mismatch-20260529.xlsx` | May 29 | Title/size/brand mismatches | Reference for future corrections |
| `product-size-corrections-*.csv` | May 29 | 115 size corrections dry-run + applied | Applied |
| `product-data-mismatch-audit-*.csv/md` | May 29 | 3-pass mismatch audit reports | Done |

---

## Face Cleanser Humanizer History (`audit/archive/`)

185/218 done as of 2026-06-04. Holdout: 13 products (measure 2026-07-26).

| File | Contents |
|---|---|
| `face-cleansers-rollback-2026-06-01*.json` | Jun 1 batch rollbacks |
| `face-cleansers-2026-06-01.jsonl` | Jun 1 reviewed JSONL |
| `face-cleansers-2026-05-31.jsonl` | May 31 first generation |
| `cosrx-low-ph-humanizer-rollback-*.json` | Individual COSRX rollbacks May 31 |
| `cleanser-humanizer-5-*.jsonl/md` | 5-product test runs May 31 |
| `cleanser-ingredient-fixes-rollback-*.json` | Ingredient tab cleanup rollback |
| `face-cleansers-humanized-consistency-audit-20260603-*.csv` | Earlier audit (superseded by final) |

**Active (NOT archived):**
- `humanizer/face-cleansers/active/face-cleansers-2026-06-03.jsonl` — current batch
- `humanizer/face-cleansers/active/face-cleansers-rollback-2026-06-03.json` — current rollback
- `humanizer/face-cleansers/active/face-cleansers-humanized-consistency-audit-final-*.csv` — current audit

---

## SEO Taxonomy Work (`audit/archive/`)

| File | Contents | Status |
|---|---|---|
| `pa-origin-custom-origin-sync-*.csv` | Brand→origin assignment, 3641 products | **Applied** 2026-05-25 |
| `pa-concern-dry-run-*.csv` | Concern taxonomy candidates | **NOT applied** — owner sign-off needed |
| `pa-concern-highmed-approved.csv` | High/med confidence rows ready to apply | Pending owner |
| `seo-origin-text-sync-*.csv` | Origin-safe copy replacement | **Applied** 2026-05-25 |
| `price-normalize-*.csv` | Price normalization dry-run | Not applied |
| `product-sku-audit-dry-run-*.csv` | 119 products missing SKU | Not applied — needs owner |
| `wc-key-rotation-20260523.md` | Key rotation log: key_ids 2/3/26/32 revoked | Reference |

---

## Performance / Lighthouse (`audit/archive/`)

| File | Contents |
|---|---|
| `lighthouse-home-20260603-*.json/html` | 4 Lighthouse runs before/after analytics deferral |
| `emart-homepage-mcp-test.png` | Homepage screenshot via Playwright MCP |

---

## Archived Scripts (`scripts/archive/2026-06/`)

**Applied one-time scripts** (DB changes already live):

| Script | What it did |
|---|---|
| `pa-origin-custom-origin-sync.php` | Assigned pa_origin by brand (3641 products) |
| `apply-cleanser-*.php` | Applied humanizer content to face-cleanser products |
| `apply-cosrx-low-ph-humanized.php` | First humanizer apply |
| `sync-cleanser-woodmart-ingredient-tabs.php` | Synced ingredient tabs |
| `emart-structured-description-price-sync.php` | Synced structured description prices |
| `seo-origin-text-sync.php` | Replaced Korea-import copy with origin-safe text |
| `product-size-corrections-from-review.php` | Applied 115 size corrections |
| `generate-cleanser-5-samples.py` | Early test run (5 products) |
| `generate-product-faq-*.mjs` | FAQ generation scripts |
| `blog_generator.py / blog_refiner.py` | Blog post generation (superseded by emart-auto-publisher skill) |
| `blog_image_featured_upload.py` | Blog image upload automation |
| `sync-local-to-vps.sh` | Replaced by root `deploy.sh` |
| `pa-concern-*.py` | pa_concern dry-run scripts |
| `run_face_cleanser_rest_dryrun_20260603.sh` | PM2 dry-run wrapper |
| `openclaw_face_cleanser_dryrun_batch.sh` | OpenClaw dry-run helper |

**Codex job definitions** (completed):

| File | What it defined |
|---|---|
| `CODEX_JOB_BLOG_IMAGES.json` | Blog image pipeline job |
| `CODEX_JOB_INGREDIENT_CONTENT.json` | Ingredient content generation |
| `CODEX_JOB_PA_CONCERN_LOW.json` | pa_concern low-confidence batch |
| `CODEX_TASK_*.md` | Human-readable task briefs |

---

## Archived Docs (`docs/archive/`)

| File | Contents |
|---|---|
| `CODEX-PROMPT-face-cleanser-next-batch.md` | Old prompt template (superseded — now in humanizer_face_cleansers.py) |
| `CODEX-TASK-product-content-humanizer.md` | Original humanizer task spec (superseded by CLAUDE-product-humanizer-guide.md) |

---

## Active Files Quick Reference

```
workspace/
  TASKS.md                              ← unified task board (read first)
  ARCHIVE_INDEX.md                      ← this file
  SEO_MASTER.md                         ← SEO strategy
  BRAND_GUIDE.md                        ← brand invariants
  DEV_MASTER.md                         ← stack version locks

  audit/active/
    baseline-snapshot-2026-05-31.json   ← GSC baseline for humanizer
    gsc-query-map-2026-05-31.json       ← per-product top queries
    404-redirect.xlsx                   ← redirect fix tracker
    products-need-real-image.csv        ← image gaps
    manual-review-size-notmatched.csv   ← pending manual size review
    onpage-pdp-targets.txt              ← PDP optimization list
    openclaw-face-cleansers-dryrun-*.log ← latest openclaw log

  humanizer/face-cleansers/
    README.md                           ← humanizer operating note
    humanizer_face_cleansers.py         ← face cleanser humanizer (ACTIVE)
    active/
      face-cleansers-2026-06-03.jsonl   ← CURRENT humanizer batch
      face-cleansers-rollback-*.json    ← ACTIVE rollbacks — do not delete
      face-cleansers-*-final-*.csv/md   ← CURRENT consistency audit

  docs/
    meta_generator.py                   ← catalog meta generation (ACTIVE)
    meta_validator.py                   ← meta validator (ACTIVE)
    baseline_snapshot.py                ← GSC snapshot tool
    catalog-lighthouse-fast-audit.mjs   ← read-only PDP audit
    mobile-build-notes.md               ← mobile app build config
    CLAUDE-product-humanizer-guide.md   ← humanizer operating guide
    category-taxonomy-status.md         ← category decisions
    theme-contract.md                   ← UI contract

  scripts/active/
    checkout_monitor.js                 ← PM2: 15-min checkout test
    competitor_price_checker.js         ← PM2: daily competitor prices
    seo_auto_scan.sh                    ← PM2: daily blog SEO fill
    meta_gen_batch.sh                   ← PM2: continuous meta generator
    google_sheets_setup.js              ← Sheets webhook reference
```
