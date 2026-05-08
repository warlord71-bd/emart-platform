<?php
/**
 * Dry-run report for duplicate product cleanup.
 *
 * Reads keep/remove decisions from the audit CSV, queries each product in WP,
 * and writes a verification CSV. Does NOT mutate any data.
 *
 * Usage: wp eval-file workspace/scripts/active/duplicate-trash-dry-run.php
 */

$decision_csv = '/root/emart-platform/workspace/audit/active/duplicate-products-keep-delete-decision.csv';
$out_file     = '/root/emart-platform/workspace/audit/active/duplicate-trash-dry-run-' . date('Ymd') . '.csv';

if ( ! file_exists( $decision_csv ) ) {
	fwrite( STDERR, "Missing decision CSV: {$decision_csv}\n" );
	exit( 1 );
}

$fh      = fopen( $decision_csv, 'r' );
$header  = fgetcsv( $fh );
$idx     = array_flip( $header );

$out = fopen( $out_file, 'w' );
fputcsv( $out, [
	'group_key',
	'keep_id',
	'keep_status',
	'keep_title',
	'keep_slug',
	'keep_sales',
	'remove_id',
	'remove_status',
	'remove_title',
	'remove_slug',
	'remove_sales',
	'verdict',
	'flag',
] );

$summary = [
	'ok'              => 0,
	'flagged'         => 0,
	'remove_has_sales'=> 0,
	'id_not_found'    => 0,
	'wrong_post_type' => 0,
	'already_trashed' => 0,
	'slug_mismatch'   => 0,
];

while ( ( $row = fgetcsv( $fh ) ) !== false ) {
	$group_key  = $row[ $idx['group_key'] ];
	$keep_id    = (int) $row[ $idx['recommended_keep_id'] ];
	$remove_id  = (int) $row[ $idx['recommended_remove_id'] ];
	$keep_url   = trim( $row[ $idx['keep_url'] ] );
	$remove_url = trim( $row[ $idx['remove_url'] ] );

	// Extract expected slugs from audit CSV URLs.
	$keep_expected_slug   = rtrim( parse_url( $keep_url, PHP_URL_PATH ), '/' );
	$keep_expected_slug   = basename( $keep_expected_slug );
	$remove_expected_slug = rtrim( parse_url( $remove_url, PHP_URL_PATH ), '/' );
	$remove_expected_slug = basename( $remove_expected_slug );

	$flags   = [];
	$verdict = 'OK_TO_TRASH';

	// ── Keep product ────────────────────────────────────────────────────────
	$keep_post = get_post( $keep_id );
	if ( ! $keep_post ) {
		$keep_status = 'NOT_FOUND';
		$keep_title  = '';
		$keep_slug   = '';
		$keep_sales  = '';
		$flags[]     = 'KEEP_ID_NOT_FOUND';
		$verdict     = 'BLOCK';
		$summary['id_not_found']++;
	} elseif ( $keep_post->post_type !== 'product' ) {
		$keep_status = $keep_post->post_status;
		$keep_title  = $keep_post->post_title;
		$keep_slug   = $keep_post->post_name;
		$keep_sales  = '';
		$flags[]     = 'KEEP_WRONG_POST_TYPE:' . $keep_post->post_type;
		$verdict     = 'BLOCK';
		$summary['wrong_post_type']++;
	} else {
		$keep_product = wc_get_product( $keep_id );
		$keep_status  = $keep_post->post_status;
		$keep_title   = $keep_post->post_title;
		$keep_slug    = $keep_post->post_name;
		$keep_sales   = (int) $keep_product->get_total_sales();
		if ( $keep_slug !== $keep_expected_slug ) {
			$flags[]  = "KEEP_SLUG_MISMATCH:expected={$keep_expected_slug},actual={$keep_slug}";
			$verdict  = 'REVIEW';
			$summary['slug_mismatch']++;
		}
	}

	// ── Remove product ──────────────────────────────────────────────────────
	$remove_post = get_post( $remove_id );
	if ( ! $remove_post ) {
		$remove_status = 'NOT_FOUND';
		$remove_title  = '';
		$remove_slug   = '';
		$remove_sales  = '';
		$flags[]       = 'REMOVE_ID_NOT_FOUND';
		$verdict       = 'ALREADY_GONE';
		$summary['id_not_found']++;
	} elseif ( $remove_post->post_type !== 'product' ) {
		$remove_status = $remove_post->post_status;
		$remove_title  = $remove_post->post_title;
		$remove_slug   = $remove_post->post_name;
		$remove_sales  = '';
		$flags[]       = 'REMOVE_WRONG_POST_TYPE:' . $remove_post->post_type;
		$verdict       = 'BLOCK';
		$summary['wrong_post_type']++;
	} else {
		$remove_product = wc_get_product( $remove_id );
		$remove_status  = $remove_post->post_status;
		$remove_title   = $remove_post->post_title;
		$remove_slug    = $remove_post->post_name;
		$remove_sales   = (int) $remove_product->get_total_sales();
		if ( in_array( $remove_status, [ 'trash', 'draft' ], true ) ) {
			$flags[]   = 'ALREADY_TRASHED_OR_DRAFT';
			$verdict   = 'SKIP_ALREADY_INACTIVE';
			$summary['already_trashed']++;
		}
		if ( $remove_sales > 0 ) {
			$flags[]  = "REMOVE_HAS_SALES:{$remove_sales}";
			$verdict  = ( $verdict === 'OK_TO_TRASH' ) ? 'REVIEW_HAS_SALES' : $verdict;
			$summary['remove_has_sales']++;
		}
		if ( $remove_slug !== $remove_expected_slug ) {
			$flags[]  = "REMOVE_SLUG_MISMATCH:expected={$remove_expected_slug},actual={$remove_slug}";
			if ( $verdict === 'OK_TO_TRASH' ) {
				$verdict = 'REVIEW';
			}
			$summary['slug_mismatch']++;
		}
	}

	if ( empty( $flags ) ) {
		$summary['ok']++;
	} else {
		$summary['flagged']++;
	}

	fputcsv( $out, [
		$group_key,
		$keep_id,
		$keep_status,
		$keep_title,
		$keep_slug,
		$keep_sales,
		$remove_id,
		$remove_status,
		$remove_title,
		$remove_slug,
		$remove_sales,
		$verdict,
		implode( ' | ', $flags ),
	] );
}

fclose( $fh );
fclose( $out );

echo "Dry-run CSV: {$out_file}\n\n";
echo "=== SUMMARY ===\n";
foreach ( $summary as $key => $val ) {
	echo "{$key}: {$val}\n";
}
