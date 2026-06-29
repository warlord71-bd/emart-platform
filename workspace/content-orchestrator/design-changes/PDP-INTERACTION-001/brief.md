# PDP-INTERACTION-001 — Richer PDP Visual States

Status: **AWAITING DESIGN FEEDBACK**

## Purpose

Demonstrate richer product-media presentation and interaction feedback without
changing the live product template, cart, checkout or WooCommerce data.

## Included

- Authentic existing Emart product image on a richer editorial backdrop.
- Tap/click product zoom state.
- Wishlist visual state.
- Quantity interaction.
- Simulated add-to-cart loading and success feedback.
- Delivery-zone selector using current Emart delivery wording.
- Expandable authenticity/payment/support explanation.
- Stronger WhatsApp action treatment.
- Keyboard focus states and reduced-motion fallbacks.

## Truth constraints

- Product name and price come from Emart's public product listing.
- No rating, discount, stock count, sold count or countdown is invented.
- Buttons are preview simulations and cannot change commerce data.
- Production route returns 404 unless `ENABLE_DESIGN_PREVIEWS=1` is explicitly set.

## Preview

Local development route: `/design-preview/pdp-interaction`

## Approval

`APPROVE DESIGN: PDP-INTERACTION-001`

Approval authorizes adapting selected visual/interaction patterns into the real
PDP. It does not authorize deployment.
