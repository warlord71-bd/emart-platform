<?php
/**
 * Dry-run: pa_concern + pa_skin_type assignment
 *
 * Concern sources (priority order per product):
 *   1. Woo product_cat assignment (most authoritative — owner-assigned)
 *   2. TKM concern JSON (brand-matched Korean products)
 *   3. Title keyword inference (for brightening + wrinkle which have no Woo category)
 *
 * Skin type sources:
 *   1. Existing WC local attribute "skin-type" if NOT "all skin types"
 *   2. Explicit skin type phrase in product title
 *   Skip if "all skin types" or no clear signal.
 *
 * Star ingredient sources:
 *   1. Product title keyword matching against TKM star ingredient list
 *   Multi-value — one product can match several ingredients.
 *
 * Legacy taxonomy reference:
 *   Skin Concern: Brightening, Hyperpigmentation, Acne & Scars, Pores & Blackheads,
 *                 Anti-Ageing, Wrinkle, Hydration, Damage Skin
 *   Skin Type:    Oily, Combination, Dryness, Normal, Acne Prone, Damaged Skin
 *   Star Ingredients: Vitamin C, Vitamin E, Hyaluronic Acid, Niacinamide, Retinol,
 *                 Ginseng, Tea Tree & Green Tea, Snail Mucin, Collagen, Azelaic Acid,
 *                 Rosemary, Bakuchiol, EGF, BHA, Propolis, Rice, AHA, Ceramide
 *
 * No DB writes. Outputs CSV + summary for owner review.
 *
 * Usage:
 *   wp --path=/var/www/wordpress --allow-root eval-file \
 *     workspace/scripts/active/pa-concern-skin-type-dry-run.php
 */

if (!defined('ABSPATH')) { fwrite(STDERR, "Run with WP-CLI eval-file.\n"); exit(1); }

$TKM_FILE = '/var/www/emart-platform/workspace/audit/archive/tkm-concern-progress.json';
$OUT_DIR  = '/var/www/emart-platform/workspace/audit/active';
$stamp    = gmdate('Ymd-His');
$OUT_CSV  = "$OUT_DIR/pa-concern-skintype-dry-run-$stamp.csv";
$OUT_SUM  = "$OUT_DIR/pa-concern-skintype-dry-run-summary-$stamp.txt";

// ── Woo product_cat slug → pa_concern slug ───────────────────────────────────
// Only categories that are reliable 1:1 mappings (owner-assigned categories)
const CAT_CONCERN_MAP = [
    'acne-blemish-care'  => 'acne-blemish-care',
    'anti-aging-repair'  => 'anti-aging-repair',
    'dryness-hydration'  => 'dryness-hydration',
    'pores-oil-control'  => 'pores-oil-control',
    'melasma'            => 'melasma',
    'sunscreen'          => 'sunscreen',
    // concern sub-cats that also map cleanly
    'spot-treatment'     => 'acne-blemish-care',
    'eye-care'           => 'anti-aging-repair',
    'night-cream'        => 'anti-aging-repair',
];

// ── TKM concern label → pa_concern slug ─────────────────────────────────────
const TKM_CONCERN_MAP = [
    'acne'    => 'acne-blemish-care',
    'aging'   => 'anti-aging-repair',
    'dryness' => 'dryness-hydration',
    'spot'    => 'brightening',
    'pores'   => 'pores-oil-control',
    'melasma' => 'melasma',
];

// ── Title keyword → pa_concern (only for concerns with no Woo category) ──────
// Applied ONLY when category-based and TKM both miss
const KEYWORD_CONCERN_RULES = [
    // brightening (no dedicated Woo category)
    'brightening' => [
        'bright','glow serum','vitamin c','vitamin-c','niacinamide','niacin',
        'arbutin','dark spot','whitening','luminous','radiance','pigment',
        'tranexamic','azelaic',
    ],
    // wrinkle (separate from anti-aging in TKM taxonomy)
    'wrinkle' => [
        'retinol','retinal','retinoid','peptide','collagen','wrinkle','anti-wrinkle',
        'firming','lifting','elastin',
    ],
    // damage-skin (TKM: "Damage Skin")
    'damage-skin' => [
        'repair','recovery','damaged skin','barrier repair','cica','centella',
        'cicapair','panthenol','madecassoside',
    ],
];

// ── TKM skin type → pa_skin_type slug ───────────────────────────────────────
// TKM skin types: Oily, Combination, Dryness, Normal, Acne Prone, Damaged Skin
const SKIN_TYPE_MAP = [
    'oily'         => 'oily',
    'oily skin'    => 'oily',
    'combination'  => 'combination',
    'combination skin' => 'combination',
    'dryness'      => 'dry',
    'dry'          => 'dry',
    'dry skin'     => 'dry',
    'normal'       => 'normal',
    'normal skin'  => 'normal',
    'acne-prone'   => 'acne-prone',
    'acne prone'   => 'acne-prone',
    'damaged skin' => 'damaged-skin',
    'damaged'      => 'damaged-skin',
    'sensitive'    => 'sensitive',
    'sensitive skin' => 'sensitive',
];

// Explicit skin type phrases to match in product title (exact, case-insensitive)
const TITLE_SKIN_PHRASES = [
    'for oily skin'       => 'oily',
    'for oily'            => 'oily',
    'oil control'         => 'oily',
    'for combination skin'=> 'combination',
    'for dry skin'        => 'dry',
    'for dryness'         => 'dry',
    'for normal skin'     => 'normal',
    'for sensitive skin'  => 'sensitive',
    'for sensitive'       => 'sensitive',
    'acne-prone'          => 'acne-prone',
    'acne prone'          => 'acne-prone',
    'for damaged skin'    => 'damaged-skin',
];

// ── Star ingredient → title keywords (MULTI-VALUE per product) ───────────────
// Slug => keywords to match anywhere in product title (case-insensitive)
const STAR_INGREDIENT_RULES = [
    'vitamin-c'      => ['vitamin c','vitamin-c','ascorbic acid','ascorbyl'],
    'vitamin-e'      => ['vitamin e','vitamin-e','tocopherol'],
    'hyaluronic-acid'=> ['hyaluronic acid','hyaluronic','ha serum',' ha ','sodium hyaluronate'],
    'niacinamide'    => ['niacinamide','niacin'],
    'retinol'        => ['retinol','retinal','retinoid','0.1%','0.3%','1% retinol'],
    'ginseng'        => ['ginseng','ginsenoside','red ginseng'],
    'tea-tree'       => ['tea tree','green tea','camellia sinensis'],
    'snail-mucin'    => ['snail mucin','snail secretion','mucin','snail 96','snail 92'],
    'collagen'       => ['collagen'],
    'azelaic-acid'   => ['azelaic acid','azelaic'],
    'rosemary'       => ['rosemary'],
    'bakuchiol'      => ['bakuchiol'],
    'egf'            => [' egf ','epidermal growth factor'],
    'bha'            => [' bha ','salicylic acid','betaine salicylate'],
    'propolis'       => ['propolis'],
    'rice'           => ['rice toner','rice water','rice extract','rice serum','rice cream'],
    'aha'            => [' aha ','glycolic acid','lactic acid','mandelic acid'],
    'ceramide'       => ['ceramide'],
    // extra high-value ingredients common in K-beauty
    'centella'       => ['centella','cica','madecassoside','madecassica','tiger grass'],
    'peptide'        => ['peptide','matrixyl','argireline'],
    'mugwort'        => ['mugwort','artemisia'],
    'bifida'         => ['bifida','lactobacillus','ferment filtrate','galactomyces'],
];

// ── Load TKM JSON ────────────────────────────────────────────────────────────
$tkm_raw = json_decode(file_get_contents($TKM_FILE), true) ?: [];
$tkm = [];
foreach ($tkm_raw as $slug => $label) {
    $mapped = TKM_CONCERN_MAP[$label] ?? null;
    if ($mapped) $tkm[$slug] = $mapped;
}
fwrite(STDOUT, sprintf("TKM: %d raw → %d valid mappings\n", count($tkm_raw), count($tkm)));

// ── Fetch all published product IDs ─────────────────────────────────────────
fwrite(STDOUT, "Fetching all published products...\n");
$ids = get_posts([
    'post_type' => 'product', 'post_status' => 'publish',
    'posts_per_page' => -1, 'fields' => 'ids',
]);
fwrite(STDOUT, "Total: " . count($ids) . "\n");

// ── Pre-fetch category slugs per product (bulk) ──────────────────────────────
fwrite(STDOUT, "Loading product categories...\n");
$product_cats = []; // product_id => [cat_slug, ...]
foreach ($ids as $id) {
    $terms = wp_get_post_terms($id, 'product_cat', ['fields' => 'slugs']);
    $product_cats[$id] = is_wp_error($terms) ? [] : $terms;
}

// ── Helper: match title keywords ─────────────────────────────────────────────
function match_title_keywords(string $title, array $keywords): bool {
    $lower = strtolower($title);
    foreach ($keywords as $kw) {
        if (strpos($lower, $kw) !== false) return true;
    }
    return false;
}

// ── Build rows ───────────────────────────────────────────────────────────────
$rows = [];
$stats = [
    'concern_cat' => 0, 'concern_tkm' => 0, 'concern_kw' => 0,
    'concern_none' => 0, 'skin_attr' => 0, 'skin_title' => 0, 'skin_none' => 0,
    'ingredient_matched' => 0, 'ingredient_none' => 0,
];

foreach ($ids as $id) {
    $slug  = get_post_field('post_name', $id);
    $title = get_the_title($id);
    $cats  = $product_cats[$id];

    // ── 1. Determine concern ──────────────────────────────────────────────
    $concern = null; $concern_src = '';

    // Source 1: Woo category
    foreach ($cats as $cat) {
        if (isset(CAT_CONCERN_MAP[$cat])) {
            $concern = CAT_CONCERN_MAP[$cat]; $concern_src = 'woo_category:' . $cat;
            $stats['concern_cat']++;
            break;
        }
    }

    // Source 2: TKM JSON (if no category match)
    if (!$concern && isset($tkm[$slug])) {
        $concern = $tkm[$slug]; $concern_src = 'tkm';
        $stats['concern_tkm']++;
    }

    // Source 3: Title keyword (brightening / wrinkle / damage-skin only)
    if (!$concern) {
        foreach (KEYWORD_CONCERN_RULES as $c_slug => $keywords) {
            if (match_title_keywords($title, $keywords)) {
                $concern = $c_slug; $concern_src = 'keyword';
                $stats['concern_kw']++;
                break;
            }
        }
    }

    if (!$concern) { $stats['concern_none']++; }

    // ── 2. Determine skin type ────────────────────────────────────────────
    $skin_type = null; $skin_src = '';

    // Source 1: WC local attribute (only if NOT "all skin types")
    $attrs = maybe_unserialize(get_post_meta($id, '_product_attributes', true));
    if (is_array($attrs)) {
        foreach ($attrs as $key => $val) {
            if (stripos($key, 'skin') === false && stripos($val['name'] ?? '', 'skin') === false) continue;
            $raw = strtolower(trim($val['value'] ?? ''));
            // take first value if multi
            $first = strtolower(trim(preg_split('/[,|\/]+/', $raw)[0] ?? ''));
            if ($first && $first !== 'all skin types' && $first !== 'all') {
                $skin_type = SKIN_TYPE_MAP[$first] ?? $first;
                $skin_src  = 'wc_attribute';
                $stats['skin_attr']++;
            }
            break;
        }
    }

    // Source 2: Explicit phrase in title
    if (!$skin_type) {
        $lower = strtolower($title);
        foreach (TITLE_SKIN_PHRASES as $phrase => $st_slug) {
            if (strpos($lower, $phrase) !== false) {
                $skin_type = $st_slug; $skin_src = 'title_keyword';
                $stats['skin_title']++;
                break;
            }
        }
    }

    if (!$skin_type) $stats['skin_none']++;

    // ── 3. Star ingredients (multi-value, title keyword match) ────────────
    $ingredients = [];
    $lower_title = strtolower($title);
    foreach (STAR_INGREDIENT_RULES as $ing_slug => $keywords) {
        foreach ($keywords as $kw) {
            if (strpos($lower_title, $kw) !== false) {
                $ingredients[] = $ing_slug;
                break;
            }
        }
    }
    if ($ingredients) $stats['ingredient_matched']++;
    else              $stats['ingredient_none']++;

    // ── 4. Brand ──────────────────────────────────────────────────────────
    $brands = wp_get_post_terms($id, 'product_brand', ['fields' => 'names']);
    $brand  = !is_wp_error($brands) ? implode(', ', $brands) : '';

    // Only write rows where at least one assignment exists
    if (!$concern && !$skin_type && !$ingredients) continue;

    $rows[] = [
        'product_id'          => $id,
        'product_slug'        => $slug,
        'product_name'        => $title,
        'brand'               => $brand,
        'proposed_concern'    => $concern ?? '',
        'concern_source'      => $concern_src,
        'proposed_skin_type'  => $skin_type ?? '',
        'skin_type_source'    => $skin_src,
        'proposed_ingredients'=> implode('|', $ingredients),
        'ingredient_count'    => count($ingredients),
        'action'              => implode('+', array_filter([
            $concern     ? 'concern'    : '',
            $skin_type   ? 'skin_type'  : '',
            $ingredients ? 'ingredient' : '',
        ])),
    ];
}

// ── Write CSV ─────────────────────────────────────────────────────────────────
$fh = fopen($OUT_CSV, 'w');
fputcsv($fh, ['product_id','product_slug','product_name','brand',
              'proposed_concern','concern_source',
              'proposed_skin_type','skin_type_source',
              'proposed_ingredients','ingredient_count','action']);
foreach ($rows as $row) fputcsv($fh, array_values($row));
fclose($fh);

// ── Distributions ─────────────────────────────────────────────────────────────
$c_dist = []; $s_dist = []; $i_dist = [];
foreach ($rows as $r) {
    if ($r['proposed_concern'])   $c_dist[$r['proposed_concern']]   = ($c_dist[$r['proposed_concern']]   ?? 0) + 1;
    if ($r['proposed_skin_type']) $s_dist[$r['proposed_skin_type']] = ($s_dist[$r['proposed_skin_type']] ?? 0) + 1;
    if ($r['proposed_ingredients']) {
        foreach (explode('|', $r['proposed_ingredients']) as $ing) {
            $i_dist[$ing] = ($i_dist[$ing] ?? 0) + 1;
        }
    }
}
arsort($c_dist); arsort($s_dist); arsort($i_dist);

$has_concern = array_filter($rows, fn($r) => $r['proposed_concern']);
$has_skin    = array_filter($rows, fn($r) => $r['proposed_skin_type']);
$has_ing     = array_filter($rows, fn($r) => $r['proposed_ingredients']);

$lines = [
    "pa_concern + pa_skin_type + pa_ingredient dry-run — " . date('Y-m-d H:i:s'),
    "Sources: Woo product_cat + TKM JSON + title keywords",
    "Legacy taxonomy reference: Skin Concern / Skin Type / Star Ingredients",
    "",
    "── TOTALS ──────────────────────────────────────────────",
    "Published products:                    " . count($ids),
    "Rows in CSV (≥1 assignment):           " . count($rows),
    "  with concern:                        " . count($has_concern),
    "  with skin type:                      " . count($has_skin),
    "  with star ingredient(s):             " . count($has_ing),
    "Products with no assignment at all:    " . (count($ids) - count($rows)),
    "",
    "── CONCERN SOURCES ─────────────────────────────────────",
    "  Woo category:    " . $stats['concern_cat'],
    "  TKM JSON:        " . $stats['concern_tkm'],
    "  Title keyword:   " . $stats['concern_kw'],
    "  No concern:      " . $stats['concern_none'],
    "",
    "── CONCERN DISTRIBUTION ────────────────────────────────",
];
foreach ($c_dist as $c => $n) $lines[] = "  $c: $n";

$lines[] = "";
$lines[] = "── SKIN TYPE SOURCES ───────────────────────────────────";
$lines[] = "  WC attribute:    " . $stats['skin_attr'];
$lines[] = "  Title keyword:   " . $stats['skin_title'];
$lines[] = "  No skin type:    " . $stats['skin_none'];
$lines[] = "";
$lines[] = "── SKIN TYPE DISTRIBUTION ──────────────────────────────";
foreach ($s_dist as $s => $n) $lines[] = "  $s: $n";

$lines[] = "";
$lines[] = "── STAR INGREDIENT DISTRIBUTION (multi-value) ──────────";
$lines[] = "  Products with ≥1 ingredient:  " . $stats['ingredient_matched'];
$lines[] = "  Products with no ingredient:  " . $stats['ingredient_none'];
$lines[] = "";
foreach ($i_dist as $i => $n) $lines[] = "  $i: $n";

$lines[] = "";
$lines[] = "── FILES ────────────────────────────────────────────────";
$lines[] = "CSV:     $OUT_CSV";
$lines[] = "Summary: $OUT_SUM";
$lines[] = "";
$lines[] = "3 new WC attributes will be created on apply:";
$lines[] = "  pa_concern      — single value";
$lines[] = "  pa_skin_type    — single value";
$lines[] = "  pa_ingredient   — multi-value (pipe-separated in CSV)";
$lines[] = "Review CSV before running apply.";

$summary = implode("\n", $lines);
file_put_contents($OUT_SUM, $summary);
fwrite(STDOUT, "\n" . $summary . "\n");
