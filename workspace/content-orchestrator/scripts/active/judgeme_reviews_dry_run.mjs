#!/usr/bin/env node
/**
 * Judge.me -> WooCommerce reviews importer.
 *
 * By default this script does not create or update reviews. It reads a Judge.me
 * CSV export, maps rows to live WooCommerce products, checks likely duplicates,
 * and writes an audit CSV for owner review. Add --apply to create reviews.
 *
 * Usage:
 *   node workspace/content-orchestrator/scripts/active/judgeme_reviews_dry_run.mjs --file /path/judgeme.csv --limit 5
 *   node workspace/content-orchestrator/scripts/active/judgeme_reviews_dry_run.mjs --file /path/judgeme.csv --limit 5 --apply
 *   JUDGEME_API_TOKEN=... JUDGEME_SHOP_DOMAIN=... node workspace/content-orchestrator/scripts/active/judgeme_reviews_dry_run.mjs --api --limit 5 --apply
 */

import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_SITE_URL = 'https://e-mart.com.bd';
const DEFAULT_OUT = `workspace/audit/active/judgeme-reviews-dry-run-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;

function readEnvFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').split('\n').reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return env;
      const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (!match) return env;
      env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
      return env;
    }, {});
  } catch {
    return {};
  }
}

const ENV = {
  ...readEnvFile('apps/web/.env.local'),
  ...readEnvFile('/var/www/emart-platform/apps/web/.env.local'),
  ...process.env,
};

function parseArgs(argv) {
  const args = { limit: 5, out: DEFAULT_OUT, apply: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--file') args.file = argv[++i];
    else if (arg === '--api') args.api = true;
    else if (arg === '--judge-token') args.judgeToken = argv[++i];
    else if (arg === '--shop-domain') args.shopDomain = argv[++i];
    else if (arg === '--page') args.page = Number(argv[++i]);
    else if (arg === '--limit') args.limit = Number(argv[++i]);
    else if (arg === '--out') args.out = argv[++i];
    else if (arg === '--apply') args.apply = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node workspace/content-orchestrator/scripts/active/judgeme_reviews_dry_run.mjs --file /path/judgeme.csv --limit 5
  JUDGEME_API_TOKEN=... JUDGEME_SHOP_DOMAIN=... node workspace/content-orchestrator/scripts/active/judgeme_reviews_dry_run.mjs --api --limit 5

Input must be a CSV export. Export XLSX from Judge.me as CSV first.
No WooCommerce writes are performed unless --apply is passed.`);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function readCsvObjects(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const rows = parseCsv(text).filter((row) => row.some((cell) => String(cell).trim()));
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((row, index) => {
    const object = { __row: index + 2 };
    headers.forEach((header, i) => {
      object[header] = String(row[i] || '').trim();
    });
    return object;
  });
}

function first(row, keys) {
  for (const key of keys) {
    const value = row[normalizeHeader(key)];
    if (value) return value;
  }
  return '';
}

function normalizeReview(row) {
  const ratingRaw = first(row, ['rating', 'review_rating', 'score', 'review_score', 'stars']);
  const rating = Number.parseInt(String(ratingRaw).replace(/[^\d]/g, ''), 10);
  const body = first(row, ['review_body', 'body', 'review_content', 'content', 'review', 'text']);

  return {
    source_row: row.__row,
    product_sku: first(row, ['product_sku', 'sku', 'product_external_id', 'external_product_id']),
    product_id: first(row, ['product_id', 'woocommerce_product_id']),
    product_handle: first(row, ['product_handle', 'handle', 'product_slug', 'slug']),
    product_title: first(row, ['product_title', 'product_name', 'product']),
    review_title: first(row, ['review_title', 'title']),
    review_body: body,
    rating: Number.isInteger(rating) ? rating : 0,
    reviewer_name: first(row, ['reviewer_name', 'customer_name', 'author', 'name', 'display_name']) || 'Imported customer',
    reviewer_email: first(row, ['reviewer_email', 'customer_email', 'email']),
    review_date: first(row, ['review_date', 'date', 'created_at', 'published_at']),
    picture_urls: first(row, ['picture_urls', 'pictures', 'media', 'image_urls']),
  };
}

function normalizeJudgeMeApiReview(review) {
  const pictures = Array.isArray(review?.pictures)
    ? review.pictures
        .map((picture) => picture?.urls?.original || picture?.urls?.huge || picture?.urls?.compact || picture?.urls?.small || '')
        .filter(Boolean)
        .join(' ')
    : '';
  const reviewer = review?.reviewer || {};

  return {
    source_row: `api:${review?.id || ''}`,
    product_sku: '',
    product_id: review?.product_external_id ? String(review.product_external_id) : '',
    product_handle: review?.product_handle ? String(review.product_handle) : '',
    product_title: review?.product_title ? String(review.product_title) : '',
    review_title: review?.title ? String(review.title).trim() : '',
    review_body: review?.body ? String(review.body).trim() : '',
    rating: Number.parseInt(String(review?.rating || ''), 10) || 0,
    reviewer_name: String(reviewer.name || reviewer.display_name || 'Imported customer').trim(),
    reviewer_email: String(reviewer.email || '').trim(),
    review_date: String(review?.created_at || '').trim(),
    picture_urls: pictures,
    judgeme_id: review?.id || '',
    judgeme_curated: review?.curated || '',
    judgeme_hidden: review?.hidden === true ? 'yes' : 'no',
    judgeme_verified: review?.verified || '',
  };
}

function isJudgeMeVerifiedStatus(status) {
  return ['confirmed-buyer', 'buyer', 'verified-purchase', 'semi-verified-purchase', 'admin'].includes(String(status || ''));
}

function csvEscape(value) {
  const stringValue = String(value ?? '');
  return /[",\n\r]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
}

function writeCsv(filePath, rows) {
  const headers = [
    'source_row',
    'status',
    'reason',
    'product_id',
    'product_sku',
    'product_name',
    'product_slug',
    'rating',
    'reviewer_name',
    'reviewer_email',
    'review_date',
    'verified_recommendation',
    'duplicate',
    'created_review_id',
    'review_title',
    'review_body',
    'picture_urls',
  ];
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    `${headers.join(',')}\n${rows.map((row) => headers.map((key) => csvEscape(row[key])).join(',')).join('\n')}\n`,
    'utf8',
  );
}

function buildWooUrl(endpoint, params = {}) {
  const baseUrl = ENV.WOO_INTERNAL_URL || ENV.NEXT_PUBLIC_WOO_URL || PUBLIC_SITE_URL;
  const cleanBase = baseUrl.replace(/\/$/, '');
  const url = new URL(`${cleanBase}/wp-json/wc/v3${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  url.searchParams.set('consumer_key', ENV.WOO_CONSUMER_KEY || '');
  url.searchParams.set('consumer_secret', ENV.WOO_CONSUMER_SECRET || '');
  return url;
}

async function wooGet(endpoint, params = {}) {
  if (!ENV.WOO_CONSUMER_KEY || !ENV.WOO_CONSUMER_SECRET) {
    throw new Error('Missing WOO_CONSUMER_KEY or WOO_CONSUMER_SECRET in apps/web/.env.local or environment.');
  }
  const url = buildWooUrl(endpoint, params);
  const headers = {};
  if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
    headers.Host = 'e-mart.com.bd';
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Woo GET ${endpoint} failed: ${response.status} ${body.slice(0, 300)}`);
  }
  return response.json();
}

async function wooPost(endpoint, payload) {
  if (!ENV.WOO_CONSUMER_KEY || !ENV.WOO_CONSUMER_SECRET) {
    throw new Error('Missing WOO_CONSUMER_KEY or WOO_CONSUMER_SECRET in apps/web/.env.local or environment.');
  }
  const url = buildWooUrl(endpoint);
  const headers = { 'Content-Type': 'application/json' };
  if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
    headers.Host = 'e-mart.com.bd';
  }
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(async () => ({ raw: await response.text().catch(() => '') }));
  if (!response.ok) {
    throw new Error(`Woo POST ${endpoint} failed: ${response.status} ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

async function judgeMeGet(endpoint, params, token) {
  const url = new URL(`https://api.judge.me/api/v1${endpoint}`);
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      'X-Api-Token': token,
      Accept: 'application/json',
    },
  });
  const data = await response.json().catch(async () => ({ raw: await response.text().catch(() => '') }));
  if (!response.ok) {
    throw new Error(`Judge.me GET ${endpoint} failed: ${response.status} ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

async function readJudgeMeReviewsFromApi(args, limit) {
  const token = args.judgeToken || ENV.JUDGEME_API_TOKEN || ENV.JUDGE_ME_API_TOKEN || ENV.JUDGEME_PRIVATE_API_TOKEN;
  const shopDomain = args.shopDomain || ENV.JUDGEME_SHOP_DOMAIN || ENV.JUDGE_ME_SHOP_DOMAIN || 'e-mart.com.bd';
  if (!token) {
    throw new Error('Missing Judge.me API token. Set JUDGEME_API_TOKEN or pass --judge-token.');
  }

  const page = Number.isFinite(args.page) && args.page > 0 ? args.page : 1;
  const data = await judgeMeGet('/reviews', {
    shop_domain: shopDomain,
    page,
    per_page: limit,
  }, token);

  return (Array.isArray(data?.reviews) ? data.reviews : [])
    .filter((review) => review?.curated === 'ok' && review?.hidden !== true)
    .map(normalizeJudgeMeApiReview)
    .slice(0, limit);
}

async function findProduct(review) {
  if (review.product_id) {
    const product = await wooGet(`/products/${review.product_id}`).catch(() => null);
    if (product?.id) return { product, method: 'product_id' };
  }

  if (review.product_sku) {
    const products = await wooGet('/products', { sku: review.product_sku, per_page: 5, status: 'publish' });
    if (Array.isArray(products) && products.length === 1) return { product: products[0], method: 'sku' };
    if (Array.isArray(products) && products.length > 1) return { error: `sku matched ${products.length} products` };
  }

  const searchTerm = review.product_handle || review.product_title;
  if (searchTerm) {
    const products = await wooGet('/products', { search: searchTerm, per_page: 5, status: 'publish' });
    if (Array.isArray(products) && products.length === 1) return { product: products[0], method: 'search' };
    if (Array.isArray(products) && products.length > 1) {
      const slugMatch = products.find((product) => product.slug === review.product_handle);
      if (slugMatch) return { product: slugMatch, method: 'slug_from_search' };
      return { error: `search matched ${products.length} products` };
    }
  }

  return { error: 'no product match' };
}

function fingerprint(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 160);
}

async function isLikelyDuplicate(productId, review) {
  const existing = await wooGet('/products/reviews', { product: productId, per_page: 100 }).catch(() => []);
  if (!Array.isArray(existing) || existing.length === 0) return false;
  const email = review.reviewer_email.toLowerCase();
  const body = fingerprint(review.review_body);
  return existing.some((item) => {
    const sameEmail = email && String(item.reviewer_email || '').toLowerCase() === email;
    const sameBody = body && fingerprint(item.review) === body;
    return sameEmail || sameBody;
  });
}

function buildReviewPayload(productId, review) {
  const title = review.review_title ? `<strong>${review.review_title}</strong>\n\n` : '';
  return {
    product_id: productId,
    review: `${title}${review.review_body}`.trim(),
    reviewer: review.reviewer_name || 'Imported customer',
    reviewer_email: review.reviewer_email || undefined,
    rating: review.rating,
    status: 'approved',
  };
}

function validateReview(review) {
  if (!review.review_body || review.review_body.length < 3) return 'missing review body';
  if (review.rating < 1 || review.rating > 5) return 'rating must be 1-5';
  return '';
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || (!args.file && !args.api)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }

  const limit = Number.isFinite(args.limit) && args.limit > 0 ? args.limit : 5;
  if (args.apply && limit > 5) {
    throw new Error('For safety, --apply is capped at --limit 5. Run dry-run/review before larger imports.');
  }
  const sourceRows = args.api
    ? await readJudgeMeReviewsFromApi(args, limit)
    : readCsvObjects(args.file).map(normalizeReview);
  const candidates = sourceRows.slice(0, limit);
  const outputRows = [];

  for (const review of candidates) {
    const validationError = validateReview(review);
    const base = {
      source_row: review.source_row,
      rating: review.rating,
      reviewer_name: review.reviewer_name,
      reviewer_email: review.reviewer_email,
      review_date: review.review_date,
      review_title: review.review_title,
      review_body: review.review_body,
      picture_urls: review.picture_urls,
      verified_recommendation: isJudgeMeVerifiedStatus(review.judgeme_verified)
        ? `no for Woo by default - Judge.me status is ${review.judgeme_verified}; separately match to Emart order before marking verified in Woo`
        : 'no - imported Judge.me review unless matched to a real Emart order separately',
      duplicate: '',
    };

    if (validationError) {
      outputRows.push({ ...base, status: 'skip', reason: validationError });
      continue;
    }

    const match = await findProduct(review);
    if (!match.product) {
      outputRows.push({ ...base, status: 'skip', reason: match.error || 'no product match' });
      continue;
    }

    const duplicate = await isLikelyDuplicate(match.product.id, review);
    const outputRow = {
      ...base,
      status: duplicate ? 'skip' : 'ready_for_owner_review',
      reason: duplicate ? 'likely duplicate existing Woo review' : `matched by ${match.method}`,
      product_id: match.product.id,
      product_sku: match.product.sku || review.product_sku,
      product_name: match.product.name,
      product_slug: match.product.slug,
      duplicate: duplicate ? 'yes' : 'no',
      created_review_id: '',
    };

    if (args.apply && !duplicate) {
      const created = await wooPost('/products/reviews', buildReviewPayload(match.product.id, review));
      outputRow.status = 'created';
      outputRow.reason = `${outputRow.reason}; created Woo review`;
      outputRow.created_review_id = created?.id || '';
    }

    outputRows.push(outputRow);
  }

  writeCsv(args.out, outputRows);
  const ready = outputRows.filter((row) => row.status === 'ready_for_owner_review').length;
  const created = outputRows.filter((row) => row.status === 'created').length;
  const skipped = outputRows.length - ready - created;
  console.log(`Judge.me ${args.apply ? 'import' : 'dry-run'} complete: ${outputRows.length} checked, ${created} created, ${ready} ready, ${skipped} skipped.`);
  console.log(`Output: ${args.out}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
