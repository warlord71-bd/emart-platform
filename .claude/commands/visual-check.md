Take screenshots of key Emart pages at mobile (390x844) and desktop (1280x900) viewports to visually verify the live site.

Use the Playwright MCP browser tools. For each page:
1. Navigate to the URL
2. Wait for networkidle or domcontentloaded
3. Take a screenshot

## Pages to check (run mobile + desktop for each)

**Core pages:**
- Homepage: `https://e-mart.com.bd/`
- Shop/catalog: `https://e-mart.com.bd/shop`
- PDP (product detail): `https://e-mart.com.bd/shop/cosrx-advanced-snail-96-mucin-power-essence-100ml`
- Category: `https://e-mart.com.bd/category/sunscreen`
- Brands: `https://e-mart.com.bd/brands`

## Workflow
1. First resize to mobile (390x844), take all 5 screenshots
2. Then resize to desktop (1280x900), take all 5 screenshots
3. After each screenshot, briefly note any visual issues: broken layout, overlapping text, missing images, empty sections, cut-off elements
4. At the end, summarize: which pages look good, which have issues, what needs fixing

If the user provides a specific URL as an argument, check only that page at both viewports instead of the full list.
