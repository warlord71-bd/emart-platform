# Creative + Video Quality Audit - 2026-06-28

Scope: `workspace/creative-engine/`, `workspace/video-engine/`, HyperFrames render path, script/voice/caption/QA stages, and current reel queue/review outputs.

## Executive verdict

The current system is technically healthy but content-quality gates are too weak.

Recent rendered reels are consistently `1080x1920`, `24fps`, include audio, pass local QA around score `96`, and HyperFrames is correctly acting as the motion/render layer over pre-rendered Creative Engine frames. The main risk is upstream: product specs, generated scripts, visual claims, voice expectations, and caption QA are not strict enough. That means a technically passing reel can still contain wrong product claims, placeholder copy, awkward language, or mismatched imagery.

## Evidence checked

- Syntax checks passed for Creative Engine, video worker, producer, script, voice, QA, and orchestrator Python modules.
- `node --check workspace/video-engine/hyperframes/render.js` passed.
- Recent MP4 outputs checked with `ffprobe`: all sampled reels were `1080x1920`, `24fps`, AAC audio present, around `13.5s`.
- Orchestrator status showed one queued job, seven review jobs, four approved jobs, zero dead-letter jobs.
- Current review QA reports show technical/audio/visual pass but often skip caption overlay validation when no overlay JSON exists.

## Findings

### P0 - Product-specific copy mismatch

`workspace/video-engine/daily_producer.py` currently applies sunscreen/SPF defaults to every daily product:

- `product_card_badge: Daily SPF`
- `SPF50+ PA++++`
- sunscreen-specific Bangla copy and list-card bullets

This already affected pending/review COSRX Snail 92 cream jobs. The product is a moisturizer/cream, but queued specs contain SPF claims. Owner approval prevents automatic publishing, so live risk is controlled, but review quality is compromised.

Recommended fix: make daily producer product-type aware before enqueue. Use product/category/ingredient rules to select claim templates. Reject or regenerate any queue/review job where claim class conflicts with product class.

### P0 - Placeholder scripts can pass

`workspace/video-engine/stages/script_gen.py` includes schema placeholder text in the prompt, and validation only checks that required keys exist. A current script file contains literal placeholders such as:

- `<=5 words`
- `2-3 sentence platform caption`
- `30-40 word spoken script`

Master QA still passes the rendered reel because it focuses on technical and coarse visual health, not script semantic validity.

Recommended fix: add a script validator before render. Hard-fail placeholder phrases, schema hints, empty benefits, repeated generic lines, unsafe claim words, and product/name mismatches.

### P1 - QA does not validate product claims

`reel_qa_master.py` catches format, audio, rough visual quality, and some caption presence, but does not currently prove:

- product type matches claims
- sunscreen claims are only used for sunscreen
- all visible text is valid
- generated Bangla/Banglish copy is coherent
- script benefits are grounded in product data

Recommended fix: add a pre-render content QA gate plus an OCR/frame-text gate after render. The gate should compare script, card text, and visible frame text against a product claim profile.

### P1 - Voice setup is inconsistent

Actual voice generation uses `edge-tts` in `workspace/video-engine/stages/voice_gen.py`, while `workspace/video-engine/config/providers.json` still describes a disabled `piper-local` free provider and silent fallback. Worker fallback can produce a music/silence file when voice fails; later QA can catch very low loudness, but it does not guarantee intelligible spoken voice.

Recommended fix: align provider config/docs with actual Edge TTS use. Add a `voice_required` default for review reels, record voice provider in job metadata, and fail owner-review builds when spoken duration or speech confidence is missing.

### P1 - Caption systems are inconsistent

There are two caption/render concepts:

- `caption_overlay.py` generates Playwright PNG overlays with platform safe zones.
- `hyperframes/render.js` also has inline caption element logic with different vertical positions.

Product-card jobs often disable visual captions, so master QA reports caption checks as skipped. This avoids overlay collisions, but it also means a reel can pass without validating on-video text.

Recommended fix: choose one caption authority. For product-card reels, prefer Creative Engine frame text plus optional lower-third CTA only. QA should verify the chosen text system, not silently skip it.

### P1 - Product-image identity QA is missing

The static social work already exposed this issue: Minimalist Alpha Arbutin/Vitamin C and Dr. Althea serum visuals needed replacement from real web/product images. The reel path still needs an explicit product-image identity gate before rendering.

Recommended fix: add image-source metadata and a product-identity review check. Minimum gate: image URL/source, expected brand/product token match, visual crop/readability score, and manual review flag for uncertain images.

### P2 - Background generation is nondeterministic

`workspace/creative-engine/data/backgrounds.py` can fetch Pollinations backgrounds and disables SSL certificate verification for that call. This can produce style drift, network variability, and trust concerns.

Recommended fix: treat remote AI backgrounds as optional drafts only. Prefer a local approved background library per category/claim. If remote generation stays enabled, restore certificate verification or explicitly mark it as non-production draft mode.

### P2 - HyperFrames quality is standard mode

`workspace/video-engine/hyperframes/render.js` currently invokes HyperFrames with `--quality standard --low-memory-mode`. Output is technically good and lightweight, but there is room for a premium render profile for final owner-approved assets.

Recommended fix: keep standard for queue throughput, add a `premium` render preset for final/rebuild mode with higher quality/bitrate and a no-low-memory option when VPS resources allow.

### P2 - Docs/config are stale

`workspace/video-engine/README.md` still references future caption work that now exists, and provider config does not match actual voice implementation.

Recommended fix: update video-engine docs after implementation fixes so future agents do not optimize the wrong layer.

## Improvement plan

### Phase 1 - Same-day safety

1. Reject/regenerate current COSRX cream queue/review jobs that include SPF copy.
2. Add `validate_script_payload()` to fail placeholders and schema text.
3. Make `daily_producer.py` choose product-type templates instead of universal SPF defaults.
4. Update provider config to reflect Edge TTS and mark silent fallback as failure for owner-review builds.

### Phase 2 - Quality gates

1. Add product claim profiles: sunscreen, cleanser, moisturizer, serum, toner, ampoule, retinol, makeup.
2. Add pre-render semantic QA for script/card/spec consistency.
3. Add OCR/frame-text QA for final MP4 frames.
4. Unify caption strategy so QA never silently skips important on-video text.
5. Add voice QA beyond loudness: speech duration, provider metadata, expected spoken script length.

### Phase 3 - Visual and voice upgrades

1. Add product-image identity gate for real product images and source metadata.
2. Build approved local background/persona libraries by product class.
3. Add premium HyperFrames final-render preset.
4. Optionally add higher-quality paid/free voice tiers, but only after the claim/script gates are fixed.

## Current queue recommendation

Do not publish or approve the current COSRX Snail 92 cream reel specs that contain SPF/sunscreen copy. Regenerate those jobs after daily producer templates are product-aware.

No automatic publish path was found in the builder cron: orchestrator builds drafts into review, and owner Telegram approval remains the publishing gate.

## Verification commands run

- `python3 -m py_compile workspace/creative-engine/api.py workspace/creative-engine/render.py workspace/creative-engine/data/normalize.py workspace/creative-engine/data/backgrounds.py workspace/video-engine/worker.py workspace/video-engine/daily_producer.py workspace/video-engine/stages/script_gen.py workspace/video-engine/stages/voice_gen.py workspace/video-engine/stages/reel_qa_master.py workspace/video-engine/orchestrator.py`
- `node --check workspace/video-engine/hyperframes/render.js`
- `ffprobe` sampling of recent rendered MP4 outputs
- `python3 workspace/video-engine/orchestrator.py --status`

