# P4 — Canonical Product Data & URL Audit

_Last updated: 2026-05-05_

---

## 1. Chosen canonical product URL system

**Canonical:** `/shop/[slug]`

Evidence:
- `ProductCard.tsx` links: `href={/shop/${product.slug}}`
- Sitemap (`sitemapEntries.ts`): uses `absoluteUrl('/shop/${p.slug}')` for all products
- PDP metadata canonical: `${BASE_URL}/shop/${slug}`
- JSON-LD `offer.url`: `absoluteUrl('/shop/${product.slug}')`
- Breadcrumb JSON-LD leaf item: `absoluteUrl('/shop/${product.slug}')`

---

## 2. What happens to old `/product/[slug]` and `/product/[id]`

### App-level handler: `src/app/product/[id]/page.tsx`
- Accepts both numeric IDs (`/product/12345`) and slugs
- Looks up product via `getProductById` (for numeric) or `getProduct` (for slug)
- On match: `permanentRedirect('/shop/${product.slug}')` (HTTP 308 at RSC level)
- On no match: `notFound()`

### next.config.js redirect:
```
/product/:slug → /shop/:slug (301, permanent)
```
This catches static/CDN-level requests before the app handler.

### robots.ts:
`/product/` is disallowed — old product IDs and slugs will not be crawled.

### Risk: None. Both app-level and config-level redirects are in place. No redirect loops possible since `/shop/[slug]` is handled by a different route (`src/app/shop/[slug]/page.tsx` re-exports `src/app/[slug]/page.tsx`).

---

## 3. Old WooCommerce URL findings and handling

| Old URL pattern | Status | Handler |
|---|---|---|
| `/product-category/[slug]` | ✅ 301 → `/category/[slug]` | `next.config.js` redirects |
| `/product-category/[slug]/[sub]` | ✅ 301 → `/category/[slug]/[sub]` | `next.config.js` `:slug*` wildcard |
| `/product-tag/[slug]` | ✅ 301 → `/shop` | `next.config.js` redirects |
| `/tag/[slug]` | ✅ 301 → `/shop` | `next.config.js` redirects |
| `/product/[id]` | ✅ 301 → `/shop/[slug]` | Both app handler and next.config |
| `/?p=[id]` | ✅ Disallowed in robots.txt | robots.ts |
| `/my-account[/*]` | ✅ 301 → `/account` | next.config.js |
| `/cart` | ✅ 302 → `/checkout` | next.config.js |
| `?srsltid=`, `?orderby=`, `?per_page=` etc. | ✅ Stripped via middleware 301 | `src/middleware.ts` |
| `?add-to-cart=`, `?add_to_cart=` | ✅ Stripped via middleware 301 | `src/middleware.ts` |

### Uncertain/manual review items:
- Nested WooCommerce category paths like `/category/skincare/kbeauty/` — the `[slug]` route only handles one level; nested paths would 404. These are low-risk since next.config.js handles `/product-category/:slug*` with wildcard, but `/category/[slug1]/[slug2]` is not in the app. If Google Search Console shows impressions for nested category paths, add a catch-all redirect in next.config.js. Monitor before acting.
- `?p=[id]` disallowed in robots but not actively redirected — if Google has indexed `/?p=12345`, add specific redirects only after checking Search Console for indexed pages.

---

## 4. Category blocklist

### Applied in `src/lib/product-display.ts` (shared across PDP and ProductCard):

**Blocked slugs:** `k-beauty-j-beauty`, `k-beauty`, `j-beauty`, `korean-beauty`, `japanese-beauty`, `beauty-personal-care`, `skin-care`, `skincare`, `skincare-essentials`, `products`, `all-products`, `uncategorized`, `sale`, `new-arrivals`, `featured`, `shop-by-concern`, `health-wellbeing`, `beauty-supplements`

**Blocked names (case-insensitive):** K-BEAUTY & J-BEAUTY, K-BEAUTY, J-BEAUTY, K Beauty, J Beauty, Beauty & Personal Care, Skin Care, Skincare, Products, All Products, Uncategorized, Sale, New Arrivals, Featured, Shop By Concern, Health & Wellbeing, Beauty Supplements

**Substring rules:** Any name containing "k-beauty", "j-beauty", or "beauty & personal" is also blocked.

### Propagation:
- `getProductCardEyebrow` — uses blocklist ✓
- `getCleanBreadcrumbCategory` (new in P4) — uses blocklist ✓
- `getProductBreadcrumbParent` in PDP — now delegates to `getCleanBreadcrumbCategory` ✓
- `ProductInfo.tsx` `CATEGORY_DISPLAY_EXCLUSIONS` — expanded in P4 ✓

---

## 5. Product metadata fallback rules

### Brand:
- Source: `product.brands[0].name` (WooCommerce product brand taxonomy)
- Fallback: Hide brand chip entirely — never show "Unknown Brand"
- `showBrandChip = Boolean(product.brands?.[0])` — chip only renders when brand exists

### Origin (Made In):
- Source: product attributes — "made in", "country", "origin" (in that order)
- Fallback: **Hide origin chip** — removed the previous 'South Korea' default
- Origin chip only renders when `madeIn` is truthy
- `pa_origin` attribute was bulk-assigned 2026-05-05 (see `project_origin_brand_assignment.md`)

### Size:
- Source: product attribute "size" or "volume"
- Fallback: Extract from product name using pattern `(\d+(?:\.\d+)?)\s*(ml|g|oz|L)`
- No size chip shown when neither attribute nor name pattern provides a value

### Category (PDP info box):
- Source: `CATEGORY_DISPLAY_PRIORITY` slug map → name inference from product name → first non-blocked category
- Fallback: Empty string — category row hidden from info box if no clean category found
- 'Products' was the old fallback — removed in P4

### JSON-LD Product schema:
- `price`: numeric string from `product.price` or `sale_price`, no BDT symbol
- `availability`: `InStock` / `OutOfStock` based on `stock_status`
- `brand.name`: `getProductBrandName(product) || 'Emart'` — 'Emart' as last resort (acceptable for schema validity)

---

## 6. Breadcrumb logic (PDP)

**Display breadcrumb:** Home → Shop → [Clean Product Type Category] → Product Name

**Category priority** (via `getCleanBreadcrumbCategory`):
1. Category with an explicit type label in `PRODUCT_TYPE_LABELS` (e.g., slug `sunscreen` → "Sunscreen")
2. First non-blocked category with a valid name and slug
3. `null` → breadcrumb falls back to: Home → Shop → Product Name

**Never shows:**
- K-Beauty & J-Beauty
- Any slug/name in the comprehensive blocklist
- Brand as a category replacement (brand fallback removed in P4)

**BreadcrumbList JSON-LD:** Added in P1.5, mirrors the visible breadcrumb using the same `getProductBreadcrumbParent` function (which now delegates to `getCleanBreadcrumbCategory`).

---

## 7. Sitemap/canonical/JSON-LD consistency

| Surface | URL pattern | Status |
|---|---|---|
| Sitemap products | `/shop/[slug]` | ✅ Correct |
| Sitemap categories | `/category/[slug]` | ✅ Correct — no `/product-category/` |
| Sitemap brands | `/brands/[slug]` | ✅ Correct |
| PDP canonical metadata | `/shop/[slug]` via `getProductSeo` | ✅ Correct |
| PDP JSON-LD `offer.url` | `/shop/[slug]` | ✅ Correct |
| BreadcrumbList JSON-LD leaf | `/shop/[slug]` | ✅ Correct |
| Category page canonical | `/category/[slug]` via `getCategorySeo` | ✅ Correct |
| Brand page canonical | `/brands/[slug]` | ✅ Correct |

---

## 8. Remaining manual review items

1. **Google Search Console**: Monitor for legacy URL impressions of `/product-category/*`, `/product-tag/*`, `/product/*`, `/?p=` — verify they are redirecting and losing impressions over time.

2. **Nested category paths**: `/category/skincare/kbeauty/` style paths not handled at app level. Review GSC for any indexed nested paths before adding blanket redirects.

3. **Old WooCommerce product IDs in external links**: `/product/12345` numeric IDs redirect correctly via app handler, but high-traffic external backlinks pointing to old numeric IDs should be monitored in GSC.

4. **Category name corrections in Woo**: Some products may have no non-blocked categories at all, resulting in `Home → Shop → Product` breadcrumb. These products should have their categories cleaned up in WooCommerce admin for better breadcrumb depth.

5. **Origin attribute completeness**: `pa_origin` was bulk-assigned 2026-05-05. Products without a matching brand-to-origin mapping will show no origin chip — this is correct behavior (hide > false default), but origin coverage should be reviewed in a future data pass.

6. **`?p=` indexed pages**: If Google has indexed `/?p=12345` query URLs (old WP post IDs), add targeted redirects in next.config.js after confirming which IDs are indexed via GSC.
