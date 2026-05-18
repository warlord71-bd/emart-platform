/**
 * seed-cerave-descriptions.mjs
 *
 * Fetches every CeraVe product from WooCommerce, generates an SEO-optimised
 * description + short_description + _emart_meta_description for each one
 * that is missing content, then PUTs the updates back via the WC REST API.
 *
 * Run on the VPS (where .env.local is present):
 *   node scripts/seed-cerave-descriptions.mjs
 *
 * Dry-run (no writes):
 *   DRY_RUN=1 node scripts/seed-cerave-descriptions.mjs
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Load env from apps/web/.env.local (the VPS env file)
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../apps/web/.env.local');
try {
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  }
} catch {
  console.log('No .env.local found, using process.env directly.');
}

const SITE_URL      = process.env.NEXT_PUBLIC_SITE_URL || 'https://e-mart.com.bd';
const WOO_BASE      = (process.env.WOO_INTERNAL_URL || SITE_URL).replace(/\/$/, '');
const CONSUMER_KEY  = process.env.WOO_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET || '';
const DRY_RUN       = process.env.DRY_RUN === '1';

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  console.error('WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET not set. Aborting.');
  process.exit(1);
}

const AUTH = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
const API  = `${WOO_BASE}/wp-json/wc/v3`;

// ---------------------------------------------------------------------------
// WooCommerce helpers
// ---------------------------------------------------------------------------
async function wooGet(path, params = {}) {
  const url = new URL(`${API}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${AUTH}`,
      'Host': 'e-mart.com.bd',
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function wooPut(path, body) {
  if (DRY_RUN) {
    console.log(`  [DRY_RUN] PUT ${path}`, JSON.stringify(body).slice(0, 120));
    return;
  }
  const res = await fetch(`${API}${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Basic ${AUTH}`,
      'Host': 'e-mart.com.bd',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Fetch ALL CeraVe products (may span multiple pages)
// ---------------------------------------------------------------------------
async function fetchAllCeraVeProducts() {
  const products = [];
  let page = 1;
  while (true) {
    const batch = await wooGet('/products', {
      search: 'CeraVe',
      per_page: 100,
      page,
      status: 'publish',
    });
    if (!Array.isArray(batch) || batch.length === 0) break;
    products.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return products;
}

// ---------------------------------------------------------------------------
// Price helper
// ---------------------------------------------------------------------------
function livePrice(product) {
  const raw = product.price || product.sale_price || product.regular_price || '0';
  const n = Math.round(parseFloat(raw));
  return n > 0 ? `৳${n.toLocaleString('en-BD')}` : '';
}

// ---------------------------------------------------------------------------
// Description library
// Keyed by slug fragment patterns (longest/most-specific first).
// Each entry provides:
//   shortDesc  – 150–160 char plain text for meta description
//   html       – rich HTML for the product description tab
// ---------------------------------------------------------------------------
const DESCRIPTIONS = [

  // ── SA Smoothing Cream ──────────────────────────────────────────────────
  {
    match: /sa-smoothing-cream/,
    shortDesc: (p, price) =>
      `Buy CeraVe SA Smoothing Cream${sizeTag(p)} in Bangladesh from Emart. Salicylic acid + 3 ceramides for rough, bumpy skin. Dermatologist recommended. COD.${price ? ' ' + price + '.' : ''}`.slice(0, 160),
    html: (p) => `<h2>CeraVe SA Smoothing Cream${sizeTag(p)}</h2>
<p>CeraVe SA Smoothing Cream is a dermatologist-developed moisturiser formulated with <strong>salicylic acid</strong>, <strong>lactic acid</strong>, and <strong>three essential ceramides (1, 3 &amp; 6-II)</strong> to gently exfoliate and smooth rough, dry, and bumpy skin — including conditions like keratosis pilaris.</p>

<h3>Key Benefits</h3>
<ul>
  <li>Exfoliates and smooths rough, bumpy texture with salicylic acid</li>
  <li>Restores the skin barrier with 3 essential ceramides</li>
  <li>Attracts and retains moisture with hyaluronic acid</li>
  <li>Soothes and softens with niacinamide</li>
  <li>Non-greasy, fragrance-free, and non-comedogenic</li>
  <li>Developed with dermatologists; suitable for sensitive skin</li>
</ul>

<h3>Who It's For</h3>
<p>Ideal for dry, rough, or bumpy skin on the body and face. Especially effective for keratosis pilaris (KP), elbows, knees, and feet.</p>

<h3>How to Use</h3>
<p>Apply to affected areas once or twice daily. Massage gently until fully absorbed. For body use, pay extra attention to rough patches on arms, legs, and heels. Follow with SPF during daytime use.</p>

<h3>Key Ingredients</h3>
<ul>
  <li><strong>Salicylic Acid</strong> – exfoliates dead skin cells and refines texture</li>
  <li><strong>Ceramides 1, 3 &amp; 6-II</strong> – restore and maintain the natural skin barrier</li>
  <li><strong>Hyaluronic Acid</strong> – draws moisture into the skin</li>
  <li><strong>Lactic Acid</strong> – gently exfoliates and softens</li>
  <li><strong>Niacinamide (Vitamin B3)</strong> – calms and soothes</li>
</ul>

<p>Available at Emart — Bangladesh's trusted source for authentic CeraVe. Fast delivery across Dhaka and nationwide. Cash on Delivery accepted.</p>`,
  },

  // ── SA Smoothing Cleanser ───────────────────────────────────────────────
  {
    match: /sa-smoothing-cleanser|sa-cleanser/,
    shortDesc: (p, price) =>
      `Buy CeraVe SA Smoothing Cleanser${sizeTag(p)} in Bangladesh. Salicylic acid face wash for rough, bumpy skin. Fragrance-free, dermatologist recommended. COD.${price ? ' ' + price + '.' : ''}`.slice(0, 160),
    html: (p) => `<h2>CeraVe SA Smoothing Cleanser${sizeTag(p)}</h2>
<p>The CeraVe SA Smoothing Cleanser is a gentle exfoliating face and body wash powered by <strong>salicylic acid</strong> to clear away dead skin cells and smooth rough skin — while three essential ceramides and hyaluronic acid leave the barrier intact.</p>

<h3>Key Benefits</h3>
<ul>
  <li>Gently exfoliates with salicylic acid to improve texture</li>
  <li>Maintains the skin barrier with ceramides 1, 3 &amp; 6-II</li>
  <li>Hydrates with hyaluronic acid while cleansing</li>
  <li>Non-comedogenic; won't clog pores</li>
  <li>Fragrance-free and suitable for sensitive skin</li>
  <li>Rinses cleanly without stripping moisture</li>
</ul>

<h3>Who It's For</h3>
<p>Best for normal to dry skin prone to roughness, bumps, or keratosis pilaris (KP). Suitable for daily use on face and body.</p>

<h3>How to Use</h3>
<p>Apply to damp skin, massage gently in circular motions, then rinse thoroughly with water. Use once or twice daily.</p>

<h3>Key Ingredients</h3>
<ul>
  <li><strong>Salicylic Acid</strong> – exfoliates and refines rough skin texture</li>
  <li><strong>Ceramides 1, 3 &amp; 6-II</strong> – protect and replenish the skin barrier</li>
  <li><strong>Hyaluronic Acid</strong> – maintains moisture during cleansing</li>
  <li><strong>Niacinamide</strong> – soothes and calms skin</li>
</ul>

<p>Shop at Emart — Bangladesh's trusted retailer for authentic CeraVe products. Nationwide delivery with Cash on Delivery available.</p>`,
  },

  // ── Moisturising Cream ──────────────────────────────────────────────────
  {
    match: /moisturising-cream|moisturizing-cream/,
    shortDesc: (p, price) =>
      `Buy CeraVe Moisturising Cream${sizeTag(p)} in Bangladesh from Emart. 3 ceramides + hyaluronic acid for dry to very dry skin. Fragrance-free, dermatologist tested. COD.${price ? ' ' + price + '.' : ''}`.slice(0, 160),
    html: (p) => `<h2>CeraVe Moisturising Cream${sizeTag(p)}</h2>
<p>CeraVe Moisturising Cream is an intensive, long-lasting moisturiser formulated with <strong>three essential ceramides</strong> and <strong>hyaluronic acid</strong>. Developed with dermatologists, it provides 24-hour hydration while helping to restore and maintain the skin's protective barrier.</p>

<h3>Key Benefits</h3>
<ul>
  <li>Provides all-day 24-hour hydration in one application</li>
  <li>Restores the natural skin barrier with ceramides 1, 3 &amp; 6-II</li>
  <li>Locks in moisture with hyaluronic acid</li>
  <li>Non-greasy, non-comedogenic formula</li>
  <li>Fragrance-free — safe for sensitive and eczema-prone skin</li>
  <li>Suitable for face, body, and hands</li>
</ul>

<h3>Who It's For</h3>
<p>Formulated for normal to very dry skin types. Ideal for anyone dealing with eczema, dryness, flaking, or a compromised skin barrier. Safe for daily use from head to toe.</p>

<h3>How to Use</h3>
<p>Apply to face and/or body once or twice daily, or as needed. Massage gently until fully absorbed. Can be used as a daily moisturiser or as an intensive treatment during dry spells.</p>

<h3>Key Ingredients</h3>
<ul>
  <li><strong>Ceramides 1, 3 &amp; 6-II</strong> – mimic the skin's natural lipids to restore the barrier</li>
  <li><strong>Hyaluronic Acid</strong> – retains moisture in the upper layers of skin</li>
  <li><strong>Glycerin</strong> – draws water into the skin for sustained hydration</li>
  <li><strong>Petrolatum</strong> – forms a protective occlusive layer to prevent moisture loss</li>
</ul>

<p>Order from Emart — Bangladesh's trusted source for authentic CeraVe. Available in multiple sizes. Fast nationwide delivery and Cash on Delivery.</p>`,
  },

  // ── Hydrating Facial Cleanser ────────────────────────────────────────────
  {
    match: /hydrating-facial-cleanser|hydrating-cleanser/,
    shortDesc: (p, price) =>
      `Buy CeraVe Hydrating Facial Cleanser${sizeTag(p)} in Bangladesh from Emart. Gentle non-foaming wash for normal to dry skin. Ceramides + hyaluronic acid. COD.${price ? ' ' + price + '.' : ''}`.slice(0, 160),
    html: (p) => `<h2>CeraVe Hydrating Facial Cleanser${sizeTag(p)}</h2>
<p>CeraVe Hydrating Facial Cleanser is a gentle, non-foaming cleanser that removes impurities and makeup without stripping the skin's natural moisture. Formulated with <strong>three essential ceramides</strong>, <strong>hyaluronic acid</strong>, and <strong>niacinamide</strong>, it cleanses while supporting the skin barrier.</p>

<h3>Key Benefits</h3>
<ul>
  <li>Gently cleanses without over-drying or disturbing the skin barrier</li>
  <li>Retains the skin's natural moisture during cleansing</li>
  <li>Replenishes ceramides 1, 3 &amp; 6-II with every wash</li>
  <li>Fragrance-free, paraben-free, non-comedogenic</li>
  <li>Accepted by the National Eczema Association (NEA)</li>
  <li>Suitable for dry, sensitive, and eczema-prone skin types</li>
</ul>

<h3>Who It's For</h3>
<p>Ideal for normal to dry and sensitive skin. Also recommended for eczema-prone or barrier-compromised skin that reacts to foaming cleansers.</p>

<h3>How to Use</h3>
<p>Pump cleanser onto wet hands or a cloth. Apply gently to the face and neck in circular motions. Rinse thoroughly with lukewarm water. Use morning and night.</p>

<h3>Key Ingredients</h3>
<ul>
  <li><strong>Ceramides 1, 3 &amp; 6-II</strong> – replenish the protective skin barrier</li>
  <li><strong>Hyaluronic Acid</strong> – attracts and retains moisture</li>
  <li><strong>Niacinamide (Vitamin B3)</strong> – calms and soothes</li>
</ul>

<p>Shop at Emart — Bangladesh's most trusted destination for authentic CeraVe skincare. Fast delivery and Cash on Delivery nationwide.</p>`,
  },

  // ── Foaming Facial Cleanser ───────────────────────────────────────────────
  {
    match: /foaming-facial-cleanser|foaming-cleanser/,
    shortDesc: (p, price) =>
      `Buy CeraVe Foaming Facial Cleanser${sizeTag(p)} in Bangladesh from Emart. Removes excess oil for normal to oily skin. Ceramides + niacinamide. Fragrance-free. COD.${price ? ' ' + price + '.' : ''}`.slice(0, 160),
    html: (p) => `<h2>CeraVe Foaming Facial Cleanser${sizeTag(p)}</h2>
<p>CeraVe Foaming Facial Cleanser is a gel-based, foaming wash that effectively removes dirt, oil, and makeup while preserving the skin's natural ceramide-rich barrier. Formulated with <strong>niacinamide</strong> and <strong>three essential ceramides</strong>, it leaves skin clean without tight or dry feelings.</p>

<h3>Key Benefits</h3>
<ul>
  <li>Removes excess oil and impurities with a satisfying foam lather</li>
  <li>Maintains skin barrier integrity — no over-stripping</li>
  <li>Reduces excess sebum without drying out skin</li>
  <li>Non-comedogenic; won't clog pores</li>
  <li>Fragrance-free and hypoallergenic</li>
  <li>Suitable for normal, combination, and oily skin types</li>
</ul>

<h3>Who It's For</h3>
<p>Designed for normal to oily skin. Also suitable for combination skin that needs effective oil-control without compromising hydration.</p>

<h3>How to Use</h3>
<p>Apply to wet face and neck. Work into a lather and massage gently. Rinse thoroughly. Use morning and evening for best results.</p>

<h3>Key Ingredients</h3>
<ul>
  <li><strong>Ceramides 1, 3 &amp; 6-II</strong> – restore and maintain the skin's protective layer</li>
  <li><strong>Hyaluronic Acid</strong> – balances hydration while controlling oil</li>
  <li><strong>Niacinamide</strong> – minimises the appearance of pores and reduces redness</li>
</ul>

<p>Available at Emart — Bangladesh's trusted retailer of authentic CeraVe. Cash on Delivery and fast nationwide delivery.</p>`,
  },

  // ── AM Facial Moisturising Lotion SPF ────────────────────────────────────
  {
    match: /am-facial-moisturising-lotion|am-facial-moisturizing-lotion|am-lotion/,
    shortDesc: (p, price) =>
      `Buy CeraVe AM Facial Moisturising Lotion${sizeTag(p)} in Bangladesh from Emart. Lightweight SPF moisturiser with ceramides and niacinamide. Dermatologist recommended. COD.${price ? ' ' + price + '.' : ''}`.slice(0, 160),
    html: (p) => `<h2>CeraVe AM Facial Moisturising Lotion${sizeTag(p)}</h2>
<p>CeraVe AM Facial Moisturising Lotion is a lightweight, oil-free daytime moisturiser with broad-spectrum sun protection. Formulated with <strong>ceramides</strong>, <strong>hyaluronic acid</strong>, and <strong>niacinamide</strong>, it delivers all-day hydration while shielding skin from UV damage.</p>

<h3>Key Benefits</h3>
<ul>
  <li>Provides broad-spectrum UV protection for daily sun defence</li>
  <li>Lightweight, non-greasy formula absorbs quickly</li>
  <li>Hydrates and plumps with hyaluronic acid</li>
  <li>Restores the skin barrier with 3 essential ceramides</li>
  <li>Reduces redness and uneven tone with niacinamide</li>
  <li>Oil-free, fragrance-free, non-comedogenic</li>
</ul>

<h3>Who It's For</h3>
<p>Ideal for normal to dry skin types as a daily 2-in-1 moisturiser and sun protection step. Perfect for the Bangladesh climate where daily SPF is essential.</p>

<h3>How to Use</h3>
<p>Apply generously to face and neck every morning as the last step of your skincare routine. Reapply every two hours when outdoors for continued protection.</p>

<h3>Key Ingredients</h3>
<ul>
  <li><strong>Broad-Spectrum SPF</strong> – protects against UVA and UVB rays</li>
  <li><strong>Ceramides 1, 3 &amp; 6-II</strong> – replenish and protect the skin barrier</li>
  <li><strong>Hyaluronic Acid</strong> – delivers long-lasting hydration</li>
  <li><strong>Niacinamide</strong> – brightens and soothes skin tone</li>
</ul>

<p>Order from Emart — your trusted source in Bangladesh for authentic CeraVe products. Nationwide delivery with Cash on Delivery.</p>`,
  },

  // ── PM Facial Moisturising Lotion ─────────────────────────────────────────
  {
    match: /pm-facial-moisturising-lotion|pm-facial-moisturizing-lotion|pm-lotion/,
    shortDesc: (p, price) =>
      `Buy CeraVe PM Facial Moisturising Lotion${sizeTag(p)} in Bangladesh from Emart. Lightweight night moisturiser with ceramides, hyaluronic acid & niacinamide. COD available.${price ? ' ' + price + '.' : ''}`.slice(0, 160),
    html: (p) => `<h2>CeraVe PM Facial Moisturising Lotion${sizeTag(p)}</h2>
<p>CeraVe PM Facial Moisturising Lotion is a lightweight, oil-free night moisturiser formulated for overnight skin restoration. It combines <strong>three essential ceramides</strong>, <strong>hyaluronic acid</strong>, and <strong>niacinamide</strong> to repair and hydrate while you sleep.</p>

<h3>Key Benefits</h3>
<ul>
  <li>Lightweight night moisturiser that works while you sleep</li>
  <li>Restores the skin barrier with ceramides 1, 3 &amp; 6-II</li>
  <li>Provides intense, long-lasting hydration with hyaluronic acid</li>
  <li>Niacinamide supports skin tone and soothes irritation</li>
  <li>Oil-free, fragrance-free, non-comedogenic</li>
  <li>Suitable for all skin types, including sensitive skin</li>
</ul>

<h3>Who It's For</h3>
<p>Ideal as a nightly moisturiser for normal to dry, combination, and sensitive skin types. Works well for those whose skin needs extra overnight repair.</p>

<h3>How to Use</h3>
<p>Apply to a clean face and neck every night as the last step of your evening skincare routine. Use fingertips to massage gently in upward circular motions.</p>

<h3>Key Ingredients</h3>
<ul>
  <li><strong>Ceramides 1, 3 &amp; 6-II</strong> – reinforce the natural skin barrier overnight</li>
  <li><strong>Hyaluronic Acid</strong> – keeps skin hydrated throughout the night</li>
  <li><strong>Niacinamide</strong> – reduces redness and uneven skin tone</li>
</ul>

<p>Shop at Emart — Bangladesh's authentic CeraVe retailer. Fast delivery and Cash on Delivery available nationwide.</p>`,
  },

  // ── Healing Ointment ──────────────────────────────────────────────────────
  {
    match: /healing-ointment/,
    shortDesc: (p, price) =>
      `Buy CeraVe Healing Ointment${sizeTag(p)} in Bangladesh from Emart. Petrolatum-based barrier repair with ceramides. Soothes cracked, chafed, or irritated skin. COD.${price ? ' ' + price + '.' : ''}`.slice(0, 160),
    html: (p) => `<h2>CeraVe Healing Ointment${sizeTag(p)}</h2>
<p>CeraVe Healing Ointment is a rich, protective balm formulated with <strong>petrolatum</strong>, <strong>three essential ceramides</strong>, and <strong>hyaluronic acid</strong>. It creates an effective barrier to protect damaged skin and support the natural healing process for dry, cracked, and irritated areas.</p>

<h3>Key Benefits</h3>
<ul>
  <li>Creates a breathable protective layer over damaged or sensitive skin</li>
  <li>Restores the skin barrier with ceramides 1, 3 &amp; 6-II</li>
  <li>Soothes and hydrates cracked heels, dry lips, and irritated patches</li>
  <li>Hypoallergenic and fragrance-free — safe for sensitive skin</li>
  <li>Accepted by the National Eczema Association (NEA)</li>
  <li>Free from lanolin, parabens, and fragrances</li>
</ul>

<h3>Who It's For</h3>
<p>Recommended for severely dry or cracked skin on heels, elbows, knees, and hands. Also useful after cosmetic procedures, sun exposure, or minor skin irritations. Safe for adults and children.</p>

<h3>How to Use</h3>
<p>Apply a thin layer to affected areas as needed. For cracked heels, apply at night and cover with socks. Can also be used as a lip balm or to soothe minor skin abrasions.</p>

<h3>Key Ingredients</h3>
<ul>
  <li><strong>Petrolatum 46.5%</strong> – active skin protectant that prevents moisture loss</li>
  <li><strong>Ceramides 1, 3 &amp; 6-II</strong> – restore the lipid-rich skin barrier</li>
  <li><strong>Hyaluronic Acid</strong> – attracts moisture to the skin</li>
</ul>

<p>Available at Emart — authentic CeraVe imported and sold with care. Nationwide delivery across Bangladesh with Cash on Delivery.</p>`,
  },

  // ── Eye Repair Cream ──────────────────────────────────────────────────────
  {
    match: /eye-repair-cream/,
    shortDesc: (p, price) =>
      `Buy CeraVe Eye Repair Cream${sizeTag(p)} in Bangladesh from Emart. Reduces dark circles & puffiness with ceramides, hyaluronic acid & niacinamide. Fragrance-free. COD.${price ? ' ' + price + '.' : ''}`.slice(0, 160),
    html: (p) => `<h2>CeraVe Eye Repair Cream${sizeTag(p)}</h2>
<p>CeraVe Eye Repair Cream is a gentle, ophthalmologist-tested eye cream formulated to hydrate the delicate eye area, reduce the appearance of dark circles, and diminish puffiness. Powered by <strong>ceramides</strong>, <strong>hyaluronic acid</strong>, and <strong>niacinamide</strong>.</p>

<h3>Key Benefits</h3>
<ul>
  <li>Reduces the appearance of dark circles and under-eye puffiness</li>
  <li>Hydrates and plumps the delicate eye contour area</li>
  <li>Restores the skin barrier with ceramides 1, 3 &amp; 6-II</li>
  <li>Brightens with niacinamide for a more even, rested look</li>
  <li>Ophthalmologist and dermatologist tested</li>
  <li>Fragrance-free; safe for sensitive skin and contact lens wearers</li>
</ul>

<h3>Who It's For</h3>
<p>Suitable for all skin types, including sensitive skin. Ideal for those concerned about dark circles, dryness, or fine lines around the eye area.</p>

<h3>How to Use</h3>
<p>Apply a small amount to the orbital bone area around the eyes morning and night. Gently pat with a fingertip — do not rub. Avoid applying directly to the eyelid or into the eye.</p>

<h3>Key Ingredients</h3>
<ul>
  <li><strong>Ceramides 1, 3 &amp; 6-II</strong> – strengthen the delicate skin barrier around the eyes</li>
  <li><strong>Hyaluronic Acid</strong> – plumps fine lines and hydrates</li>
  <li><strong>Niacinamide</strong> – reduces discolouration and brightens skin tone</li>
</ul>

<p>Shop at Emart — authentic CeraVe skincare for the Bangladesh market. Fast delivery with Cash on Delivery.</p>`,
  },

  // ── Renewing SA Foot Cream ────────────────────────────────────────────────
  {
    match: /foot-cream|renewing-sa/,
    shortDesc: (p, price) =>
      `Buy CeraVe Renewing SA Foot Cream${sizeTag(p)} in Bangladesh from Emart. Salicylic acid + ceramides for rough, cracked heels and dry feet. Dermatologist developed. COD.${price ? ' ' + price + '.' : ''}`.slice(0, 160),
    html: (p) => `<h2>CeraVe Renewing SA Foot Cream${sizeTag(p)}</h2>
<p>CeraVe Renewing SA Foot Cream is a dermatologist-developed foot treatment formulated with <strong>salicylic acid</strong> and <strong>lactic acid</strong> to gently exfoliate thick, calloused skin, combined with <strong>three essential ceramides</strong> to restore moisture and barrier function.</p>

<h3>Key Benefits</h3>
<ul>
  <li>Exfoliates and smooths rough, cracked heels with salicylic acid</li>
  <li>Softens hardened skin and calluses with lactic acid</li>
  <li>Moisturises deeply and seals in hydration with ceramides</li>
  <li>Hyaluronic acid plumps and replenishes</li>
  <li>Fragrance-free and non-irritating for sensitive foot skin</li>
</ul>

<h3>Who It's For</h3>
<p>Ideal for dry, rough, and cracked feet and heels. Also effective for calloused areas on the soles and balls of the feet.</p>

<h3>How to Use</h3>
<p>Apply generously to clean, dry feet — especially heels and other rough areas. For best results, apply before bed, cover with socks, and allow to absorb overnight.</p>

<h3>Key Ingredients</h3>
<ul>
  <li><strong>Salicylic Acid</strong> – chemically exfoliates dead skin cells from thickened areas</li>
  <li><strong>Lactic Acid</strong> – softens and smooths rough skin</li>
  <li><strong>Ceramides 1, 3 &amp; 6-II</strong> – restore the skin's moisture barrier</li>
  <li><strong>Hyaluronic Acid</strong> – attracts and retains moisture</li>
</ul>

<p>Available at Emart — your trusted Bangladesh retailer for authentic CeraVe foot and body care. Nationwide delivery and Cash on Delivery.</p>`,
  },

  // ── Blemish Control / Acne ────────────────────────────────────────────────
  {
    match: /blemish-control|acne-control|salicylic-acid-cleanser|acne-foaming/,
    shortDesc: (p, price) =>
      `Buy CeraVe Blemish Control${sizeTag(p)} in Bangladesh from Emart. Salicylic acid formula targets breakouts while ceramides protect the skin barrier. Fragrance-free. COD.${price ? ' ' + price + '.' : ''}`.slice(0, 160),
    html: (p) => `<h2>CeraVe Blemish Control${sizeTag(p)}</h2>
<p>CeraVe's Blemish Control range uses <strong>salicylic acid</strong> to unblock pores and reduce breakouts without compromising the skin barrier. Ceramides and hyaluronic acid keep skin hydrated and balanced during acne treatment.</p>

<h3>Key Benefits</h3>
<ul>
  <li>Salicylic acid penetrates pores to clear breakouts at the source</li>
  <li>Reduces blackheads and whiteheads</li>
  <li>Ceramides 1, 3 &amp; 6-II preserve barrier function during treatment</li>
  <li>Hyaluronic acid prevents the dryness often caused by acne treatments</li>
  <li>Non-comedogenic and fragrance-free</li>
  <li>Dermatologist developed — safe for sensitive acne-prone skin</li>
</ul>

<h3>Who It's For</h3>
<p>Suited to oily, combination, and acne-prone skin types. Particularly helpful for those with persistent blackheads or hormonal breakouts.</p>

<h3>How to Use</h3>
<p>Use as directed for the specific product format (cleanser, gel, or cream). Start with once daily to assess skin tolerance, then increase frequency as needed.</p>

<h3>Key Ingredients</h3>
<ul>
  <li><strong>Salicylic Acid</strong> – exfoliates inside pores to clear and prevent breakouts</li>
  <li><strong>Ceramides 1, 3 &amp; 6-II</strong> – maintain barrier health during acne treatment</li>
  <li><strong>Niacinamide</strong> – reduces post-acne redness and discolouration</li>
</ul>

<p>Order from Emart — Bangladesh's trusted source for authentic CeraVe acne care. Fast nationwide delivery with Cash on Delivery.</p>`,
  },

  // ── Ultra-Light Moisturising Lotion SPF ──────────────────────────────────
  {
    match: /ultra-light|spf30|spf-30|sunscreen|sun-lotion/,
    shortDesc: (p, price) =>
      `Buy CeraVe Ultra-Light Moisturising Lotion SPF30${sizeTag(p)} in Bangladesh from Emart. Lightweight daily sunscreen with ceramides. Non-greasy, fragrance-free. COD.${price ? ' ' + price + '.' : ''}`.slice(0, 160),
    html: (p) => `<h2>CeraVe Ultra-Light Moisturising Lotion SPF30${sizeTag(p)}</h2>
<p>CeraVe Ultra-Light Moisturising Lotion SPF30 is a featherweight daily moisturiser and sunscreen formulated for oily and combination skin. It delivers broad-spectrum UV protection without heaviness, powered by <strong>ceramides</strong>, <strong>hyaluronic acid</strong>, and <strong>niacinamide</strong>.</p>

<h3>Key Benefits</h3>
<ul>
  <li>Broad-spectrum SPF30 protects against UVA and UVB rays</li>
  <li>Ultra-lightweight formula — absorbs instantly without greasiness</li>
  <li>Controls excess shine for a matte or natural finish</li>
  <li>Ceramides 1, 3 &amp; 6-II support the skin barrier</li>
  <li>Hyaluronic acid keeps skin comfortable and hydrated</li>
  <li>Non-comedogenic, fragrance-free, tested for sensitive skin</li>
</ul>

<h3>Who It's For</h3>
<p>Ideal for oily, combination, and normal skin types that need daily UV protection without heavy or greasy texture. Perfect under makeup.</p>

<h3>How to Use</h3>
<p>Apply generously as the last step of your morning skincare routine. Spread evenly across face and neck. Reapply every two hours during prolonged sun exposure.</p>

<h3>Key Ingredients</h3>
<ul>
  <li><strong>Broad-Spectrum SPF30</strong> – daily UV shield for face</li>
  <li><strong>Ceramides 1, 3 &amp; 6-II</strong> – maintain a healthy skin barrier</li>
  <li><strong>Hyaluronic Acid</strong> – lightweight hydration</li>
  <li><strong>Niacinamide</strong> – reduces pore appearance and redness</li>
</ul>

<p>Shop at Emart — authentic CeraVe suncare in Bangladesh. Nationwide delivery with Cash on Delivery available.</p>`,
  },

  // ── Psoriasis Moisturising Cream ─────────────────────────────────────────
  {
    match: /psoriasis/,
    shortDesc: (p, price) =>
      `Buy CeraVe Psoriasis Moisturising Cream${sizeTag(p)} in Bangladesh from Emart. Salicylic acid + ceramides for scaly, flaky psoriasis-prone skin. Dermatologist recommended. COD.${price ? ' ' + price + '.' : ''}`.slice(0, 160),
    html: (p) => `<h2>CeraVe Psoriasis Moisturising Cream${sizeTag(p)}</h2>
<p>CeraVe Psoriasis Moisturising Cream is a targeted treatment moisturiser formulated to relieve the symptoms of psoriasis. It combines <strong>salicylic acid</strong> to remove flaky, scaly skin with <strong>ceramides</strong> and <strong>urea</strong> to restore moisture and protect the barrier.</p>

<h3>Key Benefits</h3>
<ul>
  <li>Relieves itching, scaling, and flaking associated with psoriasis</li>
  <li>Salicylic acid softens and removes dead skin cells</li>
  <li>Ceramides restore barrier function for long-lasting protection</li>
  <li>Urea deeply hydrates and softens thickened skin</li>
  <li>Fragrance-free; suitable for sensitive psoriasis-prone skin</li>
  <li>Dermatologist developed — clinically tested for psoriasis</li>
</ul>

<h3>Who It's For</h3>
<p>Specifically formulated for skin affected by psoriasis, seborrheic dermatitis, and other scaling skin conditions. Suitable for adults.</p>

<h3>How to Use</h3>
<p>Apply to affected areas once or twice daily. Rub in gently and completely. For external use only. If condition worsens, consult a dermatologist.</p>

<h3>Key Ingredients</h3>
<ul>
  <li><strong>Salicylic Acid 2%</strong> – removes scale and relieves flaking</li>
  <li><strong>Ceramides 1, 3 &amp; 6-II</strong> – replenish the compromised barrier</li>
  <li><strong>Urea</strong> – intensely hydrates and softens thickened skin</li>
  <li><strong>Hyaluronic Acid</strong> – maintains moisture balance</li>
</ul>

<p>Order from Emart — your trusted Bangladesh source for authentic CeraVe skincare. Nationwide delivery with Cash on Delivery.</p>`,
  },

  // ── Hydrating Cream-to-Foam Cleanser ─────────────────────────────────────
  {
    match: /cream-to-foam|hydrating.*foam|foam.*hydrating/,
    shortDesc: (p, price) =>
      `Buy CeraVe Hydrating Cream-to-Foam Cleanser${sizeTag(p)} in Bangladesh from Emart. Rich cream cleanser that foams gently — ceramides + hyaluronic acid. COD.${price ? ' ' + price + '.' : ''}`.slice(0, 160),
    html: (p) => `<h2>CeraVe Hydrating Cream-to-Foam Cleanser${sizeTag(p)}</h2>
<p>CeraVe Hydrating Cream-to-Foam Cleanser starts as a cream but transforms into a lightweight foam on contact with water. It gently cleanses and removes makeup while preserving the skin's moisture with <strong>ceramides</strong> and <strong>hyaluronic acid</strong>.</p>

<h3>Key Benefits</h3>
<ul>
  <li>Unique cream-to-foam texture for a luxurious yet gentle cleanse</li>
  <li>Removes makeup and sunscreen effectively</li>
  <li>Ceramides replenish the skin barrier with every wash</li>
  <li>Hyaluronic acid preserves skin's natural moisture level</li>
  <li>Non-comedogenic and fragrance-free</li>
  <li>Suitable for normal to dry and sensitive skin types</li>
</ul>

<h3>Who It's For</h3>
<p>Ideal for normal to dry skin types that enjoy a foaming cleanser but want to avoid the dryness foam can sometimes cause.</p>

<h3>How to Use</h3>
<p>Apply to damp skin. Work into a lather with gentle circular motions. Rinse thoroughly with lukewarm water. Use morning and night.</p>

<h3>Key Ingredients</h3>
<ul>
  <li><strong>Ceramides 1, 3 &amp; 6-II</strong> – replenish the protective skin barrier</li>
  <li><strong>Hyaluronic Acid</strong> – retains moisture while cleansing</li>
  <li><strong>Niacinamide</strong> – soothes and balances skin tone</li>
</ul>

<p>Shop at Emart — authentic CeraVe skincare imported and available across Bangladesh. Cash on Delivery and fast nationwide shipping.</p>`,
  },

  // ── Generic CeraVe fallback (no specific match) ───────────────────────────
  {
    match: /cerave/,
    shortDesc: (p, price) => {
      const name = p.name || 'CeraVe Product';
      return `Buy ${name}${sizeTag(p)} in Bangladesh from Emart. Authentic CeraVe dermatologist-developed skincare with ceramides. Fast delivery & COD available.${price ? ' ' + price + '.' : ''}`.slice(0, 160);
    },
    html: (p) => `<h2>${p.name || 'CeraVe Skincare'}${sizeTag(p)}</h2>
<p>${p.name || 'This CeraVe product'} is formulated with <strong>three essential ceramides</strong> and <strong>hyaluronic acid</strong>, developed with dermatologists to support the skin's natural protective barrier and provide long-lasting hydration.</p>

<h3>Key Benefits</h3>
<ul>
  <li>Developed with dermatologists for effective, gentle skincare</li>
  <li>Restores and maintains the skin barrier with ceramides 1, 3 &amp; 6-II</li>
  <li>Provides lasting hydration with hyaluronic acid</li>
  <li>Fragrance-free, non-comedogenic, and suitable for sensitive skin</li>
</ul>

<h3>How to Use</h3>
<p>Apply to clean skin as directed. Massage gently until fully absorbed. Use consistently for best results.</p>

<h3>Why CeraVe at Emart?</h3>
<p>Emart is one of the most trusted sources for authentic CeraVe products in Bangladesh. All products are imported directly and checked for authenticity before dispatch. Fast delivery across Dhaka and nationwide, with Cash on Delivery available.</p>`,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sizeTag(product) {
  const slug = product.slug || '';
  const m = slug.match(/(\d+)(ml|g|oz|kg)/) || (product.name || '').match(/(\d+)(ml|g|oz|kg)/i);
  if (m) return ` ${m[1]}${m[2].toLowerCase()}`;
  return '';
}

function findTemplate(product) {
  const slug = (product.slug || '').toLowerCase();
  for (const tpl of DESCRIPTIONS) {
    if (tpl.match.test(slug)) return tpl;
  }
  // fallback: check name
  const name = (product.name || '').toLowerCase();
  for (const tpl of DESCRIPTIONS) {
    if (tpl.match.test(name)) return tpl;
  }
  return null;
}

function needsUpdate(product) {
  const desc = (product.description || '').trim();
  const shortDesc = (product.short_description || '').trim();
  const metaMeta = (product.meta_data || []).find(m => m.key === '_emart_meta_description')?.value || '';
  return !desc || !shortDesc || !metaMeta;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n🔍 Fetching all CeraVe products from WooCommerce...`);
  const products = await fetchAllCeraVeProducts();
  console.log(`   Found ${products.length} CeraVe products.\n`);

  if (products.length === 0) {
    console.log('No CeraVe products found. Check your WooCommerce credentials and search term.');
    return;
  }

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of products) {
    const slug = product.slug || product.id;
    const name = product.name || slug;
    const price = livePrice(product);
    const tpl = findTemplate(product);

    if (!tpl) {
      console.log(`  ⚠️  No template matched for: ${name} (${slug})`);
      skipped++;
      continue;
    }

    if (!needsUpdate(product)) {
      console.log(`  ✅ Already has description: ${name}`);
      skipped++;
      continue;
    }

    const shortDesc = tpl.shortDesc(product, price);
    const html = tpl.html(product);

    console.log(`  📝 Updating: ${name} (${slug})`);
    console.log(`     Meta: ${shortDesc.slice(0, 80)}...`);

    try {
      await wooPut(`/products/${product.id}`, {
        description: html,
        short_description: `<p>${shortDesc}</p>`,
        meta_data: [
          { key: '_emart_meta_description', value: shortDesc },
        ],
      });
      console.log(`     ✅ Done`);
      updated++;
    } catch (err) {
      console.error(`     ❌ Failed: ${err.message}`);
      failed++;
    }

    // Small pause to avoid hammering the API
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated : ${updated}`);
  console.log(`   Skipped : ${skipped} (already complete or no template)`);
  console.log(`   Failed  : ${failed}`);
  console.log(DRY_RUN ? '\n[DRY_RUN mode — no changes were written to WooCommerce]\n' : '');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
