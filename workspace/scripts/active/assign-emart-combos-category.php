<?php
/**
 * Assign all excluded-combo products to the "Emart Combos" product_cat.
 * For single-brand kits, also ensure product_brand taxonomy is set.
 *
 * READ + WRITE — this mutates WooCommerce product categories and brand terms.
 * Run after reviewing excluded-combos CSV.
 *
 * Usage: wp eval-file workspace/scripts/active/assign-emart-combos-category.php --allow-root
 */

$excluded_csv = '/root/emart-platform/workspace/audit/active/duplicate-products-brand-size-excluded-combos.csv';
$result_file  = '/root/emart-platform/workspace/audit/active/emart-combos-assign-' . date('Ymd-His') . '.csv';

// ── 1. Get or create "Emart Combos" product_cat ──────────────────────────────
$cat_slug = 'emart-combos';
$existing = get_term_by( 'slug', $cat_slug, 'product_cat' );

if ( $existing && ! is_wp_error( $existing ) ) {
    $emart_combos_id = (int) $existing->term_id;
    echo "Category exists: Emart Combos (ID {$emart_combos_id})\n";
} else {
    $inserted = wp_insert_term( 'Emart Combos', 'product_cat', [
        'slug'        => $cat_slug,
        'description' => 'Curated multi-product bundles, kits, and combo sets from Emart Skincare Bangladesh.',
        'parent'      => 0,  // top-level
    ] );
    if ( is_wp_error( $inserted ) ) {
        fwrite( STDERR, "Failed to create category: " . $inserted->get_error_message() . "\n" );
        exit( 1 );
    }
    $emart_combos_id = (int) $inserted['term_id'];
    echo "Created category: Emart Combos (ID {$emart_combos_id}, slug: {$cat_slug})\n";
}

// ── 2. Read excluded-combos CSV ───────────────────────────────────────────────
$fh     = fopen( $excluded_csv, 'r' );
$header = fgetcsv( $fh );
$idx    = array_flip( $header );

$out = fopen( $result_file, 'w' );
fputcsv( $out, [
    'product_id', 'product_title', 'brand_count', 'brand_names',
    'cat_assigned', 'brand_assigned', 'action', 'note',
] );

$summary = [
    'total'          => 0,
    'cat_added'      => 0,
    'cat_already'    => 0,
    'brand_added'    => 0,
    'brand_already'  => 0,
    'single_brand'   => 0,
    'multi_brand'    => 0,
    'no_brand'       => 0,
    'skipped'        => 0,
];

while ( ( $row = fgetcsv( $fh ) ) !== false ) {
    $id    = (int) ( $row[ $idx['product_id'] ] ?? 0 );
    $title = $row[ $idx['product_title'] ] ?? '';
    if ( ! $id ) continue;

    $summary['total']++;
    $post = get_post( $id );
    if ( ! $post || $post->post_status !== 'publish' ) {
        fputcsv( $out, [ $id, $title, 0, '', 'no', 'no', 'SKIPPED', 'not published' ] );
        $summary['skipped']++;
        continue;
    }

    // ── current brand terms ──────────────────────────────────────────────────
    $brand_terms = wp_get_object_terms( $id, 'product_brand' );
    $brand_names = is_wp_error( $brand_terms ) ? [] : wp_list_pluck( $brand_terms, 'name' );
    $brand_ids   = is_wp_error( $brand_terms ) ? [] : array_map( 'intval', wp_list_pluck( $brand_terms, 'term_id' ) );
    $brand_count = count( $brand_names );

    if ( $brand_count === 0 ) $summary['no_brand']++;
    elseif ( $brand_count === 1 ) $summary['single_brand']++;
    else $summary['multi_brand']++;

    // ── assign "Emart Combos" product_cat (append, don't replace) ───────────
    $current_cats = wp_get_object_terms( $id, 'product_cat', [ 'fields' => 'ids' ] );
    $current_cats = is_wp_error( $current_cats ) ? [] : array_map( 'intval', $current_cats );

    $cat_assigned  = 'no';
    if ( in_array( $emart_combos_id, $current_cats, true ) ) {
        $cat_assigned = 'already';
        $summary['cat_already']++;
    } else {
        $new_cats = array_unique( array_merge( $current_cats, [ $emart_combos_id ] ) );
        $res = wp_set_object_terms( $id, $new_cats, 'product_cat' );
        if ( is_wp_error( $res ) ) {
            $cat_assigned = 'error:' . $res->get_error_message();
        } else {
            $cat_assigned = 'added';
            $summary['cat_added']++;
        }
    }

    // ── for single-brand: verify product_brand is set (already is for most) ─
    $brand_assigned = 'n/a';
    if ( $brand_count === 1 ) {
        // Brand already set — confirm it's correct, no change needed
        $brand_assigned = 'already:' . $brand_names[0];
        $summary['brand_already']++;
    } elseif ( $brand_count === 0 ) {
        // No brand — try to infer from title
        $inferred = infer_brand_from_title( $title );
        if ( $inferred ) {
            $term = get_term_by( 'name', $inferred, 'product_brand' ) ?: get_term_by( 'slug', sanitize_title( $inferred ), 'product_brand' );
            if ( $term && ! is_wp_error( $term ) ) {
                $new_brands = [ $term->term_id ];
                $res = wp_set_object_terms( $id, $new_brands, 'product_brand' );
                if ( is_wp_error( $res ) ) {
                    $brand_assigned = 'error';
                } else {
                    $brand_assigned = 'added:' . $inferred;
                    $summary['brand_added']++;
                }
            } else {
                $brand_assigned = 'inferred_not_in_taxonomy:' . $inferred;
            }
        } else {
            $brand_assigned = 'multi_or_emart_bundle';
        }
    } else {
        $brand_assigned = 'multi:' . implode( '+', $brand_names );
    }

    $action = ( $cat_assigned === 'added' ) ? 'ADDED_TO_EMART_COMBOS' : 'ALREADY_IN_CAT';
    fputcsv( $out, [
        $id, $title, $brand_count, implode( ' + ', $brand_names ),
        $cat_assigned, $brand_assigned, $action, '',
    ] );

    echo ( $cat_assigned === 'added' ? '+' : '.' );
}

fclose( $fh );
fclose( $out );

echo "\n\n=== SUMMARY ===\n";
echo "total_processed:   {$summary['total']}\n";
echo "cat_added:         {$summary['cat_added']}\n";
echo "cat_already:       {$summary['cat_already']}\n";
echo "brand_added:       {$summary['brand_added']}\n";
echo "brand_already:     {$summary['brand_already']}\n";
echo "single_brand_kits: {$summary['single_brand']}\n";
echo "multi_brand:       {$summary['multi_brand']}\n";
echo "no_brand:          {$summary['no_brand']}\n";
echo "skipped:           {$summary['skipped']}\n";
echo "\nResult: {$result_file}\n";
echo "Category URL: https://e-mart.com.bd/category/emart-combos\n";

// ── helpers ──────────────────────────────────────────────────────────────────
function infer_brand_from_title( string $title ): string {
    static $brands = null;
    if ( $brands === null ) {
        $terms = get_terms( [ 'taxonomy' => 'product_brand', 'hide_empty' => false, 'number' => 0 ] );
        $brands = [];
        foreach ( $terms as $t ) {
            $brands[ strtolower( $t->name ) ] = $t->name;
        }
    }
    $lower = strtolower( html_entity_decode( $title, ENT_QUOTES ) );
    $matches = [];
    foreach ( $brands as $key => $name ) {
        if ( strpos( $lower, $key ) !== false ) {
            $matches[ strlen( $key ) ] = $name;
        }
    }
    if ( ! $matches ) return '';
    krsort( $matches );
    return array_values( $matches )[0];
}
