#!/bin/bash

################################################################################
# E-Mart SEO Implementation - Pre-Flight Check Script
# Runs all verification commands before starting SEO implementation
# Usage: ./pre-flight-check.sh [--lighthouse] [--wc-test]
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNED=0

# Project paths
PROJECT_ROOT="/var/www/emart-platform"
WEB_ROOT="$PROJECT_ROOT/apps/web"

# Output functions
print_header() {
    echo -e "\n${BLUE}===============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===============================================${NC}\n"
}

print_check() {
    echo -e "${BLUE}→${NC} $1"
}

print_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

print_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

print_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNED++))
}

print_info() {
    echo -e "  ${BLUE}→${NC} $1"
}

# SECTION 1: Environment Verification
print_header "1. ENVIRONMENT VERIFICATION"

# Check Node.js version
print_check "Node.js version"
NODE_VERSION=$(node --version)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_MAJOR" -ge 18 ]; then
    print_pass "Node.js $NODE_VERSION (v18+ required)"
else
    print_fail "Node.js $NODE_VERSION (v18+ required)"
fi

# Check project exists
print_check "Project directory exists"
if [ -d "$WEB_ROOT" ]; then
    print_pass "$WEB_ROOT exists"
    print_info "Contains: $(ls -1 $WEB_ROOT | head -5 | tr '\n' ', ')"
else
    print_fail "$WEB_ROOT does not exist"
fi

# Check Next.js version
print_check "Next.js version"
cd "$WEB_ROOT"
NEXT_VERSION=$(cat package.json | grep '"next"' | head -1 | grep -oP '"\K[^"]+')
if [[ $NEXT_VERSION =~ ^14|^15 ]]; then
    print_pass "Next.js $NEXT_VERSION (v14+ required)"
else
    print_warn "Next.js $NEXT_VERSION (v14+ recommended)"
fi

# Check App Router
print_check "App Router configuration"
if [ -d "$WEB_ROOT/app" ]; then
    print_pass "App Router detected (app/ directory exists)"
else
    print_fail "App Router not found - Pages Router detected instead"
fi

# Check TypeScript
print_check "TypeScript configuration"
if [ -f "$WEB_ROOT/tsconfig.json" ]; then
    print_pass "TypeScript configured"
else
    print_warn "TypeScript not configured"
fi

# Check WooCommerce API credentials
print_check "WooCommerce API credentials"
if [ -f "$WEB_ROOT/.env.local" ]; then
    if grep -q "NEXT_PUBLIC_WC_API_URL\|WC_CONSUMER_KEY\|WC_CONSUMER_SECRET" "$WEB_ROOT/.env.local"; then
        print_pass "WooCommerce API credentials found in .env.local"
        print_info "Variables: $(cat $WEB_ROOT/.env.local | grep -E 'WC_|NEXT_PUBLIC_WC' | cut -d'=' -f1 | tr '\n' ', ')"
    else
        print_fail "WooCommerce API credentials NOT found in .env.local"
    fi
else
    print_fail ".env.local file not found"
fi

# SECTION 2: PM2 Status
print_header "2. PM2 PROCESS STATUS"

print_check "PM2 processes"
if pm2 list | grep -q "emartweb"; then
    PM2_STATUS=$(pm2 list | grep "emartweb" | awk '{print $9}')
    if [[ "$PM2_STATUS" == "online" ]]; then
        print_pass "emartweb process is ONLINE"
    else
        print_warn "emartweb process is $PM2_STATUS (not online)"
    fi
else
    print_fail "emartweb process not found in PM2"
fi

print_info "PM2 processes:"
pm2 list | tail -n +3 | head -5

# SECTION 3: Build Test
print_header "3. BUILD VERIFICATION"

print_check "Testing npm build"
if npm run build > /tmp/build.log 2>&1; then
    print_pass "Build succeeded"
    print_info "Build output: $(tail -3 /tmp/build.log | head -1)"
else
    print_fail "Build FAILED - See /tmp/build.log for details"
    print_info "Error preview:"
    tail -10 /tmp/build.log | sed 's/^/    /'
fi

# SECTION 4: Disk Space
print_header "4. DISK SPACE CHECK"

print_check "Available disk space"
AVAILABLE_SPACE=$(df -h /var/www | awk 'NR==2 {print $4}')
AVAILABLE_GB=$(df -BG /var/www | awk 'NR==2 {print $4}' | sed 's/G//')

if [ "$AVAILABLE_GB" -ge 2 ]; then
    print_pass "Sufficient disk space: ${AVAILABLE_SPACE}B available (need 2GB+)"
else
    print_fail "Low disk space: ${AVAILABLE_SPACE}B available (need 2GB+)"
fi

print_info "Disk usage:"
df -h /var/www | sed 's/^/    /'

# SECTION 5: Git Status
print_header "5. GIT STATUS"

print_check "Git repository status"
cd "$PROJECT_ROOT"
GIT_STATUS=$(git status --porcelain)

if [ -z "$GIT_STATUS" ]; then
    print_pass "Git working tree is CLEAN"
else
    print_warn "Uncommitted changes detected:"
    echo "$GIT_STATUS" | sed 's/^/    /'
fi

print_info "Latest commit:"
git log --oneline -1 | sed 's/^/    /'

print_info "Current branch:"
git branch --show-current | sed 's/^/    /'

# SECTION 6: WooCommerce API Test (Optional)
print_header "6. WOOCOMMERCE API CONNECTIVITY"

print_check "Testing WooCommerce API"

if [ -f "$WEB_ROOT/.env.local" ]; then
    WC_URL=$(grep "NEXT_PUBLIC_WC_API_URL" "$WEB_ROOT/.env.local" | cut -d'=' -f2)
    WC_KEY=$(grep "WC_CONSUMER_KEY" "$WEB_ROOT/.env.local" | cut -d'=' -f2)
    WC_SECRET=$(grep "WC_CONSUMER_SECRET" "$WEB_ROOT/.env.local" | cut -d'=' -f2)

    if [ -n "$WC_URL" ] && [ -n "$WC_KEY" ] && [ -n "$WC_SECRET" ]; then
        print_info "Testing connection to: $WC_URL"

        RESPONSE=$(curl -s -u "$WC_KEY:$WC_SECRET" "$WC_URL/products?per_page=1" -w "\n%{http_code}")
        HTTP_CODE=$(echo "$RESPONSE" | tail -1)
        BODY=$(echo "$RESPONSE" | head -1)

        if [ "$HTTP_CODE" == "200" ]; then
            PRODUCT_COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
            print_pass "WooCommerce API responding (HTTP 200)"
            print_info "Product data received: $PRODUCT_COUNT items"
        else
            print_fail "WooCommerce API error (HTTP $HTTP_CODE)"
            print_info "Response: $(echo $BODY | head -c 100)..."
        fi
    else
        print_warn "WooCommerce credentials incomplete - skipping API test"
    fi
else
    print_warn ".env.local not found - cannot test API"
fi

# SECTION 7: Create State Snapshot
print_header "7. PRE-SEO STATE SNAPSHOT"

STATE_FILE="/tmp/pre-seo-state-$(date +%Y%m%d-%H%M%S).txt"

cat > "$STATE_FILE" <<EOF
═══════════════════════════════════════════════════════════
E-Mart Pre-SEO Implementation State Snapshot
═══════════════════════════════════════════════════════════

Generated: $(date)
Timestamp: $(date +%s)

Environment:
  Node Version: $(node --version)
  Next.js Version: $NEXT_VERSION
  App Router: $([ -d "$WEB_ROOT/app" ] && echo "YES" || echo "NO")
  TypeScript: $([ -f "$WEB_ROOT/tsconfig.json" ] && echo "YES" || echo "NO")

Git Status:
  Branch: $(cd $PROJECT_ROOT && git branch --show-current)
  Last Commit: $(cd $PROJECT_ROOT && git log --oneline -1)
  Uncommitted Changes: $([ -z "$GIT_STATUS" ] && echo "None" || echo "Yes")

Infrastructure:
  PM2 Process: $(pm2 list | grep "emartweb" | awk '{print $9}')
  Disk Available: $AVAILABLE_SPACE
  Build Status: $([ -f /tmp/build.log ] && grep -q "Compiled successfully" /tmp/build.log && echo "PASS" || echo "FAIL")

WooCommerce:
  API URL: ${WC_URL:-NOT SET}
  API Credentials: $([ -n "$WC_KEY" ] && echo "SET" || echo "NOT SET")

═══════════════════════════════════════════════════════════
EOF

print_pass "State snapshot saved to: $STATE_FILE"
print_info "Contents:"
cat "$STATE_FILE" | sed 's/^/  /'

# FINAL SUMMARY
print_header "FINAL SUMMARY"

echo -e "  ${GREEN}Checks Passed:${NC}  $CHECKS_PASSED"
echo -e "  ${YELLOW}Checks Warned:${NC}  $CHECKS_WARNED"
echo -e "  ${RED}Checks Failed:${NC}   $CHECKS_FAILED"

# Determine if all checks passed
if [ "$CHECKS_FAILED" -eq 0 ]; then
    echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ ALL CHECKS PASSED - SAFE TO PROCEED WITH SEO IMPLEMENTATION${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"
    exit 0
else
    echo -e "\n${RED}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}✗ SOME CHECKS FAILED - FIX ISSUES BEFORE PROCEEDING${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}\n"
    exit 1
fi
