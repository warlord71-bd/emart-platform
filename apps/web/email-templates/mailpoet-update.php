<?php
/**
 * MailPoet email body updater — Emart brand refresh
 * Run: wp --path=/var/www/wordpress --allow-root eval-file /var/www/emart-platform/apps/web/email-templates/mailpoet-update.php
 *
 * Updates:
 *   ID 2 — Welcome email (automation)
 *   ID 3 — Abandoned cart reminder (automation)
 *   ID 4 — WC transactional order confirmation (wc_transactional)
 */

global $wpdb;
$table = $wpdb->prefix . 'mailpoet_newsletters';

// ─── Shared design tokens ─────────────────────────────────────────────────────
$ACCENT     = '#c76882';
$ACCENT_BG  = '#fdf2f5';
$WHITE      = '#ffffff';
$BODY_BG    = '#f4f4f4';
$TEXT       = '#2d2d2d';
$MUTED      = '#6b6b6b';
$LOGO_SRC   = 'https://e-mart.com.bd/wp-content/uploads/2026/03/logo.png';
$LOGO_LINK  = 'https://e-mart.com.bd';
$SITE_URL   = 'https://e-mart.com.bd';
$WA_URL     = 'https://wa.me/8801919797399';
$SHOP_URL   = 'https://e-mart.com.bd/shop';
$CART_URL   = 'https://e-mart.com.bd/cart';
$ADDR       = '17, Central Road (Near Ideal College), Dhanmondi, Dhaka-1205, Bangladesh';

$GLOBAL_STYLES = [
  'text'    => ['fontColor' => $TEXT,   'fontFamily' => 'Arial', 'fontSize' => '14px', 'lineHeight' => '1.7'],
  'h1'      => ['fontColor' => $ACCENT, 'fontFamily' => 'Georgia', 'fontSize' => '28px', 'lineHeight' => '1.4'],
  'h2'      => ['fontColor' => $ACCENT, 'fontFamily' => 'Georgia', 'fontSize' => '22px', 'lineHeight' => '1.4'],
  'h3'      => ['fontColor' => $TEXT,   'fontFamily' => 'Arial',   'fontSize' => '16px', 'lineHeight' => '1.4'],
  'link'    => ['fontColor' => $ACCENT, 'textDecoration' => 'underline'],
  'wrapper' => ['backgroundColor' => $WHITE],
  'body'    => ['backgroundColor' => $BODY_BG],
  'woocommerce' => [
    'brandingColor'      => $ACCENT,
    'headingFontColor'   => $WHITE,
    'headingFontFamily'  => 'Arial',
  ],
];

// ─── Block helpers ────────────────────────────────────────────────────────────
function spacer(int $px = 20): array {
  return ['type' => 'spacer', 'styles' => ['block' => ['backgroundColor' => 'transparent', 'height' => "{$px}px"]]];
}
function divider(): array {
  return ['type' => 'divider', 'styles' => ['block' => ['backgroundColor' => 'transparent', 'padding' => '10px', 'borderStyle' => 'solid', 'borderWidth' => '1px', 'borderColor' => '#e8d8dd']]];
}
function text(string $html): array {
  return ['type' => 'text', 'text' => $html];
}
function image(string $src, string $link = '', string $alt = '', string $width = '160px'): array {
  return ['type' => 'image', 'link' => $link, 'src' => $src, 'alt' => $alt, 'fullWidth' => false, 'width' => $width, 'height' => 'auto', 'styles' => ['block' => ['textAlign' => 'center']]];
}
function button(string $label, string $url, string $bg = '#c76882'): array {
  return [
    'type' => 'button',
    'text' => $label,
    'url'  => $url,
    'styles' => ['block' => [
      'backgroundColor' => $bg,
      'borderColor'     => $bg,
      'borderWidth'     => '0px',
      'borderRadius'    => '24px',
      'borderStyle'     => 'solid',
      'width'           => '200px',
      'lineHeight'      => '44px',
      'fontColor'       => '#ffffff',
      'fontFamily'      => 'Arial',
      'fontSize'        => '15px',
      'fontWeight'      => 'bold',
      'textAlign'       => 'center',
    ]],
  ];
}
function col(array $blocks, string $bg = 'transparent'): array {
  return ['type' => 'container', 'columnLayout' => false, 'orientation' => 'vertical',
    'image' => ['src' => null, 'display' => 'scale'],
    'styles' => ['block' => ['backgroundColor' => $bg]],
    'blocks' => $blocks];
}
function row(array $cols, string $bg = 'transparent'): array {
  return ['type' => 'container', 'columnLayout' => false, 'orientation' => 'horizontal',
    'image' => ['src' => null, 'display' => 'scale'],
    'styles' => ['block' => ['backgroundColor' => $bg]],
    'blocks' => $cols];
}
function wrap(array $blocks): array {
  return ['type' => 'container', 'columnLayout' => false, 'orientation' => 'vertical',
    'image' => ['src' => null, 'display' => 'scale'],
    'styles' => ['block' => ['backgroundColor' => 'transparent']],
    'blocks' => $blocks];
}

// ─── Shared header block (logo + pink top bar) ────────────────────────────────
function header_block(string $logo_src, string $logo_link, string $accent): array {
  return row([col([
    spacer(6),
    ['type' => 'spacer', 'styles' => ['block' => ['backgroundColor' => $accent, 'height' => '4px']]],
    spacer(16),
    image($logo_src, $logo_link, 'Emart Skincare Bangladesh', '140px'),
    spacer(16),
  ], '#ffffff')], '#ffffff');
}

// ─── Shared footer block ──────────────────────────────────────────────────────
function footer_block(string $addr, string $accent): array {
  return row([col([
    spacer(20),
    divider(),
    spacer(12),
    text('<p style="text-align:center;font-size:12px;color:#999999;margin:0 0 6px;">'
      . 'Emart Skincare Bangladesh &mdash; Authentic global beauty, delivered.<br/>'
      . $addr . '</p>'
      . '<p style="text-align:center;font-size:12px;color:#999999;margin:0;">'
      . '<a href="[link:subscription_unsubscribe_url]" style="color:#c76882;">Unsubscribe</a>'
      . ' &nbsp;|&nbsp; '
      . '<a href="[link:subscription_manage_url]" style="color:#c76882;">Manage preferences</a>'
      . '</p>'),
    spacer(20),
  ])]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL ID 2 — Welcome email
// ═══════════════════════════════════════════════════════════════════════════════
$welcome_content = wrap([
  header_block($LOGO_SRC, $LOGO_LINK, $ACCENT),

  // Hero
  row([col([
    spacer(32),
    text('<h1 style="text-align:center;margin:0 0 12px;">Welcome to Emart! ✨</h1>'
      . '<p style="text-align:center;color:#6b6b6b;margin:0;">Hello [subscriber:firstname | default:there], you\'re in.</p>'),
    spacer(24),
    text('<p style="text-align:center;font-size:15px;line-height:1.7;margin:0 0 16px;">'
      . 'Thank you for joining <strong>Emart Skincare Bangladesh</strong> — your destination for authentic Korean &amp; Japanese beauty products delivered across Bangladesh.'
      . '</p>'
      . '<p style="text-align:center;font-size:15px;line-height:1.7;margin:0;">'
      . 'You\'ll be the first to hear about new arrivals, exclusive deals, and skincare tips tailored for the Bangladesh climate.'
      . '</p>'),
    spacer(28),
    button('Start Shopping', $SHOP_URL),
    spacer(32),
  ])]),

  // Category cards
  row([col([
    ['type' => 'spacer', 'styles' => ['block' => ['backgroundColor' => '#fdf2f5', 'height' => '1px']]],
  ])]),
  row([col([
    spacer(28),
    text('<h2 style="text-align:center;font-size:18px;margin:0 0 20px;">What\'s waiting for you</h2>'),
    text('<table width="100%" cellpadding="0" cellspacing="0" border="0">'
      . '<tr>'
      . '<td width="33%" style="text-align:center;padding:0 8px;">'
      . '<div style="background:#fff;border-radius:12px;padding:20px 12px;border:1px solid #f0dde3;">'
      . '<div style="font-size:28px;margin-bottom:8px;">🌸</div>'
      . '<div style="font-weight:bold;color:#2d2d2d;margin-bottom:4px;">K-Beauty</div>'
      . '<div style="font-size:12px;color:#6b6b6b;">COSRX, ANUA, Medicube</div>'
      . '</div></td>'
      . '<td width="33%" style="text-align:center;padding:0 8px;">'
      . '<div style="background:#fff;border-radius:12px;padding:20px 12px;border:1px solid #f0dde3;">'
      . '<div style="font-size:28px;margin-bottom:8px;">🌿</div>'
      . '<div style="font-weight:bold;color:#2d2d2d;margin-bottom:4px;">J-Beauty</div>'
      . '<div style="font-size:12px;color:#6b6b6b;">Hada Labo, DHC, Biore</div>'
      . '</div></td>'
      . '<td width="33%" style="text-align:center;padding:0 8px;">'
      . '<div style="background:#fff;border-radius:12px;padding:20px 12px;border:1px solid #f0dde3;">'
      . '<div style="font-size:28px;margin-bottom:8px;">💊</div>'
      . '<div style="font-weight:bold;color:#2d2d2d;margin-bottom:4px;">Skincare</div>'
      . '<div style="font-size:12px;color:#6b6b6b;">CeraVe, The Ordinary</div>'
      . '</div></td>'
      . '</tr></table>'),
    spacer(28),
  ])]),

  // Trust + WhatsApp strip
  row([col([
    spacer(20),
    text('<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff9fb;border-radius:8px;">'
      . '<tr>'
      . '<td style="text-align:center;padding:16px 8px;font-size:12px;color:#6b6b6b;">✅ 100% Authentic</td>'
      . '<td style="text-align:center;padding:16px 8px;font-size:12px;color:#6b6b6b;">🚚 Nationwide Delivery</td>'
      . '<td style="text-align:center;padding:16px 8px;font-size:12px;color:#6b6b6b;">💬 WhatsApp Support</td>'
      . '</tr></table>'),
    spacer(16),
    text('<p style="text-align:center;font-size:13px;color:#6b6b6b;margin:0;">'
      . 'Need help choosing a product? <a href="' . $WA_URL . '" style="color:#c76882;font-weight:bold;">Chat with us on WhatsApp</a></p>'),
    spacer(24),
  ])]),

  footer_block($ADDR, $ACCENT),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL ID 3 — Abandoned cart
// ═══════════════════════════════════════════════════════════════════════════════
$cart_content = wrap([
  header_block($LOGO_SRC, $LOGO_LINK, $ACCENT),

  // Urgency hero
  row([col([
    spacer(32),
    text('<h1 style="text-align:center;margin:0 0 10px;">Your cart misses you 🛒</h1>'
      . '<p style="text-align:center;color:#6b6b6b;margin:0;">Hi [subscriber:firstname | default:there], you left something behind.</p>'),
    spacer(20),
    text('<p style="text-align:center;font-size:15px;line-height:1.7;margin:0;">'
      . 'Your selected products are still waiting — but popular items sell out fast. Complete your order while stock lasts.'
      . '</p>'),
    spacer(28),
  ])]),

  // Dynamic cart contents
  row([col([
    ['type' => 'abandonedCartContent',
     'withLayout'   => false,
     'titleFormat'  => 'h2',
     'titleIsLink'  => true,
     'titleAlignment'   => 'left',
     'pricePosition'    => 'below',
     'imageFullWidth'   => false,
     'imageAlignment'   => 'left',
     'featuredImageInfo' => [],
     'styles' => [
       'block' => ['backgroundColor' => '#ffffff'],
       'title' => ['fontColor' => '#2d2d2d', 'fontFamily' => 'Arial', 'fontSize' => '16px', 'lineHeight' => '1.5', 'fontWeight' => 'bold'],
       'price' => ['fontColor' => '#c76882', 'fontFamily' => 'Arial', 'fontSize' => '15px', 'fontWeight' => 'bold'],
     ],
    ],
    spacer(24),
    button('Complete My Order', $CART_URL),
    spacer(32),
  ])]),

  // Free delivery nudge
  row([col([
    text('<p style="text-align:center;background:#fdf2f5;border-radius:8px;padding:14px;font-size:13px;color:#c76882;margin:0;font-weight:bold;">'
      . '🚚 Free delivery on orders over ৳1,000 — you might already qualify!'
      . '</p>'),
    spacer(20),
    text('<p style="text-align:center;font-size:13px;color:#6b6b6b;margin:0;">'
      . 'Questions about a product? <a href="' . $WA_URL . '" style="color:#c76882;font-weight:bold;">Ask us on WhatsApp</a></p>'),
    spacer(24),
  ])]),

  footer_block($ADDR, $ACCENT),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL ID 4 — WC Transactional (order confirmation)
// Keep woocommerceHeading + woocommerceContent blocks; only update branding
// ═══════════════════════════════════════════════════════════════════════════════
$transactional_content = wrap([
  // Header with Emart logo (replaces default WC logo)
  row([col([
    spacer(4),
    ['type' => 'spacer', 'styles' => ['block' => ['backgroundColor' => $ACCENT, 'height' => '4px']]],
    spacer(20),
    image($LOGO_SRC, $LOGO_LINK, 'Emart Skincare Bangladesh', '140px'),
    spacer(20),
  ], '#ffffff')], '#ffffff'),

  // WC dynamic heading (auto: "Order Confirmed", "Shipped", etc.)
  ['type' => 'woocommerceHeading'],

  // Spacer above order table
  row([col([spacer(8)])]),

  // WC dynamic order details table
  ['type' => 'woocommerceContent'],

  // Support + WhatsApp strip
  row([col([
    spacer(24),
    divider(),
    spacer(20),
    text('<p style="text-align:center;font-size:14px;color:#6b6b6b;margin:0 0 12px;">'
      . 'Questions about your order?'
      . '</p>'),
    button('💬 Chat on WhatsApp', $WA_URL, '#25D366'),
    spacer(16),
    text('<p style="text-align:center;font-size:13px;color:#999999;margin:0;">'
      . 'Or email us: <a href="mailto:order@e-mart.com.bd" style="color:#c76882;">order@e-mart.com.bd</a></p>'),
    spacer(24),
  ])]),

  // Authenticity reminder
  row([col([
    text('<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff9fb;border-radius:8px;">'
      . '<tr>'
      . '<td style="text-align:center;padding:14px 8px;font-size:12px;color:#6b6b6b;">✅ All products are 100% authentic &amp; sourced from authorised distributors.</td>'
      . '</tr></table>'),
    spacer(20),
  ])]),

  footer_block($ADDR, $ACCENT),
]);

// ─── Write to DB ──────────────────────────────────────────────────────────────
$updates = [
  2 => ['subject' => 'Welcome to Emart — Your K-Beauty Journey Starts Here ✨', 'content' => $welcome_content],
  3 => ['subject' => 'You left something behind 🛒 — Complete your Emart order', 'content' => $cart_content],
  4 => ['subject' => '', 'content' => $transactional_content], // WC transactional subject is set by WC, not MailPoet
];

foreach ($updates as $id => $data) {
  $row = $wpdb->get_row("SELECT body FROM {$table} WHERE id = {$id}");
  if (!$row) { echo "ID {$id}: NOT FOUND — skipped\n"; continue; }

  $body = json_decode($row->body, true) ?: [];
  $body['content']      = $data['content'];
  $body['globalStyles'] = $GLOBAL_STYLES;

  $set  = ['body' => wp_json_encode($body)];
  if ($id !== 4 && $data['subject']) {
    $set['subject'] = $data['subject'];
  }
  // Update branding color in woocommerce block defaults for id=4
  if ($id === 4 && isset($body['blockDefaults'])) {
    $bd = $body['blockDefaults'];
    if (isset($bd['woocommerceHeading']['styles']['block']['backgroundColor'])) {
      $bd['woocommerceHeading']['styles']['block']['backgroundColor'] = '#c76882';
      $set['body'] = wp_json_encode(array_merge($body, ['blockDefaults' => $bd]));
    }
  }

  $result = $wpdb->update($table, $set, ['id' => $id]);
  if ($result !== false) {
    echo "ID {$id}: updated OK" . ($data['subject'] ? " | Subject: {$data['subject']}" : '') . "\n";
  } else {
    echo "ID {$id}: DB UPDATE FAILED — " . $wpdb->last_error . "\n";
  }
}

echo "\nDone. Clear MailPoet cache:\n";
