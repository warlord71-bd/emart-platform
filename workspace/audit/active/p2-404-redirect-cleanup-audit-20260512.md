# P2 404 And Redirect Cleanup Audit - 2026-05-12

Scope: read-only Week 2 SEO audit for valuable GSC `Not found (404)` and `Page with redirect` URLs. No app code, Woo data, checkout/cart/payment/order, product price/stock/SKU/image, mobile app, deploy, or push was touched.

## Export / Source Used

Raw exports were kept outside the repo under `/tmp/gsc-p2-export/`.

| Source | Metadata issue | Rows |
| --- | --- | ---: |
| Owner-provided GitHub `Chart.csv`, `Metadata.csv`, `Table.csv`; copied to `/tmp/gsc-p2-export/` | `Not found (404)` | 1,000 |
| Owner-provided GitHub `404 redirect.xlsx`; copied to `/tmp/gsc-p2-export/` | `Page with redirect` | 1,000 |

Note: the raw export files appear to be available from GitHub, but this audit did not add or modify raw CSV/XLSX files. Only this Markdown report belongs in the repo.

## Totals

| Metric | Count |
| --- | ---: |
| Total export rows analyzed | 2,000 |
| `Not found (404)` rows | 1,000 |
| `Page with redirect` rows | 1,000 |
| Live-tested sample URLs | 245 |

## Pattern Counts

### Not Found (404)

| Pattern | Rows |
| --- | ---: |
| old `/product/*` | 866 |
| old `/product-category/*` | 47 |
| current `/brands/*` | 41 |
| old dated blog path | 15 |
| current `/shop/*` | 7 |
| current `/category/*` | 6 |
| old `/product-tag/*` | 6 |
| other/static/spam | 5 |
| query/parameter URL | 5 |
| old `/brand/*` | 2 |

### Page With Redirect

| Pattern | Rows |
| --- | ---: |
| old `/product/*` | 505 |
| current `/shop/*` | 214 |
| query/parameter URL | 176 |
| old `/product-tag/*` | 81 |
| other/static/spam | 11 |
| old `/product-category/*` | 7 |
| current `/category/*` | 6 |

## Live-Test Classification Counts

| Class | Meaning | Count |
| --- | --- | ---: |
| A | already fixed, waiting for Google | 137 |
| B | still live issue | 1 |
| C | intentionally excluded/noindex/blocked | 2 |
| D | old junk URL | 45 |
| E | important URL needing action | 60 |

| Bucket | A | B | C | D | E |
| --- | ---: | ---: | ---: | ---: | ---: |
| Not found (404) | 27 | 0 | 0 | 45 | 60 |
| Page with redirect | 110 | 1 | 2 | 0 | 0 |

## Live-Tested Sample Table

| Bucket | URL | Chain / Final | Canonical | Robots | Sitemap | Type | Value | Class |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 404 | `/shop/kaine_kombu-hydrating-daily-cleanser-155g` | `404` | none | `noindex` | absent | product | yes | E |
| 404 | `/shop/dr-ceuracle-5α-control-no-sebum-sun-lotion-spf50-pa-50g` | `404` | none | `noindex` | absent | product | yes | E |
| 404 | `/shop/b_lab-matcha-hydrating-real-sun-stick-21g` | `404` | none | `noindex` | absent | product | yes | E |
| 404 | `/shop/round-lab-eng-1025-dokdo-ampule_45g` | `404` | none | `noindex` | absent | product | yes | E |
| 404 | `/brands/a-pieu` | `404`; replacement `/brands/apieu` is live | none | `noindex` | absent | brand | yes | E |
| 404 | `/brands/i'm-from` | `404`; sitemap has `/brands/i-am-from` | none | `noindex` | absent | brand | yes | E |
| 404 | `/brands/aztec` | `404`; sitemap has `/brands/aztec-secret` | none | `noindex` | absent | brand | yes | E |
| 404 | `/brands/paula-s` | `404`; sitemap has `/brands/paulas-choice` | none | `noindex` | absent | brand | yes | E |
| 404 | `/category/skincare/melasma/` | `308 -> 404`; sitemap has `/category/melasma` | none | `noindex` | absent | category | yes | E |
| 404 | `/product-category/hair-care/hair-oil/?filter_brand=rohto-mentholatum` | `301 -> /category/hair-care/hair-oil -> 404`; sitemap has `/category/hair-oil` | none | `noindex` | absent | category | yes | E |
| 404 | `/2023/03/26/unveil-the-magic-of-cosrx-for-acne-prone-sensitive-skin-discover-your-ultimate-skin-savior/` | `308 -> 404`; `/blog/...` replacement is live | none | `noindex` | absent | blog | yes | E |
| 404 | `/faq-FAQ` | `404`; replacement `/faq` is live | none | `noindex` | absent | static | yes | E |
| 404 | `/home/` | `308 -> 404`; replacement `/` is live | none | `noindex` | absent | static | yes | E |
| 404 | `/product/freeman-deep-clearing-manuka-honey-with-tea-tree-clay-mask-15ml/` | `301 -> /shop/... -> 404` | none | `noindex` | absent | old Woo product | no clear replacement | D |
| 404 | `/product-category/on-sale/` | `301 -> /category/on-sale -> 404` | none | `noindex` | absent | old category | no clear replacement | D |
| 404 | `/product-tag/acne-pimple-master-patch/` | `308 -> /shop -> 200` | `/shop` | `index, follow` | present | old tag | no | A |
| Redirect | `/product/simple-refreshing-facial-wash-150ml/` | `301 -> /shop/simple-refreshing-facial-wash-150ml -> 200` | clean product URL | `index, follow` | present | old Woo product | yes | A |
| Redirect | `/product/the-face-shop-the-therapy-vegan-blending-toner-100ml/?add-to-cart=3446` | `301 -> /shop/... -> 200` | clean product URL | `index, follow` | present | query/product | yes | A |
| Redirect | `/shop/innisfree-retinol-cica-repair-ampoule-7ml-mini/` | `308 -> no-slash /shop/... -> 200` | clean product URL | `index, follow` | present | product | yes | A |
| Redirect | `/product-tag/snail/?filter_brand=mary-may` | `308 -> /shop -> 200` after latest query cleanup | `/shop` | `index, follow` | present | old tag | no | A |
| Redirect | `/category/lip-care/` | `308 -> /category/lip-care -> 200` | `/category/lip-care` | `noindex, follow` | absent | category | yes | B |
| Redirect | `/product-category/lip-care/` | `301 -> /category/lip-care -> 200` | `/category/lip-care` | `noindex, follow` | absent | old category | no | C |

## Important URLs Needing Redirect / Restore

### Product / Shop URLs

These are current-looking product URLs returning 404. Do not restore or redirect blindly; verify product identity first.

| Source URL | Likely target / action |
| --- | --- |
| `/shop/kaine_kombu-hydrating-daily-cleanser-155g` | High confidence slug normalization to `/shop/kaine-kombu-hydrating-daily-cleanser-155g`. |
| `/shop/dr-ceuracle-5α-control-no-sebum-sun-lotion-spf50-pa-50g` | High confidence slug normalization to `/shop/dr-ceuracle-5alpha-control-no-sebum-sun-lotion-spf50-pa-50g`. |
| `/shop/b_lab-matcha-hydrating-real-sun-stick-21g` | High confidence slug normalization to `/shop/b-lab-matcha-hydrating-real-sun-stick-21g`. |
| `/shop/round-lab-eng-1025-dokdo-ampule_45g` | High confidence slug normalization to `/shop/round-lab-eng-1025-dokdo-ampule-45g`. |
| `/shop/jumiso-all-day-pure-c-5-5-serum-30ml` | Possible replacement `/shop/jumiso-all-day-vitamin-pure-c-5-5-glow-serum-30ml`; owner/product review needed. |
| `/shop/paulas-choice-skin-perfecting-2-bha-liquid-exfoliant-118ml` | Possible replacement `/shop/paulas-choice-skin-perfecting-2-bha-liquid-exfoliant-30ml`; size differs, owner/product review needed. |
| `/shop/page/2/` | Old pagination form; redirect to `/shop?page=2` or clean `/shop` after deciding pagination policy. |

### Brand Alias URLs

High-confidence brand aliases should be handled with direct 301s if owner agrees.

| Source URL | Likely target |
| --- | --- |
| `/brands/a-pieu` | `/brands/apieu` |
| `/brands/i'm-from` | `/brands/i-am-from` |
| `/brands/i-m-from` | `/brands/i-am-from` |
| `/brands/aztec` | `/brands/aztec-secret` |
| `/brands/paula-s` | `/brands/paulas-choice` |
| `/brands/wskin` | `/brands/wskinlab` |
| `/brands/purito` | `/brands/purito-seoul` |
| `/brands/lucido` | `/brands/lucido-l` |
| `/brands/tresemm` | `/brands/tresemme` |
| `/brands/absolute` | `/brands/absolute-new-york` |
| `/brands/bath` | `/brands/bath-and-body-works` |
| `/brands/house` | `/brands/house-of-hur` |
| `/brands/valencia` | `/brands/valencia-gio` |

Brand URLs such as `/brands/japanese`, `/brands/green`, `/brands/sensitive`, `/brands/the`, `/brands/beauty`, and `/brands/daily` look ambiguous or taxonomy-noise-like. Do not redirect them without performance/backlink evidence.

### Category URLs

| Source URL | Likely target / action |
| --- | --- |
| `/category/skincare/melasma/` | `/category/melasma` |
| `/category/skincare/acne/` | `/category/acne-blemish-care` |
| `/category/skincare/j-beauty-skincare/` | Likely `/category/japanese-beauty`; owner review. |
| `/category/skincare/korean-skincare-routine/` | Likely `/category/korean-beauty`; owner review. |
| `/product-category/hair-personal-care/bath-body/` | `/category/bath-body` |
| `/product-category/hair-care/hair-oil/` | `/category/hair-oil` |
| `/product-category/health-wellbeing/general-health/` | `/category/general-health` |
| `/product-category/skincare-essentials/physical-mineral-sunscreen/` | Likely `/category/sunscreen`; owner review. |

`/category/top-cosmetics-ingredients/` and `/category/life-style/` look like old blog/content categories rather than product listing categories. Do not create indexable category pages for them unless there is a current content strategy.

### Blog / Static URLs

The 404 sample included 15 old dated blog paths. Fourteen had a live `/blog/<slug>` replacement during candidate checks; one feed URL is junk. A dated-post redirect rule or explicit redirect list would recover these if the old posts matter.

Static candidates:

| Source URL | Likely target |
| --- | --- |
| `/faq-FAQ` | `/faq` |
| `/home/` | `/` |
| `/about-us-3/` | likely `/our-story` or `/authenticity`; owner/content review needed. |

## Junk URLs Safe To Age Out

- Most sampled 404-bucket old `/product/*` rows ended at `/shop/<old-slug>` 404 with no obvious replacement. Do not chase all 866 old product rows.
- Old feed URLs, old webpc passthrough URLs, and backend-like static image helper URLs are junk.
- Ambiguous one-word brand-looking paths like `/brands/the`, `/brands/beauty`, `/brands/green`, and `/brands/sensitive` should age out unless GSC performance or backlinks prove value.
- Old `/product-category/*` paths with no current category equivalent should age out.
- Query/action URLs that now redirect to clean canonical pages in the redirect bucket are already consolidated.

## Exact Files / Data Areas To Inspect Later

- `apps/web/next.config.js` - best first place for explicit high-confidence 301 redirects for stale product, brand, category, blog, static, and legacy URL aliases.
- `apps/web/src/middleware.ts` - query cleanup and old pagination normalization if `/shop/page/2/` should become `/shop?page=2` or `/shop`.
- `apps/web/src/app/shop/[slug]/page.tsx` - only inspect if current product URLs unexpectedly 404 despite Woo products existing.
- `apps/web/src/app/brands/[slug]/page.tsx` and brand/Woo taxonomy data - inspect if brand aliases should be resolved through a reusable alias map rather than many one-off redirects.
- `apps/web/src/app/category/[...slug]/page.tsx` and category/Woo taxonomy data - inspect if noindex category pages like `/category/lip-care` should be indexable.
- `apps/web/src/app/sitemap.ts` - inspect only if a final canonical 200 URL should be indexable but is absent from sitemap.
- Woo product/brand/category data - dry-run/review only, if owner chooses restore/data correction instead of redirect.

## Recommended Next Action

1. Do not chase every 404. Start with the high-confidence redirect set: slug-normalized product URLs, clear brand aliases, clear category aliases, `/faq-FAQ`, `/home/`, and dated blog paths that map to live `/blog/<slug>` pages.
2. Owner-review ambiguous product size swaps and ambiguous brand/category terms before any redirect.
3. Review `/category/lip-care`: it returns `200` but `noindex, follow` and is absent from sitemap. If it has real products and commercial value, make it indexable/sitemap-eligible; otherwise keep it excluded.
4. After fixes, rerun the same P2 sample and request GSC validation only for valuable URLs.
