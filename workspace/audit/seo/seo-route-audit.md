# SEO Route Audit

Date: 2026-04-30

Scope: current confirmed gaps from `SEO_TODO.md`.

## Checked

- Legacy query cleanup layer: `apps/web/src/middleware.ts`
- Canonical helper: `apps/web/src/lib/canonicalUrl.ts`
- Site URL helper: `apps/web/src/lib/siteUrl.ts`
- Dynamic brand route metadata: `apps/web/src/app/brands/[slug]/page.tsx`
- Static/dynamic metadata pages with relative canonicals found by code search
- Public frontend headers on `https://e-mart.com.bd/`

## Results

- `per_page` and `shop_view` are now stripped by middleware alongside existing noisy parameters.
- Remaining metadata canonicals found in the audited frontend routes were converted to absolute frontend URLs.
- `/brands/[slug]` metadata title now uses `{BrandName} Bangladesh | Authentic {BrandName} Products | Emart`.
- No checkout, cart, payment, order, customer, stock or price logic was changed.

## Header Hygiene

Public homepage HTML response did not expose `X-Powered-By: PHP`, `X-Powered-By: WordPress`, or `Link: <.../wp-json/...>; rel="https://api.w.org/"`.

Observed public headers include Cloudflare/Next-safe security headers such as `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`.

