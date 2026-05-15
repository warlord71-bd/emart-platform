#!/usr/bin/env bash
set -u

SITE="${SITE:-https://e-mart.com.bd}"
HOST_HEADER="${HOST_HEADER:-e-mart.com.bd}"
PRODUCT_PATH="${PRODUCT_PATH:-/shop/some-by-mi-beta-panthenol-repair-toner-150ml}"
CATEGORY_PATH="${CATEGORY_PATH:-/category/toners-mists}"

failures=0

pass() {
  printf 'PASS %s\n' "$1"
}

fail() {
  printf 'FAIL %s\n' "$1"
  failures=$((failures + 1))
}

http_code() {
  curl -sS -o /dev/null -w '%{http_code}' "$1"
}

redirect_target() {
  curl -sS -o /dev/null -w '%{redirect_url}' "$1"
}

expect_code() {
  local label="$1"
  local url="$2"
  local expected="$3"
  local code
  code="$(http_code "$url" || true)"
  if [ "$code" = "$expected" ]; then
    pass "$label -> $code"
  else
    fail "$label expected $expected, got ${code:-curl-error}"
  fi
}

expect_redirect() {
  local label="$1"
  local url="$2"
  local expected="$3"
  local code target
  code="$(http_code "$url" || true)"
  target="$(redirect_target "$url" || true)"
  if { [ "$code" = "301" ] || [ "$code" = "308" ]; } && [ "$target" = "$expected" ]; then
    pass "$label -> $code $target"
  else
    fail "$label expected 301/308 to $expected, got ${code:-curl-error} ${target:-no-location}"
  fi
}

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

printf 'Emart SEO/backend smoke test\n'
printf 'Site: %s\n\n' "$SITE"

expect_code 'public /graphql blocked' "$SITE/graphql" '403'
expect_code 'public /wp-json/ index blocked' "$SITE/wp-json/" '403'
expect_code 'public /wp-json/emart/v1 still available' "$SITE/wp-json/emart/v1" '200'
expect_code 'public /wp-json/wc/v3 blocked without auth/origin' "$SITE/wp-json/wc/v3" '403'
expect_code 'public wp users blocked' "$SITE/wp-json/wp/v2/users" '403'
expect_code 'xmlrpc blocked' "$SITE/xmlrpc.php" '403'

local_gql_code="$(
  curl -sS -o "$tmpdir/graphql.json" -w '%{http_code}' \
    'http://127.0.0.1/graphql' \
    -H "Host: $HOST_HEADER" \
    -H 'Content-Type: application/json' \
    -d '{"query":"{ generalSettings { title } }"}' || true
)"
if [ "$local_gql_code" = '200' ] && grep -q 'Emart Skincare Bangladesh' "$tmpdir/graphql.json"; then
  pass 'localhost GraphQL available for Next SEO'
else
  fail "localhost GraphQL expected 200 with site title, got ${local_gql_code:-curl-error}"
fi

expect_redirect 'Rank Math sitemap redirected' "$SITE/sitemap_index.xml" "$SITE/sitemap.xml"
expect_redirect 'Product sitemap redirected' "$SITE/product-sitemap1.xml" "$SITE/sitemap.xml"
expect_redirect 'Legacy category redirected' "$SITE/product-category/toners-mists" "$SITE/category/toners-mists"
expect_redirect 'Tag archive redirected' "$SITE/tag/authentic-skincare-bd" "$SITE/shop"
expect_redirect 'Noisy shop query cleaned' "$SITE/shop?per_page=48&shop_view=grid&srsltid=test" "$SITE/shop"

curl -sS "$SITE/sitemap.xml" -o "$tmpdir/sitemap.xml" || fail 'sitemap fetch failed'
if grep -Eq '/wp-json/|/graphql|/product/|/product-category/' "$tmpdir/sitemap.xml"; then
  fail 'sitemap contains backend or legacy URLs'
else
  pass 'sitemap has no backend or legacy URL leaks'
fi

curl -sS "$SITE$PRODUCT_PATH" -o "$tmpdir/product.html" || fail 'product page fetch failed'
python3 - "$tmpdir/product.html" "$SITE$PRODUCT_PATH" <<'PY'
import json
import re
import sys

path, expected_canonical = sys.argv[1], sys.argv[2]
html = open(path, encoding='utf-8', errors='ignore').read()
checks = []

title = re.search(r'<title>(.*?)</title>', html)
checks.append(('product title present', bool(title and title.group(1).strip())))
checks.append(('product title uses Emart', bool(title and '| Emart' in title.group(1))))

desc = re.search(r'meta name="description" content="([^"]+)"', html)
checks.append(('product meta description present', bool(desc and desc.group(1).strip())))

canonical = re.search(r'rel="canonical" href="([^"]+)"', html)
checks.append(('product canonical exact', bool(canonical and canonical.group(1) == expected_canonical)))

og_image = re.search(r'og:image[^>]+content="([^"]+)"', html)
checks.append(('product og:image present', bool(og_image and og_image.group(1).startswith('https://'))))

checks.append(('removed SEO tag text absent', html.count('Authentic Skincare BD') == 0))
checks.append(('app coming soon absent', html.count('App coming soon') == 0))

schema_ok = False
for raw in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S):
    try:
        data = json.loads(raw)
    except Exception:
        continue
    if data.get('@type') == 'Product':
        price = str(data.get('offers', {}).get('price', ''))
        schema_ok = bool(re.fullmatch(r'\d+(?:\.\d+)?', price))
        break
checks.append(('product schema price clean number', schema_ok))

failed = False
for label, ok in checks:
    print(('PASS ' if ok else 'FAIL ') + label)
    failed = failed or not ok
sys.exit(1 if failed else 0)
PY
if [ $? -ne 0 ]; then failures=$((failures + 1)); fi

curl -sS "$SITE$CATEGORY_PATH" -o "$tmpdir/category.html" || fail 'category page fetch failed'
python3 - "$tmpdir/category.html" "$SITE$CATEGORY_PATH" <<'PY'
import re
import sys

path, expected_canonical = sys.argv[1], sys.argv[2]
html = open(path, encoding='utf-8', errors='ignore').read()
checks = []

title = re.search(r'<title>(.*?)</title>', html)
checks.append(('category title present', bool(title and title.group(1).strip())))

desc = re.search(r'meta name="description" content="([^"]+)"', html)
checks.append(('category meta description present', bool(desc and desc.group(1).strip())))

canonical = re.search(r'rel="canonical" href="([^"]+)"', html)
checks.append(('category canonical exact', bool(canonical and canonical.group(1) == expected_canonical)))

failed = False
for label, ok in checks:
    print(('PASS ' if ok else 'FAIL ') + label)
    failed = failed or not ok
sys.exit(1 if failed else 0)
PY
if [ $? -ne 0 ]; then failures=$((failures + 1)); fi

printf '\n'
if [ "$failures" -eq 0 ]; then
  printf 'ALL CHECKS PASSED\n'
else
  printf '%s CHECK GROUP(S) FAILED\n' "$failures"
fi

exit "$failures"
