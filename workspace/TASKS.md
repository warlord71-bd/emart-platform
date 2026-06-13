# Emart Task Board
Last updated: 2026-06-13 (mobile audit remediation checked; SecureStore done, BFF blockers confirmed)
Freeze: 2026-05-22 → 2026-07-03 (structural/nav only — content, SEO, automation OK)
**[C]** Claude · **[X]** Codex · **[O]** Owner · **[A]** Auto/OpenClaw

---

## 🤖 RUNNING AUTONOMOUSLY

| Job | Status | Notes |
|---|---|---|
| `emart-meta-gen` (PM2) | ✅ stopped — job complete | 41/42 bad metas fixed Jun 9; "original original" item re-checked Jun 10 — resolved, see #11 |
| meta_generator dry-run (PID 448966, manual) | 🔄 running | Item #14 — 1266-product dry-run, see #14 below |
| `emart-presence` (PM2) | ✅ running | WebSocket, 33d uptime |
| `emart-checkout-monitor` (PM2 cron) | ✅ all 8 steps pass | Every 15 min. Fixed 2026-06-10: Step 7b test SKU was hardcoded to product 93315 (Kerasys shampoo), which went out of stock and caused 5x false-alarm 409 alerts; switched test SKU to product 2591 (COSRX Snail Mucin essence, in stock) |
| Python crons | ✅ running | site_health, daily_report, low_stock |
| GMC sync | ⚠️ last run Jun 5 | 3,523/3,630 approved — 6 days stale, consider re-run |
| `emart-seo-autoscan` (PM2 cron, daily 00:00 UTC) | ✅ fixed 2026-06-12 | Root cause: `WP_BASE=${WOOCOMMERCE_URL}/wp-json` = `http://127.0.0.1/wp-json`, nginx 301-redirects to https, `curl -sf` (no `-L`) returned the redirect HTML which the JSON parser silently treated as `[]` → false "0 missing" every day. Fixed `WP_BASE` to `https://e-mart.com.bd/wp-json` (Local+VPS); manual run now correctly found 1 post (93922) missing SEO and reported it |
| `emart-serp-checker` (PM2 cron, daily 01:00 UTC) | 🗑️ removed 2026-06-12 (owner approved) | Was running `workspace/docs/baseline_snapshot.py --mode=baseline` (default) daily — before crashing on a bad GSC credential path, it already wrote `_emart_holdout` postmeta to live WC products via `select_holdout()`/`mark_holdout_in_db()`. Script's own docstring says it's a one-time/4-8-week tool, not daily; daily "baseline" runs would re-derive a drifting holdout set and overwrite `baseline-snapshot-{date}.json` nightly. PM2 job deleted + `pm2 save`'d (script stays on disk for manual one-time/periodic use) |
| `emart-competitor-prices` (PM2 cron, daily 02:00 UTC) | ✅ fixed 2026-06-12 | Created missing `workspace/scripts/active/competitor_prices_run.sh` wrapper (Local+VPS, executable), modeled on `checkout_monitor_run.sh`. `competitor_price_checker.js` itself was already complete/self-contained |
| `emart-revenue-health` (PM2 cron, every 30 min) | 🟡 NEW, found 2026-06-11 audit, status unclear | Runs `revenue-tracking-smoke.cjs`; logs show repeated `requestfailed`/`net::ERR_ABORTED` for analytics beacons — may be benign (ad-blocked beacons in headless browser) or a real failure, needs review |

---

## 🔴 OWNER — Do these (workspace/docs/OWNER-ACTIONS-20260605.md)

1. ~~**MailPoet review email**~~ — ✅ done 2026-06-12: WooCommerce Order Completed → 3-day delay → review email automation set up and verified
2. **Meta CAPI test** — ✅ test order 94184 placed 2026-06-12, Purchase event confirmed in Events Manager (BDT, value > 0, 8.0/10 match quality). Found+fixed same session: `emart-checkout-monitor` was firing real CAPI Purchase events for its 15-min synthetic test orders (root cause of 3 logged 500s on 94165-94167); fixed via `CHECKOUT_MONITOR_SECRET` skip-flag (commit `d18fe89`). Also fixed R16 InitiateCheckout/begin_checkout hydration race in same commit. ✅ Outstanding item done 2026-06-12: owner cancelled test order **94184** in WooCommerce admin. Remaining: re-check Events Manager Purchase count in 24-48h to confirm phantom Purchases stop
3. ~~**GSC URL indexing**~~ — ✅ done 2026-06-12 (7 URLs from OWNER-ACTIONS doc resolved)
4. ~~**Cloudflare cache rule**~~ — ✅ confirmed live 2026-06-12: re-checked `/shop/cosrx-low-ph-good-morning-gel-cleanser`, `cf-cache-status: HIT` at `age: 16-19s` with origin `cache-control: public, s-maxage=300, stale-while-revalidate=600` intact — Cloudflare is respecting origin TTL as set 2026-06-11 (R11). No regression.
5. **GMC title-risk products** — 11 products in gmc-steps3-6-report-20260605.md, approve/reject title changes
6. **GMC data/asset** — 2 products missing price/image: IDs 63749, 62576
7. **GMC mixed manual** — 6 products: IDs 36262, 3274, 56108, 3753, 38292, 26194
8. **13 product images** — workspace/audit/active/products-need-real-image.csv (was 16; 2026-06-10: removed 3 Beauty Glazed lipstick IDs 74189/74187/74185 — owner confirmed/verified these now have valid images)
9. **pa_concern 1,161 rows** — 13 conservative assignments applied Jun 6 and `tag:products` revalidated; remaining 1,147 left blank due no reliable signal
10. ~~**OpenClaw meta generator**~~ — ✅ resolved Jun 9: process stopped, job complete, 41/42 bad metas fixed
11. ~~**6 "original original" metas**~~ — ✅ resolved/closed Jun 10: re-checked DB, no `pa_brand`/`pa_origin` term named "original" exists, and zero `_rank_math_description` rows contain "original original" (broader duplicate-word scan, 175 hits, also confirms none). Issue appears already fixed by earlier corrections; no further action needed.
14. **1304-product meta regen (781 missing + 523 bad "original" pattern) — IN PROGRESS, 94/1266 done** — `meta_generator.py` switched to paid `deepseek/deepseek-chat-v3.1` (free models gave ~6% defect rate: literal "XYZ" placeholders, garbled grammar, raw `&amp;` entities — none caught by `meta_validator.py`). 2026-06-10: regenerated+validated+applied 94 metas (88 from the original dry-run batch + 11 "XYZ"-brand-fix products + 3 retries), `tag:products` revalidated. Side-fix: `pa_brand="XYZ"` (term 8050, 11 live products) was a real data bug already live in meta descriptions — reassigned to "Beaute"(9744)/"Athena"(1211)/"LUOFMiSS"(9745), old term deleted. Wrapper scripts `_run_generator.py`/`_run_validator.py` (VPS `workspace/docs/`) handle secrets in-process. Remaining: ~1172 IDs in `workspace/docs/meta_regen_ids_remaining_20260610.txt`, continue in ~50-ID batches: dry-run --force --ids-file → validator --input → apply-reviewed → revalidate.
12. ~~**Product duplicate review**~~ — ✅ resolved Jun 9: redirects deployed first, 12 retire products set to `draft`; manually purge the 12 old URLs listed in `workspace/audit/active/duplicate-resolution-recommendations-20260609.md` if Cloudflare still serves stale old PDP HTML
13. **Image/duplicate follow-up** — final browser-ranked list ready at `workspace/audit/active/combined-image-duplicate-browser-final-20260609.md`; 33 Level A likely image/action items need source-image approval before changes
15. ~~**R3 — Cloudflare Access for wp-login.php**~~ — ✅ CLOSED 2026-06-11. Owner picked "Cloudflare Access (email gate)" over IP allowlist/fail2ban/accept-risk. Step-by-step doc: `workspace/docs/OWNER-ACTION-R3-cloudflare-access-20260611.md`. First two attempts failed (first still reached WordPress directly; second protected login/admin but also caught `/`, `/shop`, PDPs and was deleted). Third attempt: two narrow per-path Access apps (`e-mart.com.bd` + Path `/wp-login.php*`, and `e-mart.com.bd` + Path `/wp-admin/*`), policy Allow → `hgc.bd71@gmail.com`. Live-verified: `/`, `/shop`, PDP all 200 no challenge; `/wp-login.php` and `/wp-admin/` return 302 to `cloudflareaccess.com` login challenge; `/wp-json/wc/v3/products` still 403 (unaffected, pre-existing).
16. ~~**Stale PM2 entry `emart-cleanser-apply`**~~ — ✅ RESOLVED 2026-06-13. Was id 29, pointed to `workspace/scripts/active/run_cleanser_apply.sh` (didn't exist on Local or VPS, no git history), stopped, `restart_time: 0`. Removed via `pm2 delete emart-cleanser-apply` + `pm2 save`.
17. ~~**VPS git metadata lag**~~ — ✅ RESOLVED 2026-06-13. VPS `HEAD` was at `fa1f873` (8 commits behind). Synced the 24 app-wide mobile icon-fix files (`apps/mobile/**`, from commit `60b10b8`) from Local to VPS (source-only, no runtime/PM2 impact), then `git fetch origin && git reset --mixed origin/main`. VPS `HEAD` now `588243c`, matches Local/origin exactly, `git status` clean.

---

## 🟢 CLAUDE — Next tasks (2026-06-10)

### C1 — Blog generator: rewritten, tested, READY TO RUN (not scheduled)
- `/root/.openclaw/workspace-emart/blog_generator.py` fully rewritten: GSC-informed + evergreen topic bank, 5 rotating writer personas, anti-AI-detection prompt rules (no separate humanizer pass), in-content internal auto-linking (`/ingredients/*`, `/concerns/*`, `/category/*`), always-attach featured product image, OpenRouter model list fixed to working free models.
- ✅ Live test passed: published post 93922 "Innisfree Skincare Guide for Bangladesh" (https://e-mart.com.bd/blog/innisfree-skincare-guide-for-bangladesh-volcanic-clay-mask-face-wash-sunscreen) via `openai/gpt-oss-120b:free` fallback. State file updated (`gsc_used_indices: [0]`, `persona_index: 1`).
- **Per owner instruction "meta first, blog next" — do NOT run again or add cron until item #14 (meta regen) has progressed/completed** (shared OpenRouter free-tier quota). Suggested cron once cleared: `0 2,10,18 * * *` (3x/day).

### C2 — Schema/social sameAs — ✅ DONE 2026-06-10
- Added `COMPANY.social.tiktok` to Organization `sameAs` in `layout.tsx`. Built on Local + VPS, `pm2 restart emartweb` done, live smoke HTTP 200, live JSON-LD confirmed includes `https://www.tiktok.com/@emart_bdofficial`. Committed `806938f`, pushed to `origin/main`, VPS git aligned to `806938f`.
- Reddit/LinkedIn `sameAs`: still blocked — no profile URLs exist in `companyProfile.ts`; need owner to provide real URLs before adding (cannot fabricate URLs).

### C3 — Strategic SEO note (owed, not yet written up)
- Owner asked for a synthesis on: Android default search engine (Google) dominance in Bangladesh + mobile-first SEO implications, how AI/LLM search surfaces (AI Overviews, ChatGPT/Perplexity/Gemini) consume schema/FAQ content for citations, and factoring TikTok/Facebook/YouTube trending topics into blog topic selection. Not yet delivered — schema audit groundwork done (homepage/category schema confirmed mostly correct).

### C4 — GEO/AEO standing consideration (added 2026-06-10)
- Owner: keep Generative Engine Optimization (AI Overviews/ChatGPT/Perplexity/Gemini citations) and Answer Engine Optimization (featured snippets/PAA/voice, FAQPage schema) in mind for ALL future SEO/content work, not a one-off task. Documented in `workspace/SEO_MASTER.md` under "STANDING CONSIDERATION — GEO & AEO". New content types (blog, future `/best/*`, `/compare/*`) should ship with `Article`/`FAQPage`/`HowTo` schema from the start.

### C6 — Reddit Conversions Pixel (frontend) — DONE 2026-06-10, live
- Owner asked to "activate Reddit" — investigation found wp-admin's "Jetpack account info" JSON error comes from `google-listings-and-ads`/`reddit-for-woocommerce` plugins' broken Jetpack-connection check (cosmetic, doesn't affect product saves or GMC sync; left as-is).
- Built frontend Reddit Conversions Pixel matching the Meta Pixel/GA4 pattern: `src/lib/redditPixel.ts` + `src/components/analytics/RedditPixel.tsx`, wired for PageVisit/ViewContent/AddToCart/Purchase. CSP updated for `redditstatic.com`/`reddit.com`/`alb.reddit.com` (script-src, connect-src, and img-src for the `rp.gif` beacon). Committed `3ac9894`+`04e1a71`, pushed, VPS aligned and deployed.
- `NEXT_PUBLIC_REDDIT_PIXEL_ID=a2_j5ni2gcn8o6b` set in Local + VPS `.env.local`. Live-verified via Playwright: PageVisit/ViewContent/AddToCart all fire real `alb.reddit.com/rp.gif` beacons with correct product data, zero CSP errors. Purchase event untested live (needs real checkout) but reuses the working Meta Pixel sessionStorage pattern.

### C5 — 14-item SEO/frontend audit — Phase 1-4 done for approved batch 2026-06-10
- Verified all 14 items (A1, B2-B6, C7-C11, D12-D14) with file:line references. Several were already resolved/stale: A1 (Pixel ID `763041131179021` confirmed correct, env var present), B2 (dead `ShopByCategorySection` — removed as cleanup), C10 meta-description part (contact page already has one), D12 (blog Article JSON-LD + byline already implemented).
- **Fixed & deployed** (commits `d82b421`, `b8eba66`, `508beef`, `c08de32`, pushed to `origin/main`): B6 twitter:site `@emartbd`→`@emartskincarebd`; C11 robots.txt CCBot disallow→allow; B2 dead-code removal; C9 sitemap lastmod split (catalog-reflecting pages get fresh generation-time date, static policy pages omit lastmod instead of frozen `2026-05-16`). Built, `pm2 restart emartweb`, live smoke verified (note: edge cache served stale `@emartbd` briefly — origin confirmed correct).
- **B3 — DONE 2026-06-10 (data task, no code/slug/URL change)**: WC category `night-cream` (id 3601, slug unchanged) renamed to "Moisturizers". Additively assigned category 3601 to: (1) all 27 `cream-moisturizer` products, then (2) 120 more standalone face moisturizer creams/gel-creams/lotions found across the full 3,626-product catalog (criteria: cream/gel cream/moisturizer/facial lotion only/night cream — excluded body lotion, baby, sunscreen-primary, masks, toners, serums, cleansers, lip/hair). Existing category memberships kept (additive only). Result: "Moisturizers" homepage card now shows **162 products** (was 15), `tag:products`+`tag:categories` revalidated, live-verified. Note: `/category/night-cream` page `<title>`/meta still shows old Rank Math "Night Cream Prices in Bangladesh" text — this is a 1hr `next: {revalidate:3600}` GraphQL fetch cache (not tag-based) and will self-update within an hour as it now reads the renamed term name "Moisturizers".
- **B5/C7/C8 — DONE 2026-06-10** (commits `592b1eb`, `3c909d1`, `f61a3f5`, pushed to `origin/main`, VPS git aligned): B5 added `data-nosnippet` to the hidden-on-desktop mobile hero copy span in `HeroCarousel.tsx`. C7 removed the broken `other['og:type']` (rendered as `<meta name="og:type">`, invisible to OG parsers) and added a raw `<meta property="og:type" content="product" />` directly in `shop/[slug]/page.tsx` JSX — confirmed Next 14's typed `openGraph.type` union has no `'product'` value and would throw at runtime if cast, so the metadata-API route wasn't viable. C8 added a `withDhakaOffset()` helper in `wordpress-posts.ts` so blog `date`/`modified` (site-local Asia/Dhaka, UTC+6, no DST) get a `+06:00` suffix before feeding `datePublished`/`dateModified` JSON-LD. All three built/lint/typechecked clean on Local, VPS build + `pm2 restart emartweb` clean, live-verified (`og:type=product` meta present once, hero `data-nosnippet` present, blog JSON-LD dates show `+06:00`).
- **C10 remainder/D13/D14 — DONE 2026-06-10 by Codex** (commits `fc47ea6`, `20adebf`, `d850d4a`, pushed to `origin/main`; VPS git realigned to `edb6927`, build+`pm2 restart emartweb` already done): C10 added `data-nosnippet` to header marquee/cart-preview duplicate text. D13 added `ProductEducationLinks` component — PDP ingredient/skin-concern links to `/ingredients/*` and `/concerns/*` (live-verified on COSRX snail essence PDP). D14 added `NumberedPagination` shared component on `/shop` and `/category/[slug]` (live-verified `/shop?page=2` shows 152 total pages with prev/next + numbered links). 14-item audit (A1, B2-B6, C7-C11, D12-D14) is now fully closed. B4 (hero raw `<img>`→`next/image`) remains deferred as a separate LCP-sensitive task, not assigned.

### C7 — Login/auth UX + critical prod 404 fix — DONE 2026-06-12
- Added `autoComplete`/`inputMode` attributes to `AccountClient.tsx` (login/register/password-reset) and `CheckoutClient.tsx` (name/phone/address/city) for password-manager autofill.
- Added `/api/auth/login-by-phone` proxy + "Log in with email + phone" UI on `/account`, using existing WP `customer/login-by-phone` endpoint; sets same `wc_session` cookie as password login.
- Moved hardcoded Resend API key from `emart-smtp.php` into `wp-config.php` (`EMART_RESEND_KEY`), matching `EMART_ORDER_SECRET`/`EMART_SMTP_*` convention.
- **Fixed critical live bug**: `login`/`register`/`request-password-reset`/`verify-email`/`login-by-phone` were all returning 404 in prod because `getWordPressBaseUrl()` resolved to `http://127.0.0.1`, nginx 301'd to HTTPS, downgrading POST→GET, hitting `rest_no_route`. Now resolves to `https://e-mart.com.bd` directly (same as checkout's `PUBLIC_SITE_URL`). Live smoke-tested all 5 endpoints post-deploy — correct 401/400/200/307 responses, no more 404s. Built, deployed, `pm2 restart emartweb`, committed `b2f10ae`, pushed to `origin/main`.
- Deferred (post-freeze, after 2026-07-03): session consolidation (NextAuth/wc_session/JWT unification), SMS OTP (no SMS provider).

---

## 🟡 CODEX — Next tasks

### X2 — Impression-priority humanizer
- ✅ First 10 non-holdout impression-priority products applied Jun 5
- ✅ Jun 6 follow-up: current reviewed JSONL exhausted; 10/10 eligible rows applied, `58506` markdown fence cleanup applied, product cache revalidated
- Reviewed JSONL: workspace/humanizer/impression-priority/active/impression-priority-2026-06-05.jsonl
- Holdout preserved: 2611, 2591, 4064
- Next: monitor GSC movement; generate/review a new impression-priority JSONL before applying more products

### X3 — Mobile M0
- ✅ Local release-readiness pass: BFF credential audit clean, stale Woo `.env.example` removed, shipping policy aligned, checkout success response fixed
- ✅ Validation: `npm ls --depth=0`, `npx expo config --type public`, `npx expo export --platform android`, `npx expo-doctor` 18/18
- ✅ Logic pass: product-detail missing-param hook guard fixed, Card copy removed until SSLCommerz exists, mobile JWT review auth wired through live `/api/product-reviews`
- ✅ Android preview APK built 2026-06-12 via EAS `preview`: app `1.1.1`, build `24`, build ID `3bc989ee-3b42-49e0-a544-548918ec91f7`; APK downloaded to `/tmp/emart-preview.apk` and local APK integrity/structure checks passed
- ✅ Appetize browser smoke 2026-06-12: uploaded APK to `https://appetize.io/app/wquy3ev7ce2pqffnj3zh4lbah4`, launched via Chromium/CDP, verified Home/Shop/Cart/Account render
- ✅ Bottom nav missing-icons bug fixed in commit `ce952ac`: tab bar now uses fontless React Native shapes; fixed EAS build `cb07590d-b556-4667-8198-fb582ea765df` uploaded to same Appetize app (versionCode 2) and screenshot-verified
- ✅ App-wide icon-font removal in commit `60b10b8`: all `Ionicons`/`@expo/vector-icons` usage replaced with new fontless `apps/mobile/src/components/AppIcon.js` across `App.js` and every screen; `expo-font` plugin/deps removed. EAS build `db756401-83d1-4aae-8e7b-b0eb2428a157` FINISHED (artifact ready); pushed to `origin/main`. Not yet re-uploaded to Appetize for visual confirmation.
- ✅ Mobile audit Batch B/C/D remediation in local branch `fix/mobile-audit-june`: safe-area provider foundation, root error boundary, fetch/JSON timeouts, centralized StatusBar, Android checkout keyboard avoidance, capped PDP review rendering, scoped accessibility labels/roles, minimized local order PII, cart quantity clamping, deep-link config, and notification tap navigation. Validated with `npx expo config --type public`, `npx expo-doctor` 18/18, and `npx expo export --platform android`.
- ✅ Mobile JWT storage hardening in local branch `fix/mobile-audit-june`: added `expo-secure-store`, moved JWT persistence out of AsyncStorage, and added one-time migration for old `@emart_user.token` blobs.
- ⚠️ Mobile audit blocked findings re-checked 2026-06-13: server-backed mobile order history and Google token→Emart JWT exchange need BFF endpoints. Current mobile BFF routes only include auth login/register, categories, coupons, and products; web `/api/account/orders` exists but is session-based, not a mobile JWT order-history API.
- ⚠️ Live BFF gap: `/api/mobile/cart` and `/api/mobile/payment` 404; current app uses local cart + manual bKash/Nagad TrxID via `/api/checkout`
- ⚠️ ADB gap: `adb` installed on VPS, but no phone visible; local laptop USB device is not exposed to the VPS
- Next: real device COD/bKash/Nagad checkout smoke, then EAS production AAB + Play Store internal testing upload

---

## 🛠️ AUDIT REMEDIATION — B+ → A+ (added 2026-06-10)

Full platform audit done 2026-06-10 (read-only): `workspace/docs/audits/EMART_AUDIT_20260610.md`.
Step-by-step plan with per-task specs, verify lines, and agent prompt template: **`workspace/docs/AUDIT_REMEDIATION_PLAN_20260610.md`**.

Current execution order check (2026-06-11): R2/R13/R14/R15 are done; R17 decision landed and is live. R3 CLOSED 2026-06-11 (third attempt, see row below). **All pre-freeze audit items are now closed.**

**Freeze partially broken 2026-06-11 (owner decision)**: of the post-freeze backlog (R12/R18/R19/R20), owner kept only R12 (PDP ISR, 3,600+ URLs) and R18 (homepage product rail, OWNER approval gated) frozen until Jul 3 — both touch crawl-critical surfaces. R19 (low-risk CSS/token cleanup, no URL/canonical/sitemap/nav) was unfrozen and completed same day (see R19 row below). R20 (re-audit) is now unblocked — only R12/R18 remain frozen until Jul 3. Standing rule regardless of calendar freeze: never touch URL/redirect/sitemap/canonical/nav without explicit request.

| # | Task | Audit ID | Agent | Status |
|---|---|---|---|---|
| R1 | Admin auth: stop returning REVALIDATE_SECRET as admin token; new `ADMIN_API_TOKEN`; drop `?token=`; timing-safe compare | C-01 | [S] | ✅ |
| R5 | Attic `.env.local.backup-20260502-google-restore` (Local+VPS) | L-06 | any | ✅ |
| R4 | Checkout error-message mapping + AbortSignal timeouts in 4 lib fetchers | M-10, M-09 | [S] | ✅ |
| R6 | Product schema availability from `normalizeStockAvailability` (+BackOrder) | H-03 | [S] | ✅ |
| R8 | Drop fabricated `mpn` from Product schema | M-01 | [S] | ✅ |
| R7 | `aggregateRating` in Product JSON-LD when `rating_count > 0` | H-04 | [S] | ✅ (stale finding) |
| R9 | Remove root-layout canonical inheritance (404 canonicals to home today) | M-04 | [S] | ✅ |
| R10 | Trivia batch: safeJsonLd categories page, search alt fallback, best-definitions dates | L-02/04/05/07 | [S] | ✅ |
| R3 | Cloudflare Access for `wp-login.php` + `/wp-admin/*` | H-06 | [O] + recheck | ✅ CLOSED 2026-06-11 (third attempt: two narrow per-path apps, live-verified) |
| R2 | Nginx rate limiting: /api/checkout, /api/admin/auth, /api/newsletter, /api/search | H-05 | [X] prep + [C] apply | ✅ |
| R11 | PDP `s-maxage` via existing Nginx override pattern (stage 1, reversible) | H-01 | [C] | ✅ CLOSED 2026-06-11 (Nginx + Cloudflare respect-origin + purge, live-verified) |
| R13 | Single price formatter (`formatBDT`); delete 3 duplicates | M-05 | [X] | ✅ |
| R16 | GA4 ecommerce events: view_item / add_to_cart / begin_checkout | M-02 | [S] | ✅ |
| R17 | Pixel deferral tradeoff: shorten analytics pixels to ~8s | M-03 | [O] | ✅ |
| R14 | Split 1,558-line `woocommerce.ts` into `lib/woo/*` + type the 29 `any`s (barrel re-export, zero behavior change) | M-08 | [X] | ✅ |
| R15 | Attic atomic-design scaffolding; make pixel IDs env-required (set VPS env FIRST, verify pixels live, then remove fallbacks) | L-01, L-03 | [X] | ✅ |
| R19 | Design-token sweep items 1+2: hex literal dedup (`#9f1239`/`#D4A248` -> `PORCELAIN_COLORS`), `lumiere-*` -> porcelain class rename (16 files) | M-06/M-07 | [C] | ✅ CLOSED 2026-06-11, commit `5dd5bb4`, deployed live |

Schema tasks (R6–R9): content-level = freeze-OK, but read `workspace/SEO_MASTER.md` first, validate live JSON-LD + Rich Results after deploy.
Freeze guard: NO homepage layout / nav / visible structural changes before Jul 3 (R12/R18 are parked in BACKLOG; R19 done).

**R1 — DONE 2026-06-11**: New `ADMIN_API_TOKEN` (Local+VPS `.env.local`) replaces `REVALIDATE_SECRET` as the dispatch dashboard token. New `src/lib/adminAuth.ts` (`isAdminAuthorized`, `timingSafeEqualStr`) used by `/api/admin/orders`, `/api/pathao/order`, `/api/packzy/order` — header-only (`x-admin-token`), `?token=` dropped. `/api/admin/auth` does timing-safe username/password compare and returns `ADMIN_API_TOKEN`. Dispatch page (`src/app/admin/dispatch/page.tsx`) moved token storage from `localStorage`→`sessionStorage` and sends `x-admin-token` header. `/api/revalidate` unchanged (still `REVALIDATE_SECRET`). Live-verified: new token → 200, old `REVALIDATE_SECRET` → 401, `?token=` → 401, no-auth → 401, `/api/revalidate` still 200. Committed `13ad3c1`, deployed via `deploy.sh`, pushed to `origin/main`, VPS aligned.

**R5 — DONE 2026-06-11**: moved `apps/web/.env.local.backup-20260502-google-restore` (Local + VPS) to `/root/.attic-2026-06-11/emart-platform/apps/web/`. File was gitignored, no repo change needed.

**R4 — DONE 2026-06-11**: new `src/lib/checkoutErrors.ts` → `getCheckoutErrorResponse()` maps raw Woo/plugin checkout errors to customer-safe messages (stock/coupon messages pass through, everything else generic by status); `/api/checkout` catch-all now logs full raw details server-side and returns the mapped message. Added `signal: AbortSignal.timeout(8000)` to the bare `fetch()` calls in `wordpress-posts.ts`, `sitemapEntries.ts`, `youtubeRss.ts`, `seo.ts` (all already had try/catch fallbacks). Build clean, `sitemap.xml` 200 live, checkout validation smoke OK. Committed `45736fc`, deployed, pushed, VPS aligned.

**R6+R8 — DONE 2026-06-11**: `src/lib/seo/product.ts` Product JSON-LD `offers.availability` now derived via new `getSchemaAvailability()` helper calling `normalizeStockAvailability()` (same authority as checkout) — InStock / OutOfStock / BackOrder (managed-with-backorders or `stock_status === 'onbackorder'`). Removed fabricated `mpn` (was a copy of internal `EM-` SKU); `sku` retained. Live-verified on 3 PDPs: COSRX essence (instock→InStock, no mpn, sku=EM-93028), Kerasys shampoo (outofstock→OutOfStock), Boom-de-ah-dah ampoule (onbackorder→BackOrder). Committed `41c83f8`, deployed, pushed, VPS aligned.

**R7 — RESOLVED AS STALE 2026-06-11**: audit H-04 claimed `aggregateRating` absent on 3 live PDPs (COSRX essence, Eucerin cream, Kwailnara lotion). Code already gates `aggregateRating` on `parseFloat(average_rating) > 0 && rating_count > 0` since `391afbc` (2026-05-29, predates the audit). Checked live Woo data for all 3 named products: all have `rating_count: 0` — correctly omitted (including aggregateRating with 0 reviews would itself be invalid structured data). No code change needed; closing R7.

**R9+R10 — DONE 2026-06-11**: R9 (M-04) removed `alternates.canonical: SITE_URL` from root layout metadata — pages that don't set their own canonical (only `not-found.tsx`) now emit none, instead of silently inheriting the homepage canonical. Live-verified: home/PDP/category/categories canonicals unchanged (self-referencing), 404 page now has no canonical and `noindex`. R10 trivia: (L-02) `categories/page.tsx` JSON-LD switched from raw `JSON.stringify` to `safeJsonLd`, both `@graph` blocks parse clean live; (L-05) `/api/search` suggestions fall back image `alt` to `product.name` when Woo alt is empty, verified live on CeraVe query; (L-04) `best-definitions.ts` 3x hardcoded `updatedDate: '2026-05-19'` consolidated into single `BEST_GUIDES_LAST_REVIEWED` constant; (L-07) `priceValidUntil` UTC-vs-Dhaka cosmetic drift accepted, no change. Committed `99573b8`, deployed, pushed, VPS aligned.

**R11 — NGINX DONE 2026-06-11, CLOUDFLARE SCOPE OPEN**: added Nginx `location ~ ^/shop/[^/]+/?$` (runtime-only, `/etc/nginx/sites-enabled/emart-nextjs`, backup `emart-nextjs.backup-20260611-pdp-cache`) — same pattern as `/category/[slug]`/`/brands/[slug]`, emits `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` for PDPs (was `private, no-store` from force-dynamic). Origin-verified correct via `127.0.0.1`+Host header; `/shop` listing, old-slug 301s, `/shop/page/N` redirect all unaffected.
- **New finding**: with the Cloudflare cache rule the owner just applied (item #4), live PDPs and category pages show `cf-cache-status: HIT` at `age` 1700-2150s (~28-36min) — both well past the origin's `s-maxage=300, stale-while-revalidate=600` (900s window), and one PDP was still serving the *pre-R11* `private, no-store` header while HIT. This means Cloudflare's edge cache is **ignoring origin Cache-Control** and applying its own (~1hr, consistent with "1hr edge TTL" as configured) to `/shop/*` broadly, including PDPs — exactly the conflict the audit warned about (R11 note). Net effect: PDP price/stock/availability *display* (incl. Product JSON-LD) can be up to ~1hr stale at the edge; checkout still re-validates stock/price server-side, so no overselling risk.
- ~~**Owner decision needed**~~ — ✅ RESOLVED 2026-06-11 (owner + Claude): owner edited the "Shop and Category Pages" cache rule — Edge TTL "Ignore cache-control, 1hr" → **"Use cache-control header if present, bypass cache if not"**, Browser TTL → respect origin, deleted the duplicate copy of the rule, then Purge Everything. Live re-verified after purge: PDPs serve origin `public, s-maxage=300, stale-while-revalidate=600` with MISS→HIT (age 2s), pre-R11 stale `private, no-store` HIT copies gone, `/category/*` MISS→HIT, homepage HIT (3600). **R11 / audit H-01 stage 1 fully closed.** Stage 2 = R12 ISR (post-freeze).

**R16 — DONE 2026-06-11**: added `trackGA4` calls mirroring existing Meta Pixel sites — `view_item` (`ProductViewContentEvent.tsx`, PDP mount), `add_to_cart` (`ProductInfo.tsx` add-to-cart + buy-now, `ProductCard.tsx`), `begin_checkout` (`CheckoutClient.tsx` init effect), each with `currency: 'BDT'`, `value`, `items[]` (new `getGA4ProductItem`/`getGA4ProductValue` helpers in `src/lib/ga4.ts`, `trackGA4` param type widened to `Record<string, unknown>`).
- **Bug found+fixed while verifying**: the GA4 `gtag`/`dataLayer` stub previously only existed inside the `afterInteractive`-deferred `LazyGoogleAnalytics` script, racing against client-effect events fired on mount (e.g. `view_item`) — `window.gtag` could be undefined when the effect ran, silently dropping the event. Moved the stub (tiny inline `dataLayer`/`gtag`/`gtag('config',...)`, no network) to a plain `<script>` in `app/layout.tsx` `<head>`, which executes during initial HTML parse before hydration. The actual `gtag.js` fetch stays deferred 30s/first-interaction (unchanged perf profile).
- Live-verified via fresh Playwright session (no prior interaction): `view_item` queues immediately on PDP load with correct `items[]`/`value`; `add_to_cart` queues on Add-to-Cart click with correct `items[]`/`value`.
- **New finding (not fixed, out of scope)**: `begin_checkout` (and the pre-existing `InitiateCheckout` Meta event it mirrors, per audit instruction) did not fire on `/checkout` in the live test despite a non-empty cart — the effect has `[]` deps and likely runs before the Zustand cart-persist rehydration completes, reading `items.length === 0` and returning early. This affects the EXISTING Meta `InitiateCheckout` too, not just the new GA4 mirror. Cart/checkout code is flagged "never touch without explicit request" — flagging for owner/separate session rather than fixing inline.
- Committed `75c54d7` (GA4 events) + `845f482` + `ba8b1f4` (gtag stub timing fix), deployed via `deploy.sh`, pushed, VPS aligned.

**R13 — DONE 2026-06-11**: consolidated storefront price rendering on `formatBDT` from `src/lib/formatters.ts`; removed the `formatPrice` compatibility export from `woocommerce.ts`, deleted local wrapper usage in `Header.tsx`, and moved cart, checkout, wishlist, PDP, and skin quiz price displays to the shared formatter. Skin quiz still preserves the old `View price` empty-state label. Sample comparison against old Woo/Header/SkinQuiz formatting was byte-identical for representative values. Local build clean.

**R15 — DONE 2026-06-11**: moved empty atomic-design scaffold dirs (`components/atoms`, `molecules`, `organisms`, `templates`) to `/root/.attic-2026-06-11/emart-platform/apps/web/src/components/`. Added `NEXT_PUBLIC_GOOGLE_TAG_ID=G-WMJNX87Q2N` to Local and VPS `.env.local` before removing hardcoded GA4/Meta pixel fallbacks from source; Reddit already had no fallback. Verified Local+VPS env contain GA4/Meta/Reddit public IDs; source tree no longer contains the literal pixel IDs. Local build clean.

**R17 — DONE 2026-06-11**: owner/parallel-agent decision landed before the R13/R15 deploy in `5f4a9f4`: analytics pixel deferral shortened from 30s to 8s for GA4 loader, Meta Pixel, and Reddit Pixel; the cosmetic Google Merchant rating badge stays at 30s. R13/R15 deploy included this commit and live smoke stayed HTTP 200.

**R14 — DONE 2026-06-11**: `src/lib/woocommerce.ts` is now a stable public barrel (`export * from './woo'`). Woo logic was split into `src/lib/woo/{client,types,transformers,products,brands,origins,categories,shipping,orders,reviews,coupons,customers,helpers,index}.ts`; existing app imports stayed on `@/lib/woocommerce`. Added loose raw Woo REST response types and removed remaining `any` usage from `src/lib/woo`; local production build passed.

~~**Current order / closure check — 2026-06-11**~~ — superseded, see "Pre-freeze status" below: R1-R17, R19 all done; R3 closed same day via third Cloudflare Access attempt.

**Owner decisions needed (audit):** none remaining — all resolved 2026-06-11 (R3 third attempt closed, R17 done, Cloudflare cache rule + R11 PDP TTL resolved).

**R2 — DONE 2026-06-11**: applied runtime Nginx rate limiting with Cloudflare real-client-IP restoration. Added `/etc/nginx/conf.d/cloudflare-real-ip.conf` from `workspace/docs/R2-cloudflare-real-ip-nginx.conf`; updated `/etc/nginx/nginx.conf` rate zones to key on real client IP with VPS/localhost exemption for `emart-checkout-monitor`; split `/api/admin/auth`, `/api/newsletter/subscribe`, and `/api/search` into exact Nginx locations with their own buckets, keeping `/api/checkout` separately limited and general APIs on the existing general bucket. Backups: `/etc/nginx/nginx.conf.backup-20260611-r2-rate-limit` and `/root/.attic-2026-06-11/nginx/sites-enabled/emart-nextjs.backup-20260611-r2-rate-limit` (moved out of `sites-enabled` so Nginx does not load it). `nginx -t` passed; `systemctl reload nginx` done; live smoke: home 200, search 200, admin/newsletter/checkout GETs return normal 405, not accidental 429. Direct 429 burst could not be meaningfully tested from the VPS because the VPS public IP is intentionally exempt.

**Pre-freeze status**: every pre-freeze audit item (R1-R17) is now closed as of 2026-06-11. R20 (A+ re-audit) is unblocked and can run anytime; only R12 (PDP ISR) and R18 (homepage product rail, owner approval gated) remain frozen until Jul 3.

---

## 🔵 BACKLOG (post-freeze Jul 3+)

- **R12 (audit H-01 stage 2)** — PDP ISR: remove `force-dynamic` from `shop/[slug]` + `category/[slug]`, rely on `revalidate`+tags; own session + 24h monitoring (still frozen until Jul 3)
- **R18 (audit H-02)** — server-render first homepage product rail (crawlable product links); OWNER approval required; guardrail Lighthouse ≥90 / LCP ≤2.5s (still frozen until Jul 3)
- ~~**R19 (audit M-06/M-07)**~~ — ✅ DONE 2026-06-11, see table above. Items 1+2 (hex dedup + lumiere->porcelain rename) shipped in `5dd5bb4`. Item 3 (Midnight Blossom theme consolidation) intentionally OUT OF SCOPE — `data-theme="midnight-blossom"` + `--mb-*` vars in `src/styles/midnight-blossom.css` is a deliberate distinct secondary theme for `/categories` and ~10 components (ConcernGrid, CustomerWall, FlashDealsRow, CategoryChips, LiveTickerBar, categories/TrustStrip, PopularCategoriesGrid, StockBar, FlashWeekHero, ShopByCategory); document, do not merge into porcelain.
- **R20** — re-audit for A+ grade after R-tasks close

**New finding 2026-06-11 (pre-existing, not caused by R19)**: live `/categories` page throws 8 React console errors (#422 ×4, #425 ×4 — hydration text mismatch -> client-render fallback). Root cause: `src/lib/realtime/flash-context.tsx:56` seeds `secondsRemaining` via `useState(() => diffSeconds(promotion?.ends_at))`, which calls `Date.now()` — SSR time vs client-hydration time differ by a few seconds, so `CountdownTiles.tsx` renders a different digit on server vs client on first paint. Confirmed unrelated to R19 (verified via worktree SSR diff of pre/post-R19 builds — only diffs were this counter and a harmless `#D4A248`->`#d4a248` case change). Fix would need an `isMounted`/skeleton-on-first-render pattern in `CountdownTiles`/`flash-context`; not attempted (out of R19 scope, low priority — Midnight Blossom `/categories` only).

- **R21 — validation polish (found 2026-06-12, low/medium, freeze-safe if kept cosmetic/metadata-only)**:
  - ✅ **DONE 2026-06-12** (`9206e2a`): `Header.tsx` `id="header-search"` split into `header-search-mobile`/`header-search-desktop` (was duplicated by `renderSearchForm('mobile'|'desktop')`); blog `generateMetadata()` now emits `openGraph.images` (post featured image, falls back to logo 600x600); `/faq` metadata adds `openGraph.images` (logo 600x600); blog post `<main>` changed to `<div>` (was nested inside root layout `<main id="main-content">`); contact map iframe dropped invalid `width="100%"` attribute (CSS `w-full` already handles sizing). Build clean, deployed, live-verified on `/faq`, `/blog/*`, `/contact`.
  - ✅ **LOCAL DONE 2026-06-13, awaiting deploy/live smoke**: Android Googlebot SEO/GEO audit frontend batch. Fixed invalid mobile brand text, schema primary phone consistency, delivery wording conflicts, overlong/double-branded titles/descriptions, mid-word meta truncation, child-route OG `siteName`/`locale`/fallback images, `/best` hub Breadcrumb/ItemList JSON-LD, `/concerns` hub Breadcrumb/CollectionPage JSON-LD, and redundant `/origins/bangladesh` title/description wording. Build + `git diff --check` passed. Did not add AggregateRating without real reviews and did not touch Woo product/order/customer data.
  - **OPEN from 2026-06-13 SEO/GEO audit, lower-risk follow-up refs**:
    - `/categories`: add/verify BreadcrumbList + CollectionPage schema for the live categories hub without misrepresenting promo/live widgets as a product collection.
    - `/faq`: add BreadcrumbList JSON-LD.
    - `/shipping-policy`: add BreadcrumbList JSON-LD.
    - PDP long titles: design a scoped title-shortening rule for long product names such as `Kerasys Black Bean Oil Shampoo Anti Hair Loss 1000ml`; do not mutate Woo product names.
    - Site-wide OG sweep: audited key child routes now have `og:site_name`/`og:locale`, but run a full route sweep before calling cross-route OG consistency globally closed.
    - Contact schema/phones: primary schema phone is aligned to support/payment, but visible multiple numbers remain by business rule; only revisit if owner wants a stricter single-phone LocalBusiness policy.
  - **Skill note 2026-06-13**: GitHub `SKILL.md` for `emart-seo-generator` is useful as a content quality bar (intent routing, real category buying guides, no slop/overclaims), but local OpenClaw `emart-seo-generator` is disabled and does not directly fix Next.js frontend route metadata/schema. Do not use it to auto-write Woo product names/descriptions without explicit owner approval.
  - `aria-label="Store announcements"` on generic announcement-marquee `div`s (use `role` or remove label) — not done, low value, still open.
  - **Heading-skip root cause CONFIRMED 2026-06-12**: `h1 → h3` is a **content-data issue, not a template bug**. `DetailsTabs.tsx` injects each product's raw Woo description/how-to-use HTML via `dangerouslySetInnerHTML` unchanged. Live example: `kerasys-propolis-damage-repair-shampoo-1000ml` → `h1` (product title) → `h3 "Key Benefits"` (description content starts with h3, no h2). Other products (e.g. `kerasys-argan-oil-shampoo-damage-repair-1000ml`) have description content starting with `<h2>{title}</h2>` → fine (h1→h2→h3). Fix options: (1) template-level clamp in `DetailsTabs.tsx`/`sanitizeHtml` demoting any h1-h3 in injected product content to h4+ — visual change via `prose` typography across every PDP, needs visual check before shipping; (2) catalog content edit normalizing heading levels per-product — scope (count of affected products) unknown. **Owner scoping decision needed before either is attempted** — not done during freeze.
  - **Do not chase unless needed** Next framework `meta name="next-size-adjust"` W3C warning/error; emitted by Next/font, not an Emart-authored SEO issue.
  - **Verification target**: W3C Nu representative URLs have no Emart-authored errors; Chromium/CDP still shows 0 console messages; raw + rendered JSON-LD remains parse-clean; Lighthouse SEO/accessibility stay 100.

- Blog content at scale: 51 posts vs Shajgoj 5,904
- UCP/MCP commerce endpoint: build when reviews > 200 (currently 5)
- Critical CSS (critters): DEV_MASTER W6
- Origin editorial: UK, France, Bangladesh, others — owner confirms list
- FAQ quality improvement: top 200 products have templated answers (M4)
- getSeoDescription() code: add product.description (first 155 chars) as fallback tier between short_description and generic template — prevents any future product landing on the weak generic fallback
- GCP service account key rotation: fingerprint ce8b30ba

---

## ✅ COMPLETED THIS SESSION (2026-06-05)

- Checkout order creation hardened: Next `/api/checkout` now uses secret-protected WP mu-plugin `/wp-json/emart/v1/create-order`; WC REST key order-create dependency removed from live checkout path; direct plugin smoke + full BFF checkout smoke passed; test order/user cleaned up
- FAQPage JSON-LD on 9 concern pages
- Product schema description decoupled (400-500c when humanized)
- agents.md live at /agents.md (FB: emartbd.official, YT: @emartbd.official)
- Sunscreen category copy (M7) — all missing terms added
- Review form: all logged-in users can submit (aggregateRating unblocked)
- InitiateCheckout Meta Pixel event added — full event set complete
- BHA/salicylic ingredient redirects — fixes GSC position drop
- H2 on /sale, /new-arrivals, /brands (DEV_MASTER L4)
- M6 internal links: niacinamide, hyaluronic-acid, acne-blemish-care, dryness-hydration
- SEO_MASTER M7+M8 closed, W7 scripts archived
- GMC: 53 product descriptions fixed (9 rule-based + 44 LLM) → 127→107 disapproved
- X2 impression-priority humanizer: 10 reviewed products applied; DB verified; ISR revalidated
- Homepage LCP/TBT pass: First Load JS 157→108 kB; final post-removal Lighthouse mobile score 96, LCP 2.2s, TBT 170ms
- Homepage SEO link-hub experiment reverted: visible `Popular skincare paths` block removed in `2e8b45b`; no new visible homepage/design/layout sections during freeze without owner approval
- OWNER-ACTIONS-20260605.md + CODEX-GMC-FIX-20260605.md + gmc-steps3-6-report-20260605.md

---

## 🔑 Key Rules

**WC API Key:** key_id `39` ("Emart BFF Live") in `.env.local`. Never delete without updating .env.local first.
**Freeze:** Structural/nav frozen until 2026-07-03. Content, data, new features, automation: OK.
**Deploy order:** Local build → commit → rsync → VPS build → pm2 restart → smoke test → push.
**Humanizer priority:** Always by GSC impression count, not category order.
**GMC sync:** Always last — after all description fixes verified.
