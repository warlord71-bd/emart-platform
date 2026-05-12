# P6 Product SEO Triage Plan - 2026-05-12

## Source

- Summary: `workspace/audit/active/product-seo-audit-summary-20260509-205659.txt`
- Detail CSV reviewed read-only: `workspace/audit/active/product-seo-audit-20260509-205659.csv`
- Total products analyzed: 3,626
- No app code, Woo data, product data, price, stock, SKU, image data, checkout, cart, payment, order, or mobile files were edited.

## Issue Counts

| Issue | Count | Severity | Notes |
| --- | ---: | --- | --- |
| Missing `_emart_meta_description` | 3,626 | Medium | Current Next.js output can still use Rank Math fallback for most products, but Emart-owned meta is absent everywhere. |
| Weak meta | 319 | Medium | Usually length/quality issue; good candidate for generated draft + review. |
| Missing Rank Math meta | 19 | High | These also miss Emart meta, creating true metadata gaps. |
| Missing both meta sources | 19 | High | Highest metadata risk group. |
| Duplicate meta | 4 | Low/Medium | Small cleanup batch. |
| Missing SKU | 119 | High | Blocks clean Merchant/Product schema readiness when no trusted identifier exists. |
| Invalid SKU | 7 | Medium | Whitespace/format cleanup risk; dry-run first. |
| Missing brand | 19 | High | Overlaps with worst low-score rows and hurts Product schema/Merchant confidence. |
| Missing category | 0 | Low | No action. |
| Missing image | 1 | High | Merchant readiness blocker; owner/data review required. |
| Missing price | 3 | High | Merchant readiness blocker; owner/data review required. |
| Missing stock | 0 | Low | No action. |
| Thin visible description | 19 | High | Same low-score cluster; needs content/data review. |
| Merchant schema not ready | 23 | High | 19 low-score rows plus 3 missing-price rows plus 1 missing-image row. |
| Score under 80 | 19 | High | Concentrated group with metadata, SKU, brand, description, and schema gaps. |

## Issue Grouping

### Safe Frontend/Code Fix

- Improve fallback generation for product meta descriptions when Woo/Rank Math metadata is absent.
- Ensure Product JSON-LD omits unsafe fields instead of outputting incomplete Merchant data.
- Add defensive formatting for SKU/brand/schema only when source data is valid.
- Files to inspect later:
  - `apps/web/src/app/shop/[slug]/page.tsx`
  - `apps/web/src/lib/seo/productSeo.ts` or current product SEO helpers if renamed
  - `apps/web/src/lib/schema/*` or current JSON-LD builder if present
  - `apps/web/src/lib/woocommerce.ts`

### Woo Data Dry-Run Needed

- Missing SKU: 119
- Invalid SKU: 7
- Missing brand: 19
- Missing image: 1
- Missing price: 3
- Thin visible description: 19
- Data areas to inspect later:
  - Woo product `_sku`
  - Woo product brand taxonomy / brand attribute
  - Woo product short and long descriptions
  - Woo product image/gallery fields
  - Woo regular/sale/current price fields

### Owner Review Needed

- Any SKU creation or correction.
- Brand assignment for products with missing brand.
- Missing price rows, because price affects storefront, schema, and Merchant Center.
- Missing image row, because image choice affects product truth and Merchant Center.
- Thin descriptions for commercially important products, especially the 19 low-score rows.

### Ignore / Low Priority

- Missing category: 0, no work.
- Missing stock: 0, no work.
- Duplicate meta: 4, low-volume cleanup after high-risk batches.
- `pa_origin` and `pa_concern`: explicitly defer to later follow-up.

## Highest SEO Risk Areas

1. The 19 low-score products are the highest risk because each combines missing metadata, missing SKU, missing brand, thin description, and Merchant schema not-ready.
2. SKU gaps across 119 products are the largest Merchant/Product structured-data blocker after metadata.
3. Metadata coverage is broad: all 3,626 products lack Emart-owned meta, and 319 have weak selected metadata.

## Recommended Batch Order

1. **Batch 1: low-score product rescue**
   - Scope: 19 products with score under 80.
   - Fix path: Woo data dry-run first, then owner-approved SKU/brand/description/meta updates.
   - Why first: highest combined SEO and Merchant risk.

2. **Batch 2: SKU and Merchant readiness cleanup**
   - Scope: 119 missing SKU, 7 invalid SKU, 3 missing price, 1 missing image, 23 Merchant schema not-ready.
   - Fix path: dry-run export with proposed changes and owner approval before mutation.
   - Why second: structured data and Merchant Center depend on trusted identifiers, price, image, and availability.

3. **Batch 3: metadata quality at scale**
   - Scope: 3,626 missing Emart meta, starting with 319 weak meta rows and high-traffic/high-inventory products.
   - Fix path: generate draft meta descriptions from visible product truth, brand, category, size, and concern; review samples before any bulk apply.
   - Why third: broad ranking/click-through upside, but lower emergency than schema-blocking data gaps.

## What Can Be Automated Safely

- Read-only CSV exports of affected product IDs/slugs/issues.
- Dry-run generation of proposed meta descriptions.
- Dry-run SKU normalization report for whitespace/format-only invalid SKUs.
- Read-only comparison of current visible PDP text, metadata, JSON-LD, and Woo source fields.
- Frontend fallback improvements that do not mutate Woo and do not fake product facts.

## What Needs Owner Approval

- Writing SKU values.
- Assigning or changing brands.
- Adding or changing product descriptions.
- Adding product images.
- Changing any price field.
- Applying generated meta descriptions in bulk.

## Next Implementation Prompt

```text
Task:
Create a read-only P6 Batch 1 low-score product rescue dry-run.

Context:
Use workspace/audit/active/product-seo-audit-20260509-205659.csv.
Target only the 19 products with score under 80.

Scope:
Read-only. Do not mutate Woo/product data, price, stock, SKU, image, checkout/cart/payment/order, or mobile.

Steps:
1. Extract product ID, slug, title, issues, SKU, brand, category, image presence, price, stock, visible text length, and Merchant readiness for the 19 rows.
2. Fetch current live PDP status/canonical/robots/schema for each.
3. Create a dry-run CSV and Markdown report with proposed owner-review actions only.
4. Separate proposed actions into SKU, brand, description/meta, image, price, and frontend-only fallback.

Output:
workspace/audit/active/p6-batch1-low-score-product-rescue-dry-run-YYYYMMDD.md
workspace/audit/active/p6-batch1-low-score-product-rescue-dry-run-YYYYMMDD.csv

Do not commit raw source audit exports.
```
