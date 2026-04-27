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
