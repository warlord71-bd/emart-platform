#!/bin/bash
# Emart Platform Diagnostic Script
# Identifies the root cause of broken images and missing UI

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     EMART PLATFORM DIAGNOSTIC REPORT - $(date '+%Y-%m-%d %H:%M:%S')      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# CHECK 1: Image count on filesystem
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ CHECK 1: Image files on filesystem"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
UPLOAD_DIR="/var/www/wordpress/wp-content/uploads"

if [ ! -d "$UPLOAD_DIR" ]; then
    echo "❌ ERROR: Upload directory doesn't exist: $UPLOAD_DIR"
else
    TOTAL_FILES=$(find "$UPLOAD_DIR" -type f | wc -l)
    IMAGE_FILES=$(find "$UPLOAD_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" -o -name "*.gif" \) | wc -l)

    echo "✅ Upload directory exists: $UPLOAD_DIR"
    echo "   Total files: $TOTAL_FILES"
    echo "   Image files: $IMAGE_FILES"
    echo ""
    echo "   Sample images:"
    find "$UPLOAD_DIR" -type f -name "*.jpg" -o -name "*.webp" | head -5 | sed 's/^/   - /'
fi
echo ""

# CHECK 2: Database paths after SQL fix
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ CHECK 2: Database image paths (after SQL fix)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
mysql emart_live -e "
SELECT
    'Sample paths from database:' as status,
    SUBSTRING(meta_value, 1, 100) as path
FROM wp4h_postmeta
WHERE meta_key LIKE '%image%' AND meta_value IS NOT NULL
LIMIT 5;
" 2>&1 | sed 's/^/   /'
echo ""

# CHECK 3: Verify CSS/JS loading
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ CHECK 3: Next.js static files (CSS/JS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Testing: http://5.189.188.229/_next/static/"
curl -s -I http://5.189.188.229/_next/static/ 2>&1 | head -5 | sed 's/^/   /'
echo ""

# CHECK 4: Verify app is running
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ CHECK 4: PM2 Application Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 status | grep emartweb | sed 's/^/   /'
echo ""

# CHECK 5: Nginx configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ CHECK 5: Nginx Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
nginx -t 2>&1 | sed 's/^/   /'
echo ""

# CHECK 6: Homepage test
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ CHECK 6: Homepage Response"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -I http://5.189.188.229 2>&1 | head -3 | sed 's/^/   /'
echo ""

# SUMMARY
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                        DIAGNOSTIC COMPLETE                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Next: Share this output to identify the root cause"
