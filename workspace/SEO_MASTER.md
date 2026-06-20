# Emart SEO Master — Source of Truth

**Last verified:** 2026-06-20 (live SEO/AEO deploy gate: sitemap, robots, LLM docs/link freshness, IndexNow, representative PDP/category/concern/ingredient/blog metadata + JSON-LD)
**Owner:** Claude (code) + Warlord (content/business decisions)
**Rule:** This file is the single SEO source of truth. Update it when items close or new gaps are confirmed live. Do not update based on AI analysis alone — verify with curl before changing status.

---

## 🧭 STANDING CONSIDERATION — GEO & AEO (added 2026-06-10)

Most Bangladesh traffic is mobile, and Android's default search (Google) increasingly surfaces **AI Overviews / Gemini answers** before organic links. Keep both of these in mind on every SEO/content task, not just "Open" items:

- **GEO (Generative Engine Optimization)** — optimizing so AI systems (Google AI Overviews, ChatGPT, Perplexity, Gemini) cite/summarize Emart content. Favors: complete `Product`/`FAQPage`/`Article`/`Organization` schema, clear definition-first sentences, factual specificity (sizes, ingredients, prices, origin), clean labeled sections (How to use / Ingredients / Suitable for).
- **AEO (Answer Engine Optimization)** — optimizing for direct-answer surfaces (featured snippets, "People Also Ask", voice search). Favors: concise direct-answer paragraphs near the top of a section, FAQPage schema (already on PDPs, 5 Qs/product), short How-to/step lists.
- **Practical defaults going forward:**
  - Every new content type (blog, ingredient/concern pages, future `/best/*` or `/compare/*`) should ship with appropriate schema (`Article`/`FAQPage`/`HowTo`) from day one — not retrofitted.
  - Avoid generic AI-boilerplate phrasing (see blog_generator.py `ANTI_AI_RULES`) — both Google's helpful-content system and AI citation models deprioritize templated filler.
  - Blog topic selection should weigh GSC query data + TikTok/Facebook/YouTube trending K-beauty/skincare topics in Bangladesh, not just evergreen SEO keywords.
  - `robots.ts` currently allows Google-Extended/AI crawlers (see L5) — keep allowed unless owner decides otherwise, since blocking removes GEO citation opportunities.

---

## ✅ CONFIRMED DONE — Do Not Revisit

All items below are verified working on the live site as of 2026-05-19.

### Technical Foundation
- HTTPS, www→non-www 301, HTTP→HTTPS 301 ✅
- No redirect chains — all resolve in 1 hop ✅
- HSTS preload, CSP, X-Frame-Options DENY ✅
- robots.txt — blocks private routes, allows Googlebot/LLM crawlers including CCBot, blocks bulk scrapers like Bytespider/cohere-ai ✅
- Sitemap at 4,205 URLs — products/brands/categories/concerns/ingredients/blog/routine/origins ✅
- `/llms.txt`, `/llms-full.txt`, and `/agents.md` live with canonical-link freshness validation in every deploy ✅
- IndexNow product/category revalidation submission verified accepted (HTTP 200) ✅
- `deploy.sh` blocks push unless the live SEO/AEO gate passes representative metadata, canonical, schema, Product offer, sitemap, robots, and LLM-document checks ✅
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
- Product schema: Review + aggregateRating only when real Woo reviews exist — correct behaviour ✅
- MerchantReturnPolicy (7-day, BD, FreeReturn, ReturnByMail) ✅
- OfferShippingDetails with handlingTime + transitTime ✅
- FAQPage on /faq page ✅
- Category/brand/concern/ingredient/routine pages: CollectionPage + ItemList + BreadcrumbList ✅
- Blog posts: Article schema ✅
- WebSite + OnlineStore + Organization on all pages via layout ✅

### Content & Data
- 3,625/3,625 published products have `_rank_math_description` meta; full validator clean 0/3,625 flagged ✅
- Brand taxonomy + pa_origin assigned for 3,624/3,625 published products ✅
- Wrong "Korea import" copy cleaned across catalog ✅
- Sale prices cleared catalog-wide ✅
- SKU gaps fixed (0 missing, 0 duplicate) ✅
- Product taxonomy assignment is partial, but only skincare-applicable products should be completed: pa_concern 2,541/3,625 total catalog with 279 skincare-like rows held for review; pa_ingredient 1,084/3,625 total catalog; pa_skin_type 28/3,625 total catalog as of 2026-06-20. Makeup, hair, tools/accessories, supplements, and other non-skincare should remain blank unless owner explicitly overrides.
- Lint enforced in production builds ✅
- Category/brand page descriptions no longer truncated — `line-clamp-2` removed ✅
- Authentic badge hidden on mobile (was leaking through filter reindex) ✅
- og:type=product on all product pages ✅
- priceValidUntil +1yr rolling date on all Offer schema ✅
- MPN=SKU fallback on all Product schema (Google Shopping identifier) ✅
- `/origins/[country]` dynamic routes live — 22 country pages, all 200 ✅
- `/origins?country=X` → `/origins/X` 301 redirect via Nginx ✅
- 22 origin slugs added to sitemap (4,167 → 4,205 URLs) ✅
- `/category/moisturizer` and `/category/moisturizers` redirect to `/category/cream-moisturizer`; old COSRX mini PDP alias redirects to canonical PDP ✅ (2026-05-21, commit 559549d)
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
- PDP ingredient/how-to-use tabs: `DetailsTabs.tsx` now uses `useLayoutEffect` + `hydrated` state — all 3 panels (description, ingredients, how-to-use) in SSR HTML, Google can index all tab content ✅ (2026-05-23, commit 221dae3)

---

## 🔴 OPEN — Critical

### C_CONCERN: pa_concern — HIGH+MED applied, LOW+SKIP awaiting manual review
**Updated 2026-06-20:** **279 skincare-like products remain in the pa_concern review queue.** There are 1,084 total published products without pa_concern, but that all-catalog number includes makeup, hair, tools/accessories, supplements, and other non-skincare products that should stay blank. A Qdrant cross-check joined 3,625 product vectors to 2,484 trusted labeled products. The original 487 “skincare” estimate contained false positives caused by broad/malformed categories and generic words (for example hair serum and SPF makeup), so it was not bulk-applied.
**2026-06-20 apply:** 57 high-confidence products / 57 relationships: dryness-hydration 43, sensitivity 8, brightening 4, acne-blemish 1, sunscreen 1. Only explicit title/category/ingredient/skin-type evidence with Qdrant support was accepted; 279 skincare-like rows were held rather than guessed. Review: `workspace/audit/active/pa-concern-qdrant-review-20260620-133206.csv`; rollback: `workspace/audit/active/pa-concern-qdrant-rollback-20260620-133206.json`. Product cache revalidated and all 3,625 Qdrant vectors refreshed.
**Applied:** 245 products (HIGH:1 MED:244) × 376 concern assignments. Rollback: `pa-concern-rollback-20260521-174257.sql`
**Post-apply concern counts:** dryness-hydration:787, acne-blemish:529, sensitivity:435, anti-aging-repair:353, hyperpigmentation:346, brightening:338, sunscreen:306, wrinkle:295, pores-blackheads:234
**Remaining skincare scope:** do not treat all 1,084 products without concern as work. Current review source is the 2026-06-20 Qdrant audit/review output:
  `workspace/audit/active/pa-concern-qdrant-review-20260620-133206.csv`
  — 279 skincare-like rows held for stronger evidence/manual review
  — non-skincare rows should remain intentionally blank unless owner overrides
**How to apply reviewed rows:** edit `review_action` column → APPROVE, then run `pa-concern-apply.py` on filtered CSV
**Logic note:** korean-beauty alone is NOT used as a concern signal — products only in that category need manual assignment or a specific sub-category.

### ~~C2: Homepage title trim~~ ✅ DONE
Title = "Emart Skincare Bangladesh | Korean & Global Beauty" — 50 chars, verified live 2026-05-21.

---

## 🟡 OPEN — Medium

### ~~M7: Sunscreen category page~~ ✅ DONE 2026-06-05
All missing terms added: broad-spectrum, UV rays, UVA/UVB, reapply, outdoor, water-resistant, wrinkles, moisturizer. 350-word intro live. Commit 18499df.

### ~~M8 (resolved — not a real gap)~~
**Evidence:** on-page.ai scan 2026-05-23 — score 68 ("Needs Work"), 1 H2 vs competitor avg 4.3, UV education terms completely absent.
**Missing terms vs ranking competitors:** `rays`, `broad-spectrum`, `water-resistant`, `reapply`, `apply`, `outdoor`, `sunburn`, `uv rays`, `wrinkles`, `moisturizer`.
**Fix:** Expand the category SEO intro for `/category/sunscreen` from its current single-section to 3–4 H2 blocks:
  1. "SPF & UV Protection — What the Numbers Mean" (adds: uv rays, broad-spectrum, UVA/UVB, rays)
  2. "How to Choose Sunscreen for Bangladesh's Climate" (adds: outdoor, summer, apply, reapply)
  3. "Sunscreen for Every Skin Type" (adds: sensitive, oily, moisturizer, water-resistant)
  Intro + 3 H2 blocks keeps it under ~400 extra words — natural content gain, not padding.
**Internal link gap:** `/concerns/sunscreen` page and the blog post on sunscreens should link to `/category/sunscreen` — verify if those links exist before adding.
**Effort:** Small-medium — content edit only, no code change.
**Owner:** Claude can draft; Warlord approves before deploy.
**Freeze status:** Safe — category description copy change, no URL/redirect/sitemap change.

### ~~M8: Homepage Korean keyword~~ ✅ RESOLVED 2026-06-05
on-page.ai scan was wrong. Live HTML has "korean" 27×, "bangladesh" 107×, "authentic" 44×. No action needed. Phrase "Korean skincare Bangladesh" not present. Missing entities: `cosmetics`, `k-beauty products`, `cleansing foam`, `price`, `exfoliate`, `facial`, `regimen`.
**Fix:** In the homepage hero/intro copy or the brand story section, add 1–2 natural sentences that include "Korean skincare" as a phrase and mention "cosmetics" and "K-beauty." Do not keyword-stuff — one well-placed paragraph is enough.
  Example: "Emart brings you the widest selection of authentic Korean skincare and K-beauty products in Bangladesh — from COSRX and Beauty of Joseon to Neutrogena and Japanese skincare."
**Effort:** Tiny — one paragraph edit.
**Freeze status:** Safe — copy edit, no structural change.

### M9: Image count gap — all page types
**Evidence:** All 5 scans show low image counts vs competitors: homepage 2 vs avg 33; sunscreen category 1 vs avg 44; PDPs 10–14 vs avg 23–46.
**Important caveat:** This may be a scan-rendering issue — dynamically-loaded product images (carousels, lazy-loaded grids) may not be counted by the crawler. Verify by checking raw HTML of homepage and category pages with `curl`.
**If real gap:** Product images are already tagged as TASKS item (16 products need real images). More category/brand page images helps. For PDPs specifically, more product angle shots close the gap. This is a content/photography task, not a code task.
**Freeze status:** Safe — adding images never hurts rankings.

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

### ~~L1: Cloudflare cache rule for `/shop` and `/category/*`~~ ✅ DONE
Owner applied Cloudflare cache rule 2026-06-12; R11 closed 2026-06-11. Edge now respects origin `s-maxage`.

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

## 🟠 OPEN — External / Off-Page SEO

### E1: Backlink acquisition — BD business directories
**Status:** Not started
**What:** Submit Emart to BD business directories and e-commerce listings.
**Targets:**
- BDYellow Pages (bdyellow.com)
- Bangladesh Trade Portal
- Dhaka Chamber of Commerce directory
- Local business listings (Google Business Profile — Dhanmondi address)
- BD startup/e-commerce directories
**Why:** Domain authority is the #1 gap. Position 1–5 with 0% CTR means Google trusts the content but users don't recognize the brand. Directory presence builds entity trust.
**Owner:** Warlord — requires business registration docs for some directories.

### E2: Google Business Profile
**Status:** Not verified
**What:** Claim/verify GBP for "Emart Skincare Bangladesh" at 1st Floor, 26/2 Central Road, Dhanmondi, Dhaka 1205. Link to https://e-mart.com.bd. Add store photos, hours (Sa-Th 09:00-21:00), phone (+8801919797399).
**Why:** Establishes Emart as a verified local entity in Google's Knowledge Graph. LLMs cross-reference GBP for "is this business real" signals. Enables Google Maps presence for "skincare store near me" queries.
**Owner:** Warlord — requires Google account verification (postcard/phone).

### E3: Product image gallery expansion
**Status:** Ongoing gap (M9 from Medium section)
**What:** Add 3–5 angle shots per top-100 products. Current state: most products have 1–2 images.
**Why:** Google Images is a discovery channel. Google Shopping requires at least 1 clean product image, but competitors average 4–6. More images = more Google Image impressions = more Shopping card appearances.
**Execution:** Prioritize by `priority-queue.json` top 50 — highest search visibility products first.
**Owner:** Warlord — photography/supplier image sourcing.

### E4: Social profile link authority
**Status:** Schema sameAs already lists all profiles
**What:** Ensure Facebook (emartbd.official), Instagram (emartbd.official), YouTube, TikTok, LinkedIn profiles all link back to https://e-mart.com.bd in their bio/about sections. Post product links using `/shop/slug` URLs (not WooCommerce `/product/` URLs).
**Why:** Bidirectional social→site links strengthen entity recognition. Facebook + Instagram are the primary product discovery channels in BD.
**Owner:** Warlord — social media profile edits.

### E5: Beauty blogger / influencer outreach
**Status:** Not started
**What:** Send products to 5–10 BD skincare reviewers (YouTube/TikTok/Facebook) who link to the product page in video descriptions.
**Why:** One quality backlink from a BD beauty blog is worth more than 50 directory submissions. YouTube descriptions pass link equity.
**Target:** YouTube reviewers with 5K–50K subscribers who review K-beauty in Bangla.
**Owner:** Warlord — outreach + product sending.

### E6: Structured review collection
**Status:** 16 approved reviews across 3,500+ products
**What:** Implement post-purchase review request email (mu-plugin `emart-review-request.php` exists). Target: 100+ reviews within 60 days.
**Why:** Individual Review schema now deployed (2026-06-19) but most products have 0 reviews. AggregateRating + individual Review schema together unlock Google review stars in SERP. LLMs cite verified buyer sentiment.
**Owner:** Activate the review request email flow.

---

## Schema Coverage Map (live-verified 2026-06-19)

| Page type | Schema present | Still missing |
|---|---|---|
| Homepage | WebSite, OnlineStore, Organization | — |
| Product (PDP) | Product, BreadcrumbList, FAQPage, Review (when real approved reviews exist), AggregateRating (when Woo rating_count > 0) | Review volume remains the business gap; schema support added 2026-06-19 |
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

> Priority order → `workspace/TASKS.md` — **6-week stability freeze active until 2026-07-03**
> During freeze: only product data, images, blog, and small bug fixes. No URL/redirect/sitemap/nav changes.
