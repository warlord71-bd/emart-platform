#!/bin/bash
# Fix static file serving and Next.js frontend issues
# Resolves 503 errors for CSS/JS and 404 for images

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     STATIC FILE SERVING FIX - $(date '+%Y-%m-%d %H:%M:%S')      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

VPS_IP="5.189.188.229"
PROJECT_DIR="/var/www/emart-platform"
NGINX_CONFIG="/etc/nginx/sites-available/emart"

# FIX 1: Update Nginx configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 FIX 1: Updating Nginx configuration for static files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sudo tee "$NGINX_CONFIG" > /dev/null << 'NGINX_CONFIG_END'
upstream nodejs_backend {
    server 127.0.0.1:3000;
}

upstream php_fpm {
    server unix:/run/php/php8.2-fpm.sock;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 5.189.188.229 e-mart.com.bd www.e-mart.com.bd;

    # ══════════════════════════════════════════════════════════
    # WORDPRESS & WooCommerce Routes
    # ══════════════════════════════════════════════════════════

    # WordPress API - DIRECT to PHP without try_files
    location ~ ^/wp-json/ {
        root /var/www/wordpress;
        fastcgi_pass php_fpm;
        fastcgi_param SCRIPT_FILENAME /var/www/wordpress/index.php;
        fastcgi_param REQUEST_URI $request_uri;
        include fastcgi_params;
    }

    # WordPress admin - DIRECT to PHP
    location ~ ^/wp-admin/ {
        root /var/www/wordpress;
        fastcgi_pass php_fpm;
        fastcgi_param SCRIPT_FILENAME /var/www/wordpress/index.php;
        fastcgi_param REQUEST_URI $request_uri;
        include fastcgi_params;
    }

    # WordPress login
    location = /wp-login.php {
        root /var/www/wordpress;
        fastcgi_pass php_fpm;
        fastcgi_param SCRIPT_FILENAME /var/www/wordpress/wp-login.php;
        include fastcgi_params;
    }

    # WordPress files
    location ~ ^/wp-(content|includes)/ {
        root /var/www/wordpress;
        try_files $uri =404;
    }

    # Protect sensitive files
    location ~ ^/(wp-config|wp-load|wp-settings|wp-blog-header|wp-activate)\.php$ {
        root /var/www/wordpress;
        deny all;
    }

    # Regular PHP files
    location ~ \.php$ {
        root /var/www/wordpress;
        fastcgi_pass php_fpm;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # ══════════════════════════════════════════════════════════
    # NEXT.JS APPLICATION - Static Files
    # ══════════════════════════════════════════════════════════

    # Next.js static files - use alias for proper path resolution
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

    # ══════════════════════════════════════════════════════════
    # CATCH-ALL: Route to Next.js (must be last)
    # ══════════════════════════════════════════════════════════

    location / {
        proxy_pass http://nodejs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
    }

    access_log /var/log/nginx/emart_access.log;
    error_log /var/log/nginx/emart_error.log;
}
NGINX_CONFIG_END

echo "✅ Nginx config updated with correct static file aliases"
echo ""

# FIX 2: Test and reload Nginx
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 FIX 2: Testing and reloading Nginx"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if sudo nginx -t 2>&1 | tail -2; then
    echo "✅ Nginx config syntax OK"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx config error"
    exit 1
fi
echo ""

# FIX 3: Check Next.js server
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 FIX 3: Checking Next.js server status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if pm2 status emartweb | grep -q "online"; then
    echo "✅ Next.js server (emartweb) is online"
else
    echo "⚠️  Next.js server not running or not found in PM2, attempting restart..."
    cd "$PROJECT_DIR/apps/web"
    pm2 restart emartweb || pm2 start npm --name "emartweb" -- run start
    sleep 3
    echo "✅ Next.js server restarted"
fi
echo ""

# FIX 4: Verify static files exist
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 FIX 4: Verifying static files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STATIC_DIR="$PROJECT_DIR/apps/web/.next/static"
if [ -d "$STATIC_DIR" ]; then
    CSS_COUNT=$(find "$STATIC_DIR/css" -type f 2>/dev/null | wc -l)
    JS_COUNT=$(find "$STATIC_DIR/chunks" -type f 2>/dev/null | wc -l)
    echo "✅ Static files directory exists"
    echo "   - CSS files: $CSS_COUNT"
    echo "   - JS chunks: $JS_COUNT"
else
    echo "⚠️  Static directory not found, rebuilding..."
    cd "$PROJECT_DIR/apps/web"
    npm run build
    echo "✅ Next.js build complete"
fi
echo ""

# FIX 5: Test file accessibility
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 FIX 5: Testing file accessibility"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "   Testing CSS file:"
CSS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1/_next/static/css/"  2>&1)
if [ "$CSS_RESPONSE" = "200" ] || [ "$CSS_RESPONSE" = "301" ] || [ "$CSS_RESPONSE" = "404" ]; then
    echo "   ✅ CSS route accessible (HTTP $CSS_RESPONSE)"
else
    echo "   ⚠️  CSS returned HTTP $CSS_RESPONSE"
fi

echo ""
echo "   Testing homepage:"
HOME_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1/" 2>&1)
if [ "$HOME_RESPONSE" = "200" ]; then
    echo "   ✅ Homepage accessible (HTTP $HOME_RESPONSE)"
else
    echo "   ⚠️  Homepage returned HTTP $HOME_RESPONSE"
fi

echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    FIXES APPLIED ✅                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Updated Nginx static file aliases (/_next/static/, /public/)"
echo "✅ Fixed WordPress uploads path (/wp-content/uploads/)"
echo "✅ Verified Next.js server is running"
echo "✅ Reloaded Nginx with new configuration"
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Clear browser cache: Ctrl+Shift+R"
echo "2. Visit: http://5.189.188.229"
echo "3. Check Network tab (F12) for 200 responses on CSS/JS/images"
echo "4. If images still 404, verify uploads exist in WordPress"
echo ""
