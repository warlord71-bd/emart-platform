<?php
/**
 * Read-only audit: products with wrong Korea/South Korea pa_origin
 * when the brand is clearly French, USA, Indian, UK, German, Canadian, or Japanese.
 * Also detects brand taxonomy mismatches and remaining bad copy.
 *
 * Usage (dry-run only, never mutates data):
 *   wp --path=/var/www/wordpress --allow-root eval-file \
 *     /root/emart-platform/workspace/scripts/active/audit-wrong-korea-origin-products.php
 *
 * Outputs:
 *   workspace/audit/active/wrong-korea-origin-audit-YYYYMMDD-HHMMSS.csv
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run this through: wp --path=/var/www/wordpress --allow-root eval-file <script>\n");
    exit(1);
}

$active_dir  = '/root/emart-platform/workspace/audit/active';
$archive_dir = '/root/emart-platform/workspace/audit/archive';
foreach ([$active_dir, $archive_dir] as $d) {
    if (!is_dir($d)) mkdir($d, 0755, true);
}

$stamp      = gmdate('Ymd-His');
$audit_path = "$active_dir/wrong-korea-origin-audit-$stamp.csv";

// ──────────────────────────────────────────────────────────────
// Brand → expected origin map  (slug => [origin_name, origin_slug])
// Only brands that must NOT show "South Korea" as origin.
// Korean brands are intentionally absent so they're never touched.
// ──────────────────────────────────────────────────────────────
$BRAND_ORIGIN_MAP = [
    // France
    'la-roche-posay'   => ['France',  'france'],
    'bioderma'         => ['France',  'france'],
    'avene'            => ['France',  'france'],
    'vichy'            => ['France',  'france'],
    'garnier'          => ['France',  'france'],
    'loreal'           => ['France',  'france'],
    'l-oreal'          => ['France',  'france'],
    'uriage'           => ['France',  'france'],
    'nuxe'             => ['France',  'france'],
    'embryolisse'      => ['France',  'france'],
    'caudalie'         => ['France',  'france'],
    'svr'              => ['France',  'france'],
    'ducray'           => ['France',  'france'],
    'roc'              => ['France',  'france'],
    // USA
    'cetaphil'         => ['USA',     'usa'],
    'cerave'           => ['USA',     'usa'],
    'neutrogena'       => ['USA',     'usa'],
    'aveeno'           => ['USA',     'usa'],
    'vaseline'         => ['USA',     'usa'],
    'ponds'            => ['USA',     'usa'],
    'palmers'          => ['USA',     'usa'],
    'bath-and-body-works' => ['USA',  'usa'],
    'clean-and-clear'  => ['USA',     'usa'],
    'st-ives'          => ['USA',     'usa'],
    'freeman'          => ['USA',     'usa'],
    'absolute-new-york' => ['USA',    'usa'],
    'aztec-secret'     => ['USA',     'usa'],
    'vanicream'        => ['USA',     'usa'],
    'oral-b'           => ['USA',     'usa'],
    'remington'        => ['USA',     'usa'],
    'topicals'         => ['USA',     'usa'],
    'maybelline'       => ['USA',     'usa'],
    'm-a-c'            => ['USA',     'usa'],
    'sheglam'          => ['USA',     'usa'],
    'wet-n-wild'       => ['USA',     'usa'],
    'j-cat'            => ['USA',     'usa'],
    'philosophy'       => ['USA',     'usa'],
    'skinlogic'        => ['USA',     'usa'],
    // UK
    'simple'           => ['UK',      'uk'],
    'the-inkey-list'   => ['UK',      'uk'],
    'the-body-shop'    => ['UK',      'uk'],
    'technic'          => ['UK',      'uk'],
    'durex'            => ['UK',      'uk'],
    'veet'             => ['UK',      'uk'],
    'sudocrem'         => ['UK',      'uk'],
    'beauty-formulas'  => ['UK',      'uk'],
    'revolution'       => ['UK',      'uk'],
    'femi-fresh'       => ['UK',      'uk'],
    'noval'            => ['UK',      'uk'],
    // Canada
    'the-ordinary'     => ['Canada',  'canada'],
    'deciem'           => ['Canada',  'canada'],
    // Germany
    'eucerin'          => ['Germany', 'germany'],
    'nivea'            => ['Germany', 'germany'],
    'sebamed'          => ['Germany', 'germany'],
    'miss-mrs'         => ['Germany', 'germany'],
    // India
    'the-derma-co'     => ['India',   'india'],
    'minimalist'       => ['India',   'india'],
    'mamaearth'        => ['India',   'india'],
    'wishcare'         => ['India',   'india'],
    'aqualogica'       => ['India',   'india'],
    'dot-and-key'      => ['India',   'india'],
    'swiss-beauty'     => ['India',   'india'],
    'insight'          => ['India',   'india'],
    'dr-shethas'       => ['India',   'india'],
    'muuchstac'        => ['India',   'india'],
    // Japan
    'biore'            => ['Japan',   'japan'],
    'rohto-mentholatum' => ['Japan',  'japan'],
    'hada-labo'        => ['Japan',   'japan'],
    'skinaqua'         => ['Japan',   'japan'],
    'skin-aqua'        => ['Japan',   'japan'],
    'daiso'            => ['Japan',   'japan'],
    'sana'             => ['Japan',   'japan'],
    'cow-brand'        => ['Japan',   'japan'],
    'harada'           => ['Japan',   'japan'],
    'moist-diane'      => ['Japan',   'japan'],
    'muji'             => ['Japan',   'japan'],
    'naturie-hatomagi' => ['Japan',   'japan'],
    'nekoma'           => ['Japan',   'japan'],
    'omi-brotherhood'  => ['Japan',   'japan'],
    'reikhaku'         => ['Japan',   'japan'],
    'skinlife'         => ['Japan',   'japan'],
    'syoss'            => ['Japan',   'japan'],
    'yanagiya'         => ['Japan',   'japan'],
    'zact-plus'        => ['Japan',   'japan'],
    'cezanne'          => ['Japan',   'japan'],
    'nekoma'           => ['Japan',   'japan'],
];

// Title patterns → [brand_name, brand_slug, origin_name, origin_slug]
// Longer / more-specific patterns come first so they match before shorter ones.
$TITLE_PATTERNS = [
    ['la roche-posay',   'La Roche-Posay',   'la-roche-posay',   'France',  'france'],
    ['la roche posay',   'La Roche-Posay',   'la-roche-posay',   'France',  'france'],
    ['bioderma',         'Bioderma',         'bioderma',         'France',  'france'],
    ['avène',            'Avène',            'avene',            'France',  'france'],
    ['avene',            'Avène',            'avene',            'France',  'france'],
    ['vichy',            'Vichy',            'vichy',            'France',  'france'],
    ['garnier',          'Garnier',          'garnier',          'France',  'france'],
    ['l\'oréal',         "L'Oréal",          'l-oreal',          'France',  'france'],
    ['l\'oreal',         "L'Oréal",          'l-oreal',          'France',  'france'],
    ['loreal',           "L'Oréal",          'loreal',           'France',  'france'],
    ['uriage',           'Uriage',           'uriage',           'France',  'france'],
    ['nuxe',             'Nuxe',             'nuxe',             'France',  'france'],
    ['embryolisse',      'Embryolisse',      'embryolisse',      'France',  'france'],
    ['caudalie',         'Caudalie',         'caudalie',         'France',  'france'],
    ['ducray',           'Ducray',           'ducray',           'France',  'france'],
    ['the ordinary',     'The Ordinary',     'the-ordinary',     'Canada',  'canada'],
    ['cetaphil',         'Cetaphil',         'cetaphil',         'USA',     'usa'],
    ['cerave',           'CeraVe',           'cerave',           'USA',     'usa'],
    ['cera ve',          'CeraVe',           'cerave',           'USA',     'usa'],
    ['neutrogena',       'Neutrogena',       'neutrogena',       'USA',     'usa'],
    ['aveeno',           'Aveeno',           'aveeno',           'USA',     'usa'],
    ['vaseline',         'Vaseline',         'vaseline',         'USA',     'usa'],
    ['palmer\'s',        "Palmer's",         'palmers',          'USA',     'usa'],
    ['palmers',          "Palmer's",         'palmers',          'USA',     'usa'],
    ['bath & body works','Bath & Body Works','bath-and-body-works','USA',   'usa'],
    ['bath and body works','Bath & Body Works','bath-and-body-works','USA', 'usa'],
    ['clean & clear',    'Clean & Clear',    'clean-and-clear',  'USA',     'usa'],
    ['st. ives',         'St. Ives',         'st-ives',          'USA',     'usa'],
    ['st ives',          'St. Ives',         'st-ives',          'USA',     'usa'],
    ['freeman',          'Freeman',          'freeman',          'USA',     'usa'],
    ['vanicream',        'Vanicream',        'vanicream',        'USA',     'usa'],
    ['maybelline',       'Maybelline',       'maybelline',       'USA',     'usa'],
    ['the body shop',    'The Body Shop',    'the-body-shop',    'UK',      'uk'],
    ['simple kind to skin', 'Simple',         'simple',           'UK',      'uk'],
    ['simple kind',      'Simple',           'simple',           'UK',      'uk'],
    ['the inkey list',   'The Inkey List',   'the-inkey-list',   'UK',      'uk'],
    ['durex',            'Durex',            'durex',            'UK',      'uk'],
    ['sudocrem',         'Sudocrem',         'sudocrem',         'UK',      'uk'],
    ['eucerin',          'Eucerin',          'eucerin',          'Germany', 'germany'],
    ['nivea',            'Nivea',            'nivea',            'Germany', 'germany'],
    ['sebamed',          'SebaMed',          'sebamed',          'Germany', 'germany'],
    ['the derma co',     'The Derma Co',     'the-derma-co',     'India',   'india'],
    ['minimalist',       'Minimalist',       'minimalist',       'India',   'india'],
    ['mamaearth',        'Mamaearth',        'mamaearth',        'India',   'india'],
    ['wishcare',         'Wishcare',         'wishcare',         'India',   'india'],
    ['aqualogica',       'Aqualogica',       'aqualogica',       'India',   'india'],
    ['dot & key',        'Dot & Key',        'dot-and-key',      'India',   'india'],
    ['dot and key',      'Dot & Key',        'dot-and-key',      'India',   'india'],
    ['hada labo',        'Hada Labo',        'hada-labo',        'Japan',   'japan'],
    ['biore',            'Biore',            'biore',            'Japan',   'japan'],
    ['rohto',            'Rohto',            'rohto-mentholatum','Japan',   'japan'],
    ['melano cc',        'Melano CC',        'melano-cc',        'Japan',   'japan'],
    ['skin aqua',        'SkinAqua',         'skinaqua',         'Japan',   'japan'],
    ['skin1004',         'Skin1004',         'skin1004',         'South Korea', 'south-korea'],
    ['senka',            'Senka',            'senka',            'Japan',   'japan'],
    ['daiso',            'Daiso',            'daiso',            'Japan',   'japan'],
    ['sana ',            'Sana',             'sana',             'Japan',   'japan'],
    ['naturie',          'Naturie Hatomagi', 'naturie-hatomagi', 'Japan',   'japan'],
    ['muji',             'Muji',             'muji',             'Japan',   'japan'],
];

// ──────────────────────────────────────────────────────────────
// Helper: detect brand from product title
// Returns [brand_name, brand_slug, origin_name, origin_slug] or []
// ──────────────────────────────────────────────────────────────
function emart_audit_detect_brand_from_title(string $title, array $patterns): array {
    $lower = strtolower(html_entity_decode($title, ENT_QUOTES | ENT_HTML5));
    foreach ($patterns as $p) {
        if (strpos($lower, $p[0]) !== false) {
            return $p;  // [pattern, brand_name, brand_slug, origin_name, origin_slug]
        }
    }
    return [];
}

// ──────────────────────────────────────────────────────────────
// Helper: origin terms for a product
// ──────────────────────────────────────────────────────────────
function emart_audit_origin_terms(int $post_id): array {
    $terms = wp_get_object_terms($post_id, 'pa_origin');
    if (is_wp_error($terms) || empty($terms)) return [];
    return array_map(fn($t) => ['name' => (string) $t->name, 'slug' => (string) $t->slug, 'id' => (int) $t->term_id], $terms);
}

function emart_audit_is_korea_origin(array $terms): bool {
    foreach ($terms as $t) {
        $s = strtolower($t['slug']);
        $n = strtolower($t['name']);
        if (str_contains($s, 'korea') || str_contains($n, 'korea')) return true;
    }
    return false;
}

// ──────────────────────────────────────────────────────────────
// Helper: detect if title has explicit Korea labelling (conflict)
// ──────────────────────────────────────────────────────────────
function emart_audit_has_korea_conflict(string $title): bool {
    $lower = strtolower($title);
    return preg_match('/korean?\s+version|made\s+in\s+korea|korea\s+edition|korean?\s+edition/i', $lower) === 1;
}

// ──────────────────────────────────────────────────────────────
// Helper: detect combo/bundle product from title or SKU
// ──────────────────────────────────────────────────────────────
function emart_audit_is_combo(string $title, string $sku): bool {
    $lower = strtolower($title);
    return str_contains($lower, 'combo') || str_contains($lower, 'bundle') || str_starts_with($sku, 'combo');
}

// ──────────────────────────────────────────────────────────────
// Helper: detect bad copy
// ──────────────────────────────────────────────────────────────
function emart_audit_has_bad_copy(string $value): bool {
    return (bool) preg_match('/(?:korea\s+imports?|korean\s+imports?|imported\s+from\s+korea)/i', $value);
}

function emart_audit_snippet(string $html, int $max = 200): string {
    $plain = trim(preg_replace('/\s+/', ' ', wp_strip_all_tags($html)));
    return strlen($plain) <= $max ? $plain : substr($plain, 0, $max - 3) . '...';
}

// ──────────────────────────────────────────────────────────────
// Main audit loop
// ──────────────────────────────────────────────────────────────
$public_meta_keys = [
    '_rank_math_description',
    '_rank_math_title',
    '_emart_meta_description',
    '_emart_product_faq',
    '_structured_description',
    'fb_product_description',
    'fb_rich_text_description',
    'meta description',
    'rank_math_description',
];

$ids = get_posts([
    'post_type'      => 'product',
    'post_status'    => 'publish',
    'posts_per_page' => -1,
    'fields'         => 'ids',
    'orderby'        => 'ID',
    'order'          => 'ASC',
]);

$audit_fh = fopen($audit_path, 'w');
fputcsv($audit_fh, [
    'confidence',
    'classification',
    'product_id',
    'slug',
    'title',
    'sku',
    'current_brand_names',
    'current_brand_slugs',
    'current_origin_names',
    'current_origin_slugs',
    'product_categories',
    'detected_brand_from_title',
    'detected_brand_slug',
    'expected_origin_name',
    'expected_origin_slug',
    'bad_copy_detected',
    'bad_copy_fields',
    'desc_snippet',
    'excerpt_snippet',
    'reason',
    'proposed_action',
]);

// ──────────────────────────────────────────────────────────────
// Known sub-brand → parent brand relationships.
// These are NOT taxonomy mismatches — the parent brand is correct.
// ──────────────────────────────────────────────────────────────
$KNOWN_SUBBRAND_TO_PARENT = [
    'hada-labo'  => ['rohto-mentholatum'],
    'melano-cc'  => ['rohto-mentholatum'],
    'skin-aqua'  => ['rohto-mentholatum', 'skin-aqua'],
    'skinaqua'   => ['rohto-mentholatum'],
    'vaseline'   => ['unilever'],
];
// Accent/spelling variants that are the same brand
$KNOWN_BRAND_SLUG_ALIASES = [
    'l-oreal'     => ['loreal', 'l-oreal'],
    'loreal'      => ['loreal', 'l-oreal'],
    'skin-aqua'   => ['skin-aqua', 'skinaqua'],
    'skinaqua'    => ['skin-aqua', 'skinaqua'],
];

$counts = [
    'scanned'                   => count($ids),
    'high_confidence_auto_fix'  => 0,
    'skipped_ambiguous'         => 0,
    'correct_origin_bad_copy'   => 0,
    'brand_taxonomy_mismatch'   => 0,
    'no_korea_origin_bad_copy'  => 0,
    'already_correct'           => 0,
    // kept for backwards compat but should stay 0:
    'medium_review_needed'      => 0,
    'low_review_needed'         => 0,
];

foreach ($ids as $post_id) {
    $post = get_post($post_id);
    if (!$post) continue;

    $product       = wc_get_product($post_id);
    $title         = html_entity_decode($post->post_title, ENT_QUOTES | ENT_HTML5);
    $slug          = $post->post_name;
    $sku           = $product ? (string) $product->get_sku() : '';
    $desc          = (string) $post->post_content;
    $excerpt       = (string) $post->post_excerpt;

    // Brand taxonomy
    $brand_terms  = wp_get_object_terms($post_id, 'product_brand');
    $brand_names  = [];
    $brand_slugs  = [];
    if (!is_wp_error($brand_terms)) {
        foreach ($brand_terms as $bt) {
            $brand_names[] = $bt->name;
            $brand_slugs[] = $bt->slug;
        }
    }
    $brand_names_str = implode('|', $brand_names);
    $brand_slugs_str = implode('|', $brand_slugs);

    // Origin taxonomy
    $origin_terms     = emart_audit_origin_terms($post_id);
    $origin_names_str = implode('|', array_column($origin_terms, 'name'));
    $origin_slugs_str = implode('|', array_column($origin_terms, 'slug'));

    // Categories
    $cat_terms = wp_get_object_terms($post_id, 'product_cat');
    $cat_names = is_wp_error($cat_terms) ? [] : array_column($cat_terms, 'name');
    $cat_str   = implode('|', $cat_names);

    // Title brand detection
    $detected    = emart_audit_detect_brand_from_title($title, $TITLE_PATTERNS);
    $det_brand   = $detected[1] ?? '';
    $det_bslug   = $detected[2] ?? '';
    $exp_origin  = $detected[3] ?? '';
    $exp_slug    = $detected[4] ?? '';

    // Taxonomy fallback: if title didn't yield a non-Korean origin,
    // check the product_brand taxonomy against the map.
    if ((!$exp_slug || $exp_slug === 'south-korea') && !empty($brand_slugs)) {
        foreach ($brand_slugs as $bs) {
            if (isset($BRAND_ORIGIN_MAP[$bs]) && $BRAND_ORIGIN_MAP[$bs][1] !== 'south-korea') {
                $exp_origin = $BRAND_ORIGIN_MAP[$bs][0];
                $exp_slug   = $BRAND_ORIGIN_MAP[$bs][1];
                break;
            }
        }
    }

    // Bad copy in public text/meta
    $bad_copy_fields = [];
    if (emart_audit_has_bad_copy($desc))    $bad_copy_fields[] = 'post_content';
    if (emart_audit_has_bad_copy($excerpt)) $bad_copy_fields[] = 'post_excerpt';
    foreach ($public_meta_keys as $mk) {
        $vals = get_post_meta($post_id, $mk, false);
        foreach ((array) $vals as $v) {
            if (is_string($v) && emart_audit_has_bad_copy($v)) {
                $bad_copy_fields[] = "meta:$mk";
                break;
            }
        }
    }
    $has_bad_copy      = !empty($bad_copy_fields);
    $bad_copy_flds_str = implode('|', $bad_copy_fields);

    $is_korea_origin = emart_audit_is_korea_origin($origin_terms);
    $has_conflict    = emart_audit_has_korea_conflict($title);

    // ── Case 1: Korea origin AND a non-Korean brand is confidently identified ─
    if ($is_korea_origin && $exp_slug && $exp_slug !== 'south-korea') {
        // Skip multi-brand combo/bundle products — origin is inherently ambiguous
        if (emart_audit_is_combo($title, $sku)) {
            $counts['skipped_ambiguous']++;
            fputcsv($audit_fh, [
                'low', 'skipped_ambiguous', $post_id, $slug, $title, $sku,
                $brand_names_str, $brand_slugs_str,
                $origin_names_str, $origin_slugs_str, $cat_str,
                $det_brand, $det_bslug, $exp_origin, $exp_slug,
                $has_bad_copy ? 'yes' : 'no', $bad_copy_flds_str,
                emart_audit_snippet($desc), emart_audit_snippet($excerpt),
                'Combo/bundle product — origin ambiguous across multiple brands', 'manual_review',
            ]);
            continue;
        }

        if ($has_conflict) {
            $counts['skipped_ambiguous']++;
            fputcsv($audit_fh, [
                'low', 'skipped_ambiguous', $post_id, $slug, $title, $sku,
                $brand_names_str, $brand_slugs_str,
                $origin_names_str, $origin_slugs_str, $cat_str,
                $det_brand, $det_bslug, $exp_origin, $exp_slug,
                $has_bad_copy ? 'yes' : 'no', $bad_copy_flds_str,
                emart_audit_snippet($desc), emart_audit_snippet($excerpt),
                "Korea origin conflict in title", 'manual_review',
            ]);
        } else {
            $action = "fix_pa_origin:south-korea=>$exp_slug";
            if ($has_bad_copy) $action .= "|fix_bad_copy";
            $counts['high_confidence_auto_fix']++;
            fputcsv($audit_fh, [
                'high', 'high_confidence_auto_fix', $post_id, $slug, $title, $sku,
                $brand_names_str, $brand_slugs_str,
                $origin_names_str, $origin_slugs_str, $cat_str,
                $det_brand, $det_bslug, $exp_origin, $exp_slug,
                $has_bad_copy ? 'yes' : 'no', $bad_copy_flds_str,
                emart_audit_snippet($desc), emart_audit_snippet($excerpt),
                "pa_origin=Korea/South Korea but brand/title maps to $exp_origin", $action,
            ]);
        }
        continue;
    }

    // ── Case 2: Korea origin, no conflicting non-Korean brand identified ────
    // These are legitimately Korean products — origin is CORRECT.
    // Track bad copy separately; do not call them medium_review_needed.
    if ($is_korea_origin && (!$exp_slug || $exp_slug === 'south-korea')) {
        if ($has_bad_copy) {
            $counts['correct_origin_bad_copy']++;
            fputcsv($audit_fh, [
                'low', 'correct_origin_bad_copy', $post_id, $slug, $title, $sku,
                $brand_names_str, $brand_slugs_str,
                $origin_names_str, $origin_slugs_str, $cat_str,
                $det_brand, $det_bslug, 'South Korea', 'south-korea',
                'yes', $bad_copy_flds_str,
                emart_audit_snippet($desc), emart_audit_snippet($excerpt),
                'Korean product correctly tagged; generic Korea-import copy still present',
                'fix_bad_copy_only',
            ]);
        } else {
            $counts['already_correct']++;
        }
        continue;
    }

    // ── Case 3: No Korea origin but bad copy still present ────────────────
    if (!$is_korea_origin && $has_bad_copy) {
        $confidence = 'high';
        $class      = 'high_confidence_auto_fix';
        $reason     = "Non-Korea origin ($origin_names_str) but bad copy phrases remain";
        $action     = 'fix_bad_copy_only';
        $counts['no_korea_origin_bad_copy']++;

        fputcsv($audit_fh, [
            $confidence, $class, $post_id, $slug, $title, $sku,
            $brand_names_str, $brand_slugs_str,
            $origin_names_str, $origin_slugs_str, $cat_str,
            $det_brand, $det_bslug, $exp_origin, $exp_slug,
            'yes', $bad_copy_flds_str,
            emart_audit_snippet($desc), emart_audit_snippet($excerpt),
            $reason, $action,
        ]);
        continue;
    }

    // ── Case 4: Brand taxonomy mismatch — only relevant when origin would change ─
    // Skip: sub-brand/parent relationships (Melano CC→Rohto, Hada Labo→Rohto, etc.)
    // Skip: spelling/accent variants (L'Oréal/L'Oreal, SkinAqua/Skin Aqua)
    // Skip: products whose current origin is already correct (not Korea)
    if ($det_bslug && !empty($brand_slugs) && !in_array($det_bslug, $brand_slugs, true)) {
        // Check if detected slug is a known sub-brand of the taxonomy brand
        $is_subbrand_match = false;
        if (isset($KNOWN_SUBBRAND_TO_PARENT[$det_bslug])) {
            foreach ($brand_slugs as $bs) {
                if (in_array($bs, $KNOWN_SUBBRAND_TO_PARENT[$det_bslug], true)) {
                    $is_subbrand_match = true;
                    break;
                }
            }
        }
        // Check for slug alias variants of the same brand
        $is_alias_match = false;
        if (isset($KNOWN_BRAND_SLUG_ALIASES[$det_bslug])) {
            foreach ($brand_slugs as $bs) {
                if (in_array($bs, $KNOWN_BRAND_SLUG_ALIASES[$det_bslug], true)) {
                    $is_alias_match = true;
                    break;
                }
            }
        }

        $tax_lower = strtolower($brand_names_str);
        $det_lower = strtolower($det_brand);
        $is_name_match = strpos($tax_lower, $det_lower) !== false;

        if (!$is_subbrand_match && !$is_alias_match && !$is_name_match) {
            // Only flag if the origin would actually be different (in scope for this audit)
            $det_origin_from_map = $BRAND_ORIGIN_MAP[$det_bslug][1] ?? '';
            if ($det_origin_from_map && $det_origin_from_map !== $origin_slugs_str) {
                $counts['brand_taxonomy_mismatch']++;
                fputcsv($audit_fh, [
                    'medium', 'brand_taxonomy_mismatch', $post_id, $slug, $title, $sku,
                    $brand_names_str, $brand_slugs_str,
                    $origin_names_str, $origin_slugs_str, $cat_str,
                    $det_brand, $det_bslug, $exp_origin, $exp_slug,
                    $has_bad_copy ? 'yes' : 'no', $bad_copy_flds_str,
                    emart_audit_snippet($desc), emart_audit_snippet($excerpt),
                    "Title suggests '$det_brand' (origin: $det_origin_from_map) but taxonomy brand is '$brand_names_str' (origin: $origin_slugs_str)",
                    "review_brand_taxonomy_mismatch",
                ]);
                continue;
            }
        }
    }

    // ── Already correct ───────────────────────────────────────────────────
    $counts['already_correct']++;
}

fclose($audit_fh);

// ── Summary ───────────────────────────────────────────────────────────────
$summary_path = "$active_dir/wrong-korea-origin-audit-summary-$stamp.txt";
$lines = ["mode=audit_only", "stamp=$stamp"];
foreach ($counts as $k => $v) $lines[] = "$k=$v";
$lines[] = "audit_csv=$audit_path";
file_put_contents($summary_path, implode("\n", $lines) . "\n");

echo implode("\n", $lines) . "\n";
echo "\nAudit CSV: $audit_path\n";
