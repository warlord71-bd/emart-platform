# Files Changed Summary

Date: 2026-04-30

## Code

- `apps/web/src/lib/siteUrl.ts`
  - Added `SITE_URL` and `absoluteUrl()` based on `NEXT_PUBLIC_SITE_URL`, defaulting to `https://e-mart.com.bd`.
- `apps/web/src/middleware.ts`
  - Added `per_page` and `shop_view` to existing canonical query stripping.
- `apps/web/src/lib/canonicalUrl.ts`
  - Canonical helper now returns absolute frontend URLs.
- `apps/web/src/app/brands/[slug]/page.tsx`
  - Updated brand detail title format and absolute canonical/Open Graph URL.
- Metadata routes/pages:
  - Converted remaining audited relative canonicals/Open Graph URLs to absolute frontend URLs.
- Sitemap routes:
  - Use `SITE_URL`/`absoluteUrl()` and filter brand entries to non-empty counts.

## Reports

- `audit/seo/seo-route-audit.md`
- `audit/seo/dynamic-sitemap-report.md`
- `audit/seo/brand-data-flow-report.md`
- `audit/seo/frontend-brand-counts.csv`
- `audit/seo/empty-pages-report.csv`
- `audit/seo/wrong-nav-links-report.md`
- `audit/seo/product-size-mismatch.csv`
- `audit/seo/missing-product-images.csv`

## Safety

- No UI redesign.
- No checkout, cart, payment, order, customer, stock or price logic touched.
- No backend/database writes.

