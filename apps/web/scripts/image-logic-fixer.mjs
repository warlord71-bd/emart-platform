#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = process.env.IMAGE_LOGIC_OUT_DIR || `/tmp/emart-image-logic-${stamp()}`;
const APPLY = process.argv.includes('--apply');
const WINDOW = Number(process.env.IMAGE_LOGIC_WINDOW || 8);
const MIN_SCORE = Number(process.env.IMAGE_LOGIC_MIN_SCORE || 0.72);
const MIN_MARGIN = Number(process.env.IMAGE_LOGIC_MIN_MARGIN || 0.18);
const MAX_CURRENT_SCORE = Number(process.env.IMAGE_LOGIC_MAX_CURRENT_SCORE || 0.52);

const WEAK = new Set([
  'and', 'bd', 'beauty', 'care', 'cosmetics', 'daily', 'emart', 'face', 'for',
  'gel', 'global', 'image', 'imported', 'korea', 'korean', 'ml', 'gm', 'g',
  'new', 'original', 'pack', 'pcs', 'product', 'skin', 'skincare', 'the',
  'with',
]);

const COLOR_WORDS = new Set([
  'beige', 'black', 'blue', 'brown', 'burgundy', 'cherry', 'coral', 'dark',
  'gold', 'green', 'grey', 'honey', 'ivory', 'light', 'nude', 'orange', 'pink',
  'porcelain', 'purple', 'red', 'rose', 'silver', 'tan', 'terracotta', 'white',
  'yellow',
]);

const AUTO_REASONS = [
  'nearby_attachment_strong_match',
  'current_thumbnail_weak_or_duplicate',
  'unique_candidate_with_margin',
];

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const products = queryProducts();
  const attachments = queryAttachments();
  const attachmentById = new Map(attachments.map((a) => [a.id, a]));
  const thumbnailUse = countBy(products, (p) => p.thumbnail_id || '');

  const plans = [];
  const manual = [];

  for (const product of products) {
    const current = attachmentById.get(product.thumbnail_id);
    const currentScore = current ? score(product.product_text, current.attachment_text) : 0;
    const candidates = nearbyAttachments(product, attachments)
      .map((attachment) => ({
        attachment,
        score: score(product.product_text, attachment.attachment_text),
        shadePenalty: shadeMismatch(product.product_text, attachment.attachment_text),
      }))
      .map((item) => ({
        ...item,
        finalScore: round3(Math.max(0, item.score - item.shadePenalty)),
      }))
      .sort((a, b) => b.finalScore - a.finalScore);

    const best = candidates[0];
    const second = candidates[1];
    const duplicateCurrent = product.thumbnail_id && (thumbnailUse.get(String(product.thumbnail_id)) || 0) > 1;
    const needsReview = !current || currentScore < MAX_CURRENT_SCORE || duplicateCurrent;

    if (!needsReview) continue;
    if (!best) {
      manual.push(manualRow(product, current, currentScore, '', '', 'no nearby attachment candidates'));
      continue;
    }

    const margin = round3(best.finalScore - (second?.finalScore || 0));
    const alreadyCurrent = String(product.thumbnail_id || '') === String(best.attachment.id);
    const canAuto =
      !alreadyCurrent &&
      best.finalScore >= MIN_SCORE &&
      margin >= MIN_MARGIN &&
      best.shadePenalty === 0 &&
      currentScore <= MAX_CURRENT_SCORE;

    if (canAuto) {
      plans.push({
        product_id: product.id,
        product_name: product.title,
        product_slug: product.slug,
        old_thumbnail_id: product.thumbnail_id || '',
        old_thumbnail_title: current?.title || '',
        old_score: currentScore,
        new_thumbnail_id: best.attachment.id,
        new_thumbnail_title: best.attachment.title,
        new_score: best.finalScore,
        second_score: second?.finalScore || '',
        margin,
        reasons: AUTO_REASONS.join('|'),
      });
    } else {
      manual.push(manualRow(
        product,
        current,
        currentScore,
        best.attachment,
        best.finalScore,
        [
          best.finalScore < MIN_SCORE ? 'best_score_below_threshold' : '',
          margin < MIN_MARGIN ? 'candidate_margin_too_small' : '',
          best.shadePenalty ? 'shade_or_color_conflict' : '',
          alreadyCurrent ? 'best_candidate_already_current' : '',
        ].filter(Boolean).join('|') || 'unsupported_by_logic'
      ));
    }
  }

  const safeCsv = join(OUT_DIR, 'safe-auto-fixes.csv');
  const manualCsv = join(OUT_DIR, 'manual-review.csv');
  const updateSql = join(OUT_DIR, 'apply-safe-fixes.sql');
  const rollbackSql = join(OUT_DIR, 'rollback-safe-fixes.sql');
  const backupTsv = join(OUT_DIR, 'thumbnail-backup.tsv');

  writeCsv(safeCsv, plans, [
    'product_id', 'product_name', 'product_slug',
    'old_thumbnail_id', 'old_thumbnail_title', 'old_score',
    'new_thumbnail_id', 'new_thumbnail_title', 'new_score',
    'second_score', 'margin', 'reasons',
  ]);
  writeCsv(manualCsv, manual, [
    'product_id', 'product_name', 'product_slug',
    'current_thumbnail_id', 'current_thumbnail_title', 'current_score',
    'suggested_thumbnail_id', 'suggested_thumbnail_title', 'suggested_score',
    'reason',
  ]);

  writeFileSync(updateSql, plans.map((row) =>
    `UPDATE wp4h_postmeta SET meta_value='${row.new_thumbnail_id}' WHERE post_id=${row.product_id} AND meta_key='_thumbnail_id' AND meta_value='${row.old_thumbnail_id}';`
  ).join('\n') + (plans.length ? '\n' : ''), 'utf8');
  writeFileSync(rollbackSql, plans.map((row) =>
    `UPDATE wp4h_postmeta SET meta_value='${row.old_thumbnail_id}' WHERE post_id=${row.product_id} AND meta_key='_thumbnail_id';`
  ).join('\n') + (plans.length ? '\n' : ''), 'utf8');

  if (plans.length) {
    const ids = plans.map((row) => row.product_id).join(',');
    const backup = mysql(`
      SELECT post_id, meta_key, meta_value
      FROM emart_live.wp4h_postmeta
      WHERE meta_key='_thumbnail_id' AND post_id IN (${ids})
      ORDER BY post_id
    `);
    writeFileSync(backupTsv, backup, 'utf8');
  } else {
    writeFileSync(backupTsv, '', 'utf8');
  }

  if (APPLY && plans.length) {
    mysqlFile(updateSql);
  }

  writeFileSync(join(OUT_DIR, 'summary.txt'), [
    `output_dir=${OUT_DIR}`,
    `mode=${APPLY ? 'apply' : 'plan'}`,
    `safe_auto_fixes=${plans.length}`,
    `manual_review=${manual.length}`,
    `min_score=${MIN_SCORE}`,
    `min_margin=${MIN_MARGIN}`,
    `max_current_score=${MAX_CURRENT_SCORE}`,
    `window=${WINDOW}`,
    `safe_csv=${safeCsv}`,
    `manual_csv=${manualCsv}`,
    `backup_tsv=${backupTsv}`,
    `update_sql=${updateSql}`,
    `rollback_sql=${rollbackSql}`,
    '',
  ].join('\n'), 'utf8');

  console.log(`Output: ${OUT_DIR}`);
  console.log(`safe_auto_fixes=${plans.length}`);
  console.log(`manual_review=${manual.length}`);
  console.log(`mode=${APPLY ? 'apply' : 'plan'}`);
}

function queryProducts() {
  return mysqlJsonLines(`
    SELECT JSON_OBJECT(
      'id', p.ID,
      'title', p.post_title,
      'slug', p.post_name,
      'thumbnail_id', CAST(pm.meta_value AS UNSIGNED)
    )
    FROM emart_live.wp4h_posts p
    LEFT JOIN emart_live.wp4h_postmeta pm
      ON p.ID=pm.post_id AND pm.meta_key='_thumbnail_id'
    WHERE p.post_type='product' AND p.post_status='publish'
    ORDER BY p.ID
  `).map((row) => ({
    ...row,
    id: Number(row.id),
    thumbnail_id: Number(row.thumbnail_id || 0),
    product_text: `${row.title || ''} ${row.slug || ''}`,
  }));
}

function queryAttachments() {
  return mysqlJsonLines(`
    SELECT JSON_OBJECT(
      'id', ID,
      'title', post_title,
      'slug', post_name,
      'guid', guid
    )
    FROM emart_live.wp4h_posts
    WHERE post_type='attachment' AND post_mime_type LIKE 'image/%'
    ORDER BY ID
  `).map((row) => ({
    ...row,
    id: Number(row.id),
    attachment_text: `${row.title || ''} ${row.slug || ''} ${row.guid || ''}`,
  }));
}

function nearbyAttachments(product, attachments) {
  return attachments.filter((attachment) => Math.abs(attachment.id - product.id) <= WINDOW);
}

function score(productText, imageText) {
  const p = tokenSet(productText);
  const i = tokenSet(imageText);
  if (!p.size || !i.size) return 0;
  let intersection = 0;
  for (const token of p) if (i.has(token)) intersection += 1;
  const recall = intersection / p.size;
  const precision = intersection / i.size;
  const unitBonus = units(productText).some((unit) => units(imageText).includes(unit)) ? 0.08 : 0;
  return round3(Math.min(1, recall * 0.65 + precision * 0.35 + unitBonus));
}

function shadeMismatch(productText, imageText) {
  const pColors = tokens(productText).filter((token) => COLOR_WORDS.has(token));
  if (!pColors.length) return 0;
  const i = tokenSet(imageText);
  const missed = pColors.filter((token) => !i.has(token));
  return missed.length ? 0.22 : 0;
}

function tokens(value) {
  return normalize(value)
    .match(/[a-z0-9]+|[\u0980-\u09ff]+/g)?.filter((token) =>
      token.length > 1 && !WEAK.has(token) && !/^\d{3,5}$/.test(token)
    ) || [];
}

function tokenSet(value) {
  return new Set(tokens(value));
}

function units(value) {
  return normalize(value).match(/\b\d+(?:\.\d+)?(?:ml|g|gm|mg|pcs|pc)\b/g) || [];
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

function manualRow(product, current, currentScore, suggested, suggestedScore, reason) {
  return {
    product_id: product.id,
    product_name: product.title,
    product_slug: product.slug,
    current_thumbnail_id: product.thumbnail_id || '',
    current_thumbnail_title: current?.title || '',
    current_score: currentScore,
    suggested_thumbnail_id: suggested?.id || '',
    suggested_thumbnail_title: suggested?.title || '',
    suggested_score: suggestedScore || '',
    reason,
  };
}

function mysql(query) {
  return execFileSync('mysql', ['-N', '-e', query], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
  });
}

function mysqlFile(path) {
  execFileSync('mysql', ['emart_live', '-N', '-e', `source ${path}`], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
  });
}

function mysqlJsonLines(query) {
  return mysql(query).split('\n').filter(Boolean).map((line) => JSON.parse(line));
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

function countBy(items, fn) {
  const map = new Map();
  for (const item of items) {
    const key = String(fn(item) || '');
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

main();
