<?php
/**
 * Apply pa_ingredient and pa_skin_type from dry-run CSV.
 * Skips pa_concern — already applied to 2,236 products live.
 * Only sets pa_ingredient / pa_skin_type where currently missing.
 *
 * Default: dry-run (no writes).
 * Apply:   APPLY=1 wp --path=/var/www/wordpress --allow-root eval-file <script>
 *
 * Input CSV: most recent pa-concern-skintype-dry-run-*.csv in workspace/audit/active/
 */

if (!defined('ABSPATH')) { fwrite(STDERR, "Run with WP-CLI eval-file.\n"); exit(1); }

$apply    = getenv('APPLY') === '1';
$mode     = $apply ? 'apply' : 'dry-run';
$active   = '/root/emart-platform/workspace/audit/active';

// Auto-find latest dry-run CSV
$csvs = glob("$active/pa-concern-skintype-dry-run-*.csv");
if (empty($csvs)) {
    fwrite(STDERR, "No pa-concern-skintype dry-run CSV found in $active\n"); exit(1);
}
rsort($csvs);
$csv_path = $csvs[0];
fwrite(STDERR, "Input CSV: $csv_path\n");

$stamp       = gmdate('Ymd-His');
$report_path = "$active/pa-ingredient-skintype-$mode-$stamp.csv";
$backup_path = "/root/emart-platform/workspace/audit/archive/pa-ingredient-skintype-backup-$stamp.csv";

// ──────────────────────────────────────────────────────────────────────────────
// Ensure WooCommerce product attributes exist and are registered as taxonomies
// ──────────────────────────────────────────────────────────────────────────────

function emart_ensure_wc_attribute(string $name, string $label, string $type = 'select'): void {
    $existing = wc_get_attribute_taxonomies();
    foreach ($existing as $attr) {
        if ($attr->attribute_name === $name) return; // already exists
    }
    $result = wc_create_attribute([
        'name'         => $label,
        'slug'         => $name,
        'type'         => $type,
        'order_by'     => 'menu_order',
        'has_archives' => false,
    ]);
    if (is_wp_error($result)) {
        fwrite(STDERR, "Failed to create WC attribute '$name': " . $result->get_error_message() . "\n");
    } else {
        // Re-register taxonomies so the new one is available in this request
        WC_Post_Types::register_taxonomies();
    }
}

if ($apply) {
    emart_ensure_wc_attribute('ingredient', 'Ingredient');
    emart_ensure_wc_attribute('skin_type',  'Skin Type');
    // Clear cached attribute list so WC picks up the new attributes
    delete_transient('wc_attribute_taxonomies');
    wp_cache_delete('woocommerce_attribute_taxonomies', 'woocommerce');
    // Re-register taxonomies in this request so wp_set_object_terms works immediately
    foreach (['pa_ingredient', 'pa_skin_type'] as $tax) {
        if (!taxonomy_exists($tax)) {
            register_taxonomy($tax, 'product', [
                'label'        => ucwords(str_replace('pa_', '', str_replace('_', ' ', $tax))),
                'public'       => false,
                'rewrite'      => false,
                'hierarchical' => false,
                'show_ui'      => false,
            ]);
        }
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function emart_get_or_create_term(string $slug, string $name, string $taxonomy): int {
    $t = get_term_by('slug', $slug, $taxonomy);
    if ($t && !is_wp_error($t)) return (int) $t->term_id;
    $r = wp_insert_term($name, $taxonomy, ['slug' => $slug]);
    if (is_wp_error($r)) {
        fwrite(STDERR, "Failed to create term '$slug' in '$taxonomy': " . $r->get_error_message() . "\n");
        return 0;
    }
    return (int) $r['term_id'];
}

function emart_has_terms(int $post_id, string $taxonomy): bool {
    if (!taxonomy_exists($taxonomy)) return false;
    $terms = wp_get_object_terms($post_id, $taxonomy, ['fields' => 'ids']);
    return !is_wp_error($terms) && !empty($terms);
}

// ──────────────────────────────────────────────────────────────────────────────
// Read CSV
// ──────────────────────────────────────────────────────────────────────────────

$rows = [];
if (($fh = fopen($csv_path, 'r')) !== false) {
    $headers = fgetcsv($fh);
    while (($row = fgetcsv($fh)) !== false) {
        $rows[] = array_combine($headers, $row);
    }
    fclose($fh);
}
fwrite(STDERR, "CSV rows: " . count($rows) . "\n");

// ──────────────────────────────────────────────────────────────────────────────
// Report + backup headers
// ──────────────────────────────────────────────────────────────────────────────

$rfh = fopen($report_path, 'w');
$bfh = fopen($backup_path, 'w');
fputcsv($rfh, ['action', 'post_id', 'slug', 'field', 'before', 'after']);
fputcsv($bfh, ['post_id', 'slug', 'field', 'before_terms']);

$counts = [
    'mode'               => $mode,
    'scanned'            => 0,
    'ingredient_set'     => 0,
    'ingredient_skipped' => 0,
    'skin_type_set'      => 0,
    'skin_type_skipped'  => 0,
    'products_changed'   => 0,
];

$changed_ids = [];

// ──────────────────────────────────────────────────────────────────────────────
// Main loop
// ──────────────────────────────────────────────────────────────────────────────

foreach ($rows as $row) {
    $post_id    = (int) ($row['product_id'] ?? 0);
    $slug       = $row['product_slug'] ?? '';
    $name       = $row['product_name'] ?? '';
    $ing_str    = trim($row['proposed_ingredients'] ?? '');
    $skin_type  = trim($row['proposed_skin_type']   ?? '');

    if (!$post_id) continue;
    $counts['scanned']++;

    $product_changed = false;

    // ── pa_ingredient ─────────────────────────────────────────────────────────
    if ($ing_str !== '') {
        $slugs = array_filter(array_map('trim', explode('|', $ing_str)));
        if (!empty($slugs)) {
            if (emart_has_terms($post_id, 'pa_ingredient')) {
                $counts['ingredient_skipped']++;
            } else {
                $t = wp_get_object_terms($post_id, 'pa_ingredient', ['fields' => 'names']); $current = (!is_wp_error($t) && is_array($t)) ? implode(',', $t) : '';
                fputcsv($bfh, [$post_id, $slug, 'pa_ingredient', $current]);
                fputcsv($rfh, [$apply ? 'set' : 'planned_set', $post_id, $slug, 'pa_ingredient', $current, implode('|', $slugs)]);

                if ($apply) {
                    $term_ids = [];
                    foreach ($slugs as $s) {
                        $label = ucwords(str_replace('-', ' ', $s));
                        $tid   = emart_get_or_create_term($s, $label, 'pa_ingredient');
                        if ($tid) $term_ids[] = $tid;
                    }
                    if (!empty($term_ids)) {
                        wp_set_object_terms($post_id, $term_ids, 'pa_ingredient', false);
                    }
                }
                $counts['ingredient_set']++;
                $product_changed = true;
            }
        }
    }

    // ── pa_skin_type ──────────────────────────────────────────────────────────
    if ($skin_type !== '') {
        if (emart_has_terms($post_id, 'pa_skin_type')) {
            $counts['skin_type_skipped']++;
        } else {
            $t = wp_get_object_terms($post_id, 'pa_skin_type', ['fields' => 'names']); $current = (!is_wp_error($t) && is_array($t)) ? implode(',', $t) : '';
            fputcsv($bfh, [$post_id, $slug, 'pa_skin_type', $current]);
            fputcsv($rfh, [$apply ? 'set' : 'planned_set', $post_id, $slug, 'pa_skin_type', $current, $skin_type]);

            if ($apply) {
                $label = ucwords(str_replace('-', ' ', $skin_type));
                $tid   = emart_get_or_create_term($skin_type, $label, 'pa_skin_type');
                if ($tid) wp_set_object_terms($post_id, [$tid], 'pa_skin_type', false);
            }
            $counts['skin_type_set']++;
            $product_changed = true;
        }
    }

    if ($product_changed) {
        $changed_ids[] = $post_id;
        $counts['products_changed']++;
    }
}

fclose($rfh);
fclose($bfh);

foreach ($counts as $k => $v) echo "$k=$v\n";
echo "report=$report_path\n";
echo "backup=$backup_path\n";
if (!$apply) echo "\n--- DRY RUN. Set APPLY=1 to apply. ---\n";
else         echo "\n--- APPLY COMPLETE. ---\n";
