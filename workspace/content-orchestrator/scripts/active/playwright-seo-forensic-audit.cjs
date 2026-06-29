#!/usr/bin/env node
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const ROOT = process.cwd();
const SITE = 'https://e-mart.com.bd';
const STAMP = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
const OUT_DIR = path.join(ROOT, 'workspace/audit/active');
const SHOT_DIR = path.join(OUT_DIR, `playwright-seo-forensic-${STAMP}-screens`);
const OUT_JSON = path.join(OUT_DIR, `playwright-seo-forensic-${STAMP}.json`);
const OUT_MD = path.join(OUT_DIR, `playwright-seo-forensic-${STAMP}.md`);

const GSC_404 = path.join(ROOT, 'workspace/audit/archive/processed/gsc-404-report-20260512/Table.csv');
const GSC_ORGANIC = path.join(ROOT, 'workspace/audit/archive/gsc-exports/organic-traffic-non-product-2026-06-02.csv');
const CATALOG_GAP = path.join(ROOT, 'workspace/audit/archive/catalog-gap-gsc-2026-06-02.csv');

function findPlaywrightModule() {
  const base = '/root/.npm/_npx';
  const candidates = [];
  for (const entry of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    const pkg = path.join(base, entry, 'node_modules/playwright/package.json');
    if (fs.existsSync(pkg)) candidates.push(path.dirname(pkg));
  }
  candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (!candidates[0]) {
    throw new Error('No cached Playwright package found. Run: npx playwright --version');
  }
  return candidates[0];
}

const { chromium } = require(findPlaywrightModule());

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

async function readLines(file) {
  try {
    return (await fsp.readFile(file, 'utf8')).split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

function classifyUrl(value) {
  const url = new URL(value, SITE);
  const p = url.pathname;
  if (p.startsWith('/product-category/')) return 'legacy_product_category';
  if (p.startsWith('/product-tag/')) return 'legacy_product_tag';
  if (p.startsWith('/product-brand/')) return 'legacy_product_brand';
  if (p.startsWith('/product/')) return 'legacy_product';
  if (p.startsWith('/shop/')) return 'current_product';
  if (p === '/shop') return 'current_shop';
  if (p.startsWith('/category/')) return 'current_category';
  if (p.startsWith('/brands/')) return 'current_brand';
  if (p.startsWith('/concerns/')) return 'current_concern';
  if (p.startsWith('/ingredients/')) return 'current_ingredient';
  if (p.startsWith('/origins/')) return 'current_origin';
  if (p.startsWith('/blog/')) return 'current_blog';
  if (url.search) return 'query_variant';
  return 'other';
}

function countBy(items, fn) {
  return items.reduce((acc, item) => {
    const key = fn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function normalizeCanonical(value) {
  if (!value) return null;
  const url = new URL(value, SITE);
  const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '');
  return `${url.origin}${pathname}${url.search}`;
}

async function redirectChain(input, max = 8) {
  const chain = [];
  let current = new URL(input, SITE).toString();
  for (let i = 0; i < max; i += 1) {
    let response;
    try {
      response = await fetch(current, { method: 'HEAD', redirect: 'manual' });
    } catch {
      response = await fetch(current, { method: 'GET', redirect: 'manual' });
    }
    const location = response.headers.get('location');
    chain.push({
      url: new URL(current).pathname + new URL(current).search,
      status: response.status,
      location,
    });
    if (!location || response.status < 300 || response.status >= 400) break;
    current = new URL(location, current).toString();
  }
  return chain;
}

function extractSchemaData(rawItems) {
  const types = new Set();
  const warnings = [];
  const productSummaries = [];
  const breadcrumbSummaries = [];

  for (const raw of rawItems) {
    try {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : [parsed, ...(Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [])];
      for (const node of nodes) {
        const type = node?.['@type'];
        if (Array.isArray(type)) type.forEach((t) => types.add(String(t)));
        else if (type) types.add(String(type));

        const typeList = Array.isArray(type) ? type : [type];
        if (typeList.includes('Product')) {
          productSummaries.push({
            name: node.name || null,
            sku: node.sku || null,
            brand: typeof node.brand === 'string' ? node.brand : node.brand?.name || null,
            hasOffers: Boolean(node.offers),
            offerPrice: node.offers?.price || null,
            availability: node.offers?.availability || null,
            hasAggregateRating: Boolean(node.aggregateRating),
            reviewCount: node.aggregateRating?.reviewCount || null,
          });
        }
        if (typeList.includes('BreadcrumbList')) {
          const items = Array.isArray(node.itemListElement) ? node.itemListElement : [];
          breadcrumbSummaries.push({
            count: items.length,
            lastName: items.at(-1)?.name || null,
            lastItem: items.at(-1)?.item || null,
          });
        }
      }
    } catch (error) {
      warnings.push(`json_ld_parse_error:${error.message}`);
    }
  }

  return {
    types: [...types].sort(),
    warnings,
    products: productSummaries,
    breadcrumbs: breadcrumbSummaries,
  };
}

async function auditPage(context, browser, url, screenshot = false) {
  const page = await context.newPage();
  const consoleMessages = [];
  const failedRequests = [];
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) {
      consoleMessages.push({ type: msg.type(), text: msg.text().slice(0, 300) });
    }
  });
  page.on('requestfailed', (request) => {
    failedRequests.push({
      url: request.url().slice(0, 240),
      failure: request.failure()?.errorText || 'unknown',
    });
  });

  let response = null;
  let audit;
  try {
    response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    audit = await page.evaluate(() => {
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null;
      const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content') || null;
      const links = [...document.querySelectorAll('a[href]')].map((a) => a.href);
      const internalLinks = links.filter((href) => {
        try { return new URL(href).hostname === location.hostname; } catch { return false; }
      });
      const bodyText = document.body?.innerText || '';
      const rawSchemas = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent || '');
      return {
        title: document.title,
        canonical,
        robots,
        h1: [...document.querySelectorAll('h1')].map((h) => h.innerText.trim()).filter(Boolean),
        h2Count: document.querySelectorAll('h2').length,
        bodyTextLength: bodyText.replace(/\s+/g, ' ').trim().length,
        internalLinkCount: internalLinks.length,
        uniqueInternalLinkCount: new Set(internalLinks.map((href) => {
          const u = new URL(href);
          return `${u.origin}${u.pathname.replace(/\/+$/, '') || '/'}${u.search}`;
        })).size,
        rawSchemas,
        imageCount: document.images.length,
        visibleImageCount: [...document.images].filter((img) => img.complete && img.naturalWidth > 0).length,
      };
    });
  } catch (error) {
    audit = { error: error.message };
  }

  let screenshotPath = null;
  if (screenshot) {
    const slug = new URL(url).pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
    screenshotPath = path.join(SHOT_DIR, `${slug}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {});
  }

  const finalUrl = page.url();
  await page.close();

  const schema = extractSchemaData(audit.rawSchemas || []);
  const normalizedFinal = normalizeCanonical(finalUrl);
  const normalizedCanonical = normalizeCanonical(audit.canonical);

  return {
    inputUrl: url,
    finalUrl,
    status: response?.status() || null,
    cluster: classifyUrl(finalUrl),
    title: audit.title || null,
    canonical: audit.canonical || null,
    canonicalMatchesFinal: normalizedCanonical === normalizedFinal,
    robots: audit.robots || null,
    h1: audit.h1 || [],
    h2Count: audit.h2Count || 0,
    bodyTextLength: audit.bodyTextLength || 0,
    imageCount: audit.imageCount || 0,
    visibleImageCount: audit.visibleImageCount || 0,
    internalLinkCount: audit.internalLinkCount || 0,
    uniqueInternalLinkCount: audit.uniqueInternalLinkCount || 0,
    schema,
    consoleMessages: consoleMessages.slice(0, 12),
    failedRequests: failedRequests.slice(0, 12),
    screenshotPath: screenshotPath ? path.relative(ROOT, screenshotPath) : null,
    error: audit.error || null,
  };
}

function sampleByCluster(urls, cluster, limit) {
  return urls.filter((u) => classifyUrl(u) === cluster).slice(0, limit);
}

function rowsFromCatalogGap(lines) {
  return lines
    .filter((line) => /^(HIGH|MEDIUM|LOW),/.test(line))
    .map((line) => {
      const [priority, category, brand, query, searchRank, trend] = parseCsvLine(line);
      return { priority, category, brand, query, searchRank: Number(searchRank || 0), trend: Number(trend || 0) };
    });
}

async function main() {
  await fsp.mkdir(SHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 EmartPlaywrightAudit/1.0',
    ignoreHTTPSErrors: false,
  });

  const sitemapResponse = await context.request.get(`${SITE}/sitemap.xml`);
  const sitemapXml = await sitemapResponse.text();
  const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  const gsc404Lines = (await readLines(GSC_404)).slice(1);
  const gsc404Urls = gsc404Lines.map((line) => parseCsvLine(line)[0]).filter(Boolean);

  const organicLines = (await readLines(GSC_ORGANIC))
    .filter((line) => line && !line.startsWith('Name:') && !line.startsWith('"Time') && !line.startsWith('URL,'));
  const organicRows = organicLines.map((line) => {
    const [url, clicks, impressions, ctr, purchases] = parseCsvLine(line);
    return { url: `https://${url}`, clicks: Number(clicks || 0), impressions: Number(impressions || 0), ctr: Number(ctr || 0), purchases: Number(purchases || 0) };
  });

  const catalogGapRows = rowsFromCatalogGap(await readLines(CATALOG_GAP));

  const renderUrls = [
    SITE,
    `${SITE}/shop`,
    ...sampleByCluster(sitemapUrls, 'current_product', 8),
    ...sampleByCluster(sitemapUrls, 'current_category', 6),
    ...sampleByCluster(sitemapUrls, 'current_brand', 6),
    ...sampleByCluster(sitemapUrls, 'current_concern', 5),
    ...sampleByCluster(sitemapUrls, 'current_ingredient', 5),
    ...sampleByCluster(sitemapUrls, 'current_blog', 4),
  ];

  const screenshotTargets = new Set([
    SITE,
    `${SITE}/shop`,
    ...sampleByCluster(sitemapUrls, 'current_product', 1),
    ...sampleByCluster(sitemapUrls, 'current_category', 1),
    ...sampleByCluster(sitemapUrls, 'current_concern', 1),
  ]);

  const renderedPages = [];
  for (const url of [...new Set(renderUrls)]) {
    renderedPages.push(await auditPage(context, browser, url, screenshotTargets.has(url)));
  }

  const legacyInputs = [
    '/product/cerave-skin-renewing-night-cream-48g/',
    '/product/cerave-skin-renewing-night-cream-48g',
    '/product-category/body-care-products/?per_page=36&add-to-cart=2809',
    '/product-tag/snail/?orderby=date&filter_brand=mary-may',
    '/product/im-from-mugwort-sheet-mask-23ml/?add-to-cart=3273',
    ...organicRows.filter((row) => classifyUrl(row.url) === 'legacy_product').slice(0, 20).map((row) => new URL(row.url).pathname + new URL(row.url).search),
    ...gsc404Urls.slice(0, 20).map((url) => new URL(url).pathname + new URL(url).search),
  ];

  const redirectSamples = [];
  for (const input of [...new Set(legacyInputs)]) {
    redirectSamples.push({ input, chain: await redirectChain(input) });
  }

  await browser.close();

  const pagesWithIssues = renderedPages.filter((p) =>
    p.error ||
    p.status >= 400 ||
    !p.canonicalMatchesFinal ||
    p.schema.warnings.length ||
    (p.cluster === 'current_product' && !p.schema.types.includes('Product')) ||
    (['current_category', 'current_brand', 'current_concern', 'current_ingredient'].includes(p.cluster) && !p.schema.types.includes('CollectionPage')) ||
    p.consoleMessages.some((m) => m.type === 'error')
  );

  const redirectIssues = redirectSamples.filter((sample) =>
    sample.chain.length > 2 ||
    sample.chain.at(-1)?.status >= 400 ||
    ![200, 301, 308].includes(sample.chain.at(-1)?.status)
  );

  const result = {
    generatedAt: new Date().toISOString(),
    method: {
      renderer: 'Playwright Chromium headless mobile viewport 390x844',
      note: 'Read-only audit. No production data or config changed.',
      fontCaveat: 'VPS lacks Bengali fonts; screenshot glyph rendering can show squares, but DOM text extraction remains valid.',
    },
    sitemap: {
      status: sitemapResponse.status(),
      total: sitemapUrls.length,
      clusters: countBy(sitemapUrls, classifyUrl),
    },
    renderedPageSummary: {
      tested: renderedPages.length,
      issueCount: pagesWithIssues.length,
      clusters: countBy(renderedPages.map((p) => p.finalUrl), classifyUrl),
    },
    redirectSummary: {
      tested: redirectSamples.length,
      issueCount: redirectIssues.length,
      overTwoHopCount: redirectSamples.filter((sample) => sample.chain.length > 2).length,
    },
    gscStoredEvidence: {
      gsc404Rows: gsc404Urls.length,
      gsc404Clusters: countBy(gsc404Urls, classifyUrl),
      organicRows: organicRows.length,
      organicTotalsByCluster: Object.fromEntries(Object.entries(organicRows.reduce((acc, row) => {
        const key = classifyUrl(row.url);
        acc[key] ||= { rows: 0, clicks: 0, impressions: 0, purchases: 0 };
        acc[key].rows += 1;
        acc[key].clicks += row.clicks;
        acc[key].impressions += row.impressions;
        acc[key].purchases += row.purchases;
        return acc;
      }, {})).sort(([a], [b]) => a.localeCompare(b))),
    },
    catalogGapEvidence: {
      rows: catalogGapRows.length,
      priorities: countBy(catalogGapRows, (r) => r.priority),
      topCategories: Object.entries(countBy(catalogGapRows, (r) => r.category))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12),
      highPriorityExamples: catalogGapRows.filter((r) => r.priority === 'HIGH').slice(0, 20),
    },
    pagesWithIssues,
    redirectIssues,
    renderedPages,
    redirectSamples,
  };

  await fsp.writeFile(OUT_JSON, `${JSON.stringify(result, null, 2)}\n`);
  await fsp.writeFile(OUT_MD, renderMarkdown(result));

  console.log(JSON.stringify({
    outJson: path.relative(ROOT, OUT_JSON),
    outMd: path.relative(ROOT, OUT_MD),
    screenshots: path.relative(ROOT, SHOT_DIR),
    sitemapTotal: result.sitemap.total,
    renderedPages: result.renderedPageSummary,
    redirectSummary: result.redirectSummary,
    catalogGapEvidence: result.catalogGapEvidence.priorities,
  }, null, 2));
}

function renderMarkdown(result) {
  const lines = [];
  lines.push('# Playwright SEO Forensic Audit — 2026-06-07');
  lines.push('');
  lines.push('Read-only Playwright Chromium audit. No production changes.');
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Sitemap URLs: ${result.sitemap.total}`);
  lines.push(`- Rendered pages tested: ${result.renderedPageSummary.tested}`);
  lines.push(`- Rendered-page issue count: ${result.renderedPageSummary.issueCount}`);
  lines.push(`- Legacy redirect samples tested: ${result.redirectSummary.tested}`);
  lines.push(`- Redirect samples with chains/problems: ${result.redirectSummary.issueCount}`);
  lines.push(`- Redirect samples over 2 hops: ${result.redirectSummary.overTwoHopCount}`);
  lines.push('');
  lines.push('## Sitemap Clusters');
  for (const [cluster, count] of Object.entries(result.sitemap.clusters).sort()) {
    lines.push(`- ${cluster}: ${count}`);
  }
  lines.push('');
  lines.push('## Stored GSC Evidence');
  lines.push(`- GSC 404 rows: ${result.gscStoredEvidence.gsc404Rows}`);
  for (const [cluster, count] of Object.entries(result.gscStoredEvidence.gsc404Clusters).sort()) {
    lines.push(`- 404 ${cluster}: ${count}`);
  }
  lines.push('');
  lines.push('## Redirect Issues');
  for (const sample of result.redirectIssues.slice(0, 25)) {
    lines.push(`- ${sample.input}: ${sample.chain.map((h) => `${h.status}${h.location ? ` -> ${h.location}` : ''}`).join(' | ')}`);
  }
  lines.push('');
  lines.push('## Rendered Page Issues');
  for (const page of result.pagesWithIssues.slice(0, 25)) {
    lines.push(`- ${page.inputUrl}: status=${page.status}, canonicalMatch=${page.canonicalMatchesFinal}, schemas=${page.schema.types.join(',')}, consoleErrors=${page.consoleMessages.filter((m) => m.type === 'error').length}`);
  }
  lines.push('');
  lines.push('## Catalog Gap Evidence');
  lines.push(`- Rows: ${result.catalogGapEvidence.rows}`);
  for (const [priority, count] of Object.entries(result.catalogGapEvidence.priorities).sort()) {
    lines.push(`- ${priority}: ${count}`);
  }
  lines.push('');
  lines.push('Top categories:');
  for (const [category, count] of result.catalogGapEvidence.topCategories) {
    lines.push(`- ${category}: ${count}`);
  }
  lines.push('');
  lines.push('## Screenshot Directory');
  lines.push(result.renderedPages.map((p) => p.screenshotPath).filter(Boolean).map((p) => `- ${p}`).join('\n'));
  lines.push('');
  return `${lines.join('\n')}\n`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
