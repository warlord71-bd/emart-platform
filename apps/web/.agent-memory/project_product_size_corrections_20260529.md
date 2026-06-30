# Product Size Correction Workflow — 2026-05-29

Owner-provided XLSX `product-data-mismatch-audit-20260529-124704.xlsx` has a final `correct` column that should be treated as the source of truth for size cleanup.

Important constraints:
- Do not change product slugs or URLs during the stability freeze.
- Size cleanup may update Woo product title, visible size/volume/weight/pack attribute, and exact stale size text in product/meta fields.
- Decimal slug forms such as `4-8g`, `1-35g`, and `39-6g` are historical URL-safe encodings and must parse as `4.8g`, `1.35g`, and `39.6g`, not `8g`, `35g`, or `6g`.
- Apply only after reviewing the dry-run CSV; bulk Woo data writes must not skip dry-run review.

Files added/updated:
- `workspace/content-orchestrator/scripts/active/audit-product-data-mismatches.php` now parses decimal sizes in slugs.
- `workspace/content-orchestrator/scripts/active/product-size-corrections-from-review.php` creates dry-run/apply reports from reviewed CSV input and never writes `post_name`.
- Reviewed input CSV generated from XLSX: `workspace/audit/active/product-size-corrections-review-20260529-202621.csv`.
- Latest dry-run: `workspace/audit/active/product-size-corrections-dry-run-20260529-203021.csv`.
- Fixed-parser audit: `workspace/audit/active/product-data-mismatch-audit-20260529-203048.md` / `.csv`.

Initial dry-run summary:
- Input rows: 144
- Would update: 115
- Unchanged: 29
- Invalid/not found: 0
- Title changes: 7 simple replacement rows, 1 append-missing-size row; bundle/multi-size titles are kept.
- URL/slug changes: 0

Applied after owner approval:
- Apply CSV: `workspace/audit/active/product-size-corrections-applied-20260529-203929.csv`
- Rollback JSON: `workspace/audit/active/product-size-corrections-rollback-20260529-203929.json`
- Post-apply dry-run: `workspace/audit/active/product-size-corrections-dry-run-20260529-204038.csv`
- Post-apply result: 144 unchanged, 0 would-update, 0 invalid/not found.
- Revalidated: `tag:products` and `/shop`.
- Spot checks: MIZON 75g, Some By Mi 120ml, and Nivea 4.8g PDPs returned 200 and showed corrected size signals on unchanged URLs.
- Post-apply read-only mismatch audit: `workspace/audit/active/product-data-mismatch-audit-20260529-204358.md`, 113 rows remaining. Remaining rows are mostly historical slug/missing-slug issues that should not be fixed by URL changes during the freeze.
