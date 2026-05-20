#!/usr/bin/env bash
# apply-seo-fixes.sh — run as root on VPS
# Applies Bug 1 (Nginx /shop) + Bug 2 (origins redirect build) fixes.
set -euo pipefail

NGINX_CONF="/etc/nginx/sites-enabled/emart-nextjs"
WEB_DIR="/var/www/emart-platform/apps/web"
REPO_DIR="/var/www/emart-platform"
BRANCH="claude/fix-seo-bugs-SftV1"

echo ""
echo "═══════════════════════════════════════"
echo " Emart SEO fix deploy — $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════"

# ── 1. Pull latest code ──────────────────────────────────────────────────────
echo ""
echo "▶ [1/5] Pulling $BRANCH ..."
cd "$REPO_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"
echo "    ✓ Code up to date"

# ── 2. Nginx — inject /shop location blocks ──────────────────────────────────
echo ""
echo "▶ [2/5] Patching Nginx config for /shop ..."

# Only inject if not already present
if grep -q "location = /shop" "$NGINX_CONF"; then
    echo "    ✓ /shop location block already present — skipping"
else
    # Find the line number of the first proxy_pass so we can insert before it
    INSERT_LINE=$(grep -n "proxy_pass" "$NGINX_CONF" | head -1 | cut -d: -f1)
    if [ -z "$INSERT_LINE" ]; then
        echo "    ✗ Could not find a proxy_pass line in $NGINX_CONF — edit manually"
        exit 1
    fi

    # Build the block to insert (tab-indented to match typical nginx style)
    SHOP_BLOCK=$(cat <<'NGINXBLOCK'

    # Next.js: /shop — explicit block must come before any WordPress proxy_pass
    location = /shop {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location ^~ /shop/ {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

NGINXBLOCK
)

    # Insert the block before the first proxy_pass line
    BEFORE=$((INSERT_LINE - 1))
    { head -n "$BEFORE" "$NGINX_CONF"; echo "$SHOP_BLOCK"; tail -n +"$INSERT_LINE" "$NGINX_CONF"; } \
        > "${NGINX_CONF}.tmp" && mv "${NGINX_CONF}.tmp" "$NGINX_CONF"

    echo "    ✓ Injected /shop location blocks before line $INSERT_LINE"
fi

# ── 3. Test and reload Nginx ─────────────────────────────────────────────────
echo ""
echo "▶ [3/5] Testing and reloading Nginx ..."
nginx -t
systemctl reload nginx
echo "    ✓ Nginx reloaded"

# ── 4. Build Next.js + restart PM2 ──────────────────────────────────────────
echo ""
echo "▶ [4/5] Building Next.js and restarting emartweb ..."
cd "$WEB_DIR"
npm run build
pm2 restart emartweb
sleep 3
echo "    ✓ emartweb restarted"

# ── 5. Smoke tests ───────────────────────────────────────────────────────────
echo ""
echo "▶ [5/5] Running smoke tests ..."
echo ""

# Bug 1: /shop must return Next.js HTML, not WordPress
SHOP_TITLE=$(curl -s --max-time 10 https://e-mart.com.bd/shop | grep -o '<title>[^<]*</title>' | head -1 || true)
echo "    /shop title       : $SHOP_TITLE"
if echo "$SHOP_TITLE" | grep -qi "EMart Skincare\|Shop – EMart\|Shop - EMart"; then
    echo "    ✗ FAIL — WordPress is still serving /shop"
else
    echo "    ✓ PASS — Next.js is serving /shop"
fi

echo ""

# Bug 2: /origins?country=south-korea must 301 to clean slug URL
LOCATION=$(curl -sI --max-time 10 "https://e-mart.com.bd/origins?country=south-korea" \
    | grep -i "^location:" | tr -d '\r' || true)
echo "    /origins redirect  : $LOCATION"
if echo "$LOCATION" | grep -q "/origins/south-korea"; then
    if echo "$LOCATION" | grep -q "country="; then
        echo "    ✗ FAIL — redirect target still contains ?country= param"
    else
        echo "    ✓ PASS — clean 301 to /origins/south-korea"
    fi
else
    echo "    ✗ FAIL — redirect not working or wrong target"
fi

echo ""

# Bug 2: canonical on slug page must be clean
CANONICAL=$(curl -s --max-time 10 https://e-mart.com.bd/origins/south-korea \
    | grep -o 'rel="canonical"[^>]*href="[^"]*"' | head -1 || true)
echo "    /origins/south-korea canonical: $CANONICAL"
if echo "$CANONICAL" | grep -q 'e-mart.com.bd/origins/south-korea"'; then
    echo "    ✓ PASS — canonical matches slug URL"
else
    echo "    ✗ FAIL — canonical mismatch or page not rendering"
fi

echo ""
echo "═══════════════════════════════════════"
echo " Done. Check results above."
echo "═══════════════════════════════════════"
echo ""
