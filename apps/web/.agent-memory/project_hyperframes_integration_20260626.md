---
name: hyperframes-integration
description: HyperFrames HTML-to-video renderer integrated into video engine as default renderer, replacing ffmpeg concat
metadata:
  type: project
---

HyperFrames (heygen-com/hyperframes, Apache 2.0) integrated as the default reel renderer in the video engine.

**Why:** HTML/CSS composition with GSAP animations produces higher-quality reels than PIL→PNG→ffmpeg concat. Real crossfade transitions, animated text reveals, staggered bullet points, Ken Burns via GSAP (smoother than ffmpeg crop-pan). Same browser-rendered Bangla quality.

**How to apply:**
- `workspace/video-engine/hyperframes/` — Node.js project with `render.js` entry point
- `workspace/video-engine/stages/reel_hyperframes.py` — Python wrapper for worker
- `worker.py` defaults to `renderer: "hyperframes"`, falls back to ffmpeg on failure
- Jobs can set `"renderer": "ffmpeg"` to force the old pipeline
- Audio files are copied into temp project dir (HyperFrames needs relative paths, not file:// URIs)
- Post-render ffmpeg loudnorm pass normalizes to -14 LUFS (HyperFrames doesn't have built-in loudnorm)
- Existing QA gates, orchestrator, Telegram bot, checkpointing all unchanged

**Verified:** COSRX test reel passed — 1080x1920, 24fps, 18.5s, audio present, -14.0 LUFS, QA score 96, all 4 scenes (persona, model+product, value card, brand card) render correctly with proper Bangla.

**Install on VPS:** `cd workspace/video-engine/hyperframes && npm install`
