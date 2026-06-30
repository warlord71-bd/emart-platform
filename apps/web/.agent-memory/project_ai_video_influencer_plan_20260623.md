---
name: ai-video-influencer-plan-20260623
description: "Planning state for the AI-influencer + daily video content system (tier-swappable, API-first, no GPU)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3d7541ad-0328-4ebb-8407-6a92ccf96760
---

AI influencer + video content system — PLANNING stage, not built. Full plan:
`workspace/content-orchestrator/docs/claude-reference/ai-video-influencer-plan.md`.

## Key facts that constrain it
- VPS has NO GPU, 6 cores, 11GB RAM. Disk cleaned 2026-06-23 → ~34GB free (was 13GB); self-hosted
  video gen still impossible (no GPU); must be API-based.
- ffmpeg works on CPU → assembly is local & free. Ken-Burns over stills = a real $0 free-tier video path.
- OpenRouter key is text-only (scripts/captions only, no image/video).

## Core design principle (owner)
Everything tier-swappable PER JOB: free ↔ mid ↔ premium dials for image, face-consistency,
talking-video, b-roll, voice, storage. Implemented as provider-registry + job-router (picks cheapest
provider that meets the job's quality bar, falls back down tiers). Storage backend swappable
(local|R2|S3); Cloudflare R2 recommended (10GB free, zero egress) to solve disk limits long-term.

## Personas
2-3 recurring AI models, locked faces (InstantID), culturally grounded for Bangladesh: authentic local
skin tones (no colorist whitening), modest/hijabi option, Banglish, COD framing. Dr./Expert,
Relatable User, Aspirational Glam.

## Loop
Generalize the proven meta-18 PM2 scheduler: JSON content queue + worker that checkpoints after every
stage (resumable, never re-bills), budget/volume guardrails, daily cron trigger, R2 offload.

## Phased rollout
Phase 0 free (ffmpeg reels, prove loop) → Phase 1 mid (Flux+InstantID personas) → Phase 2 premium
(talking avatar + ElevenLabs + YouTube) → Phase 3 TikTok + analytics-driven selection.

## Blocking owner decisions before build
Budget cap; provider accounts (Fal/Replicate, D-ID/HeyGen, ElevenLabs/Google TTS, R2, YouTube API);
language; platform priority. Relates to [[feedback-social-image-sizes]] and
[[social-publishing-unified-20260623]].

## Build progress 2026-06-23 (Phase 0 started)
`workspace/video-engine/` scaffolded:
- `config/providers.json` — tier registry (the dials). Image capability UNIFIED: shares
  social_image_gen.py + Codex image-gen + raw Woo photo as swappable image sources for BOTH static
  posts and reels (no duplicate generator).
- `stages/reel_ffmpeg.py` — FREE vertical reel generator (Ken-Burns + xfade + captions), PROVEN:
  real 1080x1920 H.264 MP4 at $0, CPU-only ~5s per clip, single + multi-image. Bengali captions
  auto-pick Noto Bengali font.
- README + .gitignore (output/queue/*.mp4 ignored).
- `lib/router.py` — tier-dial provider picker (falls back down tiers; free always wins last). DONE.
- `worker.py` — drains queue/*.json; stages images→reel→store→publish; checkpoints each stage
  (resumable, never re-runs done); guardrails (max/day, budget cap, dry-run default). PROVEN end-to-end dry-run.
- `workspace/content-orchestrator/scripts/active/meta_reel_publish.js` — FB video + IG Reels publisher (unified META_* creds). Dry-run verified.
- Storage: reels copied to apps/web/public/videos/reels/ and served via nginx `/public/` alias
  (range-capable HTTPS, HTTP 206, NO Next restart). `apps/web/.gitignore` ignores `/public/videos/`.
  IMPORTANT: Next does NOT serve runtime-added public files (only build-time); use the `/public/` nginx path.

- `stages/script_gen.py` — OpenRouter (env OPENROUTER_API_KEY, free Nemotron) → reel script
  (hook/benefits/cta/caption/hashtags/voiceover) in en/bn/banglish (language = per-job dial). The model is a
  REASONING model: needs max_tokens ~2800 + extract the best-scored JSON candidate (not first/last). PROVEN 3/3.
  Quality note: free Nemotron has minor Bangla word-choice slips — swap OPENROUTER_MODEL for better Bangla.
- Timed captions in reel_ffmpeg.py (hook→benefits→cta sequenced); worker `generate_script:true` auto-runs
  script→caption→reel and uses generated caption+hashtags for publish. Full auto pipeline PROVEN dry-run.
- Free-tier audio is SILENT (no local TTS installed); voice is the mid dial (Google TTS bn-BD).

- SCRIPT AUTHORING: worker now prefers an inline `script` object that Claude/Opus writes directly
  (best quality, $0, no model call). Priority: inline `script` > OpenRouter > template. User wants
  Claude to write scripts when needed (free model = too many issues + busy on other tasks).
- BENGALI RENDERING BUG (important): this box's ffmpeg drawtext AND libass lack HarfBuzz → do NOT shape
  Bengali conjuncts (দিনভর→দনিভর). Only the BROWSER shapes Bengali (social_image_gen.py Chromium route).
  Convention: on-screen lines (hook/benefits/cta) = ROMANIZED Banglish (renders perfectly); caption +
  voiceover = native Bangla (platforms render natively). Future fix: Playwright HTML→PNG caption overlay.
- Cache-bust: worker appends ?v=<mtime> to reel URL (Cloudflare cached a 404 when a path was probed
  pre-stage; this prevents IG/FB fetching a stale 404).
- claude-vision skill (github.com/mikefutia/claude-vision): Claude Code skill, analyzes video via Google
  Gemini → structured report. Great for automated REEL QA; free Google AI Studio Gemini key would also be
  a much better free SCRIPT model than Nemotron. Needs install to ~/.claude/skills + google-genai + key.

Next increments: voice/music stage, persona stage (Flux+InstantID consistent faces), YouTube Shorts +
TikTok publishers, PM2/cron daily drain, R2 offload, optional Playwright Bangla caption overlay,
optional claude-vision QA + Gemini script provider.
LIVE PUBLISH still gated on owner approval (run worker with --allow-publish to actually post).
User will review reel output quality later before discussing changes.

## Also done 2026-06-23
VPS cleanup reclaimed ~21GB; weekly cron `workspace/content-orchestrator/scripts/active/cleanup_chromium_profiles.sh`
(Sun 04:00) prevents the snap-Chromium/Playwright-MCP profile leak (~96 abandoned profiles/day).
