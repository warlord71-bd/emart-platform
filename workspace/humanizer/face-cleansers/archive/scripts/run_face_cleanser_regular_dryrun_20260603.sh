#!/usr/bin/env bash
set -euo pipefail

cd /root/emart-platform

export EMART_DB_PASSWORD="$(
  php -r '$s=file_get_contents("/var/www/wordpress/wp-config.php"); if (preg_match("/define\(\s*[\x27\"]DB_PASSWORD[\x27\"]\s*,\s*[\x27\"]([^\x27\"]*)[\x27\"]\s*\)/",$s,$m)) echo $m[1];'
)"
export OPENROUTER_API_KEY="$(
  php -r '$j=json_decode(file_get_contents("/root/.openclaw/credentials/openrouter_default.json"), true); echo $j["apiKey"] ?? "";'
)"

ids=(
  59403 60188 60228 60562 60679
  60874 61030 61497 61767 61882
  61994 62432 62590 62887 63013
  63469 63531 63769 92846 92848
)

for id in "${ids[@]}"; do
  echo "===== REGULAR DRY RUN post_id=${id} ====="
  python3 workspace/docs/humanizer_face_cleansers.py --dry-run --post-id "$id"
done
