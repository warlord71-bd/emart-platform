<?php
/**
 * Fix products that wrongly show Korea/South Korea pa_origin
 * when the brand is clearly French, USA, Indian, UK, German, Canadian, or Japanese.
 * Also fixes brand taxonomy mismatches and remaining bad-copy phrases.
 *
 * Default mode: DRY-RUN (no mutations).
 * Apply:  APPLY=1 wp --path=/var/www/wordpress --allow-root eval-file <script>
 *
 * Dry-run:
 *   wp --path=/var/www/wordpress --allow-root eval-file \
 *     /root/emart-platform/workspace/scripts/active/fix-wrong-korea-origin-products.php
 *
 * Apply:
 *   APPLY=1 wp --path=/var/www/wordpress --allow-root eval-file \
 *     /root/emart-platform/workspace/scripts/active/fix-wrong-korea-origin-products.php
 *
 * Outputs:
 *   workspace/audit/active/wrong-korea-origin-apply-YYYYMMDD-HHMMSS.csv
 *   workspace/audit/archive/wrong-korea-origin-backup-YYYYMMDD-HHMMSS.csv
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run this through: wp --path=/var/www/wordpress --allow-root eval-file <script>\n");
    exit(1);
}

$apply       = getenv('APPLY') === '1';
$active_dir  = '/root/emart-platform/workspace/audit/active';
$archive_dir = '/root/emart-platform/workspace/audit/archive';
foreach ([$active_dir, $archive_dir] as $d) {
    if (!is_dir($d)) mkdir($d, 0755, true);
}

$stamp       = gmdate('Ymd-His');
$mode        = $apply ? 'apply' : 'dry-run';
$report_path = "$active_dir/wrong-korea-origin-$mode-$stamp.csv";
$backup_path = "$archive_dir/wrong-korea-origin-backup-$stamp.csv";
$summary_path= "$active_dir/wrong-korea-origin-$mode-summary-$stamp.txt";

// ──────────────────────────────────────────────────────────────
// Brand → expected origin map  (same conservative set as audit)
// ──────────────────────────────────────────────────────────────
$BRAND_ORIGIN_MAP = [
    // France
    'la-roche-posay'      => ['France',  'france'],
    'bioderma'            => ['France',  'france'],
    'avene'               => ['France',  'france'],
    'vichy'               => ['France',  'france'],
    'garnier'             => ['France',  'france'],
    'loreal'              => ['France',  'france'],
    'l-oreal'             => ['France',  'france'],
    'uriage'              => ['France',  'france'],
    'nuxe'                => ['France',  'france'],
    'embryolisse'         => ['France',  'france'],
    'caudalie'            => ['France',  'france'],
    'svr'                 => ['France',  'france'],
    'ducray'              => ['France',  'france'],
    // USA
    'cetaphil'            => ['USA',     'usa'],
    'cerave'              => ['USA',     'usa'],
    'neutrogena'          => ['USA',     'usa'],
    'aveeno'              => ['USA',     'usa'],
    'vaseline'            => ['USA',     'usa'],
    'ponds'               => ['USA',     'usa'],
    'palmers'             => ['USA',     'usa'],
    'bath-and-body-works' => ['USA',     'usa'],
    'clean-and-clear'     => ['USA',     'usa'],
    'st-ives'             => ['USA',     'usa'],
    'freeman'             => ['USA',     'usa'],
    'vanicream'           => ['USA',     'usa'],
    'maybelline'          => ['USA',     'usa'],
    'm-a-c'               => ['USA',     'usa'],
    'absolute-new-york'   => ['USA',     'usa'],
    'topicals'            => ['USA',     'usa'],
    // UK
    'simple'              => ['UK',      'uk'],
    'the-inkey-list'      => ['UK',      'uk'],
    'the-body-shop'       => ['UK',      'uk'],
    'technic'             => ['UK',      'uk'],
    'durex'               => ['UK',      'uk'],
    'veet'                => ['UK',      'uk'],
    'sudocrem'            => ['UK',      'uk'],
    'beauty-formulas'     => ['UK',      'uk'],
    'revolution'          => ['UK',      'uk'],
    // Canada
    'the-ordinary'        => ['Canada',  'canada'],
    'deciem'              => ['Canada',  'canada'],
    // Germany
    'eucerin'             => ['Germany', 'germany'],
    'nivea'               => ['Germany', 'germany'],
    'sebamed'             => ['Germany', 'germany'],
    // India
    'the-derma-co'        => ['India',   'india'],
    'minimalist'          => ['India',   'india'],
    'mamaearth'           => ['India',   'india'],
    'wishcare'            => ['India',   'india'],
    'aqualogica'          => ['India',   'india'],
    'dot-and-key'         => ['India',   'india'],
    'swiss-beauty'        => ['India',   'india'],
    'insight'             => ['India',   'india'],
    // Japan
    'biore'               => ['Japan',   'japan'],
    'rohto-mentholatum'   => ['Japan',   'japan'],
    'hada-labo'           => ['Japan',   'japan'],
    'skinaqua'            => ['Japan',   'japan'],
    'skin-aqua'           => ['Japan',   'japan'],
    'daiso'               => ['Japan',   'japan'],
    'sana'                => ['Japan',   'japan'],
    'naturie-hatomagi'    => ['Japan',   'japan'],
    'muji'                => ['Japan',   'japan'],
    'cow-brand'           => ['Japan',   'japan'],
    'syoss'               => ['Japan',   'japan'],
    'skinlife'            => ['Japan',   'japan'],
    'yanagiya'            => ['Japan',   'japan'],
    'omi-brotherhood'     => ['Japan',   'japan'],
    'reikhaku'            => ['Japan',   'japan'],
    'cezanne'             => ['Japan',   'japan'],
];

// Title patterns for detecting brand (longest/most-specific first)
$TITLE_PATTERNS = [
    ['la roche-posay',     'La Roche-Posay',    'la-roche-posay',    'France',  'france'],
    ['la roche posay',     'La Roche-Posay',    'la-roche-posay',    'France',  'france'],
    ['bioderma',           'Bioderma',          'bioderma',          'France',  'france'],
    ['avène',              'Avène',             'avene',             'France',  'france'],
    ['avene',              'Avène',             'avene',             'France',  'france'],
    ['vichy',              'Vichy',             'vichy',             'France',  'france'],
    ['garnier',            'Garnier',           'garnier',           'France',  'france'],
    ["l'oréal",            "L'Oréal",           'l-oreal',           'France',  'france'],
    ["l'oreal",            "L'Oréal",           'l-oreal',           'France',  'france'],
    ['loreal',             "L'Oréal",           'loreal',            'France',  'france'],
    ['uriage',             'Uriage',            'uriage',            'France',  'france'],
    ['nuxe',               'Nuxe',              'nuxe',              'France',  'france'],
    ['embryolisse',        'Embryolisse',       'embryolisse',       'France',  'france'],
    ['caudalie',           'Caudalie',          'caudalie',          'France',  'france'],
    ['the ordinary',       'The Ordinary',      'the-ordinary',      'Canada',  'canada'],
    ['cetaphil',           'Cetaphil',          'cetaphil',          'USA',     'usa'],
    ['cerave',             'CeraVe',            'cerave',            'USA',     'usa'],
    ['cera ve',            'CeraVe',            'cerave',            'USA',     'usa'],
    ['neutrogena',         'Neutrogena',        'neutrogena',        'USA',     'usa'],
    ['aveeno',             'Aveeno',            'aveeno',            'USA',     'usa'],
    ['vaseline',           'Vaseline',          'vaseline',          'USA',     'usa'],
    ["palmer's",           "Palmer's",          'palmers',           'USA',     'usa'],
    ['palmers',            "Palmer's",          'palmers',           'USA',     'usa'],
    ['bath & body works',  'Bath & Body Works', 'bath-and-body-works','USA',    'usa'],
    ['bath and body works','Bath & Body Works', 'bath-and-body-works','USA',    'usa'],
    ['clean & clear',      'Clean & Clear',     'clean-and-clear',   'USA',     'usa'],
    ['st. ives',           'St. Ives',          'st-ives',           'USA',     'usa'],
    ['st ives',            'St. Ives',          'st-ives',           'USA',     'usa'],
    ['freeman',            'Freeman',           'freeman',           'USA',     'usa'],
    ['vanicream',          'Vanicream',         'vanicream',         'USA',     'usa'],
    ['maybelline',         'Maybelline',        'maybelline',        'USA',     'usa'],
    ['the body shop',      'The Body Shop',     'the-body-shop',     'UK',      'uk'],
    ['simple kind to skin', 'Simple',            'simple',            'UK',      'uk'],
    ['simple kind',        'Simple',            'simple',            'UK',      'uk'],
    ['the inkey list',     'The Inkey List',    'the-inkey-list',    'UK',      'uk'],
    ['durex',              'Durex',             'durex',             'UK',      'uk'],
    ['sudocrem',           'Sudocrem',          'sudocrem',          'UK',      'uk'],
    ['eucerin',            'Eucerin',           'eucerin',           'Germany', 'germany'],
    ['nivea',              'Nivea',             'nivea',             'Germany', 'germany'],
    ['sebamed',            'SebaMed',           'sebamed',           'Germany', 'germany'],
    ['the derma co',       'The Derma Co',      'the-derma-co',      'India',   'india'],
    ['minimalist',         'Minimalist',        'minimalist',        'India',   'india'],
    ['mamaearth',          'Mamaearth',         'mamaearth',         'India',   'india'],
    ['wishcare',           'Wishcare',          'wishcare',          'India',   'india'],
    ['aqualogica',         'Aqualogica',        'aqualogica',        'India',   'india'],
    ['dot & key',          'Dot & Key',         'dot-and-key',       'India',   'india'],
    ['dot and key',        'Dot & Key',         'dot-and-key',       'India',   'india'],
    ['hada labo',          'Hada Labo',         'hada-labo',         'Japan',   'japan'],
    ['biore',              'Biore',             'biore',             'Japan',   'japan'],
    ['rohto',              'Rohto',             'rohto-mentholatum', 'Japan',   'japan'],
    ['melano cc',          'Melano CC',         'melano-cc',         'Japan',   'japan'],
    ['skin aqua',          'SkinAqua',          'skinaqua',          'Japan',   'japan'],
    ['senka',              'Senka',             'senka',             'Japan',   'japan'],
    ['daiso',              'Daiso',             'daiso',             'Japan',   'japan'],
    ['naturie',            'Naturie',           'naturie-hatomagi',  'Japan',   'japan'],
    ['muji',               'Muji',              'muji',              'Japan',   'japan'],
];

// Origin adjective map for safe copy replacement
$ORIGIN_ADJECTIVE = [
    'France'   => 'French',
    'Germany'  => 'German',
    'Canada'   => 'Canadian',
    'USA'      => 'USA-origin',
    'UK'       => 'UK-origin',
    'India'    => 'Indian',
    'Japan'    => 'Japanese',
    'Bangladesh' => 'Bangladeshi',
    'South Korea'=> 'Korean',
];

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function emart_fix_detect_brand(string $title, array $patterns): array {
    $lower = strtolower(html_entity_decode($title, ENT_QUOTES | ENT_HTML5));
    foreach ($patterns as $p) {
        if (strpos($lower, $p[0]) !== false) return $p;
    }
    return [];
}

function emart_fix_origin_terms(int $post_id): array {
    $terms = wp_get_object_terms($post_id, 'pa_origin');
    if (is_wp_error($terms) || empty($terms)) return [];
    return array_map(fn($t) => [
        'id'   => (int) $t->term_id,
        'name' => (string) $t->name,
        'slug' => (string) $t->slug,
    ], $terms);
}

function emart_fix_is_korea_origin(array $terms): bool {
    foreach ($terms as $t) {
        if (str_contains(strtolower($t['slug']), 'korea') || str_contains(strtolower($t['name']), 'korea')) return true;
    }
    return false;
}

function emart_fix_has_korea_conflict(string $title): bool {
    return (bool) preg_match('/korean?\s+version|made\s+in\s+korea|korea\s+edition|korean?\s+edition/i', strtolower($title));
}

function emart_fix_is_combo(string $title, string $sku): bool {
    $lower = strtolower($title);
    return str_contains($lower, 'combo') || str_contains($lower, 'bundle') || str_starts_with($sku, 'combo');
}

function emart_fix_has_bad_copy(string $value): bool {
    return (bool) preg_match('/(?:korea\s+imports?|korean\s+imports?|imported\s+from\s+korea)/i', $value);
}

function emart_fix_snippet(string $html, int $max = 180): string {
    $plain = trim(preg_replace('/\s+/', ' ', wp_strip_all_tags($html)));
    return strlen($plain) <= $max ? $plain : substr($plain, 0, $max - 3) . '...';
}

/**
 * Get or create a pa_origin term by slug+name.
 * Returns term_id or 0 on failure.
 */
function emart_fix_get_or_create_origin_term(string $origin_name, string $origin_slug): int {
    $existing = get_term_by('slug', $origin_slug, 'pa_origin');
    if ($existing && !is_wp_error($existing)) return (int) $existing->term_id;

    $result = wp_insert_term($origin_name, 'pa_origin', ['slug' => $origin_slug]);
    if (is_wp_error($result)) {
        fwrite(STDERR, "Failed to create pa_origin term '$origin_name': " . $result->get_error_message() . "\n");
        return 0;
    }
    return (int) $result['term_id'];
}

/**
 * Replace Korea-import copy with origin-specific safe wording.
 */
function emart_fix_replace_copy(string $value, string $adj_singular, string $adj_plural): string {
    $after = $value;
    $replacements = [
        '/100%\s+authentic\s+and\s+directly\s+imported\s+from\s+Korea/i' => "100% authentic $adj_singular product",
        '/100%\s+authentic\s+Korea\s+imports/i'  => "100% authentic $adj_plural products",
        '/100%\s+authentic\s+Korean\s+imports/i' => "100% authentic $adj_plural products",
        '/100%\s+authentic\s+Korea\s+import/i'   => "100% authentic $adj_singular product",
        '/100%\s+authentic\s+Korean\s+import/i'  => "100% authentic $adj_singular product",
        '/authentic\s+and\s+directly\s+imported\s+from\s+Korea/i' => "authentic $adj_singular product",
        '/directly\s+imported\s+from\s+Korea/i'  => "$adj_singular product",
        '/imported\s+from\s+Korea/i'             => "$adj_singular product",
        '/Korea\s+imports/i'                     => "$adj_plural products",
        '/Korean\s+imports/i'                    => "$adj_plural products",
        '/Korea\s+import/i'                      => "$adj_singular product",
        '/Korean\s+import/i'                     => "$adj_singular product",
    ];
    foreach ($replacements as $pat => $repl) {
        $after = preg_replace($pat, $repl, $after);
    }
    return $after;
}

// ──────────────────────────────────────────────────────────────
// Main loop
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

$report_fh = fopen($report_path, 'w');
$backup_fh = fopen($backup_path, 'w');

fputcsv($report_fh, [
    'action', 'post_id', 'slug', 'title', 'field', 'meta_key',
    'before_snippet', 'after_snippet', 'expected_origin', 'reason',
]);
fputcsv($backup_fh, [
    'post_id', 'slug', 'title', 'field', 'meta_key', 'original_value',
]);

$counts = [
    'mode'                        => $mode,
    'published_products_scanned'  => count($ids),
    'products_changed'            => 0,
    'pa_origin_fixes'             => 0,
    'brand_taxonomy_fixes'        => 0,
    'copy_fixes_post_content'     => 0,
    'copy_fixes_post_excerpt'     => 0,
    'copy_fixes_meta'             => 0,
    'skipped_ambiguous'           => 0,
    'skipped_no_match'            => 0,
    'skipped_already_correct'     => 0,
];

$changed_post_ids = [];

foreach ($ids as $post_id) {
    $post    = get_post($post_id);
    if (!$post) continue;
    $product = wc_get_product($post_id);

    $title   = html_entity_decode($post->post_title, ENT_QUOTES | ENT_HTML5);
    $slug    = $post->post_name;
    $desc    = (string) $post->post_content;
    $excerpt = (string) $post->post_excerpt;

    // Brand taxonomy
    $brand_terms = wp_get_object_terms($post_id, 'product_brand');
    $brand_slugs = [];
    $brand_names = [];
    if (!is_wp_error($brand_terms)) {
        foreach ($brand_terms as $bt) {
            $brand_slugs[] = $bt->slug;
            $brand_names[] = $bt->name;
        }
    }

    // Detect brand from title
    $detected = emart_fix_detect_brand($title, $TITLE_PATTERNS);
    $det_bslug = $detected[2] ?? '';
    $exp_origin_name = $detected[3] ?? '';
    $exp_origin_slug = $detected[4] ?? '';

    // Fall back to taxonomy brand if title match didn't give a non-Korea origin
    if ((!$exp_origin_slug || $exp_origin_slug === 'south-korea') && !empty($brand_slugs)) {
        foreach ($brand_slugs as $bs) {
            if (isset($BRAND_ORIGIN_MAP[$bs]) && $BRAND_ORIGIN_MAP[$bs][1] !== 'south-korea') {
                $exp_origin_name = $BRAND_ORIGIN_MAP[$bs][0];
                $exp_origin_slug = $BRAND_ORIGIN_MAP[$bs][1];
                break;
            }
        }
    }

    $origin_terms    = emart_fix_origin_terms($post_id);
    $is_korea_origin = emart_fix_is_korea_origin($origin_terms);
    $has_conflict    = emart_fix_has_korea_conflict($title);
    $sku             = $product ? (string) $product->get_sku() : '';
    $is_combo        = emart_fix_is_combo($title, $sku);

    // Combo/bundle and conflict-title products: skip origin+brand fixes only.
    // Copy cleanup (Fix 3 + Fix 4) still runs — "Korea import" → "Korean product" is safe.
    $skip_origin_fixes = $is_combo || ($is_korea_origin && $has_conflict);
    if ($skip_origin_fixes) $counts['skipped_ambiguous']++;

    // Determine adjective for copy replacement
    $adj  = isset($ORIGIN_ADJECTIVE[$exp_origin_name]) ? $ORIGIN_ADJECTIVE[$exp_origin_name] : 'Emart-verified';
    $adj_s = $adj;   // singular adjective
    $adj_p = $adj;   // plural (same for our purposes)

    $product_was_changed = false;

    // ── Fix 1: pa_origin attribute ────────────────────────────────────
    if (!$skip_origin_fixes && $is_korea_origin && $exp_origin_slug && $exp_origin_slug !== 'south-korea') {
        $korea_term_ids = [];
        foreach ($origin_terms as $ot) {
            if (str_contains(strtolower($ot['slug']), 'korea')) {
                $korea_term_ids[] = $ot['id'];
            }
        }

        foreach ($korea_term_ids as $bad_tid) {
            $bad_term = get_term($bad_tid, 'pa_origin');
            $bad_name = $bad_term ? $bad_term->name : "term_id=$bad_tid";
            $bad_slug = $bad_term ? $bad_term->slug : '';

            fputcsv($backup_fh, [
                $post_id, $slug, $title,
                'pa_origin_term', '',
                "term_name=$bad_name|term_slug=$bad_slug|term_id=$bad_tid",
            ]);
            fputcsv($report_fh, [
                $apply ? 'updated' : 'planned_update',
                $post_id, $slug, $title,
                'pa_origin_term', '',
                $bad_name, $exp_origin_name, $exp_origin_name, "Korea origin → $exp_origin_name",
            ]);
        }

        if ($apply) {
            $correct_term_id = emart_fix_get_or_create_origin_term($exp_origin_name, $exp_origin_slug);
            if ($correct_term_id) {
                // Remove Korea terms, add correct term
                foreach ($korea_term_ids as $bad_tid) {
                    wp_remove_object_terms($post_id, $bad_tid, 'pa_origin');
                }
                wp_set_object_terms($post_id, [$correct_term_id], 'pa_origin', true);
            }
        }

        if (!empty($korea_term_ids)) {
            $counts['pa_origin_fixes']++;
            $product_was_changed = true;
        }
    }

    // ── Fix 2: product_brand taxonomy mismatch ───────────────────────────
    // Known sub-brand → parent brand relationships: do NOT change these.
    $KNOWN_SUBBRAND_TO_PARENT = [
        'hada-labo'  => ['rohto-mentholatum'],
        'melano-cc'  => ['rohto-mentholatum'],
        'skin-aqua'  => ['rohto-mentholatum', 'skin-aqua'],
        'skinaqua'   => ['rohto-mentholatum'],
        'vaseline'   => ['unilever'],
    ];
    $KNOWN_BRAND_SLUG_ALIASES = [
        'l-oreal'   => ['loreal', 'l-oreal'],
        'loreal'    => ['loreal', 'l-oreal'],
        'skin-aqua' => ['skin-aqua', 'skinaqua'],
        'skinaqua'  => ['skin-aqua', 'skinaqua'],
    ];
    if (!$skip_origin_fixes && $det_bslug && !empty($brand_slugs) && !in_array($det_bslug, $brand_slugs, true)) {
        $is_subbrand = false;
        if (isset($KNOWN_SUBBRAND_TO_PARENT[$det_bslug])) {
            foreach ($brand_slugs as $bs) {
                if (in_array($bs, $KNOWN_SUBBRAND_TO_PARENT[$det_bslug], true)) { $is_subbrand = true; break; }
            }
        }
        $is_alias = false;
        if (isset($KNOWN_BRAND_SLUG_ALIASES[$det_bslug])) {
            foreach ($brand_slugs as $bs) {
                if (in_array($bs, $KNOWN_BRAND_SLUG_ALIASES[$det_bslug], true)) { $is_alias = true; break; }
            }
        }
        $tax_lower = strtolower(implode('|', $brand_names));
        $det_lower = strtolower($detected[1] ?? '');
        // Only fix if taxonomy brand is completely different (not a prefix/sub-match/alias)
        if ($det_lower && !$is_subbrand && !$is_alias && strpos($tax_lower, $det_lower) === false) {
            $correct_brand = get_term_by('slug', $det_bslug, 'product_brand');
            if ($correct_brand && !is_wp_error($correct_brand)) {
                fputcsv($backup_fh, [
                    $post_id, $slug, $title, 'product_brand_taxonomy', '',
                    "brand_name=" . implode('|', $brand_names) . "|brand_slug=" . implode('|', $brand_slugs),
                ]);
                fputcsv($report_fh, [
                    $apply ? 'updated' : 'planned_update',
                    $post_id, $slug, $title,
                    'product_brand_taxonomy', '',
                    implode('|', $brand_names), $detected[1] ?? '',
                    $exp_origin_name,
                    "Brand mismatch: taxonomy='" . implode('|', $brand_names) . "' title says '" . ($detected[1] ?? '') . "'",
                ]);

                if ($apply) {
                    wp_set_object_terms($post_id, [$correct_brand->term_id], 'product_brand', false);
                }

                $counts['brand_taxonomy_fixes']++;
                $product_was_changed = true;
            }
        }
    }

    // ── Fix 3: bad copy in post_content and post_excerpt ─────────────────
    $post_updates     = ['ID' => $post_id];
    $post_needs_write = false;

    if (emart_fix_has_bad_copy($desc)) {
        $adj_s_eff = $is_korea_origin ? ($exp_origin_slug && $exp_origin_slug !== 'south-korea' ? $adj_s : 'Korean') : $adj_s;
        $after_desc = emart_fix_replace_copy($desc, $adj_s_eff, $adj_p);
        if ($after_desc !== $desc && !emart_fix_has_bad_copy($after_desc)) {
            fputcsv($backup_fh, [$post_id, $slug, $title, 'post_content', '', $desc]);
            fputcsv($report_fh, [
                $apply ? 'updated' : 'planned_update',
                $post_id, $slug, $title, 'post_content', '',
                emart_fix_snippet($desc), emart_fix_snippet($after_desc),
                $exp_origin_name, 'bad copy in post_content',
            ]);
            $post_updates['post_content'] = $after_desc;
            $post_needs_write = true;
            $product_was_changed = true;
            $counts['copy_fixes_post_content']++;
        }
    }

    if (emart_fix_has_bad_copy($excerpt)) {
        $adj_s_eff = $is_korea_origin ? ($exp_origin_slug && $exp_origin_slug !== 'south-korea' ? $adj_s : 'Korean') : $adj_s;
        $after_exc = emart_fix_replace_copy($excerpt, $adj_s_eff, $adj_p);
        if ($after_exc !== $excerpt && !emart_fix_has_bad_copy($after_exc)) {
            fputcsv($backup_fh, [$post_id, $slug, $title, 'post_excerpt', '', $excerpt]);
            fputcsv($report_fh, [
                $apply ? 'updated' : 'planned_update',
                $post_id, $slug, $title, 'post_excerpt', '',
                emart_fix_snippet($excerpt), emart_fix_snippet($after_exc),
                $exp_origin_name, 'bad copy in post_excerpt',
            ]);
            $post_updates['post_excerpt'] = $after_exc;
            $post_needs_write = true;
            $product_was_changed = true;
            $counts['copy_fixes_post_excerpt']++;
        }
    }

    if ($apply && $post_needs_write) {
        wp_update_post(wp_slash($post_updates));
    }

    // ── Fix 4: bad copy in public meta fields ─────────────────────────────
    foreach ($public_meta_keys as $mk) {
        $values = get_post_meta($post_id, $mk, false);
        if (empty($values)) continue;
        foreach ($values as $idx => $before_val) {
            if (!is_string($before_val) || !emart_fix_has_bad_copy($before_val)) continue;

            $adj_s_eff = $is_korea_origin ? ($exp_origin_slug && $exp_origin_slug !== 'south-korea' ? $adj_s : 'Korean') : $adj_s;
            $after_val = emart_fix_replace_copy($before_val, $adj_s_eff, $adj_p);
            if ($after_val === $before_val || emart_fix_has_bad_copy($after_val)) continue;

            fputcsv($backup_fh, [$post_id, $slug, $title, 'postmeta', $mk, $before_val]);
            fputcsv($report_fh, [
                $apply ? 'updated' : 'planned_update',
                $post_id, $slug, $title, 'postmeta', $mk,
                emart_fix_snippet($before_val), emart_fix_snippet($after_val),
                $exp_origin_name, "bad copy in meta:$mk",
            ]);

            if ($apply) {
                $all_vals = get_post_meta($post_id, $mk, false);
                delete_post_meta($post_id, $mk);
                foreach ($all_vals as $vi => $vv) {
                    add_post_meta($post_id, $mk, $vi === $idx ? wp_slash($after_val) : wp_slash($vv));
                }
            }

            $counts['copy_fixes_meta']++;
            $product_was_changed = true;
        }
    }

    // ── Cache purge on apply ──────────────────────────────────────────────
    if ($apply && $product_was_changed) {
        clean_post_cache($post_id);
        clean_object_term_cache($post_id, 'pa_origin');
        clean_object_term_cache($post_id, 'product_brand');
        if (function_exists('wc_delete_product_transients')) {
            wc_delete_product_transients($post_id);
        }
    }

    if ($product_was_changed) {
        $changed_post_ids[$post_id] = true;
    }
}

fclose($report_fh);
fclose($backup_fh);

$counts['products_changed'] = count($changed_post_ids);

// ── Revalidate on apply ───────────────────────────────────────────────────
if ($apply && !empty($changed_post_ids)) {
    // Flush WC transients for all changed products (batch)
    if (function_exists('wc_delete_shop_order_transients')) {
        wc_delete_shop_order_transients();
    }
    // Attempt Next.js revalidation if endpoint is configured
    $revalidate_url = getenv('NEXTJS_REVALIDATE_URL');
    $revalidate_secret = getenv('NEXTJS_REVALIDATE_SECRET');
    if ($revalidate_url && $revalidate_secret) {
        $ch = curl_init("$revalidate_url?tag=products&secret=$revalidate_secret");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        echo "Revalidation response ($http_code): $response\n";
    }
}

// ── Summary ───────────────────────────────────────────────────────────────
$lines = [];
foreach ($counts as $k => $v) $lines[] = "$k=$v";
$lines[] = "report=$report_path";
$lines[] = "backup=$backup_path";
file_put_contents($summary_path, implode("\n", $lines) . "\n");

echo implode("\n", $lines) . "\n";
echo "\nReport: $report_path\n";
echo "Backup: $backup_path\n";
echo "Summary: $summary_path\n";

if (!$apply) {
    echo "\n--- DRY RUN COMPLETE. Set APPLY=1 to apply changes. ---\n";
} else {
    echo "\n--- APPLY COMPLETE. Verify live PDPs and push after smoke test. ---\n";
}
