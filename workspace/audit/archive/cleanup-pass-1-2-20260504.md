# Emart Cleanup Pass 1-2 Report

Date: 2026-05-04 CEST

## Scope

Balanced cleanup only. No live UI, WooCommerce data, checkout/cart/order/payment, PM2, `.env`, `node_modules`, or VPS `.next` changes.

## Preflight

- Local, VPS, and `origin/main` started clean at `7c26f3a5621ec7ab2a2bdfc6c5085da861919c61`.
- Local size before: about `1.7G`.
- VPS size before: about `3.2G`.

## Archived

Archive root: `/root/.attic-2026-05-04/emart-platform/cleanup-pass-1-2/`

- Local archived to `local/`: about `214M`.
- VPS archived to `vps/`: about `214M`.
- Large tracked historical FAQ generated CSVs moved from `workspace/audit/processed/`: about `180M` per tree.
- Ignored raw outputs moved: snapshots, UI audit screenshots, raw Woo product export CSV, product image audit raw CSVs, OCR folders/logs, preview HTML files, and `apps/web/emart-web-final.tar.gz`.
- After owner confirmation, completed brand correction outputs were also archived: `workspace/PROJECT_DATA/CURRENT_BRAND_CORRECTION_FILE.csv` and `workspace/audit/seo/brand-source-unification-20260503/`.

## Kept In Place

- `workspace/audit/seo/product-image-logic-20260503/`
- Concise SEO reports and product-image summary files.
- Runtime dependencies and build caches: `node_modules`, local `.next`, and VPS `.next`.

## Result

- Local size after archive: about `1.5G`.
- VPS size after archive: about `3.0G`.
- Workspace audit size after archive: local about `9.0M`, VPS about `8.5M`.
- Added `.gitignore` rule for `workspace/audit/processed/product-faq-normalization-*.csv`.
- Current manual data focus is product image issues, not brand correction.
