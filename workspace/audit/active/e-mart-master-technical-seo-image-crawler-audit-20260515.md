# E-Mart Technical SEO / Image / Crawler Audit

Audit date: 2026-05-15
Branch: `claude/fix-product-origin-display-WIGNs`
Scope: Audit-only review of `apps/web` Next.js storefront, existing SEO TODO/report files, and safe live crawler checks for `https://e-mart.com.bd`.

Cross-checked local/historical files:
- Archived source bundle: `workspace/audit/archive/seo-source-audits-referenced-by-master-20260515/`
- Archived source bundle: `workspace/audit/archive/seo-week2-gsc-cwv-product-source-audits-referenced-by-master-20260515/`
- `workspace/audit/archive/seo-source-audits-referenced-by-master-20260515/SEO_TODO.md`
- `workspace/audit/archive/seo-source-audits-referenced-by-master-20260515/seo/seo-route-audit.md`
- `workspace/audit/archive/seo-source-audits-referenced-by-master-20260515/seo/dynamic-sitemap-report.md`
- `workspace/audit/archive/seo-source-audits-referenced-by-master-20260515/seo/brand-data-flow-report.md`
- `workspace/audit/archive/seo-source-audits-referenced-by-master-20260515/seo/wrong-nav-links-report.md`
- `workspace/audit/archive/seo-source-audits-referenced-by-master-20260515/seo/files-changed-summary.md`
- `workspace/audit/archive/seo-source-audits-referenced-by-master-20260515/seo/product-image-audit-summary-20260430-011630.txt`
- `workspace/audit/archive/seo-source-audits-referenced-by-master-20260515/seo/product-image-fix-dry-run-summary-20260430-011953.txt`
- `workspace/audit/archive/seo-source-audits-referenced-by-master-20260515/seo/product-image-duplicate-thumb-audit-summary-20260430-011953.txt`
- `workspace/audit/archive/seo-source-audits-referenced-by-master-20260515/seo/missing-product-images.csv`
- `workspace/docs/category-taxonomy-status.md`
- User-provided Lighthouse report for `https://e-mart.com.bd/` fetched `2026-05-15T17:27:10.163Z`
- Active product-image/price review context in `apps/web/SESSION-LOG.md`

Checks run:
- `git status --short --branch`
- Project/app/router/code inspection with targeted `rg`, `sed`, `ls`
- `cd apps/web && npm run lint`
- `cd apps/web && npm run build`
- Safe live `curl` checks for public/private routes, sitemap, robots, and representative crawler user agents
- Safe live `curl` re-checks for query cleanup, high-confidence stale redirects, near-empty categories, and sitemap duplicate counts

## Executive Summary
- Overall status: Mostly healthy for crawlability, indexability, canonical hygiene, sitemap cleanliness, private-route noindex/no-store, and core Product/Offer/Breadcrumb schema. I found no current critical blocker that would explain complete Google non-indexing.
- Biggest remaining blockers: Homepage Lighthouse/CWV performance, catalog/PDP image priority competition, an unsafe-looking raw-IP image remote pattern, a few indexable near-empty category URLs in sitemap, product content partly hidden behind client-only tabs in initial semantic HTML, and a sitemap fallback path that can reintroduce redirected category slugs if GraphQL fails.
- What is already good: Public commercial pages are indexable, private pages are noindex/no-store, live sitemap contains clean frontend URLs only with no duplicate `<loc>` values in the fresh test, robots allows Google/Bing and intended AI crawlers, Product schema uses real data and avoids fake ratings, live bot user agents were not blocked, and old `filter_brand`/`per_row` query duplicates now redirect cleanly.
- What may explain why Google has not reflected changes yet: Normal recrawl/index delay is likely for already-fixed items. Remaining code issues are quality/performance/merchant-readiness risks, not hard crawl blocks. Search Console, sitemap recrawl timing, Merchant Center processing, and old cached snippets can lag behind deploys by days to weeks.

## Critical Issues

None found.

PASSED evidence:
- Live representative public routes returned `200` for normal browser, Googlebot, Bingbot, ChatGPT-User, PerplexityBot, and ClaudeBot checks.
- Live private utility routes returned `200` pages with `noindex, nofollow` and no-store-style headers.
- Live sitemap had 4,169 clean frontend URLs, 4,169 unique `<loc>` values, and no matches for backend/admin/API/staging/localhost/product-legacy patterns tested.
- Live robots did not block `/_next/image`, product pages, category pages, or important public assets.
- Live `/shop?filter_brand=cosrx` and `/shop?per_row=4` now redirect to `/shop`.
- Live stale aliases checked from old GSC reports now redirect to clean targets: `/brands/april-skin` to `/brands/aprilskin`, `/brands/a-pieu` to `/brands/apieu`, `/shop/kaine_kombu-hydrating-daily-cleanser-155g` to `/shop/kaine-kombu-hydrating-daily-cleanser-155g`, and the COSRX mini slug to the live 30ml PDP.
- Current `ProductInfo.tsx` no longer shows fake `SKU-{id}` or default `6 Pcs Available`; it hides missing SKU and falls back to `In Stock` only when quantity is unknown.
- Local lint and production build completed successfully.

## High Priority Issues

### Issue 1: Homepage Lighthouse/CWV performance is weak
- Severity: High
- Area: Site loading / Core Web Vitals / Google acceptability
- File(s):
  - `apps/web/src/components/home/HomepageSections.tsx:543`
  - `apps/web/src/components/home/HomepageSections.tsx:759`
  - `apps/web/src/app/layout.tsx:259`
  - `apps/web/src/app/layout.tsx:285`
  - `apps/web/src/components/analytics/MetaPixel.tsx:29-55`
- Evidence:
  - User-provided Lighthouse report for `/` scored Performance `42`.
  - Trace notes showed a `471 ms` long task, including `383 ms` layout work over `1,328` nodes, `2,385` DOM elements total, and `1,495 ms` LCP element render delay.
  - Third-party Facebook/GTM work consumed about `363 ms` of main-thread time during the critical load window.
  - Field LCP TTFB was reported around `1,455 ms` while lab TTFB was `33 ms`, pointing to real-user cache/origin/geography variance.
  - Lighthouse also found focusable product/blog controls inside `aria-hidden="true"` homepage mobile rails.
- Why it matters:
  - LCP and INP can affect rankings indirectly through page experience and directly affect conversion.
  - Focusable elements inside `aria-hidden` duplicate rails increase DOM, accessibility failures, and interaction complexity.
- Safe fix recommendation:
  - Reduce initial homepage DOM and duplicated mobile/desktop rail markup without redesigning the UI.
  - Remove `aria-hidden` from containers with links/buttons, or make the hidden duplicate truly inert and unfocusable.
  - Delay non-critical Facebook/GTM execution until after first content is stable, while preserving required conversion tracking.
  - Verify Cloudflare/Next HTML cache behavior for real Bangladeshi users and keep homepage public cacheable.
- Risk level: Medium because analytics and homepage sections need careful smoke testing.

### Issue 2: Too many high-priority/preloaded catalog/PDP images compete for LCP
- Severity: High
- Area: Image optimization / Core Web Vitals
- File(s):
  - `apps/web/src/components/product/ProductCard.tsx:117`
  - `apps/web/src/app/shop/page.tsx:245`
  - `apps/web/src/app/category/[slug]/page.tsx:236`
  - `apps/web/src/components/product/ProductImage.tsx:37`
  - `apps/web/src/components/layout/Header.tsx:676`
- Evidence:
  - Catalog pages pass `priority={i < 4}` into product cards.
  - Product gallery prioritizes the selected first image.
  - Header logo image is also prioritized globally.
  - Live HTML for `/shop`, representative category, and representative PDP contained multiple `fetchPriority="high"` image markers.
  - Homepage product-card priority has already been reduced in current code (`HomepageSections.tsx` now passes `priority={false}`), so the remaining image-priority issue is mainly shop/category/PDP/header.
- Why it matters:
  - Multiple high-priority images can compete with the actual mobile LCP image, increase preload pressure, and hurt Core Web Vitals even when image tags use `next/image`.
  - Header logo priority on every route can compete with product/category LCP media.
- Safe fix recommendation:
  - Keep `priority` only for the single route-specific LCP candidate.
  - Remove global header logo `priority` unless field data proves it is the LCP.
  - On catalog/category/brand grids, prefer lazy product thumbnails or at most one carefully selected above-the-fold priority image after viewport testing.
- Risk level: Low implementation risk, medium performance impact if left as-is.

### Issue 3: Raw IP remains in Next image remote allowlist
- Severity: High
- Area: Image optimization / security hygiene / backend exposure risk
- File(s):
  - `apps/web/next.config.js:340-345`
- Evidence:
  - `remotePatterns` includes `http://5.189.188.229`.
  - Current live sitemap and tested rendered pages use frontend URLs, but the image optimizer allowlist still permits this raw-IP source.
- Why it matters:
  - The site should avoid exposing backend/staging/IP origins publicly.
  - A raw-IP remote pattern broadens the image optimizer surface and can preserve old backend-origin image references.
- Safe fix recommendation:
  - Before removal, run a data-only audit of current Woo/product/category/blog image URLs to confirm no active production images depend on the raw IP.
  - If none depend on it, remove the raw-IP remote pattern and verify representative product/category/blog images.
- Risk level: Medium because old media records may still reference the IP.

## Medium Priority Issues

### Issue 4: Product ingredients/how-to-use are not normal visible initial HTML
- Severity: Medium
- Area: LLM-readable HTML / product content / crawler clarity
- File(s):
  - `apps/web/src/app/shop/[slug]/page.tsx:651-655`
  - `apps/web/src/components/product/DetailsTabs.tsx:47-69`
- Evidence:
  - PDP passes `description`, `ingredients`, and `howToUse` into `DetailsTabs`.
  - `DetailsTabs` is a client component and conditionally renders only the active tab content.
  - Raw HTML exposes the active description content and product facts, but non-active tab content is not presented as normal visible semantic HTML until hydration/user interaction.
- Why it matters:
  - Google can process rendered pages, but raw HTML readability for LLM crawlers, lightweight crawlers, and snippet systems is stronger when key product facts are server-rendered and visible.
  - Ingredients, usage, benefits, and concerns are commercially useful facts for skincare queries.
- Safe fix recommendation:
  - Keep the same visual UI, but server-render all tab panel content in the HTML and hide inactive panels with accessible attributes/CSS rather than omitting them from the tree.
  - Do not add hidden keyword text; render only real visible product data.
- Risk level: Low to medium.

### Issue 5: Sitemap REST fallback can reintroduce redirected category slugs
- Severity: Medium
- Area: Sitemap / duplicate URL control
- File(s):
  - `apps/web/src/lib/sitemapEntries.ts:123-125`
  - `apps/web/src/lib/sitemapEntries.ts:152-154`
- Evidence:
  - GraphQL sitemap category path filters `REDIRECTED_CATEGORY_SLUGS`.
  - REST fallback filters only `uncategorized`.
  - Live sitemap currently passed scans for known redirected category slugs, so the active path appears clean now.
- Why it matters:
  - If GraphQL fails and REST fallback is used, old redirected category slugs may enter `/sitemap.xml`.
  - Google can treat sitemap-listed redirected URLs as lower-quality signals.
- Safe fix recommendation:
  - Apply the same redirected category slug exclusion in the REST fallback branch.
  - Re-run live sitemap scans after the change.
- Risk level: Low.

### Issue 6: Merchant schema enhancements need validation, not guessing
- Severity: Medium
- Area: Structured data / Google Merchant readiness
- File(s):
  - `apps/web/src/app/shop/[slug]/page.tsx:98-144`
- Evidence:
  - Product JSON-LD includes `Product`, `Offer`, `price`, `priceCurrency: BDT`, availability, item condition, seller, and shipping details.
  - `priceValidUntil` is generated as current date + 365 days.
  - No `MerchantReturnPolicy` schema was found.
  - `shippingDetails.shippingRate` uses a range-like `MonetaryAmount` shape and should be validated in Google tools.
- Why it matters:
  - Merchant listing eligibility is sensitive to schema matching visible price, stock, shipping, and return policy.
  - Artificial sale validity dates can be less trustworthy than omitting the field or using a real sale end date.
- Safe fix recommendation:
  - Validate representative PDPs in Rich Results Test and Merchant Center diagnostics.
  - Add return policy schema only if the same policy is visible and stable on the site.
  - Use real Woo sale end dates for `priceValidUntil` if available; otherwise consider omitting it.
- Risk level: Medium because schema changes can affect rich result eligibility.

### Issue 7: Product data/image hygiene still needs a fresh dry-run re-audit
- Severity: Medium
- Area: Product SEO data / image quality / Merchant readiness
- File(s):
  - `workspace/audit/archive/seo-source-audits-referenced-by-master-20260515/seo/product-image-audit-summary-20260430-011630.txt`
  - `workspace/audit/archive/seo-source-audits-referenced-by-master-20260515/seo/product-image-fix-dry-run-summary-20260430-011953.txt`
  - `workspace/audit/archive/seo-source-audits-referenced-by-master-20260515/seo/product-image-duplicate-thumb-audit-summary-20260430-011953.txt`
  - `workspace/audit/archive/seo-week2-gsc-cwv-product-source-audits-referenced-by-master-20260515/product-seo-audit-summary-20260513-105109.txt`
  - `workspace/products-need-real-image.csv`
  - `apps/web/SESSION-LOG.md:922`
- Evidence:
  - Historical image audit reported 1,771 manual-review items, 74 safe fixes, 177 duplicate-thumbnail products, and at least one missing thumbnail at that time.
  - Product SEO summary from 2026-05-13 reported: 3,626 missing Emart-owned meta descriptions, 319 weak meta, 19 missing both meta sources, 119 missing SKU, 7 invalid SKU, 1 missing image, 3 missing price, 19 thin visible descriptions, 4 merchant-schema-not-ready, and 19 low-score products.
  - `products-need-real-image.csv` lists 16 product rows needing real images.
  - Session log says 426 size-matched price rows were applied on 2026-05-15, with next steps to review 155 size-not-matched rows, 35 excluded rows, upload 16 missing product images, and run wrong-image assignment audit.
  - Later SKU/origin/product-copy work has been applied, so any older counts must be refreshed before mutation.
- Why it matters:
  - Product schema can be technically valid while product data quality still blocks rich result quality, Merchant Center confidence, and LLM answer quality.
- Safe fix recommendation:
  - Run a current read-only product data audit that compares visible title/price/stock/image/brand/SKU/schema fields.
  - Only mutate Woo/product data after a separate approval and backup.
- Risk level: Medium.

### Issue 8: Near-empty or legacy categories remain indexable/sitemap-listed
- Severity: Medium
- Area: Sitemap / category indexability / thin content
- File(s):
  - `workspace/docs/category-taxonomy-status.md`
  - `apps/web/src/lib/sitemapEntries.ts:123-155`
  - `apps/web/src/app/category/[slug]/page.tsx`
- Evidence:
  - Category taxonomy reference says `general-health`, `shampoo`, and `hair-essence-serum` are empty/near-empty or duplicate-like categories that should not be used as primary SEO targets.
  - Fresh live sitemap includes `/category/general-health`, `/category/shampoo`, and `/category/hair-essence-serum`.
  - Live HTML checks showed these three URLs are `index, follow` with self canonicals.
  - `/category/lip-care` is correctly `noindex, follow` and absent from sitemap, so the empty-category path can work when data/count rules exclude it.
- Why it matters:
  - Near-empty or duplicate category pages dilute sitemap quality and can contribute to "Crawled - currently not indexed" or thin-content signals.
- Safe fix recommendation:
  - Decide a current category policy for near-empty and duplicate categories.
  - Either redirect duplicate slugs to stronger canonical categories (`shampoo` to `shampoos`, `hair-essence-serum` to `hair-treatments` if owner-approved) or noindex/exclude them from sitemap until they have enough unique products/content.
  - Keep backend-only Woo taxonomy terms if needed for operations, but do not list them as public SEO URLs.
- Risk level: Medium because category redirects can affect internal links and product discovery.

### Issue 9: Stale or irrelevant category Open Graph image risk
- Severity: Medium
- Area: SEO metadata / social cards / AI previews
- File(s):
  - `apps/web/src/app/category/[slug]/page.tsx:94-103`
- Evidence:
  - Category metadata uses Rank Math/category metadata image when present.
  - Live `/category/sunscreen` exposed an OG image from an unrelated-looking old media asset name.
- Why it matters:
  - This does not block indexing, but it can hurt share previews, brand trust, and AI/search preview quality.
- Safe fix recommendation:
  - Audit category OG images and prefer category-specific images only when relevant.
  - If no good category image exists, fall back to a stable storefront social image rather than stale media.
- Risk level: Low.

## Low Priority / Nice-to-have

### Issue 10: GSC URL cleanup reports are mostly fixed but still need owner-led validation
- Severity: Low
- Area: GSC indexing / stale redirects / owner review
- File(s):
  - `workspace/audit/archive/seo-week2-gsc-cwv-product-source-audits-referenced-by-master-20260515/p0-product-url-migration-audit-20260511.md`
  - `workspace/audit/archive/seo-week2-gsc-cwv-product-source-audits-referenced-by-master-20260515/p1-crawled-not-indexed-classification-20260511.md`
  - `workspace/audit/archive/seo-week2-gsc-cwv-product-source-audits-referenced-by-master-20260515/p2-404-redirect-cleanup-audit-20260512.md`
  - `apps/web/next.config.js:74-110`
- Evidence:
  - Old `/product/*` to `/shop/*` migration samples were already fixed.
  - `filter_brand` and `per_row` query duplicates now redirect to `/shop`.
  - Several owner-review redirects from the P1/P2 reports are now live as permanent redirects.
  - Some ambiguous product/category/brand URL decisions in the P2 report should not be automated without owner/performance evidence.
- Why it matters:
  - This is now mostly GSC recrawl lag, but owner-approved redirects can still recover signals from valuable old URLs.
- Safe fix recommendation:
  - Do not chase every 404.
  - Use GSC performance/backlink evidence to pick high-value stale URLs, then add surgical redirects only when the target is unambiguous.
- Risk level: Low.

### Issue 11: Homepage title differs from older SEO TODO target
- Severity: Low
- Area: SEO metadata consistency
- File(s):
  - `workspace/audit/archive/seo-source-audits-referenced-by-master-20260515/SEO_TODO.md`
  - `apps/web/src/app/page.tsx:27-38`
  - `apps/web/src/app/layout.tsx:30-44`
- Evidence:
  - Old TODO expected a specific homepage title format.
  - Current homepage page metadata uses a slightly different title from the root default.
- Why it matters:
  - This is not a technical SEO blocker, but brand/title consistency helps avoid stale review loops.
- Safe fix recommendation:
  - Decide one current approved homepage title and keep page/root defaults aligned.
- Risk level: Low.

### Issue 12: Lint is skipped during production build
- Severity: Low
- Area: Build quality
- File(s):
  - `apps/web/next.config.js:10`
- Evidence:
  - `eslint.ignoreDuringBuilds` is enabled.
  - Standalone `npm run lint` passed with one warning in `LiveTickerBar.tsx`.
- Why it matters:
  - Build success does not guarantee lint success unless CI runs lint separately.
- Safe fix recommendation:
  - Keep standalone lint in CI/deploy checks, or remove build lint skip if build time allows.
- Risk level: Low.

### Issue 13: Reviews section performs non-critical client refetch
- Severity: Low
- Area: Performance / hydration
- File(s):
  - `apps/web/src/components/product/ReviewsSection.tsx:70-93`
- Evidence:
  - PDP server passes initial review data, then client component fetches review status/count with `cache: 'no-store'`.
- Why it matters:
  - Not an SEO blocker, but adds client network work on PDPs.
- Safe fix recommendation:
  - Defer non-critical review status fetch or avoid refetch where server data is enough.
- Risk level: Low to medium because review/order logic is protected and should remain read-only unless explicitly scoped.

### Issue 14: Confirm AI crawler policy for Google-Extended
- Severity: Low
- Area: Robots / LLM crawler policy
- File(s):
  - `apps/web/src/app/robots.ts`
- Evidence:
  - Robots explicitly allows GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Applebot, and Google-Extended, while blocking CCBot, Bytespider, and cohere-ai.
- Why it matters:
  - Google-Extended is a policy choice. Allowing it is not required for Google Search indexing.
- Safe fix recommendation:
  - Keep if intentional; otherwise adjust only after business approval.
- Risk level: Low.

## Route Test Matrix

| URL | Indexable? | Canonical OK? | Schema OK? | Raw HTML Content OK? | Image OK? | Notes |
|---|---:|---:|---:|---:|---:|---|
| `/` | Yes | Yes | Yes | Yes | Needs review | Organization/WebSite schema present. Lighthouse performance is weak due render/DOM/third-party work. |
| `/shop` | Yes | Yes | Partial | Yes | Needs review | Collection/listing page is crawlable. Multiple high-priority product images observed. |
| `/shop/cosrx-advanced-snail-mucin-96-power-essence-30ml` | Yes | Yes | Yes | Mostly | Needs review | Product/Offer/Breadcrumb JSON-LD present. Raw HTML includes key product facts; ingredients/how-to-use are tab-gated. |
| `/category/sunscreen` | Yes | Yes | Yes | Yes | Needs review | Category page crawlable. OG image relevance should be audited. Multiple high-priority images observed. |
| `/category/general-health` | Yes | Yes | Yes | Thin risk | Mostly | Sitemap-listed and `index, follow`, but taxonomy doc flags it as near-empty. |
| `/category/lip-care` | No | Yes | Not needed | Thin | Mostly | Correctly `noindex, follow` and absent from sitemap. |
| `/brands/cosrx` | Yes | Yes | Yes | Yes | Mostly | Brand title/canonical and collection schema are clean. |
| `/search?q=snail` | No | Yes | Not needed | Yes | N/A | Correctly `noindex, follow`. |
| `/shop?filter_brand=cosrx` | No | Yes | N/A | N/A | N/A | Redirects to `/shop`; old duplicate issue is fixed live. |
| `/shop?per_row=4` | No | Yes | N/A | N/A | N/A | Redirects to `/shop`; old duplicate issue is fixed live. |
| `/brands/april-skin` | No | Yes | N/A | N/A | N/A | Redirects to `/brands/aprilskin`; old GSC alias handled. |
| `/checkout` | No | N/A | Not needed | N/A | N/A | Correctly private/noindex/no-store. |
| `/account` | No | N/A | Not needed | N/A | N/A | Correctly private/noindex/no-store. |
| `/wishlist` | No | N/A | Not needed | N/A | N/A | Correctly private/noindex/no-store. |
| `/robots.txt` | N/A | N/A | N/A | N/A | N/A | Allows public crawlers and intended LLM crawlers; blocks private/backend/noisy routes. |
| `/sitemap.xml` | N/A | N/A | N/A | N/A | N/A | 4,169 unique frontend URLs in fresh live test; no duplicate loc values found. |

## Schema Validation Findings

| Route type | Schema found | Missing fields | Risk |
|---|---|---|---|
| Global layout | Organization/OnlineStore, WebSite, SearchAction | MerchantReturnPolicy not found globally | Low to Medium |
| Homepage | Global schema inherited | No separate page-specific schema required | Low |
| Product PDP | Product, Offer, BreadcrumbList | Return policy absent; shippingDetails and dynamic priceValidUntil need Google validation | Medium |
| Product PDP with reviews | AggregateRating only when real rating count/average exists | Review array not required; avoid adding unless real visible review data is stable | Low |
| Category pages | BreadcrumbList, CollectionPage/ItemList style schema | Category OG image quality can be stale | Low to Medium |
| Near-empty category pages | BreadcrumbList, CollectionPage/ItemList style schema | Some sitemap-listed categories need index/noindex review | Medium |
| Brand pages | BreadcrumbList, CollectionPage/ItemList style schema | None blocking found | Low |
| Blog article pages | Article/BlogPosting found in code | Validate representative post if traffic-critical | Low |
| FAQ page | FAQPage with visible FAQ content | None blocking found | Low |
| Search/private pages | No rich schema needed | Correctly noindex | Low |

## Image Optimization Findings

| Component/file | Problem | Impact | Fix |
|---|---|---|---|
| `ProductCard.tsx` plus shop/category callers | `priority` applied to first four grid products | Can create multiple high-priority image requests and hurt LCP | Limit to true LCP candidate or remove on grids |
| `HomepageSections.tsx` | Mobile rails duplicate interactive cards and have `aria-hidden` focusability failures | Larger DOM, accessibility failures, possible INP/LCP render cost | Keep same UI but make hidden duplicates inert/unfocusable or reduce duplicate DOM |
| `ProductImage.tsx` | First PDP image is prioritized, which is usually correct, but can compete with header/logo priorities | PDP LCP may be less deterministic | Keep PDP gallery priority, reduce competing global priorities |
| `Header.tsx` | Logo image uses `priority` globally | Competes with product/category LCP on every route | Remove unless field data proves logo is LCP |
| `next.config.js` | Raw IP image remote pattern allowed | Backend/IP exposure risk and broader optimizer surface | Audit media URLs, then remove if unused |
| Category metadata image source | Can inherit stale Rank Math/category OG image | Low-quality social/AI cards | Use relevant category image or default storefront image |
| Historical product image audit files | Prior audits found duplicate thumbnails, manual-review cases, and at least one missing thumbnail | Product rich result and Merchant quality risk | Run fresh read-only image/data audit before data fixes |

## Crawler Response Findings

| URL | User-Agent | Status | Meta robots | Canonical | Notes |
|---|---|---:|---|---|---|
| `/` | Browser | 200 | index/follow | OK | Server-rendered storefront content present. |
| `/shop` | Browser | 200 | index/follow | OK | Public commercial page. |
| `/shop/cosrx-advanced-snail-mucin-96-power-essence-30ml` | Browser | 200 | index/follow | OK | Product title, price, stock, brand, breadcrumbs, and JSON-LD present in response. |
| `/shop/cosrx-advanced-snail-mucin-96-power-essence-30ml` | Googlebot | 200 | index/follow | OK | No bot block observed. |
| `/shop/cosrx-advanced-snail-mucin-96-power-essence-30ml` | Bingbot | 200 | index/follow | OK | No bot block observed. |
| `/shop/cosrx-advanced-snail-mucin-96-power-essence-30ml` | ChatGPT-User | 200 | index/follow | OK | No bot block observed. |
| `/shop/cosrx-advanced-snail-mucin-96-power-essence-30ml` | PerplexityBot | 200 | index/follow | OK | No bot block observed. |
| `/shop/cosrx-advanced-snail-mucin-96-power-essence-30ml` | ClaudeBot | 200 | index/follow | OK | No bot block observed. |
| `/category/sunscreen` | Browser | 200 | index/follow | OK | Public category page. |
| `/brands/cosrx` | Browser | 200 | index/follow | OK | Public brand page. |
| `/checkout` | Browser | 200 | noindex,nofollow | N/A | Private route has no-store headers. |
| `/account` | Browser | 200 | noindex,nofollow | N/A | Private route has no-store headers. |
| `/wishlist` | Browser | 200 | noindex,nofollow | N/A | Private route has no-store headers. |
| `/robots.txt` | Browser | 200 | N/A | N/A | Valid text response; public assets/pages not blocked. |
| `/sitemap.xml` | Browser | 200 | N/A | N/A | Valid XML response; clean frontend URLs only in tested patterns. |
| `/shop?per_page=48` | Browser | 301 | N/A | `/shop` | Duplicate query redirected/canonicalized. |
| `/shop?filter_brand=cosrx` | Browser | 301 -> 200 | N/A | `/shop` | Legacy Woo filter duplicate now strips to clean shop. |
| `/shop?per_row=4` | Browser | 301 -> 200 | N/A | `/shop` | Legacy Woo display duplicate now strips to clean shop. |
| `/brands/april-skin` | Browser | 308 -> 200 | N/A | `/brands/aprilskin` | Brand alias redirect now live. |
| `/shop/cosrx-advanced-snail-96-mucin-power-essence-30ml-mini` | Browser | 308 -> 200 | N/A | `/shop/cosrx-advanced-snail-mucin-96-power-essence-30ml` | Stale product alias redirect now live. |
| `/category/general-health` | Browser | 200 | index/follow | OK | Near-empty category remains sitemap-listed; review. |
| `/product/cosrx-advanced-snail-mucin-96-power-essence-30ml` | Browser | 301 | N/A | `/shop/...` | Legacy product path redirects to canonical frontend PDP. |

## Google Delay Explanation

Code problems still worth fixing:
- Homepage Lighthouse/CWV issues should be addressed: high DOM/layout cost, focusable controls inside `aria-hidden` rails, early third-party main-thread work, and real-user TTFB variance.
- Image priority/preload overuse can hurt Core Web Vitals and therefore page experience signals.
- Raw-IP image allowlist should be removed after confirming no active media dependency.
- Near-empty/duplicate category pages should be removed from sitemap or redirected/noindexed according to current category policy.
- Product tab content should be more raw-HTML readable for AI/lightweight crawlers.
- Sitemap REST fallback should mirror the GraphQL exclusion rules.
- Merchant schema shipping/return policy fields should be validated against real visible policy data.
- Product/image data quality should be re-audited with current Woo data before any mutations.

Likely normal Google delay, not current code failure:
- Old SEO TODO items around `per_page`, `shop_view`, relative canonicals, and brand title format appear fixed in current code.
- Old GSC items around `/product/*`, `filter_brand`, `per_row`, Aprilskin, A'pieu, Kaine, and the COSRX mini slug are fixed live in sampled checks; remaining GSC rows can lag until Google recrawls.
- The previous sitemap duplicate-count issue appears fixed in the current live sitemap; old reports with 4,500 loc entries are historical.
- Live sitemap is clean, but Google may not have recrawled every updated product/category URL yet.
- Rich result and Merchant Center eligibility can lag behind deploys and may keep old diagnostics until Google fetches fresh rendered pages.
- Search snippets and indexed titles can remain stale after code changes even when current HTML is correct.

## Recommended Fix Order

1. Fix homepage Lighthouse/CWV issues: reduce duplicated DOM/hidden focusable rails, limit early third-party work, and verify edge/origin caching.
2. Remove or reduce competing image `priority` usage on shop/category/PDP/header after identifying the true LCP image per route type.
3. Run a read-only media URL audit; remove the raw-IP `remotePatterns` entry if unused.
4. Decide category policy for near-empty/duplicate categories and remove them from sitemap by redirect/noindex/exclusion as appropriate.
5. Patch sitemap REST fallback to exclude the same redirected category slugs as the GraphQL path.
6. Improve PDP tab content so ingredients/how-to-use/benefits are present in initial semantic HTML without UI redesign.
7. Validate Product/Offer/shipping schema in Rich Results Test and Merchant Center; adjust only to match visible policy/price/stock data.
8. Run a fresh product SEO/image data audit against current Woo data and current rendered PDPs.
9. Audit category/brand OG images and replace stale irrelevant images with relevant category/default social images.
10. Confirm business policy for Google-Extended and other AI crawlers in `robots.ts`.
11. Keep `npm run lint` and `npm run build` in verification before any deploy.

## Files To Edit Later

- `apps/web/src/components/product/ProductCard.tsx`
- `apps/web/src/components/home/HomepageSections.tsx`
- `apps/web/src/components/analytics/MetaPixel.tsx`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/shop/page.tsx`
- `apps/web/src/app/category/[slug]/page.tsx`
- `apps/web/src/components/product/ProductImage.tsx`
- `apps/web/src/components/layout/Header.tsx`
- `apps/web/next.config.js`
- `apps/web/src/lib/sitemapEntries.ts`
- `apps/web/src/lib/category-navigation.ts`
- `apps/web/src/components/product/DetailsTabs.tsx`
- `apps/web/src/app/shop/[slug]/page.tsx`
- `apps/web/src/app/category/[slug]/page.tsx`
- `apps/web/src/app/robots.ts`
