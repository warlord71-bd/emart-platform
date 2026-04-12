# Testing Guide - Shop & Category Pagination Fixes

## What Was Fixed

### 1. ✅ Shop Page Pagination (CRITICAL FIX)
**Problem**: `/shop` page showed only 20 products with no pagination  
**Solution**: Added full pagination system with:
- Previous/Next buttons
- Smart page number display (shows first/last page + middle pages)
- Proper product count display
- Sort options (Newest, Best Sellers, Top Rated, Price)

### 2. ✅ Category Page Improvements
**Problem**: Category pages also limited to 20 products  
**Solution**: Added pagination and sort options to category pages

### 3. ✅ Better Error Handling
Added try-catch blocks and friendly error messages for both pages

---

## Pre-Deployment Testing Checklist

### Step 1: Pull Latest Code to VPS
```bash
cd /var/www/emart-platform
git fetch origin
git checkout claude-code/seo-implementation
git pull origin claude-code/seo-implementation
```

### Step 2: Rebuild and Deploy
```bash
cd apps/web
npm run build
pm2 restart emartweb
pm2 status  # Should show 'online'
```

### Step 3: Test Shop Page (`http://5.189.188.229/shop`)

#### A. Visual Checks
- [ ] Page loads without errors
- [ ] Header displays correctly (not purple, should be pink #e8197a)
- [ ] "SHOP ALL" button works and goes to /shop
- [ ] Navigation menu items work (SKINCARE ESSENTIALS dropdown, SHOP BY CONCERN, etc.)

#### B. Product Display
- [ ] Products display in 4-column grid (desktop), 2-column (mobile)
- [ ] Product cards show: image, name, price, rating, discount badge
- [ ] Product count shows correct number (e.g., "Showing 1–20 of 257 products")
- [ ] **NOT showing only 20 products** - show more exists for pagination

#### C. Pagination
- [ ] "← Previous" button appears on page 2+
- [ ] "Next →" button appears when not on last page
- [ ] Page number buttons show (e.g., 1 2 3 ... 15 16)
- [ ] Current page is highlighted in pink
- [ ] Clicking page numbers navigates correctly
- [ ] URL updates to `?page=2`, `?page=3`, etc.

#### D. Sorting
- [ ] Sort buttons visible: "Newest", "Best Sellers", "Top Rated", "Price: Low to High"
- [ ] Clicking sort option changes products order
- [ ] URL updates to `?sort=date`, `?sort=popularity`, etc.
- [ ] Current sort option is highlighted in pink

#### E. Mobile Testing (Chrome DevTools: 375px width)
- [ ] Products show in 2-column grid
- [ ] Pagination buttons are readable
- [ ] No horizontal scroll
- [ ] Touch targets are adequate size

### Step 4: Test Category Pages

#### Example URLs to Test
- `/category/face-care`
- `/category/sunscreen`
- `/category/moisturizer`

#### A. Category Page Display
- [ ] Category name shows as H1 heading
- [ ] Product count shows correctly
- [ ] Products display in grid
- [ ] Sort options available (Popular, Newest, Top Rated, Price)

#### B. Category Pagination
- [ ] If category has >20 products, pagination shows
- [ ] Previous/Next buttons work
- [ ] Page numbers navigate correctly
- [ ] URL updates with `?page=X`

### Step 5: Browser Console Check

Open any page and press F12 to check console:
- [ ] No RED errors in console
- [ ] No 404 errors for images
- [ ] No TypeScript/JavaScript errors

### Step 6: Network Tab Check

While on `/shop` page:
- [ ] Check Network tab (F12 → Network)
- [ ] No RED entries (failed requests)
- [ ] No 403 or 404 errors
- [ ] API calls succeed (if loading from WooCommerce)

### Step 7: Performance Check

- [ ] Page loads in <5 seconds
- [ ] Pagination doesn't cause full page reload (smooth)
- [ ] Images load properly
- [ ] No layout shift when images load

---

## Header Navigation Issues - Testing

The user reported header is purple and navigation doesn't work. Let's verify:

### A. Header Styling
- [ ] Header background is WHITE (not purple)
- [ ] "SHOP ALL" button is PINK #e8197a (not purple)
- [ ] Text color is DARK gray #1a1a2e (not light)
- [ ] Logo displays correctly

### B. Header Navigation Desktop
- [ ] "SHOP ALL" button navigates to `/shop`
- [ ] "SKINCARE ESSENTIALS" dropdown appears on hover
- [ ] Dropdown shows category list
- [ ] Clicking category navigates to `/category/[slug]`
- [ ] "SHOP BY CONCERN" navigates
- [ ] "Sale 🔥" navigates
- [ ] "New ✨" navigates

### C. Header Navigation Mobile
- [ ] Hamburger menu icon (☰) visible
- [ ] Clicking menu opens mobile menu
- [ ] "SHOP ALL" link visible in mobile menu
- [ ] "SKINCARE ESSENTIALS" expandable with chevron
- [ ] Other menu items visible and clickable
- [ ] Clicking menu item closes menu

---

## Troubleshooting

### Issue: "Build failed" error
```bash
# Clean and rebuild
rm -rf .next node_modules/.cache
npm run build
```

### Issue: PM2 service won't restart
```bash
pm2 kill
pm2 start npm --name emartweb -- start
pm2 save
```

### Issue: Products still show only 20
1. Check if database is returning total count correctly
2. Run: `curl -u "key:secret" "https://e-mart.com.bd/wp-json/wc/v3/products" | grep -i total`
3. Verify WooCommerce API responds correctly

### Issue: Header colors wrong (purple instead of pink)
1. Check if CSS classes are loaded: `F12 → Elements → inspect header`
2. Look for `bg-[#e8197a]` class
3. If not present, CSS build might have failed
4. Try: `npm run build` again

---

## Success Criteria

✅ All checks pass above  
✅ Shop page shows proper pagination  
✅ Category pages have pagination  
✅ Header navigation works (white header, pink buttons)  
✅ No console errors  
✅ Mobile responsive  
✅ Page load < 5 seconds  

---

## If Tests Pass

1. Document which tests passed/failed
2. Comment with results in PR or here
3. Ready to merge to main branch

## If Tests Fail

1. Document exact failure with:
   - URL where it failed
   - What should happen vs what actually happened
   - Screenshot if possible
   - Console error (if any)
2. We'll debug and fix

---

## Commands for Quick Reference

```bash
# Deploy to VPS
git push origin claude-code/seo-implementation

# On VPS - Pull, build, restart
cd /var/www/emart-platform
git fetch origin && git pull origin claude-code/seo-implementation
cd apps/web && npm run build && pm2 restart emartweb

# Check status
pm2 status
pm2 logs emartweb --lines 20

# View current branch
git status
git branch -a
```

---

**Questions?** Let me know if any test fails or is unclear!
