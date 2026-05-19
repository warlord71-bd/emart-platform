# Delivery Charge Logic

As of 2026-05-18, storefront delivery charge must follow WooCommerce shipping methods, not a hardcoded frontend promo.

- Dhaka city uses the enabled Woo `Dhaka City` flat-rate method, currently `Delivery inside Dhaka` at BDT 70.
- Other districts use the enabled Woo `All Bangladesh` flat-rate method, currently `Delivery outside Dhaka` at BDT 100.
- Free delivery applies only when the matching Woo `free_shipping` method is enabled and the cart subtotal meets its configured threshold, currently BDT 3000.
- The web checkout calls `/api/shipping/estimate`; `/api/checkout` recalculates the quote server-side and sends `shipping_lines` to Woo orders.
- Do not reintroduce static `Free delivery ৳3,000+` claims in header/footer/cart when the Woo free-shipping method can be disabled.
