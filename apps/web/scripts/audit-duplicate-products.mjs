#!/usr/bin/env node
/**
 * Read-only WooCommerce duplicate product audit for e-mart.com.bd.
 *
 * Duplicate definition:
 *   same normalized brand + same normalized product/base name + exact normalized size.
 *
 * This script does NOT edit, delete, merge, or update products. It only reads WooCommerce
 * products and writes CSV/JSON audit files.
 *
 * Run from apps/web:
 *   npm run audit:duplicates
 *
 * Optional:
 *   node scripts/audit-duplicate-products.mjs --status publish --out ../../workspace/audit/active/duplicate-products.csv
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const PUBLIC_SITE_URL = 'https://e-mart.com.bd';
const DEFAULT_PER_PAGE = 100;
const DEFAULT_MAX_PAGES = 1000;

function parseArgs(argv) {
  const args = {
    status: 'publish',
    perPage: DEFAULT_PER_PAGE,
    maxPages: DEFAULT_MAX_PAGES,
    out: '',
    jsonOut: '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--status' && next) {
      args.status = next;
      i += 1;
    } else if (arg === '--per-page' && next) {
      args.perPage = Math.min(Number(next) || DEFAULT_PER_PAGE, 100);
      i += 1;
    } else if (arg === '--max-pages' && next) {
      args.maxPages = Number(next) || DEFAULT_MAX_PAGES;
      i += 1;
    } else if (arg === '--out' && next) {
      args.out = next;
      i += 1;
    } else if (arg === '--json-out' && next) {
      args.jsonOut = next;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      printHelpAndExit();
    }
  }

  return args;
}

function printHelpAndExit() {
  console.log(`Usage:
  npm run audit:duplicates
  node scripts/audit-duplicate-products.mjs [options]

Options:
  --status publish|any     Product status to audit. Default: publish
  --per-page 100           WooCommerce page size. Max: 100
  --max-pages 1000         Safety limit for pagination
  --out <file.csv>         CSV output path
  --json-out <file.json>   JSON output path

Required env:
  WOO_CONSUMER_KEY
  WOO_CONSUMER_SECRET

Optional env:
  WOO_INTERNAL_URL, NEXT_PUBLIC_WOO_URL
`);
  process.exit(0);
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const body = fs.readFileSync(filePath, 'utf8');
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    let value = rawValue.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function findRepoRoot(startDir) {
  let current = path.resolve(startDir);
  for (let i = 0; i < 8; i += 1) {
    if (fs.existsSync(path.join(current, '.git')) || fs.existsSync(path.join(current, 'apps', 'web'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return path.resolve(startDir, '..', '..');
}

function loadLocalEnv() {
  const cwd = process.cwd();
  loadEnvFile(path.join(cwd, '.env.local'));
  loadEnvFile(path.join(cwd, '.env'));
  loadEnvFile(path.join(cwd, '..', '..', '.env.local'));
  loadEnvFile(path.join(cwd, '..', '..', '.env'));
}

function normalizeSpace(value) {
  return String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/\u00a0/g, ' ')
    .replace(/[×✕]/g, 'x')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKey(value) {
  return normalizeSpace(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9.%+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUnit(unit) {
  const u = String(unit || '').toLowerCase().replace(/[.\s]/g, '');
  if (u === 'milliliter' || u === 'millilitre' || u === 'ml') return 'ml';
  if (u === 'liter' || u === 'litre' || u === 'l') return 'l';
  if (u === 'gram' || u === 'grams' || u === 'gm' || u === 'g') return 'g';
  if (u === 'kilogram' || u === 'kilograms' || u === 'kg') return 'kg';
  if (u === 'mg' || u === 'milligram' || u === 'milligrams') return 'mg';
  if (u === 'floz' || u === 'flounce' || u === 'flounces') return 'fl oz';
  if (u === 'pc' || u === 'pcs' || u === 'piece' || u === 'pieces') return 'pcs';
  if (u === 'tablet' || u === 'tablets' || u === 'tab' || u === 'tabs') return 'tablets';
  if (u === 'capsule' || u === 'capsules' || u === 'cap' || u === 'caps') return 'capsules';
  if (u === 'sheet' || u === 'sheets') return 'sheets';
  if (u === 'pad' || u === 'pads') return 'pads';
  if (u === 'patch' || u === 'patches') return 'patches';
  if (u === 'wipe' || u === 'wipes') return 'wipes';
  if (u === 'pair' || u === 'pairs') return 'pairs';
  return u;
}

function normalizeNumber(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return String(num);
  return Number.isInteger(n) ? String(n) : String(n).replace(/0+$/, '').replace(/\.$/, '');
}

const unitPattern = '(?:fl\\.?\\s*oz|ml|milliliters?|millilitres?|l|liters?|litres?|g|gm|grams?|kg|kilograms?|mg|milligrams?|pcs?|pieces?|tablets?|tabs?|capsules?|caps?|sheets?|pads?|patches?|wipes?|pairs?)';

function sizePatterns() {
  return [
    new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${unitPattern})\\s*(?:x|\\*)\\s*(\\d+)\\s*(tablets?|tabs?|capsules?|caps?|pcs?|pieces?|sheets?|pads?|patches?|wipes?)`, 'gi'),
    new RegExp(`(\\d+)\\s*(tablets?|tabs?|capsules?|caps?|pcs?|pieces?|sheets?|pads?|patches?|wipes?)\\s*(?:x|\\*)\\s*(\\d+(?:\\.\\d+)?)\\s*(${unitPattern})`, 'gi'),
    new RegExp(`(\\d+)\\s*(?:x|\\*)\\s*(\\d+(?:\\.\\d+)?)\\s*(${unitPattern})`, 'gi'),
    new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${unitPattern})\\s*(?:x|\\*)\\s*(\\d+)`, 'gi'),
    new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${unitPattern})`, 'gi'),
  ];
}

function extractSize(name) {
  const text = normalizeSpace(name);
  const matches = [];

  for (const pattern of sizePatterns()) {
    for (const match of text.matchAll(pattern)) {
      const full = match[0];
      let normalized = '';
      if (match.length === 5 && /^(tablet|tab|capsule|cap|pc|piece|sheet|pad|patch|wipe)/i.test(match[2])) {
        normalized = `${normalizeNumber(match[1])} ${normalizeUnit(match[2])} x ${normalizeNumber(match[3])}${normalizeUnit(match[4])}`;
      } else if (match.length === 5) {
        normalized = `${normalizeNumber(match[1])}${normalizeUnit(match[2])} x ${normalizeNumber(match[3])} ${normalizeUnit(match[4])}`;
      } else if (match.length === 4 && /^\d+$/.test(match[1]) && !/[a-z]/i.test(match[1])) {
        normalized = `${normalizeNumber(match[1])} x ${normalizeNumber(match[2])}${normalizeUnit(match[3])}`;
      } else if (match.length === 4) {
        normalized = `${normalizeNumber(match[1])}${normalizeUnit(match[2])} x ${normalizeNumber(match[3])}`;
      } else if (match.length === 3) {
        normalized = `${normalizeNumber(match[1])}${normalizeUnit(match[2])}`;
      }
      matches.push({ full, normalized, index: match.index || 0 });
    }
    if (matches.length) break;
  }

  if (!matches.length) return { display: '', key: '', raw: '' };
  const selected = matches.sort((a, b) => a.index - b.index).at(-1);
  return {
    display: selected.normalized,
    key: normalizeKey(selected.normalized),
    raw: selected.full,
  };
}

function stripSizeFromName(name) {
  let result = normalizeSpace(name);
  for (const pattern of sizePatterns()) {
    result = result.replace(pattern, ' ');
  }
  return normalizeSpace(result);
}

function getProductBrand(product) {
  if (Array.isArray(product.brands) && product.brands.length) {
    const brands = product.brands
      .map((brand) => normalizeSpace(brand?.name || brand?.slug || ''))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    if (brands.length) return { display: brands.join(' + '), key: brands.map(normalizeKey).join('+'), source: 'brands' };
  }

  if (Array.isArray(product.attributes)) {
    const brandAttr = product.attributes.find((attribute) => {
      const name = normalizeKey(attribute?.name || '');
      return ['brand', 'brands', 'pa brand', 'product brand'].includes(name);
    });
    const options = Array.isArray(brandAttr?.options) ? brandAttr.options.map(normalizeSpace).filter(Boolean) : [];
    if (options.length) return { display: options.sort().join(' + '), key: options.map(normalizeKey).sort().join('+'), source: 'attribute' };
  }

  if (Array.isArray(product.meta_data)) {
    const brandMeta = product.meta_data.find((meta) => ['_brand_name', 'brand', 'brand_name'].includes(String(meta?.key || '').toLowerCase()));
    const value = normalizeSpace(brandMeta?.value || '');
    if (value) return { display: value, key: normalizeKey(value), source: 'meta' };
  }

  return { display: '', key: '', source: 'missing' };
}

function buildBaseName(productName, brandDisplay) {
  let base = stripSizeFromName(productName);
  if (brandDisplay) {
    for (const part of brandDisplay.split('+').map((item) => normalizeSpace(item))) {
      if (!part) continue;
      const brandRegex = new RegExp(`(^|\\s)${escapeRegex(part)}(?=\\s|$)`, 'i');
      base = base.replace(brandRegex, ' ');
    }
  }
  base = base
    .replace(/\b(price|in|bangladesh|bd|original|authentic|buy|online)\b/gi, ' ')
    .replace(/[()[\]{}|,/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { display: base, key: normalizeKey(base) };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function productUrl(product) {
  if (product.permalink) return product.permalink;
  if (product.slug) return `${PUBLIC_SITE_URL}/product/${product.slug}/`;
  return '';
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(filePath, rows) {
  const header = [
    'group_key',
    'group_size',
    'recommended_action',
    'brand',
    'normalized_product_name',
    'size',
    'product_id',
    'sku',
    'product_name',
    'slug',
    'url',
    'price',
    'regular_price',
    'sale_price',
    'stock_status',
    'brand_source',
  ];

  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push(header.map((key) => csvEscape(row[key])).join(','));
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function buildWooUrl(baseUrl, endpoint, params) {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const url = new URL(`${cleanBase}/wp-json/wc/v3${endpoint}`);
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url;
}

async function wooGet(endpoint, params = {}) {
  const baseUrl = process.env.WOO_INTERNAL_URL || process.env.NEXT_PUBLIC_WOO_URL || PUBLIC_SITE_URL;
  const consumerKey = process.env.WOO_CONSUMER_KEY || '';
  const consumerSecret = process.env.WOO_CONSUMER_SECRET || '';

  if (!consumerKey || !consumerSecret) {
    throw new Error('Missing WOO_CONSUMER_KEY or WOO_CONSUMER_SECRET. Put them in apps/web/.env.local on the VPS.');
  }

  const url = buildWooUrl(baseUrl, endpoint, {
    ...params,
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
  });

  const headers = {};
  if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
    headers.Host = 'e-mart.com.bd';
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`WooCommerce GET ${endpoint} failed: ${response.status} ${response.statusText} ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  return {
    data,
    total: Number(response.headers.get('x-wp-total') || 0),
    totalPages: Number(response.headers.get('x-wp-totalpages') || 0),
  };
}

async function fetchAllProducts({ status, perPage, maxPages }) {
  const allProducts = [];
  let total = 0;
  let totalPages = 0;

  for (let page = 1; page <= maxPages; page += 1) {
    const result = await wooGet('/products', {
      status,
      page,
      per_page: perPage,
      orderby: 'id',
      order: 'asc',
    });

    const products = Array.isArray(result.data) ? result.data : [];
    total = result.total || total;
    totalPages = result.totalPages || totalPages;
    allProducts.push(...products);

    console.log(`[audit] fetched page ${page}/${totalPages || '?'} (${allProducts.length}/${total || '?'})`);

    if (!products.length || (totalPages && page >= totalPages)) break;
  }

  return { products: allProducts, total, totalPages };
}

function auditProducts(products) {
  const groups = new Map();
  const skipped = [];

  for (const product of products) {
    const name = normalizeSpace(product.name || '');
    const brand = getProductBrand(product);
    const size = extractSize(name);
    const baseName = buildBaseName(name, brand.display);

    const auditRow = {
      id: product.id,
      sku: product.sku || '',
      name,
      slug: product.slug || '',
      url: productUrl(product),
      price: product.price || '',
      regular_price: product.regular_price || '',
      sale_price: product.sale_price || '',
      stock_status: product.stock_status || '',
      brand_display: brand.display,
      brand_key: brand.key,
      brand_source: brand.source,
      size_display: size.display,
      size_key: size.key,
      size_raw: size.raw,
      base_display: baseName.display,
      base_key: baseName.key,
    };

    if (!brand.key || !size.key || !baseName.key) {
      skipped.push({
        ...auditRow,
        reason: !brand.key ? 'missing_brand' : !size.key ? 'missing_size' : 'missing_base_name',
      });
      continue;
    }

    const key = `${brand.key}||${baseName.key}||${size.key}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(auditRow);
  }

  const duplicateGroups = [...groups.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => ({ key, items }))
    .sort((a, b) => b.items.length - a.items.length || a.items[0].brand_display.localeCompare(b.items[0].brand_display));

  return { duplicateGroups, skipped };
}

function buildDuplicateRows(duplicateGroups) {
  const rows = [];
  for (const group of duplicateGroups) {
    const sortedItems = [...group.items].sort((a, b) => Number(a.id) - Number(b.id));
    for (let index = 0; index < sortedItems.length; index += 1) {
      const item = sortedItems[index];
      rows.push({
        group_key: group.key,
        group_size: sortedItems.length,
        recommended_action: index === 0 ? 'keep_candidate_oldest_id_review_first' : 'duplicate_candidate_review_delete_or_merge',
        brand: item.brand_display,
        normalized_product_name: item.base_display,
        size: item.size_display,
        product_id: item.id,
        sku: item.sku,
        product_name: item.name,
        slug: item.slug,
        url: item.url,
        price: item.price,
        regular_price: item.regular_price,
        sale_price: item.sale_price,
        stock_status: item.stock_status,
        brand_source: item.brand_source,
      });
    }
  }
  return rows;
}

function defaultOutputPaths(repoRoot) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outDir = path.join(repoRoot, 'workspace', 'audit', 'active');
  return {
    csv: path.join(outDir, `duplicate-products-brand-size-audit-${stamp}.csv`),
    json: path.join(outDir, `duplicate-products-brand-size-audit-${stamp}.json`),
  };
}

async function main() {
  loadLocalEnv();
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findRepoRoot(process.cwd());
  const defaults = defaultOutputPaths(repoRoot);
  const csvPath = path.resolve(args.out || defaults.csv);
  const jsonPath = path.resolve(args.jsonOut || defaults.json);

  console.log('[audit] starting read-only duplicate audit');
  console.log(`[audit] status=${args.status} per_page=${args.perPage}`);

  const { products, total, totalPages } = await fetchAllProducts(args);
  const { duplicateGroups, skipped } = auditProducts(products);
  const rows = buildDuplicateRows(duplicateGroups);

  const duplicateItemsInGroups = duplicateGroups.reduce((sum, group) => sum + group.items.length, 0);
  const extraDuplicateItems = duplicateGroups.reduce((sum, group) => sum + Math.max(0, group.items.length - 1), 0);
  const missingBrandCount = skipped.filter((item) => item.reason === 'missing_brand').length;
  const missingSizeCount = skipped.filter((item) => item.reason === 'missing_size').length;

  const summary = {
    audited_at: new Date().toISOString(),
    status: args.status,
    total_header_count: total,
    total_pages: totalPages,
    total_products_checked: products.length,
    duplicate_groups: duplicateGroups.length,
    duplicate_product_items_in_groups: duplicateItemsInGroups,
    extra_duplicate_items_after_keep_one: extraDuplicateItems,
    skipped_missing_brand: missingBrandCount,
    skipped_missing_size: missingSizeCount,
    csv: csvPath,
    json: jsonPath,
    duplicate_groups_detail: duplicateGroups.map((group) => ({
      group_key: group.key,
      brand: group.items[0]?.brand_display || '',
      normalized_product_name: group.items[0]?.base_display || '',
      size: group.items[0]?.size_display || '',
      product_ids: group.items.map((item) => item.id),
      urls: group.items.map((item) => item.url),
      prices: group.items.map((item) => item.price),
    })),
  };

  writeCsv(csvPath, rows);
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  console.log('\n=== DUPLICATE AUDIT SUMMARY ===');
  console.log(`Total products checked: ${summary.total_products_checked}`);
  console.log(`Duplicate groups: ${summary.duplicate_groups}`);
  console.log(`Duplicate product items in groups: ${summary.duplicate_product_items_in_groups}`);
  console.log(`Extra duplicate items after keeping one from each group: ${summary.extra_duplicate_items_after_keep_one}`);
  console.log(`Skipped missing brand: ${summary.skipped_missing_brand}`);
  console.log(`Skipped missing size: ${summary.skipped_missing_size}`);
  console.log(`CSV: ${summary.csv}`);
  console.log(`JSON: ${summary.json}`);
}

main().catch((error) => {
  console.error('[audit] failed:', error.message || error);
  process.exit(1);
});
