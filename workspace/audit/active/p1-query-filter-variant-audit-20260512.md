# P1 Query/Filter Variant Audit - 2026-05-12

Scope: read-only audit of `/shop?filter_brand=...` and `/shop?per_row=...` indexable duplicates
identified as a live risk in the P1 crawled-not-indexed classification report (2026-05-11).
25 URLs live-tested. No code changes made.

## Audit Summary

Both `filter_brand` and `per_row` survive as `index, follow` pages with self-referencing canonicals
that are NOT `/shop`. Every unique value of either param creates an indexable duplicate of the main
shop page. The Next.js shop page ignores both params entirely — the page content rendered is
identical to `/shop` regardless of value.

## Root Cause

Two gaps in the current stripping stack:

| Layer | File | Handles | Missing |
| --- | --- | --- | --- |
| Middleware 301 strip | `apps/web/src/middleware.ts` | `orderby`, `order`, `per_page`, `paged`, `shop_view`, `add-to-cart`, `add_to_cart`, `add_to_wishlist`, `srsltid` | `filter_brand`, `per_row` |
| Canonical strip | `apps/web/src/lib/canonicalUrl.ts` | `orderby`, `order`, `page`, `per_page`, `paged`, `shop_view`, analytics params, Emart UI params (`brand`, `sort`, `category`, `origin`, `in_stock`, `price`) | `filter_brand`, `per_row` |

`filter_brand` is a legacy WooCommerce attribute-filter parameter (from the old Woo storefront).
`per_row` is a legacy WooCommerce display parameter (products per row). Neither is consumed by the
Next.js shop page.

## Live Test Results (25 URLs)

### `filter_brand` — 12 variants

| URL | Status | Canonical | Robots |
| --- | ---: | --- | --- |
| /shop?filter_brand=mary-may | 200 | /shop?filter_brand=mary-may | index, follow |
| /shop?filter_brand=cosrx | 200 | /shop?filter_brand=cosrx | index, follow |
| /shop?filter_brand=some-by-mi | 200 | /shop?filter_brand=some-by-mi | index, follow |
| /shop?filter_brand=anua | 200 | /shop?filter_brand=anua | index, follow |
| /shop?filter_brand=beauty-of-joseon | 200 | /shop?filter_brand=beauty-of-joseon | index, follow |
| /shop?filter_brand=eucerin | 200 | /shop?filter_brand=eucerin | index, follow |
| /shop?filter_brand=innisfree | 200 | /shop?filter_brand=innisfree | index, follow |
| /shop?filter_brand=skinfood | 200 | /shop?filter_brand=skinfood | index, follow |
| /shop?filter_brand=laneige | 200 | /shop?filter_brand=laneige | index, follow |
| /shop?filter_brand=tonymoly | 200 | /shop?filter_brand=tonymoly | index, follow |
| /shop?filter_brand=skin1004 | 200 | /shop?filter_brand=skin1004 | index, follow |
| /shop?filter_brand=cerave | 200 | /shop?filter_brand=cerave | index, follow |

Result: 12/12 indexable duplicates. All self-canonicalize to the query URL, not to `/shop`.

### `per_row` — 4 variants

| URL | Status | Canonical | Robots |
| --- | ---: | --- | --- |
| /shop?per_row=2 | 200 | /shop?per_row=2 | index, follow |
| /shop?per_row=3 | 200 | /shop?per_row=3 | index, follow |
| /shop?per_row=4 | 200 | /shop?per_row=4 | index, follow |
| /shop?per_row=6 | 200 | /shop?per_row=6 | index, follow |

Result: 4/4 indexable duplicates.

### Combo variants — 4 variants

| URL | Status | Canonical | Robots | Additional bug |
| --- | ---: | --- | --- | --- |
| /shop?per_row=4&filter_brand=eucerin | 200 | /shop?per_row=4&amp;filter_brand=eucerin | index, follow | HTML-encoded `&amp;` in canonical |
| /shop?per_row=3&filter_brand=mary-may | 200 | /shop?per_row=3&amp;filter_brand=mary-may | index, follow | HTML-encoded `&amp;` in canonical |
| /shop?per_row=4&per_page=36&filter_brand=cosrx | 200 | /shop?per_row=4&amp;filter_brand=cosrx | index, follow | HTML-encoded `&amp;` in canonical |
| /shop?per_row=4&shop_view=grid&filter_brand=innisfree | 200 | /shop?per_row=4&amp;filter_brand=innisfree | index, follow | HTML-encoded `&amp;` in canonical |

Note: `per_page` and `shop_view` are correctly stripped by middleware before the page is rendered,
so combo URLs already have those params removed in the final canonical. But `per_row` survives.

The `&amp;` HTML-entity encoding in multi-param canonicals is a secondary bug — the canonical
`<link>` tag is being written with literal `&amp;` instead of `&`. Google parses HTML so will
interpret it correctly, but it is still a non-standard output. Low severity; fix alongside the
param strip.

### P1 audit sample re-verification

| URL (from P1 audit) | Current status | Confirmed? |
| --- | --- | --- |
| /shop?filter_brand=mary-may | 200, index, follow, canonical=/shop?filter_brand=mary-may | Yes, still live issue |
| /shop?per_row=4&filter_brand=eucerin | 200, index, follow, canonical=/shop?per_row=4&amp;filter_brand=eucerin | Yes, still live issue |
| /shop?per_row=3 | 200, index, follow, canonical=/shop?per_row=3 | Yes, still live issue |

## Scale Estimate

- `filter_brand` values: any brand slug in the Woo taxonomy (~200+ brands). Each creates one
  indexable duplicate. The GSC export already showed multiple as "Crawled - currently not indexed",
  meaning Google has already fetched them.
- `per_row` values: typically 2, 3, 4, 6 (4 known variants).
- Combos: `per_row` × `filter_brand` = 4 × 200+ = 800+ possible unique indexable URLs.
- Actual crawled count: subset of the 409 "root query junk" rows in the P1 export; exact count
  unknown without re-running the raw export filter.

## Decision

**Recommended fix: 301 strip via middleware (same pattern as existing STRIP_PARAMS).**

Do not use canonical-only or noindex:
- Canonical-only: Google may ignore a self-referencing canonical hint on a 200 page; middleware 301
  is a harder signal and conserves crawl budget.
- Noindex: leaves the URL crawlable indefinitely as a near-duplicate; 301 is cleaner and recovers
  any residual link signals.

Both `filter_brand` and `per_row` are WooCommerce legacy params that the Next.js shop page ignores.
They have no SEO value as distinct pages. Strip them unconditionally.

Also add both to `canonicalUrl.ts` as a belt-and-braces defense in case any code path bypasses
middleware.

## Proposed Code Change (ready to implement on approval)

**`apps/web/src/middleware.ts` — add 2 entries to `STRIP_PARAMS`:**
```
'filter_brand',   // legacy WC attribute-filter param, ignored by Next.js shop
'per_row',        // legacy WC display param (products per row), ignored by Next.js shop
```

**`apps/web/src/lib/canonicalUrl.ts` — add 2 entries to `STRIP_PARAMS` Set:**
```
'filter_brand',
'per_row',
```

**Secondary: `&amp;` encoding in multi-param canonicals.**
If the bug is in Next.js metadata serialization, no code change is needed here — adding `per_row`
and `filter_brand` to strips will eliminate the combo URLs before they reach the canonical function.
Worth confirming after the strip fix is deployed.

## Files To Change

- `apps/web/src/middleware.ts` line 14–24 (`STRIP_PARAMS` array)
- `apps/web/src/lib/canonicalUrl.ts` line 3–17 (`STRIP_PARAMS` Set)

No other files. No Woo data. No product/price/stock/SKU/image/checkout/cart/payment/order changes.

## What This Does NOT Fix

- Legitimate Emart brand filter pages live at `/brands/{slug}` (200, indexed, correct canonical).
  This fix does not touch those.
- The Next.js shop page's own filter params (`brand`, `sort`, `category`, `origin`, `in_stock`,
  `price`) are already in `canonicalUrl.ts` STRIP_PARAMS and are not affected.
- Existing 301-redirected tag URLs that land on `/shop` clean (no params) are already fixed.
