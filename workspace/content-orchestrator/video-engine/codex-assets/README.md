# Codex image handoff — automated "model holding the real product" shots

Free Pollinations/Flux make a *generic* bottle in-hand (looks like a dummy). Codex's image-gen does
product-in-hand far better. This is an **automated producer/consumer handoff** — no manual step per asset.

## The loop
1. **Engine emits a work order.** A reel job with `"holding_request": true` makes the worker call
   `stages/codex_bridge.py --emit` → writes `codex-assets/requests/<key>.json` with a complete prompt,
   the real product reference, the exact `output_path`, and size (1080x1920).
2. **Codex drains the queue.** Codex runs:
   ```
   python3 workspace/video-engine/stages/codex_bridge.py --list     # pending work orders (JSON)
   ```
   For each order: generate the image per `prompt` (reference `product_image_reference`), then SAVE it
   to the order's `output_path`. File existence = fulfilled.
3. **Engine auto-consumes.** Next worker run finds the image at `output_path` and inserts it right after
   the persona hook (cover-pan). If not yet fulfilled, the reel proceeds persona-only and picks up the
   asset on a later run. Re-emit is idempotent (never re-requests a fulfilled asset).

## Codex contract (what Codex must do)
- Read each pending order from `codex_bridge.py --list`.
- Generate a CLEAN vertical 1080x1920 photo per `prompt`: BD-authentic model holding the real product,
  **no text / no logos / no watermark / no poster graphics** (the engine adds cards/captions).
- Save to the order's exact `output_path`.
- Status check: `python3 stages/codex_bridge.py --status`.

## Manual option (still supported)
Drop a ready image and reference it directly:
`"holding_images": ["workspace/video-engine/codex-assets/holding/<key>.png"]`

## Two asset types (route correctly)
- **`holding_request` / `holding_images`** → clean model+product, cover-pan (fills frame). Codex output here.
- **`images`** → finished branded product cards (square, edge text) → blurred-fill (whole shown). e.g. social_image_gen output.

## Provider registry
`config/providers.json -> capabilities.image.mid = codex-imagegen`. Codex owns generating these assets
(see AGENT_BUS task ownership).
