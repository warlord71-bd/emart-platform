# Face Cleanser Humanizer

Single source of truth for the face-cleanser content humanizer.

## Current State

- **Humanized:** 185 / 218
- **Holdout (do not touch):** 13 products → measure 2026-07-26
- **High-sales protected:** 2 products
- **Remaining eligible:** ~21 regular (Codex in progress) + minis done
- **Category fixes:** 62869 (body wash) + 63929 (toner) removed from face-cleansers
- **Bundle skip:** 63747 flagged `_emart_humanizer_skip=bundle-kit`

## Run (from project root `/var/www/emart-platform`)

```bash
# Dry-run next batch
EMART_DB_PASSWORD=... OPENROUTER_API_KEY=... \
  python3 workspace/humanizer/face-cleansers/humanizer_face_cleansers.py \
  --dry-run --limit 20

# Review JSONL
workspace/humanizer/face-cleansers/active/face-cleansers-YYYY-MM-DD.jsonl

# Apply reviewed rows
EMART_DB_PASSWORD=... OPENROUTER_API_KEY=... \
  python3 workspace/humanizer/face-cleansers/humanizer_face_cleansers.py --apply

# Single product
python3 workspace/humanizer/face-cleansers/humanizer_face_cleansers.py \
  --dry-run --post-id 12345
```

## File Structure

```
face-cleansers/
  humanizer_face_cleansers.py   ← CANONICAL script (only copy)
  README.md                     ← this file

  active/                       ← currently in use — do not delete
    current-batch.jsonl         ← latest JSONL batch (Codex in progress)
    rollback-current.json       ← Jun 3 rollback snapshot
    rollback-first-batch.json   ← May 31 rollback snapshot
    consistency-audit-final.csv ← latest quality audit
    consistency-audit-final.md
    openclaw-dryrun-latest.log  ← latest OpenClaw run log

  archive/
    batches/                    ← old JSONL generation history
    rollbacks/                  ← all per-product rollback snapshots
    audits/                     ← superseded audit files + old logs
    scripts/                    ← applied PHP/sh scripts (one-time, done)
```

## Next Category: Toner/Mist

After face-cleansers complete:
1. `cp humanizer_face_cleansers.py ../toners/humanizer_toners.py`
2. Update: `CATEGORY_SLUG`, `CLEANSER_TYPES`, `PAIRING_BY_TYPE`, h3 labels
3. Run `baseline_snapshot.py` for toner/mist to get GSC data
4. Same holdout rule: 13-product control group per category
