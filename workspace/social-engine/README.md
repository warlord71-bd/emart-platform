# Emart Social Engine

Social Engine v1 is the approval-first loop for Facebook, Instagram, and future short-form video.
It does not replace human judgement; it makes the daily campaign repeatable and harder to mess up.

## What v1 Does

- Picks a campaign from read-only Woo product data while avoiding recent history.
- Can weight product picking with optional read-only performance scores by product, brand, or category.
- Imports post performance from a publish ledger, with optional explicit Meta Graph insights fetch.
- Normalizes a campaign manifest into scheduled platform posts.
- Applies duplicate guards against recent campaigns.
- Can record completed campaigns back into `history/published-products.json`.
- Generates 1080×1350 Instagram variants from 1080×1080 Facebook assets.
- Emits a contact sheet in the review pack for fast visual comparison.
- Reports design-template and asset-source consistency in QA.
- Checks visual QA flags before publishing is allowed:
  - real product identity checked
  - price area clear
  - no dummy/generated product props
  - model-hand/product placement checked for model creatives
- Optionally runs actual image inspection through free OpenRouter vision models; failures or provider
  unavailability block the review pack instead of trusting the manifest checkboxes.
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

## Run

```bash
python3 workspace/social-engine/social_engine.py plan \
  --campaign workspace/social-engine/campaigns/2026-06-24-v3.json \
  --make-ig-variants \
  --contact-sheet \
  --vision-qa
```

Output defaults to:

```text
workspace/social-engine/output/<date>/<campaign-id>/
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
python3 workspace/social-engine/social_engine.py pick \
  --date 2026-06-25 \
  --id 2026-06-25-daily \
  --name "June 25 Daily Social" \
  --out workspace/social-engine/campaigns/2026-06-25-daily.json \
  --count 18 \
  --pipeline-count 10 \
  --performance workspace/social-engine/performance/latest.json

python3 workspace/social-engine/social_engine.py record \
  --campaign workspace/social-engine/output/2026-06-25/2026-06-25-daily/campaign-plan.json
```

`record` should be run after a campaign is actually published or intentionally locked as used.
The live scheduler can also append history automatically after a completed publish loop:

```bash
node workspace/scripts/active/meta_schedule.js \
  --plan workspace/social-engine/output/2026-06-25/2026-06-25-daily/campaign-plan.json \
  --platform facebook \
  --publish \
  --record-history workspace/social-engine/history/published-products.json \
  --result-ledger workspace/social-engine/performance/published-results.jsonl
```

Dry-runs never record history. Re-running FB/IG with the same campaign ID safely replaces the same
history row instead of duplicating it.

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
python3 workspace/social-engine/social_engine.py import-performance \
  --campaign workspace/social-engine/output/2026-06-25/2026-06-25-daily/campaign-plan.json \
  --ledger workspace/social-engine/performance/published-results.jsonl \
  --include-gsc \
  --include-gmc \
  --out workspace/social-engine/performance/latest.json
```

If the ledger has social post IDs and the runtime Meta token is configured, add `--fetch-meta` to
pull reactions, comments, shares, clicks, reach, impressions, likes, and saves where Meta exposes
them:

```bash
python3 workspace/social-engine/social_engine.py import-performance \
  --campaign workspace/social-engine/output/2026-06-25/2026-06-25-daily/campaign-plan.json \
  --ledger workspace/social-engine/performance/published-results.jsonl \
  --fetch-meta \
  --allow-partial \
  --out workspace/social-engine/performance/latest.json
```

`--include-gsc` imports the latest local `workspace/seo-review/gsc-daily/*.json` product-page
metrics. `--include-gmc` imports `/root/.gmc/issues_detail.json` as product penalties so products
with feed issues are less likely to be picked until fixed. `--ga4 path.jsonl` can import a local
GA4 export with `slug`/`path`/`product_id` plus sessions, views, conversions, or revenue.

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

Those JSON files match `workspace/video-engine/worker.py` job format. The video engine remains
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

- Add GA4/GSC/GMC or sales-proxy joins into `performance/latest.json`.
- Add native 4:5 creative generation instead of derived IG variants when source images support it.
