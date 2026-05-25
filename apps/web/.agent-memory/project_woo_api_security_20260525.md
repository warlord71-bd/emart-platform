---
name: project-woo-api-security-20260525
description: WooCommerce REST API write-protection hardening — 2026-05-25
metadata:
  type: project
---

Hardened `woo-api-fix.php` mu-plugin on 2026-05-25.

**Before:** `add_filter('woocommerce_rest_check_permissions', '__return_true', 999)` — bypassed ALL permissions (read + write) for any VPS process.

**After:** GET/HEAD bypass kept (reads open to all internal VPS processes). POST/PUT/PATCH/DELETE now require a valid WC API key — only the BFF (key_id 34) has one.

**Why:** n8n, OpenClaw, medimart, and future VPS processes cannot write to WooCommerce without an explicit API key. Prevents accidental or malicious mutations from co-located services.

**File:** `/var/www/wordpress/wp-content/mu-plugins/woo-api-fix.php`

**BFF key:** key_id 34 (`Emart BFF Server 2026-05-25`), read_write, user 2648 (emartadmin). Credentials in `/var/www/emart-platform/apps/web/.env.local`.

**Nginx security layer still in place:** `geo $wc_api_blocked` in `/etc/nginx/nginx.conf` blocks all external IPs — only 127.0.0.1 and 5.189.188.229 reach the WC REST API at all.

**How to apply:** If adding a new VPS service that needs WC write access, create a dedicated WC API key (WP Admin → WooCommerce → Settings → Advanced → REST API). Do not revert to `__return_true`.
