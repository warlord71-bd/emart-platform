# Emart Video Engine

Tier-swappable, API-first video content engine. Full design:
`workspace/docs/claude-reference/ai-video-influencer-plan.md`.

## Principle
Every capability (image, face, b-roll video, talking video, voice, storage) is a **dial**:
free ↔ mid ↔ premium, chosen per job. Config: `config/providers.json`. Flip `enabled` +
add the API key env to switch a tier on — no code change.

## Status (2026-06-23)
- ✅ `config/providers.json` — tier registry (free tier enabled, mid/premium stubbed). Image layer UNIFIED.
- ✅ `stages/reel_ffmpeg.py` — FREE vertical reel generator (Ken-Burns + xfade + captions).
      Real 1080x1920 H.264 MP4 at $0, CPU-only, ~5s per clip. Proven single + multi-image.
- ✅ `lib/router.py` — picks provider per capability by tier_target + budget; falls back down tiers; free always wins as last resort.
- ✅ `worker.py` — drains `queue/*.json`; stages images→reel→store→publish; checkpoints every stage
      (resumable, never re-runs a done stage); guardrails (max/day, budget cap, dry-run default).
- ✅ store stage → nginx `/public/` alias serves reels at a range-capable HTTPS URL (no Next restart). PROVEN HTTP 206.
- ✅ `../scripts/active/meta_reel_publish.js` — FB video + IG Reels publisher (unified META_* creds). Dry-run verified.
- ✅ `stages/script_gen.py` — OpenRouter reel script (hook/benefits/cta/caption/hashtags/voiceover)
      in en/bn/banglish (language = per-job dial). Default autonomous path is OpenRouter free
      Google-family Gemma (`google/gemma-4-31b-it:free` → `google/gemma-4-26b-a4b-it:free`) then
      other free models, then template. Direct Google/Vertex is explicit-only. PROVEN on
      `google/gemma-4-31b-it:free`.
- ✅ timed captions — `reel_ffmpeg.py` renders hook→benefits→cta sequenced across the clip (Noto Bengali
      auto-picked for Bangla). Worker `generate_script:true` runs script→caption→reel automatically. PROVEN.
- ✅ `stages/reel_qa_local.py` — default free QA gate using `ffprobe`: validates 1080x1920 MP4,
      duration, file size, audio/video streams, and publishability. PROVEN on snail reel.
- ✅ `stages/reel_qa_gemini.py` — optional direct-Google video QA only when a job explicitly sets
      `qa_provider:"gemini"`.
- ⬜ live publish — gated on owner approval (safety rule); flip with `--allow-publish` + guardrails.
- ⬜ voice stage (piper free [not installed] / google-tts mid bn-BD / elevenlabs premium) + music bed
      — free tier currently SILENT; voice is the mid-tier dial.
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
conjuncts/vowel-signs (e.g. দিনভর renders as দনিভর). Only the BROWSER shapes Bengali correctly
(that's why social_image_gen.py's Chromium-rendered static posts are perfect).
Convention until a Playwright caption-overlay stage is built:
- **on-screen** lines (hook / benefits / cta) → **romanized Banglish** (Latin) — renders perfectly.
- **caption / voiceover** → **native Bangla script** — platforms (FB/IG) render natively.
Future fix: render caption PNGs via Playwright HTML (HarfBuzz shaping) → ffmpeg `overlay` for native
Bangla on-screen text.
- ⬜ persona stage (Flux + InstantID consistent faces — mid tier)
- ⬜ talking-avatar stage (D-ID / HeyGen — premium)
- ⬜ YouTube Shorts + TikTok publishers (need API approvals)
- ⬜ PM2/cron daily trigger to enqueue + `--drain` the queue; R2 storage offload

## Run the loop
```bash
python3 worker.py --job queue/example.json     # one job, dry-run publish (default, safe)
python3 worker.py --drain                       # all pending jobs
python3 worker.py --job ... --allow-publish     # actually post (still gated by guardrails)
```
Job spec: see `queue/example.json` (id, tier_target, language, platforms, headline/sub/caption,
images OR product_id, seconds).

## Unified image layer (shared with static social posts)
The reel engine does NOT have its own image generator — it consumes the **same image sources** as
the static social system, so nothing is duplicated:
- `emart-branded` → `workspace/scripts/active/social_image_gen.py` (logo/price/COD branded composite)
- `codex-imagegen` → Codex's image-gen capacity (plug in when available)
- `woo-product-photo` → raw WooCommerce image
Flow: **product → [image provider] → branded frame(s) → reel_ffmpeg.py → vertical reel**.
The meta-18 campaign frames (already branded) animate directly — proven.

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
