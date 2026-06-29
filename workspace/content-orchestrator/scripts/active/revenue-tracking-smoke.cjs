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
  if (!candidates[0]) throw new Error('No cached Playwright package found. Run: npx playwright --version');
  return candidates[0];
}

const { chromium } = require(findPlaywrightModule());

const SITE = 'https://e-mart.com.bd';
const PRODUCT = `${SITE}/shop/kerasys-black-bean-oil-shampoo-anti-hair-loss-1000ml`;
const OUT = path.join(process.cwd(), 'workspace/audit/active/revenue-tracking-smoke-20260607.json');

function watched(url) {
  return /googletagmanager|google-analytics|facebook\.com\/tr|connect\.facebook\.net|gstatic\.com\/shopping|merchantwidget|\/api\/shipping\/estimate|\/api\/checkout|\/api\/auth\/me|\/api\/account\/orders/.test(url);
}

async function snapshot(page) {
  return page.evaluate(() => ({
    url: location.href,
    title: document.title,
    canonical: document.querySelector('link[rel="canonical"]')?.href || null,
    robots: document.querySelector('meta[name="robots"]')?.content || null,
    h1: [...document.querySelectorAll('h1')].map((h) => h.textContent?.trim()).filter(Boolean),
    jsonLdCount: document.querySelectorAll('script[type="application/ld+json"]').length,
    gtagType: typeof window.gtag,
    fbqType: typeof window.fbq,
    bodySample: document.body.innerText.slice(0, 1200),
  }));
}

async function clickFirst(page, patterns) {
  for (const pattern of patterns) {
    const locator = page.getByRole('button', { name: pattern }).first();
    try {
      await locator.click({ timeout: 5000 });
      return true;
    } catch {}
  }
  for (const pattern of patterns) {
    const locator = page.getByText(pattern).first();
    try {
      await locator.click({ timeout: 5000 });
      return true;
    } catch {}
  }
  const placeOrder = page.locator('button:has-text("Place Order")').first();
  if (await placeOrder.count()) {
    try {
      await placeOrder.click({ timeout: 5000 });
      return true;
    } catch {}
  }
  const submit = page.locator('button[type="submit"]').first();
  if (await submit.count()) {
    try {
      await submit.click({ timeout: 5000 });
      return true;
    } catch {}
  }
  return false;
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  const events = [];
  page.on('request', (request) => {
    const url = request.url();
    if (watched(url)) events.push({ type: 'request', method: request.method(), url: url.slice(0, 220) });
  });
  page.on('response', (response) => {
    const url = response.url();
    if (watched(url)) events.push({ type: 'response', status: response.status(), url: url.slice(0, 220) });
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (watched(url)) events.push({ type: 'requestfailed', failure: request.failure()?.errorText, url: url.slice(0, 220) });
  });
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      events.push({ type: 'console', level: message.type(), text: message.text().slice(0, 260) });
    }
  });

  await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.mouse.click(20, 20);
  await page.waitForTimeout(12000);
  const home = await snapshot(page);

  await page.goto(`${SITE}/account`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1000);
  const account = await snapshot(page);

  const invalidLogin = await page.evaluate(async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'audit@example.com', password: 'wrong-password' }),
    });
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
  });

  await page.goto(PRODUCT, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.mouse.click(20, 20);
  await page.waitForTimeout(2000);
  const product = await snapshot(page);
  const addClicked = await clickFirst(page, [/add to cart/i]);
  await page.waitForTimeout(1000);

  await page.goto(`${SITE}/checkout`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1500);
  const checkoutBefore = await snapshot(page);
  const cartState = await page.evaluate(() => localStorage.getItem('emart-cart'));

  let checkoutPayload = null;
  await page.route('**/api/checkout', async (route) => {
    checkoutPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        order: {
          id: 999999,
          total: '3220',
          currency: 'BDT',
          line_items: [{ product_id: checkoutPayload?.line_items?.[0]?.product_id, quantity: 1, total: '3150' }],
          billing: checkoutPayload?.billing,
          customer_id: 0,
        },
      }),
    });
  });

  const fill = async (name, value) => {
    const locator = page.locator(`[name="${name}"]`).first();
    if (await locator.count()) await locator.fill(value);
  };

  let submitAttempted = false;
  if (!/Your cart is empty/i.test(checkoutBefore.bodySample)) {
    await fill('first_name', 'Test');
    await fill('last_name', 'Audit');
    await fill('phone', '01717082135');
    await fill('email', 'audit@example.com');
    await fill('address_1', 'Dhanmondi test address');
    const city = page.locator('select[name="city"]').first();
    if (await city.count()) await city.selectOption('Dhaka');
    submitAttempted = await clickFirst(page, [/place order/i, /submit/i, /order/i]);
    await page.waitForTimeout(3000);
  }

  const checkoutAfter = await page.evaluate(() => ({
    url: location.href,
    storedPurchase: sessionStorage.getItem('emart-meta-purchase'),
    gcrOrder: sessionStorage.getItem('emart-gcr-order'),
    bodySample: document.body.innerText.slice(0, 1000),
  }));

  const result = {
    generatedAt: new Date().toISOString(),
    home,
    account,
    invalidLogin,
    product,
    addClicked,
    checkoutBefore,
    cartState,
    submitAttempted,
    checkoutPayload,
    checkoutAfter,
    events,
    eventSummary: {
      gaRequests: events.filter((e) => /google-analytics|googletagmanager/.test(e.url || '')).length,
      metaRequests: events.filter((e) => /facebook\.com\/tr|connect\.facebook\.net/.test(e.url || '')).length,
      shippingRequests: events.filter((e) => /\/api\/shipping\/estimate/.test(e.url || '')).length,
      checkoutRequests: events.filter((e) => /\/api\/checkout/.test(e.url || '')).length,
      authRequests: events.filter((e) => /\/api\/auth\/me|\/api\/auth\/login/.test(e.url || '')).length,
      failedWatchedRequests: events.filter((e) => e.type === 'requestfailed' && e.failure !== 'net::ERR_ABORTED'),
      abortedBeacons: events.filter((e) => e.type === 'requestfailed' && e.failure === 'net::ERR_ABORTED').length,
    },
  };

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({
    out: OUT,
    home: { status: home.title, canonical: home.canonical, gtagType: home.gtagType, fbqType: home.fbqType, jsonLdCount: home.jsonLdCount },
    account: { robots: account.robots, h1: account.h1, invalidLogin },
    product: { title: product.title, canonical: product.canonical, addClicked },
    checkout: {
      empty: /Your cart is empty/i.test(checkoutBefore.bodySample),
      submitAttempted,
      intercepted: Boolean(checkoutPayload),
      redirectedTo: checkoutAfter.url,
      storedPurchase: Boolean(checkoutAfter.storedPurchase),
      gcrOrder: Boolean(checkoutAfter.gcrOrder),
    },
    eventSummary: result.eventSummary,
  }, null, 2));

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
