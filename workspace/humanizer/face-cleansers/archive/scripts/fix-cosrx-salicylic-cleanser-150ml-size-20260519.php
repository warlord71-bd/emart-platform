<?php
$product_id = 93160;

$attrs = get_post_meta($product_id, '_product_attributes', true);
if (!is_array($attrs)) {
    $attrs = array();
}

if (isset($attrs['volume']) && is_array($attrs['volume'])) {
    $attrs['volume']['value'] = '150ml';
} else {
    $attrs['volume'] = array(
        'name' => 'Volume',
        'value' => '150ml',
        'position' => 4,
        'is_visible' => 1,
        'is_variation' => 0,
        'is_taxonomy' => 0,
    );
}

update_post_meta($product_id, '_product_attributes', $attrs);

$content = get_post_field('post_content', $product_id);
$content = str_replace(
    'Plus, the compact 50ml size is travel-friendly, so you can maintain your skincare routine even on the go.',
    'Plus, the 150ml bottle gives you a practical daily-use size for maintaining your skincare routine at home.',
    $content
);
wp_update_post(array(
    'ID' => $product_id,
    'post_content' => $content,
));

$meta_updates = array(
    '_rank_math_title' => 'CosRx Salicylic Acid Cleanser 150ml | Bangladesh',
    '_rank_math_description' => 'Buy CosRx Salicylic Acid Daily Gentle Cleanser 150ml for ৳950 in Bangladesh. Gentle yet effective facewash for clear skin. Shop now!',
    '_rank_math_focus_keyword' => 'COSRX Salicylic Acid Daily Gentle Cleanser 150ml',
    'rank_math_description' => 'Buy COSRX Salicylic Acid Daily Gentle Cleanser 150ml in Bangladesh from Emart. Best price, authentic product & fast delivery nationwide. Order now!',
    '_structured_description' => 'CosRx product. Origin:Korea. Price:BDT 950. 100% authentic. Emart Skincare Bangladesh.',
);

foreach ($meta_updates as $key => $value) {
    update_post_meta($product_id, $key, $value);
}

$faq = get_post_meta($product_id, '_emart_product_faq', true);
if (is_string($faq) && $faq !== '') {
    update_post_meta($product_id, '_emart_product_faq', str_replace('50ml', '150ml', $faq));
}

if (function_exists('wc_delete_product_transients')) {
    wc_delete_product_transients($product_id);
}
clean_post_cache($product_id);

echo "Updated product {$product_id} size and stale 50ml references.\n";
