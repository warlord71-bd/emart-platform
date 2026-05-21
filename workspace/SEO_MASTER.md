# Emart SEO Master — Source of Truth

**Last verified:** 2026-05-21 (live curl audit + meta tag spot-checks)
**Owner:** Claude (code) + Warlord (content/business decisions)
**Rule:** This file is the single SEO source of truth. Update it when items close or new gaps are confirmed live. Do not update based on AI analysis alone — verify with curl before changing status.

---

## ✅ CONFIRMED DONE — Do Not Revisit

All items below are verified working on the live site as of 2026-05-19.

### Technical Foundation
- HTTPS, www→non-www 301, HTTP→HTTPS 301 ✅
- No redirect chains — all resolve in 1 hop ✅
- HSTS preload, CSP, X-Frame-Options DENY ✅
- robots.txt — blocks private routes, allows Googlebot/LLMs, blocks CCBot/Bytespider ✅
- Sitemap at 4,167 URLs — products/brands/categories/concerns/ingredients/blog/routine ✅
- ISR: product pages `x-nextjs-cache: HIT`, category pages `cf-cache-status: HIT` ✅

### Metadata & Canonicals
- Canonical on all tested pages including our-story, authenticity, shipping-policy, return-policy, privacy-policy, terms-conditions ✅
- Title format correct on home, shop, product, category, brand, concern, ingredient pages ✅
- og:image present on home, shop, all category/concern/ingredient/routine/faq/blog pages ✅
- og:type=product on product pages (fixed 2026-05-19) ✅
- Private routes noindex + no-store (checkout, account, wishlist, track-order) ✅
- Homepage H1 stable brand text — not rotating promo (confirmed live) ✅
- makeup-cosmetics meta description present (189 chars — long but present) ✅

### Schema
- Product pages: Product + BreadcrumbList + FAQPage JSON-LD ✅
- Product schema: SKU, GTIN (if numeric), MPN=SKU fallback, priceValidUntil +1yr (fixed 2026-05-19) ✅
- Product schema: aggregateRating only when real Woo reviews exist — correct behaviour ✅
- MerchantReturnPolicy (7-day, BD, FreeReturn, ReturnByMail) ✅
- OfferShippingDetails with handlingTime + transitTime ✅
- FAQPage on /faq page ✅
- Category/brand/concern/ingredient/routine pages: CollectionPage + ItemList + BreadcrumbList ✅
- Blog posts: Article schema ✅
- WebSite + OnlineStore + Organization on all pages via layout ✅

### Content & Data
- All 3,564 products have `_rank_math_description` meta ✅
- Brand taxonomy + pa_origin assigned for 3,641 products ✅
- Wrong "Korea import" copy cleaned across catalog ✅
- Sale prices cleared catalog-wide ✅
- SKU gaps fixed (0 missing, 0 duplicate) ✅
- pa_concern + pa_ingredient + pa_skin_type assigned ✅ (pa_ingredient + pa_skin_type done; pa_concern PARTIALLY done — 2,235/3,641 have concern as of 2026-05-21, 1,406 still missing)
- Lint enforced in production builds ✅
- Category/brand page descriptions no longer truncated — `line-clamp-2` removed ✅
- Authentic badge hidden on mobile (was leaking through filter reindex) ✅
- og:type=product on all product pages ✅
- priceValidUntil +1yr rolling date on all Offer schema ✅
- MPN=SKU fallback on all Product schema (Google Shopping identifier) ✅
- `/origins/[country]` dynamic routes live — 22 country pages, all 200 ✅
- `/origins?country=X` → `/origins/X` 301 redirect via Nginx ✅
- 22 origin slugs added to sitemap (4,167 → 4,205 URLs) ✅
- `/blog` listing: Blog + BlogPosting JSON-LD schema ✅
- `/new-arrivals`: CollectionPage JSON-LD schema ✅
- `/sale`: CollectionPage JSON-LD schema ✅
- `/track-order`: sr-only H1 + proper metadata description ✅
- Hreflang x-default + en-BD on homepage via alternates.languages ✅
- /about-us E-E-A-T page live: Organization + Person JSON-LD, credentials, address, trust signals ✅ (2026-05-20)
- /faq page: export metadata (title, description, canonical, OG) added ✅ (2026-05-20)
- Blog title: "Skincare Guides & Tips | Emart Skincare Bangladesh" ✅ (2026-05-21)
- /our-story og:image: store-interior.webp 923×671 — no longer falls back to 600×600 logo ✅ (2026-05-21)
- Concerns + ingredients pages: page-specific keywords (was identical generic keywords on all pages) ✅ (2026-05-21)
- Concerns + ingredients pages: googleBot directives restored (were dropped by robots override) ✅ (2026-05-21)
- Global generic keywords removed from layout.tsx — were cascading identically to all pages ✅ (2026-05-21)
- Category taxonomy cleanup: deprecated categories fully emptied (skincare-essentials 0, k-beauty-j-beauty 0, shop-by-concern 0) ✅ (2026-05-21)
- korean-beauty: 2,118 products (was 1,394); japanese-beauty: 105 (was 78) — correct origin assignment ✅ (2026-05-21)
- All 31 category redirects verified live; 4 broken fixed (/product-category/skincare/j-beauty-skincare, /korean-skincare-routine, 2 two-hop chains) ✅ (2026-05-21)
- ISR cache: product pages now emit s-maxage=3600 (was incorrectly capped at 300 by unstable_cache) ✅ (2026-05-21)
- Category SEO overrides: top-10 categories have explicit titles + 140-160 char descriptions ✅ (2026-05-20)
- Soothing Gel: new category page + nav entry + SEO intro ✅ (2026-05-21)
- Homepage title: "Emart Skincare Bangladesh | Korean & Global Beauty" — 50 chars ✅ (2026-05-21)

---

## 🔴 OPEN — Critical

### C_CONCERN: pa_concern — HIGH+MED applied, LOW+SKIP awaiting manual review
**Updated 2026-05-21:** 2,235 → **2,480** products now have pa_concern (68%).
**Applied:** 245 products (HIGH:1 MED:244) × 376 concern assignments. Rollback: `pa-concern-rollback-20260521-174257.sql`
**Post-apply concern counts:** dryness-hydration:787, acne-blemish:529, sensitivity:435, anti-aging-repair:353, hyperpigmentation:346, brightening:338, sunscreen:306, wrinkle:295, pores-blackheads:234
**Remaining gap:** ~1,161 products still without concern — manual review CSV ready:
  `workspace/audit/active/pa-concern-manual-review-20260521-174247.csv` (1,161 rows)
  — 353 LOW-confidence rows: concern already suggested, just approve/change/skip
  — 603 no-signal rows (korean-beauty only, no sub-category): suggestion column filled
  — 205 confirmed SKIP (hair/makeup/non-skin): keep as SKIP or override
**How to apply reviewed rows:** edit `review_action` column → APPROVE, then run `pa-concern-apply.py` on filtered CSV
**Logic note:** korean-beauty alone is NOT used as a concern signal — products only in that category need manual assignment or a specific sub-category.

### ~~C2: Homepage title trim~~ ✅ DONE
Title = "Emart Skincare Bangladesh | Korean & Global Beauty" — 50 chars, verified live 2026-05-21.

---

## 🟡 OPEN — Medium

### M4: FAQ answer quality — top products use templated answers
**Evidence:** Multiple products return generic "Apply as directed for this product type…" answers
**Impact:** FAQPage schema present but thin answers reduce rich-result quality score
**Fix:** Re-generate FAQ for top 200 SKUs using product-specific inputs. Verify first 10 manually before bulk run.
**Storage/rendering:** Product FAQs are stored in Woo post meta `_emart_product_faq`; frontend reads that meta in `apps/web/src/app/shop/[slug]/page.tsx` and renders the same content as visible FAQ + FAQPage JSON-LD. Do **not** store product FAQs in ingredient/concern page files.
**Generation inputs required:** product name, brand, categories, ingredients (`_emart_ingredients`, Woo ingredient meta, or product attributes), skin type tags, concern tags, how-to-use (`_emart_how_to_use` or short description), origin, size, price, and current product URL.
**Output contract:** exactly 5 Q/A pairs, mixed English + Bangla, product-specific, no delivery/COD/site-policy answers, no unsupported medical claims, no invented benefits. Include authenticity, use-case, how-to-use, skin-type fit, and caution/who-should-avoid themes.
**Execution notes for Claude Code:** Use OpenRouter credentials from local secure credential file if LLM generation is needed, but never commit credentials/API keys. WordPress/Woo/local DB credentials may exist on the VPS; read them from secure local config only, never copy them into scripts, logs, reports, or commits.
**Verification gate:** Generate a review report for top 10 first, manually inspect for product specificity, then apply top 10 only. If approved, generate/apply top 200. Remaining catalog is a separate sprint.
**Effort:** Large — Woo meta mutation task; dry-run/review/apply required.
**Owner:** Confirm top-10 review output before any bulk apply.

### M6: Ingredient + concern education content refinement
**Updated 2026-05-21:** Initial long-form blocks already exist and render above product grids.
**Current state:**
- 15 ingredient pages have `apps/web/src/data/ingredient-content.json` entries, ~1,560 words each, 6 H2 sections + 5 FAQs.
- 9 concern pages have `apps/web/src/data/concern-content.json` entries, ~1,500 words each, 6 H2 sections + 5 FAQs.
- Frontend renders them through `EducationContent` in `apps/web/src/app/ingredients/[slug]/page.tsx` and `apps/web/src/app/concerns/[slug]/page.tsx`.
**Remaining gaps:**
- FAQ content is visible but ingredient/concern pages do **not** emit FAQPage JSON-LD for those education FAQs yet.
- Content is too templated across pages; it needs more ingredient/concern-specific detail and safer factual nuance.
- Ingredient pages currently have 0 internal links in the education copy.
- Concern pages currently have only ~3 ingredient links and 0 routine links; target is at least 5 ingredient links + 3 routine-step links where natural.
**Fix:** Refinement sprint, not a fresh build. First update `niacinamide`, `hyaluronic-acid`, `acne-blemish-care`, and `dryness-hydration`; add FAQPage JSON-LD; improve internal links and reduce templated phrasing. Review live before bulk-updating the remaining pages.
**Effort:** Medium-large — content + small schema render patch.
**Owner:** Warlord review required after first 4 pages before bulk.

---

## 🔵 OPEN — Needs Owner Decision Before Starting

### O1: `/origins/[country]` editorial content
Routes/indexing are already handled: `/origins/[country]` pages are live, sitemap includes origin URLs, and `/origins?country=X` redirects to `/origins/X` per 2026-05-21 verification.
**Current content state:** only `south-korea`, `japan`, and `usa` have editorial content in `apps/web/src/lib/origin-editorial.ts`.
**Remaining gap:** Other origin pages are product grids with minimal story/header copy. Add 600+ word country-specific editorial content where the country has meaningful catalog depth.
**Priority:** South Korea/Japan/USA exist; next candidates should be chosen by product count and search value, not a blind 20-country bulk run.
**Owner must:** Confirm final country list before generation.

### O2: Product comparison pages (`/compare/[slug1]-vs-[slug2]`)
**What:** Programmatic comparison pages for high-intent queries ("COSRX vs The Ordinary niacinamide")
**Why:** Bottom-of-funnel intent, Google AI Mode fan-out, internal cross-linking
**Risk:** Mass-generated thin pages can trigger quality penalties. Must be human-reviewed.
**Owner must:** Provide a curated list of 20–30 pairs before any code is written. Verify first 2 before bulk.

### O3: "Best [X] in Bangladesh" listicle pages (`/best/[slug]`)
**What:** 20 high-intent editorial pages ("best sunscreen for oily skin in Bangladesh")
**Why:** Captures informational + commercial queries Shajgoj currently owns
**Risk:** Same as O2 — needs curation and review, not mass generation
**Owner must:** Approve final topic list. Verify first 2 before bulk.

### O4: Skin-type pages (`/skin-type/[slug]`)
**What:** Curated pages for oily / dry / sensitive / combination skin
**Why:** Current skin-type handling lives as `/shop?skin_type=` filter → canonicalizes away
**Risk:** Doorway-page risk if thin. Only build if each page has genuine buying guidance.
**Owner must:** Confirm whether to build. 4 pages max (oily, dry, sensitive, combination).

---

## 🟢 LOW — Backlog (do when convenient)

### L1: Cloudflare cache rule for `/shop` and `/category/*`
Nginx sets `s-maxage` correctly. Cloudflare CDN rule still needs dashboard setup.
**Owner:** Dashboard-only task.

### L2: Critical CSS inlining (`critters`)
Main CSS (94KB / 16.8KB gzipped) blocks first paint on mobile slow-4G.
**Fix:** Add `critters` to Next.js build for above-fold CSS inlining.
**Effort:** Medium | **Risk:** Medium (build complexity)

### L3: `/brands` page is 785KB
Largest page in crawl. Consider lazy-loading brand logos or paginating.
**Effort:** Small

### L4: H2s missing on `/brands`, `/sale`, `/new-arrivals`
Minor structure gap. Adding section headings improves crawler comprehension.

### L5: Google-Extended bot policy
Currently allowed. Keep if LLM discoverability is wanted; block in robots.ts if not.
**Owner:** Business decision.

### L6: Blog content volume
**The real Shajgoj gap.** They have 400+ Bangla articles; we have 31.
This cannot be solved in a sprint — requires a sustained content calendar.
**Owner:** Content roadmap decision. Claude can assist with outlines and drafts on request.

---

## Schema Coverage Map (live-verified 2026-05-21)

| Page type | Schema present | Still missing |
|---|---|---|
| Homepage | WebSite, OnlineStore, Organization | — |
| Product (PDP) | Product, BreadcrumbList, FAQPage | AggregateRating (needs real Woo reviews) |
| Category | CollectionPage, ItemList, BreadcrumbList | — |
| Brand | CollectionPage, ItemList, BreadcrumbList | — |
| Concern | CollectionPage, ItemList, BreadcrumbList | — |
| Ingredient | CollectionPage, ItemList, BreadcrumbList | — |
| Routine step | CollectionPage, ItemList, BreadcrumbList | — |
| /faq | FAQPage | — |
| /about-us | Organization, Person | — |
| Blog listing | Blog, BlogPosting JSON-LD ✅ | — |
| Blog post | Article | — |
| /new-arrivals | CollectionPage, ItemList ✅ | — |
| /sale | CollectionPage, ItemList ✅ | — |
| /origins | WebSite, OnlineStore | CollectionPage per country page |
| /track-order | WebSite, OnlineStore | sr-only H1 exists |

---

## What Opus / Other AI Got Wrong (2026-05-19)

Record of AI analysis that was inaccurate — for reference when evaluating future AI SEO audits.

| Opus claim | Reality |
|---|---|
| og:type=website on product pages | Already fixed before Opus ran |
| priceValidUntil missing | Already fixed |
| GTIN/MPN missing | Already fixed |
| No aggregateRating handling | Correct as-is — omitting on zero-review products is right |
| Article schema missing on blog | Already implemented |
| ItemList schema missing | Already implemented on all collection pages |
| Homepage H1 rotating | Already fixed — stable brand H1 |
| 7 static pages no canonical | All canonicals present |
| Homepage/shop no og:image | Both have og:image |
| makeup-cosmetics no meta desc | Has a description |
| og:image missing on concerns/ingredients | All have og:image |
| References `/srv/hgc/memory-kit/` | Path does not exist on this VPS |
| References LLM pool at `/srv/hgc/ops/` | Does not exist on this VPS |
| "Next.js 15 at /var/www/wordpress" | Wrong path and wrong version |

**Lesson:** Always verify with curl before acting on AI SEO audits. This file's findings are curl-verified.

---

## Priority Order for Next Work Session

```
1. C_CONCERN — pa_concern manual-review apply (~1,161 products remain; use current review CSV only)
2. M4        — Product FAQ quality regeneration (top 10 review gate, then top 200)
3. M6        — Ingredient/concern education refinement + FAQPage JSON-LD + internal links
4. O1        — /origins/[country] editorial expansion for selected high-value countries
5. O2–O4     — New page types (owner decision required)
6. L2        — Critical CSS inlining (critters, medium effort)
7. L3        — /brands page 785KB size reduction
8. L4        — H2s missing on /brands, /sale, /new-arrivals
```

Already complete since 2026-05-19 audit:
- Blog title, og:images, googlebot, keywords, category cleanup, ISR fix, redirects, E-E-A-T page, category SEO
