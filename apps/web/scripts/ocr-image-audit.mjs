#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const WOO_URL = (process.env.NEXT_PUBLIC_WOO_URL || 'https://e-mart.com.bd').replace(/\/$/, '');
const CONSUMER_KEY = process.env.WOO_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET || '';
const OUT_DIR = process.env.OCR_AUDIT_DIR || '/tmp/emart-ocr-audit';
const PAGE_SIZE = Number(process.env.OCR_AUDIT_PAGE_SIZE || 100);
const CONCURRENCY = Number(process.env.OCR_AUDIT_CONCURRENCY || 2);
const ALL_IMAGES = process.env.OCR_AUDIT_ALL_IMAGES !== '0';
const MAX_PRODUCTS = Number(process.env.OCR_AUDIT_MAX_PRODUCTS || 0);
const BASE_SITE_URL = 'https://e-mart.com.bd';
const LEGACY_IP_HOST = ['5', '189', '188', '229'].join('.');

const reportJsonlPath = join(OUT_DIR, 'report.jsonl');
const reportCsvPath = join(OUT_DIR, 'report.csv');
const summaryPath = join(OUT_DIR, 'summary.txt');
const progressPath = join(OUT_DIR, 'progress.json');
const tmpDir = join(OUT_DIR, 'tmp');

const stopWords = new Set([
  'and', 'the', 'for', 'with', 'from', 'skin', 'care', 'face', 'cream', 'serum',
  'toner', 'cleanser', 'gel', 'ml', 'gm', 'g', 'oz', 'spf', 'new', 'pack',
]);

async function main() {
  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new Error('WOO_CONSUMER_KEY and WOO_CONSUMER_SECRET are required.');
  }

  await fs.mkdir(tmpDir, { recursive: true });
  await writeCsvHeader();

  const products = await getAllProducts(MAX_PRODUCTS);
  const jobs = products.flatMap((product) => makeJobs(product));

  const summary = {
    startedAt: new Date().toISOString(),
    wooUrl: WOO_URL,
    products: products.length,
    imageJobs: jobs.length,
    allImages: ALL_IMAGES,
    ok: 0,
    review: 0,
    missingImage: 0,
    downloadFailed: 0,
    ocrFailed: 0,
  };

  await writeProgress(summary, 0);
  await runQueue(jobs, CONCURRENCY, async (job, index) => {
    const result = await auditImage(job);
    updateSummary(summary, result.risk);
    await appendReport(result);
    await writeProgress(summary, index + 1);
  });

  summary.finishedAt = new Date().toISOString();
  await fs.writeFile(summaryPath, renderSummary(summary), 'utf8');
  await writeProgress(summary, jobs.length);
}

async function getAllProducts(maxProducts = 0) {
  const firstPage = await getProductsPage(1);
  const products = [...firstPage.products];

  if (maxProducts > 0 && products.length >= maxProducts) {
    return products.slice(0, maxProducts);
  }

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const pageData = await getProductsPage(page);
    products.push(...pageData.products);
    if (maxProducts > 0 && products.length >= maxProducts) {
      return products.slice(0, maxProducts);
    }
  }

  return products;
}

async function getProductsPage(page) {
  const url = new URL(`${WOO_URL}/wp-json/wc/v3/products`);
  url.searchParams.set('status', 'publish');
  url.searchParams.set('per_page', String(PAGE_SIZE));
  url.searchParams.set('page', String(page));

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`WooCommerce products page ${page} failed: ${response.status} ${response.statusText}`);
  }

  return {
    products: await response.json(),
    totalPages: Number(response.headers.get('x-wp-totalpages') || 1),
  };
}

function makeJobs(product) {
  const images = Array.isArray(product.images) ? product.images : [];
  if (images.length === 0) {
    return [{ product, image: null, imageIndex: 0 }];
  }

  return (ALL_IMAGES ? images : images.slice(0, 1)).map((image, imageIndex) => ({
    product,
    image,
    imageIndex,
  }));
}

async function auditImage({ product, image, imageIndex }) {
  const productTokens = tokenize([
    product.name,
    product.slug,
    ...(product.categories || []).map((category) => category.name),
    ...(product.tags || []).map((tag) => tag.name),
    ...(product.attributes || []).flatMap((attribute) => [attribute.name, ...(attribute.options || [])]),
  ].join(' '));

  const baseResult = {
    product_id: product.id,
    product_slug: product.slug,
    product_name: stripHtml(product.name || ''),
    product_url: `${BASE_SITE_URL}/shop/${product.slug}`,
    image_index: imageIndex,
    image_id: image?.id || '',
    image_url: normalizeImageUrl(image?.src || ''),
    image_name: image?.name || '',
    image_alt: image?.alt || '',
    ocr_text: '',
    token_matches: '',
    token_score: 0,
    filename_score: 0,
    alt_score: 0,
    ocr_score: 0,
    risk: 'ok',
    error: '',
  };

  if (!baseResult.image_url) {
    return { ...baseResult, risk: 'missing_image', error: 'No attached image URL' };
  }

  const filenameTokens = tokenize(`${baseResult.image_url} ${baseResult.image_name}`);
  const altTokens = tokenize(baseResult.image_alt);
  const filenameMatches = intersect(productTokens, filenameTokens);
  const altMatches = intersect(productTokens, altTokens);
  baseResult.filename_score = score(productTokens, filenameMatches);
  baseResult.alt_score = score(productTokens, altMatches);

  const sourcePath = join(tmpDir, `${product.id}-${imageIndex}${safeExt(baseResult.image_url)}`);
  const preparedPath = join(tmpDir, `${product.id}-${imageIndex}-prepared.png`);

  try {
    await downloadFile(baseResult.image_url, sourcePath);
  } catch (error) {
    return { ...baseResult, risk: 'download_failed', error: String(error.message || error) };
  }

  try {
    await execFileAsync('convert', [
      sourcePath,
      '-auto-orient',
      '-resize',
      '1600x1600>',
      '-colorspace',
      'Gray',
      '-normalize',
      '-sharpen',
      '0x1',
      preparedPath,
    ], { timeout: 60000 });

    const { stdout } = await execFileAsync('tesseract', [
      preparedPath,
      'stdout',
      '-l',
      'eng',
      '--psm',
      '6',
    ], { timeout: 90000, maxBuffer: 1024 * 1024 });

    baseResult.ocr_text = normalizeWhitespace(stdout).slice(0, 500);
  } catch (error) {
    baseResult.risk = 'ocr_failed';
    baseResult.error = String(error.message || error).slice(0, 300);
  } finally {
    await fs.rm(sourcePath, { force: true }).catch(() => {});
    await fs.rm(preparedPath, { force: true }).catch(() => {});
  }

  const ocrTokens = tokenize(baseResult.ocr_text);
  const ocrMatches = intersect(productTokens, ocrTokens);
  const combinedMatches = [...new Set([...filenameMatches, ...altMatches, ...ocrMatches])];

  baseResult.token_matches = combinedMatches.join(' ');
  baseResult.token_score = score(productTokens, combinedMatches);
  baseResult.ocr_score = score(productTokens, ocrMatches);

  if (baseResult.risk === 'ocr_failed') return baseResult;
  if (baseResult.filename_score < 0.25 && baseResult.alt_score >= 0.25) {
    return { ...baseResult, risk: 'review', error: 'Image filename/name is weak but alt text matches product' };
  }
  if (baseResult.filename_score < 0.25 && baseResult.alt_score < 0.25 && baseResult.ocr_score < 0.25) {
    return { ...baseResult, risk: 'review', error: 'Low product-token match against filename/alt/OCR text' };
  }

  return baseResult;
}

async function runQueue(items, concurrency, worker) {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.max(concurrency, 1) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      await worker(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
}

async function downloadFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, bytes);
}

async function writeCsvHeader() {
  const header = [
    'product_id',
    'product_slug',
    'product_name',
    'product_url',
    'image_index',
    'image_id',
    'image_url',
    'image_name',
    'image_alt',
    'risk',
    'filename_score',
    'alt_score',
    'ocr_score',
    'token_score',
    'token_matches',
    'ocr_text',
    'error',
  ].join(',');

  await fs.writeFile(reportCsvPath, `${header}\n`, 'utf8');
  await fs.writeFile(reportJsonlPath, '', 'utf8');
}

async function appendReport(result) {
  await fs.appendFile(reportJsonlPath, `${JSON.stringify(result)}\n`, 'utf8');
  await fs.appendFile(reportCsvPath, `${csvRow(result)}\n`, 'utf8');
}

async function writeProgress(summary, completed) {
  await fs.writeFile(progressPath, JSON.stringify({
    ...summary,
    completed,
    updatedAt: new Date().toISOString(),
  }, null, 2), 'utf8');
}

function updateSummary(summary, risk) {
  if (risk === 'ok') summary.ok += 1;
  if (risk === 'review') summary.review += 1;
  if (risk === 'missing_image') summary.missingImage += 1;
  if (risk === 'download_failed') summary.downloadFailed += 1;
  if (risk === 'ocr_failed') summary.ocrFailed += 1;
}

function renderSummary(summary) {
  return [
    `Started: ${summary.startedAt}`,
    `Finished: ${summary.finishedAt || ''}`,
    `Woo URL: ${summary.wooUrl}`,
    `Products scanned: ${summary.products}`,
    `Image jobs scanned: ${summary.imageJobs}`,
    `All product images: ${summary.allImages}`,
    `OK: ${summary.ok}`,
    `Review: ${summary.review}`,
    `Missing image: ${summary.missingImage}`,
    `Download failed: ${summary.downloadFailed}`,
    `OCR failed: ${summary.ocrFailed}`,
    `Report CSV: ${reportCsvPath}`,
    `Report JSONL: ${reportJsonlPath}`,
  ].join('\n');
}

function csvRow(result) {
  return [
    result.product_id,
    result.product_slug,
    result.product_name,
    result.product_url,
    result.image_index,
    result.image_id,
    result.image_url,
    result.image_name,
    result.image_alt,
    result.risk,
    result.filename_score,
    result.alt_score,
    result.ocr_score,
    result.token_score,
    result.token_matches,
    result.ocr_text,
    result.error,
  ].map(csvCell).join(',');
}

function csvCell(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function tokenize(value) {
  return normalizeWhitespace(stripHtml(value).toLowerCase())
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((token) => token.length >= 3 && !stopWords.has(token));
}

function intersect(a, b) {
  const bSet = new Set(b);
  return [...new Set(a.filter((token) => bSet.has(token)))];
}

function score(tokens, matches) {
  const uniqueTokens = new Set(tokens);
  if (uniqueTokens.size === 0) return 0;
  return Number((matches.length / uniqueTokens.size).toFixed(3));
}

function normalizeImageUrl(src) {
  if (!src) return '';
  try {
    const url = new URL(String(src));
    if (url.hostname === 'e-mart.com.bd' || url.hostname === LEGACY_IP_HOST) {
      return `${BASE_SITE_URL}${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return String(src);
  }

  return String(src);
}

function safeExt(url) {
  const parsed = new URL(url);
  const ext = extname(basename(parsed.pathname)).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ');
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

main().catch(async (error) => {
  await fs.mkdir(OUT_DIR, { recursive: true }).catch(() => {});
  await fs.writeFile(join(OUT_DIR, 'error.log'), `${error.stack || error}\n`, 'utf8').catch(() => {});
  console.error(error);
  process.exit(1);
});
