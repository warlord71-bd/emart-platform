# Emart Product Content Standard — Full 16-Layer Specification

Based on Google Product structured data, Merchant Center policies, Helpful Content
guidelines, GEO/AEO citation requirements, and competitor benchmark (Skinnora structure,
Emart quality).

**Last audit:** 2026-06-20 (100-product sample)
**Benchmark:** Skinnora.com structure (~2,850 words/product, 11 sections)
**Emart target:** 800-1,200 words/product, 7 sections — dense and specific, not padded

---

## Current State vs Target

| Layer | Current | Target | Gap |
|---|---|---|---|
| 1. Description 800+ words | 0% | 100% | Full rewrite needed |
| 2. FAQ (5 product-specific Q&A) | 5% | 100% | 95% missing |
| 3. How-to-use tab | 69% | 100% | 31% missing |
| 4. Ingredients tab (structured) | 99% | 100% | Nearly done |
| 5. pa_brand | 3,624/3,625 (99.97%) | 100% | 1 missing |
| 6. pa_origin | 3,624/3,625 (99.97%) | 100% | 1 missing |
| 7. pa_concern | 2,541/3,625 total catalog | 100% of skincare products only | 279 skincare-like rows held; non-skincare stays blank |
| 8. pa_skin_type | 28/3,625 total catalog | Skincare products only | Proposal/apply-reviewed pipeline ready |
| 9. pa_ingredient (key actives) | 1,084/3,625 total catalog | Skincare products only | Proposal/apply-reviewed pipeline ready |
| 10. SKU | 100% | 100% | Done |
| 11. Size/volume attribute | In name only | Structured attr | Not structured |
| 12. Product images (3+ per) | 3% | 100% top-200 | Owner task |
| 13. Image alt text | Partial | Descriptive | Needs audit |
| 14. Brand logo on PDP | Yes | Yes | Done |
| 15. Reviews (3+ per top-100) | 16 total | 300+ | Owner task (E6) |
| 16. Meta title + description | 97% | 100% | Auto-fixing nightly |

---

## Layer 1: Product Description

### Target: 800-1,200 words, 7 sections

```
Section 1 — WHAT IT IS (80-100 words)
  Direct answer: product name + what it does + who it's for.
  First sentence must be a complete definition.
  NO filler intros ("In the world of skincare...")

Section 2 — KEY INGREDIENTS (150-200 words)
  3-5 key active ingredients, each with:
    - Ingredient name
    - What it does for skin (specific function, not "powerful ingredient")
    - Concentration if known (e.g., "10% niacinamide")
  Source from: _emart_ingredients meta, INCI list, brand product page

Section 3 — BEST FOR / NOT RECOMMENDED (60-80 words)
  ✅ Best For: list 3-5 skin types/concerns with one-line reason
  ⚠️ Not Recommended For: list 1-2 skin types with reason
  Source from: pa_concern, pa_skin_type, ingredient profile

Section 4 — HOW TO USE (80-100 words)
  3-4 numbered steps, specific to this product type
  Include: when (AM/PM/both), position in routine (after X, before Y)
  Source from: _emart_how_to_use meta, brand usage instructions

Section 5 — ROUTINE FIT (100-120 words)
  Where this product fits in a full AM or PM routine
  Recommend 2-3 complementary Emart products by name with internal links
  Use Qdrant cross-sell data for product pairing suggestions

Section 6 — BANGLADESH CONTEXT (60-80 words)
  Climate relevance (Dhaka humidity, monsoon, summer heat)
  Availability note (COD, nationwide delivery)
  Authenticity statement (origin, Emart sourcing)
  This section is what makes Emart content uncopyable by competitors

Section 7 — PRODUCT FACTS (40-60 words)
  Size, origin country, brand parent company
  SKU or barcode reference
  "Available at Emart Skincare Bangladesh"
```

### Description Quality Rules

```
MUST:
  - 800+ words total across all sections
  - First sentence names the product and its core function
  - 3+ specific ingredients mentioned by name with function
  - "Bangladesh" appears 2-3 times naturally
  - "COD" or "Cash on Delivery" appears once
  - Internal links to 2+ related products or category/ingredient pages
  - Brand name matches pa_brand exactly
  - Origin matches pa_origin exactly

MUST NOT:
  - Price (changes independently — use FAQ Q1 for price)
  - "Free shipping" or delivery time promises
  - Medical claims: "cures", "treats", "heals", "whitening" (use "brightening")
  - Competitor names or direct comparisons
  - >80% text similarity with any other product description
  - Raw HTML tables or bullet-only format (needs prose + bullets mix)
  - Generic AI filler: "In the world of...", "Are you looking for...",
    "skincare enthusiasts", "skincare journey", "unlock the secret"
  - Manufacturer copy-paste without rewriting

MODEL: DeepSeek v3.1 paid (free models produce ~6% defect rate)
```

---

## Layer 2: Product FAQ

### Target: 5 Q&A pairs, product-specific

| # | Theme | Language | Example |
|---|---|---|---|
| Q1 | Price + where to buy | English | "What is the price of {product} in Bangladesh?" |
| Q2 | What it does / who it's for | English | "What is {product} used for?" |
| Q3 | How to use | English | "How should I use {product}?" |
| Q4 | Skin type fit | Bangla | "{product} কোন skin type এর জন্য ভালো?" |
| Q5 | Authenticity | Bangla | "Emart-এ {product} কি অরিজিনাল?" |

### FAQ Quality Rules

```
MUST:
  - Exactly 5 Q&A pairs
  - At least 1 Bangla question (Q4 or Q5)
  - Q1 answer includes current price from WooCommerce
  - Q3 answer mentions specific steps (not "apply as directed")
  - Q5 answer mentions origin country and Emart sourcing
  - Product name appears in every question
  - Each answer is 2-4 sentences

MUST NOT:
  - "apply as directed" or "ব্যবহারের নিয়ম" as a complete answer
  - Delivery/shipping/COD info in FAQ (belongs in site FAQ)
  - Medical claims
  - Generic answers that could apply to any product
```

### Storage: `_emart_product_faq` WooCommerce meta (JSON array)

---

## Layer 3: How-to-Use Tab

### Target: 3-5 numbered steps + pro tip

```
Storage: _emart_how_to_use WooCommerce meta (HTML)
Display: DetailsTabs.tsx "How to Use" tab
```

### Rules
- Steps specific to this product type (cleanser = lather method, serum = dropper technique)
- Include AM/PM timing
- Include "after [product type]" positioning in routine
- One "Pro tip" at the end for Bangladesh context
- If missing: extract from description Section 4 during humanizer run

---

## Layer 4: Ingredients Tab

### Target: Full INCI list + key actives highlighted

```
Storage: _emart_ingredients WooCommerce meta (HTML)
Display: DetailsTabs.tsx "Ingredients" tab
Current coverage: 99%
```

### Rules
- Full INCI ingredient list (raw text from product packaging)
- Key actives should also appear in description Section 2 with explanations
- Do not fabricate ingredient lists — source from brand website or packaging

---

## Layer 5-6: Brand + Origin (`pa_brand`, `pa_origin`)

✅ **DONE** — 3,641 products assigned. No action needed.

---

## Layer 7: Concern Tags (`pa_concern`)

### Target: Every skincare product has 1-3 concern tags

```
Current: 2,541/3,625 total catalog products have concern tags
Open review: 279 skincare-like rows held for stronger evidence/manual review
Do not tag: makeup, hair, tools/accessories, supplements, and other non-skincare
```

### Assignment method
- Auto-assign using reranker + LLM: find 10 nearest tagged neighbors in Qdrant,
  extract their concerns, classify with confidence score
- Apply above 0.85 confidence; queue rest for owner review
- Script: gsc_tracker.py can trigger this via P4.1 (AI_PLAN.md)

### Valid concerns
```
acne-blemish-care, anti-aging-repair, brightening, dryness-hydration,
hyperpigmentation, melasma, pores-oil-control, sensitivity, sunscreen, wrinkle
```

---

## Layer 8: Skin Type Tags (`pa_skin_type`)

### Target: Every skincare product has 1-2 skin type tags

```
Current: 28/3,625 total catalog products have skin type tags
Open scope: skincare products only; non-skincare should remain intentionally blank
```

### Valid values
```
oily, dry, combination, sensitive, normal, all-skin-types
```

### Assignment method
- Extract from description "Best For" section during humanizer run
- Also derivable from ingredient profile (salicylic acid → oily/acne, ceramides → dry/sensitive)
- Write to WooCommerce as product attribute

---

## Layer 9: Key Ingredient Tags (`pa_ingredient`)

### Target: Top skincare products have 2-3 ingredient tags

```
Current: 1,084/3,625 total catalog products have ingredient tags
Open scope: skincare products only; non-skincare should remain intentionally blank
```

### Valid values
```
niacinamide, hyaluronic-acid, salicylic-acid, retinol, vitamin-c,
ceramide, centella, snail-mucin, tea-tree, aha, bha, peptide,
collagen, propolis, mugwort, ginseng, bakuchiol, glycolic-acid
```

### Assignment method
- Parse from `_emart_ingredients` meta during humanizer run
- Match known actives against ingredient list text
- Write to WooCommerce as product attribute

---

## Layer 10: SKU

✅ **DONE** — 0 missing, 0 duplicates. No action needed.

---

## Layer 11: Size/Volume Attribute

### Target: Structured attribute, not just in product name

```
Current: Size is embedded in product name only ("150ml", "48g")
```

### Method
- Parse from product name using regex
- Write as structured WooCommerce attribute
- Useful for Google Shopping feed (required field)
- Lower priority — name contains it, schema has it

---

## Layer 12: Product Images

### Target: 3+ images per product (top 200 first)

```
Current: 96% have only 1 image, 3% have 3+
```

### Rules
- Image 1: Clean product front shot (white/light background)
- Image 2: Back/ingredients label
- Image 3: Product in use or texture shot
- All images: descriptive alt text (not "image-1.jpg")
- Format: WebP preferred, JPEG acceptable, min 800×800px

### Owner task — photography/supplier sourcing
Priority by GSC priority-queue.json (top impression products first)

---

## Layer 13: Image Alt Text

### Target: Every product image has descriptive alt text

```
Current format: "{Product Name} - Emart Skincare Bangladesh"
```

### Rules
- Include product name + key descriptor
- Example: "CeraVe Skin Renewing Night Cream 48g jar - front view"
- Do NOT use: "image-1", "photo", "picture", generic filenames

---

## Layer 14: Brand Logo on PDP

✅ **DONE** — Brand chip displays on PDP. No action needed.

---

## Layer 15: Customer Reviews

### Target: 3+ reviews per top-100 product

```
Current: 16 total reviews across 3,600 products
```

### Method
- Activate post-purchase review request email (MailPoet — owner task E6)
- Review schema (individual `@type: Review`) deployed 2026-06-19
- JudgeMe or similar review platform integration (future consideration)

---

## Layer 16: Meta Title + Description

### Meta Title
```
Format:  Buy {Product Name} | Price in Bangladesh - Emart
Length:  55-65 characters
Auto:    gsc_tracker.py fix-titles runs nightly for top 5 CTR-gap products
```

### Meta Description
```
Format:  {Brand} {Product} for {concern} with {ingredient}. {Origin} — shop at Emart Bangladesh, COD.
Length:  140-155 characters
Current: 97% good
```

---

## Content Score Formula

Each product gets a score out of 100 based on all 16 layers:

```
CONTENT (50 points):
  Description 800+ words, 7 sections           20 points
  FAQ 5 Q&A product-specific                    12 points
  How-to-use tab present                         6 points
  Ingredients tab present                        4 points
  No quality violations (banned phrases, etc.)   8 points

DATA (25 points):
  pa_brand assigned                              3 points
  pa_origin assigned                             3 points
  pa_concern assigned (1-3 tags)                 5 points
  pa_skin_type assigned                          5 points
  pa_ingredient assigned (2-3 actives)           5 points
  SKU present                                    2 points
  Size/volume structured                         2 points

MEDIA (15 points):
  3+ product images                             10 points
  All images have descriptive alt text           5 points

TRUST (10 points):
  3+ customer reviews                            7 points
  Meta title matches standard                    1.5 points
  Meta description 140-155 chars                 1.5 points
```

### Score tiers

| Score | Tier | Action |
|---|---|---|
| 90-100 | GOLDEN | Monitor only |
| 70-89 | STRONG | Minor fixes (FAQ, tags) |
| 40-69 | PARTIAL | Humanizer priority queue |
| 0-39 | THIN | Urgent rewrite needed |

---

## Execution Pipeline

```
NIGHTLY (automated):
  1. gsc_tracker.py full → priority queue + humanizer queue
  2. fix-titles for top 5 CTR-gap products
  3. Blog topics fed to generator

WEEKLY (agent-triggered):
  4. internal_seo_tool.py → agentic scores (score all 16 layers)
  5. Humanizer batch: top 20 products from humanizer-queue.json
     a. Generate description (7 sections, 800-1200 words)
     b. Generate FAQ (5 Q&A)
     c. Extract pa_skin_type from "Best For" section
     d. Extract pa_ingredient from ingredients section
     e. Validate all quality gates
     f. Write to WooCommerce
     g. Revalidate ISR cache
     h. Submit IndexNow

MONTHLY (owner):
  6. Product image sourcing for top-50 priority products
  7. Review collection email campaign status check
  8. pa_concern manual review for remaining 1,084

ESTIMATED TIMELINE (at 20 products/week):
  Full catalog (3,600 products): ~180 weeks = ~3.5 years at 20/week
  Top 500 by GSC priority: ~25 weeks = ~6 months
  Top 200 by GSC priority: ~10 weeks = ~2.5 months
  
ACCELERATED (at 50 products/day, ~$2/day DeepSeek cost):
  Top 500: ~10 days
  Full catalog: ~72 days
```

---

## Audit Script

Run the full 16-layer audit:
```bash
python3 workspace/seo-review/content_audit.py          # full catalog sample
python3 workspace/seo-review/content_audit.py --top100  # top 100 GSC products only
python3 workspace/seo-review/content_audit.py --slug cerave-skin-renewing-night-cream-48g
```

Output: `workspace/seo-review/content-audit.json` — per-product score + missing layers
