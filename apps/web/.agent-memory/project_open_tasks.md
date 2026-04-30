---
name: Open and deferred tasks
description: Items explicitly deferred by user or not yet started — pick up next session
type: project
---

## Deferred by user

**Cloudflare cache rules**
Infrastructure-level — must be done in Cloudflare dashboard, not code. Rules needed:
- `/_next/static/*` → Cache Everything, 1 month TTL
- `/images/*` → Cache Everything, 7 days
- `/wp-json/*` → Bypass cache
- `*.webp` / `*.avif` → Cache Everything, 30 days

## Known stale state (not a bug)

**VPS git** `/var/www/emart-platform` is at old commit `95e24f1`. Runtime files are correct (rsync keeps them current). Git history on VPS is never updated — this is by design per the three-way workflow.

## What: Completed 2026-04-30

- 18-issue SEO audit (emart-phase1-foundation-seo.md) — all resolved
- Social wall /social page (YouTube RSS, TikTok, Facebook, Instagram click-to-play)
- Rank Math REST API integration (product + blog pages)
- Error boundaries (error.tsx, global-error.tsx, product page hardening)
- Security headers, PWA manifest, Bengali font (Hind Siliguri), lang="en-BD"
- Sitemap + robots cleanup — WordPress Rank Math sitemaps blocked at Nginx
- GMC + Facebook Catalog ghost URL fix (mu-plugin emart-nextjs-product-urls.php)
- Middleware stripping srsltid, orderby, add-to-cart (301)
- Brand filter fix (removed count>0), 60s ISR on brands page
- priceValidUntil in JSON-LD, Skin Type/Concern in head metadata
- WordPress backend robots.txt (Disallow: /)
- Codex SEO audit verified: canonical URLs, category/brand pages, sitemap clean
- Homepage social card thumbnails replaced for TikTok/Facebook/Instagram with platform-branded cards
- `/brands/[slug]` route added with product grid, canonical metadata, brand links, and sitemap entries
