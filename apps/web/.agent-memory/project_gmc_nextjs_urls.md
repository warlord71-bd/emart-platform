---
name: GMC and Facebook Catalog product URL fix
description: mu-plugin rewrites WooCommerce /product/slug/ URLs to Next.js /shop/slug before GMC and Facebook Catalog submissions
type: project
---

Both `google-listings-and-ads` and `facebook-for-woocommerce` plugins call `get_permalink()` to get the product URL, which returns the WooCommerce URL format (`/product/slug/`). This was being submitted to Google Merchant Center and Facebook Catalog, creating a mismatch with the Next.js frontend (`/shop/slug`).

**Fix deployed:** `/var/www/wordpress/wp-content/mu-plugins/emart-nextjs-product-urls.php`

**How it works:**
- GLA: hooks `woocommerce_gla_product_attribute_values` filter (runs in `override_attributes()` which is called LAST in WCProductAdapter constructor, safely overriding the earlier `setLink(get_permalink())` call)
- Facebook: hooks `facebook_for_woocommerce_integration_prepare_product` filter (runs after full product data array is assembled, overrides `link`, `url`, `checkout_url`)

**Why:** GLA and Facebook Catalog bypass robots.txt and sitemaps. They ping WooCommerce REST directly and submit product URLs. Without this fix, Google Merchant Center indexes `/product/slug/` as the canonical URL, creating redirect chains and ghost URLs in GSC.

**Why:** The Nginx sitemap redirect (sitemap_index.xml → sitemap.xml) and robots.ts disallows fix Google Search crawl. But GMC and FB Catalog are separate indexing systems that need this server-side URL rewrite.
