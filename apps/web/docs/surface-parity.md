# Surface Parity Audit

Scope: `apps/web` commerce navigation surfaces plus the React Native app present at `apps/mobile`.

## Primary IA

Canonical primary labels:

- Shop
- Categories
- Concerns
- Brands
- Sale
- New Arrivals
- Search
- Cart
- Account

The web header also keeps the existing Origins and Men's entry points because they are already live commerce routes.

## Desktop Mega-Menu

Surface: `src/components/layout/Header.tsx` with groups from `src/lib/category-navigation.ts`.

- Shop: present as the primary `/shop` link.
- Categories: present as the category mega-menu group.
- Concerns: present as the concern mega-menu group.
- Brands: present as the brand mega-menu group.
- Sale: present as `/sale`.
- New Arrivals: present as `/new-arrivals`.
- Search: present in the header search form.
- Cart: present in the utility area with preview.
- Account: present in the utility area.

Parity adjustment made: labels were normalized from uppercase/internal phrasing to customer-facing primary IA labels.

## Mobile Hamburger Drawer

Surface: `src/components/layout/Header.tsx`, `DRAWER_NAV_GROUPS`.

- Shop: present as a quick action.
- Categories: present as the first drawer group.
- Concerns: present as a drawer group.
- Brands: present as a drawer group.
- Sale: present as a quick action.
- New Arrivals: present as a quick action.
- Search: present directly above the drawer trigger in the mobile header.
- Cart: present in the mobile header.
- Account: present as a quick action.

Parity adjustment made: drawer quick-action labels now use Shop, Sale, and New Arrivals consistently.

## Bottom Mobile Tab Bar

Surface: `src/components/layout/Header.tsx`.

Current compact tabs:

- Home
- Shop
- Categories
- Account
- Cart

Parity adjustment made: Browse was renamed to Categories, and Wishlist was replaced with Account to match the primary commerce IA. Wishlist remains available from the desktop utility area and account flow.

## React Native App Navigation

RN app found at `apps/mobile`.

Surface: `apps/mobile/App.js`.

RN bottom tabs:

- Home
- Categories
- Shop
- Cart
- Account

RN supports Search inside Home/Categories/Products screens and Sale/New Arrivals as screen-level entry points. It does not expose Brands and Concerns as standalone bottom tabs; they are grouped inside Categories. External/manual product-owner review is recommended before changing the RN app IA because this job is scoped to `apps/web`.

## Remaining Manual Review

- Confirm whether Origins and Men's should stay as supplemental desktop/mobile drawer entries.
- Confirm whether mobile bottom tab should continue to include Home as a convenience tab while primary commerce IA lives in header/search/drawer.
