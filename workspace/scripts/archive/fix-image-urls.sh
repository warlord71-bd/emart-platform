#!/bin/bash

# Fix WordPress Image URLs on VPS
# This script updates WordPress to serve images from the local VPS IP instead of old domain

echo "🔧 Fixing WordPress Image URLs..."
echo "=================================="

# WordPress database details
DB_NAME="emart_live"
TABLE_PREFIX="wp4h_"
VPS_IP="5.189.188.229"
OLD_DOMAIN="e-mart.com.bd"

# Update WordPress site options
echo "📝 Updating WordPress site URL and home options..."
mysql $DB_NAME -e "
UPDATE ${TABLE_PREFIX}options
SET option_value='http://${VPS_IP}'
WHERE option_name IN ('siteurl', 'home');
"

# Verify the changes
echo ""
echo "✅ Verifying changes..."
mysql $DB_NAME -e "
SELECT option_name, option_value
FROM ${TABLE_PREFIX}options
WHERE option_name IN ('siteurl', 'home');
"

echo ""
echo "=================================="
echo "✅ WordPress image URLs fixed!"
echo ""
echo "Images will now be served from: http://${VPS_IP}/wp-content/uploads/"
echo ""
echo "Next steps:"
echo "1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)"
echo "2. Product images should load correctly"
echo "3. If still not loading, check nginx logs:"
echo "   tail -f /var/log/nginx/emart_error.log"
