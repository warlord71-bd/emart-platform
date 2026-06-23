---
name: project-humanizer-engine-20260623
description: Opus Humanizer Engine — reusable content-class package so Hermes can generate PDP descriptions on open models
metadata: 
  node_type: memory
  type: project
  originSessionId: 889d0391-ce2f-4004-bd70-0b34dce35b7e
---

Built 2026-06-23 so the **Hermes agent** can generate the remaining product descriptions on any open OpenRouter model at Opus-4.8 quality — GMC-safe, SEO/AEO-optimised, AI-residue-free — instead of Claude hand-writing each. [[project_humanizer_resume_20260623]]

**Location:** `workspace/humanizer/engine/`
- `humanizer_engine.py` — the content class. Holds the authoritative `SYSTEM_PROMPT` (Opus voice, 5-section structure, keyword/snippet/schema/AEO/E-E-A-T logic, GMC + AI-residue bans). Builds per-product messages from live DB (focus kw, brand, origin, concern, skin type, category, ingredients), calls OpenRouter, gates every output through the linter, retries once on fail. CLI: `--targets N`, `--dry-run [--limit N|--post-id ID]`, `--apply [--force]`. Reuses `humanizer_impression_priority.py` for DB/`apply_to_db`/`DISCLAIMER`.
- `residue_lint.py` — 0-100 scorer, 7 categories, TWO HARD GATES (GMC medical-claims, AI-residue density/em-dash/`!`). PASS = total≥80 AND both gates clean. Also `scrub()` auto-fixer. Logs to `scores.jsonl` for self-improvement. CLI `--file` or `--jsonl`.
- `OPUS_STYLE_SPEC.md` — governance/why doc. `README.md` — run loop. `exemplars.jsonl` — top-3 Opus gold few-shot (auto-injected; promote any new PASS≥92 into it).

**Run loop:** `--targets` → `--dry-run` (writes `active/engine-DATE.jsonl` + scores, NO DB) → review FAILs → `--apply` (applies PASS rows only, auto-revalidates `tag:products`). Holdout (212 GSC slugs + ids 2591/2611/4064) auto-excluded by `targets()` — never override.

**Validation:** linter calibrated on Opus hand-written copy (exemplars score 89-96; it caught my own live "miracle" slip). Full pipeline proven end-to-end on free model `google/gemma-4-31b-it:free` → generated 519-word PASS (100/100, 0 issues). Default model env `OPENROUTER_MODEL` (set to `nousresearch/hermes-4-405b`).

**Blocker:** OpenRouter PAID credits = 402 out of credits; free models work but rate-limit (429). Owner/Hermes should use a funded key or BYOK. Valid key at `/root/.openclaw/credentials/openrouter_default.json` (auto-read if env unset). [[project_openrouter_humanizer_key_20260601]]

**Self-improvement:** edit `SYSTEM_PROMPT`, bump `PROMPT_VERSION`, run batch, confirm mean `scores.jsonl` rises; compare models the same way.
