# Emart SEO TODO

E-mart.com.bd is headless.

- Public SEO surface: Next.js frontend only.
- Backend/source: WooCommerce + WordPress private data source.
- Do not expose backend URLs as SEO pages.
- Do not canonical public pages to backend URLs.
- Do not use WordPress theme SEO or Rank Math as the primary public SEO system.

Official brand names:

- Short: Emart
- Full: Emart Skincare Bangladesh
- Tagline: Global Beauty. Local Trust.

---

## Job 1: Next.js SEO Core

1. Use official brand names only.
2. Use Next.js Metadata API, including `generateMetadata` for dynamic product, brand and category pages.
3. Do not use client-side title changes or manual SEO tags that render late.
4. Homepage title: `Emart Skincare Bangladesh | Authentic Korean & Global Beauty`.
5. Product title format: `{ProductName} Price in Bangladesh | Emart`.
6. Category title format: `{CategoryName} in Bangladesh | Emart Skincare Bangladesh`.
7. Brand title format: `{BrandName} Bangladesh | Authentic {BrandName} Products | Emart`.
8. Add JSON-LD from Next.js frontend routes:
   - Product schema on product pages
   - BreadcrumbList schema on product/category/brand pages
   - Organization schema on homepage
   - WebSite schema on homepage
9. Canonicals must point only to clean frontend URLs.
10. Sitemap must include only clean frontend SEO routes.
11. Sitemap must be dynamic, not a stale static list.

---

## Job 2: Data Quality + Navigation

1. Fix wrong navigation links:
   - Toners must link to the correct toner category.
   - Sensitivity must link to the correct sensitivity category.
   - Every menu item must match a real frontend category slug.
2. Audit brand data flow:
   `Woo/WP brand source -> API response -> Next.js normalizer -> product page -> /brands count -> /brands/[slug]`.
3. Do not hide/noindex brands before confirming whether they are truly empty.
4. Product brand links must use frontend route `/brands/{slug}`.
5. Generate report for product size mismatches. Do not auto-update product data.
6. Remove generic “App coming soon” block from product pages.
7. Replace with trust badges:
   - 100% Authentic
   - COD Available
   - Local Support
   - Nationwide Delivery
8. Active products should not show “No image available” unless truly missing.
9. Image alt text format: `{ProductName} - Emart Skincare Bangladesh`.

---

## Job 3: Technical Integrity

1. Server-side metadata:
   - Use `generateMetadata` for product, category and brand pages.
   - Googlebot should not see placeholder metadata such as `Loading...`.

2. Absolute URL enforcement:
   - Define `NEXT_PUBLIC_SITE_URL=https://e-mart.com.bd`.
   - Canonicals, sitemap entries, Open Graph URLs, JSON-LD URLs and breadcrumb URLs must be absolute.

3. Status code logic:
   - Product not found from API -> `notFound()`.
   - Confirmed empty brand/category -> `notFound()` or `noindex, follow`.
   - API error -> do not generate thin indexable pages.
   - Out-of-stock product stays indexable, but Product JSON-LD availability must be `OutOfStock`.
   - In-stock product JSON-LD availability must be `InStock`.

4. Legacy route redirect layer:
   - Handle `/product-category/*`.
   - Handle `/tag/*`.
   - Handle duplicate query parameter URLs such as add-to-cart, orderby, per_page, shop_view and srsltid.
   - Useful legacy URLs should 301 redirect to matching clean frontend routes.
   - Thin archive/tag URLs should noindex or redirect to a relevant frontend route.

5. Header hygiene, not aggressive stripping:
   - If Next.js proxies Woo/WordPress responses, do not forward backend discovery or backend technology headers to public frontend HTML pages.
   - Check public frontend HTML responses for backend-specific headers such as `X-Powered-By: PHP`, `X-Powered-By: WordPress`, and `Link: <.../wp-json/...>; rel="https://api.w.org/"`.
   - Public SEO pages should not expose WordPress discovery headers or backend technology headers.
   - Do not blindly strip headers from all API calls.
   - Do not break required internal Woo/WordPress API calls, caching, authentication, webhooks, checkout, cart, payment, or order flows.
   - If these headers only exist on private backend/API responses and are not present on public frontend HTML pages, document as no action needed.
   - Prefer fixing leaks in the Next.js server, middleware, proxy, or hosting header layer, not by making WordPress public as an SEO surface.

6. Cache/revalidation:
   - Brand/category counts should not stay stale after product updates.
   - Product metadata should update after product name, price or image changes.
   - Sitemap should not include stale empty pages.

7. Dynamic sitemap freshness:
   - Implement sitemap in `app/sitemap.ts` or the current Next.js sitemap generator.
   - Fetch current product, brand and category slugs from the active Woo/API source.
   - Do not use a manually maintained static slug list.
   - Do not include deleted, draft, private, missing, or unpublished Woo products.
   - Do not include empty brands or empty categories.
   - If a product is deleted/unpublished in WordPress, its frontend URL must disappear from sitemap on the next build or revalidation cycle.
   - If an old slug remains in Next.js cache, the product page must call `notFound()` when the API no longer returns that product.
   - Sitemap must use absolute URLs with `NEXT_PUBLIC_SITE_URL`.
   - Document whether sitemap is generated at build time, request time, or via ISR/revalidation.
   - Add a safe fallback so API failure does not publish a broken sitemap with empty or stale results.

---

## Required Reports

Produce these after implementation:

- seo-route-audit.md
- brand-data-flow-report.md
- frontend-brand-counts.csv
- empty-pages-report.csv
- wrong-nav-links-report.md
- product-size-mismatch.csv
- missing-product-images.csv
- dynamic-sitemap-report.md
- files-changed-summary.md

---

## Safety Rules

- Do not touch checkout, cart, payment, order, customer, stock or price logic.
- Do not expose backend URLs as public SEO pages.
- Do not canonical frontend pages to backend URLs.
- Do not use WordPress theme SEO as the public SEO source.
- Do not hide brands/categories until data mapping is verified.
- Do not make destructive backend/database changes without report and approval.

## UI/UX Safety Rules

- SEO implementation must not cause a broad UI redesign.
- Preserve the current visual design unless the user explicitly requests a redesign.
- Do not change homepage layout, category discovery layout, product page layout, header, footer, mobile menu, search, filters, cart drawer, checkout, or account UX unless the SEO task strictly requires it.
- Do not move or visually downgrade price, stock, Add to Cart, Buy Now, cart, checkout, search, or filter controls without approval.
- Product trust badges must not push Add to Cart or Buy Now too far down on mobile.
- Product image fallback changes must preserve fixed image dimensions to avoid layout shift.
- Any required UI change must be minimal, documented in `files-changed-summary.md`, and tested at 360px, 390px and 430px mobile widths.
- If a change can affect conversion or mobile UX, report the risk before making broad visual changes.
