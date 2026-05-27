# Shipping, Returns, GMC Alignment - 2026-05-27

- Source of truth: storefront policy constants live in `apps/web/src/config/storePolicies.ts`.
- Woo checkout shipping is authoritative: Dhaka flat rate 70, outside-Dhaka flat rate 100, free shipping threshold 3000. Free shipping methods were enabled in Woo zones 1 and 2 on 2026-05-27.
- Checkout estimator must use Woo REST `method_id` for shipping-method type detection; REST `id` is the numeric instance id.
- `/policy` and `/policy/` are intentionally 301 redirected to `/return-policy` at Nginx exact-location level; Next middleware also contains the fallback redirect.
- Product JSON-LD must only emit `offers` when there is a valid positive visible price; no fake reviews/ratings.
- Product/feed image source is WooCommerce main image plus real gallery images, deduped, max 10 additional images. Runtime mu-plugin: `/var/www/wordpress/wp-content/mu-plugins/emart-nextjs-product-urls.php`.
