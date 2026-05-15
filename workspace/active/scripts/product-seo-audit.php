<?php
/**
 * Read-only product SEO audit for Emart.
 *
 * Run with:
 * wp --path=/var/www/wordpress --allow-root eval-file /root/emart-platform/workspace/scripts/active/product-seo-audit.php
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run this through wp eval-file.\n");
    exit(1);
}

$out_dir = '/root/emart-platform/workspace/audit/active';
if (!is_dir($out_dir)) {
    mkdir($out_dir, 0755, true);
}

$stamp = gmdate('Ymd-His');
$csv_path = "$out_dir/product-seo-audit-$stamp.csv";
$summary_path = "$out_dir/product-seo-audit-summary-$stamp.txt";

$ids = get_posts([
    'post_type' => 'product',
    'post_status' => 'publish',
    'posts_per_page' => -1,
    'fields' => 'ids',
    'orderby' => 'ID',
    'order' => 'ASC',
]);

function emart_plain_text($value) {
    return trim(preg_replace('/\s+/', ' ', wp_strip_all_tags((string) $value)));
}

function emart_meta_value($id, $key) {
    return trim((string) get_post_meta($id, $key, true));
}

function emart_terms($id, $taxonomies) {
    $names = [];
    foreach ($taxonomies as $taxonomy) {
        $terms = get_the_terms($id, $taxonomy);
        if (is_wp_error($terms) || empty($terms)) {
            continue;
        }
        foreach ($terms as $term) {
            $names[] = $term->name;
        }
    }
    return array_values(array_unique(array_filter($names)));
}

function emart_is_weak_meta($text, $title) {
    $normalized = strtolower(trim((string) $text));
    if (strlen($normalized) < 90) {
        return true;
    }
    if (preg_match('/^(buy online|shop online|best price|premium skincare product)$/i', $normalized)) {
        return true;
    }
    $title_words = preg_split('/\s+/', strtolower(emart_plain_text($title)));
    $anchor = implode(' ', array_slice(array_filter($title_words), 0, 2));
    return $anchor && strpos($normalized, $anchor) === false;
}

$descriptions_seen = [];
$rows = [];
$summary = [
    'total' => count($ids),
    'missing_emart_meta' => 0,
    'missing_rank_math_meta' => 0,
    'missing_both_meta' => 0,
    'weak_meta' => 0,
    'duplicate_meta' => 0,
    'missing_sku' => 0,
    'invalid_sku' => 0,
    'missing_brand' => 0,
    'missing_category' => 0,
    'missing_image' => 0,
    'missing_price' => 0,
    'missing_stock' => 0,
    'thin_visible_description' => 0,
    'merchant_schema_not_ready' => 0,
    'low_score_under_80' => 0,
];

foreach ($ids as $id) {
    $post = get_post($id);
    $title = emart_plain_text($post->post_title);
    $slug = $post->post_name;
    $sku = emart_meta_value($id, '_sku');
    $price = emart_meta_value($id, '_price');
    $regular_price = emart_meta_value($id, '_regular_price');
    $stock = emart_meta_value($id, '_stock_status');
    $emart_meta = emart_meta_value($id, '_emart_meta_description');
    $rank_math_meta = emart_meta_value($id, '_rank_math_description');
    $chosen_meta = $emart_meta !== '' ? $emart_meta : $rank_math_meta;
    $visible_text = emart_plain_text($post->post_excerpt . ' ' . $post->post_content);
    $categories = emart_terms($id, ['product_cat']);
    $brands = emart_terms($id, ['product_brand', 'pa_brand']);
    $has_image = (bool) get_post_thumbnail_id($id);

    $issues = [];
    $score = 100;

    if ($emart_meta === '') {
        $summary['missing_emart_meta']++;
        $issues[] = 'missing_emart_meta';
        $score -= 4;
    }
    if ($rank_math_meta === '') {
        $summary['missing_rank_math_meta']++;
        $issues[] = 'missing_rank_math_meta';
        $score -= 4;
    }
    if ($emart_meta === '' && $rank_math_meta === '') {
        $summary['missing_both_meta']++;
        $issues[] = 'missing_both_meta';
        $score -= 10;
    }
    if ($chosen_meta !== '' && emart_is_weak_meta($chosen_meta, $title)) {
        $summary['weak_meta']++;
        $issues[] = 'weak_meta';
        $score -= 8;
    }
    if ($chosen_meta !== '') {
        $meta_key = strtolower($chosen_meta);
        $descriptions_seen[$meta_key] = ($descriptions_seen[$meta_key] ?? 0) + 1;
    }
    if ($sku === '') {
        $summary['missing_sku']++;
        $issues[] = 'missing_sku';
        $score -= 4;
    } elseif (preg_match('/\s/', $sku)) {
        $summary['invalid_sku']++;
        $issues[] = 'invalid_sku_whitespace';
        $score -= 4;
    }
    if (empty($brands)) {
        $summary['missing_brand']++;
        $issues[] = 'missing_brand';
        $score -= 8;
    }
    if (empty($categories)) {
        $summary['missing_category']++;
        $issues[] = 'missing_category';
        $score -= 8;
    }
    if (!$has_image) {
        $summary['missing_image']++;
        $issues[] = 'missing_image';
        $score -= 10;
    }
    if (!is_numeric($price) || (float) $price <= 0) {
        $summary['missing_price']++;
        $issues[] = 'missing_price';
        $score -= 10;
    }
    if ($stock === '') {
        $summary['missing_stock']++;
        $issues[] = 'missing_stock';
        $score -= 8;
    }
    if (strlen($visible_text) < 120) {
        $summary['thin_visible_description']++;
        $issues[] = 'thin_visible_description';
        $score -= 8;
    }

    $merchant_ready = $title && $has_image && is_numeric($price) && (float) $price > 0 && $stock && !empty($categories) && !empty($brands);
    if (!$merchant_ready) {
        $summary['merchant_schema_not_ready']++;
        $issues[] = 'merchant_schema_not_ready';
    }

    $score = max(0, $score);
    if ($score < 80) {
        $summary['low_score_under_80']++;
    }

    $rows[] = [
        'id' => $id,
        'slug' => $slug,
        'score' => $score,
        'issues' => implode('|', array_unique($issues)),
        'canonical' => "https://e-mart.com.bd/shop/$slug",
        'has_emart_meta' => $emart_meta !== '' ? 'yes' : 'no',
        'has_rank_math_meta' => $rank_math_meta !== '' ? 'yes' : 'no',
        'chosen_meta_length' => strlen($chosen_meta),
        'sku' => $sku,
        'brand' => implode(', ', $brands),
        'category' => implode(', ', $categories),
        'has_image' => $has_image ? 'yes' : 'no',
        'price' => $price,
        'regular_price' => $regular_price,
        'stock_status' => $stock,
        'visible_text_length' => strlen($visible_text),
        'merchant_schema_ready' => $merchant_ready ? 'yes' : 'no',
        'lighthouse_note' => 'sample live templates: PDP/category/shop; per-product Lighthouse not run',
        'ai_search_note' => 'eligible when indexable, textual, internally linked, and structured data matches visible page',
        'title' => $title,
    ];
}

foreach ($rows as &$row) {
    $meta = $row['has_emart_meta'] === 'yes' ? emart_meta_value($row['id'], '_emart_meta_description') : emart_meta_value($row['id'], '_rank_math_description');
    if ($meta !== '' && ($descriptions_seen[strtolower($meta)] ?? 0) > 1) {
        $row['issues'] = trim($row['issues'] . '|duplicate_meta', '|');
        $row['score'] = max(0, (int) $row['score'] - 6);
        $summary['duplicate_meta']++;
    }
}
unset($row);

$fh = fopen($csv_path, 'w');
fputcsv($fh, array_keys($rows[0] ?? ['id' => '']));
foreach ($rows as $row) {
    fputcsv($fh, $row);
}
fclose($fh);

$summary_lines = [
    'Emart product SEO audit',
    'Generated: ' . gmdate('c'),
    'Basis: Google Search Essentials, helpful people-first content/E-E-A-T concepts, Product/Merchant structured data, AI Overviews basics, Lighthouse/Core Web Vitals sampling.',
    'CSV: ' . $csv_path,
    '',
];
foreach ($summary as $key => $value) {
    $summary_lines[] = $key . ': ' . $value;
}
$summary_lines[] = '';
$summary_lines[] = 'Scoring notes: live Google sees Next.js HTML; _emart_meta_description is preferred, _rank_math_description is compatibility fallback. No DB writes were made.';
$summary_lines[] = 'Lighthouse/Core Web Vitals are template-level checks; run live mobile samples for homepage, category, shop, and PDP after deploy.';

file_put_contents($summary_path, implode("\n", $summary_lines) . "\n");

echo "Wrote $csv_path\n";
echo "Wrote $summary_path\n";
