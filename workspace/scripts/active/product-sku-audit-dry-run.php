<?php
/**
 * Dry-run SKU audit for WooCommerce products.
 *
 * This script does not mutate data. It writes:
 * - missing SKU recommendations for published products
 * - duplicate _sku meta-row cleanup candidates
 * - a short summary report
 *
 * Usage:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/active/product-sku-audit-dry-run.php
 */

global $wpdb;

$date = date( 'Ymd-His' );
$base = '/root/emart-platform/workspace/audit/active';

$missing_file   = "{$base}/product-missing-sku-dry-run-{$date}.csv";
$duplicate_file = "{$base}/product-duplicate-sku-meta-dry-run-{$date}.csv";
$summary_file   = "{$base}/product-sku-audit-summary-{$date}.txt";

function emart_sku_token( $text, $length = 4 ) {
	$text = html_entity_decode( wp_strip_all_tags( (string) $text ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	$text = remove_accents( $text );
	$text = preg_replace( '/[^A-Z0-9]+/', '', strtoupper( $text ) );
	if ( $text === '' ) {
		return str_repeat( 'X', $length );
	}
	return substr( $text, 0, $length );
}

function emart_product_brand_info( $product_id, $title ) {
	$terms = wp_get_post_terms( $product_id, 'product_brand', [ 'fields' => 'names' ] );
	if ( is_wp_error( $terms ) || empty( $terms ) ) {
		$terms = wp_get_post_terms( $product_id, 'pa_brand', [ 'fields' => 'names' ] );
	}
	if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
		sort( $terms, SORT_NATURAL | SORT_FLAG_CASE );
		return [
			'name'   => $terms[0],
			'source' => 'assigned_term',
		];
	}

	$known_brands = [
		'Beauty of Joseon',
		'CeraVe',
		'Cos De Baha',
		'Some By Mi',
		'Skin1004',
		'The Ordinary',
		'The Face Shop',
		'3W Clinic',
		'Mary&May',
		'Mary & May',
		'Isntree',
		'Medicube',
		'Missha',
		'Tiam',
	];
	$plain_title = strtolower( html_entity_decode( wp_strip_all_tags( (string) $title ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
	foreach ( $known_brands as $brand ) {
		if ( strpos( $plain_title, strtolower( $brand ) ) !== false ) {
			return [
				'name'   => $brand,
				'source' => 'inferred_from_title',
			];
		}
	}

	return [
		'name'   => 'Emart',
		'source' => 'fallback',
	];
}

function emart_descriptor_token( $title ) {
	$title = html_entity_decode( wp_strip_all_tags( (string) $title ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	$title = remove_accents( $title );
	$words = preg_split( '/[^A-Za-z0-9]+/', $title, -1, PREG_SPLIT_NO_EMPTY );
	$skip  = [
		'THE' => true,
		'AND' => true,
		'FOR' => true,
		'WITH' => true,
		'NORMAL' => true,
		'DRY' => true,
		'TO' => true,
		'SENSITIVE' => true,
		'VERSION' => true,
	];
	$out = '';
	foreach ( $words as $word ) {
		$upper = strtoupper( $word );
		if ( isset( $skip[ $upper ] ) ) {
			continue;
		}
		$out .= substr( $upper, 0, min( 3, strlen( $upper ) ) );
		if ( strlen( $out ) >= 6 ) {
			break;
		}
	}
	$out = preg_replace( '/[^A-Z0-9]+/', '', $out );
	return substr( $out ?: 'ITEM', 0, 6 );
}

function emart_recover_old_sku_from_old_slug( $product_id ) {
	$old_slugs = get_post_meta( $product_id, '_wp_old_slug', false );
	foreach ( $old_slugs as $old_slug ) {
		if ( preg_match( '/^import-placeholder-for-([a-z0-9-]+)$/i', (string) $old_slug, $m ) ) {
			return strtoupper( str_replace( '-', '', $m[1] ) );
		}
	}
	return '';
}

$existing_skus = [];
$sku_rows      = $wpdb->get_results(
	"SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = '_sku' AND TRIM(meta_value) <> ''",
	ARRAY_A
);
foreach ( $sku_rows as $row ) {
	$existing_skus[ strtoupper( trim( $row['meta_value'] ) ) ] = (int) $row['post_id'];
}

$published_count = (int) $wpdb->get_var(
	"SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'product' AND post_status = 'publish'"
);

$published_missing = $wpdb->get_results(
	"SELECT p.ID, p.post_title, p.post_name
	 FROM {$wpdb->posts} p
	 LEFT JOIN {$wpdb->postmeta} sku
	   ON sku.post_id = p.ID AND sku.meta_key = '_sku'
	 WHERE p.post_type = 'product'
	   AND p.post_status = 'publish'
	   AND (sku.meta_value IS NULL OR TRIM(sku.meta_value) = '')
	 GROUP BY p.ID
	 ORDER BY p.ID",
	ARRAY_A
);

$out = fopen( $missing_file, 'w' );
fputcsv( $out, [
	'product_id',
	'status',
	'title',
	'slug',
	'brand',
	'current_sku',
	'recovered_old_sku',
	'recommended_sku',
	'action',
	'seo_note',
	'flags',
] );

$generated      = [];
$recoveries     = 0;
$missing_flags  = 0;

foreach ( $published_missing as $row ) {
	$product_id = (int) $row['ID'];
	$title      = $row['post_title'];
	$brand_info = emart_product_brand_info( $product_id, $title );
	$brand      = $brand_info['name'];
	$old_sku    = emart_recover_old_sku_from_old_slug( $product_id );

	if ( $old_sku !== '' && ! isset( $existing_skus[ strtoupper( $old_sku ) ] ) ) {
		$recommended = $old_sku;
		$recoveries++;
	} else {
		$recommended_base = sprintf(
			'EM-%s-%s-%05d',
			emart_sku_token( $brand, 4 ),
			emart_descriptor_token( $title ),
			$product_id
		);
		$recommended = $recommended_base;
		$suffix      = 2;
		while (
			isset( $existing_skus[ strtoupper( $recommended ) ] )
			|| isset( $generated[ strtoupper( $recommended ) ] )
		) {
			$recommended = $recommended_base . '-' . $suffix;
			$suffix++;
		}
	}

	$flags = [];
	if ( $brand_info['source'] === 'inferred_from_title' ) {
		$flags[] = 'BRAND_INFERRED_FROM_TITLE';
	}
	if ( $brand_info['source'] === 'fallback' ) {
		$flags[] = 'NO_BRAND_TERM';
	}
	if ( $old_sku !== '' && strtoupper( $old_sku ) !== strtoupper( $recommended ) ) {
		$flags[] = 'OLD_SKU_NOT_USED_DUPLICATE_OR_UNSAFE';
	}
	if ( preg_match( '/combo|kit/i', $title ) ) {
		$flags[] = 'COMBO_OR_KIT_REVIEW';
	}
	if ( ! empty( $flags ) ) {
		$missing_flags++;
	}

	$generated[ strtoupper( $recommended ) ] = $product_id;

	fputcsv( $out, [
		$product_id,
		'publish',
		html_entity_decode( wp_strip_all_tags( $title ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
		$row['post_name'],
		$brand,
		'',
		$old_sku,
		$recommended,
		'FILL_MISSING_SKU',
		'Product JSON-LD will emit this Woo SKU after apply; existing non-empty SKUs are preserved.',
		implode( ' | ', $flags ),
	] );
}
fclose( $out );

$duplicate_rows = $wpdb->get_results(
	"SELECT p.ID, p.post_title, p.post_name, sku.meta_id, sku.meta_value
	 FROM {$wpdb->posts} p
	 JOIN {$wpdb->postmeta} sku
	   ON sku.post_id = p.ID AND sku.meta_key = '_sku'
	 WHERE p.post_type = 'product'
	 ORDER BY p.ID, sku.meta_id",
	ARRAY_A
);

$by_product = [];
foreach ( $duplicate_rows as $row ) {
	$by_product[ (int) $row['ID'] ][] = $row;
}

$dup_out = fopen( $duplicate_file, 'w' );
fputcsv( $dup_out, [
	'product_id',
	'status',
	'title',
	'slug',
	'keep_meta_id',
	'keep_sku',
	'delete_meta_id',
	'delete_sku',
	'action',
	'flags',
] );

$duplicate_products = 0;
$duplicate_rows_to_delete = 0;
foreach ( $by_product as $product_id => $rows ) {
	if ( count( $rows ) < 2 ) {
		continue;
	}

	$duplicate_products++;
	$keep     = $rows[0];
	$keep_sku = trim( (string) $keep['meta_value'] );
	for ( $i = 1; $i < count( $rows ); $i++ ) {
		$row   = $rows[ $i ];
		$flags = [];
		if ( trim( (string) $row['meta_value'] ) !== $keep_sku ) {
			$flags[] = 'DIFFERENT_SKU_VALUES_REVIEW_ONLY';
			$action  = 'REVIEW_DO_NOT_AUTO_DELETE';
		} else {
			$action = 'DELETE_DUPLICATE_META_ROW';
		}
		$duplicate_rows_to_delete++;
		fputcsv( $dup_out, [
			$product_id,
			get_post_status( $product_id ),
			html_entity_decode( wp_strip_all_tags( $row['post_title'] ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			$row['post_name'],
			$keep['meta_id'],
			$keep_sku,
			$row['meta_id'],
			$row['meta_value'],
			$action,
			implode( ' | ', $flags ),
		] );
	}
}
fclose( $dup_out );

$summary = [
	'published_products'             => $published_count,
	'published_missing_sku'          => count( $published_missing ),
	'missing_sku_recovered_old_sku'  => $recoveries,
	'missing_sku_generated_new_sku'  => count( $published_missing ) - $recoveries,
	'missing_sku_rows_with_flags'    => $missing_flags,
	'duplicate_sku_meta_products'    => $duplicate_products,
	'duplicate_sku_meta_extra_rows'  => $duplicate_rows_to_delete,
	'missing_sku_csv'                => $missing_file,
	'duplicate_sku_meta_csv'         => $duplicate_file,
];

$summary_lines = [];
foreach ( $summary as $key => $value ) {
	$summary_lines[] = "{$key}: {$value}";
}
file_put_contents( $summary_file, implode( "\n", $summary_lines ) . "\n" );

echo "Missing SKU dry-run CSV: {$missing_file}\n";
echo "Duplicate SKU meta dry-run CSV: {$duplicate_file}\n";
echo "Summary: {$summary_file}\n\n";
echo implode( "\n", $summary_lines ) . "\n";
