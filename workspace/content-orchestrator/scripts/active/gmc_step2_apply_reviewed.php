<?php
/**
 * Apply reviewed GMC Step 2 LLM proposals.
 *
 * Mutates only wp_posts.post_content through wp_update_post().
 * No title, slug, price, image, taxonomy, meta, or GMC sync changes.
 */

declare(strict_types=1);

$wpLoad = '/var/www/wordpress/wp-load.php';
if (!file_exists($wpLoad)) {
    fwrite(STDERR, "Missing wp-load.php at {$wpLoad}\n");
    exit(1);
}
require_once $wpLoad;

$root = getcwd();
$jsonlPath = $root . '/workspace/audit/active/gmc-step2-llm-rewrite-proposals-2026-06-05.jsonl';
$backupPath = $root . '/workspace/audit/active/gmc-step2-apply-backup-20260605.jsonl';
$applyLogPath = $root . '/workspace/audit/active/gmc-step2-apply-log-20260605.csv';

if (!file_exists($jsonlPath)) {
    fwrite(STDERR, "Missing proposals JSONL: {$jsonlPath}\n");
    exit(1);
}

function short_hash(string $value): string {
    return substr(hash('sha256', $value), 0, 16);
}

$proposals = [];
$fh = fopen($jsonlPath, 'r');
while (($line = fgets($fh)) !== false) {
    $line = trim($line);
    if ($line === '') {
        continue;
    }
    $item = json_decode($line, true);
    if (!is_array($item)) {
        fwrite(STDERR, "Invalid JSONL row\n");
        exit(1);
    }
    $id = (int) ($item['wc_id'] ?? 0);
    if ($id <= 0) {
        fwrite(STDERR, "Missing wc_id in JSONL row\n");
        exit(1);
    }
    if (isset($proposals[$id])) {
        fwrite(STDERR, "Duplicate proposal for ID {$id}\n");
        exit(1);
    }
    $proposals[$id] = $item;
}
fclose($fh);

if (count($proposals) !== 44) {
    fwrite(STDERR, "Expected 44 Step 2 proposals, found " . count($proposals) . "\n");
    exit(1);
}

$backup = fopen($backupPath, 'a');
$log = fopen($applyLogPath, 'w');
fputcsv($log, ['wc_id', 'title', 'status', 'before_hash', 'after_hash', 'apply_status', 'note']);

$applied = 0;
$skipped = 0;
$batchSize = 10;
$batchNo = 1;
$inBatch = 0;

foreach ($proposals as $id => $proposal) {
    if ($inBatch === 0) {
        echo "Batch {$batchNo}\n";
    }

    $post = get_post($id);
    $title = (string) ($proposal['title'] ?? '');
    $status = (string) ($proposal['status'] ?? '');

    if (!$post || $post->post_type !== 'product') {
        fputcsv($log, [$id, $title, $status, '', '', 'skipped', 'post missing or not product']);
        $skipped++;
        $inBatch++;
        continue;
    }

    $current = (string) $post->post_content;
    $proposed = (string) ($proposal['proposed_content'] ?? '');
    $currentHash = short_hash($current);
    $expectedHash = (string) ($proposal['original_hash'] ?? '');
    $proposedHash = short_hash($proposed);

    if ($expectedHash === '' || $currentHash !== $expectedHash) {
        fputcsv($log, [$id, $post->post_title, $status, $currentHash, $proposedHash, 'skipped', 'live content changed since dry-run']);
        $skipped++;
        $inBatch++;
        continue;
    }
    if ($proposed === '' || $proposedHash !== (string) ($proposal['proposed_hash'] ?? '')) {
        fputcsv($log, [$id, $post->post_title, $status, $currentHash, $proposedHash, 'skipped', 'empty or proposal hash mismatch']);
        $skipped++;
        $inBatch++;
        continue;
    }
    if ((string) ($proposal['violations_after'] ?? '') !== '') {
        fputcsv($log, [$id, $post->post_title, $status, $currentHash, $proposedHash, 'skipped', 'validator risk terms remain']);
        $skipped++;
        $inBatch++;
        continue;
    }

    fwrite($backup, json_encode([
        'wc_id' => $id,
        'title' => $post->post_title,
        'old_post_content' => $current,
        'old_hash' => $currentHash,
        'new_hash' => $proposedHash,
        'step2_status' => $status,
        'backup_created_at' => gmdate('c'),
    ], JSON_UNESCAPED_UNICODE) . "\n");

    $result = wp_update_post([
        'ID' => $id,
        'post_content' => $proposed,
    ], true);

    if (is_wp_error($result)) {
        fputcsv($log, [$id, $post->post_title, $status, $currentHash, $proposedHash, 'failed', $result->get_error_message()]);
        $skipped++;
    } else {
        clean_post_cache($id);
        fputcsv($log, [$id, $post->post_title, $status, $currentHash, $proposedHash, 'applied', 'post_content only']);
        $applied++;
    }

    $inBatch++;
    if ($inBatch >= $batchSize) {
        echo "  Applied so far: {$applied}; skipped: {$skipped}\n";
        $batchNo++;
        $inBatch = 0;
        usleep(500000);
    }
}

fclose($backup);
fclose($log);

echo "Applied: {$applied}\n";
echo "Skipped: {$skipped}\n";
echo "Backup: {$backupPath}\n";
echo "Log: {$applyLogPath}\n";

exit($skipped === 0 ? 0 : 2);
