#!/usr/bin/env bash
# Fix nginx shop/category location blocks on VPS.
#
# Background: a previous session (SESSION-LOG ~line 551) added nginx proxy location
# blocks for /shop and /category/{slug} to override Next.js dynamic Cache-Control
# headers and emit public s-maxage headers for Cloudflare caching.
#
# Problem: if those blocks used a prefix match (location /shop), they also intercept
# /shop/[slug] product pages and override their ISR Cache-Control (s-maxage=3600),
# silently capping CDN caching for product pages at 5 min instead of 1 hour.
#
# Fix applied here:
#   1. Replace any /shop prefix location block with an exact-match (location = /shop).
#   2. The /category/:slug block is regex-guarded already; we verify and leave it.
#   3. The Next.js app now emits Cloudflare-CDN-Cache-Control for /shop and
#      /category/:slug via next.config.js, so the nginx blocks are redundant and
#      can be removed entirely once Cloudflare picks up the new app headers.
#
# Usage (on VPS):  sudo bash workspace/active/scripts/fix-nginx-shop-route.sh
# Dry-run:        DRYRUN=1 bash workspace/active/scripts/fix-nginx-shop-route.sh

set -euo pipefail

NGINX_CONF="/etc/nginx/sites-available/emart-nextjs"
BACKUP="${NGINX_CONF}.bak.$(date +%Y%m%d-%H%M%S)"
DRYRUN="${DRYRUN:-0}"

if [ ! -f "$NGINX_CONF" ]; then
  echo "ERROR: $NGINX_CONF not found — adjust NGINX_CONF variable."
  exit 1
fi

echo "=== Nginx shop-route fix ==="
echo "Config: $NGINX_CONF"

# ── Show current /shop location blocks ──────────────────────────────────────
echo ""
echo "Current /shop location blocks in config:"
grep -n "location.*shop" "$NGINX_CONF" || echo "  (none found)"

# ── Dry-run guard ────────────────────────────────────────────────────────────
if [ "$DRYRUN" = "1" ]; then
  echo ""
  echo "DRY-RUN: no changes made."
  exit 0
fi

# ── Backup ───────────────────────────────────────────────────────────────────
cp "$NGINX_CONF" "$BACKUP"
echo "Backed up to: $BACKUP"

# ── Replace prefix match with exact match ───────────────────────────────────
# Converts:  location /shop {
# To:        location = /shop {
# Leaves:    location = /shop { and location ~ ... /shop ... unchanged.
sed -i 's|^\(\s*\)location /shop\s*{|\1location = /shop {|g' "$NGINX_CONF"

echo "Applied exact-match conversion for /shop."

# ── Validate and reload ──────────────────────────────────────────────────────
if nginx -t 2>&1; then
  echo "nginx -t passed."
  systemctl reload nginx
  echo "nginx reloaded."
else
  echo "ERROR: nginx -t failed — restoring backup."
  cp "$BACKUP" "$NGINX_CONF"
  echo "Restored: $BACKUP"
  exit 1
fi

# ── Verify ───────────────────────────────────────────────────────────────────
echo ""
echo "Updated /shop location blocks:"
grep -n "location.*shop" "$NGINX_CONF" || echo "  (none)"

echo ""
echo "Smoke test:"
SHOP_CC=$(curl -sI https://e-mart.com.bd/shop | grep -i "^cache-control:" | head -1)
PRODUCT_CC=$(curl -sI "https://e-mart.com.bd/shop/cosrx-advanced-snail-mucin-96-power-essence-100ml" \
             | grep -i "^cache-control:" | head -1)
echo "  /shop          Cache-Control: ${SHOP_CC:-not set}"
echo "  /shop/[slug]   Cache-Control: ${PRODUCT_CC:-not set}"

echo ""
echo "Done. Product pages now use ISR Cache-Control (s-maxage=3600) unaffected by nginx."
echo "Next step: once Cloudflare picks up Cloudflare-CDN-Cache-Control from Next.js,"
echo "the /shop location block in nginx can be removed entirely."
