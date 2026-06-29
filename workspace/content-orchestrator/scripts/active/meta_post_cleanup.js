#!/usr/bin/env node
/*
 * Inspect and optionally delete duplicate Facebook Page posts.
 * Dry-run by default. Use --delete with explicit --keep <post_id> to remove matches except keep.
 */
const crypto = require('crypto');
const { axios } = require('./meta_runtime');

const API_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0';
const BASE = `https://graph.facebook.com/${API_VERSION}`;
const PAGE_ID = process.env.META_PAGE_ID || process.env.PAGE_ID;
const TOKEN = process.env.META_PAGE_ACCESS_TOKEN || process.env.PAGE_ACCESS_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET || process.env.APP_SECRET;

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function appSecretProof(token) {
  return APP_SECRET ? crypto.createHmac('sha256', APP_SECRET).update(token).digest('hex') : undefined;
}

function auth() {
  const params = { access_token: TOKEN };
  const proof = appSecretProof(TOKEN);
  if (proof) params.appsecret_proof = proof;
  return params;
}

function metaError(error) {
  if (error.response) return `Meta API ${error.response.status}: ${JSON.stringify(error.response.data)}`;
  if (error.request) return `Meta API request failed without response: ${error.message}`;
  return error.message;
}

async function graphGet(path, params = {}) {
  try {
    return (await axios.get(`${BASE}${path}`, {
      params: { ...params, ...auth() },
      timeout: 60000,
    })).data;
  } catch (error) {
    throw new Error(metaError(error));
  }
}

async function graphDelete(path) {
  try {
    return (await axios.delete(`${BASE}${path}`, {
      params: auth(),
      timeout: 60000,
    })).data;
  } catch (error) {
    throw new Error(metaError(error));
  }
}

function includesAll(haystack, terms) {
  const text = haystack.toLowerCase();
  return terms.every((term) => text.includes(term.toLowerCase()));
}

async function main() {
  if (!PAGE_ID || !TOKEN) throw new Error('Missing META_PAGE_ID / META_PAGE_ACCESS_TOKEN');
  const terms = arg('terms', 'Neutrogena Hydro Boost').split(',').map((s) => s.trim()).filter(Boolean);
  const limit = Number(arg('limit', '100'));
  const keep = arg('keep', '');
  const shouldDelete = hasFlag('delete');
  const fields = [
    'id',
    'message',
    'created_time',
    'permalink_url',
    'full_picture',
    'attachments{media,url,target,type,title,description}',
  ].join(',');

  const feed = await graphGet(`/${PAGE_ID}/posts`, { fields, limit });
  const matches = (feed.data || []).filter((post) => {
    const attachmentText = JSON.stringify(post.attachments || {});
    return includesAll(`${post.message || ''} ${post.full_picture || ''} ${attachmentText}`, terms);
  });

  const deleted = [];
  if (shouldDelete) {
    if (!keep) throw new Error('--delete requires --keep <post_id>');
    for (const post of matches) {
      if (post.id === keep) continue;
      const result = await graphDelete(`/${post.id}`);
      deleted.push({ id: post.id, result });
    }
  }

  console.log(JSON.stringify({
    dryRun: !shouldDelete,
    terms,
    count: matches.length,
    keep: keep || null,
    matches: matches.map((post) => ({
      id: post.id,
      created_time: post.created_time,
      message: post.message,
      full_picture: post.full_picture,
      permalink_url: post.permalink_url,
    })),
    deleted,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
