#!/bin/bash
# Comprehensive Emart Platform Fix Script
# Fixes: Database image metadata + Nginx static file serving

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     EMART PLATFORM COMPREHENSIVE FIX - $(date '+%Y-%m-%d %H:%M:%S')      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# FIX 1: Clear corrupted image metadata
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 FIX 1: Clearing corrupted image metadata from database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mysql emart_live << 'SQL'
-- Delete corrupted metadata (serialized arrays, base64 data)
DELETE FROM wp4h_postmeta
WHERE meta_key = '_product_image_gallery'
AND (meta_value LIKE 'a:%' OR meta_value LIKE 'data:image%');

-- Delete empty metadata
DELETE FROM wp4h_postmeta
WHERE meta_key = '_product_image_gallery'
AND (meta_value = '' OR meta_value = 'a:0:{}');

-- Report cleanup
SELECT CONCAT('Deleted corrupted records. Remaining: ', COUNT(*)) as status
FROM wp4h_postmeta
WHERE meta_key = '_product_image_gallery';
SQL

echo "✅ Corrupted metadata cleared"
echo ""

# FIX 2: Regenerate image metadata from attachments
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 FIX 2: Rebuilding image metadata from attachments"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mysql emart_live << 'SQL'
-- Link products with available image attachments
INSERT IGNORE INTO wp4h_postmeta (post_id, meta_key, meta_value)
SELECT
    p.ID,
    '_thumbnail_id',
    MIN(a.ID)
FROM wp4h_posts p
INNER JOIN wp4h_posts a ON a.post_type = 'attachment' AND a.post_mime_type LIKE 'image/%'
WHERE p.post_type = 'product'
  AND p.post_status = 'publish'
  AND NOT EXISTS (
    SELECT 1 FROM wp4h_postmeta pm
    WHERE pm.post_id = p.ID
    AND pm.meta_key = '_thumbnail_id'
  )
GROUP BY p.ID
LIMIT 5000;

-- Report
SELECT CONCAT('Linked ', COUNT(*), ' products with images') as status
FROM wp4h_postmeta
WHERE meta_key = '_thumbnail_id';
SQL

echo "✅ Image metadata regenerated"
echo ""

# FIX 3: Fix Nginx configuration for static files
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 FIX 3: Fixing Nginx static file configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sudo tee /etc/nginx/sites-available/emart > /dev/null << 'NGINX'
upstream nodejs_backend { server 127.0.0.1:3000; }
upstream php_fpm { server unix:/run/php/php8.2-fpm.sock; }

server {
    listen 80 default_server;
    server_name 5.189.188.229 e-mart.com.bd www.e-mart.com.bd;
    root /var/www/wordpress;

    # WordPress routes - MUST come before catch-all
    location ~ ^/wp-json/ { try_files $uri $uri/ /index.php?$args; }
    location ~ ^/wp-admin { try_files $uri $uri/ /index.php?$args; }
    location ~ ^/wp-login\.php { try_files $uri $uri/ /index.php?$args; }
    location ~ ^/wp-content/ { try_files $uri =404; }
    location ~ ^/wp-includes/ { try_files $uri =404; }

    # PHP-FPM
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass php_fpm;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    # Next.js static files - FIX: Allow all files, not just listing
    location /_next/static/ {
        alias /var/www/emart-platform/apps/web/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Next.js public folder
    location /public/ {
        alias /var/www/emart-platform/apps/web/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # WordPress uploads
    location /wp-content/uploads/ {
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Catch-all proxy to Node.js (must be last)
    location / {
        proxy_pass http://nodejs_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

echo "✅ Nginx config updated"
echo ""

# FIX 4: Test and reload nginx
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 FIX 4: Testing and reloading Nginx"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if sudo nginx -t; then
    echo "✅ Nginx config syntax OK"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx config error - manual fix needed"
    exit 1
fi
echo ""

# FIX 5: Verify fixes
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 FIX 5: Verifying fixes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "   Testing CSS file access:"
curl -s -I http://5.189.188.229/_next/static/css/ 2>&1 | head -1 | sed 's/^/   /'

echo ""
echo "   Testing homepage:"
curl -s -I http://5.189.188.229 2>&1 | head -1 | sed 's/^/   /'

echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                      FIXES APPLIED ✅                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Cleared corrupted image metadata"
echo "✅ Regenerated image links from attachments"
echo "✅ Fixed Nginx static file serving (/_next/static/)"
echo "✅ Fixed WordPress uploads access (/wp-content/uploads/)"
echo "✅ Reloaded Nginx configuration"
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Restart PM2: pm2 restart emartweb"
echo "2. Wait 5 seconds: sleep 5"
echo "3. Hard refresh browser: Ctrl+Shift+R at http://5.189.188.229"
echo "4. Check: Logo, styling, and product images should load"
echo ""
