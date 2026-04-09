#!/bin/bash
# Quick VPS Deployment Script for Lumière K-Beauty
# Usage: ssh root@5.189.188.229 "bash < QUICK-VPS-DEPLOY.sh"
# OR copy this script to VPS and run: bash QUICK-VPS-DEPLOY.sh

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════"
echo "  Lumière K-Beauty — VPS Deployment Script"
echo "════════════════════════════════════════════════════════════"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="5.189.188.229"
PROJECT_DIR="/var/www/emart-platform"
BRANCH="claude/identify-recent-work-vps-bCSFy"
WEB_APP_DIR="$PROJECT_DIR/apps/web"

echo -e "${BLUE}[1/8]${NC} Checking project directory..."
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}✗ Project not found at $PROJECT_DIR${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Project found${NC}"

echo ""
echo -e "${BLUE}[2/8]${NC} Fetching latest code..."
cd "$PROJECT_DIR"
git fetch origin "$BRANCH" || { echo "Git fetch failed"; exit 1; }
echo -e "${GREEN}✓ Fetch complete${NC}"

echo ""
echo -e "${BLUE}[3/8]${NC} Checking out branch: $BRANCH..."
git checkout "$BRANCH" || { echo "Git checkout failed"; exit 1; }
echo -e "${GREEN}✓ Branch checked out${NC}"

echo ""
echo -e "${BLUE}[4/8]${NC} Verifying branch status..."
COMMIT=$(git rev-parse --short HEAD)
echo "Current commit: $COMMIT"
echo -e "${GREEN}✓ On correct branch${NC}"

echo ""
echo -e "${BLUE}[5/8]${NC} Installing dependencies..."
cd "$WEB_APP_DIR"
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps 2>&1 | tail -20
else
    echo "node_modules exists, skipping install"
fi
echo -e "${GREEN}✓ Dependencies ready${NC}"

echo ""
echo -e "${BLUE}[6/8]${NC} Building Next.js application..."
echo "This may take 1-3 minutes..."
npm run build 2>&1 | tail -30
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${YELLOW}✗ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}[7/8]${NC} Restarting web service..."
pm2 restart emartweb || pm2 start npm --name "emartweb" -- run start
sleep 2
echo -e "${GREEN}✓ Service restarted${NC}"

echo ""
echo -e "${BLUE}[8/8]${NC} Deployment complete!"
echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Deployment Successful!${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Next Steps:"
echo "1. Open http://5.189.188.229/ in browser"
echo "2. Check for any console errors (F12)"
echo "3. Test homepage sections:"
echo "   - Hero banner with image and CTAs"
echo "   - Shop by Category (8 categories)"
echo "   - Featured Products (4-column grid)"
echo "   - Shop by Concern (5 colored tabs)"
echo "   - Flash Sale products"
echo "   - Brands Showcase (5 brands)"
echo "   - Why Choose Lumière section"
echo "4. Test Shop page: http://5.189.188.229/shop"
echo "   - Check filters work (categories, brands, price)"
echo "   - Check product grid displays"
echo "   - Check sort dropdown"
echo "5. Test responsive on mobile (use DevTools)"
echo "6. Check for 404 errors in Network tab"
echo ""
echo "If issues found:"
echo "  - Check app logs: pm2 logs emartweb"
echo "  - Rebuild: npm run build"
echo "  - Restart: pm2 restart emartweb"
echo ""
echo "See VPS-TEST-PLAN.md for detailed testing checklist"
echo "See DEPLOYMENT-SUMMARY.md for full documentation"
echo ""
