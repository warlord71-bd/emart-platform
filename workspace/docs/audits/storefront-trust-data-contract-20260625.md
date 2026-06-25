# Storefront Trust-Data Contract

Date: 2026-06-25
Task: UX-ORCH-1 / Main Priority 4
Scope: Read-only audit of storefront claims that imply live activity, verified data, stock scarcity, reviews, sold counts, or social proof.

## Executive Finding

Emart has real trust data for WooCommerce product stock, WooCommerce reviews, recent WooCommerce orders, delivery policy, payment methods, and authenticity policy. The risky gap is wording: some category-page widgets use deterministic fallback numbers from `stableNumber()` but label them as "LIVE", "viewing", "sold", "left", "verified", or "real reviews".

Until those fallback values are replaced with a measured data source, they must be displayed as popularity or availability hints, not live counters or verified activity.

## Contract Rules

| Claim family | Allowed only when source is real | Required fallback label |
|---|---|---|
| Live shoppers / viewing now | Presence service or analytics session count with cache age | "Popular now", "Browsing trend", or hide count |
| Recent purchases / just bought | WooCommerce orders within a bounded recent window, anonymized | Hide ticker item |
| Stock quantity / left | Woo `stock_status`, and `stock_quantity` only when `manage_stock` is true and quantity is finite | "In stock" / "Available" |
| Sold count | Real Woo order-item sales count for the displayed product + time window | Hide count or "Popular deal" |
| Trending/growth % | Real analytics, order velocity, GSC, Meta, or search trend metric with declared window | "Popular pick" |
| Reviews / ratings | Woo product review records and product `rating_count` / `average_rating` | Hide count, or say "No reviews yet" |
| Verified review / verified purchase | Woo review `verified === true` or account/order eligibility check | "Customer review" |
| Authentic/original | Store policy / supplier-authentication claim, not per-product lab verification | "Authentic sourcing" unless owner approves stronger wording |
| Delivery estimate | `STORE_POLICIES.shipping` or live shipping methods | "Delivery fee shown at checkout" |

## Inventory

| Surface | Current claim | Source path | Evidence | Trust status | Required action |
|---|---|---|---|---|---|
| `/categories` hero copy | "Verified bestsellers... Stock counters live" | `apps/web/src/components/categories/categoryPageI18n.ts` | Copy at lines 16 and 24; data below uses fallbacks | Not safe as written | Relabel to "popular picks" and "availability hints" unless real counters are wired |
| `/categories` ticker badge | "LIVE" and "Shoppers browsing right now" | `LiveTickerBar.tsx`, `liveData.ts` | Ticker displays `LIVE` at lines 81-82; active sessions come from fallback category pulses at `liveData.ts` lines 185-200 | Mixed/unsafe | Use "Activity" or "Popular now" until presence totals are real source of truth |
| `/categories` recent purchase ticker | "`Name` from `city` just bought product" | `LiveTickerBar.tsx`, `liveData.ts` | Orders filtered to last 5 minutes at `liveData.ts` lines 259-276 | Safe if Woo recent-order API is live; privacy okay due first-name anonymization | Keep hidden when no recent order; do not synthesize |
| Popular category cards | "`N` viewing", "trend % this week", "HOT" | `PopularCategoriesGrid.tsx`, `liveData.ts` | `active_viewers` and `trend_pct` are deterministic fallback values at `liveData.ts` lines 168 and 176 | Unsafe as live/social proof | Relabel as "popular category" or wire to real analytics |
| Trending product widget | "LIVE", growth %, "`N` left" | `TrendingLeaderboard.tsx`, `liveData.ts` | `growth_rate` is fallback at line 122; `stock_remaining` falls back when stock quantity absent at line 109 | Unsafe when fallback used | Require source flags: real_stock_quantity, real_growth_rate |
| Flash deal stock bar | "`N` sold", "`N` left" | `FlashDealsRow.tsx`, `StockBar.tsx`, `liveData.ts` | `stock_total`/`stock_sold` are derived from fallback total at lines 109-125; `StockBar` labels them as sold/left | Unsafe when fallback used | Hide sold count unless real sales count exists; show "Limited availability" for fallback |
| Concern cards | review count and average rating | `ConcernGrid.tsx`, `liveData.ts` | `review_count` falls back to stableNumber and avg defaults to 4.8 at lines 245-246 | Unsafe as reviews | Use actual top product rating only; otherwise hide count/rating |
| Category customer wall | "Real shoppers", "96,000+ reviews", verified badge | `CustomerWall.tsx`, `liveData.ts` | Featured reviews are Woo records; verified field is preserved at lines 279-288. The 96,000+ headline is hardcoded copy | Reviews safe; aggregate headline unverified in code | Keep per-review badges only when `verified`; replace hardcoded aggregate with sourced total or remove |
| PDP rating summary | average rating and review count | `ProductInfo.tsx`, Woo product fields | Only shows when rating and count are > 0 at lines 384-390 | Safe if Woo fields are trusted | Keep; no fallback needed |
| PDP stock badges | "In Stock", "Out of Stock", "`N` Pcs Available" | `ProductInfo.tsx`, Woo product fields | Stock label uses `stock_status` and finite `stock_quantity` at lines 169-178 and 393-405 | Mostly safe | Only show numeric quantity when Woo manages stock; otherwise use "In Stock" |
| PDP review section | "Real reviews from customers who bought..." and "`N` verified reviews" | `ReviewsSection.tsx` | `totalReviews` can be `reviews.length` or product `rating_count`; individual verified badge is correct at lines 230-233 | Mixed | Change aggregate label to "customer reviews"; reserve "verified purchase" for individual verified reviews |
| Authenticity badges | "100% Authentic", "Authentic imports" | `ProductInfo.tsx`, `TrustStrip`/policy pages | Badge is static at lines 403-405; authenticity page documents sourcing and case review | Acceptable as brand promise if owner approves wording | Prefer "Authentic sourcing" for generic widgets; keep stronger PDP badge only as owner-approved policy |
| Delivery/payment trust | delivery time, COD/bKash/Nagad | `STORE_POLICIES.shipping`, trust strips | Central policy constants are used in PDP info box | Safe | Keep tied to policy constants |

## Required Data Shape For Future UI

Every component that displays a trust claim should receive a source object:

```ts
type TrustMetricSource =
  | { kind: 'woo_stock'; exact: boolean; cacheAgeSeconds: number }
  | { kind: 'woo_review'; verifiedOnly: boolean; cacheAgeSeconds: number }
  | { kind: 'woo_order_recent'; windowSeconds: number; anonymized: true; cacheAgeSeconds: number }
  | { kind: 'analytics'; provider: 'ga4' | 'presence' | 'meta' | 'gsc'; window: string; cacheAgeSeconds: number }
  | { kind: 'fallback'; reason: string };
```

Rendering rule: if `kind === 'fallback'`, the UI may not use "live", "verified", "real", "sold", "left", "just bought", or exact-looking counts.

## Next Implementation Tickets

1. Add source flags to `ProductSummary`, `CategoryPulse`, and `ConcernSummary` from `liveData.ts`.
2. Relabel category-page fallback copy in `categoryPageI18n.ts`, `LiveTickerBar.tsx`, `PopularCategoriesGrid.tsx`, `TrendingLeaderboard.tsx`, `StockBar.tsx`, and `ConcernGrid.tsx`.
3. Fix PDP review aggregate wording in `ReviewsSection.tsx` so only individual `review.verified` records are called verified purchases.
4. Add a lightweight static audit that fails on restricted trust words when a component is rendering fallback-sourced metrics.

## Verification

- Read-only code audit covered `liveData.ts`, category page components, PDP product info, review rendering, route handlers for active sessions/recent orders/categories, and realtime presence helper.
- No WooCommerce writes, protected commerce-data writes, deploy, PM2 restart, route, metadata, sitemap, or visual UI changes were made.
