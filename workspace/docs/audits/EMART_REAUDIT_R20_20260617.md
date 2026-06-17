# E-Mart Platform Re-Audit (R20) — 2026-06-17

Auditor: Claude Code. Scope: same as 2026-06-10 audit. Method: ~30 live GET requests + code-level verification of all R1–R19 fixes + full Verified-Good regression sweep.

## Executive Summary

**Overall health grade: A-** (up from B+).

All Critical, High (except 2 owner-frozen), Medium, and Low findings from the 2026-06-10 audit are closed and live-verified. Zero regressions in the Verified-Good list. The two remaining gaps — R12 (PDP ISR) and R18 (homepage server-rendered product rails) — are intentionally frozen by owner decision until 2026-07-03 and mitigated by Nginx edge caching.

**A- → A+ path:** close R12 + R18 after the Jul 3 freeze lifts. No other blockers.

---

## Remediation Verification (R1–R19)

| # | Finding | Fix Status | Live Evidence |
|---|---|---|---|
| R1 (C-01) | Admin auth: separate token, timing-safe, no `?token=` | ✅ CLOSED | No-auth→401, wrong token→401, `?token=`→401; `/api/revalidate` still 200; `timingSafeEqual` in `adminAuth.ts` (6 refs); admin client uses `sessionStorage` |
| R2 (H-05) | Rate limiting | ✅ CLOSED | 7 `limit_req_zone` + 7 `limit_req` rules in Nginx; `cloudflare-real-ip.conf` exists; VPS/localhost exempt |
| R3 (H-06) | wp-login.php exposure | ✅ CLOSED | `wp-login.php` → 302 to `cloudflareaccess.com` challenge |
| R4 (M-09/M-10) | Fetch timeouts + error mapping | ✅ CLOSED | `AbortSignal.timeout` in `wordpress-posts.ts`, `sitemapEntries.ts`, `seo.ts` |
| R5 (L-06) | Env backup in app root | ✅ CLOSED | No `.env.local.backup*` in `apps/web/` |
| R6 (H-03) | Schema availability | ✅ CLOSED | Live PDP: InStock (COSRX Snail), OutOfStock (Kerasys); `normalizeStockAvailability` + `getSchemaAvailability` + `BackOrder` all present (6 refs) |
| R7 (H-04) | aggregateRating | ✅ CLOSED | COSRX Snail PDP: `aggregateRating: {ratingValue: 5.0, reviewCount: 2}`; unrated products: absent (correct) |
| R8 (M-01) | Fabricated MPN | ✅ CLOSED | 0 `mpn` refs in `seo/product.ts`; live JSON-LD: mpn absent, `sku` retained |
| R9 (M-04) | Root layout canonical | ✅ CLOSED | 0 canonical refs in `layout.tsx`; 404 page: canonical absent, `noindex` |
| R10 (L-02/04/05/07) | Trivia batch | ✅ CLOSED | `safeJsonLd` on categories; search image alt falls back to name |
| R11 (H-01 stage 1) | PDP Nginx s-maxage | ✅ CLOSED | PDP: `cache-control: public, s-maxage=300, stale-while-revalidate=600`; CF respects origin |
| R13 (M-05) | Price formatter consolidation | ✅ CLOSED | `woocommerce.ts` = 3-line barrel; 0 `formatPrice` refs in lib |
| R14 (M-08) | Woo module split | ✅ CLOSED | 14 files in `lib/woo/`; 0 `any` in `lib/woo/`; app-wide `any` down 72→46 |
| R15 (L-01/L-03) | Atomic scaffold + hardcoded pixel IDs | ✅ CLOSED | Scaffold dirs removed; all 3 pixel env vars set; 0 hardcoded IDs in source |
| R16 (M-02) | GA4 ecommerce events | ✅ CLOSED | `view_item`, `add_to_cart`, `begin_checkout` in code; gtag stub in `<head>` for pre-hydration queuing |
| R17 (M-03) | Pixel deferral timer | ✅ CLOSED | Analytics: 8s; Merchant badge: 30s |
| R19 (M-06/M-07) | Design token sweep | ✅ CLOSED | `lumiere-` classes: 0; raw hex: 8 instances (all in canonical definition files: `colors.ts`, `tokens.css`, `midnight-blossom.css`) |

---

## Intentionally Frozen (owner decision, until 2026-07-03)

| # | Finding | Mitigation in Place |
|---|---|---|
| R12 (H-01 stage 2) | PDP `force-dynamic` → ISR | Nginx `s-maxage=300` provides 5-min CDN caching; checkout re-validates stock/price server-side |
| R18 (H-02) | Homepage `ssr:false` product rails | 0 `/shop/` links in homepage HTML; crawlers rely on sitemap (4,213 URLs) + category/brand hub pages for product discovery |

---

## Verified-Good Regression Sweep — All Clear

| Area | Check | Result |
|---|---|---|
| **Schema suite** | Product / BreadcrumbList / FAQPage / CollectionPage / ItemList on PDP, category, /faq, /best, /categories | ✅ All present and parse-clean |
| **Product schema** | offers (price BDT, availability, returnPolicy, shippingDetails), brand, sku, description, aggregateRating when applicable | ✅ Complete |
| **Crawl hygiene** | robots.txt, sitemap 4,213 URLs, random URL→200, bogus→404, http→https 301, www→apex 301 | ✅ No change |
| **Security headers** | HSTS+preload, X-Frame DENY, nosniff, Referrer-Policy, Permissions-Policy, CSP with frame-ancestors none | ✅ Full set present |
| **Endpoint security** | `/wp-json/`→403, `/wp-json/wc/`→403, `/.env`→404, `/api/version`→buildId only | ✅ |
| **Checkout** | 8-step monitor all pass (last: 16:45 UTC today); server-side stock/price revalidation; idempotency; error mapping | ✅ |
| **Search** | Products returned for queries; noindex,follow; canonical on /search | ✅ |
| **H1 counts** | 1 h1 on /, PDP, category, /faq, /blog | ✅ |
| **404 page** | No canonical, noindex | ✅ |
| **OG tags** | PDP: 9 OG tags including site_name, locale, image with dimensions | ✅ |
| **Canonicals** | Self-referencing absolute on all real pages; absent on 404 | ✅ |
| **AI crawler access** | robots.txt allows GPTBot/ClaudeBot/PerplexityBot/Google-Extended/CCBot; llms.txt→200 | ✅ |
| **Admin token storage** | `sessionStorage` (not localStorage) | ✅ |
| **Secrets in source** | 0 `ck_`/`cs_`/`sk-or-`/`sk-proj-` in `apps/web/src/`; REVALIDATE_SECRET only in server-side `api/` routes | ✅ |
| **Pixel env vars** | GA4, Meta, Reddit all env-gated; no fallback IDs | ✅ |
| **Performance caching** | Homepage: `s-maxage=3600, cf-cache-status: HIT`; PDP: `s-maxage=300, cf-cache-status: EXPIRED→HIT`; Category: `s-maxage=300` | ✅ |
| **PM2 processes** | `emartweb` online (10m uptime), `emart-presence` online (45d), `emart-checkout-monitor` passing, `emart-revenue-health` fixed this session | ✅ |

---

## New Findings (this audit)

### None Critical or High

### Medium (cosmetic / post-freeze)

- **N-01 — Header.tsx remains 1,185 lines.** Original audit flagged 1,188 lines; minor reduction (3 lines). Still mixes search, mega-menu, cart, account. This is a refactoring candidate post-freeze, not a regression.
- **N-02 — 46 `any` types app-wide** (down from 72 at original audit). Zero in `lib/woo/` (was the worst offender, now fully typed). Remaining 46 scattered across components/app — diminishing returns to chase further.
- **N-03 — `emart-checkout-monitor` and `emart-competitor-prices` show as `stopped`** in PM2. Both are cron-triggered (`*/15` and daily), so `stopped` between runs is normal PM2 cron behavior. Verified: checkout monitor last passed all 8 steps at 16:45 UTC today.

### Low

- **N-04 — `midnight-blossom` theme** (10+ files). Documented as intentional distinct secondary theme in R19 resolution. Not a regression.

---

## Grade Justification

| Criterion | Status |
|---|---|
| All Critical findings closed | ✅ C-01 closed |
| All High findings closed or owner-accepted | ✅ H-01 stage 1 closed, stage 2 frozen; H-02 frozen; H-03–H-06 closed |
| All Mediums closed or documented | ✅ M-01–M-10 closed; M-07 documented |
| No regressions in Verified-Good | ✅ 0 regressions |
| No new Critical/High issues | ✅ |

**Grade: A-**

**Gap to A+:** R12 (PDP ISR, remove `force-dynamic`) + R18 (homepage server-rendered product rail). Both frozen until 2026-07-03 by owner decision. After Jul 3, closing these two brings the platform to A+.
