#!/usr/bin/env bash
# OpenClaw auto-scan: find blog posts/products missing Rank Math SEO and run the generator.
# Run by PM2 cron job daily at 06:00 BD time.

set -euo pipefail

source /root/.openclaw/openclaw.env

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
LOG="$REPO_ROOT/workspace/audit/active/seo-auto-scan-$(date +%F).log"
echo "=== SEO Auto-Scan $(date '+%F %T') ===" >> "$LOG"

# Auth header for WP REST API
AUTH_B64=$(echo -n "${WP_USERNAME}:${WP_APP_PASSWORD}" | base64 -w0)
# Use the public hostname, not WOOCOMMERCE_URL (127.0.0.1) — nginx 301-redirects
# 127.0.0.1 wp-json requests to https, which curl -sf returns as an HTML body
# that the JSON parser below silently swallows (false "0 missing" result).
WP_BASE="https://e-mart.com.bd/wp-json"

# --- 1. Find posts from last 7 days missing rank_math_title or rank_math_description ---
SEVEN_DAYS_AGO=$(python3 -c "from datetime import datetime, timedelta; print((datetime.utcnow()-timedelta(days=7)).strftime('%Y-%m-%dT%H:%M:%S'))")

POSTS=$(curl -sf \
  "${WP_BASE}/wp/v2/posts?per_page=50&orderby=date&order=desc&after=${SEVEN_DAYS_AGO}&_fields=id,slug,title,rank_math_seo" \
  -H "Authorization: Basic $AUTH_B64" 2>/dev/null || echo "[]")

MISSING_IDS=$(POSTS_JSON="$POSTS" python3 - << 'PYEOF'
import json, sys
import os
raw = os.environ.get("POSTS_JSON", "[]").strip() or "[]"
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    print("", end="")
    sys.exit(0)
for p in data:
    seo = p.get("rank_math_seo") or {}
    if not seo.get("title") or not seo.get("description") or not seo.get("focus_keyword"):
        print(p["id"])
PYEOF
)

COUNT=$(MISSING_IDS_TEXT="$MISSING_IDS" python3 - << 'PYEOF'
import os
ids = [line.strip() for line in os.environ.get("MISSING_IDS_TEXT", "").splitlines() if line.strip()]
print(len(ids))
PYEOF
)
echo "Posts missing SEO: $COUNT" >> "$LOG"

if [ "$COUNT" -eq 0 ]; then
  echo "Nothing to update — all recent posts have Rank Math SEO." >> "$LOG"
  curl -sf "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    -d "text=✅ SEO Auto-Scan $(date +%F): all recent blog posts have SEO fields." \
    > /dev/null 2>&1 || true
  exit 0
fi

# --- 2. Report only.
# OpenClaw 2026.5.22 removed the old `openclaw skills run --arg ...` path.
# Until the replacement agent flow is wired, this scanner must not hot-loop failed updates.
REPORT=$(printf '%s\n' "$MISSING_IDS" | sed '/^[[:space:]]*$/d' | head -10 | sed 's/^/- Post /')
echo "OpenClaw direct skill runner unavailable; reporting only." >> "$LOG"
echo "$REPORT" >> "$LOG"

# --- 3. Telegram summary ---
MSG="📝 SEO Auto-Scan $(date +%F)

Recent posts missing SEO: ${COUNT}
Status: report-only; OpenClaw direct skill runner unavailable.

${REPORT}"

curl -sf "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  --data-urlencode "text=$MSG" \
  > /dev/null 2>&1 || true

echo "Done. Reported=$COUNT" >> "$LOG"
