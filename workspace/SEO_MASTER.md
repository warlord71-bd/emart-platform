# Emart SEO Master — Source of Truth

**Last verified:** 2026-05-19 (live curl audit, 40+ URLs)
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
- pa_concern + pa_ingredient + pa_skin_type assigned ✅
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

---

## 🔴 OPEN — Critical

### C2: Homepage title is 70 chars (Google truncates at ~60)
**Verified:** Title = "Emart Skincare Bangladesh | Authentic Korean, Japanese & Global Beauty" → 70 chars
**Impact:** Displays as truncated in SERPs: "Emart Skincare Bangladesh | Authentic Korean, Japa…"
**Note:** Title format was approved by owner 2026-05-16. Trimming requires owner re-approval.
**Fix options:** "Emart | Authentic Korean & Japanese Skincare Bangladesh" (55 chars) or "Emart Skincare Bangladesh | Korean & Global Beauty" (50 chars)
**Owner decision required before touching.**

---

## 🟡 OPEN — Medium

### M4: FAQ answer quality — top products use templated answers
**Evidence:** Multiple products return generic "Apply as directed for this product type…" answers
**Impact:** FAQPage schema present but thin answers reduce rich-result quality score
**Fix:** Re-generate FAQ for top 200 SKUs using product-specific inputs. Verify first 10 manually before bulk run.
**Effort:** Large — Codex task (prompt written, ready to run)
**Owner:** Confirm approach before Codex starts

### M6: Long-form content on ingredient + concern pages
**Current state:** ~600–900 word product grids with short intro
**Gap:** No educational H2 sections (what is it, how it works, Bangladesh climate, FAQ)
**Impact:** Biggest content gap vs Shajgoj on informational queries
**Fix:** Generate 1,500–2,000 word blocks per page. Store as static JSON. Verify niacinamide + hyaluronic-acid first.
**Effort:** Large — Codex task (prompt written, ready to run)
**Owner:** Confirm LLM approach and review process before starting

---

## 🔵 OPEN — Needs Owner Decision Before Starting

### O1: `/origins/[country]` editorial content
C3 routes are live (200 ✅). Each country page currently shows products only.
South Korea + Japan need 600+ word intro copy for K-Beauty / J-Beauty angle.
**Priority:** South Korea first (largest catalog), then Japan.

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

## Schema Coverage Map (live-verified 2026-05-19)

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
| Blog listing | WebSite, OnlineStore | Blog/ItemList (M1) |
| Blog post | Article | — |
| /new-arrivals | WebSite, OnlineStore | CollectionPage, ItemList (M2) |
| /sale | WebSite, OnlineStore | CollectionPage, ItemList (M2) |
| /origins | WebSite, OnlineStore | CollectionPage (M2) + sub-routes (C3) |
| /track-order | WebSite, OnlineStore | H1 (C1) |

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
1. C1  — /track-order H1 (10 min, code)
2. C3  — /origins/[country] routes (half day, code)  ← discuss with owner first
3. M1  — /blog listing schema (15 min, code)
4. M2  — /new-arrivals + /sale + /origins schema (30 min, code)
5. M5  — hreflang x-default (15 min, code)
6. C2  — Homepage title trim (owner must approve new title first)
7. M4  — FAQ quality regeneration (large, plan separately)
8. M6  — Ingredient/concern long-form content (large, plan separately)
9. O1–O4 — New page types (owner decision required)
```
