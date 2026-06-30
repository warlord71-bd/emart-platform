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
#
# Safety:
#   - Deploy lock prevents concurrent deploys
#   - VPS .next backup enables rollback on build failure
#   - rsync excludes runtime state (job queues, checkpoints, logs)
#   - git add uses explicit paths, never blanket -A
#   - npm install check happens BEFORE rsync overwrites VPS lockfile

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
LOCAL=/root/emart-platform
VPS=/var/www/emart-platform
APP=apps/web
PM2_NAME=emartweb
SMOKE_URL=https://e-mart.com.bd/
SEO_AEO_GATE="$LOCAL/workspace/content-orchestrator/scripts/active/seo-aeo-deploy-check.mjs"
CF_ZONE_ID="${CF_ZONE_ID:-}"
CF_API_TOKEN="${CF_API_TOKEN:-}"
DEPLOY_LOCK="/tmp/emart-deploy.lock"

# ── Colours ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}▶ $*${NC}"; }
success() { echo -e "${GREEN}✓ $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠ $*${NC}"; }
die()     { echo -e "${RED}✗ $*${NC}"; exit 1; }

# ── Deploy lock ─────────────────────────────────────────────────────────────
cleanup() {
  rm -f "$DEPLOY_LOCK"
}
if [ -f "$DEPLOY_LOCK" ]; then
  LOCK_PID=$(cat "$DEPLOY_LOCK" 2>/dev/null || echo "")
  if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
    die "Another deploy is running (PID $LOCK_PID). If stale, remove $DEPLOY_LOCK"
  else
    warn "Stale deploy lock found (PID $LOCK_PID not running) — removing"
    rm -f "$DEPLOY_LOCK"
  fi
fi
echo $$ > "$DEPLOY_LOCK"
trap cleanup EXIT

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
info "Step 1/8 — Local build"
cd "$LOCAL/$APP"
npm run build || die "Local build failed — fix errors before deploying."
success "Local build passed"

# ── Step 2: git commit ───────────────────────────────────────────────────────
if [ "$SKIP_COMMIT" = false ]; then
  info "Step 2/8 — Git commit"
  cd "$LOCAL"

  # Stage tracked changes only — never blanket git add -A
  git add -u

  # Stage new files under apps/web/src and workspace only (safe subdirs)
  git add apps/web/src/ workspace/ 2>/dev/null || true

  if git diff --cached --quiet; then
    warn "Nothing staged — skipping commit (working tree already clean)"
  else
    # Show what's being committed
    echo -e "${CYAN}  Staged files:${NC}"
    git diff --cached --name-only | head -20 | sed 's/^/    /'
    STAGED_COUNT=$(git diff --cached --name-only | wc -l)
    if [ "$STAGED_COUNT" -gt 20 ]; then
      echo -e "${CYAN}    ... and $((STAGED_COUNT - 20)) more${NC}"
    fi

    if [ -z "$COMMIT_MSG" ]; then
      COMMIT_MSG="deploy: $(date '+%Y-%m-%d %H:%M')"
    fi
    git commit -m "$COMMIT_MSG

Co-Authored-By: deploy.sh <noreply@e-mart.com.bd>"
    success "Committed: $COMMIT_MSG"
  fi
else
  info "Step 2/8 — Skipping commit (--no-commit passed)"
fi

# ── Step 3: Check if VPS npm install is needed (BEFORE rsync) ────────────────
info "Step 3/8 — Check lockfile diff"
NEEDS_INSTALL=false
if ! diff -q "$LOCAL/$APP/package-lock.json" "$VPS/$APP/package-lock.json" &>/dev/null; then
  NEEDS_INSTALL=true
  info "  package-lock.json changed — npm install will run after rsync"
else
  success "  package-lock.json unchanged — skipping install"
fi

# ── Step 4: rsync Local → VPS ────────────────────────────────────────────────
info "Step 4/8 — rsync Local → VPS"
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
  --exclude='jobs/' \
  --exclude='*.state.json' \
  --exclude='*.checkpoint.json' \
  --exclude='__pycache__' \
  "$LOCAL/workspace/" "$VPS/workspace/"

# sync root-level scripts (deploy.sh, CLAUDE.md, etc.)
rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='apps' \
  --exclude='workspace' \
  "$LOCAL/" "$VPS/"

success "rsync complete"

# ── Step 5: VPS npm install (if lockfile changed) ───────────────────────────
if [ "$NEEDS_INSTALL" = true ]; then
  info "Step 5/8 — VPS npm install"
  cd "$VPS/$APP"
  npm install --prefer-offline
  success "npm install complete"
else
  info "Step 5/8 — Skipping npm install"
fi

# ── Step 6: VPS build (with rollback backup) ────────────────────────────────
info "Step 6/8 — VPS build"
cd "$VPS/$APP"

# Back up current .next for rollback
if [ -d ".next" ]; then
  rm -rf ".next.rollback"
  cp -a ".next" ".next.rollback"
fi

if npm run build; then
  success "VPS build passed"
  rm -rf ".next.rollback"
else
  warn "VPS build FAILED — rolling back to previous build"
  if [ -d ".next.rollback" ]; then
    rm -rf ".next"
    mv ".next.rollback" ".next"
    success "Rolled back to previous .next — site still running old build"
  fi
  die "VPS build failed. Previous build restored. Fix errors and redeploy."
fi

# ── Step 7: pm2 restart ──────────────────────────────────────────────────────
info "Step 7/8 — pm2 restart $PM2_NAME"
pm2 restart "$PM2_NAME"
sleep 4
success "pm2 restarted"

# ── Step 8: Smoke test ───────────────────────────────────────────────────────
info "Step 8/8 — Smoke test $SMOKE_URL"
HTTP=$(curl -fsS -o /dev/null -w "%{http_code}" "$SMOKE_URL" 2>&1) || true

if [ "$HTTP" = "200" ]; then
  success "Live: HTTP $HTTP"
else
  die "Smoke test FAILED — got HTTP $HTTP. NOT pushing to repo. Check logs: pm2 logs $PM2_NAME --lines 50"
fi

info "SEO/AEO live deploy gate"
node "$SEO_AEO_GATE" || die "SEO/AEO gate FAILED. NOT pushing to repo. Live remains deployed; inspect the reported surface before retrying."
success "SEO/AEO live deploy gate passed"

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

# ── Align VPS git metadata to origin/main ───────────────────────────────────
info "Aligning VPS git → origin/main"
git -C "$VPS" fetch origin
git -C "$VPS" reset --hard origin/main 2>/dev/null || warn "VPS git reset skipped (non-fatal — runtime files are correct via rsync)"
LOCAL_SHA=$(git -C "$LOCAL" rev-parse HEAD)
VPS_SHA=$(git -C "$VPS"   rev-parse HEAD 2>/dev/null || echo "unknown")
if [ "$LOCAL_SHA" = "$VPS_SHA" ]; then
  success "VPS git aligned: $VPS_SHA"
else
  warn "VPS git SHA mismatch — Local=$LOCAL_SHA VPS=$VPS_SHA (files are still correct via rsync)"
fi

echo ""
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}  Deploy complete — Local = VPS = Repo = Live${NC}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Commit: $(git -C $LOCAL rev-parse --short HEAD)"
echo -e "  Live:   $SMOKE_URL"
