#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ENV_PATHS = [
  path.resolve(__dirname, '../../..', 'apps/web/.env.local'),
  '/var/www/emart-platform/apps/web/.env.local',
];
for (const p of ENV_PATHS) {
  try {
    require('/opt/fb-poster/node_modules/dotenv').config({ path: p });
    break;
  } catch {}
}

const axios = require('/opt/fb-poster/node_modules/axios');

const API_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || process.env.PAGE_ACCESS_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET || process.env.APP_SECRET;
const LOG_PREFIX = '[emart-fb-comment-20260624]';
const COMMENT_QUEUE_PATH = process.env.META_COMMENT_QUEUE_PATH ||
  path.resolve(__dirname, '../../audit/active/meta-comment-queue-20260624.json');
const ONCE = process.argv.includes('--once');
const STOP_WHEN_DONE = process.argv.includes('--stop-when-done');
const intervalArg = process.argv.find((arg) => arg.startsWith('--interval='));
const INTERVAL_MS = Math.max(60_000, Number(intervalArg ? intervalArg.split('=')[1] : 180_000));
const MAX_ATTEMPTS = 48;

function requireConfig() {
  if (!PAGE_ACCESS_TOKEN) throw new Error('Missing PAGE_ACCESS_TOKEN/META_PAGE_ACCESS_TOKEN');
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

function readQueue() {
  try {
    return JSON.parse(fs.readFileSync(COMMENT_QUEUE_PATH, 'utf8'));
  } catch {
    return { version: 1, items: [] };
  }
}

function writeQueue(queue) {
  fs.mkdirSync(path.dirname(COMMENT_QUEUE_PATH), { recursive: true });
  fs.writeFileSync(COMMENT_QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n');
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

function retryDue(item) {
  if (item.status === 'done' || item.status === 'blocked') return false;
  if ((item.attempts || 0) >= MAX_ATTEMPTS) return false;
  if (!item.lastAttemptAt) return true;
  const minutes = Math.min(60, Math.max(3, (item.attempts || 1) * 3));
  return Date.now() - new Date(item.lastAttemptAt).getTime() >= minutes * 60 * 1000;
}

async function processQueue() {
  const queue = readQueue();
  if (!queue.items.length) {
    console.log(`${LOG_PREFIX} queue empty`);
    return 0;
  }

  let remaining = 0;
  for (const item of queue.items) {
    if (item.status !== 'done' && item.status !== 'blocked') remaining += 1;
    if (!retryDue(item)) continue;

    item.status = 'posting';
    item.attempts = (item.attempts || 0) + 1;
    item.lastAttemptAt = new Date().toISOString();
    item.updatedAt = item.lastAttemptAt;
    writeQueue(queue);

    try {
      const result = await graphPost(`/${item.facebookId}/comments`, { message: item.comment });
      item.status = 'done';
      item.commentId = result.id || null;
      item.lastError = null;
      item.updatedAt = new Date().toISOString();
      console.log(`${LOG_PREFIX} comment OK ${item.facebookId} -> ${item.commentId || 'ok'}`);
    } catch (error) {
      item.status = 'pending';
      item.lastError = error.message;
      item.updatedAt = new Date().toISOString();
      if (/pages_manage_engagement|permission|Permissions error|OAuthException/i.test(error.message)) {
        item.status = 'blocked';
        console.error(`${LOG_PREFIX} comment BLOCKED ${item.facebookId}: ${error.message}`);
      } else {
        console.error(`${LOG_PREFIX} comment failed ${item.facebookId}: ${error.message}`);
      }
    }
    writeQueue(queue);
  }

  return queue.items.filter((item) => item.status !== 'done' && item.status !== 'blocked').length;
}

async function main() {
  requireConfig();
  const remaining = await processQueue();
  if (ONCE || (STOP_WHEN_DONE && remaining === 0)) return;
  setInterval(() => {
    processQueue().catch((error) => console.error(`${LOG_PREFIX} worker cycle failed: ${error.message}`));
  }, INTERVAL_MS);
}

main().catch((error) => {
  console.error(`${LOG_PREFIX} worker failed: ${error.message}`);
  process.exit(1);
});
