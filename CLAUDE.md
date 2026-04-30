# E-Mart Agent Instructions

## 0. Critical Operating Contract for AI Agents

This file is written for Codex, Claude, GPT-style agents, and human developers. Follow it as project policy.

Before editing anything related to SEO, metadata, sitemap, schema, brand pages, category pages, product pages, navigation, public copy, crawl/index behavior, or route redirects:

1. Read this file.
2. Read `SEO_TODO.md`.
3. Read `BRAND_GUIDE.md` if present.
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

1. Read `CLAUDE.md`, then only the relevant sections of `SEO_TODO.md` and `BRAND_GUIDE.md`.
2. Start from the latest confirmed gaps in `SEO_TODO.md` before doing a broad audit.
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

## 6. Required Agent Execution Order for SEO Work

When implementing SEO work, follow this order:

1. Read `SEO_TODO.md`.
2. Audit current code paths and data flow before changing files.
3. Implement Job 3 Technical Integrity first.
4. Then implement Job 1 Next.js SEO Core.
5. Then implement Job 2 Data Quality + Navigation.
6. Generate requested reports from `SEO_TODO.md`.
7. Build/test.
8. Follow the deployment order below.

## 7. Current Layout

- Local working tree: `/root/emart-platform`
- Live runtime tree: `/var/www/emart-platform`
- Web app: `apps/web`
- Live process: `pm2` process `emartweb`
- Canonical repo: GitHub remote `origin`, branch `main`
- Current rule: Local -> VPS -> Repo, with Repo push last after live smoke test

## 8. Source Of Truth

- The running site is served from `/var/www/emart-platform/apps/web`.
- Do not restore old files from GitHub or Local over VPS without comparing first.
- Keep the current live UI/UX unless the user explicitly asks to change it.
- Before any deploy/restart, confirm the VPS tree is the intended source.

## 9. Required Deploy Order

This project follows the universal VPS deployment law in `/root/CLAUDE.md`. Read that file first when working on the VPS.

Use the verify-then-publish order:

1. Edit on Local.
2. Build/test on Local.
3. Commit on Local.
4. Sync Local -> VPS.
5. Build on VPS.
6. Restart `emartweb`.
7. Smoke test the live site.
8. Push `origin main` only after live verification passes.

If a hotfix is made directly on VPS, reverse-sync VPS -> Local before committing.

## 10. E-Mart Project Facts

- Bangladesh eCommerce site for authentic K-beauty, J-beauty, and international beauty products.
- Frontend: Next.js 14+, TypeScript, Tailwind CSS.
- Backend/content source: WooCommerce + WordPress MU plugins.
- Currency: BDT with the `৳` symbol.
- Payments: Cash on Delivery, bKash, Nagad.
- Main audience: mobile-first Bangladesh shoppers.

## 11. Live Business Rules

- Footer `SignupTabs` is the canonical WhatsApp + email signup block.
- Newsletter path: Next `/api/newsletter/subscribe` -> WordPress `/wp-json/emart/v1/subscribe` -> MailPoet.
- Sales/signup WhatsApp: `8801717082135`.
- Support/payment WhatsApp/phone may use `8801919797399`; do not merge the numbers unless the user says so.
- MailPoet is the live transactional sender path. Do not reinstall or switch SMTP unless asked.
- Telegram command helper exists, but do not enable a second polling service on the same bot token while OpenClaw is polling.

## 12. General Safety Rules

- Never commit secrets. Keep `.env.local` local to the VPS/runtime.
- Never run blind `git add -A` on a dirty runtime tree unless `.gitignore` is checked and the staged list is reviewed.
- Never force-push without explicit user approval.
- Never use `git reset --hard`, branch checkout, or rollback on VPS unless the target commit is verified first.
- Never restart `emartweb` from unknown source state.
- For cleanup, move files to `/root/.attic-YYYY-MM-DD/` instead of deleting unless the user explicitly asks for permanent deletion.

## 13. Useful Current Memory

- Universal deploy instructions: `/root/CLAUDE.md` and `/root/AGENTS.md`.
- E-Mart session log: `/var/www/emart-platform/apps/web/SESSION-LOG.md`.
- E-Mart task/source notes, when present: `/var/www/emart-platform/apps/web/TASKS.md`, `MEMORY.md`, and `LIVE-SOURCE-OF-TRUTH.md`.
- Cleanup restore point from 2026-04-26: `/root/.attic-2026-04-26/`.

## 14. What Not To Trust

- Old project agent files mentioning `AGENTS.coding.md`, `AGENTS.design.md`, or `AGENTS.seo.md`; those were retired to reduce complexity.
- Old docs that say to push before live verification.
- Old rollback snippets that use `git reset --hard` without checking the live source state first.
