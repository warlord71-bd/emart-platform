# Emart Process Manifest and Freshness SLO

Version: 2026-06-30-v3
Snapshot time: 2026-06-30 23:10 CEST
Sources: filtered `pm2 jlist`, `crontab -l`, `workspace/TASKS.md`, current log mtimes/tails, and read-only runtime docs.
Scope: documentation only. This file does not authorize restarts, deploys, publishing, WordPress/Woo writes, or protected commerce-data changes.

## Conventions

- Server cron timezone is the server timezone observed by `date`: CEST on 2026-06-25. Social campaign payloads may still schedule in BDT internally.
- Env file paths are recorded as locations only. Do not copy secret values into this file.
- "Expected state" separates active production processes from intentionally stopped jobs and dated one-shot workers.
- Reconcile commands are inspection or owner-approved recovery commands. Do not run restart/publish commands from an unknown source state.
- Source of truth: `/root/emart-platform` is the source repo; `/var/www/emart-platform` is the storefront runtime deploy tree; `origin/main` is publish history after live smoke passes.
- Runtime git metadata is advisory only. `deploy.sh` writes `/var/www/emart-platform/.deployed-rev` after live smoke and SEO/AEO gate pass; use that marker plus smoke evidence as deployed truth.
- Do not run `git reset --hard` in `/var/www/emart-platform` as a routine metadata fix. If runtime/source drift looks dangerous, first run `workspace/content-orchestrator/scripts/active/drift_check.py` from `/root/emart-platform` and review the source-like differences.
- Generated campaign assets, audit archives, ledgers, and hot runtime state can make `/var/www` appear dirty. Treat those separately from source files.

## PM2 Processes

| Name | Type | CWD | Entrypoint | Schedule | TZ | Owner | Lifecycle | Restart policy | Expected state | Env file path | Reconcile command |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `emartweb` | PM2 | `/var/www/emart-platform/apps/web` | `npm start -- -H 127.0.0.1 -p 3000` | always-on | server | [C] | always-on | PM2 autorestart | running; primary storefront | `/var/www/emart-platform/apps/web/.env.local` | `pm2 jlist`; if unhealthy, use `deploy.sh` from known local state |
| `emart-presence` | PM2 | `/var/www/emart-platform/apps/presence-server` | `node server.js` | always-on | server | [C] | always-on | PM2 autorestart | running; same-origin WebSocket | service env or shell env, no committed secrets | `pm2 jlist`; smoke `wss://e-mart.com.bd/ws/presence` through nginx |
| `emart-embed` | PM2 | `/root/emart-platform/services/embed` | `uvicorn embed_service:app --host 127.0.0.1 --port 8077` | always-on | server | [C]/[X] | always-on | PM2 autorestart | running; embedding/rerank API | process env; no committed secrets | `pm2 jlist`; local HTTP health/sample query |
| `emart-reels-bot` | PM2 | `/root/emart-platform/workspace/content-orchestrator/video-engine` | `python3 reels_bot.py` | always-on polling | server | [C] | always-on | PM2 autorestart | running; Telegram approval bot only | `/var/www/emart-platform/apps/web/.env.local` or runtime env for dedicated reel bot token | `pm2 jlist`; tail `/root/.pm2/logs/emart-reels-bot-out.log` |
| Dated social campaign workers | PM2 one-shot pattern | `/root/emart-platform` preferred | `workspace/content-orchestrator/scripts/active/meta_schedule.js` / `meta_comment_queue.js` with a dated approved plan | campaign slots only | BDT payload, server process | [X] | dated one-shot | PM2 autorestart only inside active campaign window | no expired dated workers should remain online; June 29/30 leftovers deleted 2026-06-30 and PM2 saved | `apps/web/.env.local` for Meta token | After campaign completion, verify ledgers/history, delete dated PM2 entries, run `pm2 save`, then confirm with `drift_check.py` |
| `emart-blog-generator` | PM2 cron | `/root/emart-platform/apps/web` | `bash /root/emart-platform/workspace/content-orchestrator/scripts/active/blog_generator_run.sh` | `0 2,10,18 * * *` | server | [A]/[C] | cron | no autorestart between cron runs | stopped in PM2; unsafe for pilots until draft gate is verified | `/root/.openclaw/openclaw.env` and runtime app env | Tail `/root/.openclaw/workspace-emart/blog_generator.log`; keep publish path approval-gated |
| `emart-checkout-monitor` | PM2 cron | `/root/emart-platform` | `bash /root/emart-platform/workspace/content-orchestrator/scripts/active/checkout_monitor_run.sh` | `*/15 * * * *` plus watchdog | server | [A] | cron/checker | no autorestart between cron runs | intentionally stopped, watchdog can force-run if silent | `/root/.openclaw/openclaw.env` | Tail `/root/.pm2/logs/emart-checkout-monitor-out.log`; do not modify checkout/cart/payment logic |
| `emart-competitor-prices` | PM2 cron | `/root/emart-platform` | `bash /root/emart-platform/workspace/content-orchestrator/scripts/active/competitor_prices_run.sh` | PM2 `0 2 * * *`; root cron weekly Sun 03:00 | server | [A] | cron/on-demand | no autorestart between cron runs | stopped in PM2; active via root cron weekly | `/root/.openclaw/openclaw.env` | Tail `/tmp/emart-competitor.log` and PM2 out log |
| `emart-revenue-health` | PM2 cron | `/root/emart-platform` | `bash /root/emart-platform/workspace/content-orchestrator/scripts/active/revenue_health_check.sh` | `*/30 * * * *` | server | [A] | cron/checker | no autorestart between cron runs | intentionally stopped | `/root/.openclaw/openclaw.env` | Tail PM2 out log if owner re-enables |
| `emart-seo-autoscan` | PM2 cron | `/root/emart-platform` | `bash /root/emart-platform/workspace/content-orchestrator/scripts/active/seo_auto_scan.sh` | `0 0 * * *` | server | [A] | cron/report | no autorestart between cron runs | intentionally stopped/deprecated | repo/runtime env as needed | Keep stopped; prefer `workspace/seo-review/gsc_tracker.py full` |
| `emart-meta-gen` | PM2 | `/root/emart-platform` | `bash /root/emart-platform/workspace/content-orchestrator/scripts/active/meta_gen_batch.sh` | on-demand | server | [A]/[X] | batch | PM2 autorestart historical | stopped; job complete | runtime env; no committed secrets | Keep stopped unless owner opens a reviewed meta batch |
| `n8n` | PM2 | `/var/www/medimart-web/web` | `/usr/bin/n8n` | always-on | server | [O]/[A] | always-on | PM2 autorestart | running; separate automation platform | external n8n env; ORCH-5 notes PM2 env leak risk | Recreate under explicit env/filtering at maintenance window |
| `medimartweb` | PM2 | `/var/www/medimart-web/web` | `npm start -- -p 3002` | always-on | server | [O] | always-on | PM2 autorestart | running; separate project | project runtime env | Out of Emart scope; inspect only |
| `kbazar24web` | PM2 | `/var/www/kbazar24-platform/apps/web` | `npm start` | always-on | server | [O] | always-on | PM2 autorestart | running; separate project | project runtime env | Out of Emart scope; inspect only |

## Root Crontab Entries

| Job | Type | CWD | Entrypoint | Schedule | TZ | Owner | Lifecycle | Expected state | Env file path | Reconcile command |
|---|---|---|---|---|---|---|---|---|---|---|
| OpenClaw site health | cron | `/root/.openclaw/workspace-emart` | `python3 site_health.py` | `*/30 * * * *` | server | [A] | cron | running every 30 min | `/root/.openclaw/openclaw.env` | Check `/tmp/emart-site-health.log` |
| OpenClaw daily report | cron | `/root/.openclaw/workspace-emart` | `python3 daily_report.py` | `0 3 * * *` | server | [A] | cron | running daily | `/root/.openclaw/openclaw.env` | Check `/tmp/emart-daily-report.log` |
| OpenClaw low stock | cron | `/root/.openclaw/workspace-emart` | `python3 low_stock.py` | `0 */6 * * *` | server | [A] | cron | running every 6h | `/root/.openclaw/openclaw.env` | Check `/tmp/emart-low-stock.log`; protected stock read only |
| OpenClaw competitor prices | cron | `/root/.openclaw/workspace-emart` | `python3 competitor_prices.py` | `0 3 * * 0` | server | [A] | cron | weekly | `/root/.openclaw/openclaw.env` | Check `/tmp/emart-competitor.log` |
| OpenClaw blog check | cron | `/root/.openclaw/workspace-emart` | `python3 blog_check.py` | `0 4 * * *` | server | [A] | cron | daily check only | `/root/.openclaw/openclaw.env` | Check `/tmp/emart-blog-check.log` |
| GMC sync | cron | `/root/.gmc` | `/usr/bin/python3 /root/.gmc/sync.py` | `0 */6 * * *` | server | [A] | cron | running every 6h | `/root/.gmc/service-account.json` plus local config | Check `/root/.gmc/sync-cron.log`; latest complete 3595 synced/0 errors/30 skipped |
| VPS backup | cron | `/root` | `/root/emart-backup.sh` | `0 21 * * *` | server | [A] | cron | nightly | local backup script env | Check `/root/emart-backups/backup.log` |
| Checkout monitor watchdog | cron | `/root` | inline bash checks PM2 log age and runs checkout monitor if stale | `*/20 * * * *` | server | [A] | watchdog | active, but monitor intentionally stopped unless stale | `/root/.openclaw/openclaw.env` | Check `/root/.pm2/logs/emart-checkout-monitor-out.log` |
| Qdrant product sync | cron | `/root/emart-platform` | `workspace/content-orchestrator/scripts/active/qdrant_sync_run.sh` | `0 3 * * *` | server | [A]/[X] | cron | daily | runtime Woo/Qdrant env | Check `/tmp/qdrant-sync.log` and `workspace/seo-review/.qdrant_sync_state.json` |
| GSC tracker full | cron | `/root/emart-platform` | `python3 workspace/seo-review/gsc_tracker.py full` | `30 2 * * *` | server | [A]/[X] | cron | daily propose-only | GSC service account config | Check `/tmp/emart-gsc-tracker.log` and `workspace/seo-review/gsc-daily/YYYY-MM-DD.json` |
| System state report | cron | `/root/emart-platform` | `python3 workspace/seo-review/system_state.py --tg` | `35 2 * * *` | server | [A] | cron | daily Telegram report | Telegram/runtime env | Check `/tmp/emart-system-state.log` |
| Chromium profile cleanup | cron | `/root/emart-platform` | `workspace/content-orchestrator/scripts/active/cleanup_chromium_profiles.sh` | `0 4 * * 0` | server | [A] | cron | weekly cleanup | none expected | Check disk and absence of cleanup errors |
| Video orchestrator | cron | `/root/emart-platform/workspace/content-orchestrator/video-engine` | `python3 orchestrator.py --tick` | `0 */2 * * *` | server | [C] | cron builder | running every 2h; builds only to review | video/runtime env | Check `/tmp/emart-video-orchestrator.log`; recent signal `queue empty` |
| Daily video producer | cron | `/root/emart-platform/workspace/content-orchestrator/video-engine` | `python3 daily_producer.py` | `0 5 * * *` | server | [C] | cron enqueue | running daily; enqueues 2 products/day per latest log | video/runtime env | Check `/tmp/emart-daily-producer.log` or new queue files |

## Detached and On-Demand Engines

| Name | Type | CWD | Entrypoint | Schedule | TZ | Owner | Lifecycle | Expected state | Env file path | Reconcile command |
|---|---|---|---|---|---|---|---|---|---|---|
| Opus Humanizer Engine | detached/on-demand | `/root/emart-platform` | `bash workspace/humanizer/engine/run_detached.sh N` | manual batches | server | [X]/[A] | detached batch | may run only when intentionally launched | `/root/.openclaw/credentials/openrouter_default.json`, runtime DB/revalidate env | Inspect process list, `workspace/humanizer/engine/active/*.jsonl`, `scores.jsonl`; never touch price/stock/order/customer data |
| Social Engine planner | on-demand | `/root/emart-platform` | `python3 workspace/content-orchestrator/social-engine/social_engine.py plan/pick/record/import-performance` | manual/agent | server | [X] | approval-first batch | not daemonized except generated schedulers | `apps/web/.env.local` only for approved Meta fetch/publish paths | Inspect `workspace/content-orchestrator/social-engine/output/*/*`, `performance/latest.json`, `state/published-history.json` |
| Video worker | queue worker/on-demand | `/root/emart-platform/workspace/content-orchestrator/video-engine` | `python3 worker.py --job ...` or orchestrator-managed build | orchestrator-driven/manual | server | [C] | queue worker | not a persistent daemon; orchestrator drives jobs | video/runtime env | Inspect `jobs/{queue,building,review,approved,published,rejected}` |
| Blog generator | on-demand/PM2 cron | `/root/.openclaw/workspace-emart` and repo launcher | `blog_generator.py` via launcher | PM2 cron historical | UTC log timestamps | [A]/[C] | batch | unsafe for pilots unless draft/review mode is active | `/root/.openclaw/openclaw.env` | Inspect `blog_generator_state.json` and `blog_generator.log`; no direct publish for experiments |

## Freshness and SLO Spec

| Process/job | Last-success signal | Expected duration | Max age before stale | Retry policy | Transient errors | Fatal errors | Commercial health check | Recovery / alert action |
|---|---|---|---|---|---|---|---|---|
| `emartweb` | PM2 online plus HTTP 200 for `https://e-mart.com.bd/` | continuous | 2 failed checks or 5 min unavailable | PM2 autorestart, then deploy rollback path | Woo/API timeout during build, transient network | build artifact missing, repeated 5xx, bad runtime env | homepage, `/shop`, sample PDP | Alert owner; restart only from known VPS source or run approved `deploy.sh` |
| `emart-presence` | PM2 online, WebSocket accepts same-origin connection | continuous | 10 min down | PM2 autorestart | client disconnect burst | port bind failure, bad nginx proxy | presence endpoint only | Alert; restart presence service if source state is known |
| `emart-embed` | PM2 online, local HTTP/rerank sample responds | continuous; cold start can be about 90s | 15 min down or 3 failed samples | PM2 autorestart | cold model load, timeout | model load crash, OOM loop | chat/search quality, not checkout | Alert; restart outside peak if repeated; consider warmup |
| `emart-reels-bot` | PM2 log line `[reels-bot] polling...`; `.bot_state.json` has chat id | continuous polling | 30 min no polling log | PM2 autorestart | Telegram rate limit/network | token invalid, second poller conflict | none | Alert Claude/owner; do not start a second OpenClaw-token poller |
| Social FB/IG schedulers | PM2 log records published/skipped slots; result JSONL and `published-history.json` mtime | campaign window | stale if no log movement for 30 min during active window | PM2 autorestart during campaign only | Meta 429/5xx, expired slot skip | permission error, invalid token, duplicate post loop | Meta post URL/API if available | Stop/archive dated workers after completion; owner action for missing permissions |
| FB comment worker | Comment result log | 3 min loop | stale after 15 min if enabled | PM2 autorestart only when permission is valid | Meta 429/5xx | missing `pages_manage_engagement` | FB comment appears under post | Keep stopped until O-15 is resolved |
| Blog generator | `blog_generator.log` line with generated/draft/published ID; `blog_generator_state.json.last_run` | 1-5 min typical | >10h if enabled at 3x/day; otherwise intentionally stopped | one model fallback chain per run | OpenRouter 404/429, model timeout | WordPress publish failure, direct-publish path used for pilot | blog URL only after approval | Keep stopped/approval-gated; alert if it publishes without approved draft gate |
| Checkout monitor | PM2/out log timestamp and all 8 steps pass | <5 min | >20 min triggers watchdog when enabled | watchdog force-run | browser startup/profile issue | checkout flow failure, payment/order mutation risk | checkout smoke only | Alert; do not modify checkout/cart/payment/order logic without owner scope |
| Competitor prices | `/tmp/emart-competitor.log` or PM2 out log, Sheets update | <30 min | >8 days | weekly cron/manual rerun | target site timeout | auth/sheet write failure | none | Alert; rerun manually when safe |
| Revenue health | PM2 out log | <5 min | intentionally stopped | none while stopped | API/report timeout | false revenue alarm, auth failure | analytics/reporting only | Keep stopped unless owner reopens |
| SEO autoscan | PM2 error/out log | variable | intentionally stopped | none | crawl timeout | noisy/stale scanner | none | Keep stopped; use modern SEO control loop |
| Meta generator | PM2 out log and completion count | batch | job complete | none unless owner-approved | model/API timeout | unreviewed bulk meta write | search snippet quality | Keep stopped |
| OpenClaw site health | `/tmp/emart-site-health.log` mtime or system report HTTP status | <1 min | >90 min | next cron | transient HTTP timeout | repeated non-200 | homepage HTTP 200 | Alert Telegram/owner |
| Daily report | `/tmp/emart-daily-report.log` daily mtime | <5 min | >30h | next cron/manual | Telegram timeout | auth/config failure | reporting only | Alert if two missed days |
| Low stock | `/tmp/emart-low-stock.log` mtime | <5 min | >8h | next cron | Woo read timeout | auth failure | stock alert only; no writes | Alert; no stock writes |
| GMC sync | `/root/.gmc/sync-cron.log` line `Sync complete` | observed about 2-3 min | >8h | next cron; manual only after content/data changes | Google API 429/5xx | auth failure, feed write errors | Merchant Center product health | Alert; run last after verified catalog/content changes |
| Backup | backup log and archive/checksum | varies by dump size | >30h | manual rerun after inspecting failure | transient disk/network | dump/tar failure, checksum missing | recovery readiness | Alert; do not delete old backups until new verified |
| Qdrant sync | `/tmp/qdrant-sync.log`, `.qdrant_sync_state.json` watermark | variable; daily | >30h | next cron/manual full sync | Woo/Qdrant timeout | corrupt state, deletion mismatch | chat/search relevance | Recreate state only with reviewed plan; stale deletion must be intentional |
| GSC tracker full | `/tmp/emart-gsc-tracker.log`; latest `gsc-daily/YYYY-MM-DD.json`; actions summary | observed about 10s | >30h | next cron/manual `full` | Google API timeout | auth failure, malformed output | SEO pipeline only | Alert; do not apply actions automatically |
| System state | `/tmp/emart-system-state.log`; Telegram sent | <1 min | >30h | next cron | Telegram timeout | AGENT_BUS parse error, stale status logic | monitoring only | Alert; verify parser before trusting red status |
| Chromium cleanup | no error output; disk stable | <5 min | >8 days | next weekly cron | locked profile | runaway disk growth | none | Alert if disk grows or cleanup errors |
| Video orchestrator | `/tmp/emart-video-orchestrator.log` line `queue empty` or job transition | <5 min when empty; longer per build | >3h with no log while cron enabled | next cron; job-level retry/dead-letter per contract | model/image/ffmpeg transient | loudness/QA fail, corrupt job JSON | none until approved publish | Alert Claude; never auto-publish; failed jobs move to review/rejected/failed |
| Daily video producer | producer log or new `jobs/queue/*.json` | <5 min | >30h | next cron | product picker empty | malformed job, quota/cadence violation | none | Alert; do not enqueue spam volume |
| Humanizer detached engine | `active/engine-YYYY-MM-DD.jsonl`, `scores.jsonl`, Telegram completion | depends on limit/free rate limits | stale only while known process active >2h without output | model fallback/backoff | OpenRouter 402/429/5xx | DB apply failure, gate bypass | PDP content/revalidation | Stop and inspect JSONL; apply only PASS rows; revalidate `tag:products` after writes |
| Social Engine planner/import | output pack files, `qa-report.json`, `performance/latest.json` | <10 min plus vision QA | stale if run exits without output | rerun dry-run | vision provider unavailable, local asset missing | QA fail, approval missing | campaign only after owner approval | Do not publish; fix pack or request owner approval |
| Video worker | job file moves between queue dirs and checkpointed output JSON | per reel variable | >30 min in `building` without mtime | retry budget in job/contract | image/model/ffmpeg timeout | corrupt job, QA fail, publish denied | only after Telegram approval | Move to failed/review with error; never publish from cron |
| Blog check | `/tmp/emart-blog-check.log` | <1 min | >30h | next cron | WP read timeout | direct publish path or auth failure | blog freshness only | Alert; route content through draft/review |
| Adjacent PM2 projects (`n8n`, `medimartweb`, `kbazar24web`) | PM2 online | continuous | project-specific | PM2 autorestart | runtime timeout | env leak, app crash | their own domains | Out of Emart scope except ORCH-5 env leak cleanup |

## Error Classification Rules

- Transient: external API 429/5xx, network timeout, model/provider unavailable, single Woo/GSC/GMC timeout, Telegram send failure, temporary file lock.
- Fatal: authentication failure, missing env file, corrupt JSON state, repeated PM2 crash loop, publish attempted without approval, checkout/cart/payment/order/customer/stock/price mutation outside explicit owner scope, invalid source tree for restart/deploy.
- Commercial endpoint: anything affecting storefront HTTP 200, product discoverability, checkout smoke, Merchant Center sync, or approved social publishing should alert faster than report-only jobs.

## Manifest Maintenance

- Update this file whenever a PM2 process, cron entry, queue worker, state path, schedule, or owner changes.
- Use filtered PM2 output; never paste environment variables.
- Dated campaign workers should be removed from the active manifest after archival and represented as a reusable pattern plus ledger location.
