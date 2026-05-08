<?php
/**
 * Dry-run report for published products missing pa_origin.
 *
 * This script does not mutate WordPress/WooCommerce data.
 */

$mapping_file = '/root/emart-platform/workspace/audit/seo/brand-origin-20260505/corrected-brand-origin-normalized.csv';
$out_dir = '/root/emart-platform/workspace/audit/active';
$out_file = $out_dir . '/pa-origin-gap-dry-run-20260508.csv';

if (!file_exists($mapping_file)) {
    fwrite(STDERR, "Missing mapping file: {$mapping_file}\n");
    exit(1);
}

$origin_by_brand_slug = [];
$handle = fopen($mapping_file, 'r');
$header = fgetcsv($handle);
$indexes = array_flip($header ?: []);
while (($row = fgetcsv($handle)) !== false) {
    $brand_slug = $row[$indexes['brand_slug']] ?? '';
    if ($brand_slug === '') {
        continue;
    }
    $origin_by_brand_slug[$brand_slug] = [
        'origin_slug' => $row[$indexes['origin_slug']] ?? '',
        'origin_name' => $row[$indexes['origin_name']] ?? '',
        'confidence' => $row[$indexes['confidence']] ?? '',
        'source' => $row[$indexes['source']] ?? '',
    ];
}
fclose($handle);

function emart_infer_brand_from_title(string $title): array {
    $lower = strtolower(html_entity_decode($title, ENT_QUOTES | ENT_HTML5));
    if (strpos($lower, 'cerave') !== false || strpos($lower, 'cera ve') !== false) {
        return ['CeraVe', 'cerave'];
    }
    if (strpos($lower, 'beauty of joseon') !== false) {
        return ['Beauty of Joseon', 'beauty-of-joseon'];
    }
    return ['', ''];
}

$products = get_posts([
    'post_type' => 'product',
    'post_status' => 'publish',
    'posts_per_page' => -1,
    'fields' => 'ids',
    'orderby' => 'ID',
    'order' => 'ASC',
    'tax_query' => [
        [
            'taxonomy' => 'pa_origin',
            'operator' => 'NOT EXISTS',
        ],
    ],
]);

$out = fopen($out_file, 'w');
fputcsv($out, [
    'product_id',
    'product_slug',
    'product_name',
    'current_brand_names',
    'current_brand_slugs',
    'inferred_brand_name',
    'inferred_brand_slug',
    'proposed_origin_slug',
    'proposed_origin_name',
    'confidence',
    'source',
    'dry_run_action',
    'note',
]);

$summary = [
    'missing_pa_origin' => 0,
    'skip_internal' => 0,
    'assign_from_existing_brand' => 0,
    'needs_brand_before_origin' => 0,
    'manual_review' => 0,
];

foreach ($products as $product_id) {
    $product = wc_get_product($product_id);
    if (!$product) {
        continue;
    }

    $summary['missing_pa_origin']++;
    $brand_terms = wp_get_object_terms($product_id, 'product_brand');
    $brand_names = [];
    $brand_slugs = [];
    if (!is_wp_error($brand_terms)) {
        foreach ($brand_terms as $term) {
            $brand_names[] = $term->name;
            $brand_slugs[] = $term->slug;
        }
    }

    $inferred = emart_infer_brand_from_title($product->get_name());
    $candidate_slug = $brand_slugs[0] ?? $inferred[1];
    $mapping = $candidate_slug ? ($origin_by_brand_slug[$candidate_slug] ?? null) : null;

    $action = 'manual_review';
    $note = 'No mapped product_brand found.';
    if (in_array('emart-combo', $brand_slugs, true) || in_array('emart-exclusive', $brand_slugs, true)) {
        $action = 'skip_internal_store_label';
        $note = 'Internal/store-label product intentionally not assigned customer-facing pa_origin.';
        $summary['skip_internal']++;
    } elseif ($mapping && !empty($brand_slugs)) {
        $action = 'dry_run_assign_pa_origin_from_existing_brand';
        $note = 'Existing product_brand maps to origin.';
        $summary['assign_from_existing_brand']++;
    } elseif ($mapping && empty($brand_slugs) && $inferred[1]) {
        $action = 'needs_product_brand_assignment_before_pa_origin';
        $note = 'Brand inferred from title for review only; preserve brand-level origin pattern by assigning product_brand first.';
        $summary['needs_brand_before_origin']++;
    } else {
        $summary['manual_review']++;
    }

    fputcsv($out, [
        $product_id,
        $product->get_slug(),
        $product->get_name(),
        implode('|', $brand_names),
        implode('|', $brand_slugs),
        $inferred[0],
        $inferred[1],
        $mapping['origin_slug'] ?? '',
        $mapping['origin_name'] ?? '',
        $mapping['confidence'] ?? '',
        $mapping['source'] ?? '',
        $action,
        $note,
    ]);
}

fclose($out);

echo "Dry-run CSV: {$out_file}\n";
foreach ($summary as $key => $value) {
    echo "{$key}: {$value}\n";
}

