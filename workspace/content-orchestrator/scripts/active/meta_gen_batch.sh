#!/usr/bin/env bash
# Emart Meta Generator — Continuous Safe Pipeline
# Runs until all products have valid metas, then exits cleanly.
# Cycle: dry-run 50 → validate → apply-reviewed → revalidate → sleep 90s

set -euo pipefail

BATCH_SIZE=50
SLEEP_BETWEEN=90
REPORT_EVERY=5

WORK="/var/www/emart-platform"
DOCS="$WORK/workspace/content-orchestrator/docs"
AUDIT="$WORK/workspace/audit/active"
SESSION_LOG="$WORK/apps/web/SESSION-LOG.md"

source /root/.openclaw/openclaw.env 2>/dev/null || true
export EMART_DB_PASSWORD="Emart@123456"
export REVALIDATE_SECRET=$(grep "^REVALIDATE_SECRET=" "$WORK/apps/web/.env.local" 2>/dev/null | cut -d= -f2- || echo "")

log() { echo "[$(date '+%H:%M:%S')] $*"; }
tg()  {
  curl -sf "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" -d "parse_mode=HTML" \
    --data-urlencode "text=$1" > /dev/null 2>&1 || true
}

remaining() {
  python3 - << 'PYEOF'
import mysql.connector, os
conn = mysql.connector.connect(host="localhost",user="emart_user",
    password=os.environ.get("EMART_DB_PASSWORD",""),database="emart_live",charset="utf8mb4")
cur = conn.cursor()
cur.execute("""
  SELECT COUNT(*) FROM (
    SELECT
      p.ID,
      COALESCE(
        MAX(CASE WHEN pm.meta_key='_emart_meta_description' THEN pm.meta_value END),
        MAX(CASE WHEN pm.meta_key='_rank_math_description' THEN pm.meta_value END)
      ) AS current_meta,
      IFNULL(MAX(CASE WHEN pm.meta_key='_emart_humanized' THEN 1 END), 0) AS humanized,
      MAX(CASE WHEN pm.meta_key='_emart_humanizer_skip' THEN pm.meta_value END) AS humanizer_skip
    FROM wp4h_posts p
    JOIN wp4h_postmeta pm ON pm.post_id = p.ID
    WHERE p.post_type='product' AND p.post_status='publish'
    GROUP BY p.ID
    HAVING humanized = 0
      AND (humanizer_skip IS NULL OR humanizer_skip = '')
      AND (
        current_meta IS NULL
        OR CHAR_LENGTH(TRIM(current_meta)) < 130
        OR CHAR_LENGTH(TRIM(current_meta)) > 158
        OR current_meta REGEXP '৳[0-9,]+'
      )
  ) x
""")
print(cur.fetchone()[0])
conn.close()
PYEOF
}

cd "$WORK"

if [ -z "${OPENROUTER_API_KEY:-}" ]; then
  log "OPENROUTER_API_KEY is not set; meta generation paused."
  tg "⚠️ <b>Meta Gen paused</b> — OPENROUTER_API_KEY is not configured on the VPS."
  exit 0
fi

TOTAL_AT_START=$(remaining)
CYCLE=0
TOTAL_APPLIED=0

log "=== Meta Gen Continuous START — ${TOTAL_AT_START} remaining ==="
tg "📝 <b>Meta Gen started</b> — ${TOTAL_AT_START} products need metas"

while true; do
  CYCLE=$((CYCLE + 1))
  REMAINING=$(remaining)

  if [ "$REMAINING" -eq 0 ]; then
    log "All done. Total applied: $TOTAL_APPLIED"
    tg "✅ <b>Meta Gen Complete</b> — all done. Applied this run: $TOTAL_APPLIED"
    { echo ""; echo "---"; echo "## $(date '+%Y-%m-%d %H:%M') — Meta Gen Complete";
      echo "- Applied: $TOTAL_APPLIED | Cycles: $CYCLE"; } >> "$SESSION_LOG"
    break
  fi

  log "--- Cycle $CYCLE | $REMAINING remaining ---"
  BATCH_LOG="$AUDIT/meta-gen-cycle-$(date +%Y-%m-%d-%H%M%S).log"

  # Step 1: dry-run — captures output to find the JSONL it created
  MARKER=$(mktemp)
  OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
    python3 "$DOCS/meta_generator.py" --dry-run --limit "$BATCH_SIZE" \
    > "$BATCH_LOG" 2>&1 || true

  # Step 2: find the JSONL that was just created (newest file matching pattern)
  JSONL=$(find "$AUDIT" -maxdepth 1 -type f -name 'meta-generator-*.jsonl' ! -name '*.clean.jsonl' -newer "$MARKER" -printf '%T@ %p\n' 2>/dev/null | sort -nr | sed -n '1s/^[^ ]* //p')
  rm -f "$MARKER"
  if [ -z "$JSONL" ] || [ ! -f "$JSONL" ]; then
    log "  No fresh JSONL created. See ${BATCH_LOG##*/}. Sleeping ${SLEEP_BETWEEN}s..."
    sleep "$SLEEP_BETWEEN"; continue
  fi
  CANDIDATES=$(wc -l < "$JSONL" 2>/dev/null || printf '0')
  log "  Candidates: $CANDIDATES | JSONL: ${JSONL##*/}"

  if [ "$CANDIDATES" -eq 0 ]; then
    log "  No candidates — rate-limited or no eligible products. Sleeping ${SLEEP_BETWEEN}s..."
    sleep "$SLEEP_BETWEEN"; continue
  fi

  # Step 3: validate
  EMART_DB_PASSWORD="$EMART_DB_PASSWORD" \
    python3 "$DOCS/meta_validator.py" --input "$JSONL" \
    --csv "$AUDIT/meta-flagged-$(date +%Y-%m-%d-%H%M%S).csv" >> "$BATCH_LOG" 2>&1 || true

  CLEAN="${JSONL%.jsonl}.clean.jsonl"
  CLEAN_COUNT=$(wc -l < "$CLEAN" 2>/dev/null || echo 0)
  FLAGGED_COUNT=$((CANDIDATES - CLEAN_COUNT))
  log "  Clean: $CLEAN_COUNT | Flagged: $FLAGGED_COUNT"

  if [ "$CLEAN_COUNT" -eq 0 ]; then
    log "  All flagged — skipping. Sleeping ${SLEEP_BETWEEN}s..."
    sleep "$SLEEP_BETWEEN"; continue
  fi

  # Step 4: apply reviewed
  APPLY_LOG="${BATCH_LOG%.log}.apply.log"
  OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
  EMART_DB_PASSWORD="$EMART_DB_PASSWORD" REVALIDATE_SECRET="$REVALIDATE_SECRET" \
    python3 "$DOCS/meta_generator.py" --apply-reviewed "$CLEAN" > "$APPLY_LOG" 2>&1 || true
  cat "$APPLY_LOG" >> "$BATCH_LOG"

  APPLIED=$(grep -c "^  ✓" "$APPLY_LOG" 2>/dev/null || echo 0)
  TOTAL_APPLIED=$((TOTAL_APPLIED + APPLIED))
  log "  Applied: $APPLIED | Total: $TOTAL_APPLIED"

  if [ $((CYCLE % REPORT_EVERY)) -eq 0 ]; then
    REMAINING_NOW=$(remaining)
    DONE=$((TOTAL_AT_START - REMAINING_NOW))
    DENOM=$TOTAL_AT_START
    if [ "$DENOM" -le 0 ]; then DENOM=1; fi
    PCT=$(( DONE * 100 / DENOM ))
    tg "📊 <b>Meta Gen cycle $CYCLE</b>
Done: $DONE / $TOTAL_AT_START (${PCT}%)
Remaining: $REMAINING_NOW | Applied this cycle: $APPLIED"
  fi

  sleep "$SLEEP_BETWEEN"
done

log "=== Meta Gen loop exited ==="
