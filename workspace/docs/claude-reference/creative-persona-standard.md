# Creative Persona Standard

Status: active standard proposal, created 2026-06-26 after the Creative Engine migration.

## Goal

Use persona assets best when they show the exact real product in hand or beside the face. Product truth stays first: every commercial creative must show the real product pack. If Codex/product-in-hand generation is pending or unavailable, one model-only frame is allowed as a fallback inside a reel.

## Current Assets

| Persona | Current files | Quality status | Production role |
|---|---|---|---|
| `emart-model` | `clean-portrait.png`, `reference-holding.png` | 1080x1920 PNG | Default model-only fallback while Codex product-in-hand asset is pending; identity reference for premium holding shots |
| `ayesha-hijabi` | `portrait`, `explaining`, `holding_product` library files | 768x768 JPEG data saved as `.png` | Concept/role only until regenerated |
| `dr-rumana` | `portrait`, `explaining`, `holding_product` library files | 768x768 JPEG data saved as `.png` | Concept/role only until regenerated |
| `nusrat` | `portrait`, `explaining`, `holding_product` library files | 768x768 JPEG data saved as `.png` | Concept/role only until regenerated |

## Use Rules

1. Product-first frame is the default for reels.
   - Use Creative Engine `hero_vertical`.
   - It should be frame 1 for product promos, discounts, new arrivals, and catalog-backed reels.

2. Preferred persona frame: real product visibly in hand or beside the face.
   - The product must be the exact product reference for the SKU.
   - The product label/shape must be recognizable.
   - The frame should feel like product presentation, not a generic model portrait.
   - Save approved files as `holding_images`.

3. Model-only fallback is allowed only when a requested product-in-hand asset is pending.
   - Trigger: job has `holding_request: true`, but Codex has not returned an approved generated image yet.
   - Default fallback face: `emart-model/clean-portrait.png`, or one selected persona still if the job explicitly sets `persona_library`.
   - Disable per job with `model_fallback: false`.
   - Do not use plain model portraits on white/studio backgrounds as product content.
   - Do not use product-tile overlays as the default persona standard.
   - `presenter_card.py` may remain as an internal experiment, but it is not the production standard.

4. Product-in-hand / beside-face persona images are campaign assets.
   - Use Codex/image generation only when owner wants a higher-emotion product-in-hand creative.
   - The output must use the exact real product reference and be reviewed for dummy packaging, distorted hands, skin-tone drift, and brand/logo artifacts.
   - Save approved files as `holding_images` in the reel/social manifest.

5. One face per reel.
   - A reel should not mix `emart-model`, `ayesha-hijabi`, `dr-rumana`, and `nusrat` in the same output.
   - If the opener uses a persona, all persona frames in that reel should use the same identity.

## Persona Role Map

| Need | Preferred persona |
|---|---|
| General Emart trust / default presenter | `emart-model` as identity reference only; requires approved product-in-hand/beside-face asset |
| Modest-friendly routine, family-trusted pick, Eid prep | `ayesha-hijabi` after 1080x1920 regeneration |
| Ingredient education, routine order, expert-style explainer | `dr-rumana` after 1080x1920 regeneration |
| Relatable review, budget pick, creator/haul tone | `nusrat` after 1080x1920 regeneration |

## Asset Requirements

- Native frame: 1080x1920 PNG or high-quality JPEG.
- Minimum face crop: product can appear beside cheek/face or naturally in hand without blocking captions.
- No visible third-party brand/logo/text in persona base image.
- Authentic Bangladeshi skin tone; no whitening drift.
- Modest, respectful styling.
- Stable seed/identity recorded in `bible.json`.
- Each persona needs at least:
  - `identity_reference`
  - `product_in_hand_real_reference`
  - `product_beside_face_real_reference`
  - optional `explaining_with_product_visible`

## Reel Sequence Standard

Default product reel:

1. Creative Engine `hero_vertical` real product frame.
2. Approved product-in-hand/beside-face persona frame if available.
3. Model-only fallback frame if Codex holding-shot generation is pending and fallback is enabled.
4. Creative Engine `scene_value` with 3 concise points.
5. Creative Engine `scene_brand_end`.

Educational reel:

1. Approved product-in-hand/beside-face persona frame, model fallback, or `scene_value` hook.
2. Product hero if a SKU is being promoted.
3. Value card / routine card.
4. Brand end card.

## Next Hardening

- Regenerate `ayesha-hijabi`, `dr-rumana`, and `nusrat` at native 1080x1920.
- Add a persona manifest validator: fail if a reel mixes more than one persona ID.
- Add visual QA prompt for persona frames: exact product visible in hand/beside face, no dummy pack, face not distorted, no skin whitening, no text overlap.
