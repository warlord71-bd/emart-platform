#!/bin/bash

# Emart Configuration Setup Script
# Updates environment variables for web and mobile apps on VPS

echo "🚀 Emart VPS Configuration Setup"
echo "=================================="

# Web App Configuration
echo ""
echo "📱 Setting up Web App (.env.local)..."
cat > /var/www/wordpress/apps/web/.env.local << 'EOF'
# WooCommerce API Configuration
NEXT_PUBLIC_WOO_URL=http://5.189.188.229
WOO_CONSUMER_KEY=ck_emart_5189188229
WOO_CONSUMER_SECRET=cs_emart_5189188229

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://5.189.188.229
NODE_ENV=production
EOF

echo "✅ Web app configured at: /var/www/wordpress/apps/web/.env.local"

# Mobile App Configuration
echo ""
echo "📱 Setting up Mobile App (.env)..."
cat > /var/www/wordpress/apps/mobile/.env << 'EOF'
# WooCommerce API Configuration
REACT_APP_WOO_URL=http://5.189.188.229/wp-json/wc/v3
REACT_APP_WOO_CONSUMER_KEY=ck_emart_5189188229
REACT_APP_WOO_CONSUMER_SECRET=cs_emart_5189188229
EOF

echo "✅ Mobile app configured at: /var/www/wordpress/apps/mobile/.env"

echo ""
echo "=================================="
echo "✅ Configuration Complete!"
echo ""
echo "🔐 API Credentials Set:"
echo "  Consumer Key: ck_emart_5189188229"
echo "  Consumer Secret: cs_emart_5189188229"
echo ""
echo "🌐 API URL: http://5.189.188.229"
echo ""
echo "📝 Next Steps:"
echo "  1. Restart web and mobile apps"
echo "  2. Test checkout flow"
echo "  3. Update Cloudflare DNS when ready"
echo ""
