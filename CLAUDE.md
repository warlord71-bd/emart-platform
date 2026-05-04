# E-Mart Agent Instructions

## 0. Critical Operating Contract for AI Agents

This file is written for Codex, Claude, GPT-style agents, and human developers. Follow it as project policy.

**CURRENT RECONCILIATION STATE (2026-05-04):**
- A prior branch/log mismatch left live VPS source changes as an uncommitted `/var/www/emart-platform` working tree while `origin/main` pointed at a stale docs tip.
- Recovery refs were created locally before reconciliation: `recovery-live-work-20260503` for the orphaned live-work chain and `recovery-origin-doc-tip-20260504` for the stale origin docs tip.
- Local reconciliation commit: `chore: reconcile live VPS source state` (check `git log -1` for the current hash).
- The safe repair path is VPS -> Local first, Local build, Local commit, live smoke, then push. Do not overwrite the live tree to match old Git history.
- After the reconciliation commit is pushed, verify Local, VPS working tree, and origin all represent the same source before new deploy work.
- Evening audit note: if Local, VPS, and origin differ again, stop cleanup/deploy work and reconcile first. Treat dirty VPS files as live-source risk until proven otherwise.

**LIVE SITE PROTECTION — READ FIRST:**
- **Never damage the live site** `https://e-mart.com.bd` served from `/var/www/emart-platform/apps/web`.
- **Site first, code second** — verify live state before any deploy/restart.
- **No blind changes** — always check VPS working tree before syncing.
- **No `git reset --hard` on VPS** without verifying live source state and receiving explicit approval.
- **No `git add -A` on VPS** without reviewing staged list and `.gitignore`.

Before editing anything related to SEO, metadata, sitemap, schema, brand pages, category pages, product pages, navigation, public copy, crawl/index behavior, or route redirects:

1. Read this file.
2. Read `workspace/SEO_TODO.md`.
3. Read `workspace/BRAND_GUIDE.md` if present.
4. Preserve the headless architecture described below.

## 1. Brand Invariants

Official short brand name:

- Emart

Official full brand name:

- Emart Skincare Bangladesh

Approved tagline:

- Global Beauty. Local Trust.

Do not introduce inconsistent variants such as:

- E-Mart BD
- EMart BD
- E-Mart
- Emart BD

## 2. Headless SEO Architecture Invariants

E-mart.com.bd is a headless commerce system.

- Public SEO surface: Next.js frontend only.
- Frontend app: `apps/web`.
- Backend/source: WooCommerce + WordPress private data source only.
- Product/order/content data may come from WooCommerce/WordPress APIs.
- Public SEO decisions must be implemented in Next.js, not WordPress theme templates.

Mandatory SEO rules:

- Do not expose backend/Woo/WordPress URLs as SEO-facing public pages.
- Do not canonical frontend pages to backend URLs.
- Do not use WordPress theme SEO or Rank Math as the primary public SEO system.
- Product, category, brand, sitemap, canonical, metadata and schema work must be implemented from the Next.js frontend.
- Use the Next.js Metadata API and `generateMetadata` for dynamic product, category and brand pages.
- Sitemap must be dynamic/current-data based and must not rely on stale static slug lists.
- Canonical, sitemap, Open Graph and JSON-LD URLs must be absolute and based on `NEXT_PUBLIC_SITE_URL=https://e-mart.com.bd`.

## 3. Data and SEO Safety Invariants

Do not touch the following unless the user explicitly asks:

- checkout logic
- cart logic
- payment logic
- order logic
- customer data
- stock logic
- price logic
- WooCommerce database mutations
- destructive backend changes

For product/category/brand SEO pages:

- Missing product from API -> return `notFound()`.
- Confirmed empty brand/category -> return `notFound()` or set `noindex, follow`.
- Temporary API error -> do not publish a thin empty indexable page.
- Out-of-stock product remains indexable, but Product JSON-LD availability must be `https://schema.org/OutOfStock`.
- In-stock product JSON-LD availability must be `https://schema.org/InStock`.

## 4. Legacy Route and Header Rules

Legacy Woo/WordPress-style routes must not compete with clean Next.js routes.

Audit and handle patterns such as:

- `/product-category/*`
- `/tag/*`
- query duplicates such as `add-to-cart`, `orderby`, `per_page`, `shop_view`, `srsltid`

Useful legacy routes should 301 redirect to matching clean frontend routes. Thin/duplicate routes should be noindexed or redirected to a relevant frontend route.

Header hygiene:

- Public frontend HTML pages should not expose WordPress discovery or backend technology headers.
- If Next.js proxies Woo/WordPress responses, avoid forwarding backend-specific public headers to frontend HTML.
- Do not blindly strip headers from required internal API calls.
- Do not break Woo/API/cart/checkout/payment/order/auth/webhook flows.

## 5. Token Efficiency Protocol for AI Agents

Use tokens like an engineer, not like a crawler.

Default workflow:

1. Read `CLAUDE.md`, then only the relevant sections of `workspace/SEO_TODO.md` and `workspace/BRAND_GUIDE.md`.
2. Start from the latest confirmed gaps in `workspace/SEO_TODO.md` before doing a broad audit.
3. Search targeted symbols, routes, and files first; avoid whole-repo dumps.
4. Prefer `rg`/code search for exact terms such as `canonical`, `generateMetadata`, `sitemap`, `per_page`, `shop_view`, `brand`, `robots`, `notFound`, `middleware`, `NEXT_PUBLIC_SITE_URL`.
5. Open only the files needed for the current task.
6. Summarize findings in short bullet points before editing.
7. Make small, isolated edits that match the confirmed gap.
8. Do not rewrite working systems to satisfy a checklist.
9. Do not repeat long policy text in final answers; cite the file and summarize what changed.
10. If a task is already implemented correctly, mark it as `already compliant` and do not modify it.

High-signal search targets for SEO work:

- `apps/web/app/sitemap.ts`
- `apps/web/app/robots.ts`
- `apps/web/middleware.ts`
- `apps/web/next.config.*`
- dynamic product route under `apps/web/app/shop/`
- dynamic category route under `apps/web/app/category/`
- dynamic brand route under `apps/web/app/brands/`
- shared SEO utilities under `apps/web/lib/`, `apps/web/utils/`, or `apps/web/components/`

Output discipline:

- Report only files changed, tests run, and unresolved risks.
- Keep reports concise but complete.
- Avoid speculative rewrites, visual redesigns, or backend changes unless explicitly requested.
- Ask for approval before broad UI/UX changes or any backend/database mutation.

## 6. OpenClaw VPS Capability Clause

OpenClaw already exists inside the VPS setup and can help with Emart platform inspection, testing, reporting, and safe automation. Treat OpenClaw as a VPS-side assistant capability, not as a replacement for the source-of-truth and deployment rules in this file.

Where we are now:

- Claude/Codex/GPT/Gemini/OpenRouter models are used for reasoning, planning, code review, and implementation guidance.
- OpenClaw is useful when the task needs VPS-side visibility, repeatable checks, process/log inspection, or automation around the live environment.
- OpenClaw must not bypass Git, build, smoke test, approval, or deployment order.

Best OpenClaw use cases for Emart:

- VPS health/status checks before and after deployment.
- PM2/process inspection for `emartweb`.
- Smoke-test helpers after build/restart.
- Log summarization for Next.js, Woo/API, newsletter, webhook, Telegram, or cron issues.
- SEO verification helpers for sitemap, robots, canonical, redirects, status codes, and public headers.
- Dynamic sitemap verification against current Woo/API data.
- Report generation for Codex/Claude tasks.
- Safe read-only audits of live runtime state before code changes.
- Reusable project automation that reports findings before changing files.

Before using OpenClaw:

1. Verify its current installation, service/process state, config path, and project integration points on the VPS.
2. Check existing logs/docs before changing OpenClaw behavior.
3. Confirm whether OpenClaw is already polling or running long-lived services.
4. Do not start a second polling service on the same Telegram bot token or duplicate an existing OpenClaw worker.
5. Do not expose secrets, bot tokens, API keys, WooCommerce keys, or `.env.local` values.
6. Do not let OpenClaw mutate checkout, cart, payment, order, customer, stock, price, or database logic without explicit approval.

OpenClaw safety rules:

- Prefer read-only inspection first.
- Prefer small explicit commands over broad automation.
- Log what OpenClaw checked or changed.
- If OpenClaw output conflicts with this repo, verify against the live VPS source of truth before editing.
- Use OpenClaw to assist testing and reporting, not to bypass review, build, smoke test, or deployment order.

## 7. Required Agent Execution Order for SEO Work

When implementing SEO work, follow this order:

1. Read `workspace/SEO_TODO.md`.
2. Audit current code paths and data flow before changing files.
3. Implement Job 3 Technical Integrity first.
4. Then implement Job 1 Next.js SEO Core.
5. Then implement Job 2 Data Quality + Navigation.
6. Generate requested reports from `workspace/SEO_TODO.md`.
7. Build/test.
8. Follow the deployment order below.

## 8. Current Layout

- Local working tree: `/root/emart-platform`
- Live runtime tree: `/var/www/emart-platform`
- Web app: `apps/web`
- Live process: `pm2` process `emartweb`
- Canonical repo: GitHub remote `origin`, branch `main`
- Current rule: Local -> VPS -> Repo, with Repo push last after live smoke test

## 9. Source Of Truth

- The running site is served from `/var/www/emart-platform/apps/web`.
- Do not restore old files from GitHub or Local over VPS without comparing first.
- Keep the current live UI/UX unless the user explicitly asks to change it.
- Before any deploy/restart, confirm the VPS tree is the intended source.

## 10. Required Deploy Order

This project follows the universal VPS deployment law in `/root/CLAUDE.md`. Read that file first when working on the VPS.

**CRITICAL: LIVE SITE NEVER BREAKS — VERIFY FIRST, THEN PUBLISH**

Use the verify-then-publish order:

1. Edit on Local (`/root/emart-platform`).
2. Build/test on Local (`npm run build`).
3. Commit on Local (`git commit`).
4. Sync Local -> VPS (`rsync` or reviewed equivalent).
5. Build on VPS (`cd /var/www/emart-platform/apps/web && npm run build`).
6. Restart `emartweb` only after source state is verified.
7. Smoke test the live site.
8. Push `origin main` only after live verification passes.

If a hotfix is made directly on VPS:
- Reverse-sync VPS -> Local before committing.
- Never commit from VPS directly; VPS is runtime, not the commit workspace.
- Always verify the VPS working tree before changing its Git metadata.

## 11. E-Mart Project Facts

- Bangladesh eCommerce site for authentic K-beauty, J-beauty, and international beauty products.
- Frontend: Next.js 14+, TypeScript, Tailwind CSS.
- Backend/content source: WooCommerce + WordPress MU plugins.
- Currency: BDT with the `৳` symbol.
- Payments: Cash on Delivery, bKash, Nagad.
- Main audience: mobile-first Bangladesh shoppers.

## 12. Business Growth And Data Scope

Primary business goal:

- Win qualified Bangladesh skincare traffic, convert mobile shoppers, and keep product data trusted across web, app, Google Search, Merchant Center, and social catalogs.
- No LLM may promise Google position 1-2. Work toward it through technical SEO, product data accuracy, Core Web Vitals, useful content, internal links, clean schema, Merchant Center quality, reviews, and authority building.

Frontend vs backend data rule:

- WooCommerce/WordPress is the source of truth for product facts: name, slug, price, sale price, stock, image, brand, category, origin, concerns, descriptions, reviews, and order/customer state.
- Next.js is the public SEO/rendering surface. Generate metadata, canonicals, sitemap, JSON-LD, product pages, category pages, and brand pages from current Woo/API data.
- Do not maintain duplicate product facts in frontend files except small curated mappings, display labels, route aliases, and design configuration. If Woo product data is wrong, fix Woo data through dry-run/report/apply, not by hiding the error in React.
- Mobile app must use the same approved data contract as web. Prefer secure Next.js API/BFF routes over direct Woo REST credentials in the app bundle.

Business workstreams, in priority order:

1. Data accuracy: finish brand/category/concern/origin/image/price audits with dry-run CSVs and reviewed batches before mutation.
2. SEO growth: close technical gaps in `workspace/SEO_TODO.md`, then build category, brand, concern, ingredient, routine, and comparison content from real catalog data.
3. Competitor intelligence: use OpenClaw/read-only scripts for public competitor page checks, keyword gaps, product assortment gaps, price comparison, schema/header checks, and report generation. Do not scrape private data or auto-change prices.
4. Product update loop: schedule regular product/price/image checks; output diff reports first; only apply Woo changes after owner review.
5. Mobile app release: before Google Play production, verify production signing, versionCode, target API, privacy policy, Data safety, content rating, store listing assets, account/delete-data requirements, checkout/auth parity, crash-free testing, and staged rollout.

Current mobile app notes:

- `apps/mobile` is Expo/React Native and targets Android API 35 through Expo config/Gradle properties.
- Production release must not be signed with the debug keystore. Check Play Console artifact/signing status before promoting from testing.
- Direct Woo consumer keys must never ship in the app. If the app needs catalog/order access, route through secure backend APIs.

External policy references checked 2026-05-04:

- Google Search Central SEO Starter Guide: `https://developers.google.com/search/docs/fundamentals/seo-starter-guide`
- Google product structured data: `https://developers.google.com/search/docs/appearance/structured-data/product`
- Google merchant listing structured data: `https://developers.google.com/search/docs/appearance/structured-data/merchant-listing`
- Play testing tracks: `https://support.google.com/googleplay/android-developer/answer/9845334`
- Play target API requirements: `https://support.google.com/googleplay/android-developer/answer/11926878`

## 13. Cleanup And Archive Policy

Goal: keep Git, Local, and VPS lean without losing recoverability.

Current observed clutter areas from 2026-05-04 audit:

- Local tree is about 1.7G.
- Biggest areas: `apps/web` about 961M, `apps/mobile` about 373M, `workspace/audit` about 218M.
- Most bulk is ignored runtime/generated data such as `node_modules`, `.next`, audit CSV/OCR folders, screenshots, snapshots, and local session files.

Cleanup rules:

- Never delete first. Move or compress old Emart-only artifacts to `/root/.attic-YYYY-MM-DD/emart-platform/` unless the user explicitly approves permanent deletion.
- Keep active source and live operating docs in place: `CLAUDE.md`, `AGENTS.md`, `apps/web/src`, `apps/mobile/src`, active scripts, `.agent-memory`, `TASKS.md`, `SESSION-LOG.md`, and active correction CSVs.
- Do not put generated audit folders, screenshots, `.next`, `node_modules`, local env files, exports, backup archives, OCR outputs, or Play build outputs into Git.
- For large completed audits, keep one summary/report in `workspace/audit/...` and move/compress raw bulk outputs into the attic.
- Before cleanup, run a read-only inventory: `git status --short --ignored`, `git ls-files`, `du -h -d 2`, and a largest-file scan. Present a move/compress plan before touching files.
- After cleanup, verify: active CSV shortcuts still open, local build still passes if source was touched, VPS source state is unchanged unless sync was explicitly part of the task.

## 14. UI/UX Direction

- Keep the current live design unless the user explicitly requests a redesign.
- Prioritize mobile shopping speed: readable product cards, sticky cart actions, quick search, usable filters, clear price/stock/trust signals, and low layout shift.
- Avoid decorative UI changes that slow catalog browsing or push Add to Cart/Buy Now lower on mobile.
- Good future improvements: search suggestions, compare-price badges after verified data exists, product routine bundles, clearer app deep links, review/photo proof, and trust/payment/delivery clarity near purchase actions.

## 15. Live Business Rules

- Footer `SignupTabs` is the canonical WhatsApp + email signup block.
- Newsletter path: Next `/api/newsletter/subscribe` -> WordPress `/wp-json/emart/v1/subscribe` -> MailPoet.
- Sales/signup WhatsApp: `8801717082135`.
- Support/payment WhatsApp/phone may use `8801919797399`; do not merge the numbers unless the user says so.
- MailPoet is the live transactional sender path. Do not reinstall or switch SMTP unless asked.
- Telegram command helper exists, but do not enable a second polling service on the same bot token while OpenClaw is polling.
- OpenClaw is part of the VPS-side project tooling. Use it carefully for inspection, testing, reporting, and safe automation when useful.

## 16. General Safety Rules

- Never commit secrets. Keep `.env.local` local to the VPS/runtime.
- Never run blind `git add -A` on a dirty runtime tree unless `.gitignore` is checked and the staged list is reviewed.
- Never force-push without explicit user approval.
- Never use `git reset --hard`, branch checkout, or rollback on VPS unless the target commit is verified first.
- Never restart `emartweb` from unknown source state.
- For cleanup, move files to `/root/.attic-YYYY-MM-DD/` instead of deleting unless the user explicitly asks for permanent deletion.

## 17. Useful Current Memory

- Universal deploy instructions: `/root/CLAUDE.md` and `/root/AGENTS.md`.
- E-Mart session log: `/var/www/emart-platform/apps/web/SESSION-LOG.md`.
- E-Mart task/source notes, when present: `/var/www/emart-platform/apps/web/TASKS.md`, `MEMORY.md`, and `LIVE-SOURCE-OF-TRUTH.md`.
- Cleanup restore point from 2026-04-26: `/root/.attic-2026-04-26/`.

## 18. What Not To Trust

- Old project agent files mentioning `AGENTS.coding.md`, `AGENTS.design.md`, or `AGENTS.seo.md`; those were retired to reduce complexity.
- Old docs that say to push before live verification.
- Old rollback snippets that use `git reset --hard` without checking the live source state first.
- Assuming VPS equals clean Git state; VPS is runtime/live, not a clean commit workspace.
- Blind `git add -A` on VPS.
