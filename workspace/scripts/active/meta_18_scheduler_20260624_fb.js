#!/usr/bin/env node

const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { axios } = require('./meta_runtime');

const API_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const PAGE_ID = process.env.META_PAGE_ID || process.env.PAGE_ID;
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || process.env.PAGE_ACCESS_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET || process.env.APP_SECRET;
const LOG_PREFIX = '[emart-fb-18-20260624]';
const COMMENT_QUEUE_PATH = process.env.META_COMMENT_QUEUE_PATH ||
  path.resolve(__dirname, '../../audit/active/meta-comment-queue-20260624.json');
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
    label: 'Pipeline 01 COSRX Acne Pimple Master Patch',
    image: `${assetBase}/01-cosrx-acne-pimple-master-patch-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/cosrx-acne-pimple-master-patch-24-patch',
    caption: `Tiny patch, big rescue energy.\n\nSudden breakout before office, class, or an outing? Keep COSRX Acne Pimple Master Patch in your routine drawer and thank yourself later.\n\nWould you keep this in your emergency skincare kit?\n\nBuy link in first comment.\n\n#COSRXBangladesh #AcnePatch #KBeautyBD #SkincareBangladesh #EmartSkincare`,
  },
  {
    time: '2026-06-24T09:49:00+06:00',
    label: 'Codex 01 Innisfree Super Volcanic Clay Mask',
    image: `${assetBase}/02-innisfree-super-volcanic-clay-mask-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/innisfree-super-volcanic-pore-clay-mask-100ml',
    caption: `Pore-care night, but make it K-beauty.\n\nInnisfree Super Volcanic Pore Clay Mask 2X is the kind of wash-off mask people save for that “skin feels heavy today” moment.\n\nMask night tonight, or weekend self-care?\n\nBuy link in first comment.\n\n#InnisfreeBangladesh #ClayMask #PoreCare #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T10:39:00+06:00',
    label: 'Pipeline 02 3W Clinic Intensive UV Sunblock',
    image: `${assetBase}/03-3w-clinic-intensive-uv-sunblock-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/3w-clinic-intensive-uv-sunblock-cream-spf50-pa-70ml',
    caption: `SPF ta daily habit, not occasional luxury.\n\n3W Clinic Intensive UV Sunblock Cream SPF50 PA+++ is an easy Korean sunscreen pick for Bangladesh heat, commute, and daylight routines.\n\nSave this if you keep forgetting sunscreen.\n\nBuy link in first comment.\n\n#SunscreenBangladesh #3WClinic #KBeautyBD #SPFRoutine #EmartSkincare`,
  },
  {
    time: '2026-06-24T11:28:00+06:00',
    label: 'Codex 02 Dr Althea 345NA Relief Cream',
    image: `${assetBase}/04-dr-althea-345na-relief-cream-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/dr-althea-345na-relief-cream-50ml',
    caption: `Some days your skin just wants peace.\n\nDr. Althea 345NA Relief Cream brings that calm, clean K-beauty cream vibe for a softer-feeling moisture step.\n\nWho needs a “skin reset” product like this?\n\nBuy link in first comment.\n\n#DrAltheaBangladesh #ReliefCream #KBeautyBD #BarrierCare #EmartSkincare`,
  },
  {
    time: '2026-06-24T12:18:00+06:00',
    label: 'Pipeline 03 Welcos Confume Argan Shampoo',
    image: `${assetBase}/05-welcos-confume-argan-hair-shampoo-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/confume-argan-hair-shampoo-750-ml',
    caption: `Hair-care deserves K-beauty energy too.\n\nWelcos Confume Argan Hair Shampoo is a big-bottle Korean hair-care pick for smoother, fresher wash days.\n\nTeam skincare only, or hair-care also?\n\nBuy link in first comment.\n\n#KoreanHairCare #ConfumeBangladesh #HairShampoo #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T13:07:00+06:00',
    label: 'Codex 03 COSRX Aloe Soothing Sun Cream',
    image: `${assetBase}/06-cosrx-aloe-soothing-sun-cream-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/cosrx-aloe-soothing-spf50-pa-sun-cream-50ml',
    caption: `Aloe + SPF is always a good idea.\n\nCOSRX Aloe Soothing Sun Cream SPF50 PA+++ is for people who want sunscreen that feels like part of skincare, not a punishment.\n\nWould you wear this every morning?\n\nBuy link in first comment.\n\n#COSRXBangladesh #AloeSunscreen #SunscreenBangladesh #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T13:56:00+06:00',
    label: 'Pipeline 04 Missha Airy Fit Sheet Mask Rice',
    image: `${assetBase}/07-missha-airy-fit-sheet-mask-rice-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/missha-airy-fit-sheet-mask-rice',
    caption: `One sheet mask, ten minutes, softer mood.\n\nMissha Airy Fit Sheet Mask Rice is an easy little K-beauty treat for nights when you want the routine to feel special without doing too much.\n\nTag someone who loves sheet masks.\n\nBuy link in first comment.\n\n#MisshaBangladesh #SheetMask #RiceMask #KBeautyBangladesh #EmartSkincare`,
  },
  {
    time: '2026-06-24T14:46:00+06:00',
    label: 'Codex 04 Dr Althea Vitamin C Boosting Serum',
    image: `${assetBase}/08-dr-althea-vitamin-c-boosting-serum-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/dr-althea-vitamin-c-boosting-serum-30ml',
    caption: `Glow routine people, this one is pretty.\n\nDr. Althea Vitamin C Boosting Serum has that bright, premium K-beauty shelf look and fits a simple glow-focused routine.\n\nVitamin C fan, or still thinking?\n\nBuy link in first comment.\n\n#DrAltheaBangladesh #VitaminCSerum #GlowRoutine #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T15:35:00+06:00',
    label: 'Pipeline 05 COSRX Pure Fit Cica Serum',
    image: `${assetBase}/09-cosrx-pure-fit-cica-serum-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/cosrx-pure-fit-cica-serum-30ml',
    caption: `Cica serum has a loyal fan club for a reason.\n\nCOSRX Pure Fit Cica Serum is a simple Korean serum step for routines that want a calmer, softer-feeling finish.\n\nWould you add cica to your routine?\n\nBuy link in first comment.\n\n#COSRXBangladesh #CicaSerum #KBeautyBD #CalmingSkincare #EmartSkincare`,
  },
  {
    time: '2026-06-24T16:25:00+06:00',
    label: 'Codex 05 Missha Aqua Sun SPF',
    image: `${assetBase}/10-missha-aqua-sun-spf-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/missha-all-around-safe-block-aqua-sun-spf50-pa-50ml',
    caption: `For people who want SPF without the heavy feeling.\n\nMissha Aqua Sun SPF50+ PA++++ is a fresh sunscreen pick for hot days, quick mornings, and “I need something light” routines.\n\nLight SPF or creamy SPF, which one are you?\n\nBuy link in first comment.\n\n#MisshaBangladesh #AquaSun #SunscreenBangladesh #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T17:14:00+06:00',
    label: 'Pipeline 06 A’pieu Raspberry Hair Vinegar',
    image: `${assetBase}/11-apieu-raspberry-hair-vinegar-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/apieu-raspberry-hair-vinegar-200ml',
    caption: `This is the fun hair-care step your shelf is missing.\n\nA’pieu Raspberry Hair Vinegar brings a fresh Korean routine twist for smoother-feeling, shinier-looking hair days.\n\nWould you try hair vinegar?\n\nBuy link in first comment.\n\n#ApieuBangladesh #KoreanHairCare #HairVinegar #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T18:04:00+06:00',
    label: 'Codex 06 iUNIK Centella Calming Gel Cream',
    image: `${assetBase}/12-iunik-centella-calming-gel-cream-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/iunik-centella-calming-gel-cream-60ml',
    caption: `Gel cream lovers, this is your lane.\n\niUNIK Centella Calming Gel Cream is lightweight, clean, and easy to fit into a Bangladesh-friendly routine.\n\nWould you use this morning, night, or both?\n\nBuy link in first comment.\n\n#iUNIKBangladesh #CentellaCream #KBeautyBangladesh #CalmingSkincare #EmartSkincare`,
  },
  {
    time: '2026-06-24T18:53:00+06:00',
    label: 'Pipeline 07 Mise En Scene Perfect Hair Serum',
    image: `${assetBase}/13-mise-en-scene-perfect-hair-serum-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/mise-en-scene-perfect-hair-serum-70ml',
    caption: `K-beauty, but for hair.\n\nMise-En-Scene Perfect Hair Serum is one of those Korean hair-care picks people remember after one smooth-hair day.\n\nFrizz control or shine, what do you need more?\n\nBuy link in first comment.\n\n#MiseEnScene #KoreanHairCare #HairSerumBangladesh #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T19:42:00+06:00',
    label: 'Codex 07 PURITO Pure Vitamin C Serum',
    image: `${assetBase}/14-purito-pure-vitamin-c-serum-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/purito-pure-vitamin-c-serum-60ml',
    caption: `A clean little glow step from PURITO.\n\nPure Vitamin C Serum is for skincare people who like ingredient-led routines without making the shelf feel complicated.\n\nWould this be your morning serum?\n\nBuy link in first comment.\n\n#PuritoBangladesh #VitaminCSerum #KBeautyBD #GlowSkincare #EmartSkincare`,
  },
  {
    time: '2026-06-24T20:32:00+06:00',
    label: 'Pipeline 08 Tiam Anti-Blemish Body Lotion',
    image: `${assetBase}/15-tiam-anti-blemish-body-lotion-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/tiam-anti-blemish-body-lotion-200ml',
    caption: `Skincare does not stop at the face.\n\nTiam Anti-Blemish Body Lotion is a Korean body-care pick for anyone trying to make body skincare feel like an actual routine.\n\nBody-care routine ache, or not yet?\n\nBuy link in first comment.\n\n#TiamBangladesh #BodyCare #KBeautyBD #BlemishRoutine #EmartSkincare`,
  },
  {
    time: '2026-06-24T21:21:00+06:00',
    label: 'Codex 08 COXIR Ultra Hyaluronic Cleansing Oil',
    image: `${assetBase}/16-coxir-ultra-hyaluronic-cleansing-oil-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/coxir-ultra-hyaluronic-cleansing-oil-150ml',
    caption: `If you wear sunscreen, double cleansing starts making sense.\n\nCOXIR Ultra Hyaluronic Cleansing Oil is a Korean first-cleanse pick for soft, clean-feeling evenings.\n\nAre you already double cleansing?\n\nBuy link in first comment.\n\n#CoxirBangladesh #CleansingOil #DoubleCleansing #KBeautyBD #EmartSkincare`,
  },
  {
    time: '2026-06-24T22:11:00+06:00',
    label: 'Pipeline 09 COSRX AC Collection Acne Patch',
    image: `${assetBase}/17-cosrx-ac-collection-acne-patch-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/cosrx-ac-collection-acne-patch-26-patches',
    caption: `Patch people know the comfort of having backups.\n\nCOSRX AC Collection Acne Patch is a handy Korean spot-care option to keep around for surprise breakout days.\n\nKeep one pack at home, one in your bag?\n\nBuy link in first comment.\n\n#COSRXBangladesh #AcnePatch #SpotCare #KBeautyBangladesh #EmartSkincare`,
  },
  {
    time: '2026-06-24T23:00:00+06:00',
    label: 'Pipeline 10 W.SKIN LAB Triple Care Sun Cream',
    image: `${assetBase}/18-wskin-lab-triple-care-sun-cream-1x1.jpg`,
    link: 'https://e-mart.com.bd/shop/wskin-lab-triple-care-sun-cream-spf50-pa-60ml',
    caption: `Tomorrow’s SPF decision can be made tonight.\n\nW.SKIN LAB Triple Care Sun Cream SPF50+ PA++++ is a Korean sunscreen pick for everyday protection routines in Bangladesh weather.\n\nSave this for your next sunscreen restock.\n\nBuy link in first comment.\n\n#WSKINLAB #SunscreenBangladesh #KBeautyBD #SPF50 #EmartSkincare`,
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

async function validatePageToken() {
  const page = await graphGet('/me', { fields: 'id,name' });
  if (String(page.id) !== String(PAGE_ID)) {
    throw new Error(
      `PAGE_ACCESS_TOKEN is not a Page token for PAGE_ID ${PAGE_ID}. ` +
      `It resolves to ${page.id || 'unknown'} (${page.name || 'unknown'}).`,
    );
  }
  return page;
}

async function postFacebook(post) {
  const result = await graphPost(`/${PAGE_ID}/photos`, {
    url: post.image,
    caption: post.caption,
    published: 'true',
  });
  return result.post_id || result.id;
}

function readCommentQueue() {
  try {
    return JSON.parse(fs.readFileSync(COMMENT_QUEUE_PATH, 'utf8'));
  } catch {
    return { version: 1, items: [] };
  }
}

function writeCommentQueue(queue) {
  fs.mkdirSync(path.dirname(COMMENT_QUEUE_PATH), { recursive: true });
  fs.writeFileSync(COMMENT_QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n');
}

function enqueueComment(post, facebookId) {
  const queue = readCommentQueue();
  const comment = `Buy now from here: ${post.link}`;
  const existing = queue.items.find((item) => item.facebookId === facebookId);
  if (existing) {
    existing.comment = comment;
    existing.link = post.link;
    existing.label = post.label;
  } else {
    queue.items.push({
      facebookId,
      label: post.label,
      link: post.link,
      comment,
      status: 'pending',
      attempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  writeCommentQueue(queue);
  console.log(`${LOG_PREFIX} queued first-comment buying link for ${facebookId}`);
}

function dueAt(post, index) {
  if (CATCH_UP_INTERVAL_MINUTES > 0) {
    const minutes = CATCH_UP_START_DELAY_MINUTES + (index * CATCH_UP_INTERVAL_MINUTES);
    return new Date(RUN_STARTED_AT + minutes * 60 * 1000);
  }
  return new Date(post.time);
}

async function publishOne(post) {
  console.log(`${LOG_PREFIX} publishing ${post.time} ${post.label}`);
  console.log(`${LOG_PREFIX} image ${post.image}`);
  const facebookId = await postFacebook(post);
  console.log(`${LOG_PREFIX} Facebook post ID: ${facebookId}`);
  enqueueComment(post, facebookId);
}

async function main() {
  requireConfig();
  if (catchUpArg && (!Number.isFinite(CATCH_UP_INTERVAL_MINUTES) || CATCH_UP_INTERVAL_MINUTES < 10)) {
    throw new Error('--catch-up interval must be at least 10 minutes');
  }
  const page = await validatePageToken();
  if (VALIDATE_ONLY) {
    console.log(`${LOG_PREFIX} validation OK. Page token matches ${page.name || PAGE_ID}. Facebook-only mode; buying links are queued as first comments.`);
    return;
  }
  if (ONLY_INDEX !== null) {
    if (!Number.isInteger(ONLY_INDEX) || ONLY_INDEX < 0 || ONLY_INDEX >= posts.length) {
      throw new Error(`--only must be an index from 0 to ${posts.length - 1}`);
    }
    await publishOne(posts[ONLY_INDEX]);
    console.log(`${LOG_PREFIX} single-post test completed: ${posts[ONLY_INDEX].label}`);
    return;
  }
  if (!Number.isInteger(START_INDEX) || START_INDEX < 0 || START_INDEX >= posts.length) {
    throw new Error(`--start-index must be an index from 0 to ${posts.length - 1}`);
  }
  const mode = CATCH_UP_INTERVAL_MINUTES > 0
    ? `catch-up every ${CATCH_UP_INTERVAL_MINUTES} minutes`
    : 'fixed schedule';
  console.log(`${LOG_PREFIX} scheduler active. Posts: ${posts.length}. Page: ${page.name || PAGE_ID}. Mode: ${mode}`);

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
      publishOne(post).catch((error) => {
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
