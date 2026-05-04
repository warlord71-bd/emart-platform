#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const WP_PATH = process.env.WP_PATH || '/var/www/wordpress';
const OUT_DIR = process.env.OUT_DIR || '/root/emart-platform/workspace/audit/seo/brand-source-unification-20260503';

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const productBrands = queryJsonLines(`
    SELECT JSON_OBJECT('term_id', t.term_id, 'name', t.name, 'slug', t.slug, 'count', tt.count)
    FROM wp4h_terms t
    JOIN wp4h_term_taxonomy tt ON tt.term_id=t.term_id
    WHERE tt.taxonomy='product_brand'
    ORDER BY t.name
  `);
  const products = queryJsonLines(`
    SELECT JSON_OBJECT(
      'id', p.ID,
      'title', p.post_title,
      'slug', p.post_name,
      'pa_brand_slugs', COALESCE(pa.brand_slugs, ''),
      'pa_brand_names', COALESCE(pa.brand_names, ''),
      'product_brand_slugs', COALESCE(pb.brand_slugs, ''),
      'product_brand_names', COALESCE(pb.brand_names, '')
    )
    FROM wp4h_posts p
    LEFT JOIN (
      SELECT tr.object_id, GROUP_CONCAT(t.slug ORDER BY t.slug SEPARATOR '|') brand_slugs,
             GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR '|') brand_names
      FROM wp4h_term_relationships tr
      JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id AND tt.taxonomy='pa_brand'
      JOIN wp4h_terms t ON t.term_id=tt.term_id
      GROUP BY tr.object_id
    ) pa ON pa.object_id=p.ID
    LEFT JOIN (
      SELECT tr.object_id, GROUP_CONCAT(t.slug ORDER BY t.slug SEPARATOR '|') brand_slugs,
             GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR '|') brand_names
      FROM wp4h_term_relationships tr
      JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id AND tt.taxonomy='product_brand'
      JOIN wp4h_terms t ON t.term_id=tt.term_id
      GROUP BY tr.object_id
    ) pb ON pb.object_id=p.ID
    WHERE p.post_type='product' AND p.post_status='publish'
    ORDER BY p.ID
  `);

  const brandByKey = new Map();
  for (const brand of productBrands) {
    for (const key of brandKeys(brand.name, brand.slug)) {
      if (!brandByKey.has(key)) brandByKey.set(key, []);
      brandByKey.get(key).push(brand);
    }
  }

  const autoRows = [];
  const manualRows = [];
  let alreadyAssigned = 0;
  let missingProductBrand = 0;
  let missingPaBrand = 0;

  for (const product of products) {
    const existing = split(product.product_brand_slugs);
    if (existing.length) {
      alreadyAssigned += 1;
      continue;
    }

    missingProductBrand += 1;
    const paSlugs = split(product.pa_brand_slugs);
    const paNames = split(product.pa_brand_names);
    if (!paSlugs.length) {
      missingPaBrand += 1;
      manualRows.push(row(product, '', '', '', '', 'no_pa_brand_to_map'));
      continue;
    }

    const matches = new Map();
    paSlugs.forEach((slug, index) => {
      const name = paNames[index] || slug;
      for (const key of brandKeys(name, slug)) {
        const brands = brandByKey.get(key) || [];
        for (const brand of brands) matches.set(String(brand.term_id), { brand, sourceName: name, sourceSlug: slug });
      }
    });

    if (matches.size === 1) {
      const match = [...matches.values()][0];
      autoRows.push(row(
        product,
        match.sourceName,
        match.sourceSlug,
        match.brand.name,
        match.brand.slug,
        'exact_slug_or_name_match'
      ));
    } else {
      manualRows.push(row(
        product,
        paNames.join('|'),
        paSlugs.join('|'),
        [...matches.values()].map((match) => match.brand.name).join('|'),
        [...matches.values()].map((match) => match.brand.slug).join('|'),
        matches.size > 1 ? 'multiple_product_brand_matches' : 'no_exact_product_brand_match'
      ));
    }
  }

  const backup = queryTsv(`
    SELECT p.ID product_id, p.post_title product_name, t.term_id, t.slug, t.name
    FROM wp4h_posts p
    JOIN wp4h_term_relationships tr ON tr.object_id=p.ID
    JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id AND tt.taxonomy='product_brand'
    JOIN wp4h_terms t ON t.term_id=tt.term_id
    WHERE p.post_type='product' AND p.post_status='publish'
    ORDER BY p.ID, t.name
  `);

  const autoPath = join(OUT_DIR, 'exact-auto-map-candidates.csv');
  const manualPath = join(OUT_DIR, 'manual-review.csv');
  const backupPath = join(OUT_DIR, 'product-brand-current-backup.tsv');
  writeCsv(autoPath, autoRows);
  writeCsv(manualPath, manualRows);
  writeFileSync(backupPath, backup, 'utf8');

  const summary = [
    `output_dir=${OUT_DIR}`,
    `mode=dry-run`,
    `product_brand_reference_terms=${productBrands.length}`,
    `published_products=${products.length}`,
    `already_has_product_brand=${alreadyAssigned}`,
    `missing_product_brand=${missingProductBrand}`,
    `missing_pa_brand=${missingPaBrand}`,
    `exact_auto_map_candidates=${autoRows.length}`,
    `manual_review=${manualRows.length}`,
    `auto_csv=${autoPath}`,
    `manual_csv=${manualPath}`,
    `backup_tsv=${backupPath}`,
    '',
  ].join('\n');
  writeFileSync(join(OUT_DIR, 'summary.txt'), summary, 'utf8');
  console.log(summary);
}

function row(product, sourceName, sourceSlug, targetName, targetSlug, reason) {
  return {
    product_id: product.id,
    product_name: product.title,
    product_slug: product.slug,
    source_pa_brand_name: sourceName,
    source_pa_brand_slug: sourceSlug,
    target_product_brand_name: targetName,
    target_product_brand_slug: targetSlug,
    reason,
    manual_decision: '',
    notes: '',
  };
}

function brandKeys(name, slug) {
  return [...new Set([slug, slugify(name), normalizeName(name), normalizeName(slug)].filter(Boolean))];
}

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function split(value) {
  return String(value || '').split('|').map((item) => item.trim()).filter(Boolean);
}

function queryJsonLines(sql) {
  return queryTsv(`${sql}`).split('\n').filter(Boolean).map((line) => JSON.parse(line));
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

function writeCsv(path, rows) {
  const fields = [
    'product_id',
    'product_name',
    'product_slug',
    'source_pa_brand_name',
    'source_pa_brand_slug',
    'target_product_brand_name',
    'target_product_brand_slug',
    'reason',
    'manual_decision',
    'notes',
  ];
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
