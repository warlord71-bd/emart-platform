# HP-OFFER-001 — Homepage Offer Rail Pilot

Status: **AWAITING DESIGN APPROVAL**

## Goal

Test the unified Claude DesignSync + Codex visual workflow on the current
homepage offer-collection rail without changing the production homepage.

## Invariants

- Keep the existing `OFFER_COLLECTIONS` labels, URLs and availability.
- Use Emart's real rose accent (`#9f1239`), typography and spacing tokens.
- Remain mobile-first and usable with keyboard navigation.
- Respect reduced-motion preferences and avoid automatic animation.
- Do not change product, offer, price, checkout or WooCommerce data.
- Do not deploy a visible design before explicit owner approval.

## Variants

- **A — Refined current rail:** lowest-risk evolution with richer card feedback.
- **B — Compact deal navigator:** quickest scanning and smallest mobile footprint.
- **C — Featured offer spotlight:** one campaign-led card plus supporting shortcuts.

## Preview

Local development route: `/design-preview/home-offer-rail`

Production behavior: returns 404 unless `ENABLE_DESIGN_PREVIEWS=1` is explicitly
set. The preview route has `noindex, nofollow` metadata.

## Approval commands

Approve implementation only:

`APPROVE DESIGN: HP-OFFER-001 VARIANT A|B|C`

Request revision:

`REVISE DESIGN: HP-OFFER-001 — <requested change>`

Deployment requires a separate command after implementation verification:

`APPROVE DEPLOY: HP-OFFER-001`
