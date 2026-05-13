# WooCommerce Category Taxonomy Status

Generated: 2026-05-13  
Purpose: Reference for all AI agents (Claude, Codex) so no one mistakenly assigns products to deprecated categories, creates new pages for them, or builds filters using them.

---

## RULE FOR ALL AGENTS

> **Never use a DEPRECATED or REDIRECTED category as a source of truth for frontend filtering, pa_concern mapping, concern chip display, shop filter logic, or sitemap inclusion.**
>
> The WooCommerce taxonomy record stays (products may still be assigned) but the PUBLIC URL is gone — redirected elsewhere. Treat these as backend-only legacy records.

---

## REDIRECTED — Public URL no longer exists (301 in next.config.js)

These categories have a live 301 redirect. Their `/category/slug` pages are dead. Do NOT:
- Link to them from nav, sitemap, or internal links
- Build new frontend filters using them as category slugs
- Assign new products to them with the expectation of frontend display

| Slug | Products | Redirects To | Reason |
|------|------:|---|---|
| `shop-by-concern` | 2,162 | `/concerns` | Old WooCommerce concern hub, replaced by `/concerns/` pages |
| `acne-blemish-care` | 478 | `/concerns/acne-blemish-care` | Superseded by concern SEO page |
| `anti-aging-repair` | 338 | `/concerns/anti-aging-repair` | Superseded by concern SEO page |
| `dryness-hydration` | 820 | `/concerns/dryness-hydration` | Superseded by concern SEO page |
| `pores-oil-control` | 197 | `/concerns/pores-oil-control` | Superseded by concern SEO page |
| `melasma` | 346 | `/concerns/melasma` | Superseded by concern SEO page |
| `brightening` | ~0 | `/concerns/brightening` | Superseded by concern SEO page |
| `wrinkle` | ~0 | `/concerns/wrinkle` | Superseded by concern SEO page |
| `sensitivity` | ~0 | `/concerns/sensitivity` | Superseded by concern SEO page |
| `skincare-essentials` | 2,257 | `/shop` | Too broad, no specific SEO value as a category |
| `k-beauty-j-beauty` | 1,478 | `/category/korean-beauty` | Duplicate — Korean Beauty is the canonical page |
| `shooting-gel` | 41 | `/category/soothing-gel` | Typo slug — the correct slug is `soothing-gel` |

**Note on PDP concern chips**: Even though the category URLs are redirected, the PDP still reads product category assignments to show concern chips. This is intentional — the WooCommerce taxonomy membership drives chips, not the public URL. When category data is clean, chips will be accurate.

---

## BACKEND-ONLY GROUPING — No nav link, no standalone SEO value

These categories exist in WooCommerce as parent/grouping nodes. They have a dynamic `/category/[slug]` page (returns 200) but are NOT linked from any frontend nav, and have no unique SEO value beyond listing products.

| Slug | Products | Status | Notes |
|------|------:|---|---|
| `hair-personal-care` | 429 | Backend parent only | Groups hair subcategories. Nav links to subcategories directly. |
| `makeup-cosmetics` | 389 | Backend parent only | Groups makeup subcategories. Nav links to subcategories directly. |
| `health-wellbeing` | 61 | Backend parent only | Groups supplements/general health. |
| `mother-baby-care` | 27 | Backend parent only | Groups baby subcategories. |
| `korean-beauty` | 1,397 | Active (mobile chip) | `/category/korean-beauty` is live and linked from mobile chips. Keep. |
| `japanese-beauty` | 78 | Active (no chip) | Valid category page, indexed. No nav chip currently. |

---

## EMPTY OR NEAR-EMPTY — Do not use, do not assign

These categories have 0 or near-0 products and no frontend utility:

| Slug | Count | Action |
|------|------:|---|
| `conditioner` | 0 | Already noindex via empty-category logic. Use `hair-conditioners` instead. |
| `eye-makeup` | 0 | Empty. Use `eyes` or `mascara-eyeliner`. |
| `lip-care` | 0 | Empty. Use `lips` or `lip-balm-care`. |
| `sleeping-masks` | 0 | Empty. Use `face-masks`. |
| `shaving-gel-foam` | 0 | Empty. |
| `moms-corner` | 0 | Empty. |
| `eye-shadow` | 8 | Near-empty. Use `eyes`. |
| `face-primer` | 1 | Near-empty. Use `face-makeup`. |
| `hair-essence-serum` | 3 | Near-empty. Use `hair-treatments`. |
| `shampoo` | 1 | Duplicate of `shampoos`. Use `shampoos`. |
| `dry-sensitive-sunscreen` | 0 | Sub-filter sunscreen, empty. |
| `oily-acne-skin-sunscreen` | 0 | Sub-filter sunscreen, empty. |
| `physical-mineral-sunscreen` | 0 | Sub-filter sunscreen, empty. |
| `weight-management` | 0 | Empty. |
| `general-health` | 1 | Near-empty. |
| `baby-bath-wash` | 3 | Near-empty. |

---

## ACTIVE — Frontend nav, sitemap, and SEO pages

These categories are fully live. Products should be assigned here for frontend visibility.

### Skincare (under `skincare-essentials`)
| Slug | Products | Frontend |
|------|------:|---|
| `serums-ampoules-essences` | 624 | ✅ Nav + category page |
| `face-cleansers` | 218 | ✅ Nav + category page |
| `toners-mists` | 197 | ✅ Nav + category page |
| `face-masks` | 64 | ✅ Nav + category page |
| `sunscreen` | 301 | ✅ Nav chip + category page |
| `eye-care` | 72 | ✅ Nav + category page |
| `spot-treatment` | 13 | ✅ Category page |
| `toner-pads` | 14 | ✅ Category page |
| `night-cream` | 15 | ✅ Category page |
| `cream-moisturizer` | 21 | ✅ Category page |
| `wash-off-mask` | 18 | ✅ Category page |
| `skincare-kit-set` | 27 | ✅ Category page |

### Hair & Personal Care
| Slug | Products | Frontend |
|------|------:|---|
| `shampoos` | 112 | ✅ Nav + category page |
| `hair-conditioners` | 17 | ✅ Nav + category page |
| `hair-treatments` | 31 | ✅ Nav + category page |
| `hair-oil` | 39 | ✅ Nav + category page |
| `hair-styling-products` | 5 | ✅ Nav + category page |
| `personal-hygiene` | 31 | ✅ Category page |
| `body-lotion` | 79 | ✅ Nav + category page |
| `body-wash` | 49 | ✅ Nav + category page |
| `body-oil` | 2 | ✅ Category page |
| `bath-body` | 142 | ✅ Category page |
| `hand-care` | 14 | ✅ Category page |

### Makeup (under `makeup-cosmetics`)
| Slug | Products | Frontend |
|------|------:|---|
| `foundation` | 70 | ✅ Nav + category page |
| `lips` | 123 | ✅ Nav + category page |
| `lipstick-tint` | 80 | ✅ Category page |
| `lip-balm-care` | 43 | ✅ Category page |
| `eyes` | 35 | ✅ Category page |
| `mascara-eyeliner` | 27 | ✅ Category page |
| `makeup-remover` | 90 | ✅ Category page |
| `face-makeup` | 65 | ✅ Category page |
| `fragrances` | 62 | ✅ Category page |
| `setting-spray` | 9 | ✅ Category page |

### Origin / Market
| Slug | Products | Frontend |
|------|------:|---|
| `korean-beauty` | 1,397 | ✅ Mobile chip + category page |
| `japanese-beauty` | 78 | ✅ Category page (no chip) |

### Other
| Slug | Products | Frontend |
|------|------:|---|
| `emart-combos` | 71 | ✅ Nav chip + category page |
| `mother-baby-care` | 27 | ✅ Category page |
| `baby-skincare` | 18 | ✅ Category page |
| `baby-bath-wash` | 3 | ✅ Category page (small) |
| `beauty-supplements` | 60 | ✅ Category page |
| `diapers-wipes` | 6 | ✅ Category page |
| `hair-colors` | 11 | ✅ Category page |
| `soothing-gel` | 41 | ✅ Category page (was `shooting-gel`) |

---

## CONCERN SYSTEM — How it works now

The concern system has TWO layers:

1. **Public SEO pages**: `/concerns/[slug]` — these are the canonical concern pages, built in `lib/concerns.ts`, served from `app/concerns/[slug]/page.tsx`. These use WooCommerce category IDs internally to fetch products, but the URL is clean and concern-specific.

2. **PDP Concern chips**: `ProductInfo.tsx` reads `product.categories` and maps certain category slugs to concern labels. The old concern category slugs (`acne-blemish-care`, `anti-aging-repair`, etc.) still drive this chip display even though their public URLs are redirected.

3. **Shop concern filter**: `app/shop/page.tsx` — when `?concern=acne-blemish-care` is set, it resolves to the WooCommerce category ID for `acne-blemish-care` and uses it for product filtering. The WooCommerce category backend record is still used — only the public `/category/` URL is gone.

**Do NOT remove products from these concern categories.** The categories are backend-only now but still drive the concern system. Only the public URL is redirected.

---

## pa_concern Attribute (id=10)

- Created 2026-05-13 with 9 terms matching the concern definitions.
- Currently 0 products assigned (batch was stopped because old category assignments are dirty).
- **Do NOT assign via old WooCommerce category membership.** The old concern categories have wrong products in them (hair/body products mixed with skincare).
- Correct assignment approach: keyword/ingredient-based mapping reviewed by owner, OR clean the category assignments first.
