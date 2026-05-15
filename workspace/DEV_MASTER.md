# Emart Development Master Task List

Last updated: 2026-05-15 (baseline unification pass)
Coordination model: Claude owns web frontend (`apps/web`) | Codex owns mobile (`apps/mobile`) + PHP plugins | Shared items listed explicitly

⚠️ Conflict rule: Before touching a shared file, check this file for active work by the other agent. Never rewrite a file the other agent is currently working in.

---

## SHARED ZONE — Coordinate before touching

| File/area | Who can touch | Current status |
|-----------|--------------|----------------|
| `apps/web/src/app/api/mobile/*` | Both (Claude adds endpoints, Codex consumes) | Stable — do not change signatures without notifying both |
| `apps/web/src/app/api/checkout` | Both | Protected — no changes without owner approval |
| `apps/web/src/lib/woocommerce.ts` | Both | Stable API client — add functions, do not remove |
| `apps/web/next.config.js` | Claude (code) | Do not edit from mobile/Codex side |
| WordPress mu-plugins (`/var/www/wordpress/wp-content/mu-plugins/`) | Codex primarily | Claude may read for SEO/API routing only |

---

## WEB FRONTEND — Claude owns (`apps/web`)

### ~~W1: `DetailsTabs` — server-render all tab panels~~ ✅ DONE 2026-05-15
- All panels in initial HTML; CSS `hidden` toggling. Commit `f64fbf2`. SEO H1 resolved.

### W2: `aria-hidden` focusability on homepage mobile duplicate rails
- **Why:** Accessibility + Lighthouse penalty. Focusable elements inside `aria-hidden` containers.
- **Files:** `apps/web/src/components/home/HomepageSections.tsx`
- **Change:** Add `tabIndex={-1}` to interactive children inside hidden duplicate rails, or restructure to use `inert` attribute.
- **Effort:** Small

### W3: ProductCard image priority — reduce to true LCP only
- **Files:** `apps/web/src/components/product/ProductCard.tsx`, `apps/web/src/app/shop/page.tsx`, `apps/web/src/app/category/[slug]/page.tsx`
- **Change:** Only first product on first page gets `priority`. Cards 2-4 do not.
- **Effort:** Small

### W4: ReviewsSection — remove unnecessary client refetch
- **Files:** `apps/web/src/components/product/ReviewsSection.tsx:70-93`
- **Change:** Remove `cache: 'no-store'` refetch if server-passed data is sufficient for initial render.
- **Effort:** Small

### ~~W5: `MerchantReturnPolicy` + `priceValidUntil` schema~~ ✅ DONE 2026-05-15
- MerchantReturnPolicy live in all PDP JSON-LD. priceValidUntil removed (re-enable with real dates when sales run).

### W6: Critical CSS inlining (`critters`)
- **Files:** `apps/web/next.config.js`, build pipeline
- **Change:** Add `critters` to extract and inline above-fold CSS. Eliminates render-blocking CSS on mobile.
- **Effort:** High | **Risk:** Medium — requires careful smoke test

### W7: Category OG image fallback
- **Files:** `apps/web/src/app/category/[slug]/page.tsx:94-103`
- **Change:** Fall back to default storefront social image when no relevant category image exists.
- **Effort:** Small

### W8: Re-enable lint during builds (or add to deploy check)
- **Files:** `apps/web/next.config.js:10`
- **Effort:** Trivial

---

## MOBILE APP — Codex owns (`apps/mobile`)

> Codex: read `apps/web/.agent-memory/MEMORY.md` before starting. The mobile BFF (`/api/mobile/*`) is stable — consume it, don't rewrite it.

### M1: Rotate WooCommerce keys that were ever bundled in old mobile builds
- **Why:** Prior audit found Woo credentials were directly in mobile app. Keys were removed from code but may still be active in WooCommerce admin.
- **Action:** Generate new Woo REST API keys. Update `/api/mobile/*` BFF env only (not mobile app).
- **Owner:** Codex (key rotation) + owner (WooCommerce admin)
- **Priority:** HIGH — security

### M2: Verify all mobile API calls route through BFF endpoints
- **Files:** `apps/mobile/` — search for any remaining direct `woocommerce.com` or `e-mart.com.bd/wp-json` calls
- **Action:** Audit; replace any remaining direct calls with `/api/mobile/*` equivalents.
- **Owner:** Codex

### M3: Mobile cart → checkout flow smoke test
- **Action:** End-to-end test: add to cart → checkout → COD order. Verify bKash/Nagad payment links still work.
- **Owner:** Codex

### M4: Push notification integration (if not done)
- **Action:** Confirm FCM/APNs tokens are being stored and notification triggers are in place.
- **Owner:** Codex

---

## BACKEND / PHP PLUGINS — Codex primarily

> These touch live WordPress. Always dry-run first. Never mutate checkout/cart/payment/order without explicit owner approval.

### ~~B1: pa_concern + pa_skin_type + pa_ingredient assignment~~ ✅ DONE 2026-05-15
- pa_concern: 2,236 products | pa_ingredient: 1,088 products | pa_skin_type: 28 products
- Scripts: `pa-concern-skin-type-dry-run.php`, `pa-ingredient-skintype-apply.php`

### B2: SKU assignment — fresh audit shows 0 missing products
- **Script:** `workspace/active/scripts/product-sku-audit-dry-run.php`
- **Status:** Read-only rerun 2026-05-15 found 0 published products missing SKU and 0 duplicate SKU meta products. No SKUs assigned.
- **Owner:** Codex only applies future SKU changes after owner provides data

### B3: Product image upload — 16 products
- **File:** `workspace/products-need-real-image.csv`
- **Status:** CSV ready, images not yet uploaded by owner
- **Owner:** Owner uploads images → Codex assigns in WooCommerce

### B4: Fresh product SEO / image audit
- **Script:** `workspace/active/scripts/product-seo-audit.php`
- **Action:** Read-only rerun completed 2026-05-15; outputs in `workspace/active/audits/product-seo-audit-20260515.csv` and `product-seo-audit-summary-20260515.txt`.
- **Owner:** Codex or Claude

---

---

## UI/UX ARCHITECTURE — Claude owns (`apps/web`)

> Reference: `workspace/audit/archive/layout-ui-ux-audit-20260515/layout-component-ui-ux-setup-audit-20260515.md`
> Rule: Do not redesign UI — stabilize the component system while preserving visual output.

### U1: Fix missing Tailwind aliases — `bg-card` and `bg-canvas`
- **Why:** 79 usages across catalog/checkout/home. Not defined in `tailwind.config.js` — silently generates no CSS.
- **Files:** `apps/web/tailwind.config.js`, `apps/web/src/app/globals.css`
- **Change:** Add `card` and `canvas` color aliases mapped to existing CSS variables. Screenshot before/after.
- **Effort:** Small | **Risk:** Low

### U2: Update `theme-contract.md` with canonical token map
- **Files:** `workspace/docs/theme-contract.md`
- **Change:** One canonical set: `bg`, `card`, `surface`, `ink`, `muted`, `accent`, `border`, `success`, `warning`, `danger`. Mark `lumiere` and `--mb-*` as scoped-island aliases only.
- **Effort:** Small | **Risk:** None (docs only)

### U3: Split `HomepageSections.tsx` into per-section files
- **Files:** `apps/web/src/components/home/HomepageSections.tsx` (1,034 lines)
- **Change:** One file per exported section under `components/home/sections/`. Keep `page.tsx` import order unchanged.
- **Effort:** Medium | **Risk:** Low (move-only + import updates)

### U4: Split `Header.tsx` into focused subcomponents
- **Files:** `apps/web/src/components/layout/Header.tsx` (1,166 lines)
- **Target:** `HeaderShell`, `HeaderLogo`, `HeaderSearch`, `HeaderActions`, `DesktopMegaNav`, `MobileMenuDrawer`, `AnnouncementBar`
- **Effort:** Medium | **Risk:** Medium — test all nav/search/mobile drawer paths after split

### U5: Add shared `ProductGrid` component
- **Why:** Shop, category, concern, ingredient routes all duplicate grid/priority/pagination logic.
- **Files:** Create `apps/web/src/components/collection/ProductGrid.tsx`; adopt in shop + one collection page first.
- **Effort:** Medium | **Risk:** Medium — catalog pages affect revenue and SEO

### U6: Add ARIA tab semantics to `DetailsTabs`
- **Why:** All-panel HTML is live (f64fbf2). Tab roles and keyboard behavior still missing.
- **Files:** `apps/web/src/components/product/DetailsTabs.tsx`
- **Change:** Add `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `role="tabpanel"`. Preserve all-panel rendering.
- **Effort:** Small | **Risk:** Low

### U7: Split `CatalogFilters.tsx` mobile/desktop
- **Files:** `apps/web/src/components/product/CatalogFilters.tsx` (569 lines)
- **Target:** `catalog-filter-options.ts`, `useCatalogFilterUrl.ts`, `MobileCatalogFilters.tsx`, `DesktopCatalogFilters.tsx`, `CatalogFilterChip.tsx`
- **Effort:** Medium | **Risk:** Medium

### U8: Add shared layout primitives
- **Why:** Section containers use 4 different width/padding patterns — future pages drift visually.
- **Files:** Create `apps/web/src/components/ui/PageContainer.tsx`, `SectionShell.tsx`, `NarrowContent.tsx`
- **Effort:** Small | **Risk:** Low

---

## WORKSPACE HYGIENE

> Reference: `workspace/audit/archive/hygiene-audit-20260515/workspace-hygiene-dependency-map-audit-20260515.md`
> Rule: Never touch active business CSVs or running scripts without owner approval.

### WH1: Fix stale `SEO_TODO.md` references in `CLAUDE.md`
- **Why:** `CLAUDE.md` still references `workspace/SEO_TODO.md` (sections 1, 5, 7) — file no longer exists.
- **Files:** `CLAUDE.md` (repo root)
- **Change:** Replace `workspace/SEO_TODO.md` → `workspace/SEO_MASTER.md` in affected sections.
- **Effort:** Trivial | **Risk:** Low | **Interim:** See `workspace/PROJECT_BASELINE.md` section 8

### ~~WH2: Archive completed taxonomy CSVs~~ ✅ DONE 2026-05-15
- Moved 6 pa-* CSVs to `workspace/audit/archive/pa-taxonomy-20260515/`

### ~~WH3: Archive completed mutator scripts~~ ✅ DONE 2026-05-15
- Moved `pa-ingredient-skintype-apply.php`, `fix-wrong-korea-origin-products.php`, and `audit-wrong-korea-origin-products.php` from `workspace/active/scripts/` to `workspace/archive/scripts/`.
- Kept `pa-concern-skin-type-dry-run.php` active as read-only audit.

### WH4: Mark `apps/web/MEMORY.md` as historical
- **Why:** Instructs VPS-first workflow — contradicts current deploy law in `/root/CLAUDE.md`.
- **Change:** Add top-of-file banner pointing to `.agent-memory/MEMORY.md` and `/root/CLAUDE.md`.
- **Effort:** Trivial | **Risk:** Low

### WH5: Update `workspace/docs/ARCHIVE-INDEX.md`
- **Change:** Remove stale script references; add entries for hygiene and layout audit archives.
- **Effort:** Small | **Risk:** None

### WH6: Fix output path in `product-image-brand-size-audit.mjs`
- **Files:** `workspace/scripts/active/product-image-brand-size-audit.mjs`
- **Change:** Default `OUT` from retired `workspace/audit/seo/` → `workspace/audit/active/`
- **Effort:** Trivial | **Risk:** Low

### WH7: Review app-local scripts for archival
- **Files:** `apps/web/scripts/seo-p1-preview.mjs`, `apps/web/scripts/ocr-image-audit.mjs`, `apps/web/scripts/image-logic-fixer.mjs`
- **Change:** If no active owner, move to `workspace/scripts/archive/`. Keep `check-all.sh`, `audit-duplicate-products.mjs` (package.json references).
- **Effort:** Small | **Risk:** Low

---

## DO NOT TOUCH (protected)

- Checkout / cart / payment / order logic — any file touching these needs explicit owner approval
- `_sku`, `_price`, `_stock_quantity` — protected WooCommerce meta
- `apps/web/src/app/api/checkout` — frozen unless a specific approved task exists
- Customer data / order history

---

## Active Branch Convention

- Claude works on: `claude/<feature>-<ticket>`
- Codex works on: `codex/<feature>-<ticket>`
- Merge to `main` only after smoke test passes on VPS
- Never push directly to `main` without a VPS verify-then-publish cycle
