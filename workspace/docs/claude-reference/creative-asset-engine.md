# Creative Asset Engine — Integrated Design Spec

**Status:** Active shared renderer. Initial full migration completed 2026-06-26:
Social Engine and Video Engine now route static/product/value/end-card creative
frames through `workspace/creative-engine/`, with legacy video card scripts kept
as compatibility shims.
**Goal:** One shared composition layer. `product in → branded creative out`
(square / 4:5 / hero / scene card / reel frame). Social Engine and Video Engine
both call it. HyperFrames animates its output. No second image engine.

---

## 1. The problem this fixes

Five files re-implement the same primitives with silent drift:

- Brand gold is `#F5D060` in `social_image_gen.py` but `#e7b24a` everywhere in
  video — two "brand" golds shipping side by side.
- Two product-name splitters with different rules.
- Logo loader duplicated in 5 files; Chromium finder in 4; price formatting in 3.
- Layout-overlap QA exists **only** in `social_image_gen.py`; video cards ship
  unvalidated.
- WooCommerce product fetch exists **only** in `social_image_gen.py`; every video
  card takes raw CLI args, so the truth source isn't shared.

One product creative should look identical whether it lands as an FB square or the
opening frame of a reel. Today it can't, because there is no shared truth.

---

## 2. Layered architecture

```
creative_engine/
  api.py               render(request) -> result   ← single public entrypoint
  data/
    product_source.py  THE WooCommerce client. WC → ProductData. Nothing else fetches.
    normalize.py       name-split, price-format, origin, chips — ONE rule set
  tokens/
    tokens.json        palette, gold, fonts, canvas dims, safe-zones, tagline, URL
    brand.py           loads tokens.json (Python side)
    formats.py         per-format canvas + margins + safe-zones
  templates/           reserved for future template extraction
  api.py               request + ProductData + tokens → HTML string
  render.py            ONE Chromium screenshot helper + layout-QA
  motion.py            emits motion_manifest for video-bound formats
  cli.py               python -m creative_engine --product-id N --format hero_vertical
```

`tokens.json` is the anti-drift keystone: **both** `compose.py` (Python) and
HyperFrames `render.js` (Node) read it. Generated from `apps/web/tailwind.config.js`
so the brand palette has exactly one source. The `#F5D060`/`#e7b24a` split dies here.

---

## 3. The contract

```python
@dataclass
class CreativeRequest:
    product_id: int | None          # OR inline `product` dict
    product: dict | None = None
    format: str = "post_1x1"        # post_1x1 | post_4x5 | hero_vertical
                                    # | scene_value | scene_brand_end
    variant: str = "studio"         # studio | podium | hijabi-lifestyle | model-scene
    badge: str = "SHOP NOW"
    background: str = "studio_ai"   # studio_ai | external_file | gradient | solid
    background_file: str | None = None
    locale: str = "en"              # en | bn  (kicker + price labels)
    value_spec: dict | None = None  # for scene_value: {kicker,title,bullets[]}
    qa: bool = True
    render_scale: int = 2           # 1x/2x/3x internal render, downsampled to final size
    out: str | None = None

@dataclass
class CreativeResult:
    asset_path: str
    width: int
    height: int
    format: str
    variant: str
    product_snapshot: dict          # {id,name,brand,price,original,origin,slug,image_url}
    motion_manifest: dict | None    # video formats only — see §4
    qa_report: dict                 # {passed: bool, issues: [str]}
    render_scale: int
    tokens_version: str
```

One call. `render(CreativeRequest(...)) -> CreativeResult`. Synchronous, deterministic
for a given product+format+variant (seed = product_id, as today).

Render quality rule: default output uses 2x Chromium device-scale rendering and
Lanczos downsampling back to the official platform dimensions. Final files remain
1080×1080, 1080×1350, 1080×1920, or 1200×630 as required, but text, logo edges,
and product cutouts are sharper on AMOLED/iPhone-class high-density displays.
Use `render_scale=1` for faster local smoke checks, and reserve `3` for special
premium exports because it is heavier.

---

## 4. HyperFrames boundary — the key decision

**Creative engine bakes appearance. HyperFrames owns motion. They meet at rendered
frames, with `motion_manifest` available for future richer motion hints.**

`render.js` today inlines `sceneBrandCard` / `sceneValueCard` HTML — that's product
chrome leaking into the animator. Under this design:

- **Baked into the frame by creative_engine:** product image, price block, logo
  lockup, brand name, size, origin, bottom bar, value-card bullets.
- **Overlaid + animated by HyperFrames:** spoken-caption hook/benefit/cta lines
  (the things that need staggered word reveals), Ken Burns, crossfades.

The bridge is `motion_manifest`, emitted per video frame:

```json
{
  "focal_point": [540, 980],
  "safe_zones":  { "hook": 58, "benefit": 68, "cta": 76 },
  "caption_free_regions": [[0,0,1080,520], [0,1500,1080,1920]],
  "suggested_motion": "ken_burns_in",
  "duration_hint_s": 3.2
}
```

HyperFrames reads `safe_zones` (already its `SAFE_ZONES` concept) and `focal_point`
(for Ken Burns anchor) from the manifest instead of hard-coding them. It stops
generating brand/value HTML and instead loads pre-rendered frames as `sceneImage`
clips, animating motion + caption overlays on top.

**Why bake-then-animate (not share HTML partials):**
- Clean split: creative = appearance, HyperFrames = motion.
- A hero frame *is* a valid static story post — frames are reusable as posts.
- Avoids Python-DOM / JS-DOM interop in one document.
- Each frame is QA-validated **before** it enters a video.

Tradeoff: baked text can't re-animate per word. Mitigation: per-word animated text
is exactly the caption layer, which already lives in HyperFrames/`caption_overlay.py`
and stays there, driven by `safe_zones`.

---

## 5. Who calls what

**Social Engine** (`social_image_gen.py` → thin caller):
```python
render(CreativeRequest(product_id=pid, format="post_1x1", variant="podium"))  # FB
render(CreativeRequest(product_id=pid, format="post_4x5", variant="podium"))  # IG
```
Keeps its campaign-plan / picker / publish logic. Loses its embedded HTML templates,
name splitter, price formatter, logo loader, QA — all move into the engine.
(AI background-prompt tables move into `tokens`/`backgrounds` so video can reuse them.)

**Video Engine** (`product_hero_card.py`, `brand_card.py`, `list_card.py` → retire):
```python
render(CreativeRequest(product_id=pid, format="hero_vertical", locale="bn"))
render(CreativeRequest(product_id=pid, format="scene_value", value_spec={...}))
render(CreativeRequest(product_id=pid, format="scene_brand_end", locale="bn"))
```
`worker.py` assembles the reel from returned frame paths + their `motion_manifest`s,
hands them to HyperFrames `reel_hyperframes.py`.

**HyperFrames `render.js`:** no longer owns product/value/brand card HTML. It
consumes pre-rendered Creative Engine frames as animated `sceneImage` clips.

---

## 6. Migration state

Completed 2026-06-26:

- `post_1x1` and `post_4x5` render from Creative Engine for social.
- `hero_vertical`, `scene_value`, `scene_brand_end`, and `blog_og_1200x630` render from Creative Engine.
- Product normalization classifies package/container type for dynamic layout sizing:
  `tall_bottle`, `dropper`, `tube`, `jar`, `compact`, `sheet_pack`, `box`, `pouch`, or `general`.
  The renderer uses this to frame tall bottles differently from short cream jars, palettes, sheet masks, and sets.
- Creative Engine defaults to 2x supersampled rendering and downsampling for sharper AMOLED/iPhone outputs while preserving native platform dimensions.
- `workspace/video-engine/worker.py` calls Creative Engine directly for product hero/value/end cards.
- `product_hero_card.py`, `list_card.py`, and `brand_card.py` are compatibility shims.
- HyperFrames treats value/brand/product cards as pre-rendered frames and only handles motion/caption/audio/encoding.
- Smoke verified: `creative-migration-smoke.mp4` rendered 1080×1920 and passed local video QA score 96.

Remaining hardening:

- Move inline HTML strings into real template files when the design stabilizes.
- Add a stable manifest file next to every rendered creative with product snapshot + QA result + tokens version.
- Use `motion_manifest` in HyperFrames for per-frame focal points and safer caption zones.

## 7. Historical Migration Path

1. **Extract, don't rewrite.** Lift the working pieces verbatim into the engine:
   `social_image_gen`'s WC fetch + `_extract_product_data` + QA become `data/` +
   `render.py`; the video palette/fonts become `tokens.json` (canonical — it already
   claims tailwind as source).
2. **Pick one gold.** Resolve `#F5D060` vs `#e7b24a` against tailwind. One value in
   `tokens.json`. This is the single visible change to existing social posts; get
   owner sign-off on the chosen gold before regenerating.
3. **Port templates.** `OVERLAY_HTML`/`MODEL_OVERLAY_HTML` → `post_square` +
   `post_portrait`; `product_hero_card` HTML → `hero_vertical`; the two video cards
   → `scene_*`. All extend `base.html` for shared chrome.
4. **Add `post_4x5`.** Currently campaigns reuse one 4:5 for both platforms; the
   format split is already a tracked preference ([[feedback_social_image_sizes]]).
5. **Repoint callers** one at a time; keep old scripts as thin shims for one cycle.
6. **Flip HyperFrames** to frames+manifest last, once frame parity is verified.

Each step is independently shippable and smoke-testable (generate one creative per
format, eyeball it, diff against the current output).

---

## 8. Acceptance bar

- One gold, one font stack, one logo loader, one Chromium helper, one name splitter,
  one price formatter, one WC client — each existing in exactly one place.
- `render(format=post_1x1)` and `render(format=hero_vertical)` for the same product
  are visibly the same brand system at two aspect ratios.
- Every video frame passes the same layout-QA that static posts pass today.
- HyperFrames contains zero product-chrome HTML; it only animates frames + captions.
- Adding a new format = one template + one `formats.py` entry. No engine fork.

---

## 9. Pipeline roles — who owns what (the simplicity contract)

Three tools, one job each. None overlaps another. This is the line that keeps the
system simple as it grows.

```
  CREATIVE ENGINE   →   HYPERFRAMES   →   FFMPEG
  (the designer)        (the animator)     (the printer)
  appearance            motion             encode + audio
```

- **Creative engine** — brands appearance. Static posts AND video frames. The only
  place product chrome, gold, fonts, price, logo, QA live.
- **HyperFrames** — video only. Animates frames (Ken Burns, crossfades, caption
  reveals) and sequences tracks into a composition. Owns zero product-chrome HTML;
  reads `tokens.json` + per-frame `motion_manifest`.
- **ffmpeg** — never leaves, never composites. It is the encode + loudness backend,
  running *underneath* HyperFrames (`render.js`) AND as the fallback renderer
  (`reel_ffmpeg.py`). After integration it stops doing branding (drawtext/zoompan
  layout) — that was duplicated compositor logic. The `-14 LUFS` loudnorm target
  (today duplicated in `render.js` and `reel_ffmpeg.py`) moves into `tokens.json`
  so audio has one source too.

Rule of thumb: if a change is about *how it looks* → creative engine. *How it
moves* → HyperFrames. *How it's encoded/normalized* → ffmpeg. A change should never
touch two of these.

---

## 10. AI presenter roadmap (social reviews + YouTube)

The AI presenter is **content flowing through this pipeline, not a parallel engine.**
The designer→animator→printer triad does not change whether the subject is a static
jar, a Ken-Burns hero, or an avatar talking for 8 minutes. `presenter_card.py`
(real product composited onto a persona still) is already the v0 of this.

Two clean insertion points — pick per use case:

```
  AI presenter clip (talking avatar reviewing a product)
        │
        ├──► as a TRACK   → HyperFrames sequences it with product hero frames
        │                   + value cards (already done for persona stills via
        │                   job.persona_scenes). Reel/Shorts review.
        │
        └──► presenter STILL → creative engine brands it (logo, price, chrome),
                               exactly like product_hero_card today.
```

**Social reel review** (9:16): presenter clip is the opening track; product hero
frames + value cards follow; CTA card closes. Identical to today's flow with a
richer first track. No new code path — just another entry in `job.tracks`.

**YouTube long-form** (16:9): same engine, same HyperFrames, same ffmpeg. The only
new thing is a **format profile** in `formats.py`:

| Profile        | Canvas    | Duration hint | Closing card |
|----------------|-----------|---------------|--------------|
| reel / shorts  | 1080×1920 | 6–30 s        | CTA card     |
| youtube_long   | 1920×1080 | minutes       | chapter / subscribe card |

No fork: a new aspect ratio is one `formats.py` row + one template; longer runtime is
a `duration_hint`; chapter cards are just another `scene_*` template. The presenter
voice already exists (`voice_gen.py`), captions already exist (`caption_overlay.py`),
loudness target is shared (`tokens.json`).

**Why this stays simple:** the presenter never becomes a new engine. It is a track
source. Everything downstream — branding, animation, captioning, encoding, loudness,
publishing — is the pipeline you already have, unchanged.
