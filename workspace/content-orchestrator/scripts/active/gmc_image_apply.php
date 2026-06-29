<?php
/**
 * Review-gated, resumable apply for GMC enhanced product images.
 * Creates new attachments and never deletes or overwrites original media.
 *
 * Dry run:
 *   wp --allow-root --path=/var/www/wordpress eval-file SCRIPT MANIFEST RESULT_DIR
 * Apply exact-source enhancements:
 *   wp --allow-root --path=/var/www/wordpress eval-file SCRIPT MANIFEST RESULT_DIR apply-exact-source
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run with wp eval-file.\n");
    exit(1);
}

$manifestPath = $args[0] ?? '';
$resultDir = $args[1] ?? '';
$apply = in_array('--apply-exact-source', $args, true) || in_array('apply-exact-source', $args, true);
if (!is_readable($manifestPath) || $resultDir === '') {
    fwrite(STDERR, "Manifest is unreadable or result directory is missing.\n");
    exit(1);
}
if (!is_dir($resultDir) && !mkdir($resultDir, 0755, true)) {
    fwrite(STDERR, "Cannot create result directory.\n");
    exit(1);
}

require_once ABSPATH . 'wp-admin/includes/image.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';

$rollbackPath = rtrim($resultDir, '/') . '/rollback.json';
$resultsPath = rtrim($resultDir, '/') . '/results.csv';
$rollback = is_readable($rollbackPath) ? (json_decode(file_get_contents($rollbackPath), true) ?: []) : [];
$completed = [];
foreach ($rollback as $entry) {
    if (!empty($entry['product_id'])) {
        $completed[(int)$entry['product_id']] = true;
    }
}

$in = fopen($manifestPath, 'rb');
$header = fgetcsv($in);
$columns = array_flip($header ?: []);
$resultExists = is_file($resultsPath) && filesize($resultsPath) > 0;
$out = fopen($resultsPath, 'ab');
if (!$resultExists) {
    fputcsv($out, ['product_id', 'title', 'old_attachment_id', 'new_attachment_id', 'status', 'message']);
}

$counts = ['ready' => 0, 'applied' => 0, 'skipped' => 0, 'failed' => 0];
while (($row = fgetcsv($in)) !== false) {
    $productId = (int)($row[$columns['woo_id'] ?? -1] ?? 0);
    $title = (string)($row[$columns['title'] ?? -1] ?? '');
    $oldAttachmentId = (int)($row[$columns['attachment_id'] ?? -1] ?? 0);
    $sourcePath = (string)($row[$columns['source_path'] ?? -1] ?? '');
    $expectedSourceHash = (string)($row[$columns['source_sha256'] ?? -1] ?? '');
    $candidatePath = (string)($row[$columns['candidate_path'] ?? -1] ?? '');
    if ($candidatePath !== '' && $candidatePath[0] !== '/') {
        $candidatePath = '/root/emart-platform/' . ltrim($candidatePath, '/');
    }

    if (isset($completed[$productId])) {
        $counts['skipped']++;
        continue;
    }

    $error = '';
    $product = $productId ? get_post($productId) : null;
    $currentAttachmentId = $productId ? (int)get_post_thumbnail_id($productId) : 0;
    if (!$product || $product->post_type !== 'product') {
        $error = 'product_missing_or_not_product';
    } elseif ($currentAttachmentId !== $oldAttachmentId) {
        $error = 'featured_image_changed_since_audit';
    } elseif (!is_file($sourcePath) || hash_file('sha256', $sourcePath) !== $expectedSourceHash) {
        $error = 'source_changed_since_audit';
    } elseif (!is_file($candidatePath)) {
        $error = 'candidate_missing';
    } else {
        $info = @getimagesize($candidatePath);
        if (!$info || min((int)$info[0], (int)$info[1]) < 800 || ($info['mime'] ?? '') !== 'image/jpeg') {
            $error = 'candidate_validation_failed';
        }
    }

    if ($error !== '') {
        $counts['failed']++;
        fputcsv($out, [$productId, $title, $oldAttachmentId, '', 'failed', $error]);
        fflush($out);
        continue;
    }

    $counts['ready']++;
    if (!$apply) {
        continue;
    }

    $slug = sanitize_title($product->post_name ?: $title);
    $filename = sanitize_file_name($slug . '-gmc-enhanced-' . $productId . '.jpg');
    $upload = wp_upload_bits($filename, null, file_get_contents($candidatePath));
    if (!empty($upload['error'])) {
        $counts['failed']++;
        fputcsv($out, [$productId, $title, $oldAttachmentId, '', 'failed', $upload['error']]);
        fflush($out);
        continue;
    }

    $newAttachmentId = wp_insert_attachment([
        'post_mime_type' => 'image/jpeg',
        'post_title' => $title,
        'post_content' => '',
        'post_excerpt' => '',
        'post_status' => 'inherit',
        'post_parent' => $productId,
    ], $upload['file'], $productId, true);

    if (is_wp_error($newAttachmentId)) {
        @unlink($upload['file']);
        $counts['failed']++;
        fputcsv($out, [$productId, $title, $oldAttachmentId, '', 'failed', $newAttachmentId->get_error_message()]);
        fflush($out);
        continue;
    }

    $metadata = wp_generate_attachment_metadata($newAttachmentId, $upload['file']);
    wp_update_attachment_metadata($newAttachmentId, $metadata);
    update_post_meta($newAttachmentId, '_wp_attachment_image_alt', $title);
    update_post_meta($newAttachmentId, '_emart_gmc_enhanced_from_attachment', $oldAttachmentId);
    update_post_meta($newAttachmentId, '_emart_gmc_source_sha256', $expectedSourceHash);
    set_post_thumbnail($productId, $newAttachmentId);

    $entry = [
        'product_id' => $productId,
        'title' => $title,
        'old_attachment_id' => $oldAttachmentId,
        'new_attachment_id' => (int)$newAttachmentId,
        'new_file' => $upload['file'],
        'applied_at' => gmdate('c'),
    ];
    $rollback[] = $entry;
    file_put_contents($rollbackPath, wp_json_encode($rollback, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    fputcsv($out, [$productId, $title, $oldAttachmentId, $newAttachmentId, 'applied', 'exact_source_enhancement']);
    fflush($out);
    $completed[$productId] = true;
    $counts['applied']++;
}

fclose($in);
fclose($out);
foreach ($counts as $name => $count) {
    echo "{$name}={$count}\n";
}
echo 'mode=' . ($apply ? 'apply' : 'dry-run') . "\n";
echo "results={$resultsPath}\nrollback={$rollbackPath}\n";
