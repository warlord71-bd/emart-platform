# Emart Video Engine

Tier-swappable, API-first video content engine. Full design:
`workspace/docs/claude-reference/ai-video-influencer-plan.md`.

## Principle
Every capability (image, face, b-roll video, talking video, voice, storage) is a **dial**:
free ↔ mid ↔ premium, chosen per job. Config: `config/providers.json`. Flip `enabled` +
add the API key env to switch a tier on — no code change.

## Status (2026-06-28)
- ✅ `config/providers.json` — tier registry (free tier enabled, mid/premium stubbed). Image layer UNIFIED.
- ✅ `hyperframes/render.js` + `stages/reel_hyperframes.py` — default reel renderer.
      Creative Engine provides branded frames; HyperFrames owns motion/crossfades/caption timing;
      ffmpeg remains the encoder/loudness backend and fallback path. Default render preset is
      `standard`; `render_preset:"premium"` switches HyperFrames to `quality=high`, disables
      forced low-memory mode, and targets a higher bitrate for final rebuilds.
- ✅ `stages/reel_ffmpeg.py` — fallback FREE vertical reel generator.
- ✅ `lib/router.py` — picks provider per capability by tier_target + budget; falls back down tiers; free always wins as last resort.
- ✅ `worker.py` — drains `queue/*.json`; stages images→reel→store→publish; checkpoints every stage
      (resumable, never re-runs a done stage); guardrails (max/day, budget cap, dry-run default).
- ✅ store stage → nginx `/public/` alias serves reels at a range-capable HTTPS URL (no Next restart). PROVEN HTTP 206.
- ✅ `../scripts/active/meta_publish.js` — the single FB/IG image + reel publisher; worker passes its checkpointed queue job directly. Dry-run verified.
- ✅ `stages/script_gen.py` — OpenRouter reel script (hook/benefits/cta/caption/hashtags/voiceover)
      in en/bn/banglish (language = per-job dial). Default autonomous path is OpenRouter free
      Google-family Gemma (`google/gemma-4-31b-it:free` → `google/gemma-4-26b-a4b-it:free`) then
      other free models, then template. Direct Google/Vertex is explicit-only. PROVEN on
      `google/gemma-4-31b-it:free`. Deterministic script QA now rejects placeholders, prompt-schema
      residue, odd CJK characters, too-short voiceover, and unsafe claim mismatches.
- ✅ text/caption strategy — product-card reels use Creative Engine frame text as the main on-video
      text system; optional browser-rendered caption overlays are still available for non-card/photo
      frames. Master QA validates the chosen text system instead of silently skipping it.
- ✅ `stages/reel_qa_local.py` — default free QA gate using `ffprobe`: validates 1080x1920 MP4,
      duration, file size, audio/video streams, and publishability. PROVEN on snail reel.
- ✅ `stages/reel_qa_gemini.py` — optional direct-Google video QA only when a job explicitly sets
      `qa_provider:"gemini"`.
- ⬜ live publish — gated on owner approval (safety rule); flip with `--allow-publish` + guardrails.
- ✅ voice + music bed — `voice_gen.py` uses free `edge-tts` neural voices (`bn-BD-NabanitaNeural`,
      `bn-BD-PradeepNeural`, English fallbacks). Review reels require narration by default; missing
      or too-short voice now fails the build instead of producing a music-only draft.
- ✅ content QA — shared `lib/quality_gates.py` blocks universal SPF copy on non-sunscreens,
      placeholder scripts, unsafe medical claims, missing product images for product-card reels,
      and records product-image identity warnings.
- ⬜ quality: free OpenRouter models can still have minor Bangla/Banglish word-choice slips; inline
      agent-authored scripts remain best quality at $0.

## Script authoring (Claude-written preferred)
Job can carry an inline `script` object that Claude/Opus writes directly — best quality, $0, no model
call. Worker priority: inline `script` > OpenRouter free Gemma/Gemma fallback
(`OPENROUTER_API_KEY`) > template. Direct Google Gemini/Vertex remains available only with
`--provider gemini` or `qa_provider:"gemini"` and is not part of the default free loop.

OpenRouter free defaults:
- `google/gemma-4-31b-it:free`
- `google/gemma-4-26b-a4b-it:free`
- `nvidia/nemotron-3-super-120b-a12b:free`
- `openai/gpt-oss-120b:free`

Optional cheap paid OpenRouter Gemini Flash models exist (`google/gemini-2.5-flash`,
`google/gemini-3.1-flash-lite`), but they are not free and should only be enabled after the
budget cap allows paid scripts.

Direct Google setup note:
- API-key route: use a valid AI Studio Gemini API key in `apps/web/.env.local` or runtime env as
  `GEMINI_API_KEY`. New AI Studio auth keys may not use the old `AIza` prefix.
- Service-account route: put the JSON key at `/root/.config/gemini-service-account.json`, or set
  `GEMINI_SERVICE_ACCOUNT_FILE=/path/to/key.json`. This uses Vertex AI at `GEMINI_VERTEX_LOCATION`
  (default `us-central1`) and project from the JSON unless `GEMINI_VERTEX_PROJECT` is set.
- Existing GMC/GSC/Play service-account files are not the requested Gemini service account.

### CRITICAL: Bengali text rendering
This box's ffmpeg `drawtext` AND its `libass` are built WITHOUT HarfBuzz → they do NOT shape Bengali
conjuncts/vowel-signs (e.g. দিনভর renders as দনিভর). Only the browser shapes Bengali correctly
(that's why Creative Engine / social_image_gen.py Chromium-rendered frames are clean).
Current convention:
- Creative Engine cards may use native Bangla because they are browser-rendered into images.
- Timed overlay captions should use romanized Banglish unless rendered through the browser overlay
  stage.
- Platform captions and voiceover should use natural Bangla script.
- ⬜ persona stage (Flux + InstantID consistent faces — mid tier)
- ⬜ talking-avatar stage (D-ID / HeyGen — premium)
- ⬜ YouTube Shorts + TikTok publishers (need API approvals)
- ✅ daily producer/orchestrator + Telegram approval bot exist; publishing remains owner-approval-only.
- ⬜ R2 storage offload

## Run the loop
```bash
python3 worker.py --job queue/example.json     # one job, dry-run publish (default, safe)
python3 worker.py --drain                       # all pending jobs
python3 worker.py --job ... --allow-publish     # actually post (still gated by guardrails)
```
Job spec: see `queue/example.json` (id, tier_target, language, platforms, headline/sub/caption,
images OR product_id, seconds).

## Unified creative layer (shared with static social posts)
The reel engine does NOT have its own product/value/brand-card designer. It consumes
the same Creative Asset Engine as static social posts:
- `creative-engine` → product hero, value cards, brand end cards, FB 1:1, IG 4:5, blog OG
- `emart-branded` → compatibility wrapper through `workspace/scripts/active/social_image_gen.py`
- `codex-imagegen` → Codex's image-gen capacity (plug in when available)
- `woo-product-photo` → raw WooCommerce image
Flow: **product → Creative Engine frame(s) → HyperFrames motion/captions → ffmpeg encode/QA**.
Smoke verified 2026-06-26 with `creative-migration-smoke.mp4` (1080×1920, local QA score 96).

## Free reel generator usage
```bash
python3 stages/reel_ffmpeg.py \
  --image /path/a.png [--image /path/b.png ...] \
  --headline "Product Name" --sub "Gentle daily cleanse - COD" \
  --out output/clip.mp4 --seconds 6
```
Output: 1080x1920 MP4 (IG Reels / YT Shorts / TikTok / FB). Bengali captions auto-pick a
Noto Bengali font when the text contains Bangla characters.

## Layout
```
config/providers.json   tier registry (the dials)
config/personas/        persona bibles (later)
stages/                 pipeline stages (reel_ffmpeg.py = free b-roll)
lib/                    router, helpers (later)
queue/                  *.json job specs (gitignored)
output/                 transient MP4s (gitignored; offload to R2 later)
```

## Cost guardrails
`config/providers.json -> guardrails`: `max_videos_per_day`, `daily_budget_cap_usd` (0 = free only),
`dry_run_default`. The worker (when built) enforces these and stops at the cap.
