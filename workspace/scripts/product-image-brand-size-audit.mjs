#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const WP_PATH = process.env.WP_PATH || '/var/www/wordpress';
const OUT = process.env.OUT || '/root/emart-platform/workspace/audit/seo/product-image-brand-size-20260503.csv';
const OCR_JSONL = process.env.OCR_JSONL || '';
const SITE_URL = 'https://e-mart.com.bd';

const WEAK = new Set([
  'and', 'bd', 'beauty', 'care', 'cosmetics', 'daily', 'emart', 'face', 'for',
  'gel', 'global', 'image', 'imported', 'korea', 'korean', 'ml', 'gm', 'g',
  'mg', 'new', 'original', 'pack', 'pcs', 'pc', 'price', 'product', 'skin',
  'skincare', 'the', 'with', 'bangladesh',
]);

function main() {
  mkdirSync(dirname(OUT), { recursive: true });
  const products = queryProducts();
  const duplicateThumbnails = queryDuplicateThumbnails();
  const duplicateByProduct = new Map(duplicateThumbnails.map((row) => [String(row.product_id), row]));
  const knownBrands = queryBrands();
  const ocrByProduct = readOcr(OCR_JSONL);
  const rows = products.map((product) =>
    auditProduct(product, knownBrands, ocrByProduct.get(String(product.id)), duplicateByProduct.get(String(product.id)))
  );

  writeCsv(OUT, rows, [
    'severity',
    'flags',
    'product_id',
    'product_slug',
    'product_url',
    'product_name',
    'product_brand',
    'product_size',
    'thumbnail_id',
    'image_title',
    'image_alt',
    'image_url',
    'metadata_brand_candidates',
    'metadata_size_candidates',
    'ocr_brand_candidates',
    'ocr_size_candidates',
    'name_token_score',
    'duplicate_thumbnail_rows',
    'all_thumbnail_ids',
    'ocr_text',
    'notes',
  ]);

  const summary = summarize(rows);
  summary.duplicateThumbnailProducts = duplicateThumbnails.length;
  const summaryPath = OUT.replace(/\.csv$/i, '.summary.txt');
  writeFileSync(summaryPath, renderSummary(summary, OUT), 'utf8');
  console.log(renderSummary(summary, OUT));
}

function auditProduct(product, knownBrands, ocr, duplicateThumbnail) {
  const productBrand = normalizeBrand(preferredBrand(product.brand_names) || firstBrandLike(product.product_name, knownBrands));
  const productSize = firstSize(`${product.product_name} ${product.product_slug}`);
  const metadataText = `${product.image_title || ''} ${product.image_alt || ''} ${product.image_url || ''}`;
  const metadataBrands = findBrands(metadataText, knownBrands);
  const metadataSizes = findSizes(metadataText);
  const ocrText = ocr?.ocr_text || '';
  const ocrBrands = findBrands(ocrText, knownBrands);
  const ocrSizes = findSizes(ocrText);
  const nameScore = tokenScore(`${product.product_name} ${product.product_slug}`, metadataText);
  const flags = [];
  const notes = [];

  if (!product.thumbnail_id) {
    flags.push('missing_thumbnail');
  }

  if (duplicateThumbnail) {
    flags.push('duplicate_thumbnail_meta');
  }

  if (productBrand && metadataBrands.length && !metadataBrands.includes(productBrand)) {
    flags.push('metadata_brand_mismatch');
  }

  if (productBrand && ocrBrands.length && !ocrBrands.includes(productBrand)) {
    flags.push('ocr_visual_brand_mismatch');
  }

  if (productSize && metadataSizes.length && !metadataSizes.includes(productSize)) {
    flags.push('metadata_size_mismatch');
  }

  if (productSize && ocrSizes.length && !ocrSizes.includes(productSize)) {
    flags.push('ocr_visual_size_mismatch');
  }

  if (nameScore < 0.25 && !flags.includes('missing_thumbnail')) {
    flags.push('metadata_name_weak_match');
  }

  if (productBrand && !metadataText.includes(productBrand) && !metadataBrands.length) {
    notes.push('product brand not visible in image metadata');
  }

  const visualMismatch = flags.some((flag) => flag.startsWith('ocr_visual_'));
  const metadataMismatch = flags.some((flag) => flag.startsWith('metadata_'));
  const severity = visualMismatch ? 'high' : metadataMismatch ? 'medium' : flags.length ? 'review' : 'ok';

  return {
    severity,
    flags: flags.join('|') || 'ok',
    product_id: product.id,
    product_slug: product.product_slug,
    product_url: `${SITE_URL}/shop/${product.product_slug}`,
    product_name: product.product_name,
    product_brand: productBrand,
    product_size: productSize,
    thumbnail_id: product.thumbnail_id,
    image_title: product.image_title,
    image_alt: product.image_alt,
    image_url: product.image_url,
    metadata_brand_candidates: metadataBrands.join('|'),
    metadata_size_candidates: metadataSizes.join('|'),
    ocr_brand_candidates: ocrBrands.join('|'),
    ocr_size_candidates: ocrSizes.join('|'),
    name_token_score: nameScore,
    duplicate_thumbnail_rows: duplicateThumbnail?.thumbnail_rows || '',
    all_thumbnail_ids: duplicateThumbnail?.thumbnail_ids || '',
    ocr_text: ocrText,
    notes: notes.join('|'),
  };
}

function queryProducts() {
  return queryJsonLines(`
    SELECT JSON_OBJECT(
      'id', p.ID,
      'product_name', p.post_title,
      'product_slug', p.post_name,
      'thumbnail_id', COALESCE(pm.meta_value, ''),
      'image_title', COALESCE(a.post_title, ''),
      'image_url', COALESCE(a.guid, ''),
      'image_alt', COALESCE(alt.meta_value, ''),
      'brand_names', COALESCE((
        SELECT GROUP_CONCAT(t.name ORDER BY LENGTH(t.name), t.name SEPARATOR '|')
        FROM wp4h_term_relationships tr
        JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
        JOIN wp4h_terms t ON t.term_id = tt.term_id
        WHERE tr.object_id = p.ID AND tt.taxonomy = 'pa_brand'
      ), '')
    )
    FROM wp4h_posts p
    LEFT JOIN wp4h_postmeta pm
      ON pm.meta_id = (
        SELECT MIN(pm2.meta_id)
        FROM wp4h_postmeta pm2
        WHERE pm2.post_id = p.ID AND pm2.meta_key = '_thumbnail_id'
      )
    LEFT JOIN wp4h_posts a
      ON a.ID = CAST(pm.meta_value AS UNSIGNED)
    LEFT JOIN wp4h_postmeta alt
      ON alt.post_id = a.ID AND alt.meta_key = '_wp_attachment_image_alt'
    WHERE p.post_type = 'product' AND p.post_status = 'publish'
    ORDER BY p.ID
  `);
}

function queryDuplicateThumbnails() {
  return queryJsonLines(`
    SELECT JSON_OBJECT(
      'product_id', post_id,
      'thumbnail_rows', COUNT(*),
      'thumbnail_ids', GROUP_CONCAT(meta_value ORDER BY meta_id SEPARATOR '|')
    )
    FROM wp4h_postmeta
    WHERE meta_key = '_thumbnail_id'
    GROUP BY post_id
    HAVING COUNT(*) > 1
    ORDER BY post_id
  `);
}

function queryBrands() {
  const rows = queryJsonLines(`
    SELECT JSON_OBJECT('name', t.name)
    FROM wp4h_terms t
    JOIN wp4h_term_taxonomy tt ON tt.term_id = t.term_id
    WHERE tt.taxonomy = 'pa_brand'
    ORDER BY LENGTH(t.name) DESC
  `);
  return [...new Set(rows.map((row) => normalizeBrand(row.name)).filter(Boolean))];
}

function queryJsonLines(sql) {
  const output = execFileSync('wp', [
    `--path=${WP_PATH}`,
    '--allow-root',
    'db',
    'query',
    '--skip-column-names',
    sql,
  ], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 128 });
  return output.split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function readOcr(path) {
  const map = new Map();
  if (!path || !existsSync(path)) return map;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    map.set(String(row.product_id), row);
  }
  return map;
}

function findBrands(value, knownBrands) {
  const text = ` ${normalize(value)} `;
  return knownBrands.filter((brand) => brand && text.includes(` ${brand} `));
}

function firstBrandLike(value, knownBrands) {
  return findBrands(value, knownBrands)[0] || '';
}

function findSizes(value) {
  const matches = String(value || '').toLowerCase()
    .match(/\b\d+(?:[.,]\d+)?\s*(?:ml|g|gm|mg|pcs|pc|pairs|pair)\b/g) || [];
  return [...new Set(matches.map((size) =>
    size
      .replace(/\s+/g, '')
      .replace(',', '.')
      .replace(/gm$/, 'g')
      .replace(/pc$/, 'pcs')
  ))];
}

function firstSize(value) {
  return findSizes(value)[0] || '';
}

function tokenScore(productText, imageText) {
  const productTokens = new Set(tokens(productText));
  const imageTokens = new Set(tokens(imageText));
  if (!productTokens.size) return 0;
  let matched = 0;
  for (const token of productTokens) {
    if (imageTokens.has(token)) matched += 1;
  }
  return Number((matched / productTokens.size).toFixed(3));
}

function tokens(value) {
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !WEAK.has(token) && !/^\d{4,}$/.test(token));
}

function normalizeBrand(value) {
  return normalize(value).replace(/\s+/g, ' ').trim();
}

function preferredBrand(brandNames) {
  return String(brandNames || '')
    .split('|')
    .map((brand) => normalizeBrand(brand))
    .filter(Boolean)
    .sort((a, b) => a.length - b.length)[0] || '';
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&amp;/g, ' and ')
    .replace(/(?<=[a-z])20(?=[a-z0-9])/g, ' ')
    .replace(/[_+/|.-]+/g, ' ')
    .replace(/[^a-z0-9\u0980-\u09ff ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function summarize(rows) {
  const summary = {
    total: rows.length,
    high: 0,
    medium: 0,
    review: 0,
    ok: 0,
    metadataBrandMismatch: 0,
    metadataSizeMismatch: 0,
    ocrBrandMismatch: 0,
    ocrSizeMismatch: 0,
    weakNameMatch: 0,
    missingThumbnail: 0,
    duplicateThumbnailMeta: 0,
    duplicateThumbnailProducts: 0,
  };
  for (const row of rows) {
    summary[row.severity] += 1;
    if (row.flags.includes('metadata_brand_mismatch')) summary.metadataBrandMismatch += 1;
    if (row.flags.includes('metadata_size_mismatch')) summary.metadataSizeMismatch += 1;
    if (row.flags.includes('ocr_visual_brand_mismatch')) summary.ocrBrandMismatch += 1;
    if (row.flags.includes('ocr_visual_size_mismatch')) summary.ocrSizeMismatch += 1;
    if (row.flags.includes('metadata_name_weak_match')) summary.weakNameMatch += 1;
    if (row.flags.includes('missing_thumbnail')) summary.missingThumbnail += 1;
    if (row.flags.includes('duplicate_thumbnail_meta')) summary.duplicateThumbnailMeta += 1;
  }
  return summary;
}

function renderSummary(summary, out) {
  return [
    `report=${out}`,
    `total_products=${summary.total}`,
    `high_visual_mismatch=${summary.high}`,
    `medium_metadata_mismatch=${summary.medium}`,
    `review=${summary.review}`,
    `ok=${summary.ok}`,
    `metadata_brand_mismatch=${summary.metadataBrandMismatch}`,
    `metadata_size_mismatch=${summary.metadataSizeMismatch}`,
    `ocr_visual_brand_mismatch=${summary.ocrBrandMismatch}`,
    `ocr_visual_size_mismatch=${summary.ocrSizeMismatch}`,
    `metadata_name_weak_match=${summary.weakNameMatch}`,
    `missing_thumbnail=${summary.missingThumbnail}`,
    `duplicate_thumbnail_meta=${summary.duplicateThumbnailMeta}`,
    `duplicate_thumbnail_products=${summary.duplicateThumbnailProducts}`,
    '',
  ].join('\n');
}

function writeCsv(path, rows, fields) {
  const body = [
    fields.join(','),
    ...rows.map((row) => fields.map((field) => csv(row[field])).join(',')),
  ].join('\n');
  writeFileSync(path, `${body}\n`, 'utf8');
}

function csv(value) {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

main();
