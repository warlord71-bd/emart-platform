#!/usr/bin/env node
/**
 * Read-only catalog audit using Lighthouse-aligned checks.
 *
 * Full Lighthouse on thousands of PDPs is too expensive for a live store.
 * This script audits every product URL for crawl/SEO/security/perf-proxy
 * signals, then writes CSV + markdown summary for targeted Lighthouse runs.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SITE = 'https://e-mart.com.bd';
const AUDIT_DIR = 'workspace/audit/active';
const UA = 'Mozilla/5.0 (Linux; Android 10; Googlebot/2.1; +http://www.google.com/bot.html)';

const args = parseArgs(process.argv.slice(2));
const started = new Date();
const stamp = started.toISOString().replace(/[:.]/g, '-').slice(0, 19);

function parseArgs(argv) {
  const out = {
    limit: 0,
    concurrency: 8,
    timeoutMs: 15000,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--limit' && next) {
      out.limit = Number(next) || 0;
      i += 1;
    } else if (arg === '--concurrency' && next) {
      out.concurrency = Math.max(1, Math.min(Number(next) || 8, 20));
      i += 1;
    } else if (arg === '--timeout-ms' && next) {
      out.timeoutMs = Number(next) || 15000;
      i += 1;
    }
  }
  return out;
}

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function textOf(html, pattern) {
  const match = html.match(pattern);
  return match ? decode(match[1]).trim() : '';
}

function decode(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function tags(html, pattern) {
  return Array.from(html.matchAll(pattern), (m) => m[0]);
}

function getAttr(tag, attr) {
  const re = new RegExp(`${attr}=["']([^"']*)["']`, 'i');
  const match = tag.match(re);
  return match ? decode(match[1]) : '';
}

function hasProductJsonLd(html) {
  return /<script[^>]+application\/ld\+json[^>]*>[\s\S]*?"@type"\s*:\s*"?Product"?/i.test(html);
}

function scoreRow(row) {
  let score = 100;
  const flags = [];

  if (row.status !== 200) { score -= 35; flags.push(`STATUS_${row.status}`); }
  if (!row.indexable) { score -= 30; flags.push('NOINDEX_OR_ROBOTS'); }
  if (!row.canonical_ok) { score -= 12; flags.push('CANONICAL'); }
  if (!row.title_ok) { score -= 10; flags.push('TITLE'); }
  if (!row.meta_ok) { score -= 10; flags.push('META_DESC'); }
  if (!row.h1_ok) { score -= 8; flags.push('H1'); }
  if (!row.product_schema) { score -= 15; flags.push('NO_PRODUCT_SCHEMA'); }
  if (row.ttfb_ms > 2500) { score -= 10; flags.push('SLOW_TTFB'); }
  else if (row.ttfb_ms > 1500) { score -= 5; flags.push('TTFB_WARN'); }
  if (row.fetch_ms > 6000) { score -= 8; flags.push('SLOW_FETCH'); }
  if (row.html_kb > 450) { score -= 6; flags.push('LARGE_HTML'); }
  if (row.script_count > 45) { score -= 5; flags.push('SCRIPT_COUNT'); }
  if (row.img_without_alt > 0) { score -= Math.min(8, row.img_without_alt); flags.push('IMG_ALT'); }
  if (!row.lang_ok) { score -= 5; flags.push('LANG'); }

  row.audit_score = Math.max(0, score);
  row.flags = flags.join('|') || 'OK';
  return row;
}

async function fetchText(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = Date.now();
  let ttfb = 0;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    ttfb = Date.now() - t0;
    const text = await res.text();
    return {
      status: res.status,
      url: res.url,
      headers: res.headers,
      text,
      ttfb,
      fetchMs: Date.now() - t0,
      error: '',
    };
  } catch (err) {
    return {
      status: 0,
      url,
      headers: new Headers(),
      text: '',
      ttfb,
      fetchMs: Date.now() - t0,
      error: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function loadProductUrls() {
  const res = await fetch(`${SITE}/sitemap.xml`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  let urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => decode(m[1]))
    .filter((url) => url.startsWith(`${SITE}/shop/`));
  urls = Array.from(new Set(urls)).sort();
  if (args.limit > 0) urls = urls.slice(0, args.limit);
  return urls;
}

async function auditUrl(url) {
  const r = await fetchText(url, args.timeoutMs);
  const html = r.text || '';
  const title = textOf(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const meta = textOf(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)
    || textOf(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
  const canonical = textOf(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i)
    || textOf(html, /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["'][^>]*>/i);
  const robots = textOf(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i);
  const h1 = textOf(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, '').trim();
  const imgs = tags(html, /<img\b[^>]*>/gi);
  const imagesWithoutAlt = imgs.filter((tag) => !getAttr(tag, 'alt').trim()).length;
  const scripts = tags(html, /<script\b[^>]*>/gi);
  const lang = textOf(html, /<html[^>]+lang=["']([^"']+)["']/i);
  const htmlBytes = Buffer.byteLength(html);

  return scoreRow({
    url,
    final_url: r.url,
    status: r.status,
    ttfb_ms: r.ttfb,
    fetch_ms: r.fetchMs,
    html_kb: Math.round(htmlBytes / 1024),
    title_len: title.length,
    title_ok: title.length >= 20 && title.length <= 70,
    meta_len: meta.length,
    meta_ok: meta.length >= 120 && meta.length <= 160,
    canonical,
    canonical_ok: canonical === url,
    robots,
    indexable: r.status === 200 && !/noindex/i.test(robots),
    h1_len: h1.length,
    h1_ok: h1.length > 5,
    product_schema: hasProductJsonLd(html),
    script_count: scripts.length,
    image_count: imgs.length,
    img_without_alt: imagesWithoutAlt,
    lang,
    lang_ok: Boolean(lang),
    error: r.error,
  });
}

async function runPool(items, workerCount, fn) {
  const results = [];
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      const item = items[index];
      const result = await fn(item, index);
      results[index] = result;
      if ((index + 1) % 50 === 0 || index + 1 === items.length) {
        console.log(`audited ${index + 1}/${items.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

function summarize(rows) {
  const summary = {
    total: rows.length,
    ok: rows.filter((r) => r.flags === 'OK').length,
    critical: rows.filter((r) => r.status !== 200 || !r.indexable || !r.product_schema).length,
    avg_score: Math.round(rows.reduce((sum, r) => sum + r.audit_score, 0) / Math.max(1, rows.length)),
    p95_ttfb_ms: percentile(rows.map((r) => r.ttfb_ms).filter(Boolean), 95),
    p95_fetch_ms: percentile(rows.map((r) => r.fetch_ms).filter(Boolean), 95),
    p95_html_kb: percentile(rows.map((r) => r.html_kb).filter(Boolean), 95),
  };
  const flagCounts = new Map();
  for (const row of rows) {
    for (const flag of row.flags.split('|')) {
      if (!flag || flag === 'OK') continue;
      flagCounts.set(flag, (flagCounts.get(flag) || 0) + 1);
    }
  }
  summary.flags = Array.from(flagCounts.entries()).sort((a, b) => b[1] - a[1]);
  return summary;
}

function percentile(values, pct) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((pct / 100) * sorted.length) - 1);
  return sorted[index];
}

async function main() {
  await fs.mkdir(AUDIT_DIR, { recursive: true });
  const urls = await loadProductUrls();
  console.log(`Product URLs: ${urls.length}`);
  const rows = await runPool(urls, args.concurrency, auditUrl);
  const summary = summarize(rows);

  const csvPath = path.join(AUDIT_DIR, `catalog-lighthouse-fast-audit-${stamp}.csv`);
  const mdPath = path.join(AUDIT_DIR, `catalog-lighthouse-fast-audit-${stamp}.md`);

  const columns = [
    'audit_score', 'flags', 'status', 'url', 'ttfb_ms', 'fetch_ms', 'html_kb',
    'title_len', 'meta_len', 'canonical_ok', 'indexable', 'product_schema',
    'script_count', 'image_count', 'img_without_alt', 'lang', 'error',
  ];
  const csv = [
    columns.join(','),
    ...rows.map((row) => columns.map((col) => csvEscape(row[col])).join(',')),
  ].join('\n');
  await fs.writeFile(csvPath, csv);

  const worst = rows
    .filter((row) => row.flags !== 'OK')
    .sort((a, b) => a.audit_score - b.audit_score || b.fetch_ms - a.fetch_ms)
    .slice(0, 30);

  const md = [
    '# Catalog Lighthouse-Aligned Fast Audit',
    '',
    `Date: ${started.toISOString()}`,
    `Total product URLs: ${summary.total}`,
    `Average audit score: ${summary.avg_score}/100`,
    `Clean rows: ${summary.ok}`,
    `Critical rows: ${summary.critical}`,
    `P95 TTFB: ${summary.p95_ttfb_ms} ms`,
    `P95 full HTML fetch: ${summary.p95_fetch_ms} ms`,
    `P95 HTML size: ${summary.p95_html_kb} KB`,
    '',
    '## Flag Counts',
    '',
    ...(summary.flags.length
      ? summary.flags.map(([flag, count]) => `- ${flag}: ${count}`)
      : ['- None']),
    '',
    '## Worst Rows',
    '',
    '| Score | Flags | Status | URL | TTFB | Fetch | HTML KB |',
    '|---:|---|---:|---|---:|---:|---:|',
    ...worst.map((row) => `| ${row.audit_score} | ${row.flags} | ${row.status} | ${row.url} | ${row.ttfb_ms} | ${row.fetch_ms} | ${row.html_kb} |`),
    '',
    'CSV:',
    csvPath,
    '',
  ].join('\n');
  await fs.writeFile(mdPath, md);

  console.log(JSON.stringify({ summary, csvPath, mdPath }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
