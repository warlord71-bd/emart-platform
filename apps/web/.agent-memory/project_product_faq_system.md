---
name: Product FAQ system
description: Canonical product FAQ content is stored in _emart_product_faq and rendered as exactly 5 product-focused questions
type: project
originSessionId: codex-2026-04-26-product-faq-normalization
---
Product FAQs now use a normalized backend/frontend contract.

As of 2026-04-26:
- All 3,564 published WooCommerce products have `_emart_product_faq`.
- Each canonical FAQ contains exactly 5 visible product-focused Q/A pairs: 3 English and 2 Bangla.
- Product FAQ no longer includes delivery/COD/site-policy questions; those belong on `/faq`, checkout, policy pages, footer/support areas.
- Legacy `<div class="emart-faq">`, `FAQPage`, `Frequently Asked Questions`, and `সাধারণ জিজ্ঞাসা` blocks were removed from product descriptions.
- Frontend product FAQ rendering in `apps/web/src/app/[slug]/page.tsx` now uses canonical `_emart_product_faq` first and only falls back to deterministic product-specific generated FAQ if meta is missing.
- The visible helper/development line under `Frequently Asked Questions` was removed.

Reports/backups:
- `audit/processed/product-faq-normalization-dry-run-20260426-192353.csv`
- `audit/processed/product-faq-normalization-apply-20260426-192455.csv`
- `audit/processed/product-faq-residual-cleanup-dry-run-20260426-192708.csv`
- `audit/processed/product-faq-residual-cleanup-apply-20260426-192726.csv`
- `audit/processed/product-faq-residual-dabo-74335-20260426-192855.csv`

Do not regenerate product FAQ with generic delivery/COD questions. If future FAQ work is needed, preserve the 5-question product-focused contract and keep FAQ visible content aligned with any structured data that may be added later.

2026-05-21 update:
- Top 200 products by `total_sales` were regenerated/applied through `_emart_product_faq` with stricter item-specific logic.
- New logic avoids delivery/COD/order-policy FAQ and adds product-type/ingredient questions such as sunscreen filter type, snail mucin sensitivity/halal caution, retinol beginner safety, hair-vs-face use, lip-care use, masks, cleansers, vitamin C/brightening, barrier care, and hydration.
- Rollback saved at `workspace/audit/active/product-faq-seo-rollback-top200-20260521.json`.
- Review output saved at `workspace/audit/active/product-faq-seo-review-top200-20260521.md` and `.csv`.
- Live products cache was revalidated with `tag:products`; spot checks confirmed updated visible FAQ plus FAQPage and Product JSON-LD on COSRX Snail 92, Beauty of Joseon Relief Sun, and Mise-en-Scene hair serum PDPs.
