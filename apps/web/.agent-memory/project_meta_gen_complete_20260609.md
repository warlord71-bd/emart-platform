---
name: project-meta-gen-complete-20260609
description: emart-meta-gen stopped, meta quality fixed, CLAUDE.md restructured, brand fix deployed — 2026-06-09
metadata:
  type: project
---

## emart-meta-gen — STOPPED and COMPLETE

PM2 process `emart-meta-gen` was stopped on 2026-06-09. It had been stuck in a spin loop (cycle 315) for 24 hours.

**Root cause of stuck loop:** `remaining()` bash function in `meta_gen_batch.sh` used MySQL `LENGTH()` (byte count) instead of `CHAR_LENGTH()` (character count). Em-dash `—` in clause-2 templates is 3 bytes but 1 character. 158-char metas with em-dash = 160 bytes → shell falsely counted 594 "remaining". Python generator correctly counted 0. Fix applied to disk (script is gitignored).

**True completion state:** Python `meta_generator.py` reports 0 products needing new metas.

**Coverage:**
- 2,850 products have `_emart_meta_description` (130+ chars)
- 3,630 have `_rank_math_description` (130+ chars)
- 784 have no `_emart_meta_description` but all fall back to valid `_rank_math_description`

## Meta quality fix (2026-06-09)

- Deleted 34 bad `_emart_meta_description` rows (`see title`, `original original`, `Official original`, `price in bangladesh`)
- Regenerated 41/42 via `fix_metas_force.py` — 1 skip (`#60681` falls back to valid rank_math)
- ISR revalidated via `tag:products`

**6 products still have "original original"** — root cause is Woo taxonomy: `pa_brand` or `pa_origin` term value is literally "original" for those products. Fix: find which brand/origin attributes have term "original" in Woo and correct the term name. Not a code bug.

**Why:** batch meta generation at scale exposed a template rendering bug when taxonomy terms have unexpected values.
**How to apply:** before running meta-gen again, check that `pa_brand` and `pa_origin` terms don't have "original" as a value.

## CLAUDE.md / AGENTS.md restructure (2026-06-09, commit ce0bf6d)

- `emart/CLAUDE.md`: 3,301t → 1,202t (−62% per-turn context)
- `root/CLAUDE.md`: 2,014t → 824t
- `AGENTS.md`: lean self-contained entry point for Codex (same content as CLAUDE.md)
- Moved to reference docs (load on demand, not auto-loaded):
  - `workspace/content-orchestrator/docs/claude-reference/openclaw.md` — full OpenClaw capability
  - `workspace/content-orchestrator/docs/claude-reference/deploy-reference.md` — deploy shell functions
- `.github/copilot-instructions.md` created (minimal, 147t)
- `.claudeignore`: `workspace/content-orchestrator/docs/*.py` + `workspace/content-orchestrator/docs/*.mjs` excluded

## Git state after this session

- Local/VPS/Origin: all at `ce0bf6d` — clean, no dirty files
- commit: `chore: lean CLAUDE.md (-62% tokens) + fix bad metas + brand fix`
