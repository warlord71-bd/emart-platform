<?php
// Wrapper for WP-CLI installs that parse eval-file arguments as WP-CLI options.
$GLOBALS['argv'][] = '--apply';
require __DIR__ . '/clear-woocommerce-sale-prices.php';
