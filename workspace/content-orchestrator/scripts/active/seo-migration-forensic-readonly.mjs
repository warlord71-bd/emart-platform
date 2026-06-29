#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = 'https://e-mart.com.bd';
const LOCAL_SITE = 'http://127.0.0.1:3000';
const OUT = path.join(ROOT, 'workspace/audit/active/seo-migration-forensic-20260607.json');

const GSC_404 = path.join(ROOT, 'workspace/audit/archive/processed/gsc-404-report-20260512/Table.csv');
const GSC_404_CHART = path.join(ROOT, 'workspace/audit/archive/processed/gsc-404-report-20260512/Chart.csv');
const GSC_NON_PRODUCT = path.join(ROOT, 'workspace/audit/archive/gsc-exports/organic-traffic-non-product-2026-06-02.csv');
const GMC_REPORT = path.join(ROOT, 'workspace/content-orchestrator/docs/gmc-steps3-6-report-20260605.md');

function localUrl(urlOrPath) {
  const url = new URL(urlOrPath, SITE);
  return `${LOCAL_SITE}${url.pathname}${url.search}`;
}

async function fetchText(urlOrPath, init = {}) {
  const response = await fetch(localUrl(urlOrPath), {
    ...init,
    headers: { Host: 'e-mart.com.bd', ...(init.headers || {}) },
    redirect: init.redirect || 'follow',
  });
  return { response, text: await response.text() };
}

async function fetchHead(urlOrPath, redirect = 'manual') {
  return fetch(localUrl(urlOrPath), {
    method: 'HEAD',
    redirect,
    headers: { Host: 'e-mart.com.bd' },
  });
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"' && quoted && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      values.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
}

function classifyUrl(value) {
  const url = new URL(value, SITE);
  const p = url.pathname;
  if (p.startsWith('/product-category/')) return 'legacy_product_category';
  if (p.startsWith('/product-tag/')) return 'legacy_product_tag';
  if (p.startsWith('/product-brand/')) return 'legacy_product_brand';
  if (p.startsWith('/product/')) return 'legacy_product';
  if (p.startsWith('/shop/')) return 'current_product';
  if (p === '/shop' || p.startsWith('/shop/')) return 'current_shop';
  if (p.startsWith('/category/')) return 'current_category';
  if (p.startsWith('/brands/')) return 'current_brand';
  if (p.startsWith('/concerns/')) return 'current_concern';
  if (p.startsWith('/ingredients/')) return 'current_ingredient';
  if (p.startsWith('/origins/')) return 'current_origin';
  if (p.startsWith('/blog/')) return 'current_blog';
  if (url.search) return 'query_variant';
  return 'other';
}

function summarize(values, fn) {
  const counts = {};
  for (const value of values) {
    const key = fn(value);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function extractCanonical(html) {
  return html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1]
    || null;
}

function extractSchemaTypes(html) {
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const types = new Set();
  for (const match of matches) {
    try {
      const json = JSON.parse(match[1]);
      const nodes = Array.isArray(json) ? json : [json, ...(Array.isArray(json?.['@graph']) ? json['@graph'] : [])];
      for (const node of nodes) {
        const t = node?.['@type'];
        if (Array.isArray(t)) t.forEach((x) => types.add(String(x)));
        else if (t) types.add(String(t));
      }
    } catch {
      types.add('parse_error');
    }
  }
  return [...types].sort();
}

async function redirectChain(urlOrPath, max = 8) {
  const chain = [];
  let current = urlOrPath;
  for (let i = 0; i < max; i += 1) {
    const response = await fetchHead(current, 'manual');
    const location = response.headers.get('location');
    chain.push({
      url: new URL(current, SITE).pathname + new URL(current, SITE).search,
      status: response.status,
      location,
    });
    if (!location || response.status < 300 || response.status >= 400) break;
    current = new URL(location, new URL(current, SITE)).toString();
  }
  return chain;
}

async function pageAudit(url) {
  const { response, text } = await fetchText(url);
  return {
    url,
    status: response.status,
    canonical: extractCanonical(text),
    robots: text.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i)?.[1] || null,
    schemaTypes: extractSchemaTypes(text),
    title: text.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || null,
  };
}

async function readLines(file) {
  try {
    const content = await fs.readFile(file, 'utf8');
    return content.split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

async function main() {
  const sitemap = await fetchText('/sitemap.xml');
  const sitemapUrls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  const currentSamples = [];
  for (const cluster of ['current_product', 'current_category', 'current_brand', 'current_concern', 'current_ingredient', 'current_blog', 'other']) {
    currentSamples.push(...sitemapUrls.filter((u) => classifyUrl(u) === cluster).slice(0, 5));
  }

  const gsc404Lines = (await readLines(GSC_404)).slice(1);
  const gsc404Urls = gsc404Lines.map((line) => parseCsvLine(line)[0]).filter(Boolean);

  const gscOrganicLines = (await readLines(GSC_NON_PRODUCT)).filter((line) => line && !line.startsWith('Name:') && !line.startsWith('"Time') && !line.startsWith('URL,'));
  const organicRows = gscOrganicLines.map((line) => {
    const [url, clicks, impressions, ctr, purchases] = parseCsvLine(line);
    return { url, clicks: Number(clicks || 0), impressions: Number(impressions || 0), ctr: Number(ctr || 0), purchases: Number(purchases || 0), cluster: classifyUrl(`https://${url}`) };
  });

  const chartLines = (await readLines(GSC_404_CHART)).slice(1);
  const gsc404Chart = chartLines.map((line) => {
    const [date, affected] = parseCsvLine(line);
    return { date, affected: Number(affected || 0) };
  });

  const gmcReport = await fs.readFile(GMC_REPORT, 'utf8').catch(() => '');

  const legacySamples = [
    '/product/cerave-skin-renewing-night-cream-48g/',
    '/product/cerave-skin-renewing-night-cream-48g',
    '/product-category/body-care-products/?per_page=36&add-to-cart=2809',
    '/product-tag/snail/?orderby=date&filter_brand=mary-may',
    '/brands/april-skin',
    '/shop/cosrx-advanced-snail-96-mucin-power-essence-30ml-mini',
    ...gsc404Urls.slice(0, 12).map((u) => new URL(u).pathname + new URL(u).search),
  ];

  const result = {
    generatedAt: new Date().toISOString(),
    dataLimitations: [
      'No callable GSC API / URL Inspection connector exposed in this Codex session.',
      'No callable GA4 connector exposed in this Codex session.',
      'No callable Merchant Center connector exposed in this Codex session.',
      'Ahrefs Site Audit connector returned insufficient plan.',
      'Uses stored GSC/GMC exports plus live local Next.js HTTP checks.',
    ],
    sitemap: {
      status: sitemap.response.status,
      total: sitemapUrls.length,
      clusters: summarize(sitemapUrls, classifyUrl),
    },
    gsc404Export: {
      source: GSC_404,
      rows: gsc404Urls.length,
      clusters: summarize(gsc404Urls, classifyUrl),
      chart: {
        first: gsc404Chart[0] || null,
        last: gsc404Chart[gsc404Chart.length - 1] || null,
        max: gsc404Chart.reduce((a, b) => (b.affected > (a?.affected || 0) ? b : a), null),
      },
    },
    gscOrganicExport: {
      source: GSC_NON_PRODUCT,
      rows: organicRows.length,
      clusters: summarize(organicRows.map((r) => `https://${r.url}`), classifyUrl),
      topLegacyProductRows: organicRows.filter((r) => r.cluster === 'legacy_product').slice(0, 15),
      totalsByCluster: Object.entries(organicRows.reduce((acc, row) => {
        acc[row.cluster] ||= { clicks: 0, impressions: 0, purchases: 0, rows: 0 };
        acc[row.cluster].clicks += row.clicks;
        acc[row.cluster].impressions += row.impressions;
        acc[row.cluster].purchases += row.purchases;
        acc[row.cluster].rows += 1;
        return acc;
      }, {})).sort(([a], [b]) => a.localeCompare(b)),
    },
    gmcReportExtract: gmcReport.split(/\r?\n/).slice(0, 35),
    liveRedirectSamples: await Promise.all(legacySamples.map(async (url) => ({ input: url, chain: await redirectChain(url) }))),
    livePageSamples: await Promise.all(currentSamples.map(pageAudit)),
  };

  await fs.writeFile(OUT, `${JSON.stringify(result, null, 2)}\n`);
  console.log(OUT);
  console.log(JSON.stringify({
    sitemapTotal: result.sitemap.total,
    sitemapClusters: result.sitemap.clusters,
    gsc404Rows: result.gsc404Export.rows,
    gsc404Clusters: result.gsc404Export.clusters,
    gsc404Chart: result.gsc404Export.chart,
    organicTotalsByCluster: result.gscOrganicExport.totalsByCluster,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
