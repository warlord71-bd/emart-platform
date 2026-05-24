# Emart Open Task Board

Last updated: 2026-05-25 — **6-WEEK STABILITY FREEZE ACTIVE**
Freeze period: 2026-05-22 → 2026-07-03. After that: reassess from GSC data.
**Rule:** Single priority board, tracked in git. Detail → `workspace/SEO_MASTER.md` · `workspace/DEV_MASTER.md`.
Only mark `[x]` when fully deployed + verified on live VPS.

---

## ✅ ALWAYS OK — during freeze (no SEO risk)

These never break rankings. Do freely at any time.

- Add new products to WooCommerce — sitemap auto-updates, new URLs get crawled naturally
- Add product images — improves schema quality and CTR, never hurts
- Add blog posts — grows authority, zero structural risk
- Add/edit product descriptions, ingredients, how-to-use content
- Fix product prices, stock, SKU data
- Respond to customer/support issues

---

## 🟢 DO NOW — close before freeze settles (safe, no URL/structure change)

Complete these then stop code changes.

### 1. Commit workspace restructuring (today)
- [ ] `git add` + commit all workspace doc changes — docs only, zero live impact
- [ ] Verify `git status` clean on Local before moving on

### 2. Security
- [ ] **Rotate WooCommerce keys** — old keys bundled in mobile builds may still be active · Codex · DEV M1

### 3. Product data — no URL changes, safe during freeze
- [ ] **pa_concern apply** — owner reviews `workspace/audit/active/pa-concern-manual-review-20260521-174247.csv` → Codex applies
- [ ] **pa_origin 17-gap** — owner decides origin for combo/tool products → Codex applies · `workspace/audit/active/pa-origin-gap-review-20260521-175120.csv`
- [ ] **Price normalize** — fix 0.00 / 1.00 placeholder prices · Codex
- [ ] **Healthy Place brand** — owner confirms → Codex applies
- [ ] **Product images** — owner uploads 16 → Codex assigns · `workspace/audit/active/products-need-real-image.csv`

### 4. Small frontend fixes — invisible to Google crawl
- [x] **W2: aria-hidden focusability** — investigated 2026-05-24; no actual issue found in current code, false positive
- [x] **W3: ProductCard LCP priority** — deployed 2026-05-24 (brands, sale, new-arrivals, offers, search)
- [x] **W4: ReviewsSection refetch** — deployed 2026-05-24; getProductReviews wrapped in unstable_cache(3600s)
- [x] **U1: Tailwind token fix** — deployed 2026-05-24; --color-canvas defined in globals.css
- [x] **U6: ARIA tab semantics** — deployed 2026-05-24; full ARIA tabs pattern in DetailsTabs.tsx

### 5. Backend / monitoring
- [x] **Blog auto-revalidation** — already implemented in blog_generator.py line 358 (verified 2026-05-24)
- [ ] **GA4 DebugView** — visit a 404 URL → confirm `headless_migration_404` event fires · owner
- [x] **Merchant Center** — reprocess `gla_2611` · done 2026-05-24
- [x] **GSC** — remove stale/junk URLs, request indexing · done 2026-05-24

### 6. Mobile — internal, no public URL changes
- [ ] **M2: Audit mobile API calls** — verify no remaining direct `wp-json` calls · Codex
- [ ] **M3: Mobile checkout smoke test** — COD + bKash/Nagad end-to-end · Codex
- [ ] **M4: Push notifications** — confirm FCM/APNs live · Codex

---

## 🧊 FROZEN — do not touch until 2026-07-03

Google needs 6 weeks of signal stability after the structural work done in May.
Continuous changes reset the crawl clock and degrade ranking consistency.

**Emergency exception:** A serious bug (site down, checkout broken, security vulnerability, data loss, 500 errors on revenue pages) overrides the freeze regardless of state. Fix it immediately, minimal scope, then stop. A bug fix is not a reason to also refactor surrounding code.

| Item | Why frozen |
|---|---|
| New redirects in `next.config.js` | 72 rules already in — let Google process them |
| URL / slug changes | Every change resets crawl signals on that URL |
| Sitemap structure changes | 4,221 URLs indexed — let Googlebot settle |
| Category slug renaming | Would create new 301s, confusing crawl graph |
| Navigation restructuring | Consistency is a ranking signal |
| Offers nav/URL/structure | Completed 2026-05-25 — freeze reinstated; no further changes until 2026-07-03 |
| New page types (O2 compare, O3 listicles, O4 skin-type) | New URL patterns restart indexing cycle |
| U3: Split `HomepageSections.tsx` | Medium risk, zero SEO value right now |
| U4: Split `Header.tsx` | Medium risk, could break nav on deploy |
| U5: Shared `ProductGrid` | Medium risk, affects revenue-critical catalog pages |
| U7: Split `CatalogFilters.tsx` | Medium risk, affects catalog filtering |
| W6/L2: Critical CSS inlining (`critters`) | Build complexity risk, not worth mid-freeze |
| L3: `/brands` page size reduction | Structural change, defer |
| L1: Cloudflare cache rules | Dashboard change, can wait |
| W7: Category OG image fallback | Very small but involves category page deploy — defer to end of freeze |
| Contabo migration | Highest-risk task — needs dedicated window, not during freeze |

---

## 🔵 AFTER FREEZE — reassess from GSC data (from 2026-07-03)

Do not plan or estimate these now. Read GSC impression/click data first, then prioritise.

- O1: Origins editorial content for high-value countries
- O2: Product comparison pages
- O3: "Best [X] in Bangladesh" listicles
- O4: Skin-type pages
- L4: H2s on `/brands`, `/sale`, `/new-arrivals`
- L6: Blog content volume (content calendar decision)
- L5: Google-Extended bot policy decision
- U2: Theme contract token map
- U8: Layout primitives
- Product FAQ quality regeneration (M4) — large effort, assess after freeze
- Ingredient/concern education refinement (M6) — large effort, assess after freeze

---

## 👤 OWNER ACTIONS (unblock DO NOW items)

- [ ] Review pa_concern CSV → mark APPROVE/SKIP per row
- [ ] Decide pa_origin for combo/tool products (South Korea? China?)
- [ ] Confirm Healthy Place brand correction
- [ ] Upload 16 product images
- [ ] GSC dashboard: remove stale URLs, request indexing
- [ ] GMC dashboard: reprocess `gla_2611`
- [ ] Fix Celimax broken ad URL at source in Meta Ads Manager
- [ ] Confirm Contabo migration maintenance window (after freeze)
- [ ] Telegram bot decision (after freeze)
- [ ] iOS Apple Developer account (after freeze)

---

## 🚀 FUTURE / MONTH 2+ (after freeze + GSC review)

- Ingredient glossary (50 entries)
- MediMart launch
- HG Corp hub site

---

## 🛑 PERMANENT DO NOT TOUCH

- Checkout / cart / payment / order logic
- `_sku`, `_price`, `_stock_quantity` WooCommerce meta
- `apps/web/src/app/api/checkout`
- Customer data / order history

---

## AGENT RULES

- **Claude Code** → `apps/web` (Next.js, TypeScript, SEO, content) — no direct WP DB writes
- **Codex** → `apps/mobile`, PHP mu-plugins, WP DB mutations — no Next.js UI files
- **Both** → Read `/root/CLAUDE.md` + `/root/emart-platform/CLAUDE.md` at session start
- **During freeze** → Only DO NOW tasks and ALWAYS OK items are permitted
- **Freeze check** → Before any code change, ask: "does this change a URL, redirect, sitemap, or navigation?" If yes — it is frozen until 2026-07-03
- **SEO detail** → `workspace/SEO_MASTER.md`
- **Dev detail** → `workspace/DEV_MASTER.md`
- **Dry-run rule** → Never bulk-mutate WooCommerce data without a dry-run CSV reviewed by owner first
