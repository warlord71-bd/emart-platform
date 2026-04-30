# SEO Sitemap Indexability - 2026-04-30

- Robots now advertises only `https://e-mart.com.bd/sitemap.xml`.
- WordPress/Rank Math sitemap URLs are disallowed in robots and redirected at Nginx:
  `/sitemap_index.xml`, `/product-sitemap1.xml`, and other `*-sitemap*.xml` URLs return 301 to `/sitemap.xml`.
- The active Nginx config is `/etc/nginx/sites-enabled/emart-nextjs`; backup from this change is `/root/.attic-2026-04-30/emart-nextjs.bak-20260430-seo-sitemap`.
- Next sitemap static pages include `/brands`, `/origins`, `/concerns`, `/blog`, `/social`, `/about-us`, and `/authenticity`.
- Product and blog page metadata continue to hardcode Next canonical paths rather than consuming Rank Math canonical URLs.
