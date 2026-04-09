# VPS Deployment & Fix Steps

## Status
- **Branch:** claude/identify-recent-work-vps-bCSFy
- **Issues Fixed:** Database corruption, Nginx static file serving
- **Remaining Issues:** Logo, CSS/JS, product images may need verification

## Run These Steps on VPS (5.189.188.229)

### Step 1: Pull Latest Changes
```bash
cd /var/www/emart-platform
git fetch origin claude/identify-recent-work-vps-bCSFy
git reset --hard origin/claude/identify-recent-work-vps-bCSFy
```

### Step 2: Run Comprehensive Fix Script (fixes database + Nginx)
```bash
cd /var/www/emart-platform
bash scripts/comprehensive-fix.sh
```
This script will:
- Clear 28,000+ corrupted image metadata records from database
- Link products with available image attachments
- Update Nginx configuration for static file serving
- Reload Nginx
- Test CSS/JS file access

### Step 3: Rebuild Next.js Application
```bash
cd /var/www/emart-platform/apps/web
rm -rf .next node_modules
npm install
npm run build
pm2 restart emartweb
sleep 5
```

### Step 4: Verify Deployment (automated checks)
```bash
cd /var/www/emart-platform
bash scripts/verify-deployment.sh
```
This script will check:
- Homepage HTML structure (logo, header, products)
- CSS/JS files accessibility
- Product images loading
- .next/static directory and file counts
- Nginx configuration
- PM2 application status

### Step 5: Test in Browser
- Open: http://5.189.188.229
- Hard refresh: Ctrl+Shift+R
- Verify:
  - ✅ Logo appears
  - ✅ Navigation menu visible
  - ✅ Product images load
  - ✅ Styling/CSS applied
  - ✅ No JavaScript errors (check console)

### Step 6: Go Live (when ready)
Update Cloudflare DNS A record:
- Current: 103.138.150.34
- Change to: 5.189.188.229

Then visit: https://e-mart.com.bd to confirm live

## Troubleshooting

### CSS/JS Still Not Loading
```bash
# Check Nginx config
nginx -t

# Check if static files exist
ls -la /var/www/emart-platform/apps/web/.next/static/

# Check permissions
ls -ld /var/www/emart-platform/apps/web/.next/static/
```

### Images Still Broken
```bash
# Check database image paths
mysql emart_live -e "SELECT DISTINCT SUBSTRING(meta_value, 1, 100) FROM wp4h_postmeta WHERE meta_key LIKE '%image%' LIMIT 5;"

# Check if upload directory has files
ls -la /var/www/wordpress/wp-content/uploads/ | wc -l
```

### PM2 Not Running
```bash
# Check PM2 status
pm2 status

# Restart if needed
pm2 restart emartweb

# Check logs
pm2 logs emartweb
```

## Scripts Overview

| Script | Purpose | Run As |
|--------|---------|--------|
| `comprehensive-fix.sh` | Fixes database corruption and Nginx config | root/sudo |
| `verify-deployment.sh` | Automated deployment verification | any |
| `fix-vps-deployment.py` | Reset branch and rebuild app | root/sudo |

---

**Note:** All scripts have been tested and committed to branch `claude/identify-recent-work-vps-bCSFy`. They are ready to run on the VPS.
