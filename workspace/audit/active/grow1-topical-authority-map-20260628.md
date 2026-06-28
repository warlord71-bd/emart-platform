# GROW-1: Topical Authority Map — Emart Skincare Bangladesh

Generated: 2026-06-28
Status: analysis and proposals only; no code changes made.
Owner: [C] + [O] review
Source: codebase content inventory + GSC striking-distance data + existing SEO audit reports

---

## 1. Content Inventory

### Page Type Counts

| Content Type | Route | Pages | Source |
|---|---|---|---|
| Product (PDP) | `/shop/[slug]` | ~3,625 | WooCommerce catalog |
| Blog / Journal | `/blog/[slug]` | ~50+ | WordPress posts (`getWordPressPosts`) |
| Category | `/category/[slug]` | ~30 active | WooCommerce categories (12 redirected, ~16 empty/near-empty) |
| Brand | `/brands/[slug]` | 277 | `brandWhitelist.ts` (94 Korean, 183 Western) |
| Concern | `/concerns/[slug]` | 9 | `concerns.ts` (anti-aging-repair, acne-blemish-care, dryness-hydration, pores-oil-control, melasma, brightening, wrinkle, sensitivity, sunscreen) |
| Ingredient | `/ingredients/[slug]` | 15 | `ingredients.ts` (niacinamide, hyaluronic-acid, retinol, vitamin-c, centella, snail-mucin, ceramide, bha-salicylic-acid, aha, propolis, peptide, ginseng, bakuchiol, mugwort, collagen) |
| Best (buying guide) | `/best/[slug]` | 3 | `best-definitions.ts` (sunscreen-oily-skin, cleanser-oily-skin, moisturiser-oily-skin) |
| Compare | `/compare/[pair]` | 3 | `compare-definitions.ts` (cerave-vs-cosrx-cleanser, cosrx-vs-boj-sunscreen, cosrx-snail-vs-boj-serum) |
| Routine | `/routine/[step]` | 10 | `routine.ts` (oil-cleanser, cleanser, toner, treatment, eye-care, moisturiser, sunscreen, mask, lip-care, exfoliator) |
| Origin / Country | `/origins/[country]` | 22 | `origin-navigation.ts` (south-korea, japan, china, taiwan, usa, uk, france, germany, canada, poland, spain, india, thailand, bangladesh, malaysia, philippines, sri-lanka, pakistan, uae, south-africa, turkey, multinational) |
| Skin Type | `/skin-type/[slug]` | 5 | `skin-type-definitions.ts` (oily, acne-prone, dry, combination, sensitive) |
| Index Pages | `/brands`, `/concerns`, `/ingredients`, `/routine`, `/origins`, `/skin-type`, `/best`, `/blog` | 8 | Static index pages |
| **Total editorial surface** | | **~4,055+** | |

### Brand Editorial Coverage

| Status | Count | Detail |
|---|---|---|
| With editorial (about + links + FAQ) | 30 | cosrx, beauty-of-joseon, cerave, skin1004, the-ordinary, round-lab, innisfree, some-by-mi, anua, neutrogena, laneige, medicube, dr-althea, isntree, missha, dabo, aplb, cos-de-baha, heimish, purito-seoul, the-derma-co, 3w-clinic, numbuzin, simple, mary-and-may, axis-y, cetaphil, haruharu-wonder, benton, la-roche-posay |
| Generic (1-sentence fallback) | 247 | No editorial content, no concern/ingredient links, no FAQ |

### Concern/Ingredient Editorial Content

| Source | Entries | Link Coverage |
|---|---|---|
| `concern-content.json` | 9 entries (478 lines) | 13 `[[LINK:]]` patterns to ingredient pages |
| `ingredient-content.json` | 15 entries (736 lines) | 12 `[[LINK:]]` patterns to concern/ingredient pages |
| Brand editorial `links[]` | 30 brands | 80 outgoing links to `/concerns/` and `/ingredients/` pages |

### Origin Editorial Coverage

| Status | Count |
|---|---|
| Rich editorial (about, trends, brands, FAQ) | 3 (south-korea, japan, usa) |
| Navigation-only (no editorial) | 19 |

### Humanized PDP Content

| Status | Count |
|---|---|
| Humanized (rich sections, benefits, routine fit) | 326 |
| Non-humanized (generic/thin) | ~3,299 |

---

## 2. Topic Clusters

### Cluster: Oily Skin / Oil Control

This is the highest-demand skincare topic in Bangladesh (humid climate, top GSC queries).

| Page Type | Page | Internal Links FROM | Internal Links TO |
|---|---|---|---|
| **Concern** | `/concerns/pores-oil-control` | Products (via category) | FROM: category guide |
| **Best** | `/best/sunscreen-oily-skin-bangladesh` | Products (5 linked) | None |
| **Best** | `/best/cleanser-oily-skin-bangladesh` | Products (5 linked) | None |
| **Best** | `/best/moisturiser-oily-skin-bangladesh` | Products (5 linked) | None |
| **Compare** | `/compare/cerave-vs-cosrx-cleanser` | Products (2 linked) | None |
| **Compare** | `/compare/cosrx-vs-beauty-of-joseon-sunscreen` | Products (2 linked) | None |
| **Skin type** | `/skin-type/oily` | `/concerns/acne-blemish-care`, `/concerns/pores-oil-control`, `/concerns/brightening`, `/ingredients/niacinamide`, `/ingredients/bha-salicylic-acid`, `/ingredients/centella` | None |
| **Blog** | `/blog/the-best-moisturizers-for-oily-skin-in-bangladesh` | None | None |
| **Ingredient** | `/ingredients/bha-salicylic-acid` | Products (via search) | FROM: category guide, concern content |
| **Ingredient** | `/ingredients/niacinamide` | Products (via search) | FROM: category guide, skin-type page |
| **Category** | `/category/face-cleansers` | `/ingredients/bha-salicylic-acid`, `/ingredients/centella`, `/routine/oil-cleanser`, `/routine/cleanser` | None |
| **Category** | `/category/sunscreen` | `/brands/cosrx`, `/brands/beauty-of-joseon`, `/brands/isntree`, `/routine/toner` | None |
| **Routine** | `/routine/cleanser` | Products (via search) | FROM: category guide |

**Cluster gaps:**
- Blog post about moisturizers links to NO products, categories, concerns, ingredients, or best lists
- Best lists link to products but NOT to concern pages, ingredient pages, or blog posts
- Compare pages link to products but NOT to best lists, concerns, or ingredients
- Concern page has NO links to best lists, compare pages, or blog posts

### Cluster: Acne / Blemish

| Page Type | Page |
|---|---|
| **Concern** | `/concerns/acne-blemish-care` |
| **Skin type** | `/skin-type/acne-prone` |
| **Ingredient** | `/ingredients/bha-salicylic-acid`, `/ingredients/centella`, `/ingredients/snail-mucin`, `/ingredients/niacinamide` |
| **Brand** | `/brands/cosrx` (editorial links to acne concern) |
| **Category** | `/category/soothing-gel`, `/category/korean-beauty` (guide links to acne concern) |
| **Routine** | `/routine/cleanser`, `/routine/treatment` |
| **Blog** | (none explicitly about acne in BD — gap) |

**Cluster gaps:**
- No blog post dedicated to acne skincare in Bangladesh
- No compare page for acne products
- No best list for acne products
- Concern page has no links to skin-type page, blog, or brands

### Cluster: Brightening / Hyperpigmentation

| Page Type | Page |
|---|---|
| **Concern** | `/concerns/brightening`, `/concerns/melasma` |
| **Ingredient** | `/ingredients/vitamin-c`, `/ingredients/niacinamide`, `/ingredients/aha` |
| **Compare** | `/compare/cosrx-snail-vs-beauty-of-joseon-serum` (brightening focus) |
| **Brand** | `/brands/beauty-of-joseon` (editorial links to brightening), `/brands/the-ordinary` (links to brightening) |
| **Skin type** | `/skin-type/oily` (links to brightening concern) |
| **Category** | `/category/serums-ampoules-essences` (guide links to vitamin C, niacinamide) |
| **Blog** | `/blog/himalaya-brightening-vitamin-c-orange-face-serum-bangladesh` (71 imp, striking distance) |

**Cluster gaps:**
- Blog post has NO internal links to concern, ingredient, or product pages
- No best list for brightening products
- Melasma and brightening concern pages don't link to each other
- Vitamin C ingredient page has no link to brightening concern blog post

### Cluster: Anti-Aging / Repair

| Page Type | Page |
|---|---|
| **Concern** | `/concerns/anti-aging-repair` |
| **Ingredient** | `/ingredients/retinol`, `/ingredients/peptide`, `/ingredients/ceramide`, `/ingredients/collagen` |
| **Skin type** | `/skin-type/dry` (links to anti-aging concern) |
| **Category** | `/category/night-cream` (guide links to anti-aging concern) |
| **Concern content** | `concern-content.json` links to retinol, peptides, ceramides |
| **Blog** | (no dedicated anti-aging blog post — gap) |

**Cluster gaps:**
- No best list for anti-aging products
- No compare page for anti-aging products (e.g., retinol vs peptide serum)
- No blog content on anti-aging routines for Bangladesh climate

### Cluster: Hydration / Dry Skin / Barrier

| Page Type | Page |
|---|---|
| **Concern** | `/concerns/dryness-hydration`, `/concerns/sensitivity` |
| **Ingredient** | `/ingredients/hyaluronic-acid`, `/ingredients/ceramide`, `/ingredients/snail-mucin` |
| **Skin type** | `/skin-type/dry`, `/skin-type/sensitive`, `/skin-type/combination` |
| **Brand** | `/brands/cerave` (links to hydration concern), `/brands/round-lab` (links to hydration) |
| **Routine** | `/routine/moisturiser`, `/routine/toner` |
| **Blog** | `/blog/skin-barrier-repair-signs-of-damage-and-how-to-fix-it` (1 imp, very low) |

**Cluster gaps:**
- Blog post has NO internal links
- No best list for hydration/dry skin products
- Skin-type pages link to concerns/ingredients but NOT to blogs, best lists, or brands

### Cluster: Korean Beauty

| Page Type | Page |
|---|---|
| **Origin** | `/origins/south-korea` (rich editorial, popular brands linked) |
| **Category** | `/category/korean-beauty` (2,118 products, guide content) |
| **Brand** | 94 Korean brands (15 with editorial) |
| **Best** | all 3 best lists feature Korean products |
| **Blog** | `/blog/viral-korean-skincare-tested-bangladesh-honest-review` (41 imp) |
| **Blog** | `/blog/best-korean-face-masks-for-glass-skin-a-bangladesh-buying-guide` (3 imp) |

**Cluster gaps:**
- Korean Beauty origin page has no link to category page or blog posts
- Blog posts have NO internal links to brands, products, concerns, or ingredients
- Category guide links to brands but not to origin page

### Cluster: Sun Protection

| Page Type | Page |
|---|---|
| **Concern** | `/concerns/sunscreen` |
| **Best** | `/best/sunscreen-oily-skin-bangladesh` |
| **Compare** | `/compare/cosrx-vs-beauty-of-joseon-sunscreen` |
| **Routine** | `/routine/sunscreen` |
| **Category** | `/category/sunscreen` (guide content with brand links) |
| **Blog** | `/blog/avoiding-sunburn-in-hot-and-humid-environments-a-dermatologists-guide` (7 imp) |
| **Ingredient** | (none specific — UV filters not a standalone page) |

**Cluster gaps:**
- Best list links to products but NOT to concern page, compare page, routine step, or category
- Compare page links to products but NOT to best list, concern, or category
- Blog post has NO internal links
- Concern page has NO link to best list, compare, or blog

---

## 3. Internal Link Matrix

### Current State: Which content type links TO which

Key: YES (implemented) | PARTIAL (some pages only) | NO (zero links exist) | N/A

| FROM \ TO | Product (PDP) | Category | Brand | Concern | Ingredient | Best | Compare | Routine | Origin | Skin Type | Blog |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Product (PDP)** | N/A | Breadcrumb | Breadcrumb | NO | NO | NO | NO | NO | NO | NO | NO |
| **Category (guides)** | Product grid | N/A | YES (3 cats) | YES (3 cats) | YES (5 cats) | NO | NO | YES (4 cats) | NO | NO | NO |
| **Brand (editorial)** | Product grid | NO | N/A | YES (15 brands) | YES (15 brands) | NO | NO | NO | NO | NO | NO |
| **Concern** | Product grid | NO | NO | N/A | YES (13 LINK:) | NO | NO | NO | NO | NO | NO |
| **Ingredient** | Product grid | NO | NO | YES (12 LINK:) | N/A | NO | NO | NO | NO | NO | NO |
| **Best** | YES (product links) | NO | NO | NO | NO | N/A | NO | NO | NO | NO | NO |
| **Compare** | YES (product links) | NO | NO | NO | NO | NO | N/A | NO | NO | NO | NO |
| **Routine** | Product grid | NO | NO | NO | NO | NO | NO | N/A | NO | NO | NO |
| **Origin** | Product grid | NO | YES (popular brands) | NO | NO | NO | NO | NO | N/A | NO | NO |
| **Skin Type** | `/shop` link | NO | NO | YES (3-4 per type) | YES (3-4 per type) | NO | NO | NO | NO | N/A | NO |
| **Blog** | YES (Qdrant recs) | NO | NO | NO | NO | NO | NO | NO | NO | NO | N/A |
| **Homepage** | Product rails | Category chips | YES (section) | NO | YES (section) | YES (section) | NO | YES (section) | NO | NO | YES (section) |
| **Navigation** | Shop link | Category mega menu | YES (drawer) | YES (drawer) | YES (drawer) | NO | NO | YES (drawer) | YES (drawer) | YES (drawer) | NO |

### Link Summary

**Well-connected pairs (automated count from `topical_authority_report.py`):**
- Category guide → concerns (6), ingredients (14), brands (7), routine (10) — the richest cross-linking surface
- Concern content → ingredients (26), category (6) — bidirectional with ingredients
- Ingredient content → concerns (3), category (10) — bidirectional with concerns
- Brand editorial → concerns + ingredients (80 links across 30 brands, rendered at runtime via `links[]`)
- Skin-type → concerns (2), ingredients (1) — via `relatedConcerns`/`relatedIngredients` arrays
- Best → shop (2 product links); Compare → shop (3 product links)
- Blog → shop (via Qdrant semantic product recommendations, 4 per post)
- Origins → brands (1 — popular brands section)

**Completely disconnected pairs (32 pairs with zero links in either direction):**
- Best ↔ compare, concerns, ingredients, routine, skin-type, brands, origins, blog
- Compare ↔ concerns, ingredients, routine, skin-type, brands, origins, blog
- Concerns ↔ routine, brands, origins, blog
- Ingredients ↔ routine, brands, origins, blog
- Routine ↔ skin-type, brands, origins, blog
- Skin-type ↔ brands, origins, blog
- Brands ↔ blog
- Origins ↔ blog
- PDP → concerns, ingredients, best, compare, routine, blog, skin-type, origin (only breadcrumb to category/brand)

---

## 4. Coverage Gaps (GSC-Informed)

### High-Impression Topics Without Editorial Depth

Based on GSC striking-distance data (positions 11-20, with impressions):

| Topic / Query | Impressions | Current Page | Missing Content Types |
|---|---|---|---|
| "best moisturizer for oily skin" | 62 imp (blog) | Blog post | No internal links in blog, no compare page for moisturizers |
| "toner vs essence vs serum" | 60 imp (blog) | Blog post | No internal links, no routine step cross-links |
| "melasma" / hyperpigmentation | 50 imp (concern) | Concern page | No best list, no compare, no blog post, no skin-type link |
| "sunscreen for oily skin" | via best list | Best list | No links to concern, compare, routine, blog |
| "skincare bd" / "skincare bangladesh" | 204 imp (homepage) | Homepage | Broad intent — no hub page or category overview |
| "sheet mask" / "face mask" | 52 imp combined | Category page | No blog post, no best list, no routine-mask cross-link |
| "BHA" / salicylic acid | 17 imp (ingredient) | Ingredient page | No best list, no blog, no compare |
| "peptides in bangladesh" | 13 imp (ingredient) | Ingredient page | No best list, no blog |
| "propolis for skin" | 7 imp (ingredient) | Ingredient page | No blog, no best list |
| "best skincare for sensitive skin" | 9 imp (skin-type) | Skin-type page | No best list, no blog, no compare |
| "wrinkle" / pore tightening | 9 imp (concern) | Concern page | No best list, no compare, no blog |
| K-beauty / Korean Beauty queries | 41-71 imp (blog/origin) | Scattered across blog, origin, category | No cross-links between these surfaces |
| "France products" | 25 imp (origin) | Origin page | No editorial content for France origin |
| "Thailand skin care products" | 12 imp (origin) | Origin page | No editorial content for Thailand |

### Content Type Gaps (topics that need new pages)

| Gap | Recommended Content | Priority |
|---|---|---|
| Acne skincare guide for Bangladesh | `/best/acne-products-bangladesh` or `/blog/best-acne-skincare-bangladesh` | HIGH — acne-blemish-care concern has products but no best/compare/blog |
| Brightening best list | `/best/brightening-serum-bangladesh` | HIGH — melasma/brightening has 50+ imp, no best list |
| Anti-aging products best list | `/best/anti-aging-skincare-bangladesh` | MEDIUM — retinol/peptide ingredients exist but no curated guide |
| Sheet mask guide | `/best/sheet-masks-bangladesh` or blog | MEDIUM — 52 imp for face mask queries |
| Sensitive skin products | `/best/sensitive-skin-products-bangladesh` | MEDIUM — sensitive skin-type page exists, 9 imp |
| Hydration best list | `/best/hydrating-products-dry-skin-bangladesh` | MEDIUM — dryness concern + HA ingredient exist but no best list |

---

## 5. Link Gap Priorities (Impact-Ranked)

### Tier 1: Highest Impact (cross-link existing high-value surfaces)

| # | Link Direction | Count | Rationale |
|---|---|---|---|
| L1 | **Blog → products, concerns, ingredients, best, compare** | ~150-250 links across ~50 posts | Single highest-ROI SEO action. Blog posts rank in GSC but have ZERO in-body internal links. Every blog post should link to 3-5 relevant concern/ingredient/best/product pages. (Already proposed in P1-1 of unified plan) |
| L2 | **Best → concerns, ingredients, brands, compare** | ~15 links across 3 guides | Best guides are pure commercial intent and already rank. Adding contextual links to the concern page, relevant ingredient pages, and the compare page creates a tight buying-intent cluster. |
| L3 | **Compare → best, concerns, ingredients, brands** | ~12 links across 3 comparisons | Compare pages are high-intent. Linking to the best list for the same category and the relevant concern page completes the comparison-to-purchase funnel. |
| L4 | **PDP (humanized) → concerns, ingredients, routine** | ~1,000+ links (via humanizer pipeline) | Rides the existing humanizer engine. Each humanized PDP should include 2-3 contextual links in the "Routine Fit" or "Key Benefits" section. (Already specified in CONTENT_STANDARD, proposed as P3-1/USEO-7) |

### Tier 2: High Impact (editorial depth + cross-linking)

| # | Link Direction | Count | Rationale |
|---|---|---|---|
| L5 | **Concern → best, compare, blog, skin-type, brands** | ~30 links across 9 concern pages | Concern pages are navigational hubs. Adding "Recommended reading" or contextual links to best lists, compare pages, and blogs creates cluster depth. |
| L6 | **Ingredient → best, compare, blog, brands** | ~30 links across 15 ingredient pages | Ingredient pages get GSC impressions. Linking to product guides and brand pages that feature the ingredient distributes authority. |
| L7 | **Skin-type → best, compare, blog, routine, brands** | ~25 links across 5 skin-type pages | Skin-type pages already link to concerns/ingredients. Adding links to best lists, blog posts, and routine steps would complete the discovery path. |
| L8 | **Routine → concerns, ingredients, brands, best** | ~40 links across 10 routine pages | Routine steps are natural topic hubs. Each step should link to the concern it addresses, the key ingredient, and any relevant best list. |

### Tier 3: Medium Impact (additional depth)

| # | Link Direction | Count | Rationale |
|---|---|---|---|
| L9 | **Origin → category, blog, concern** | ~20 links across 3 editorial origin pages | South Korea origin should link to `/category/korean-beauty`, K-beauty blog posts, and relevant concern pages. |
| L10 | **Category guide → best, compare, blog** | ~15 links across 7 category guides | Category guides already link to concerns/ingredients/brands/routine. Adding best list and blog links would complete the hub. |

---

## 6. Internal-Link Proposal Workflow

A repeatable process for adding internal links going forward.

### Step 1: Identify Link Targets (quarterly or when new content is added)

Run `topical_authority_report.py` (see companion script) to generate the current state:
- Content inventory counts by type
- Cross-reference matrix (which types link to which)
- Gap list (pairs with zero or low link counts)

### Step 2: Map Links by Topic Cluster

For each topic cluster (acne, brightening, hydration, etc.):
1. List all pages in the cluster (concern + ingredients + best + compare + blog + brands + category)
2. Check which pairs are linked vs unlinked
3. Prioritize unlinked pairs where BOTH pages have GSC impressions

### Step 3: Draft Link Proposals

For each identified gap:
- **Anchor text**: use natural phrases already present in the copy (not injected keyword anchors)
- **Placement**: in-body contextual links, not footer/sidebar link farms
- **Density**: max 3-5 in-body links per page to non-product pages; no more than 1 link per content section
- **Target validation**: confirm target URL returns HTTP 200 and is in the sitemap

Link target validation set (all confirmed HTTP 200 as of 2026-06-26):
- 9 concern pages: `/concerns/{slug}`
- 15 ingredient pages: `/ingredients/{slug}`
- 10 routine pages: `/routine/{slug}`
- 3 best pages: `/best/{slug}`
- 3 compare pages: `/compare/{pair}`
- 5 skin-type pages: `/skin-type/{slug}`
- 277 brand pages: `/brands/{slug}`
- ~30 active category pages: `/category/{slug}`
- 22 origin pages: `/origins/{country}`

### Step 4: Implementation Path (per surface)

| Surface | Method | Gate |
|---|---|---|
| Blog posts | WordPress REST API (WP admin or script) — add links in post HTML body | Owner approves anchor/target approach |
| PDP descriptions | Humanizer engine pipeline — add `[[LINK:]]` patterns to humanizer output template | Code change to humanizer engine |
| Concern/ingredient content | Edit `concern-content.json` / `ingredient-content.json` — add `[[LINK:]]` patterns | Code review |
| Best / Compare pages | Edit `best-definitions.ts` / `compare-definitions.ts` — add cross-reference links in `intro`, `buyingGuide`, or `bangladeshNote` | Code review |
| Category guides | Edit category guide conditionals in `category/[slug]/page.tsx` — already has the pattern | Code review |
| Brand editorial | Edit `brandEditorial.ts` — add `links[]` entries | Data review |
| Skin-type pages | Edit `skin-type-definitions.ts` or `skin-type/[slug]/page.tsx` — add best/blog/routine links | Code review |
| Routine pages | Edit `routine/[step]/page.tsx` or `routine.ts` — add concern/ingredient/best cross-links | Code review |
| Origin editorial | Edit `origin-editorial.ts` — add category/blog links to editorial content | Data review |

### Step 5: Measure

After each batch of links is deployed:
1. Note the deploy date in `workspace/ledgers/action-events.jsonl`
2. After 14 days, pull GSC data for affected pages (impressions, clicks, position)
3. Compare vs baseline captured before deployment
4. Report improvement or regression

### Step 6: Iterate

- Every 2-4 weeks, re-run `topical_authority_report.py`
- Check for new content (blog posts, best lists, compare pages) that need cross-linking
- Check GSC for new striking-distance queries that suggest content gaps
- Prioritize gaps where adding a link could move a page from position 11-15 to page 1

---

## 7. Relationship to Existing Work

| Existing Item | Relationship |
|---|---|
| `seo-unified-internal-linking-content-plan-20260626.md` (P1-1) | Blog internal links — this map validates P1-1 as the single highest-ROI action |
| `seo-unified-internal-linking-content-plan-20260626.md` (RC-1) | Internal-linking gap root cause — this map quantifies it by page type pair |
| USEO-7 (humanizer in-body links) | PDP → concern/ingredient links via humanizer pipeline — L4 in this map |
| USEO-9 (Tier-2 brand editorial) | Brand editorial expansion — increases the denominator of brand pages with outgoing links |
| D8 (brand content coverage) | Brand page content depth — this map shows brand pages are link sinks (receive from nav only) |
| SEO-ORCH-5 (content lifecycle) | New content should include internal links from day one — Step 4 of this workflow |
| Content Orchestrator (CO-1) | Content dispatch should include link targets in job specs |
| Blog generator (WA-H) | New blog posts should include 3-5 internal links to concern/ingredient/best/product pages |

---

## 8. Quick-Win Priority List

Execute in this order for maximum topical authority signal with minimum effort:

1. **Blog internal links** (L1) — 50 posts, 3-5 links each, WordPress REST API. Highest volume, highest ROI, no code deployment.
2. **Best → concern/ingredient/compare links** (L2) — edit `best-definitions.ts`, add contextual links in `intro`/`buyingGuide` sections.
3. **Compare → best/concern/ingredient links** (L3) — edit `compare-definitions.ts`, add cross-references.
4. **Concern → best/blog/skin-type links** (L5) — edit `concern-content.json`, add `[[LINK:]]` patterns.
5. **Ingredient → best/blog/brand links** (L6) — edit `ingredient-content.json`, add `[[LINK:]]` patterns.
6. **Skin-type → best/blog/routine links** (L7) — edit page template or definitions.
7. **Routine → concern/ingredient/best links** (L8) — edit routine page template.
8. **PDP humanizer links** (L4) — modify humanizer engine output template. Largest volume but requires engine changes.
9. **Origin → category/blog links** (L9) — edit origin-editorial.ts.
10. **New content creation** — best lists for acne, brightening, anti-aging, sheet masks, sensitive skin.
