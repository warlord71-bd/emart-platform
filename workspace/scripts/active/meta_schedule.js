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
  if (plan.approval_status !== 'approved_for_scheduled_run') {
    throw new Error(`Campaign is not approved_for_scheduled_run: ${plan.approval_status || 'missing'}`);
  }
  for (const { item, request } of jobs) {
    const delay = new Date(item.slot).getTime() - Date.now();
    if (delay < -10 * 60 * 1000) {
      console.log(`[meta-schedule] skip expired slot ${item.slot} ${item.title}`);
      continue;
    }
    if (delay > 0) await wait(delay);
    const result = await publish(request);
    console.log(JSON.stringify({ source: request.source, result }));
    if (platform === 'facebook') queueBuyingLink(plan, item, result.facebook);
  }
}

main().catch((error) => { console.error(error.message); process.exit(1); });
