# Emart Social Engine

Social Engine v1 is the approval-first loop for Facebook, Instagram, and future short-form video.
It does not replace human judgement; it makes the daily campaign repeatable and harder to mess up.

## What v1 Does

- Normalizes a campaign manifest into scheduled platform posts.
- Applies duplicate guards against recent campaigns.
- Checks visual QA flags before publishing is allowed:
  - real product identity checked
  - price area clear
  - no dummy/generated product props
  - model-hand/product placement checked for model creatives
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
  --campaign workspace/social-engine/campaigns/2026-06-24-v3.json
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

- No Meta token is read by Social Engine v1.
- No product, price, stock, customer, order, cart, or Woo DB data is written.
- Publish gate is always owner-review-first.
- Scheduler JS files are previews, not live PM2 jobs.
- Active publishing still uses the existing tested Meta adapters after approval.

## Next Build Steps

- Add product-picker adapters from Woo/GA4/GSC/GMC signals.
- Add image-contact-sheet generation directly into the review pack.
- Convert preview schedulers into data-driven production adapters.
- Add post-performance import: reactions, comments, clicks, sales proxy.
- Add separate 1:1 Facebook and 4:5 Instagram asset generation.
