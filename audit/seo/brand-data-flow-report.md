# Brand Data Flow Report

Date: 2026-04-30

## Flow

`Woo/WP pa_brand terms -> getBrands()/getBrandBySlug() -> Next.js brand pages -> product brand chip -> /brands/[slug]`

## Findings

- `getBrands()` reads WooCommerce product attribute terms from `products/attributes/1/terms`.
- Brand terms are normalized against `CANONICAL_BRANDS` before display.
- `/brands` displays canonical brand names and counts.
- `/brands/[slug]` uses `getBrandBySlug()` and product lookup by `attribute=pa_brand` and `attribute_term={brand.id}`.
- Product brand chips already point to frontend route `/brands/{slug}`.

## Current Patch

- Brand detail page title format was corrected to:
  `{BrandName} Bangladesh | Authentic {BrandName} Products | Emart`
- Brand detail canonical and Open Graph URLs are absolute frontend URLs.
- No brand data, taxonomy terms, counts, products, stock, or prices were modified.

## Related Report

See `frontend-brand-counts.csv` for live frontend brand counts captured from `/api/brands`.

