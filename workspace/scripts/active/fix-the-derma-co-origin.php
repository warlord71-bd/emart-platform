<?php
/**
 * Remove stale custom Origin=Korea from The Derma Co products and ensure pa_origin=India.
 *
 * Dry-run:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/active/fix-the-derma-co-origin.php
 *
 * Apply:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/active/fix-the-derma-co-origin.php -- --apply
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run with WP-CLI eval-file.\n");
    exit(1);
}

$apply = getenv('APPLY') === '1' || in_array('--apply', $_SERVER['argv'] ?? [], true);
$outDir = '/root/emart-platform/workspace/audit/active';
$outFile = $outDir . '/the-derma-co-origin-correction-' . ($apply ? 'apply' : 'dry-run') . '-20260510.csv';

if (!is_dir($outDir)) {
    mkdir($outDir, 0755, true);
}

$brand = get_term_by('slug', 'the-derma-co', 'product_brand');
$india = get_term_by('slug', 'india', 'pa_origin');

if (!$brand || is_wp_error($brand)) {
    fwrite(STDERR, "Missing product_brand term: the-derma-co\n");
    exit(1);
}

if (!$india || is_wp_error($india)) {
    fwrite(STDERR, "Missing pa_origin term: india\n");
    exit(1);
}

$productIds = get_posts([
    'post_type' => 'product',
    'post_status' => 'publish',
    'posts_per_page' => -1,
    'fields' => 'ids',
    'orderby' => 'ID',
    'order' => 'ASC',
    'tax_query' => [
        [
            'taxonomy' => 'product_brand',
            'field' => 'term_id',
            'terms' => [(int) $brand->term_id],
        ],
    ],
]);

$out = fopen($outFile, 'w');
fputcsv($out, [
    'product_id',
    'slug',
    'name',
    'current_pa_origin',
    'had_custom_origin_korea',
    'action',
]);

$summary = [
    'mode' => $apply ? 'apply' : 'dry-run',
    'brand' => $brand->name,
    'products_seen' => 0,
    'products_with_custom_origin_korea' => 0,
    'products_set_to_india' => 0,
    'products_cleaned' => 0,
];

foreach ($productIds as $productId) {
    $product = wc_get_product($productId);
    if (!$product) {
        continue;
    }

    $summary['products_seen']++;
    $originTerms = wp_get_object_terms($productId, 'pa_origin', ['fields' => 'names']);
    $currentOrigin = is_wp_error($originTerms) ? '' : implode('|', $originTerms);

    $attrs = get_post_meta($productId, '_product_attributes', true);
    if (!is_array($attrs)) {
        $attrs = [];
    }

    $hadCustomOriginKorea = false;
    foreach ($attrs as $key => $attr) {
        if (!is_array($attr)) {
            continue;
        }
        $name = strtolower(trim((string) ($attr['name'] ?? $key)));
        $value = strtolower(trim((string) ($attr['value'] ?? '')));
        $isTaxonomy = !empty($attr['is_taxonomy']);

        if (!$isTaxonomy && $name === 'origin' && $value === 'korea') {
            $hadCustomOriginKorea = true;
            unset($attrs[$key]);
        }
    }

    if ($hadCustomOriginKorea) {
        $summary['products_with_custom_origin_korea']++;
    }

    $action = [];
    if ($currentOrigin !== 'India') {
        $action[] = 'set_pa_origin_india';
        if ($apply) {
            wp_set_object_terms($productId, [(int) $india->term_id], 'pa_origin', false);
        }
        $summary['products_set_to_india']++;
    }

    if ($hadCustomOriginKorea) {
        $action[] = 'remove_custom_origin_korea';
        if ($apply) {
            update_post_meta($productId, '_product_attributes', $attrs);
        }
        $summary['products_cleaned']++;
    }

    if ($apply && ($hadCustomOriginKorea || $currentOrigin !== 'India')) {
        if (function_exists('wc_delete_product_transients')) {
            wc_delete_product_transients($productId);
        }
        clean_post_cache($productId);
    }

    fputcsv($out, [
        $productId,
        $product->get_slug(),
        $product->get_name(),
        $currentOrigin,
        $hadCustomOriginKorea ? 'yes' : 'no',
        $action ? implode('|', $action) : 'already_clean',
    ]);
}

fclose($out);

if ($apply) {
    clean_taxonomy_cache('pa_origin');
    clean_taxonomy_cache('product_brand');
    if (function_exists('wc_delete_product_transients')) {
        wc_delete_product_transients();
    }
}

echo "Report: {$outFile}\n";
echo wp_json_encode($summary, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
