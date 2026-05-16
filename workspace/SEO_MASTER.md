# Emart SEO Master Task List

Last updated: 2026-05-16 (internal codebase audit follow-up)
Owner: Claude (code + data fixes) | Owner decision needed where marked
Source audit: `workspace/audit/archive/reference-audits-20260515/e-mart-master-technical-seo-image-crawler-audit-20260515.md`

Internal note: this master list is for owner/agent implementation planning only; do not publish it as a public customer-facing SEO report.
Google AI Search source note: Google's AI Overviews / AI Mode guidance says normal SEO fundamentals still apply, pages must be indexable and snippet-eligible to appear as supporting links, query fan-out can use related subtopics, structured data should match visible content, Merchant Center/Business Profile data should be current, and no special AI schema, AI-only file, or `llms.txt` is required.

---

## ✅ DONE (this session + prior work)

| Task | Completed | Notes |
|------|-----------|-------|
| `DetailsTabs` — all panels server-rendered in initial HTML (ingredients/how-to-use visible to crawlers) | 2026-05-15 | `DetailsTabs.tsx` — commit `f64fbf2` |
| All GSC P2 redirects (j-beauty, korean-skincare-routine, about-us-3, faq-FAQ etc.) | 2026-05-15 | `next.config.js` |
| Near-empty categories removed from sitemap (general-health, shampoo, hair-essence-serum) | 2026-05-15 | `sitemapEntries.ts` |
| Sitemap REST fallback now mirrors GraphQL exclusion rules | 2026-05-15 | `sitemapEntries.ts` |
| Raw IP `5.189.188.229` removed from `remotePatterns` | 2026-05-15 | `next.config.js` |
| Header logo `priority` removed from mobile and desktop header logos | 2026-05-16 | `Header.tsx`; real route LCP images keep their own priority |
| Font weights reduced (7 fewer font file requests) | 2026-05-15 | `layout.tsx` |
| HomepageSections dynamic imports (deferred 1,034-line client bundle) | 2026-05-15 | `page.tsx` |
| Homepage mobile duplicate rails use `inert` with `aria-hidden` | 2026-05-16 | `HomepageSections.tsx`; prior H1 accessibility issue already compliant |
| ProductCard priority narrowed to first product on first shop/category page | 2026-05-16 | `shop/page.tsx`, `category/[slug]/page.tsx`; prior H2 already compliant |
| `/brands` exact redirect conflict fixed | 2026-05-16 | removed only `/brands` → `/shop` from `next.config.js`; live `/brands` and `/brands/cosrx` return 200 |
| PDP visible FAQ now has matching `FAQPage` JSON-LD | 2026-05-16 | `shop/[slug]/page.tsx`; schema is conditional and uses the same visible FAQ items |
| Category OG image selection made conservative | 2026-05-16 | `category/[slug]/page.tsx`; uses vetted storefront/category images instead of arbitrary Rank Math media |
| `/faq` visible answers now match `FAQPage` schema in raw HTML | 2026-05-16 | `faq/page.tsx`; native `<details>` keeps answers server-rendered |
| Static sitemap `lastmod` churn stopped | 2026-05-16 | `sitemapEntries.ts`; static URLs use stable date, collection URLs omit fake timestamps |
| Wrong Korea origin + "Korea import" copy cleaned across 3,628 products | 2026-05-15 | WP DB + scripts |
| Product meta descriptions — all 3,564 products have `_rank_math_description` | 2026-05-04 | WP DB |
| Brand taxonomy + pa_origin assignment for 3,641 products | 2026-05-05 | WP DB |
| Sale prices cleared catalog-wide, Flash Sale fallback fixed | 2026-05-08 | WP DB |
| Old `/product/*` → `/shop/*` migration redirects | prior | `next.config.js` |
| `filter_brand` / `per_row` query duplicates redirect to `/shop` | prior | `next.config.js` |
| All brand alias redirects (a-pieu, aztec, paula-s, wskin, purito etc.) | prior | `next.config.js` |
| robots.txt — allows Google/Bing/LLM crawlers, blocks private routes | prior | `robots.ts` |
| Private routes noindex + no-store (checkout, account, wishlist) | prior | route config |
| Canonical, sitemap, OG URLs all absolute from `NEXT_PUBLIC_SITE_URL` | prior | arch |
| Product JSON-LD: real SKU/price/stock, no fake ratings, InStock/OutOfStock | prior | PDP |

---

## 🔴 HIGH — Do Next

No open high-priority technical SEO items after the 2026-05-16 SEO cleanup batch. Keep monitoring GSC/Merchant Center for fresh crawl, rich result, and product data issues.

---

## 🟡 MEDIUM — Schedule

### ~~M1: `MerchantReturnPolicy` schema + `priceValidUntil`~~ ✅ DONE 2026-05-15
- `MerchantReturnPolicy` added to all PDP Offer schema (7-day, BD, `/return-policy`)
- `priceValidUntil` removed (artificial +365 was misleading; re-enable when real sale dates exist)

### ~~M2: Category OG image audit~~ ✅ DONE 2026-05-16
- Category pages now use vetted local storefront/category OG images. Unknown categories fall back to `/images/hero-products.png` instead of arbitrary stale Rank Math media.

### ~~M3: Fresh product SEO / image data audit~~ ✅ DONE 2026-05-15
- Read-only audit rerun after SKU/origin/copy fixes.
- Output: `workspace/active/audits/product-seo-audit-20260515.csv` + `product-seo-audit-summary-20260515.txt`.
- Current product-data gaps from fresh audit: 16 missing images, 7 invalid SKUs, 3 missing prices, 19 merchant-schema-not-ready, 287 weak meta, 6 duplicate meta.

### ~~M4: SKU gap fixes — fresh audit shows 0 missing SKUs~~ ✅ DONE 2026-05-15
- Read-only audit rerun: 3,628 published products, 0 missing SKU, 0 duplicate SKU meta products.
- No SKUs assigned in this run.

### ~~M5: pa_concern + pa_skin_type assignment~~ ✅ DONE 2026-05-15
- pa_concern: 2,236 products | pa_ingredient: 1,088 products | pa_skin_type: 28 products — see DEV_MASTER B1

### M6: Homepage title alignment
- **Why:** Minor inconsistency between current page title and older SEO TODO target format.
- **Files:** `apps/web/src/app/page.tsx:27-38`, `apps/web/src/app/layout.tsx`
- **Fix:** Align page title with approved format. One line change.
- **Effort:** Trivial | **Risk:** Low | **Owner:** Owner confirms preferred title format

### ~~M7: FAQ page schema/visible HTML alignment~~ ✅ DONE 2026-05-16
- `/faq` now renders native `<details>` from the server, so answer text is present in raw HTML and matches the `FAQPage` JSON-LD.

### ~~M8: Static sitemap `lastmod` churn~~ ✅ DONE 2026-05-16
- Static URLs use a stable `2026-05-16` lastmod. Category/brand collection URLs no longer emit fake current timestamps when no accurate source modified date exists.

### M9: Skin-type buyer guidance gap
- **Why:** Query fan-out coverage is good for concerns, ingredients, routine steps, brands, origins, and skin quiz, but there are no first-class indexable skin-type education/listing pages yet. `/shop?skin_type=` is a filter variant and canonicalizes away.
- **Files:** Future route only if genuinely useful, e.g. `apps/web/src/app/skin-type/[slug]/page.tsx` plus supporting definitions.
- **Fix:** Only create curated skin-type pages if each page has real useful guidance and matching product listings for Bangladesh shoppers (`oily`, `dry`, `sensitive`, `combination`). Do not mass-generate doorway pages.
- **Effort:** Medium | **Risk:** Medium | **Owner:** Owner + Claude

### M10: Comparison/buyer-decision content gap
- **Why:** Google AI Mode can use query fan-out for nuanced comparisons; current coverage has product/category/brand/concern/ingredient/routine pages, but no real comparison guides such as `serum vs ampoule`, `retinol vs bakuchiol`, or `chemical vs mineral sunscreen`.
- **Files:** Future editorial/blog or guide routes only when owner-approved and genuinely useful.
- **Fix:** Create a small number of human-reviewed comparison guides tied to real products and visible facts. Avoid keyword-stuffed or mass-generated pages.
- **Effort:** Medium | **Risk:** Medium | **Owner:** Owner + Claude

---

## 🟢 LOW — When convenient

### L1: Google-Extended policy decision
- **Files:** `apps/web/src/app/robots.ts`
- Currently allowed. Keep if intentional for LLM discoverability; block if not.
- **Owner:** Business decision

### L2: ReviewsSection client refetch
- **Files:** `apps/web/src/components/product/ReviewsSection.tsx:70-93`
- Non-critical `cache: 'no-store'` fetch on PDP hydration. Defer or remove if server data is sufficient.
- **Owner:** Claude

### L3: Lint during builds
- **Files:** `apps/web/next.config.js:10` (`eslint.ignoreDuringBuilds: true`)
- Re-enable or add to CI check separately.
- **Owner:** Claude

### L4: Cloudflare cache rule for `/shop` and `/category/*`
- Nginx sets `s-maxage` correctly. Cloudflare CDN cache rule still needs dashboard setup.
- **Owner:** Dashboard-only — owner sets in Cloudflare dashboard

### L5: Critical CSS inlining (`critters`)
- **Why:** Main CSS file (94KB / 16.8KB gzipped) blocks first paint on mobile slow-4G simulation. CSS IS Cloudflare-cached for real users.
- **Files:** `apps/web/next.config.js`, build pipeline
- **Fix:** Add `critters` package to Next.js build for above-fold CSS inlining. High effort, high impact on PSI score.
- **Owner:** Claude when prioritised

### L6: `LiveTickerBar` lint warning
- **Files:** `apps/web/src/components/categories/LiveTickerBar.tsx:65-75`
- **Finding:** `recent` array dependency changes every render; `npm run lint` warns about `react-hooks/exhaustive-deps`.
- **Fix:** Move `recent` inside the `useMemo` callback or memoize it separately.
- **Owner:** Claude

---

## Google AI Search Readiness

### AI Overview / AI Mode readiness
- **Status:** Generally good, with normal SEO caveats. Public commercial/informational pages are mostly crawlable, indexable, canonicalized, internally linked, and rendered with textual HTML.
- **Evidence:** `robots.ts` allows Googlebot and Googlebot-image; `layout.tsx` sets `max-snippet:-1` and `max-image-preview:large`; product/category/brand/concern/ingredient/routine pages are server-rendered and internally linked.
- **Main blockers:** Product data gaps from M3, plus owner-approved content expansion gaps M9/M10.

### Snippet eligibility issues
- **Pass:** No public route uses global `nosnippet`; `layout.tsx` allows unlimited snippets with `max-snippet:-1`.
- **Pass with watch item:** `data-nosnippet` appears only on non-essential badges/trust strips in `ProductCard.tsx`, `TrustStrip.tsx`, and `categories/TrustStrip.tsx`; core product name, price, title, description, stock, brand, category, and FAQ are not hidden by `data-nosnippet`.
- **Private pages:** Checkout/account/order/search are intentionally noindex or private; this is correct and not an AI-readiness issue.

### Query fan-out content gaps
- **Good coverage:** Concern pages (`/concerns/[slug]`), ingredient pages (`/ingredients/[slug]`), routine pages (`/routine/[step]`), brand pages (`/brands/[slug]`), origin pages, blog, and `/skin-quiz`.
- **Gap:** No indexable skin-type pages; current skin-type handling lives as `/shop?skin_type=` filter variants and canonicalizes away.
- **Gap:** No dedicated comparison/buyer-decision guides. Add only a small, useful, human-reviewed set if owner wants them.

### Helpful content gaps
- **PDP strength:** Product pages expose name, price, stock, SKU when present, brand, origin/size chips, description, ingredients, how-to-use, reviews, FAQ, breadcrumbs, and related products in raw HTML.
- **PDP risk:** Some generated FAQ answers can become thin when source fields are weak; product data audit still reports weak meta, missing images, missing prices, invalid SKUs, and merchant-schema-not-ready rows.
- **Collection risk:** Generic category/brand copy is useful enough for indexability, but high-value categories/brands still benefit from owner-reviewed buying guidance instead of repeated commodity text.

### Structured data/content mismatch
- **Pass:** Product schema uses the same Woo product object as visible PDP content for price, availability, brand, image, SKU, URL, and reviews; aggregate rating appears only when Woo rating data exists.
- **Pass:** PDP FAQ is visible and now represented as conditional `FAQPage` schema from the same visible FAQ items.
- **Risk to monitor:** Shipping/return policy schema must keep matching visible policy pages and checkout reality.

### Merchant data mismatch
- **Known gaps:** Fresh product audit still reports 16 missing images, 7 invalid SKUs, 3 missing prices, and 19 merchant-schema-not-ready rows.
- **Pass:** Product canonical URLs use `/shop/[slug]`; sitemap emits frontend URLs; schema price uses `product.price || sale_price || regular_price`; visible PDP price uses sale price when on sale and regular price as strikethrough.
- **Action:** Product data fixes must update Woo source first so frontend, schema, Merchant feed logic, sitemap/canonical URL, stock, and visible price remain aligned.

### Image and Video AI Search Readiness
- **Pass:** Product images use `next/image`, allowed `remotePatterns`, AVIF/WebP output, meaningful product-name fallback alt, and crawlable `https://e-mart.com.bd/wp-content/uploads/...` URLs.
- **Gap:** Product data audit still has missing-image rows; fix in Woo/source data, not by hiding or faking images.
- **Video:** Social/YouTube surfaces have titles/thumbnails, but product PDP video schema/content was not found. Add video only when a real product/demo video exists and is visible.

### AI content policy safety
- **Pass:** No `llms.txt` requirement or AI-only markup exists. No code path found that creates special AI doorway pages.
- **Risk:** Historical/bulk SEO scripts exist in archive; future content generation must stay human-reviewed, fact-based, visible, non-medical-claimy, and tied to real product data.
- **Rule:** Do not mass-generate skin-type/comparison pages unless every page has real buyer value and owner review.

### AI myths to ignore
- No special AI schema needed.
- No AI-only markdown file needed.
- No `llms.txt` needed for Google AI Search.
- No keyword-stuffed fan-out pages.
- No fake reviews or fake schema.

Recommended actions must improve normal Google SEO and user usefulness first. Do not recommend AI hacks.

---

## Owner Decision Needed

| Item | Decision required |
|------|-----------------|
| Return policy page | Does a stable return policy page exist? → enables MerchantReturnPolicy schema (M1) |
| SKU data | No current missing-SKU list after 2026-05-15 read-only audit; future SKU changes still require owner data |
| pa_concern dry-run review | Approve concern/skin-type assignments → enables M5 |
| Homepage title format | Confirm preferred `<title>` format → enables M6 |
| Cloudflare cache rule | Set in dashboard for `/shop` and `/category/*` → L4 |
| Google-Extended | Allow or block in robots.ts → L1 |
