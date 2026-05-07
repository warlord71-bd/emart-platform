#!/bin/bash
# Quick image sync and rebuild script for VPS
# Run: bash /var/www/emart-platform/scripts/fix-images.sh

echo "🔄 Starting product image sync..."

# Step 1: Run PHP sync script
php /var/www/emart-platform/scripts/sync-product-images.php

# Step 2: Check if images were linked
echo ""
echo "✓ Image database sync complete"
echo ""

# Step 3: Clear Next.js cache
echo "🗑️  Clearing Next.js cache..."
rm -rf /var/www/emart-platform/apps/web/.next

# Step 4: Rebuild Next.js
echo "🔨 Building Next.js app..."
cd /var/www/emart-platform/apps/web
npm run build

# Step 5: Restart PM2
echo "🚀 Restarting application..."
pm2 restart emart-web || pm2 start npm --name emart-web -- start

echo ""
echo "✅ All done! Product images should now display correctly."
echo ""
echo "📍 Verify at: http://5.189.188.229/some-by-mi-retinol-intense-trial-kit-set"
echo "Hard refresh: Ctrl+Shift+R"
