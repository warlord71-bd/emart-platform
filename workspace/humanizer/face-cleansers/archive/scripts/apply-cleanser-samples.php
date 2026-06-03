<?php
/**
 * Apply reviewed cleanser humanizer samples from a JSONL file.
 *
 * Dry-run:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/active/apply-cleanser-samples.php workspace/audit/active/cleanser-humanizer-5-samples-YYYYMMDD-HHMMSS.jsonl
 *
 * Apply:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/active/apply-cleanser-samples.php workspace/audit/active/cleanser-humanizer-5-samples-YYYYMMDD-HHMMSS.jsonl apply
 */

global $wpdb, $args;

$script_args = isset($args) && is_array($args) ? $args : array_slice($_SERVER['argv'], 1);
$jsonl_path = '';
foreach ($script_args as $arg) {
    if (is_string($arg) && str_ends_with($arg, '.jsonl') && is_readable($arg)) {
        $jsonl_path = $arg;
        break;
    }
}
if (!$jsonl_path) {
    $candidates = glob('/root/emart-platform/workspace/audit/active/cleanser-humanizer-5-samples-*.jsonl');
    sort($candidates);
    $jsonl_path = $candidates ? end($candidates) : '';
}
$apply = in_array('apply', $script_args, true) || in_array('--apply', $script_args, true);
$dry_run = !$apply;
$rollback_dir = '/root/emart-platform/workspace/audit/active';

if (!$jsonl_path || !is_readable($jsonl_path)) {
    fwrite(STDERR, "Usage: wp eval-file apply-cleanser-samples.php [samples.jsonl] [apply]\n");
    exit(1);
}

function apply_samples_plain_text($html) {
    return trim(preg_replace('/\s+/', ' ', wp_strip_all_tags($html)));
}

function apply_samples_headings($html) {
    if (!preg_match_all('/<h3[^>]*>(.*?)<\/h3>/is', $html, $matches)) {
        return [];
    }
    return array_map(
        static fn($heading) => trim(wp_strip_all_tags($heading)),
        $matches[1]
    );
}

function apply_samples_meta_rows($post_id, $meta_key) {
    global $wpdb;
    return $wpdb->get_results(
        $wpdb->prepare(
            "SELECT meta_id, meta_value FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key = %s ORDER BY meta_id ASC",
            $post_id,
            $meta_key
        ),
        ARRAY_A
    );
}

function apply_samples_upsert_unique_postmeta($post_id, $meta_key, $meta_value) {
    global $wpdb;
    $rows = apply_samples_meta_rows($post_id, $meta_key);
    if (!$rows) {
        add_post_meta($post_id, $meta_key, $meta_value, true);
        return;
    }

    $keep_id = (int) $rows[0]['meta_id'];
    $wpdb->update(
        $wpdb->postmeta,
        ['meta_value' => $meta_value],
        ['meta_id' => $keep_id],
        ['%s'],
        ['%d']
    );

    $duplicate_ids = array_map(
        static fn($row) => (int) $row['meta_id'],
        array_slice($rows, 1)
    );
    if ($duplicate_ids) {
        $placeholders = implode(',', array_fill(0, count($duplicate_ids), '%d'));
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->postmeta} WHERE meta_id IN ($placeholders)",
            $duplicate_ids
        ));
    }
}

function apply_samples_validate($sample) {
    $errors = [];
    $required_sections = [
        'Key Benefits',
        'Key Ingredients',
        'Best For',
        'Targets These Concerns',
        'Not Recommended For',
        'How to Use',
        'Routine Fit',
        'Disclaimer',
    ];
    $body_banned = [
        'price in bangladesh',
        'cash on delivery',
        'cod available',
        'available at emart',
        'buy now',
        'shop now',
        'order today',
    ];

    $post_id = (int) ($sample['post_id'] ?? 0);
    $slug = (string) ($sample['slug'] ?? '');
    $meta = trim((string) ($sample['meta_desc'] ?? ''));
    $html = (string) ($sample['content_html'] ?? '');
    $plain = apply_samples_plain_text($html);
    $plain_lower = strtolower($plain);
    $sections = apply_samples_headings($html);

    $post = get_post($post_id);
    if (!$post) {
        $errors[] = "missing product {$post_id}";
    } elseif ($slug && $post->post_name !== $slug) {
        $errors[] = "slug mismatch for {$post_id}: expected {$slug}, got {$post->post_name}";
    }

    foreach ($required_sections as $section) {
        if (!in_array($section, $sections, true)) {
            $errors[] = "missing section: {$section}";
        }
    }
    foreach (["Who It's For", "Who It’s For"] as $forbidden) {
        if (in_array($forbidden, $sections, true)) {
            $errors[] = "duplicate fit section: {$forbidden}";
        }
    }
    foreach ($body_banned as $phrase) {
        if (strpos($plain_lower, $phrase) !== false) {
            $errors[] = "body contains banned ecommerce phrase: {$phrase}";
        }
    }
    if (mb_strlen($plain) < 1600) {
        $errors[] = "content too short: " . mb_strlen($plain);
    }

    $meta_len = mb_strlen($meta);
    if ($meta_len < 130 || $meta_len > 160) {
        $errors[] = "meta length invalid: {$meta_len}";
    }
    $meta_lower = strtolower($meta);
    if (strpos($meta_lower, 'price in bangladesh') === false && strpos($meta_lower, 'price at emart') === false) {
        $errors[] = "meta missing price keyword";
    }
    if (strpos($meta_lower, 'emart') === false) {
        $errors[] = "meta missing Emart";
    }
    if (preg_match('/৳|\bBDT\b|\bTk\.?\s*\d|\btaka\b|(?<![\w.])\d{1,2},\d{3}(?!\w)/i', $meta)) {
        $errors[] = "meta contains price amount";
    }
    if (preg_match('/<h2\b/i', $html)) {
        $errors[] = "content contains h2";
    }
    if (stripos($html, '<aside') !== false || stripos($html, 'product-disclaimer') !== false) {
        $errors[] = "content contains aside/product-disclaimer";
    }

    return $errors;
}

$samples = [];
$lines = file($jsonl_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line_number => $line) {
    $sample = json_decode($line, true);
    if (!is_array($sample)) {
        fwrite(STDERR, "Invalid JSON on line " . ($line_number + 1) . "\n");
        exit(1);
    }
    $samples[] = $sample;
}

echo ($dry_run ? "DRY RUN" : "APPLY") . " — cleanser samples from {$jsonl_path}\n";
echo "Samples: " . count($samples) . "\n";

$all_errors = [];
foreach ($samples as $sample) {
    $errors = apply_samples_validate($sample);
    $post_id = (int) $sample['post_id'];
    $title = (string) $sample['title'];
    echo "- {$post_id} {$title}: " . ($errors ? "FAIL" : "PASS") . "\n";
    foreach ($errors as $error) {
        echo "  ERROR: {$error}\n";
        $all_errors[] = "{$post_id}: {$error}";
    }
}

if ($all_errors) {
    fwrite(STDERR, "Validation failed; no writes performed.\n");
    exit(1);
}

if ($dry_run) {
    echo "No DB changes made. Re-run with positional argument 'apply' to write these samples.\n";
    exit(0);
}

if (!is_dir($rollback_dir)) {
    mkdir($rollback_dir, 0755, true);
}

$rollback = [
    'source_jsonl' => $jsonl_path,
    'captured_at' => gmdate('c'),
    'products' => [],
];

foreach ($samples as $sample) {
    $post_id = (int) $sample['post_id'];
    $post = get_post($post_id);
    $rollback['products'][] = [
        'post_id' => $post_id,
        'slug' => $post ? $post->post_name : '',
        'old_post_content' => $post ? $post->post_content : '',
        'old_emart_meta_description_rows' => apply_samples_meta_rows($post_id, '_emart_meta_description'),
        'old_rank_math_description_rows' => apply_samples_meta_rows($post_id, '_rank_math_description'),
        'old_emart_humanized_rows' => apply_samples_meta_rows($post_id, '_emart_humanized'),
    ];
}

$rollback_path = $rollback_dir . '/cleanser-humanizer-5-rollback-' . gmdate('Ymd-His') . '.json';
file_put_contents($rollback_path, wp_json_encode($rollback, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

foreach ($samples as $sample) {
    $post_id = (int) $sample['post_id'];
    $updated = wp_update_post([
        'ID' => $post_id,
        'post_content' => $sample['content_html'],
    ], true);
    if (is_wp_error($updated)) {
        fwrite(STDERR, "wp_update_post failed for {$post_id}: " . $updated->get_error_message() . "\n");
        exit(1);
    }

    apply_samples_upsert_unique_postmeta($post_id, '_emart_meta_description', $sample['meta_desc']);
    apply_samples_upsert_unique_postmeta($post_id, '_rank_math_description', $sample['meta_desc']);
    apply_samples_upsert_unique_postmeta($post_id, '_emart_humanized', gmdate('c'));
    clean_post_cache($post_id);
}

wp_cache_flush();

echo "Applied " . count($samples) . " cleanser samples.\n";
echo "Rollback: {$rollback_path}\n";

foreach ($samples as $sample) {
    $post_id = (int) $sample['post_id'];
    $emart_rows = apply_samples_meta_rows($post_id, '_emart_meta_description');
    $rank_rows = apply_samples_meta_rows($post_id, '_rank_math_description');
    echo "- {$post_id}: _emart_meta_description rows=" . count($emart_rows)
        . ", _rank_math_description rows=" . count($rank_rows) . "\n";
}
