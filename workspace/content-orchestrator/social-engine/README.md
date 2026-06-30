# Emart Social Engine

Social Engine v1 is the approval-first loop for Facebook, Instagram, and future short-form video.
It does not replace human judgement; it makes the daily campaign repeatable and harder to mess up.

## What v1 Does

- Picks a campaign from read-only Woo product data while avoiding recent history.
- Can weight product picking with optional read-only performance scores by product, brand, or category.
- Imports post performance from a publish ledger, with optional explicit Meta Graph insights fetch.
- Normalizes a campaign manifest into scheduled platform posts.
- Applies duplicate guards against recent campaigns.
- Keeps recent published/rejected product memory in hot runtime files while archiving finished
  social/video jobs into category-wise logical history under `history/logical-history/`.
- Records owner-rejected plans/lists so rejected products do not return in the next approval pack.
- Generates 1080×1350 Instagram variants. When Creative Engine is available this is a native
  `post_4x5` render; otherwise it falls back to the older blur-derived crop.
- Emits a contact sheet in the review pack for fast visual comparison.
- Reports design-template and asset-source consistency in QA.
- Runs local Creative QA before approval:
  - design theme registry checks
  - image resolution/aspect/detail checks
  - product image source metadata checks
  - OCR text scan with Tesseract
  - rejected visual-design hash matching
  - theme/category/container mismatch warnings
- Checks visual QA flags before publishing is allowed:
  - real product identity checked
  - price area clear
  - no dummy/generated product props
  - model-hand/product placement checked for model creatives
- Optionally runs actual image inspection through free OpenRouter vision models; failures or provider
  unavailability block the review pack instead of trusting the manifest checkboxes.
- Vision QA now uses a stricter art-director rubric: product identity, one clear hero item, text
  quality, premium finish, design consistency, model/product match, source artifacts, and layout
  safety must all pass.
- Deduplicates reused FB/IG assets and checks up to four unique images concurrently. Each free-model
  request has a hard transport timeout; the provider can still make a full campaign preflight slow.
- Checks platform caption rules:
  - Facebook: buying URL belongs in the first comment, not caption body.
  - Instagram: no raw product URLs; use DM / link in bio language.
- Checks local public assets and image dimensions when the files exist.
- Emits a review pack:
  - `campaign-plan.json`
  - `qa-report.json`
  - `review.md`
  - scheduler preview JS files
  - optional video-engine queue jobs for items marked `make_reel: true`

## Product Image Standard

- Use one clear, high-quality exact-product image per post/reel featured item.
- Do not use confusing multi-product collages unless the campaign is explicitly approved as a bundle,
  kit, or comparison creative.
- Image source priority is: existing high-quality local/Woo image, better exact-product Emart asset,
  then trustworthy web-fetched exact-product image when our system image is missing or too weak.
- Review packs should note the image source so the owner can approve or reject before scheduling.

## Creative QA Standard

The system should fail before scheduling when a rendered asset looks like something a human would
reject. The local gate is deterministic and runs by default during `plan`; the model-based gate is
added with `--vision-qa`.

Review output files:

```text
qa-report.json
creative-qa-report.json
vision-qa-report.json      # only when --vision-qa is used
review.md
contact-sheet.jpg          # when --contact-sheet is used
```

The local gate blocks or warns on:

- low-resolution or wrong-ratio assets
- OCR-visible reference brands such as Nykaa/Skintastic
- placeholder text, unsafe visible claims, or garbled text
- generated-image source metadata without exact-product cutout/source proof
- repeated visual layouts stored in `history/rejected-designs.json`
- theme/category/container mismatches, for example SPF sky theme on a haircare item

Approved candidate theme IDs:

```text
aqua_bubble_hero
soft_grid_concern
clinical_note_card
search_concern_card
summer_spf_sky
```

`emart-social-card-v1` remains supported as a legacy fallback, but new campaign work should move to
one of the approved candidate themes after owner approval.

## Run

```bash
python3 workspace/content-orchestrator/social-engine/social_engine.py plan \
  --campaign workspace/content-orchestrator/social-engine/campaigns/2026-06-24-v3.json \
  --make-ig-variants \
  --contact-sheet \
  --vision-qa
```

Output defaults to:

```text
workspace/content-orchestrator/social-engine/output/<date>/<campaign-id>/
```

## Campaign Flow

1. Product picker chooses non-repeated products.
2. Creative pipeline generates static image or video source.
3. Product/image QA verifies identity, price readability, and model placement.
4. Social Engine creates the FB/IG plan and review pack.
5. Owner approves the review pack.
6. Meta scheduler/comment worker runs from the approved plan.
7. Performance data goes back into the next product/caption selection pass.

## Pick and Record

```bash
python3 workspace/content-orchestrator/social-engine/social_engine.py pick \
  --date 2026-06-25 \
  --id 2026-06-25-daily \
  --name "June 25 Daily Social" \
  --out workspace/content-orchestrator/social-engine/campaigns/2026-06-25-daily.json \
  --count 18 \
  --pipeline-count 10 \
  --performance workspace/content-orchestrator/social-engine/performance/latest.json

python3 workspace/content-orchestrator/social-engine/social_engine.py record \
  --campaign workspace/content-orchestrator/social-engine/output/2026-06-25/2026-06-25-daily/campaign-plan.json
```

`record` should be run after a campaign is actually published or intentionally locked as used.
The live scheduler can also append history automatically after a completed publish loop:

```bash
node workspace/content-orchestrator/scripts/active/meta_schedule.js \
  --plan workspace/content-orchestrator/social-engine/output/2026-06-25/2026-06-25-daily/campaign-plan.json \
  --platform facebook \
  --publish \
  --record-history workspace/content-orchestrator/social-engine/history/published-products.json \
  --result-ledger workspace/content-orchestrator/social-engine/performance/published-results.jsonl
```

Dry-runs never record history. Re-running FB/IG with the same campaign ID safely replaces the same
history row instead of duplicating it. After a live publish loop, `meta_schedule.js` also runs
`archive-done`: once all expected FB/IG rows exist, the campaign is copied to
`history/logical-history/social/published/campaigns/<date>/` and category indexes are written under
`history/logical-history/social/published/by-category/<category>/<date>/`.

## Rejection Memory

When the owner rejects a campaign or approval table, record it before picking the next batch:

```bash
python3 workspace/content-orchestrator/social-engine/social_engine.py reject \
  --source workspace/audit/active/social-reel-approval-YYYYMMDD/approval-table.csv \
  --reason "owner rejected creative/list"
```

Both `pick` and `plan` read `history/published-products.json` and
`history/rejected-products.json` by default. Published products use the campaign lookback window;
rejected products default to a 14-day block, adjustable with `--rejected-lookback-days`.
When the rejected source is a campaign JSON with local assets, `reject` also stores visual image
signatures in `history/rejected-designs.json`, so similar rejected layouts can be blocked later.
These hot memory files are runtime state and are ignored by git; `archive-done` compacts them while
preserving the full completed record in logical history.

## Generated Asset Cleanup

Finished social/video state cleanup is automatic in the publish/reject paths, and can be run
manually:

```bash
python3 workspace/content-orchestrator/social-engine/social_engine.py archive-done \
  --campaign workspace/content-orchestrator/social-engine/output/YYYY-MM-DD/CAMPAIGN/campaign-plan.json \
  --apply
```

Video jobs in `video-engine/jobs/published` and `video-engine/jobs/rejected` are moved into
`history/logical-history/video/{published,rejected}/...`, including category indexes, so those hot
folders stay clear.

After a campaign is posted or closed, dry-run asset cleanup first:

```bash
python3 workspace/content-orchestrator/social-engine/social_engine.py cleanup-assets \
  --campaign workspace/content-orchestrator/social-engine/output/YYYY-MM-DD/CAMPAIGN/campaign-plan.json
```

If the listed files are safe to clear, rerun with `--apply`. Assets are moved to
`/root/.attic-YYYY-MM-DD/emart-social-assets/<campaign>/` rather than deleted.

`--performance` is optional. When present, the picker ranks eligible non-repeated Woo products by
the score file format shown in `performance/example.json`:

```json
{
  "products": {
    "123": 8.5,
    "product-slug": {"score": 5}
  },
  "brands": {
    "cosrx": 1.5
  },
  "categories": {
    "sunscreen": 3
  }
}
```

If no performance file is supplied, selection falls back to the Woo order, usually `popularity`.

## Performance Import

After approved live publishing, the scheduler can append one JSONL row per post through
`--result-ledger`. Then import those results into the score file used by the next picker run:

```bash
python3 workspace/content-orchestrator/social-engine/social_engine.py import-performance \
  --campaign workspace/content-orchestrator/social-engine/output/2026-06-25/2026-06-25-daily/campaign-plan.json \
  --ledger workspace/content-orchestrator/social-engine/performance/published-results.jsonl \
  --include-gsc \
  --include-gmc \
  --out workspace/content-orchestrator/social-engine/performance/latest.json
```

If the ledger has social post IDs and the runtime Meta token is configured, add `--fetch-meta` to
pull reactions, comments, shares, clicks, reach, impressions, likes, and saves where Meta exposes
them:

```bash
python3 workspace/content-orchestrator/social-engine/social_engine.py import-performance \
  --campaign workspace/content-orchestrator/social-engine/output/2026-06-25/2026-06-25-daily/campaign-plan.json \
  --ledger workspace/content-orchestrator/social-engine/performance/published-results.jsonl \
  --fetch-meta \
  --allow-partial \
  --out workspace/content-orchestrator/social-engine/performance/latest.json
```

`--include-gsc` imports the latest local `workspace/seo-review/gsc-daily/*.json` product-page
metrics. `--include-gmc` imports `/root/.gmc/issues_detail.json` as product penalties so products
with feed issues are less likely to be picked until fixed. `--ga4 path.jsonl` can import a local
GA4 export with `slug`/`path`/`product_id` plus sessions, views, conversions, or revenue.

Create that GA4 product export with:

```bash
python3 workspace/content-orchestrator/scripts/active/ga4_product_export.py \
  --days 28 \
  --out workspace/content-orchestrator/social-engine/performance/ga4-product-latest.jsonl
```

Then merge it into the picker score model:

```bash
python3 workspace/content-orchestrator/social-engine/social_engine.py import-performance \
  --include-gsc \
  --include-gmc \
  --ga4 workspace/content-orchestrator/social-engine/performance/ga4-product-latest.jsonl \
  --out workspace/content-orchestrator/social-engine/performance/latest.json
```

The command writes only local JSON. It never publishes, never changes Woo data, and redacts Meta
token/error details.

## Video Engine Bridge

For any campaign item with:

```json
"make_reel": true
```

the engine writes a dry-run video job under:

```text
output/<date>/<campaign-id>/video-queue/
```

Those JSON files match `workspace/content-orchestrator/video-engine/worker.py` job format. The video engine remains
dry-run by default unless `--allow-publish` is explicitly used there.

## Safety Defaults

- No Meta token is read by normal planning/picking. Only `import-performance --fetch-meta` reads the
  configured Meta page token, and only to fetch post insights.
- No product, price, stock, customer, order, cart, or Woo DB data is written.
- Publish gate is always owner-review-first.
- `--vision-qa` is strict: missing credentials, exhausted free models, uncertain product identity,
  obscured prices, dummy products, or broken layouts block publishing.
- Omitting `--vision-qa` preserves the existing manual-attestation fallback for offline planning.
- Scheduler JS files are previews, not live PM2 jobs.
- Active publishing still uses the existing tested Meta adapters after approval.

## Next Build Steps

- Add sales-proxy joins into `performance/latest.json`.
- Add per-creative manifest capture: product snapshot, tokens version, QA result, and final platform URL.
