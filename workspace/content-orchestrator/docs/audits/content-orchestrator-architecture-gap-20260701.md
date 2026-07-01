# Content Orchestrator Architecture Gap Audit

Date: 2026-07-01
Scope: `workspace/content-orchestrator/`, Hermes reel entrypoints, Social/Video generated adapters.

## Current Logic Tree

```text
themes.json
  -> demand resolver
     -> plan item
        -> dispatch
           -> content_pack/v1
              -> Social Engine campaign draft
              -> Video Engine queued reel job
              -> content/SEO brief
              -> model-shot request when model_holding_real_product is requested
           -> owner/campaign/content gate
              -> engine-specific approval surface
                 -> Meta scheduler or reel publisher only after approval
```

## Findings

- Architecture is coherent: Creative, Social, Video, scripts, docs, generated assets, social calendar,
  and design changes now live under one Content Orchestrator roof.
- Main production-quality gap was already fixed by `content_pack.py`: Content Orchestrator dispatch,
  daily reels, and Hermes now use the same product/source/image/script/voice/frame/QA/cost contract.
- Remaining metadata gap: generated social/video jobs could still report `_orchestrator.gate=campaign`
  even when the theme gate was `owner` or `content`.
- Remaining frame-contract gap: static social packs with a product image could claim a
  `model_holding_real_product` reel frame even when only `post_1x1` / `post_4x5` assets were requested.
- Remaining Hermes readback gap: Hermes looked for a non-existent `stages.master_qa` field after reel
  builds; the worker writes QA under `stages.qa`.
- Remaining path gap: generated Meta scheduler adapters still had a fallback to the retired
  `/var/www/emart-platform/workspace/...` tree.
- Remaining bridge edge case: a remote product image URL could be coerced into a bogus local path in
  the older Codex bridge handoff branch.

## Fixes Applied

- Threaded the true theme gate into `content_pack.build_social_campaign_job()` and
  `content_pack.build_video_job()`.
- Changed static-only content packs to use static frames only; reel-like formats still get the
  model/product/value/brand frame contract when a real product image exists.
- Updated Content Orchestrator dispatch to pass `item["gate"]` into the content pack.
- Updated Hermes reel preview QA readback to use `stages.qa`.
- Updated generated Meta scheduler fallbacks to `/root/emart-platform/workspace/...`.
- Preserved remote product URLs in the older Codex bridge path.

## Remaining Intentional Gaps

- `ingredients_catalog` is still a placeholder until a real ingredient taxonomy/source is wired.
- `reviews_native` depends on approved Woo/native magic-link review flow data.
- TikTok remains output-gated until account/app approval is confirmed.
- Paid image/voice/model QA should remain escalation-only: free Creative Engine composition, Edge TTS,
  deterministic script, and local/master QA are the default cost-saving lane.

## Verification

- `python3 -m py_compile` for changed Python files.
- `node --check workspace/content-orchestrator/scripts/active/meta_schedule.js`.
- Video quality-gate tests.
- Social Engine unittest suite.
- In-memory content-pack smoke: static social gate/frames and content-gated reel gate/frames.
- Dry-run owner-gated clearance dispatch: `approval_status=draft`, `_orchestrator.gate=owner`,
  pack approval gate `owner`, static frames only, no publish/Woo write.
