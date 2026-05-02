# Catalog Cache Headers

- Date: 2026-05-02
- Runtime-only Nginx change: `/etc/nginx/sites-enabled/emart-nextjs`
- Backup: `/etc/nginx/sites-available/emart-nextjs.backup-20260502-catalog-cache`

Added explicit proxy locations for:
- `/shop`
- `/category/{slug}`

These hide Next.js dynamic `Cache-Control: private, no-cache, no-store` and emit:
- `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`
- `CDN-Cache-Control: public, s-maxage=300`
- `Cloudflare-CDN-Cache-Control: public, s-maxage=300`

Reason: `/shop` and `/category/[slug]` use `searchParams`, so Next.js serves them dynamically and ignores the page `revalidate` for response caching. The Nginx override makes the public catalog HTML cache-eligible without changing UI/UX.

Verified after deploy:
- `/shop` origin TTFB ~0.05s and returns public `s-maxage`
- `/category/sunscreen` origin TTFB ~0.07s and returns public `s-maxage`
- Cloudflare still returns `cf-cache-status: DYNAMIC`; this needs a Cloudflare Cache Rule/Page Rule for HTML caching, not another origin header change.
