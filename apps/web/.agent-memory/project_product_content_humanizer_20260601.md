# Product Content Humanizer State - 2026-06-01

The full-catalog product content humanizer is active but must continue in small JSONL-reviewed batches.

Current state:
- `workspace/docs/humanizer_face_cleansers.py` is the production script for face cleansers.
- Face cleansers: 35/218 applied; 183 remaining.
- Holdout/control: 213 products have `_emart_holdout`; do not touch until the 8-week measurement completes on 2026-07-26.
- GSC baseline exists at `workspace/audit/active/baseline-snapshot-2026-05-31.json`.
- GSC query map exists at `workspace/audit/active/gsc-query-map-2026-05-31.json`.
- Humanizer writes top GSC query to `_rank_math_focus_keyword`, brand schema to `_rank_math_schema_data`, and syncs existing `_structured_description` price fragments to current `_price`.

Next safe workflow:
1. Run face-cleanser dry-run in a batch of about 20.
2. Manually review `workspace/audit/active/face-cleansers-YYYY-MM-DD.jsonl`.
3. Apply only reviewed JSONL.
4. Revalidate product cache/tag after apply.

Do not start new category scripts until face cleansers are complete, unless the owner explicitly reprioritizes.

Security follow-up:
- Rotate the GSC service-account key with fingerprint `ce8b30ba...`; it was shared in chat during setup.
