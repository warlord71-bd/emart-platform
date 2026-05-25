# Emart Development Master — Task Detail

Last updated: 2026-05-25
Coordination model: Claude owns `apps/web` | Codex owns `apps/mobile` + PHP plugins | Shared items listed below.
**Open task priority board** → `workspace/TASKS.md`

⚠️ Conflict rule: Before touching a shared file, check this file for active work by the other agent.

---

## STACK VERSION REFERENCE — Read before touching any dependency

> Updated: 2026-05-25. Run `cd /root/emart-platform/apps/web && node -e "require('./node_modules/<pkg>/package.json').version"` to verify installed version at any time.

### Runtime / Infrastructure

| Layer | Installed | Latest (2026-05) | Action |
|-------|-----------|-----------------|--------|
| Node.js (VPS) | 22.22.1 LTS | 22.x LTS | ✅ Current |
| PHP (VPS) | 8.3.6 | 8.3.x | ✅ Current — do NOT jump to 8.4 until WordPress/WooCommerce compatibility confirmed |
| WordPress | 6.9.4 | 7.0.x | 🔴 **HOLD** — WordPress 7.0 just released; WooCommerce 10.7.0 not yet confirmed compatible. Check WooCommerce changelogs before updating WP. |
| WooCommerce | 10.7.0 | ~10.7.x | ⚠️ Update WP + Woo together only; never WP alone |

### Next.js / Frontend

| Package | Installed | Latest | Action |
|---------|-----------|--------|--------|
| next | 14.2.35 | 15.x | 🔴 **HOLD** — Next.js 15 is React 19 only + significant App Router breaking changes. Migration requires full regression test. |
| react / react-dom | 18.3.1 | 19.x | 🔴 **HOLD** — React 19 pairs with Next.js 15 only. Current app is stable on React 18. |
| tailwindcss | 3.4.19 | 4.x | 🔴 **HOLD** — Tailwind v4 drops `tailwind.config.js` in favour of CSS-first config. Full config rewrite required. |
| typescript | 5.9.3 | 5.9.x | ✅ Current |
| zustand | 4.5.7 | 5.x | 🔴 **HOLD** — Zustand 5 has API breaking changes (store creation signature changed). Audit all `create()` calls before updating. |
| next-auth | 4.24.14 | 5.x (beta) | 🔴 **HOLD** — NextAuth v5 is a rewrite; session/JWT handling changed. Safe on v4 for now. |
| lucide-react | 0.263.1 | 0.x / 1.x | 🔴 **HOLD** — v1.x renamed many icons. Any jump past ~0.300 risks missing icon names at build time. Check icon renames before updating. |
| eslint | 8.57.1 | 9.x / 10.x | 🔴 **HOLD** — Next.js 14 requires ESLint 8. ESLint 9 flat config is incompatible with `eslint-config-next` 14. |
| @tanstack/react-query | 5.100.14 | 5.x | ✅ Current (minor/patch auto-update safe) |
| axios | 1.16.1 | 1.x | ✅ Current |
| sharp | 0.34.5 | 0.34.x | ✅ Current |
| postcss | 8.5.15 | 8.x | ✅ Current |
| autoprefixer | 10.4.21 | 10.x | ✅ Current |
| @types/node | 22.19.19 | 22.x | ✅ Updated 2026-05-25 (was ^20) — tracks Node 22 LTS |
| @types/react | 18.x | 18.x | ✅ Current |
| @typescript-eslint/* | 8.59.1 | 8.x | ✅ Current |

### Safe minor/patch update log

| Date | Packages updated | Commit | Notes |
|------|-----------------|--------|-------|
| 2026-05-25 | axios, @tanstack/react-query, postcss, autoprefixer, next-auth, @typescript-eslint/{plugin,parser}, @types/react, @next/third-parties, @types/node (^20→^22) | `f2acdd7` | All within declared semver; tsc clean; 129 page build passed; VPS smoke OK |

### Hard rules for LLMs touching `package.json`

1. **Never `npm update` without first reading this section.** `npm update` respects semver ranges in `package.json`. The ranges here are deliberately conservative.
2. **Never bump `next`, `react`, `tailwindcss`, `zustand`, `next-auth`, or `lucide-react` to the next major.** Each requires a migration branch + full regression. Do not do this as a "safe cleanup."
3. **Never bump `eslint` past 8.x** while `next` is 14.x. `eslint-config-next` 14 hard-requires ESLint 8.
4. **WordPress 7.0 freeze**: Do not update WordPress or WooCommerce via WP-CLI or WP admin until WooCommerce publishes a 7.0-compatible release and the owner explicitly approves the upgrade.
5. **Node.js 22 is the VPS runtime**. If a package's `engines` field requires Node ≥ 18, verify it supports 22 before installing.
6. **Safe to update at any time** (within semver range): axios, @tanstack/react-query, postcss, autoprefixer, @types/node, @types/react, @typescript-eslint/*, sharp, @next/third-parties, next-auth (patch only within 4.x).

### Freeze note

Navigation, URL structure, sitemap, and routing changes are frozen until **2026-07-03** per SEO crawl stability policy. Do not add/remove routes, rename slugs, or change middleware redirect rules before that date.

---

---

## SHARED ZONE — Coordinate before touching

| File/area | Who can touch | Status |
|-----------|--------------|--------|
| `apps/web/src/app/api/mobile/*` | Both (Claude adds endpoints, Codex consumes) | Stable — do not change signatures without notifying both |
| `apps/web/src/app/api/checkout` | Both | Protected — no changes without owner approval |
| `apps/web/src/lib/woocommerce.ts` | Both | Stable API client — add functions, do not remove |
| `apps/web/next.config.js` | Claude only | Do not edit from Codex side |
| WordPress mu-plugins (`/var/www/wordpress/wp-content/mu-plugins/`) | Codex primarily | Claude may read for SEO/API routing only |

---

## WEB FRONTEND — Claude owns (`apps/web`)

### W2: `aria-hidden` focusability on homepage mobile duplicate rails
- **Files:** `apps/web/src/components/home/HomepageSections.tsx`
- **Change:** Add `tabIndex={-1}` to interactive children inside `aria-hidden` duplicate rails, or use `inert` attribute.
- **Effort:** Small

### W3: ProductCard image priority — reduce to true LCP only
- **Files:** `apps/web/src/components/product/ProductCard.tsx`, `apps/web/src/app/shop/page.tsx`, `apps/web/src/app/category/[slug]/page.tsx`
- **Change:** Only first product on first page gets `priority`. Cards 2–4 do not.
- **Effort:** Small

### W4: ReviewsSection — remove unnecessary client refetch
- **Files:** `apps/web/src/components/product/ReviewsSection.tsx:70-93`
- **Change:** Remove `cache: 'no-store'` refetch if server-passed data is sufficient for initial render.
- **Effort:** Small

### W6: Critical CSS inlining (`critters`)
- **Files:** `apps/web/next.config.js`, build pipeline
- **Change:** Add `critters` to extract and inline above-fold CSS. Eliminates render-blocking CSS on mobile.
- **Effort:** High | **Risk:** Medium — smoke test required

### W7: Category OG image fallback
- **Files:** `apps/web/src/app/category/[slug]/page.tsx:94-103`
- **Change:** Fall back to default storefront social image when no category image exists.
- **Effort:** Small

---

## MOBILE APP — Codex owns (`apps/mobile`)

> Read `apps/web/.agent-memory/MEMORY.md` before starting. The mobile BFF (`/api/mobile/*`) is stable — consume it, don't rewrite it.

### M1: Rotate WooCommerce keys — SECURITY HIGH
- **Why:** Prior audit found Woo credentials were directly in mobile app. Keys removed from code but may still be active in Woo admin.
- **Action:** Generate new Woo REST API keys. Update `/api/mobile/*` BFF env only (not mobile app).

### M2: Verify all mobile API calls route through BFF
- **Files:** `apps/mobile/` — search for direct `woocommerce.com` or `e-mart.com.bd/wp-json` calls
- **Action:** Audit; replace any remaining direct calls with `/api/mobile/*` equivalents.

### M3: Mobile cart → checkout flow smoke test
- **Action:** End-to-end: add to cart → checkout → COD. Verify bKash/Nagad payment links still work.

### M4: Push notification integration
- **Action:** Confirm FCM/APNs tokens are being stored and notification triggers are in place.

---

## BACKEND / PHP PLUGINS — Codex primarily

> Always dry-run first. Never mutate checkout/cart/payment/order without explicit owner approval.

### B2: SKU assignment — 0 missing as of 2026-05-15
- **Script:** `workspace/scripts/active/product-sku-audit-dry-run.php`
- **Status:** 0 published products missing SKU, 0 duplicate SKU meta. No action needed unless owner provides new data.

### B3: Product image upload — 16 products
- **File:** `workspace/audit/active/products-need-real-image.csv`
- **Status:** CSV ready. Owner uploads images → Codex assigns in WooCommerce.

### B4: Fresh product SEO / image audit
- **Script:** `workspace/scripts/active/product-seo-audit.php`
- **Last run:** 2026-05-15 — outputs in `workspace/audit/archive/processed/`

---

## UI/UX ARCHITECTURE — Claude owns (`apps/web`)

> Reference: `workspace/audit/archive/layout-ui-ux-audit-20260515/layout-component-ui-ux-setup-audit-20260515.md`
> Rule: Do not redesign — stabilize the component system while preserving visual output.

### U1: Fix missing Tailwind aliases — `bg-card` and `bg-canvas`
- **Why:** 79 usages, not defined in `tailwind.config.js` — silently generates no CSS.
- **Files:** `apps/web/tailwind.config.js`, `apps/web/src/app/globals.css`
- **Effort:** Small | **Risk:** Low

### U2: Update `workspace/docs/theme-contract.md` with canonical token map
- **Change:** One canonical set: `bg`, `card`, `surface`, `ink`, `muted`, `accent`, `border`, `success`, `warning`, `danger`. Mark `lumiere` and `--mb-*` as scoped-island aliases only.
- **Effort:** Small | **Risk:** None (docs only)

### U3: Split `HomepageSections.tsx` into per-section files
- **Files:** `apps/web/src/components/home/HomepageSections.tsx` (1,034 lines)
- **Change:** One file per exported section under `components/home/sections/`. Keep `page.tsx` import order unchanged.
- **Effort:** Medium | **Risk:** Low

### U4: Split `Header.tsx` into focused subcomponents
- **Files:** `apps/web/src/components/layout/Header.tsx` (1,166 lines)
- **Target:** `HeaderShell`, `HeaderLogo`, `HeaderSearch`, `HeaderActions`, `DesktopMegaNav`, `MobileMenuDrawer`, `AnnouncementBar`
- **Effort:** Medium | **Risk:** Medium

### U5: Add shared `ProductGrid` component
- **Files:** Create `apps/web/src/components/collection/ProductGrid.tsx`; adopt in shop + one collection page first.
- **Effort:** Medium | **Risk:** Medium

### U6: Add ARIA tab semantics to `DetailsTabs`
- **Files:** `apps/web/src/components/product/DetailsTabs.tsx`
- **Change:** Add `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `role="tabpanel"`.
- **Effort:** Small | **Risk:** Low

### U7: Split `CatalogFilters.tsx` mobile/desktop
- **Files:** `apps/web/src/components/product/CatalogFilters.tsx` (569 lines)
- **Target:** `catalog-filter-options.ts`, `useCatalogFilterUrl.ts`, `MobileCatalogFilters.tsx`, `DesktopCatalogFilters.tsx`, `CatalogFilterChip.tsx`
- **Effort:** Medium | **Risk:** Medium

### U8: Add shared layout primitives
- **Files:** Create `apps/web/src/components/ui/PageContainer.tsx`, `SectionShell.tsx`, `NarrowContent.tsx`
- **Effort:** Small | **Risk:** Low

---

## WORKSPACE HYGIENE

### WH1: Fix stale `SEO_TODO.md` references in `CLAUDE.md`
- **Change:** Replace `workspace/SEO_TODO.md` → `workspace/SEO_MASTER.md` in `CLAUDE.md` sections 1, 5, 7.
- **Effort:** Trivial

### WH4: Mark `apps/web/MEMORY.md` as historical
- **Change:** Add top-of-file banner pointing to `.agent-memory/MEMORY.md` and `/root/CLAUDE.md`.
- **Effort:** Trivial

### WH6: Fix output path in `product-image-brand-size-audit.mjs`
- **Files:** `workspace/scripts/active/product-image-brand-size-audit.mjs`
- **Change:** Default `OUT` path → `workspace/audit/active/`
- **Effort:** Trivial

### WH7: Review app-local scripts for archival
- **Files:** `apps/web/scripts/seo-p1-preview.mjs`, `apps/web/scripts/ocr-image-audit.mjs`, `apps/web/scripts/image-logic-fixer.mjs`
- **Change:** If no active owner, move to `workspace/scripts/archive/`. Keep `check-all.sh`, `audit-duplicate-products.mjs` (referenced in package.json).
- **Effort:** Small

---

## DO NOT TOUCH (protected)

- Checkout / cart / payment / order logic
- `_sku`, `_price`, `_stock_quantity` WooCommerce meta
- `apps/web/src/app/api/checkout`
- Customer data / order history

---

## Active Branch Convention

- Claude: `claude/<feature>-<ticket>`
- Codex: `codex/<feature>-<ticket>`
- Merge to `main` only after smoke test passes on VPS
