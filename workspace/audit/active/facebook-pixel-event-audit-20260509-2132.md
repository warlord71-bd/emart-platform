# Facebook Pixel / Catalog Event Audit - 2026-05-09

Scope: read-only audit after Meta Business diagnostics reported missing `ViewContent`, `AddToCart`, and `Purchase` events plus one missing `content_ids` warning.

## Findings

- Live product URL with Meta tracking returns `200`:
  `https://e-mart.com.bd/shop/celimax-poredark-spot-brightening-cream-35ml?fbclid=...`
- WordPress plugin state:
  - `facebook-for-woocommerce` active, version `3.6.3`
  - pixel ID configured
  - product sync enabled
  - no excluded product categories/tags
  - catalog ID configured
- Generated Woo Facebook feed:
  - 3,629 rows
  - 0 duplicate IDs
  - 0 duplicate links
  - 0 bad/non-shop URLs
  - 0 Woo permalink mismatches
  - 0 missing images, availability, brand, or descriptions
  - 3 feed IDs do not match currently published products
  - 3,629 prices are formatted without a space before currency, e.g. `1800BDT`
- Next.js storefront:
  - No `fbq()` implementation found in `apps/web`
  - No `ViewContent`, `AddToCart`, `Purchase`, or `content_ids` event code found
  - Live PDP HTML does not include `connect.facebook.net/en_US/fbevents.js`
  - CSP already allows `connect.facebook.net`, `www.facebook.com`, and `*.facebook.com`

## Interpretation

Meta Catalog data is mostly present, but browser event tracking is not implemented on the live Next.js storefront. The active Woo plugin does not automatically inject pixel events into this headless Next.js app because public traffic runs through `apps/web`, not the WordPress theme.

The warning about missing `content_ids` is expected if an event fires from another source without product IDs, or if old/partial tracking exists outside the current Next.js app. For catalog matching, `content_ids` should use the same stable ID as the feed `id`, which is the Woo product ID.

## Recommended Next Fix

Implement a small first-party Meta Pixel layer in `apps/web`:

- Load base Pixel only when `NEXT_PUBLIC_META_PIXEL_ID` exists.
- Fire `PageView` globally.
- Fire `ViewContent` on `/shop/[slug]` with `content_ids: [String(product.id)]`, `content_type: "product"`, value, currency `BDT`.
- Fire `AddToCart` from product add-to-cart buttons with the same `content_ids`.
- Add `Purchase` only on the real order success/thank-you path after confirming the order confirmation route and order data source.
- Keep Woo Facebook plugin as the catalog/feed source only, not the storefront pixel source.

## Do Not Do

- Do not create a second catalog/feed source in Meta Commerce Manager.
- Do not use product slugs as `content_ids` while the feed uses Woo IDs.
- Do not fire fake Purchase events.
- Do not redirect random `fbclid` or tracking-token paths to homepage.

