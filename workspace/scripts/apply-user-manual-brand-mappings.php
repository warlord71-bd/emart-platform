<?php
/**
 * Apply the user-approved partial manual brand mapping batch.
 *
 * Dry-run:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/apply-user-manual-brand-mappings.php
 *
 * Apply:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/apply-user-manual-brand-mappings.php -- --apply
 */

$argv = array_slice($_SERVER['argv'] ?? [], 1);
$apply = getenv('EMART_APPLY_USER_BRAND_MAPPINGS') === '1' || in_array('--apply', $argv, true) || in_array('apply', $argv, true);
$root = dirname(__DIR__, 2);
$manual_csv = $root . '/workspace/audit/seo/brand-source-unification-20260503/manual-review.csv';
$out_dir = $root . '/workspace/audit/seo/brand-source-unification-20260503/user-partial-brand-mappings-20260503';

if (!is_dir($out_dir)) {
    mkdir($out_dir, 0775, true);
}

$mappings = [
    ['2915', 'innisfree'],
    ['2961', 'Purito Seoul'],
    ['2969', 'Purito Seoul'],
    ['3629', 'Welcos Confume'],
    ['3630', 'Welcos Confume'],
    ['3671', 'Welcos Confume'],
    ['4141', 'Beaute'],
    ['26501', 'Simple'],
    ['26618', 'HTS'],
    ['26621', 'Claires'],
    ['26899', 'Beaute'],
    ['26904', 'Beaute'],
    ['27078', 'Kosmedica'],
    ['27142', 'Skylake'],
    ['27143', 'Son & Park'],
    ['27145', 'Heeyul'],
    ['27229', 'Jiggot'],
    ['63049', 'Emart Combo'],
    ['63061', 'Romnd'],
    ['75617', 'Yadha'],
    ['75615', 'Xisjoem'],
    ['75611', 'Wishcare'],
    ['75569', 'W7'],
    ['75565', 'Wskinlab'],
    ['75543', 'Vatika Naturals'],
    ['75535', 'vaseline'],
    ['75515', 'Valencia Gio'],
    ['75513', 'Trendy Beautis'],
    ['75512', 'Tresemme'],
    ['75361', 'Sudocrem'],
    ['75359', 'Technic'],
    ['75311', 'Swiss Beauty'],
    ['75273', 'Sunsilk'],
    ['75265', 'Streax'],
    ['75259', "Skin'O"],
    ['75217', 'skinLogic'],
    ['75191', 'Skincafe'],
    ['75178', 'Shiliya'],
    ['75163', 'Seravix'],
    ['75161', 'SebaMed'],
    ['75151', 'Sadoer'],
    ['75103', 'SkinAqua'],
    ['75082', 'Rimmel'],
    ['75076', 'Ribana'],
    ['75066', 'Remington'],
    ['75064', 'Rajkonna'],
    ['75036', 'Ponds'],
    ['75020', 'PinkFlash'],
    ['74997', 'Pastel Beauty'],
    ['74985', 'Purito Seoul'],
    ['74979', 'Oporajita'],
    ['74971', 'Ombre'],
    ['74953', 'OgX'],
    ['7589', 'Some By Mi'],
    ['2628', 'Dear Klairs'],
    ['2728', 'I am From'],
];

function emart_slugify_brand($value) {
    $slug = strtolower((string) $value);
    $slug = str_replace('&', 'and', $slug);
    $slug = str_replace("'", '', $slug);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    return trim($slug, '-');
}

function emart_read_csv_assoc($path) {
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
    return [$headers, $rows];
}

function emart_write_csv_assoc($path, $headers, $rows) {
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

function emart_product_brand_terms($product_id) {
    $terms = wp_get_object_terms((int) $product_id, 'product_brand');
    if (is_wp_error($terms)) {
        return [];
    }
    return $terms;
}

function emart_get_or_create_product_brand($name, $slug, &$created_terms, $apply) {
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
    ];
    return $term;
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

[$manual_headers, $manual_rows] = emart_read_csv_assoc($manual_csv);
$manual_by_id = [];
foreach ($manual_rows as $row) {
    $manual_by_id[(string) $row['product_id']] = $row;
}

$applied = [];
$skipped = [];
$created_terms = [];
$remove_ids = [];
$rollback = [];

$product_ids = array_map(fn($row) => (int) $row[0], $mappings);
$backup_ids = implode(',', array_filter($product_ids));
$backup_path = $out_dir . '/pre-user-brand-mapping-backup.tsv';
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
$backup_lines = ["product_id\tproduct_name\tterm_id\tterm_taxonomy_id\tslug\tname"];
foreach ($backup_rows as $backup_row) {
    $backup_lines[] = implode("\t", array_map(fn($value) => (string) $value, $backup_row));
}
file_put_contents($backup_path, implode("\n", $backup_lines) . "\n");

foreach ($mappings as [$product_id, $brand_name]) {
    $product_id = (string) $product_id;
    $slug = emart_slugify_brand($brand_name);
    $manual = $manual_by_id[$product_id] ?? null;
    $post = get_post((int) $product_id);

    if (!$manual) {
        $skipped[] = [
            'product_id' => $product_id,
            'product_name' => $post ? $post->post_title : '',
            'target_product_brand_name' => $brand_name,
            'target_product_brand_slug' => $slug,
            'reason' => 'manual_review_row_not_found',
        ];
        continue;
    }
    if (!$post || $post->post_type !== 'product' || $post->post_status !== 'publish') {
        $skipped[] = [
            'product_id' => $product_id,
            'product_name' => $manual['product_name'] ?? '',
            'target_product_brand_name' => $brand_name,
            'target_product_brand_slug' => $slug,
            'reason' => 'published_product_not_found',
        ];
        continue;
    }

    $existing_terms = emart_product_brand_terms($product_id);
    $existing_slugs = array_map(fn($term) => $term->slug, $existing_terms);
    $existing_names = array_map(fn($term) => $term->name, $existing_terms);
    if ($existing_slugs && !in_array($slug, $existing_slugs, true)) {
        $skipped[] = [
            'product_id' => $product_id,
            'product_name' => $post->post_title,
            'target_product_brand_name' => $brand_name,
            'target_product_brand_slug' => $slug,
            'reason' => 'product_already_has_different_product_brand:' . implode('|', $existing_names),
        ];
        continue;
    }

    $term = emart_get_or_create_product_brand($brand_name, $slug, $created_terms, $apply);
    $action = in_array($slug, $existing_slugs, true) ? 'already_assigned_remove_from_manual' : 'assign_product_brand';
    if ($apply && $action === 'assign_product_brand') {
        $result = wp_set_object_terms((int) $product_id, [(int) $term->term_id], 'product_brand', true);
        if (is_wp_error($result)) {
            $skipped[] = [
                'product_id' => $product_id,
                'product_name' => $post->post_title,
                'target_product_brand_name' => $brand_name,
                'target_product_brand_slug' => $slug,
                'reason' => $result->get_error_message(),
            ];
            continue;
        }
        $fresh_term = get_term_by('slug', $slug, 'product_brand');
        $term_taxonomy_id = $fresh_term ? $fresh_term->term_taxonomy_id : '';
        if ($term_taxonomy_id) {
            $rollback[] = "DELETE FROM {$GLOBALS['wpdb']->term_relationships} WHERE object_id=" . (int) $product_id . " AND term_taxonomy_id=" . (int) $term_taxonomy_id . ";";
        }
    }

    $applied[] = [
        'product_id' => $product_id,
        'product_name' => $post->post_title,
        'product_slug' => $post->post_name,
        'source_pa_brand_name' => $manual['source_pa_brand_name'] ?? '',
        'source_pa_brand_slug' => $manual['source_pa_brand_slug'] ?? '',
        'target_product_brand_name' => $brand_name,
        'target_product_brand_slug' => $slug,
        'existing_product_brand_name' => implode('|', $existing_names),
        'existing_product_brand_slug' => implode('|', $existing_slugs),
        'action' => $action,
        'term_id' => $term->term_id ?? '',
        'term_taxonomy_id' => $term->term_taxonomy_id ?? '',
    ];
    $remove_ids[$product_id] = true;
}

if ($apply) {
    $manual_rows = array_values(array_filter($manual_rows, fn($row) => !isset($remove_ids[(string) $row['product_id']])));
    emart_write_csv_assoc($manual_csv, $manual_headers, $manual_rows);
    $term_taxonomy_ids = $GLOBALS['wpdb']->get_col("SELECT term_taxonomy_id FROM {$GLOBALS['wpdb']->term_taxonomy} WHERE taxonomy='product_brand'");
    wp_update_term_count_now(array_map('intval', $term_taxonomy_ids), 'product_brand');
}

emart_write_csv($out_dir . '/applied-user-brand-mappings.csv', [
    'product_id', 'product_name', 'product_slug', 'source_pa_brand_name', 'source_pa_brand_slug',
    'target_product_brand_name', 'target_product_brand_slug', 'existing_product_brand_name',
    'existing_product_brand_slug', 'action', 'term_id', 'term_taxonomy_id',
], $applied);
emart_write_csv($out_dir . '/skipped-user-brand-mappings.csv', [
    'product_id', 'product_name', 'target_product_brand_name', 'target_product_brand_slug', 'reason',
], $skipped);
emart_write_csv($out_dir . '/created-product-brand-terms.csv', [
    'target_product_brand_name', 'target_product_brand_slug', 'term_id',
], $created_terms);

$rollback_path = $out_dir . '/rollback-user-brand-mappings.sql';
file_put_contents($rollback_path, implode("\n", $rollback) . "\n");

$summary = [
    'mode=' . ($apply ? 'apply' : 'dry-run'),
    'manual_csv=' . $manual_csv,
    'output_dir=' . $out_dir,
    'input_mappings=' . count($mappings),
    'planned_or_applied=' . count($applied),
    'skipped=' . count($skipped),
    'created_terms=' . count($created_terms),
    'manual_rows_before=' . count($manual_by_id),
    'manual_rows_after=' . ($apply ? count($manual_rows) : count($manual_by_id)),
    'backup_tsv=' . $backup_path,
    'rollback_sql=' . $rollback_path,
    '',
];
file_put_contents($out_dir . '/summary.txt', implode("\n", $summary));
echo implode("\n", $summary);
