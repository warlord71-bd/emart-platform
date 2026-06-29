---
name: project-woo-api-security-20260525
description: WooCommerce REST API write-protection hardening — 2026-05-25
metadata:
  type: project
---

Hardened `woo-api-fix.php` mu-plugin on 2026-05-25.

**Before:** `add_filter('woocommerce_rest_check_permissions', '__return_true', 999)` — bypassed ALL permissions (read + write) for any VPS process.

**After:** GET/HEAD bypass kept (reads open to all internal VPS processes). POST/PUT/PATCH/DELETE now require a valid WC API key — only the BFF key has write access.

**Why:** n8n, OpenClaw, medimart, and future VPS processes cannot write to WooCommerce without an explicit API key. Prevents accidental or malicious mutations from co-located services.

**File:** `/var/www/wordpress/wp-content/mu-plugins/woo-api-fix.php`

**Current BFF key:** key_id 50 (`Emart BFF Live auto-recovered 2026-06-07 17:45`), read_write, user 2648 (emartadmin), verified 2026-06-29 by matching `.env.local` key suffix to Woo `truncated_key` and internal HTTPS WC API smoke `HTTP 200`. Historical BFF key_id 34 was created 2026-05-25 but is no longer the live runtime key. Credentials in `/var/www/emart-platform/apps/web/.env.local`.

**Nginx security layer still in place:** `geo $wc_api_blocked` in `/etc/nginx/nginx.conf` blocks all external IPs — only 127.0.0.1 and 5.189.188.229 reach the WC REST API at all.

**How to apply:** If adding a new VPS service that needs WC write access, create a dedicated WC API key (WP Admin → WooCommerce → Settings → Advanced → REST API). Do not revert to `__return_true`.
