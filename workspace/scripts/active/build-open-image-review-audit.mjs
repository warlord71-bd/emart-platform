#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const WP_PATH = process.env.WP_PATH || '/var/www/wordpress';
const AUDIT =
  process.env.AUDIT ||
  '/root/emart-platform/workspace/audit/seo/product-image-brand-size-with-partial-ocr-20260503.csv';
const BASE_AUDIT =
  process.env.BASE_AUDIT ||
  '/root/emart-platform/workspace/audit/seo/product-image-brand-size-20260503.csv';
const SAFE =
  process.env.SAFE ||
  '/root/emart-platform/workspace/audit/seo/product-image-logic-20260503/safe-auto-fixes.csv';
const OUT =
  process.env.OUT ||
  '/root/emart-platform/workspace/audit/seo/product-image-issues-open-review-20260503.csv';

const WEAK = new Set([
  'and', 'bd', 'beauty', 'care', 'cosmetics', 'daily', 'emart', 'face', 'for',
  'bangladesh', 'fresh', 'image', 'in', 'korea', 'ml', 'new', 'official',
  'original', 'price', 'product', 'shop', 'skin', 'skincare', 'the', 'with',
]);

const TYPE_WORDS = new Set([
  'ampoule', 'balm', 'cleanser', 'cream', 'essence', 'foam', 'gel', 'jelly',
  'lotion', 'mask', 'mascara', 'mist', 'moisturizer', 'oil', 'patch', 'powder',
  'scrub', 'serum', 'shampoo', 'soap', 'spray', 'sunscreen', 'toner', 'wash',
]);

const RISK_WORDS = new Set([
  'aha', 'aloe', 'arbutin', 'bha', 'bright', 'brightening', 'cica', 'collagen',
  'color', 'glow', 'gluta', 'hyaluronic', 'kojic', 'niacinamide', 'peptide',
  'propolis', 'retinol', 'salicylic', 'shade', 'snail', 'spf', 'txa', 'vitamin',
]);

function main() {
  mkdirSync(dirname(OUT), { recursive: true });

  const products = queryProducts();
  const attachments = queryAttachments();
  const productById = new Map(products.map((product) => [String(product.id), product]));
  const attachmentById = new Map(attachments.map((attachment) => [String(attachment.id), attachment]));
  const auditById = mergeAuditRows(readCsv(BASE_AUDIT), readCsv(AUDIT));
  const safeRows = readCsv(SAFE);
  const safeById = groupBy(safeRows, 'product_id');
  const candidateIds = new Set([...auditById.keys(), ...safeById.keys()]);
  const outputRows = [];
  const seen = new Set();
  const summary = {
    input_products: candidateIds.size,
    written_rows: 0,
    already_fixed_skipped: 0,
    logical_ok_skipped: 0,
    not_live_skipped: 0,
    strict_safe_candidate: 0,
    variant_review: 0,
    wrong_image_review: 0,
    duplicate_thumbnail_review: 0,
    missing_thumbnail_review: 0,
  };

  for (const id of [...candidateIds].sort((a, b) => Number(a) - Number(b))) {
    const product = productById.get(String(id));
    const audit = auditById.get(String(id));
    const safeCandidates = safeById.get(String(id)) || [];
    if (!product) {
      summary.not_live_skipped += 1;
      continue;
    }

    const productName = product?.product_name || audit?.product_name || safeCandidates[0]?.product_name || '';
    const productSlug = product?.product_slug || audit?.product_slug || safeCandidates[0]?.product_slug || '';
    const productUrl = audit?.product_url || `https://e-mart.com.bd/shop/${productSlug}`;
    const rawThumbnailIds = (product?.thumbnail_ids || audit?.all_thumbnail_ids || audit?.thumbnail_id || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean);
    const thumbnailIds = unique(rawThumbnailIds);
    const currentTitles = thumbnailIds.map((thumbId) => attachmentById.get(thumbId)?.title || '').filter(Boolean);
    const currentText = currentTitles.join(' ');
    const hasDuplicate = Number(product?.thumbnail_rows || 0) > 1;
    const missingThumbnail = thumbnailIds.length === 0;

    if (missingThumbnail) {
      addRow('missing_thumbnail_review', 'missing_thumbnail', 'No live _thumbnail_id value found.', '');
      continue;
    }

    const currentLooksOk = logicalMatch(productName, currentText);
    const safeDecision = pickSafeDecision(productName, thumbnailIds, safeCandidates);

    if (hasDuplicate) {
      const reason = currentLooksOk
        ? 'Multiple live _thumbnail_id rows exist; current visible image name looks plausible but duplicate rows should be cleaned.'
        : 'Multiple live _thumbnail_id rows exist and current image text is not a clean logical match.';
      addRow('duplicate_thumbnail_review', 'duplicate_thumbnail', reason, safeDecision?.row || '');
      continue;
    }

    if (safeDecision?.alreadyFixed) {
      summary.already_fixed_skipped += 1;
      continue;
    }

    if (safeDecision && !safeDecision.exact) {
      addRow(safeDecision.status, safeDecision.issueType, safeDecision.reason, safeDecision.row);
      continue;
    }

    if (safeDecision?.exact && !thumbnailIds.includes(String(safeDecision.row.new_thumbnail_id))) {
      addRow(
        'strict_safe_candidate',
        'recommended_exact_match_not_current',
        safeDecision.reason,
        safeDecision.row
      );
      continue;
    }

    const flags = String(audit?.flags || '');
    const seriousAuditFlag =
      flags.includes('ocr_visual_') ||
      flags.includes('metadata_brand_mismatch') ||
      flags.includes('metadata_size_mismatch') ||
      flags.includes('metadata_name_weak_match');

    if (seriousAuditFlag && !currentLooksOk) {
      addRow(
        flags.includes('ocr_visual_') ? 'wrong_image_review' : 'variant_review',
        flags,
        `Audit flags remain open against current live image: ${flags}`,
        ''
      );
      continue;
    }

    summary.logical_ok_skipped += 1;

    function addRow(status, issueType, reason, safeRow) {
      const key = `${id}:${status}:${issueType}:${safeRow?.new_thumbnail_id || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      outputRows.push({
        status,
        product_id: id,
        product_name: productName,
        product_url: productUrl,
        current_thumbnail_id: thumbnailIds.join('|'),
        current_image_title: currentTitles.join(' | '),
        suggested_thumbnail_id: safeRow?.new_thumbnail_id || '',
        suggested_image_title: safeRow?.new_thumbnail_title || '',
        issue_type: issueType,
        reason,
        all_thumbnail_ids: rawThumbnailIds.join('|'),
        manual_decision: '',
        correct_thumbnail_id: '',
        notes: '',
      });
      summary[status] = (summary[status] || 0) + 1;
    }
  }

  writeCsv(OUT, outputRows, [
    'status',
    'product_id',
    'product_name',
    'product_url',
    'current_thumbnail_id',
    'current_image_title',
    'suggested_thumbnail_id',
    'suggested_image_title',
    'issue_type',
    'reason',
    'all_thumbnail_ids',
    'manual_decision',
    'correct_thumbnail_id',
    'notes',
  ]);

  summary.written_rows = outputRows.length;
  writeFileSync(`${OUT.replace(/\.csv$/i, '')}.summary.txt`, renderSummary(summary), 'utf8');
  console.log(renderSummary(summary));
  console.log(`out=${OUT}`);
}

function pickSafeDecision(productName, currentThumbnailIds, rows) {
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => Number(b.new_score || 0) - Number(a.new_score || 0));
  for (const row of sorted) {
    if (currentThumbnailIds.includes(String(row.new_thumbnail_id))) {
      return { alreadyFixed: true, row };
    }
  }

  const row = sorted[0];
  const relation = compareProductToImage(productName, row.new_thumbnail_title || '');
  if (relation.exact) {
    return {
      exact: true,
      row,
      reason: 'Suggested image title matches product name after filename-noise normalization.',
    };
  }

  return {
    exact: false,
    row,
    status: relation.wrong ? 'wrong_image_review' : 'variant_review',
    issueType: relation.wrong ? 'safe_candidate_wrong_product_risk' : 'safe_candidate_variant_risk',
    reason: relation.reason,
  };
}

function compareProductToImage(productName, imageTitle) {
  const productSizes = sizes(productName);
  const imageSizes = sizes(imageTitle);
  const productTypes = typedTokens(productName);
  const imageTypes = typedTokens(imageTitle);
  const productRisk = riskTokens(productName);
  const imageRisk = riskTokens(imageTitle);
  const productTokens = meaningfulTokens(productName);
  const imageTokens = meaningfulTokens(imageTitle);
  const missingFromImage = productTokens.filter((token) => !imageTokens.includes(token));
  const extraInImage = imageTokens.filter((token) => !productTokens.includes(token));

  if (productSizes.length && imageSizes.length && !intersects(productSizes, imageSizes)) {
    return {
      exact: false,
      wrong: false,
      reason: `Size differs: product=${productSizes.join('|')} suggested=${imageSizes.join('|')}.`,
    };
  }

  if (productTypes.length && imageTypes.length && !intersects(productTypes, imageTypes)) {
    return {
      exact: false,
      wrong: true,
      reason: `Product type differs: product=${productTypes.join('|')} suggested=${imageTypes.join('|')}.`,
    };
  }

  const riskDiff = [
    ...productRisk.filter((token) => !imageRisk.includes(token)),
    ...imageRisk.filter((token) => !productRisk.includes(token)),
  ];
  if (riskDiff.length) {
    return {
      exact: false,
      wrong: false,
      reason: `Formula/variant wording differs: ${unique(riskDiff).join('|')}.`,
    };
  }

  const importantMissing = missingFromImage.filter((token) => !TYPE_WORDS.has(token));
  const importantExtra = extraInImage.filter((token) => !TYPE_WORDS.has(token));
  if (importantMissing.length || importantExtra.length > 2) {
    return {
      exact: false,
      wrong: false,
      reason: `Name differs after normalization: product_only=${importantMissing.join('|')} suggested_only=${importantExtra.join('|')}.`,
    };
  }

  return { exact: true, wrong: false, reason: '' };
}

function logicalMatch(productName, imageText) {
  if (!imageText) return false;
  return compareProductToImage(productName, imageText).exact;
}

function sizes(value) {
  return unique(normalizeSizeText(value).match(/\b\d+(?:\.\d+)?(?:ml|g|gm|mg|pcs|pc|pair|pairs)\b/g) || [])
    .map((size) => size.replace(/gm$/, 'g').replace(/pc$/, 'pcs').replace(/pairs?$/, 'pair'));
}

function typedTokens(value) {
  return meaningfulTokens(value).filter((token) => TYPE_WORDS.has(token));
}

function riskTokens(value) {
  return meaningfulTokens(value).filter((token) => RISK_WORDS.has(token));
}

function meaningfulTokens(value) {
  return unique(normalize(value)
    .split(/\s+/)
    .filter((token) =>
      token.length > 1 &&
      !WEAK.has(token) &&
      !/^\d{3,}$/.test(token) &&
      !/^(jpg|jpeg|png|webp)$/.test(token)
    ));
}

function normalizeSizeText(value) {
  return normalize(value)
    .replace(/\b(\d)(\d)\b/g, (_, a, b) => `${a}.${b}`)
    .replace(/\b(\d+(?:\.\d+)?)\s+(ml|g|gm|mg|pcs|pc|pair|pairs)\b/g, '$1$2');
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&amp;/g, ' and ')
    .replace(/%20/g, ' ')
    .replace(/(?<=[a-z])20(?=[a-z0-9])/g, ' ')
    .replace(/[_+/|.-]+/g, ' ')
    .replace(/[^a-z0-9\u0980-\u09ff ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mergeAuditRows(...sources) {
  const map = new Map();
  for (const rows of sources) {
    for (const row of rows) {
      if (!row.product_id) continue;
      const old = map.get(String(row.product_id));
      if (!old || severityWeight(row.severity) > severityWeight(old.severity)) {
        map.set(String(row.product_id), row);
      } else if (old) {
        old.flags = unique(`${old.flags || ''}|${row.flags || ''}`.split('|').filter(Boolean)).join('|');
        old.all_thumbnail_ids = old.all_thumbnail_ids || row.all_thumbnail_ids || '';
        old.duplicate_thumbnail_rows = old.duplicate_thumbnail_rows || row.duplicate_thumbnail_rows || '';
      }
    }
  }
  for (const [id, row] of [...map.entries()]) {
    if (row.severity === 'ok' && row.flags === 'ok') map.delete(id);
  }
  return map;
}

function severityWeight(value) {
  return { high: 4, medium: 3, review: 2, ok: 1 }[value] || 0;
}

function queryProducts() {
  return queryJsonLines(`
    SELECT JSON_OBJECT(
      'id', p.ID,
      'product_name', p.post_title,
      'product_slug', p.post_name,
      'thumbnail_ids', COALESCE((
        SELECT GROUP_CONCAT(pm.meta_value ORDER BY pm.meta_id SEPARATOR '|')
        FROM wp4h_postmeta pm
        WHERE pm.post_id = p.ID AND pm.meta_key = '_thumbnail_id'
      ), ''),
      'thumbnail_rows', COALESCE((
        SELECT COUNT(*)
        FROM wp4h_postmeta pm
        WHERE pm.post_id = p.ID AND pm.meta_key = '_thumbnail_id'
      ), 0)
    )
    FROM wp4h_posts p
    WHERE p.post_type = 'product' AND p.post_status = 'publish'
    ORDER BY p.ID
  `);
}

function queryAttachments() {
  return queryJsonLines(`
    SELECT JSON_OBJECT(
      'id', ID,
      'title', post_title,
      'url', guid
    )
    FROM wp4h_posts
    WHERE post_type = 'attachment' AND post_mime_type LIKE 'image/%'
    ORDER BY ID
  `);
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

function readCsv(path) {
  const text = readFileSync(path, 'utf8').trim();
  const rows = parseCsv(text);
  const headers = rows.shift() || [];
  return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ''])));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quote = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quote) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quote = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quote = true;
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
  row.push(cell);
  rows.push(row);
  return rows;
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

function groupBy(rows, field) {
  const map = new Map();
  for (const row of rows) {
    const key = String(row[field] || '');
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

function intersects(a, b) {
  return a.some((item) => b.includes(item));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function renderSummary(summary) {
  return Object.entries(summary).map(([key, value]) => `${key}=${value}`).join('\n') + '\n';
}

main();
