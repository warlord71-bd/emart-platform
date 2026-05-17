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
| `LiveTickerBar` lint warning fixed | 2026-05-16 | `LiveTickerBar.tsx`; memo dependencies no longer recreate fallback array every render |
| PDP review eligibility fetch deferred | 2026-05-16 | `ReviewsSection.tsx`, `api/product-reviews`; server-rendered reviews stay visible, client auth check waits until near viewport |
| Lint is enforced during production builds again | 2026-05-16 | `next.config.js`; removed `eslint.ignoreDuringBuilds` after lint became clean |
| Homepage/global title aligned to approved brand format | 2026-05-16 | `page.tsx`, `layout.tsx`; homepage title/OG title and global fallback now use `Emart Skincare Bangladesh | Authentic Korean, Japanese & Global Beauty`; WebSite schema tagline aligned |
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
- 2026-05-16: Fixed 2 wrong-size duplicate metas (93187 Neutrogena 80ml, 93160 COSRX 150ml). 2 Kota Cosmetics Mellow duplicates (74655/74669 — same title/price/categories, different SKUs) flagged for owner review (possible trash of 74669).
- 2026-05-16: Fixed 7 invalid SKUs (whitespace removed): w.shinn001 series (51258/51262/51266/58268), Beauty Glazed barcode 6975640630259-2 (74162), Bellflower 8809567925359 (74211), everly001 (74454).
- 2026-05-16: Generated and applied improved _rank_math_description for all 287 weak-meta products. Template: "Buy {Title} for ৳{price} in Bangladesh. {category-specific benefit}. Shop now at Emart!" — passes anchor/length/intent checks. 2 targeted corrections applied post-run (concealer 36149, acne wash 51286). Remaining open: 16 missing images (owner), 3 missing prices (owner), 19 merchant-not-ready (mostly image gap), 287 → 0 weak meta.

### ~~M4: SKU gap fixes — fresh audit shows 0 missing SKUs~~ ✅ DONE 2026-05-15
- Read-only audit rerun: 3,628 published products, 0 missing SKU, 0 duplicate SKU meta products.
- No SKUs assigned in this run.

### ~~M5: pa_concern + pa_skin_type assignment~~ ✅ DONE 2026-05-15
- pa_concern: 2,236 products | pa_ingredient: 1,088 products | pa_skin_type: 28 products — see DEV_MASTER B1

### ~~M6: Homepage title alignment~~ ✅ DONE 2026-05-16
- Homepage metadata title, OpenGraph title, global fallback title, and WebSite schema tagline now use the owner-approved format: `Emart Skincare Bangladesh | Authentic Korean, Japanese & Global Beauty`.

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

### ~~L2: ReviewsSection client refetch~~ ✅ DONE 2026-05-16
- Review list stays server-rendered from `initialReviews`; client eligibility check is deferred until the reviews section nears the viewport and asks the API to skip duplicate review payload for anonymous users.

### ~~L3: Lint during builds~~ ✅ DONE 2026-05-16
- Production builds now run lint again because `eslint.ignoreDuringBuilds` was removed after `npm run lint` became clean.

### L4: Cloudflare cache rule for `/shop` and `/category/*`
- Nginx sets `s-maxage` correctly. Cloudflare CDN cache rule still needs dashboard setup.
- **Owner:** Dashboard-only — owner sets in Cloudflare dashboard

### L5: Critical CSS inlining (`critters`)
- **Why:** Main CSS file (94KB / 16.8KB gzipped) blocks first paint on mobile slow-4G simulation. CSS IS Cloudflare-cached for real users.
- **Files:** `apps/web/next.config.js`, build pipeline
- **Fix:** Add `critters` package to Next.js build for above-fold CSS inlining. High effort, high impact on PSI score.
- **Owner:** Claude when prioritised

### ~~L6: `LiveTickerBar` lint warning~~ ✅ DONE 2026-05-16
- `recent` fallback now lives inside the `useMemo` callback, so `react-hooks/exhaustive-deps` no longer warns.

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
| Cloudflare cache rule | Set in dashboard for `/shop` and `/category/*` → L4 |
| Google-Extended | Allow or block in robots.ts → L1 |

---

## 🔍 Full Technical SEO Audit — 2026-05-17 — Ahrefs/Semrush Level

Crawled 43 live URLs. Read-only audit — no code changed.

---

### Technical Health

| Check | Result | Notes |
|-------|--------|-------|
| HTTPS | ✅ Pass | All pages served HTTPS |
| www → non-www redirect | ✅ 301 | `https://www.e-mart.com.bd/` → `https://e-mart.com.bd/` |
| HTTP → HTTPS redirect | ✅ 301 | `http://e-mart.com.bd/` → `https://e-mart.com.bd/` |
| `/product/*` → `/shop/*` redirect | ✅ 301 | e.g. `/product/cosrx-acne-pimple-master-patch-24-patch` → `/shop/…` |
| Sitemap URL count | ✅ 4,167 URLs | No `/product-category/` or `/product/` URLs in sitemap |
| Robots.txt | ✅ Well-formed | Blocks cart, checkout, account, api, wp-admin, query params. Allows Googlebot, Bingbot, LLMs. |
| Avg response time | ✅ 0.07–1.45s | Brands page 1.45s (large payload 785KB). All others under 1.1s. |
| No redirect chains found | ✅ Pass | All tested redirects resolve in 1 hop |

---

### Page-by-Page Audit

| URL (path) | Status | Title len | Desc len | Canon | H1 | og:image | Schema types | Issues |
|-----------|--------|-----------|----------|-------|----|----------|-------------|--------|
| / | 200 | 74 ⚠️ | 184 ⚠️ | ✅ | 1 (dynamic promo) 🔴 | ❌ 🔴 | WebSite, OnlineStore, Organization | Title long, desc long, H1 rotates, no og:image |
| /shop | 200 | 51 ✅ | 187 ⚠️ | ✅ | 1 ✅ | ❌ 🟡 | WebSite, OnlineStore | Desc long, no og:image |
| /categories | 200 | 50 ✅ | 132 ✅ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | — |
| /brands | 200 | 42 ✅ | 144 ✅ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | No H2 |
| /new-arrivals | 200 | 72 ⚠️ | 173 ⚠️ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | Title long, desc long, no H2 |
| /sale | 200 | 61 ⚠️ | 180 ⚠️ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | Title borderline, desc long, no H2 |
| /skin-quiz | 200 | 21 ✅ | 132 ✅ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | — |
| /our-story | 200 | 17 ✅ | 110 ✅ | ❌ 🔴 | 1 ✅ | ✅ | WebSite, OnlineStore | No canonical |
| /authenticity | 200 | 28 ✅ | 108 ✅ | ❌ 🔴 | 1 ✅ | ✅ | WebSite, OnlineStore | No canonical |
| /faq | 200 | 60 ✅ | 156 ✅ | ✅ | 1 ✅ | ❌ 🟡 | WebSite, OnlineStore | No og:image |
| /blog | 200 | 23 ✅ | 100 ✅ | ✅ | 1 ✅ | ❌ 🟡 | WebSite, OnlineStore | No og:image, no Article schema |
| /shipping-policy | 200 | 23 ✅ | 97 ✅ | ❌ 🔴 | 1 ✅ | ✅ | WebSite, OnlineStore | No canonical |
| /return-policy | 200 | 34 ✅ | 114 ✅ | ❌ 🔴 | 1 ✅ | ✅ | WebSite, OnlineStore | No canonical |
| /privacy-policy | 200 | 22 ✅ | 94 ✅ | ❌ 🔴 | 1 ✅ | ✅ | WebSite, OnlineStore | No canonical |
| /terms-conditions | 200 | 30 ✅ | 95 ✅ | ❌ 🔴 | 1 ✅ | ✅ | WebSite, OnlineStore | No canonical |
| /track-order | 200 | 19 ✅ | 184 ⚠️ | ❌ 🟡 | 0 🟡 | ✅ | WebSite, OnlineStore | No H1, no canonical, desc is global fallback, noindex intentional |
| /sitemap | 200 | 35 ✅ | 96 ✅ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | — |
| /routine | 200 | 63 ⚠️ | 176 ⚠️ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | Title long, desc long |
| /concerns | 200 | 51 ✅ | 56 ✅ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | — |
| /origins | 200 | 22 ✅ | 103 ✅ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | — |
| /ingredients | 200 | 51 ✅ | 183 ⚠️ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | Desc long |
| /category/sunscreen | 200 | 38 ✅ | 160 ✅ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | No ItemList schema |
| /category/face-cleansers | 200 | 43 ✅ | 160 ✅ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | No ItemList schema |
| /category/serums-ampoules-essences | 200 | 60 ✅ | 160 ✅ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | No ItemList schema |
| /category/korean-beauty | 200 | 42 ✅ | 160 ✅ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | No ItemList schema |
| /category/japanese-beauty | 200 | 44 ✅ | 165 ⚠️ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | Desc long |
| /category/makeup-cosmetics | 200 | 51 ✅ | 0 🔴 | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | **NO meta description** |
| /category/hair-care | 200 | 38 ✅ | 124 ✅ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | Generic fallback desc |
| /category/bath-body | 200 | 44 ✅ | 160 ✅ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | — |
| /brands/cosrx | 200 | 51 ✅ | 160 ✅ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | No ItemList schema |
| /brands/some-by-mi | 200 | 61 ⚠️ | 170 ⚠️ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | Title long, desc long |
| /brands/cerave | 200 | 53 ✅ | 162 ⚠️ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | Desc borderline |
| /brands/beauty-of-joseon | 200 | 73 ⚠️ | 182 ⚠️ | ✅ | 1 ✅ | ✅ | WebSite, OnlineStore | Title long, desc long |
| /concerns/acne-blemish-care | 200 | 58 ✅ | 205 ⚠️ | ✅ | 1 ✅ | ❌ 🟡 | WebSite, OnlineStore | Desc long, no og:image |
| /concerns/brightening | 200 | 51 ✅ | 193 ⚠️ | ✅ | 1 ✅ | ❌ 🟡 | WebSite, OnlineStore | Desc long, no og:image |
| /concerns/sunscreen | 200 | 49 ✅ | 203 ⚠️ | ✅ | 1 ✅ | ❌ 🟡 | WebSite, OnlineStore | Desc long, no og:image |
| /ingredients/niacinamide | 200 | 51 ✅ | 157 ✅ | ✅ | 1 ✅ | ❌ 🟡 | WebSite, OnlineStore | No og:image |
| /ingredients/hyaluronic-acid | 200 | 55 ✅ | 160 ✅ | ✅ | 1 ✅ | ❌ 🟡 | WebSite, OnlineStore | No og:image |
| /routine/cleanser | 200 | 54 ✅ | 146 ✅ | ✅ | 1 ✅ | ❌ 🟡 | WebSite, OnlineStore | No og:image |
| /routine/sunscreen | 200 | 56 ✅ | 145 ✅ | ✅ | 1 ✅ | ❌ 🟡 | WebSite, OnlineStore | No og:image |
| /shop/cosrx-acne-pimple-master-patch-24-patch | 200 | 42 ✅ | 132 ✅ | ✅ | 1 ✅ | ✅ | Product, BreadcrumbList, FAQPage | No aggregateRating (no reviews in Woo) |
| /shop/cosrx-advanced-snail-92-all-in-one-cream100g | 200 | 35 ✅ | 115 ✅ | ✅ | 1 ✅ | ✅ | Product, BreadcrumbList, FAQPage | — |
| /shop/the-ordinary-niacinamide-10-zinc-1-30ml | 200 | 54 ✅ | 129 ✅ | ✅ | 1 ✅ | ✅ | Product, BreadcrumbList, FAQPage | — |

---

### 🔴 CRITICAL — Fix Immediately

1. **Homepage H1 is dynamic promotional text.** Current H1 = "AESTURA Atobarrier is here" — a rotating hero banner headline. Google treats H1 as the strongest on-page keyword signal. A promotional product name is not a brand/category keyword. Fix: add a stable, visually hidden or above-fold brand H1 (`Emart Skincare Bangladesh` or equivalent) that doesn't rotate. The hero banner CTA text can stay as-is.

2. **7 static pages have no canonical tag** — `our-story`, `authenticity`, `shipping-policy`, `return-policy`, `privacy-policy`, `terms-conditions`, `track-order`. These use `export const metadata = { title: '...' }` with no `alternates: { canonical }`. Without a self-referencing canonical, Google may canonicalize to a different URL variant (with trailing slash, with query params, etc.). Fix: add `alternates: { canonical: absoluteUrl('/PAGE-SLUG') }` to each page's metadata export.

3. **`/category/makeup-cosmetics` has NO meta description.** Rank Math has no value stored for this category, and the fallback produces an empty string. Google auto-generates a snippet — usually poor quality for a commercial page. Fix: write an editorial description in Rank Math WP admin OR add a hardcoded fallback in the category page `generateMetadata`.

4. **Homepage and `/shop` have no og:image tag.** Social shares from these two high-traffic pages show no preview image on Facebook/WhatsApp/LinkedIn. The global layout sets `og:image` but page-level `openGraph` blocks override it without re-declaring `images`. Fix: add `images: [{ url: absoluteUrl('/wp-content/uploads/2026/03/logo.png'), width: 600, height: 600 }]` to the homepage and `/shop` page metadata.

---

### 🟡 MEDIUM — Fix This Sprint

5. **Concerns, ingredients, and routine pages all missing og:image.** Affects 7+ page types: `/concerns/[slug]`, `/ingredients/[slug]`, `/routine/[step]`. The `openGraph` metadata block in each `generateMetadata` function has `title`, `description`, `url` but no `images`. Fix: add a shared fallback og:image (e.g. the hero products image) to each of these `generateMetadata` functions.

6. **`/faq` and `/blog` missing og:image.** Same issue — their `openGraph` blocks in static metadata don't include `images`.

7. **Title too long on 7 pages (Google truncates at ~60 chars).** Affected: `/` (74), `/new-arrivals` (72), `/routine` (63), `/brands/beauty-of-joseon` (73), `/brands/some-by-mi` (61), `/sale` (61), `/brands/some-by-mi` (61). These display as truncated in SERPs with "…". Trim titles to ≤60 chars.

8. **Meta description too long on 14+ pages (Google truncates at ~160 chars).** Most affected: `/concerns/acne-blemish-care` (205), `/concerns/sunscreen` (203), `/concerns/brightening` (193), `/shop` (187), `/` (184), `/track-order` (184), `/ingredients` (183), `/beauty-of-joseon` (182), `/sale` (180), `/routine` (176), `/new-arrivals` (173). Trim all to ≤155 chars.

9. **No ItemList/CollectionPage schema on category, brand, concern, ingredient, or routine listing pages.** Google uses `ItemList` schema for carousel-style rich results on collection pages. Currently all these pages only have the sitewide `WebSite`+`OnlineStore` schema from the layout. Fix: add `ItemList` with the first 10 products (id, name, url, image) to category, brand, concern, ingredient, and routine listing pages.

10. **No Article/BlogPosting schema on `/blog` or individual blog posts.** Blog listing and posts only carry the sitewide schema. Fix: add `Article` or `BlogPosting` schema to blog posts in `blog/[slug]/page.tsx`.

11. **`/track-order` has no H1.** The page has a form but no heading. Even a non-indexed page benefits from structure — and if this page were accidentally indexed it would look thin. Fix: add `<h1>Track Your Order</h1>` and a proper page-specific meta description.

12. **`/category/hair-care` uses generic fallback description** ("Buy original Hair Care skincare in Bangladesh at Emart. Shop authentic products with COD, fast delivery, and trusted prices."). This is a template string with no editorial value. Fix: write an editorial description in Rank Math WP admin for the hair-care category.

---

### 🟢 LOW / Enhancements — Backlog

13. **No hreflang declared.** Site serves `lang="en-BD"` but has no `<link rel="alternate" hreflang="en-BD">` tag. Low priority since there's no Bengali-language alternate version, but worth noting for future.

14. **`/brands` page has no H2.** The brand grid has H1 but no section headings. Minor structure gap — adding H2s for brand alphabet or featured brands would help crawler comprehension.

15. **`/sale` and `/new-arrivals` have no H2.** Product grids but no section headings. Same structural note.

16. **`/brands` page is 785KB.** Largest page in the crawl. Consider lazy-loading brand images or paginating the brand list.

---

### Schema Coverage Map

| Page type | @types present | Missing / opportunity |
|-----------|---------------|----------------------|
| Homepage | WebSite, OnlineStore, Organization | og:image in page metadata |
| Product (PDP) | Product, BreadcrumbList, FAQPage, WebSite, OnlineStore | AggregateRating (needs Woo review data) |
| Category | WebSite, OnlineStore | **ItemList** (collection carousel) |
| Brand | WebSite, OnlineStore | **ItemList** (collection carousel) |
| Concern | WebSite, OnlineStore | **ItemList**, og:image |
| Ingredient | WebSite, OnlineStore | **ItemList**, og:image |
| Routine step | WebSite, OnlineStore | **ItemList**, og:image |
| Blog listing | WebSite, OnlineStore | og:image |
| Blog post | WebSite, OnlineStore | **Article/BlogPosting** |
| FAQ page | WebSite, OnlineStore | FAQPage ✅ (added 2026-05-16) |
| Static pages | WebSite, OnlineStore | canonical ✅ needed for 7 pages |

---

### Duplicate / Thin Content Flags

| Page | Words | Issue |
|------|-------|-------|
| /track-order | 475w | No H1, no canonical, desc is global fallback |
| /skin-quiz | 562w | Acceptable (interactive tool) |
| /concerns | 609w | OK for hub page |
| /our-story | 711w | OK but no canonical |
| /shipping-policy | 716w | OK but no canonical |

No true thin-content pages found. All public indexable pages exceed 300 words of real content.

---

### Redirect Chain Map

No redirect chains detected. All tested redirects resolve in exactly 1 hop:
- `http://` → `https://` (1 hop) ✅
- `www.` → non-www (1 hop) ✅
- `/product/slug` → `/shop/slug` (1 hop) ✅

---

### Sitemap Issues

- 4,167 URLs total — healthy
- No `/product-category/` or `/product/` (WP-style) URLs present ✅
- Sitemap uses real per-product `date_modified` from WooCommerce `lastmod` ✅
- `/sitemap.xml` advertised in robots.txt ✅
- Rank Math and WP sitemaps blocked in robots.txt ✅

No sitemap issues found.

---

### Robots.txt Issues

No issues found. Key rules verified:
- `Disallow: /api/` — correct (BFF routes not for crawlers) ✅
- `Disallow: /wp-json/` — correct ✅
- `Disallow: /*?srsltid=` — correct (blocks tracking params) ✅
- `Disallow: /*?orderby=`, `/*?per_page=` etc. — correct (blocks filter variants) ✅
- `Sitemap: https://e-mart.com.bd/sitemap.xml` — present ✅
- GPTBot, ClaudeBot, PerplexityBot, Google-Extended — all allowed ✅
- CCBot, Bytespider — blocked ✅

---

### Priority Fix Order for Next Sprint

1. Homepage H1 (rotating promo → stable brand keyword) — **highest SEO impact**
2. Add canonical to 7 static pages — **5-minute code change, prevents GSC canonical issues**
3. Add og:image to homepage, /shop, concerns, ingredients, routine, /faq, /blog — **social sharing fix**
4. /category/makeup-cosmetics meta description — **WP admin, 2 minutes**
5. Trim 14 over-length descriptions to ≤155 chars — **mostly WP admin edits**
6. Trim 7 over-length titles to ≤60 chars
7. Add ItemList schema to category/brand/concern/ingredient/routine pages
8. Add Article schema to blog posts
