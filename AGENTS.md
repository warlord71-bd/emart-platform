# Emart — Agent Entry Point

Bangladesh K-beauty e-commerce. Next.js 14 frontend + WooCommerce/WordPress backend.
Live at **e-mart.com.bd** · BDT · COD / bKash / Nagad · mobile-first.

This file is the self-contained instruction set for Codex, GPT-style agents, and human developers.
Claude additionally reads `CLAUDE.md` for the same content plus Claude-specific memory paths.

---

## Stack & Commands
- **Next.js 14, React 18, Tailwind 3, TypeScript** — frozen until 2026-07-03
- App root: `apps/web` | Build: `cd apps/web && npm run build`
- PM2 process: `emartweb` | Live: `https://e-mart.com.bd`
- Local: `/root/emart-platform` | VPS runtime: `/var/www/emart-platform`
- Repo: `origin/main` — push ONLY after live smoke test passes
- WC API key: key_id `50` ("Emart BFF Live auto-recovered 2026-06-07 17:45") in `.env.local`
- Currency: ৳ BDT | Payments: COD, bKash, Nagad | Market: mobile-first Bangladesh

## Brand (never change without owner approval)
- Short: **Emart** | Full: **Emart Skincare Bangladesh** | Tagline: **Global Beauty. Local Trust.**
- Invalid variants: E-Mart, EMart BD, Emart BD, eMart

## Live Site Protection — check before any deploy
- Never damage `https://e-mart.com.bd` — site first, code second
- No `git reset --hard` on VPS without verifying live source state first
- No `git add -A` on a dirty VPS tree without reviewing the staged list first
- Before any SEO / metadata / sitemap / schema / route change: read `workspace/SEO_MASTER.md`

## Headless SEO Architecture (mandatory)
- Public SEO surface: **Next.js frontend only** (`apps/web`)
- Backend (WooCommerce + WordPress): private data source — never SEO-facing
- Never canonical a frontend page to a backend URL
- All canonical / sitemap / OG / JSON-LD URLs must be absolute: `NEXT_PUBLIC_SITE_URL=https://e-mart.com.bd`
- Missing product → `notFound()` | Out-of-stock → `schema.org/OutOfStock` | In-stock → `schema.org/InStock`
- `generateMetadata` for all dynamic product / category / brand pages

## Data Safety — NEVER touch without explicit user request
`checkout` · `cart` · `payment` · `order` · `customer data` · `stock` · `price` · `WooCommerce DB`

## SEO Routing Rules
- Legacy `/product-category/*`, `/tag/*` → 301 redirect to clean Next.js routes
- Strip/handle: `add-to-cart`, `orderby`, `per_page`, `shop_view`, `srsltid`
- Frontend HTML must not expose WordPress / backend technology headers

## Deploy Order
Follow `/root/CLAUDE.md` sequence: Local edit → build → commit → rsync → VPS build → `pm2 restart emartweb` → smoke test → push.
**Never push `origin/main` before smoke test passes.**
Hotfix on VPS: reverse-sync VPS → Local before committing. Never commit from VPS directly.
Quick reference: `workspace/docs/claude-reference/deploy-reference.md`

## Session Protocol (all agents)
- **Start:** `cat apps/web/.agent-memory/AGENT_BUS.md` + `cat apps/web/.agent-memory/MEMORY.md` + `tail -50 apps/web/SESSION-LOG.md` + `cat workspace/TASKS.md` + `git log --oneline -10` + `git status --short`
- **Before work:** check `AGENT_BUS.md` ACTIVE WORK. If work overlaps, coordinate or pick another task.
- **End:** append one block to `SESSION-LOG.md` (date · did · blockers · next step) + update `workspace/TASKS.md`; if you added an ACTIVE WORK row, move it to LAST COMPLETED.

## Live Business Rules
- WhatsApp signup: `8801717082135` | support/payment: `8801919797399` — do NOT merge
- Newsletter: `/api/newsletter/subscribe` → `/wp-json/emart/v1/subscribe` → MailPoet
- Do not restart `emartweb` from unknown source state
- Do not enable a second polling service on the same Telegram bot token while OpenClaw is polling
- Cleanup: move files to `/root/.attic-YYYY-MM-DD/` — never delete unless user explicitly asks
- Never commit secrets; keep `.env.local` on VPS/runtime only

## General Safety
- Never force-push without user approval; use `--force-with-lease` if authorized
- Never skip hooks (`--no-verify`) without user approval
- Old files to ignore: `AGENTS.coding.md`, `AGENTS.design.md`, `AGENTS.seo.md` — retired

## SEO Work Execution Order
1. Read `workspace/SEO_MASTER.md` → 2. Audit code paths → 3. Technical integrity → 4. SEO Core → 5. Data Quality → 6. Build/test → 7. Deploy

## Token Efficiency
Search before reading. Read only files needed for this task. Report only changes made and risks found.
Key SEO search targets: `canonical` · `generateMetadata` · `sitemap` · `robots` · `notFound` · `NEXT_PUBLIC_SITE_URL` · `middleware`

## Reference (load only when the task needs it)
- [SEO Master](workspace/SEO_MASTER.md) — full SEO gap tracker, canonical/sitemap/schema rules
- [OpenClaw](workspace/docs/claude-reference/openclaw.md) — VPS inspection, Telegram, safety rules
- [Deploy function](workspace/docs/claude-reference/deploy-reference.md) — full rsync/pm2 reference script
- [Brand guide](workspace/BRAND_GUIDE.md) — copy tone, product naming, brand story
- [Category taxonomy](workspace/docs/category-taxonomy-status.md) — active/redirected/backend-only categories
- [Task board](workspace/TASKS.md) — open work, priority order, freeze scope
- [Agent memory](apps/web/.agent-memory/MEMORY.md) — durable facts, preferences, project state
