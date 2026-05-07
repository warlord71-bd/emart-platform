# Agent Clutter Cleanup Manifest

Date: 2026-05-07

Scope: Emart project only. Archive-first cleanup; no live UI, WooCommerce data, PM2, nginx, build, or frontend source changes.

Archived to `/root/.attic-2026-05-07/emart-platform/agent-clutter-cleanup/root-files/`:

- `brand-origin-dry-run_corected.xlsx`
- `cerave_add_to_emart.csv`
- `cerave_dry_run_report.csv`
- `cerave_manual_review.csv`
- `cerave_update_plan.xlsx`
- `workspace/cerave_woo_import.csv`
- `workspace/scripts/apply-cerave-18-products-seo.sh`

Rules added:

- Root-level raw CSV/XLSX outputs should not be created.
- Active reports belong in `workspace/audit/active/`.
- Completed reports belong in `workspace/audit/archive/` or the dated attic.
- Reusable scripts belong in `workspace/scripts/active/`.
- One-off historical scripts belong in `workspace/scripts/archive/`.
