# Emart Platform — Project Baseline

**Start here.** This file is the single entry point for any agent or developer picking up work on this project.  
Last updated: 2026-05-15

---

## 1. Workflow + Deploy Law

| File | What it owns |
|------|-------------|
| `/root/CLAUDE.md` | Universal VPS deploy sequence — verify-then-publish order, hard rules |
| `/root/AGENTS.md` | Agent coordination contract |
| `CLAUDE.md` (this repo) | Project-specific safety rules, brand invariants, headless SEO architecture, deploy order |

**Do not follow any doc that contradicts these. They are the top of the authority chain.**

Current deploy path: Local `/root/emart-platform` → VPS `/var/www/emart-platform` → `origin/main`.  
Never push to GitHub before smoke-testing live on VPS.

---

## 2. Who Owns What

`workspace/DEV_MASTER.md`

- Claude owns: `apps/web` (Next.js frontend, SEO, UI/UX)
- Codex owns: `apps/mobile` (Expo app), PHP mu-plugins
- Shared zone: `apps/web/src/lib/woocommerce.ts`, mobile BFF API routes, `next.config.js`
- Do not touch: checkout, cart, payment, order, customer, stock, price logic without explicit owner approval

---

## 3. SEO Priorities

`workspace/SEO_MASTER.md`

Current active tasks: H2 (aria-hidden focusability), H3 (ProductCard LCP priority), then Medium items.  
H1 (DetailsTabs server-render) done in `f64fbf2`.  
Source audit: `workspace/audit/archive/reference-audits-20260515/e-mart-master-technical-seo-image-crawler-audit-20260515.md`

---

## 4. Category + Taxonomy Rules

`workspace/docs/category-taxonomy-status.md`

Canonical reference for which categories are active, redirected, backend-only, or near-empty. Read before touching category pages, sitemap entries, or concern/ingredient filter pages.

---

## 5. UI/UX + Design System

`workspace/docs/theme-contract.md` — canonical brand token rules  
`workspace/audit/archive/layout-ui-ux-audit-20260515/layout-component-ui-ux-setup-audit-20260515.md` — full layout/component/token audit (2026-05-15)

Key blockers from audit:
- `bg-card` / `bg-canvas` are used in 79 places but not defined in Tailwind (U1 in DEV_MASTER)
- Token systems are split — one canonical map needs to be declared (U2)
- Header (1,166 lines), HomepageSections (1,034 lines), CatalogFilters (569 lines) are split targets (U3–U7)

Rule: do not redesign UI. Stabilize component system while preserving visual output.

---

## 6. Workspace Hygiene + Cleanup Order

`workspace/audit/archive/hygiene-audit-20260515/workspace-hygiene-dependency-map-audit-20260515.md` — full hygiene/dependency audit (2026-05-15)

Pending cleanup tasks live in `workspace/DEV_MASTER.md` under WORKSPACE HYGIENE section.  
Key items: archive completed taxonomy CSVs and mutator scripts, mark `apps/web/MEMORY.md` historical, update ARCHIVE-INDEX.

---

## 7. Memory + Session State

| File | Role |
|------|------|
| `apps/web/.agent-memory/MEMORY.md` | Canonical shared durable memory — read at session start |
| `/root/.claude/projects/-root-emart-platform/memory/MEMORY.md` | Symlinked to above — Claude auto-reads |
| `apps/web/SESSION-LOG.md` | Append one block per session at end |
| `apps/web/TASKS.md` | Historical task board — treat as reference, not authoritative |
| `apps/web/MEMORY.md` | **HISTORICAL** — conflicts with current deploy law; ignore it |

---

## 8. Stale Paths To Ignore

| Stale reference | Current replacement |
|----------------|---------------------|
| `workspace/SEO_TODO.md` | `workspace/SEO_MASTER.md` |
| `AGENTS.coding.md`, `AGENTS.design.md`, `AGENTS.seo.md` | Retired — see `DEV_MASTER.md` |
| `apps/web/MEMORY.md` | `.agent-memory/MEMORY.md` |

> Note: `CLAUDE.md` sections 1 and 5–7 still reference `workspace/SEO_TODO.md` — treat those lines as `workspace/SEO_MASTER.md` until updated.

---

## 9. Attic Index — Archived Files

`workspace/ATTIC_INDEX.md`

Full reference for everything moved to `/root/.attic-2026-05-15/`. Two locations:
- `emart-archive/` — completed batch CSVs, backups, old docs (korea origin, derma co, sale price, FB catalog, slug cleanup, taxonomy)
- `stale-www-2026-05-15.tar.gz` — old /var/www Emart app versions (compressed, download to PC then delete)

If you need a file from the attic, check ATTIC_INDEX.md first — it tells you exactly where it is and what's in it.

---

## 10. VPS Resource Map

`workspace/VPS_RESOURCE_MAP.md`

Complete map of every project, service, port, and folder on this VPS. Read before adding a new project. Update it after any project is added, removed, or reconfigured.

Current state: Emart + Medimart + n8n active. ~3 GB recoverable from stale `/var/www/` folders. Ports 3020+ free for new projects. Redis, Qdrant, Ollama available as shared services.

---

## 10. Protected Business Data (do not touch without approval)

- `workspace/products-need-real-image.csv` — 16 products awaiting owner image upload
- `workspace/manual-review-size-notmatched.csv` — 155 rows pending owner price decision
- WooCommerce: checkout, cart, payment, order, customer, stock, price logic
