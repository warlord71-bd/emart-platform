#!/usr/bin/env node
/* Queue-driven campaign adapter. Reads Social Engine campaign-plan.json directly. */
const fs = require('fs');
const path = require('path');
const { publish, validate } = require('./meta_publish');

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function appendJsonl(filePath, row) {
  if (!filePath) return;
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.appendFileSync(resolved, `${JSON.stringify(row)}\n`);
}

function publishedKeys(filePath) {
  const keys = new Set();
  if (!filePath) return keys;
  const resolved = path.resolve(filePath);
  let content = '';
  try { content = fs.readFileSync(resolved, 'utf8'); } catch { return keys; }
  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row.campaign_id && row.platform && row.item_index) {
        keys.add(`${row.campaign_id}:${row.platform}:${row.item_index}`);
      }
    } catch {}
  }
  return keys;
}

function queueBuyingLink(plan, item, facebookId) {
  const link = item.platform_posts?.facebook?.link || item.link;
  if (!link || !facebookId) return;
  const queuePath = path.resolve(arg('comment-queue',
    `workspace/audit/active/meta-comment-queue-${plan.date}.json`));
  let queue = { version: 1, items: [] };
  try { queue = JSON.parse(fs.readFileSync(queuePath, 'utf8')); } catch {}
  if (!queue.items.some((entry) => entry.facebookId === facebookId)) {
    queue.items.push({
      facebookId,
      label: `FB ${String(item.index).padStart(2, '0')} ${item.title}`,
      link,
      comment: `Buy now from here: ${link}`,
      status: 'pending', attempts: 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    fs.mkdirSync(path.dirname(queuePath), { recursive: true });
    fs.writeFileSync(queuePath, `${JSON.stringify(queue, null, 2)}\n`);
  }
}

function captionLinkPolicy(plan, item, platform) {
  const itemPolicy = item.caption_link_policy;
  if (itemPolicy && typeof itemPolicy === 'object' && itemPolicy[platform]) return itemPolicy[platform];
  if (typeof itemPolicy === 'string') return itemPolicy;
  const planPolicy = plan.caption_link_policy;
  if (planPolicy && typeof planPolicy === 'object' && planPolicy[platform]) return planPolicy[platform];
  if (typeof planPolicy === 'string') return planPolicy;
  return '';
}

function recordPublishedHistory(plan) {
  const historyArg = arg('record-history');
  if (!historyArg) return;
  const historyPath = path.resolve(historyArg);
  let history = { campaigns: [] };
  try { history = JSON.parse(fs.readFileSync(historyPath, 'utf8')); } catch {}
  const campaignId = plan.id || plan.name || plan.date;
  history.campaigns = (history.campaigns || []).filter((entry) => (
    entry.id !== campaignId && !(entry.date === plan.date && entry.name === plan.name)
  ));
  history.campaigns.push({
    id: campaignId,
    date: plan.date,
    name: plan.name,
    items: (plan.items || []).map((item) => ({
      product_id: item.product_id,
      slug: item.slug,
    })),
  });
  fs.mkdirSync(path.dirname(historyPath), { recursive: true });
  fs.writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`);
  console.log(`[meta-schedule] recorded published product history: ${historyPath}`);
}

function requests(plan, platform) {
  return plan.items.flatMap((item) => {
    const post = item.platform_posts?.[platform];
    if (!post) return [];
    return [{ item, request: {
      source: `${plan.id}:${item.index}:${platform}`,
      mediaUrl: post.image_url,
      mediaType: 'image',
      caption: post.caption,
      platform,
      publish: true,
    }}];
  });
}

function assertLiveGate(plan) {
  if (plan.qa_status && plan.qa_status !== 'pass') {
    throw new Error(`Campaign QA is not pass: ${plan.qa_status}`);
  }
  if (plan.publish_gate && plan.publish_gate !== 'approved_for_scheduled_run') {
    throw new Error(`Campaign publish gate is not approved_for_scheduled_run: ${plan.publish_gate}`);
  }
  if (plan.approval_status !== 'approved_for_scheduled_run') {
    throw new Error(`Campaign is not approved_for_scheduled_run: ${plan.approval_status || 'missing'}`);
  }
}

async function main() {
  const planPath = arg('plan');
  const platform = arg('platform');
  const live = process.argv.includes('--publish');
  if (!planPath || !platform) throw new Error('--plan and --platform are required');
  if (!['facebook', 'instagram'].includes(platform)) throw new Error('--platform must be facebook or instagram');
  const plan = JSON.parse(fs.readFileSync(path.resolve(planPath), 'utf8'));
  const jobs = requests(plan, platform);
  for (const { request } of jobs) validate(request);
  if (!live) {
    console.log(JSON.stringify({ dryRun: true, source: path.resolve(planPath), campaign: plan.id,
      approvalStatus: plan.approval_status, platform, posts: jobs.length }, null, 2));
    return;
  }
  assertLiveGate(plan);
  const resultLedger = arg('result-ledger');
  const alreadyPublished = publishedKeys(resultLedger);
  for (const { item, request } of jobs) {
    const idempotencyKey = `${plan.id}:${platform}:${item.index}`;
    if (alreadyPublished.has(idempotencyKey)) {
      console.log(`[meta-schedule] skip already-published ${idempotencyKey} ${item.title}`);
      continue;
    }
    const delay = new Date(item.slot).getTime() - Date.now();
    if (delay < -10 * 60 * 1000) {
      console.log(`[meta-schedule] skip expired slot ${item.slot} ${item.title}`);
      continue;
    }
    if (delay > 0) await wait(delay);
    const result = await publish(request);
    console.log(JSON.stringify({ source: request.source, result }));
    appendJsonl(resultLedger, {
      published_at: new Date().toISOString(),
      campaign_id: plan.id,
      platform,
      item_index: item.index,
      product_id: item.product_id,
      slug: item.slug,
      social_id: result[platform],
      result,
    });
    alreadyPublished.add(idempotencyKey);
    if (platform === 'facebook' && captionLinkPolicy(plan, item, 'facebook') !== 'inline_purchase_link') {
      queueBuyingLink(plan, item, result.facebook);
    }
  }
  recordPublishedHistory(plan);
}

main().catch((error) => { console.error(error.message); process.exit(1); });
