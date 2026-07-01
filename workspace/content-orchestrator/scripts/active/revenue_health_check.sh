#!/usr/bin/env bash
# PM2 cron wrapper for revenue/checkout tracking smoke.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$REPO_ROOT"
node workspace/content-orchestrator/scripts/active/revenue-tracking-smoke.cjs
