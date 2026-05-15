# Emart SEO Master Task List

Last updated: 2026-05-15
Owner: Claude (code + data fixes) | Owner decision needed where marked
Source audit: `workspace/audit/active/e-mart-master-technical-seo-image-crawler-audit-20260515.md`

---

## ✅ DONE (this session + prior work)

| Task | Completed | Notes |
|------|-----------|-------|
| All GSC P2 redirects (j-beauty, korean-skincare-routine, about-us-3, faq-FAQ etc.) | 2026-05-15 | `next.config.js` |
| Near-empty categories removed from sitemap (general-health, shampoo, hair-essence-serum) | 2026-05-15 | `sitemapEntries.ts` |
| Sitemap REST fallback now mirrors GraphQL exclusion rules | 2026-05-15 | `sitemapEntries.ts` |
| Raw IP `5.189.188.229` removed from `remotePatterns` | 2026-05-15 | `next.config.js` |
| Header logo `priority` removed (was competing with LCP on every route) | 2026-05-15 | `Header.tsx` |
| Font weights reduced (7 fewer font file requests) | 2026-05-15 | `layout.tsx` |
| HomepageSections dynamic imports (deferred 1,034-line client bundle) | 2026-05-15 | `page.tsx` |
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

### H1: `DetailsTabs` — render all tab content in initial HTML
- **Why:** Ingredients, how-to-use, benefits currently only render the active tab. LLMs and lightweight crawlers miss the rest.
- **Files:** `apps/web/src/app/shop/[slug]/page.tsx:651-655`, `apps/web/src/components/product/DetailsTabs.tsx:47-69`
- **Fix:** Server-render all panels; hide inactive ones with `hidden` CSS class, not conditional rendering. No UI change.
- **Effort:** Medium | **Risk:** Low | **Owner:** Claude

### H2: `aria-hidden` focusability on homepage mobile rails
- **Why:** Lighthouse flags focusable links/buttons inside `aria-hidden="true"` containers — accessibility failure + DOM bloat.
- **Files:** `apps/web/src/components/home/HomepageSections.tsx` (mobile duplicate rail sections)
- **Fix:** Either remove `aria-hidden` from containers with interactive children, or add `tabIndex="-1"` to all interactive children inside hidden rails.
- **Effort:** Small | **Risk:** Low | **Owner:** Claude

### H3: ProductCard image `priority` on catalog grids
- **Why:** First 4 products on every catalog/category page get `fetchPriority="high"` — multiple competing preloads hurt LCP.
- **Files:** `apps/web/src/components/product/ProductCard.tsx:117`, `apps/web/src/app/shop/page.tsx:245`, `apps/web/src/app/category/[slug]/page.tsx:236`
- **Fix:** Pass `priority` only on the single confirmed LCP image (first product, first page, above fold). Remove from cards 2-4.
- **Effort:** Small | **Risk:** Low | **Owner:** Claude

---

## 🟡 MEDIUM — Schedule

### M1: `MerchantReturnPolicy` schema + `priceValidUntil` real dates
- **Why:** Product schema has `priceValidUntil` as current date + 365 (artificial). No `MerchantReturnPolicy`. Merchant Center eligibility risk.
- **Files:** `apps/web/src/app/shop/[slug]/page.tsx:98-144`
- **Fix:** Use real Woo sale end date for `priceValidUntil` when available; omit when not. Add `MerchantReturnPolicy` only when a real return policy page exists and is stable.
- **Effort:** Medium | **Risk:** Medium (schema changes affect rich results) | **Owner:** Claude after owner confirms return policy

### M2: Category OG image audit
- **Why:** `/category/sunscreen` was found with an irrelevant old media asset as OG image. Hurts social/AI preview quality.
- **Files:** `apps/web/src/app/category/[slug]/page.tsx:94-103`
- **Fix:** Audit category OG images; replace stale/irrelevant ones with a relevant category image or default storefront social image.
- **Effort:** Small (code) + data review | **Risk:** Low | **Owner:** Claude + owner provides images

### M3: Fresh product SEO / image data audit
- **Why:** Last audit was 2026-05-13 (before SKU/origin/copy fixes). 16 products still need real images. 155 size-not-matched price rows pending.
- **Files:** `workspace/products-need-real-image.csv`, `workspace/scripts/active/product-seo-audit.php`
- **Fix:** Run `product-seo-audit.php` fresh (read-only). Review output before any mutations.
- **Effort:** Read-only run: small. Fixes: depends on output. | **Owner:** Claude runs audit, owner approves data fixes

### M4: SKU gap fixes — 119 missing SKUs
- **Why:** 119 published products have no `_sku`. Affects Merchant Center product matching.
- **Files:** `workspace/scripts/active/product-sku-audit-dry-run.php`
- **Fix:** Re-run audit for fresh count (prior work may have reduced this). Owner assigns SKUs before apply.
- **Effort:** Small | **Risk:** Low | **Owner:** Awaiting owner SKU data

### M5: pa_concern + pa_skin_type assignment
- **Why:** Concern/skin-type taxonomy dry-run script is ready but never applied. Affects concern filter pages and product discovery.
- **Files:** `workspace/scripts/active/pa-concern-skin-type-dry-run.php`
- **Fix:** Review dry-run output, then apply with `APPLY=1`.
- **Effort:** Small (run) | **Risk:** Low (taxonomy only) | **Owner:** Claude after owner reviews dry-run

### M6: Homepage title alignment
- **Why:** Minor inconsistency between current page title and older SEO TODO target format.
- **Files:** `apps/web/src/app/page.tsx:27-38`, `apps/web/src/app/layout.tsx`
- **Fix:** Align page title with approved format. One line change.
- **Effort:** Trivial | **Risk:** Low | **Owner:** Owner confirms preferred title format

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

---

## Owner Decision Needed

| Item | Decision required |
|------|-----------------|
| Return policy page | Does a stable return policy page exist? → enables MerchantReturnPolicy schema (M1) |
| SKU data | Provide SKUs for 119 products → enables M4 |
| pa_concern dry-run review | Approve concern/skin-type assignments → enables M5 |
| Homepage title format | Confirm preferred `<title>` format → enables M6 |
| Cloudflare cache rule | Set in dashboard for `/shop` and `/category/*` → L4 |
| Google-Extended | Allow or block in robots.ts → L1 |
