<?php
/**
 * Assign product Origin from brand-level mapping.
 *
 * Usage:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/apply-brand-origin.php -- <csv> [--apply]
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run with WP-CLI eval-file.\n");
    exit(1);
}

$args = $_SERVER['argv'] ?? [];
$csvPath = getenv('CSV_PATH') ?: ($args[1] ?? '');
$apply = getenv('APPLY') === '1' || in_array('--apply', $args, true);

if (!$csvPath || !is_readable($csvPath)) {
    fwrite(STDERR, "CSV path is required and must be readable.\n");
    exit(1);
}

if (!function_exists('wc_create_attribute')) {
    fwrite(STDERR, "WooCommerce functions are unavailable.\n");
    exit(1);
}

function emart_read_csv_assoc(string $path): array {
    $handle = fopen($path, 'r');
    if (!$handle) return [];
    $headers = fgetcsv($handle);
    $rows = [];
    while (($values = fgetcsv($handle)) !== false) {
        if (!$headers) continue;
        $row = [];
        foreach ($headers as $index => $header) {
            $row[$header] = $values[$index] ?? '';
        }
        $rows[] = $row;
    }
    fclose($handle);
    return $rows;
}

function emart_ensure_origin_attribute(bool $apply): void {
    global $wpdb;

    $exists = $wpdb->get_var($wpdb->prepare(
        "SELECT attribute_id FROM {$wpdb->prefix}woocommerce_attribute_taxonomies WHERE attribute_name = %s",
        'origin'
    ));

    if (!$exists && $apply) {
        $created = wc_create_attribute([
            'name' => 'Origin',
            'slug' => 'origin',
            'type' => 'select',
            'order_by' => 'name',
            'has_archives' => false,
        ]);
        if (is_wp_error($created)) {
            throw new RuntimeException('Failed creating Origin attribute: ' . $created->get_error_message());
        }
        delete_transient('wc_attribute_taxonomies');
    }

    if (!taxonomy_exists('pa_origin')) {
        register_taxonomy('pa_origin', ['product'], [
            'hierarchical' => false,
            'show_ui' => false,
            'query_var' => true,
            'rewrite' => false,
            'public' => false,
            'show_in_nav_menus' => false,
            'show_admin_column' => false,
            'labels' => ['name' => 'Origin'],
        ]);
    }
}

function emart_ensure_origin_term(string $name, string $slug, bool $apply): ?int {
    $term = get_term_by('slug', $slug, 'pa_origin');
    if ($term && !is_wp_error($term)) return (int) $term->term_id;

    if (!$apply) return null;

    $created = wp_insert_term($name, 'pa_origin', ['slug' => $slug]);
    if (is_wp_error($created)) {
        $term = get_term_by('slug', $slug, 'pa_origin');
        if ($term && !is_wp_error($term)) return (int) $term->term_id;
        throw new RuntimeException("Failed creating origin term {$name}: " . $created->get_error_message());
    }
    return (int) $created['term_id'];
}

function emart_get_brand_product_ids(int $brandTermId): array {
    global $wpdb;
    return array_map('intval', $wpdb->get_col($wpdb->prepare(
        "SELECT DISTINCT p.ID
         FROM {$wpdb->posts} p
         JOIN {$wpdb->term_relationships} tr ON tr.object_id = p.ID
         JOIN {$wpdb->term_taxonomy} tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
         WHERE p.post_type = 'product'
           AND p.post_status = 'publish'
           AND tt.taxonomy = 'product_brand'
           AND tt.term_id = %d",
        $brandTermId
    )));
}

function emart_mark_pa_origin_visible(int $productId, bool $apply): void {
    $attrs = get_post_meta($productId, '_product_attributes', true);
    if (!is_array($attrs)) $attrs = [];
    if (isset($attrs['pa_origin']) && !empty($attrs['pa_origin']['is_taxonomy'])) return;

    $maxPosition = 0;
    foreach ($attrs as $attr) {
        if (is_array($attr) && isset($attr['position'])) {
            $maxPosition = max($maxPosition, (int) $attr['position']);
        }
    }

    $attrs['pa_origin'] = [
        'name' => 'pa_origin',
        'value' => '',
        'position' => $maxPosition + 1,
        'is_visible' => 1,
        'is_variation' => 0,
        'is_taxonomy' => 1,
    ];

    if ($apply) {
        update_post_meta($productId, '_product_attributes', $attrs);
    }
}

$rows = emart_read_csv_assoc($csvPath);
$summary = [
    'mode' => $apply ? 'apply' : 'dry-run',
    'brand_rows' => count($rows),
    'brand_terms_updated' => 0,
    'origin_terms_created_or_found' => 0,
    'brands_skipped' => 0,
    'products_seen' => 0,
    'products_assigned' => 0,
    'errors' => [],
];

try {
    emart_ensure_origin_attribute($apply);

    foreach ($rows as $row) {
        $brandTermId = (int) ($row['term_id'] ?? 0);
        $brandName = trim((string) ($row['brand_name'] ?? ''));
        $originSlug = trim((string) ($row['origin_slug'] ?? ''));
        $originName = trim((string) ($row['origin_name'] ?? ''));

        if (!$brandTermId || !$originSlug || !$originName) {
            $summary['brands_skipped']++;
            continue;
        }

        $brandTerm = get_term($brandTermId, 'product_brand');
        if (!$brandTerm || is_wp_error($brandTerm)) {
            $summary['errors'][] = "Missing product_brand term_id={$brandTermId}";
            continue;
        }

        if ($brandName && $brandName !== $brandTerm->name && $apply) {
            $updated = wp_update_term($brandTermId, 'product_brand', ['name' => $brandName]);
            if (is_wp_error($updated)) {
                $summary['errors'][] = "Brand rename failed term_id={$brandTermId}: " . $updated->get_error_message();
            } else {
                $summary['brand_terms_updated']++;
            }
        } elseif ($brandName && $brandName !== $brandTerm->name) {
            $summary['brand_terms_updated']++;
        }

        $originTermId = emart_ensure_origin_term($originName, $originSlug, $apply);
        $summary['origin_terms_created_or_found']++;

        $productIds = emart_get_brand_product_ids($brandTermId);
        $summary['products_seen'] += count($productIds);

        foreach ($productIds as $productId) {
            if ($apply && $originTermId) {
                wp_set_object_terms($productId, [$originTermId], 'pa_origin', false);
                emart_mark_pa_origin_visible($productId, true);
                if (function_exists('wc_delete_product_transients')) {
                    wc_delete_product_transients($productId);
                }
            }
            $summary['products_assigned']++;
        }
    }

    if ($apply) {
        delete_transient('wc_attribute_taxonomies');
        if (function_exists('wc_delete_product_transients')) {
            wc_delete_product_transients();
        }
        clean_taxonomy_cache('pa_origin');
    }
} catch (Throwable $error) {
    $summary['errors'][] = $error->getMessage();
}

echo wp_json_encode($summary, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
if (!empty($summary['errors'])) {
    exit(1);
}
