#!/usr/bin/env node
// Token setup utility — lists Pages for a User Access Token.
// Requires USER_ACCESS_TOKEN in env (not the Page token).
// Usage: USER_ACCESS_TOKEN=EAA... node meta_accounts.js

const { axios } = require('./meta_runtime');
const crypto = require('crypto');

const API_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const ACCESS_TOKEN = process.env.USER_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN || process.env.PAGE_ACCESS_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET || process.env.APP_SECRET;

function redactToken(value) {
  if (!value || typeof value !== 'string') return value;
  if (value.length <= 12) return '[redacted]';
  return `${value.slice(0, 6)}...[redacted]...${value.slice(-4)}`;
}

function appSecretProof(token) {
  if (!APP_SECRET) return undefined;
  return crypto.createHmac('sha256', APP_SECRET).update(token).digest('hex');
}

function authParams(token) {
  const params = { access_token: token };
  const proof = appSecretProof(token);
  if (proof) params.appsecret_proof = proof;
  return params;
}

async function main() {
  if (!ACCESS_TOKEN) {
    throw new Error('Missing USER_ACCESS_TOKEN or PAGE_ACCESS_TOKEN in .env');
  }

  const response = await axios.get(`${GRAPH_BASE_URL}/me/accounts`, {
    params: {
      fields: 'access_token,name',
      ...authParams(ACCESS_TOKEN),
    },
    timeout: 30000,
  });

  const data = response.data;
  if (Array.isArray(data.data)) {
    data.data = data.data.map((page) => ({
      ...page,
      access_token: redactToken(page.access_token),
    }));
  }

  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  if (error.response) {
    console.error(`Meta API ${error.response.status}: ${JSON.stringify(error.response.data, null, 2)}`);
  } else {
    console.error(error.message);
  }
  process.exit(1);
});
