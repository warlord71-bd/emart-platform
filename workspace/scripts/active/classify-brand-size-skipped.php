<?php
/**
 * Classify 446 skipped brand/size products into:
 *   - excluded-combos  (combo / bundle / set / kit rows)
 *   - apply-ready      (high-confidence brand or size proposal)
 *   - manual-review    (needs human judgment)
 *
 * Output: three CSVs in workspace/audit/active/
 * This script is READ-ONLY — it never updates any WooCommerce data.
 *
 * Usage: wp eval-file workspace/scripts/active/classify-brand-size-skipped.php --allow-root
 */

$skipped_csv = '/root/emart-platform/workspace/audit/active/duplicate-products-brand-size-skipped.csv';
$out_dir     = '/root/emart-platform/workspace/audit/active';

// ── output files ─────────────────────────────────────────────────────────────
$f_apply    = fopen( "$out_dir/duplicate-products-brand-size-apply-ready.csv",    'w' );
$f_manual   = fopen( "$out_dir/duplicate-products-brand-size-manual-review.csv",  'w' );
$f_excluded = fopen( "$out_dir/duplicate-products-brand-size-excluded-combos.csv",'w' );

$shared_header = [
    'reason', 'product_id', 'product_title', 'current_brand',
    'proposed_brand', 'brand_change',
    'current_size_attr', 'proposed_size', 'size_note',
    'confidence', 'action', 'classify_reason',
];
fputcsv( $f_apply,    $shared_header );
fputcsv( $f_manual,   $shared_header );
fputcsv( $f_excluded, $shared_header );

// ── known brand slug → taxonomy term name mapping ────────────────────────────
// Queried once from WP; maps normalised title token → canonical term name.
$brand_terms = get_terms( [ 'taxonomy' => 'product_brand', 'hide_empty' => false, 'number' => 0 ] );
$slug_to_name = [];
$name_lower_to_name = [];
foreach ( $brand_terms as $t ) {
    $slug_to_name[ $t->slug ]                   = $t->name;
    $name_lower_to_name[ strtolower( $t->name ) ] = $t->name;
}

function find_brand_in_title( string $title, array $name_lower_to_name ): string {
    $lower = strtolower( html_entity_decode( $title, ENT_QUOTES ) );
    // Try longest match first to avoid partial hits
    $matches = [];
    foreach ( $name_lower_to_name as $key => $name ) {
        if ( strpos( $lower, $key ) !== false ) {
            $matches[ $key ] = $name;
        }
    }
    if ( ! $matches ) return '';
    // Return longest key match (most specific)
    uasort( $matches, fn( $a, $b ) => strlen( $b ) - strlen( $a ) );
    return array_values( $matches )[0];
}

// ── combo / set / bundle detection ───────────────────────────────────────────
// Word-boundary patterns: match whole words only to avoid false positives
// (e.g. "Set+Smooth" should NOT match " set " as a combo)
$combo_patterns = [
    '/\bcombo\b/i',
    '/\bkit\b/i',
    '/\bbundle\b/i',
    '/\bduo\b/i',
    '/\btrio\b/i',
    '/\bgift set\b/i',
    '/\bvalue.?pack\b/i',
    '/\bskincare set\b/i',
    '/\bskin set\b/i',
    '/\bfavorites? set\b/i',
    '/\bbestsell\w+ set\b/i',
    '/\b\d+.?step\b/i',   // "3-Step", "4 Step"
    '/\b\d+.?item\b/i',   // "4 item", "5 items"
    '/\b\d+.?serum\b/i',  // "4 serum" in a discovery kit
    '/\bemart.?combo\b/i',
    '/\bemart.?exclusive\b/i',
    '/\btravel kit\b/i',
    '/\btrial kit\b/i',
    '/\bdiscovery kit\b/i',
    '/\bmini kit\b/i',
    '/\bglow set\b/i',
    '/\bcare set\b/i',
    '/\bsolution set\b/i',
    '/\bacne solution\b.*\bcombo\b/i',
];

function is_combo( string $title ): bool {
    static $patterns = null;
    if ( $patterns === null ) {
        $patterns = [
            '/\bcombo\b/i', '/\bkit\b/i', '/\bbundle\b/i', '/\bduo\b/i', '/\btrio\b/i',
            '/\bgift set\b/i', '/\bvalue.?pack\b/i', '/\bskincare set\b/i',
            '/\bfavorites? set\b/i', '/\bbestsell\w+ set\b/i',
            '/\b\d+.?step\b/i', '/\b\d+.?item\b/i', '/\b\d+.?serum\b/i',
            '/\bemart.?combo\b/i', '/\bemart.?exclusive\b/i',
            '/\btravel kit\b/i', '/\btrial kit\b/i', '/\bdiscovery kit\b/i',
            '/\bmini kit\b/i', '/\bglow set\b/i', '/\bcare set\b/i',
        ];
    }
    foreach ( $patterns as $pattern ) {
        if ( preg_match( $pattern, $title ) ) return true;
    }
    if ( preg_match( '/\b\d+[\s-]piece\b/i', $title ) ) return true;
    return false;
}

// ── pa_pack-size attribute term lookup ───────────────────────────────────────
function get_pack_size_attr( int $id ): string {
    $product = wc_get_product( $id );
    if ( ! $product ) return '';
    $attrs = $product->get_attributes() ?: [];
    foreach ( $attrs as $key => $attr ) {
        if ( in_array( $key, [ 'pa_pack-size', 'pa_size', 'pa_volume' ], true ) ) {
            $options = $attr->get_options();
            if ( $options ) {
                // Term IDs or term names
                $names = [];
                foreach ( $options as $opt ) {
                    if ( is_numeric( $opt ) ) {
                        $t = get_term( (int) $opt );
                        $names[] = $t ? $t->name : $opt;
                    } else {
                        $names[] = $opt;
                    }
                }
                return implode( ', ', $names );
            }
        }
    }
    return '';
}

// ── current product_brand taxonomy terms ─────────────────────────────────────
function get_current_brand( int $id ): string {
    $terms = wp_get_object_terms( $id, 'product_brand' );
    if ( is_wp_error( $terms ) || ! $terms ) return '';
    return implode( ', ', wp_list_pluck( $terms, 'name' ) );
}

// ── main loop ─────────────────────────────────────────────────────────────────
$fh     = fopen( $skipped_csv, 'r' );
$header = fgetcsv( $fh );
$idx    = array_flip( $header );

$counts = [ 'apply' => 0, 'manual' => 0, 'excluded' => 0 ];

while ( ( $row = fgetcsv( $fh ) ) !== false ) {
    $reason  = $row[ $idx['reason'] ];
    $id      = (int) $row[ $idx['product_id'] ];
    $title   = $row[ $idx['product_title'] ];
    $csv_brand = $row[ $idx['brand'] ];
    $csv_size  = $row[ $idx['size'] ];

    $current_brand    = get_current_brand( $id );
    $current_size_attr = get_pack_size_attr( $id );

    $proposed_brand = '';
    $brand_change   = 'no';
    $proposed_size  = '';
    $size_note      = '';
    $confidence     = '';
    $action         = '';
    $classify_reason = '';

    // ── 1. Combo exclusion ───────────────────────────────────────────────────
    if ( is_combo( $title ) ) {
        $confidence      = 'excluded';
        $action          = 'exclude';
        $classify_reason = 'combo/bundle/set keyword in title';
        fputcsv( $f_excluded, [
            $reason, $id, $title, $current_brand,
            $proposed_brand, $brand_change,
            $current_size_attr, $proposed_size, $size_note,
            $confidence, $action, $classify_reason,
        ] );
        $counts['excluded']++;
        continue;
    }

    // ── 2. missing_brand: propose brand from title ───────────────────────────
    if ( $reason === 'missing_brand' ) {
        $found = find_brand_in_title( $title, $name_lower_to_name );
        if ( $found ) {
            $proposed_brand  = $found;
            $brand_change    = ( strtolower( $current_brand ) !== strtolower( $found ) ) ? 'yes' : 'no';
            $confidence      = 'high';
            $action          = 'assign_product_brand_taxonomy';
            $classify_reason = 'brand name found in product title; taxonomy term exists';
            fputcsv( $f_apply, [
                $reason, $id, $title, $current_brand,
                $proposed_brand, $brand_change,
                $current_size_attr, $proposed_size, $size_note,
                $confidence, $action, $classify_reason,
            ] );
            $counts['apply']++;
        } else {
            $confidence      = 'low';
            $action          = 'manual_review';
            $classify_reason = 'brand not found in title or taxonomy; needs human';
            fputcsv( $f_manual, [
                $reason, $id, $title, $current_brand,
                $proposed_brand, $brand_change,
                $current_size_attr, $proposed_size, $size_note,
                $confidence, $action, $classify_reason,
            ] );
            $counts['manual']++;
        }
        continue;
    }

    // ── 3. missing_size: check pa_pack-size attr or slug ────────────────────
    if ( $reason === 'missing_size' ) {
        // a) Already has a pa_pack-size attribute → just note it, no change needed
        if ( $current_size_attr ) {
            $proposed_size   = $current_size_attr;
            $size_note       = 'pa_pack-size attribute already set on product';
            $confidence      = 'info';
            $action          = 'no_change_needed';
            $classify_reason = 'size is already in pa_pack-size attribute';
            fputcsv( $f_manual, [
                $reason, $id, $title, $current_brand,
                $proposed_brand, $brand_change,
                $current_size_attr, $proposed_size, $size_note,
                $confidence, $action, $classify_reason,
            ] );
            $counts['manual']++;
            continue;
        }

        // b) Try to extract size from the product SLUG (slug often has size spelled out)
        $slug = $row[ $idx['slug'] ];
        $size_from_slug = '';
        if ( preg_match( '/[\-](\d+(?:[-.]\d+)?(?:ml|g|kg|l|oz|pcs?|tablets?|capsules?|sheets?|pads?|patches?|wipes?))\b/i', $slug, $m ) ) {
            $size_from_slug = strtolower( $m[1] );
        }

        if ( $size_from_slug ) {
            $proposed_size   = $size_from_slug;
            $size_note       = "extracted from product slug: $slug";
            $confidence      = 'medium';
            $action          = 'manual_review_size_from_slug';
            $classify_reason = 'size found in slug but not title; human should verify before applying';
            fputcsv( $f_manual, [
                $reason, $id, $title, $current_brand,
                $proposed_brand, $brand_change,
                $current_size_attr, $proposed_size, $size_note,
                $confidence, $action, $classify_reason,
            ] );
            $counts['manual']++;
            continue;
        }

        // c) Single-unit products (sheet mask, single item) — expected no size
        $no_size_keywords = [
            'sheet mask', 'single', 'ampoule mask', 'eye mask',
            'lip mask', 'nose strip', 'pore strip', 'puff',
            'razor', 'tweezer', 'brush', 'applicator', 'spatula',
            'headband', 'face roller', 'gua sha', 'dermaroller',
            'needle', 'exfoliating glove',
        ];
        $lower_title = strtolower( $title );
        $is_single_unit = false;
        foreach ( $no_size_keywords as $kw ) {
            if ( strpos( $lower_title, $kw ) !== false ) {
                $is_single_unit = true;
                break;
            }
        }

        if ( $is_single_unit ) {
            $size_note       = 'single-unit product type; no size expected';
            $confidence      = 'info';
            $action          = 'no_size_expected';
            $classify_reason = 'tool / sheet mask / single-use item; size N/A';
            fputcsv( $f_manual, [
                $reason, $id, $title, $current_brand,
                $proposed_brand, $brand_change,
                $current_size_attr, $proposed_size, $size_note,
                $confidence, $action, $classify_reason,
            ] );
            $counts['manual']++;
            continue;
        }

        // d) All other missing_size → manual review
        $size_note       = 'size not in title, slug, or pa_pack-size attribute';
        $confidence      = 'low';
        $action          = 'manual_review';
        $classify_reason = 'title has no parseable size; needs owner to check product page or packaging';
        fputcsv( $f_manual, [
            $reason, $id, $title, $current_brand,
            $proposed_brand, $brand_change,
            $current_size_attr, $proposed_size, $size_note,
            $confidence, $action, $classify_reason,
        ] );
        $counts['manual']++;
    }
}

fclose( $fh );
fclose( $f_apply );
fclose( $f_manual );
fclose( $f_excluded );

echo "=== CLASSIFICATION COMPLETE ===\n";
echo "apply-ready:    {$counts['apply']}\n";
echo "manual-review:  {$counts['manual']}\n";
echo "excluded-combos:{$counts['excluded']}\n";
$total = array_sum( $counts );
echo "total:          $total\n";
echo "\nOutput:\n";
echo "  $out_dir/duplicate-products-brand-size-apply-ready.csv\n";
echo "  $out_dir/duplicate-products-brand-size-manual-review.csv\n";
echo "  $out_dir/duplicate-products-brand-size-excluded-combos.csv\n";
