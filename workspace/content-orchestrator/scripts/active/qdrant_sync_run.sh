#!/usr/bin/env bash
# Weekly qdrant product sync — called by root crontab
set -euo pipefail
cd /root/emart-platform

set -a
# Runtime secrets stay in the untracked environment file; never duplicate them
# into scripts, logs, or process arguments.
source apps/web/.env.local
set +a

export WC_CONSUMER_KEY="${WOO_CONSUMER_KEY:?WOO_CONSUMER_KEY missing}"
export WC_CONSUMER_SECRET="${WOO_CONSUMER_SECRET:?WOO_CONSUMER_SECRET missing}"
: "${QDRANT_API_KEY:?QDRANT_API_KEY missing}"

python3 workspace/scripts/active/qdrant_product_sync.py
