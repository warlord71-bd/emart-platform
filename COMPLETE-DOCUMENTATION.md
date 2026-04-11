# 🎀 Emart Platform — Complete Unified Documentation

**Status**: 🟢 Ready for VPS Deployment  
**Date**: 2026-04-11  
**Branch**: `claude/identify-recent-work-vps-bCSFy`  
**VPS IP**: 5.189.188.229  
**Domain**: e-mart.com.bd (www.e-mart.com.bd)

---

## 📚 Table of Contents

1. [Project Overview](#-project-overview)
2. [Design System](#-design-system)
3. [Platform Features](#-platform-features)
4. [VPS Infrastructure](#-vps-infrastructure)
5. [Deployment Guide](#-deployment-guide)
6. [Testing Checklist](#-testing-checklist)
7. [Architecture](#-architecture)
8. [Troubleshooting](#-troubleshooting)
9. [Security & API Setup](#-security--api-setup)
10. [Mobile App (React Native)](#-mobile-app-react-native)

---

## 🎯 Project Overview

**Emart** is a premium Korean & Japanese beauty e-commerce platform for Bangladesh.

### Tech Stack
- **Frontend**: Next.js 14 + React 18 + Tailwind CSS
- **Backend**: WooCommerce REST API
- **Server**: Nginx + PM2 + Node.js
- **Database**: MySQL (WordPress backend)
- **Mobile**: React Native (Expo 52)
- **Styling**: Tailwind CSS with custom Lumière design system

### Current Deployments
- **Web**: http://5.189.188.229 (running on PM2)
- **WordPress**: http://5.189.188.229/wp-admin (WooCommerce)
- **API**: http://5.189.188.229/wp-json/wc/v3 (REST API)

### What's Built
✅ Complete Homepage (8 sections)  
✅ Shop Page with Filters & Sort  
✅ Product Detail Pages  
✅ Design System (Lumière K-Beauty)  
✅ Mobile Theme (Midnight Blossom)  
✅ Mobile App Structure (18 screens)

---

## 🎨 Design System

### Color Palette (Lumière K-Beauty)

```
Primary (Blush Rose):     #F24E5E  → CTAs, buttons, primary actions
Secondary (Sage Green):   #3D8762  → Badges, secondary CTAs, accents
Accent (Gold):            #D4A017  → Ratings, premium indicators
Background (Warm Cream):  #FAF9F7  → Page backgrounds, cards
Text Primary (Dark Navy): #1a1a2e  → Headings, main text
Text Secondary (Gray):    #666666  → Descriptions, helper text
White:                    #FFFFFF  → Card backgrounds, contrast
```

### Typography

**Headings**: Noto Serif (elegant, luxury feel)
- Sizes: h1 (36px), h2 (28px), h3 (24px), h4 (20px), h5 (18px), h6 (16px)

**Body**: Plus Jakarta Sans (modern, legible)
- Regular (400), Medium (500), Semibold (600), Bold (700)
- Body (16px), Small (14px), Caption (12px)

### Tailwind Integration

All components use Lumière color classes:
```
Text:       text-lumiere-primary, text-lumiere-secondary, text-lumiere-text-primary
Background: bg-lumiere-primary, bg-lumiere-secondary, bg-lumiere-primary-light
Border:     border-lumiere-primary, border-lumiere-secondary
```

---

## ⭐ Platform Features

### 1. Homepage (8 Sections)

#### Section 1: Hero Banner
- Title: "Your Skin Deserves"
- Subtitle: "100% Authentic Korean & Japanese Skincare"
- Description text
- CTAs: "Shop Now" (primary), "🔥 View Sale" (secondary)
- Trust badges: 100% Authentic, COD Available, Fast Delivery, Easy Returns
- Hero image support (Unsplash integration)
- Responsive: Full width on all devices

#### Section 2: Shop by Category
- 8 categories in responsive grid
- Categories: Face Care ✨, Sunscreen ☀️, Serum & Toner 💧, Moisturizer 🧴, Cleanser 🫧, Hair Care 💆, Body Care 🌸, Makeup 💄
- Emoji icons for visual appeal
- Responsive: 4 cols desktop, 2-3 cols tablet, 1-2 cols mobile
- Clickable → Links to `/shop?category={slug}`

#### Section 3: Featured Products
- Displays 8 bestseller products
- 4-column grid on desktop, responsive on mobile
- Product cards show: Image, Brand, Name, ⭐ Rating (count), Price
- "View All" link in header
- Fetched from WooCommerce API

#### Section 4: Shop by Skin Concern (Tabs)
- 5 concern categories with color-coded buttons
- Concerns:
  - 🔴 Acne & Breakouts (Sage Green border)
  - 💧 Dry & Sensitive (Gold border)
  - ✨ Anti-Aging (Blush Rose border)
  - 🌙 Dark Spots & Brightening (Dark Navy border)
  - 🌿 Sensitivity (Sage Green border)
- Clickable buttons → Links to `/shop?concern={slug}`
- "Explore All Products" CTA button at bottom

#### Section 5: Flash Sale (Limited Time Offers)
- Displays on-sale products from WooCommerce
- Up to 8 sale items in 4-column grid
- Sale badges visible
- Prices show: Original (struck through) + Sale price
- "Limited time offers" subtitle

#### Section 6: Brands Showcase
- 5 popular brands displayed vertically
- Each brand shows: Logo, Name, Product Count
- Max 10 products per brand in grid
- Brands included: COSRX, ISNTREE, PURITO, SOME BY MI, LANEIGE
- "Discover More Brands" CTA button → `/brands` page
- Recently added: BrandsCarousel (2 lines, infinite scroll)

#### Section 7: Brands Carousel (NEW - Prefooter)
- 2 lines of brand logos with infinite scroll animation
- Line 1: Scrolls left ↔ right
- Line 2: Scrolls right ↔ left (opposite direction)
- Brand logos in white rounded boxes (h-16 w-32)
- Smooth continuous animation
- **Note**: ONLY on homepage, NOT on product detail pages

#### Section 8: Customer Testimonials (NEW - Prefooter)
- 3 customer review cards
- Each card shows: ⭐⭐⭐⭐⭐ (5 stars), Quote, Customer name
- 3-column grid on desktop, 1 column on mobile
- Light gray background section (bg-gray-50)

#### Section 9: B2B Banner
- "🏪 Wholesale / B2B?" heading
- Description: "Korean & Japanese cosmetics for retailers across Bangladesh"
- "Visit kcoswbd.com →" button (Blush Rose, opens in new tab)
- Light background (bg-lumiere-primary-light)

#### Section 10: Why Choose Emart
- Dark background section (text-primary color)
- "Why Choose Emart?" heading in white (Noto Serif, 28px)
- 4 benefit blocks:
  - ✅ 100% Authentic — Directly sourced from Korea & Japan
  - 🚚 Fast Delivery — Dhaka next day, nationwide 2-5 days
  - 💵 COD Available — Pay when you receive your order
  - ↩️ Easy Returns — Hassle-free return policy
- Each block: Icon (4-5xl), Title (white, semibold), Description (gray-300, small)

### 2. Shop Page (`/shop`)

**Features**:
- ✅ Responsive product grid (2-4 columns based on screen size)
- ✅ Left sidebar with filters (desktop), collapsible drawer (mobile)
- ✅ Filter categories:
  - Categories
  - Brands
  - Price range slider
  - Skin concerns
- ✅ Sort dropdown: Relevance, Price Low→High, Price High→Low, Newest, Rating
- ✅ Search integration: `/shop?q=search-term`
- ✅ Category filtering: `/shop?category=face-care`
- ✅ Brand filtering: `/shop?brand=cosrx`
- ✅ Concern filtering: `/shop?concern=acne`
- ✅ Price range filtering: `/shop?minPrice=100&maxPrice=5000`
- ✅ Pagination: `/shop?page=1`
- ✅ Combined filters: `/shop?category=face-care&brand=cosrx&minPrice=100`

### 3. Product Detail Page (`/product/[id]`)

**Features**:
- ✅ Breadcrumb navigation: Home > Category > Product
- ✅ Product gallery (main image on left)
- ✅ Product information:
  - Brand name
  - Product name (H1 tag for SEO)
  - ⭐ Rating + Review count
  - Original price (if on sale, struck through)
  - Sale price in Blush Rose color
  - Short description with bullets
  - Stock status
  - SKU-{id}
- ✅ CTA: "Add to Cart" button (full-width, Blush Rose)
- ✅ Wishlist: Heart icon
- ✅ Trust badges: 4 badges at bottom
- ✅ Sections:
  - Description tab
  - Ingredients tab
  - How to use tab
  - Reviews section
  - FAQ (Frequently Asked Questions)
  - More products from same brand (4 items max)
  - Related products / "You might also like" (4 items max)
- ✅ Dynamic routing: `/product/[id]` loads correct product

### 4. Layout Components

**MoreProductsFromBrand**:
- Shows max 4 products from same brand
- Grid layout: `flex flex-col md:flex-row gap-8`
- "→ Load More" button on right side (mobile: bottom right)
- Links to: `/shop?brand={brandName}`
- Only shows if more than 4 products exist (hasMore check)

**RelatedProducts**:
- Shows max 4 related/recommended products
- Same layout as MoreProductsFromBrand
- "→ Load More" button on right side
- Links to: `/shop`

**SectionHeader**:
- Curved yellow banner style (bg-gradient-to-r from-yellow-300 to-yellow-200)
- rounded-full styling
- Title with emoji icon on left
- "See All →" link on right
- Used for section headers across site

---

## 🖥️ VPS Infrastructure

### VPS Details
- **IP Address**: 5.189.188.229
- **OS**: Linux (Ubuntu 20.04 LTS)
- **Memory**: 4GB RAM
- **Storage**: 20GB SSD
- **CPU**: 2 vCPU

### Services Running

**1. Nginx (Web Server & Reverse Proxy)**
- Port: 80 (HTTP), 443 (HTTPS)
- Config: `/etc/nginx/sites-available/emart`
- Routes WordPress API to PHP-FPM
- Routes Next.js requests to Node.js (port 3000)
- Serves static assets from `/var/www/emart-platform/apps/web/.next`

**2. Node.js + PM2 (Web App)**
- App: Next.js application
- Port: 3000 (internal)
- Service name: `emartweb`
- Start: `pm2 start npm --name "emartweb" -- run start`
- Logs: `pm2 logs emartweb`
- Memory: ~25-30MB

**3. PHP-FPM 8.2 (WordPress Backend)**
- Socket: `/run/php/php8.2-fpm.sock`
- Config: `/etc/php/8.2/fpm/php-fpm.conf`
- Service: `php8.2-fpm`

**4. MySQL 8.0 (Database)**
- Database: `emart_live`
- User: Root access available
- Commands: `mysql emart_live -e "SELECT..."`

**5. WordPress 6.5 + WooCommerce**
- Installation: `/var/www/wordpress`
- Admin: `http://5.189.188.229/wp-admin`
- API: `http://5.189.188.229/wp-json/wc/v3`
- Credentials: Check WP admin for API keys

### Directory Structure

```
VPS (/var/www/)
├── wordpress/                          # WordPress installation
│   ├── wp-admin/
│   ├── wp-content/
│   ├── wp-json/
│   └── ...
│
└── emart-platform/                     # Next.js app
    ├── apps/
    │   ├── web/                        # Next.js app (running on PM2)
    │   │   ├── .next/                  # Built app (served by Nginx)
    │   │   ├── src/
    │   │   ├── public/
    │   │   ├── .env.local              # Environment variables
    │   │   └── package.json
    │   │
    │   └── mobile/                     # React Native app (source)
    │       ├── src/
    │       ├── app.json
    │       └── package.json
    │
    ├── nginx/
    │   └── emart-vps.conf              # Nginx config (reference)
    │
    ├── .git/                           # Git repo
    ├── docs/                           # Documentation
    └── ...
```

---

## 🚀 Deployment Guide

### Step 1: SSH to VPS

```bash
ssh root@5.189.188.229
cd /var/www/emart-platform
```

### Step 2: Pull Latest Code

```bash
git fetch origin claude/identify-recent-work-vps-bCSFy
git checkout claude/identify-recent-work-vps-bCSFy
git pull origin claude/identify-recent-work-vps-bCSFy
```

### Step 3: Install Dependencies

```bash
cd apps/web
npm install --legacy-peer-deps
cd ../..
```

### Step 4: Build Next.js App

```bash
cd apps/web
npm run build
```

**Expected Output**:
```
✓ Compiled successfully
Route (app)    Size        First Load JS
├ ○ /          2.47 kB     135 kB
├ ● /[slug]    783 B       136 kB
...
```

### Step 5: Restart Web Service

```bash
pm2 restart emartweb
# OR if not running:
pm2 start npm --name "emartweb" -- run start
```

### Step 6: Verify Deployment

```bash
# Check PM2 status
pm2 status
# Output: emartweb [online]

# Check logs
pm2 logs emartweb --lines 20

# Test homepage
curl http://5.189.188.229 | head -30

# Test API
curl http://5.189.188.229/wp-json/wc/v3/products?per_page=1
```

### Step 7: Update WordPress Site URL (if needed)

```bash
# Option A: Using WP-CLI
cd /var/www/wordpress
wp option update siteurl 'http://5.189.188.229'
wp option update home 'http://5.189.188.229'

# Option B: Using MySQL
mysql emart_live -e "
UPDATE wp4h_options 
SET option_value='http://5.189.188.229' 
WHERE option_name IN ('siteurl', 'home');
"
```

### Step 8: Fix Nginx Static Files (if CSS/JS not loading)

```bash
# Update Nginx config
sudo cp /var/www/emart-platform/nginx/emart-vps.conf /etc/nginx/sites-available/emart

# Test Nginx
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

---

## ✅ Testing Checklist

### Phase 1: Homepage Testing (Desktop)

**Test URL**: http://5.189.188.229/

**Hero Section**:
- [ ] Page loads without console errors
- [ ] Title "Your Skin Deserves" visible
- [ ] Subtitle visible
- [ ] "Shop Now" button visible and clickable (Blush Rose color)
- [ ] "🔥 View Sale" button visible and clickable
- [ ] Trust badges visible: 100% Authentic, COD Available, Fast Delivery, Easy Returns
- [ ] Hero image loads (no 404 errors)

**Shop by Category**:
- [ ] 8 categories display in grid
- [ ] All category names visible with emoji
- [ ] Categories: Face Care, Sunscreen, Serum & Toner, Moisturizer, Cleanser, Hair Care, Body Care, Makeup
- [ ] Grid responsive: 4 cols on desktop
- [ ] Hover effect works (shadow/color change)

**Featured Products**:
- [ ] Section header visible with "Featured Products" title
- [ ] Products display in 4-column grid
- [ ] Each product shows: image, brand, name, rating, price
- [ ] No 404 errors for images
- [ ] "View All" link works

**Shop by Concern**:
- [ ] 5 concern buttons visible with correct colors
- [ ] All concerns clickable
- [ ] Buttons have proper emoji icons
- [ ] "Explore All Products" button visible at bottom

**Flash Sale**:
- [ ] Section displays on-sale products
- [ ] Products show original (struck-through) + sale price
- [ ] Sale badge visible
- [ ] 4-column grid layout

**Brands Showcase**:
- [ ] 5 brands display with logos
- [ ] Each brand shows products (up to 10)
- [ ] "Discover More Brands" button visible
- [ ] Button links to `/brands` page

**Brands Carousel** (NEW):
- [ ] 2 lines of brand logos visible
- [ ] Line 1 scrolls left ↔ right
- [ ] Line 2 scrolls right ↔ left (opposite)
- [ ] Smooth continuous animation
- [ ] No scroll bars

**Customer Testimonials** (NEW):
- [ ] 3 customer review cards visible
- [ ] Each shows ⭐⭐⭐⭐⭐ and customer quote
- [ ] 3-column grid on desktop
- [ ] Light gray background section

**B2B Banner**:
- [ ] "🏪 Wholesale / B2B?" heading visible
- [ ] Description text visible
- [ ] "Visit kcoswbd.com →" button visible
- [ ] Button opens in new tab
- [ ] Light background color correct

**Why Choose Emart**:
- [ ] Dark background (text-primary color)
- [ ] Heading "Why Choose Emart?" visible in white
- [ ] 4 benefit blocks visible with icons
- [ ] Text properly contrasted

**Footer**:
- [ ] Footer displays
- [ ] All links present
- [ ] Social icons visible

### Phase 2: Shop Page Testing

**Test URL**: http://5.189.188.229/shop

**Product Grid**:
- [ ] Grid displays with products
- [ ] 4 columns on desktop, 2 on mobile
- [ ] Each product card shows: image, name, price, rating

**Filters** (Left Sidebar):
- [ ] Categories filter present
- [ ] Brands filter present
- [ ] Price range slider works
- [ ] Concerns filter present
- [ ] Filters clickable

**Sort Dropdown**:
- [ ] Dropdown visible
- [ ] Options: Relevance, Price Low-High, Price High-Low, Newest, Rating
- [ ] Sorting works (products reorder when selected)

**Test Filters**:
- [ ] Click category → products filter correctly
- [ ] Click price range → products filter
- [ ] Click concern → products filter
- [ ] URL updates with query params

**Search**:
- [ ] Test: `/shop?q=COSRX` → Shows COSRX products
- [ ] Search works in real-time

### Phase 3: Product Detail Testing

**Test URL**: Click any product from shop page (e.g., `/product/123`)

**Breadcrumb**:
- [ ] "Home > Category > Product Name" visible
- [ ] All links clickable

**Product Info**:
- [ ] Product name visible (H1 tag for SEO)
- [ ] Brand name visible
- [ ] ⭐ Rating + count visible
- [ ] Original price visible (if on sale, struck-through)
- [ ] Sale price visible in Blush Rose color
- [ ] Description visible with bullets

**Product Image**:
- [ ] Image loads (no 404)
- [ ] Image quality good
- [ ] Gallery works (if multiple images)

**Buttons**:
- [ ] "Add to Cart" button visible and clickable
- [ ] Wishlist heart icon visible
- [ ] Both full-width on mobile, side-by-side on desktop

**Sections**:
- [ ] Details tab works (Description, Ingredients, How to use)
- [ ] Reviews section displays
- [ ] FAQ section displays (collapsible Q&A)
- [ ] More products from brand visible (if available)
- [ ] Related products visible (if available)

**Load More Buttons**:
- [ ] Desktop: "→ Load More" appears on RIGHT side, vertically centered
- [ ] Mobile: "→ Load More" appears at RIGHT corner, below grid
- [ ] Responsive layout works correctly

### Phase 4: Mobile Responsiveness

**Test URLs**: All pages at different viewport widths

**Mobile (320px)**:
- [ ] No horizontal scroll
- [ ] Text readable
- [ ] Images scaled properly
- [ ] Buttons touch-friendly (48px+ height)
- [ ] Hamburger menu visible (if present)
- [ ] 2-column product grid

**Tablet (768px)**:
- [ ] Layout optimized for tablet
- [ ] Filters may be in modal/drawer
- [ ] 3-column product grid
- [ ] No horizontal scroll

**Desktop (1280px)**:
- [ ] Full layout visible
- [ ] 4-column product grid
- [ ] Left sidebar fully visible
- [ ] Hover effects work

### Phase 5: Console & Network Debugging

**Browser DevTools (F12)**:

**Console Tab**:
- [ ] No RED errors
- [ ] Warning OK (yellow)
- [ ] Check for 404 image errors
- [ ] No undefined props

**Network Tab**:
- [ ] No 404 errors (red entries)
- [ ] No 500 errors
- [ ] Images load from correct URL
- [ ] CSS files load (/_next/static/css/)
- [ ] JS files load (/_next/static/chunks/)
- [ ] API calls respond with 200

**Images**:
- [ ] Product images load from WooCommerce API
- [ ] Hero image loads (Unsplash or fallback)
- [ ] Brand logos load
- [ ] Trust badge icons load

### Phase 6: Performance Testing

**Lighthouse (Chrome DevTools)**:
- [ ] Overall score: > 80
- [ ] First Contentful Paint (FCP): < 3s
- [ ] Largest Contentful Paint (LCP): < 4s
- [ ] Cumulative Layout Shift (CLS): < 0.1
- [ ] Page load time: < 5s

### Phase 7: API Testing

```bash
# Test Products API
curl http://5.189.188.229/wp-json/wc/v3/products?per_page=5

# Test Categories API
curl http://5.189.188.229/wp-json/wc/v3/products/categories

# Test Search
curl http://5.189.188.229/wp-json/wc/v3/products?search=COSRX

# Check API Auth (if needed)
curl http://5.189.188.229/wp-json/wc/v3/products \
  -u "consumer_key:consumer_secret"
```

---

## 🏗️ Architecture

### Frontend Architecture

```
Next.js App (apps/web/)
├── app/                           # App Router
│   ├── page.tsx                   # Homepage (8 sections)
│   ├── shop/page.tsx              # Shop page with filters
│   ├── product/[id]/page.tsx      # Product detail
│   ├── category/[slug]/page.tsx   # Category page
│   ├── layout.tsx                 # Root layout
│   └── ...
│
├── components/                    # Reusable components
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   │
│   ├── home/
│   │   ├── HeroBanner.tsx
│   │   ├── CategoriesShowcaseInteractive.tsx
│   │   ├── FeaturedProductsSection.tsx
│   │   ├── FlashSaleSection.tsx
│   │   ├── ShopByConcern.tsx
│   │   ├── BrandsShowcaseInteractive.tsx
│   │   ├── BrandsCarousel.tsx
│   │   └── ...
│   │
│   └── product/
│       ├── ProductCard.tsx
│       ├── ProductImage.tsx
│       ├── ProductInfo.tsx
│       ├── DetailsTabs.tsx
│       ├── ReviewsSection.tsx
│       ├── MoreProductsFromBrand.tsx
│       ├── RelatedProducts.tsx
│       ├── SectionHeader.tsx
│       └── ...
│
├── lib/
│   ├── woocommerce.ts             # WooCommerce API functions
│   └── ...
│
├── styles/
│   └── globals.css                # Tailwind + custom CSS
│
└── tailwind.config.js             # Lumière color configuration
```

### WooCommerce API Integration

**API Endpoint**: `http://5.189.188.229/wp-json/wc/v3`

**Key Functions** (lib/woocommerce.ts):
- `getProducts(filters)` - Get all products with filters
- `getProduct(slug)` - Get single product
- `getFeaturedProducts(limit)` - Get featured products
- `getSaleProducts(limit)` - Get on-sale products
- `getCategories(filters)` - Get product categories
- `getProductsByCategory(catId, limit)` - Get products in category
- `getProductsByBrand(brandName, limit)` - Get products by brand
- `getBestSellingProducts(limit)` - Get bestsellers
- `getNewArrivals(limit)` - Get recently added products

---

## 🔧 Troubleshooting

### Issue: CSS/JS Not Loading (White Page)

**Symptoms**: Page loads but no styling, plain white background

**Solutions**:
1. Check Nginx config: `sudo nginx -t`
2. Verify .next directory exists: `ls /var/www/emart-platform/apps/web/.next/`
3. Rebuild app: `cd apps/web && npm run build && pm2 restart emartweb`
4. Check permissions: `sudo chown -R www-data:www-data /var/www/emart-platform`
5. Reload Nginx: `sudo systemctl reload nginx`

**Debug**:
```bash
curl -I http://5.189.188.229/_next/static/css/main.css
# Should return: HTTP/1.1 200 OK
```

### Issue: 404 Image Errors

**Symptoms**: Product images show broken image icons, console shows 404s

**Solutions**:
1. Check WordPress image directory: `ls /var/www/wordpress/wp-content/uploads/`
2. Verify WordPress siteurl: 
   ```bash
   mysql emart_live -e "SELECT * FROM wp4h_options WHERE option_name IN ('siteurl', 'home');"
   ```
3. Fix if needed: 
   ```bash
   mysql emart_live -e "UPDATE wp4h_options SET option_value='http://5.189.188.229' WHERE option_name IN ('siteurl', 'home');"
   ```
4. Check WooCommerce API image URLs: `curl http://5.189.188.229/wp-json/wc/v3/products?per_page=1 | jq '.[0].images'`

### Issue: API Returning 404

**Symptoms**: `/wp-json/wc/v3/products` returns 404

**Solutions**:
1. Check Nginx routing: `sudo cat /etc/nginx/sites-available/emart | grep wp-json`
2. Verify WordPress is running: `curl http://5.189.188.229/wp-admin`
3. Check PHP-FPM: `sudo systemctl status php8.2-fpm`
4. Apply correct Nginx config: `sudo cp nginx/emart-vps.conf /etc/nginx/sites-available/emart && sudo systemctl reload nginx`

### Issue: Products Not Loading on Homepage

**Symptoms**: "No products available" or blank sections

**Solutions**:
1. Check WooCommerce API is accessible: `curl http://5.189.188.229/wp-json/wc/v3/products`
2. Verify API credentials in `.env.local`:
   ```bash
   cat /var/www/emart-platform/apps/web/.env.local | grep WOO
   ```
3. Check WooCommerce API key permissions (must be "Read and Write")
4. Rebuild Next.js: `npm run build && pm2 restart emartweb`

### Issue: Slow Page Load

**Symptoms**: Page takes > 5 seconds to load

**Solutions**:
1. Check server resources: `top` or `htop`
2. Check PM2 logs: `pm2 logs emartweb`
3. Verify database performance: `mysql -e "SHOW PROCESSLIST;"`
4. Check Lighthouse scores: Open DevTools → Lighthouse
5. Optimize images (already done with Next.js Image component)
6. Enable caching: Verify `revalidate` in page.tsx files

### Issue: Mobile Layout Broken

**Symptoms**: Horizontal scroll on mobile, overlapping elements, unreadable text

**Solutions**:
1. Check responsive classes: Look for `md:` breakpoints in component code
2. Verify Tailwind config: `tailwind.config.js` has breakpoints defined
3. Test in browser DevTools responsive mode (F12 → Device toolbar)
4. Check viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1" />`
5. Rebuild with Tailwind: `npm run build`

### Issue: "Load More" Button Not Appearing or Misaligned

**Symptoms**: Load More button missing or on wrong side/position

**Solutions**:
1. Check component code: `MoreProductsFromBrand.tsx` and `RelatedProducts.tsx`
2. Verify flex classes: Should have `flex flex-col md:flex-row gap-8`
3. Button container: Should have `flex md:items-center md:justify-center justify-end`
4. On mobile: Button should be right-aligned with `justify-end`
5. On desktop: Button should be centered vertically with `md:items-center`
6. Rebuild: `npm run build && pm2 restart emartweb`

---

## 🔐 Security & API Setup

### WooCommerce API Configuration

**Step 1: Generate API Keys** (In WordPress Admin)
1. Log in: `http://5.189.188.229/wp-admin`
2. Go: **WooCommerce > Settings > Advanced > REST API**
3. Click: **Create an API key**
4. Fill in: Description, Select User (admin), Permissions (Read and Write)
5. Click: **Generate API Key**
6. Copy: Consumer Key and Consumer Secret

**Step 2: Configure Web App** (.env.local)

```
NEXT_PUBLIC_WOO_URL=http://5.189.188.229
WOO_CONSUMER_KEY=ck_ff01ba6f574d9489426660c8599601c179664501
WOO_CONSUMER_SECRET=cs_25754bbb91cb891225a4bb098682005a37334ca1
```

**Step 3: Configure Mobile App** (.env)

```
REACT_APP_WOO_URL=http://5.189.188.229/wp-json/wc/v3
REACT_APP_WOO_CONSUMER_KEY=ck_ff01ba6f574d9489426660c8599601c179664501
REACT_APP_WOO_CONSUMER_SECRET=cs_25754bbb91cb891225a4bb098682005a37334ca1
```

### Security Notes

- **Never commit `.env.local` or `.env` files** → They contain API keys
- **Always use environment variables** for production
- **Regenerate API keys** if ever exposed
- **Use HTTPS** for all API communications (when domain SSL is set up)
- **Restrict API key permissions** to minimum needed
- **Enable rate limiting** on WooCommerce API (prevent abuse)

### Current API Credentials (VPS)

```
Consumer Key:    ck_ff01ba6f574d9489426660c8599601c179664501
Consumer Secret: cs_25754bbb91cb891225a4bb098682005a37334ca1
```

---

## 📱 Mobile App (React Native)

**Status**: Ready for development  
**Framework**: Expo 52 + React Native 0.76  
**Location**: `apps/mobile/`

### Theme: Midnight Blossom (Dark Luxury)

```
Primary Header:   #1B1B2F (Dark navy with purple tint)
Accent:           #E8739E (Soft pink)
Gold Ratings:     #D4A248
Dark Background:  #0F0F1E
Text on Dark:     #FFFFFF
```

### 18 Screens Included

**Tab 1: Home**
- HomeScreen (animated header, banners, deals)
- ProductsScreen (with search/sort/filter)
- ProductDetailScreen

**Tab 2: Categories**
- CategoriesScreen (category grid)
- ProductsScreen
- ProductDetailScreen

**Tab 3: Shop**
- ProductsScreen (all products)
- ProductDetailScreen

**Tab 4: Cart**
- CartScreen (shopping cart)
- CheckoutScreen (bKash/Nagad/COD)
- OrderSuccessScreen (confirmation)
- MyOrdersScreen (order history)

**Tab 5: Account**
- AccountScreen (profile menu)
- LoginScreen
- RegisterScreen
- MyOrdersScreen
- WishlistScreen
- AddressScreen
- PaymentsScreen
- NotificationsScreen
- SupportScreen (WhatsApp)
- SettingsScreen

### Features

- ✅ Bilingual: English + বাংলা (Bengali)
- ✅ Currency: BDT (৳)
- ✅ Payment methods: bKash, Nagad, Cash on Delivery
- ✅ Free delivery over ৳2,000
- ✅ Dhaka delivery indicator
- ✅ Skeleton loaders & infinite scroll
- ✅ Persistent cart/auth via AsyncStorage
- ✅ Pull-to-refresh on home screen

### Setup & Build

```bash
cd apps/mobile

# Install dependencies
npm install

# Start development
npx expo start --clear

# Build for Android (preview)
eas build --platform android --profile preview

# Build for Android (production)
eas build --platform android --profile production
```

### File Structure

```
apps/mobile/
├── src/
│   ├── config/
│   │   └── api.js                 # WooCommerce API config
│   ├── theme/
│   │   └── colors.js              # Midnight Blossom palette
│   ├── i18n/
│   │   ├── en.js                  # English strings
│   │   └── bn.js                  # Bengali strings
│   ├── context/
│   │   ├── AuthContext.js
│   │   ├── CartContext.js
│   │   ├── LanguageContext.js
│   │   └── OrderContext.js
│   ├── services/
│   │   └── woocommerce.js         # API service
│   ├── components/
│   │   ├── ProductCard.js
│   │   └── SearchBar.js
│   └── screens/
│       ├── HomeScreen.js
│       ├── ProductDetailScreen.js
│       ├── CartScreen.js
│       ├── CheckoutScreen.js
│       └── ... (13 more screens)
├── app.json                       # Expo config
├── eas.json                       # EAS build config
└── package.json
```

---

## 📋 Pre-Deployment Checklist

Before going live:

- [x] All code committed to branch `claude/identify-recent-work-vps-bCSFy`
- [x] Branch pushed to origin
- [x] No TypeScript errors
- [x] Dependencies listed in package.json
- [x] Environment variables documented
- [x] Image patterns configured
- [x] Tailwind colors defined
- [x] Documentation complete
- [ ] Test on VPS: Homepage loads
- [ ] Test on VPS: Shop filters work
- [ ] Test on VPS: Product detail page works
- [ ] Test on VPS: Mobile responsive
- [ ] Test on VPS: Lighthouse score > 80
- [ ] Test on VPS: No 404 errors
- [ ] Update DNS (when ready for production)
- [ ] Enable HTTPS/SSL

---

## 📞 Quick Reference

| What | Command | Details |
|------|---------|---------|
| **Deploy** | `git pull && npm run build && pm2 restart emartweb` | Full deployment cycle |
| **View Logs** | `pm2 logs emartweb` | Check app logs |
| **Restart Service** | `pm2 restart emartweb` | Restart web app |
| **Check Status** | `pm2 status` | View all processes |
| **Build App** | `npm run build` | Build Next.js |
| **Start Dev** | `npm run dev` | Local development |
| **Test API** | `curl http://5.189.188.229/wp-json/wc/v3/products` | API test |
| **MySQL Query** | `mysql emart_live -e "SELECT..."` | Database access |
| **Nginx Reload** | `sudo systemctl reload nginx` | Reload web server |
| **Fix URLs** | See WordPress section above | Update siteurl/home |

---

## 🎯 Next Steps (Start Here!)

1. **Deploy Latest Code**
   ```bash
   cd /var/www/emart-platform
   git pull origin claude/identify-recent-work-vps-bCSFy
   cd apps/web && npm run build && pm2 restart emartweb
   ```

2. **Test Homepage**: http://5.189.188.229/
   - Check all 10 sections display
   - Verify no 404 errors

3. **Test Shop**: http://5.189.188.229/shop
   - Click filters
   - Verify products load

4. **Test Product**: Click any product
   - Check detail page loads
   - Verify "Load More" buttons appear correctly

5. **Test Mobile**: F12 → Device toolbar
   - Check responsive on 320px, 768px, 1280px
   - Verify "Load More" positioning on mobile

6. **Check Performance**: F12 → Lighthouse
   - Run report
   - Aim for score > 80

7. **Verify Logs**: `pm2 logs emartweb`
   - Check for no errors
   - Watch for API issues

---

## 📝 Commit History

Latest commits on `claude/identify-recent-work-vps-bCSFy`:

```
cccda02 - Fix Load More button layout for desktop and mobile
546232b - Add BrandsCarousel and Customer Testimonials to homepage prefooter
[Previous commits...]
```

---

**Status**: 🟢 Ready to Deploy  
**Last Updated**: 2026-04-11  
**Branch**: `claude/identify-recent-work-vps-bCSFy`  
**VPS**: 5.189.188.229

---

*For detailed information about specific sections, search this document for the section name or use Ctrl+F.*
