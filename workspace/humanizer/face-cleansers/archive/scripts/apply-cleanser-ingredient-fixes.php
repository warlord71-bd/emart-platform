<?php
/**
 * Fix placeholder ingredient tabs for cleanser sample products where a richer
 * raw INCI list was verified from source pages. Also updates the matching
 * Key Ingredients section in post_content so it no longer says INCI is missing.
 *
 * Dry-run:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/active/apply-cleanser-ingredient-fixes.php
 *
 * Apply:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/active/apply-cleanser-ingredient-fixes.php apply
 */

global $wpdb, $args;

$script_args = isset($args) && is_array($args) ? $args : array_slice($_SERVER['argv'], 1);
$apply = in_array('apply', $script_args, true) || in_array('--apply', $script_args, true);
$dry_run = !$apply;
$rollback_dir = '/root/emart-platform/workspace/audit/active';

$fixes = [
    93160 => [
        'slug' => 'cosrx-salicylic-acid-daily-gentle-cleanser-150ml',
        'title' => 'COSRX Salicylic Acid Daily Gentle Cleanser 150ml',
        'inci' => 'Water, Glycerin, Myristic Acid, Stearic Acid, Potassium Hydroxide, Lauric Acid, Butylene Glycol, Glycol Distearate, Polysorbate 80, Sodium Methyl Cocoyl Taurate, Salicylic Acid, Cocamidopropyl Betaine, PEG-60 Hydrogenated Castor Oil, Fragrance, Sodium Chloride, Melaleuca Alternifolia (Tea Tree) Leaf Oil, Caprylyl Glycol, Ethylhexylglycerin, Salix Alba (Willow) Bark Water, Saccharomyces Ferment, Cryptomeria Japonica Leaf Extract, Nelumbo Nucifera Leaf Extract, Pinus Palustris Leaf Extract, Ulmus Davidiana Root Extract, Oenothera Biennis (Evening Primrose) Flower Extract, Pueraria Lobata Root Extract, 1,2-Hexanediol, Ethyl Hexanediol, Citric Acid, Disodium EDTA',
        'key_ingredients_html' => '<h3>Key Ingredients</h3>
<p><strong>Salicylic Acid</strong> — A BHA used in oily and blemish-prone skincare because it helps skin feel clearer around congested pores.</p>
<p><strong>Cocamidopropyl Betaine</strong> — A mild cleansing support ingredient that helps the formula lather without relying only on stronger soap-like cleansing agents.</p>
<p><strong>Glycerin and Butylene Glycol</strong> — Humectants that help soften the rinse-off feel so skin does not feel unnecessarily rough after washing.</p>
<p><strong>Tea Tree Leaf Oil</strong> — A clarifying plant oil often used in routines for oily and breakout-prone skin.</p>
<p><strong>Willow Bark Water and Botanical Extracts</strong> — Plant-based support ingredients that fit the cleanser\'s pore-care positioning without turning it into a leave-on exfoliant.</p>
<p><strong>Saccharomyces Ferment</strong> — A fermented ingredient included as a skin-conditioning support in the formula.</p>',
    ],
    4149 => [
        'slug' => 'cosrx-advanced-snail-mucin-gel-cleanser-150ml',
        'title' => 'CosRx Advanced Snail Mucin Gel Cleanser 150ml',
        'inci' => 'Water, Acrylates Copolymer, Butylene Glycol, Glycerin, Disodium Laureth Sulfosuccinate, Sodium Cocoyl Isethionate, 1,2-Hexanediol, Coco-Glucoside, Lauryl Betaine, Snail Secretion Filtrate, Arginine, Tromethamine, Potassium Cocoyl Glycinate, Fragrance, Carbomer, Sodium Chloride, Ethylhexylglycerin, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Sodium Polyacrylate, Disodium EDTA',
        'key_ingredients_html' => '<h3>Key Ingredients</h3>
<p><strong>Snail Secretion Filtrate</strong> — The hero ingredient in this COSRX cleanser, chosen for a softer, more comfort-focused cleansing feel.</p>
<p><strong>Glycerin and Butylene Glycol</strong> — Humectants that help the gel cleanser feel smoother on skin while rinsing.</p>
<p><strong>Sodium Cocoyl Isethionate and Disodium Laureth Sulfosuccinate</strong> — Cleansing agents that help lift oil, sweat, and daily buildup.</p>
<p><strong>Coco-Glucoside and Lauryl Betaine</strong> — Mild surfactant support ingredients that help round out the cleanser\'s lather.</p>
<p><strong>Arginine</strong> — An amino acid used in skincare formulas for pH and skin-conditioning support.</p>',
    ],
];

function ingredient_fix_meta_rows($post_id, $meta_key) {
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

function ingredient_fix_upsert_unique_postmeta($post_id, $meta_key, $meta_value) {
    global $wpdb;
    $rows = ingredient_fix_meta_rows($post_id, $meta_key);
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

function ingredient_fix_replace_key_ingredients($content, $replacement) {
    $pattern = '/<h3>Key Ingredients<\/h3>.*?(?=<h3>Best For<\/h3>)/is';
    $new = preg_replace($pattern, $replacement . "\n", $content, 1, $count);
    return [$new, $count];
}

function ingredient_fix_build_inci_html($inci) {
    return '<div class="ingredients-tab"><h3>Full Ingredient List</h3><p class="inci-list">'
        . esc_html($inci)
        . '</p><p class="inci-source"><small>Source: product ingredient listing; verify with original packaging.</small></p></div>';
}

echo ($dry_run ? "DRY RUN" : "APPLY") . " — cleanser ingredient fixes\n";

$errors = [];
foreach ($fixes as $post_id => $fix) {
    $post = get_post($post_id);
    if (!$post) {
        $errors[] = "{$post_id}: missing product";
        continue;
    }
    if ($post->post_name !== $fix['slug']) {
        $errors[] = "{$post_id}: slug mismatch, expected {$fix['slug']}, got {$post->post_name}";
        continue;
    }
    [$new_content, $replace_count] = ingredient_fix_replace_key_ingredients(
        $post->post_content,
        $fix['key_ingredients_html']
    );
    if ($replace_count !== 1) {
        $errors[] = "{$post_id}: could not replace Key Ingredients block";
        continue;
    }
    if (strpos($fix['inci'], 'Water,') !== 0) {
        $errors[] = "{$post_id}: INCI does not look like a full list";
    }
    echo "- {$post_id} {$fix['title']}: PASS\n";
}

if ($errors) {
    foreach ($errors as $error) {
        echo "ERROR: {$error}\n";
    }
    exit(1);
}

if ($dry_run) {
    echo "No DB changes made. Re-run with positional argument 'apply' to write these ingredient fixes.\n";
    exit(0);
}

if (!is_dir($rollback_dir)) {
    mkdir($rollback_dir, 0755, true);
}

$rollback = [
    'captured_at' => gmdate('c'),
    'products' => [],
];

foreach ($fixes as $post_id => $fix) {
    $post = get_post($post_id);
    $rollback['products'][] = [
        'post_id' => $post_id,
        'slug' => $post->post_name,
        'old_post_content' => $post->post_content,
        'old_emart_ingredients_rows' => ingredient_fix_meta_rows($post_id, '_emart_ingredients'),
    ];
}

$rollback_path = $rollback_dir . '/cleanser-ingredient-fixes-rollback-' . gmdate('Ymd-His') . '.json';
file_put_contents($rollback_path, wp_json_encode($rollback, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

foreach ($fixes as $post_id => $fix) {
    $post = get_post($post_id);
    [$new_content] = ingredient_fix_replace_key_ingredients($post->post_content, $fix['key_ingredients_html']);
    $updated = wp_update_post([
        'ID' => $post_id,
        'post_content' => $new_content,
    ], true);
    if (is_wp_error($updated)) {
        fwrite(STDERR, "wp_update_post failed for {$post_id}: " . $updated->get_error_message() . "\n");
        exit(1);
    }
    ingredient_fix_upsert_unique_postmeta(
        $post_id,
        '_emart_ingredients',
        ingredient_fix_build_inci_html($fix['inci'])
    );
    clean_post_cache($post_id);
}

wp_cache_flush();
echo "Applied ingredient fixes: " . count($fixes) . "\n";
echo "Rollback: {$rollback_path}\n";

foreach (array_keys($fixes) as $post_id) {
    $rows = ingredient_fix_meta_rows($post_id, '_emart_ingredients');
    echo "- {$post_id}: _emart_ingredients rows=" . count($rows)
        . ", length=" . strlen($rows[0]['meta_value'] ?? '') . "\n";
}

