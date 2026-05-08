<?php
/**
 * Apply: trash duplicate products from the keep/delete decision CSV.
 *
 * Safe guards:
 *  - Only trashes products where verdict is OK_TO_TRASH or REVIEW_HAS_SALES.
 *  - Skips BLOCK, ALREADY_GONE, SKIP_ALREADY_INACTIVE, REVIEW verdicts.
 *  - Logs every action to a result CSV.
 *
 * Run AFTER the dry-run has been reviewed and redirects are live.
 *
 * Usage:
 *   wp eval-file workspace/scripts/active/duplicate-trash-apply.php --allow-root
 */

$dry_run_csv = '/root/emart-platform/workspace/audit/active/duplicate-trash-dry-run-20260508.csv';
$result_file = '/root/emart-platform/workspace/audit/active/duplicate-trash-result-' . date('Ymd-His') . '.csv';

if ( ! file_exists( $dry_run_csv ) ) {
	fwrite( STDERR, "Missing dry-run CSV: {$dry_run_csv}\n" );
	fwrite( STDERR, "Run duplicate-trash-dry-run.php first.\n" );
	exit( 1 );
}

$fh     = fopen( $dry_run_csv, 'r' );
$header = fgetcsv( $fh );
$idx    = array_flip( $header );

$out = fopen( $result_file, 'w' );
fputcsv( $out, [
	'group_key',
	'remove_id',
	'remove_slug',
	'remove_title',
	'keep_id',
	'keep_slug',
	'dry_run_verdict',
	'action_taken',
	'note',
] );

$summary = [
	'trashed'  => 0,
	'skipped'  => 0,
	'error'    => 0,
];

// Verdicts safe to trash.
$ok_verdicts = [ 'OK_TO_TRASH', 'REVIEW_HAS_SALES' ];

while ( ( $row = fgetcsv( $fh ) ) !== false ) {
	$group_key = $row[ $idx['group_key'] ];
	$keep_id   = (int) $row[ $idx['keep_id'] ];
	$keep_slug = $row[ $idx['keep_slug'] ];
	$remove_id = (int) $row[ $idx['remove_id'] ];
	$remove_slug  = $row[ $idx['remove_slug'] ];
	$remove_title = $row[ $idx['remove_title'] ];
	$verdict      = $row[ $idx['verdict'] ];

	if ( ! in_array( $verdict, $ok_verdicts, true ) ) {
		fputcsv( $out, [
			$group_key, $remove_id, $remove_slug, $remove_title,
			$keep_id, $keep_slug, $verdict, 'SKIPPED', "Verdict not in ok list: {$verdict}",
		] );
		$summary['skipped']++;
		continue;
	}

	// Verify keep product is still published before trashing remove.
	$keep_post = get_post( $keep_id );
	if ( ! $keep_post || $keep_post->post_status !== 'publish' ) {
		$keep_status = $keep_post ? $keep_post->post_status : 'NOT_FOUND';
		fputcsv( $out, [
			$group_key, $remove_id, $remove_slug, $remove_title,
			$keep_id, $keep_slug, $verdict, 'SKIPPED',
			"Keep product is not published (status: {$keep_status}) — unsafe to trash remove",
		] );
		$summary['skipped']++;
		continue;
	}

	// Verify remove product still exists and is published.
	$remove_post = get_post( $remove_id );
	if ( ! $remove_post ) {
		fputcsv( $out, [
			$group_key, $remove_id, $remove_slug, $remove_title,
			$keep_id, $keep_slug, $verdict, 'SKIPPED', 'Remove product not found (already gone?)',
		] );
		$summary['skipped']++;
		continue;
	}
	if ( $remove_post->post_status === 'trash' ) {
		fputcsv( $out, [
			$group_key, $remove_id, $remove_slug, $remove_title,
			$keep_id, $keep_slug, $verdict, 'SKIPPED', 'Already in trash',
		] );
		$summary['skipped']++;
		continue;
	}

	// Trash it.
	$result = wp_trash_post( $remove_id );
	if ( $result === false || is_null( $result ) ) {
		fputcsv( $out, [
			$group_key, $remove_id, $remove_slug, $remove_title,
			$keep_id, $keep_slug, $verdict, 'ERROR', 'wp_trash_post returned false/null',
		] );
		$summary['error']++;
	} else {
		fputcsv( $out, [
			$group_key, $remove_id, $remove_slug, $remove_title,
			$keep_id, $keep_slug, $verdict, 'TRASHED', "Moved to trash. Keep: /shop/{$keep_slug}",
		] );
		$summary['trashed']++;
		echo "TRASHED {$remove_id} ({$remove_slug}) → keep /shop/{$keep_slug}\n";
	}
}

fclose( $fh );
fclose( $out );

echo "\nResult CSV: {$result_file}\n\n";
echo "=== SUMMARY ===\n";
foreach ( $summary as $key => $val ) {
	echo "{$key}: {$val}\n";
}
