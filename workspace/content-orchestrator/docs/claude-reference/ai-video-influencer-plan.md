# Emart AI Influencer + Video Content System — Master Plan

Status: PHASE 0 LOCAL ENGINE BUILT (not deployed as an autonomous cron). Owner approval + provider/budget
decisions still required before live publish or paid providers.
Created: 2026-06-23

## 1. Core design principle (from owner)

**Every capability is tier-swappable per job.** Nothing hard-wired. Quality, cost, and
storage are *dials* the system turns based on what each job needs:

- A hero/Eid campaign → premium tier (talking avatar, best image model, ElevenLabs voice).
- A daily filler reel → mid or free tier (Ken-Burns b-roll, local voice).
- A quick test → free tier only, zero marginal cost.

Implemented as a **provider registry + job router**: each job declares the *minimum quality bar*,
the router picks the cheapest provider that clears it, with automatic fallback down the tiers.

## 2. Hardware reality (the constraint everything routes around)

- No GPU · 6 CPU cores · 11 GB RAM · ~13 GB free disk (88% full).
- Self-hosted AI video/avatar generation is NOT possible (needs GPU).
- ffmpeg works on CPU → **assembly/editing is local and free**.
- Generation (faces, talking video, b-roll, premium voice) must be **API-based**.
- Existing OpenRouter key is **text-only** — cannot do image/video.
- Existing Google service-account files are for GMC/GSC/Play, not Gemini. Gemini script/QA support needs
  a valid AI Studio Gemini API key (standard or newer auth-key format) exported as `GEMINI_API_KEY`.

## 3. Capability → provider matrix (tier dials)

| Capability | FREE | MID | PREMIUM |
|-----------|------|-----|---------|
| Image gen | Pollinations.ai | Flux-schnell (Fal) | Flux-pro / SDXL (Fal/Replicate) |
| Face consistency (personas) | seed-lock (weak) | InstantID (Fal) | PuLID / IP-Adapter (Replicate) |
| Talking presenter video | — (Ken-Burns still) | D-ID API | HeyGen (custom avatar) |
| B-roll / motion video | ffmpeg Ken-Burns on stills | MiniMax Hailuo (i2v) | Kling / Runway Gen-3 |
| Voice / TTS | piper / espeak (local) | Google TTS bn-BD | ElevenLabs multilingual |
| Script | Claude-authored inline / Gemini free / OpenRouter free | better paid Gemini/OpenRouter | premium creative model |
| Captions | script-derived (we have the script) | Playwright-shaped native Bangla overlay | Whisper (CPU, optional) |
| Assembly | ffmpeg (local, free) | ffmpeg | ffmpeg |
| Storage | local disk (capped) | Cloudflare R2 (10GB free, zero egress) | S3 / B2 |
| QA | manual / skipped when no key | Gemini video QA | human review + Gemini |

**Free video path that actually works today:** ffmpeg Ken-Burns (pan/zoom) over Flux/Pollinations
stills + transitions + burned captions + royalty-free music. CPU-only, $0 marginal. Not a talking
influencer, but produces daily reels immediately. This is the proving-ground tier.

## 4. Storage strategy (swappable, solves the 13 GB problem)

- `STORAGE_BACKEND` env: `local` | `r2` | `s3`.
- Recommended default: **Cloudflare R2** — they already run Cloudflare; 10 GB free, **zero egress**,
  S3-compatible. Render → upload to R2 → publish from R2 public URL → delete local temp.
- Local disk stays transient (working files only, auto-cleaned after each job).
- Upgrade path: bump VPS disk OR raise R2 — a config change, not a re-architecture.

## 5. Personas — 2-3 recurring AI models (culturally grounded)

Designed for Bangladesh market: authentic local skin tones (NOT over-whitened — avoid colorist
tropes), modest-styling option, Bangla/Banglish voice, COD/affordability framing, festival tie-ins (Eid).
Each persona = locked reference portrait (seed + InstantID embedding) reused across all images & video.

1. **"Dr. / Skin Expert"** — ~30s, warm-clinical, modest professional (hijabi option available).
   Format: ingredient science, "what does niacinamide do", routine order. Authority tone.
2. **"Relatable Everyday User"** — ~22-25, urban middle-class Dhaka, friendly, Banglish.
   Format: honest pros/cons, "my 3-step routine", budget picks, COD.
3. **"Aspirational Glam"** *(optional, premium products)* — ~25-28, polished, premium look.
   Format: hero launches, luxury K-beauty, Eid specials.

Each persona gets a **persona bible**: name, age, look, skin tone, wardrobe, signature colors,
voice profile, tone rules, do/don't. Stored in repo; drives both image and video prompts.

## 6. Content formats (your stated use cases)

- **A. "Dr. Ingredient Analysis"** — talking presenter explains an ingredient/product +
  b-roll cutaways + captions + VO. (Premium tier: HeyGen+ElevenLabs.)
- **B. "Influencer Pros/Cons/Uses"** — presenter reviews a product, honest take. (Mid/premium.)
- **C. "Pure B-roll Reel"** — product texture/application, kinetic captions, music, no talking.
  (Free/mid tier — daily volume.)
- **D. "Routine / Listicle"** — "5 serums under ৳1500", carousel→video. (Free tier.)

## 7. Pipeline (stages — each stage tier-routed & checkpointed)

```
1. PLAN     pick product(s) + persona + format  → job spec JSON
2. SCRIPT   inline Claude-authored script OR Gemini/OpenRouter writes script + caption + hashtags
            (hedged, no medical claims)
3. VOICE    TTS → audio (tier-routed)
4. VISUALS  persona image(s) + b-roll clips OR talking-avatar video (tier-routed)
5. ASSEMBLE ffmpeg: visuals + audio + captions + brand intro/outro + music → MP4 (1080x1920 / 1080x1350)
6. QA       Gemini video QA returns pass/warn/fail JSON; publish blocks on fail when key is present
7. STORE    upload to R2, delete local temp
8. PUBLISH  YouTube + IG Reels + FB + TikTok (unified publisher)
9. LOG      state file: done, url, cost, platform IDs
```

## 8. Self-preserving loop architecture

Reuse the proven meta-18 scheduler pattern, generalized:

- **Content queue** — implemented under `workspace/content-orchestrator/video-engine/queue/*.json` (one job per file: product, persona, format,
  tier_target, status: pending|generating|ready|published|failed).
- **Worker** — implemented at `workspace/content-orchestrator/video-engine/worker.py`; future PM2 process (`--no-autorestart`) or cron. Picks next `pending`, runs pipeline,
  **checkpoints after every stage** (resumable — if it dies mid-job it resumes, never re-bills a
  completed stage). Marks status. Continues on command.
- **Guardrails** — `MAX_VIDEOS_PER_DAY`, `DAILY_BUDGET_CAP` (USD), hard stop when hit. Dry-run default.
- **Trigger** — daily cron enqueues N jobs; worker drains queue; "continues upon command" = re-run
  or send a Telegram command.
- **Resilience** — idempotent state, transient-failure retry with backoff, R2 offload so disk never fills.

## 9. Publishing targets

- Extend the unified Meta publisher (already built) → IG Reels + FB.
- Add **YouTube Data API v3** (Shorts + long-form) — needs OAuth client + channel.
- Add **TikTok Content Posting API** (needs approved developer app — slowest to get).
- All get **AI-content disclosure labels** (required by YouTube & Meta).

## 10. Compliance (non-negotiable)

- Label synthetic/AI presenters (YouTube "altered content", Meta AI-content flag).
- Personas must be **original synthetic faces** — never impersonate real/known people.
- Skincare copy: no medical/curative claims; "helps / looks / appears" hedging only.
- Music: royalty-free / licensed only.
- Authentic local skin tones; avoid colorist beauty tropes.

## 11. Improvements to CURRENT image generator (the "maintain standard" ask)

1. **Face consistency** — replace random-face Pollinations model scenes with locked persona
   (InstantID), so the same 2-3 models recur. Doubles as the video persona foundation.
2. **Higher-fidelity model** — Flux >> Pollinations (fixes hand/finger artifacts the prompts fight).
3. **Dual sizes** — 4:5 (IG) + 1:1 (FB), per [[feedback-social-image-sizes]].
4. **Persona bible** drives prompts for brand consistency.
5. **Extend QA gate** — current Playwright layout check + add face/quality sanity.

## 12. Phased rollout (prove cheap → scale to premium)

- **Phase 0 (free, now):** Provider-registry + job-router + queue + ffmpeg Ken-Burns b-roll
  reels + script generation + optional Gemini QA are built locally in `workspace/content-orchestrator/video-engine/`.
  Remaining Phase 0 work: local/free voice, R2 storage, cron/PM2 trigger, and owner-approved live publishing.
- **Phase 1 (mid):** Add Flux + InstantID personas (consistent faces) for images AND reel stills.
  Add Google bn-BD voice. Small API spend.
- **Phase 2 (premium):** Add talking avatar (D-ID→HeyGen) + ElevenLabs → the "Dr." / presenter
  formats. Add YouTube publishing.
- **Phase 3:** TikTok, A/B testing, analytics-driven product selection (reuse GSC/GA pattern).

## 13. Open decisions (owner)

1. **Budget cap** (drives tier ceiling): $0 free-only / ~$30 mid / ~$60-150 premium per month.
2. **Provider accounts/keys** to obtain: Fal.ai or Replicate (image+face); D-ID or HeyGen (talking);
   ElevenLabs or Google TTS; Cloudflare R2 (storage); YouTube channel + API OAuth.
3. **Language:** Bangla / English / Banglish.
4. **Platform priority:** YT Shorts · IG Reels · FB · TikTok · YT long-form.

## 14. Cost sketch (premium daily, rough)

- HeyGen ~$24-89/mo · ElevenLabs ~$5-22/mo · i2v (Kling/Hailuo) ~$10-30/mo · R2 free tier ·
  OpenRouter (script) negligible. → **~$40-140/mo for daily premium output.** Free tier = $0.
