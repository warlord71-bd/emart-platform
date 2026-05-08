# WP Cache / PHP-FPM Stability Fix

2026-05-08 Codex investigated a Cloudflare 502 / WordPress update failure and intermittent admin slowness.

Findings:
- Public Next storefront was fast and healthy.
- `emartweb` was online.
- WordPress had a stale `wp-content/advanced-cache.php` drop-in for WP Super Cache, but `wp-super-cache` was not installed.
- `wp-config.php` still had `WP_CACHE=true` and `WPCACHEHOME=/var/www/wordpress/wp-content/plugins/wp-super-cache/`.
- PHP-FPM pool was small for Woo/admin bursts: `pm.max_children = 5`.

Actions:
- Backed up `wp-config.php` and `advanced-cache.php` to `/root/.attic-2026-05-08/emart-platform/wp-cache-dropin-fix/`.
- Moved stale drop-in to `wp-content/advanced-cache.php.disabled-20260508-stale-wp-super-cache`.
- Set `WP_CACHE=false` and commented stale `WPCACHEHOME`.
- Backed up PHP-FPM pool config to `/root/.attic-2026-05-08/emart-platform/php-fpm-tuning/www.conf.before-20260508`.
- Tuned `/etc/php/8.2/fpm/pool.d/www.conf`: `pm.max_children=12`, `pm.start_servers=4`, `pm.min_spare_servers=2`, `pm.max_spare_servers=6`, `pm.max_requests=500`.
- `php-fpm8.2 -t` passed and `systemctl reload php8.2-fpm` applied the config.
- Cleared 111 expired WP transients.

Post-checks:
- Public home about `0.07s` total from VPS curl.
- Public shop about `0.11s` total.
- Public `/wp-admin/` about `0.25s` to login redirect.
- Public `/wp-admin/update-core.php` about `0.24s` to login redirect.
