#!/usr/bin/env bash
set -euo pipefail
echo "[1/5] env file check"
[ -f .env.local ] || echo "⚠️ .env.local missing (.env.example -> .env.local)"
echo "[2/5] typescript"
npx tsc --noEmit
echo "[3/5] build"
npm run build
echo "[4/5] git status"
git status --short
echo "[5/5] done"
