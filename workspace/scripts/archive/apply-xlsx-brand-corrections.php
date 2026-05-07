<?php
/**
 * Apply user-supplied XLSX brand corrections normalized into CURRENT_BRAND_CORRECTION_FILE.csv.
 *
 * Dry-run:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/apply-xlsx-brand-corrections.php
 *
 * Apply:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/apply-xlsx-brand-corrections.php -- --apply
 */

$argv = array_slice($_SERVER['argv'] ?? [], 1);
$apply = getenv('EMART_APPLY_XLSX_BRAND_CORRECTIONS') === '1' || in_array('--apply', $argv, true) || in_array('apply', $argv, true);
$root = dirname(__DIR__, 2);
$input_csv = getenv('EMART_BRAND_CORRECTION_CSV') ?: $root . '/workspace/PROJECT_DATA/CURRENT_BRAND_CORRECTION_FILE.csv';
$stamp = gmdate('Ymd-His');
$out_dir = getenv('EMART_BRAND_CORRECTION_OUT_DIR') ?: $root . '/workspace/audit/seo/brand-source-unification-20260503/xlsx-apply-' . $stamp;

if (!is_dir($out_dir)) {
    mkdir($out_dir, 0775, true);
}

function emart_csv_rows($path) {
    $handle = fopen($path, 'r');
    if (!$handle) {
        throw new RuntimeException("Cannot open CSV: {$path}");
    }
    $headers = fgetcsv($handle);
    $rows = [];
    while (($cells = fgetcsv($handle)) !== false) {
        $row = [];
        foreach ($headers as $index => $header) {
            $row[$header] = $cells[$index] ?? '';
        }
        $rows[] = $row;
    }
    fclose($handle);
    return $rows;
}

function emart_write_csv($path, $headers, $rows) {
    $handle = fopen($path, 'w');
    fputcsv($handle, $headers);
    foreach ($rows as $row) {
        $cells = [];
        foreach ($headers as $header) {
            $cells[] = $row[$header] ?? '';
        }
        fputcsv($handle, $cells);
    }
    fclose($handle);
}

function emart_brand_slug($value) {
    $slug = strtolower((string) $value);
    $slug = str_replace('&', 'and', $slug);
    $slug = str_replace("'", '', $slug);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    return trim($slug, '-');
}

function emart_product_brand_terms($product_id) {
    $terms = wp_get_object_terms((int) $product_id, 'product_brand');
    return is_wp_error($terms) ? [] : $terms;
}

function emart_find_or_create_brand($name, $slug, &$created_terms, $apply) {
    $term = get_term_by('slug', $slug, 'product_brand');
    if ($term) {
        return $term;
    }

    if (!$apply) {
        return (object) [
            'term_id' => '',
            'term_taxonomy_id' => '',
            'name' => $name,
            'slug' => $slug,
            'dry_run_new_term' => true,
        ];
    }

    $created = wp_insert_term($name, 'product_brand', ['slug' => $slug]);
    if (is_wp_error($created)) {
        throw new RuntimeException($created->get_error_message());
    }

    $term = get_term((int) $created['term_id'], 'product_brand');
    $created_terms[] = [
        'target_product_brand_name' => $name,
        'target_product_brand_slug' => $slug,
        'term_id' => $term->term_id,
        'term_taxonomy_id' => $term->term_taxonomy_id,
    ];
    return $term;
}

$rows = array_values(array_filter(emart_csv_rows($input_csv), function ($row) {
    return trim((string) ($row['product_id'] ?? '')) !== '' && trim((string) ($row['target_product_brand_name'] ?? '')) !== '';
}));

$product_ids = array_map(fn($row) => (int) $row['product_id'], $rows);
$backup_ids = implode(',', array_filter($product_ids));
$backup_path = $out_dir . '/pre-xlsx-brand-correction-backup.tsv';
$backup_lines = ["product_id\tproduct_name\tterm_id\tterm_taxonomy_id\tslug\tname"];
if ($backup_ids !== '') {
    $backup_sql = "
        SELECT p.ID product_id, p.post_title product_name, t.term_id, tt.term_taxonomy_id, t.slug, t.name
        FROM {$GLOBALS['wpdb']->posts} p
        LEFT JOIN {$GLOBALS['wpdb']->term_relationships} tr ON tr.object_id=p.ID
        LEFT JOIN {$GLOBALS['wpdb']->term_taxonomy} tt ON tt.term_taxonomy_id=tr.term_taxonomy_id AND tt.taxonomy='product_brand'
        LEFT JOIN {$GLOBALS['wpdb']->terms} t ON t.term_id=tt.term_id
        WHERE p.ID IN ({$backup_ids})
        ORDER BY p.ID, t.name
    ";
    $backup_rows = $GLOBALS['wpdb']->get_results($backup_sql, ARRAY_N);
    foreach ($backup_rows as $backup_row) {
        $backup_lines[] = implode("\t", array_map(fn($value) => (string) $value, $backup_row));
    }
}
file_put_contents($backup_path, implode("\n", $backup_lines) . "\n");

$applied = [];
$skipped = [];
$created_terms = [];
$rollback = [];

foreach ($rows as $row) {
    $product_id = (int) $row['product_id'];
    $target_name = trim((string) $row['target_product_brand_name']);
    $target_slug = trim((string) ($row['target_product_brand_slug'] ?? '')) ?: emart_brand_slug($target_name);
    $post = get_post($product_id);

    if (!$post || $post->post_type !== 'product' || $post->post_status !== 'publish') {
        $skipped[] = [
            'product_id' => $product_id,
            'product_name' => $row['product_name'] ?? '',
            'target_product_brand_name' => $target_name,
            'target_product_brand_slug' => $target_slug,
            'reason' => 'published_product_not_found',
        ];
        continue;
    }

    $existing_terms = emart_product_brand_terms($product_id);
    $existing_slugs = array_map(fn($term) => $term->slug, $existing_terms);
    $existing_names = array_map(fn($term) => $term->name, $existing_terms);

    if ($existing_slugs && !in_array($target_slug, $existing_slugs, true)) {
        $skipped[] = [
            'product_id' => $product_id,
            'product_name' => $post->post_title,
            'target_product_brand_name' => $target_name,
            'target_product_brand_slug' => $target_slug,
            'reason' => 'product_already_has_different_product_brand:' . implode('|', $existing_names),
        ];
        continue;
    }

    $term = emart_find_or_create_brand($target_name, $target_slug, $created_terms, $apply);
    $action = in_array($target_slug, $existing_slugs, true) ? 'already_assigned' : 'assign_product_brand';

    if ($apply && $action === 'assign_product_brand') {
        $result = wp_set_object_terms($product_id, [(int) $term->term_id], 'product_brand', true);
        if (is_wp_error($result)) {
            $skipped[] = [
                'product_id' => $product_id,
                'product_name' => $post->post_title,
                'target_product_brand_name' => $target_name,
                'target_product_brand_slug' => $target_slug,
                'reason' => $result->get_error_message(),
            ];
            continue;
        }
        $fresh_term = get_term_by('slug', $target_slug, 'product_brand');
        if ($fresh_term && $fresh_term->term_taxonomy_id) {
            $rollback[] = "DELETE FROM {$GLOBALS['wpdb']->term_relationships} WHERE object_id={$product_id} AND term_taxonomy_id=" . (int) $fresh_term->term_taxonomy_id . ";";
        }
    }

    $applied[] = [
        'product_id' => $product_id,
        'product_name' => $post->post_title,
        'product_slug' => $post->post_name,
        'source_pa_brand_name' => $row['source_pa_brand_name'] ?? '',
        'source_pa_brand_slug' => $row['source_pa_brand_slug'] ?? '',
        'target_product_brand_name' => $target_name,
        'target_product_brand_slug' => $target_slug,
        'existing_product_brand_name' => implode('|', $existing_names),
        'existing_product_brand_slug' => implode('|', $existing_slugs),
        'action' => $action,
        'term_id' => $term->term_id ?? '',
        'term_taxonomy_id' => $term->term_taxonomy_id ?? '',
    ];
}

if ($apply) {
    $term_taxonomy_ids = $GLOBALS['wpdb']->get_col("SELECT term_taxonomy_id FROM {$GLOBALS['wpdb']->term_taxonomy} WHERE taxonomy='product_brand'");
    wp_update_term_count_now(array_map('intval', $term_taxonomy_ids), 'product_brand');
    clean_taxonomy_cache('product_brand');
    wp_cache_flush();
}

emart_write_csv($out_dir . '/applied-xlsx-brand-corrections.csv', [
    'product_id', 'product_name', 'product_slug', 'source_pa_brand_name', 'source_pa_brand_slug',
    'target_product_brand_name', 'target_product_brand_slug', 'existing_product_brand_name',
    'existing_product_brand_slug', 'action', 'term_id', 'term_taxonomy_id',
], $applied);
emart_write_csv($out_dir . '/skipped-xlsx-brand-corrections.csv', [
    'product_id', 'product_name', 'target_product_brand_name', 'target_product_brand_slug', 'reason',
], $skipped);
emart_write_csv($out_dir . '/created-product-brand-terms.csv', [
    'target_product_brand_name', 'target_product_brand_slug', 'term_id', 'term_taxonomy_id',
], $created_terms);
file_put_contents($out_dir . '/rollback-xlsx-brand-corrections.sql', implode("\n", $rollback) . "\n");

$summary = [
    'mode=' . ($apply ? 'apply' : 'dry-run'),
    'input_csv=' . $input_csv,
    'output_dir=' . $out_dir,
    'input_rows=' . count($rows),
    'planned_or_applied=' . count($applied),
    'skipped=' . count($skipped),
    'created_terms=' . count($created_terms),
    'backup_tsv=' . $backup_path,
    'rollback_sql=' . $out_dir . '/rollback-xlsx-brand-corrections.sql',
    '',
];
file_put_contents($out_dir . '/summary.txt', implode("\n", $summary));
echo implode("\n", $summary);
