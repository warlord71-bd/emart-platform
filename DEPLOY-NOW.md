# 🚀 Emart Platform — VPS Deployment (Step-by-Step)

**Status**: ✅ Code ready, branding fixed to "Emart"
**Branch**: `claude/identify-recent-work-vps-bCSFy`
**VPS**: 5.189.188.229

---

## ⚡ DEPLOYMENT COMMAND (Copy & Paste)

Run this ONE command on your VPS (via SSH or terminal):

```bash
cd /var/www/emart-platform && git fetch origin claude/identify-recent-work-vps-bCSFy && git checkout claude/identify-recent-work-vps-bCSFy && cd apps/web && npm install --legacy-peer-deps && npm run build && pm2 restart emartweb && echo "✅ DEPLOYMENT COMPLETE"
```

---

## 📋 OR Follow These Step-by-Step Commands

**If you prefer to run commands one at a time:**

### 1. SSH to VPS
```bash
ssh root@5.189.188.229
```

### 2. Navigate to project
```bash
cd /var/www/emart-platform
```

### 3. Fetch latest code from branch
```bash
git fetch origin claude/identify-recent-work-vps-bCSFy
```
**Expected output**: New commits fetched

### 4. Checkout the branch
```bash
git checkout claude/identify-recent-work-vps-bCSFy
```
**Expected output**: `Switched to branch 'claude/identify-recent-work-vps-bCSFy'`

### 5. Verify branch is correct
```bash
git log --oneline -3
```
**Expected output**: Should show latest commit: `29cdf17 fix: Change platform branding from Lumière to Emart in UI`

### 6. Install dependencies
```bash
cd apps/web
npm install --legacy-peer-deps
```
**Expected**: Dependencies install without major errors (warnings are OK)

### 7. Build Next.js app
```bash
npm run build
```
**Expected**: Build completes successfully (may take 1-3 minutes)
**Look for**: "✓ Compiled successfully" at the end

### 8. Restart web service
```bash
pm2 restart emartweb
```
**Expected**: Service restarts successfully

### 9. Check service status
```bash
pm2 status
```
**Expected**: `emartweb` should show status `online`

### 10. View logs (optional)
```bash
pm2 logs emartweb --lines 20
```
**Expected**: Should see "started successfully" or similar

---

## ✅ VERIFY DEPLOYMENT

After running the commands above, test in your browser:

### Homepage Test
Open: **http://5.189.188.229/**

Check for:
- ✅ Page loads (no 404 errors)
- ✅ Hero banner displays with "Your Skin Deserves" title
- ✅ 8 sections visible (categories, featured, concerns, sale, brands, why choose emart, footer)
- ✅ "Why Choose **Emart**?" heading (NOT "Lumière")
- ✅ Colors are correct (pink buttons, green badges, gold accents)
- ✅ Images load (check F12 Network tab for 404s)

### Shop Page Test
Open: **http://5.189.188.229/shop**

Check for:
- ✅ Product grid displays (4 columns on desktop)
- ✅ Left sidebar with filters visible
- ✅ Products load from API
- ✅ Sort dropdown works
- ✅ Click a category filter → products update

### Product Detail Test
- ✅ Click any product on shop page
- ✅ Product page loads with correct ID
- ✅ Product info displays (name, price, description)
- ✅ "Add to Cart" button visible

### Browser Console Check
- ✅ Press F12 in browser
- ✅ Click Console tab
- ✅ Should show NO red errors
- ✅ Check Network tab for 404s (should be none)

### Mobile Responsive Test
- ✅ Press F12, click responsive design mode
- ✅ Test 320px width (mobile) — should show 2-column grid
- ✅ Test 768px width (tablet) — should show 3-column grid
- ✅ Test 1280px width (desktop) — should show 4-column grid

---

## 🆘 IF SOMETHING GOES WRONG

### Error: "npm: command not found"
**Solution**: Node.js not installed on VPS
```bash
# Check Node version
node --version
npm --version

# If not installed, install Node.js first
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Error: "next: not found" during build
**Solution**: Dependencies didn't install properly
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### Error: "pm2: command not found"
**Solution**: PM2 not installed
```bash
npm install -g pm2
pm2 restart emartweb
```

### Error: "Port 3000 already in use"
**Solution**: Kill the existing process
```bash
pm2 kill
pm2 start npm --name "emartweb" -- run start -p 3000
```

### App builds but shows old content
**Solution**: Cache issue
```bash
# Clear Next.js cache and rebuild
cd /var/www/emart-platform/apps/web
rm -rf .next
npm run build
pm2 restart emartweb
```

### Images still 404
**Solution**: WooCommerce API issue (not critical for first deployment)
- Verify products load from `/api/products` endpoint
- Check if WordPress is running
- This can be fixed after initial deployment

---

## 📊 EXPECTED RESULTS

After successful deployment:

| Test | Expected Result |
|------|-----------------|
| Homepage loads | ✅ 8 sections visible, all styled correctly |
| Platform name | ✅ "Emart" (not "Lumière") in titles and headings |
| Design colors | ✅ Blush Rose (#F24E5E) buttons, Sage Green (#3D8762) badges, Gold (#D4A017) accents |
| Product grid | ✅ 4 columns on desktop, 2 columns on mobile |
| Filters work | ✅ Click category → products filter automatically |
| Images load | ✅ No 404 errors in Network tab |
| Mobile responsive | ✅ Works on 320px, 768px, 1280px widths |
| Console errors | ✅ Zero red errors in F12 console |

---

## 🎯 QUICK CHECKLIST

Before considering deployment "done":

- [ ] Ran all 10 deployment steps above
- [ ] No errors during build
- [ ] Service shows `online` status in PM2
- [ ] Homepage loads at http://5.189.188.229/
- [ ] All 8 sections display correctly
- [ ] Platform name is "Emart" (verified in headings)
- [ ] Images load (no Network 404s)
- [ ] Shop page filters work
- [ ] Product detail page shows correct product
- [ ] Mobile responsive works (tested at 320px, 768px, 1280px)
- [ ] No red errors in browser console (F12)

---

## ✨ WHAT'S DEPLOYED

This deployment includes:
- ✅ **Homepage redesign** — 8 sections with Emart branding
- ✅ **Shop page** — Full filtering, sorting, search
- ✅ **Product detail page** — Complete product information
- ✅ **Design system** — Lumière color theme (pink/green/gold)
- ✅ **Responsive design** — Mobile-first, all breakpoints
- ✅ **Branding fix** — Changed from "Lumière" to "Emart" in UI

---

## 🚀 NEXT STEPS AFTER DEPLOYMENT

1. ✅ Verify homepage displays correctly
2. ✅ Test all filters work
3. ✅ Test product details load
4. ✅ Check no 404 image errors
5. **Then**: Merge branch to `main` for production
6. **Then**: Monitor for any issues

---

## 📞 SUPPORT

See these files for detailed info:
- **VPS-TEST-PLAN.md** — Detailed testing checklist
- **DEPLOYMENT-SUMMARY.md** — Technical overview
- **DEPLOYMENT-STATUS.md** — Current status

---

**Branch**: `claude/identify-recent-work-vps-bCSFy`
**Latest Commit**: 29cdf17 (Branding fixed to Emart)
**VPS IP**: 5.189.188.229
**Status**: ✅ READY TO DEPLOY

