#!/usr/bin/env bash
# SEO index-bloat audit for e-mart.com.bd
# Usage: bash scripts/audit-seo-index-bloat.sh
set -eu

SITE="https://e-mart.com.bd"
SITEMAP_URL="${SITE}/sitemap.xml"
SAMPLE_COUNT=10

echo "============================================================"
echo " E-Mart SEO Index-Bloat Audit — $(date '+%Y-%m-%d %H:%M %Z')"
echo "============================================================"
echo

# ── 1. Fetch sitemap ────────────────────────────────────────────
echo "[1/3] Fetching sitemap: $SITEMAP_URL"
SITEMAP=$(curl -fsSL --max-time 30 "$SITEMAP_URL") || {
  echo "ERROR: failed to fetch sitemap" >&2; exit 1
}

TOTAL=$(echo "$SITEMAP" | grep -oc '<loc>' || true)
SHOP_COUNT=$(echo "$SITEMAP" | grep -c '/shop/' || true)
CATEGORY_COUNT=$(echo "$SITEMAP" | grep -c '/category/' || true)
OLD_PRODUCT=$(echo "$SITEMAP" | grep -c '/product/' | grep -v '/shop/' || true)
OLD_PRODUCT_CAT=$(echo "$SITEMAP" | grep -c '/product-category/' || true)
QUERY_COUNT=$(echo "$SITEMAP" | grep -oP '(?<=<loc>)[^<]+(?=</loc>)' | grep -c '?' || true)
PRIVATE_COUNT=$(echo "$SITEMAP" | grep -cE '/(checkout|cart|my-account|order)' || true)

# more accurate old-product count (exclude /shop/ prefix)
OLD_PRODUCT=$(echo "$SITEMAP" | grep -oP '<loc>[^<]+</loc>' | grep '/product/' | grep -v '/shop/' | wc -l || true)

echo
echo "────────────────────────────────────────"
echo " Sitemap URL Counts"
echo "────────────────────────────────────────"
printf "  Total URLs           : %d\n" "$TOTAL"
printf "  /shop/ URLs          : %d\n" "$SHOP_COUNT"
printf "  /category/ URLs      : %d\n" "$CATEGORY_COUNT"
printf "  /product/ (old)      : %d\n" "$OLD_PRODUCT"
printf "  /product-category/   : %d\n" "$OLD_PRODUCT_CAT"
printf "  Query-string URLs    : %d\n" "$QUERY_COUNT"
printf "  Private URLs         : %d\n" "$PRIVATE_COUNT"
echo

# ── 2. Sample /shop/ URLs ───────────────────────────────────────
echo "[2/3] Sampling $SAMPLE_COUNT /shop/ URLs"
SHOP_URLS=$(echo "$SITEMAP" | grep -oP '(?<=<loc>)[^<]+(?=</loc>)' | grep '/shop/' | shuf | head -"$SAMPLE_COUNT")

if [[ -z "$SHOP_URLS" ]]; then
  echo "  WARNING: no /shop/ URLs found in sitemap"
else
  echo
  echo "────────────────────────────────────────"
  printf "  %-70s  %s  %s  %s  %s\n" "URL" "HTTP" "Canonical" "JSON-LD" "BDT"
  echo "────────────────────────────────────────"
  while IFS= read -r url; do
    # fetch with headers + body
    RESPONSE=$(curl -fsSL --max-time 20 -D - "$url" 2>/dev/null || echo "CURL_FAIL")

    if [[ "$RESPONSE" == "CURL_FAIL" ]]; then
      printf "  %-70s  FAIL\n" "$url"
      continue
    fi

    # HTTP status from response headers
    HTTP_STATUS=$(echo "$RESPONSE" | grep -m1 '^HTTP/' | awk '{print $2}' || echo "?")

    BODY=$(echo "$RESPONSE" | sed '1,/^\r$/d')

    # canonical check
    CANONICAL_OK="NO"
    if echo "$BODY" | grep -qi 'rel="canonical"'; then
      CANONICAL_HREF=$(echo "$BODY" | grep -oi '<link[^>]*rel="canonical"[^>]*>' | grep -oi 'href="[^"]*"' | cut -d'"' -f2 | head -1)
      if echo "$CANONICAL_HREF" | grep -q '/shop/'; then
        CANONICAL_OK="YES"
      else
        CANONICAL_OK="WRONG($CANONICAL_HREF)"
      fi
    fi

    # JSON-LD check
    JSONLD_OK="NO"
    if echo "$BODY" | grep -qi 'application/ld+json'; then
      JSONLD_OK="YES"
    fi

    # priceCurrency BDT check
    BDT_OK="NO"
    if echo "$BODY" | grep -qi '"priceCurrency".*BDT\|BDT.*"priceCurrency"'; then
      BDT_OK="YES"
    fi

    SHORT_URL="${url#$SITE}"
    printf "  %-70s  %-4s  %-8s  %-7s  %s\n" "$SHORT_URL" "$HTTP_STATUS" "$CANONICAL_OK" "$JSONLD_OK" "$BDT_OK"
  done <<< "$SHOP_URLS"
fi

echo

# ── 3. Summary ─────────────────────────────────────────────────
echo "[3/3] Summary"
echo
if [[ "$OLD_PRODUCT" -gt 0 ]] || [[ "$OLD_PRODUCT_CAT" -gt 0 ]] || [[ "$QUERY_COUNT" -gt 0 ]] || [[ "$PRIVATE_COUNT" -gt 0 ]]; then
  echo "  ACTION REQUIRED:"
  [[ "$OLD_PRODUCT" -gt 0 ]]    && echo "    - $OLD_PRODUCT old /product/ URLs still in sitemap — remove or verify redirects"
  [[ "$OLD_PRODUCT_CAT" -gt 0 ]] && echo "    - $OLD_PRODUCT_CAT /product-category/ URLs in sitemap — remove"
  [[ "$QUERY_COUNT" -gt 0 ]]    && echo "    - $QUERY_COUNT query-string URLs in sitemap — remove"
  [[ "$PRIVATE_COUNT" -gt 0 ]]  && echo "    - $PRIVATE_COUNT private URLs in sitemap (checkout/cart/account) — remove"
else
  echo "  OK: no old/query/private URL leakage detected in sitemap"
fi

echo
echo "Done."
