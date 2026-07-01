# Content Pack Contract

Version: 2026-07-01-v1
Status: active implementation in `workspace/content-orchestrator/content_pack.py`

`content_pack` is the canonical production contract for Emart static social assets and reels. It
keeps Content Orchestrator dispatches, the daily reel producer, and Hermes manual reel jobs on one
standard instead of separate thin/rich job formats.

## Required Sections

| Field | Purpose |
|---|---|
| `schema_version` | Current value: `content_pack/v1` |
| `product` | Normalized product id, name, slug, price, brand, category, image, class |
| `product_source` | Source of the product data, such as `woo_product_detail`, `performance_scores`, or `storefront_api` |
| `image_source` | `woo_or_site_url`, `local_cutout`, `web_verified_required`, `missing`, or `local_reference_missing` |
| `script` | Hook, benefits, caption, hashtags, voiceover, provider, and deterministic QA report |
| `visuals` | Formats, frame order, platforms, safe-zone policy, and design template |
| `qa` | Content gate, image identity gate, voice-required flag, master QA, and owner approval requirement |
| `cost` | Default tier is free; escalation allowed only for QA failure or explicit owner approval |
| `approval` | Draft/review/approved state; all external publishing remains owner-gated |

The `approval.gate` value must carry the source theme gate (`campaign`, `content`, or `owner`) when
the pack is emitted by Content Orchestrator. Static-only post packs should not claim reel/model
frames; reel-like packs use the default reel standard below.

## Default Reel Standard

Free/default reels should include:

- `model_holding_real_product` frame when a real product image exists
- `product_hero`
- `value_card`
- `brand_card`
- deterministic product-class script (`content_pack_template`)
- `voice_required: true`
- `qa_provider: master`
- `qa_block_on_vision: true`
- `tier_target: free`

## Cost Rule

Do not jump to paid generation first. Use:

1. Creative Engine composition
2. real Woo/local product image or cutout
3. deterministic content-pack script
4. Edge TTS voice
5. local/master QA plus free OpenRouter vision when available

Escalate to Codex/imagegen, paid voice, or paid model QA only when the free output fails QA or the
owner approves premium output for a specific campaign.

## Current Producers

- `orchestrator.py dispatch` uses `build_social_campaign_job()` and `build_video_job()`.
- `video-engine/daily_producer.py` uses `build_video_job()`.
- `workspace/hermes/app.py` uses `build_video_job()` and then calls `video-engine/enqueue.py`.

All three paths stay dry-run/approval-first. This contract does not authorize Woo writes, automatic
discounts, stock changes, checkout/cart/payment/order/customer-data changes, or direct publishing.
