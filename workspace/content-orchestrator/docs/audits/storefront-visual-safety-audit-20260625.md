# Storefront Visual Safety Audit

Date: 2026-06-25 23:16 CEST  
Owner lane: Priority 7 / UX-ORCH-3, UX-ORCH-4, UX-ORCH-8  
Scope: read-only static audit of `apps/web` UI control systems during the July 3 freeze.

## Executive Summary

Emart has strong ecommerce primitives already in place: mobile header, product grid, PDP sticky buy bar, cart drawer, chat widget, WhatsApp CTA, collection headers, and product cards. The risk is not a single broken screen; it is that the storefront now has too many independently styled overlays and control patterns to safely change UI without a repeatable visual/a11y gate.

Recommended next action: build a read-only visual QA harness before broad UI work. The first implementation pass should capture screenshots and accessibility checks for home, shop, category, PDP, search, blog/journal, and campaign/offer slots across mobile and desktop. Fixes should then be batched only where the screenshots prove overlap, focus, or contrast problems.

## Evidence Reviewed

- Global layout mounts `Header`, `RuntimeWidgets`, and `ChatWidget`: `apps/web/src/app/layout.tsx`.
- Runtime widgets mount cart drawer and related client-side services: `apps/web/src/app/runtime-widgets.tsx`.
- Active navigation is concentrated in `apps/web/src/components/layout/Header.tsx`; the older `apps/web/src/components/layout/Navigation.tsx` is not imported by current source search.
- Product-list cards use `apps/web/src/components/product/ProductCard.tsx`.
- PDP structure and buy controls use `apps/web/src/app/shop/[slug]/page.tsx`, `apps/web/src/components/product/ProductInfo.tsx`, and `apps/web/src/components/product/ProductImage.tsx`.
- Cart and assistant overlays use `apps/web/src/components/cart/CartDrawer.tsx` and `apps/web/src/components/chat/ChatWidget.tsx`.
- Design tokens exist in `apps/web/src/styles/tokens.css` and `apps/web/src/app/globals.css`.

Static counts from this pass:

- `159` raw `<button` call sites in `apps/web/src`.
- `0` current source hits for shared `Button` usage/import.
- `205` hardcoded hex/color literal hits across source CSS/TS/TSX.
- `38` arbitrary `rounded-[...]` class hits.
- `30` `fixed`/`sticky` layout hits in TSX.
- No `playwright` package/config in `apps/web`; `axe-core` exists in `node_modules` but is not wired to an app audit script.
- `.playwright-mcp/` contains historical MCP browser artifacts: console logs, accessibility-tree YAML snapshots, and a few PNG captures through 2026-06-23. This is useful evidence but not a repeatable app-owned visual/a11y harness.

## Findings

### P1 - Mobile fixed overlays need one z-index and safe-area contract

Several high-value mobile controls can be present together:

- Header bottom nav: `Header.tsx` uses a fixed bottom mobile nav at `bottom-0`, `z-50`, `h-16`.
- PDP sticky buy bar: `ProductInfo.tsx` uses fixed bars at `bottom-[72px]`, `z-40`.
- Chat assistant: `ChatWidget.tsx` uses fixed assistant controls at `bottom-6`, `right-4`, `z-50`, plus a PDP nudge at `bottom-40`.
- WhatsApp float: `WhatsAppFloat.tsx` uses fixed positioning with `bottom-44` on PDPs and `bottom-24` elsewhere.
- Cart drawer overlay: `CartDrawer.tsx` uses `z-50` for both overlay and drawer.

Risk: on small mobile viewports, these controls can crowd the same bottom-right area. The PDP sticky bar has a thoughtful `bottom-[72px]`, but chat, cart drawer, WhatsApp, and the bottom nav do not share a single registry. This matters commercially because the most important PDP actions are add-to-cart, buy-now, WhatsApp, and chat; overlap or hidden tap targets can reduce conversion.

Fix direction:

- Add a small overlay registry/spec before UI changes: bottom nav height, PDP sticky bar offset, floating support offset, drawer/dialog z-index, safe-area inset policy.
- Screenshot-test PDP with sticky bar visible plus chat closed, chat nudge visible, chat open, WhatsApp float visible, and cart drawer open.
- Do not change checkout/cart behavior in this pass; only measure and then adjust layout offsets if proven.

### P1 - Dialog/drawer semantics are incomplete for keyboard and screen readers

Current overlays are visually clear but not consistently expressed as dialogs:

- `CartDrawer.tsx` closes on Escape and locks body scroll, but the drawer lacks `role="dialog"`, `aria-modal`, labelled title linkage, focus trap, and focus return.
- `Header.tsx` mobile drawer uses a fixed aside and backdrop button, but lacks dialog semantics and focus management.
- `ChatWidget.tsx` full-screen/mobile panel lacks `role="dialog"`/`aria-modal` and focus trap semantics.
- Several icon buttons have labels, which is good, but quantity controls in `CartDrawer.tsx` and `ProductInfo.tsx` rely on visual `+`/minus text without explicit action labels.

Risk: keyboard users can tab behind overlays or lose context. Screen readers may not know that the cart, menu, or chat panel is modal.

Fix direction:

- Add a shared drawer/dialog primitive or a minimal local helper for `role="dialog"`, `aria-modal`, labelled headings, Escape handling, focus initialisation, focus trap, and focus return.
- Give quantity buttons explicit labels such as "Decrease quantity" / "Increase quantity" including product context where available.
- Add keyboard smoke checks to the visual QA harness: open menu, tab through, close, focus returns; open cart, tab through quantity/remove/checkout, close, focus returns; open chat, tab through tabs/input/close.

### P2 - Design-system drift is visible in source structure

The repo has tokens and shared components, but active surfaces bypass them heavily:

- Shared `Button` exists but is unused by current source search.
- `Button.tsx` still describes "Lumiere", not Emart.
- Global CSS defines `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.btn-accent`; product/card surfaces also define one-off button class strings.
- `Header.tsx`, `ProductCard.tsx`, `ProductInfo.tsx`, `CartDrawer.tsx`, `ChatWidget.tsx`, `OffersHub.tsx`, and category components each encode their own radii, colors, shadows, and CTA states.
- `Navigation.tsx` appears to be an older unused navigation implementation, while `Header.tsx` is the active navigation system.

Risk: every future CRO/UI change becomes harder to verify because the same control intent has multiple implementations. This increases visual regression risk and slows Claude/front-end work.

Fix direction:

- Do not mass-refactor during freeze.
- First create a component inventory: primary CTA, secondary CTA, icon button, tab, chip, drawer, product card, collection header, pagination.
- Rename or replace the unused/legacy shared `Button` only after deciding the active Emart button contract.
- Mark unused navigation/design preview components as "legacy/reference" or move them post-freeze if confirmed unused.

### P2 - Product card and PDP controls should become the first visual parity targets

Product cards are the repeated commercial unit, and PDP controls are the high-intent action area.

Evidence:

- `ProductCard.tsx` has robust stable sizing for images/title/price and uses real stock status for add-to-cart disablement.
- PDP `ProductInfo.tsx` has main quantity/ATC/buy-now controls plus two sticky buy-bar variants.
- Main PDP quantity controls use visual `+`/minus buttons; sticky v1/v2 use different CTA styling and different action sets.

Risk: small divergences across card/PDP/sticky controls will create inconsistent buyer expectations. The user may see "Add to Cart", "Buy Now", WhatsApp, and stock/delivery signals styled with different authority levels.

Fix direction:

- Define CTA hierarchy once: primary add-to-cart, secondary buy-now, support WhatsApp, disabled/out-of-stock.
- Screenshot-test product card grid at 360, 390, 768, 1280 widths with long product names, sale price, out-of-stock, and no-rating cards.
- Screenshot-test PDP sticky bar with long product title and sale/regular price.

### P3 - Automated a11y gate is absent

There is no repo-level Playwright/axe script for representative journeys. Prior one-off Playwright screenshots exist under `workspace/audit/active`, and `.playwright-mcp/` has historical MCP snapshots/logs, but neither is a reusable app gate with a route matrix, viewport matrix, interaction states, and deterministic output folder.

Risk: accessibility regressions are found only by manual review, especially around modal focus, contrast, and keyboard tab order.

Fix direction:

- Add a read-only script that runs against a supplied base URL and never mutates data.
- Use Chromium + axe injection on representative URLs, or wrap the existing Playwright MCP workflow if the active agent has that MCP tool available.
- Store screenshots/reports under `workspace/audit/active/visual-a11y-YYYYMMDD-HHMM/`.
- Make failures advisory at first: missing labels, focus traps, contrast, and offscreen/overlap checks should produce an owner-readable report before they block deploys.

## Proposed Screenshot Matrix

Viewports:

- Mobile small: `360x740`
- Mobile common: `390x844`
- Tablet: `768x1024`
- Desktop: `1366x900`

Routes:

- `/`
- `/shop`
- `/category/korean-beauty`
- `/concerns/sunscreen`
- `/search?q=sunscreen`
- A known in-stock PDP, for example `/shop/<known-live-product-slug>`
- A known out-of-stock PDP if available
- `/blog`
- `/offers`

States:

- Default page at top.
- Page scrolled to first product grid.
- Mobile menu open.
- Cart drawer open.
- Chat closed, chat nudge visible, chat open.
- PDP sticky buy bar visible.
- Product grid with first product focused.

Checks:

- No horizontal overflow.
- No fixed overlay collision in bottom 180px on mobile.
- Main CTA visible and tappable.
- Sticky header does not cover anchors/headings.
- Product card text remains inside card boundaries.
- Drawer/dialog focus is trapped and returns to opener.
- Axe critical/serious violations are reported with route and screenshot.

## Recommended Implementation Order

1. Add `visual-a11y-audit` as a read-only workspace script that accepts `BASE_URL` and output directory.
2. Add static route/state config in JSON so Claude/Codex can extend it without editing the runner.
3. Capture baseline screenshots for the matrix above against local or live with explicit owner-approved timing.
4. Fix only P1 overlay/dialog issues proven by the baseline.
5. Create a design-system adoption plan for CTA/button/card primitives; defer broad refactors until after the freeze unless the change is visually neutral and screenshot-proven.

## Task-Board Status Recommendation

Do not mark Priority 7 complete yet.

- UX-ORCH-3: partial. Matrix and risk model defined; screenshots not captured by a reusable harness yet.
- UX-ORCH-4: partial. Drift measured and priority targets identified; no governance/enforcement yet.
- UX-ORCH-8: partial. A11y gate requirements defined; no automated axe/keyboard gate yet.

Claude capability note: implementation should likely be a Claude-led frontend/tooling pass because it touches browser automation, possible UI focus management, and build/lint/screenshot verification. Codex can support with static inventories and report generation.
