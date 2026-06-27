#!/usr/bin/env node
/*
 * Timed reel scheduler for approved Emart video-engine jobs.
 * Dry-run by default. Add --publish to call the shared Meta publisher.
 */
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
  let content = '';
  try { content = fs.readFileSync(path.resolve(filePath), 'utf8'); } catch { return keys; }
  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row.schedule_id && row.platform && row.item_index) {
        keys.add(`${row.schedule_id}:${row.platform}:${row.item_index}`);
      }
    } catch {}
  }
  return keys;
}

function requestFromItem(item, platform) {
  const job = JSON.parse(fs.readFileSync(path.resolve(item.job_path), 'utf8'));
  const mediaUrl = item.media_url || job.stages?.store?.url;
  return {
    source: `${item.schedule_id}:${item.index}:${platform}`,
    mediaUrl,
    mediaType: 'reel',
    caption: item.caption || job.caption || job.script?.caption || '',
    platform,
    publish: true,
  };
}

async function main() {
  const planPath = arg('plan');
  const platform = arg('platform', 'facebook');
  const live = process.argv.includes('--publish');
  const ledger = arg('result-ledger');
  if (!planPath) throw new Error('--plan is required');
  if (!['facebook', 'instagram'].includes(platform)) throw new Error('--platform must be facebook or instagram');

  const plan = JSON.parse(fs.readFileSync(path.resolve(planPath), 'utf8'));
  if (plan.approval_status !== 'approved_for_scheduled_run') {
    throw new Error(`Reel schedule is not approved_for_scheduled_run: ${plan.approval_status || 'missing'}`);
  }
  const items = (plan.items || []).filter((item) => (item.platforms || [platform]).includes(platform))
    .map((item) => ({ ...item, schedule_id: plan.id }));
  const jobs = items.map((item) => ({ item, request: requestFromItem(item, platform) }));
  for (const { request } of jobs) validate(request);

  if (!live) {
    console.log(JSON.stringify({
      dryRun: true,
      source: path.resolve(planPath),
      schedule: plan.id,
      approvalStatus: plan.approval_status,
      platform,
      reels: jobs.length,
    }, null, 2));
    return;
  }

  const alreadyPublished = publishedKeys(ledger);
  for (const { item, request } of jobs) {
    const idempotencyKey = `${plan.id}:${platform}:${item.index}`;
    if (alreadyPublished.has(idempotencyKey)) {
      console.log(`[meta-reel-schedule] skip already-published ${idempotencyKey} ${item.title}`);
      continue;
    }
    const delay = new Date(item.slot).getTime() - Date.now();
    if (delay < -10 * 60 * 1000) {
      console.log(`[meta-reel-schedule] skip expired slot ${item.slot} ${item.title}`);
      continue;
    }
    if (delay > 0) await wait(delay);
    const result = await publish(request);
    console.log(JSON.stringify({ source: request.source, result }));
    appendJsonl(ledger, {
      published_at: new Date().toISOString(),
      schedule_id: plan.id,
      platform,
      item_index: item.index,
      product_id: item.product_id,
      title: item.title,
      social_id: result[platform],
      result,
    });
    alreadyPublished.add(idempotencyKey);
  }
}

main().catch((error) => { console.error(error.message); process.exit(1); });
