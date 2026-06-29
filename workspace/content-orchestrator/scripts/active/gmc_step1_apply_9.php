<?php
/**
 * Apply GMC Step 1 copy-only proposals for the reviewed 9-product allowlist.
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
$jsonlPath = $root . '/workspace/audit/active/gmc-policy-copy-proposals-2026-06-05.jsonl';
$dryRunPath = $root . '/workspace/audit/active/gmc-step1-apply-9-dryrun-20260605.csv';
$backupPath = $root . '/workspace/audit/active/gmc-step1-apply-9-backup-20260605.jsonl';
$applyLogPath = $root . '/workspace/audit/active/gmc-step1-apply-9-log-20260605.csv';

$allowIds = [59769, 51496, 26366, 3185, 51898, 63287, 58027, 61998, 60687];
$allow = array_fill_keys($allowIds, true);

foreach ([$jsonlPath, $dryRunPath] as $path) {
    if (!file_exists($path)) {
        fwrite(STDERR, "Missing required file: {$path}\n");
        exit(1);
    }
}

function short_hash(string $value): string {
    return substr(hash('sha256', $value), 0, 16);
}

$dryRows = [];
$fh = fopen($dryRunPath, 'r');
$headers = fgetcsv($fh);
while (($row = fgetcsv($fh)) !== false) {
    $assoc = array_combine($headers, $row);
    $dryRows[(int) $assoc['wc_id']] = $assoc;
}
fclose($fh);

$proposals = [];
$fh = fopen($jsonlPath, 'r');
while (($line = fgets($fh)) !== false) {
    $item = json_decode($line, true);
    if (!is_array($item)) {
        continue;
    }
    $id = (int) ($item['wc_id'] ?? 0);
    if (!isset($allow[$id])) {
        continue;
    }
    if (($item['action'] ?? '') !== 'copy_dry_run_ready_for_review') {
        fwrite(STDERR, "ID {$id} has unexpected action: " . ($item['action'] ?? '') . "\n");
        exit(1);
    }
    $proposals[$id] = $item;
}
fclose($fh);

$missing = array_values(array_diff($allowIds, array_keys($proposals)));
if ($missing) {
    fwrite(STDERR, "Missing proposals for IDs: " . implode(',', $missing) . "\n");
    exit(1);
}

$backup = fopen($backupPath, 'a');
$log = fopen($applyLogPath, 'w');
fputcsv($log, ['wc_id', 'title', 'before_hash', 'after_hash', 'status', 'note']);

$applied = 0;
$skipped = 0;

foreach ($allowIds as $id) {
    $proposal = $proposals[$id];
    $post = get_post($id);
    if (!$post || $post->post_type !== 'product') {
        fputcsv($log, [$id, $proposal['title'] ?? '', '', '', 'skipped', 'post missing or not product']);
        $skipped++;
        continue;
    }

    $current = (string) $post->post_content;
    $proposed = (string) ($proposal['proposed_content'] ?? '');
    $currentHash = short_hash($current);
    $proposalCurrentHash = short_hash((string) ($proposal['current_content'] ?? ''));
    $dry = $dryRows[$id] ?? null;

    if (!$dry || ($dry['before_hash'] ?? '') !== $proposalCurrentHash) {
        fputcsv($log, [$id, $post->post_title, $currentHash, short_hash($proposed), 'skipped', 'dry-run hash mismatch']);
        $skipped++;
        continue;
    }
    if ($currentHash !== $proposalCurrentHash) {
        fputcsv($log, [$id, $post->post_title, $currentHash, short_hash($proposed), 'skipped', 'live content changed since dry-run']);
        $skipped++;
        continue;
    }
    if ($current === $proposed || $proposed === '') {
        fputcsv($log, [$id, $post->post_title, $currentHash, short_hash($proposed), 'skipped', 'empty or unchanged proposal']);
        $skipped++;
        continue;
    }

    fwrite($backup, json_encode([
        'wc_id' => $id,
        'title' => $post->post_title,
        'old_post_content' => $current,
        'old_hash' => $currentHash,
        'new_hash' => short_hash($proposed),
        'backup_created_at' => gmdate('c'),
    ], JSON_UNESCAPED_UNICODE) . "\n");

    $result = wp_update_post([
        'ID' => $id,
        'post_content' => $proposed,
    ], true);

    if (is_wp_error($result)) {
        fputcsv($log, [$id, $post->post_title, $currentHash, short_hash($proposed), 'failed', $result->get_error_message()]);
        $skipped++;
        continue;
    }

    clean_post_cache($id);
    fputcsv($log, [$id, $post->post_title, $currentHash, short_hash($proposed), 'applied', 'post_content only']);
    $applied++;
}

fclose($backup);
fclose($log);

echo "Applied: {$applied}\n";
echo "Skipped: {$skipped}\n";
echo "Backup: {$backupPath}\n";
echo "Log: {$applyLogPath}\n";

exit($skipped === 0 ? 0 : 2);
