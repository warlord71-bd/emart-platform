#!/usr/bin/env bash

set -euo pipefail

cat >&2 <<'MSG'
This script is intentionally disabled.

Do not generate or overwrite Emart production env files from a repo script.
Production secrets must stay in the runtime env only:

  /var/www/emart-platform/apps/web/.env.local

Use the project deploy sequence instead:

  1. Edit source on Local: /root/emart-platform
  2. Build Local: apps/web -> npm run build
  3. Sync Local -> VPS after verification
  4. Build on VPS
  5. Restart PM2 only after source state is verified
  6. Smoke test live
  7. Push repo last

If env changes are required, update the VPS file manually after explicit
approval, without committing secrets to git.
MSG

exit 1
