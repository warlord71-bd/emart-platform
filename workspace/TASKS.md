# Emart Task Board
Last updated: 2026-06-10 (full platform audit B+ → A+ remediation plan added; see 🛠️ section)
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
| GMC sync | ✅ last run Jun 5 | 3,523/3,630 approved |

---

## 🔴 OWNER — Do these (workspace/docs/OWNER-ACTIONS-20260605.md)

1. **MailPoet review email** — WooCommerce trigger → Order Completed → 3-day delay → review email
2. **Meta CAPI test** — COD test order → Events Manager: verify Purchase value > 0 + BDT + InitiateCheckout
3. **GSC URL indexing** — 7 URLs listed in OWNER-ACTIONS doc
4. **Cloudflare cache rule** — /shop + /category, 1hr edge TTL
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
- ⚠️ Live BFF gap: `/api/mobile/cart` and `/api/mobile/payment` 404; current app uses local cart + manual bKash/Nagad TrxID via `/api/checkout`
- ⚠️ ADB gap: `adb` installed on VPS, but no phone visible; local laptop USB device is not exposed to the VPS
- Next: real device COD/bKash/Nagad checkout smoke, then EAS production AAB + Play Store internal testing upload

---

## 🛠️ AUDIT REMEDIATION — B+ → A+ (added 2026-06-10)

Full platform audit done 2026-06-10 (read-only): `workspace/docs/audits/EMART_AUDIT_20260610.md`.
Step-by-step plan with per-task specs, verify lines, and agent prompt template: **`workspace/docs/AUDIT_REMEDIATION_PLAN_20260610.md`** — execute one R-task per session, in this order:

| # | Task | Audit ID | Agent | Status |
|---|---|---|---|---|
| R1 | Admin auth: stop returning REVALIDATE_SECRET as admin token; new `ADMIN_API_TOKEN`; drop `?token=`; timing-safe compare | C-01 | [S] | ✅ |
| R5 | Attic `.env.local.backup-20260502-google-restore` (Local+VPS) | L-06 | any | ⬜ |
| R4 | Checkout error-message mapping + AbortSignal timeouts in 4 lib fetchers | M-10, M-09 | [S] | ⬜ |
| R6 | Product schema availability from `normalizeStockAvailability` (+BackOrder) | H-03 | [S] | ⬜ |
| R8 | Drop fabricated `mpn` from Product schema | M-01 | [S] | ⬜ |
| R7 | `aggregateRating` in Product JSON-LD when `rating_count > 0` | H-04 | [S] | ⬜ |
| R9 | Remove root-layout canonical inheritance (404 canonicals to home today) | M-04 | [S] | ⬜ |
| R10 | Trivia batch: safeJsonLd categories page, search alt fallback, best-definitions dates | L-02/04/05/07 | [S] | ⬜ |
| R2 | Nginx rate limiting: /api/checkout, /api/admin/auth, /api/newsletter, /api/search | H-05 | [X] prep + [C] apply | ⬜ |
| R11 | PDP `s-maxage` via existing Nginx override pattern (stage 1, reversible) | H-01 | [C] | ⬜ |
| R13 | Single price formatter (`formatBDT`); delete 3 duplicates | M-05 | [X] | ⬜ |
| R16 | GA4 ecommerce events: view_item / add_to_cart / begin_checkout | M-02 | [S] | ⬜ |
| R14 | Split 1,558-line `woocommerce.ts` into `lib/woo/*` + type the 29 `any`s (barrel re-export, zero behavior change) | M-08 | [X] | ⬜ |
| R15 | Attic atomic-design scaffolding; make pixel IDs env-required (set VPS env FIRST, verify pixels live, then remove fallbacks) | L-01, L-03 | [X] | ⬜ |

Schema tasks (R6–R9): content-level = freeze-OK, but read `workspace/SEO_MASTER.md` first, validate live JSON-LD + Rich Results after deploy.
Freeze guard: NO homepage layout / nav / visible structural changes before Jul 3 (R12/R18/R19 are parked in BACKLOG).

**R1 — DONE 2026-06-11**: New `ADMIN_API_TOKEN` (Local+VPS `.env.local`) replaces `REVALIDATE_SECRET` as the dispatch dashboard token. New `src/lib/adminAuth.ts` (`isAdminAuthorized`, `timingSafeEqualStr`) used by `/api/admin/orders`, `/api/pathao/order`, `/api/packzy/order` — header-only (`x-admin-token`), `?token=` dropped. `/api/admin/auth` does timing-safe username/password compare and returns `ADMIN_API_TOKEN`. Dispatch page (`src/app/admin/dispatch/page.tsx`) moved token storage from `localStorage`→`sessionStorage` and sends `x-admin-token` header. `/api/revalidate` unchanged (still `REVALIDATE_SECRET`). Live-verified: new token → 200, old `REVALIDATE_SECRET` → 401, `?token=` → 401, no-auth → 401, `/api/revalidate` still 200. Committed `13ad3c1`, deployed via `deploy.sh`, pushed to `origin/main`, VPS aligned.

**Owner decisions needed (audit):**
- **R3 / H-06** — `wp-login.php` returns 200 publicly: Cloudflare Access / IP allowlist / accept risk?
- **R17 / M-03** — pixels deferred 30s → sub-30s bouncers never tracked: keep, or shorten to ~8s?
- Cloudflare cache rule (existing owner item #4) is now also the unlock for R11 PDP edge caching.

---

## 🔵 BACKLOG (post-freeze Jul 3+)

- **R12 (audit H-01 stage 2)** — PDP ISR: remove `force-dynamic` from `shop/[slug]` + `category/[slug]`, rely on `revalidate`+tags; own session + 24h monitoring
- **R18 (audit H-02)** — server-render first homepage product rail (crawlable product links); OWNER approval required; guardrail Lighthouse ≥90 / LCP ≤2.5s
- **R19 (audit M-06/M-07)** — design-token sweep (33× `#9f1239`, 26× `#D4A248`, legacy `#1a1a2e`) + consolidate porcelain/lumiere/midnight-blossom themes (20 files)
- **R20** — re-audit for A+ grade after R-tasks close

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
