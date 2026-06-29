# Visual Pipeline Rules

Creative Engine is the only place for final visual composition logic.

## Engine Ownership

- `workspace/content-orchestrator/creative-engine`: owns image/layout/composition templates.
- `workspace/content-orchestrator/social-engine`: owns campaign selection, approval packs, static scheduling.
- `workspace/content-orchestrator/video-engine`: owns reel sequencing, voiceover, QA, hosting, Telegram approval.
- `content-orchestrator`: owns strategy, dispatch, gates, and engine routing.

## No-Hallucination Product Rule

For product ads and reels, AI/generated imagery may provide a model, background, or lifestyle scene, but the product pack itself must be a real product image/cutout layered by Creative Engine.

Required for model/product frames:

- Use a verified product source image or approved product cutout.
- Composite the real product layer through Creative Engine.
- Do not generate replacement packaging, labels, logos, ingredient text, claims, or product shape.
- If the real product image is missing or unclear, fail closed and ask for a replacement source.
- If extra objects appear beside the tube/jar/bottle, crop/replace before render.

## Reel Rule

Six-reel batches should use:

- First frame: model + exact real product, via `model_holding_real_product`.
- Second frame: real product hero/card.
- Middle frame: one concise value card.
- Last frame: Emart brand/COD card.
- Voiceover: natural Bangla/Banglish, product-specific, no medical/curative claims.
- Output gate: video QA pass, then `jobs/review`, then Telegram approval.

## Static Rule

Static posts should use:

- Real product cutout only.
- Emart logo from the site asset.
- Price/product name from the approved CSV/plan.
- No fake badges, no misspelled authenticity labels, no generated package text.

## Runtime Safety

The engines physically live under `workspace/content-orchestrator/`. Root-level `workspace/creative-engine`, `workspace/social-engine`, and `workspace/video-engine` remain compatibility links for PM2/crontab/import paths while runtime migration is completed and smoke-tested.
