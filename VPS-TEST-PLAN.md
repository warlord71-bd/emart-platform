# VPS Deployment & Testing Plan — Lumière K-Beauty

**Branch**: `claude/identify-recent-work-vps-bCSFy`
**VPS**: 5.189.188.229
**Date**: 2026-04-09

---

## Phase 1: Deploy to VPS

### Step 1: Pull Latest Code on VPS
```bash
# SSH into VPS
ssh root@5.189.188.229

# Navigate to project
cd /var/www/emart-platform

# Fetch and checkout branch
git fetch origin claude/identify-recent-work-vps-bCSFy
git checkout claude/identify-recent-work-vps-bCSFy

# Verify branch
git log --oneline -5
```

**Expected Output**:
```
7313c11 refactor: Restore mobile to Midnight Blossom (mobile-optimized theme)
5ab7c8e feat: Unify design system across Web and Mobile apps
526353d feat: Build Shop and Product Detail pages with Lumière design
b1cfb94 redesign: Complete homepage redesign with Lumière K-Beauty components
07b19e6 feat: Initialize Lumière K-Beauty design system with core components
```

### Step 2: Install Dependencies (if needed)
```bash
cd apps/web
npm install --legacy-peer-deps
cd ../..
```

### Step 3: Build Next.js App
```bash
cd apps/web
npm run build
```

**Expected**: No TypeScript errors, build completes successfully

### Step 4: Restart Web Service
```bash
pm2 restart emartweb
# OR
pm2 start npm --name "emartweb" -- run start
```

---

## Phase 2: Verify Homepage (Desktop View)

### Test URL: http://5.189.188.229/

**Checklist**:
- [ ] Page loads without 404 errors (check browser console)
- [ ] Hero banner displays with title "Your Skin Deserves" and subtitle visible
- [ ] Hero image loads (should be 400x400 from Unsplash or fallback to gradient)
- [ ] Trust badges visible: "100% Authentic", "COD Available", "Fast Delivery", "Easy Returns"
- [ ] Primary CTA "Shop Now" button is visible and clickable (Blush Rose color #F24E5E)
- [ ] Secondary CTA "🔥 View Sale" button visible and clickable

### Shop by Category Section
- [ ] Section header "Shop by Category" visible
- [ ] 8 category cards appear (Face Care, Sunscreen, Serum & Toner, Moisturizer, Cleanser, Hair Care, Body Care, Makeup)
- [ ] Each card has emoji icon
- [ ] Cards are responsive (should be grid of 4 on desktop, 2-3 on tablet, 1-2 on mobile)
- [ ] Hover effect works on desktop (should change color or add shadow)

### Featured Products Section
- [ ] Section header "Featured Products" with subtitle "Curated selection of bestsellers"
- [ ] Products display in 4-column grid on desktop
- [ ] Each product card shows: image, brand name, product name, rating, price
- [ ] "View All" link in top right of section
- [ ] No 404 errors for product images

### Shop by Skin Concern (Tabs)
- [ ] Section header "Shop by Skin Concern" visible
- [ ] 5 concern tabs/buttons visible:
  - 🔴 Acne & Breakouts (Sage Green border #3D8762)
  - 💧 Dry & Sensitive (Gold border #D4A017)
  - ✨ Anti-Aging (Blush Rose border #F24E5E)
  - 🌙 Dark Spots (Dark Navy border #1a1a2e)
  - 🌿 Sensitivity (Sage Green border #3D8762)
- [ ] Tabs are clickable and go to `/shop?concern={slug}`
- [ ] "Explore All Products" CTA button at bottom (Blush Rose, clickable)

### Flash Sale (On Sale Section)
- [ ] Section header "Flash Sale" with subtitle "Limited time offers on premium brands"
- [ ] Products display in 4-column grid
- [ ] Sale badge visible on products (red/discount percentage if available)
- [ ] Prices show both original and sale price (original struck through)

### Brands Showcase
- [ ] Section header "Explore Top Brands" visible
- [ ] 5 brand sections visible (COSRX, ISNTREE, PURITO, SOME BY MI, LANEIGE)
- [ ] Each brand shows: brand name, product count
- [ ] Up to 10 products displayed in grid per brand
- [ ] "Discover More Brands" CTA button at bottom (Blush Rose, clickable)
- [ ] Takes user to `/brands` page when clicked

### B2B Banner
- [ ] Banner displays: "🏪 Wholesale / B2B?" heading
- [ ] Description: "Korean & Japanese cosmetics for retailers across Bangladesh"
- [ ] "Visit kcoswbd.com →" link visible and clickable
- [ ] Link opens kcoswbd.com in new tab

### Why Choose Lumière Section
- [ ] Dark background (text-primary color #1a1a2e)
- [ ] "Why Choose Lumière?" heading in white
- [ ] 4 benefit icons/blocks visible:
  - ✅ 100% Authentic
  - 🚚 Fast Delivery
  - 💵 COD Available
  - ↩️ Easy Returns
- [ ] Each block has icon, title, and description
- [ ] Text is white on dark background (good contrast)

### Footer
- [ ] Footer displays with all sections
- [ ] Links are clickable
- [ ] Social icons visible (if present)

---

## Phase 3: Test Shop Page (with Filters)

### Test URL: http://5.189.188.229/shop

**Checklist**:
- [ ] Page loads without errors
- [ ] Page shows product grid (should be 4-column on desktop)
- [ ] Left sidebar visible with filters (on desktop):
  - [ ] Categories filter
  - [ ] Brands filter
  - [ ] Price range filter
  - [ ] Skin concern filter
- [ ] Sort dropdown visible (Sort by: Relevance, Price Low-High, Price High-Low, Newest, Rating)
- [ ] At least 8-12 products display
- [ ] Each product card shows proper information
- [ ] Pagination or infinite scroll works

### Test Filters
- [ ] Click a category → products filter
- [ ] Click a brand → products filter
- [ ] Adjust price range → products filter
- [ ] Select skin concern → products filter
- [ ] Change sort → products reorder

### Test Search
- [ ] Navigate to `/shop?q=COSRX` → shows COSRX products
- [ ] Navigate to `/shop?category=face-care` → shows face care products
- [ ] Navigate to `/shop?concern=acne` → shows acne products

---

## Phase 4: Test Product Detail Page

### Test URL: http://5.189.188.229/product/[product-id]

**Replace [product-id] with an actual product ID from the shop page**

**Checklist**:
- [ ] Page loads without errors
- [ ] Breadcrumb navigation visible (Home > Category > Product Name)
- [ ] Product image displays on left side (gallery if multiple images)
- [ ] Product information on right:
  - [ ] Brand name
  - [ ] Product name
  - [ ] Star rating + review count
  - [ ] Price (original and sale if applicable)
  - [ ] Product description
- [ ] "Add to Cart" button visible and clickable (Blush Rose, prominent)
- [ ] Wishlist/heart icon visible
- [ ] Trust badges section visible (100% Authentic, Fast Delivery, COD, Easy Returns)
- [ ] No 404 errors for images

---

## Phase 5: Test Responsive Design

### Mobile View (320px width)
- [ ] Homepage loads (use DevTools responsive design mode)
- [ ] Hero banner responsive (image scales down, text readable)
- [ ] Categories in 2-column grid on mobile
- [ ] Products in 2-column grid
- [ ] Navigation menu responsive (hamburger if applicable)
- [ ] All sections stack vertically (no horizontal scroll)

### Tablet View (768px width)
- [ ] Homepage displays 3-column product grid
- [ ] Categories show in 3-column layout
- [ ] All components properly spaced

### Desktop View (1280px width)
- [ ] Homepage displays 4-column product grid
- [ ] Categories show in 4-column layout
- [ ] All features working as described in Phase 2

---

## Phase 6: Verify Colors (Design System)

### Primary Colors Should Be:
- [ ] **Blush Rose (#F24E5E)**: Primary buttons, CTAs, active states
- [ ] **Sage Green (#3D8762)**: Secondary buttons, acne concern badges
- [ ] **Gold (#D4A017)**: Accent, premium indicators, dryness concern badges
- [ ] **Dark Navy (#1a1a2e)**: Headings, primary text, dark sections

### Check These Elements:
- [ ] "Shop Now" button is Blush Rose (#F24E5E)
- [ ] "View Sale" button is Blush Rose
- [ ] "Acne & Breakouts" badge has Sage Green color
- [ ] "Dry & Sensitive" badge has Gold/Tan color
- [ ] Product names are Dark Navy (#1a1a2e)
- [ ] Product prices are prominent and visible

---

## Phase 7: Check for JavaScript Errors

### Open Browser DevTools (F12) and Check:
- [ ] Console tab: No red errors
- [ ] Network tab: No 404 or 500 errors
- [ ] Check for CORS errors
- [ ] Check image loading (should be from WordPress/WooCommerce API)
- [ ] Performance: Page load time should be < 5 seconds

---

## Phase 8: Image Loading Fix Verification

### Current Issue:
Hardcoded WordPress image URLs return 404 on VPS

### To Verify Fix:
```bash
# On VPS, check if images are serving from WooCommerce API
curl -s http://5.189.188.229/api/products \
  | jq '.[0].image' 2>/dev/null | head -20
```

### Expected:
- [ ] Product images load from proper WooCommerce endpoints
- [ ] No hardcoded `/wp-content/uploads/` URLs in frontend
- [ ] All product images on shop and detail pages load (no 404s)

---

## Phase 9: Critical Issues to Fix

If any of these fail, create a hotfix on the branch:

### Issue 1: Build Fails
- [ ] Check TypeScript errors: `npm run build`
- [ ] Check for missing imports in components
- [ ] Verify all component exports are correct

### Issue 2: Images 404
- [ ] Verify WooCommerce API is returning image URLs
- [ ] Check if image transformation is needed
- [ ] Update image loading logic if needed

### Issue 3: Filters Not Working
- [ ] Check URL query parameters (e.g., `/shop?category=face-care`)
- [ ] Verify WooCommerce API supports filter parameters
- [ ] Check browser console for API errors

### Issue 4: Mobile Layout Broken
- [ ] Check responsive breakpoints in Tailwind
- [ ] Verify `sm:`, `md:`, `lg:` classes are correct
- [ ] Test on actual mobile device (not just DevTools)

---

## Phase 10: Success Criteria

✅ **Pass All Tests Before Merging**:
- [ ] Homepage displays all 8 sections without errors
- [ ] All images load (no 404s)
- [ ] Shop page filters work
- [ ] Product detail page displays correctly
- [ ] Responsive design works (mobile/tablet/desktop)
- [ ] Colors match design system
- [ ] No console JavaScript errors
- [ ] Page load time < 5 seconds

---

## Deployment Timeline

1. **Deploy Code** (10 min)
   - Pull branch, install dependencies, build
   
2. **Test Homepage** (15 min)
   - Verify all sections, colors, links
   
3. **Test Shop Page** (10 min)
   - Test filters, search, sorting
   
4. **Test Product Detail** (5 min)
   - Click product, verify information
   
5. **Test Responsive** (10 min)
   - Check mobile/tablet/desktop
   
6. **Fix Issues** (if needed, varies)
   - Address any 404s, styling, or functionality issues
   
7. **Final Verification** (5 min)
   - Confirm all criteria met

**Total Estimated Time**: 1-2 hours (depending on issues found)

---

## Next Steps After VPS Verification

Once VPS tests pass:
1. Merge `claude/identify-recent-work-vps-bCSFy` → `main`
2. Deploy main branch to production
3. Verify production deployment
4. Monitor for 404 errors, performance issues
5. Plan future features (Editorial pages, Quiz, etc.)

---

## Contacts & Resources

- **VPS IP**: 5.189.188.229
- **Repository**: warlord71-bd/emart-platform
- **Design System**: `/packages/design-system/colors.ts`
- **Web App**: `/apps/web/src/`
- **Mobile App**: `/apps/mobile/src/`

**Git Branch**: `claude/identify-recent-work-vps-bCSFy`

