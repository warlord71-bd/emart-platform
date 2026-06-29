<?php
/**
 * Copy the existing WordPress checkout order secret into Next.js env files.
 * Prints only presence/status, never the secret value.
 */

$wpConfig = '/var/www/wordpress/wp-config.php';
$envFiles = array(
    '/var/www/emart-platform/apps/web/.env.local',
    '/root/emart-platform/apps/web/.env.local',
);

$wpConfigText = @file_get_contents($wpConfig);
if ($wpConfigText === false) {
    fwrite(STDERR, "Could not read wp-config.php\n");
    exit(1);
}

if (!preg_match("/define\\(\\s*'EMART_ORDER_SECRET'\\s*,\\s*'([^']+)'\\s*\\)/", $wpConfigText, $matches)) {
    fwrite(STDERR, "EMART_ORDER_SECRET not found in wp-config.php\n");
    exit(1);
}

$secret = $matches[1];
if ($secret === '') {
    fwrite(STDERR, "EMART_ORDER_SECRET in wp-config.php is empty\n");
    exit(1);
}

foreach ($envFiles as $envFile) {
    $lines = file_exists($envFile)
        ? file($envFile, FILE_IGNORE_NEW_LINES)
        : array();

    if ($lines === false) {
        fwrite(STDERR, "Could not read {$envFile}\n");
        exit(1);
    }

    $found = false;
    foreach ($lines as &$line) {
        if (preg_match('/^EMART_ORDER_SECRET=/', $line)) {
            $line = 'EMART_ORDER_SECRET=' . $secret;
            $found = true;
        }
    }
    unset($line);

    if (!$found) {
        $lines[] = 'EMART_ORDER_SECRET=' . $secret;
    }

    if (@file_put_contents($envFile, implode("\n", $lines) . "\n") === false) {
        fwrite(STDERR, "Could not write {$envFile}\n");
        exit(1);
    }

    echo "{$envFile}: EMART_ORDER_SECRET present\n";
}
