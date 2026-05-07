<?php
/**
 * WooCommerce Product Image Sync Script
 * Syncs images from filesystem with product database
 * Run: php /var/www/emart-platform/scripts/sync-product-images.php
 */

// Load WordPress
define('WP_USE_THEMES', false);
define('WP_CLI', true);
require('/var/www/wordpress/wp-load.php');

echo "=== WordPress Product Image Sync ===\n\n";

$upload_dir = wp_upload_dir();
$base_upload_path = $upload_dir['basedir'];

// Step 1: Find all unregistered image files
echo "Step 1: Scanning filesystem for images...\n";
$filesystem_images = array();
$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($base_upload_path),
    RecursiveIteratorIterator::SELF_FIRST
);

foreach ($iterator as $file) {
    if ($file->isFile() && preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $file->getFilename())) {
        $relative_path = str_replace($base_upload_path, '', $file->getPathname());
        $filesystem_images[md5($relative_path)] = array(
            'path'     => $relative_path,
            'file'     => $file->getPathname(),
            'filename' => $file->getFilename(),
        );
    }
}
echo "Found " . count($filesystem_images) . " image files on filesystem\n\n";

// Step 2: Check which images are registered in database
echo "Step 2: Checking database for registered attachments...\n";
$registered_images = array();
$attachments = new WP_Query(array(
    'post_type'      => 'attachment',
    'post_mime_type' => 'image',
    'posts_per_page' => -1,
    'post_status'    => 'inherit',
));

foreach ($attachments->posts as $attachment) {
    $meta = wp_get_attachment_metadata($attachment->ID);
    if ($meta && isset($meta['file'])) {
        $registered_images[md5('/' . $meta['file'])] = $attachment->ID;
    }
}
echo "Found " . count($registered_images) . " registered attachments\n\n";

// Step 3: Register unregistered images
echo "Step 3: Registering missing images...\n";
$registered_count = 0;
foreach ($filesystem_images as $hash => $image_data) {
    if (!isset($registered_images[$hash])) {
        $attachment_id = wp_insert_attachment(array(
            'post_mime_type' => mime_content_type($image_data['file']),
            'post_title'     => sanitize_file_name(pathinfo($image_data['filename'], PATHINFO_FILENAME)),
            'post_content'   => '',
            'post_status'    => 'inherit',
            'guid'           => $upload_dir['baseurl'] . $image_data['path'],
        ), $image_data['file']);

        if ($attachment_id && !is_wp_error($attachment_id)) {
            wp_update_attachment_metadata($attachment_id, wp_generate_attachment_metadata($attachment_id, $image_data['file']));
            $registered_count++;
            echo "  Registered: " . $image_data['filename'] . " (ID: $attachment_id)\n";
        }
    }
}
echo "Registered $registered_count new images\n\n";

// Step 4: Link images to products
echo "Step 4: Linking images to products...\n";
$products = wc_get_products(array('limit' => -1, 'return' => 'objects'));
$linked_count = 0;

foreach ($products as $product) {
    // Skip if product already has images
    if (!empty($product->get_image_id())) {
        continue;
    }

    // Try to find image by product name or SKU
    $search_terms = array(
        $product->get_name(),
        $product->get_sku(),
        $product->get_slug(),
    );

    foreach ($search_terms as $term) {
        if (empty($term)) continue;

        // Search in attachment titles and filenames
        $attachment = new WP_Query(array(
            'post_type'      => 'attachment',
            'post_mime_type' => 'image',
            'posts_per_page' => 1,
            's'              => $term,
            'post_status'    => 'inherit',
        ));

        if ($attachment->have_posts()) {
            $attachment_id = $attachment->posts[0]->ID;
            $product->set_image_id($attachment_id);
            $product->save();
            $linked_count++;
            echo "  Linked: {$product->get_name()} -> Image ID: $attachment_id\n";
            break;
        }
    }
}
echo "Linked $linked_count products with images\n\n";

// Step 5: Regenerate image metadata
echo "Step 5: Regenerating image metadata...\n";
$attachments = new WP_Query(array(
    'post_type'      => 'attachment',
    'post_mime_type' => 'image',
    'posts_per_page' => -1,
    'post_status'    => 'inherit',
));

foreach ($attachments->posts as $attachment) {
    $attachment_file = get_attached_file($attachment->ID);
    if (file_exists($attachment_file)) {
        wp_update_attachment_metadata($attachment->ID, wp_generate_attachment_metadata($attachment->ID, $attachment_file));
    }
}
echo "Regenerated metadata for " . count($attachments->posts) . " images\n\n";

// Step 6: Final summary
echo "=== Sync Complete ===\n";
$final_products = wc_get_products(array('limit' => -1, 'return' => 'objects'));
$with_images = 0;
foreach ($final_products as $product) {
    if (!empty($product->get_image_id())) {
        $with_images++;
    }
}
echo "Total Products: " . count($final_products) . "\n";
echo "Products with images: $with_images\n";
echo "Products without images: " . (count($final_products) - $with_images) . "\n\n";

echo "✓ Image sync complete!\n";
echo "Next steps:\n";
echo "1. Clear Next.js cache: rm -rf /var/www/emart-platform/apps/web/.next\n";
echo "2. Rebuild: cd /var/www/emart-platform/apps/web && npm run build\n";
echo "3. Restart: pm2 restart emart-web\n";
