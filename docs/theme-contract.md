# Emart Theme Contract

This is a polish contract, not a redesign brief. Keep current pages recognizable and preserve live commerce behavior.

## Brand Tokens

- Primary pink: `#e8197a`
- Primary hover: `#c01264`
- Dark text: `#1a1a2e`
- Muted text: `#6b7280`
- Gold/accent: `#d4a248`
- Surface: `#fff`
- Soft surface: `#f8fafc`
- Soft border: `#e5e7eb`

Use the CSS variables in `src/styles/tokens.css`. Do not replace the brand pink with generic Tailwind pink.

## Spacing, Radius, Shadow

- Container x spacing: `--space-container-x`
- Section y spacing: `--space-section-y`
- Radii: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-card`, `--radius-pill`
- Shadows: `--shadow-soft`, `--shadow-card`

Cards should use a restrained border, `--radius-card`, and `--shadow-card`. Page headers should be compact and should not push mobile product grids too far down.

## Commerce Formatting

- BDT format is zero-space: `৳1,500`
- Never use `৳ 1,500`, `Tk 1,500`, or `৳1,500.00` in commerce UI.
- Use English numerals in commerce zones.
- Bangla numerals are reserved for editorial or Bangla content.
- Use `formatBDT`, `formatCommerceNumber`, and `formatDiscountPercent` from `src/lib/formatters.ts`.
- Invalid, null, or undefined prices must not render `৳NaN`.

## ProductCard Rules

- Canonical component: `src/components/product/ProductCard.tsx`
- Allowed variants: `grid`, `compact`, `related`, `carousel`
- Image ratio stays stable across cards.
- Product names must use strict line clamp:
  - grid: `line-clamp-2`
  - compact, related, carousel: `line-clamp-2`; use `line-clamp-3` only when needed.
- Mobile product grids stay high-density with two columns unless an existing layout explicitly needs a rail.
- `priority` may be used only for first/active hero media and the top four immediately rendered above-the-fold homepage product cards.

## Buttons

Use exact casing:

- Add to Cart
- Buy Now
- View All →
- Shop Now
- Subscribe
- Continue Shopping

Add to Cart feedback should be a toast/snackbar with copy `Added to Cart`; do not use a modal for normal cart actions.

## Chips And Badges

Approved badge labels:

- Authentic
- COD
- In Stock
- Sale
- New
- Best Seller

Avoid noisy emoji chips in product and commerce areas. Keep useful text-only chips.

## Trust Strip

Canonical component: `src/components/common/TrustStrip.tsx`

Tiles:

- 100% Authentic
- Fast Bangladesh Delivery
- COD Available
- Easy Support

Do not stack duplicate trust strips throughout the same page.

## Hero And Headers

- Home hero: do not redesign.
- Listing pages: compact consistent headers with container, h1, subtitle, token colors.
- PDP: gallery + meta. Audit and polish only; do not rebuild unless broken.
- Static pages: centered intro.

## PDP Meta

PDP meta may already look good. Only polish casing, spacing, token radius/shadow, BDT formatting, mobile responsiveness, and excessive emoji clutter. Do not remove gallery, title, price, Add to Cart, Buy Now, description, or related products.
