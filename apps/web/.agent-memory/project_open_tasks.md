---
name: Open and deferred tasks
description: Items explicitly deferred by user or not yet started — pick up next session
type: project
---

## Deferred by user

**Social card thumbnails (homepage)**
Homepage SocialChannelGrid shows mismatched placeholder images for TikTok, Facebook, Instagram cards. User said "do it later". Fix: replace `cosrx-sunscreen.jpg` (TikTok) and `hair-care.jpg` (Facebook) with on-brand images or real thumbnails.
**File:** `apps/web/src/components/home/SocialChannelGrid.tsx`

**`/brands/[slug]` individual brand pages**
Brand link on product page uses `/brands?brand=slug` (query param, canonical strips it to `/brands`). Task 2.2 from SEO brief asked for `/brands/[slug]` route. No route exists yet. Requires new `app/brands/[slug]/page.tsx` that fetches brand products and has proper canonical.

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
