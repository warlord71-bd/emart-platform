<?php
/**
 * Read-only audit for GMC products flagged with undersized images.
 *
 * Usage:
 *   wp --path=/var/www/wordpress eval-file \
 *     workspace/scripts/active/gmc_small_image_audit.php \
 *     workspace/audit/active/gmc-small-images-20260623.csv \
 *     workspace/audit/active/gmc-small-images-source-audit.csv
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run with wp eval-file.\n");
    exit(1);
}

$input = $args[0] ?? '';
$output = $args[1] ?? '';
if ($input === '' || $output === '' || !is_readable($input)) {
    fwrite(STDERR, "Input CSV is not readable or output path is missing.\n");
    exit(1);
}

$in = fopen($input, 'rb');
$out = fopen($output, 'wb');
if (!$in || !$out) {
    fwrite(STDERR, "Unable to open input/output.\n");
    exit(1);
}

$header = fgetcsv($in);
$columns = array_flip($header ?: []);
fputcsv($out, [
    'woo_id', 'title', 'product_status', 'attachment_id', 'image_url',
    'source_path', 'source_exists', 'bytes', 'width', 'height', 'mime',
    'min_edge', 'max_edge', 'classification',
]);

$counts = [];
$rows = 0;
while (($row = fgetcsv($in)) !== false) {
    $productId = (int)($row[$columns['woo_id'] ?? -1] ?? 0);
    $csvTitle = trim((string)($row[$columns['title'] ?? -1] ?? ''));
    $product = $productId ? get_post($productId) : null;
    $attachmentId = $productId ? (int)get_post_thumbnail_id($productId) : 0;
    $path = $attachmentId ? (string)get_attached_file($attachmentId, true) : '';
    $url = $attachmentId ? (string)wp_get_attachment_url($attachmentId) : '';
    $exists = $path !== '' && is_file($path);
    $info = $exists ? @getimagesize($path) : false;
    $width = $info ? (int)$info[0] : 0;
    $height = $info ? (int)$info[1] : 0;
    $mime = $info['mime'] ?? ($attachmentId ? (string)get_post_mime_type($attachmentId) : '');

    if (!$product) {
        $classification = 'missing_product';
    } elseif ($attachmentId === 0) {
        $classification = 'missing_attachment';
    } elseif (!$exists) {
        $classification = 'missing_source_file';
    } elseif (!$info || $width < 1 || $height < 1) {
        $classification = 'unreadable_image';
    } elseif (min($width, $height) >= 800) {
        $classification = 'already_adequate';
    } elseif (min($width, $height) >= 250) {
        $classification = 'upscale_good_source';
    } elseif (min($width, $height) >= 100) {
        $classification = 'upscale_weak_source';
    } else {
        $classification = 'replace_source';
    }

    $counts[$classification] = ($counts[$classification] ?? 0) + 1;
    $rows++;
    fputcsv($out, [
        $productId,
        $product ? $product->post_title : $csvTitle,
        $product ? $product->post_status : '',
        $attachmentId,
        $url,
        $path,
        $exists ? 'yes' : 'no',
        $exists ? (int)filesize($path) : 0,
        $width,
        $height,
        $mime,
        $width && $height ? min($width, $height) : 0,
        max($width, $height),
        $classification,
    ]);
}

fclose($in);
fclose($out);
ksort($counts);
echo "rows={$rows}\n";
foreach ($counts as $name => $count) {
    echo "{$name}={$count}\n";
}
echo "output={$output}\n";
