# Instructions for Baidu Qianfan: The Derma Co Product + Meta Copy

Date: 2026-05-10

## Task

Update product-facing copy and SEO metadata for The Derma Co products so they no longer describe the brand/products as Korean or Korea imports.

## Current policy to follow

- Brand: `The Derma Co`
- Brand slug: `the-derma-co`
- Origin: India
- Public SEO surface: Next.js frontend at `https://e-mart.com.bd`
- Product facts source: WooCommerce/WordPress product data
- Do not edit frontend React/Next.js files for product facts.
- Do not change price, stock, SKU, image, product slug, category, order, checkout, cart, customer, or payment data.
- Do not invent benefits, ratings, reviews, availability, ingredients, or clinical claims.
- Use visible real product data only: product name, brand, current price, stock status, image, categories/concerns, and `pa_origin=India`.

## Data fields to review/update in Woo

For published products with `product_brand=the-derma-co`, review these fields and remove Korean-origin wording:

- `short_description`
- `_rank_math_title`
- `_rank_math_description`
- `_rank_math_focus_keyword` only if it contains wrong origin wording
- `_emart_meta_description` if present
- `_structured_description` if present
- Any visible product description text that says Korea/Korean/K-beauty/Korea import

## Required wording rules

- Replace incorrect phrases like `100% authentic Korea import`, `Korean skincare`, `K-beauty`, or `Korea origin` with India-safe wording.
- Acceptable wording examples:
  - `authentic The Derma Co product`
  - `Indian-origin The Derma Co skincare`
  - `The Derma Co product from India`
  - `available in Bangladesh from Emart`
- Keep Emart public brand wording consistent:
  - Short brand: `Emart`
  - Full brand: `Emart Skincare Bangladesh`
  - Domain: `e-mart.com.bd`

## Meta description template

Use natural product-specific descriptions around 140-160 characters when possible:

`Buy {ProductName} in Bangladesh from Emart. Authentic The Derma Co skincare from India with COD and fast Dhaka delivery.`

If price is included, use current Woo price only. Do not fake sale/offers.

## Done when

- No The Derma Co product metadata or visible product copy says Korea/Korean/K-beauty/Korea import.
- Product pages still use canonical `/shop/{slug}` URLs.
- Product visible origin/PDP chip is India.
- Product schema and Merchant Center-visible facts match visible page facts.
- Output a review CSV before apply, then an apply report after user approval.
