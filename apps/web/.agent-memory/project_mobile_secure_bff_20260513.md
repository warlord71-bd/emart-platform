# Mobile Secure BFF Hardening - 2026-05-13

Mobile commerce calls now route through secure Next.js API routes instead of direct WooCommerce REST URLs.

- Mobile source must not use `REACT_APP_WOO_CONSUMER_KEY`, `REACT_APP_WOO_CONSUMER_SECRET`, `consumer_key`, `consumer_secret`, or direct `/wp-json/wc/v3` endpoints.
- Product/category/coupon reads use `/api/mobile/products`, `/api/mobile/products/[id]`, `/api/mobile/categories`, and `/api/mobile/coupons`.
- Order creation uses existing server-side `/api/checkout`; mobile checkout now requires real email and does not send `set_paid`.
- Review reads/writes use `/api/product-reviews`; server-side verified-purchase/auth rules apply.
- If any production mobile build ever included Woo consumer credentials, rotate those Woo keys before relying on the mobile update as complete remediation.
