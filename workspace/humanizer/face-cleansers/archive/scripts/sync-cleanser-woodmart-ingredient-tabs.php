<?php
/**
 * Sync verified cleanser INCI HTML from _emart_ingredients into the legacy
 * Woodmart ingredient custom tab fields. This removes stale placeholder copy
 * from product meta/API payloads while keeping _emart_ingredients canonical.
 *
 * Dry-run:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/active/sync-cleanser-woodmart-ingredient-tabs.php
 *
 * Apply:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/active/sync-cleanser-woodmart-ingredient-tabs.php apply
 */

global $wpdb, $args;

$script_args = isset($args) && is_array($args) ? $args : array_slice($_SERVER['argv'], 1);
$apply = in_array('apply', $script_args, true) || in_array('--apply', $script_args, true);
$dry_run = !$apply;
$rollback_dir = '/root/emart-platform/workspace/audit/active';

$targets = [
    93160 => 'cosrx-salicylic-acid-daily-gentle-cleanser-150ml',
    4149 => 'cosrx-advanced-snail-mucin-gel-cleanser-150ml',
];

function cleanser_sync_meta_rows($post_id, $meta_key) {
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

function cleanser_sync_upsert_unique($post_id, $meta_key, $meta_value) {
    global $wpdb;
    $rows = cleanser_sync_meta_rows($post_id, $meta_key);
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

echo ($dry_run ? "DRY RUN" : "APPLY") . " — sync cleanser Woodmart ingredient tabs\n";

$errors = [];
$changes = [];

foreach ($targets as $post_id => $slug) {
    $post = get_post($post_id);
    if (!$post) {
        $errors[] = "{$post_id}: missing product";
        continue;
    }
    if ($post->post_name !== $slug) {
        $errors[] = "{$post_id}: slug mismatch, expected {$slug}, got {$post->post_name}";
        continue;
    }

    $ingredients_html = (string) get_post_meta($post_id, '_emart_ingredients', true);
    if (strpos($ingredients_html, 'Full Ingredient List') === false || strpos($ingredients_html, 'Source: product ingredient listing') === false) {
        $errors[] = "{$post_id}: _emart_ingredients does not look like verified INCI HTML";
        continue;
    }
    if (strpos($ingredients_html, 'Full INCI list original packaging') !== false) {
        $errors[] = "{$post_id}: _emart_ingredients still contains placeholder text";
        continue;
    }

    $woodmart_content = (string) get_post_meta($post_id, '_woodmart_product_custom_tab_content', true);
    $legacy_content = (string) get_post_meta($post_id, 'custom_tab_content1', true);
    $needs_update =
        trim($woodmart_content) !== trim($ingredients_html) ||
        trim($legacy_content) !== trim($ingredients_html);

    $changes[$post_id] = [
        'slug' => $slug,
        'ingredients_html' => $ingredients_html,
        'needs_update' => $needs_update,
    ];

    echo "- {$post_id} {$slug}: " . ($needs_update ? 'needs sync' : 'already synced') . "\n";
}

if ($errors) {
    foreach ($errors as $error) {
        echo "ERROR: {$error}\n";
    }
    exit(1);
}

if ($dry_run) {
    echo "No DB changes made. Re-run with positional argument 'apply' to sync these fields.\n";
    exit(0);
}

if (!is_dir($rollback_dir)) {
    mkdir($rollback_dir, 0755, true);
}

$rollback = [
    'captured_at' => gmdate('c'),
    'products' => [],
];

foreach ($changes as $post_id => $change) {
    $rollback['products'][] = [
        'post_id' => $post_id,
        'slug' => $change['slug'],
        'old_rows' => [
            '_woodmart_product_custom_tab_title' => cleanser_sync_meta_rows($post_id, '_woodmart_product_custom_tab_title'),
            '_woodmart_product_custom_tab_content' => cleanser_sync_meta_rows($post_id, '_woodmart_product_custom_tab_content'),
            'custom_tab_title1' => cleanser_sync_meta_rows($post_id, 'custom_tab_title1'),
            'custom_tab_content1' => cleanser_sync_meta_rows($post_id, 'custom_tab_content1'),
        ],
    ];
}

$rollback_path = $rollback_dir . '/cleanser-woodmart-ingredient-tabs-rollback-' . gmdate('Ymd-His') . '.json';
file_put_contents($rollback_path, wp_json_encode($rollback, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

foreach ($changes as $post_id => $change) {
    cleanser_sync_upsert_unique($post_id, '_woodmart_product_custom_tab_title', 'Ingredients');
    cleanser_sync_upsert_unique($post_id, '_woodmart_product_custom_tab_content', $change['ingredients_html']);
    cleanser_sync_upsert_unique($post_id, 'custom_tab_title1', 'Ingredients');
    cleanser_sync_upsert_unique($post_id, 'custom_tab_content1', $change['ingredients_html']);
    clean_post_cache($post_id);
}

wp_cache_flush();

echo "Synced Woodmart ingredient tabs: " . count($changes) . "\n";
echo "Rollback: {$rollback_path}\n";

foreach (array_keys($changes) as $post_id) {
    $content_rows = cleanser_sync_meta_rows($post_id, '_woodmart_product_custom_tab_content');
    $legacy_rows = cleanser_sync_meta_rows($post_id, 'custom_tab_content1');
    echo "- {$post_id}: woodmart_content_rows=" . count($content_rows)
        . ", legacy_content_rows=" . count($legacy_rows)
        . ", length=" . strlen($content_rows[0]['meta_value'] ?? '') . "\n";
}
