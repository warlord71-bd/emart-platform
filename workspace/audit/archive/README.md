# Archived Audit Workspace

Use this folder for completed audit outputs that should stay near the project for short-term reference.

Large raw exports and old generated batches should be quarantined in `/root/.attic-YYYY-MM-DD/emart-platform/` instead of Git.

## 2026-05-11 active cleanup

Codex moved completed active reports into this archive folder and moved completed
one-off scripts into `workspace/scripts/archive/` to reduce VS Code/workspace
noise without deleting data. Full local manifest:
`workspace/audit/archive/active-cleanup-manifest-20260511.md`.

Moved report groups:
- Facebook catalog audit and image-fetch verification outputs.
- Facebook pixel event audit report.
- Completed slug cleanup outputs.
- Completed The Derma Co origin correction dry-run/apply outputs.

Kept active:
- Week 2 SEO/product SEO audit files.
- SKU and brand-size owner-review CSVs.
- `pa_origin` gap dry-run.
- The Derma Co meta review and Baidu Qianfan handoff.

## 2026-05-11 The Derma Co meta copy cleanup

Codex completed the Baidu Qianfan handoff for The Derma Co stale origin copy.
Woo/WordPress DB updates were applied only to published products with
`product_brand=the-derma-co`.

Result:
- 43 published The Derma Co products checked.
- 30 `post_content` rows updated for English stale Korea/Korean/K-beauty wording.
- 5 additional `post_content` rows updated for Bengali stale Korea/Korean wording.
- 0 stale The Derma Co visible-copy matches after verification.
- 0 stale The Derma Co SEO meta matches after verification.
- 43 The Derma Co products still have `pa_origin=India`.

Archived local trace files:
- `baidu-qianfan-the-derma-co-meta-instructions-20260510.md`
- `the-derma-co-meta-review-20260510.csv`
- `the-derma-co-meta-copy-dry-run-20260511-200213.csv`
- `the-derma-co-meta-copy-apply-20260511-200236.csv`
- `the-derma-co-meta-copy-dry-run-20260511-201403.csv`
- `the-derma-co-meta-copy-apply-20260511-201420.csv`
- `the-derma-co-meta-copy-dry-run-20260511-200159.csv` was a failed no-change dry-run kept for traceability.

Archived one-off script:
- `workspace/scripts/archive/fix-the-derma-co-meta-copy.php`
