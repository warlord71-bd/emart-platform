# E-Mart SEO Implementation - Pre-Flight Checklist

Run this **BEFORE** starting the main implementation prompt.

## 1. Environment Verification

```bash
# A. Check Node.js version
node --version
# Required: v18+ or v20+

# B. Check project exists
ls -la /var/www/emart-platform/apps/web
# Should show: package.json, next.config.js, app/, components/

# C. Check Next.js version
cd /var/www/emart-platform/apps/web
cat package.json | grep '"next"'
# Required: "next": "^14" or "next": "^15"

# D. Check if App Router or Pages Router
ls -la app/
# If exists → App Router (good, prompt designed for this)
# If not exists, check: ls -la pages/
# If pages/ exists → Pages Router (need to modify prompt)

# E. Check TypeScript or JavaScript
ls *.config.ts
# If .ts files exist → TypeScript (good)
# If only .js files → JavaScript (need to convert examples)

# F. Check WooCommerce API integration
cat .env.local | grep WC_
# Must have: NEXT_PUBLIC_WC_API_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET
# If missing → STOP, need credentials first

# G. Check PM2 running
pm2 list
# Should show: emartweb (online)

# H. Check current build works
npm run build
# Should succeed without errors
```

## 2. Disk Space Check

```bash
df -h /var/www
# Need at least 2GB free for builds
```

## 3. Git Status

```bash
cd /var/www/emart-platform/apps/web
git status
# If uncommitted changes exist, commit or stash them first:
git add .
git commit -m "Pre-SEO snapshot"
```

## 4. Create Backup Branch

```bash
git checkout -b backup-pre-seo-$(date +%Y%m%d)
git checkout main  # or master, or development
```

## 5. Test WooCommerce API Access

```bash
# Replace with your actual credentials
curl -u "ck_XXXXX:cs_XXXXX" \
  "https://e-mart.com.bd/wp-json/wc/v3/products?per_page=1"

# Should return JSON with product data
# If 401 error → API credentials wrong
# If connection refused → Backend not reachable
```

## 6. Check Nginx Configuration

```bash
cat /etc/nginx/sites-available/emart
# Should exist and show proxy_pass to localhost:3000
```

## 7. SSL Certificate Status (If Domain Already Pointed)

```bash
certbot certificates | grep e-mart.com.bd
# If shown → SSL already configured
# If not → will need to run certbot after DNS switch
```

## 8. Current Lighthouse Baseline

```bash
# Install lighthouse if not present
npm install -g lighthouse

# Run baseline audit (via IP, before SEO work)
lighthouse http://5.189.188.229/ --only-categories=seo,performance --output=json --output-path=/tmp/baseline.json

# View scores
cat /tmp/baseline.json | grep '"score"'
```

## 9. Document Current State

Create a snapshot file:

```bash
cat > /tmp/pre-seo-state.txt <<EOF
Date: $(date)
Next.js Version: $(cat package.json | grep '"next"' | head -1)
Node Version: $(node --version)
App Router: $([ -d app ] && echo "YES" || echo "NO")
TypeScript: $([ -f tsconfig.json ] && echo "YES" || echo "NO")
PM2 Status: $(pm2 list | grep emartweb)
Last Commit: $(git log --oneline -1)
EOF

cat /tmp/pre-seo-state.txt
```

---

## RED FLAGS - STOP if Any of These Are True

❌ **STOP:** No WooCommerce API credentials in .env.local  
→ **Fix:** Get credentials from WooCommerce admin before proceeding

❌ **STOP:** `npm run build` fails  
→ **Fix:** Debug build errors first, don't add SEO on top of broken build

❌ **STOP:** Pages Router instead of App Router  
→ **Fix:** Prompt needs rewrite for Pages Router (different metadata API)

❌ **STOP:** JavaScript instead of TypeScript  
→ **Fix:** Convert all TypeScript examples to JavaScript, or upgrade to TypeScript first

❌ **STOP:** Uncommitted changes in git  
→ **Fix:** Commit or stash before starting

❌ **STOP:** Less than 2GB disk space  
→ **Fix:** Free up space, builds create large .next/ folders

❌ **STOP:** PM2 process not running  
→ **Fix:** `pm2 start npm --name emartweb -- start` first

---

## GREEN LIGHT - Proceed if All True

✅ Node.js v18+  
✅ Next.js v14+ with App Router  
✅ TypeScript configured  
✅ WooCommerce API credentials in .env.local  
✅ `npm run build` succeeds  
✅ PM2 running  
✅ Git clean or changes committed  
✅ Backup branch created  
✅ 2GB+ disk space available  
✅ WooCommerce API test returns product data  

**If all green → You can safely proceed with the main implementation prompt.**

---

## Quick Fix Commands

```bash
# Fix 1: Install missing dependencies
npm install

# Fix 2: Clean build artifacts
rm -rf .next node_modules/.cache

# Fix 3: Restart PM2
pm2 restart emartweb

# Fix 4: Check port 3000 availability
lsof -i :3000
# If occupied by another process, kill it or change port
```
