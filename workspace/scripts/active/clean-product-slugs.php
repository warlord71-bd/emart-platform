<?php
/**
 * Clean -2 / copy suffixes from published product slugs.
 *
 * - Renames slug if clean version is free (no other publish/draft/private product has it).
 * - Skips if clean slug is already taken — logs reason.
 * - Outputs a redirect-pairs file for next.config.js.
 * - READ+WRITE — must approve before running.
 *
 * Usage: wp eval-file workspace/scripts/active/clean-product-slugs.php --allow-root
 */

$result_file   = '/root/emart-platform/workspace/audit/active/slug-clean-result-' . date('Ymd-His') . '.csv';
$redirect_file = '/root/emart-platform/workspace/audit/active/slug-clean-redirects-' . date('Ymd-His') . '.txt';

// ── helpers ───────────────────────────────────────────────────────────────────

function proposed_clean_slug( string $slug ): string {
    // Remove trailing -2 (and -3, -4 etc — but user asked for -2 specifically)
    // Also handle -copy and copy-of- prefixes
    $clean = preg_replace( '/-2$/', '', $slug );
    $clean = preg_replace( '/^copy-of-/', '', $clean );
    $clean = preg_replace( '/-copy$/', '', $clean );
    return $clean;
}

function clean_slug_is_free( string $clean_slug, int $exclude_id ): bool {
    global $wpdb;
    $taken = $wpdb->get_var( $wpdb->prepare(
        "SELECT ID FROM {$wpdb->posts}
         WHERE post_name = %s
           AND post_type = 'product'
           AND post_status IN ('publish','draft','private')
           AND ID != %d
         LIMIT 1",
        $clean_slug,
        $exclude_id
    ) );
    return $taken === null;
}

// ── query all affected products ───────────────────────────────────────────────

global $wpdb;
$affected = $wpdb->get_results(
    "SELECT ID, post_name, post_title
     FROM {$wpdb->posts}
     WHERE post_type = 'product'
       AND post_status = 'publish'
       AND (post_name REGEXP '-2$' OR post_name LIKE '%copy%')
     ORDER BY ID ASC",
    ARRAY_A
);

$out  = fopen( $result_file, 'w' );
$rout = fopen( $redirect_file, 'w' );

fputcsv( $out, [ 'product_id', 'old_slug', 'clean_slug', 'action', 'note' ] );
fwrite( $rout, "# next.config.js redirect pairs — paste into redirects() array\n" );
fwrite( $rout, "# Generated: " . date('Y-m-d H:i:s') . "\n\n" );

$counts = [ 'renamed' => 0, 'conflict' => 0, 'no_change' => 0 ];

foreach ( $affected as $row ) {
    $id       = (int) $row['ID'];
    $old_slug = $row['post_name'];
    $title    = $row['post_title'];
    $clean    = proposed_clean_slug( $old_slug );

    if ( $clean === $old_slug ) {
        // Nothing to change (e.g. slug already clean)
        fputcsv( $out, [ $id, $old_slug, $clean, 'SKIP_NO_CHANGE', '' ] );
        $counts['no_change']++;
        continue;
    }

    if ( ! clean_slug_is_free( $clean, $id ) ) {
        fputcsv( $out, [ $id, $old_slug, $clean, 'SKIP_CONFLICT', 'clean slug taken by another product' ] );
        $counts['conflict']++;
        continue;
    }

    // Safe to rename
    $updated = wp_update_post( [ 'ID' => $id, 'post_name' => $clean ] );
    if ( is_wp_error( $updated ) || ! $updated ) {
        fputcsv( $out, [ $id, $old_slug, $clean, 'ERROR', $updated instanceof WP_Error ? $updated->get_error_message() : 'wp_update_post failed' ] );
        continue;
    }

    fputcsv( $out, [ $id, $old_slug, $clean, 'RENAMED', '' ] );
    $counts['renamed']++;

    // Write redirect pair
    fwrite( $rout, "      { source: '/shop/{$old_slug}', destination: '/shop/{$clean}', permanent: true },\n" );
    // Also cover the legacy /product/ path
    fwrite( $rout, "      { source: '/product/{$old_slug}', destination: '/shop/{$clean}', permanent: true },\n" );

    echo "RENAMED $id: $old_slug → $clean\n";
}

fclose( $out );
fclose( $rout );

echo "\n=== SUMMARY ===\n";
echo "renamed:  {$counts['renamed']}\n";
echo "conflict: {$counts['conflict']}\n";
echo "no_change:{$counts['no_change']}\n";
echo "\nResult CSV:      $result_file\n";
echo "Redirect pairs:  $redirect_file\n";
