#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = 'https://e-mart.com.bd';
const STAMP = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
const OUT_DIR = path.join(ROOT, 'workspace/audit/active');
const OUT_JSON = path.join(OUT_DIR, `seo-stabilization-audit-${STAMP}.json`);
const OUT_MD = path.join(OUT_DIR, `seo-stabilization-audit-${STAMP}.md`);

const QUERY_VARIANTS = [
  '/shop?sort=popularity',
  '/shop?filter=sale',
  '/shop?price_min=500&price_max=1500',
  '/shop?utm_source=audit&srsltid=audit',
  '/shop?concern=acne-blemish',
  '/shop?ingredients=niacinamide',
  '/shop?skin-type=oily',
  '/category/face-care?sort=popularity',
  '/brands/cosrx?utm_campaign=audit',
  '/concerns/acne-blemish-care?price_min=500',
];

const FAKE_URLS = [
  '/shop/not-a-real-product-test-123',
  '/category/not-a-real-category-test-123',
  '/brands/not-a-real-brand-test-123',
  '/concerns/not-a-real-concern-test-123',
  '/ingredients/not-a-real-ingredient-test-123',
  '/skin-type/not-a-real-skin-type-test-123',
  '/origins/not-a-real-origin-test-123',
  '/shop/definitely-fake-product-codex-seo-audit',
  '/category/definitely-fake-category-codex-seo-audit',
  '/brands/definitely-fake-brand-codex-seo-audit',
];

function urlFor(pathOrUrl) {
  return new URL(pathOrUrl, SITE).toString();
}

async function fetchText(pathOrUrl, init = {}) {
  const response = await fetch(urlFor(pathOrUrl), {
    redirect: 'follow',
    ...init,
    headers: {
      'User-Agent': 'EmartCodexSeoAudit/1.0',
      ...(init.headers || {}),
    },
  });
  return { response, text: await response.text() };
}

function classifyUrl(value) {
  const url = new URL(value, SITE);
  const p = url.pathname;
  if (p === '/') return 'home';
  if (p === '/shop') return 'shop';
  if (p.startsWith('/shop/')) return 'product';
  if (p.startsWith('/category/')) return 'category';
  if (p.startsWith('/brands/')) return 'brand';
  if (p.startsWith('/concerns/')) return 'concern';
  if (p.startsWith('/ingredients/')) return 'ingredient';
  if (p.startsWith('/skin-type/')) return 'skin_type';
  if (p.startsWith('/origins/')) return 'origin';
  if (p.startsWith('/blog/')) return 'blog';
  return 'other';
}

function countBy(values, fn) {
  return values.reduce((acc, value) => {
    const key = fn(value);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function sample(urls, cluster, limit) {
  return urls.filter((u) => classifyUrl(u) === cluster).slice(0, limit);
}

function normalizeUrl(value) {
  if (!value) return null;
  const url = new URL(value, SITE);
  const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '');
  return `${url.protocol}//${url.hostname.toLowerCase()}${pathname}${url.search}`;
}

function titleOf(html) {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || null;
}

function metaDescriptionOf(html) {
  return html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)?.[1]?.trim()
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i)?.[1]?.trim()
    || null;
}

function canonicalOf(html) {
  return html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1]
    || null;
}

function robotsMetaOf(html) {
  return html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i)?.[1] || null;
}

function h1Of(html) {
  return [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((m) => stripTags(m[1]).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function stripTags(value) {
  return String(value || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
}

function internalLinksOf(html) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .filter((href) => href.startsWith('/') || href.startsWith(SITE))
    .map((href) => new URL(href, SITE).toString());
}

function parseJsonLd(html) {
  const raw = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const nodes = [];
  const errors = [];

  for (const item of raw) {
    try {
      const parsed = JSON.parse(item);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of list) {
        nodes.push(node);
        if (Array.isArray(node?.['@graph'])) nodes.push(...node['@graph']);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }

  return { nodes, errors };
}

function typesOf(nodes) {
  const types = new Set();
  for (const node of nodes) {
    const type = node?.['@type'];
    if (Array.isArray(type)) type.forEach((t) => types.add(String(t)));
    else if (type) types.add(String(type));
  }
  return [...types].sort();
}

function findType(nodes, typeName) {
  return nodes.find((node) => {
    const type = node?.['@type'];
    return Array.isArray(type) ? type.includes(typeName) : type === typeName;
  }) || null;
}

async function auditPage(inputUrl, expectedCluster) {
  const { response, text } = await fetchText(inputUrl);
  const finalUrl = response.url;
  const canonical = canonicalOf(text);
  const description = metaDescriptionOf(text);
  const jsonLd = parseJsonLd(text);
  const schemaTypes = typesOf(jsonLd.nodes);
  const product = findType(jsonLd.nodes, 'Product');
  const breadcrumb = findType(jsonLd.nodes, 'BreadcrumbList');
  const links = internalLinksOf(text);

  const issues = [];
  if (expectedCluster !== 'fake' && response.status !== 200) issues.push(`status:${response.status}`);
  if (expectedCluster === 'fake' && response.status !== 404) issues.push(`fake_not_404:${response.status}`);
  if (expectedCluster !== 'fake' && !titleOf(text)) issues.push('missing_title');
  if (expectedCluster !== 'fake' && !description) issues.push('missing_description');
  if (description && /your cart is empty/i.test(description)) issues.push('cart_text_description');
  if (expectedCluster !== 'fake' && !canonical) issues.push('missing_canonical');
  if (canonical && !canonical.startsWith('https://e-mart.com.bd/')) issues.push('non_absolute_or_wrong_host_canonical');
  if (canonical && new URL(canonical).search) issues.push('canonical_has_query');
  if (expectedCluster === 'product' && !product) issues.push('missing_product_jsonld');
  if (expectedCluster === 'product' && !breadcrumb) issues.push('missing_breadcrumb_jsonld');
  if (expectedCluster === 'product' && product) {
    if (!product.name) issues.push('product_jsonld_missing_name');
    if (!product.image || (Array.isArray(product.image) && product.image.length === 0)) issues.push('product_jsonld_missing_image');
    if (!product.description) issues.push('product_jsonld_missing_description');
    if (!product.sku) issues.push('product_jsonld_missing_sku');
    if (!(typeof product.brand === 'string' ? product.brand : product.brand?.name)) issues.push('product_jsonld_missing_brand');
    if (!product.offers?.price) issues.push('product_jsonld_missing_offer_price');
    if (product.offers?.priceCurrency !== 'BDT') issues.push('product_jsonld_bad_currency');
    if (!product.offers?.availability) issues.push('product_jsonld_missing_availability');
    if (!product.offers?.url) issues.push('product_jsonld_missing_offer_url');
  }

  return {
    inputUrl,
    finalUrl,
    expectedCluster,
    actualCluster: classifyUrl(finalUrl),
    status: response.status,
    title: titleOf(text),
    description,
    canonical,
    canonicalMatchesCleanFinal: normalizeUrl(canonical) === normalizeUrl(finalUrl),
    robotsMeta: robotsMetaOf(text),
    h1: h1Of(text),
    rawTextLength: stripTags(text).replace(/\s+/g, ' ').trim().length,
    productLinksInRawHtml: links.filter((href) => new URL(href).pathname.startsWith('/shop/')).length,
    pageLinksInRawHtml: links.filter((href) => new URL(href).searchParams.has('page')).length,
    queryLinksInRawHtml: links.filter((href) => new URL(href).search).slice(0, 20),
    schemaTypes,
    productJsonLd: product ? {
      name: product.name || null,
      sku: product.sku || null,
      brand: typeof product.brand === 'string' ? product.brand : product.brand?.name || null,
      hasImage: Boolean(product.image && (!Array.isArray(product.image) || product.image.length > 0)),
      hasDescription: Boolean(product.description),
      offerPrice: product.offers?.price || null,
      priceCurrency: product.offers?.priceCurrency || null,
      availability: product.offers?.availability || null,
      offerUrl: product.offers?.url || null,
      hasShippingDetails: Boolean(product.offers?.shippingDetails),
      hasReturnPolicy: Boolean(product.offers?.hasMerchantReturnPolicy),
    } : null,
    jsonLdErrors: jsonLd.errors,
    issues,
  };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const sitemap = await fetchText('/sitemap.xml');
  const sitemapUrls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const robots = await fetchText('/robots.txt');

  const cleanUrlIssues = sitemapUrls.filter((url) => {
    const parsed = new URL(url);
    return parsed.protocol !== 'https:' || parsed.hostname !== 'e-mart.com.bd' || parsed.search;
  });

  const targets = [
    { url: '/shop', cluster: 'shop' },
    ...sample(sitemapUrls, 'product', 20).map((url) => ({ url, cluster: 'product' })),
    ...sample(sitemapUrls, 'category', 5).map((url) => ({ url, cluster: 'category' })),
    ...sample(sitemapUrls, 'brand', 5).map((url) => ({ url, cluster: 'brand' })),
    ...sample(sitemapUrls, 'concern', 5).map((url) => ({ url, cluster: 'concern' })),
    ...sample(sitemapUrls, 'ingredient', 5).map((url) => ({ url, cluster: 'ingredient' })),
    ...sample(sitemapUrls, 'skin_type', 3).map((url) => ({ url, cluster: 'skin_type' })),
    ...QUERY_VARIANTS.map((url) => ({ url, cluster: 'query_variant' })),
    ...FAKE_URLS.map((url) => ({ url, cluster: 'fake' })),
  ];

  const pages = [];
  for (const target of targets) {
    pages.push(await auditPage(target.url, target.cluster));
  }

  const queryPages = pages.filter((page) => page.expectedCluster === 'query_variant');
  const fakePages = pages.filter((page) => page.expectedCluster === 'fake');
  const contentPages = pages.filter((page) => !['query_variant', 'fake'].includes(page.expectedCluster));
  const badMetadata = contentPages.filter((page) => !page.title || !page.description || /your cart is empty/i.test(page.description || ''));
  const badCanonical = pages.filter((page) => page.canonical && new URL(page.canonical).search);
  const badSoft404 = fakePages.filter((page) => page.status !== 404);
  const productSchemaIssues = contentPages.filter((page) => page.expectedCluster === 'product' && page.issues.some((issue) => issue.startsWith('product_jsonld_') || issue === 'missing_product_jsonld'));
  const breadcrumbIssues = contentPages.filter((page) => page.expectedCluster === 'product' && !page.schemaTypes.includes('BreadcrumbList'));
  const queryCanonicalIssues = queryPages.filter((page) => page.canonical && new URL(page.canonical).search);

  const result = {
    generatedAt: new Date().toISOString(),
    site: SITE,
    sitemap: {
      status: sitemap.response.status,
      total: sitemapUrls.length,
      clusters: countBy(sitemapUrls, classifyUrl),
      cleanUrlIssueCount: cleanUrlIssues.length,
      cleanUrlIssues: cleanUrlIssues.slice(0, 25),
    },
    robots: {
      status: robots.response.status,
      hasSitemap: /Sitemap:\s*https:\/\/e-mart\.com\.bd\/sitemap\.xml/i.test(robots.text),
      googlebotSpecificAllowAll: /User-Agent:\s*Googlebot\s*\nAllow:\s*\/\s*(?:\n|$)/i.test(robots.text),
      blocks: {
        sort: /Disallow:\s*\/\*\?sort=/i.test(robots.text),
        filter: /Disallow:\s*\/\*\?filter=/i.test(robots.text),
        priceMin: /Disallow:\s*\/\*\?price_min=/i.test(robots.text),
        priceMax: /Disallow:\s*\/\*\?price_max=/i.test(robots.text),
        utm: /Disallow:\s*\/\*\?utm_/i.test(robots.text),
        srsltid: /Disallow:\s*\/\*\?srsltid=/i.test(robots.text),
        checkoutExact: /Disallow:\s*\/checkout\s*(?:\n|$)/i.test(robots.text),
      },
    },
    counts: {
      checkedUrls: pages.length,
      checkedProducts: contentPages.filter((page) => page.expectedCluster === 'product').length,
      checkedCategories: contentPages.filter((page) => page.expectedCluster === 'category').length,
      checkedBrands: contentPages.filter((page) => page.expectedCluster === 'brand').length,
      checkedConcerns: contentPages.filter((page) => page.expectedCluster === 'concern').length,
      checkedQueryVariants: queryPages.length,
      checkedFakeUrls: fakePages.length,
      badMetadata: badMetadata.length,
      badCanonical: badCanonical.length,
      queryCanonicalIssues: queryCanonicalIssues.length,
      sitemapCleanUrlIssues: cleanUrlIssues.length,
      soft404Issues: badSoft404.length,
      productSchemaIssues: productSchemaIssues.length,
      breadcrumbIssues: breadcrumbIssues.length,
    },
    discovery: {
      shopProductLinksInRawHtml: pages.find((page) => page.inputUrl === '/shop')?.productLinksInRawHtml || 0,
      shopPageLinksInRawHtml: pages.find((page) => page.inputUrl === '/shop')?.pageLinksInRawHtml || 0,
      categoryProductLinksInRawHtml: contentPages
        .filter((page) => page.expectedCluster === 'category')
        .map((page) => ({ url: page.inputUrl, productLinks: page.productLinksInRawHtml, pageLinks: page.pageLinksInRawHtml })),
    },
    issues: pages.filter((page) => page.issues.length > 0).map((page) => ({
      inputUrl: page.inputUrl,
      status: page.status,
      canonical: page.canonical,
      issues: page.issues,
    })),
    pages,
  };

  await fs.writeFile(OUT_JSON, `${JSON.stringify(result, null, 2)}\n`);
  await fs.writeFile(OUT_MD, renderMarkdown(result));

  console.log(JSON.stringify({
    outJson: path.relative(ROOT, OUT_JSON),
    outMd: path.relative(ROOT, OUT_MD),
    counts: result.counts,
    sitemap: {
      status: result.sitemap.status,
      total: result.sitemap.total,
      cleanUrlIssueCount: result.sitemap.cleanUrlIssueCount,
    },
    robots: result.robots,
  }, null, 2));
}

function renderMarkdown(result) {
  const lines = [];
  lines.push('# SEO Stabilization Audit');
  lines.push('');
  lines.push(`Generated: ${result.generatedAt}`);
  lines.push('');
  lines.push('## Counts');
  for (const [key, value] of Object.entries(result.counts)) {
    lines.push(`- ${key}: ${value}`);
  }
  lines.push('');
  lines.push('## Sitemap');
  lines.push(`- status: ${result.sitemap.status}`);
  lines.push(`- total URLs: ${result.sitemap.total}`);
  lines.push(`- clean URL issues: ${result.sitemap.cleanUrlIssueCount}`);
  for (const [cluster, count] of Object.entries(result.sitemap.clusters).sort()) {
    lines.push(`- ${cluster}: ${count}`);
  }
  lines.push('');
  lines.push('## Robots');
  lines.push(`- status: ${result.robots.status}`);
  lines.push(`- sitemap declared: ${result.robots.hasSitemap}`);
  lines.push(`- Googlebot specific allow-all: ${result.robots.googlebotSpecificAllowAll}`);
  for (const [key, value] of Object.entries(result.robots.blocks)) {
    lines.push(`- blocks ${key}: ${value}`);
  }
  lines.push('');
  lines.push('## Discovery');
  lines.push(`- /shop raw product links: ${result.discovery.shopProductLinksInRawHtml}`);
  lines.push(`- /shop raw page links: ${result.discovery.shopPageLinksInRawHtml}`);
  for (const row of result.discovery.categoryProductLinksInRawHtml) {
    lines.push(`- ${row.url}: product links ${row.productLinks}, page links ${row.pageLinks}`);
  }
  lines.push('');
  lines.push('## Issues');
  if (result.issues.length === 0) {
    lines.push('- None');
  } else {
    for (const issue of result.issues.slice(0, 80)) {
      lines.push(`- ${issue.inputUrl}: status=${issue.status}; ${issue.issues.join(', ')}; canonical=${issue.canonical || 'none'}`);
    }
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
