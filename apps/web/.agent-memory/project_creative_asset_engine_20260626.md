# Creative Asset Engine System Check — 2026-06-26

Scope: read-only audit of the creative asset surface before further Claude/Codex work. No system code, Woo data, publishing state, PM2, deploy, or task-board changes were made for this note.

## Expanded Check Coverage

Checked current code and planning across:

- Creative Asset Engine: `workspace/creative-engine/**`, `workspace/workspace_creative_engine.py`
- Static social generation: `workspace/scripts/active/social_image_gen.py`, `.pre-engine-backup`
- Social Engine: `workspace/social-engine/README.md`, `social_engine/engine.py`, tests, campaign/history/performance paths
- Meta publishing path: `workspace/docs/claude-reference/social-publishing.md`, `workspace/scripts/active/meta_schedule.js`, `meta_publish.js`
- Video Engine: `workspace/video-engine/README.md`, `worker.py`, `daily_producer.py`, `config/providers.json`
- Reel frame stages: `product_hero_card.py`, `list_card.py`, `brand_card.py`, `caption_overlay.py`
- HyperFrames: `workspace/video-engine/hyperframes/render.js`, package files
- Planning contracts: `creative-asset-engine.md`, `campaign-orchestration-contract.md`, `blog-featured-image-spec.md`, `queue-state-contract.md`, task-board rows `BLOG-1`, `VID-6`, `VID-7`, `X8/X8a/X8b/X8c`
- Coordination state: `AGENT_BUS.md`, `MEMORY.md`, `TASKS.md`

## Migration Completion Update — 2026-06-26

Owner requested full migration after the audit. Completed:

- Creative Engine now renders `post_1x1`, `post_4x5`, `hero_vertical`, `scene_value`, `scene_brand_end`, and `blog_og_1200x630`.
- Video worker calls Creative Engine directly for product hero/value/end-card frames.
- Legacy video card scripts are compatibility shims over Creative Engine.
- HyperFrames no longer builds product/value/brand card HTML; it animates pre-rendered frames and owns only motion/captions/audio/encoding.
- Blog featured-image planning now points to Creative Engine `blog_og_1200x630`.
- Smoke verified real poster-to-video path: `workspace/video-engine/output/creative-migration-smoke.mp4`, 1080x1920, local QA score 96/pass.
- Follow-up refinement: product normalization now classifies container shape (`tall_bottle`, `dropper`, `tube`, `jar`, `compact`, `sheet_pack`, `box`, `pouch`, `general`) and the renderer uses shape-aware image sizing for hero, social, and blog frames. Explicit `container_type` in a product payload overrides the heuristic.
- Follow-up refinement: Creative Engine now defaults to 2x internal Chromium rendering with downsampling back to official platform dimensions, improving text/logo/product edge quality for AMOLED and iPhone-class high-density displays. `render_scale` can be set to 1, 2, or 3.

## Current State

- A new shared engine exists at `workspace/creative-engine/`, with a public bridge at `workspace/workspace_creative_engine.py`.
- `workspace/scripts/active/social_image_gen.py` is now a thin shim over the shared creative engine.
- `workspace/social-engine/social_engine/engine.py` can call `creative-engine.api` directly for proper IG `post_4x5` assets, with a PIL blur fallback.
- `workspace/video-engine/worker.py` still calls legacy video frame generators:
  - `stages/product_hero_card.py`
  - `stages/list_card.py`
  - `stages/brand_card.py`
- `workspace/video-engine/hyperframes/render.js` still contains its own brand palette, logo loader, safe zones, value-card HTML, brand-card HTML, and loudnorm filter.
- Existing design spec: `workspace/docs/claude-reference/creative-asset-engine.md`.
- Campaign/publishing safety is mostly mature: Social Engine review packs, approval status, result ledger idempotency, and Meta dry-run defaults exist.
- Visual creative unification is not mature yet: the shared engine is present but not the sole renderer.

## Key Inconsistencies Found

1. Spec says “design only / post-freeze branch task,” but implementation has already started.
   - The doc says Creative Asset Engine is design-only until after 2026-07-03.
   - Working tree already contains the new engine, shimmed `social_image_gen.py`, and Social Engine direct calls.
   - Treat current state as an in-progress migration, not pure design.

2. Social Engine is partly migrated, Video Engine is not.
   - Static social posts now use or can use the shared engine.
   - Reels still generate product hero, value, and brand frames through separate scripts.
   - Result: same campaign can ship social assets from one design system and reel cards from another.

3. Creative Engine API advertises formats it cannot render yet.
   - `tokens.json` and CLI list `hero_vertical`, `scene_value`, `scene_brand_end`, `youtube_landscape`.
   - `api.render()` only handles `post_1x1` and `post_4x5`.
   - Non-social formats currently raise: `Format ... not yet implemented`.

4. HyperFrames boundary is still mixed.
   - Spec says Creative Engine bakes product/value/brand appearance and HyperFrames only animates frames/captions.
   - Current `hyperframes/render.js` still creates `sceneValueCard()` and `sceneBrandCard()` HTML directly.
   - This keeps product chrome inside the animator.

5. Token unification is incomplete.
   - `workspace/creative-engine/tokens/tokens.json` exists and uses gold `#e7b24a`.
   - Video card scripts and HyperFrames still define palette/font/logo/Chromium paths locally.
   - The old `#F5D060` vs `#e7b24a` split is mostly resolved toward `#e7b24a`, but enforcement is not complete because duplicate token definitions remain.

6. QA is uneven.
   - Shared engine has layout QA in `workspace/creative-engine/render.py`.
   - Legacy reel card scripts render screenshots but do not use the same overlap/text clipping QA gate.
   - Video frames can still bypass the stricter social-post QA.

7. Python import path is fragile from repo root.
   - `python3 -m py_compile` passed for relevant Python files.
   - Direct import check from repo root failed for `workspace_creative_engine` and `creative-engine.api` unless the caller adjusts `sys.path`/cwd the same way scripts do.
   - Hyphenated package name `creative-engine` works only through importlib/path setup, not normal Python package import style.
   - Extra check: `workspace/workspace_creative_engine.py` is an untracked local bridge, not present in `origin/main`. It works when `/root/emart-platform/workspace` is inserted into `sys.path` (as `social_image_gen.py` does), but not as a normal repo-root import.

8. Product data source is centralized only for the new path.
   - `workspace/creative-engine/data/product_source.py` is the intended Woo client.
   - Video jobs often pass product fields already embedded in job JSON, then legacy scripts render from raw CLI args.
   - Source of truth remains split between Woo fetch, job snapshots, and explicit CLI args.

9. Output/state locations are split.
   - Social static outputs: `apps/web/public/images/social/...` and `workspace/audit/active/social`.
   - Video frame outputs: `workspace/video-engine/output`.
   - Generated asset experiments: `workspace/generated-assets/...`.
   - There is no single manifest tying creative source, product snapshot, QA, publish result, and final platform asset together.

10. Planning docs disagree on social image sizing maturity.
    - `workspace/social-engine/README.md` still says native 4:5 generation is a next build step.
    - Current code already attempts native `post_4x5` generation through Creative Engine when available, with PIL blur fallback.
    - `workspace/docs/claude-reference/social-publishing.md` says current campaigns use single 4:5 images for both and future campaigns should separate FB/IG fields, while `TASKS.md` says separate IG 4:5 generation is complete.

11. Video Engine README is stale against the current runtime.
    - README still describes `reel_ffmpeg.py` as the main proven free reel path and says voice is not installed / silent fallback.
    - Current task-board and code show HyperFrames as default renderer, `voice_gen.py`/voiceover MP3 outputs present, approval bot/orchestrator live, product hero stage present, and caption overlays in active use.

12. Provider registry still points image capability at old shim, not the shared engine.
    - `workspace/video-engine/config/providers.json` says `emart-branded` wraps `workspace/scripts/active/social_image_gen.py`.
    - That script now wraps Creative Engine, so the registry is still operational but conceptually one layer behind.

13. Blog featured image plan targets `social_image_gen.py`, not the new shared engine.
    - `workspace/docs/blog-featured-image-spec.md` says extend `social_image_gen.py` with `--blog-hero`.
    - Given the new architecture, blog hero should be a Creative Engine format (`blog_og_1200x630`) with `social_image_gen.py` only a compatibility shim.

14. Creative Engine file hygiene needs cleanup before commit.
    - `workspace/creative-engine/__pycache__/**` exists in the untracked tree.
    - `.gitignore` ignores `__pycache__/` and `*.pyc`, but because the directory is untracked, a careless broad add could still create review noise unless checked.

## Verification Run

- Passed: `python3 -m py_compile` on the new creative engine, social shim, Social Engine, Video worker, and legacy video card scripts.
- Passed: `node --check workspace/video-engine/hyperframes/render.js`.
- Passed: bridge import with explicit workspace path: `sys.path.insert(0, '/root/emart-platform/workspace'); import workspace_creative_engine`.
- Passed: `python3 -m unittest workspace/social-engine/tests/test_engine.py` (12 tests).
- Passed: JS syntax checks for `workspace/scripts/active/meta_schedule.js` and `meta_publish.js`.
- Failed as expected: direct repo-root import of `workspace_creative_engine` / `creative-engine.api` without caller-specific path setup.

## Recommended Next Step

Before any more visual/publishing automation, decide whether this migration is officially active during freeze or should pause until after 2026-07-03. If active, the safe next fix is documentation/contract alignment first: mark the engine as “in-progress migration,” define supported formats as only `post_1x1` and `post_4x5`, and keep video cards on legacy path until `hero_vertical` / `scene_*` are implemented and QA-gated.

## Practical Close-Out Order

1. Rename/normalize package import path before relying on it broadly: avoid long-term `creative-engine` hyphen imports or keep `workspace_creative_engine.py` as the official bridge and track it.
2. Update docs to current truth: Creative Engine is in-progress, Social 4:5 is partly native, Video README is behind HyperFrames/voice/orchestrator.
3. Narrow the Creative Engine public contract to formats that really work today: `post_1x1`, `post_4x5`.
4. Add next formats in this order: `hero_vertical`, `scene_value`, `scene_brand_end`, then `blog_og_1200x630`.
5. Only after those pass shared layout QA, retire `product_hero_card.py`, `list_card.py`, and `brand_card.py` or turn them into shims.
6. Last step: remove product/value/brand card HTML from HyperFrames so it only animates pre-rendered frames and captions.
