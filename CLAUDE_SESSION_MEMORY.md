# Emart Platform — Claude Session Memory
**Branch:** `claude/fix-static-files-503-kW5sl`
**Repo:** `warlord71-bd/emart-platform`
**VPS:** `5.189.188.229` (root access via SSH)
**Live URL:** `http://5.189.188.229` (Cloudflare → e-mart.com.bd)
**PM2 process:** `emartweb`
**App path on VPS:** `/var/www/emart-platform/apps/web`
**WordPress path:** `/var/www/wordpress`
**DB:** `emart_live`, user `emart_user`, pass `Emart@123456`, host `localhost`, prefix `wp4h_`

---

## Project Overview
Next.js 14 App Router e-commerce frontend for **Emart Skincare Bangladesh**.
Connects to WooCommerce REST API at `http://127.0.0.1/wp-json/wc/v3` (must use 127.0.0.1, NOT domain — Cloudflare blocks direct IP).

**Build & deploy command (VPS):**
```bash
cd /var/www/emart-platform && git pull origin claude/fix-static-files-503-kW5sl && cd apps/web && npm run build && pm2 restart emartweb
```
Note: NO root `package.json` — app is entirely in `apps/web/`. Never use `--workspace` flag.

---

## Completed Features

### 1. Brand Assignment Script
**File:** `scripts/assign_brands.py`
- Uses MySQL directly (Cloudflare blocks REST API)
- 100+ brand detection rules in `BRAND_RULES`
- Online fallback: queries **Open Beauty Facts API** for unmatched products
- Cache saved to `/tmp/brand_online_cache.json`
- Heuristic fallback: extracts first word(s) from product name
- **Result:** 3522/3565 products assigned brands (43 remaining = generic/non-brand items)
- Run: `python3 scripts/assign_brands.py` from `/var/www/emart-platform`

### 2. Header
**File:** `apps/web/src/components/layout/Header.tsx`
- HTML entity decode for category names (`&amp;` → `&`)
- Added `Brands` link to nav
- Uses plain `<img>` for logo (not Next.js Image)
- CSS marquee announcement bar

### 3. Footer
**File:** `apps/web/src/components/layout/Footer.tsx`
- Social icons as labeled buttons
- Payment icons as `<img src="/images/payment/{slug}.svg">`
- Plain `<img>` for logo

### 4. Homepage (`apps/web/src/app/page.tsx`)
Section order:
1. Hero
2. New Arrivals
3. Flash Deals
4. **Shop by Category** (tabbed pills — `ShopByCategoryTabs` client component)
5. Shop by Concern
6. **Shop by Brand** (20 brands grid with BrandImage component)
7. Featured Products
8. Why Emart

### 5. Shop by Category Tabs
**File:** `apps/web/src/components/home/ShopByCategoryTabs.tsx`
- Horizontal scrollable pill tabs
- On click → fetches `/api/category-products?slug=&limit=10`
- **BUG REPORTED:** "No products found" when clicking tabs
- Root cause: category slug mismatch between tab pill slugs and actual WooCommerce slugs
- **TODO:** Fix by using category ID instead of slug in API call

### 6. Brand Pages
- `/brands` → `apps/web/src/app/brands/page.tsx`
- `/brands/[slug]` → `apps/web/src/app/brands/[slug]/page.tsx`
- `BrandImage` client component: tries `.svg` → `.png` → `.jpg` → `.jpeg` → `.webp` → letter badge
- Brand logos in `/apps/web/public/images/brands/`
- Real downloaded logos: bioderma, garnier, isntree, jumiso, banila-co, vanicream, skinfood, revolution-skincare, simple, cosrx, laneige, innisfree, some-by-mi, cetaphil, cerave, maybelline, hada-labo, jnh

### 7. Product Detail Page ✅ LATEST WORK
**File:** `apps/web/src/components/product/ProductDetail.tsx`

**Universal UI/UX layout (mobile-first):**
1. Breadcrumb: Home › Category › Product Name
2. Image gallery + thumbnails
3. **Brand chip** (pink, clickable → `/brands/[slug]`) + Origin chip + Volume chip
4. Product name (bold)
5. Rating stars
6. Price + strikethrough + % OFF badge
7. Short description
8. **SKU** (monospace, below short desc)
9. Stock status (green dot)
10. `[−1+]` `[Add to Cart]` `[♡]` inline row
11. Trust badges (3-col bordered grid: Authentic | Delivery | Returns)
12. Payment info (pink box: bKash/Nagad/COD)
13. **Tag cloud**: purple=Concern, blue=Skin Type, gray=other (all clickable)
14. **Tabbed content**: Description / Ingredients / How To Use
15. **Sticky mobile CTA**: appears when Add to Cart scrolls out of view (IntersectionObserver, lg:hidden)

**File:** `apps/web/src/app/[slug]/page.tsx`
- "You May Also Like" section (8 related products, 2/3/4 col grid)
- "View All →" link to category

### 8. Preview File
`apps/web/public/preview-product.html` — static HTML mockup of mobile product page
Open at: `http://5.189.188.229/preview-product.html`

---

## Known Issues / TODO

### CRITICAL: Shop by Category — "No products found"
The `ShopByCategoryTabs` component fetches `/api/category-products?slug=face-care` but the actual WooCommerce category slug may differ. Fix options:
1. Use category **ID** instead of slug in the API route
2. Or map display names to actual WooCommerce slugs

**File to fix:** `apps/web/src/components/home/ShopByCategoryTabs.tsx`
**API route:** `apps/web/src/app/api/category-products/route.ts`

Check actual WooCommerce category slugs:
```sql
SELECT t.slug, t.name FROM wp4h_terms t
JOIN wp4h_term_taxonomy tt ON t.term_id = tt.term_id
WHERE tt.taxonomy = 'product_cat' ORDER BY tt.count DESC LIMIT 20;
```

### Shop by Brand — 2 rows only
Homepage shows brands in 2 rows (desktop: 5 cols × 2 = 10 brands visible).
User said "2 line a brands ja ase" — this is correct/expected behavior. "All Brands →" link goes to `/brands`.

### 43 Unmatched Products
Remaining unmatched after brand assignment:
- Korean Red Ginseng Tea (herbal, no brand)
- Mini Skincare Set (generic set)
- Korean Electric Bed Heater (not skincare)
- Hair Removal Spray (generic)
These are acceptable — no real brand name in product title.

---

## File Structure (key files)
```
apps/web/
  src/
    app/
      [slug]/page.tsx          ← product detail page
      page.tsx                 ← homepage
      brands/page.tsx          ← all brands
      brands/[slug]/page.tsx   ← brand page
      api/category-products/route.ts
    components/
      layout/Header.tsx
      layout/Footer.tsx
      product/ProductDetail.tsx  ← MAIN WORK DONE HERE
      product/ProductCard.tsx
      home/ShopByCategoryTabs.tsx
      brand/BrandImage.tsx
    lib/woocommerce.ts
  public/
    images/brands/             ← brand logos
    images/payment/            ← payment icons (bkash, nagad, etc.)
    preview-product.html       ← mobile preview mockup
scripts/
  assign_brands.py             ← brand auto-assigner
  download_brand_logos.py
```

---

## Design Tokens
- **Primary pink:** `#e8197a`
- **Dark navy:** `#1a1a2e`
- **Font:** System UI / Inter
- **Border radius:** `rounded-xl` (12px), `rounded-2xl` (16px)
- **Concern tags:** purple (`bg-purple-50 border-purple-200 text-purple-700`)
- **Skin type tags:** blue (`bg-blue-50 border-blue-200 text-blue-700`)

---

## WooCommerce API
- Base URL (on VPS): `http://127.0.0.1/wp-json/wc/v3`
- Auth: query params `consumer_key` + `consumer_secret`
- NEVER use `https://e-mart.com.bd` — Cloudflare blocks it from VPS
- Taxonomy for brand: `pa_brand` in `wp4h_term_taxonomy`

---

## Last Git Commits (recent)
- `841ef4b` — Product page Universal UI/UX: sticky CTA, breadcrumb, tabs, related products
- `85ff131` — Redesign product detail page with Universal UI/UX theme
- `1b449e0` — Add brand rules for Green Finger, WishCare, YADAH, etc.
- `16eeb90` — Add Open Beauty Facts online brand lookup
- `c2143c7` — Fix brand name: Nella White Snow → Nella
