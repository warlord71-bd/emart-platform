# AI Video Engine State - 2026-06-23

- `workspace/video-engine/` is a local Phase 0 reel engine: provider registry, worker, ffmpeg Ken-Burns reel generation, script generation, local public storage, dry-run Meta publisher handoff, and optional Gemini video QA.
- Script priority is inline agent-authored `job.script` > OpenRouter free Google-family Gemma (`google/gemma-4-31b-it:free`, then `google/gemma-4-26b-a4b-it:free`) > other free OpenRouter fallback > template. Direct Google/Vertex is explicit-only.
- On-screen reel text must stay romanized Banglish until a Playwright/HTML overlay exists; this VPS ffmpeg/libass stack does not shape Bengali script correctly.
- `stages/reel_qa_local.py` is the default $0 QA gate; it checks MP4 dimensions, duration, file size, audio/video streams, and blocks publish on fail. `stages/reel_qa_gemini.py` is optional direct-Google QA only via `job.qa_provider="gemini"`.
- Existing Google service accounts for GMC/GSC/Play are not the requested `gemini@emart-2923b.iam.gserviceaccount.com` key. Do not ask the owner to paste keys into chat. For service-account auth, upload that JSON to `/root/.config/gemini-service-account.json` or set `GEMINI_SERVICE_ACCOUNT_FILE`; this uses Vertex AI and currently needs billing enabled on project `emart-2923b`.
- Verified locally: Python compile passes; OpenRouter script generation works with `google/gemma-4-31b-it:free`; local QA passes on the snail reel.
