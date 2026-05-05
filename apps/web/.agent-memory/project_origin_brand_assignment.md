---
name: Brand-level origin assignment
description: Country of origin is now assigned by product_brand to pa_origin, not manually product-by-product
type: project
---

On 2026-05-05, the user supplied corrected workbook `brand-origin-dry-run_corected.xlsx` from GitHub. Codex downloaded it to `workspace/audit/seo/brand-origin-20260505/input/brand-origin-dry-run_corrected.xlsx`, normalized country names, created the Woo global product attribute `Origin` / taxonomy `pa_origin`, created missing origin terms, and assigned origin to products by their `product_brand` term.

Applied scope:
- 397 active brand rows read from the workbook.
- 395 brand rows assigned to a country/origin term.
- 2 internal/store-label brand rows skipped: `Emart Combo`, `Emart Exclusive`.
- 3,641 published products assigned `pa_origin`.
- 21 published internal/store-label products intentionally left without `pa_origin`.
- Brand display names updated from workbook for `Carene` -> `Carenel`, `Grincelllabs` -> `Grincell Labs`, and `H&C` display cleanup.

Origin display policy:
- `korea` and `South Korea` normalize to display `South Korea` with slug `south-korea`.
- Product origin is inherited from brand, not guessed from individual product names.
- Do not manually inspect all products for origin. Only review unclear brand-origin mappings.
- Do not assign `Internal` as a customer-facing country of origin.

Generated files:
- `workspace/scripts/brand-origin-dry-run.mjs`
- `workspace/scripts/apply-brand-origin.php`
- `workspace/audit/seo/brand-origin-20260505/corrected-brand-origin-normalized.csv`
- `workspace/audit/seo/brand-origin-20260505/brand-origin-dry-run.csv`
- `workspace/audit/seo/brand-origin-20260505/product-origin-dry-run.csv`

Verification:
- `pa_origin` has 22 origin terms.
- 3,641 published products have `pa_origin`.
- Main product cache tag plus `/shop` and `/origins` were revalidated through `/api/revalidate`.
- Remaining products without `pa_origin` are Emart internal combo/exclusive products.
