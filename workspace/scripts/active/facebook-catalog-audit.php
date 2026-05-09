<?php

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run with: wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/active/facebook-catalog-audit.php\n");
    exit(1);
}

global $wpdb;

$timestamp = date('Ymd-His');
$root = '/root/emart-platform';
$outDir = $root . '/workspace/audit/active';
if (!is_dir($outDir)) {
    mkdir($outDir, 0755, true);
}

$feedDir = WP_CONTENT_DIR . '/uploads/facebook_for_woocommerce';
$feedFiles = glob($feedDir . '/product_catalog_*.csv') ?: [];
usort($feedFiles, static fn($a, $b) => filemtime($b) <=> filemtime($a));
$feedFile = $feedFiles[0] ?? null;

$summaryPath = $outDir . "/facebook-catalog-audit-summary-$timestamp.txt";
$issuesPath = $outDir . "/facebook-catalog-audit-issues-$timestamp.csv";

$summary = [
    'audit_time' => date(DATE_ATOM),
    'feed_file' => $feedFile ?: 'missing',
    'feed_mtime' => $feedFile ? date(DATE_ATOM, filemtime($feedFile)) : '',
    'feed_size_bytes' => $feedFile ? (string) filesize($feedFile) : '0',
];

$issues = [];
$addIssue = static function (string $severity, string $type, string $id, string $title, string $detail) use (&$issues): void {
    $issues[] = [$severity, $type, $id, $title, $detail];
};

$publishedRows = $wpdb->get_results(
    "SELECT ID, post_name, post_title
     FROM {$wpdb->posts}
     WHERE post_type = 'product' AND post_status = 'publish'",
    ARRAY_A
);

$published = [];
foreach ($publishedRows as $row) {
    $published[(string) $row['ID']] = [
        'slug' => (string) $row['post_name'],
        'title' => (string) $row['post_title'],
        'permalink' => get_permalink((int) $row['ID']),
    ];
}

$summary['published_products'] = (string) count($published);

$rows = [];
$ids = [];
$links = [];
$titles = [];
$badUrlCount = 0;
$nonCanonicalCount = 0;
$missingPriceCount = 0;
$missingImageCount = 0;
$missingStockCount = 0;
$missingBrandCount = 0;
$missingDescriptionCount = 0;
$unpublishedFeedCount = 0;
$publishedIdsInFeed = [];

if (!$feedFile || !is_readable($feedFile)) {
    $addIssue('critical', 'feed_missing', '', '', 'Facebook catalog CSV was not found or is not readable.');
} else {
    $handle = fopen($feedFile, 'rb');
    $header = $handle ? fgetcsv($handle) : false;
    if (!$handle || !$header) {
        $addIssue('critical', 'feed_unreadable', '', '', 'Could not read the Facebook catalog CSV header.');
    } else {
        $header = array_map(static fn($v) => trim((string) $v), $header);
        $line = 1;
        while (($data = fgetcsv($handle)) !== false) {
            $line++;
            if (count($data) < count($header)) {
                $data = array_pad($data, count($header), '');
            }
            $row = array_combine($header, array_slice($data, 0, count($header)));
            if (!$row) {
                $addIssue('high', 'row_parse_error', '', '', "Could not parse CSV row $line.");
                continue;
            }

            $id = trim((string) ($row['id'] ?? ''));
            $title = trim((string) ($row['title'] ?? ''));
            $link = trim((string) ($row['link'] ?? ''));
            $image = trim((string) ($row['image_link'] ?? ''));
            $price = trim((string) ($row['price'] ?? ''));
            $availability = trim((string) ($row['availability'] ?? ''));
            $brand = trim((string) ($row['brand'] ?? ''));
            $description = trim((string) ($row['description'] ?? ''));

            $rows[] = $row;
            $ids[$id] = ($ids[$id] ?? 0) + 1;
            $links[$link] = ($links[$link] ?? 0) + 1;
            $titleKey = mb_strtolower($title);
            $titles[$titleKey] = ($titles[$titleKey] ?? 0) + 1;

            if ($id === '') {
                $addIssue('critical', 'missing_id', '', $title, "CSV row $line has no id.");
            } elseif (!isset($published[$id])) {
                $unpublishedFeedCount++;
                $addIssue('high', 'feed_id_not_published_product', $id, $title, 'Feed id does not match a currently published Woo product.');
            } else {
                $publishedIdsInFeed[$id] = true;
            }

            if ($link === '' || !preg_match('#^https://e-mart\.com\.bd/shop/[^?\s]+/?$#', $link)) {
                $badUrlCount++;
                $addIssue('high', 'bad_or_non_shop_url', $id, $title, $link);
            } elseif (isset($published[$id])) {
                $canonical = rtrim((string) $published[$id]['permalink'], '/') . '/';
                $feedCanonical = rtrim($link, '/') . '/';
                if ($canonical !== $feedCanonical) {
                    $nonCanonicalCount++;
                    $addIssue('high', 'link_mismatch_woo_permalink', $id, $title, "feed=$link expected=$canonical");
                }
            }

            if ($image === '' || !preg_match('#^https?://#', $image)) {
                $missingImageCount++;
                $addIssue('high', 'missing_or_bad_image', $id, $title, $image);
            }
            if ($price === '' || !preg_match('/^[0-9]+(?:\.[0-9]{1,2})?\s+BDT$/', $price)) {
                $missingPriceCount++;
                $addIssue('high', 'missing_or_bad_price', $id, $title, $price);
            }
            if ($availability === '') {
                $missingStockCount++;
                $addIssue('high', 'missing_availability', $id, $title, 'No availability value in feed.');
            }
            if ($brand === '') {
                $missingBrandCount++;
                $addIssue('medium', 'missing_brand', $id, $title, 'No brand value in feed.');
            }
            if ($description === '') {
                $missingDescriptionCount++;
                $addIssue('medium', 'missing_description', $id, $title, 'No description value in feed.');
            }
        }
        fclose($handle);
    }
}

foreach ($ids as $id => $count) {
    if ($id !== '' && $count > 1) {
        $addIssue('critical', 'duplicate_id', $id, '', "id appears $count times in feed.");
    }
}
foreach ($links as $link => $count) {
    if ($link !== '' && $count > 1) {
        $addIssue('high', 'duplicate_link', '', '', "link appears $count times: $link");
    }
}
foreach ($titles as $title => $count) {
    if ($title !== '' && $count > 1) {
        $addIssue('low', 'duplicate_title', '', $title, "title appears $count times in feed.");
    }
}

$missingFromFeed = array_diff_key($published, $publishedIdsInFeed);
foreach (array_slice($missingFromFeed, 0, 300, true) as $id => $product) {
    $addIssue('medium', 'published_product_missing_from_feed', (string) $id, $product['title'], $product['permalink']);
}

$schedulerRows = $wpdb->get_results(
    "SELECT status, hook, COUNT(*) AS count
     FROM {$wpdb->prefix}actionscheduler_actions
     WHERE hook LIKE '%facebook%' OR hook LIKE '%wc_facebook%'
     GROUP BY status, hook
     ORDER BY status, count DESC",
    ARRAY_A
);

$failedRecent = $wpdb->get_results(
    "SELECT action_id, hook, status, scheduled_date_gmt, last_attempt_gmt
     FROM {$wpdb->prefix}actionscheduler_actions
     WHERE (hook LIKE '%facebook%' OR hook LIKE '%wc_facebook%') AND status IN ('failed', 'pending')
     ORDER BY scheduled_date_gmt DESC
     LIMIT 30",
    ARRAY_A
);

$logFiles = glob(WP_CONTENT_DIR . '/uploads/wc-logs/plugin-facebook-for-woocommerce-*.log') ?: [];
usort($logFiles, static fn($a, $b) => filemtime($b) <=> filemtime($a));
$recentLogs = array_slice($logFiles, 0, 8);

$logFindings = [];
foreach ($recentLogs as $logFile) {
    $content = file_get_contents($logFile);
    $errorHits = preg_match_all('/\b(error|failed|exception|fatal|warning)\b/i', (string) $content);
    $logFindings[] = [
        'file' => basename($logFile),
        'mtime' => date(DATE_ATOM, filemtime($logFile)),
        'bytes' => filesize($logFile),
        'error_terms' => $errorHits,
    ];
}

$summary += [
    'feed_rows' => (string) count($rows),
    'unique_feed_ids' => (string) count(array_filter(array_keys($ids), static fn($id) => $id !== '')),
    'duplicate_ids' => (string) count(array_filter($ids, static fn($count) => $count > 1)),
    'duplicate_links' => (string) count(array_filter($links, static fn($count) => $count > 1)),
    'published_missing_from_feed' => (string) count($missingFromFeed),
    'feed_ids_not_published' => (string) $unpublishedFeedCount,
    'bad_or_non_shop_urls' => (string) $badUrlCount,
    'link_mismatches' => (string) $nonCanonicalCount,
    'missing_or_bad_prices' => (string) $missingPriceCount,
    'missing_or_bad_images' => (string) $missingImageCount,
    'missing_availability' => (string) $missingStockCount,
    'missing_brand' => (string) $missingBrandCount,
    'missing_description' => (string) $missingDescriptionCount,
    'issue_rows_written' => (string) count($issues),
];

$issueHandle = fopen($issuesPath, 'wb');
fputcsv($issueHandle, ['severity', 'type', 'id', 'title', 'detail']);
foreach ($issues as $issue) {
    fputcsv($issueHandle, $issue);
}
fclose($issueHandle);

$lines = [];
$lines[] = 'Facebook Catalog Read-Only Audit';
$lines[] = '================================';
foreach ($summary as $key => $value) {
    $lines[] = "$key: $value";
}
$lines[] = '';
$lines[] = 'Action Scheduler Facebook Jobs';
$lines[] = '------------------------------';
foreach ($schedulerRows as $row) {
    $lines[] = "{$row['status']}\t{$row['hook']}\t{$row['count']}";
}
$lines[] = '';
$lines[] = 'Recent Failed/Pending Facebook Jobs';
$lines[] = '-----------------------------------';
foreach ($failedRecent as $row) {
    $lines[] = "{$row['action_id']}\t{$row['status']}\t{$row['hook']}\tscheduled={$row['scheduled_date_gmt']}\tlast_attempt={$row['last_attempt_gmt']}";
}
$lines[] = '';
$lines[] = 'Recent Plugin Logs';
$lines[] = '------------------';
foreach ($logFindings as $log) {
    $lines[] = "{$log['file']}\tmtime={$log['mtime']}\tbytes={$log['bytes']}\terror_terms={$log['error_terms']}";
}
$lines[] = '';
$lines[] = "Issue CSV: $issuesPath";

file_put_contents($summaryPath, implode(PHP_EOL, $lines) . PHP_EOL);

echo $summaryPath . PHP_EOL;
echo $issuesPath . PHP_EOL;
