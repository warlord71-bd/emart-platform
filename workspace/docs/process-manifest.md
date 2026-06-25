# Emart Process & Job Manifest
Updated: 2026-06-25 | Owner: [C] Claude (builds), [A] Automated crons

## PM2 Processes (live runtime)

| ID | Name | Status | Purpose | CWD | Owner | Notes |
|---|---|---|---|---|---|---|
| 30 | emartweb | online | Next.js 14 (v0.39.0) — live storefront | /var/www/emart-platform/apps/web | [C] | Primary revenue surface |
| 2 | emart-presence | online | WebSocket presence badge | /var/www/emart-platform | [C] | wss://e-mart.com.bd/ws/presence |
| 35 | emart-embed | online | Sentence embeddings (all-mpnet-base-v2 + bge-reranker-v2-m3) | /var/www/emart-platform | [C] | 2.2 GB RAM; port 8077 |
| 46 | emart-reels-bot | online | Telegram reel approval bot (@Emart_vid_bot) | /root/emart-platform/workspace/video-engine | [C] | Dedicated token; human-approval only publisher |
| 47 | emart-fb-18-20260625 | online | FB scheduled post worker (June 25 batch) | — | [X] Codex | One-shot; archive when done |
| 48 | emart-ig-18-20260625 | online | IG scheduled post worker (June 25 batch) | — | [X] Codex | One-shot; archive when done |
| 49 | emart-fb-comment-20260625 | stopped | FB comment worker (June 25 batch) | — | [X] Codex | One-shot |
| 32 | emart-blog-generator | stopped | Auto blog publisher (OpenRouter) | /root/.openclaw/workspace-emart | [A] | ⚠ WA-H: publish-only, no draft mode |
| 26 | emart-checkout-monitor | stopped | 8-step checkout flow checker | /root/emart-platform | [A] | Intentionally stopped |
| 27 | emart-competitor-prices | stopped | Price comparison → Google Sheets | /root/emart-platform | [A] | Manual-run only |
| 28 | emart-revenue-health | stopped | Revenue anomaly checker | /root/emart-platform | [A] | Intentionally stopped |
| 12 | emart-seo-autoscan | stopped | SEO scan (deprecated) | /root/emart-platform | [A] | Intentionally stopped |
| 19 | emart-meta-gen | stopped | Meta description bulk writer | /root/emart-platform | [A] | Job complete (1,360/1,360) |
| 34 | kbazar24web | online | KBazar24 storefront (Next.js) | /var/www/kbazar24-platform/apps/web | — | Separate project |
| 3 | medimartweb | online | MediMart storefront (Next.js) | /var/www/medimart-platform/apps/web | — | Separate project |
| 0 | n8n | online | n8n automation platform | — | — | General automation |

## Systemd User Services

| Unit | Status | Purpose |
|---|---|---|
| emart-wc-bridge.service | active | WooCommerce order → OpenClaw Telegram bridge |
| openclaw-gateway.service | active | OpenClaw Gateway (v2026.3.11), port 18789 |

## Cron Jobs (user crontab — 13 entries)

| Schedule | Job | Purpose | Owner |
|---|---|---|---|
| `*/15 * * * *` | `orchestrator.py --tick` | Video reel builder (builds to review gate) | [C] |
| `*/30 * * * *` | `site_health.py` | Live site health check | [A] OpenClaw |
| `0 3 * * *` | `daily_report.py` | Daily Telegram report | [A] OpenClaw |
| `0 */6 * * *` | `low_stock.py` | Low stock alerts | [A] OpenClaw |
| `0 3 * * 0` | `competitor_prices.py` | Weekly competitor price check | [A] OpenClaw |
| `0 4 * * *` | `blog_check.py` | Blog automation check | [A] OpenClaw |
| `0 */6 * * *` | `sync.py` (GMC) | Google Merchant Center sync | [A] |
| `0 21 * * *` | `emart-backup.sh` | Nightly backup | [A] |
| `*/20 * * * *` | Checkout monitor watchdog | Restarts checkout monitor if silent | [A] |
| `0 3 * * *` | `qdrant_sync_run.sh` | Qdrant vector DB product sync | [A] |
| `30 2 * * *` | `gsc_tracker.py full` | GSC data tracker (propose-only) | [A] |
| `35 2 * * *` | `system_state.py --tg` | System state → Telegram | [A] |
| `0 4 * * 0` | `cleanup_chromium_profiles.sh` | Weekly Chromium temp cleanup | [A] |

## Lifecycle Rules

- **Never restart `emartweb` from unknown source state** — verify VPS tree first
- **Never start a second poller on the OpenClaw bot token** — `emart-reels-bot` uses its own token
- **One-shot PM2 entries** (dated `_2026MMDD`) should be archived to `/root/.attic-*` after completion
- **deploy.sh** handles the full Local→VPS→restart→smoke sequence; never manually rsync+restart
