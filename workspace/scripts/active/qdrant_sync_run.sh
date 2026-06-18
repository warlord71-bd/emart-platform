#!/usr/bin/env bash
# Weekly qdrant product sync — called by root crontab
set -euo pipefail
cd /root/emart-platform

export QDRANT_API_KEY=L6lRe2r7jmAMxFlNJrBBaDSWvv5Z1LvCZL6RmUvh8GM
export WC_CONSUMER_KEY=ck_49cb0be7c05aa9b4e69dc7f62409fa7be246ba71
export WC_CONSUMER_SECRET=cs_1b8bb1bf0d6972d4650c8d3e0b9f445a9cab7103

python3 workspace/scripts/active/qdrant_product_sync.py
