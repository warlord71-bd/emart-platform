---
description: Headless SEO architecture and routing rules
globs:
  - "apps/web/src/app/**/page.tsx"
  - "apps/web/src/app/**/layout.tsx"
  - "apps/web/src/app/sitemap*"
  - "apps/web/src/app/robots*"
  - "apps/web/src/**/generateMetadata*"
  - "apps/web/src/middleware*"
  - "apps/web/next.config*"
---

Public SEO surface: Next.js frontend only (`apps/web`). Backend (WooCommerce + WordPress) is a private data source — never SEO-facing.

- Never canonical a frontend page to a backend URL
- All canonical / sitemap / OG / JSON-LD URLs must be absolute: `NEXT_PUBLIC_SITE_URL=https://e-mart.com.bd`
- Missing product -> `notFound()` | Out-of-stock -> `schema.org/OutOfStock` | In-stock -> `schema.org/InStock`
- `generateMetadata` for all dynamic product / category / brand pages
- Legacy `/product-category/*`, `/tag/*` -> 301 redirect to clean Next.js routes
- Strip/handle: `add-to-cart`, `orderby`, `per_page`, `shop_view`, `srsltid`
- Frontend HTML must not expose WordPress / backend technology headers
- Before any SEO / metadata / sitemap / schema / route change: read `workspace/SEO_MASTER.md`

SEO work execution order: 1. Read SEO_MASTER.md -> 2. Audit code paths -> 3. Technical integrity -> 4. SEO Core -> 5. Data Quality -> 6. Build/test -> 7. Deploy
