<?php
/**
 * pa_concern auto-assign dry-run/apply helper.
 *
 * Run dry-run:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/content-orchestrator/scripts/active/pa-concern-auto-assign.php
 *
 * Run apply after owner approval:
 *   APPLY=1 wp --path=/var/www/wordpress --allow-root eval-file workspace/content-orchestrator/scripts/active/pa-concern-auto-assign.php
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/content-orchestrator/scripts/active/pa-concern-auto-assign.php -- --apply workspace/audit/active/pa-concern-auto-assign-YYYYMMDD.csv
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/content-orchestrator/scripts/active/pa-concern-auto-assign.php apply workspace/audit/active/pa-concern-auto-assign-YYYYMMDD.csv
 */

if ( ! defined( 'ABSPATH' ) ) {
    fwrite( STDERR, "Run with WP-CLI eval-file so WordPress is loaded.\n" );
    exit( 1 );
}

$root_dir      = '/root/emart-platform';
$manual_csv    = $root_dir . '/workspace/audit/archive/pa-concern-manual-review-20260521-174247.csv';
$highmed_csv   = $root_dir . '/workspace/audit/archive/pa-concern-highmed-approved.csv';
$out_dir       = $root_dir . '/workspace/audit/active';
$date_stamp    = date( 'Ymd' );
$dry_run_csv   = $out_dir . "/pa-concern-auto-assign-{$date_stamp}.csv";
$summary_path  = $out_dir . "/pa-concern-auto-assign-{$date_stamp}-summary.txt";

$category_map = array(
    'sunscreen'     => array( 'sun-protection' ),
    'spot-treatment'=> array( 'acne-blemish' ),
    'toner'         => array(),
    'serum'         => array(),
    'moisturizer'   => array(),
    'face-wash'     => array(),
    'eye-care'      => array( 'anti-aging' ),
    'lip-care'      => array(),
    'sheet-masks'   => array( 'dryness-hydration' ),
    'sleeping-mask' => array( 'dryness-hydration' ),
    'exfoliator'    => array( 'pore-care' ),
    'hair-care'     => array(),
    'body-wash'     => array(),
    'sunscreen-spf' => array( 'sun-protection' ),
);

$ingredient_map = array(
    'niacinamide'        => array( 'pore-care', 'brightness' ),
    'hyaluronic-acid'    => array( 'dryness-hydration' ),
    'salicylic-acid'     => array( 'acne-blemish' ),
    'retinol'            => array( 'anti-aging' ),
    'vitamin-c'          => array( 'brightness' ),
    'ceramide'           => array( 'dryness-hydration', 'sensitivity' ),
    'centella-asiatica'  => array( 'sensitivity' ),
    'tea-tree'           => array( 'acne-blemish' ),
    'aha'                => array( 'brightness', 'pore-care' ),
    'bha'                => array( 'acne-blemish', 'pore-care' ),
);

$title_keyword_map = array(
    'brightening' => array( 'brightness' ),
    'whitening'  => array( 'brightness' ),
    'acne'       => array( 'acne-blemish' ),
    'anti-aging' => array( 'anti-aging' ),
    'wrinkle'    => array( 'anti-aging' ),
    'moistur'    => array( 'dryness-hydration' ),
    'hydrat'     => array( 'dryness-hydration' ),
    'soothing'   => array( 'sensitivity' ),
    'calming'    => array( 'sensitivity' ),
    'pore'       => array( 'pore-care' ),
    'spf'        => array( 'sun-protection' ),
    'sunscreen'  => array( 'sun-protection' ),
);

// The prompt used shopper-facing concern slugs for four terms. Live Woo terms
// use these canonical slugs, verified before either dry-run or apply.
$live_slug_aliases = array(
    'sun-protection' => 'sunscreen',
    'brightness'     => 'brightening',
    'pore-care'      => 'pores-blackheads',
    'anti-aging'     => 'anti-aging-repair',
);

function emart_pa_concern_csv_ids( string $path ): array {
    if ( ! file_exists( $path ) ) {
        throw new RuntimeException( "CSV not found: {$path}" );
    }
    $ids    = array();
    $handle = fopen( $path, 'r' );
    if ( false === $handle ) {
        throw new RuntimeException( "Could not open CSV: {$path}" );
    }
    $header = fgetcsv( $handle );
    while ( false !== ( $row = fgetcsv( $handle ) ) ) {
        if ( ! isset( $row[0] ) || ! ctype_digit( trim( (string) $row[0] ) ) ) {
            continue;
        }
        $ids[] = (int) trim( (string) $row[0] );
    }
    fclose( $handle );
    return array_values( array_unique( $ids ) );
}

function emart_pa_concern_highmed_protected_ids( string $path, array $live_slugs, array $aliases ): array {
    if ( ! file_exists( $path ) ) {
        throw new RuntimeException( "CSV not found: {$path}" );
    }
    $ids    = array();
    $handle = fopen( $path, 'r' );
    if ( false === $handle ) {
        throw new RuntimeException( "Could not open CSV: {$path}" );
    }
    $header = fgetcsv( $handle );
    if ( false === $header ) {
        fclose( $handle );
        return array();
    }
    $header_index = array_flip( $header );
    if ( ! isset( $header_index['product_id'], $header_index['concerns_assigned'] ) ) {
        fclose( $handle );
        throw new RuntimeException( "High/medium CSV missing product_id or concerns_assigned column: {$path}" );
    }
    while ( false !== ( $row = fgetcsv( $handle ) ) ) {
        $product_id = isset( $row[ $header_index['product_id'] ] ) ? (int) $row[ $header_index['product_id'] ] : 0;
        $raw        = isset( $row[ $header_index['concerns_assigned'] ] ) ? trim( (string) $row[ $header_index['concerns_assigned'] ] ) : '';
        if ( ! $product_id || '' === $raw || 'SKIP' === strtoupper( $raw ) ) {
            continue;
        }
        $concerns = emart_pa_concern_normalize( array_map( 'trim', explode( '|', $raw ) ), $live_slugs, $aliases );
        if ( ! empty( $concerns ) ) {
            $ids[ $product_id ] = true;
        }
    }
    fclose( $handle );
    return $ids;
}

function emart_pa_concern_live_slugs(): array {
    $terms = get_terms(
        array(
            'taxonomy'   => 'pa_concern',
            'hide_empty' => false,
        )
    );
    if ( is_wp_error( $terms ) ) {
        throw new RuntimeException( $terms->get_error_message() );
    }
    $slugs = array();
    foreach ( $terms as $term ) {
        $slugs[ $term->slug ] = true;
    }
    return $slugs;
}

function emart_pa_concern_product_slugs( int $product_id, string $taxonomy ): array {
    $terms = get_the_terms( $product_id, $taxonomy );
    if ( empty( $terms ) || is_wp_error( $terms ) ) {
        return array();
    }
    return array_values(
        array_map(
            static function ( $term ) {
                return $term->slug;
            },
            $terms
        )
    );
}

function emart_pa_concern_normalize( array $slugs, array $live_slugs, array $aliases ): array {
    $out = array();
    foreach ( $slugs as $slug ) {
        $slug = $aliases[ $slug ] ?? $slug;
        if ( isset( $live_slugs[ $slug ] ) && ! in_array( $slug, $out, true ) ) {
            $out[] = $slug;
        }
        if ( 2 === count( $out ) ) {
            break;
        }
    }
    return $out;
}

function emart_pa_concern_assign(
    string $title,
    array $cat_slugs,
    array $brand_slugs,
    array $ingredient_slugs,
    array $live_slugs,
    array $aliases,
    array $category_map,
    array $ingredient_map,
    array $title_keyword_map
): array {
    $title_l = strtolower( $title );

    $skip_cat_slugs = array(
        'baby-bath-wash',
        'baby-skincare',
        'beauty-supplements',
        'diapers-wipes',
        'eyes',
        'face-makeup',
        'foundation',
        'fragrances',
        'hair-care',
        'hair-colors',
        'hair-conditioners',
        'hair-oil',
        'hair-personal-care',
        'hair-styling-products',
        'hair-treatments',
        'lipstick-tint',
        'makeup-cosmetics',
        'mascara-eyeliner',
        'mother-baby-care',
        'personal-hygiene',
        'shampoos',
    );
    foreach ( $skip_cat_slugs as $skip_cat_slug ) {
        if ( in_array( $skip_cat_slug, $cat_slugs, true ) ) {
            return array( 'skip:non-skincare-category=' . $skip_cat_slug, array() );
        }
    }

    $skip_title_fragments = array(
        'baby ',
        'bb cream',
        'bb powder',
        'blanket',
        'comforter',
        'conditioner',
        'cushion',
        'eyeliner',
        'eyeshadow',
        'false nail',
        'foundation',
        'hair ',
        'hairfall',
        'lash serum',
        'lipstick',
        'mascara',
        'nail ',
        'powder bb',
        'scalp',
        'shampoo',
        'tinting lash',
    );
    foreach ( $skip_title_fragments as $fragment ) {
        if ( false !== strpos( $title_l, $fragment ) ) {
            return array( 'skip:non-skincare-title=' . $fragment, array() );
        }
    }

    foreach ( $category_map as $cat_slug => $concerns ) {
        if ( in_array( $cat_slug, $cat_slugs, true ) && ! empty( $concerns ) ) {
            if ( 'sunscreen' === $cat_slug && ! preg_match( '/\b(sunscreen|spf|sun\s?(cream|stick|serum|milk|block)|uv)\b/i', $title ) ) {
                continue;
            }
            return array( 'category:' . $cat_slug, emart_pa_concern_normalize( $concerns, $live_slugs, $aliases ) );
        }
    }

    foreach ( $ingredient_map as $ingredient_slug => $concerns ) {
        if ( in_array( $ingredient_slug, $ingredient_slugs, true ) ) {
            return array( 'ingredient:' . $ingredient_slug, emart_pa_concern_normalize( $concerns, $live_slugs, $aliases ) );
        }
    }

    if ( in_array( 'cosrx', $brand_slugs, true ) && in_array( 'spot-treatment', $cat_slugs, true ) ) {
        return array( 'brand_category:cosrx+spot-treatment', emart_pa_concern_normalize( array( 'acne-blemish' ), $live_slugs, $aliases ) );
    }

    foreach ( $title_keyword_map as $keyword => $concerns ) {
        if ( false !== strpos( $title_l, $keyword ) ) {
            return array( 'title_keyword:' . $keyword, emart_pa_concern_normalize( $concerns, $live_slugs, $aliases ) );
        }
    }

    return array( 'no-signal', array() );
}

function emart_pa_concern_write_revalidate(): void {
    $secret = getenv( 'REVALIDATE_SECRET' ) ?: getenv( 'NEXTJS_REVALIDATE_SECRET' );
    if ( ! $secret ) {
        $env_path = '/var/www/emart-platform/apps/web/.env.local';
        if ( file_exists( $env_path ) ) {
            $lines = file( $env_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES );
            foreach ( $lines as $line ) {
                if ( preg_match( '/^REVALIDATE_SECRET=(.*)$/', $line, $match ) ) {
                    $secret = trim( $match[1], " \t\n\r\0\x0B\"'" );
                    break;
                }
            }
        }
    }
    if ( ! $secret ) {
        WP_CLI::warning( 'REVALIDATE_SECRET not found; run revalidate manually.' );
        return;
    }
    $response = wp_remote_post(
        'https://e-mart.com.bd/api/revalidate',
        array(
            'timeout' => 20,
            'headers' => array(
                'Content-Type'        => 'application/json',
                'x-revalidate-secret' => $secret,
            ),
            'body'    => wp_json_encode( array( 'tag' => 'products' ) ),
        )
    );
    if ( is_wp_error( $response ) ) {
        WP_CLI::warning( 'Revalidate failed: ' . $response->get_error_message() );
        return;
    }
    WP_CLI::log( 'Revalidate response: ' . wp_remote_retrieve_body( $response ) );
}

$args  = isset( $argv ) ? array_slice( $argv, 1 ) : array();
$apply = '1' === getenv( 'APPLY' ) || in_array( '--apply', $args, true ) || in_array( 'apply', $args, true );

$live_slugs = emart_pa_concern_live_slugs();

if ( $apply ) {
    $csv_arg = '';
    foreach ( $args as $index => $arg ) {
        if ( in_array( $arg, array( '--apply', 'apply' ), true ) && isset( $args[ $index + 1 ] ) ) {
            $csv_arg = $args[ $index + 1 ];
            break;
        }
    }
    if ( '' === $csv_arg ) {
        $csv_arg = $dry_run_csv;
    }
    $csv_path = '/' === $csv_arg[0] ? $csv_arg : $root_dir . '/' . $csv_arg;
    $handle   = fopen( $csv_path, 'r' );
    if ( false === $handle ) {
        throw new RuntimeException( "Could not open apply CSV: {$csv_path}" );
    }
    $header       = fgetcsv( $handle );
    $header_index = array_flip( $header );
    foreach ( array( 'product_id', 'concerns_to_assign' ) as $required ) {
        if ( ! isset( $header_index[ $required ] ) ) {
            throw new RuntimeException( "Missing required column: {$required}" );
        }
    }

    $applied = 0;
    $skipped = 0;
    while ( false !== ( $row = fgetcsv( $handle ) ) ) {
        $product_id = (int) $row[ $header_index['product_id'] ];
        $concerns   = array_values( array_filter( array_map( 'trim', explode( '|', (string) $row[ $header_index['concerns_to_assign'] ] ) ) ) );
        $concerns   = array_slice( array_values( array_unique( $concerns ) ), 0, 2 );
        if ( ! $product_id || empty( $concerns ) ) {
            $skipped++;
            continue;
        }
        $invalid = array_values(
            array_filter(
                $concerns,
                static function ( $slug ) use ( $live_slugs ) {
                    return ! isset( $live_slugs[ $slug ] );
                }
            )
        );
        if ( ! empty( $invalid ) ) {
            WP_CLI::warning( "Skipping {$product_id}; invalid pa_concern slug(s): " . implode( '|', $invalid ) );
            $skipped++;
            continue;
        }
        if ( 'publish' !== get_post_status( $product_id ) || 'product' !== get_post_type( $product_id ) ) {
            $skipped++;
            continue;
        }
        if ( ! empty( emart_pa_concern_product_slugs( $product_id, 'pa_concern' ) ) ) {
            $skipped++;
            continue;
        }
        $result = wp_set_object_terms( $product_id, $concerns, 'pa_concern', true );
        if ( is_wp_error( $result ) ) {
            WP_CLI::warning( "Failed {$product_id}: " . $result->get_error_message() );
            $skipped++;
            continue;
        }
        $applied++;
    }
    fclose( $handle );
    WP_CLI::success( "Applied pa_concern to {$applied} products; skipped {$skipped} rows." );
    emart_pa_concern_write_revalidate();
    return;
}

if ( ! is_dir( $out_dir ) ) {
    mkdir( $out_dir, 0755, true );
}

$manual_ids            = emart_pa_concern_csv_ids( $manual_csv );
$highmed_protected_ids = emart_pa_concern_highmed_protected_ids( $highmed_csv, $live_slugs, $live_slug_aliases );
$stats       = array(
    'manual_total'          => count( $manual_ids ),
    'skipped_highmed'       => 0,
    'skipped_not_published' => 0,
    'skipped_existing'      => 0,
    'assigned'              => 0,
    'blank'                 => 0,
);
$breakdown   = array();
$rows        = array();

foreach ( $manual_ids as $product_id ) {
    if ( isset( $highmed_protected_ids[ $product_id ] ) ) {
        $stats['skipped_highmed']++;
        continue;
    }
    if ( 'publish' !== get_post_status( $product_id ) || 'product' !== get_post_type( $product_id ) ) {
        $stats['skipped_not_published']++;
        continue;
    }
    if ( ! empty( emart_pa_concern_product_slugs( $product_id, 'pa_concern' ) ) ) {
        $stats['skipped_existing']++;
        continue;
    }

    $title            = get_the_title( $product_id );
    $cat_slugs        = emart_pa_concern_product_slugs( $product_id, 'product_cat' );
    $brand_slugs      = array_values( array_unique( array_merge( emart_pa_concern_product_slugs( $product_id, 'product_brand' ), emart_pa_concern_product_slugs( $product_id, 'pa_brand' ) ) ) );
    $ingredient_slugs = emart_pa_concern_product_slugs( $product_id, 'pa_ingredient' );
    list( $signal, $concerns ) = emart_pa_concern_assign( $title, $cat_slugs, $brand_slugs, $ingredient_slugs, $live_slugs, $live_slug_aliases, $category_map, $ingredient_map, $title_keyword_map );

    if ( empty( $concerns ) ) {
        $stats['blank']++;
        $signal = 'no-signal';
    } else {
        $stats['assigned']++;
        foreach ( $concerns as $concern ) {
            $breakdown[ $concern ] = ( $breakdown[ $concern ] ?? 0 ) + 1;
        }
    }

    $rows[] = array(
        'product_id'         => $product_id,
        'product_title'      => $title,
        'signal_used'        => $signal,
        'concerns_to_assign' => implode( '|', $concerns ),
    );
}

$handle = fopen( $dry_run_csv, 'w' );
fputcsv( $handle, array( 'product_id', 'product_title', 'signal_used', 'concerns_to_assign' ) );
foreach ( $rows as $row ) {
    fputcsv( $handle, $row );
}
fclose( $handle );

arsort( $breakdown );
$summary_lines = array(
    'pa_concern auto-assign dry-run',
    'Generated: ' . date( 'c' ),
    'CSV: ' . $dry_run_csv,
    '',
    'Input manual rows: ' . $stats['manual_total'],
    'Protected high/medium approved concern rows: ' . count( $highmed_protected_ids ),
    'Skipped because high/medium row already has approved concern(s): ' . $stats['skipped_highmed'],
    'Skipped not published/product: ' . $stats['skipped_not_published'],
    'Skipped already has pa_concern: ' . $stats['skipped_existing'],
    'Total assigned: ' . $stats['assigned'],
    'Total skipped blank: ' . $stats['blank'],
    '',
    'Concern breakdown:',
);
if ( empty( $breakdown ) ) {
    $summary_lines[] = '  none';
} else {
    foreach ( $breakdown as $concern => $count ) {
        $summary_lines[] = "  {$concern}: {$count}";
    }
}
$summary_lines[] = '';
$summary_lines[] = 'Live pa_concern slugs verified: ' . implode( ', ', array_keys( $live_slugs ) );
$summary_lines[] = 'Alias normalization used: sun-protection=>sunscreen, brightness=>brightening, pore-care=>pores-blackheads, anti-aging=>anti-aging-repair';
$summary_lines[] = 'No DB writes performed.';

file_put_contents( $summary_path, implode( "\n", $summary_lines ) . "\n" );
WP_CLI::log( implode( "\n", $summary_lines ) );
