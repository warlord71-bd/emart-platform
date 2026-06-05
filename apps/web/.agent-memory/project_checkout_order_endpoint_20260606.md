# Checkout Order Endpoint - 2026-06-06

Checkout order creation no longer depends on WooCommerce `woocommerce_api_keys`.

Runtime details:
- Next BFF `/api/checkout` calls `createOrderViaPlugin()` from `apps/web/src/lib/woocommerce.ts`.
- The transport posts to WordPress `/wp-json/emart/v1/create-order`.
- Auth uses `X-Emart-Secret` and `EMART_ORDER_SECRET`.
- Next secret lives in `/var/www/emart-platform/apps/web/.env.local`.
- WordPress secret is defined as `EMART_ORDER_SECRET` in `/var/www/wordpress/wp-config.php`.
- Runtime mu-plugin lives at `/var/www/wordpress/wp-content/mu-plugins/emart-order-endpoint.php`.

Behavior preserved:
- COD orders become `processing`; non-COD orders stay `pending`.
- Shipping lines, coupon lines, customer note, attribution meta, customer_id, BDT currency, line items, and billing/shipping payload shape are preserved.
- The old WC REST `createOrder()` function remains in `woocommerce.ts` as a fallback path, but checkout no longer calls it.

Verification on 2026-06-06:
- `php -l` passed for the new mu-plugin and `wp-config.php`.
- Direct internal plugin create-order test returned `201`; test order was deleted.
- Live `/api/checkout` smoke returned `success:true`; test order `93715` and temporary user `2753` were deleted.
- `npm run build` passed and `emartweb` was restarted.
