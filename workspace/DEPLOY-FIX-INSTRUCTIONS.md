# Fix Static File Serving - Deployment Instructions

The homepage is broken because Nginx is not correctly serving CSS and JavaScript static files. This causes 503 errors and the site appears unstyled.

## Root Cause
The Nginx configuration was using `root` with an incorrect path for serving Next.js static files. The correct approach is to use `alias` directives.

## Quick Fix (2 minutes)

SSH into the VPS and run:

```bash
cd /var/www/emart-platform
git fetch origin claude/build-homepage-sections-rAMmz
git checkout claude/build-homepage-sections-rAMmz
bash scripts/fix-static-serving.sh
```

That's it! The script will:
1. ✅ Update Nginx configuration with correct static file paths
2. ✅ Test and reload Nginx
3. ✅ Verify Next.js server is running
4. ✅ Check static files exist
5. ✅ Test accessibility

## What Changed

### Before (Broken)
```nginx
location ~* ^/(_next|public|images|static)/ {
    root /var/www/emart-platform/apps/web/.next;
    try_files $uri =404;
}
```
This tried to serve `/_next/static/css/file.css` from path `/var/www/emart-platform/apps/web/.next/_next/static/css/file.css` (WRONG - double `_next`)

### After (Fixed)
```nginx
location /_next/static/ {
    alias /var/www/emart-platform/apps/web/.next/static/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /public/ {
    alias /var/www/emart-platform/apps/web/public/;
}

location /wp-content/uploads/ {
    try_files $uri =404;
}
```
Now serves from the correct paths!

## Verification

After running the script, verify in your browser:

1. **Open**: http://5.189.188.229
2. **Open DevTools** (F12 → Network tab)
3. **Check**:
   - CSS file (should show 200 OK, not 503)
   - JavaScript chunks (should show 200 OK, not 503)
   - Images (should show 200 OK, not 404)

### Example Network Tab Check
```
✅ c54095bdb23c25be.css         200 OK
✅ main-4b09ec816aa91583.js     200 OK
✅ framework-f66176bb897dc684.js 200 OK
✅ logo.png                      200 OK
```

## If Still Broken

Run these diagnostics:

```bash
# Check Nginx is running
sudo systemctl status nginx

# Check Next.js server
pm2 status emartweb

# View Nginx error log
sudo tail -50 /var/log/nginx/emart_error.log

# Test CSS file exists
ls -lh /var/www/emart-platform/apps/web/.next/static/css/

# View Nginx config
sudo cat /etc/nginx/sites-available/emart
```

## Questions?

The fix is automated - just run the script and watch it work!
