# Dynamic Sitemap Report

Date: 2026-04-30

## Current Implementation

- `apps/web/src/app/sitemap.ts` is a dynamic Next.js sitemap route with `dynamic = 'force-dynamic'` and `revalidate = 3600`.
- It fetches published product slugs from the active WordPress/Woo source.
- It fetches category and brand data from active storefront APIs/helpers.
- It emits absolute frontend URLs using `NEXT_PUBLIC_SITE_URL` through `SITE_URL` / `absoluteUrl()`.

## Freshness And Safety

- Product URLs are generated from current published product data, not a manually maintained static slug list.
- Categories are requested with `hide_empty: true`.
- Brand sitemap entries are filtered to `count > 0`, preventing empty fallback brand pages from entering the sitemap.
- If REST product sources return zero products, the sitemap generator throws and falls back to the static safe list rather than publishing an empty product sitemap.

## Live Snapshot Before This Deploy

- Live sitemap URL count observed: 3931.
- Live sitemap used absolute `<loc>` URLs.
- Live sitemap already included `https://e-mart.com.bd/brands/cosrx`.

## 2026-05-02 Live Cross-check

- Running `/sitemap.xml` returned HTTP 200.
- Current XML size: 775,991 bytes.
- Current URL count: 3,929.
- Product URLs under clean frontend `/shop/`: 3,665.
- Category URLs under clean frontend `/category/`: 60.
- Brand URLs under clean frontend `/brands/`: 162.
- Backend pattern scan found no `wp-json`, `graphql`, `wp-admin`, `wp-login`, `sitemap_index`, `product-category`, or legacy `/product/` URLs in sitemap XML.
- `robots.txt` advertises `Sitemap: https://e-mart.com.bd/sitemap.xml`.
- Google sitemap ping was not used because Google has deprecated the unauthenticated sitemap ping endpoint; the current safe paths are `robots.txt` discovery and Search Console submission.

## Notes

The current patch keeps sitemap generation request-time/ISR based. It does not introduce static manual product, brand or category slug lists.
