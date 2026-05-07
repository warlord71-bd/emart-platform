#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const INPUT = process.env.INPUT || '/root/emart-platform/workspace/audit/seo/product-image-brand-size-20260503.csv';
const OUT_DIR = process.env.OUT_DIR || '/root/emart-platform/workspace/audit/seo/product-image-targeted-ocr-20260503';
const CONCURRENCY = Number(process.env.CONCURRENCY || 6);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 30000);
const WP_ROOT = process.env.WP_ROOT || '/var/www/wordpress';

const reportJsonl = join(OUT_DIR, 'report.jsonl');
const reportCsv = join(OUT_DIR, 'report.csv');
const tmpDir = join(OUT_DIR, 'tmp');

async function main() {
  mkdirSync(tmpDir, { recursive: true });
  const rows = parseCsv(readFileSync(INPUT, 'utf8')).filter((row) => row.severity !== 'ok');
  writeFileSync(reportJsonl, '', 'utf8');
  writeFileSync(reportCsv, [
    'product_id',
    'product_slug',
    'product_name',
    'image_url',
    'ocr_text',
    'error',
  ].join(',') + '\n', 'utf8');

  let completed = 0;
  await runQueue(rows, CONCURRENCY, async (row) => {
    const result = await ocrRow(row);
    append(result);
    completed += 1;
    writeFileSync(join(OUT_DIR, 'progress.json'), JSON.stringify({
      total: rows.length,
      completed,
      updatedAt: new Date().toISOString(),
    }, null, 2), 'utf8');
  });

  console.log(`targeted_ocr_rows=${rows.length}`);
  console.log(`report_jsonl=${reportJsonl}`);
  console.log(`report_csv=${reportCsv}`);
}

async function ocrRow(row) {
  const imagePath = localPath(row.image_url);
  const preparedPath = join(tmpDir, `${row.product_id}-prepared.png`);
  const result = {
    product_id: row.product_id,
    product_slug: row.product_slug,
    product_name: row.product_name,
    image_url: row.image_url,
    ocr_text: '',
    error: '',
  };

  if (!imagePath || !existsSync(imagePath)) {
    return { ...result, error: `missing local file: ${imagePath || row.image_url}` };
  }

  try {
    await execFileAsync('convert', [
      imagePath,
      '-auto-orient',
      '-resize',
      '1400x1400>',
      '-colorspace',
      'Gray',
      '-normalize',
      '-sharpen',
      '0x1',
      preparedPath,
    ], { timeout: TIMEOUT_MS });

    const { stdout } = await execFileAsync('tesseract', [
      preparedPath,
      'stdout',
      '-l',
      'eng',
      '--psm',
      '6',
    ], { timeout: TIMEOUT_MS, maxBuffer: 1024 * 1024 });

    result.ocr_text = stdout.replace(/\s+/g, ' ').trim().slice(0, 700);
  } catch (error) {
    result.error = String(error.message || error).slice(0, 500);
  } finally {
    rmSync(preparedPath, { force: true });
  }

  return result;
}

function localPath(imageUrl) {
  try {
    const url = new URL(imageUrl);
    return join(WP_ROOT, url.pathname.replace(/^\/+/, ''));
  } catch {
    return '';
  }
}

async function runQueue(items, concurrency, worker) {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.max(concurrency, 1) }, async () => {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      await worker(items[current]);
    }
  });
  await Promise.all(workers);
}

function append(result) {
  writeFileSync(reportJsonl, `${JSON.stringify(result)}\n`, { flag: 'a' });
  writeFileSync(reportCsv, [
    result.product_id,
    result.product_slug,
    result.product_name,
    result.image_url,
    result.ocr_text,
    result.error,
  ].map(csv).join(',') + '\n', { flag: 'a' });
}

function parseCsv(text) {
  const rows = [];
  const records = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
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
      records.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    records.push(row);
  }

  const [header, ...body] = records;
  for (const record of body) {
    if (!record.length || record.every((value) => !value)) continue;
    rows.push(Object.fromEntries(header.map((field, index) => [field, record[index] || ''])));
  }
  return rows;
}

function csv(value) {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

main().catch((error) => {
  mkdirSync(dirname(reportJsonl), { recursive: true });
  writeFileSync(join(OUT_DIR, 'error.log'), `${error.stack || error}\n`, 'utf8');
  console.error(error);
  process.exit(1);
});
