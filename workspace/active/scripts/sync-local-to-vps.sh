#!/usr/bin/env bash

set -euo pipefail

LOCAL_ROOT="${EMART_LOCAL_ROOT:-/root/emart-platform}"
VPS_ROOT="${EMART_VPS_ROOT:-/var/www/emart-platform}"

if [[ ! -d "$LOCAL_ROOT/apps/web" ]]; then
  echo "Local tree missing: $LOCAL_ROOT/apps/web" >&2
  exit 1
fi

if [[ ! -d "$VPS_ROOT/apps/web" ]]; then
  echo "VPS tree missing: $VPS_ROOT/apps/web" >&2
  exit 1
fi

echo "Syncing Local -> VPS"
echo "  from: $LOCAL_ROOT"
echo "  to:   $VPS_ROOT"

rsync -av --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='*.tsbuildinfo' \
  --exclude='.env.local' \
  --exclude='apps/web/SESSION-LOG.md' \
  --exclude='apps/web/TASKS.md' \
  --exclude='apps/web/.agent-memory/' \
  "$LOCAL_ROOT/" "$VPS_ROOT/"

echo "Sync complete."
