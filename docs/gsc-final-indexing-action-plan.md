# GSC Final Indexing Action Plan — E-Mart

Date: 2026-05-06
Site: https://e-mart.com.bd

---

## GSC Coverage Issue Reference

### 1. Alternate page with proper canonical

**What it means:** Google found the page but chose the canonical URL as the primary.
**Action:** Monitor only. If the canonical target is correct (`/shop/slug`) and returns 200 with matching canonical tag, this resolves on its own as Google re-crawls. No action unless the canonical target itself is wrong or missing.

---

### 2. Page with redirect

**What it means:** Google followed a redirect chain to reach the canonical.
**Action:** Monitor only if the redirect destination is a correct canonical `/shop/slug` returning 200. If the redirect destination is wrong or chains multiple hops, fix the middleware/Nginx rule to redirect directly to the canonical in one hop.

---

### 3. Blocked by robots.txt

**What it means:** robots.txt disallowed the URL.
**Status:** Fixed. robots.ts was updated to remove blocks on `/?p=`, `/product/`, and `/product-category/`. These are now allowed so Google can follow redirects to canonical URLs.
**Action:** None. GSC will re-crawl and move these out of this bucket as the crawl queue processes.

---

### 4. Not found (404)

**What it means:** Google tried to crawl a URL that returned 404.
**Action:**
1. Export the URL list from GSC (Coverage > Not Found > Export).
2. For each URL:
   - If it maps to a real product/category that now lives at a `/shop/` or `/category/` path → add a 301 redirect in `middleware.ts`.
   - If it is junk (test pages, spam, non-existent slugs) → return 410 Gone (add explicit 410 rule or let Next.js `notFound()` handle it, which returns 404; Nginx can be configured to serve 410 for known junk patterns).
3. After adding redirects, request validation in GSC.

---

### 5. Server error (5xx)

**What it means:** The page returned a 5xx during Googlebot's last crawl.
**Action:**
1. Export the URL list from GSC immediately.
2. `curl -I <url>` each URL manually to reproduce.
3. Check PM2 logs: `pm2 logs emartweb --lines 200`.
4. Fix the underlying error (missing product data, API timeout, unhandled promise rejection).
5. After fix, request validation in GSC.

---

### 6. Duplicate without user-selected canonical

**What it means:** Multiple URLs return similar content and none has a self-referencing canonical tag.
**Action:**
1. Sample 5–10 URLs from this bucket in GSC.
2. `curl -L <url> | grep 'canonical'` to check whether the page is missing a canonical tag.
3. If canonical tag is absent, verify `generateMetadata` in the relevant route (`/shop/[slug]`, `/category/[slug]`, `/brands/[slug]`) emits `alternates.canonical`.
4. If the page is a duplicate parameter variant (e.g. `?orderby=`, `?per_page=`), ensure the canonical points to the clean slug URL.
5. Deploy fix and re-inspect in GSC URL Inspection.

---

### 7. Google chose different canonical

**What it means:** The page declares a canonical but Google selected a different URL as canonical.
**Action:**
1. Open GSC URL Inspection on a sample URL.
2. Compare "User-declared canonical" vs "Google-selected canonical".
3. Common causes:
   - Declared canonical returns non-200 → fix the target route.
   - Declared canonical differs in protocol/www/trailing-slash → standardise to `https://e-mart.com.bd/shop/slug` (no trailing slash, no www).
   - Hreflang or internal links point at a different URL more frequently → audit internal links in `DetailsTabs` and navigation.
4. After fixing, request re-indexing in GSC URL Inspection.

---

### 8. Redirect error

**What it means:** A redirect chain is broken (loops, too many hops, empty Location header).
**Action:**
1. Identify the exact URL from GSC.
2. `curl -IL <url>` to trace the full chain.
3. Fix the specific rule in `middleware.ts` or Nginx `nginx.conf`.
4. Redeploy and retest with `curl -IL`.

---

### 9. 403 Forbidden

**What it means:** Google received a 403 when crawling the URL.
**Action:**
1. Identify the exact URL from GSC.
2. `curl -A "Googlebot" -I <url>` to reproduce.
3. Check whether the URL is behind authentication middleware or a Nginx auth block that incorrectly triggers for Googlebot.
4. If the URL should be public, remove the auth gate or add a Googlebot exemption.
5. If the URL is legitimately private, add it to `robots.txt` Disallow to prevent Googlebot from attempting it.

---

## Manual GSC Actions Checklist

- [ ] **Remove stale/junk URLs** — use GSC URL Removal only for confirmed junk or test URLs. Do NOT remove valid canonical product/category URLs.
- [ ] **Sitemap** — keep only `https://e-mart.com.bd/sitemap.xml` submitted. Remove any old static sitemap URLs if present.
- [ ] **Request indexing** — after deploying canonical/redirect fixes, use URL Inspection > Request Indexing for the top 20–30 highest-traffic product and category pages.
- [ ] **Verify robots.txt** — use GSC Settings > Robots.txt Tester to confirm `/?p=`, `/product/`, `/product-category/` are now allowed.
- [ ] **Monitor Coverage** — check weekly until Not Found and Redirect buckets shrink. Server Error bucket must reach zero before any new deploy.

---

### 10. Woo action / query URL pollution (handled)

**What it means:** URLs like `/?add_to_wishlist=1756&add-to-cart=62326`, `/?action=yith-woocompare-add-product&id=3702`, `/?ref=aftership&add-to-cart=62921`, `/product/slug/?add-to-cart=74683` appear in GSC as 404s or redirects.
**Status:** Fixed in `middleware.ts`. The following params are now stripped and 301-redirected to the clean path:
- Always stripped: `add-to-cart`, `add_to_cart`, `add_to_wishlist`, `srsltid`, `orderby`, `order`, `per_page`, `paged`, `shop_view`
- Stripped when value matches: `action=yith-woocompare-add-product` (also strips co-present `id`), `ref=aftership`
- `/product/slug/?add-to-cart=xxx` → strips to `/product/slug/` → next.config 301 → `/shop/slug/` → final canonical
- `/product-category/path/?add-to-cart=xxx` → strips to `/product-category/path/` → next.config 301 → `/category/path/`

**GSC action:** After Google recrawls these URLs, they should move from "Not found 404" to "Page with redirect" and eventually drop from coverage as Google consolidates on the canonical.

---

### 11. Old sitemap discovery sources (handled)

**What it means:** GSC may have old WordPress/Rank Math sitemap URLs submitted or discovered: `/page-sitemap.xml`, `/post-sitemap.xml`, `/product-sitemap.xml`, `/product_cat-sitemap.xml`, `/wp-sitemap.xml`, `/sitemap_index.xml`.
**Status:** Nginx already 301-redirects all `*-sitemap*.xml` and `sitemap*` paths to `/sitemap.xml`. The `/wp-sitemap.xml` and `/sitemap_index.xml` are also in `robots.txt` Disallow.
**GSC action:**
1. Open GSC → Sitemaps.
2. Remove any submitted sitemap URLs other than `https://e-mart.com.bd/sitemap.xml`.
3. The only submitted sitemap should be: `https://e-mart.com.bd/sitemap.xml`.
4. Do not resubmit old URLs.

---

## Reference Routes

| Route | File |
|---|---|
| robots | `apps/web/src/app/robots.ts` |
| sitemap | `apps/web/src/app/sitemap.ts` |
| redirects / rewrites | `apps/web/middleware.ts` |
| product page metadata | `apps/web/src/app/shop/[slug]/page.tsx` |
| category page metadata | `apps/web/src/app/category/[slug]/page.tsx` |
| brand page metadata | `apps/web/src/app/brands/[slug]/page.tsx` |
