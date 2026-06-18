#!/usr/bin/env bash
# deploy.sh — one-command full deploy for emart-platform
#
# Usage:
#   ./deploy.sh                      # deploys with auto-generated commit message
#   ./deploy.sh "feat: add feature"  # deploys with custom commit message
#   ./deploy.sh --no-commit          # skip git commit (use if already committed)
#
# Sequence: Local build → git commit → rsync → VPS install (if needed) →
#           VPS build → pm2 restart → smoke test → git push origin main

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
LOCAL=/root/emart-platform
VPS=/var/www/emart-platform
APP=apps/web
PM2_NAME=emartweb
SMOKE_URL=https://e-mart.com.bd/
CF_ZONE_ID="${CF_ZONE_ID:-}"
CF_API_TOKEN="${CF_API_TOKEN:-}"

# ── Colours ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}▶ $*${NC}"; }
success() { echo -e "${GREEN}✓ $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠ $*${NC}"; }
die()     { echo -e "${RED}✗ $*${NC}"; exit 1; }

# ── Args ────────────────────────────────────────────────────────────────────
SKIP_COMMIT=false
COMMIT_MSG=""

for arg in "$@"; do
  case "$arg" in
    --no-commit) SKIP_COMMIT=true ;;
    *) COMMIT_MSG="$arg" ;;
  esac
done

# ── Step 1: Local build ──────────────────────────────────────────────────────
info "Step 1/7 — Local build"
cd "$LOCAL/$APP"
npm run build || die "Local build failed — fix errors before deploying."
success "Local build passed"

# ── Step 2: git commit ───────────────────────────────────────────────────────
if [ "$SKIP_COMMIT" = false ]; then
  info "Step 2/7 — Git commit"
  cd "$LOCAL"
  git add -A

  if git diff --cached --quiet; then
    warn "Nothing staged — skipping commit (working tree already clean)"
  else
    if [ -z "$COMMIT_MSG" ]; then
      COMMIT_MSG="deploy: $(date '+%Y-%m-%d %H:%M')"
    fi
    git commit -m "$COMMIT_MSG

Co-Authored-By: deploy.sh <noreply@e-mart.com.bd>"
    success "Committed: $COMMIT_MSG"
  fi
else
  info "Step 2/7 — Skipping commit (--no-commit passed)"
fi

# ── Step 3: rsync Local → VPS ────────────────────────────────────────────────
info "Step 3/7 — rsync Local → VPS"
rsync -a --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env.local' \
  --exclude='public/audit' \
  --exclude='*.tsbuildinfo' \
  "$LOCAL/$APP/" "$VPS/$APP/"

rsync -a --delete \
  --exclude='.git' \
  "$LOCAL/workspace/" "$VPS/workspace/"

# sync root-level scripts (deploy.sh, CLAUDE.md, etc.)
rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='apps' \
  --exclude='workspace' \
  "$LOCAL/" "$VPS/"

success "rsync complete"

# ── Step 4: VPS npm install (only if lock file changed) ──────────────────────
info "Step 4/7 — VPS npm install (if needed)"
cd "$VPS/$APP"
if ! diff -q "$LOCAL/$APP/package-lock.json" "$VPS/$APP/package-lock.json" &>/dev/null; then
  # lock file changed before rsync overwrote it — need install
  npm install --prefer-offline
  success "npm install complete"
else
  success "package-lock.json unchanged — skipping install"
fi

# ── Step 5: VPS build ────────────────────────────────────────────────────────
info "Step 5/7 — VPS build"
npm run build || die "VPS build failed — site still running old build. Fix errors and redeploy."
success "VPS build passed"

# ── Step 6: pm2 restart ──────────────────────────────────────────────────────
info "Step 6/7 — pm2 restart $PM2_NAME"
pm2 restart "$PM2_NAME"
sleep 4
success "pm2 restarted"

# ── Step 7: Smoke test ───────────────────────────────────────────────────────
info "Step 7/7 — Smoke test $SMOKE_URL"
HTTP=$(curl -fsS -o /dev/null -w "%{http_code}" "$SMOKE_URL" 2>&1) || true

if [ "$HTTP" = "200" ]; then
  success "Live: HTTP $HTTP ✅"
else
  die "Smoke test FAILED — got HTTP $HTTP. NOT pushing to repo. Check logs: pm2 logs $PM2_NAME --lines 50"
fi

# ── Cloudflare cache purge ──────────────────────────────────────────────────
if [ -n "$CF_ZONE_ID" ] && [ -n "$CF_API_TOKEN" ]; then
  info "Purging Cloudflare cache"
  CF_RESP=$(curl -sS -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}' 2>&1)
  if echo "$CF_RESP" | grep -q '"success":true'; then
    success "Cloudflare cache purged"
  else
    warn "Cloudflare purge failed — users may see stale chunks until TTL expires"
  fi
else
  warn "CF_ZONE_ID / CF_API_TOKEN not set — skipping Cloudflare cache purge"
fi

# ── Push to origin/main ──────────────────────────────────────────────────────
info "Pushing to origin/main"
cd "$LOCAL"
git push origin main
success "Pushed to origin/main"

# ── Step 8: Align VPS git metadata to origin/main ────────────────────────────
info "Step 8/8 — Align VPS git → origin/main"
git -C "$VPS" fetch origin
# Remove untracked non-ignored files (all in origin/main at this point — git restores them)
git -C "$VPS" clean -fd --quiet 2>/dev/null || true
git -C "$VPS" reset --hard origin/main
LOCAL_SHA=$(git -C "$LOCAL" rev-parse HEAD)
VPS_SHA=$(git -C "$VPS"   rev-parse HEAD)
if [ "$LOCAL_SHA" = "$VPS_SHA" ]; then
  success "VPS git aligned: $VPS_SHA"
else
  warn "VPS git SHA mismatch — Local=$LOCAL_SHA VPS=$VPS_SHA (files are still correct via rsync)"
fi

echo ""
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}  Deploy complete — Local = VPS = Repo = Live  ✅${NC}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Commit: $(git -C $LOCAL rev-parse --short HEAD)"
echo -e "  Live:   $SMOKE_URL"
