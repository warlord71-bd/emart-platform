#!/usr/bin/env node
/*
 * Polls the Facebook buying-link comment queue created by meta_schedule.js.
 * Dry-run by default; add --publish to post comments to Facebook.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { axios, envPath } = require('./meta_runtime');

const API_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0';
const BASE = `https://graph.facebook.com/${API_VERSION}`;
const TOKEN = process.env.META_PAGE_ACCESS_TOKEN || process.env.PAGE_ACCESS_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET || process.env.APP_SECRET;

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function appSecretProof(token) {
  return APP_SECRET ? crypto.createHmac('sha256', APP_SECRET).update(token).digest('hex') : undefined;
}

async function graphPost(endpoint, params) {
  const proof = appSecretProof(TOKEN);
  const body = new URLSearchParams({
    ...params,
    access_token: TOKEN,
    ...(proof ? { appsecret_proof: proof } : {}),
  });
  const response = await axios.post(`${BASE}${endpoint}`, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 60000,
  });
  return response.data;
}

function readQueue(queuePath) {
  try {
    return JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  } catch {
    return { version: 1, items: [] };
  }
}

function writeQueue(queuePath, queue) {
  fs.mkdirSync(path.dirname(queuePath), { recursive: true });
  fs.writeFileSync(queuePath, `${JSON.stringify(queue, null, 2)}\n`);
}

function metaError(error) {
  if (error.response) return `Meta API ${error.response.status}: ${JSON.stringify(error.response.data)}`;
  if (error.request) return `Meta API request failed without response: ${error.message}`;
  return error.message;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function processQueue(queuePath, live) {
  const queue = readQueue(queuePath);
  let changed = false;
  for (const item of queue.items || []) {
    if (!item.facebookId || item.status === 'posted' || item.status === 'failed') continue;
    if ((item.attempts || 0) >= 5) {
      item.status = 'failed';
      item.updatedAt = new Date().toISOString();
      changed = true;
      continue;
    }
    try {
      if (!live) {
        console.log(`[meta-comment] dry-run ${item.facebookId}: ${item.comment}`);
        continue;
      }
      const result = await graphPost(`/${item.facebookId}/comments`, { message: item.comment });
      item.status = 'posted';
      item.commentId = result.id;
      item.updatedAt = new Date().toISOString();
      changed = true;
      console.log(JSON.stringify({ facebookId: item.facebookId, commentId: result.id }));
    } catch (error) {
      item.attempts = (item.attempts || 0) + 1;
      item.last_error = metaError(error);
      item.updatedAt = new Date().toISOString();
      changed = true;
      console.error(`[meta-comment] ${item.facebookId}: ${item.last_error}`);
    }
  }
  if (changed) writeQueue(queuePath, queue);
}

async function main() {
  if (!envPath) throw new Error('apps/web/.env.local not found');
  if (!TOKEN) throw new Error('Missing META_PAGE_ACCESS_TOKEN / PAGE_ACCESS_TOKEN');
  const queuePath = path.resolve(arg('queue', `workspace/audit/active/meta-comment-queue-${new Date().toISOString().slice(0, 10)}.json`));
  const intervalMs = Number(arg('interval-ms', '30000'));
  const until = new Date(arg('until', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())).getTime();
  const live = process.argv.includes('--publish');
  while (Date.now() <= until) {
    await processQueue(queuePath, live);
    await sleep(intervalMs);
  }
  await processQueue(queuePath, live);
}

main().catch((error) => { console.error(error.message); process.exit(1); });
