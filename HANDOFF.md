# Emart Platform — Session Handoff

> Read this. Nothing else needed to start. Update the "Last Session" block before you stop.

---

## What This Is

Bangladesh K-beauty e-commerce. Next.js 14 frontend (`apps/web`) + WooCommerce/WordPress backend.  
Live at **e-mart.com.bd** — mobile-first, BDT currency, COD/bKash/Nagad payments.  
Mobile app at `apps/mobile` (Expo). Presence WebSocket at `apps/presence-server`.

## Current State — 2026-05-15

- **Live and healthy** — PM2 `emartweb` + `emart-presence` running, site serving
- **Git clean** — Local `/root/emart-platform` = VPS `/var/www/emart-platform` = GitHub `main` at `9a72f1a`
- **Workspace reorganised** — two folders: `workspace/active/` (in play) + `workspace/archive/` (done)

## Active Tasks — Do These Next (priority order)

| # | Task | File | Effort |
|---|------|------|--------|
| ~~1~~ | ~~SEO H1 — aria-hidden focusability~~ | ✅ DONE `1fe56bf` | — |
| ~~2~~ | ~~SEO H2 — ProductCard LCP priority~~ | ✅ DONE `1fe56bf` | — |
| ~~4~~ | ~~WH1 — fix stale SEO_TODO refs in CLAUDE.md~~ | ✅ DONE `1fe56bf` | — |
| 1 | 404 redirects — cross-ref GSC export with redirect xlsx | `workspace/active/audits/gsc-404-report-20260512/` + `workspace/active/data/404 redirect.xlsx` | Medium |
| 2 | Product data triage — 7 invalid SKUs, 3 missing prices, 19 merchant-schema-not-ready | `workspace/active/audits/product-seo-audit-summary-20260515.txt` | Medium |
| 3 | Owner upload needed — 16 products missing images | `workspace/active/data/products-need-real-image.csv` | Blocked |
| 4 | Owner decision needed — 155 price rows unmatched | `workspace/active/data/manual-review-size-notmatched.csv` | Blocked |

## File Map — One Line Each

| File / Folder | What it is |
|---------------|-----------|
| `HANDOFF.md` | **This file** — update before ending session |
| `CLAUDE.md` | Project safety rules, brand invariants, deploy order |
| `AGENTS.md` | Agent coordination contract |
| `workspace/PROJECT_BASELINE.md` | Full project map — read if lost |
| `workspace/SEO_MASTER.md` | SEO task list, priorities, done items |
| `workspace/DEV_MASTER.md` | Dev task list, UI/UX + hygiene tasks, ownership |
| `workspace/VPS_RESOURCE_MAP.md` | All VPS projects, ports, RAM, disk, free slots |
| `workspace/ATTIC_INDEX.md` | Files moved to `/root/.attic-2026-05-15/` outside project |
| `workspace/BRAND_GUIDE.md` | Brand name, tagline, tone invariants |
| `workspace/active/README.md` | Full status of every active item |
| `workspace/active/scripts/` | 10 active PHP/bash/mjs scripts |
| `workspace/active/audits/` | GSC 404 URL export |
| `workspace/active/data/` | 404 redirect xlsx + 2 owner-review CSVs |
| `workspace/active/docs/` | theme-contract + category-taxonomy + mobile-build-notes |
| `workspace/archive/` | All completed work (audits + scripts) |
| `apps/web/SESSION-LOG.md` | Per-session log — append a block each session |
| `apps/web/.agent-memory/MEMORY.md` | Shared durable memory — read at session start |

## Deploy Law — Non-Negotiable

```
Edit Local → build → commit → rsync to VPS → build VPS → pm2 restart → smoke test → push GitHub LAST
```
Never push to GitHub before verifying live. Full rules: `/root/CLAUDE.md`.

## Do Not Touch Without Explicit Owner Approval

- Checkout / cart / payment / order / customer / stock / price logic
- `apps/web/src/app/api/checkout`
- Any WooCommerce DB mutation without a dry-run first
- Force-push to `origin/main`

## Protected Numbers / Accounts

- Sales WhatsApp: `8801717082135`
- Support WhatsApp: `8801919797399`
- Do not merge these two numbers

## Last Session — 2026-05-15 — Claude + Codex (parallel)

**Did:** PHP/script hygiene + read-only audits + mobile API bypass audit.
- WH3 done: archived `pa-ingredient-skintype-apply.php`, `fix-wrong-korea-origin-products.php`, and `audit-wrong-korea-origin-products.php` to `workspace/archive/scripts/`
- B4 done: fresh product SEO audit saved to `workspace/active/audits/product-seo-audit-20260515.csv`; summary shows 16 missing images, 7 invalid SKUs, 3 missing prices, 19 merchant-schema-not-ready
- B2 done/read-only: SKU audit found 3,628 published products, 0 missing SKU, 0 duplicate SKU meta products; no SKUs assigned
- M2 audit-only: mobile source calls route through BFF/API routes; no `consumer_key` / `consumer_secret` hits; only legacy service-name imports and public Woo placeholder image URL found
- Updated `workspace/SEO_MASTER.md`, `workspace/DEV_MASTER.md`, and `workspace/active/README.md` to resolve stale 119-missing-SKU/audit-pending notes

**Claude also did:** SEO H1 (`inert={true}` on aria-hidden mobile rails), SEO H2 (ProductCard priority → first card only), WH1 (5 stale SEO_TODO refs fixed in CLAUDE.md). Commit `1fe56bf`. Live 200.

**Next session starts at:** 404 redirects (task 1) — read GSC Table.csv + 404 redirect.xlsx, add missing redirects to `next.config.js`.
