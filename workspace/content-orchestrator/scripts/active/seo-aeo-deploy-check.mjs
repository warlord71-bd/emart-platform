#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseUrl = new URL((process.env.SEO_AEO_BASE_URL || 'https://e-mart.com.bd').replace(/\/$/, ''));
const timeoutMs = Number(process.env.SEO_AEO_TIMEOUT_MS || 15000);
const docsDir = process.env.SEO_AEO_DOCS_DIR;
const cacheBuster = Date.now();
const linkStatusCache = new Map();
const errors = [];
const checks = [];

function pass(message) {
  checks.push(message);
  console.log(`✓ ${message}`);
}

function fail(message) {
  errors.push(message);
  console.error(`✗ ${message}`);
}

async function fetchText(pathOrUrl, { redirects = 'follow' } = {}) {
  const url = new URL(pathOrUrl, baseUrl);
  const response = await fetch(url, {
    redirect: redirects,
    headers: { 'user-agent': 'Emart-SEO-AEO-Deploy-Gate/1.0' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  return { response, text: await response.text(), url };
}

function xmlUrls(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].trim());
}

function decodeHtml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function metaContent(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const tag = tags.find((candidate) => new RegExp(`(?:name|property)=["']${name}["']`, 'i').test(candidate));
  return tag?.match(/content=["']([^"']*)["']/i)?.[1]?.trim() || '';
}

function schemaTypes(html, label) {
  const types = new Set();
  const productNodes = [];
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    const rawTypes = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    rawTypes.filter(Boolean).forEach((type) => types.add(type));
    if (rawTypes.includes('Product')) productNodes.push(node);
    Object.values(node).forEach(visit);
  }

  for (const [, raw] of scripts) {
    try {
      visit(JSON.parse(decodeHtml(raw.trim())));
    } catch (error) {
      fail(`${label}: invalid JSON-LD (${error.message})`);
    }
  }
  return { types, productNodes };
}

async function getSitemapUrls() {
  const { response, text } = await fetchText('/sitemap.xml');
  if (!response.ok) throw new Error(`/sitemap.xml returned ${response.status}`);
  let urls = xmlUrls(text);
  const childSitemaps = urls.filter((url) => url.endsWith('.xml'));
  if (childSitemaps.length) {
    const children = await Promise.all(childSitemaps.map((url) => fetchText(url)));
    urls = children.flatMap(({ response: childResponse, text: childText, url }) => {
      if (!childResponse.ok) fail(`${url.pathname}: returned ${childResponse.status}`);
      return xmlUrls(childText);
    });
  }
  pass(`/sitemap.xml: ${urls.length} URLs discovered`);
  return urls;
}

async function validatePage(label, url, requiredTypes) {
  const { response, text } = await fetchText(url);
  if (!response.ok) return fail(`${label}: ${url} returned ${response.status}`);

  const title = decodeHtml(text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '');
  const canonical = text.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
  const description = metaContent(text, 'description');
  if (!title) fail(`${label}: missing title`);
  if (!description) fail(`${label}: missing meta description`);
  if (!canonical || !canonical.startsWith(`${baseUrl.origin}/`)) fail(`${label}: missing/invalid absolute canonical`);

  const { types, productNodes } = schemaTypes(text, label);
  for (const type of requiredTypes) {
    if (!types.has(type)) fail(`${label}: missing ${type} JSON-LD`);
  }

  if (label === 'product') {
    const product = productNodes[0];
    const offers = Array.isArray(product?.offers) ? product.offers[0] : product?.offers;
    if (offers?.price === undefined || offers?.price === '') fail('product: Product.offers.price missing');
    if (!offers?.availability) fail('product: Product.offers.availability missing');
    if (!offers?.priceValidUntil) fail('product: Product.offers.priceValidUntil missing');
  }
  pass(`${label}: metadata, canonical and schema valid (${new URL(url).pathname})`);
}

function markdownLinks(markdown) {
  return [...markdown.matchAll(/https:\/\/e-mart\.com\.bd\/[^\s)`}>\]]*/gi)]
    .map((match) => match[0].replace(/[.,;:]+$/, ''))
    .filter((url) => !/[{}]/.test(url));
}

async function validateLlmDoc(path, sitemapUrls) {
  let text;
  if (docsDir) {
    text = await readFile(resolve(docsDir, path.slice(1)), 'utf8');
  } else {
    const result = await fetchText(`${path}?seo_aeo_gate=${cacheBuster}`);
    if (!result.response.ok) return fail(`${path}: returned ${result.response.status}`);
    text = result.text;
  }
  if (!text.trim()) return fail(`${path}: empty response`);
  const links = [...new Set(markdownLinks(text))];
  for (const url of links) {
    const linkedPath = new URL(url).pathname;
    if (['/llms.txt', '/llms-full.txt', '/agents.md', '/sitemap.xml'].includes(linkedPath)) {
      continue;
    }
    const normalized = url.replace(/\/$/, '');
    if (!sitemapUrls.has(normalized)) {
      let status = linkStatusCache.get(normalized);
      if (status === undefined) {
        try {
          const { response } = await fetchText(normalized, { redirects: 'manual' });
          status = response.status;
        } catch {
          status = 0;
        }
        linkStatusCache.set(normalized, status);
      }
      if (status !== 200) fail(`${path}: stale/non-canonical link ${url} returned ${status || 'network error'}`);
    }
  }
  pass(`${path}: 200, non-empty, ${links.length} canonical links checked`);
}

async function main() {
  console.log(`SEO/AEO deploy gate: ${baseUrl.origin}`);
  const robots = await fetchText('/robots.txt');
  if (!robots.response.ok) fail(`/robots.txt returned ${robots.response.status}`);
  else if (!new RegExp(`Sitemap:\\s*${baseUrl.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\/sitemap\\.xml`, 'i').test(robots.text)) {
    fail('/robots.txt does not advertise the canonical sitemap');
  } else pass('/robots.txt: canonical sitemap declared');

  const urls = await getSitemapUrls();
  const samples = [
    ['product', /\/shop\/[^/]+\/?$/, ['Product', 'BreadcrumbList']],
    ['category', /\/category\/[^/]+\/?$/, ['CollectionPage', 'ItemList', 'BreadcrumbList']],
    ['concern', /\/concerns\/[^/]+\/?$/, ['CollectionPage', 'ItemList', 'BreadcrumbList']],
    ['ingredient', /\/ingredients\/[^/]+\/?$/, ['CollectionPage', 'ItemList', 'BreadcrumbList']],
    ['blog', /\/blog\/[^/]+\/?$/, ['BlogPosting']],
  ];
  for (const [label, pattern, requiredTypes] of samples) {
    const url = urls.find((candidate) => pattern.test(new URL(candidate).pathname));
    if (!url) fail(`sitemap: no ${label} URL found`);
    else await validatePage(label, url, requiredTypes);
  }

  const sitemapUrlSet = new Set(urls.map((url) => url.replace(/\/$/, '')));
  for (const path of ['/llms.txt', '/llms-full.txt', '/agents.md']) {
    await validateLlmDoc(path, sitemapUrlSet);
  }

  if (errors.length) {
    console.error(`\nSEO/AEO gate FAILED: ${errors.length} error(s), ${checks.length} checks passed.`);
    process.exit(1);
  }
  console.log(`\nSEO/AEO gate PASSED: ${checks.length} checks passed.`);
}

main().catch((error) => {
  console.error(`✗ SEO/AEO gate crashed: ${error.stack || error.message}`);
  process.exit(1);
});
