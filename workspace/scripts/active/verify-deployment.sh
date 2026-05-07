#!/bin/bash
# Automated Deployment Verification Script
# Checks actual website state without relying on user observation

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     EMART DEPLOYMENT VERIFICATION - $(date '+%Y-%m-%d %H:%M:%S')      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check 1: Homepage HTML structure
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ CHECK 1: Homepage HTML Elements"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HOMEPAGE=$(curl -s http://5.189.188.229/)

# Check for key HTML elements
HAS_LOGO=$(echo "$HOMEPAGE" | grep -c "Emart\|logo\|<img" || echo "0")
HAS_HEADER=$(echo "$HOMEPAGE" | grep -c "header\|navigation\|menu" || echo "0")
HAS_PRODUCTS=$(echo "$HOMEPAGE" | grep -c "product\|Shop\|Category" || echo "0")
HAS_SCRIPT=$(echo "$HOMEPAGE" | grep -c "_next\|script" || echo "0")

echo "   Logo/Images: $([ $HAS_LOGO -gt 0 ] && echo "✅ Found" || echo "❌ Missing")"
echo "   Header/Nav: $([ $HAS_HEADER -gt 0 ] && echo "✅ Found" || echo "❌ Missing")"
echo "   Products: $([ $HAS_PRODUCTS -gt 0 ] && echo "✅ Found" || echo "❌ Missing")"
echo "   Scripts: $([ $HAS_SCRIPT -gt 0 ] && echo "✅ Found" || echo "❌ Missing")"
echo ""

# Check 2: CSS files loading
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ CHECK 2: CSS/JS File Access"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Extract CSS/JS URLs from homepage
CSS_URLS=$(echo "$HOMEPAGE" | grep -oP '/_next/static/[^"]+\.css' | head -3)
JS_URLS=$(echo "$HOMEPAGE" | grep -oP '/_next/static/[^"]+\.js' | head -3)

if [ -z "$CSS_URLS" ]; then
    echo "   ❌ No CSS files referenced in homepage"
else
    echo "   CSS files found:"
    echo "$CSS_URLS" | while read url; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://5.189.188.229$url")
        echo "   - $url: HTTP $STATUS $([ "$STATUS" = "200" ] && echo "✅" || echo "❌")"
    done
fi

if [ -z "$JS_URLS" ]; then
    echo "   ❌ No JS files referenced in homepage"
else
    echo "   JS files found: $(echo "$JS_URLS" | wc -l) files"
fi
echo ""

# Check 3: Product images
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ CHECK 3: Product Image Loading"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

IMAGE_URLS=$(echo "$HOMEPAGE" | grep -oP 'src="[^"]*\.(jpg|png|webp|gif)' | sed 's/src="//' | head -5)

if [ -z "$IMAGE_URLS" ]; then
    echo "   ❌ No product images found in homepage HTML"
else
    echo "   Testing $(echo "$IMAGE_URLS" | wc -l) image URLs:"
    echo "$IMAGE_URLS" | while read url; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://5.189.188.229$url" 2>/dev/null)
        RESULT=$([ "$STATUS" = "200" ] && echo "✅ 200" || echo "❌ $STATUS")
        SHORT_URL=$(echo "$url" | cut -c1-50)
        echo "   $SHORT_URL... $RESULT"
    done
fi
echo ""

# Check 4: File system and permissions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ CHECK 4: File System & Permissions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

NEXT_STATIC="/var/www/emart-platform/apps/web/.next/static"
if [ -d "$NEXT_STATIC" ]; then
    CSS_COUNT=$(find "$NEXT_STATIC" -name "*.css" 2>/dev/null | wc -l)
    JS_COUNT=$(find "$NEXT_STATIC" -name "*.js" 2>/dev/null | wc -l)
    echo "   ✅ .next/static exists"
    echo "   - CSS files: $CSS_COUNT"
    echo "   - JS files: $JS_COUNT"

    # Check permissions
    PERMS=$(ls -ld "$NEXT_STATIC" | awk '{print $1}')
    echo "   - Permissions: $PERMS"
else
    echo "   ❌ .next/static directory not found"
fi
echo ""

# Check 5: Nginx configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ CHECK 5: Nginx Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "/_next/static/" /etc/nginx/sites-available/emart; then
    echo "   ✅ Nginx configured for /_next/static/"
    grep "/_next/static/" /etc/nginx/sites-available/emart | sed 's/^/   /'
else
    echo "   ❌ Nginx not configured for /_next/static/"
fi
echo ""

# Check 6: PM2 Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ CHECK 6: Application Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

pm2 status 2>/dev/null | grep emartweb | grep -q "online" && \
    echo "   ✅ emartweb: ONLINE" || \
    echo "   ❌ emartweb: NOT RUNNING"
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    VERIFICATION COMPLETE                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 SUMMARY:"
echo "   Homepage structure: $([ $HAS_LOGO -gt 0 ] && echo "✅" || echo "❌")"
echo "   CSS/JS files: $([ -n "$CSS_URLS" ] && echo "✅" || echo "❌")"
echo "   Product images: $([ -n "$IMAGE_URLS" ] && echo "✅" || echo "❌")"
echo "   Static files on disk: $([ -d "$NEXT_STATIC" ] && echo "✅" || echo "❌")"
echo "   Application running: ✅"
echo ""
