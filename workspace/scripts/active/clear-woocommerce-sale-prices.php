<?php
/**
 * Export and clear WooCommerce sale prices without changing regular prices.
 *
 * Usage:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/active/clear-woocommerce-sale-prices.php
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/active/clear-woocommerce-sale-prices.php -- --apply
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run through wp eval-file so WordPress and WooCommerce are loaded.\n");
    exit(1);
}

global $wpdb, $argv;

$apply = in_array('--apply', $argv, true);
$root = getcwd();
$backupDir = $root . '/workspace/audit/archive';

if (!is_dir($backupDir)) {
    fwrite(STDERR, "Backup directory not found: {$backupDir}\n");
    exit(1);
}

if (!function_exists('wc_get_product')) {
    fwrite(STDERR, "WooCommerce is not loaded; aborting.\n");
    exit(1);
}

$rows = $wpdb->get_results(
    "
    SELECT
        p.ID AS product_id,
        p.post_type,
        p.post_parent,
        p.post_status,
        p.post_title,
        MAX(CASE WHEN pm.meta_key = '_regular_price' THEN pm.meta_value END) AS regular_price,
        MAX(CASE WHEN pm.meta_key = '_price' THEN pm.meta_value END) AS current_price,
        MAX(CASE WHEN pm.meta_key = '_sale_price' THEN pm.meta_value END) AS sale_price,
        MAX(CASE WHEN pm.meta_key = '_sale_price_dates_from' THEN pm.meta_value END) AS sale_from,
        MAX(CASE WHEN pm.meta_key = '_sale_price_dates_to' THEN pm.meta_value END) AS sale_to
    FROM {$wpdb->posts} p
    LEFT JOIN {$wpdb->postmeta} pm
        ON pm.post_id = p.ID
       AND pm.meta_key IN (
            '_regular_price',
            '_price',
            '_sale_price',
            '_sale_price_dates_from',
            '_sale_price_dates_to'
       )
    WHERE p.post_type IN ('product', 'product_variation')
    GROUP BY p.ID, p.post_type, p.post_parent, p.post_status, p.post_title
    HAVING
        (sale_price IS NOT NULL AND sale_price != '' AND sale_price != '0')
        OR (sale_from IS NOT NULL AND sale_from != '' AND sale_from != '0')
        OR (sale_to IS NOT NULL AND sale_to != '' AND sale_to != '0')
    ORDER BY p.ID
    ",
    ARRAY_A
);

$saleOnly = array_values(array_filter($rows, static function ($row) {
    $regular = trim((string) ($row['regular_price'] ?? ''));
    $sale = trim((string) ($row['sale_price'] ?? ''));

    return ($sale !== '' && $sale !== '0') && ($regular === '' || $regular === '0');
}));

if ($saleOnly) {
    echo "ABORT: Found products with sale_price but no regular_price.\n";
    foreach ($saleOnly as $row) {
        echo "{$row['product_id']}\t{$row['post_title']}\tregular={$row['regular_price']}\tsale={$row['sale_price']}\n";
    }
    exit(1);
}

$timestamp = date('Ymd-His');
$backupPath = "{$backupDir}/sale-price-backup-{$timestamp}.csv";
$handle = fopen($backupPath, 'w');

if (!$handle) {
    fwrite(STDERR, "Could not write backup: {$backupPath}\n");
    exit(1);
}

fputcsv($handle, [
    'product_id',
    'post_type',
    'post_parent',
    'post_status',
    'product_title',
    'regular_price',
    'current_price',
    'sale_price',
    'sale_from',
    'sale_to',
]);

foreach ($rows as $row) {
    fputcsv($handle, [
        $row['product_id'],
        $row['post_type'],
        $row['post_parent'],
        $row['post_status'],
        $row['post_title'],
        $row['regular_price'],
        $row['current_price'],
        $row['sale_price'],
        $row['sale_from'],
        $row['sale_to'],
    ]);
}

fclose($handle);

$productRows = array_filter($rows, static fn ($row) => $row['post_type'] === 'product');
$variationRows = array_filter($rows, static fn ($row) => $row['post_type'] === 'product_variation');

echo "Mode: " . ($apply ? 'APPLY' : 'DRY RUN') . "\n";
echo "Backup: {$backupPath}\n";
echo "Rows needing sale cleanup: " . count($rows) . "\n";
echo "Products: " . count($productRows) . "\n";
echo "Variations: " . count($variationRows) . "\n";

if (!$apply) {
    echo "No database changes made. Re-run with -- --apply to clear sale data.\n";
    exit(0);
}

$updated = 0;
$failed = [];
$parentIds = [];

foreach ($rows as $row) {
    $productId = (int) $row['product_id'];
    $product = wc_get_product($productId);

    if (!$product) {
        $failed[] = [$productId, 'wc_get_product returned false'];
        continue;
    }

    $product->set_sale_price('');
    $product->set_date_on_sale_from(null);
    $product->set_date_on_sale_to(null);

    $regular = trim((string) $product->get_regular_price('edit'));
    if ($regular !== '') {
        $product->set_price($regular);
    }

    try {
        $product->save();
        wc_delete_product_transients($productId);
        $updated++;

        if ($product->is_type('variation')) {
            $parentId = (int) $product->get_parent_id();
            if ($parentId > 0) {
                $parentIds[$parentId] = true;
            }
        } elseif ($product->is_type('variable')) {
            $parentIds[$productId] = true;
        }
    } catch (Throwable $error) {
        $failed[] = [$productId, $error->getMessage()];
    }
}

foreach (array_keys($parentIds) as $parentId) {
    WC_Product_Variable::sync((int) $parentId);
    wc_delete_product_transients((int) $parentId);
}

if (function_exists('wc_delete_shop_order_transients')) {
    wc_delete_shop_order_transients();
}

if (function_exists('wc_update_product_lookup_tables')) {
    wc_update_product_lookup_tables();
}

echo "Updated rows: {$updated}\n";
echo "Synced variable parents: " . count($parentIds) . "\n";

if ($failed) {
    echo "Failures: " . count($failed) . "\n";
    foreach ($failed as [$productId, $message]) {
        echo "{$productId}\t{$message}\n";
    }
    exit(1);
}

echo "Sale prices and sale dates cleared successfully.\n";
