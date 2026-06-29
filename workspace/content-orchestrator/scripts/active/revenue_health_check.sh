#!/usr/bin/env bash
# PM2 cron wrapper for revenue/checkout tracking smoke.

set -euo pipefail

cd /var/www/emart-platform
node workspace/content-orchestrator/scripts/active/revenue-tracking-smoke.cjs
