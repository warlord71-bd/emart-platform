#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const SITE = 'http://127.0.0.1:3000';
const PRODUCT_ID = 93315;
const runId = Date.now().toString(36);
const email = process.env.SMOKE_EMAIL || `checkout-smoke-${runId}@e-mart.com.bd`;
const deleteSmokeUser = !process.env.SMOKE_EMAIL;

function wpEval(code, env = {}) {
  const result = spawnSync(
    'wp',
    ['--path=/var/www/wordpress', '--allow-root', 'eval', code],
    {
      encoding: 'utf8',
      env: { ...process.env, ...env },
      timeout: 20000,
    },
  );
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'wp eval failed').trim());
  }
  return result.stdout.trim();
}

function getStockSnapshot() {
  const output = wpEval(`
    $p = wc_get_product(${PRODUCT_ID});
    if (!$p) { echo "missing"; exit(1); }
    echo json_encode(array(
      "quantity" => $p->get_stock_quantity(),
      "status" => $p->get_stock_status(),
      "manage_stock" => $p->managing_stock(),
    ));
  `);
  return JSON.parse(output);
}

async function cleanup(orderId, stockBefore) {
  if (!orderId) return;
  wpEval(`
    $order_id = absint(getenv('SMOKE_ORDER_ID'));
    $email = (string) getenv('SMOKE_EMAIL');
    $delete_user = getenv('SMOKE_DELETE_USER') === '1';
    $qty = getenv('SMOKE_STOCK_QTY');
    $status = (string) getenv('SMOKE_STOCK_STATUS');

    if ($order_id) {
      $order = wc_get_order($order_id);
      if ($order) {
        $order->delete(true);
        echo "order_deleted\\n";
      }
    }

    $p = wc_get_product(${PRODUCT_ID});
    if ($p && $p->managing_stock()) {
      $p->set_stock_quantity($qty === '' ? null : (int) $qty);
      if ($status !== '') {
        $p->set_stock_status($status);
      }
      $p->save();
      echo "stock_restored\\n";
    }

    $user = $delete_user ? get_user_by('email', $email) : false;
    if ($user) {
      require_once ABSPATH . 'wp-admin/includes/user.php';
      wp_delete_user($user->ID);
      echo "user_deleted\\n";
    }
  `, {
    SMOKE_ORDER_ID: String(orderId),
    SMOKE_EMAIL: email,
    SMOKE_DELETE_USER: deleteSmokeUser ? '1' : '0',
    SMOKE_STOCK_QTY: stockBefore.quantity == null ? '' : String(stockBefore.quantity),
    SMOKE_STOCK_STATUS: stockBefore.status || '',
  });
}

const stockBefore = getStockSnapshot();
let orderId = null;

try {
  const billing = {
    first_name: 'Checkout',
    last_name: 'Smoke',
    address_1: 'Delete this test order',
    address_2: '',
    city: 'Dhaka',
    postcode: '1205',
    country: 'BD',
    phone: '01711111111',
    email,
  };

  const response = await fetch(`${SITE}/api/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Emart checkout smoke',
      'Origin': 'https://e-mart.com.bd',
      ...(process.env.CHECKOUT_MONITOR_SECRET ? { 'X-Checkout-Monitor-Secret': process.env.CHECKOUT_MONITOR_SECRET } : {}),
    },
    body: JSON.stringify({
      payment_method: 'cod',
      billing,
      shipping: billing,
      line_items: [{ product_id: PRODUCT_ID, quantity: 1 }],
      customer_note: `Automated checkout smoke ${runId}; delete`,
      meta_event_id: `checkout-smoke-${runId}`,
      idempotency_key: `checkout-smoke-${runId}`,
      attribution: {},
    }),
  });

  const data = await response.json().catch(() => ({}));
  orderId = Number(data?.order?.id || data?.id || 0) || null;
  const customerId = Number(data?.order?.customer_id || data?.customer_id || 0);

  if (!response.ok || !orderId) {
    throw new Error(`checkout_failed status=${response.status} error=${data?.error || data?.message || 'unknown'}`);
  }
  if (process.env.SMOKE_EXPECT_CUSTOMER_ID && customerId !== Number(process.env.SMOKE_EXPECT_CUSTOMER_ID)) {
    throw new Error(`customer_id_mismatch expected=${process.env.SMOKE_EXPECT_CUSTOMER_ID} actual=${customerId}`);
  }

  await cleanup(orderId, stockBefore);
  orderId = null;

  const stockAfter = getStockSnapshot();
  const stockSame =
    String(stockAfter.quantity) === String(stockBefore.quantity)
    && String(stockAfter.status) === String(stockBefore.status);

  if (!stockSame) {
    throw new Error('stock_restore_mismatch');
  }

  console.log(`checkout_bff_smoke=pass order_created_deleted=yes product_id=${PRODUCT_ID}`);
} catch (error) {
  if (orderId) {
    try {
      await cleanup(orderId, stockBefore);
    } catch (cleanupError) {
      console.error(`cleanup_failed=${cleanupError instanceof Error ? cleanupError.message : cleanupError}`);
    }
  }
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
