<?php
/**
 * Replace misleading Korea-import wording on non-Korean-origin product copy.
 *
 * Dry run:
 * wp --path=/var/www/wordpress --allow-root eval-file /root/emart-platform/workspace/scripts/active/fix-non-korean-korea-import-copy.php
 *
 * Apply:
 * APPLY=1 wp --path=/var/www/wordpress --allow-root eval-file /root/emart-platform/workspace/scripts/active/fix-non-korean-korea-import-copy.php
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run this through wp eval-file.\n");
    exit(1);
}

$apply = getenv('APPLY') === '1';
$active_dir = '/root/emart-platform/workspace/audit/active';
$archive_dir = '/root/emart-platform/workspace/audit/archive';
foreach ([$active_dir, $archive_dir] as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

$stamp = gmdate('Ymd-His');
$report_path = "$active_dir/non-korean-korea-import-copy-" . ($apply ? 'apply' : 'dry-run') . "-$stamp.csv";
$summary_path = "$active_dir/non-korean-korea-import-copy-" . ($apply ? 'apply' : 'dry-run') . "-summary-$stamp.txt";
$backup_path = "$archive_dir/non-korean-korea-import-copy-backup-$stamp.csv";

$public_meta_keys = [
    '_rank_math_description',
    '_rank_math_title',
    '_emart_meta_description',
    '_emart_product_faq',
    '_structured_description',
    'fb_product_description',
    'fb_rich_text_description',
    'meta description',
    'rank_math_description',
];

function emart_korea_copy_has_bad_phrase($value) {
    return is_string($value) && preg_match('/(?:korea\s+imports?|korean\s+imports?|imported\s+from\s+korea)/i', $value);
}

function emart_korea_copy_origin_terms($post_id) {
    $terms = wp_get_object_terms($post_id, 'pa_origin');
    if (is_wp_error($terms) || empty($terms)) {
        return [];
    }
    return array_values(array_filter(array_map(function ($term) {
        return [
            'name' => (string) $term->name,
            'slug' => (string) $term->slug,
        ];
    }, $terms)));
}

function emart_korea_copy_is_korean_origin($origin_terms) {
    foreach ($origin_terms as $term) {
        if ($term['slug'] === 'south-korea') {
            return true;
        }
    }
    return false;
}

function emart_korea_copy_origin_adjective($origin_name) {
    $map = [
        'Bangladesh' => 'Bangladeshi',
        'Canada' => 'Canadian',
        'China' => 'China-origin',
        'France' => 'French',
        'Germany' => 'German',
        'India' => 'Indian',
        'Japan' => 'Japanese',
        'Malaysia' => 'Malaysian',
        'Pakistan' => 'Pakistani',
        'Philippines' => 'Philippine',
        'Poland' => 'Polish',
        'South Africa' => 'South African',
        'Spain' => 'Spanish',
        'Sri Lanka' => 'Sri Lankan',
        'Taiwan' => 'Taiwanese',
        'Thailand' => 'Thai',
        'Turkey' => 'Turkish',
        'UAE' => 'UAE-origin',
        'UK' => 'UK-origin',
        'USA' => 'USA-origin',
    ];
    return $map[$origin_name] ?? '';
}

function emart_korea_copy_labels($origin_terms) {
    if (count($origin_terms) !== 1) {
        return [
            'singular' => 'Emart-verified product',
            'plural' => 'Emart-verified products',
            'status' => empty($origin_terms) ? 'missing_origin_generic_safe_text' : 'multiple_origin_generic_safe_text',
        ];
    }

    $origin_name = $origin_terms[0]['name'];
    if ($origin_name === 'Multinational') {
        return [
            'singular' => 'Emart-verified product',
            'plural' => 'Emart-verified products',
            'status' => 'multinational_generic_safe_text',
        ];
    }

    $adj = emart_korea_copy_origin_adjective($origin_name);
    if (!$adj) {
        return [
            'singular' => 'Emart-verified product',
            'plural' => 'Emart-verified products',
            'status' => 'unknown_origin_generic_safe_text',
        ];
    }

    return [
        'singular' => "$adj product",
        'plural' => "$adj products",
        'status' => 'origin_specific_safe_text',
    ];
}

function emart_korea_copy_replace($value, $labels) {
    $before = (string) $value;
    $after = $before;
    $singular = $labels['singular'];
    $plural = $labels['plural'];

    $replacements = [
        '/100%\s+authentic\s+and\s+directly\s+imported\s+from\s+Korea/i' => "100% authentic $singular",
        '/100%\s+authentic\s+Korea\s+imports/i' => "100% authentic $plural",
        '/100%\s+authentic\s+Korean\s+imports/i' => "100% authentic $plural",
        '/100%\s+authentic\s+Korea\s+import/i' => "100% authentic $singular",
        '/100%\s+authentic\s+Korean\s+import/i' => "100% authentic $singular",
        '/authentic\s+and\s+directly\s+imported\s+from\s+Korea/i' => "authentic $singular",
        '/directly\s+imported\s+from\s+Korea/i' => $singular,
        '/imported\s+from\s+Korea/i' => $singular,
        '/Korea\s+imports/i' => $plural,
        '/Korean\s+imports/i' => $plural,
        '/Korea\s+import/i' => $singular,
        '/Korean\s+import/i' => $singular,
    ];

    foreach ($replacements as $pattern => $replacement) {
        $after = preg_replace($pattern, $replacement, $after);
    }

    return $after;
}

function emart_korea_copy_snippet($value) {
    $plain = trim(preg_replace('/\s+/', ' ', wp_strip_all_tags((string) $value)));
    if (strlen($plain) <= 180) {
        return $plain;
    }
    return substr($plain, 0, 177) . '...';
}

$ids = get_posts([
    'post_type' => 'product',
    'post_status' => 'publish',
    'posts_per_page' => -1,
    'fields' => 'ids',
    'orderby' => 'ID',
    'order' => 'ASC',
]);

$report = fopen($report_path, 'w');
$backup = fopen($backup_path, 'w');
fputcsv($report, ['action', 'post_id', 'slug', 'title', 'origin', 'field', 'meta_key', 'label_status', 'before_snippet', 'after_snippet']);
fputcsv($backup, ['post_id', 'slug', 'title', 'origin', 'field', 'meta_key', 'original_value']);

$changed_posts = [];
$summary = [
    'mode' => $apply ? 'apply' : 'dry-run',
    'published_products_scanned' => count($ids),
    'products_changed_or_planned' => 0,
    'field_changes_or_planned' => 0,
    'post_content' => 0,
    'post_excerpt' => 0,
    'meta' => 0,
    'skipped_south_korea_origin' => 0,
];

foreach ($ids as $post_id) {
    $post = get_post($post_id);
    if (!$post) {
        continue;
    }

    $origin_terms = emart_korea_copy_origin_terms($post_id);
    if (emart_korea_copy_is_korean_origin($origin_terms)) {
        if (
            emart_korea_copy_has_bad_phrase($post->post_content) ||
            emart_korea_copy_has_bad_phrase($post->post_excerpt)
        ) {
            $summary['skipped_south_korea_origin']++;
        }
        continue;
    }

    $origin_names = implode(' | ', array_map(function ($term) {
        return $term['name'];
    }, $origin_terms));
    if (!$origin_names) {
        $origin_names = '(missing origin)';
    }

    $labels = emart_korea_copy_labels($origin_terms);
    $post_updates = ['ID' => $post_id];
    $post_needs_update = false;

    foreach (['post_content', 'post_excerpt'] as $field) {
        $before = (string) $post->{$field};
        if (!emart_korea_copy_has_bad_phrase($before)) {
            continue;
        }
        $after = emart_korea_copy_replace($before, $labels);
        if ($after === $before || emart_korea_copy_has_bad_phrase($after)) {
            continue;
        }

        $post_updates[$field] = $after;
        $post_needs_update = true;
        $changed_posts[$post_id] = true;
        $summary['field_changes_or_planned']++;
        $summary[$field]++;

        fputcsv($report, [
            $apply ? 'updated' : 'planned_update',
            $post_id,
            $post->post_name,
            $post->post_title,
            $origin_names,
            $field,
            '',
            $labels['status'],
            emart_korea_copy_snippet($before),
            emart_korea_copy_snippet($after),
        ]);
        fputcsv($backup, [$post_id, $post->post_name, $post->post_title, $origin_names, $field, '', $before]);
    }

    if ($apply && $post_needs_update) {
        wp_update_post(wp_slash($post_updates));
    }

    foreach ($public_meta_keys as $meta_key) {
        $values = get_post_meta($post_id, $meta_key, false);
        if (empty($values)) {
            continue;
        }
        foreach ($values as $index => $before_value) {
            if (!is_string($before_value) || !emart_korea_copy_has_bad_phrase($before_value)) {
                continue;
            }
            $after_value = emart_korea_copy_replace($before_value, $labels);
            if ($after_value === $before_value || emart_korea_copy_has_bad_phrase($after_value)) {
                continue;
            }

            $changed_posts[$post_id] = true;
            $summary['field_changes_or_planned']++;
            $summary['meta']++;

            fputcsv($report, [
                $apply ? 'updated' : 'planned_update',
                $post_id,
                $post->post_name,
                $post->post_title,
                $origin_names,
                'postmeta',
                $meta_key,
                $labels['status'],
                emart_korea_copy_snippet($before_value),
                emart_korea_copy_snippet($after_value),
            ]);
            fputcsv($backup, [$post_id, $post->post_name, $post->post_title, $origin_names, 'postmeta', $meta_key, $before_value]);

            if ($apply) {
                $all_values = get_post_meta($post_id, $meta_key, false);
                delete_post_meta($post_id, $meta_key);
                foreach ($all_values as $value_index => $value) {
                    add_post_meta($post_id, $meta_key, $value_index === $index ? wp_slash($after_value) : wp_slash($value));
                }
            }
        }
    }

    if ($apply && isset($changed_posts[$post_id])) {
        clean_post_cache($post_id);
        clean_object_term_cache($post_id, 'product');
        if (function_exists('wc_delete_product_transients')) {
            wc_delete_product_transients($post_id);
        }
    }
}

$summary['products_changed_or_planned'] = count($changed_posts);

fclose($report);
fclose($backup);

$lines = [];
foreach ($summary as $key => $value) {
    $lines[] = "$key=$value";
}
$lines[] = "report=$report_path";
$lines[] = "backup=$backup_path";
file_put_contents($summary_path, implode("\n", $lines) . "\n");

echo implode("\n", $lines) . "\n";
