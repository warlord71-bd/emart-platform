# Emart Development Master Task List

Last updated: 2026-05-15
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

### W1: `DetailsTabs` — server-render all tab panels
- **Why:** SEO + LLM readability. Ingredients/how-to-use only renders active tab.
- **Files:** `apps/web/src/components/product/DetailsTabs.tsx`, `apps/web/src/app/shop/[slug]/page.tsx`
- **Change:** Render all panels in HTML; toggle visibility via CSS `hidden` class. No UI change.
- **Effort:** Medium | **Blocks:** SEO H1

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

### W5: `MerchantReturnPolicy` + `priceValidUntil` schema
- **Files:** `apps/web/src/app/shop/[slug]/page.tsx:98-144`
- **Blocked by:** Owner confirming return policy page URL

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

### B1: pa_concern + pa_skin_type assignment — apply
- **Script:** `workspace/scripts/active/pa-concern-skin-type-dry-run.php`
- **Status:** Dry-run done, never applied. Review output then apply with `APPLY=1`.
- **Owner:** Codex or Claude after owner reviews

### B2: SKU assignment — 119 missing products
- **Script:** `workspace/scripts/active/product-sku-audit-dry-run.php`
- **Status:** Blocked — owner needs to provide SKUs for 119 products
- **Owner:** Codex applies after owner provides data

### B3: Product image upload — 16 products
- **File:** `workspace/products-need-real-image.csv`
- **Status:** CSV ready, images not yet uploaded by owner
- **Owner:** Owner uploads images → Codex assigns in WooCommerce

### B4: Fresh product SEO / image audit
- **Script:** `workspace/scripts/active/product-seo-audit.php`
- **Action:** Run read-only. Last run 2026-05-13 (stale after all copy/origin/SKU work).
- **Owner:** Codex or Claude

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
