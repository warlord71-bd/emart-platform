#!/usr/bin/env bash
# SEO index-bloat audit for e-mart.com.bd
# Usage: bash scripts/audit-seo-index-bloat.sh
set -eu

SITE="https://e-mart.com.bd"
SITEMAP_URL="${SITE}/sitemap.xml"
ROBOTS_URL="${SITE}/robots.txt"
SAMPLE_COUNT=10

echo "============================================================"
echo " E-Mart SEO Index-Bloat Audit — $(date '+%Y-%m-%d %H:%M %Z')"
echo "============================================================"
echo

# ── 1. robots.txt check ─────────────────────────────────────────
echo "[1/4] Checking robots.txt: $ROBOTS_URL"
ROBOTS=$(curl -fsSL --max-time 15 "$ROBOTS_URL") || {
  echo "ERROR: failed to fetch robots.txt" >&2; exit 1
}

ROBOTS_BLOCKS_PRODUCT=""
ROBOTS_BLOCKS_PRODCAT=""
ROBOTS_BLOCKS_P_PARAM=""

echo "$ROBOTS" | grep -i 'Disallow.*\/product\/' | grep -v 'product-category' | grep -qv '#' && ROBOTS_BLOCKS_PRODUCT="YES" || true
echo "$ROBOTS" | grep -i 'Disallow.*\/product-category\/' | grep -qv '#' && ROBOTS_BLOCKS_PRODCAT="YES" || true
echo "$ROBOTS" | grep -i 'Disallow.*\/\?p=' | grep -qv '#' && ROBOTS_BLOCKS_P_PARAM="YES" || true

echo
echo "────────────────────────────────────────"
echo " robots.txt Migration Check"
echo "────────────────────────────────────────"
printf "  /product/ blocked       : %s\n" "${ROBOTS_BLOCKS_PRODUCT:-NO (good)}"
printf "  /product-category/ blocked: %s\n" "${ROBOTS_BLOCKS_PRODCAT:-NO (good)}"
printf "  /?p= blocked            : %s\n" "${ROBOTS_BLOCKS_P_PARAM:-NO (good)}"
echo

if [[ -n "$ROBOTS_BLOCKS_PRODUCT" ]] || [[ -n "$ROBOTS_BLOCKS_PRODCAT" ]] || [[ -n "$ROBOTS_BLOCKS_P_PARAM" ]]; then
  echo "  WARNING: robots.txt is blocking URLs that should be allowed for redirect following."
  echo "  Fix: remove Disallow rules for /product/, /product-category/, and /?p= from robots.ts"
fi

# ── 2. Fetch sitemap ────────────────────────────────────────────
echo "[2/4] Fetching sitemap: $SITEMAP_URL"
SITEMAP=$(curl -fsSL --max-time 30 "$SITEMAP_URL") || {
  echo "ERROR: failed to fetch sitemap" >&2; exit 1
}

LOCS=$(echo "$SITEMAP" | grep -oP '(?<=<loc>)[^<]+(?=</loc>)' || true)

TOTAL=$(echo "$LOCS" | grep -c . || true)
SHOP_COUNT=$(echo "$LOCS" | grep -c '/shop/' || true)
CATEGORY_COUNT=$(echo "$LOCS" | grep -c '/category/' || true)
OLD_PRODUCT=$(echo "$LOCS" | grep '/product/' | grep -cv '/shop/' || true)
OLD_PRODUCT_CAT=$(echo "$LOCS" | grep -c '/product-category/' || true)
OLD_PRODUCT_TAG=$(echo "$LOCS" | grep -c '/product-tag/' || true)
OLD_TAG=$(echo "$LOCS" | grep '/tag/' | grep -cv '/product-tag/' || true)
QUERY_COUNT=$(echo "$LOCS" | grep -c '?' || true)
PRIVATE_COUNT=$(echo "$LOCS" | grep -cE '/(checkout|cart|my-account|account|order-success|wishlist)' || true)

echo
echo "────────────────────────────────────────"
echo " Sitemap URL Counts"
echo "────────────────────────────────────────"
printf "  Total URLs             : %d\n" "$TOTAL"
printf "  /shop/ URLs            : %d\n" "$SHOP_COUNT"
printf "  /category/ URLs        : %d\n" "$CATEGORY_COUNT"
printf "  /product/ (old)        : %d\n" "$OLD_PRODUCT"
printf "  /product-category/ (old): %d\n" "$OLD_PRODUCT_CAT"
printf "  /product-tag/ (old)    : %d\n" "$OLD_PRODUCT_TAG"
printf "  /tag/ (old)            : %d\n" "$OLD_TAG"
printf "  Query-string URLs      : %d\n" "$QUERY_COUNT"
printf "  Private URLs           : %d\n" "$PRIVATE_COUNT"
echo

# ── 3. Sample /shop/ URLs ───────────────────────────────────────
echo "[3/4] Sampling $SAMPLE_COUNT /shop/ URLs"
SHOP_URLS=$(echo "$LOCS" | grep '/shop/' | shuf | head -"$SAMPLE_COUNT")

if [[ -z "$SHOP_URLS" ]]; then
  echo "  WARNING: no /shop/ URLs found in sitemap"
else
  echo
  echo "────────────────────────────────────────"
  printf "  %-70s  %s  %s  %s  %s\n" "URL" "HTTP" "Canonical" "JSON-LD" "BDT"
  echo "────────────────────────────────────────"
  while IFS= read -r url; do
    RESPONSE=$(curl -fsSL --max-time 20 -D - "$url" 2>/dev/null || echo "CURL_FAIL")

    if [[ "$RESPONSE" == "CURL_FAIL" ]]; then
      printf "  %-70s  FAIL\n" "$url"
      continue
    fi

    HTTP_STATUS=$(echo "$RESPONSE" | grep -m1 '^HTTP/' | awk '{print $2}' || echo "?")
    BODY=$(echo "$RESPONSE" | sed '1,/^\r$/d')

    CANONICAL_OK="NO"
    if echo "$BODY" | grep -qi 'rel="canonical"'; then
      CANONICAL_HREF=$(echo "$BODY" | grep -oi '<link[^>]*rel="canonical"[^>]*>' | grep -oi 'href="[^"]*"' | cut -d'"' -f2 | head -1)
      if echo "$CANONICAL_HREF" | grep -q '/shop/'; then
        CANONICAL_OK="YES"
      else
        CANONICAL_OK="WRONG($CANONICAL_HREF)"
      fi
    fi

    JSONLD_OK="NO"
    if echo "$BODY" | grep -qi 'application/ld+json'; then JSONLD_OK="YES"; fi

    BDT_OK="NO"
    if echo "$BODY" | grep -qi '"priceCurrency".*BDT\|BDT.*"priceCurrency"'; then BDT_OK="YES"; fi

    SHORT_URL="${url#$SITE}"
    printf "  %-70s  %-4s  %-8s  %-7s  %s\n" "$SHORT_URL" "$HTTP_STATUS" "$CANONICAL_OK" "$JSONLD_OK" "$BDT_OK"
  done <<< "$SHOP_URLS"
fi

echo

# ── 4. Summary ─────────────────────────────────────────────────
echo "[4/4] Summary"
echo

ISSUES=0
[[ -n "$ROBOTS_BLOCKS_PRODUCT" ]]  && { echo "  [robots] /product/ is blocked — fix robots.ts"; ISSUES=$((ISSUES+1)); }
[[ -n "$ROBOTS_BLOCKS_PRODCAT" ]]  && { echo "  [robots] /product-category/ is blocked — fix robots.ts"; ISSUES=$((ISSUES+1)); }
[[ -n "$ROBOTS_BLOCKS_P_PARAM" ]]  && { echo "  [robots] /?p= is blocked — fix robots.ts"; ISSUES=$((ISSUES+1)); }
[[ "$OLD_PRODUCT" -gt 0 ]]     && { echo "  [sitemap] $OLD_PRODUCT old /product/ URLs — verify redirects, remove from sitemap"; ISSUES=$((ISSUES+1)); }
[[ "$OLD_PRODUCT_CAT" -gt 0 ]] && { echo "  [sitemap] $OLD_PRODUCT_CAT /product-category/ URLs — remove"; ISSUES=$((ISSUES+1)); }
[[ "$OLD_PRODUCT_TAG" -gt 0 ]] && { echo "  [sitemap] $OLD_PRODUCT_TAG /product-tag/ URLs — remove"; ISSUES=$((ISSUES+1)); }
[[ "$OLD_TAG" -gt 0 ]]         && { echo "  [sitemap] $OLD_TAG /tag/ URLs — remove"; ISSUES=$((ISSUES+1)); }
[[ "$QUERY_COUNT" -gt 0 ]]     && { echo "  [sitemap] $QUERY_COUNT query-string URLs — remove"; ISSUES=$((ISSUES+1)); }
[[ "$PRIVATE_COUNT" -gt 0 ]]   && { echo "  [sitemap] $PRIVATE_COUNT private URLs (checkout/cart/account) — remove"; ISSUES=$((ISSUES+1)); }

if [[ "$ISSUES" -eq 0 ]]; then
  echo "  OK: no issues detected"
fi

echo
echo "Done."
