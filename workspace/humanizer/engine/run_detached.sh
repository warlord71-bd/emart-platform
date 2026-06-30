#!/usr/bin/env bash
# Detached, unattended humanizer run — SAFE TO CLOSE YOUR LAPTOP.
#
# Runs fully independent of any Claude session (setsid), generates + lints,
# applies only PASS rows to the live DB, revalidates ISR, and pings Telegram
# on completion. Results persist to JSONL regardless of notifications.
#
# Usage:   bash workspace/humanizer/engine/run_detached.sh [LIMIT]
#          bash workspace/humanizer/engine/run_detached.sh 30 --no-apply   # generate+notify only
#
# Then close your laptop. A Telegram message arrives when it finishes.
# Re-check anytime:  cat workspace/humanizer/engine/active/DONE-*.txt
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 1          # repo root
ROOT="$(pwd)"
LIMIT="${1:-20}"
APPLY="yes"; [[ "${2:-}" == "--no-apply" ]] && APPLY="no"

ENGINE="workspace/humanizer/engine"
TS="$(date +%Y%m%d-%H%M%S)"
LOG="$ENGINE/active/run-$TS.log"
DONE="$ENGINE/active/DONE-$TS.txt"
mkdir -p "$ENGINE/active"

export PYTHONUNBUFFERED=1
export EMART_DB_PASSWORD="$(grep DB_PASSWORD /var/www/wordpress/wp-config.php | head -1 | sed "s/.*'\([^']*\)'.*/\1/")"
export REVALIDATE_SECRET="$(grep REVALIDATE_SECRET /var/www/emart-platform/apps/web/.env.local | cut -d= -f2)"
unset OPENROUTER_MODEL                           # use free-model chain
set -a; source /root/.openclaw/openclaw.env 2>/dev/null; set +a

tg() {  # one-off Telegram message (NOT polling — safe alongside OpenClaw)
  [[ -n "${TELEGRAM_BOT_TOKEN:-}" ]] || return 0
  curl -s -o /dev/null -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d chat_id="${TELEGRAM_CHAT_ID}" --data-urlencode text="$1"
}

run() {
  exec 200>/tmp/emart-humanizer.lock
  if ! flock -n 200; then
    echo "[$(date)] another humanizer run is already in progress — skipping this invocation" >> "$LOG"
    return 1
  fi
  echo "[$(date)] humanizer detached run start (limit=$LIMIT apply=$APPLY)" | tee "$LOG"
  python3 -u "$ENGINE/humanizer_engine.py" --dry-run --limit "$LIMIT" >>"$LOG" 2>&1

  local jsonl; jsonl="$ENGINE/active/engine-$(date +%Y-%m-%d).jsonl"
  local summary; summary="$(python3 - "$jsonl" <<'PY'
import json,sys
try: rows=[json.loads(l) for l in open(sys.argv[1]) if l.strip()]
except FileNotFoundError: rows=[]
p=[r for r in rows if r.get('pass')]; f=[r for r in rows if not r.get('pass')]
print(f"{len(rows)} generated | {len(p)} PASS | {len(f)} FAIL")
PY
)"

  if [[ "$APPLY" == "yes" ]]; then
    echo "[$(date)] applying PASS rows..." >>"$LOG"
    python3 -u "$ENGINE/humanizer_engine.py" --apply >>"$LOG" 2>&1
  fi

  local count; count="$(mysql -u emart_user -p"$EMART_DB_PASSWORD" emart_live -N -e \
    "SELECT COUNT(*) FROM wp4h_postmeta WHERE meta_key='_emart_humanized' AND meta_value='1';" 2>/dev/null)"

  {
    echo "DONE $(date)"
    echo "$summary"
    echo "applied=$APPLY | total humanized now: $count"
    echo "log: $LOG"
  } | tee "$DONE"

  tg "🤖 Emart Humanizer done ($TS)
$summary
applied=$APPLY · total humanized: $count
FAILs (if any) left in JSONL for rerun/review."
  echo "[$(date)] complete" >>"$LOG"
}

# Fully detach so it survives terminal/session/laptop close.
setsid bash -c "$(declare -f run tg); LIMIT='$LIMIT' APPLY='$APPLY' ENGINE='$ENGINE' LOG='$LOG' DONE='$DONE' TS='$TS' \
  EMART_DB_PASSWORD='$EMART_DB_PASSWORD' REVALIDATE_SECRET='$REVALIDATE_SECRET' \
  TELEGRAM_BOT_TOKEN='${TELEGRAM_BOT_TOKEN:-}' TELEGRAM_CHAT_ID='${TELEGRAM_CHAT_ID:-}' \
  PYTHONUNBUFFERED=1 run" </dev/null >>"$LOG" 2>&1 &
disown
echo "Detached run started (PID $!). Limit=$LIMIT apply=$APPLY"
echo "Safe to close your laptop. Telegram will ping you on completion."
echo "Watch: tail -f $LOG    |    Result: cat $DONE"
