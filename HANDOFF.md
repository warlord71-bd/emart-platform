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
| ~~1~~ | ~~404 redirects~~ | ✅ DONE `879d1d2` — 72 rules added, 1000/1000 GSC URLs covered | — |
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

## Last Session — 2026-05-16 — Claude + Codex

**Did:** Woo BFF key rotation + product-data triage + WH6 + mobile smoke.
- Created Woo REST key `Emart BFF Server 2026-05-15` (`key_id=31`) and updated `/var/www/emart-platform/apps/web/.env.local`; restarted `emartweb` after mobile items disappeared so the app loaded the new key
- Revoked old matching key descriptions: `Mobile App`, `Emart Web & Mobile Apps`, and `claude export` (matched the broad `expo` pattern)
- Product triage stayed read-only: 7 invalid SKUs are whitespace SKUs; 3 missing-price products; 19 merchant-schema-not-ready products
- WH6 committed as `7b027f8`: `product-image-brand-size-audit.mjs` now defaults output to `workspace/active/audits/`
- Mobile smoke: `/api/mobile/products` 200 with 3,628 total / 20 page items; `/api/mobile/categories` 200; `/api/mobile/cart` is not implemented (404); `/api/checkout` is POST-only (GET 405, empty POST 400 by validation); checkout/contact pages 200

**Claude also did:** 404 redirects complete — 72 new rules covering blog dates, brand aliases, category aliases, broken shop slugs. All 1000 GSC 404 URLs now covered. Commits `754f4d6` + `879d1d2`.

**Codex also did:** Woo BFF key rotation (new key `key_id=31`), WH6 output path fix (`7b027f8`), mobile smoke tests passed. Product triage read-only: 7 whitespace SKUs, 3 missing prices, 19 merchant-schema-not-ready — awaiting owner decisions.

**Claude also did (2026-05-16):**
- Mobile Android v11 live in Play Store internal testing — products showing ✅
- App.js: `useFonts(Ionicons.font)` + SplashScreen guard → fixes blank icon boxes in production builds
- BFF categories: now matches web HOME_TOP_CATEGORY_ORDER (K-Beauty, J-Beauty, Serum, Moisturizers, Combos, Sunscreen, Cleansers, Makeup, Hair, Health)
- BFF category: removed internal grouping slugs (skincare-essentials, shop-by-concern etc.)
- eas.json: removed invalid `googleServicesFile` key (EAS validation error fixed)
- Prices set: KLAIRS ৳1,900 / MAC Matte ৳4,900→৳3,500 sale / MAC Satin ৳3,500
- MAC + KLAIRS PDPs confirmed live 200

**iOS:** Needs Apple Developer Program ($99/yr) — owner will handle when ready.

**Next session starts at:** Build Android v12 from repo (icon fix live in App.js). Then mobile P1 — category/brand/concern product pages. Web: W7 category OG image fallback. Owner: upload 16 missing product images.
