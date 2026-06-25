#!/usr/bin/env node

const path = require('path');
const crypto = require('crypto');
const { axios } = require('./meta_runtime');

const API_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const PAGE_ID = process.env.META_PAGE_ID || process.env.PAGE_ID;
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || process.env.PAGE_ACCESS_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET || process.env.APP_SECRET;
const LOG_PREFIX = '[emart-ig-18-20260624]';
const RUN_STARTED_AT = Date.now();
const catchUpArg = process.argv.find((arg) => arg.startsWith('--catch-up='));
const CATCH_UP_INTERVAL_MINUTES = catchUpArg ? Number(catchUpArg.split('=')[1]) : 0;
const CATCH_UP_START_DELAY_MINUTES = 2;
const VALIDATE_ONLY = process.argv.includes('--validate-only');
const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
const ONLY_INDEX = onlyArg ? Number(onlyArg.split('=')[1]) : null;
const startIndexArg = process.argv.find((arg) => arg.startsWith('--start-index='));
const START_INDEX = startIndexArg ? Number(startIndexArg.split('=')[1]) : 0;

const assetBase = 'https://e-mart.com.bd/images/social/2026-06-24/fb-18-v3';

const posts = [
  {
    time: '2026-06-24T09:00:00+06:00',
    label: 'IG 01 COSRX Acne Pimple Master Patch',
    image: `${assetBase}/01-cosrx-acne-pimple-master-patch-1x1.jpg`,
    caption: `Tiny patch, big rescue energy.\n\nSudden breakout before office, class, or an outing? Keep this in your emergency skincare kit.\n\nDM to order or tap the link in bio.\n\n#COSRXBangladesh #AcnePatch #KBeautyBD #SkincareBangladesh #EmartSkincare`,
  },
  {
    time: '2026-06-24T09:49:00+06:00',
    label: 'IG 02 Innisfree Super Volcanic Clay Mask',
    image: `${assetBase}/02-innisfree-super-volcanic-clay-mask-1x1.jpg`,
    caption: `Pore-care night, but make it K-beauty.\n\nA wash-off mask moment for oily, congested, or texture-focused routines.\n\nDM to order or tap the link in bio.\n\n#InnisfreeBangladesh #ClayMask #PoreCare #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T10:39:00+06:00',
    label: 'IG 03 3W Clinic Intensive UV Sunblock',
    image: `${assetBase}/03-3w-clinic-intensive-uv-sunblock-1x1.jpg`,
    caption: `SPF ta daily habit, not occasional luxury.\n\nAn easy Korean sunscreen pick for Bangladesh heat, commute, and daylight routines.\n\nDM to order or tap the link in bio.\n\n#SunscreenBangladesh #3WClinic #KBeautyBD #SPFRoutine #EmartSkincare`,
  },
  {
    time: '2026-06-24T11:28:00+06:00',
    label: 'IG 04 Dr Althea 345NA Relief Cream',
    image: `${assetBase}/04-dr-althea-345na-relief-cream-1x1.jpg`,
    caption: `Some days your skin just wants peace.\n\nA calm, clean K-beauty cream vibe for a softer-feeling moisture step.\n\nDM to order or tap the link in bio.\n\n#DrAltheaBangladesh #ReliefCream #KBeautyBD #BarrierCare #EmartSkincare`,
  },
  {
    time: '2026-06-24T12:18:00+06:00',
    label: 'IG 05 Welcos Confume Argan Shampoo',
    image: `${assetBase}/05-welcos-confume-argan-hair-shampoo-1x1.jpg`,
    caption: `Hair-care deserves K-beauty energy too.\n\nA big-bottle Korean hair-care pick for smoother, fresher wash days.\n\nDM to order or tap the link in bio.\n\n#KoreanHairCare #ConfumeBangladesh #HairShampoo #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T13:07:00+06:00',
    label: 'IG 06 COSRX Aloe Soothing Sun Cream',
    image: `${assetBase}/06-cosrx-aloe-soothing-sun-cream-1x1.jpg`,
    caption: `Aloe + SPF is always a good idea.\n\nFor people who want sunscreen that feels like skincare, not a punishment.\n\nDM to order or tap the link in bio.\n\n#COSRXBangladesh #AloeSunscreen #SunscreenBangladesh #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T13:56:00+06:00',
    label: 'IG 07 Missha Airy Fit Sheet Mask Rice',
    image: `${assetBase}/07-missha-airy-fit-sheet-mask-rice-1x1.jpg`,
    caption: `One sheet mask, ten minutes, softer mood.\n\nA quick K-beauty treat for nights when you want the routine to feel special.\n\nDM to order or tap the link in bio.\n\n#MisshaBangladesh #SheetMask #RiceMask #KBeautyBangladesh #EmartSkincare`,
  },
  {
    time: '2026-06-24T14:46:00+06:00',
    label: 'IG 08 Dr Althea Vitamin C Boosting Serum',
    image: `${assetBase}/08-dr-althea-vitamin-c-boosting-serum-1x1.jpg`,
    caption: `Glow routine people, this one is pretty.\n\nA bright, premium K-beauty serum look for simple glow-focused routines.\n\nDM to order or tap the link in bio.\n\n#DrAltheaBangladesh #VitaminCSerum #GlowRoutine #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T15:35:00+06:00',
    label: 'IG 09 COSRX Pure Fit Cica Serum',
    image: `${assetBase}/09-cosrx-pure-fit-cica-serum-1x1.jpg`,
    caption: `Cica serum has a loyal fan club for a reason.\n\nA simple Korean serum step for a calmer, softer-feeling routine.\n\nDM to order or tap the link in bio.\n\n#COSRXBangladesh #CicaSerum #KBeautyBD #CalmingSkincare #EmartSkincare`,
  },
  {
    time: '2026-06-24T16:25:00+06:00',
    label: 'IG 10 Missha Aqua Sun SPF',
    image: `${assetBase}/10-missha-aqua-sun-spf-1x1.jpg`,
    caption: `For people who want SPF without the heavy feeling.\n\nA fresh sunscreen pick for hot days, quick mornings, and lightweight routines.\n\nDM to order or tap the link in bio.\n\n#MisshaBangladesh #AquaSun #SunscreenBangladesh #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T17:14:00+06:00',
    label: 'IG 11 A’pieu Raspberry Hair Vinegar',
    image: `${assetBase}/11-apieu-raspberry-hair-vinegar-1x1.jpg`,
    caption: `This is the fun hair-care step your shelf is missing.\n\nA fresh Korean routine twist for smoother-feeling, shinier-looking hair days.\n\nDM to order or tap the link in bio.\n\n#ApieuBangladesh #KoreanHairCare #HairVinegar #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T18:04:00+06:00',
    label: 'IG 12 iUNIK Centella Calming Gel Cream',
    image: `${assetBase}/12-iunik-centella-calming-gel-cream-1x1.jpg`,
    caption: `Gel cream lovers, this is your lane.\n\nLightweight, clean, and easy to fit into a Bangladesh-friendly routine.\n\nDM to order or tap the link in bio.\n\n#iUNIKBangladesh #CentellaCream #KBeautyBangladesh #CalmingSkincare #EmartSkincare`,
  },
  {
    time: '2026-06-24T18:53:00+06:00',
    label: 'IG 13 Mise En Scene Perfect Hair Serum',
    image: `${assetBase}/13-mise-en-scene-perfect-hair-serum-1x1.jpg`,
    caption: `K-beauty, but for hair.\n\nA Korean hair serum pick for smoother-looking, shinier-feeling hair days.\n\nDM to order or tap the link in bio.\n\n#MiseEnScene #KoreanHairCare #HairSerumBangladesh #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T19:42:00+06:00',
    label: 'IG 14 PURITO Pure Vitamin C Serum',
    image: `${assetBase}/14-purito-pure-vitamin-c-serum-1x1.jpg`,
    caption: `A clean little glow step from PURITO.\n\nFor skincare people who like ingredient-led routines without making the shelf complicated.\n\nDM to order or tap the link in bio.\n\n#PuritoBangladesh #VitaminCSerum #KBeautyBD #GlowSkincare #EmartSkincare`,
  },
  {
    time: '2026-06-24T20:32:00+06:00',
    label: 'IG 15 Tiam Anti-Blemish Body Lotion',
    image: `${assetBase}/15-tiam-anti-blemish-body-lotion-1x1.jpg`,
    caption: `Skincare does not stop at the face.\n\nA Korean body-care pick for anyone trying to make body skincare feel like a real routine.\n\nDM to order or tap the link in bio.\n\n#TiamBangladesh #BodyCare #KBeautyBD #BlemishRoutine #EmartSkincare`,
  },
  {
    time: '2026-06-24T21:21:00+06:00',
    label: 'IG 16 COXIR Ultra Hyaluronic Cleansing Oil',
    image: `${assetBase}/16-coxir-ultra-hyaluronic-cleansing-oil-1x1.jpg`,
    caption: `If you wear sunscreen, double cleansing starts making sense.\n\nA Korean first-cleanse pick for soft, clean-feeling evenings.\n\nDM to order or tap the link in bio.\n\n#CoxirBangladesh #CleansingOil #DoubleCleansing #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T22:11:00+06:00',
    label: 'IG 17 COSRX AC Collection Acne Patch',
    image: `${assetBase}/17-cosrx-ac-collection-acne-patch-1x1.jpg`,
    caption: `Patch people know the comfort of having backups.\n\nA handy Korean spot-care option for surprise breakout days.\n\nDM to order or tap the link in bio.\n\n#COSRXBangladesh #AcnePatch #SpotCare #KBeautyBangladesh #EmartSkincare`,
  },
  {
    time: '2026-06-24T23:00:00+06:00',
    label: 'IG 18 W.SKIN LAB Triple Care Sun Cream',
    image: `${assetBase}/18-wskin-lab-triple-care-sun-cream-1x1.jpg`,
    caption: `Tomorrow’s SPF decision can be made tonight.\n\nA Korean sunscreen pick for everyday protection routines in Bangladesh weather.\n\nDM to order or tap the link in bio.\n\n#WSKINLAB #SunscreenBangladesh #KBeautyBD #SPF50 #EmartSkincare`,
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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await axios.post(
        `${GRAPH_BASE_URL}${pathname}`,
        new URLSearchParams({ ...params, ...authParams() }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 90000 },
      );
      return response.data;
    } catch (error) {
      const status = error.response && error.response.status;
      const code = error.response && error.response.data && error.response.data.error
        ? error.response.data.error.code
        : undefined;
      const retryable = status >= 500 || [1, 2, 4, 17, 32, 613].includes(code);
      if (!retryable || attempt === 3) throw new Error(metaError(error));
      const delay = 2000 * (2 ** (attempt - 1));
      console.error(`${LOG_PREFIX} transient Meta error on ${pathname}; retry ${attempt}/3 in ${delay / 1000}s`);
      await wait(delay);
    }
  }
  throw new Error(`Meta API retry loop ended unexpectedly for ${pathname}`);
}

async function getInstagramUserId() {
  const page = await graphGet('/me', { fields: 'id,name,instagram_business_account' });
  if (String(page.id) !== String(PAGE_ID)) {
    throw new Error(
      `PAGE_ACCESS_TOKEN is not a Page token for PAGE_ID ${PAGE_ID}. ` +
      `It resolves to ${page.id || 'unknown'} (${page.name || 'unknown'}).`,
    );
  }

  const id = page.instagram_business_account && page.instagram_business_account.id;
  if (!id) throw new Error(`No linked Instagram Business account found for Page ${PAGE_ID}`);
  return { id, pageName: page.name || PAGE_ID };
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

function dueAt(post, index) {
  if (CATCH_UP_INTERVAL_MINUTES > 0) {
    const minutes = CATCH_UP_START_DELAY_MINUTES + (index * CATCH_UP_INTERVAL_MINUTES);
    return new Date(RUN_STARTED_AT + minutes * 60 * 1000);
  }
  return new Date(post.time);
}

async function publishOne(post, igUserId) {
  console.log(`${LOG_PREFIX} publishing ${post.time} ${post.label}`);
  console.log(`${LOG_PREFIX} image ${post.image}`);
  const instagramId = await postInstagram(post, igUserId);
  console.log(`${LOG_PREFIX} Instagram post ID: ${instagramId}`);
}

async function main() {
  requireConfig();
  if (catchUpArg && (!Number.isFinite(CATCH_UP_INTERVAL_MINUTES) || CATCH_UP_INTERVAL_MINUTES < 10)) {
    throw new Error('--catch-up interval must be at least 10 minutes');
  }
  const { id: igUserId, pageName } = await getInstagramUserId();
  if (VALIDATE_ONLY) {
    console.log(`${LOG_PREFIX} validation OK. Page ${pageName}; linked IG user: ${igUserId}`);
    return;
  }
  if (ONLY_INDEX !== null) {
    if (!Number.isInteger(ONLY_INDEX) || ONLY_INDEX < 0 || ONLY_INDEX >= posts.length) {
      throw new Error(`--only must be an index from 0 to ${posts.length - 1}`);
    }
    await publishOne(posts[ONLY_INDEX], igUserId);
    console.log(`${LOG_PREFIX} single-post test completed: ${posts[ONLY_INDEX].label}`);
    return;
  }
  if (!Number.isInteger(START_INDEX) || START_INDEX < 0 || START_INDEX >= posts.length) {
    throw new Error(`--start-index must be an index from 0 to ${posts.length - 1}`);
  }
  const mode = CATCH_UP_INTERVAL_MINUTES > 0
    ? `catch-up every ${CATCH_UP_INTERVAL_MINUTES} minutes`
    : 'fixed schedule';
  console.log(`${LOG_PREFIX} scheduler active. Posts: ${posts.length}. IG user: ${igUserId}. Mode: ${mode}`);

  let scheduled = 0;
  for (const [index, post] of posts.entries()) {
    if (index < START_INDEX) continue;
    const publishAt = dueAt(post, index);
    const delay = publishAt.getTime() - Date.now();
    if (delay <= -10 * 60 * 1000) {
      console.log(`${LOG_PREFIX} skipping old slot ${post.time} ${post.label}`);
      continue;
    }
    const waitMs = Math.max(0, delay);
    scheduled += 1;
    console.log(`${LOG_PREFIX} scheduled ${post.label} for ${publishAt.toISOString()} (in ${Math.round(waitMs / 60000)} min)`);
    setTimeout(() => {
      publishOne(post, igUserId).catch((error) => {
        console.error(`${LOG_PREFIX} publish FAILED ${post.time} ${post.label}: ${error.message}`);
      });
    }, waitMs);
  }

  if (!scheduled) {
    console.log(`${LOG_PREFIX} no remaining posts to schedule`);
    return;
  }

  const finalDelay = dueAt(posts[posts.length - 1], posts.length - 1).getTime() - Date.now() + 15 * 60 * 1000;
  setTimeout(() => {
    console.log(`${LOG_PREFIX} scheduler finished window`);
    process.exit(0);
  }, Math.max(60_000, finalDelay));
}

main().catch((error) => {
  console.error(`${LOG_PREFIX} scheduler failed: ${error.message}`);
  process.exit(1);
});
