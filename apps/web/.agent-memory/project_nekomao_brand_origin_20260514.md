---
name: Nekomao brand/origin correction
description: Neko Mao products now use the Nekomao brand term and South Korea origin taxonomy
type: project
---

On 2026-05-14, product `38190` (`neko-mao-rejuvenation-premium-gold-brightening-cream`) was corrected in WooCommerce:

- Removed from `product_brand=Skincafe`.
- Assigned to `product_brand=Nekomao` (`slug=nekomao`).
- Existing typo term `product_brand=Nekoma` (`slug=nekoma`, term `9489`) was renamed to `Nekomao` / `nekomao` instead of creating a duplicate brand bucket.
- Assigned `pa_origin=South Korea` and legacy `pa_brand=Neko Mao`.

The existing sibling product `38196` (`neko-mao-whitening-cream-bright-skin`) was already in the typo `Nekoma` bucket and had custom `Origin=Korea` but taxonomy `pa_origin=Japan`; it now uses the renamed `Nekomao` bucket and `pa_origin=South Korea`.

Verification:

- `product_brand=Nekomao` count is `2`.
- `Skincafe` count dropped from `13` to `12`.
- Live product page renders the `Nekomao` brand chip and `South Korea` origin chip.
- `/brands/nekomao` returns `200`; old typo slug `/brands/nekoma` returns `404`.
