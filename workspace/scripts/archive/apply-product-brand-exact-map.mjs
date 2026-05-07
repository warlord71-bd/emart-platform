#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const WP_PATH = process.env.WP_PATH || '/var/www/wordpress';
const INPUT =
  process.env.INPUT ||
  '/root/emart-platform/workspace/audit/seo/brand-source-unification-20260503/exact-auto-map-candidates.csv';
const OUT_DIR =
  process.env.OUT_DIR ||
  '/root/emart-platform/workspace/audit/seo/brand-source-unification-20260503/apply-exact-20260503';
const APPLY = process.argv.includes('--apply');

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const rows = readCsv(INPUT);
  const products = queryJsonLines(`
    SELECT JSON_OBJECT(
      'id', p.ID,
      'product_brand_slugs', COALESCE(pb.brand_slugs, '')
    )
    FROM wp4h_posts p
    LEFT JOIN (
      SELECT tr.object_id, GROUP_CONCAT(t.slug ORDER BY t.slug SEPARATOR '|') brand_slugs
      FROM wp4h_term_relationships tr
      JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id AND tt.taxonomy='product_brand'
      JOIN wp4h_terms t ON t.term_id=tt.term_id
      GROUP BY tr.object_id
    ) pb ON pb.object_id=p.ID
    WHERE p.post_type='product' AND p.post_status='publish'
  `);
  const productById = new Map(products.map((product) => [String(product.id), product]));
  const terms = queryJsonLines(`
    SELECT JSON_OBJECT('term_taxonomy_id', tt.term_taxonomy_id, 'term_id', t.term_id, 'slug', t.slug, 'name', t.name)
    FROM wp4h_terms t
    JOIN wp4h_term_taxonomy tt ON tt.term_id=t.term_id
    WHERE tt.taxonomy='product_brand'
  `);
  const termBySlug = new Map(terms.map((term) => [term.slug, term]));

  const planned = [];
  const skipped = [];

  for (const row of rows) {
    const product = productById.get(String(row.product_id));
    const term = termBySlug.get(row.target_product_brand_slug);
    const existing = split(product?.product_brand_slugs);

    if (!product) {
      skipped.push({ ...row, skip_reason: 'product_not_published_or_missing' });
      continue;
    }
    if (!term) {
      skipped.push({ ...row, skip_reason: 'target_product_brand_term_missing' });
      continue;
    }
    if (existing.length) {
      skipped.push({ ...row, skip_reason: `product_brand_already_assigned:${existing.join('|')}` });
      continue;
    }

    planned.push({
      ...row,
      term_taxonomy_id: term.term_taxonomy_id,
      target_product_brand_name: term.name,
      target_product_brand_slug: term.slug,
    });
  }

  const backupPath = join(OUT_DIR, 'pre-apply-product-brand-backup.tsv');
  writeFileSync(backupPath, queryTsv(`
    SELECT p.ID product_id, p.post_title product_name, t.term_id, tt.term_taxonomy_id, t.slug, t.name
    FROM wp4h_posts p
    JOIN wp4h_term_relationships tr ON tr.object_id=p.ID
    JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id AND tt.taxonomy='product_brand'
    JOIN wp4h_terms t ON t.term_id=tt.term_id
    WHERE p.post_type='product' AND p.post_status='publish'
    ORDER BY p.ID, t.name
  `), 'utf8');

  const insertSqlPath = join(OUT_DIR, 'apply-inserts.sql');
  const rollbackSqlPath = join(OUT_DIR, 'rollback-inserts.sql');
  writeFileSync(insertSqlPath, renderInsertSql(planned), 'utf8');
  writeFileSync(rollbackSqlPath, renderRollbackSql(planned), 'utf8');
  writeCsv(join(OUT_DIR, 'planned-apply.csv'), planned, [
    'product_id',
    'product_name',
    'product_slug',
    'source_pa_brand_name',
    'source_pa_brand_slug',
    'target_product_brand_name',
    'target_product_brand_slug',
    'term_taxonomy_id',
    'reason',
  ]);
  writeCsv(join(OUT_DIR, 'skipped.csv'), skipped, [
    'product_id',
    'product_name',
    'product_slug',
    'source_pa_brand_name',
    'source_pa_brand_slug',
    'target_product_brand_name',
    'target_product_brand_slug',
    'reason',
    'skip_reason',
  ]);

  if (APPLY && planned.length) {
    wpDbQuery(readFileSync(insertSqlPath, 'utf8'));
    refreshProductBrandCounts();
  }

  const summary = [
    `input=${INPUT}`,
    `output_dir=${OUT_DIR}`,
    `mode=${APPLY ? 'apply' : 'dry-run'}`,
    `input_rows=${rows.length}`,
    `planned_inserts=${planned.length}`,
    `skipped=${skipped.length}`,
    `backup_tsv=${backupPath}`,
    `insert_sql=${insertSqlPath}`,
    `rollback_sql=${rollbackSqlPath}`,
    '',
  ].join('\n');
  writeFileSync(join(OUT_DIR, 'summary.txt'), summary, 'utf8');
  console.log(summary);
}

function renderInsertSql(rows) {
  if (!rows.length) return '';
  const values = rows.map((row) =>
    `(${Number(row.product_id)},${Number(row.term_taxonomy_id)},0)`
  ).join(',\n');
  return `INSERT IGNORE INTO wp4h_term_relationships (object_id, term_taxonomy_id, term_order)\nVALUES\n${values};\n`;
}

function renderRollbackSql(rows) {
  if (!rows.length) return '';
  return rows.map((row) =>
    `DELETE FROM wp4h_term_relationships WHERE object_id=${Number(row.product_id)} AND term_taxonomy_id=${Number(row.term_taxonomy_id)};`
  ).join('\n') + '\n';
}

function refreshProductBrandCounts() {
  wpEval(`
    $tax = get_taxonomy('product_brand');
    $term_taxonomy_ids = $GLOBALS['wpdb']->get_col("SELECT term_taxonomy_id FROM {$GLOBALS['wpdb']->term_taxonomy} WHERE taxonomy='product_brand'");
    wp_update_term_count_now(array_map('intval', $term_taxonomy_ids), 'product_brand');
  `);
}

function queryJsonLines(sql) {
  return queryTsv(sql).split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function queryTsv(sql) {
  return execFileSync('wp', [
    `--path=${WP_PATH}`,
    '--allow-root',
    'db',
    'query',
    '--skip-column-names',
    sql,
  ], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 128 });
}

function wpDbQuery(sql) {
  execFileSync('wp', [
    `--path=${WP_PATH}`,
    '--allow-root',
    'db',
    'query',
    sql,
  ], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 128 });
}

function wpEval(code) {
  execFileSync('wp', [
    `--path=${WP_PATH}`,
    '--allow-root',
    'eval',
    code,
  ], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 128 });
}

function readCsv(path) {
  const text = readFileSync(path, 'utf8').trim();
  const records = parseCsv(text);
  const headers = records.shift() || [];
  return records.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ''])));
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

function split(value) {
  return String(value || '').split('|').map((item) => item.trim()).filter(Boolean);
}

main();
