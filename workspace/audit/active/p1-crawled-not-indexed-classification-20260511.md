# P1 Crawled Currently Not Indexed Classification - 2026-05-11

Scope: read-only Week 2 SEO P1 audit using the provided GSC export CSVs downloaded to `/tmp/gsc-p1-export`. Raw CSVs were not copied into the repo.

## Export Metadata

| Field | Value |
| --- | --- |
| Issue | Crawled - currently not indexed |
| Sitemap | All known pages |
| Rows analyzed | 1,035 |
| Live-tested URLs | 106 |

## Pattern Counts

| Pattern | Count |
| --- | ---: |
| root query junk | 409 |
| old /product/* | 346 |
| current /shop/* product | 113 |
| policy/static/other | 44 |
| current /brands/* | 43 |
| old /product-tag/* | 37 |
| old /product-category/* | 19 |
| _next/static | 12 |
| current /category/* | 6 |
| old /product-brand/* | 6 |

## Live-Test Classification Counts

| Class | Meaning | Count |
| --- | --- | ---: |
| A | already fixed, waiting for Google | 61 |
| B | still live issue | 0 |
| C | intentionally excluded/noindex/blocked | 0 |
| D | old junk URL | 43 |
| E | important URL needing action | 2 |

Note: current-pattern 404s are normalized to `E` in this report even when the page returns `noindex`, because `/shop/*` and `/brands/*` URLs may need product/brand owner review. Old product URLs ending at 404 are classified as `D` unless GSC performance proves they are commercially important.

## Important `/shop/*` Or `/brands/*` URLs Needing Action

| URL | Final status | Robots | Sitemap | Recommendation |
| --- | ---: | --- | --- | --- |
| https://e-mart.com.bd/shop/cosrx-advanced-snail-96-mucin-power-essence-30ml-mini | 404 | noindex | absent | Check whether this product/brand should exist; restore/redirect if valuable, otherwise let 404/noindex age out. |
| https://e-mart.com.bd/brands/april-skin | 404 | noindex | absent | Check whether this product/brand should exist; restore/redirect if valuable, otherwise let 404/noindex age out. |

## Junk URL Patterns Safe To Ignore Or Already Handled

- add-to-cart/add_to_cart URLs strip to clean product/home/shop URLs.
- old /product/* URLs generally 301 to /shop/*; removed products can end at 404/noindex.
- old /product-tag/* URLs redirect to /shop, but filter params can leave indexable /shop?filter_brand or /shop?per_row variants.
- old /product-category/* and /product-brand/* are legacy archive patterns; sample mostly old junk or redirects.
- _next/static font URLs are static assets and not index targets.
- feed URLs, /brand/*, /tag/*, /my-orders, manifest, and old APK/static paths belong in policy/static/other review bucket.

## Live-Tested Sample Table

| Group | URL | Chain | Final | Canonical | Robots | Sitemap | Type | Class |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 20 current /shop/* product URLs | /shop/anua-7-rice-ceramide-hydrating-barrier-serum-50ml | 200 | 200 /shop/anua-7-rice-ceramide-hydrating-barrier-serum-50ml | /shop/anua-7-rice-ceramide-hydrating-barrier-serum-50ml | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/beauty-of-joseon-relief-sun-aqua-fresh-rice-b5-50ml | 200 | 200 /shop/beauty-of-joseon-relief-sun-aqua-fresh-rice-b5-50ml | /shop/beauty-of-joseon-relief-sun-aqua-fresh-rice-b5-50ml | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/bellflower-red-ginseng-66-serum-30ml | 200 | 200 /shop/bellflower-red-ginseng-66-serum-30ml | /shop/bellflower-red-ginseng-66-serum-30ml | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/cosrx-advanced-snail-96-mucin-power-essence-30ml-mini | 404 | 404 /shop/cosrx-advanced-snail-96-mucin-power-essence-30ml-mini | (none) | noindex | absent | /shop/* product | E |
| 20 current /shop/* product URLs | /shop/holika-holika-damage-care-treatment-200ml | 200 | 200 /shop/holika-holika-damage-care-treatment-200ml | /shop/holika-holika-damage-care-treatment-200ml | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/innisfree-black-tea-youth-enhancing-ampoule-30-ml-2 | 308->/shop/innisfree-black-tea-youth-enhancing-ampoule-30-ml > 200 | 200 /shop/innisfree-black-tea-youth-enhancing-ampoule-30-ml | /shop/innisfree-black-tea-youth-enhancing-ampoule-30-ml | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/innisfree-intensive-long-lasting-sunscreen-spf50-pa-2 | 200 | 200 /shop/innisfree-intensive-long-lasting-sunscreen-spf50-pa-2 | /shop/innisfree-intensive-long-lasting-sunscreen-spf50-pa-2 | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/isntree-hyaluronic-acid-moist-cream-100ml-3-38-fl-oz | 200 | 200 /shop/isntree-hyaluronic-acid-moist-cream-100ml-3-38-fl-oz | /shop/isntree-hyaluronic-acid-moist-cream-100ml-3-38-fl-oz | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/isntree-onion-newpair-booster-shot-2000-50ml | 200 | 200 /shop/isntree-onion-newpair-booster-shot-2000-50ml | /shop/isntree-onion-newpair-booster-shot-2000-50ml | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/keli-compressed-sheet-mask-chocolate-mask-01-pcs | 200 | 200 /shop/keli-compressed-sheet-mask-chocolate-mask-01-pcs | /shop/keli-compressed-sheet-mask-chocolate-mask-01-pcs | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/lmltop-soft-cotton-pads-150pcs | 200 | 200 /shop/lmltop-soft-cotton-pads-150pcs | /shop/lmltop-soft-cotton-pads-150pcs | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/marymay-rose-hyaluronic-hydra-wash-off-pack-125g | 200 | 200 /shop/marymay-rose-hyaluronic-hydra-wash-off-pack-125g | /shop/marymay-rose-hyaluronic-hydra-wash-off-pack-125g | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/nivea-sun-protect-super-water-gel-sunscreen-spf50-pa-125g-refill-pack | 200 | 200 /shop/nivea-sun-protect-super-water-gel-sunscreen-spf50-pa-125g-refill-pack | /shop/nivea-sun-protect-super-water-gel-sunscreen-spf50-pa-125g-refill-pack | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/purito-wonder-releaf-centella-toner-unscented-30ml-mini | 200 | 200 /shop/purito-wonder-releaf-centella-toner-unscented-30ml-mini | /shop/purito-wonder-releaf-centella-toner-unscented-30ml-mini | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/ryo-vegan-hair-dye-cream-soft-black-3-0 | 200 | 200 /shop/ryo-vegan-hair-dye-cream-soft-black-3-0 | /shop/ryo-vegan-hair-dye-cream-soft-black-3-0 | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/skin1004-madagascar-centella-tea-trica-bha-foam-cleanser-125ml | 200 | 200 /shop/skin1004-madagascar-centella-tea-trica-bha-foam-cleanser-125ml | /shop/skin1004-madagascar-centella-tea-trica-bha-foam-cleanser-125ml | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/some-by-mi-aha-bha-pha-calming-body-lotion-200ml | 200 | 200 /shop/some-by-mi-aha-bha-pha-calming-body-lotion-200ml | /shop/some-by-mi-aha-bha-pha-calming-body-lotion-200ml | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/the-derma-co-snail-peptide-96-under-eye-repair-cream-15g | 200 | 200 /shop/the-derma-co-snail-peptide-96-under-eye-repair-cream-15g | /shop/the-derma-co-snail-peptide-96-under-eye-repair-cream-15g | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/w-skin-laboratory-a-m-boosting-serum-30-ml | 200 | 200 /shop/w-skin-laboratory-a-m-boosting-serum-30-ml | /shop/w-skin-laboratory-a-m-boosting-serum-30-ml | index, follow | present | /shop/* product | A |
| 20 current /shop/* product URLs | /shop/wishcare-niacinamide-oil-balance-fluid-sunscreen-spf-50-pa | 200 | 200 /shop/wishcare-niacinamide-oil-balance-fluid-sunscreen-spf-50-pa | /shop/wishcare-niacinamide-oil-balance-fluid-sunscreen-spf-50-pa | index, follow | present | /shop/* product | A |
| 20 old /product/* URLs | /product/3w-clinic-rose-eye-cream-40ml/ | 301->/shop/3w-clinic-rose-eye-cream-40ml > 200 | 200 /shop/3w-clinic-rose-eye-cream-40ml | /shop/3w-clinic-rose-eye-cream-40ml | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/aromatica-rosemary-scalp-scrub-165g/ | 301->/shop/aromatica-rosemary-scalp-scrub-165g > 200 | 200 /shop/aromatica-rosemary-scalp-scrub-165g | /shop/aromatica-rosemary-scalp-scrub-165g | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/aveeno-baby-soothing-hydration-creamy-oil-141ge/ | 301->/shop/aveeno-baby-soothing-hydration-creamy-oil-141ge > 404 | 404 /shop/aveeno-baby-soothing-hydration-creamy-oil-141ge | (none) | noindex | absent | /product/* | D |
| 20 old /product/* URLs | /product/cosrx-hyaluronic-acid-hydra-power-essence-100ml/ | 301->/shop/cosrx-hyaluronic-acid-hydra-power-essence-100ml > 200 | 200 /shop/cosrx-hyaluronic-acid-hydra-power-essence-100ml | /shop/cosrx-hyaluronic-acid-hydra-power-essence-100ml | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/dabo-phyto-cica-b5-o2-deep-cleanser-200-ml/ | 301->/shop/dabo-phyto-cica-b5-o2-deep-cleanser-200-ml > 200 | 200 /shop/dabo-phyto-cica-b5-o2-deep-cleanser-200-ml | /shop/dabo-phyto-cica-b5-o2-deep-cleanser-200-ml | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/dr-althea-0-1-gentle-retinol-serum-30ml/ | 301->/shop/dr-althea-0-1-gentle-retinol-serum-30ml > 200 | 200 /shop/dr-althea-0-1-gentle-retinol-serum-30ml | /shop/dr-althea-0-1-gentle-retinol-serum-30ml | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/dr-ceuracle-vegan-kombucha-tea-lip-balm-3-7g/ | 301->/shop/dr-ceuracle-vegan-kombucha-tea-lip-balm-3-7g > 200 | 200 /shop/dr-ceuracle-vegan-kombucha-tea-lip-balm-3-7g | /shop/dr-ceuracle-vegan-kombucha-tea-lip-balm-3-7g | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/haruharu-wonder-black-rice-hyaluronic-toner-150ml/ | 301->/shop/haruharu-wonder-black-rice-hyaluronic-toner-150ml > 200 | 200 /shop/haruharu-wonder-black-rice-hyaluronic-toner-150ml | /shop/haruharu-wonder-black-rice-hyaluronic-toner-150ml | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/haruharu-wonder-centella-4-txa-dark-spot-go-away-serum-30ml/ | 301->/shop/haruharu-wonder-centella-4-txa-dark-spot-go-away-serum-30ml > 200 | 200 /shop/haruharu-wonder-centella-4-txa-dark-spot-go-away-serum-30ml | /shop/haruharu-wonder-centella-4-txa-dark-spot-go-away-serum-30ml | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/im-from-mugwort-essence-30ml/ | 301->/shop/im-from-mugwort-essence-30ml > 200 | 200 /shop/im-from-mugwort-essence-30ml | /shop/im-from-mugwort-essence-30ml | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/innisfree-retinol-cica-repair-ampoule-7ml-mini/ | 301->/shop/innisfree-retinol-cica-repair-ampoule-7ml-mini > 200 | 200 /shop/innisfree-retinol-cica-repair-ampoule-7ml-mini | /shop/innisfree-retinol-cica-repair-ampoule-7ml-mini | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/ksecret-seoul-1988-cleansing-oil-pine-cica-1-probiotics-200-ml/ | 301->/shop/ksecret-seoul-1988-cleansing-oil-pine-cica-1-probiotics-200-ml > 200 | 200 /shop/ksecret-seoul-1988-cleansing-oil-pine-cica-1-probiotics-200-ml | /shop/ksecret-seoul-1988-cleansing-oil-pine-cica-1-probiotics-200-ml | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/missha-m-perfect-cover-bb-cream-spf42-pa-20ml-no-21/ | 301->/shop/missha-m-perfect-cover-bb-cream-spf42-pa-20ml-no-21 > 200 | 200 /shop/missha-m-perfect-cover-bb-cream-spf42-pa-20ml-no-21 | /shop/missha-m-perfect-cover-bb-cream-spf42-pa-20ml-no-21 | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/neutrogena-clear-soothe-micellar-jelly-makeup-remover-200ml/ | 301->/shop/neutrogena-clear-soothe-micellar-jelly-makeup-remover-200ml > 200 | 200 /shop/neutrogena-clear-soothe-micellar-jelly-makeup-remover-200ml | /shop/neutrogena-clear-soothe-micellar-jelly-makeup-remover-200ml | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/pinkflash-lasting-matte-foundation-pf-f03-warm-beige-03-25g/ | 301->/shop/pinkflash-lasting-matte-foundation-pf-f03-warm-beige-03-25g > 200 | 200 /shop/pinkflash-lasting-matte-foundation-pf-f03-warm-beige-03-25g | /shop/pinkflash-lasting-matte-foundation-pf-f03-warm-beige-03-25g | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/raip-r3-argan-hair-oil-100-ml-white-soap/ | 301->/shop/raip-r3-argan-hair-oil-100-ml-white-soap > 200 | 200 /shop/raip-r3-argan-hair-oil-100-ml-white-soap | /shop/raip-r3-argan-hair-oil-100-ml-white-soap | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/some-by-mi-retinol-intense-trial-kit/ | 301->/shop/some-by-mi-retinol-intense-trial-kit > 200 | 200 /shop/some-by-mi-retinol-intense-trial-kit | /shop/some-by-mi-retinol-intense-trial-kit | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/stives-avocado-and-honey-soft-skin-scrub-170ge/ | 301->/shop/stives-avocado-and-honey-soft-skin-scrub-170ge > 200 | 200 /shop/stives-avocado-and-honey-soft-skin-scrub-170ge | /shop/stives-avocado-and-honey-soft-skin-scrub-170ge | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/stives-even-bright-pink-lemon-orange-scrub-150ml/ | 301->/shop/stives-even-bright-pink-lemon-orange-scrub-150ml > 200 | 200 /shop/stives-even-bright-pink-lemon-orange-scrub-150ml | /shop/stives-even-bright-pink-lemon-orange-scrub-150ml | index, follow | present | /product/* | A |
| 20 old /product/* URLs | /product/the-ordinary-glycolic-acid-7-toning-solution-240ml/ | 301->/shop/the-ordinary-glycolic-acid-7-toning-solution-240ml > 200 | 200 /shop/the-ordinary-glycolic-acid-7-toning-solution-240ml | /shop/the-ordinary-glycolic-acid-7-toning-solution-240ml | index, follow | present | /product/* | A |
| 20 query-junk URLs | /?add-to-cart=3016 | 301->/ > 200 | 200 / | / | index, follow | present | root query junk | D |
| 20 query-junk URLs | /?add-to-cart=4147 | 301->/ > 200 | 200 / | / | index, follow | present | root query junk | D |
| 20 query-junk URLs | /product-tag/alcohol-free/?add-to-cart=2593 | 308->/product-tag/alcohol-free?add-to-cart=2593 > 308->/shop?add-to-cart=2593 > 301->/shop > 200 | 200 /shop | /shop | index, follow | present | root query junk | D |
| 20 query-junk URLs | /product-tag/anti-aging/?per_row=4&shop_view=grid&per_page=24&add-to-cart=51059 | 308->/product-tag/anti-aging?per_row=4&shop_view=grid&per_page=24&add-to-cart=51059 > 308->/shop?per_row=4&shop_view=grid&per_page=24&add-to-cart=51059 > 301->/shop?per_row=4 > 200 | 200 /shop?per_row=4 | /shop?per_row=4 | index, follow | absent | root query junk | D |
| 20 query-junk URLs | /product-tag/eucerin-calming-daily-moisturizer-creme-226ge/?per_row=4&per_page=36&shop_view=grid&filter_brand=eucerin | 308->/product-tag/eucerin-calming-daily-moisturizer-creme-226ge?per_row=4&per_page=36&shop_view=grid&filter_brand=eucerin > 308->/shop?per_row=4&per_page=36&shop_view=grid&filter_brand=eucerin > 301->/shop?per_row=4&filter_brand=eucerin > 200 | 200 /shop?per_row=4&filter_brand=eucerin | /shop?per_row=4&amp;filter_brand=eucerin | index, follow | absent | root query junk | D |
| 20 query-junk URLs | /product-tag/hydrating-cleanser/?per_row=3&shop_view=grid&per_page=36&add-to-cart=26134 | 308->/product-tag/hydrating-cleanser?per_row=3&shop_view=grid&per_page=36&add-to-cart=26134 > 308->/shop?per_row=3&shop_view=grid&per_page=36&add-to-cart=26134 > 301->/shop?per_row=3 > 200 | 200 /shop?per_row=3 | /shop?per_row=3 | index, follow | absent | root query junk | D |
| 20 query-junk URLs | /product-tag/snail/?add-to-cart=26273 | 308->/product-tag/snail?add-to-cart=26273 > 308->/shop?add-to-cart=26273 > 301->/shop > 200 | 200 /shop | /shop | index, follow | present | root query junk | D |
| 20 query-junk URLs | /product-tag/snail/?orderby=date&filter_brand=mary-may | 308->/product-tag/snail?orderby=date&filter_brand=mary-may > 308->/shop?orderby=date&filter_brand=mary-may > 301->/shop?filter_brand=mary-may > 200 | 200 /shop?filter_brand=mary-may | /shop?filter_brand=mary-may | index, follow | absent | root query junk | D |
| 20 query-junk URLs | /product-tag/snail/?orderby=date&per_row=3&shop_view=grid&add-to-cart=58039 | 308->/product-tag/snail?orderby=date&per_row=3&shop_view=grid&add-to-cart=58039 > 308->/shop?orderby=date&per_row=3&shop_view=grid&add-to-cart=58039 > 301->/shop?per_row=3 > 200 | 200 /shop?per_row=3 | /shop?per_row=3 | index, follow | absent | root query junk | D |
| 20 query-junk URLs | /product-tag/technic-stiletto-24-false-nails-with-glue-gloss-red/?per_page=9 | 308->/product-tag/technic-stiletto-24-false-nails-with-glue-gloss-red?per_page=9 > 308->/shop?per_page=9 > 301->/shop > 200 | 200 /shop | /shop | index, follow | present | root query junk | D |
| 20 query-junk URLs | /product-tag/technic/?per_page=36 | 308->/product-tag/technic?per_page=36 > 308->/shop?per_page=36 > 301->/shop > 200 | 200 /shop | /shop | index, follow | present | root query junk | D |
| 20 query-junk URLs | /product/beauty-of-joseon-radiance-cleansing-balm-100ml/?add-to-cart=2627 | 301->/shop/beauty-of-joseon-radiance-cleansing-balm-100ml > 200 | 200 /shop/beauty-of-joseon-radiance-cleansing-balm-100ml | /shop/beauty-of-joseon-radiance-cleansing-balm-100ml | index, follow | present | root query junk | D |
| 20 query-junk URLs | /product/clean-clear-morning-energy-daily-facial-scrub-150ml/?add-to-cart=2607 | 301->/shop/clean-clear-morning-energy-daily-facial-scrub-150ml > 200 | 200 /shop/clean-clear-morning-energy-daily-facial-scrub-150ml | /shop/clean-clear-morning-energy-daily-facial-scrub-150ml | index, follow | present | root query junk | D |
| 20 query-junk URLs | /product/dr-althea-natural-radiance-essence-30ml/?add-to-cart=2607 | 301->/shop/dr-althea-natural-radiance-essence-30ml > 200 | 200 /shop/dr-althea-natural-radiance-essence-30ml | /shop/dr-althea-natural-radiance-essence-30ml | index, follow | present | root query junk | D |
| 20 query-junk URLs | /product/makeup-revolution-10-niacinamide-and-1-zinc-blemish-pore-serum/?add-to-cart=27117 | 301->/shop/makeup-revolution-10-niacinamide-and-1-zinc-blemish-pore-serum > 200 | 200 /shop/makeup-revolution-10-niacinamide-and-1-zinc-blemish-pore-serum | /shop/makeup-revolution-10-niacinamide-and-1-zinc-blemish-pore-serum | index, follow | present | root query junk | D |
| 20 query-junk URLs | /product/mamy-poko-pants-xxxl-7-pcs-18-35kg-in/?add-to-cart=35882 | 301->/shop/mamy-poko-pants-xxxl-7-pcs-18-35kg-in > 200 | 200 /shop/mamy-poko-pants-xxxl-7-pcs-18-35kg-in | /shop/mamy-poko-pants-xxxl-7-pcs-18-35kg-in | index, follow | present | root query junk | D |
| 20 query-junk URLs | /product/mary-may-lemon-niacinamide-glow-wash-off-pack-125g/?add-to-cart=4138 | 301->/shop/mary-may-lemon-niacinamide-glow-wash-off-pack-125g > 200 | 200 /shop/mary-may-lemon-niacinamide-glow-wash-off-pack-125g | /shop/mary-may-lemon-niacinamide-glow-wash-off-pack-125g | index, follow | present | root query junk | D |
| 20 query-junk URLs | /product/maybelline-master-smoky-scorching-brown-0-5gm/?add-to-cart=59072 | 301->/shop/maybelline-master-smoky-scorching-brown-0-5gm > 200 | 200 /shop/maybelline-master-smoky-scorching-brown-0-5gm | /shop/maybelline-master-smoky-scorching-brown-0-5gm | index, follow | present | root query junk | D |
| 20 query-junk URLs | /product/some-by-mi-snail-truecica-miracle-repair-cream-60g/?add-to-cart=52034 | 301->/shop/some-by-mi-snail-truecica-miracle-repair-cream-60g > 200 | 200 /shop/some-by-mi-snail-truecica-miracle-repair-cream-60g | /shop/some-by-mi-snail-truecica-miracle-repair-cream-60g | index, follow | present | root query junk | D |
| 20 query-junk URLs | /product/some-by-mi-super-miracle-14-days-spot-all-kill-cream-30g/?add-to-cart=4486 | 301->/shop/some-by-mi-super-miracle-14-days-spot-all-kill-cream-30g > 200 | 200 /shop/some-by-mi-super-miracle-14-days-spot-all-kill-cream-30g | /shop/some-by-mi-super-miracle-14-days-spot-all-kill-cream-30g | index, follow | present | root query junk | D |
| 20 old tag/category/brand archive URLs | /product-tag/acne-pimple-master-patch/ | 308->/product-tag/acne-pimple-master-patch > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/argan/ | 308->/product-tag/argan > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/calming/ | 308->/product-tag/calming > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/cos-de-baha/ | 308->/product-tag/cos-de-baha > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/iunik/ | 308->/product-tag/iunik > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/korean-cosmetics/ | 308->/product-tag/korean-cosmetics > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/lip-tint/ | 308->/product-tag/lip-tint > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/maybelline-new-york-dream-brightening-creamy-concealer-light-20-3gm/ | 308->/product-tag/maybelline-new-york-dream-brightening-creamy-concealer-light-20-3gm > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/missha/ | 308->/product-tag/missha > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/mizon/ | 308->/product-tag/mizon > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/nacific/ | 308->/product-tag/nacific > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/neutrogena-clear-and-soothe-oil-free-gel-moisturizer-75ml/ | 308->/product-tag/neutrogena-clear-and-soothe-oil-free-gel-moisturizer-75ml > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/nivea-soft-moisturizing-cream-300ml/ | 308->/product-tag/nivea-soft-moisturizing-cream-300ml > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/oil/ | 308->/product-tag/oil > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/salicylic/ | 308->/product-tag/salicylic > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/simple-water-boost-hydrating-gel-cream-50ml/ | 308->/product-tag/simple-water-boost-hydrating-gel-cream-50ml > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/simple/ | 308->/product-tag/simple > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/snail/ | 308->/product-tag/snail > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/snail/?filter_brand=mary-may | 308->/product-tag/snail?filter_brand=mary-may > 308->/shop?filter_brand=mary-may > 200 | 200 /shop?filter_brand=mary-may | /shop?filter_brand=mary-may | index, follow | absent | /product-tag/* | D |
| 20 old tag/category/brand archive URLs | /product-tag/technic-stiletto-24-false-nails-with-glue-gloss-red/ | 308->/product-tag/technic-stiletto-24-false-nails-with-glue-gloss-red > 308->/shop > 200 | 200 /shop | /shop | index, follow | present | /product-tag/* | D |
| first 20 brand detail URLs | /brands/aestura | 200 | 200 /brands/aestura | /brands/aestura | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/april-skin | 404 | 404 /brands/april-skin | (none) | noindex | absent | /brands/* | E |
| first 20 brand detail URLs | /brands/aprilskin | 200 | 200 /brands/aprilskin | /brands/aprilskin | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/belif | 200 | 200 /brands/belif | /brands/belif | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/blab | 200 | 200 /brands/blab | /brands/blab | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/cnp-laboratory | 200 | 200 /brands/cnp-laboratory | /brands/cnp-laboratory | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/elastine | 200 | 200 /brands/elastine | /brands/elastine | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/kose | 200 | 200 /brands/kose | /brands/kose | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/lebelage | 200 | 200 /brands/lebelage | /brands/lebelage | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/loreal | 200 | 200 /brands/loreal | /brands/loreal | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/mary-and-may | 200 | 200 /brands/mary-and-may | /brands/mary-and-may | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/nature-skin | 200 | 200 /brands/nature-skin | /brands/nature-skin | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/panoxyl | 200 | 200 /brands/panoxyl | /brands/panoxyl | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/ponds | 200 | 200 /brands/ponds | /brands/ponds | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/skinaqua | 200 | 200 /brands/skinaqua | /brands/skinaqua | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/skincafe | 200 | 200 /brands/skincafe | /brands/skincafe | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/streax | 200 | 200 /brands/streax | /brands/streax | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/the-derma-co | 200 | 200 /brands/the-derma-co | /brands/the-derma-co | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/the-inkey-list?page=2 | 200 | 200 /brands/the-inkey-list?page=2 | /brands/the-inkey-list | index, follow | present | /brands/* | A |
| first 20 brand detail URLs | /brands/wskinlab | 200 | 200 /brands/wskinlab | /brands/wskinlab | index, follow | present | /brands/* | A |
| all current category detail URLs found | /category/hair-personal-care?page=2 | 200 | 200 /category/hair-personal-care?page=2 | /category/hair-personal-care | index, follow | present | /category/* | A |
| all current category detail URLs found | /category/makeup-remover | 200 | 200 /category/makeup-remover | /category/makeup-remover | index, follow | present | /category/* | A |
| all current category detail URLs found | /category/skincare-essentials?page=2 | 200 | 200 /category/skincare-essentials?page=2 | /category/skincare-essentials | index, follow | present | /category/* | A |
| all current category detail URLs found | /category/skincare/ | 308->/category/skincare > 308->/category/skincare-essentials > 200 | 200 /category/skincare-essentials | /category/skincare-essentials | index, follow | present | /category/* | A |
| all current category detail URLs found | /category/skincare/korean-skincare-routine/10-step-routine/ | 308->/category/skincare/korean-skincare-routine/10-step-routine > 404 | 404 /category/skincare/korean-skincare-routine/10-step-routine | (none) | noindex | absent | /category/* | D |
| all current category detail URLs found | /category/uncategorized/ | 308->/category/uncategorized > 404 | 404 /category/uncategorized | (none) | noindex | absent | /category/* | D |

## Code Change Needed

No immediate app-code change is recommended from this audit alone. Most sampled current product/brand/category URLs are technically indexable, canonical, and present in sitemap, so GSC can be stale. The exceptions are current-pattern 404s that need owner/product-data review before code work.

Potential live issue to investigate later: legacy tag/filter redirects can leave indexable `/shop?filter_brand=...` or `/shop?per_row=...` variants. If these appear in larger GSC samples, inspect query-stripping/canonical handling before changing code.

## Exact Files To Inspect Later If Needed

- `apps/web/next.config.js` for legacy `/product/*`, `/product-category/*`, `/product-tag/*`, and `/product-brand/*` redirects.
- `apps/web/src/middleware.ts` for query parameter stripping and canonical pollution controls.
- `apps/web/src/app/shop/[slug]/page.tsx` for product 404/indexability behavior if a published product is missing.
- `apps/web/src/app/brands/[slug]/page.tsx` for brand 404/indexability behavior if a valid brand is missing.
- `apps/web/src/app/category/[...slug]/page.tsx` for category noindex/404 behavior if current category URLs are important.
- `apps/web/src/app/sitemap.ts` or current sitemap route if sitemap presence mismatches appear.

## Recommended Next Action

1. Treat the bulk of current `/shop/*`, `/brands/*`, and canonicalized old `/product/*` rows as `A - already fixed, waiting for Google` unless a larger sample proves otherwise.
2. Owner-review the important current-pattern 404s: `/shop/cosrx-advanced-snail-96-mucin-power-essence-30ml-mini` and `/brands/april-skin`.
3. Run a focused follow-up on query/filter variants that survive as indexable `/shop?filter_brand=...` or `/shop?per_row=...`, because that is the only sampled pattern that may require middleware/canonical tightening.
4. Do not deploy or push from this audit; use it as the handoff for the next Week 2 cleanup slice.
