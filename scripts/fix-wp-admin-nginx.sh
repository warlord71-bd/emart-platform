#!/bin/bash
# Fix Emart VPS WordPress admin/login nginx routing.
# Safe behavior: backs up the current nginx site file, validates with nginx -t,
# restores the backup if validation fails, and only reloads nginx after a valid config.

set -euo pipefail

TARGET="${1:-/etc/nginx/sites-available/emart}"
BACKUP="${TARGET}.backup-$(date +%Y%m%d-%H%M%S)"
PHP_SOCK="${PHP_SOCK:-unix:/run/php/php8.2-fpm.sock}"
NODE_BACKEND="${NODE_BACKEND:-127.0.0.1:3000}"
WP_ROOT="${WP_ROOT:-/var/www/wordpress}"
APP_ROOT="${APP_ROOT:-/var/www/emart-platform}"
SITE_HOSTS="${SITE_HOSTS:-5.189.188.229 e-mart.com.bd www.e-mart.com.bd}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo bash $0"
  exit 1
fi

if [ ! -d "$WP_ROOT" ]; then
  echo "WordPress root not found: $WP_ROOT"
  exit 1
fi

if [ ! -e "$TARGET" ]; then
  echo "Nginx site file not found: $TARGET"
  exit 1
fi

cp -a "$TARGET" "$BACKUP"
echo "Backup created: $BACKUP"

cat > "$TARGET" <<NGINX
upstream nodejs_backend {
    server ${NODE_BACKEND};
}

upstream php_fpm {
    server ${PHP_SOCK};
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name ${SITE_HOSTS};

    root ${WP_ROOT};
    index index.php index.html index.htm;
    client_max_body_size 64m;

    access_log /var/log/nginx/emart_access.log;
    error_log /var/log/nginx/emart_error.log;

    location /_next/static/ {
        alias ${APP_ROOT}/apps/web/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /public/ {
        alias ${APP_ROOT}/apps/web/public/;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }

    location /wp-content/uploads/ {
        try_files \$uri =404;
        expires 30d;
        add_header Cache-Control "public";
    }

    location ~* ^/wp-content/uploads/.*\.php\$ {
        deny all;
    }

    location /wp-content/ {
        try_files \$uri =404;
        expires 30d;
        add_header Cache-Control "public";
    }

    location /wp-includes/ {
        try_files \$uri =404;
        expires 30d;
        add_header Cache-Control "public";
    }

    location = /wp-admin {
        return 301 /wp-admin/;
    }

    location /wp-admin/ {
        try_files \$uri \$uri/ /wp-admin/index.php?\$args;
    }

    location /wp-json/ {
        try_files \$uri \$uri/ /index.php?\$args;
    }

    location = /wp-login.php {
        include snippets/fastcgi-php.conf;
        fastcgi_pass php_fpm;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        fastcgi_read_timeout 60s;
    }

    location = /xmlrpc.php {
        include snippets/fastcgi-php.conf;
        fastcgi_pass php_fpm;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        fastcgi_read_timeout 60s;
    }

    location ~ ^/(wp-config\.php|wp-load\.php|wp-settings\.php|wp-blog-header\.php)\$ {
        deny all;
    }

    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass php_fpm;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        fastcgi_read_timeout 60s;
    }

    location / {
        proxy_pass http://nodejs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
    }
}
NGINX

if ! nginx -t; then
  echo "nginx -t failed. Restoring backup: $BACKUP"
  cp -a "$BACKUP" "$TARGET"
  nginx -t || true
  exit 1
fi

systemctl reload nginx
echo "nginx reloaded."

echo "Verification:"
for url in \
  "http://5.189.188.229/wp-login.php" \
  "http://5.189.188.229/wp-admin/" \
  "http://5.189.188.229/wp-admin/admin-ajax.php" \
  "http://5.189.188.229/wp-json/" \
  "http://5.189.188.229/"
do
  printf '%s -> ' "$url"
  curl -s -o /dev/null -w 'HTTP %{http_code} redirect=%{redirect_url}\n' "$url"
done

echo "Expected after fix: /wp-admin/ redirects to wp-login.php, and admin-ajax.php no longer redirects to /."
echo "Rollback if needed: cp -a '$BACKUP' '$TARGET' && nginx -t && systemctl reload nginx"
