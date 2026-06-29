#!/usr/bin/env node
/*
 * Single Meta publisher for Facebook/Instagram images and reels.
 * Queue/job JSON is preferred via --job; direct URLs remain available for operators.
 * Dry-run by default. Nothing is sent unless --publish is present.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { axios, envPath } = require('./meta_runtime');

const API_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0';
const BASE = `https://graph.facebook.com/${API_VERSION}`;
const PAGE_ID = process.env.META_PAGE_ID || process.env.PAGE_ID;
const TOKEN = process.env.META_PAGE_ACCESS_TOKEN || process.env.PAGE_ACCESS_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET || process.env.APP_SECRET;
const CONFIGURED_IG_ID = process.env.META_IG_USER_ID;

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function appSecretProof(token) {
  return APP_SECRET ? crypto.createHmac('sha256', APP_SECRET).update(token).digest('hex') : undefined;
}

function auth(token = TOKEN) {
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

async function graphPost(endpoint, params) {
  try {
    const response = await axios.post(`${BASE}${endpoint}`,
      new URLSearchParams({ ...params, ...auth() }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 120000 });
    return response.data;
  } catch (error) {
    throw new Error(metaError(error));
  }
}

async function graphGet(endpoint, params) {
  try {
    return (await axios.get(`${BASE}${endpoint}`, {
      params: { ...params, ...auth() }, timeout: 60000,
    })).data;
  } catch (error) {
    throw new Error(metaError(error));
  }
}

async function instagramUserId() {
  if (CONFIGURED_IG_ID) return CONFIGURED_IG_ID;
  const page = await graphGet(`/${PAGE_ID}`, { fields: 'instagram_business_account' });
  const id = page.instagram_business_account && page.instagram_business_account.id;
  if (!id) throw new Error(`No Instagram Business account linked to Page ${PAGE_ID}`);
  return id;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function publishFacebookImage(mediaUrl, caption) {
  const result = await graphPost(`/${PAGE_ID}/photos`, {
    url: mediaUrl, caption, published: 'true',
  });
  return result.post_id || result.id;
}

async function publishInstagramImage(mediaUrl, caption) {
  const id = await instagramUserId();
  const container = await graphPost(`/${id}/media`, { image_url: mediaUrl, caption });
  if (!container.id) throw new Error(`No Instagram image container id: ${JSON.stringify(container)}`);
  return (await graphPost(`/${id}/media_publish`, { creation_id: container.id })).id;
}

async function publishFacebookReel(mediaUrl, caption) {
  return (await graphPost(`/${PAGE_ID}/videos`, { file_url: mediaUrl, description: caption })).id;
}

async function publishInstagramReel(mediaUrl, caption) {
  const id = await instagramUserId();
  const container = await graphPost(`/${id}/media`, {
    media_type: 'REELS', video_url: mediaUrl, caption, share_to_feed: 'true',
  });
  if (!container.id) throw new Error(`No Instagram reel container id: ${JSON.stringify(container)}`);
  let finished = false;
  for (let i = 0; i < 30; i += 1) {
    await sleep(5000);
    const status = await graphGet(`/${container.id}`, { fields: 'status_code,status' });
    if (status.status_code === 'FINISHED') { finished = true; break; }
    if (status.status_code === 'ERROR') throw new Error(`Instagram processing error: ${JSON.stringify(status)}`);
  }
  if (!finished) throw new Error(`Instagram processing timed out for container ${container.id}`);
  return (await graphPost(`/${id}/media_publish`, { creation_id: container.id })).id;
}

function readJob(jobPath) {
  if (!jobPath) return {};
  const resolved = path.resolve(jobPath);
  const job = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  const platforms = Array.isArray(job.platforms) ? job.platforms : [];
  const mediaUrl = job.stages?.store?.url || job.media_url || job.video_url || job.image_url || job.image;
  const mediaType = job.media_type || (job.stages?.reel || /\.mp4(?:\?|$)/i.test(mediaUrl || '') ? 'reel' : 'image');
  return {
    source: resolved,
    mediaUrl,
    mediaType,
    caption: job.caption || job.headline || '',
    platform: platforms.includes('facebook') && platforms.includes('instagram')
      ? 'both' : (platforms[0] || undefined),
  };
}

function resolveRequest() {
  const job = readJob(arg('job'));
  const videoUrl = arg('video-url');
  const imageUrl = arg('image-url');
  const mediaUrl = arg('media-url', videoUrl || imageUrl || job.mediaUrl);
  const mediaType = arg('media-type', videoUrl ? 'reel' : (imageUrl ? 'image' : job.mediaType || 'image'));
  return {
    source: job.source || 'direct-cli',
    mediaUrl,
    mediaType,
    caption: arg('caption', job.caption || ''),
    platform: arg('platform', job.platform || 'both'),
    publish: process.argv.includes('--publish'),
  };
}

function validate(request) {
  if (!envPath) throw new Error('apps/web/.env.local not found');
  if (!TOKEN || !PAGE_ID) throw new Error('Missing META_PAGE_ACCESS_TOKEN / META_PAGE_ID');
  if (!['image', 'reel'].includes(request.mediaType)) throw new Error('--media-type must be image or reel');
  if (!['facebook', 'instagram', 'both'].includes(request.platform)) {
    throw new Error('--platform must be facebook, instagram, or both');
  }
  if (!request.mediaUrl || !/^https:\/\//i.test(request.mediaUrl)) {
    throw new Error('A public HTTPS media URL is required');
  }
}

async function publish(request) {
  const output = {};
  if (request.platform === 'facebook' || request.platform === 'both') {
    output.facebook = request.mediaType === 'reel'
      ? await publishFacebookReel(request.mediaUrl, request.caption)
      : await publishFacebookImage(request.mediaUrl, request.caption);
  }
  if (request.platform === 'instagram' || request.platform === 'both') {
    output.instagram = request.mediaType === 'reel'
      ? await publishInstagramReel(request.mediaUrl, request.caption)
      : await publishInstagramImage(request.mediaUrl, request.caption);
  }
  return output;
}

async function cli() {
  const request = resolveRequest();
  validate(request);
  if (process.argv.includes('--validate-only')) {
    console.log(JSON.stringify({ valid: true, source: request.source, mediaType: request.mediaType,
      platform: request.platform, env: path.basename(envPath) }, null, 2));
    return;
  }
  if (!request.publish) {
    console.log(JSON.stringify({ dryRun: true, source: request.source, mediaType: request.mediaType,
      platform: request.platform, mediaUrl: request.mediaUrl, captionLength: request.caption.length }, null, 2));
    return;
  }
  console.log(JSON.stringify(await publish(request), null, 2));
}

if (require.main === module) cli().catch((error) => { console.error(error.message); process.exit(1); });

module.exports = { cli, publish, resolveRequest, validate };
