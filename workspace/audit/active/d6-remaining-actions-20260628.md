# D6 GMC Disapprovals — 13 Remaining Items

Status: 33/46 fixed via description regex pass (2026-06-28). 13 remain.
Rollback: `gmc-d6-rollback-20260628.json`

## Category A: Title-Level Shade Names (8 products) — OWNER DECISION

These products are flagged under GMC "Identity & Belief" because the product TITLE itself contains shade/skin-tone terms. Description fixes cannot resolve these — the title must change or GMC must accept them.

| WC ID | Current Title | Flagged Term | Proposed Fix |
|---|---|---|---|
| 74435 | Everly Beauties Perfect Skin Glow Foundation SPF 15 – Honey 30ml | "Honey" (skin tone) | Change shade to code: "– Shade 01" or keep (low sales) |
| 75579 | Wet n Wild Foundation Matte E368C (Golden Beige) | "Golden Beige" | Use code only: "(E368C)" |
| 31950 | Maybelline Fit Me Matte Liquid Foundation SPF22 – Natural Beige 220 – 30ml | "Natural Beige" | Use number only: "– 220 – 30ml" |
| 37229 | Maybelline Fit Me Set+Smooth Pressed Powder – Golden Beige 240 | "Golden Beige" | Use number only: "– 240" |
| 62460 | IZEZE Love Me Cushion 14g / SPF50+ PA++++ (#23 Nude) | "Nude" | Use number only: "(#23)" |
| 75171 | Sheglam Snatch 'n' Define Stick – Terracotta | "Terracotta" (could flag) | Keep — "Terracotta" is a color, not skin tone; may self-resolve |
| 74134 | Beauty Glazed Turquoise Green Liner 0.6g | Unclear trigger | Keep — "Turquoise Green" is not skin-tone language; may be category-level flag |
| 60609 | Dabo Total Solution BB Cushion – No-21 | "BB" may trigger | Keep — shade is already numeric; flag likely category-level |

**Owner options:**
- **Option A:** Change 5 clear shade-name titles (74435, 75579, 31950, 37229, 62460) to numeric/code variants. Low storefront impact — these are low-sales foundation products. URL slugs unchanged.
- **Option B:** Accept disapproval for these products (low revenue impact).
- **Option C:** Use GMC `excluded_destination` to suppress only these products from Shopping ads while keeping them in the organic feed.

## Category B: Broad-Category Flags (4 products) — GMC APPEAL CANDIDATES

These products have clean descriptions (fixed in regex pass) but remain flagged. The trigger is likely category-level (Google's ML classifier flagging the product type, not specific text).

| WC ID | Product | GMC Reason | Action |
|---|---|---|---|
| 75273 | Sunsilk Perfect Straight Shampoo 300ml | "Personal hardships" | Appeal — shampoo has no hardship language |
| 3822 | KLAIRS Supple Preparation Facial Toner 30ml | "Personal hardships" | Appeal — basic toner, no hardship claims |
| 74275 | Cetaphil Gentle Skin Cleanser 59ml | "Personal hardships" | Appeal — gentle cleanser, no hardship claims |
| 63933 | COSRX Full Fit Honey Sugar Lip Scrub 20g | "Personal hardships" | Appeal — lip scrub, no hardship claims |

**Action:** File GMC appeals via Merchant Center dashboard for all 4. These are clean consumer products with no policy-violating content.

## Category C: Availability/Image (2 products) — SEPARATE FIXES

| WC ID | Product | Issue | Action |
|---|---|---|---|
| 4013 | I'M FROM Fig Scrub Mask 120g | Missing `availability_date` (backorder) | Owner: set stock status to "in stock" or "out of stock" (not backorder without date). If genuinely on backorder, add `availability_date` to GMC feed. |
| 58823 | Mini Skincare Set 4 pcs | "Unsupported image type" | Product image is .jpg — flag is likely stale from a previous WebP version. Wait for next GMC crawl cycle (runs every 6h). If still flagged after 2 cycles, re-upload image as JPEG. |

## Revenue Impact Assessment

From the 2026-06-28 sales×price ranking:
- These 13 products had combined low sales volume (most had 0-1 sales in tracking period)
- Highest-value remaining: 3822 KLAIRS Toner (1 sale), 63933 COSRX Lip Scrub (0 but popular brand)
- Total revenue impact: <1% of GMC-driven Shopping revenue
- Priority: LOW relative to the 33 already fixed (which included the high-sellers)
