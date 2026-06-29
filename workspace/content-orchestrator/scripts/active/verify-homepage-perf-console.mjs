import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const baseUrl = process.argv[2] || 'http://127.0.0.1:3015';
const chromeBin = process.env.CHROME_BIN || '/usr/bin/chromium-browser';
const userDataDir = mkdtempSync(join(tmpdir(), 'emart-chrome-'));

const chrome = spawn(chromeBin, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--remote-debugging-port=0',
  `--user-data-dir=${userDataDir}`,
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

let browserWsUrl = '';
chrome.stderr.setEncoding('utf8');

const wsReady = new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Timed out waiting for Chromium DevTools URL')), 10000);
  chrome.stderr.on('data', (chunk) => {
    const match = chunk.match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (match) {
      browserWsUrl = match[1];
      clearTimeout(timer);
      resolve();
    }
  });
  chrome.on('exit', (code) => {
    if (!browserWsUrl) {
      clearTimeout(timer);
      reject(new Error(`Chromium exited before DevTools URL was ready: ${code}`));
    }
  });
});

let ws;
let nextId = 1;
const pending = new Map();
const requests = [];
const consoleMessages = [];
const logEntries = [];

function send(method, params = {}, sessionId) {
  const id = nextId++;
  const payload = { id, method, params };
  if (sessionId) payload.sessionId = sessionId;
  ws.send(JSON.stringify(payload));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }
    }, 10000);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connect() {
  await wsReady;
  ws = new WebSocket(browserWsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    if (message.method === 'Network.requestWillBeSent') {
      requests.push(message.params.request.url);
    }
    if (message.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push(message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '));
    }
    if (message.method === 'Log.entryAdded') {
      logEntries.push(`${message.params.entry.level}: ${message.params.entry.text}`);
    }
  });
}

async function verifyPage(path) {
  const target = await send('Target.createTarget', { url: 'about:blank' });
  const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;

  await send('Network.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send('Log.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  }, sessionId);
  await send('Emulation.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36',
  }, sessionId);

  const response = await send('Page.navigate', { url: `${baseUrl}${path}` }, sessionId);
  await delay(7000);
  const metrics = await send('Runtime.evaluate', {
    expression: `(() => ({
      title: document.title,
      href: location.href,
      statusHint: ${JSON.stringify(response.errorText || 'ok')},
      imagePreloads: [...document.querySelectorAll('link[rel="preload"][as="image"]')].map((el) => el.getAttribute('href')),
      hasCategoryCards: document.querySelectorAll('a[href^="/category/"]').length,
      bodyTextHasOldSeoBlock: document.body.innerText.includes('authentic Korean, Japanese and global beauty products delivered to your door'),
    }))()`,
    returnByValue: true,
  }, sessionId);

  await send('Target.closeTarget', { targetId: target.targetId });
  return metrics.result.value;
}

try {
  await connect();
  const homepage = await verifyPage('/');
  const checkout = await verifyPage('/checkout');

  const categoryPollingRequests = requests.filter((url) => url.includes('/api/analytics/active-sessions?category_id='));
  const activeSessionRequests = requests.filter((url) => url.includes('/api/analytics/active-sessions'));
  const preloadWarningMessages = [...consoleMessages, ...logEntries].filter((message) => message.includes('preloaded') && message.includes('not used'));

  console.log(JSON.stringify({
    ok: categoryPollingRequests.length === 0 && homepage.imagePreloads.length === 0 && checkout.statusHint === 'ok',
    homepage,
    checkout: {
      title: checkout.title,
      href: checkout.href,
      statusHint: checkout.statusHint,
      imagePreloads: checkout.imagePreloads,
    },
    activeSessionRequestCount: activeSessionRequests.length,
    categoryPollingRequestCount: categoryPollingRequests.length,
    preloadWarningCount: preloadWarningMessages.length,
    consoleMessageCount: consoleMessages.length,
    logEntryCount: logEntries.length,
  }, null, 2));
} finally {
  try {
    ws?.close();
  } catch {}
  chrome.kill('SIGTERM');
  rmSync(userDataDir, { recursive: true, force: true });
}
