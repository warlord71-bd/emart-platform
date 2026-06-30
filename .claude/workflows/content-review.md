---
description: Content humanizer/review pipeline — generate, lint, review, apply, revalidate
---

# Content Review Workflow

Applies to: PDP description humanization, blog drafts, meta description generation, FAQ generation.

## Principles
- Never direct-publish generated content
- All content passes through: generate -> lint -> review -> apply -> revalidate -> verify
- Owner approval required before bulk writes

## PDP Humanizer Pipeline

### 1. Generate
```bash
bash workspace/humanizer/engine/run_detached.sh <LIMIT>
```
Uses free OpenRouter models (gemma-4-31b chain). Outputs JSONL.

### 2. Lint
`residue_lint.py` gates: score >= 80, GMC-clean, AI-residue-clean. PASS rows auto-apply.

### 3. Review
- Check `scores.jsonl` for quality trends
- Promote PASS >= 92 into `exemplars.jsonl`
- Holdout: 212 GSC slugs + ids 2591/2611/4064 auto-excluded

### 4. Apply
PASS rows write `_emart_humanized=1` to Woo and revalidate `tag:products` via `/api/revalidate`.

### 5. Verify
- Spot-check live PDPs for content display
- Telegram ping on completion (automatic)

## Blog Content Pipeline

### 1. Generate
```bash
python3 /root/.openclaw/workspace-emart/blog_generator.py --draft
```
Never call `blog_generator.py` without `--draft` (publishes directly). The repo wrapper
`workspace/content-orchestrator/scripts/active/blog_generator_run.sh` currently calls it
bare with no flags — do not use that wrapper until it passes `--draft`.

### 2. Review
Drafts saved to `blog_drafts/`. Check: H1/H2 structure, internal links (must be live 200), no banned residue, no medical claims, product links to in-stock items only.

### 3. Publish
Owner approves, then publish via WP admin or script.

## Meta Description Pipeline
- Generator: `emart-meta-gen` (PM2, completed Jun 15)
- Validator: full-catalog sweep, 0/3,625 flagged as of 2026-06-20
- Any new regeneration: dry-run first, review sample, then batch apply

## Reference
- Content standard: `workspace/CONTENT_STANDARD.md`
- Humanizer spec: `workspace/humanizer/engine/OPUS_STYLE_SPEC.md`
- Stop-slop rules: `emart-stop-slop-v1`
