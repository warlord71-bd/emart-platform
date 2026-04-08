# VPS Deployment Checklist - April 8, 2026

Complete these steps in order to get the site fully working on VPS (5.189.188.229)

---

## ✅ Step 1: Fix Nginx Static Files (CSS/JS/Fonts)

**Status:** Required

```bash
sudo tee /etc/nginx/sites-available/emart > /dev/null << 'NGINX'
upstream nodejs_backend { server 127.0.0.1:3000; }
upstream php_fpm { server unix:/run/php/php8.2-fpm.sock; }

server {
    listen 80 default_server;
    server_name 5.189.188.229 e-mart.com.bd www.e-mart.com.bd;
    root /var/www/wordpress;

    location ~ ^/wp-json/ { try_files $uri $uri/ /index.php?$args; }
    location ~ ^/wp-admin { try_files $uri $uri/ /index.php?$args; }
    location ~ ^/wp-login\.php { try_files $uri $uri/ /index.php?$args; }
    location ~ ^/wp-content/ { try_files $uri =404; }
    location ~ ^/wp-includes/ { try_files $uri =404; }
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass php_fpm;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    # Serve Next.js static files
    location /_next/static/ {
        root /var/www/emart-platform/apps/web/.next;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location /public/ {
        root /var/www/emart-platform/apps/web;
        expires 1y;
    }

    location / {
        proxy_pass http://nodejs_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX

# Test and apply
sudo nginx -t
sudo systemctl reload nginx

# Verify CSS loads
curl -I http://5.189.188.229/_next/static/css/21dd1dc81afe26d8.css
# Should return: HTTP/1.1 200 OK
```

---

## ✅ Step 2: Fix WordPress Image URLs

**Status:** Required

Option A - Using WP-CLI:
```bash
cd /var/www/wordpress
wp option update siteurl 'http://5.189.188.229'
wp option update home 'http://5.189.188.229'
wp option get siteurl
wp option get home
```

Option B - Using MySQL directly:
```bash
mysql emart_live -e "
UPDATE wp4h_options 
SET option_value='http://5.189.188.229' 
WHERE option_name IN ('siteurl', 'home');

SELECT option_name, option_value FROM wp4h_options 
WHERE option_name IN ('siteurl', 'home');
"
```

---

## ✅ Step 3: Verify Everything Works

### 3.1 Test Homepage
```bash
curl http://5.189.188.229 | head -20
# Should show HTML with proper structure
```

### 3.2 Test API
```bash
curl http://5.189.188.229/wp-json/wc/v3/products?per_page=1 | jq '.[] | {name, price}' | head -10
# Should return product JSON data
```

### 3.3 Test in Browser
1. Open: `http://5.189.188.229`
2. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
3. Check:
   - ✅ Styling loads (not plain white)
   - ✅ Products display with images
   - ✅ Navigation works
   - ✅ Cart functionality works

### 3.4 Test Checkout
1. Click any product
2. Add to cart
3. Go to checkout: `http://5.189.188.229/checkout`
4. Check:
   - ✅ Form loads properly
   - ✅ No "Something went wrong" error
   - ✅ Shipping/payment options show

---

## ✅ Step 4: DNS Update (When Ready for Live)

Update Cloudflare DNS A record from `103.138.150.34` to `5.189.188.229`

```bash
# Verify DNS is pointing correctly
nslookup e-mart.com.bd
# Should show: 5.189.188.229
```

---

## 📋 Environment Variables

Verify these files exist on VPS:

```bash
# Web app env
cat /var/www/emart-platform/apps/web/.env.local
# Should contain:
# NEXT_PUBLIC_WOO_URL=http://5.189.188.229
# WOO_CONSUMER_KEY=ck_ff01ba6f574d9489426660c8599601c179664501
# WOO_CONSUMER_SECRET=cs_25754bbb91cb891225a4bb098682005a37334ca1
```

---

## 🔑 Critical Info

| Item | Value |
|------|-------|
| **VPS IP** | 5.189.188.229 |
| **WordPress Path** | /var/www/wordpress/ |
| **WordPress DB** | emart_live |
| **Table Prefix** | wp4h_ |
| **Next.js Path** | /var/www/emart-platform/apps/web/ |
| **Next.js Port** | 3000 |
| **API Key** | ck_ff01ba6f574d9489426660c8599601c179664501 |
| **API Secret** | cs_25754bbb91cb891225a4bb098682005a37334ca1 |

---

## ⚠️ Troubleshooting

### CSS/JS Still Not Loading (503/404)
```bash
# Check nginx error log
sudo tail -f /var/log/nginx/emart_error.log

# Check static files exist
ls -la /var/www/emart-platform/apps/web/.next/static/css/

# Verify permissions
sudo ls -la /var/www/emart-platform/apps/web/.next/static/
```

### Images Not Loading
```bash
# Check WordPress image directory
ls -la /var/www/wordpress/wp-content/uploads/

# Check MySQL URLs
mysql emart_live -e "SELECT option_name, option_value FROM wp4h_options WHERE option_name IN ('siteurl', 'home');"
```

### API Returning 404
```bash
# Test WordPress API directly
curl http://5.189.188.229/wp-json/wc/v3/products?per_page=1

# Check PHP-FPM is running
sudo systemctl status php8.2-fpm

# Check error logs
sudo tail -f /var/log/nginx/emart_error.log
```

### Next.js App Not Running
```bash
# Check if running
ps aux | grep "node.*next"

# Check port 3000
sudo netstat -tlnp | grep 3000

# Restart if needed
cd /var/www/emart-platform/apps/web
pkill -f "node.*next"
npm run start &
```

---

## 📞 Support

If you get stuck:
1. Check logs: `sudo tail -f /var/log/nginx/emart_error.log`
2. Verify services: `sudo systemctl status nginx php8.2-fpm`
3. Test endpoints manually with curl
4. Check git branch is deployed: `cd /var/www/emart-platform && git branch`

---

## ✅ Final Checklist

- [ ] Nginx config applied and tested (HTTP 200 on CSS)
- [ ] WordPress URLs updated to VPS IP
- [ ] Homepage loads with styling
- [ ] Products display with images
- [ ] API returns product data correctly
- [ ] Checkout form loads
- [ ] No console errors in browser
- [ ] All tests pass locally before DNS switch
- [ ] DNS updated to VPS IP (when ready)
- [ ] Live site working on e-mart.com.bd

---

**Created:** April 8, 2026  
**Branch:** claude/identify-recent-work-vps-bCSFy  
**Status:** Ready for deployment
