---
name: Product content tab extraction
description: Storefront product tabs split legacy Ingredients content into Ingredients and How to use sections
type: project
originSessionId: codex-2026-04-26-product-tabs
---
Some imported WooCommerce products store multiple content sections inside the old Woodmart `Ingredients` custom tab. Example headings include `Key Ingredients`, Bangla `ব্যবহারের নিয়ম`, `Suitable For`, and `সংরক্ষণ`, while explicit `_emart_how_to_use` / Facebook instruction fields are empty.

The storefront handles this at render time in `apps/web/src/app/[slug]/page.tsx`:
- Ingredients are cleaned to remove usage/suitable/storage sections.
- How to use falls back to the usage section inside the legacy Ingredients tab when no explicit usage field exists.
- `apps/web/src/lib/woocommerce.ts` must expose `_emart_ingredients`, `_emart_how_to_use`, and `_emart_product_faq` in `PUBLIC_PRODUCT_META_KEYS`; otherwise the frontend silently ignores the native WordPress Emart Content fields and falls back to legacy metadata.

On 2026-04-26, Codex normalized the backend data without changing UI/UX:
- 352 products had mixed `_emart_ingredients` split into clean `_emart_ingredients` and `_emart_how_to_use`.
- 1 additional product (`wishcare-underarm-roll-on-serum-50ml`) was backfilled from legacy Woodmart Ingredients into clean Emart fields.
- Final published-product counts: 354 with `_emart_ingredients`, 353 with `_emart_how_to_use`, 354 legacy Ingredients tabs retained as backup.
- Final checks: 0 legacy Ingredients tabs without canonical `_emart_ingredients`; 0 mixed Emart Ingredients rows with empty How-to-use.
- Reports/backups: `audit/processed/product-content-normalization-dry-run-20260426-185127.csv`, `audit/processed/product-content-normalization-apply-20260426-185220.csv`, `audit/processed/product-content-normalization-dry-run-20260426-185427.csv`, `audit/processed/product-content-normalization-apply-20260426-185507.csv`.

The fix is now catalog-wide parser logic plus normalized backend data plus native meta exposure, not one-off product meta edits.

Do not overwrite product meta in bulk just to move these sections unless the user explicitly asks for a data cleanup migration. Parser behavior is safer because it preserves original Woo content while rendering tabs correctly.
