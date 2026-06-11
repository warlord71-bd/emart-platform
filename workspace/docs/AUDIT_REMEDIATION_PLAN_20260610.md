# Audit Remediation Plan — B+ → A+ (2026-06-10)

Source audit: `workspace/docs/audits/EMART_AUDIT_20260610.md` (full findings, file paths, evidence).
Executors: **[S]** Sonnet 4.6 · **[X]** Codex 5.5 · **[C]** Claude · **[O]** Owner decision required.
Freeze rule (until 2026-07-03): structural/nav/visible-layout frozen. Content, data, schema correctness, backend, security, automation: **OK now**.

## Definition of A+
All Critical + High findings closed and live-verified; Mediums closed or explicitly owner-accepted (logged in TASKS.md); re-audit confirms no regressions in the audit's "Verified-Good" list.

## Working rules for every task below (all agents)
1. Session start: `cat CLAUDE.md` → `apps/web/.agent-memory/MEMORY.md` → this plan → the audit finding by ID.
2. One task ID per session. Read `workspace/SEO_MASTER.md` before ANY schema/metadata/canonical change.
3. Deploy only via `/root/emart-platform/deploy.sh` (Local build → commit → rsync → VPS build → pm2 restart → smoke → push). Never push before live smoke passes.
4. Acceptance check is part of the task — a task is not done until its "Verify" line passes live.
5. End: update TASKS.md status + one SESSION-LOG.md block. Remember Local↔VPS doc-sync rule (TASKS/SEO_MASTER/SESSION-LOG are not symlinked — diff+sync before commit).
6. Data-safety list still applies: no touching checkout/cart/payment/order/stock/price logic beyond exactly what the task states.

---

## SPRINT 1 — Security hardening (freeze-safe, do first)

### R1 [S] — C-01: Admin auth token redesign
- Files: `apps/web/src/app/api/admin/auth/route.ts`, `apps/web/src/app/api/admin/orders/route.ts`, admin client (`src/app/admin/*`).
- Do: (a) introduce `ADMIN_API_TOKEN` env var (new random value, Local + VPS `.env.local`) — stop returning `REVALIDATE_SECRET`; (b) constant-time compare via `crypto.timingSafeEqual`; (c) remove `?token=` query-param acceptance from admin orders (header only); (d) trace where the admin client stores the token — if localStorage, move to sessionStorage at minimum.
- Verify: login works with new token; old `REVALIDATE_SECRET` no longer authorizes `/api/admin/orders`; `?token=` rejected (401).
- Note: `/api/revalidate` keeps using `REVALIDATE_SECRET` unchanged — do not break the bulk-sync revalidation flow.

### R2 [X] — H-05: Rate limiting on public APIs
- Files: `/etc/nginx` site config (runtime — owner/Claude applies; Codex prepares exact diff), optionally `apps/web/src/middleware.ts` fallback.
- Do: Nginx `limit_req_zone` (per-IP) for `/api/checkout` (e.g. 5r/m burst 5), `/api/admin/auth` (3r/m), `/api/newsletter/subscribe` (5r/m), `/api/search` (60r/m). Deliver as a reviewed config snippet + test plan first; apply during low-traffic window; `nginx -t` before reload.
- Verify: burst curl returns 429 after threshold; normal checkout smoke still passes (run `emart-checkout-monitor` steps).
- Risk: too-tight limits can block real customers behind CGNAT — start generous, log, tighten later.
- ⚠️ PREREQS (board conflicts): (a) Site is behind Cloudflare — Nginx must restore real client IPs first (`set_real_ip_from` Cloudflare ranges + `real_ip_header CF-Connecting-IP`, currently NOT configured) or per-IP limits will throttle Cloudflare edge IPs = mass false 429s for everyone. (b) `emart-checkout-monitor` (PM2, every 15 min) hits `https://e-mart.com.bd` checkout endpoints — allowlist the VPS's own IP or the monitor will trip limits and fire false alarms.

### R3 [O] — H-06: wp-login.php exposure
- Decision: Cloudflare Access / IP allowlist / leave-as-is (fail2ban?). Owner picks; agent implements at Nginx or Cloudflare only after decision. Must not lock owner out of wp-admin.

### R4 [S] — M-10 + M-09: Error hygiene + fetch timeouts (one session)
- Files: `apps/web/src/app/api/checkout/route.ts` (map raw Woo/plugin error messages to friendly client messages, log details server-side only); add `signal: AbortSignal.timeout(8000)` to bare fetches in `src/lib/wordpress-posts.ts`, `sitemapEntries.ts`, `youtubeRss.ts`, `seo.ts`.
- Verify: build passes; live checkout smoke OK; sitemap.xml still renders.

### R5 [trivial, any agent] — L-06: move `apps/web/.env.local.backup-20260502-google-restore` to `/root/.attic-2026-06-10/` (attic move, never delete). VPS copy too if present.

---

## SPRINT 2 — Schema & data correctness (content-level SEO = freeze-OK; read SEO_MASTER.md first)

### R6 [S] — H-03: Schema availability from real stock logic
- File: `apps/web/src/lib/seo/product.ts` (availability ternary at ~L87).
- Do: derive from `normalizeStockAvailability()` (`src/lib/stock.ts`): available→`InStock`; `onbackorder`→`schema.org/BackOrder`; else `OutOfStock`. No changes to stock.ts itself (checkout shares it).
- Verify: live JSON-LD on one in-stock, one out-of-stock PDP; Rich Results Test passes.

### R7 [S] — H-04: aggregateRating in Product schema
- Files: `apps/web/src/lib/seo/product.ts` + PDP data flow (`average_rating`/`rating_count` already on WooProduct).
- Do: emit `aggregateRating` (+ top reviews if cheap) only when `rating_count > 0`. Catalog has ~5 reviews today, so visible impact is small but the gate must work the day reviews grow (review form already open to all logged-in users).
- Verify: a rated product shows aggregateRating in live JSON-LD; an unrated product shows none; Rich Results Test passes.

### R8 [S] — M-01: Drop fabricated MPN
- File: `apps/web/src/lib/seo/product.ts`. Remove `mpn` (it duplicates internal `EM-` SKU); keep `sku`. Add GTIN only if/when a real barcode field exists in Woo (separate owner data task — do not invent).
- Verify: live PDP JSON-LD has no `mpn`; GMC feed unaffected (feed comes from GLA plugin, not frontend schema).

### R9 [S] — M-04: Remove homepage canonical inheritance
- File: `apps/web/src/app/layout.tsx` (~L67 `alternates.canonical`). Remove from root layout; confirm homepage `page.tsx` sets its own canonical explicitly; spot-check 5 page types live for unchanged canonicals; confirm 404 page emits no canonical.
- Verify: `curl -s <bogus-url> | grep canonical` → none; home/category/PDP canonicals identical to before.

### R10 [trivial] — L-02: `safeJsonLd` in `src/app/categories/page.tsx:92`; L-05: alt fallback (`alt || product.name`) in `/api/search` suggestions; L-04: refresh or derive `updatedDate` in `best-definitions.ts`; L-07: accept as cosmetic (log as accepted). Batch into one session.

---

## SPRINT 3 — PDP caching (two stages)

### R11 [C] — H-01 stage 1 (freeze-safe, reversible): Nginx s-maxage for PDPs
- The runtime Nginx override pattern already exists for `/shop` and `/category/{slug}` (see memory `project_catalog_cache_headers`). Extend the same override to `/shop/{slug}` PDPs with a short TTL (e.g. `s-maxage=300, stale-while-revalidate=600`).
- Why short TTL: prices/stock change; `/api/revalidate` tag purge does NOT purge Cloudflare — accept up to 5 min staleness (same tradeoff already accepted for category pages).
- Verify: `curl -sI` PDP shows public s-maxage; second hit `cf-cache-status: HIT` (needs the owner's Cloudflare cache rule — OWNER item #4 in TASKS.md, now higher value); checkout still validates live stock server-side (it does — audit Verified-Good), so stale HTML cannot oversell.
- ⚠️ TTL conflict with OWNER item #4: that item says "1hr edge TTL for /shop + /category" — written for listing pages. A blanket 1hr on `/shop/*` would serve PDP prices/stock up to 1hr stale. The Cloudflare rule must be "respect existing origin Cache-Control headers" (origin sends 3600 for listings, 300 for PDPs), NOT a forced 1hr TTL.

### R12 [C] — H-01 stage 2 (post-freeze Jul 3+): ISR for PDPs
- File: `apps/web/src/app/shop/[slug]/page.tsx` — remove `force-dynamic` (the `revalidate = 3600` beneath it is currently dead code and becomes live). Requires: confirm every bulk-sync path calls `revalidateTag('products')` (rule already in memory), then load-test a cold build. Same change considered for `category/[slug]`.
- This changes the rendering pipeline for 3,600+ URLs → schedule its own session + 24h monitoring; rollback = restore force-dynamic, redeploy.

---

## SPRINT 4 — Code quality (Codex-friendly, freeze-safe refactors)

### R13 [X] — M-05: One price formatter
- Consolidate on `formatBDT` (`src/lib/formatters.ts`); delete/redirect `formatPrice` in `woocommerce.ts:1545`, local copies in `SkinQuizClient.tsx:157` and `Header.tsx:83`. Output must be byte-identical (write a quick comparison script for sample values before deleting).
- Verify: build + grep shows single implementation; PDP/cart/header prices render identically.

### R14 [X] — M-08: Split `woocommerce.ts` (multi-session, mechanical)
- 1,558 lines → `lib/woo/products.ts`, `categories.ts`, `orders.ts`, `reviews.ts`, `client.ts` (shared axios instances). Keep `lib/woocommerce.ts` as a re-export barrel so zero import sites change. Type the 29 `any`s against WooCommerce REST v3 response shapes while moving. No behavior changes.
- Verify: `npm run build` + type-check clean; live smoke after deploy.

### R15 [X] — L-01: Attic the empty `components/{atoms,molecules,organisms,templates}` dirs. L-03: make GA4/Meta/Reddit IDs env-required — FIRST set `NEXT_PUBLIC_GOOGLE_TAG_ID` + `NEXT_PUBLIC_META_PIXEL_ID` in Local AND VPS `.env.local`, deploy, verify pixels still fire live (Playwright network check, pattern from Reddit pixel task C6), THEN remove the hardcoded fallbacks.

---

## SPRINT 5 — Analytics completeness

### R16 [S] — M-02: GA4 ecommerce funnel
- Mirror existing Meta event call sites with `trackGA4`: `view_item` (ProductViewContentEvent), `add_to_cart` (ProductInfo.tsx:226/238, ProductCard.tsx:95), `begin_checkout` (CheckoutClient.tsx:87) using GA4 standard ecommerce params (currency `BDT`, value, items[]).
- Verify: GA4 DebugView shows all four events on a live walk-through.

### R17 [O] — M-03: Pixel deferral tradeoff
- Current: all pixels wait 30s or first interaction → sub-30s bouncers untracked. Owner decides: keep (perf-first), or shorten timer to ~8s. One-line change in `runtime-widgets.tsx` after decision; re-run Lighthouse mobile to confirm score stays ≥90.

---

## POST-FREEZE (Jul 3+) — structural items

### R18 [O→S] — H-02: Server-render the first homepage product rail
- Needs owner approval (homepage layout is explicitly protected). Proposal: render rail #1 (Flash Sale or Featured) server-side as plain crawlable links + images, keep remaining rails deferred. Guardrail: Lighthouse mobile ≥90, LCP ≤2.5s, First Load JS ≤120kB after change, else revert.

### R19 [X] — M-06/M-07: Design token + theme consolidation
- Sweep 33× `#9f1239`→`accent`, 26× `#D4A248`→`brass`; retire `--color-brand-dark: #1a1a2e`; then map which surface owns `porcelain` vs `lumiere-*` vs `midnight-blossom` (20 files) and consolidate. Mobile-first review per owner preference; screenshot-diff key pages before/after.

### R20 [C] — Re-audit
- Re-run the audit checklist (read-only) against all closed IDs + Verified-Good list. Target: A+. Write `workspace/docs/audits/EMART_AUDIT_<date>.md` v2.

---

## Suggested order & rough sizing
| Order | Task | Agent | Size |
|---|---|---|---|
| 1 | R1 admin auth | Sonnet | 1 session |
| 2 | R5 env backup attic | any | minutes |
| 3 | R4 timeouts/errors | Sonnet | 1 session |
| 4 | R6+R8 schema availability+mpn | Sonnet | 1 session |
| 5 | R7 aggregateRating | Sonnet | 1 session |
| 6 | R9+R10 canonical + trivia | Sonnet | 1 session |
| 7 | R2 rate limiting | Codex prep + Claude apply | 1–2 sessions |
| 8 | R11 PDP s-maxage | Claude | 1 session |
| 9 | R13 formatter | Codex | 1 session |
| 10 | R16 GA4 events | Sonnet | 1 session |
| 11 | R14 woo split | Codex | 2–3 sessions |
| 12 | R15 scaffolding+env | Codex | 1 session |
| 13 | R3/R17 owner decisions | Owner | — |
| Jul 3+ | R12, R18, R19, R20 | mixed | 4–6 sessions |

## Per-session agent prompt template (paste to Sonnet/Codex)
```
Read /root/emart-platform/CLAUDE.md, apps/web/.agent-memory/MEMORY.md, and
workspace/docs/AUDIT_REMEDIATION_PLAN_20260610.md. Execute task R<N> only,
exactly as specified, including its Verify line. Full finding details are in
workspace/docs/audits/EMART_AUDIT_20260610.md under ID <audit-id>.
Deploy via deploy.sh, never push before live smoke passes. When done, update
workspace/TASKS.md (R<N> status) and append a SESSION-LOG.md block.
```
