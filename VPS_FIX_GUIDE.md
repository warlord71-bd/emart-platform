# VPS Nginx Routing Fix Guide

## Issue
API requests to `/wp-json/wc/v3/products` are returning 404 errors because nginx is routing them to the Next.js application instead of to the local WordPress installation.

**Root Cause:** The nginx configuration has the catch-all location for Node.js proxy evaluated before the specific `/wp-json` location for WordPress.

## Solution
Apply the correct nginx configuration that prioritizes WordPress routes over the Node.js catch-all.

## Steps to Apply Fix

### 1. Backup Current Configuration
```bash
sudo cp /etc/nginx/sites-available/emart /etc/nginx/sites-available/emart.backup
```

### 2. Copy New Configuration
```bash
sudo cp /home/user/emart-platform/nginx/emart-vps.conf /etc/nginx/sites-available/emart
sudo chown root:root /etc/nginx/sites-available/emart
sudo chmod 644 /etc/nginx/sites-available/emart
```

### 3. Test Nginx Configuration
```bash
sudo nginx -t
```
Expected output:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration will be successful
```

### 4. If Test Passes, Reload Nginx
```bash
sudo systemctl reload nginx
```

### 5. Verify WordPress API is Working
Test the API endpoint:
```bash
curl -s "http://5.189.188.229/wp-json/wc/v3/products?per_page=1" | jq '.'
```

Should return product data, not a 404 error.

## Key Changes in New Configuration

1. **WordPress Routes First**
   - `/wp-json/` routes to PHP-FPM before the Node.js proxy
   - `/wp-admin` and `/wp-login.php` also route to PHP-FPM
   - Static WordPress files are served directly

2. **Node.js as Fallback**
   - The catch-all `location /` proxies to Node.js
   - Only handles requests that don't match WordPress routes

3. **Proper Location Block Ordering**
   ```nginx
   # More specific routes (WordPress) must come first
   location ~ ^/wp-json/ { ... }
   location ~ ^/(wp-admin|wp-login\.php) { ... }
   
   # Less specific routes (static files)
   location ~* ^/(_next|public) { ... }
   
   # Catch-all (Node.js) must be last
   location / { ... }
   ```

## Testing After Fix

### 1. Check Products Are Loading
```bash
# Should return product data
curl "http://localhost/wp-json/wc/v3/products?per_page=1"
```

### 2. Test Homepage
```bash
curl "http://localhost/" | head -50
```
Should return Next.js HTML, not WordPress

### 3. Check Logs for Errors
```bash
sudo tail -f /var/log/nginx/emart_error.log
sudo tail -f /var/log/nginx/emart_access.log
```

## Environment Variables

Make sure the web app has the correct credentials set in `.env.local`:
```
NEXT_PUBLIC_WOO_URL=http://5.189.188.229
WOO_CONSUMER_KEY=ck_ff01ba6f574d9489426660c8599601c179664501
WOO_CONSUMER_SECRET=cs_25754bbb91cb891225a4bb098682005a37334ca1
```

And rebuild the Next.js app:
```bash
cd /var/www/emart-platform/apps/web
npm run build
npm run start
```

## PHP-FPM Socket Location

The configuration assumes PHP 8.2 with socket at:
```
/run/php/php8.2-fpm.sock
```

If your PHP version is different, check:
```bash
ls /run/php/php*.sock
```

And update the configuration accordingly.

## Troubleshooting

### "Connection refused" on /wp-json
- PHP-FPM might not be running: `sudo systemctl status php8.2-fpm`
- Socket path might be wrong: `ls /run/php/`

### WordPress returns "Host not allowed"
- Update WordPress `wp-config.php` or database:
```php
define('WP_HOME', 'http://5.189.188.229');
define('WP_SITEURL', 'http://5.189.188.229');
define('FORCE_SSL_ADMIN', false);
```

### API returns 401 Unauthorized
- Check WooCommerce API credentials in `.env.local`
- Verify the API key hasn't been deleted from WordPress admin
- Try testing with curl including credentials:
```bash
curl "http://localhost/wp-json/wc/v3/products?consumer_key=your_key&consumer_secret=your_secret"
```

## Nginx Location Block Priority

In nginx, location blocks are evaluated in this order:
1. `=` (exact match) - highest priority
2. `^~` (prefix match, non-regex)
3. `~` and `~*` (regex match, case-sensitive and insensitive)
4. Prefix matches (literal strings) - lowest priority

In our configuration:
- `location ~ ^/wp-json/` uses regex with priority over `location /`
- `location /` is the catch-all fallback

This ensures WordPress routes are handled before the Node.js proxy.

## Rollback

If something goes wrong:
```bash
sudo cp /etc/nginx/sites-available/emart.backup /etc/nginx/sites-available/emart
sudo systemctl reload nginx
```

## Next Steps

1. ✅ Apply this nginx configuration
2. ✅ Verify API is returning products
3. ✅ Test checkout flow end-to-end
4. ✅ Update Cloudflare DNS (when ready)
5. ✅ Monitor error logs for issues
