#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const API_VERSION = 'v19.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

const PAGE_ID = process.env.PAGE_ID;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const APP_SECRET = process.env.APP_SECRET;

function requireConfig() {
  const missing = [];
  if (!PAGE_ID) missing.push('PAGE_ID');
  if (!PAGE_ACCESS_TOKEN) missing.push('PAGE_ACCESS_TOKEN');

  if (missing.length) {
    throw new Error(`Missing required .env value(s): ${missing.join(', ')}`);
  }
}

function metaError(error) {
  if (error.response) {
    const body = JSON.stringify(error.response.data, null, 2);
    return `Meta API ${error.response.status}: ${body}`;
  }
  if (error.request) {
    return `Meta API request failed without response: ${error.message}`;
  }
  return error.message;
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

async function graphGet(path, params = {}) {
  try {
    const response = await axios.get(`${GRAPH_BASE_URL}${path}`, {
      params: {
        ...params,
        ...authParams(),
      },
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    throw new Error(metaError(error));
  }
}

async function graphPost(path, params = {}) {
  try {
    const response = await axios.post(
      `${GRAPH_BASE_URL}${path}`,
      new URLSearchParams({
        ...params,
        ...authParams(),
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 60000,
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(metaError(error));
  }
}

async function getInstagramUserId() {
  const page = await graphGet(`/${PAGE_ID}`, {
    fields: 'instagram_business_account',
  });

  const igUserId = page.instagram_business_account && page.instagram_business_account.id;
  if (!igUserId) {
    throw new Error(
      `No linked Instagram Business account found for Page ${PAGE_ID}. Connect Instagram to the Facebook Page first.`
    );
  }

  return igUserId;
}

async function postToFacebook(message, imageUrl) {
  if (imageUrl) {
    if (!/^https:\/\//i.test(imageUrl)) {
      throw new Error('Facebook image posting requires a public HTTPS image URL.');
    }

    const result = await graphPost(`/${PAGE_ID}/photos`, {
      url: imageUrl,
      caption: message,
      published: 'true',
    });
    return result.post_id || result.id;
  }

  const result = await graphPost(`/${PAGE_ID}/feed`, { message });
  return result.id;
}

async function postToInstagram(message, imageUrl) {
  if (!imageUrl || !/^https:\/\//i.test(imageUrl)) {
    throw new Error('Instagram posting requires a public HTTPS image URL.');
  }

  const igUserId = await getInstagramUserId();
  const container = await graphPost(`/${igUserId}/media`, {
    image_url: imageUrl,
    caption: message,
  });

  if (!container.id) {
    throw new Error(`Instagram media container did not return an id: ${JSON.stringify(container)}`);
  }

  const published = await graphPost(`/${igUserId}/media_publish`, {
    creation_id: container.id,
  });

  return published.id;
}

async function postBoth(message, imageUrl) {
  const facebookPostId = await postToFacebook(message, imageUrl);
  console.log(`Facebook post ID: ${facebookPostId}`);

  const instagramPostId = await postToInstagram(message, imageUrl);
  console.log(`Instagram post ID: ${instagramPostId}`);

  return { facebookPostId, instagramPostId };
}

async function main() {
  requireConfig();

  const [, , message, imageUrl] = process.argv;
  if (!message || !imageUrl) {
    console.error("Usage: node post.js 'caption' 'https://image.jpg'");
    process.exitCode = 2;
    return;
  }

  const result = await postBoth(message, imageUrl);
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  getInstagramUserId,
  postToFacebook,
  postToInstagram,
  postBoth,
};
