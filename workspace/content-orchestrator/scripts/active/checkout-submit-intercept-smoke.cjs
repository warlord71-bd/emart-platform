#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

function findPlaywrightModule() {
  const base = '/root/.npm/_npx';
  const candidates = [];
  for (const entry of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    const pkg = path.join(base, entry, 'node_modules/playwright/package.json');
    if (fs.existsSync(pkg)) candidates.push(path.dirname(pkg));
  }
  candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (!candidates[0]) throw new Error('No cached Playwright package found.');
  return candidates[0];
}

const { chromium } = require(findPlaywrightModule());

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const cart = {
    state: {
      items: [{
        id: 93315,
        name: 'Kerasys Black Bean Oil Shampoo Anti Hair Loss 1000ml',
        price: '3150',
        image: 'https://e-mart.com.bd/wp-content/uploads/2026/05/Kerasys-Black-Bean-Oil-Shampoo-1-L-5-1.jpg',
        quantity: 1,
        slug: 'kerasys-black-bean-oil-shampoo-anti-hair-loss-1000ml',
        stock_quantity: 7,
      }],
      isOpen: false,
    },
    version: 0,
  };

  await page.addInitScript((cartState) => {
    localStorage.setItem('emart-cart', JSON.stringify(cartState));
  }, cart);

  const events = [];
  page.on('request', (request) => {
    if (/api\/checkout|api\/shipping/.test(request.url())) {
      events.push({ type: 'request', method: request.method(), url: request.url(), post: request.postData() });
    }
  });
  page.on('response', (response) => {
    if (/api\/checkout|api\/shipping/.test(response.url())) {
      events.push({ type: 'response', status: response.status(), url: response.url() });
    }
  });

  let payload = null;
  await page.route('**/api/checkout', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        order: {
          id: 999999,
          total: '3150',
          currency: 'BDT',
          line_items: [{ product_id: 93315, quantity: 1, total: '3150' }],
          billing: payload.billing,
          customer_id: 0,
        },
      }),
    });
  });

  await page.goto('https://e-mart.com.bd/checkout', { waitUntil: 'networkidle', timeout: 45000 });
  await page.locator('#main-content input[name="first_name"]').fill('Test');
  await page.locator('#main-content input[name="last_name"]').fill('Audit');
  await page.locator('#main-content input[name="phone"]').fill('01717082135');
  await page.locator('#main-content input[name="email"]').fill('audit@example.com');
  await page.locator('#main-content input[name="address_1"]').fill('Dhanmondi test address');
  await page.locator('#main-content button:has-text("Place Order")').click({ timeout: 10000 });
  await page.waitForURL('**/order-success?id=999999', { timeout: 10000 });
  await page.waitForTimeout(1500);

  const result = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    bodySample: document.body.innerText.slice(0, 1000),
    purchaseStorage: sessionStorage.getItem('emart-meta-purchase'),
    gcrStorage: sessionStorage.getItem('emart-gcr-order'),
  }));

  const out = {
    generatedAt: new Date().toISOString(),
    payload,
    result,
    events,
  };
  fs.writeFileSync('workspace/audit/active/checkout-submit-intercept-smoke-20260607.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify({
    intercepted: Boolean(payload),
    payloadSummary: payload ? {
      payment_method: payload.payment_method,
      billing: payload.billing,
      line_items: payload.line_items,
      hasMetaEventId: Boolean(payload.meta_event_id),
      hasIdempotencyKey: Boolean(payload.idempotency_key),
      hasAttribution: Boolean(payload.attribution),
    } : null,
    finalUrl: result.url,
    purchaseStorage: Boolean(result.purchaseStorage),
    gcrStorage: Boolean(result.gcrStorage),
    events,
  }, null, 2));

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
