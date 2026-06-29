#!/usr/bin/env node
/**
 * Emart Competitor Price Checker v3
 *
 * Modes:
 *   Daily cron  — top 25 products by GSC impressions, saves JSON + Telegram + Sheets
 *   Brand mode  — all products for a brand, shows every competitor site's price
 *
 * Run (daily):  NODE_PATH=/usr/lib/node_modules node competitor_price_checker.js
 * Run (brand):  NODE_PATH=/usr/lib/node_modules node competitor_price_checker.js --brand "TIRTIR"
 * PM2 cron: daily 02:00 UTC (08:00 BD)
 */

'use strict';

const { chromium } = require('playwright');
const https  = require('https');
const http   = require('http');
const fs     = require('fs');
const path   = require('path');

// ── CLI args ──────────────────────────────────────────────────────────────────

const _args           = process.argv.slice(2);
const _brandIdx       = _args.indexOf('--brand');
const _competitorIdx  = _args.indexOf('--competitor');
const BRAND_MODE      = _brandIdx !== -1;
const COMPETITOR_MODE = _competitorIdx !== -1;
const BRAND_FILTER      = BRAND_MODE      ? (_args[_brandIdx + 1]      || '').trim() : null;
const COMPETITOR_FILTER = COMPETITOR_MODE ? (_args[_competitorIdx + 1] || '').trim() : null;

// ── Config ────────────────────────────────────────────────────────────────────

const EMART_SITE   = 'https://e-mart.com.bd';
const UNDERCUT_PCT = 5;       // alert threshold %
const MAX_PRODUCTS = (BRAND_MODE || COMPETITOR_MODE) ? 50 : 25;
const YAHOO_PAUSE  = 4000;    // ms between Yahoo searches
const PAGE_PAUSE   = 2000;    // ms between product page visits
const TODAY        = new Date().toISOString().split('T')[0];
const _logTag      = BRAND_MODE      ? `brand-${(BRAND_FILTER||'unknown').replace(/[^a-z0-9]/gi,'-').toLowerCase()}`
                   : COMPETITOR_MODE ? `site-${(COMPETITOR_FILTER||'unknown').replace(/[^a-z0-9]/gi,'-').toLowerCase()}`
                   : 'competitor';
const LOG_FILE     = `/var/www/emart-platform/workspace/audit/active/${_logTag}-${TODAY}.json`;

const COMPETITOR_DOMAINS = [
  'shajgoj.com',
  'daraz.com.bd',
  'arogga.com',
  'beautybooth.com.bd',
  'thecityshop.com.bd',
  'lavista.com.bd',
  'gotimoy.com',
  'thekoreanmall.com',
  'thekoreanshop.com',
  'a1traders.com.bd',
  'skincarebd.com',
  'tekka.com.bd',
  'beautyline.com.bd',
  'emartway.com',
  'emartway.com.bd',
  'emartwayskincare.com.bd',
  'koreanmartbd.com',
  'rokomari.com',
  'epharma.com.bd',
  'thecosmeticsworldbd.com',
  'dearme.com.bd',
  'mumolifestyle.com',
  'belasea.com',
  'skincareshop.com.bd',
  'klassy.com.bd',
  // add more later
];

function readEnv(f) {
  try {
    return fs.readFileSync(f,'utf8').split('\n').reduce((a,l) => {
      const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) a[m[1]] = m[2].replace(/^['"]|['"]$/g,'');
      return a;
    }, {});
  } catch { return {}; }
}
const ENV      = { ...readEnv('/root/.openclaw/openclaw.env'), ...process.env };
const TG_TOKEN = ENV.TELEGRAM_BOT_TOKEN;
const TG_CHAT  = ENV.TELEGRAM_CHAT_ID;
// WC internal URL → public URL
const WOO_URL  = 'https://e-mart.com.bd';

// ── Google Sheets push ────────────────────────────────────────────────────────

async function pushToSheets(allResults, undercuts) {
  const webhookUrl = ENV.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('  SHEETS_WEBHOOK_URL not set — skipping Google Sheets push');
    return;
  }

  const payload = JSON.stringify({ date: TODAY, allResults, undercuts });

  // Google Apps Script flow:
  //   POST exec URL → 302 (script runs here) → redirect Location = echo URL
  //   GET echo URL  → {"success":true,...}
  return new Promise((resolve) => {
    try {
      const u    = new URL(webhookUrl);
      const body = Buffer.from(payload);

      // Step 1: POST to exec URL (script executes, returns 302)
      const req = https.request({
        hostname: u.hostname,
        path:     u.pathname + u.search,
        method:   'POST',
        headers:  { 'Content-Type': 'application/json', 'Content-Length': body.length },
      }, res => {
        res.resume(); // drain body
        if (res.statusCode === 302 && res.headers.location) {
          // Step 2: GET the echo URL to read the response
          const echoUrl = new URL(res.headers.location);
          https.get({ hostname: echoUrl.hostname, path: echoUrl.pathname + echoUrl.search }, echoRes => {
            let data = '';
            echoRes.on('data', d => { data += d; });
            echoRes.on('end', () => {
              try {
                const r = JSON.parse(data);
                if (r.success !== false) console.log(`  ✅ Google Sheets updated — ${allResults.length} rows`);
                else                    console.log(`  ⚠️  Sheets error: ${r.error}`);
              } catch {
                // 302 itself means script ran — treat as success
                console.log(`  ✅ Google Sheets updated — ${allResults.length} rows`);
              }
              resolve();
            });
          }).on('error', () => { console.log('  ✅ Sheets push sent (echo fetch failed but script ran)'); resolve(); });
        } else {
          console.log(`  Sheets unexpected status: ${res.statusCode}`);
          resolve();
        }
      });
      req.on('error', e => { console.log(`  Sheets push failed: ${e.message}`); resolve(); });
      req.write(body);
      req.end();
    } catch (e) {
      console.log(`  Sheets push error: ${e.message}`);
      resolve();
    }
  });
}

// ── Telegram ──────────────────────────────────────────────────────────────────

async function tg(text) {
  if (!TG_TOKEN || !TG_CHAT) return;
  const body = JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML' });
  return new Promise(r => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TG_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => { res.resume(); res.on('end', r); });
    req.on('error', r);
    req.write(body); req.end();
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function cleanBDTPrice(text) {
  // Extract numeric price from text like "৳1,200", "BDT 1200", "Tk 1,200", "1,200.00"
  const m = text.replace(/,/g,'').match(/[\d]+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function tokenize(str) {
  return str.toLowerCase()
    .replace(/[^\w\s]/g,' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !['the','for','and','with','price','buy','best','online','bangladesh','bd','shop','store','original'].includes(t));
}

function similarity(a, b) {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  const overlap = [...ta].filter(t => tb.has(t)).length;
  return overlap / Math.max(ta.size, tb.size);
}

// Extract the primary size/volume from a product name, e.g. "200ml", "50g", "1.5oz"
function extractSize(str) {
  const m = str.match(/\b(\d+(?:\.\d+)?)\s*(ml|g|oz|fl\.?\s*oz|mg|kg|l)\b/i);
  if (!m) return null;
  const unit = m[2].toLowerCase().replace(/\s/g, '').replace('fl.oz','floz').replace('floz','floz');
  return `${parseFloat(m[1])}${unit}`;
}

// Returns true when both names have sizes and they clearly differ (e.g. 20ml vs 200ml)
function sizeMismatch(emartName, competitorTitle) {
  const es = extractSize(emartName);
  const cs = extractSize(competitorTitle);
  if (!es || !cs) return false;   // can't determine — don't reject
  return es !== cs;
}

// ── WooCommerce product fetch ─────────────────────────────────────────────────

const { execSync } = require('child_process');

function wpFetchProductData(pid) {
  const price = execSync(
    `wp --path=/var/www/wordpress --allow-root post meta get ${pid} _price 2>/dev/null`,
    { encoding: 'utf8', timeout: 5000 }
  ).trim();

  const title = execSync(
    `wp --path=/var/www/wordpress --allow-root post list --post_type=product --post__in=${pid} --field=post_title --format=csv 2>/dev/null`,
    { encoding: 'utf8', timeout: 5000 }
  ).trim();

  const slug = execSync(
    `wp --path=/var/www/wordpress --allow-root post list --post_type=product --post__in=${pid} --field=post_name --format=csv 2>/dev/null`,
    { encoding: 'utf8', timeout: 5000 }
  ).trim();

  const brand = execSync(
    `wp --path=/var/www/wordpress --allow-root term list pa_brand --object_ids=${pid} --fields=name --format=csv 2>/dev/null | tail -1`,
    { encoding: 'utf8', timeout: 5000 }
  ).trim();

  return { price, title, slug, brand };
}

async function fetchEmartProducts() {
  if (BRAND_MODE) return fetchBrandProducts(BRAND_FILTER);

  const snapPath = '/var/www/emart-platform/workspace/audit/active/baseline-snapshot-2026-05-31.json';
  if (!fs.existsSync(snapPath)) throw new Error('No GSC snapshot found');

  const snap = JSON.parse(fs.readFileSync(snapPath));

  const topSlugs = Object.entries(snap.gsc_metrics || {})
    .filter(([s]) => s.startsWith('/shop/'))
    .map(([s, m]) => ({ slug: s.replace('/shop/',''), impressions: m.impressions || 0 }))
    .sort((a,b) => b.impressions - a.impressions)
    .slice(0, MAX_PRODUCTS)
    .map(e => e.slug);

  console.log(`Getting prices for ${topSlugs.length} top products via wp-cli…`);

  const products = [];
  for (const slug of topSlugs) {
    try {
      const idOut = execSync(
        `wp --path=/var/www/wordpress --allow-root post list --post_type=product --post_status=publish --name="${slug}" --field=ID --format=ids 2>/dev/null`,
        { encoding: 'utf8', timeout: 5000 }
      ).trim();
      if (!idOut) continue;
      const pid = idOut.split('\n')[0].trim();
      if (!pid || isNaN(pid)) continue;

      const { price, title, brand } = wpFetchProductData(pid);
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) continue;
      if (!title) continue;

      const nameTokens = tokenize(title)
        .filter(t => !/^\d+(ml|g|oz|mg|fl|gm)$/i.test(t))
        .slice(0, 5);
      const searchQ = [brand, ...nameTokens].filter(Boolean).join(' ').slice(0, 70);

      products.push({
        id: parseInt(pid), name: title, brand,
        price: parseFloat(price), slug,
        url: `${EMART_SITE}/shop/${slug}`,
        searchQ,
      });
    } catch { /* skip */ }
  }

  return products;
}

async function fetchBrandProducts(brandName) {
  if (!brandName) throw new Error('--brand requires a brand name, e.g. --brand "TIRTIR"');

  console.log(`\nBrand mode: fetching all published products for brand "${brandName}"…`);

  // Get all published product IDs for this brand term
  let pids = [];
  try {
    const raw = execSync(
      `wp --path=/var/www/wordpress --allow-root post list --post_type=product --post_status=publish --pa_brand="${brandName}" --field=ID --format=ids 2>/dev/null`,
      { encoding: 'utf8', timeout: 15000 }
    ).trim();
    pids = raw.split(/\s+/).filter(id => id && !isNaN(id));
  } catch {}

  // Fallback: search by term slug (lowercase, hyphenated)
  if (!pids.length) {
    try {
      const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const raw = execSync(
        `wp --path=/var/www/wordpress --allow-root post list --post_type=product --post_status=publish --pa_brand="${brandSlug}" --field=ID --format=ids 2>/dev/null`,
        { encoding: 'utf8', timeout: 15000 }
      ).trim();
      pids = raw.split(/\s+/).filter(id => id && !isNaN(id));
    } catch {}
  }

  if (!pids.length) throw new Error(`No published products found for brand "${brandName}". Check the exact brand name in WooCommerce (pa_brand taxonomy).`);

  console.log(`Found ${pids.length} products for ${brandName}. Fetching details…`);

  const products = [];
  for (const pid of pids.slice(0, MAX_PRODUCTS)) {
    try {
      const { price, title, slug, brand } = wpFetchProductData(pid);
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) continue;
      if (!title) continue;

      const nameTokens = tokenize(title)
        .filter(t => !/^\d+(ml|g|oz|mg|fl|gm)$/i.test(t))
        .slice(0, 5);
      const searchQ = [brandName, ...nameTokens].filter(Boolean).join(' ').slice(0, 70);

      products.push({
        id: parseInt(pid), name: title, brand: brand || brandName,
        price: parseFloat(price), slug,
        url: `${EMART_SITE}/shop/${slug}`,
        searchQ,
      });
    } catch { /* skip */ }
  }

  return products;
}

// ── Step 1: Yahoo Search → find competitor product URLs ───────────────────────

// Extracts all ৳ prices from a text string, returns sorted array
function parsePricesFromText(text) {
  const prices = [];
  // Match ৳1,200 / BDT 1200 / Tk 1,200 / Taka 1200
  const patterns = [
    /[৳৳]\s*([\d,]+(?:\.\d+)?)/g,
    /\bBDT\s*([\d,]+(?:\.\d+)?)/g,
    /\bTk\.?\s*([\d,]+(?:\.\d+)?)/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      const v = parseFloat(m[1].replace(/,/g, ''));
      if (v >= 50 && v <= 30000) prices.push(v);
    }
  }
  return [...new Set(prices)].sort((a, b) => a - b);
}

// Which competitor sites are mentioned in text?
const SITE_KEYWORDS = [
  ['shajgoj',           'shajgoj.com'],
  ['daraz',             'daraz.com.bd'],
  ['arogga',            'arogga.com'],
  ['chaldal',           'chaldal.com'],
  ['pickaboo',          'pickaboo.com'],
  ['beautybooth',       'beautybooth.com.bd'],
  ['koreanmartbd',      'koreanmartbd.co'],
  ['cityshop',          'thecityshop.com.bd'],
  ['lavista',           'lavista.com.bd'],
  ['gotimoy',           'gotimoy.com'],
  ['thekoreanmall',     'thekoreanmall.com'],
  ['thekoreanshop',     'thekoreanshop.com'],
  ['a1traders',         'a1traders.com.bd'],
  ['skincarebd',        'skincarebd.com'],
  ['tekka',             'tekka.com.bd'],
  ['beautyline',        'beautyline.com.bd'],
  ['emartwayskincare',  'emartwayskincare.com.bd'],
  ['emartway',          'emartway.com.bd'],
  ['koreanmartbd',      'koreanmartbd.com'],
  ['rokomari',          'rokomari.com'],
  ['epharma',           'epharma.com.bd'],
];

function mentionedSites(text) {
  const t = text.toLowerCase();
  return SITE_KEYWORDS.filter(([kw]) => t.includes(kw)).map(([, domain]) => domain);
}

async function yahooSearch(page, query) {
  const searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(query + ' price bangladesh')}&fr=yfp-t`;
  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(2500);

    const SKIP_URL = ['/tag/','/catalog/','/brand','/brands','/category/','/search','/shop?','/collection/','/seller/'];
    return await page.evaluate(({ domains, skip }) => {
      const items   = [];
      const sitePat = /shajgoj|daraz|arogga|chaldal|pickaboo|beautybooth|koreanmart|cityshop|lavista|gotimoy|koreanmall|koreanshop|a1traders|skincarebd|tekka|beautyline|emartway|rokomari|epharma/i;
      const pricePat = /[৳৳]|BDT\s*\d|Tk\.?\s*\d/i;

      document.querySelectorAll('#web li, .dd').forEach(li => {
        const anchor    = li.querySelector('.compTitle a, h3 a, h4 a');
        const snippetEl = li.querySelector('.compText, .dd-desc, p, [class*="abstract"]');
        if (!anchor) return;

        const title    = anchor.textContent.trim().slice(0, 120);
        const snippet  = snippetEl?.textContent?.trim() || '';
        const combined = title + ' ' + snippet;

        // Decode Yahoo redirect URL
        const fullHref = anchor.href || '';  // use .href not getAttribute for full URL
        const ruMatch  = fullHref.match(/\/RU=([^/]+)\//);
        let actualUrl  = ruMatch ? decodeURIComponent(ruMatch[1]) : fullHref;
        let domain = '';
        try { domain = new URL(actualUrl.startsWith('http') ? actualUrl : 'https://' + actualUrl).hostname.replace(/^www\./, ''); } catch {}

        const isDirect  = domains.some(d => domain.includes(d));
        const isSkipUrl = skip.some(p => actualUrl.includes(p));
        const pathDepth = (actualUrl.split('?')[0].match(/\//g) || []).length;
        const hasPrice  = pricePat.test(combined);
        const hasSite   = sitePat.test(combined);

        if (isDirect && !isSkipUrl && pathDepth >= 4) {
          items.push({ domain, url: actualUrl, title, snippet, combined, isDirect: true });
        } else if (!isDirect && hasPrice && hasSite) {
          items.push({ domain: '', url: actualUrl, title, snippet, combined, isDirect: false });
        }
      });
      // Deduplicate by URL
      const seen = new Set();
      return items.filter(i => { if (seen.has(i.url)) return false; seen.add(i.url); return true; }).slice(0, 8);
    }, { domains: COMPETITOR_DOMAINS, skip: SKIP_URL });

  } catch (e) {
    console.log(`  Yahoo error: ${e.message}`);
    return [];
  }
}

// ── Step 2: Visit competitor page → extract price ─────────────────────────────

async function extractShajgojPrice(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await sleep(1500);
    return await page.evaluate(() => {
      // Try multiple Shajgoj price selectors
      const candidates = [
        '.product-price .price', '.price-box .price',
        '[class*="ProductPrice"]', '[class*="product-price"]',
        '[class*="salePrice"]', '[class*="sale-price"]',
        '.woocommerce-Price-amount', '.price ins, .price',
      ];
      for (const sel of candidates) {
        const el = document.querySelector(sel);
        if (el) {
          const text = el.textContent.trim();
          if (/\d/.test(text)) return text;
        }
      }
      // Last resort: find any element with BDT/৳ and a number
      const allText = document.body.innerText;
      const m = allText.match(/(?:৳|BDT|Tk\.?)\s*([\d,]+)/);
      return m ? m[0] : null;
    });
  } catch { return null; }
}

async function extractDarazPrice(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(2500); // Daraz needs more JS time
    return await page.evaluate(() => {
      const candidates = [
        '[class*="pdp-price"] strong', '[class*="pdp-price"]',
        '.pdp-price_type_normal', '[class*="price-module"]',
        '[class*="price--pdp"]', '.price .current',
        '[data-spm="price"] strong',
      ];
      for (const sel of candidates) {
        const el = document.querySelector(sel);
        if (el) {
          const text = el.textContent.trim();
          if (/\d/.test(text)) return text;
        }
      }
      // Try JSON-LD
      const ld = document.querySelector('script[type="application/ld+json"]');
      if (ld) {
        try {
          const d = JSON.parse(ld.textContent);
          const price = d?.offers?.price || d?.price;
          if (price) return String(price);
        } catch {}
      }
      const m = document.body.innerText.match(/(?:৳|BDT|Tk\.?)\s*([\d,]+)/);
      return m ? m[0] : null;
    });
  } catch { return null; }
}

async function extractGenericPrice(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await sleep(2000);
    return await page.evaluate(() => {
      // Generic price extractor — works on most BD e-commerce sites
      const selectors = [
        // Common price selectors across BD sites
        '[class*="price"][class*="sale"]', '[class*="sale"][class*="price"]',
        '[class*="current-price"]', '[class*="product-price"]',
        '[class*="regular-price"]', '[class*="offer-price"]',
        '.price-wrapper', '.price strong', '.price span',
        '[itemprop="price"]', '[data-price]',
        // Arogga specific
        '.product-price', '.price-box', '[class*="discounted"]',
        // epharma specific
        '.offer-price', '.market-price',
        // rokomari specific
        '.bn-price', '.price-box',
        // generic fallback
        'h1 + * [class*="price"]', 'h2 + * [class*="price"]',
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && /\d{3,}/.test(el.textContent)) return el.textContent.trim().slice(0, 30);
      }
      // Last resort: scan page text for BDT price near top of page
      const bodyText = document.body.innerText.slice(0, 3000);
      const m = bodyText.match(/(?:৳|৳|BDT|Tk\.?)\s*([\d,]{3,7})/);
      return m ? m[0] : null;
    });
  } catch { return null; }
}

async function extractPrice(page, url, domain) {
  if (domain.includes('shajgoj')) return extractShajgojPrice(page, url);
  if (domain.includes('daraz'))   return extractDarazPrice(page, url);
  return extractGenericPrice(page, url);  // covers arogga, epharma, rokomari, others
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const modeLabel = BRAND_MODE      ? `Brand: ${BRAND_FILTER}`
                  : COMPETITOR_MODE ? `Site: ${COMPETITOR_FILTER}`
                  : 'Daily Top Products';
  console.log(`\n=== Competitor Price Check — ${TODAY} [${modeLabel}] ===`);

  // Fetch Emart products
  let products;
  try {
    products = await fetchEmartProducts();
    console.log(`Loaded ${products.length} Emart products to check\n`);
  } catch (e) {
    console.error('Product fetch failed:', e.message);
    await tg(`❌ Competitor check failed: ${e.message}`);
    return;
  }

  if (!products.length) {
    console.log('No products to check'); return;
  }

  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'en-US',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  });
  const page = await context.newPage();

  const allResults = [];
  const undercuts  = [];
  let checked = 0, noMatch = 0;

  for (const product of products) {
    checked++;
    console.log(`[${checked}/${products.length}] ${product.name.slice(0,55)}`);
    console.log(`  Emart: ৳${product.price}  |  Search: "${product.searchQ}"`);

    await sleep(YAHOO_PAUSE);

    // Yahoo search for competitor URLs
    const competitorLinks = await yahooSearch(page, product.searchQ);
    if (!competitorLinks.length) {
      console.log('  ⚪ No competitor results found on Yahoo');
      noMatch++;
      continue;
    }

    const priceFinds = [];

    for (const result of competitorLinks) {
      // ── Strategy A: Parse prices from snippet (ThinkBengal, price comparison sites) ──
      if (!result.isDirect) {
        const prices = parsePricesFromText(result.combined);
        const sites  = mentionedSites(result.combined);
        if (prices.length && sites.length) {
          const minPrice = prices[0];
          console.log(`  📰 Snippet: "${result.title.slice(0,55)}"`);
          console.log(`     Prices in snippet: ${prices.map(p=>'৳'+p).join(', ')} on ${sites.join(', ')}`);
          const diff    = product.price - minPrice;
          const diffPct = diff / product.price * 100;
          priceFinds.push({
            domain:    sites[0],
            url:       result.url,
            price:     minPrice,
            source:    'snippet',
            allPrices: prices,
            allSites:  sites,
            title:     result.title,
            diff:      Math.round(diff),
            diffPct:   Math.round(diffPct * 10) / 10,
            undercut:  diffPct >= UNDERCUT_PCT,
          });
        }
        continue;
      }

      // ── Strategy B: Visit direct competitor product page ─────────────────────────────
      const url = result.url;
      // Skip known non-product URL patterns (tag/category/search/brand pages)
      const SKIP_PATTERNS = ['/tag/', '/catalog/', '/brand/', '/category/', '/search', '/shop?', '/collection/'];
      const isSkipURL = SKIP_PATTERNS.some(p => url.includes(p));
      // Must have a meaningful path (not just root or one level)
      const pathDepth = (url.split('?')[0].match(/\//g) || []).length;
      const isProductPage = !isSkipURL && pathDepth >= 4;

      if (!isProductPage) {
        console.log(`  Skip category/tag URL: ${url.slice(0,70)}`);
        continue;
      }

      const sim = similarity(product.name, result.title);
      if (sim < 0.25 && !result.title.toLowerCase().includes(product.brand.toLowerCase())) {
        console.log(`  Skip low-match (${sim.toFixed(2)}): ${result.title.slice(0,50)}`);
        continue;
      }

      // Size guard — reject if the competitor page clearly shows a different size
      if (sizeMismatch(product.name, result.title)) {
        const es = extractSize(product.name);
        const cs = extractSize(result.title);
        console.log(`  Skip size mismatch: ours ${es} vs their ${cs} — "${result.title.slice(0,50)}"`);
        continue;
      }

      // Competitor-mode filter — only visit results from the target domain
      if (COMPETITOR_MODE && !result.domain.includes(COMPETITOR_FILTER)) {
        continue;
      }

      console.log(`  Visiting ${result.domain}: ${url.slice(0,70)}`);
      await sleep(PAGE_PAUSE);

      const rawPrice = await extractPrice(page, url, result.domain);
      if (!rawPrice) { console.log(`  ⚠️  No price`); continue; }
      const price = cleanBDTPrice(rawPrice);
      if (!price || price < 100 || price > 25000) { console.log(`  ⚠️  Bad price: "${rawPrice}"`); continue; }

      const diff    = product.price - price;
      const diffPct = diff / product.price * 100;
      console.log(`  ✅ ${result.domain}: ৳${price}`);
      priceFinds.push({
        domain: result.domain, url, price, source: 'page',
        title: result.title, diff: Math.round(diff),
        diffPct: Math.round(diffPct * 10) / 10,
        undercut: diffPct >= UNDERCUT_PCT,
      });
    }

    if (!priceFinds.length) { noMatch++; continue; }

    // Cheapest competitor
    const cheapest = priceFinds.filter(f => f.price > 0).sort((a,b) => a.price - b.price)[0];
    if (!cheapest) { noMatch++; continue; }

    // Flag suspicious prices (>70% cheaper likely a bad extract or counterfeit)
    if (cheapest.diffPct > 70) {
      console.log(`  ⚠️  SUSPICIOUS: ${cheapest.domain} ৳${cheapest.price} is ${cheapest.diffPct}% cheaper — flagging for manual review`);
      cheapest.suspicious = true;
    }

    const entry = {
      emart:    { name: product.name, price: product.price, url: product.url },
      cheapest,
      allFinds: priceFinds,
    };
    allResults.push(entry);
    if (cheapest.undercut && !cheapest.suspicious) {
      undercuts.push(entry);
      console.log(`  🔴 UNDERCUT: ${cheapest.domain} ৳${cheapest.price} (${cheapest.diffPct}% cheaper than Emart ৳${product.price})`);
    } else if (cheapest.suspicious) {
      console.log(`  ❓ SUSPICIOUS price — verify manually: ${cheapest.domain} ৳${cheapest.price}`);
    } else {
      console.log(`  ✅ Competitive. Cheapest: ৳${cheapest.price} on ${cheapest.domain}`);
    }
  }

  await browser.close();

  // Save JSON
  fs.writeFileSync(LOG_FILE, JSON.stringify({ date: TODAY, mode: BRAND_MODE ? 'brand' : COMPETITOR_MODE ? 'competitor' : 'daily', filter: BRAND_FILTER || COMPETITOR_FILTER || null, allResults, undercuts }, null, 2));
  console.log(`\nSaved: ${LOG_FILE}`);

  if (BRAND_MODE || COMPETITOR_MODE) {
    // ── Brand / competitor-site report ──────────────────────────────────────────
    const label = BRAND_MODE ? `Brand: ${BRAND_FILTER}` : `Site: ${COMPETITOR_FILTER}`;

    // Print full per-product table with ALL competitor sites
    console.log(`\n${'━'.repeat(60)}`);
    console.log(`${label} — ${TODAY}`);
    console.log(`Products checked: ${checked}  |  With competitor prices: ${allResults.length}  |  Undercuts: ${undercuts.length}`);
    console.log('━'.repeat(60));
    for (const r of allResults) {
      const e = r.emart;
      const status = r.cheapest?.undercut && !r.cheapest?.suspicious ? '🔴' : r.cheapest?.suspicious ? '❓' : '✅';
      console.log(`\n${status} ${e.name}`);
      console.log(`   Emart: ৳${e.price}  |  ${e.url}`);
      for (const f of r.allFinds) {
        const arrow = f.undercut ? '🔴' : f.suspicious ? '❓' : '  ';
        const diff  = f.diff >= 0 ? `৳${f.diff} more` : `৳${Math.abs(f.diff)} less`;
        console.log(`   ${arrow} ${f.domain.padEnd(28)} ৳${f.price}  (${diff}, ${f.diffPct > 0 ? 'competitor cheaper' : 'we are cheaper'})  [${f.source}]`);
      }
    }
    console.log('\n' + '━'.repeat(60));

    // Telegram: compact brand/site summary
    const headerLine = BRAND_MODE
      ? `💰 <b>${BRAND_FILTER} — Competitor Prices</b> — ${TODAY}`
      : `🔍 <b>${COMPETITOR_FILTER} — Price Comparison</b> — ${TODAY}`;

    const lines = allResults.slice(0, 15).map(r => {
      const e = r.emart;
      const siteLines = r.allFinds.map(f => {
        const icon = f.undercut && !f.suspicious ? '🔴' : f.suspicious ? '❓' : '✅';
        return `   ${icon} ${f.domain}: ৳${f.price}`;
      }).join('\n');
      return `<b>${e.name.slice(0,50)}</b>\n   Emart: ৳${e.price}\n${siteLines}`;
    }).join('\n\n');

    const msg = `${headerLine}\n`
      + `Checked ${checked} products, ${undercuts.length} undercut(s)\n\n`
      + lines
      + (allResults.length > 15 ? `\n\n<i>…and ${allResults.length - 15} more. Full report: ${LOG_FILE}</i>` : '');
    await tg(msg);

  } else {
    // ── Daily report ─────────────────────────────────────────────────────────────
    console.log('Pushing to Google Sheets...');
    await pushToSheets(allResults, undercuts);

    if (!undercuts.length) {
      const msg = `✅ <b>Competitor Price Check — ${TODAY}</b>\n\n`
        + `Checked ${checked} products (${noMatch} no match found)\n`
        + `🟢 No undercuts — Emart prices are competitive!`;
      await tg(msg);
    } else {
      const lines = undercuts.slice(0, 8).map(u => {
        const src = u.cheapest.source === 'snippet'
          ? `via snippet (${u.cheapest.allSites?.join(', ') || u.cheapest.domain})`
          : u.cheapest.domain;
        const allPrices = u.cheapest.allPrices?.length > 1
          ? ` (range: ৳${u.cheapest.allPrices.join('–')})` : '';
        return `🔴 <b>${u.emart.name.slice(0,45)}</b>\n`
          + `   Emart ৳${u.emart.price} → competitor ৳${u.cheapest.price}${allPrices}\n`
          + `   📍 ${src} (${Math.abs(u.cheapest.diffPct)}% cheaper)\n`
          + `   <a href="${u.emart.url}">Emart PDP</a>`;
      }).join('\n\n');

      const suspicious = allResults.filter(r => r.cheapest?.suspicious);
      const suspLines  = suspicious.slice(0, 4).map(u =>
        `❓ <b>${u.emart.name.slice(0,40)}</b> — ${u.cheapest.domain} ৳${u.cheapest.price} (verify manually)`
      ).join('\n');

      const msg = `🔴 <b>Price Undercut Alert — ${TODAY}</b>\n\n`
        + `${undercuts.length} confirmed undercut(s):\n\n${lines}\n\n`
        + (suspicious.length ? `\n❓ <b>Suspicious prices (verify):</b>\n${suspLines}\n\n` : '')
        + `<i>Checked ${checked} products, ${noMatch} no match found</i>`;
      await tg(msg);
    }
  }

  console.log(`\n=== Done: ${checked} checked | ${undercuts.length} undercuts | ${noMatch} no match ===`);
}

main().catch(async e => {
  console.error('FATAL:', e.message);
  await tg(`❌ Competitor check crashed: ${e.message.slice(0,200)}`);
  process.exit(1);
});
