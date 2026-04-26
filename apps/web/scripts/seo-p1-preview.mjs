#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_AUDIT_CSV = '/tmp/catalog_audit.csv';
const DEFAULT_PREVIEW_JSON = '/tmp/emart-p1-seo-preview.json';
const DEFAULT_TARGET_CSV = '/tmp/emart-p1-seo-targets.csv';

const LOW_SCORE_THRESHOLD = 50;

const BRANDS = [
  ['paulas choice', "Paula's Choice"],
  ["paula's choice", "Paula's Choice"],
  ['the ordinary', 'The Ordinary'],
  ['the inkey list', 'The INKEY List'],
  ['skin cafe', 'Skin Cafe'],
  ['la girl', 'L.A. Girl'],
  ['l.a. girl', 'L.A. Girl'],
  ['freeman', 'FREEMAN'],
  ['cosrx', 'COSRX'],
  ['nacific', 'Nacific'],
  ['isntree', 'Isntree'],
  ['palmers', "Palmer's"],
  ["palmer's", "Palmer's"],
  ['stives', 'St. Ives'],
  ['st. ives', 'St. Ives'],
  ["i'm from", "I'm From"],
  ['dabo', 'Dabo'],
  ['anua', 'Anua'],
  ['phytotree', 'Phytotree'],
  ['lion', 'Lion'],
  ['wskinlab', 'WSKINLAB'],
];

const PRODUCT_TYPES = [
  ['foundation', 'base makeup coverage', 'Apply a thin layer over prepped skin and blend evenly with a sponge, brush, or fingers.'],
  ['pact', 'makeup touch-up and oil control', 'Apply lightly where needed and build only where extra coverage is required. If the product includes SPF, still use proper sunscreen for strong outdoor exposure.'],
  ['peeling gel', 'gentle exfoliation', 'Use after cleansing on dry skin, massage softly, rinse well, and follow with moisturizer.'],
  ['exfoliant', 'exfoliation support', 'Use slowly according to the product label. Start a few nights per week, avoid pairing with too many strong actives, and use sunscreen in the daytime.'],
  ['bha', 'exfoliation support', 'Use slowly according to the product label. Start a few nights per week, avoid pairing with too many strong actives, and use sunscreen in the daytime.'],
  ['azelaic', 'targeted redness and texture support', 'Apply a small amount after toner and before moisturizer. Use sunscreen in the daytime and avoid combining too many actives at once.'],
  ['cleanser', 'daily cleansing', 'Massage onto damp skin, rinse well, then continue with toner, serum, and moisturizer.'],
  ['cleansing foam', 'daily cleansing', 'Massage onto damp skin, rinse well, then continue with toner, serum, and moisturizer.'],
  ['face wash', 'daily cleansing', 'Massage onto damp skin, rinse well, then continue with toner, serum, and moisturizer.'],
  ['sunscreen', 'daily sun protection', 'Apply as the last step of your morning routine and reapply during long outdoor exposure.'],
  ['sun cream', 'daily sun protection', 'Apply as the last step of your morning routine and reapply during long outdoor exposure.'],
  ['spf', 'daily sun protection', 'Apply as the last step of your morning routine and reapply during long outdoor exposure.'],
  ['toner', 'post-cleansing hydration and prep', 'Use after cleansing with clean hands or a cotton pad, then follow with serum and moisturizer.'],
  ['serum', 'targeted skincare support', 'Apply a small amount after toner and before moisturizer. Use sunscreen in the daytime.'],
  ['essence', 'light hydration and skin prep', 'Apply after toner and before serum or moisturizer. Pat gently until absorbed.'],
  ['cream', 'moisture and barrier support', 'Apply after serum as the moisturizing step, morning or night as needed.'],
  ['moisturizer', 'moisture and barrier support', 'Apply after serum as the moisturizing step, morning or night as needed.'],
  ['mask', 'weekly skincare support', 'Use as directed on clean skin, avoid the eye area, and follow with moisturizer.'],
];

const BANGLA_FAQ = [
  {
    q: 'এই পণ্যটি কি অরিজিনাল?',
    a: 'হ্যাঁ, E-Mart BD-তে আমরা অরিজিনাল পণ্য দেওয়ার চেষ্টা করি এবং পণ্যের তথ্য পরিষ্কারভাবে রাখি, যাতে কেনার আগে আপনি বুঝে সিদ্ধান্ত নিতে পারেন।',
  },
  {
    q: 'বাংলাদেশের আবহাওয়ায় ব্যবহার করা যাবে?',
    a: 'পণ্যের ধরন অনুযায়ী ব্যবহার করুন। গরম, ধুলোবালি বা আর্দ্র আবহাওয়ায় হালকা পরিমাণে শুরু করা এবং দিনের বেলায় সানস্ক্রিন ব্যবহার করা ভালো।',
  },
  {
    q: 'ডেলিভারি কত দিনে পাব?',
    a: 'ঢাকায় সাধারণত ১-২ দিন এবং ঢাকার বাইরে সাধারণত ৩-৫ দিনের মধ্যে ডেলিভারি হয়। অর্ডারের সময় উপলভ্য পেমেন্ট ও ডেলিভারি অপশন দেখে নিন।',
  },
];

function parseArgs(argv) {
  const args = {
    auditCsv: DEFAULT_AUDIT_CSV,
    previewJson: DEFAULT_PREVIEW_JSON,
    targetCsv: DEFAULT_TARGET_CSV,
    limit: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--audit-csv') args.auditCsv = argv[++index];
    else if (arg === '--preview-json') args.previewJson = argv[++index];
    else if (arg === '--target-csv') args.targetCsv = argv[++index];
    else if (arg === '--limit') args.limit = Number.parseInt(argv[++index], 10);
  }

  return args;
}

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += char;
    }
  }

  values.push(value);
  return values;
}

function readAuditRows(csvPath) {
  const body = fs.readFileSync(csvPath, 'utf8').trim();
  const [headerLine, ...lines] = body.split(/\r?\n/);
  const headers = parseCsvLine(headerLine);

  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function decodeEntities(value) {
  return String(value || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function stripBrandFromName(name, brand) {
  const escapedBrand = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return name.replace(new RegExp(`^${escapedBrand}\\s+`, 'i'), '').trim();
}

function inferBrand(name, auditBrand) {
  const normalized = name.toLowerCase().replace(/[^a-z0-9\s'.]/g, ' ');
  const match = BRANDS.find(([needle]) => normalized.includes(needle));
  if (match) return match[1];

  const cleanedAuditBrand = decodeEntities(auditBrand || '').trim();
  if (cleanedAuditBrand && cleanedAuditBrand.length > 1) {
    return cleanedAuditBrand
      .split(/\s+/)
      .map((word) => (word === word.toUpperCase() ? word : `${word[0].toUpperCase()}${word.slice(1)}`))
      .join(' ');
  }

  return name.split(/\s+/)[0];
}

function extractSize(name) {
  const match = name.match(/\b(\d+(?:\.\d+)?)\s?(ml|g|oz|l)\b/i);
  return match ? `${match[1]}${match[2]}` : '';
}

function classifyProduct(name, category) {
  const text = `${name} ${category}`.toLowerCase();
  return PRODUCT_TYPES.find(([needle]) => text.includes(needle)) || [
    'product',
    'everyday beauty care',
    'Use according to the product label and patch test first if your skin is sensitive.',
  ];
}

function cleanPrice(price) {
  const parsed = Number.parseFloat(String(price || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? Math.round(parsed).toString() : '';
}

function truncateAtWord(text, maxLength, suffix = '') {
  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength - suffix.length);
  const lastSpace = clipped.lastIndexOf(' ');
  const clean = lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped;
  return `${clean.trimEnd()}${suffix}`;
}

function metaDescription(name, brand) {
  const text = `Buy authentic ${name} in Bangladesh from E-Mart BD. Clear ${brand} facts, BDT price, Dhaka delivery, nationwide delivery and COD where eligible.`;
  return truncateAtWord(text, 158);
}

function metaTitle(name, brand) {
  const full = `${name} Price in Bangladesh | E-Mart BD`;
  if (full.length <= 60) return full;

  const short = `${name} | E-Mart BD`;
  if (short.length <= 60) return short;

  const withoutSize = name.replace(/\b\d+(?:\.\d+)?\s?(ml|g|oz|l|ge)\b/gi, '').replace(/\s+/g, ' ').trim();
  const branded = withoutSize.toLowerCase().startsWith(brand.toLowerCase()) ? withoutSize : `${brand} ${withoutSize}`;
  return `${truncateAtWord(branded, 48)} | E-Mart BD`;
}

function banglaFaqHtml() {
  const body = BANGLA_FAQ.map((faq) => `<p><strong>${faq.q}</strong><br>${faq.a}</p>`).join('\n');
  return `<div class="emart-faq">\n<h3>বাংলা সহায়তা</h3>\n${body}\n</div>`;
}

function descriptionHtml(row) {
  const name = decodeEntities(row.name);
  const brand = inferBrand(name, row.brand);
  const category = decodeEntities(row.category || 'Beauty');
  const price = cleanPrice(row.price);
  const size = extractSize(name);
  const [, benefit, usage] = classifyProduct(name, category);
  const productName = stripBrandFromName(name, brand);
  const facts = [
    `Brand: ${brand}`,
    size ? `Size: ${size}` : '',
    `Category: ${category}`,
    price ? `Price: ৳${price}` : '',
  ].filter(Boolean).join(' | ');

  return [
    `<p><strong>${name}</strong> is an authentic ${brand} product available in Bangladesh through E-Mart BD. It is a practical choice for customers who want ${benefit} and prefer clear product facts before ordering. For shoppers in Dhaka and across Bangladesh, the key details are size, routine fit, price, and delivery support.</p>`,
    '<h3>Why it fits BD routines</h3>',
    `<p>${productName || name} can fit into a simple routine for Bangladesh weather, where heat, humidity, dust, and frequent sun exposure often affect how products feel on skin. Start with a small amount, observe how your skin responds, and keep the routine steady instead of layering too many new products at once.</p>`,
    '<h3>Product facts</h3>',
    `<p>${facts}. Check the size, shade, skin concern, and routine step before ordering so the product matches what you actually need.</p>`,
    '<h3>How to use</h3>',
    `<p>${usage} Patch test first if you are trying a new active, exfoliating product, sunscreen, or makeup base. Stop using it if irritation continues, and avoid applying skincare on broken or inflamed skin.</p>`,
    '<h3>Buy authentic in Bangladesh</h3>',
    '<p>Order from E-Mart BD for authentic beauty products, clear pricing in BDT, Dhaka delivery support, nationwide delivery, and COD availability where eligible. Always check the product size, shade, and skin concern before confirming your order.</p>',
    banglaFaqHtml(),
  ].join('\n');
}

function missingList(row) {
  return row.missing ? row.missing.split('|').filter(Boolean) : [];
}

function actionFor(row) {
  const score = Number.parseInt(row.score, 10);
  const missing = missingList(row);
  const actions = [];

  if (score < LOW_SCORE_THRESHOLD) actions.push('english_description');
  if (missing.includes('no_rankmath_meta')) actions.push('rank_math_meta');
  if (missing.includes('no_gtin')) actions.push('gtin');

  return actions;
}

function buildPreview(row) {
  const name = decodeEntities(row.name);
  const brand = inferBrand(name, row.brand);
  const actions = actionFor(row);

  return {
    id: Number.parseInt(row.id, 10),
    name,
    url: row.url,
    currentScore: Number.parseInt(row.score, 10),
    missing: missingList(row),
    actions,
    suggested: {
      descriptionHtml: actions.includes('english_description') ? descriptionHtml(row) : null,
      rankMath: actions.includes('rank_math_meta') ? {
        title: metaTitle(name, brand),
        description: metaDescription(name, brand),
        focusKeyword: `${brand} ${stripBrandFromName(name, brand) || name} price in Bangladesh`.replace(/\s+/g, ' ').trim(),
      } : null,
      gtin: actions.includes('gtin') ? 'Needs verified manufacturer barcode before live write; do not generate fake GTIN.' : null,
    },
  };
}

function summarize(rows) {
  const lowScore = rows.filter((row) => Number.parseInt(row.score, 10) < LOW_SCORE_THRESHOLD);
  const noRankMath = rows.filter((row) => missingList(row).includes('no_rankmath_meta'));
  const noGtin = rows.filter((row) => missingList(row).includes('no_gtin'));
  const scoreBuckets = {
    '0-49': rows.filter((row) => Number.parseInt(row.score, 10) < 50).length,
    '50-69': rows.filter((row) => Number.parseInt(row.score, 10) >= 50 && Number.parseInt(row.score, 10) < 70).length,
    '70-89': rows.filter((row) => Number.parseInt(row.score, 10) >= 70 && Number.parseInt(row.score, 10) < 90).length,
    '90-100': rows.filter((row) => Number.parseInt(row.score, 10) >= 90).length,
  };

  return {
    totalProducts: rows.length,
    scoreBuckets,
    lowDescriptionScore: lowScore.length,
    missingRankMathMeta: noRankMath.length,
    missingGtin: noGtin.length,
  };
}

function writeTargetCsv(previews, targetPath) {
  const lines = [
    ['id', 'score', 'actions', 'name', 'url'].map(csvEscape).join(','),
    ...previews.map((item) => [
      item.id,
      item.currentScore,
      item.actions.join('|'),
      item.name,
      item.url,
    ].map(csvEscape).join(',')),
  ];

  fs.writeFileSync(targetPath, `${lines.join('\n')}\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rows = readAuditRows(args.auditCsv);
  const targets = rows
    .filter((row) => actionFor(row).length > 0)
    .sort((a, b) => Number.parseInt(a.score, 10) - Number.parseInt(b.score, 10));
  const limitedTargets = args.limit ? targets.slice(0, args.limit) : targets;
  const previews = limitedTargets.map(buildPreview);
  const payload = {
    generatedAt: new Date().toISOString(),
    auditCsv: path.resolve(args.auditCsv),
    policy: {
      language: 'English canonical product title, meta, schema, facts, and main description.',
      bangla: 'Bangla helper FAQ may stay below the English content and is not used for FAQPage schema.',
      schema: 'Do not store JSON-LD script tags inside WooCommerce descriptions; Next.js owns schema.',
      aiSafety: 'No obfuscation, keyword stuffing, fake testing claims, fake GTINs, or mass low-value rewrites.',
    },
    summary: summarize(rows),
    targets: previews,
  };

  fs.writeFileSync(args.previewJson, `${JSON.stringify(payload, null, 2)}\n`);
  writeTargetCsv(previews, args.targetCsv);

  console.log('P1 SEO preview generated');
  console.log(`Products audited: ${payload.summary.totalProducts}`);
  console.log(`Low description score: ${payload.summary.lowDescriptionScore}`);
  console.log(`Missing Rank Math meta: ${payload.summary.missingRankMathMeta}`);
  console.log(`Missing GTIN: ${payload.summary.missingGtin}`);
  console.log(`Preview targets: ${previews.length}`);
  console.log(`Preview JSON: ${args.previewJson}`);
  console.log(`Target CSV: ${args.targetCsv}`);
}

main();
