import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = path.resolve(new URL(import.meta.url).pathname, '../../../..');
const WEB_ROOT = path.join(ROOT, 'apps/web');
const NEXT_CONFIG = path.join(WEB_ROOT, 'next.config.js');
const ENV_FILE = path.join(WEB_ROOT, '.env.local');
const OUT_JSON = path.join(ROOT, 'workspace/audit/active/catalog-route-audit-20260630.json');
const OUT_MD = path.join(ROOT, 'workspace/audit/active/catalog-route-audit-20260630.md');

function parseEnv(text) {
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

function exactProductSource(source) {
  const match = source.match(/^\/(shop|product)\/([^:*()[\]?{}]+)$/);
  if (!match) return null;
  return { kind: match[1], slug: match[2] };
}

function productDestination(destination) {
  const match = destination.match(/^\/shop\/([^:*()[\]?{}]+)$/);
  return match ? match[1] : null;
}

function csvEscape(value) {
  return String(value ?? '').replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
}

async function fetchWooProducts(env) {
  const base = (env.WOO_INTERNAL_URL || env.NEXT_PUBLIC_WOO_URL || 'https://e-mart.com.bd').replace(/\/$/, '');
  const key = env.WOO_CONSUMER_KEY || env.WC_CONSUMER_KEY;
  const secret = env.WOO_CONSUMER_SECRET || env.WC_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new Error('Missing Woo read credentials in apps/web/.env.local');
  }

  const products = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const url = new URL(`${base}/wp-json/wc/v3/products`);
    url.searchParams.set('consumer_key', key);
    url.searchParams.set('consumer_secret', secret);
    url.searchParams.set('status', 'publish');
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));
    url.searchParams.set('orderby', 'id');
    url.searchParams.set('order', 'asc');
    url.searchParams.set('_fields', 'id,name,slug,status');

    const headers = {};
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      headers.Host = 'e-mart.com.bd';
      headers['X-Forwarded-Proto'] = 'https';
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Woo products page ${page} failed: HTTP ${response.status} ${body.slice(0, 160)}`);
    }
    totalPages = Number(response.headers.get('x-wp-totalpages') || totalPages || 1);
    const rows = await response.json();
    products.push(...rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
    })));
    page += 1;
  }
  return products;
}

async function main() {
  const env = parseEnv(await fs.readFile(ENV_FILE, 'utf8'));
  const products = await fetchWooProducts(env);
  const productBySlug = new Map(products.map((product) => [product.slug, product]));

  const require = createRequire(import.meta.url);
  const nextConfig = require(NEXT_CONFIG);
  const redirects = await nextConfig.redirects();

  const liveShopRedirects = [];
  const liveProductRedirectsOffCanonical = [];
  const missingProductDestinations = [];

  for (const redirect of redirects) {
    const sourceProduct = exactProductSource(redirect.source);
    const destSlug = productDestination(redirect.destination);

    if (sourceProduct?.kind === 'shop' && productBySlug.has(sourceProduct.slug)) {
      const expected = `/shop/${sourceProduct.slug}`;
      if (redirect.destination !== expected) {
        liveShopRedirects.push({
          id: productBySlug.get(sourceProduct.slug).id,
          name: productBySlug.get(sourceProduct.slug).name,
          slug: sourceProduct.slug,
          source: redirect.source,
          destination: redirect.destination,
          expected,
        });
      }
    }

    if (sourceProduct?.kind === 'product' && productBySlug.has(sourceProduct.slug)) {
      const expected = `/shop/${sourceProduct.slug}`;
      if (redirect.destination !== expected) {
        liveProductRedirectsOffCanonical.push({
          id: productBySlug.get(sourceProduct.slug).id,
          name: productBySlug.get(sourceProduct.slug).name,
          slug: sourceProduct.slug,
          source: redirect.source,
          destination: redirect.destination,
          expected,
        });
      }
    }

    if (destSlug && !productBySlug.has(destSlug)) {
      missingProductDestinations.push({
        source: redirect.source,
        destination: redirect.destination,
        destinationSlug: destSlug,
        sourceLiveProduct: sourceProduct ? productBySlug.get(sourceProduct.slug) || null : null,
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    productCount: products.length,
    redirectCount: redirects.length,
    findings: {
      liveShopRedirects,
      liveProductRedirectsOffCanonical,
      missingProductDestinations,
    },
  };

  await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const lines = [
    '# Catalog Route Audit — 2026-06-30',
    '',
    `- Published Woo products checked: ${products.length}`,
    `- Next.js redirects checked: ${redirects.length}`,
    `- Live \`/shop/{slug}\` product slugs redirected away from own PDP: ${liveShopRedirects.length}`,
    `- Live legacy \`/product/{slug}\` slugs redirected away from canonical PDP: ${liveProductRedirectsOffCanonical.length}`,
    `- Product redirect destinations whose target slug is not currently published: ${missingProductDestinations.length}`,
    '',
    '## Live /shop Slugs Redirected Away',
    '',
  ];

  if (liveShopRedirects.length) {
    lines.push('| ID | Product | Source | Destination | Expected |', '|---:|---|---|---|---|');
    for (const item of liveShopRedirects) {
      lines.push(`| ${item.id} | ${csvEscape(item.name)} | \`${item.source}\` | \`${item.destination}\` | \`${item.expected}\` |`);
    }
  } else {
    lines.push('None found.');
  }

  lines.push('', '## Live /product Slugs Off Canonical', '');
  if (liveProductRedirectsOffCanonical.length) {
    lines.push('| ID | Product | Source | Destination | Expected |', '|---:|---|---|---|---|');
    for (const item of liveProductRedirectsOffCanonical) {
      lines.push(`| ${item.id} | ${csvEscape(item.name)} | \`${item.source}\` | \`${item.destination}\` | \`${item.expected}\` |`);
    }
  } else {
    lines.push('None found.');
  }

  lines.push('', '## Missing Product Redirect Destinations', '');
  if (missingProductDestinations.length) {
    lines.push('| Source | Destination | Destination slug | Source is live product? |', '|---|---|---|---|');
    for (const item of missingProductDestinations) {
      const live = item.sourceLiveProduct ? `yes: ${item.sourceLiveProduct.id}` : 'no';
      lines.push(`| \`${item.source}\` | \`${item.destination}\` | \`${item.destinationSlug}\` | ${live} |`);
    }
  } else {
    lines.push('None found.');
  }

  await fs.writeFile(OUT_MD, `${lines.join('\n')}\n`);

  console.log(JSON.stringify({
    productCount: products.length,
    redirectCount: redirects.length,
    liveShopRedirects: liveShopRedirects.length,
    liveProductRedirectsOffCanonical: liveProductRedirectsOffCanonical.length,
    missingProductDestinations: missingProductDestinations.length,
    json: OUT_JSON,
    markdown: OUT_MD,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
