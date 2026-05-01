#!/usr/bin/env bash

set -u

APP_DIR="/var/www/emart-platform/apps/web"
WP_DIR="/var/www/wordpress"
REPORT_DIR="/root/emart-platform/audit/reports"
RUN_BUILD=0

if [[ "${1:-}" == "--build" ]]; then
  RUN_BUILD=1
fi

mkdir -p "$REPORT_DIR"
REPORT_FILE="$REPORT_DIR/emart-safe-audit-$(date +%Y%m%d-%H%M%S).txt"

pass_count=0
warn_count=0
fail_count=0

log() {
  printf '%s\n' "$*" | tee -a "$REPORT_FILE"
}

section() {
  log ""
  log "============================================================"
  log "$1"
  log "============================================================"
}

pass() {
  pass_count=$((pass_count + 1))
  log "PASS: $1"
}

warn() {
  warn_count=$((warn_count + 1))
  log "WARN: $1"
}

fail() {
  fail_count=$((fail_count + 1))
  log "FAIL: $1"
}

info() {
  log "INFO: $1"
}

run_capture() {
  "$@" 2>&1
}

http_code() {
  curl -k -L -sS -o /dev/null -w '%{http_code}' "$1" 2>/dev/null || true
}

contains_url() {
  local url="$1"
  local pattern="$2"
  curl -k -L -sS "$url" 2>/dev/null | grep -q "$pattern"
}

mysql_count() {
  local sql="$1"
  mysql -u root emart_live -sN -e "$sql" 2>/dev/null || true
}

log "E-MART BD SAFE AUDIT"
log "Started: $(date '+%Y-%m-%d %H:%M:%S %Z')"
log "Report: $REPORT_FILE"
log "Mode: read-only default; build=$RUN_BUILD"

section "Environment"

if command -v node >/dev/null 2>&1; then
  pass "Node found: $(node --version)"
else
  fail "Node not found"
fi

if command -v npm >/dev/null 2>&1; then
  pass "npm found: $(npm --version)"
else
  fail "npm not found"
fi

if [[ -d "$APP_DIR" ]]; then
  pass "App directory exists: $APP_DIR"
else
  fail "App directory missing: $APP_DIR"
fi

if [[ -f "$APP_DIR/package.json" ]]; then
  next_version="$(node -e "const p=require('$APP_DIR/package.json'); console.log((p.dependencies&&p.dependencies.next)||'unknown')" 2>/dev/null || echo unknown)"
  info "Next.js dependency: $next_version"
else
  fail "package.json missing"
fi

section "Build And Runtime"

if [[ "$RUN_BUILD" == "1" ]]; then
  info "Running npm run build because --build was passed"
  if (cd "$APP_DIR" && npm run build > /tmp/emart-safe-build.log 2>&1); then
    pass "Build passed"
  else
    fail "Build failed; see /tmp/emart-safe-build.log"
  fi
else
  warn "Build skipped; pass --build to run it"
fi

if command -v pm2 >/dev/null 2>&1 && pm2 describe emartweb >/dev/null 2>&1; then
  if pm2 status emartweb 2>/dev/null | grep -q online; then
    pass "PM2 emartweb is online"
  else
    fail "PM2 emartweb exists but is not online"
  fi
else
  fail "PM2 emartweb not found"
fi

local_home_code="$(http_code "http://localhost:3000/")"
if [[ "$local_home_code" == "200" ]]; then
  pass "Local Next app responds with 200"
else
  fail "Local Next app returned HTTP $local_home_code"
fi

live_home_code="$(http_code "https://e-mart.com.bd/")"
if [[ "$live_home_code" == "200" ]]; then
  pass "Live domain responds with 200"
else
  warn "Live domain returned HTTP $live_home_code"
fi

section "Current Emart Features"

product_code="$(http_code "https://e-mart.com.bd/shop/isntree-hyaluronic-acid-aqua-gel-cream-100ml")"
if [[ "$product_code" == "200" ]]; then
  pass "Isntree Aqua Gel Cream product page is live"
else
  fail "Isntree Aqua Gel Cream product page returned HTTP $product_code"
fi

if contains_url "https://e-mart.com.bd/" "Email newsletter"; then
  pass "Footer email signup text found on live homepage"
else
  fail "Footer email signup text not found"
fi

newsletter_response="$(curl -k -L -sS -X POST "https://e-mart.com.bd/api/newsletter/subscribe" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"invalid-email-for-readonly-audit\"}" 2>/dev/null || true)"
if printf '%s' "$newsletter_response" | grep -q 'invalid_email'; then
  pass "Newsletter API is reachable and validates email"
else
  warn "Newsletter API did not return expected validation response: $newsletter_response"
fi

if [[ -f "/root/.openclaw/bridges/wc-command-bot.js" ]]; then
  pass "Telegram command helper exists"
else
  warn "Telegram command helper missing"
fi

if systemctl --user status emart-bot-commands >/tmp/emart-bot-status.log 2>&1; then
  warn "emart-bot-commands service is active; verify OpenClaw polling conflict"
else
  pass "emart-bot-commands service is inactive/disabled"
fi

section "WordPress And WooCommerce"

if [[ -d "$WP_DIR" ]]; then
  pass "WordPress directory exists: $WP_DIR"
else
  fail "WordPress directory missing: $WP_DIR"
fi

if mysql -u root -e "USE emart_live; SELECT 1;" >/dev/null 2>&1; then
  pass "MySQL emart_live accessible"
  product_count="$(mysql_count "SELECT COUNT(*) FROM wp4h_posts WHERE post_type='product' AND post_status='publish';")"
  info "Published products: ${product_count:-unknown}"
  cat_count="$(mysql_count "SELECT COUNT(*) FROM wp4h_term_taxonomy WHERE taxonomy='product_cat';")"
  info "Product categories: ${cat_count:-unknown}"
else
  fail "MySQL emart_live not accessible"
fi

if [[ -f "$WP_DIR/wp-content/mu-plugins/emart-newsletter.php" ]]; then
  pass "Newsletter MU plugin exists"
else
  fail "Newsletter MU plugin missing"
fi

if [[ -f "$WP_DIR/wp-content/plugins/mailpoet/mailpoet.php" ]]; then
  pass "MailPoet plugin files exist"
else
  warn "MailPoet plugin files not found"
fi

section "SEO Basics"

sitemap_code="$(http_code "https://e-mart.com.bd/sitemap.xml")"
if [[ "$sitemap_code" == "200" ]]; then
  pass "sitemap.xml returns 200"
else
  warn "sitemap.xml returned HTTP $sitemap_code"
fi

robots_code="$(http_code "https://e-mart.com.bd/robots.txt")"
if [[ "$robots_code" == "200" ]]; then
  pass "robots.txt returns 200"
else
  warn "robots.txt returned HTTP $robots_code"
fi

if contains_url "https://e-mart.com.bd/" "<meta name=\"description\""; then
  pass "Homepage meta description found"
else
  warn "Homepage meta description not found in raw HTML"
fi

section "Server Health"

if systemctl is-active --quiet nginx; then
  pass "Nginx is running"
else
  fail "Nginx is not running"
fi

if nginx -t >/tmp/emart-nginx-test.log 2>&1; then
  pass "Nginx config test passed"
else
  fail "Nginx config test failed; see /tmp/emart-nginx-test.log"
fi

disk_pct="$(df -P /var/www | awk 'NR==2 {print $5}' | tr -d '%')"
disk_free="$(df -h /var/www | awk 'NR==2 {print $4}')"
info "Disk /var/www: ${disk_pct:-unknown}% used, ${disk_free:-unknown} free"
if [[ "$disk_pct" =~ ^[0-9]+$ ]]; then
  if (( disk_pct >= 95 )); then
    fail "Disk usage critical"
  elif (( disk_pct >= 85 )); then
    warn "Disk usage high"
  else
    pass "Disk usage healthy"
  fi
fi

ram_info="$(free -h | awk 'NR==2 {print $2 " total, " $7 " available"}')"
info "RAM: $ram_info"

section "Git Safety"

if [[ -d "$APP_DIR/.git" || -d "/var/www/emart-platform/.git" ]]; then
  info "Branch: $(cd /var/www/emart-platform && git branch --show-current 2>/dev/null || echo unknown)"
  dirty_count="$(cd /var/www/emart-platform && git status --short 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "$dirty_count" == "0" ]]; then
    pass "Git tree clean"
  else
    warn "Git tree has $dirty_count changed/untracked entries; do not commit all blindly"
  fi
else
  warn "Git repository not found"
fi

section "Summary"
log "PASS: $pass_count"
log "WARN: $warn_count"
log "FAIL: $fail_count"
log "Report: $REPORT_FILE"

if (( fail_count > 0 )); then
  exit 1
fi

exit 0
