# Emart Open Task Board

Last updated: 2026-06-01 — **6-WEEK STABILITY FREEZE ACTIVE**
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
- [x] `git add` + commit all workspace doc changes — done, git status clean as of 2026-05-25
- [x] Verify `git status` clean on Local before moving on

### 2. Security
- [x] **Rotate WooCommerce keys** — done by Codex 2026-05-23; stale/mobile keys revoked; BFF smoke OK · see `workspace/audit/active/wc-key-rotation-20260523.md`
  - ✅ Verified 2026-05-25: key_ids 2, 3, 26 are already gone from DB. Only key_id 33 (OpenClaw Agent) remains. BFF uses loopback auth bypass (`woo-api-fix.php` + Nginx geo whitelist) — consumer keys not required. No owner action needed.
- [x] **WooCommerce BFF key repair** — done 2026-06-01; stale key in .env.local replaced with key_id 36 (user_id=2648); woo-api-fix.php updated with VPS IP 5.189.188.229; checkout working
- [ ] **Rotate Google service account key `ce8b30ba`** — key was shared in chat session; owner must delete in Google Cloud Console → IAM → Service Accounts → emart-seo → Keys and create new one · **SECURITY — DO PROMPTLY**

### 3. Product data — no URL changes, safe during freeze
- [ ] **pa_concern apply** — owner reviews `workspace/audit/active/pa-concern-manual-review-20260521-174247.csv` → Codex applies
- [x] **Product size/title cleanup** — applied 2026-05-29 from owner-approved `correct` column; 115 Woo updates, rollback saved, post-apply dry-run clean; no slug/URL changes
- [x] **pa_origin 17-gap** — applied 2026-05-25; 17 missing origins assigned, owner brand overrides applied, and stale PDP custom Origin/FAQ/structured/product SEO text synced catalog-wide
- [x] **Price normalize** — verified 2026-05-25; zero published products have `_regular_price` 0.00 / 1.00 · `workspace/audit/active/price-normalize-summary-20260525.md`
- [x] **Healthy Place brand** — confirmed 2026-05-25; Korean brand (헬시플레이스), pa_origin=South Korea already applied to all 3 products (62048, 62050, 62052). No action needed.
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
- [x] **GSC baseline snapshot** — captured 2026-06-01; 3,420 treatment + 212 holdout; `workspace/audit/active/baseline-snapshot-2026-05-31.json`
- [x] **GSC OAuth credentials** — `apps/web/gsc-oauth-token.json` active; humanizer reads query map for focus keywords
- [x] **Product schema CollectionPage fix** — 49 GSC warnings resolved; CollectionPage hasPart:Product → ItemList:ListItem in /offers/[slug], /new-arrivals, /sale · deployed 2026-06-01
  - Owner action: click **"Validate Fix"** in GSC → Shopping → Product snippets
- [x] **Cloudflare cache rules** — `/_next/*` (7d Edge TTL) + `/wp-content/uploads/*` (30d) · deployed 2026-06-01; cf-cache-status: HIT confirmed
- [x] **Order attribution tracking** — `AttributionTracker.tsx` captures UTM/referrer; order meta writes first-touch + last-touch source/medium/campaign · deployed 2026-06-01

### 6. Mobile — internal, no public URL changes
- [x] **M2: Audit mobile API calls** — verified 2026-05-25; active mobile source has zero direct `wp-json`, `/wc/v3`, Woo credential env, or backend IP references · `workspace/audit/active/mobile-m2-m3-m4-audit-20260525.md`
- [ ] **M3: Mobile checkout smoke test** — code path audited 2026-05-25, but live emulator/device COD order test not possible on this VPS
  - Mobile checkout posts to `/api/checkout`; BFF creates WooCommerce orders via `lib/woocommerce.ts`
  - Checkout screen visibly includes COD, bKash, and Nagad
  - Remaining: run on real device/emulator, place COD test order, verify WooCommerce admin order ID
- [x] **M4: Push notifications** — audited 2026-05-25; client token acquisition partial, backend/storage/sender missing
  - Wired: `expo-notifications`, app handler/listeners, Android channel, Expo push-token request, local AsyncStorage preferences
  - Missing: token registration endpoint, backend/WP token storage, push sender triggers for order/promos, completed tap navigation
  - Build missing pieces only as a separate owner-approved task

### 7. SEO Content Humanizer — IN PROGRESS
- Script: `workspace/docs/humanizer_face_cleansers.py` (production-ready)
- Guide: `workspace/docs/CLAUDE-product-humanizer-guide.md` (category-by-category)
- Spec: `workspace/docs/CODEX-TASK-product-content-humanizer.md` (updated 2026-06-01)

| Category | Total | Done | Status |
|----------|-------|------|--------|
| face-cleansers | 218 | 35 | 🔄 IN PROGRESS — run next batch |
| serums-ampoules-essences | 518 | 0 | 📋 Next after face cleansers |
| sunscreen | 315 | 0 | 📋 Queued |
| acne-blemish-care | 461 | 0 | 📋 Queued |
| toners-mists | 199 | 0 | 📋 Queued |
| shampoos + hair-care | 347 | 1 | 📋 Queued (different pairing rules) |
| **Total** | **3,640** | **40** | 1.1% done |

- Holdout: 213 products with `_emart_holdout` — **do not touch**
- High-sales skip: 11 products (total_sales > 20) — owner review required
- Remeasure: **2026-06-28** (+4w) and **2026-07-26** (+8w) via `baseline_snapshot.py --mode=remeasure`

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
| Atomic design upgrade from `CLAUDE-atomic-upgrade.md` | Branch-only future refactor; no `main`/production/URL/nav changes during freeze |
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
- Token consolidation: remove orphaned `packages/design-system/colors.ts` (0 consumers after CategoriesGrid repoint) and collapse the 3 primary-color sources (`#9f1239` / `#F24E5E` / `#e8197a`) into `tokens.css` as the single source of truth.
- Product FAQ quality regeneration (M4) — large effort, assess after freeze
- Ingredient/concern education refinement (M6) — large effort, assess after freeze

---

## 👤 OWNER ACTIONS (unblock DO NOW items)

- [ ] Review pa_concern CSV → mark APPROVE/SKIP per row
- [ ] Decide pa_origin for combo/tool products (South Korea? China?)
- [x] Confirm Healthy Place brand correction — done 2026-05-25
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
