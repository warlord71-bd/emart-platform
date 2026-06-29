#!/usr/bin/env bash
# Weekly cleanup of abandoned snap-Chromium / Playwright-MCP temp profiles.
# These leak ~96/day (~200MB/day) from headless browser screenshot/QA runs and
# are never auto-removed. Deletes only profile dirs older than 1 day, so any
# in-flight browser session is untouched. Safe: profiles are throwaway temp data.
set -euo pipefail
D=/tmp/snap-private-tmp/snap.chromium/tmp/claude-0
LOG=/var/log/chromium-profile-cleanup.log
if [ -d "$D" ]; then
  before=$(find "$D" -maxdepth 1 -type d 2>/dev/null | wc -l)
  find "$D" -maxdepth 1 -type d -mtime +1 -exec rm -rf {} + 2>/dev/null || true
  after=$(find "$D" -maxdepth 1 -type d 2>/dev/null | wc -l)
  echo "$(date -Is) cleaned chromium profiles: $before -> $after" >> "$LOG"
fi
