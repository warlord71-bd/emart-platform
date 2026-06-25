# Opus Humanizer Engine — run guide (for Hermes)

A drop-in "content class" that reproduces Opus-4.8 PDP descriptions on any OpenRouter model,
GMC-safe and AI-residue-free, with an automated quality gate and a self-improvement loop.

```
engine/
  humanizer_engine.py   # content class: SYSTEM_PROMPT, build_messages, generate, targets, apply
  residue_lint.py       # 0-100 scorer + 2 hard gates (GMC, AI-residue) + auto-scrubber
  OPUS_STYLE_SPEC.md    # the governance spec (the "why")
  exemplars.jsonl       # gold few-shot (top Opus outputs, auto-injected into every prompt)
  active/engine-YYYY-MM-DD.jsonl   # generated drafts + scores (created on first run)
  scores.jsonl                     # append-only score log (self-improvement tracking)
```

## Setup

```bash
export EMART_DB_PASSWORD=$(grep DB_PASSWORD /var/www/wordpress/wp-config.php | head -1 | sed "s/.*'\([^']*\)'.*/\1/")
export REVALIDATE_SECRET=$(grep REVALIDATE_SECRET /var/www/emart-platform/apps/web/.env.local | cut -d= -f2)
# OpenRouter key: auto-read from /root/.openclaw/credentials/openrouter_default.json, or:
export OPENROUTER_API_KEY=sk-or-v1-...
export OPENROUTER_MODEL=nousresearch/hermes-4-405b   # any strong instruct model
```
Run from the repo root (`/root/emart-platform` local, or `/var/www/emart-platform` on VPS).

## The loop

```bash
# 1. See the next targets (top-sales serum/sunscreen/cream, holdout-excluded, not yet humanized)
python3 workspace/humanizer/engine/humanizer_engine.py --targets 20

# 2. Generate + auto-lint -> active/engine-<date>.jsonl  (NO DB writes). Retries once if it fails the gate.
python3 workspace/humanizer/engine/humanizer_engine.py --dry-run --limit 10

# 3. Review FAILs (and spot-check PASSes)
python3 workspace/humanizer/engine/residue_lint.py --jsonl workspace/humanizer/engine/active/engine-<date>.jsonl

# 4. Apply only PASSed rows to the live DB, then auto-revalidate ISR (tag:products)
python3 workspace/humanizer/engine/humanizer_engine.py --apply
#   ...fixed a FAIL by hand in the JSONL? apply everything with:  --apply --force
```

Single product end-to-end:
```bash
python3 workspace/humanizer/engine/humanizer_engine.py --dry-run --post-id 51962
python3 workspace/humanizer/engine/humanizer_engine.py --apply --post-id 51962
```

## Rules Hermes must keep (non-negotiable)

- **Dry-run → review → apply.** Never write to the DB without a PASS (or a hand-fixed `--force` row).
- **GMC + residue gates are hard.** A row that fails either is never auto-applied.
- **Holdout is sacred.** `targets()` already excludes the 212 GSC holdout slugs + ids {2591,2611,4064};
  never override this — it protects the SEO measurement baseline.
- **Always revalidate** after applying (the `--apply` path does this for you).
- **Protected data is off-limits:** price, stock, SKU, orders, customers. This engine only touches
  `post_content` + the `_emart_humanized` flag.

## Self-improvement

- Mean/min score per run prints at the end of `--dry-run`; full history in `scores.jsonl`.
- Improving the prompt: edit `SYSTEM_PROMPT`, bump `PROMPT_VERSION`, run a batch, confirm mean score rises.
- Promote any new PASS scoring ≥ 92 into `exemplars.jsonl` so few-shot quality compounds over time.
- Calibration baseline (Opus-4.8 hand-written): exemplars score 89–96.
- `emart-stop-slop-v1` is a **soft** PDP-only style layer inside `residue_lint.py`. It catches
  formulaic prose without adopting blanket bans that conflict with Emart's AEO/product voice.
- Run linter tests with:
  `python3 -m unittest discover -s workspace/humanizer/engine/tests`
- Do not copy this layer into blog/social gates without a separate corpus benchmark and review.

See `OPUS_STYLE_SPEC.md` for the full rationale behind every rule.
