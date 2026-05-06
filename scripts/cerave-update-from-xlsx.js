#!/usr/bin/env node

const { execFileSync } = require('node:child_process');
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INPUT_XLSX = process.env.INPUT_XLSX || path.join(ROOT, 'cerave_update_plan.xlsx');
const DRY_RUN_REPORT = process.env.DRY_RUN_REPORT || path.join(ROOT, 'cerave_dry_run_report.csv');
const MANUAL_REVIEW_REPORT = process.env.MANUAL_REVIEW_REPORT || path.join(ROOT, 'cerave_manual_review.csv');
const ADD_TO_EMART_REPORT = process.env.ADD_TO_EMART_REPORT || path.join(ROOT, 'cerave_add_to_emart.csv');
const args = new Set(process.argv.slice(2));
const APPLY = process.env.APPLY === 'true' || args.has('--apply');
const DRY_RUN = !APPLY;
const CONFIRM_DRY_RUN_REVIEWED = process.env.CONFIRM_DRY_RUN_REVIEWED === 'true' || args.has('--confirm-dry-run-reviewed');
const CLEAR_SALE_PRICE = process.env.CLEAR_SALE_PRICE === 'true' || args.has('--clear-sale-price');
const CLEAR_SALE_PRICE_ALL_MATCHED = process.env.CLEAR_SALE_PRICE_ALL_MATCHED === 'true' || args.has('--clear-sale-price-all-matched');
const PRICE_HIGH_LIMIT = Number(process.env.CERAVE_PRICE_HIGH_LIMIT || 50000);
const PAGE_SIZE = Number(process.env.WOO_PAGE_SIZE || 100);

loadEnv(path.join(ROOT, 'apps/web/.env.local'));

const WOO_URL = stripTrailingSlash(
  process.env.WOO_INTERNAL_URL || 'http://127.0.0.1',
);
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY || '';
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET || '';

const PRICE_ACTIONS = new Set([
  'UPDATE_PRICE_TO_EMARTWAY',
  'UPDATE_PRICE_TO_LISTED_VALUE',
  'UPDATE_PRICE_TO_USER_LISTED_VALUE',
]);

const REPORT_COLUMNS = [
  'row_id',
  'product_id',
  'product_slug',
  'product_name',
  'current_regular_price',
  'target_regular_price',
  'current_sale_price_visibility_only',
  'action',
  'status',
  'reason_note',
];

const MANUAL_COLUMNS = [
  'row_id',
  'action',
  'emart_name',
  'target_price',
  'target_size',
  'status',
  'reason_note',
  'matched_product_ids',
  'matched_product_names',
  'current_sale_price_visibility_only',
];

const ADD_COLUMNS = [
  'row_id',
  'draft_product_name',
  'target_size',
  'regular_price',
  'sale_price',
  'status',
  'source_note',
  'emartway_name',
  'emartway_price',
];

async function main() {
  if (!existsSync(INPUT_XLSX)) {
    throw new Error(`Missing input workbook: ${INPUT_XLSX}`);
  }
  if (!WOO_CONSUMER_KEY || !WOO_CONSUMER_SECRET) {
    throw new Error('WOO_CONSUMER_KEY and WOO_CONSUMER_SECRET are required for WooCommerce dry-run lookup.');
  }

  const rows = readWorkbook(INPUT_XLSX);
  const products = await getCeraveProducts();
  const indexes = buildIndexes(products);

  const dryRunRows = [];
  const manualRows = [];
  const addRows = [];
  const applyJobs = [];

  for (const row of rows) {
    const action = normalizeAction(value(row, 'Action'));
    const rowId = value(row, 'Row ID');
    const emartName = clean(value(row, 'eMart Name'));
    const targetSize = clean(value(row, 'Target eMart Size'));
    const targetPrice = targetPriceForAction(row, action);
    const matched = await matchProduct(row, indexes);
    const saleVisibility = matched.products.map((product) => product.sale_price || '').filter(Boolean).join(' | ');

    if (action === 'ADD_TO_EMART') {
      addRows.push(makeAddRow(row));
      dryRunRows.push(reportRow(rowId, '', '', value(row, 'EmartWay Name') || emartName, '', targetPrice || '', '', action, 'ADD_DRAFT_ONLY', 'Create CSV draft only; no product will be published automatically.'));
      continue;
    }

    if (
      CLEAR_SALE_PRICE_ALL_MATCHED
      && matched.status === 'matched'
      && isCeraveProduct(matched.products[0])
      && hasPositivePrice(matched.products[0].sale_price)
    ) {
      const product = matched.products[0];
      dryRunRows.push(reportProduct(rowId, product, targetPrice || '', action, DRY_RUN ? 'WOULD_CLEAR_SALE_PRICE' : 'CLEARED_SALE_PRICE', 'sale_price will be cleared by explicit request so WooCommerce shows regular price only.'));
      applyJobs.push({ type: 'clear_sale', product, rowId });
      continue;
    }

    if (action === 'DELETE_EMART_ITEM') {
      manualRows.push(manualRow(row, action, 'DELETE_CANDIDATE_ONLY', 'Delete candidate only; no automatic deletion.', matched.products, saleVisibility));
      dryRunRows.push(reportFromMatch(row, matched, targetPrice, action, 'DELETE_CANDIDATE_ONLY', 'Delete candidate only; no automatic deletion.'));
      continue;
    }

    if (action === 'NO_ACTION_EMART_OK') {
      dryRunRows.push(reportFromMatch(row, matched, '', action, 'NO_ACTION', 'Sheet says eMart item is OK.'));
      continue;
    }

    if (action === 'REVIEW_UNSPECIFIED' || !action) {
      manualRows.push(manualRow(row, action || 'BLANK_ACTION', 'MANUAL_REVIEW', 'Action is blank or review-only; no update prepared.', matched.products, saleVisibility));
      dryRunRows.push(reportFromMatch(row, matched, '', action || 'BLANK_ACTION', 'MANUAL_REVIEW', 'Action is blank or review-only; no update prepared.'));
      continue;
    }

    if (matched.status !== 'matched') {
      manualRows.push(manualRow(row, action, 'MANUAL_REVIEW', matched.reason, matched.products, saleVisibility));
      dryRunRows.push(reportFromMatch(row, matched, targetPrice || '', action, 'MANUAL_REVIEW', matched.reason));
      continue;
    }

    const product = matched.products[0];
    if (!isCeraveProduct(product)) {
      const reason = 'Matched product is not safely scoped to CeraVe by name/brand attribute.';
      manualRows.push(manualRow(row, action, 'MANUAL_REVIEW', reason, matched.products, saleVisibility));
      dryRunRows.push(reportProduct(rowId, product, targetPrice || '', action, 'MANUAL_REVIEW', reason));
      continue;
    }

    if (CLEAR_SALE_PRICE_ALL_MATCHED && hasPositivePrice(product.sale_price) && !PRICE_ACTIONS.has(action)) {
      dryRunRows.push(reportProduct(rowId, product, targetPrice || '', action, DRY_RUN ? 'WOULD_CLEAR_SALE_PRICE' : 'CLEARED_SALE_PRICE', 'sale_price will be cleared by explicit request so WooCommerce shows regular price only.'));
      applyJobs.push({ type: 'clear_sale', product, rowId });
      continue;
    }

    if (PRICE_ACTIONS.has(action)) {
      const priceCheck = validatePrice(targetPrice);
      if (!priceCheck.ok) {
        manualRows.push(manualRow(row, action, 'MANUAL_REVIEW', priceCheck.reason, matched.products, saleVisibility));
        dryRunRows.push(reportProduct(rowId, product, targetPrice || '', action, 'MANUAL_REVIEW', priceCheck.reason));
        continue;
      }

      const currentRegular = normalizePrice(product.regular_price);
      const targetRegular = String(priceCheck.price);
      const salePrice = Number(String(product.sale_price || '').replace(/,/g, '').trim());
      const hasSalePrice = Number.isFinite(salePrice) && salePrice > 0;
      if (!CLEAR_SALE_PRICE && Number.isFinite(salePrice) && salePrice > 0 && salePrice > priceCheck.price) {
        const reason = `Skipped: current sale_price ${salePrice} is higher than target regular_price ${priceCheck.price}. sale_price is not allowed to be changed by this workflow.`;
        manualRows.push(manualRow(row, action, 'MANUAL_REVIEW', reason, matched.products, saleVisibility));
        dryRunRows.push(reportProduct(rowId, product, targetRegular, action, 'MANUAL_REVIEW', reason));
        continue;
      }
      if (currentRegular === targetRegular) {
        if (CLEAR_SALE_PRICE && hasSalePrice) {
          dryRunRows.push(reportProduct(rowId, product, targetRegular, action, DRY_RUN ? 'WOULD_CLEAR_SALE_PRICE' : 'CLEARED_SALE_PRICE', 'Current regular_price already matches target; sale_price will be cleared by explicit request.'));
          applyJobs.push({ type: 'price', product, regular_price: targetRegular, clear_sale_price: true, rowId });
          continue;
        }
        dryRunRows.push(reportProduct(rowId, product, targetRegular, action, 'NO_CHANGE', 'Current regular_price already matches target. sale_price ignored.'));
        continue;
      }

      const saleNote = CLEAR_SALE_PRICE ? ' sale_price will be cleared by explicit request.' : ' sale_price ignored.';
      dryRunRows.push(reportProduct(rowId, product, targetRegular, action, DRY_RUN ? 'WOULD_UPDATE_REGULAR_PRICE' : 'UPDATED_REGULAR_PRICE', `regular_price/main price is prepared.${saleNote}`));
      applyJobs.push({ type: 'price', product, regular_price: targetRegular, clear_sale_price: CLEAR_SALE_PRICE, rowId });
      continue;
    }

    if (action === 'UPDATE_SIZE_ONLY') {
      const sizeCheck = validateSize(targetSize);
      if (!sizeCheck.ok) {
        manualRows.push(manualRow(row, action, 'MANUAL_REVIEW', sizeCheck.reason, matched.products, saleVisibility));
        dryRunRows.push(reportProduct(rowId, product, '', action, 'MANUAL_REVIEW', sizeCheck.reason));
        continue;
      }
      const payload = makeSizePayload(product, value(row, 'Current eMart Size'), targetSize);
      if (!payload) {
        const reason = 'Target size is clear, but no safe title/size attribute change could be prepared.';
        manualRows.push(manualRow(row, action, 'MANUAL_REVIEW', reason, matched.products, saleVisibility));
        dryRunRows.push(reportProduct(rowId, product, '', action, 'MANUAL_REVIEW', reason));
        continue;
      }
      dryRunRows.push(reportProduct(rowId, product, '', action, DRY_RUN ? 'WOULD_UPDATE_SIZE_ONLY' : 'UPDATED_SIZE_ONLY', `Prepared size-only update; price fields are untouched. ${describePayload(payload)}`));
      applyJobs.push({ type: 'size', product, payload, rowId });
      continue;
    }

    manualRows.push(manualRow(row, action, 'MANUAL_REVIEW', `Unknown action: ${action}`, matched.products, saleVisibility));
    dryRunRows.push(reportFromMatch(row, matched, targetPrice || '', action, 'MANUAL_REVIEW', `Unknown action: ${action}`));
  }

  if (APPLY) {
    if (!CONFIRM_DRY_RUN_REVIEWED) {
      throw new Error('Refusing live changes. Review cerave_dry_run_report.csv first, then rerun with --apply --confirm-dry-run-reviewed.');
    }
    await applyChanges(applyJobs);
  }

  writeCsv(DRY_RUN_REPORT, REPORT_COLUMNS, dryRunRows);
  writeCsv(MANUAL_REVIEW_REPORT, MANUAL_COLUMNS, manualRows);
  writeCsv(ADD_TO_EMART_REPORT, ADD_COLUMNS, addRows);

  const saleIgnoredRows = dryRunRows.filter((row) => clean(row.current_sale_price_visibility_only)).length;
  const summary = {
    mode: DRY_RUN ? 'DRY_RUN' : 'APPLY',
    clear_sale_price: CLEAR_SALE_PRICE,
    total_rows: rows.length,
    regular_price_update_rows: dryRunRows.filter((row) => row.status === 'WOULD_UPDATE_REGULAR_PRICE' || row.status === 'UPDATED_REGULAR_PRICE').length,
    sale_price_clear_rows: dryRunRows.filter((row) => row.status === 'WOULD_CLEAR_SALE_PRICE' || row.status === 'CLEARED_SALE_PRICE' || row.reason_note.includes('sale_price will be cleared')).length,
    size_update_rows: dryRunRows.filter((row) => row.status === 'WOULD_UPDATE_SIZE_ONLY' || row.status === 'UPDATED_SIZE_ONLY').length,
    delete_candidates: dryRunRows.filter((row) => row.status === 'DELETE_CANDIDATE_ONLY').length,
    add_candidates: addRows.length,
    manual_review_rows: manualRows.length,
    rows_where_sale_offer_price_exists_but_was_ignored: saleIgnoredRows,
    dry_run_report: path.relative(ROOT, DRY_RUN_REPORT),
    manual_review_report: path.relative(ROOT, MANUAL_REVIEW_REPORT),
    add_to_emart_report: path.relative(ROOT, ADD_TO_EMART_REPORT),
  };

  console.log(JSON.stringify(summary, null, 2));
}

function loadEnv(envPath) {
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    let raw = trimmed.slice(index + 1).trim();
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      raw = raw.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = raw;
  }
}

function readWorkbook(file) {
  const py = String.raw`
import json, sys
from openpyxl import load_workbook
wb = load_workbook(sys.argv[1], data_only=True)
ws = wb.active
headers = [c.value for c in ws[1]]
rows = []
for values in ws.iter_rows(min_row=2, values_only=True):
    if not any(v is not None for v in values):
        continue
    rows.append({str(k): v for k, v in zip(headers, values) if k is not None})
print(json.dumps(rows, ensure_ascii=False, default=str))
`;
  return JSON.parse(execFileSync('python3', ['-c', py, file], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }));
}

async function getCeraveProducts() {
  const byId = new Map();
  for (const term of ['CeraVe', 'Cerave', 'cerave']) {
    const found = await getProductsBySearch(term);
    for (const product of found) {
      if (isCeraveProduct(product)) byId.set(product.id, product);
    }
  }
  return [...byId.values()];
}

async function getProductsBySearch(search) {
  const products = [];
  for (let page = 1; ; page += 1) {
    const url = wcUrl('/products');
    url.searchParams.set('search', search);
    url.searchParams.set('status', 'any');
    url.searchParams.set('per_page', String(PAGE_SIZE));
    url.searchParams.set('page', String(page));
    const response = await wooFetch(url);
    const body = await response.json();
    if (!Array.isArray(body)) throw new Error(`Unexpected WooCommerce products response for search ${search}`);
    products.push(...body);
    const totalPages = Number(response.headers.get('x-wp-totalpages') || 1);
    if (page >= totalPages) break;
  }
  return products;
}

function buildIndexes(products) {
  const byId = new Map(products.map((product) => [String(product.id), product]));
  const bySlug = new Map();
  const byName = new Map();
  for (const product of products) {
    addToIndex(bySlug, clean(product.slug), product);
    addToIndex(byName, normalizeName(product.name), product);
  }
  return { products, byId, bySlug, byName };
}

async function matchProduct(row, indexes) {
  const id = clean(value(row, 'Product ID') || value(row, 'product_id') || value(row, 'Woo ID'));
  const slug = clean(value(row, 'Slug') || value(row, 'product_slug') || value(row, 'eMart Slug'));
  const name = clean(value(row, 'eMart Name'));

  if (id) {
    const product = indexes.byId.get(String(id));
    return product ? { status: 'matched', reason: 'Matched by product ID.', products: [product] } : { status: 'missing', reason: `No CeraVe product found for product ID ${id}.`, products: [] };
  }

  if (slug) {
    const products = indexes.bySlug.get(slug) || [];
    return matchSet(products, `slug ${slug}`);
  }

  if (name) {
    const products = indexes.byName.get(normalizeName(name)) || [];
    return matchSet(products, `exact eMart product name "${name}"`);
  }

  return { status: 'missing', reason: 'No product ID, slug, or eMart name available for matching.', products: [] };
}

function matchSet(products, label) {
  if (products.length === 1) return { status: 'matched', reason: `Matched by ${label}.`, products };
  if (products.length > 1) return { status: 'duplicate', reason: `Multiple products matched by ${label}; manual review required.`, products };
  return { status: 'missing', reason: `No product matched by ${label}.`, products: [] };
}

async function applyChanges(jobs) {
  for (const job of jobs) {
    const payload = job.type === 'price'
      ? { regular_price: job.regular_price, ...(job.clear_sale_price ? { sale_price: '' } : {}) }
      : job.type === 'clear_sale'
        ? { sale_price: '' }
      : job.payload;
    await updateProduct(job.product.id, payload);
  }
}

async function updateProduct(productId, payload) {
  const url = wcUrl(`/products/${productId}`);
  const response = await wooFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to update product ${productId}: ${response.status} ${text.slice(0, 500)}`);
  }
}

async function wooFetch(url, options = {}) {
  const isHttp = url.protocol === 'http:';
  if (isHttp) {
    url.searchParams.set('consumer_key', WOO_CONSUMER_KEY);
    url.searchParams.set('consumer_secret', WOO_CONSUMER_SECRET);
  }
  const headers = {
    Accept: 'application/json',
    ...(isHttp ? { Host: 'e-mart.com.bd' } : { Authorization: `Basic ${Buffer.from(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`).toString('base64')}` }),
    ...(options.headers || {}),
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WooCommerce request failed: ${response.status} ${response.statusText} ${url.pathname} ${text.slice(0, 500)}`);
  }
  return response;
}

function wcUrl(route) {
  return new URL(`${WOO_URL}/wp-json/wc/v3${route}`);
}

function isCeraveProduct(product) {
  const haystack = [
    product.name,
    product.slug,
    ...(product.attributes || []).flatMap((attribute) => [attribute.name, ...(attribute.options || [])]),
    ...(product.categories || []).map((category) => category.name),
    ...(product.tags || []).map((tag) => tag.name),
  ].join(' ');
  return /\bcera\s*ve\b|\bcerave\b/i.test(stripHtml(haystack));
}

function targetPriceForAction(row, action) {
  if (action === 'UPDATE_PRICE_TO_EMARTWAY') return value(row, 'EmartWay Price') || value(row, 'Target eMart Price');
  if (action === 'UPDATE_PRICE_TO_LISTED_VALUE' || action === 'UPDATE_PRICE_TO_USER_LISTED_VALUE') return value(row, 'Target eMart Price');
  if (action === 'ADD_TO_EMART') return value(row, 'Target eMart Price') || value(row, 'EmartWay Price');
  return '';
}

function validatePrice(raw) {
  const price = Number(String(raw ?? '').replace(/,/g, '').trim());
  if (!Number.isFinite(price)) return { ok: false, reason: 'Target regular_price is blank or non-number.' };
  if (price <= 0) return { ok: false, reason: 'Target regular_price is blank, 0, or negative.' };
  if (price > PRICE_HIGH_LIMIT) return { ok: false, reason: `Target regular_price ${price} is unusually high; limit is ${PRICE_HIGH_LIMIT}.` };
  return { ok: true, price: Math.round(price) === price ? Math.trunc(price) : price };
}

function hasPositivePrice(raw) {
  const price = Number(String(raw || '').replace(/,/g, '').trim());
  return Number.isFinite(price) && price > 0;
}

function validateSize(raw) {
  const size = clean(raw);
  if (!size) return { ok: false, reason: 'Target size is blank.' };
  if (!/\d/.test(size) || !/(ml|g|gm|oz|l|kg)\b/i.test(size)) return { ok: false, reason: `Target size "${size}" is not clear enough for automatic size-only update.` };
  return { ok: true, size };
}

function makeSizePayload(product, currentSizeRaw, targetSizeRaw) {
  const currentSize = clean(currentSizeRaw);
  const targetSize = clean(targetSizeRaw);
  const payload = {};
  if (currentSize && product.name && product.name.includes(currentSize)) {
    payload.name = product.name.replace(currentSize, targetSize);
  } else if (product.name && !product.name.includes(targetSize)) {
    payload.name = `${product.name.replace(/\s+$/, '')} ${targetSize}`;
  }

  const attributes = [];
  for (const attribute of product.attributes || []) {
    const attrName = clean(attribute.name);
    const options = Array.isArray(attribute.options) ? attribute.options : [];
    const isSizeAttr = /size|volume|weight|pa_size/i.test(attrName);
    const hasCurrent = currentSize && options.some((option) => normalizeSize(option) === normalizeSize(currentSize));
    if (isSizeAttr || hasCurrent) {
      attributes.push({
        id: attribute.id,
        name: attribute.id ? undefined : attribute.name,
        visible: attribute.visible,
        variation: attribute.variation,
        options: [targetSize],
      });
    }
  }
  if (attributes.length) payload.attributes = attributes.map((attribute) => Object.fromEntries(Object.entries(attribute).filter(([, v]) => v !== undefined)));
  return Object.keys(payload).length ? payload : null;
}

function makeAddRow(row) {
  return {
    row_id: value(row, 'Row ID'),
    draft_product_name: value(row, 'EmartWay Name') || value(row, 'eMart Name'),
    target_size: value(row, 'Target eMart Size') || value(row, 'EmartWay Size'),
    regular_price: targetPriceForAction(row, 'ADD_TO_EMART'),
    sale_price: '',
    status: 'DRAFT_ONLY_NOT_PUBLISHED',
    source_note: value(row, 'Issue Note') || value(row, 'Target Price Source'),
    emartway_name: value(row, 'EmartWay Name'),
    emartway_price: value(row, 'EmartWay Price'),
  };
}

function manualRow(row, action, status, reason, products, saleVisibility) {
  return {
    row_id: value(row, 'Row ID'),
    action,
    emart_name: value(row, 'eMart Name'),
    target_price: targetPriceForAction(row, action),
    target_size: value(row, 'Target eMart Size'),
    status,
    reason_note: reason,
    matched_product_ids: products.map((product) => product.id).join('|'),
    matched_product_names: products.map((product) => stripHtml(product.name || '')).join('|'),
    current_sale_price_visibility_only: saleVisibility,
  };
}

function reportFromMatch(row, matched, targetPrice, action, status, reason) {
  if (matched.products.length === 1) {
    return reportProduct(value(row, 'Row ID'), matched.products[0], targetPrice, action, status, reason);
  }
  return reportRow(value(row, 'Row ID'), matched.products.map((product) => product.id).join('|'), matched.products.map((product) => product.slug).join('|'), value(row, 'eMart Name'), matched.products.map((product) => product.regular_price).join('|'), targetPrice, matched.products.map((product) => product.sale_price || '').filter(Boolean).join('|'), action, status, reason);
}

function reportProduct(rowId, product, targetPrice, action, status, reason) {
  return reportRow(rowId, product.id, product.slug, stripHtml(product.name || ''), product.regular_price || '', targetPrice, product.sale_price || '', action, status, reason);
}

function reportRow(rowId, productId, slug, name, currentRegular, targetRegular, currentSale, action, status, reason) {
  return {
    row_id: rowId,
    product_id: productId,
    product_slug: slug,
    product_name: name,
    current_regular_price: currentRegular,
    target_regular_price: targetRegular,
    current_sale_price_visibility_only: currentSale,
    action,
    status,
    reason_note: reason,
  };
}

function writeCsv(file, columns, rows) {
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((column) => csvCell(row[column])).join(','));
  }
  writeFileSync(file, `${lines.join('\n')}\n`, 'utf8');
}

function csvCell(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function addToIndex(index, key, product) {
  if (!key) return;
  if (!index.has(key)) index.set(key, []);
  index.get(key).push(product);
}

function value(row, key) {
  return row[key] == null ? '' : row[key];
}

function normalizeAction(action) {
  return clean(action).toUpperCase();
}

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeName(name) {
  return clean(stripHtml(name)).toLowerCase();
}

function normalizePrice(value) {
  const number = Number(String(value ?? '').replace(/,/g, '').trim());
  if (!Number.isFinite(number)) return clean(value);
  return String(Math.round(number) === number ? Math.trunc(number) : number);
}

function normalizeSize(value) {
  return clean(value).toLowerCase().replace(/\s+/g, '').replace(/gm\b/g, 'g');
}

function stripHtml(text) {
  return String(text ?? '').replace(/<[^>]*>/g, ' ');
}

function stripTrailingSlash(text) {
  return String(text).replace(/\/$/, '');
}

function describePayload(payload) {
  const parts = [];
  if (payload.name) parts.push(`name -> "${payload.name}"`);
  if (payload.attributes) parts.push(`attributes -> ${JSON.stringify(payload.attributes)}`);
  return parts.join('; ');
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
