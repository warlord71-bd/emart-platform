---
name: Non-Korean Korea-import copy cleanup
description: Misleading Korea-import wording removed from non-South-Korea product descriptions/meta
type: project
---

On 2026-05-14, Codex audited published WooCommerce products excluding `pa_origin=South Korea` for misleading wording:

- `korea import`
- `korean import`
- `imported from korea`

Initial exact/variant count: 908 non-South-Korea-origin products.

Fix applied with `workspace/scripts/active/fix-non-korean-korea-import-copy.php`:

- 908 products changed.
- 1,050 fields changed: 140 `post_content`, 905 `post_excerpt`, 5 selected SEO/public meta fields.
- Bangladesh-origin products were changed to `100% authentic Bangladeshi product`, not `Bangladesh import`.
- Other single-origin products were changed to origin-safe wording like `UK-origin product` / `USA-origin product`.
- Missing, multiple, or multinational origin rows were changed to generic `Emart-verified product(s)`.

Audit/backup files:

- Dry run: `workspace/audit/active/non-korean-korea-import-copy-dry-run-20260514-205029.csv`
- Apply report: `workspace/audit/active/non-korean-korea-import-copy-apply-20260514-205241.csv`
- Backup: `workspace/audit/archive/non-korean-korea-import-copy-backup-20260514-205241.csv`

Verification:

- Non-South-Korea-origin products now have `0` matches for all three bad wording patterns in product description/short description/Rank Math description.
- No non-South-Korea-origin postmeta remains with those phrases.
- Live sample `Simple Moisturising Facial Wash 150ml` meta/copy shows `UK-origin product`.
- Live sample `Savlon Wet Wipes 80Pcs` copy shows `Bangladeshi product`.
