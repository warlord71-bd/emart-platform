# Homepage Console/Perf Cleanup 2026-06-07

- Removed global homepage hero image preload links from `apps/web/src/app/layout.tsx`.
- Removed the per-category live viewer badge from homepage `CategoryCard`; category links remain intact.
- Removed stale visible homepage SEO intro block from runtime/source `page.tsx`; SEO still has hidden H1 and homepage ItemList JSON-LD.
- Important: the old hero preload hints also existed in active Nginx config at `/etc/nginx/sites-enabled/emart-nextjs`; removed only those three `add_header Link` lines and reloaded Nginx after `nginx -t`.
- Live Chromium/CDP verification after deploy: no image preload links, no category polling requests, no preload warnings, checkout page OK, old visible SEO block absent.
