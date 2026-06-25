# Emart Task Board
Last updated: 2026-06-25 (video pipeline: autonomous builder + Telegram approval bot online)
Freeze: 2026-05-22 → 2026-07-03 (structural/nav only — content, SEO, automation OK)
**[C]** Claude · **[X]** Codex · **[O]** Owner · **[A]** Auto/OpenClaw

---

## 🤖 RUNNING AUTONOMOUSLY

| Job | Status | Notes |
|---|---|---|
| `emartweb` (PM2, :3000) | ✅ online | Next.js 14, v0.39.0 |
| `emart-presence` (PM2, :3011) | ✅ online | WebSocket, 49d uptime |
| `emart-embed` (PM2, :8077) | ✅ online | all-mpnet-base-v2 + bge-reranker-v2-m3, 2.2GB RAM |
| `emart-blog-generator` (PM2 cron) | ✅ stopped | PM2 stopped; last known publish 2026-06-20. Unsafe for new pilots until WA-H draft/review gate exists. |
| `emart-checkout-monitor` (PM2 cron) | ✅ stopped | All 8 steps pass; intentionally stopped |
| `emart-competitor-prices` (crontab, weekly Sun 3AM) | ✅ stopped in PM2 | Runs via crontab, not PM2. Last manual run 2026-06-20; Google Sheets updated |
| `emart-revenue-health` (PM2 cron) | ✅ stopped | Intentionally stopped |
| `emart-seo-autoscan` (PM2 cron) | ✅ stopped | Intentionally stopped |
| `emart-meta-gen` (PM2) | ✅ stopped | Job complete (1,360/1,360 metas done Jun 15) |
| Opus Humanizer Engine (detached, free OpenRouter) | 🟢 ongoing | `workspace/humanizer/engine/` — generates PDP descriptions on free models (gemma-4-31b chain), gated GMC+AI-residue, auto-applies PASS + revalidates + Telegram ping. Run: `bash workspace/humanizer/engine/run_detached.sh N`. 122 humanized as of 2026-06-23. Awaiting owner OpenRouter funds for Hermes handoff. |
| Video orchestrator (crontab, `*/15`) | 🟢 running | `orchestrator.py --tick` — builds+QAs reels to `jobs/review/`, parks at human-approval gate. **Builds only; never posts.** `--status` = pipeline dashboard. |
| Reels approval bot (`reels_bot.py`) | ✅ online | Telegram see-and-approve bot is polling with a registered chat. Posts reel as video + ✅Approve/❌Reject; Approve = the ONLY thing that publishes. No auto-publish cron exists. |
| GSC tracker (crontab, `30 2 * * *`) | ✅ running | `gsc_tracker.py full` — propose-only, no WC writes |
| system_state.py (crontab, `35 2 * * *`) | 🟡 patched | Health UA + expected-stopped classification fixed locally; verify next cron/live run |
| GMC sync (crontab, `0 */6 * * *`) | ✅ running | 3,600/3,631 approved; 7 dead entries removed 2026-06-22 |
| Python crons | ✅ running | site_health, daily_report, low_stock |

---

## 🔴 OPEN WORK — Prioritized

### Workspace Audit — Inconsistencies & Logical Gaps (2026-06-24)

Cross-system audit of the live automation surface (publishing, generated state, engines). A and B
carry live-posting risk (🔴). No code changed by the audit — findings only.

**Close-out rule (any agent — [C]/[X]/[A]):** these WA items must be actively closed, not left open.
When you finish one, flip its Status to ✅ with the date + commit ref (or PR), state how it was verified,
and move your AGENT_BUS entry from ACTIVE to LAST COMPLETED. Partial work → keep 🔲 and note progress
inline (don't mark ✅). Before starting any WA item, check AGENT_BUS ACTIVE WORK to avoid collisions
(WA-A/WA-B/WA-G touch live publishing + secrets — coordinate first).

| ID | Sev | Finding | Owner | Status |
|---|---|---|---|---|
| WA-A | 🔴 | **Publishing source of truth unified.** `meta_publish.js` is the sole FB/IG image+reel implementation; legacy entry points are wrappers. Video worker passes its checkpointed queue job via `--job`. Social Engine previews now pass `campaign-plan.json` directly to `meta_schedule.js`, which enforces campaign approval and queues FB buying-link comments. | [X]+[C] | ✅ complete; dry-run default |
| WA-B | 🔴 | **`/opt/fb-poster` coupling removed.** Active Meta scripts load Axios/dotenv only from `apps/web/node_modules` and credentials only from `apps/web/.env.local` (local or VPS repo). FB and IG read-only Graph validation passed against the live accounts. | [X] | ✅ complete |
| WA-C | 🟠 | **Generated SEO state removed from tracking.** Reproducible JSON/JSONL outputs and daily GSC snapshots are ignored and removed from the git index while remaining on disk. Human approval queues remain tracked. | [C] | ✅ complete |
| WA-D | 🟡 | **One-shot dated scripts accumulate in `scripts/active/`.** `meta_18_scheduler_20260623.js`, `_20260624_fb.js`, `_20260624_ig.js`, `meta_fb_comment_worker_20260624.js`, `prepare_fb_campaign_20260624.py` are single-run artifacts living permanently in active/ with no archival. Fix: rotate spent one-shots to `/root/.attic-*` per cleanup rule. | [C] | 🔲 open |
| WA-E | 🟠 | **Video-engine free-output gaps resolved by Claude.** Free bn-BD voiceover, ducked music, browser-shaped captions, populated persona libraries, branded/value cards, and master QA are implemented and verified. | [C] | ✅ complete |
| WA-F | 🟠 | **social-engine gaps** — tracked as X8a (performance loop), X8b (IG 4:5 generation), X8c (dead `approval_status`) in the Codex — Open block below. F1 (real vision QA) already ✅ in `f01c602`; product picker/history hook/IG variants/contact sheet now implemented. | [X] | 🟡 X8a partial; X8b complete; X8c open |
| WA-G | 🔴 | **Embedded credentials removed from all OpenClaw scripts.** 12 scripts migrated to shared `creds.py` loader reading from `openclaw.env`. `IDENTITY.md` scrubbed. WC key updated to live BFF key_id 34; WC localhost access fixed (Host + X-Forwarded-Proto headers). All cron scripts verified working. **Owner actions remain:** (1) revoke old WP app password `mrVDk8iq...` in WordPress; (2) revoke old WC keys `ck_9d9f...` and `ck_53d4...` if not already; (3) set valid `META_ACCESS_TOKEN` in `openclaw.env` if ads_briefing.py is needed. | [C]+[O] | ✅ 2026-06-25 scripts fixed; owner rotation pending |
| WA-H | 🟠 | **Hermes blog generator is publish-only.** Its sole `main()` path generates, uploads media, publishes a WordPress post, updates state, and sends Telegram; there is no draft/review/validate mode. Add generate-to-file/draft status plus explicit reviewed publish action before using it for new Bangla or experimental content. | [C] | 🔲 open; do not run for pilots |

### Video Pipeline (VID) — autonomous build + Telegram approval (2026-06-25)

Autonomous reel engine is live and building drafts; nothing posts without an owner Telegram tap.
Built this session (commits `dcd17af`, `3e9a7fe`): `orchestrator.py` (builder/gate/`--status` dashboard),
`reels_bot.py` (Telegram see-and-approve), `publish_approved.py` (only publishes on Approve), `enqueue.py`.
No worker.py / meta_* edits. **No background auto-publish cron exists** — the only `--live` call is inside
the Approve-button handler; verified the bot is the sole writer to `jobs/approved/`.

| ID | Finding / action | Owner | Status |
|---|---|---|---|
| VID-1 | **Start the Telegram approval bot.** @BotFather token is now present, `emart-reels-bot` is online in PM2, and a Telegram chat is registered. Reels still only publish when the owner taps Approve; the builder cron parks drafts in `jobs/review/`. | [O]→[C] | ✅ online 2026-06-25 |
| VID-4 | **Reel standard established (2026-06-25):** brand cards (real logo + rose/gold + dual price), loudness gate, caption-window, Bangla-phonetic voiceover, **canonical reusable Emart model** (`personas/emart-model/clean-portrait.png`) + free `presenter_card.py` fallback, 5-frame layout. Reels delivered to owner Telegram for verdict. | [C] | 🟡 awaiting owner sign-off on #14 |
| VID-5 | **NEXT SESSION — separate FB + IG reel versions + publish both.** Owner screenshot: the top caption was clipped by FB Reels mobile UI (top-cut). Safe-zone FOUNDATION landed in `caption_overlay.py` (`5923883`): default 'wide' band is FB/IG-safe; `fb`/`ig` tuned profiles + `--safe-zone` exist but worker does NOT pass them yet. TODO: (1) wire worker to take `safe_zone` from job + build a tuned FB version and IG version; (2) make 2 jobs (platforms:[facebook] / [instagram]); (3) deliver both to @Emart_vid_bot for approval → publish each to its platform. Note: the already-published FB Althea reel has the old top-cut — owner may want to replace it. | [C] | 🔲 next session |
| VID-2 | **Daily auto-enqueue producer not built.** Nothing auto-fills `jobs/queue/`; reels are enqueued manually via `enqueue.py spec.json --priority NN`. Build a daily product/topic picker that drops 1–N specs/day when the approval loop is proven. | [C] | 🔲 open (after VID-1) |
| VID-3 | **WA-D archival now unblocked.** Codex finished the `meta_*` publishers, so the dated one-shot scripts in `scripts/active/` can be rotated to `/root/.attic-*` (this is WA-D). | [C] | 🔲 open |

### Audit Remediation Priority Lane — Freeze-Safe Order (2026-06-25)

Purpose: serialize the 360° system, SEO, and UI/UX orchestration audit findings without creating duplicate work
or disturbing the July 3 freeze. Existing task IDs remain authoritative; this lane is the recommended execution order.
Before 2026-07-03, prefer read-only audits, contracts, ledgers, config/spec work, and non-visual/non-commerce fixes.
Defer structural/nav/UI refactors, checkout/cart/payment/order/customer/stock/price changes, and broad deploy changes unless
the owner explicitly approves the exact scope.

| Order | Priority | IDs | Safe next action | Freeze / owner guard |
|---|---|---|---|---|
| 1 | ✅ Security | WA-G, ORCH-5 | ✅ Scripts migrated to `creds.py`/`openclaw.env`; IDENTITY.md scrubbed; WC key updated. **Owner:** revoke old WP/WC keys; fix PM2 env leak at next restart. | Done 2026-06-25 |
| 2 | ✅ Release safety | ORCH-1 | ✅ `deploy.sh` hardened: deploy lock, selective staging, lockfile-before-rsync, .next rollback, runtime-state exclusions. | Done 2026-06-25 |
| 3 | 🟡 SEO data contract | SEO-ORCH-1 | ✅ Canonical `/product/`→`/shop/` merge in GSC tracker; ✅ durable completed-content registry (317 products, auto-refreshed nightly); ✅ humanizer queue now correct (97 excluded, 402 remaining). **Remaining:** full-catalog agentic scoring run. | Partial 2026-06-25 |
| 4 | 🟡 Critical UX trust contract | UX-ORCH-1 | ✅ Contract audit created: `workspace/docs/audits/storefront-trust-data-contract-20260625.md`. Follow-on: owner-approved visible relabeling/source flags for fallback counters. | No fake-live counters; no stock/price/Woo data writes without explicit request. |
| 5 | 🟠 High runtime/state map | ORCH-2, ORCH-4, ORCH-8 | Create one versioned process/job manifest plus last-success/freshness SLO list and durable queue/state contract for PM2/crons/engines. | Config/docs first; restart only from known source state. |
| 6 | 🟠 High work ledger | SEO-ORCH-2, UX-ORCH-2 | Create durable action/event schemas so SEO and UX recommendations have stable IDs, evidence, owner, status, and outcome. | Ledgers first; approval gates before publish/apply. |
| 7 | 🟠 High visual safety | UX-ORCH-3, UX-ORCH-4, UX-ORCH-8 | Add screenshot/a11y/design-system audits and proposal reports for mobile home/shop/PDP/component drift. | No broad visual refactor before Jul 3; owner approval for visible UI changes. |
| 8 | 🟠 High content/campaign safety | WA-H, SEO-ORCH-5, UX-ORCH-6 | Convert direct-publish/blog/campaign paths to draft/review/approval/expiry contracts. | No experimental content direct-publish. No automatic discounts/prices. |
| 9 | 🟠 High measurement loop | SEO-ORCH-4, UX-ORCH-5, UX-ORCH-7, X8a | Join GA4/GSC/GMC/Meta/RUM outcomes to change ledgers; add keep/iterate/revert review cadence. | Measurement/reporting first; no auto-optimization without owner gate. |
| 10 | 🟡 Medium recovery/ops maturity | ORCH-6, ORCH-7, SEO-ORCH-3, SEO-ORCH-6, SEO-ORCH-7, UX-ORCH-9 | Add DR drill, CI/control-loop tests, URL-policy registry, off-page/entity ledger, and customer-feedback taxonomy. | Mostly post-critical; keep outreach/personal-data workflows approval-first. |

### Main Priority Parent List — Authoritative 1-10

These are the only authoritative numbered priorities. Each main number holds its source rows as sub-issues.
Batch labels (`B1`, `B2`) and legacy AI numbers are helper labels only, not competing priority numbers.

| Main | Parent | Sub-issues | Status | Definition of done |
|---|---|---|---|---|
| 1 | Security | 1a WA-G, 1b ORCH-5 | 🟡 partial | Script credentials externalized, exposed old keys revoked by owner, PM2 env leakage fixed at next maintenance restart. |
| 2 | Release safety | 2a ORCH-1 | ✅ done | Deploy path avoids blanket staging, uses lock/install gates, protects runtime state, and has rollback behavior. |
| 3 | SEO data contract | 3a SEO-ORCH-1 | 🟡 partial | Canonical GSC aggregation, completed-content registry, full-catalog agentic scoring, and tier contract alignment are all trusted before priority automation acts. |
| 4 | UX trust contract | 4a UX-ORCH-1 | 🟡 contract done | Trust claims are inventoried with source/fallback rules in `workspace/docs/audits/storefront-trust-data-contract-20260625.md`; visible UI relabeling/source flags remain pending. |
| 5 | Runtime / state map | 5a ORCH-2, 5b ORCH-4, 5c ORCH-8 | 🔲 open | Versioned manifest, freshness/SLO monitor, and shared durable queue/state contract exist for PM2/crons/workers/engines. |
| 6 | Work / event ledgers | 6a SEO-ORCH-2, 6b UX-ORCH-2 | 🔲 open | SEO and UX recommendations/events have stable IDs, evidence, owner, approval state, execution record, rollback, verification, and outcome. |
| 7 | Visual safety | 7a UX-ORCH-3, 7b UX-ORCH-4, 7c UX-ORCH-8 | 🔲 open | Screenshot/a11y/design-system audits produce owner-visible evidence before broad visual/UI changes. |
| 8 | Content / campaign safety | 8a WA-H, 8b SEO-ORCH-5, 8c UX-ORCH-6 | 🔲 open | Blog/content/campaign paths use draft/review/approval/expiry gates; no experimental direct-publish or automatic price/discount action. |
| 9 | Measurement loop | 9a SEO-ORCH-4, 9b UX-ORCH-5, 9c UX-ORCH-7, 9d X8a | 🔲 open | GA4/GSC/GMC/Meta/RUM outcomes attach to change ledgers with baseline, review windows, and keep/iterate/revert decisions. |
| 10 | Recovery / ops maturity | 10a ORCH-6, 10b ORCH-7, 10c SEO-ORCH-3, 10d SEO-ORCH-6, 10e SEO-ORCH-7, 10f UX-ORCH-9 | 🔲 open | Backups/restore drill, CI/control-loop tests, technical SEO loop, URL registry, off-page/entity ledger, and feedback taxonomy exist. |

#### Main Priority Sub-Issues

| Sub-issue | Source row | Status | Definition of done |
|---|---|---|---|
| 1a | WA-G | 🟡 owner action pending | Embedded credentials removed from OpenClaw scripts; owner revokes old WP/WC keys and supplies/fixes any needed Meta token. |
| 1b | ORCH-5 | 🟡 partial | PM2 processes stop inheriting interactive shell secrets; sensitive jobs have explicit env/filtering or scoped runtime config. |
| 2a | ORCH-1 | ✅ done | `deploy.sh` is hardened with lock, selective staging, lockfile-before-rsync, runtime-state exclusions, and build rollback. |
| 3a | SEO-ORCH-1 | 🟡 partial | Finish full-catalog agentic scoring and align tier contracts after canonical merge + completed-content registry. |
| 4a | UX-ORCH-1 | 🟡 contract done | Inventory/source/fallback contract created 2026-06-25; pending implementation: add source flags and relabel fallback counters before CRO/social-proof expansion. |
| 5a | ORCH-2 | 🔲 open | Versioned manifest for every PM2 process, cron, queue worker, script runner, cwd, timezone, owner, lifecycle, restart policy, and reconcile command. |
| 5b | ORCH-4 | 🔲 open | Freshness/SLO monitoring for last success, run duration, queue age, retries, error class, commercial endpoint health, and recovery alert. |
| 5c | ORCH-8 | 🔲 open | Shared durable queue/state contract: locks, atomic writes, idempotency keys, retry budgets, dead letters, manual replay, checkpoint schema, audit trail. |
| 6a | SEO-ORCH-2 | 🔲 open | Durable SEO work ledger with stable action ID, canonical URL/entity, evidence, proposed change, owner, approval, execution, rollback, verification, outcome. |
| 6b | UX-ORCH-2 | 🔲 open | UX event/action ledger for product-list, search, filter/sort, PDP, wishlist/back-in-stock, chat/WhatsApp, quiz/routine, errors, and overlays. |
| 7a | UX-ORCH-3 | 🔲 open | Read-only screenshot matrix with collision/visibility/sticky-overlay checks for home/shop/PDP/search/journal/campaign slots. |
| 7b | UX-ORCH-4 | 🔲 open | Design-system drift report for raw controls, hardcoded colors, typography, and duplicate CTA/product-card patterns. |
| 7c | UX-ORCH-8 | 🔲 open | Automated a11y gates for axe, keyboard, focus, and contrast on representative journeys. |
| 8a | WA-H | 🔲 open | Blog generator can draft/review/validate before publish; no new pilots use direct publish. |
| 8b | SEO-ORCH-5 | 🔲 open | Content lifecycle runs demand check, brief, draft, factual/brand/claim/link/schema QA, approval, publish, revalidation, verification, review. |
| 8c | UX-ORCH-6 | 🔲 open | Campaign/promo surfaces have owner, source data, start/end, preview, approval, rollback, linked metric, stale-content alert. |
| 9a | SEO-ORCH-4 | 🔲 open | SEO changes join to GA4/GSC/order/GMC baselines and 7/28-day outcomes. |
| 9b | UX-ORCH-5 | 🔲 open | Frontend health monitoring covers RUM/web-vitals, route errors, API failure rates, hydration/runtime exceptions. |
| 9c | UX-ORCH-7 | 🔲 open | UX experiment/feature-flag registry has hypothesis, audience, variant, holdout, metric, runtime, rollback, owner, outcome. |
| 9d | X8a | 🟡 partial | Social Engine imports real Meta/GA4/GSC/GMC performance into product/brand/category score inputs automatically. |
| 10a | ORCH-6 | 🔲 open | Off-server encrypted backups, fail-closed dumps, checksums, RPO/RTO, and isolated restore drill. |
| 10b | ORCH-7 | 🔲 open | CI covers typecheck, lint, tests, build, dependency/security checks, deploy-script tests, orchestration tests. |
| 10c | SEO-ORCH-3 | 🔲 open | Read-only technical SEO control loop runs catalog/sitemap/Qdrant parity, samples, schema/canonical/404/redirect/query/news/internal-link/CWV checks. |
| 10d | SEO-ORCH-6 | 🔲 open | Versioned URL-policy registry is consumed/tested by middleware, metadata, robots, sitemap, redirects, and audit tools. |
| 10e | SEO-ORCH-7 | 🔲 open | Governed off-page/entity/AEO ledger covers mentions, outreach, GBP/social/reviews, spam review, AI citation/referral monitoring. |
| 10f | UX-ORCH-9 | 🔲 open | Customer-feedback taxonomy feeds UX/SEO/action ledgers without unsafe customer-data collection. |

### Workspace Conflict Audit — 2026-06-25

Scope: task-board/workspace governance only. This does not authorize implementation, deploys, live service restarts,
WordPress/Woo writes, protected commerce-data changes, or broad cleanup while the shared tree is dirty.

| ID | Conflict / friction | Decision for future sessions |
|---|---|---|
| WSC-1 | Shared worktree is dirty with concurrent Codex/Claude changes across docs, social publishing, video engine, humanizer, package files, and generated SEO state removals. | Do not deploy/commit/push from this state without reviewing `git status`, `git diff --stat`, staged files, and AGENT_BUS. Prefer task-board/doc-only work until owners of active files are clear. |
| WSC-2 | AGENT_BUS shows Claude actively owns video orchestration files (`orchestrator.py`, `publish_approved.py`, `enqueue.py`, `jobs/**`, video `.gitignore`, crontab). | Codex/other agents must avoid video-engine edits unless owner explicitly transfers/coordinates the work. ORCH-3 can be audited, not implemented, while this is active. |
| WSC-3 | `emart-blog-generator` is listed as scheduled, but WA-G says it has embedded live credentials and WA-H says it is publish-only. | Treat blog automation as unsafe for new/experimental content until WA-G/WA-H are closed. Add draft/review and secret rotation before using GSC topics or pilots. |
| WSC-4 | Social campaign row `X4` still said “active today” for 2026-06-24 after the date passed. | Verify final post/comment results, archive/close stale campaign state, then keep only reusable Social Engine tasks (`X8a`–`X8c`) open. |
| WSC-5 | Mobile work appears both as open (`X3`) and explicitly out-of-scope for mobile BFF gaps (“EXCEPT MOBILE APP”). | Park mobile app work unless owner reopens it. Do not let mobile tasks consume current web/SEO/orchestration sessions. |
| WSC-6 | ORCH/SEO/UX priority-lane IDs are repeated by design: once as execution order and once as source task rows. | Not a duplicate-task conflict. The source rows remain authoritative; the priority lane is only sequencing. |
| WSC-7 | `workspace/seo-review/*` generated files are removed from tracking but still exist as runtime/generated state. | Treat generated SEO JSON/JSONL/GSC snapshots as runtime state, not source of truth for commits. Keep human approval queues tracked. |

### Token-Efficient Session Batches — Work by Cluster, Not by Whole Board

Use these batches to reduce context cost. In each session, read only the batch's files plus AGENT_BUS, TASKS, and
the exact source files being changed. Do not mix batches unless the task explicitly depends on another batch.

| Batch | Type | Task IDs | Read first | Output expected | Hard stop / guard |
|---|---|---|---|---|---|
| B0 | Coordination + source-state check | WSC-1, AGENT_BUS, dirty tree | `python3 workspace/scripts/active/agent_start.py`, `apps/web/.agent-memory/AGENT_BUS.md`, `workspace/TASKS.md`, `git status --short`, relevant `git diff -- <file>` | Decide whether work is safe; claim/avoid overlap; refresh `workspace/AGENT_BRAIN.md` with `agent_brain.py --write` when needed. | Stop if another active agent owns the same files. |
| B1 | Security + release foundation | WA-G, ORCH-5, ORCH-1 | `AGENTS.md`, `CLAUDE.md`, `deploy.sh`, relevant PM2/cron docs, no secret values | Rotation plan, deploy-safety design, or small reviewed patch. | Never print secrets; no dependency-changing deploy until ORCH-1 is safe. |
| B2 | Runtime/job orchestration | ORCH-2, ORCH-4, ORCH-8 | `VPS_RESOURCE_MAP.md`, AGENT_BUS, PM2/cron docs, specific worker README | Versioned manifest/SLO/queue-state proposal or implementation. | No restarts from unknown source state; coordinate with active video work. |
| B3 | SEO data-control system | SEO-ORCH-1, SEO-ORCH-2, SEO-ORCH-3, SEO-ORCH-6 | `workspace/SEO_MASTER.md`, `workspace/seo-review/README.md`, `gsc_tracker.py`, latest GSC/state outputs | Canonical aggregation, scoring, action-ledger, URL-policy, or audit-loop fix. | Do not apply content/Woo writes from untrusted priority data. |
| B4 | Content lifecycle + humanizer/blog | WA-H, SEO-ORCH-5, SEO-7, X2, M4, M6 | `CONTENT_STANDARD.md`, humanizer README, SEO_MASTER relevant section, exact draft/report file | Draft/review gates, report-only QA, reviewed JSONL batches. | No direct publish; no bulk Woo meta writes without owner-reviewed sample. |
| B5 | UI/UX trust + visual systems | UX-ORCH-1–UX-ORCH-9, UX-4 | `BRAND_GUIDE.md`, design-change brief(s), exact UI files/routes, screenshot evidence | Trust-data contract, event schema, visual/a11y audit, owner-reviewed UI proposal. | No broad visible UI/nav/structural refactor before 2026-07-03. |
| B6 | Social/video automation | ORCH-3, WA-D, X7, X8a–X8c, O-15 | AGENT_BUS, social/video README, exact campaign JSON, Meta docs already in workspace | Close stale one-shots, record/performance loop, IG 4:5 assets, approval-state fix. | Do not publish live posts without explicit approval/token permissions; avoid Claude-owned video files. |
| B7 | Growth/off-page/entity | GROW-1–GROW-5, D8, O-8–O-12, SEO-ORCH-7 | SEO_MASTER, TASKS GROW section, owner profile/link docs | Outreach/entity/content map, ledger, proposal list. | No fake profiles, bought links, doorway/satellite sites, or mass posting. |
| B8 | Parked/post-freeze structural work | L2, L3, post-freeze backlog, mobile X3 | DEV_MASTER, relevant route/component docs only when reopened | Post-Jul 3 plan or owner decision request. | Park until freeze ends or owner gives exact approval. |

### Authority & Distribution Growth (audit 2026-06-24)

Technical SEO is already strong; the remaining opportunity is legitimate off-site authority, topical
coverage, and community distribution. Do **not** build AI WordPress satellite sites, public WordPress
template-kit sites, deceptive/paid link schemes, or other doorway/link-network tactics. The public SEO
surface remains the Next.js storefront only.

| ID | Item | Owner | Status |
|---|---|---|---|
| GROW-1 | Build a GSC-led topical-authority map connecting journal articles, `/best`, `/compare`, concerns, ingredients, brands, and commercial landing pages; include an internal-link proposal workflow and coverage reporting. | [X]+[C] | 🔲 highest priority |
| GROW-2 | Create a legitimate backlink/digital-PR pipeline: Bangladesh beauty publications, brand/supplier partner pages, blogger reviews, expert contributions, and unlinked-brand-mention outreach. Track target, contact, placement, URL, and outcome; no bought or disguised links. | [O]+[C] | 🔲 open |
| GROW-3 | Build an approval-first cross-platform syndication workflow that repurposes owned content for Meta, TikTok (after app approval), LinkedIn, YouTube Shorts, and other suitable channels without duplicate spam. | [X]+[C] | 🔲 open; Meta partial, TikTok gated |
| GROW-4 | Reddit community marketing: establish the real Emart profile, identify relevant Bangladesh/beauty communities and rules, monitor questions, and draft disclosure-safe helpful responses. No vote manipulation, sockpuppets, mass posting, or link drops. | [O]+[C] | 🔲 open; Pixel only today |
| GROW-5 | Add optional trend/news ingestion to blog topic discovery (Google Trends/approved news source), with relevance, freshness, Bangladesh intent, duplication, and editorial-review gates. Google News-specific sitemap/API work only if Emart develops a genuine news publishing cadence. | [A]+[C] | 🟦 optional after GROW-1–4 |

### SEO — Striking-Distance Command (2026-06-24)

**Why:** Pages ranking 11-20 have the highest ROI for page-1 promotion — Google already trusts them enough to show on page 2, so small on-page improvements (H1 alignment, inbound internal links, content depth on the answering section) consistently push them to page 1. The GSC tracker scores position 11-20 at only 0.8 weight because the system was built for CTR optimization on existing top-10 winners, not for page-2→page-1 promotion. A dedicated `striking-distance` command surfaces these pages sorted by impressions with their top queries, so the team can act on them without manual JSON filtering. Today: 185 pages sit in position 11-20.

| ID | Item | Owner | Status |
|---|---|---|---|
| SD-1 | Add `striking-distance` subcommand to `gsc_tracker.py` — filter pos 11-20, sort by impressions, show top query per page | [C] | ✅ 2026-06-24 — 185 pages surfaced; run `python3 gsc_tracker.py striking-distance` |

### 🟢 ONGOING — Product Description Humanization via Opus Humanizer Engine (2026-06-23)

Reusable content-class at `workspace/humanizer/engine/` reproduces Opus-4.8 PDP copy on **free**
OpenRouter models (gemma-4-31b-it:free chain), GMC-safe + AI-residue-free, gated by `residue_lint.py`
(PASS = ≥80 + GMC-clean + residue-clean). Owner-directed handoff target = **Hermes agent**.

- **State:** 122/~1,500 target serum/sunscreen/cream/lotion products humanized (`_emart_humanized=1`).
- **Run (safe to close laptop):** `bash workspace/humanizer/engine/run_detached.sh <LIMIT>` — detached,
  auto-applies PASS rows + revalidates `tag:products` + **Telegram ping on completion**.
- **Blocker:** OpenRouter PAID credits exhausted (402) → using free models w/ rate-limit backoff;
  **owner will add funds + notify** for faster/Hermes runs. Free key auto-read from
  `/root/.openclaw/credentials/openrouter_default.json`.
- **Self-improvement:** scores logged to `scores.jsonl`; promote PASS≥92 into `exemplars.jsonl`.
- **Refs:** `OPUS_STYLE_SPEC.md`, `README.md`. Holdout (212 GSC slugs + ids 2591/2611/4064) auto-excluded.
- **Minor follow-up:** `run_detached.sh` passes secrets via process env (visible in `ps`); fine on this
  single-owner root VPS, harden to an env-file later if multi-user.

### Integrated Analytics Audit (2026-06-22, GA4+GSC+GMC)

Data sources: GA4 API (property 310219799), GSC API (sc-domain:e-mart.com.bd), GMC API (merchant 436245109).
Report script: `workspace/scripts/active/ga4_report.py [days]`
Full GMC disapproved list: `workspace/audit/active/gmc-disapproved-20260622.md`

| # | Sev | Finding | Owner | Status |
|---|---|---|---|---|
| D1 | ~~Crit~~ | ~~Zero-click rank-1 queries~~ — REFRAMED: titles/snippets fine; real issue was ranked-but-404 URLs. Validated old 26-row map vs live (24 already fixed Jun 17). | [C] | ✅ `c3dd2f6` — 3 verified redirects live (/brands/care-nel, /brands/rohto, Bengali sunscreen blog); 2 wrong-shade makeup 404s left as-is |
| D2 | ~~High~~ | ~~Striking-distance queries~~ — `/best/*` titles already match queries exactly (e.g. "Best Face Wash for Oily Skin in Bangladesh 2026"); this is a ranking/authority gap, not a metadata fix | [C] | ✅ no code fix needed; needs links/content depth over time |
| D3 | ~~High~~ | ~~GA4 tag 8.9s delay~~ — confirmed `tfd=8892` via live trace; lost mobile bounce sessions ~20% | [C] | ✅ `c3dd2f6` — GA4 now `afterInteractive`, merchant badge stays deferred 30s |
| D4 | High | **High-bounce landing pages** — `/concerns/sunscreen` 71% (was nonsense template fill: "Can sunscreen help with sunscreen?"). `/skin-type/oily` 80% is 5-session noise (content already rich). `/best/cleanser` + `/brands/cerave` are ranking, not content. | [C] | ✅ `46088aa` — sunscreen rewritten (SPF/PA, skin-type fit, application, climate); others no-op |
| D5 | ~~Med~~ | ~~GMC 309 small images~~ | [X] | ✅ 2026-06-23 — all 309 mapped products received exact-source enhanced images at ≥1200px; originals preserved; product cache revalidated; GMC full sync completed 3,595 synced / 30 excluded / 0 errors |
| D6 | Med | **GMC 83 disapproved** — healthcare claims (15), identity/belief shade names (25), personal hardships (38), illegal drugs (2), other (3). Fix 1-by-1 by sales potential | [C]+[O] | 🟡 7 unavailable removed; 83 remain; list at `gmc-disapproved-20260622.md` |
| D7 | ~~Med~~ | ~~Germany bot traffic~~ — REFRAMED: 1,722 are Safari/iOS Apple Private Relay (REAL Bangladeshi iOS users masked as Germany); only /checkout 0%-eng cluster is synthetic | [O] | ✅ analyzed; DO NOT country-filter; use Bangladesh segment in `ga4_report.py`; see `OWNER-ACTIONS-20260623.md` |
| D8 | Low | **AI Assistant is #2 BD channel** (334 sessions/14d) — `/brands/*` and `/best/*` pages drive most AI traffic; expand coverage | [C] | 🔲 ensure all active brand pages have rich content |
| D9 | ~~Low~~ | ~~http://www leaking~~ — www→non-www 301 already correct; http://www is a historical 2-hop that resolves to https://non-www | [C] | ✅ verified non-issue; optional CF one-hop rule is owner dashboard |

### Audit Findings (2026-06-20 reconciliation)

Counts reconciled: MySQL/WC REST/Qdrant/Sitemap all 3,625. URL prefix `/shop/` consistent across all 7 systems. Embed model confirmed `all-mpnet-base-v2` 768-dim.

| # | Sev | Finding | Owner | Status |
|---|---|---|---|---|
| F1 | ~~Crit~~ | ~~cmd_fix_titles() auto-writes truncated titles nightly~~ | [C] | ✅ `98ccdea` — propose/review/apply pipeline; 5 titles reverted |
| F2 | High | `emart-embed` 2.2GB RAM; reranker ~90s cold start; no fetch timeout in `tools.ts`; `maxDuration:60` < cold start | [X] | 🟡 fetch timeouts/config added; cold-start RAM still ops concern |
| F3 | High | `system_state.py`: 403 health check, agent bus misparse, stopped jobs shown as failures | [X] | ✅ verified manually: live HTTP 200; expected stopped PM2 jobs separated |
| F4 | Med | Qdrant sync: no deletion of unpublished products; watermark race; state file missing | [X] | ✅ code fixed: state file, 5-min watermark rewind, full-sync stale deletion |
| F5 | Med | `CONTENT_STANDARD.md` pa_brand says ~100% but actual is 3,589/3,625 | [X] | ✅ corrected to reconciled 2026-06-20 counts |
| F6 | Med | `SEO_MASTER.md` says both 1,084 and stale 1,161 for pa_concern; dead CSV ref | [X] | ✅ corrected active pa_concern gap text |
| F7 | Med | `QDRANT_URL` hardcoded in 3 files — no single source | [X] | ✅ shared `aiServiceConfig.ts` |
| F8 | Med | Embed/rerank URLs hardcoded in `tools.ts`, silent empty results if down | [X] | ✅ shared embed/rerank config + request timeouts |
| F9 | Low | 6 stopped PM2 processes create monitoring noise | [X] | ✅ expected-stopped PM2 jobs separated from unexpected failures |

### AI Plan — Open Items

Numbering here is legacy AI-plan ordering, not the main priority lane. Use `AI #` to avoid confusing it with Main Priority 5/6.

| AI # | ID | Item | Owner | Status | Effort |
|---|---|---|---|---|---|
| 1 | AI-6 / P3b | Search: dynamic trending + typo correction | [X] | ✅ dynamic `search-trends.json` API fallback + typo/Bangla query expansion | Medium |
| 2 | AI-7 / P3d | Back-in-stock notification (PDP "Notify me" → MailPoet) | [X] | ✅ PDP UI + `/api/back-in-stock` → MailPoet subscribe path | Medium |
| 3 | AI-8 / P4a | Auto pa_concern: skincare-only review queue; 279 held rows, non-skincare stays blank | [X]+[O] | 🟡 review-gated; no Woo writes without owner approval | Medium |
| 4 | AI-9 / P4b | SEO scoring: full-catalog cron + Telegram alerts | [C] | ✅ existing `gsc_tracker.py full/actions` + Telegram delivery verified in code | Small |
| 5 | AI-10 / P2c | Chat: Bangla search + model routing | [X] | ✅ Bangla/typo query expansion + optional `OPENROUTER_BANGLA_MODEL` routing | Medium |
| 6 | P2d | Chat: proactive PDP suggestions | [X] | ✅ PDP nudge prompts Emart AI for matching products/routine | Small |
| 7 | P4.skin | Auto pa_skin_type for skincare products only from _emart_ingredients (rule-based) | [X] | 🟡 proposal/apply-reviewed workflow ready | Small |
| 8 | P4.ingr | Auto pa_ingredient for skincare products only from _emart_ingredients (regex) | [X] | 🟡 proposal/apply-reviewed workflow ready | Small |
| 9 | AI-OPS1 | Restart competitor price checker PM2 job | [X] | ✅ restarted; 25 checked, 9 undercuts, Sheets updated | Trivial |
| 10 | AI-OPS2 | Recreate Qdrant sync state file (next run = full resync) | [X] | ✅ `.qdrant_sync_state.json` recreated with null watermark | Trivial |
| 11 | AI-UX1 | Chat conversion audit: mobile concern chips + safe product/blog/category link rendering; no root placeholders/raw code | [X] | ✅ `70da8e9` deployed live; `/` placeholder blocked in system prompt; relative markdown links render in chat | Small |

### Live SEO/UI Audit Follow-ups (2026-06-20)

| # | Item | Owner | Status |
|---|---|---|---|
| UX-1 | Emart AI Assistant concern chips: Oily, Dry, Acne, Dark Spots, Sunscreen | [X] | ✅ live via `70da8e9` |
| UX-2 | Emart AI Assistant link safety: never use homepage/root placeholders for specific recommendations | [X] | ✅ live via `70da8e9` |
| UX-3 | Emart AI Assistant "E" logo display | [X] | ✅ already present; keep verified in chat launcher |
| UX-4 | PDP + chat trust CRO plan: add compact post-ATC trust microcopy and strengthen AI authenticity/in-stock recommendation rules | [X] | 🔲 plan first; no code changes until owner approves exact copy/placement |
| SEO-1 | Product title cleanup for raw/lowercase catalog titles | [O]+[X] | 🟡 propose/review/apply only; no blind Woo title writes |
| SEO-2 | Journal internal-link cluster proposals from articles to product/category pages | [X] | 🔲 next safe automation batch |
| SEO-3 | Category-page target map and coverage audit: list only canonical, indexable categories; assign one primary query plus supporting intent from GSC; verify title, meta description, H1, slug, intro, guide word count, H2s, FAQ usefulness, and internal links. Flag slug/H1 mismatch for review—do not rename URLs automatically. | [X]+[C] | 🔲 audit first; coordinate with GROW-1 |
| SEO-4 | Expand buying guides only for high-value categories selected by GSC impressions, revenue relevance, catalog depth, and content gap. Aim for enough original buyer-helpful coverage—not a blanket 400–500-word quota. First candidates from the audit: Body Wash and other thin active categories; preserve Face Cleansers/Sunscreen unless evidence shows a gap. | [C]+[O] | 🔲 proposal/review before content changes |
| SEO-5 | Add contextual links from approved category guides to genuinely related canonical categories, concerns, ingredients, routines, `/best`, and `/compare` pages; add visible FAQs only where real category-specific questions exist, with matching schema only when eligible. No boilerplate or mass link blocks. | [C] | 🔲 staged after SEO-3 |
| SEO-6 | Education-content scanability subtask under existing M6: split the 15 ingredient and 9 concern pages' oversized single-paragraph H2 bodies into answer-first 2–4-line paragraphs and useful lists where natural, preserving facts, links, headings, visible FAQs, and matching schema. Audit the first four priority pages before proposing bulk changes. | [C]+[O] | 🔲 audit/proposal; extends M6 without duplicating it |
| SEO-7 | Add a read-only structural QA report for imported Woo PDP descriptions and WordPress blog HTML: one meaningful H1 at template level, logical H2/H3 order, direct first answer, paragraph-length outliers, list opportunities, broken/irrelevant internal links, and FAQ duplication. Produce proposals only; never auto-rewrite published content. | [X]+[C] | 🔲 open; report-only first pass |

### Content Pipeline (spec: `workspace/CONTENT_STANDARD.md`)

| Item | Status |
|---|---|
| Product onboarding proposal tool (`product_onboarding.py`) | 🟡 review-gated apply ready; no fresh LLM response can write directly |
| Hybrid humanizer: 800-1,200 word descriptions (60% auto-fill + 40% LLM) | 🟡 proposal generation added; owner review required before write-back |
| FAQ generation: 5 Q&A per product, product-specific | 🟡 proposal generation + strict 5-Q/A validation ready |
| Meta validator stale stylistic issues | ✅ clean 2026-06-20: regenerated full catalog validator, fixed final 2 rows, now 0/3,625 flagged |

### Phase 5 — Omnichannel Agent (BLOCKED)

Meta Business verification REJECTED. No `pages_messaging` or `whatsapp_business_messaging`.

| ID | Item | Status | Gate |
|---|---|---|---|
| AI-11 | WhatsApp Business API webhook | 🔲 BLOCKED | Meta verification or BSP ($30/mo) |
| AI-12 | Facebook Messenger webhook | 🔲 BLOCKED | Meta verification |
| AI-13 | Mobile app chat screen | 🔲 | AI-11/12 first |
| AI-14 | Conversation analytics | 🔲 | AI-11/12/13 live |
| AI-15 | Bangla language tuning | 🔲 | AI-10 first |

Workarounds: (1) ✅ Meta Business Agent (no-code, owner turns on), (2) 🔲 Telegram customer bot (free), (3) 🔲 WhatsApp BSP (WATI/Interakt ~$30/mo).

### Owner Items

| # | Item | Status |
|---|---|---|
| O-1 | pa_concern: review only skincare-like held rows (279); leave makeup/hair/tools/supplements blank | 🔲 |
| O-2 | `/origins/[country]` editorial: only 3/22 countries have copy | 🔲 |
| O-3 | Product comparison pages (`/compare/`) — curate 20-30 pairs | 🔲 |
| O-4 | "Best [X] in Bangladesh" topics — approve list | 🔲 |
| O-5 | Skin-type pages: confirm whether to build (4 pages max) | 🔲 |
| O-6 | Product images: 3-5 angle shots per top-100 | 🔲 |
| O-7 | Blog content velocity (generator ready, owner controls pace) | 🔲 |
| O-8 | GBP: claim/verify at Dhanmondi; fix Bangla name | 🔲 |
| O-9 | Social profile bios → link to e-mart.com.bd | 🔲 |
| O-10 | Beauty blogger/influencer outreach (5-10 BD reviewers) | 🔲 |
| O-11 | Structured review collection: target 100+ reviews in 60 days | 🔲 |
| O-12 | Reddit/LinkedIn sameAs: provide real profile URLs | 🔲 |
| O-13 | PDP 404 redirect map: 18 review-only + 52 no-match candidates | 🔲 review |
| O-14 | Google-Extended bot policy: keep allowed or block? | 🔲 decision |
| O-15 | Meta Page publishing: three-month Page token validates and publishes to FB+IG. Regenerate it with `pages_manage_engagement` and `instagram_manage_comments` so buying links can be added as first comments. | 🔴 comment permissions needed |
| O-16 | TikTok Developer app: pending approval; share Client Key + Client Secret once approved → Claude builds OAuth + publish pipeline | 🔲 pending TikTok review |

### Codex — Open

| Item | Status |
|---|---|
| X6 — VPS disk cleanup: Claude completed cleanup after Codex audit; disk now 63/96 GB used (66%, 34 GB free). | ✅ complete |
| X2 — Impression-priority humanizer: monitor GSC, generate new JSONL batch | 🔲 |
| X3 — Mobile M0: real device checkout smoke → EAS production AAB → Play Store | ⏸️ parked unless owner reopens mobile; ADB blocked |
| X4 — Social publishing: **2026-06-25** FB (`emart-fb-18-20260625`, online) + IG (`emart-ig-18-20260625`, online) 18-post campaign 10:15-23:00 BDT. FB comment worker (`emart-fb-comment-20260625`) stopped — Meta `pages_manage_engagement` permission missing (see O-15), so FB captions use inline product links instead. 2026-06-24 campaign completed; its PM2 processes are stopped. | 🟡 active today; comment permission blocked (O-15) |
| X7 — AI video engine: Phase 0 local reel engine built; direct Google dropped from default path. Scripts now use OpenRouter free Gemma fallback (`google/gemma-4-31b-it:free` proven), QA defaults to local ffprobe; sample reel live at `/public/videos/reels/20260624-gemma-boj-relief-sun-sample.mp4`; reusable Emart model clean portrait generated at `workspace/video-engine/personas/emart-model/clean-portrait.png` (1080x1920, bridge queue empty). Live publish remains owner-gated. | 🟡 publish gated |
| X8 — Social Engine v1: `workspace/social-engine/` creates review-gated FB/IG plans, duplicate/yesterday guards, caption checks, scheduler previews, and optional video jobs. `--vision-qa` now performs real free OpenRouter image inspection for product identity, visible price, dummy products, model-hand placement, and layout; it deduplicates reused assets, runs four checks concurrently, and blocks on fail/unavailable. Manual attestation remains the explicit offline fallback. Product picker/history hook/IG 4:5/contact sheet/design-source QA are now implemented. | 🟡 core review loop stronger; X8a insights import and X8c approval-status semantics still open |
| X8a — Social Engine performance loop (audit F2): `record` subcommand exists, live `meta_schedule.js --record-history` can append published campaigns after a completed publish loop, and product picking can use optional read-only performance JSON scores by product/slug/brand/category while still avoiding recent history. Remaining gap: import real Meta/GA4/GSC/GMC performance signals (reactions/comments/clicks/sales proxy) into that score file automatically. | 🟡 partial |
| X8b — Social Engine IG 4:5 asset generation (audit F3): `plan --make-ig-variants` now creates 1080×1350 Instagram derivatives from 1080×1080 source assets and rewrites Instagram image references in the review pack. 2026-06-25 daily pack generated 18 square + 18 IG 4:5 assets; slots 11-18 were replaced with Ayesha persona model-held product creatives, slot 16 was corrected to the tall CeraVe tube, and FB/IG schedulers are running for 10:15-23:00 BDT. | ✅ complete |
| X8c — Social Engine `approval_status` is dead (audit F4): the campaign's `approval_status` (e.g. `approved_for_scheduled_run`) is normalized onto items but the publish gate hardcodes `approval_required: True` and always prints `review_required`. Field is misleading — either honor it (with safe guardrails) or drop it. | 🔲 open |
| X9 — Selective `stop-slop` adoption: `emart-stop-slop-v1` adds soft warnings for throat-clearing, vague claims, jargon, meta-commentary, formulaic contrast, and staccato rhythm. Preserves AEO questions, useful adverbs, limited em dashes, and GMC gates. Four tests pass; gold exemplars remain mean 94.0; fixed JSONL summaries to count hard-gate failures correctly. Humanizer only—blog/social require separate review. | ✅ complete |
| X10 — Bangla blog anti-slop capacity pilot: review-only sunscreen guide saved at `workspace/audit/active/bangla-blog-stop-slop-pilot-20260624.md`. QA: 862 words, H1 1, H2 6, FAQ 3, internal links 3 (all live 200), bullets 8, numbered steps 4, maximum paragraph 59 words, zero banned-residue/medical-claim hits. No WordPress action. | ✅ complete; awaiting owner content review |
| X11 — Plain-English blog capacity pilot: initial readable draft passed prose QA but failed full business/SEO readiness due duplicate intent, no product-body links, and incomplete schema coverage. Now being converted into a rewrite/conversion package for existing post ID 94840 using current GSC and verified in-stock products; never publish as a new URL. | 🟡 revision in progress |
| X5 — SEO cron state hygiene: retained the valid 2026-06-23 GSC/state refresh and fixed `system_state.py` treating the em-dash placeholder as an active agent. | ✅ complete |
| Mobile BFF gaps: `/api/mobile/cart` and `/api/mobile/payment` return 404 | ⏸️ out of scope per owner: "EXCEPT MOBILE APP" |

### System Orchestration Audit — 2026-06-24

| ID | Priority | Item | Status |
|---|---|---|---|
| ORCH-1 | Critical | Deploy hardened: `deploy.sh` now has deploy lock (PID-based, stale-safe), `git add -u` + explicit subdirs (not blanket `-A`), lockfile diff BEFORE rsync, `.next` rollback backup on VPS build failure, workspace rsync excludes `jobs/` + state/checkpoint files, removed `git clean -fd`. | ✅ 2026-06-25 |
| ORCH-2 | High | Create one versioned runtime manifest for every Emart PM2 process and scheduled job, including cwd, timezone, owner, restart policy, resource limits, expected lifecycle, and install/reconcile commands. Current Git manifest covers only `emartweb`; root crontab and most PM2 jobs are ad hoc. | 🔲 open |
| ORCH-3 | High | Repair and finish video orchestration: cron must use an absolute path/cwd; add a real review→approval action; decide whether approved jobs require an explicit live publisher; add a global worker lock, retry budget/dead-letter state, atomic checkpoints, and publish idempotency. | 🔲 current orchestrator/publisher logs absent; approval adapters not implemented |
| ORCH-4 | High | Replace presence-only monitoring with freshness/SLO monitoring: last successful run, duration, queue age, retry count, error class, commercial endpoint health, and alert recovery. Stop maintaining a hard-coded expected-stopped PM2 list. | 🔲 open |
| ORCH-5 | High | Credential blast radius reduced: all 12 OpenClaw scripts now load from `openclaw.env` via shared `creds.py`; no hardcoded secrets in source. **PM2 env leakage remains:** `n8n` process has OPENROUTER_API_KEY + N8N_BASIC_AUTH_PASSWORD in PM2 metadata (inherited from shell). Fix: recreate PM2 processes with explicit `filter_env` or ecosystem config at next maintenance restart. Dedicated user deferred (single-owner VPS). | 🟡 scripts fixed; PM2 env + owner key rotation pending |
| ORCH-6 | High | Complete disaster recovery: keep encrypted off-server DB/uploads backups, fail closed on dump/tar errors, verify checksums, document RPO/RTO, and perform a periodic isolated restore drill. Current archives pass gzip/tar integrity but remain on the same VPS and no restore drill was found. | 🔲 open |
| ORCH-7 | Medium | Add CI for typecheck, lint, unit/integration tests, build, dependency/security checks, deploy-script tests, and orchestration state-machine tests. Keep production deployment owner-controlled until a safer release mechanism exists. | 🔲 no GitHub workflow; storefront test coverage minimal |
| ORCH-8 | High | Standardize durable automation queue/state handling across video, social, blog, humanizer, GSC/SEO, Qdrant and future workers: one lock per worker/domain, atomic state writes, idempotency keys, retry budgets, dead-letter queues, manual replay, checkpoint schema, and append-only audit trail. ORCH-3 remains the video-specific fix; this is the shared engine contract. | 🔲 verified gap: current workers mix file queues, checkpoints, cron/PM2 state and approval files without one global state-machine standard |

### SEO System Orchestration Audit — 2026-06-24

| ID | Priority | Item | Status |
|---|---|---|---|
| SEO-ORCH-1 | Critical | Repair SEO prioritization inputs before acting on them: run/maintain complete catalog-wide agentic scores, align tier contracts (`THIN/PARTIAL/STRONG/GOLDEN`), use a durable completed-content registry instead of inferred tiers, and normalize legacy `/product/` plus query URLs into their canonical URL before aggregating GSC metrics. | 🟡 partial 2026-06-25: canonical GSC merge + durable completed-content registry added; humanizer queue now reports 317 completed registry products / 97 GSC-visible completed / 402 needs work. Remaining: full catalog agentic scoring and tier contract alignment. |
| SEO-ORCH-2 | High | Replace daily overwritten `actions.json` with a durable SEO work ledger: stable action ID, canonical URL/entity, evidence snapshot, proposed change, owner, approval state, dependency, due/SLA, execution record, rollback pointer, verification state, and final outcome. Deduplicate recurring findings and escalate stale approvals such as the 21 pending title proposals. | 🔲 open |
| SEO-ORCH-3 | High | Schedule one read-only technical SEO control loop: catalog↔sitemap↔Qdrant parity and historical count deltas, representative plus rotating URL samples, metadata/schema/canonical/404/redirect-chain/query-policy/news-sitemap checks, internal-link/orphan crawl, GSC index/URL-inspection coverage, Core Web Vitals/CrUX, and last-success freshness alerts. | 🔲 current deploy gate passes but samples only one URL/type; deeper audits are unscheduled; `emart-seo-autoscan` is stopped/report-only and the nightly `full` run excludes the separate on-page/live technical audit |
| SEO-ORCH-4 | High | Build a closed-loop measurement layer joining GSC with GA4 organic landing-page engagement/conversions, order/revenue value, availability/catalog depth, GMC health, and change annotations. Use pre-change baselines, holdouts where practical, 7/28-day reviews, confidence thresholds, and keep/iterate/revert decisions. | 🔲 GA4 reporter exists separately; no SEO change ledger or experiment/outcome loop |
| SEO-ORCH-5 | High | Unify content lifecycle: demand/intent and cannibalization check → brief → draft → factual/brand/claim/link/schema QA → human approval → publish → cache revalidation → sitemap/index verification → performance review. The GSC topic feed must create drafts, never hand topics to a direct-publish blog path. Include imported Woo PDP/blog HTML structural QA before rewrite proposals. | 🔲 current external blog generator publishes with `status=publish`; review gate absent; overlaps WA-H and SEO-7 report-only QA |
| SEO-ORCH-6 | Medium | Establish one versioned URL-policy registry consumed/tested by middleware, metadata, robots, sitemap, redirects and audit tools. Decide crawl/index/canonical behavior for every supported query parameter and detect drift; Googlebot currently bypasses generic robots query disallows while representative filter URLs return `index, follow` with a clean canonical. | 🔲 42 parameter URLs present in latest GSC page rows |
| SEO-ORCH-7 | Medium | Add governed off-page/entity/AEO operations: backlink and mention inventory, outreach/GBP/social-profile/review workflow with ownership and proof, toxic/spam review, AI citation/referral monitoring, and conversion attribution. Keep all external publishing/outreach approval-first. | 🔲 tasks exist, but no operating ledger or measurement loop |

### UI/UX System Orchestration Audit — 2026-06-25

Audit-only origin: mobile screenshots/static scans showed a polished storefront with weak experience-control systems.
These tasks do not authorize protected commerce-data changes. Before 2026-07-03, keep work to audits, contracts,
instrumentation specs, non-invasive monitoring, and owner-reviewed proposals unless the owner explicitly approves
the exact visible change.

| ID | Priority | Item | Status |
|---|---|---|---|
| UX-ORCH-1 | Critical | Create a storefront trust-data contract for all UI claims that imply “live”, “verified”, “stock”, “reviews”, “sold”, “active viewers”, or social proof. Each claim must map to a real data source, explicit fallback label, cache age, and owner-approved wording. Remove or relabel synthetic/fallback counters before scaling CRO. | 🟡 contract done 2026-06-25: `workspace/docs/audits/storefront-trust-data-contract-20260625.md`; verified deterministic fallback values and hardcoded social-proof/testimonial surfaces. Pending owner-approved visible relabeling/source-flag implementation; no stock/price/Woo writes. |
| UX-ORCH-2 | High | Define a UX event schema and tracking ledger for product-list view/select, search query/no-result, filter/sort use, PDP gallery/sticky CTA, wishlist/back-in-stock, chat/WhatsApp, quiz/routine, coupon/shipping/payment validation errors, and mobile overlay interactions. | 🔲 current commerce analytics cover core purchase funnel only; checkout/cart/payment instrumentation requires owner-approved exact scope |
| UX-ORCH-3 | High | Add a read-only visual QA matrix for mobile and desktop home, shop/category, PDP, search, journal, and key campaign slots: screenshot capture, overlay collision checks, first-screen content visibility, sticky CTA/bottom-nav/chat conflicts, and before/after diff evidence. | 🔲 audit/proposal first; no broad visual refactor during freeze |
| UX-ORCH-4 | High | Enforce design-system governance: measure and reduce raw buttons/inputs, hardcoded colors, arbitrary color classes, typography drift, and duplicated product-card/CTA patterns; prefer shared tokens/components with visual parity checks. | 🔲 verified drift: design-system exists but is weakly adopted; defer mass component refactor until post-freeze unless no visible change |
| UX-ORCH-5 | High | Add frontend experience health monitoring: web-vitals/RUM, route error reporting, unhandled promise/window errors, API failure rates, hydration/runtime exceptions, and route-level last-good health. | 🔲 current error boundaries mostly log locally; choose provider/config without exposing secrets |
| UX-ORCH-6 | High | Build campaign/promotion orchestration for hero, offer rails, flash messaging, social campaign assets, and expiry: owner, source data, start/end, preview, approval, rollback, linked metric, and stale-content alerts. | 🔲 current campaign surfaces are partly hardcoded/rolling; no price/discount automation without explicit request |
| UX-ORCH-7 | Medium | Create an experiment/feature-flag registry for UX changes: hypothesis, audience, variant, holdout, metric, minimum runtime, rollback condition, owner approval, and outcome. | 🔲 no auto-randomized UI or self-optimizing changes until measurement and approval gates exist |
| UX-ORCH-8 | Medium | Add automated accessibility gates: axe/keyboard/focus/contrast checks on representative mobile/desktop journeys, with issue severity, owner-visible screenshots, and route/component ownership. | 🔲 some ARIA/skeleton/focus care exists, but no systematic CI/audit gate |
| UX-ORCH-9 | Medium | Close the customer-feedback loop: taxonomy for UX complaints, search failures, chat misses, review/support themes, “could not find product” signals, and post-purchase friction; feed prioritized issues into the UX/SEO/action ledgers. | 🔲 approval-first for any new customer-data collection or support workflow changes |

### Backlog (post-freeze Jul 3+)

- UCP/MCP commerce endpoint (gated: reviews > 200, currently ~16)
- Review sentiment analysis (gated: reviews ≥ 100)
- `getSeoDescription()` fallback: add `product.description` first-155-chars tier
- Critical CSS inlining (critters) — medium effort/risk
- `/brands` page 785KB — lazy-load logos or paginate
- GCP service account key rotation (fingerprint ce8b30ba + ga4-reader db98ee6c)
- `begin_checkout` GA4/Meta event: fires before Zustand cart rehydration — needs cart/checkout fix

---

## ✅ COMPLETED — Summary

### Phase 1 — Foundation (all done)
- [x] P1.1 Reranker endpoint (`embed_service.py /rerank`)
- [x] P1.2 Reranker wired to chat (`tools.ts rerankResults`)
- [x] P1.3 Cross-sell PDP rail (pre-existing `getSimilarAndCrossSell`)
- [x] P1.4 Incremental Qdrant sync (`qdrant_product_sync.py`)
- [x] P1.5 Title review gate (`98ccdea` — propose/review/apply)

### Phase 2 — Chat Intelligence (3/5 done)
- [x] P2a Session memory — `sessionStore.ts` (Codex, 2026-06-20)
- [x] P2b Routine builder — `/routine/[step]` (Codex, 2026-06-20)
- [x] P2e Product cards + quick replies — `ChatProductCard.tsx` (Codex, 2026-06-20)

### Phase 3 — Storefront (1/3 done)
- [x] P3c Recently Viewed rail — `RecentlyViewedRail.tsx` (Codex, 2026-06-20)

### Audit Remediation R1-R20 (all closed)
R1-R19 done 2026-06-11. R12/R18 done 2026-06-17. R20 re-audit: **A+**.
Full detail: `workspace/docs/audits/EMART_AUDIT_20260610.md`, `EMART_REAUDIT_R20_20260617.md`

### Owner Items (all closed)
1-8 (MailPoet, Meta CAPI, GSC URLs, Cloudflare, GMC exclusions, images) — all resolved by 2026-06-15.
9 pa_concern: 13+57 applied, 1,084 remaining (moved to open).
10-17 (OpenClaw, "original" metas, duplicates, images L-A, R3 CF Access, stale PM2, VPS git) — all closed.

### Claude C1-C8 (all closed)
C1 blog generator, C2 sameAs, C3 SEO note, C4 GEO/AEO, C5 deploy gate + LLM docs, C6 Reddit pixel, C7 login/auth, C8 GA4 landing-page audit.

### SEO/Content (2026-06-20 session)
GSC tracker 9-command pipeline, Telegram dual delivery + 7 commands, Review schema on PDPs, CONTENT_STANDARD.md, AI_PLAN.md, URL structure audit, SERP competitor analysis.

### Prior Sessions (2026-06-17/18, 2026-06-05)
R12 ISR, R18 homepage links, R20 A+ re-audit, PDP title coverage, PDP FAQ schema, blog generator cron, revenue-health fix, LinkedIn/Reddit sameAs, homepage LCP/TBT pass, checkout hardening, FAQPage on concerns, product schema, agents.md, sunscreen copy, review form, InitiateCheckout, BHA redirects, H2s, internal links, GMC descriptions, humanizer batch, homepage perf.

---

## 🔑 Key Rules

- **WC API Key:** key_id `34` (live BFF, write-gated). Key_ids 2/3/26/32 revoked.
- **Freeze:** Structural/nav frozen until 2026-07-03. Content, data, new features, automation: OK.
- **Deploy:** Local build → commit → rsync → VPS build → pm2 restart → SEO gate → smoke → push.
- **Humanizer priority:** Always by GSC impression count, not category order.
- **GMC sync:** Always last — after all description fixes verified.
- **Title writes:** Propose-only via `gsc_tracker.py propose-titles`. Apply manually after review.
- **Protected data:** checkout, cart, payment, order, customer data, stock, price, WooCommerce DB — never touch without explicit request.
