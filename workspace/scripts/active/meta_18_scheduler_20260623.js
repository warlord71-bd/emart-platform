#!/usr/bin/env node

require('/opt/fb-poster/node_modules/dotenv').config({ path: '/opt/fb-poster/.env' });
const axios = require('/opt/fb-poster/node_modules/axios');
const crypto = require('crypto');

const API_VERSION = process.env.META_GRAPH_API_VERSION || 'v19.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const PAGE_ID = process.env.PAGE_ID;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const APP_SECRET = process.env.APP_SECRET;
const LOG_PREFIX = '[emart-meta-18]';

const posts = [
  {
    time: '09:00',
    label: 'Pipeline 01 COSRX Salicylic Cleanser',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/01-cosrx-salicylic-cleanser-4x5.png',
    link: 'https://e-mart.com.bd/shop/cosrx-salicylic-acid-daily-gentle-cleanser-150ml',
    caption: `Daily gentle cleanse for oily, acne-prone skin in Bangladesh. COSRX Salicylic Acid Daily Gentle Cleanser helps keep the routine simple: cleanse, balance, follow with toner and SPF. Authentic COSRX available at Emart with Cash on Delivery across Bangladesh.\n\n#COSRXBangladesh #KBeautyBangladesh #AcneProneSkin #SkincareBangladesh #EmartSkincare`,
  },
  {
    time: '09:49',
    label: 'Model 01 BOJ Relief Sun',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/01-boj-relief-sun-model-real-4x5.png',
    link: 'https://e-mart.com.bd/shop/beauty-of-joseon-relief-sun-aqua-fresh-rice-b5-50ml',
    caption: `Light sunscreen, clean finish, everyday comfort. Beauty of Joseon Relief Sun Aqua-fresh Rice + B5 is a smart daily SPF pick for Bangladesh weather when you want protection without a heavy feel. Original BOJ at Emart, COD available.\n\n#BeautyOfJoseonBangladesh #SunscreenBangladesh #KBeautyBD #SkincareRoutine #EmartSkincare`,
  },
  {
    time: '10:39',
    label: 'Pipeline 02 Some By Mi Miracle Serum',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/02-some-by-mi-miracle-serum-4x5.png',
    link: 'https://e-mart.com.bd/shop/some-by-mi-aha-bha-pha-30-days-miracle-serum-50ml',
    caption: `Breakout-prone routine feeling messy? SOME BY MI AHA BHA PHA 30 Days Miracle Serum is a popular K-beauty serum for smoother-looking, clearer-looking skin. Use carefully, keep sunscreen in your morning routine, and buy authentic stock from Emart.\n\n#SomeByMiBangladesh #KBeautyBangladesh #SerumBangladesh #AcneCareRoutine #EmartSkincare`,
  },
  {
    time: '11:28',
    label: 'Model 02 COSRX Snail',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/02-cosrx-snail-model-real-4x5.png',
    link: 'https://e-mart.com.bd/shop/cosrx-advanced-snail-mucin-96-power-essence-100ml',
    caption: `Hydration that made COSRX famous. Advanced Snail 96 Mucin Power Essence is a K-beauty classic for dewy, healthy-looking skin and a stronger-feeling moisture routine. Original COSRX available at Emart Bangladesh.\n\n#COSRXSnailMucin #COSRXBangladesh #KBeautyBD #HydratingSkincare #EmartSkincare`,
  },
  {
    time: '12:18',
    label: 'Pipeline 03 Numbuzin No.5 Toner',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/03-numbuzin-no5-toner-4x5.png',
    link: 'https://e-mart.com.bd/shop/numbuzin-no-5-vitamin-boosting-essential-toner-200ml',
    caption: `Brightening routine, but keep it gentle. Numbuzin No.5 Vitamin Boosting Essential Toner brings a fresh toner step for dull-looking skin and uneven tone routines. Authentic Numbuzin available at Emart with COD.\n\n#NumbuzinBangladesh #VitaminToner #KBeautyBangladesh #BrighteningRoutine #EmartSkincare`,
  },
  {
    time: '13:07',
    label: 'Model 03 Anua Niacinamide TXA',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/03-anua-niacinamide-txa-model-real-4x5.png',
    link: 'https://e-mart.com.bd/shop/anua-niacinamide-10-txa-4-serum-30ml',
    caption: `Dark spots and uneven tone need a consistent routine, not guesswork. Anua Niacinamide 10% + TXA 4% Serum is one of the most searched brightening serums for targeted skincare lovers in Bangladesh. Original Anua at Emart.\n\n#AnuaBangladesh #NiacinamideSerum #DarkSpotRoutine #KBeautyBangladesh #EmartSkincare`,
  },
  {
    time: '13:56',
    label: 'Pipeline 04 Haruharu Black Rice Toner',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/04-haruharu-black-rice-toner-4x5.png',
    link: 'https://e-mart.com.bd/shop/haruharu-wonder-black-rice-hyaluronic-toner-150ml',
    caption: `Soft hydration with a premium K-beauty feel. HaruHaru Wonder Black Rice Hyaluronic Toner is a beautiful toner step for skin that wants moisture without heaviness. Authentic HaruHaru available at Emart Bangladesh.\n\n#HaruHaruBangladesh #BlackRiceToner #HydratingToner #KBeautyBD #EmartSkincare`,
  },
  {
    time: '14:46',
    label: 'Model 04 COSRX BHA',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/04-cosrx-bha-model-real-4x5.png',
    link: 'https://e-mart.com.bd/shop/cosrx-bha-blackhead-power-liquid-100ml',
    caption: `Pores and blackheads on your skincare checklist? COSRX BHA Blackhead Power Liquid is a routine favorite for smoother-looking skin. Start slow, use sunscreen, and shop original COSRX from Emart Bangladesh.\n\n#COSRXBHA #BlackheadCare #PoreCareBangladesh #KBeautyBangladesh #EmartSkincare`,
  },
  {
    time: '15:35',
    label: 'Pipeline 05 Isntree Green Tea Toner',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/05-isntree-green-tea-toner-4x5.png',
    link: 'https://e-mart.com.bd/shop/isntree-green-tea-fresh-toner-200ml',
    caption: `Fresh, lightweight toner energy for oily and combination skin routines. Isntree Green Tea Fresh Toner is a popular K-beauty pick when your skin wants balance, not heaviness. Original Isntree at Emart with COD.\n\n#IsntreeBangladesh #GreenTeaToner #OilySkinRoutine #KBeautyBD #EmartSkincare`,
  },
  {
    time: '16:25',
    label: 'Model 05 COSRX Hydrium Toner',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/05-cosrx-hydrium-toner-model-real-4x5.png',
    link: 'https://e-mart.com.bd/shop/cosrx-hydrium-watery-toner-150ml',
    caption: `Hydration without the sticky feeling. COSRX Hydrium Watery Toner is a fresh toner step for daily moisture support in Bangladesh weather. Authentic COSRX stock, delivered across Bangladesh by Emart.\n\n#COSRXHydrium #HydratingToner #KBeautyBangladesh #SkincareBD #EmartSkincare`,
  },
  {
    time: '17:14',
    label: 'Pipeline 06 Torriden Dive-In Serum',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/06-torriden-dive-in-serum-4x5.png',
    link: 'https://e-mart.com.bd/shop/torriden-dive-in-low-molecule-hyaluronic-acid-serum-50ml',
    caption: `Lightweight hydration serum lovers, this one is for you. Torriden Dive-In Low Molecule Hyaluronic Acid Serum is a popular K-beauty pick for plump, fresh, hydrated-looking skin. Available at Emart Bangladesh with COD.\n\n#TorridenBangladesh #HyaluronicAcidSerum #HydrationRoutine #KBeautyBD #EmartSkincare`,
  },
  {
    time: '18:04',
    label: 'Model 06 Anua Cleansing Oil',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/06-anua-cleansing-oil-model-real-4x5.png',
    link: 'https://e-mart.com.bd/shop/anua-heartleaf-pore-control-cleansing-oil-200ml',
    caption: `Sunscreen days need a proper first cleanse. Anua Heartleaf Pore Control Cleansing Oil helps your evening routine start clean and comfortable. Original Anua available at Emart Bangladesh with Cash on Delivery.\n\n#AnuaBangladesh #CleansingOil #DoubleCleansing #KBeautyBangladesh #EmartSkincare`,
  },
  {
    time: '18:53',
    label: 'Pipeline 07 iUNIK Beta-glucan Serum',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/07-iunik-beta-glucan-serum-4x5.png',
    link: 'https://e-mart.com.bd/shop/iunik-beta-glucan-power-moisture-serum-50ml',
    caption: `Barrier-friendly hydration for skin that feels dry or tired. iUNIK Beta-glucan Power Moisture Serum is a calm, moisture-focused serum step for everyday routines. Shop authentic iUNIK at Emart Bangladesh.\n\n#iUNIKBangladesh #BetaGlucanSerum #MoistureSerum #KBeautyBD #EmartSkincare`,
  },
  {
    time: '19:42',
    label: 'Model 07 SKIN1004 Sun Serum',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/07-skin1004-hyalu-cica-sun-serum-model-real-4x5.png',
    link: 'https://e-mart.com.bd/shop/skin1004-centella-hyalu-cica-water-fit-sun-serum-100ml',
    caption: `Centella sunscreen with a fresh serum feel. SKIN1004 Hyalu-Cica Water-Fit Sun Serum is a popular daily SPF choice for Bangladesh weather: lightweight, skincare-like, and easy to wear. Original SKIN1004 at Emart.\n\n#SKIN1004Bangladesh #SunscreenBangladesh #CentellaSkincare #KBeautyBD #EmartSkincare`,
  },
  {
    time: '20:32',
    label: 'Pipeline 08 BOJ Apricot Peeling Gel',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/08-boj-apricot-peeling-gel-4x5.png',
    link: 'https://e-mart.com.bd/shop/beauty-of-joseon-apricot-blossom-peeling-gel-100ml',
    caption: `Smooth-skin routine, gently done. Beauty of Joseon Apricot Blossom Peeling Gel is a soft exfoliating step for dull-looking texture days. Keep it simple, do not overuse, and shop authentic BOJ from Emart.\n\n#BeautyOfJoseonBangladesh #PeelingGel #KBeautyBangladesh #SmoothSkinRoutine #EmartSkincare`,
  },
  {
    time: '21:21',
    label: 'Model 08 Axis-Y Dark Spot Serum',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/08-axis-y-dark-spot-serum-model-real-4x5.png',
    link: 'https://e-mart.com.bd/shop/axis-y-dark-spot-correcting-glow-serum-50ml',
    caption: `Glow routine favorite for uneven tone concerns. Axis-Y Dark Spot Correcting Glow Serum is a well-loved K-beauty serum for a brighter-looking, more even-looking routine. Authentic Axis-Y available at Emart Bangladesh.\n\n#AxisYBangladesh #DarkSpotSerum #GlowSerum #KBeautyBD #EmartSkincare`,
  },
  {
    time: '22:11',
    label: 'Pipeline 09 Cos De BAHA Azelaic Serum',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/09-cos-de-baha-azelaic-serum-4x5.png',
    link: 'https://e-mart.com.bd/shop/cos-de-baha-azelaic-acid-10-serum-az-30ml',
    caption: `A focused serum step for blemish-prone and uneven-looking skin routines. Cos De BAHA Azelaic Acid 10% Serum is a smart pick for ingredient-led skincare lovers in Bangladesh. Buy authentic stock from Emart.\n\n#CosDeBahaBangladesh #AzelaicAcid #SerumBangladesh #IngredientSkincare #EmartSkincare`,
  },
  {
    time: '23:00',
    label: 'Pipeline 10 The Ordinary Peeling Solution',
    image: 'https://e-mart.com.bd/images/social/2026-06-23/meta-18/10-the-ordinary-aha-bha-peeling-4x5.png',
    link: 'https://e-mart.com.bd/shop/the-ordinary-aha-30bha-2-peeling-solution-30ml',
    caption: `Strong exfoliation needs smart use. The Ordinary AHA 30% + BHA 2% Peeling Solution is a cult favorite for experienced users only: patch test, follow instructions, and protect skin with sunscreen. Original The Ordinary at Emart.\n\n#TheOrdinaryBangladesh #AHA30BHA2 #ExfoliationRoutine #SkincareBangladesh #EmartSkincare`,
  },
];

function requireConfig() {
  const missing = [];
  if (!PAGE_ID) missing.push('PAGE_ID');
  if (!PAGE_ACCESS_TOKEN) missing.push('PAGE_ACCESS_TOKEN');
  if (missing.length) throw new Error(`Missing required .env value(s): ${missing.join(', ')}`);
}

function appSecretProof(token) {
  if (!APP_SECRET) return undefined;
  return crypto.createHmac('sha256', APP_SECRET).update(token).digest('hex');
}

function authParams(token = PAGE_ACCESS_TOKEN) {
  const params = { access_token: token };
  const proof = appSecretProof(token);
  if (proof) params.appsecret_proof = proof;
  return params;
}

function metaError(error) {
  if (error.response) return `Meta API ${error.response.status}: ${JSON.stringify(error.response.data)}`;
  if (error.request) return `Meta API request failed without response: ${error.message}`;
  return error.message;
}

async function graphGet(pathname, params = {}) {
  try {
    const response = await axios.get(`${GRAPH_BASE_URL}${pathname}`, {
      params: { ...params, ...authParams() },
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    throw new Error(metaError(error));
  }
}

async function graphPost(pathname, params = {}) {
  try {
    const response = await axios.post(
      `${GRAPH_BASE_URL}${pathname}`,
      new URLSearchParams({ ...params, ...authParams() }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 90000 },
    );
    return response.data;
  } catch (error) {
    throw new Error(metaError(error));
  }
}

async function getInstagramUserId() {
  const page = await graphGet(`/${PAGE_ID}`, { fields: 'instagram_business_account' });
  const id = page.instagram_business_account && page.instagram_business_account.id;
  if (!id) throw new Error(`No linked Instagram Business account found for Page ${PAGE_ID}`);
  return id;
}

async function postFacebook(post) {
  const result = await graphPost(`/${PAGE_ID}/photos`, {
    url: post.image,
    caption: post.caption,
    published: 'true',
  });
  return result.post_id || result.id;
}

async function postInstagram(post, igUserId) {
  const container = await graphPost(`/${igUserId}/media`, {
    image_url: post.image,
    caption: post.caption,
  });
  if (!container.id) throw new Error(`Instagram media container missing id: ${JSON.stringify(container)}`);
  const published = await graphPost(`/${igUserId}/media_publish`, { creation_id: container.id });
  return published.id;
}

async function addComment(targetId, message, platform) {
  try {
    const result = await graphPost(`/${targetId}/comments`, { message });
    console.log(`${LOG_PREFIX} ${platform} first comment OK: ${targetId} -> ${result.id || 'ok'}`);
  } catch (error) {
    console.error(`${LOG_PREFIX} ${platform} first comment FAILED for ${targetId}: ${error.message}`);
  }
}

function dueAt(post) {
  return new Date(`2026-06-23T${post.time}:00+06:00`);
}

async function publishOne(post, igUserId) {
  console.log(`${LOG_PREFIX} publishing ${post.time} ${post.label}`);
  console.log(`${LOG_PREFIX} image ${post.image}`);
  const facebookId = await postFacebook(post);
  console.log(`${LOG_PREFIX} Facebook post ID: ${facebookId}`);
  await addComment(facebookId, post.link, 'Facebook');

  const instagramId = await postInstagram(post, igUserId);
  console.log(`${LOG_PREFIX} Instagram post ID: ${instagramId}`);
  await addComment(instagramId, post.link, 'Instagram');
}

async function main() {
  requireConfig();
  const igUserId = await getInstagramUserId();
  console.log(`${LOG_PREFIX} scheduler active. Posts: ${posts.length}. IG user: ${igUserId}`);

  let scheduled = 0;
  for (const post of posts) {
    const delay = dueAt(post).getTime() - Date.now();
    if (delay <= -10 * 60 * 1000) {
      console.log(`${LOG_PREFIX} skipping old slot ${post.time} ${post.label}`);
      continue;
    }
    const wait = Math.max(0, delay);
    scheduled += 1;
    console.log(`${LOG_PREFIX} scheduled ${post.time} ${post.label} in ${Math.round(wait / 60000)} min`);
    setTimeout(() => {
      publishOne(post, igUserId).catch((error) => {
        console.error(`${LOG_PREFIX} publish FAILED ${post.time} ${post.label}: ${error.message}`);
      });
    }, wait);
  }

  if (!scheduled) {
    console.log(`${LOG_PREFIX} no remaining posts to schedule`);
    return;
  }

  const finalDelay = dueAt(posts[posts.length - 1]).getTime() - Date.now() + 15 * 60 * 1000;
  setTimeout(() => {
    console.log(`${LOG_PREFIX} scheduler finished window`);
    process.exit(0);
  }, Math.max(60_000, finalDelay));
}

main().catch((error) => {
  console.error(`${LOG_PREFIX} scheduler failed: ${error.message}`);
  process.exit(1);
});
