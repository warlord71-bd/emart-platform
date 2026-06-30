# pa_concern auto-assign dry-run state — 2026-06-06

Codex generated a WP-CLI helper at `workspace/content-orchestrator/scripts/active/pa-concern-auto-assign.php`.

Dry-run output:
- CSV: `workspace/audit/active/pa-concern-auto-assign-20260606.csv`
- Summary: `workspace/audit/active/pa-concern-auto-assign-20260606-summary.txt`
- Final result: 1,161 manual-review rows, 13 assigned, 1,147 blank, 1 not published/product.

Guard logic:
- Existing live `pa_concern` assignments are never overwritten.
- Rows in `workspace/audit/archive/pa-concern-highmed-approved.csv` are protected when they contain actual approved non-SKIP concern terms.
- Manual rows with blank/SKIP highmed history remain eligible if they still have no live `pa_concern`.
- Non-skincare/hair/makeup/baby products are guarded out before title keyword matching.

Live `pa_concern` slugs verified on 2026-06-06:
- `acne-blemish`
- `anti-aging-repair`
- `brightening`
- `dryness-hydration`
- `hyperpigmentation`
- `pores-blackheads`
- `sensitivity`
- `sunscreen`
- `wrinkle`

Prompt alias normalization used:
- `sun-protection` -> `sunscreen`
- `brightness` -> `brightening`
- `pore-care` -> `pores-blackheads`
- `anti-aging` -> `anti-aging-repair`

Applied after owner approval:
- Command: `APPLY=1 wp --path=/var/www/wordpress --allow-root eval-file workspace/content-orchestrator/scripts/active/pa-concern-auto-assign.php`
- Result: 13 products updated, 1,147 blank rows skipped.
- Revalidate response: `{"ok":true,"revalidated":["tag:products"],"at":"2026-06-06T12:21:37.925Z"}`
- Post-apply verification confirmed all 13 expected product IDs have their assigned `pa_concern` slug.

Leave the remaining 1,147 rows blank unless stronger product-specific signal or owner/manual review exists.
