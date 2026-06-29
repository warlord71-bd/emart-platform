# Emart Task Board
Last updated: 2026-06-29 (Content Orchestrator no-shortcut one-roof setup verified with dry-run image + reel; verification reel black-start/poster and reel-card first/middle/end layout issues repaired/rechecked, including last-card trust-row separation; unused generated media and untracked script residue archived; canonical active helpers tracked; social product-base v6 scheduled via PM2 for 18 FB + 18 IG posts today, plus FB first-comment link worker; first slot 08:00 BDT)
Freeze: 2026-05-22 → 2026-07-03 (structural/nav only — content, SEO, automation OK)
**[C]** Claude · **[X]** Codex · **[O]** Owner · **[A]** Auto/OpenClaw

---

## SEO Source-Of-Truth Standard

- `workspace/SEO_MASTER.md` is the durable SEO source of truth for verified facts, open SEO gaps, owner gates, and "do not revisit" decisions.
- `workspace/TASKS.md` is the execution board: sequencing, ownership, current status, and next action. If a task-board status changes a durable SEO fact, update `SEO_MASTER.md` in the same commit.
- When duplicated SEO rows conflict, prefer the most specific source row first, then `Main Priority Sub-Issues`, then older priority-lane summary rows. Reconcile the older row rather than creating a third duplicate.
- Do not mark live SEO items complete from AI analysis alone. Use build/test for local code completion and live/API/curl evidence for live-status claims.

## 🤖 RUNNING AUTONOMOUSLY

| Job | Status | Notes |
|---|---|---|
| `emartweb` (PM2, :3000) | ✅ online | Next.js 14, v0.39.0 |
| `emart-presence` (PM2, :3011) | ✅ online | WebSocket, 49d uptime |
| `emart-embed` (PM2, :8077) | ✅ online | all-mpnet-base-v2 + bge-reranker-v2-m3, 2.2GB RAM |
| `emart-blog-generator` (PM2 cron) | ⛔ removed | PM2 process **deleted** 2026-06-26 — `cron_restart` was silently running 3x/day even when "stopped", creating `-2` duplicate posts. Slug collision guard added to `blog_generator.py`. Re-add to PM2 **without** `cron_restart` + with `--draft` flag when ready to resume. |
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
| Content orchestrator (crontab, `30 4 * * *`) | ✅ running | `orchestrator.py tick --live-signals --ledger` — build-only, gated, never publishes |
| `emart-hermes` (PM2, :8078/Nginx :8088) | ✅ online | Unified agent dashboard — 22 engines (Hermes ⚡ quick + OpenClaw 🐾 deep), AI brain (free OpenRouter), job tracking, mobile-friendly. Auth: HTTP basic via Nginx. |
| OpenClaw gateway (systemd, :18789) | ✅ online | Full agent platform — DeepSeek/Gemini brain, 12 emart skills, TaskFlow, Telegram, memory. Dashboard: `agent.e-mart.com.bd` |
| SEO rotating check (crontab, `30 3 * * *`) | ✅ scheduled | `seo_rotating_check.py` — Mon=CWV, Tue=URL-policy, Wed=Qdrant, Thu=control-loop, Fri=sitemap, Sat=links |
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
| WA-D | 🟡 | **One-shot dated scripts archived.** Dated scripts rotated to `/root/.attic-*` in prior session; 3 dated PM2 campaign processes (`emart-fb-18-20260625`, `emart-ig-18-20260625`, `emart-fb-comment-20260625`) deleted after confirming all slots expired. | [C] | ✅ 2026-06-25 |
| WA-E | 🟠 | **Video-engine free-output gaps resolved by Claude.** Free bn-BD voiceover, ducked music, browser-shaped captions, populated persona libraries, branded/value cards, and master QA are implemented and verified. | [C] | ✅ complete |
| WA-F | 🟠 | **social-engine gaps** — tracked as X8a (performance loop), X8b (IG 4:5 generation), X8c (approval status semantics) in the Codex — Open block below. F1 (real vision QA) already ✅ in `f01c602`; product picker/history hook/IG variants/contact sheet now implemented. Meta/GSC/GMC/GA4 performance import now writes the picker score file; approval-status publish gates verified. | [X] | ✅ complete |
| WA-G | 🔴 | **Embedded credentials removed from all OpenClaw scripts.** 12 scripts migrated to shared `creds.py` loader reading from `openclaw.env`. `IDENTITY.md` scrubbed. WC key updated to live BFF key_id 34; WC localhost access fixed (Host + X-Forwarded-Proto headers). All cron scripts verified working. **Owner actions remain:** (1) revoke old WP app password `mrVDk8iq...` in WordPress; (2) revoke old WC keys `ck_9d9f...` and `ck_53d4...` if not already; (3) set valid `META_ACCESS_TOKEN` in `openclaw.env` if ads_briefing.py is needed. | [C]+[O] | ✅ 2026-06-25 scripts fixed; owner rotation pending |
| WA-H | 🟠 | **Blog generator draft/review gate implemented.** Live OpenClaw `blog_generator.py` now supports `--draft` (generate + WP draft status) and `--generate-only` (save to file, no WP). Drafts saved to `blog_drafts/` for review. Archived copy hardcoded creds removed. | [C] | ✅ 2026-06-25 |

### Blog Enhancement

| ID | Task | Owner | Status |
|---|---|---|---|
| BLOG-1 | **Blog posts should include a generated featured image** relevant to the topic. Use `social_image_gen.py` or similar compositor to produce a branded blog hero image (topic text + product visual + Emart template). Image spec to be standardized later by owner. | [C] | ✅ 2026-06-28 — `blog_hero_gen.py` built: renders branded 1200×630 OG images via creative engine (blog_og format), auto-detects badge from title, picks product by category, uploads to WP + sets as featured image. Backfill mode (`--backfill --limit N`) for existing posts. 5 test images verified. |

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
| VID-5 | **Platform-split reels fully wired.** `enqueue.py` auto-splits multi-platform specs into per-platform jobs with tuned safe zones; `worker.py` passes `safe_zone` to caption_overlay; `meta_publish.js` publishes to the correct platform per job. `daily_producer.py` enqueues `platforms: ["facebook", "instagram"]` by default. | [C] | ✅ 2026-06-25 |
| VID-2 | **Daily auto-enqueue producer live.** `daily_producer.py` runs via crontab at 5 AM, picks 2 products/day, resource-aware (skips if RAM < 1.5GB). Committed in `e9d9c0b`. | [C] | ✅ 2026-06-25 |
| VID-3 | **WA-D archival done.** Dated scripts rotated, dated PM2 campaign processes deleted. | [C] | ✅ 2026-06-25 |
| VID-6 | **HyperFrames integrated as default reel renderer.** `hyperframes/render.js` builds HTML compositions with GSAP animations (Ken Burns, crossfades, staggered reveals) and renders via HyperFrames CLI. `stages/reel_hyperframes.py` wraps for worker. `worker.py` defaults to HyperFrames, falls back to ffmpeg. `node_modules/` ignored. Post-render ffmpeg loudnorm to -14 LUFS. Verified: COSRX test reel passes QA (1080×1920, 24fps, audio, -14 LUFS). **VPS install needed:** `cd workspace/content-orchestrator/video-engine/hyperframes && npm install`. | [C] | ✅ 2026-06-26 |
| VID-7 | **Post-HyperFrames output-quality gaps resolved into shared Creative Asset Engine.** Product hero, value cards, brand end cards, FB/IG posts, and blog OG heroes now render through `workspace/content-orchestrator/creative-engine/` (`workspace/content-orchestrator/creative-engine` remains only a compatibility link). `worker.py` calls Creative Engine directly; legacy `product_hero_card.py`, `list_card.py`, and `brand_card.py` are compatibility shims. HyperFrames no longer builds product/value/brand HTML; it animates pre-rendered frames + captions/audio only. Product container-shape layout and default 2x high-density render/downsample are implemented. Smoke output: `workspace/content-orchestrator/video-engine/output/creative-migration-smoke.mp4` (1080x1920, local QA score 96). | [X] | ✅ 2026-06-26 |
| VID-8 | **Persona/product-hand standard.** Sample pack created at `workspace/audit/active/creative-usecase-samples-20260626/` covering blog OG → FB/IG → reel frames → local reel. Persona standard documented at `workspace/content-orchestrator/docs/claude-reference/creative-persona-standard.md`: product-first by default; best persona frame = exact real product in hand or beside face; model-only fallback is allowed only when Codex holding-shot generation is pending; white/tile product overlays are rejected as production standard. V2 product-card reels rebuilt 2026-06-26 with voiceover, caption overlays disabled, lower music, product cutout support, and Telegram review messages `25`/`26`. | [X] | 🟡 v2 in owner review; product-hand generation/QA pending |
| VID-9 | **Creative/video quality gates fixed.** Report: `workspace/content-orchestrator/docs/audits/creative-video-quality-audit-20260628.md`. Implemented shared `quality_gates.py`, product-type-aware daily producer templates, enqueue/worker/master-QA content gates, script placeholder/CJK/claim validation, required voice QA, caption authority handling, provider docs/config alignment, secure SSL fetch context, and HyperFrames premium render preset. Invalid COSRX SPF-copy and BOJ placeholder/CJK drafts were moved to rejected; corrected COSRX moisturizer FB/IG jobs are queued. | [X] | ✅ 2026-06-28 |
| VID-10 | **Modern-mobile-safe reel layout.** Owner screenshot showed the general issue: current mobile social apps can overlay/crop the top and bottom of fixed 9:16 reels. Creative Engine vertical frames now keep important product/price/domain/footer content in a central safe band; renderer QA fails 1080x1920 frames when text overlaps product/value/price blocks or drifts into the lower mobile overlay zone. Local product photos now pass through cutout/crop handling. Fresh sample public assets: `/public/videos/reels/sample-mobile-safe-boj-sunscreen-20260628-v2.*`. | [X] | ✅ 2026-06-28 |
| VID-11 | **Owner-first batch approval workflow.** New rule: before any future social/reel generation or scheduling, produce an Excel/CSV-style plan or chat table for owner approval. Include 10-15 products for roughly two days, proposed schedule slots, creative type, design theme, voiceover/script direction, and product/model-shot status. Scheduling/rendering final campaign assets waits for owner approval. Voiceover must be natural simple Bangla/Banglish, not robotic. First reel frame should use an exact-product model holding shot only if generation + identity QA is trustworthy; otherwise use a product-first hero frame. Use one high-quality exact-product image per item; if local/Woo image is missing or weak, fetch a trustworthy exact-product image from the web and record image source in the review pack. Social Engine now records owner-rejected lists via `reject`, blocks rejected memory during `pick`/`plan`, stores rejected visual-design hashes, runs local Creative QA (theme registry, image quality/aspect/detail, OCR, source metadata, rejected design matching), and has `cleanup-assets` for post-campaign generated media archival. Bad/repeated June 28 packs recorded as rejected; corrected fresh pack generated at `workspace/audit/active/social-reel-approval-20260629-fresh/`. June 30 sized approval pack generated at `workspace/audit/active/social-reel-approval-20260630-18-post-6-reel-after-approval/` with 18 FB/IG posts, 6 reel queue candidates, rendered FB 1:1 + IG 4:5 assets, QA pass, and `review_required` publish gate. Reference-inspired Creative Engine theme prototypes generated for owner review at `workspace/audit/active/creative-theme-prototypes-20260628/final-prototype-contact-sheet.jpg`; not applied to pipeline yet. | [X]+[O] | 🟡 awaiting owner approval/edits before live scheduling/publishing |

### Content Orchestration (CO) — strategy brain over the engines (2026-06-26)

The merchandising brain above Creative/Social/Video/blog/SEO. Maps the owner's selling themes to
demand signals and dispatches native, gated job specs. Dry-run; never publishes, never writes Woo.
Code: `workspace/content-orchestrator/`. Model: `docs/claude-reference/content-orchestrator.md`.

| ID | Item | Owner | Status |
|---|---|---|---|
| CO-1 | **Content Orchestrator core built.** `themes.json` (12 selling themes), `orchestrator.py` (`themes`/`plan`/`dispatch`/`manual`/`learn`/`status`). Reads real demand from `social-engine/performance/latest.json` + GSC striking-distance; emits social/video/brief job specs parked at campaign/content/owner gates. Smoke passed. | [C] | ✅ 2026-06-26 |
| CO-6 | **Self-improving loop + LLM brain built.** `learn` scores themes from action-ledger outcomes → `theme_weights.json` (per_run multiplier, planner consumes; cadence stays owner-gated). `brain.py` optional LLM angle/caption + tuning reflection, reusing humanizer's OpenRouter free chain (no new secret); Hermes via `OPENROUTER_MODEL`, OpenClaw via `OPENCLAW_BASE_URL`. `--llm` verified live (real hook generated). | [C] | ✅ 2026-06-26 |
| CO-2 | **4 live read-only Woo resolvers built** in `woo.py` (reuses Social Engine `woo_get`): new-arrivals (orderby=date), clearance (`on_sale=true` — reflects REAL Woo sale prices, not fabricated), category pick (slug→id, makeup/skincare filters), concern pick (pa_concern attribute/term). Verified live: 8/8 real candidates; clearance items confirmed genuinely on-sale. | [C] | ✅ 2026-06-26 |
| CO-3 | **Slug→product_id resolution done.** `--live-signals` resolves perf-file slug candidates via Woo `products?slug=`; live resolvers return numeric ids natively. | [C] | ✅ 2026-06-26 |
| CO-4 | **Auto-ledger done.** `dispatch --ledger` writes one action-ledger entry per item with `sub_category=theme` + `related=theme`; verified `learn` groups by it ("1 themed outcome"). Weight moves only when entries reach keep/revert outcome status (by design). | [C] | ✅ 2026-06-26 |
| CO-5 | After owner approves cadence, add a build-only gated `--tick` cron (no publish). | [O]→[C] | ✅ 2026-06-28 — `tick` subcommand added to orchestrator (plan today + dispatch, dry-run, gated). Crontab: `30 4 * * *`. First tick: 26 items (20 social, 18 video, 8 briefs) parked at gates. Never publishes. |
| CO-8 | **One-roof engine/content workspace relocation.** Creative Engine, Social Engine, Video Engine, shared scripts/docs/generated-assets/social-calendar/design-changes now physically live under `workspace/content-orchestrator/`; root shortcut symlinks and internal `content-orchestrator/engines/*` shortcut symlinks were removed. Orchestrator/Hermes resolve canonical Content Orchestrator paths first. | [X] | ✅ 2026-06-29 local; verified py_compile, Social Engine tests, video quality-gate test, HyperFrames syntax, orchestrator `engines`/`status`, canonical `workspace/content-orchestrator/video-engine/orchestrator.py --status`, and dry-run image + reel (`orchestrator-verification-20260629`, local QA 96). Black-start/poster repaired; reel-card layout rechecked with clean real product cutout, lower first-card product panel/bottom fill, lower value-card footer block/bottom fill, no duplicated domain/footer, and brand end card with product image above name plus a QA-safe lower trust row separated from `Global Beauty. Local Trust.`. Unused generated image/video artifacts archived in `4729f55`; untracked script archive/done residue archived to `/root/.attic-2026-06-29/emart-untracked-cleanup-20260629/`; canonical active helpers are now tracked after syntax/secret checks. No publish/deploy/Woo writes. |
| CO-7 | Wire Judge.me reviews export + pa_ingredient resolver (remaining placeholder demand signals). | [C] | 🔲 open |

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
| 3 | ✅ SEO data contract | SEO-ORCH-1 | ✅ Canonical `/product/`→`/shop/` merge in GSC tracker; ✅ durable completed-content registry (317 products, auto-refreshed nightly); ✅ humanizer queue correct (97 excluded, 402 remaining); ✅ full-catalog agentic scoring run completed for 3,625 products with aligned `THIN/PARTIAL/STRONG/GOLDEN` tiers. | Done 2026-06-25 |
| 4 | ✅ Critical UX trust contract | UX-ORCH-1 | ✅ Contract audit created: `workspace/content-orchestrator/docs/audits/storefront-trust-data-contract-20260625.md`; ✅ visible fallback counter relabeling/source flags implemented for category pulses, trending products, stock/sold bars, concern reviews, and PDP review copy. | No fake-live counters; no stock/price/Woo data writes. |
| 5 | ✅ Runtime/state map docs | ORCH-2, ORCH-4, ORCH-8 | ✅ Versioned process manifest + freshness/SLO spec created in `workspace/content-orchestrator/docs/process-manifest.md`; durable queue/state contract created in `workspace/content-orchestrator/docs/queue-state-contract.md`. | Docs/spec complete in `328572a`; implementation remains approval-first. |
| 6 | ✅ Work/event ledgers | SEO-ORCH-2, UX-ORCH-2 | ✅ Durable JSONL ledger instantiated at `workspace/ledgers/action-events.jsonl`; 30 SEO entries seeded with GSC+GA4 baselines; `ledger_helper.py` + `measurement_loop.py` operational. | Done 2026-06-26; use ledger for new SEO/UX work instead of daily overwritten files. |
| 7 | 🟠 High visual safety | UX-ORCH-3, UX-ORCH-4, UX-ORCH-8 | Add screenshot/a11y/design-system audits and proposal reports for mobile home/shop/PDP/component drift. | No broad visual refactor before Jul 3; owner approval for visible UI changes. |
| 8 | ✅ Content/campaign safety contracts | WA-H, SEO-ORCH-5, UX-ORCH-6 | ✅ Blog draft gate plus content/campaign lifecycle contracts exist; runtime adoption remains approval-first. | No experimental content direct-publish. No automatic discounts/prices. |
| 9 | 🟡 Measurement loop | SEO-ORCH-4, UX-ORCH-5, UX-ORCH-7, X8a, SEO-GAP-1, SEO-GAP-3 | ✅ SEO measurement loop operational (`measurement_loop.py` verified); UX health/experiment specs ready, implementation pending. | Measurement/reporting first; no auto-optimization or mass rewrite without owner gate. |
| 10 | 🟡 Recovery/ops maturity | ORCH-6, ORCH-7, SEO-ORCH-3, SEO-ORCH-6, SEO-ORCH-7, UX-ORCH-9, SEO-GAP-4 | Scripts verified 2026-06-27. **CWV baseline captured 2026-06-28:** Homepage 77, /shop 63, /category 51, PDP 57, /brands 90 — SEO 100 on all; LCP is the main gap (6.0-6.9s on product pages). `cwv_monitor.py` + `seo_rotating_check.py` created for weekly scheduled checks (Mon=CWV, Tue=URL-policy, Wed=Qdrant, Thu=control-loop, Fri=sitemap/robots, Sat=internal-links). QDR parity 100.0%. SEO-ORCH-6 all 8 rules verified, `recommended_change: none`. Remaining: add `seo_rotating_check.py` to crontab, registry→middleware test consumption (low priority). | Mostly post-critical; keep outreach/personal-data workflows approval-first. |

### Fresh SEO Gap Action Queue — 2026-06-26

Source: `workspace/audit/active/seo-gap-audit-20260626.md` and `workspace/audit/active/seo-gap-taskboard-proposals-20260626.md`.
Verified with live GSC API, live GA4 API, 4,205 sitemap URLs, 66 static crawl pages, 14 rendered Playwright pages,
and owner-provided GSC Page Indexing screenshot counts. These rows are review/prioritization tasks only; they do not
authorize automatic title rewrites, content rewrites, route changes, sitemap changes, WordPress/Woo writes, deploys, or PM2 restarts.

| Rank | ID | Maps to | Priority | Finding | Safe next action | Status |
|---|---|---|---|---|---|---|
| 1 | SEO-GAP-4 | SEO-ORCH-3, SEO-ORCH-6 | 🔴 highest SEO technical | All 38 URL-policy rows now live-verified (2026-06-26): concern query→301 to clean path (page param stripped), origin query→301, pagination→200 with self-canonical. 0 drift, 0 unmatched. Registry updated to `all-verified` version. One finding: concern redirects strip `?page=N`. | No route/canonical changes needed; concern page-param stripping is documented for future review. | ✅ 2026-06-26 all-verified |
| 2 | SEO-GAP-1 | SEO-ORCH-4, SEO-ORCH-2, SEO-5 | 🟠 high commercial upside | 7 click-gap URLs analyzed with per-page GSC query data + GA4 engagement join. Full proposals at `workspace/audit/active/seo-gap1-ctr-click-gap-proposals-20260626.md`. 3 actionable title/meta candidates (CeraVe, SKIN1004, Medicube), 2 content-depth gaps (SEO-4/5), 2 no-action. All 30 entries (8 fresh + 22 imported stale) in durable ledger with live baselines captured. | Owner reviews 3 title/meta proposals; SEO-4/5 handle content gaps. | ✅ 2026-06-26 proposals + baselines done |
| 3 | SEO-GAP-3 | SEO-ORCH-2, SEO-ORCH-4, SEO-ORCH-5 | 🟠 high measurement/content quality | 44 usefulness-flagged URLs triaged: 4 genuine concerns (Category A), 10+ false positives (PDP scan behavior, utility pages). Category A routes to existing tasks: SEO-3/4/5 for content depth, brands backlog for `/brands`. Full triage at `workspace/audit/active/seo-gap3-usefulness-triage-20260626.md`. | Category A URLs backfilled into action ledger; no new content rewrites needed. | ✅ 2026-06-26 triage done |

### Unified SEO Internal-Linking & Content-Depth Plan — 2026-06-26

Consolidates Batch-A audits (SEO-1/2/4/5/7, D8) into 3 root causes and one priority order.
Full plan: `workspace/audit/active/seo-unified-internal-linking-content-plan-20260626.md`.
Root causes: **RC-1** internal-linking gap (blog/PDP/category/brand all 0 in-body links) · **RC-2** thin/generic
content (47 generic category guides, 387 identical brand descriptions, 3,503 non-humanized PDPs) · **RC-3** FAQ +
technical hygiene. SEO-1 closed (propose-titles returns no targets). Proposals only — no writes performed.

| Pri | ID | Action | Root cause | Source | Gate | Status |
|---|---|---|---|---|---|---|
| P0-1 | USEO-1 | Fix `toners-mists` guide conditional (`page.tsx` ~L638) | RC-3 | SEO-4 | freeze-safe code; owner OK before merge | ✅ 2026-06-26 `85b15ad` (in source; deploy pending) |
| P0-2 | USEO-2 | Resolve 6 duplicate blog URL `-2` pairs → keep + 301 | RC-3 | SEO-7 F6 | owner picks keeper per pair | ✅ 2026-06-26 — root cause: PM2 `cron_restart` fired 3x/day even when stopped, no slug collision check. Fix: PM2 process deleted + pm2 save; slug collision guard added to `blog_generator.py`. 5 pairs consolidated (richer `-2` content → original post), 6 `-2` posts trashed, ISR+CF cache cleared, `-2` URLs now 404. |
| P1-1 | USEO-3 | Add 3–5 in-body links per blog post (150–250 total, WP edits, no code) | RC-1 | SEO-2, SEO-7 F5 | owner approves targets/anchors | ✅ 2026-06-26 — 200 internal links added across 45 blog posts (avg 4.4/post). 32 posts skipped (already had links, no anchors, or Bangla-only). Anchors: ingredient/concern/routine/category natural phrases. Blog cache revalidated. |
| P2-1 | USEO-4 | Build Tier-1 category guides (korean-beauty, serums, toners-mists, bath-body, lips) | RC-2 | SEO-4 | owner reviews copy before JSX | ✅ 5/5 live `85b15ad`+`a580709` (all Tier-1 guides + FAQ) |
| P2-2 | USEO-5 | Add links + FAQPage schema to existing face-cleansers & sunscreen guides | RC-1+RC-3 | SEO-5 | freeze-safe; owner OK | ✅ live `85b15ad`+`a580709` (FAQPage schema 7 cats + contextual links on face-cleansers/sunscreen + new guides) |
| P2-3 | USEO-6 | Tier-1 brand editorial (15 brands) via static `brand-editorial` data file | RC-2+RC-1 | D8 | owner writes/reviews copy; confirm Option A | ✅ 2026-06-26 `40b58df` (Option A: `brandEditorial.ts`, 15 brands live + FAQ schema; 372 keep generic fallback) — owner may refine copy |
| P3-1 | USEO-7 | Fold 2–3 in-body links into humanizer Routine-Fit output | RC-1 | SEO-7 F2 | ride humanizer pipeline, GSC order | ✅ 2026-06-27 `_inject_internal_links()` post-processor in humanizer engine |
| P3-2 | USEO-8 | Tier-2 category guides (body-wash, shampoos, +5) | RC-2 | SEO-4 | after P2-1 validated | ✅ 2026-06-26 `b294337` (7 guides + FAQ schema: shampoos, face-masks, eye-care, cream-moisturizer, makeup-remover, body-wash, foundation) |
| P3-3 | USEO-9 | Tier-2 brand editorial (15) via AI-gen + review | RC-2 | D8 | after Tier-1 validated | ✅ 2026-06-27 `78d0bf7` — 15 Tier-2 brands live (Dabo, APLB, Cos De Baha, Heimish, Purito Seoul, The Derma Co, 3W Clinic, Numbuzin, Simple, Mary & May, Axis-Y, Cetaphil, Haruharu Wonder, Benton, La Roche-Posay) |
| P3-4 | USEO-10 | Improve thin template FAQ answers | RC-3 | SEO-7 F3 | overlaps M4 | 🔲 |
| P3-5 | USEO-11 | Continue humanizer for ~3,503 non-humanized PDP sections | RC-2 | SEO-7 F1 | existing engine, GSC order | 🟢 ongoing |
| P3-6 | USEO-12 | Category-aware blog label (not blanket "Skincare Guide") | RC-3 | SEO-7 F7 | low | ✅ 2026-06-26 code done; blog post eyebrow now derives guide type from title/content signals |
| — | SEO-1 | Title cleanup | — | SEO-1 | pipeline clean, no targets | ✅ report-complete |

**Owner decisions blocking execution:** (1) USEO-2 keeper URL per duplicate pair; (2) USEO-3 blog link/anchor approach;
(3) USEO-4/6 copy approval; (4) USEO-6 implementation = Option A static data file (recommended) vs WP brand field vs AI-gen.

### SEO-22 Execution Plan — 2026-06-26

User bundle: `USEO-7`, `USEO-8`, `USEO-10`, `USEO-12`, `SEO-ORCH-2`, `SEO-ORCH-3`,
`SEO-ORCH-5`, `SEO-ORCH-4`, `SEO-ORCH-6`, `SEO-ORCH-7`, `D6`, `D8/USEO-9`, `L4`, `L6`,
`M6`, `M9/O-6/E3`, `O-2`, `O-3`, `O-4`, `O-13`, `SEO-6`, `QDR-DRIFT`.
Goal: convert the mixed SEO/content/off-page list into a safe sequence that creates sales-qualified discovery,
better AI/Google citation surfaces, and measurable change history without mass writes or doorway-page risk.

| Wave | IDs | Work package | Gate | Status |
|---|---|---|---|---|
| 1 | `USEO-12`, `L4`, `SEO-6`, `M6` | Freeze-safe on-site structure: category-aware blog labels, missing H2s on `/brands`/`/sale`/`/new-arrivals`, scannable education content support, and FAQPage JSON-LD cleanup for ingredient/concern education. | Build/test; no URL/nav/commerce data change. | ✅ 2026-06-27 merged+deployed live. Blog labels dynamic, H2s on brands/sale/new-arrivals, education auto-split, FAQ JSON-LD clean. |
| 2 | `USEO-8`, `D8/USEO-9`, `USEO-7`, `USEO-10` | Content-depth sprint: Tier-2 category guides, Tier-2 brand editorial, humanizer in-body links, and product-specific FAQ sample batch. | Owner review for generated copy; top-10 FAQ sample before Woo meta writes. | ✅ `USEO-8` deployed (7 Tier-2 guides live). `USEO-9` deployed 2026-06-27 `78d0bf7` (15 Tier-2 brands). `USEO-7` implemented (humanizer `_inject_internal_links` post-processor). `USEO-10` remains 🔲 (needs Woo meta pipeline). |
| 3 | `SEO-ORCH-2`, `SEO-ORCH-4`, `SEO-ORCH-5`, `SEO-ORCH-3`, `SEO-ORCH-6`, `QDR-DRIFT` | Control-loop hardening: ledger entries for this bundle, measurement baselines, content lifecycle enforcement, rotating technical checks, registry consumption tests, and Qdrant parity cleanup/report. | Read-only first; schedule/automation only after dry-run evidence. | ✅ mostly complete 2026-06-27: `QDR-DRIFT` done (parity 100.0%, 1 orphan). `SEO-ORCH-6` all 8 rules live-verified. `qdrant_parity_report.py` created. Remaining: CWV/CrUX, rotating schedule, registry→middleware wiring. |
| 4 | `D6`, `O-13`, `M9/O-6/E3` | Revenue recovery: rank GMC disapprovals by sales potential, review PDP 404 redirect candidates, and prioritize top-product gallery gaps. | No stock/price/order/customer changes; owner approval for redirects/images. | 🔲 owner/data gated. GMC list verified at 83 items. |
| 5 | `L6`, `O-2`, `O-3`, `O-4`, `SEO-ORCH-7` | Growth roadmap: blog calendar, origin editorial list, comparison-page pairs, best-page topics, and off-page/entity ledger. | Owner chooses topics/pairs/countries/outreach; no mass programmatic pages. | 🔲 owner-decision. Topical authority spec exists, no implementation. |

**Current execution priority (2026-06-27 updated):** ~~(1) Wave 1+2 merged+deployed.~~ ~~(3) USEO-9 Tier-2 done.~~ (2) Continue humanizer (`USEO-11`) for PDP discovery/GMC impact. (4) `D6` GMC disapprovals for Shopping revenue recovery. (5) `USEO-10` thin FAQ improvement (Woo meta pipeline, owner-gated). (6) Wave 4-5 owner-gated items.

### Main Priority Parent List — Authoritative 1-10

These are the only authoritative numbered priorities. Each main number holds its source rows as sub-issues.
Batch labels (`B1`, `B2`) and legacy AI numbers are helper labels only, not competing priority numbers.

| Main | Parent | Sub-issues | Status | Definition of done |
|---|---|---|---|---|
| 1 | Security | 1a WA-G, 1b ORCH-5 | 🟡 partial | Script credentials externalized, exposed old keys revoked by owner, PM2 env leakage fixed at next maintenance restart. |
| 2 | Release safety | 2a ORCH-1 | ✅ done | Deploy path avoids blanket staging, uses lock/install gates, protects runtime state, and has rollback behavior. |
| 3 | SEO data contract | 3a SEO-ORCH-1 | ✅ done | Canonical GSC aggregation, completed-content registry, full-catalog agentic scoring, and tier contract alignment are all trusted before priority automation acts. |
| 4 | UX trust contract | 4a UX-ORCH-1 | ✅ done | Trust claims are inventoried with source/fallback rules in `workspace/content-orchestrator/docs/audits/storefront-trust-data-contract-20260625.md`; fallback counters are visibly relabeled/source-flagged. |
| 5 | Runtime / state map | 5a ORCH-2, 5b ORCH-4, 5c ORCH-8 | ✅ docs/spec complete | Versioned manifest, freshness/SLO spec, and shared durable queue/state contract exist for PM2/crons/workers/engines in `328572a`; runtime implementation/monitors remain future work. |
| 6 | Work / event ledgers | 6a SEO-ORCH-2, 6b UX-ORCH-2 | ✅ instantiated | Durable JSONL ledger at `workspace/ledgers/action-events.jsonl` with `ledger_helper.py` CLI (add/update-status/list/pending/import-actions). 30 entries seeded (8 fresh SEO-GAP + 22 imported title proposals). `measurement_loop.py` captures GSC+GA4 baselines and evaluates post-change windows. |
| 7 | Visual safety | 7a UX-ORCH-3, 7b UX-ORCH-4, 7c UX-ORCH-8 | 🟡 audit/spec partial | Read-only visual safety audit created in `workspace/content-orchestrator/docs/audits/storefront-visual-safety-audit-20260625.md`; reusable screenshot/a11y harness and fixes remain pending. |
| 8 | Content / campaign safety | 8a WA-H, 8b SEO-ORCH-5, 8c UX-ORCH-6 | ✅ contracts done | WA-H blog draft gate done; content lifecycle contract at `workspace/content-orchestrator/docs/content-lifecycle-contract.md`; campaign orchestration contract at `workspace/content-orchestrator/docs/campaign-orchestration-contract.md`. |
| 9 | Measurement loop | 9a SEO-ORCH-4, 9b UX-ORCH-5, 9c UX-ORCH-7, 9d X8a, SEO-GAP-1, SEO-GAP-3 | 🟡 SEO done, UX specs ready | SEO measurement loop operational (`measurement_loop.py` with GSC+GA4 baseline capture + post-change review). 30 entries baselined. UX-ORCH-5 frontend health spec + UX-ORCH-7 experiment registry spec created; implementation pending. |
| 10 | Recovery / ops maturity | 10a ORCH-6, 10b ORCH-7, 10c SEO-ORCH-3, 10d SEO-ORCH-6, 10e SEO-ORCH-7, 10f UX-ORCH-9, SEO-GAP-4 | 🟡 specs + infra done | ORCH-6: DR plan + backup integrity improvements applied. ORCH-7: CI workflow at `.github/workflows/ci.yml`. ORCH-3: global worker lock + retry budget + dead-letter in orchestrator. SEO-GAP-4 all-verified. SEO-ORCH-7: off-page/entity ledger spec. UX-ORCH-9: feedback taxonomy spec. Owner actions remain for off-server backup + first restore drill. |

#### Main Priority Sub-Issues

| Sub-issue | Source row | Status | Definition of done |
|---|---|---|---|
| 1a | WA-G | 🟡 owner action pending | Embedded credentials removed from OpenClaw scripts; owner revokes old WP/WC keys and supplies/fixes any needed Meta token. |
| 1b | ORCH-5 | 🟡 config ready | `ecosystem.config.cjs` created with env-isolated process definitions; 3 crash-looping dated campaign processes deleted; apply clean restart at next maintenance via `pm2 delete <name> && pm2 start ecosystem.config.cjs --only <name>`. |
| 2a | ORCH-1 | ✅ done | `deploy.sh` is hardened with lock, selective staging, lockfile-before-rsync, runtime-state exclusions, and build rollback. |
| 3a | SEO-ORCH-1 | ✅ done | Full-catalog agentic scoring and aligned tier contracts now run after canonical merge + completed-content registry; latest run scored 3,625 products. |
| 4a | UX-ORCH-1 | ✅ done | Inventory/source/fallback contract created 2026-06-25; source flags and fallback-counter relabeling implemented before CRO/social-proof expansion. |
| 5a | ORCH-2 | ✅ docs complete | Versioned PM2/cron/detached/worker manifest created in `workspace/content-orchestrator/docs/process-manifest.md` (`328572a`). |
| 5b | ORCH-4 | ✅ spec complete | Freshness/SLO spec for last-success signals, duration, stale thresholds, retry/error classes, health checks, and recovery actions added to `workspace/content-orchestrator/docs/process-manifest.md` (`328572a`). |
| 5c | ORCH-8 | ✅ contract complete | Shared durable queue/state contract for locks, atomic writes, idempotency, retries, dead letters, recovery, and audit trails created in `workspace/content-orchestrator/docs/queue-state-contract.md` (`328572a`). |
| 6a | SEO-ORCH-2 | ✅ instantiated | Durable JSONL ledger at `workspace/ledgers/action-events.jsonl` with CLI helper. 30 SEO entries seeded with GSC+GA4 baselines. |
| 6b | UX-ORCH-2 | ✅ instantiated | Same ledger supports UX entries (UX-20260626-URL-001 already created). Event schema via `ledger_helper.py`. |
| 7a | UX-ORCH-3 | 🟡 matrix specified | Read-only route/viewport/state matrix defined in `workspace/content-orchestrator/docs/audits/storefront-visual-safety-audit-20260625.md`; screenshot capture harness pending. |
| 7b | UX-ORCH-4 | 🟡 drift measured | Static drift counts and priority targets documented in `workspace/content-orchestrator/docs/audits/storefront-visual-safety-audit-20260625.md`; governance/enforcement pending. |
| 7c | UX-ORCH-8 | 🟡 gate specified | Axe/keyboard/focus/contrast gate requirements documented in `workspace/content-orchestrator/docs/audits/storefront-visual-safety-audit-20260625.md`; automated runner pending. |
| 8a | WA-H | 🔲 open | Blog generator can draft/review/validate before publish; no new pilots use direct publish. |
| 8b | SEO-ORCH-5 | ✅ contract done | Content lifecycle contract at `workspace/content-orchestrator/docs/content-lifecycle-contract.md`: demand→brief→draft→QA→approve→publish→verify→measure→review. |
| 8c | UX-ORCH-6 | ✅ contract done | Campaign orchestration contract at `workspace/content-orchestrator/docs/campaign-orchestration-contract.md`: required fields, lifecycle, surface-specific rules, stale-content alerts. |
| 9a | SEO-ORCH-4 | ✅ operational | `measurement_loop.py` joins GSC+GA4 baselines onto ledger entries and evaluates post-change windows with keep/iterate/revert decisions. 30 entries baselined 2026-06-26. |
| 9b | UX-ORCH-5 | 🟡 spec done | Frontend health monitoring spec at `workspace/content-orchestrator/docs/frontend-health-monitoring-spec.md`. Implementation pending (provider choice: self-hosted JSONL recommended). |
| 9c | UX-ORCH-7 | 🟡 spec done | Experiment registry spec at `workspace/content-orchestrator/docs/experiment-registry-spec.md`. No active experiments; framework ready for post-freeze use. |
| 9d | X8a | ✅ complete | Social Engine imports real Meta/GSC/GMC performance plus product-level GA4 landing-page metrics into product/brand/category score inputs; picker smoke passed with `performance/latest.json`. |
| 10a | ORCH-6 | 🟡 plan + integrity done | DR plan at `workspace/content-orchestrator/docs/disaster-recovery-plan.md`. Backup script hardened with fail-closed verification, checksum logging, and size anomaly detection. Off-server backup and restore drill require owner action. |
| 10b | ORCH-7 | ✅ CI workflow created | `.github/workflows/ci.yml` with typecheck, lint, build, dep audit, and Python syntax checks. Deployment stays owner-controlled. |
| 10c | SEO-ORCH-3 | ✅ CWV baseline + rotating schedule done 2026-06-28 | Read-only technical SEO control loop, URL-policy registry, Qdrant parity, and CWV monitoring all operational. **CWV baselines captured:** Homepage 77, /shop 63, /category 51, PDP 57, /brands 90 (SEO 100 everywhere; LCP is the gap on product pages). `cwv_monitor.py` for on-demand/scheduled CWV checks, `seo_rotating_check.py` for weekly Mon-Sat rotating technical checks. Baseline JSON at `workspace/audit/cwv-history/cwv-2026-06-28.json`. Remaining: add to crontab when owner approves. |
| 10d | SEO-ORCH-6 | ✅ all 8 rules verified + no changes needed | All 8 URL-policy registry rules live-verified; all rules return `recommended_change: none` — current middleware implementation matches registry policy. Registry→middleware test consumption is low-priority hardening, not a functional gap. |
| 10e | SEO-ORCH-7 | 🟡 spec done | Off-page/entity/AEO ledger spec at `workspace/content-orchestrator/docs/off-page-entity-ledger-spec.md`. All outreach approval-first. |
| 10f | UX-ORCH-9 | 🟡 spec done | Customer feedback taxonomy spec at `workspace/content-orchestrator/docs/customer-feedback-taxonomy-spec.md`. Start with GA4 search no-result + 404 tracking. |

### Workspace Conflict Audit — 2026-06-25

Scope: task-board/workspace governance only. This does not authorize implementation, deploys, live service restarts,
WordPress/Woo writes, protected commerce-data changes, or broad cleanup while the shared tree is dirty.

| ID | Conflict / friction | Decision for future sessions |
|---|---|---|
| WSC-1 | Shared worktree dirty-state was reconciled 2026-06-25: tracked code/docs were already committed; the only untracked item was generated Social Engine runtime state under `workspace/content-orchestrator/social-engine/state/`. | `workspace/content-orchestrator/social-engine/state/` is ignored. Before deploy/commit/push still review `git status --short`, `git diff --stat`, staged files, and AGENT_BUS; old `pending` rows are historical unless they match current `git status`. |
| WSC-2 | AGENT_BUS can contain stale historical ownership notes after multi-agent sessions. | Live ownership is only the ACTIVE WORK table plus current `git status --short`. Any active file owner must be added before editing and moved to LAST COMPLETED/HANDOFF/ABANDONED before ending. |
| WSC-3 | `emart-blog-generator` is listed as scheduled, but WA-G says it has embedded live credentials and WA-H says it is publish-only. | Treat blog automation as unsafe for new/experimental content until WA-G/WA-H are closed. Add draft/review and secret rotation before using GSC topics or pilots. |
| WSC-4 | Social campaign row `X4` still said “active today” for 2026-06-24 after the date passed. | Verify final post/comment results, archive/close stale campaign state, then keep only reusable Social Engine tasks (`X8a`–`X8c`) open. |
| WSC-5 | Mobile work appears both as open (`X3`) and explicitly out-of-scope for mobile BFF gaps (“EXCEPT MOBILE APP”). | Park mobile app work unless owner reopens it. Do not let mobile tasks consume current web/SEO/orchestration sessions. |
| WSC-6 | ORCH/SEO/UX priority-lane IDs are repeated by design: once as execution order and once as source task rows. | Not a duplicate-task conflict. The source rows remain authoritative; the priority lane is only sequencing. |
| WSC-7 | `workspace/seo-review/*` generated files are removed from tracking but still exist as runtime/generated state. | Treat generated SEO JSON/JSONL/GSC snapshots as runtime state, not source of truth for commits. Keep human approval queues tracked. |
| WSC-8 | Agents assumed another agent would commit shared work, leaving “pending” memory after the actual commits landed. | Editor owns closure: commit it, or write an explicit HANDOFF with exact files and next action. Never leave “someone else will commit” as the state. |
| WSC-9 | Untracked `workspace/content-orchestrator/video-engine/hyperframes/` exists locally with installed dependencies (~655 MB). | Do not stage or delete blindly. Close via VID-6: formalize minimal source with dependency ignores, mark as generated/runtime state, or archive to attic after owner/Claude confirmation. |

### Token-Efficient Session Batches — Work by Cluster, Not by Whole Board

Use these batches to reduce context cost. In each session, read only the batch's files plus AGENT_BUS, TASKS, and
the exact source files being changed. Do not mix batches unless the task explicitly depends on another batch.

| Batch | Type | Task IDs | Read first | Output expected | Hard stop / guard |
|---|---|---|---|---|---|
| B0 | Coordination + source-state check | WSC-1, AGENT_BUS, dirty tree | `python3 workspace/content-orchestrator/scripts/active/agent_start.py`, `apps/web/.agent-memory/AGENT_BUS.md`, `workspace/TASKS.md`, `git status --short`, relevant `git diff -- <file>` | Decide whether work is safe; claim/avoid overlap; refresh `workspace/AGENT_BRAIN.md` with `agent_brain.py --write` when needed. | Stop if another active agent owns the same files. |
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
| GROW-1 | Build a GSC-led topical-authority map connecting journal articles, `/best`, `/compare`, concerns, ingredients, brands, and commercial landing pages; include an internal-link proposal workflow and coverage reporting. | [X]+[C] | ✅ 2026-06-28 — full map at `workspace/audit/active/grow1-topical-authority-map-20260628.md`: 4,055+ pages across 11 content types inventoried; 8 topic clusters mapped; 32 content-type pairs have zero cross-links; 10 prioritized link-gap actions ranked by impact; 6-step internal-link proposal workflow; `topical_authority_report.py` regenerable reporting script. Key finding: blog (0 in-body links), best, compare pages are completely disconnected from concern/ingredient/brand ecosystem. |
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
Report script: `workspace/content-orchestrator/scripts/active/ga4_report.py [days]`
Full GMC disapproved list: `workspace/audit/active/gmc-disapproved-20260622.md`

| # | Sev | Finding | Owner | Status |
|---|---|---|---|---|
| D1 | ~~Crit~~ | ~~Zero-click rank-1 queries~~ — REFRAMED: titles/snippets fine; real issue was ranked-but-404 URLs. Validated old 26-row map vs live (24 already fixed Jun 17). | [C] | ✅ `c3dd2f6` — 3 verified redirects live (/brands/care-nel, /brands/rohto, Bengali sunscreen blog); 2 wrong-shade makeup 404s left as-is |
| D2 | ~~High~~ | ~~Striking-distance queries~~ — `/best/*` titles already match queries exactly (e.g. "Best Face Wash for Oily Skin in Bangladesh 2026"); this is a ranking/authority gap, not a metadata fix | [C] | ✅ no code fix needed; needs links/content depth over time |
| D3 | ~~High~~ | ~~GA4 tag 8.9s delay~~ — confirmed `tfd=8892` via live trace; lost mobile bounce sessions ~20% | [C] | ✅ `c3dd2f6` — GA4 now `afterInteractive`, merchant badge stays deferred 30s |
| D4 | High | **High-bounce landing pages** — `/concerns/sunscreen` 71% (was nonsense template fill: "Can sunscreen help with sunscreen?"). `/skin-type/oily` 80% is 5-session noise (content already rich). `/best/cleanser` + `/brands/cerave` are ranking, not content. | [C] | ✅ `46088aa` — sunscreen rewritten (SPF/PA, skin-type fit, application, climate); others no-op |
| D5 | ~~Med~~ | ~~GMC 309 small images~~ | [X] | ✅ 2026-06-23 — all 309 mapped products received exact-source enhanced images at ≥1200px; originals preserved; product cache revalidated; GMC full sync completed 3,595 synced / 30 excluded / 0 errors |
| D6 | Med | **GMC 83 disapproved** — healthcare claims (15), identity/belief shade names (25), personal hardships (38), illegal drugs (2), other (3). Fix 1-by-1 by sales potential | [C]+[O] | 🟡 2026-06-28: 33/46 fixed via regex pass. **13 remain (all owner-gated):** 8 title-level shade names (owner chooses: rename shades to codes, accept disapproval, or GMC exclude — proposals at `workspace/audit/active/d6-remaining-actions-20260628.md`), 4 broad-category false positives (75273/3822/74275/63933 — appeal via GMC dashboard), 1 backorder (4013 — stock decision). Revenue impact of remaining 13 is <1% of GMC Shopping traffic. |
| D7 | ~~Med~~ | ~~Germany bot traffic~~ — REFRAMED: 1,722 are Safari/iOS Apple Private Relay (REAL Bangladeshi iOS users masked as Germany); only /checkout 0%-eng cluster is synthetic | [O] | ✅ analyzed; DO NOT country-filter; use Bangladesh segment in `ga4_report.py`; see `OWNER-ACTIONS-20260623.md` |
| D8 | Low | **AI Assistant is #2 BD channel** (334 sessions/14d) — `/brands/*` and `/best/*` pages drive most AI traffic. 30 brands now have editorial copy + FAQ schema (Tier-1 15 + Tier-2 15); 357 long-tail brands use generic fallback. | [C]+[O] | ✅ Tier-1 live 2026-06-26 + Tier-2 live 2026-06-27 `78d0bf7` |
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
| SEO-1 | Product title cleanup for raw/lowercase catalog titles. `gsc_tracker.py propose-titles` returns "No title proposal targets" — pipeline clean as of 2026-06-26. Report at `workspace/audit/active/seo1-title-cleanup-proposals-20260626.md`. | [O]+[X] | ✅ 2026-06-26 report-complete (no targets remaining) |
| SEO-2 | Journal internal-link cluster proposals from articles to product/category pages. Original audit found all sampled blog posts had zero internal links; `USEO-3` later added 200 internal links across 45 posts. Full original proposals at `workspace/audit/active/seo2-journal-internal-link-proposals-20260626.md`. | [C]+[O] | ✅ 2026-06-26 applied via `USEO-3`; future blog posts must include contextual internal links by default |
| SEO-3 | Category-page target map and coverage audit. 50 indexable categories mapped: 2 with custom guides (face-cleansers, sunscreen), 47 generic. 0 slug/H1 mismatches. Bug found: toners-mists has metadata but missing guide conditional. Tier 1-4 buying guide priority matrix created. Full report at `workspace/audit/active/seo3-category-target-map-20260626.md`. | [X]+[C] | ✅ 2026-06-26 audit complete |
| SEO-4 | Expand buying guides for high-value categories. Tier-1 guides are live, and Tier-2 guide code exists for shampoos, face-masks, eye-care, cream-moisturizer, makeup-remover, body-wash, and foundation. Face Cleansers/Sunscreen preserved. Full proposals at `workspace/audit/active/seo4-buying-guide-gap-proposals-20260626.md`. | [C]+[O] | ✅ Tier-1 + Tier-2 live in source by 2026-06-26; future work is new category candidates only |
| SEO-5 | Add contextual links + FAQs to category guides. Existing face-cleansers/sunscreen, Tier-1 guides, and Tier-2 guide FAQ/contextual-link work are implemented. All original link targets verified HTTP 200 in proposal phase. Full proposals at `workspace/audit/active/seo5-contextual-link-faq-proposals-20260626.md`. | [C]+[O] | ✅ Tier-1 + Tier-2 guide FAQ/contextual-link work done; keep max 4-6 natural links per future guide |
| SEO-6 | Education scanability audit complete: 3/4 priority concern pages graded NEEDS-SPLIT (acne, brightening, anti-aging: 170-192 word single-paragraph blocks), 1 graded GOOD (sunscreen). Root cause: `EducationContent.tsx` rendered monolithic `<p>` blocks. Full audit at `workspace/audit/active/seo6-education-scanability-audit-20260626.md`. | [C]+[O] | ✅ 2026-06-26 code done; renderer auto-splits long education sections and supports optional `paragraphs`/`listItems`; ingredient/concern FAQ JSON-LD now strips internal link markers |
| SEO-7 | Structural QA report for PDP descriptions + blog HTML. 10 PDPs + 16 blog posts sampled. Template-level heading hierarchy is clean (1 H1, logical H2/H3). CRITICAL: all 50 blog posts have ZERO internal links. 6 duplicate blog URL pairs found (-2 suffix). Non-humanized PDPs (~3,503) lack structured sections. Full report at `workspace/audit/active/seo7-pdp-blog-structural-qa-20260626.md`. | [C] | ✅ 2026-06-26 report-complete |

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
| X4 — Social publishing: **2026-06-27** daily campaign scheduled live. Active image plan now has 17 future/remaining FB+IG posts after owner QA cleanup; duplicate scan against 2026-06-23..26 returned `repeat_count 0`, and flagged TIAM / Minimalist Vitamin C / Dr. Althea serum assets were removed from the active plan and moved to attic. Because launch happened after early BDT slots, item 4 had already published before cleanup (`FB 106908734057777_1328226289434333`, `IG 18129055909549166`) and remains only in the ledger. Added catch-up static posts for TIRTIR toner, TIRTIR cushion, and Neutrogena gel; live image sample URLs return HTTP 200. Six Facebook reels remain scheduled between regular posts via `emart-reels-20260627` plus BOJ catch-up `emart-reels-catchup-boj-20260627`; missing reel MP4s were synced to live, stale 404 cache was bypassed with fresh `v=` URLs, and reel slot 2 moved to 12:38 BDT. | 🟢 running; monitor PM2/result ledger |
| X7 — AI video engine: Phase 0 local reel engine built; direct Google dropped from default path. Scripts now use OpenRouter free Gemma fallback (`google/gemma-4-31b-it:free` proven), QA defaults to local ffprobe; sample reel live at `/public/videos/reels/20260624-gemma-boj-relief-sun-sample.mp4`; reusable Emart model clean portrait generated at `workspace/content-orchestrator/video-engine/personas/emart-model/clean-portrait.png` (1080x1920, bridge queue empty). Live publish remains owner-gated. | 🟡 publish gated |
| X8 — Social Engine v1: `workspace/content-orchestrator/social-engine/` creates review-gated FB/IG plans, duplicate/yesterday guards, caption checks, scheduler previews, and optional video jobs. `--vision-qa` now performs real free OpenRouter image inspection for product identity, visible price, dummy products, model-hand placement, and layout; it deduplicates reused assets, runs four checks concurrently, and blocks on fail/unavailable. Manual attestation remains the explicit offline fallback. Product picker/history hook/IG 4:5/contact sheet/design-source QA, approval-status publish gates, and Meta/GSC/GMC/GA4 performance import are now implemented. | ✅ complete |
| X8a — Social Engine performance loop (audit F2): `record` subcommand exists, live `meta_schedule.js --record-history` can append published campaigns after a completed publish loop, product picking uses optional read-only performance JSON scores by product/slug/brand/category while still avoiding recent history, and `import-performance` now merges real Meta ledgers with latest local GSC, GMC health signals, and product-level GA4 landing-page metrics into `workspace/content-orchestrator/social-engine/performance/latest.json`. GA4 exporter wrote 870 product rows for the last 28 days and picker smoke passed. | ✅ complete |
| X8b — Social Engine IG 4:5 asset generation (audit F3): `plan --make-ig-variants` now creates 1080×1350 Instagram derivatives from 1080×1080 source assets and rewrites Instagram image references in the review pack. 2026-06-25 daily pack generated 18 square + 18 IG 4:5 assets; slots 11-18 were replaced with Ayesha persona model-held product creatives, slot 16 was corrected to the tall CeraVe tube, and FB/IG schedulers are running for 10:15-23:00 BDT. | ✅ complete |
| X8c — Social Engine `approval_status` semantics (audit F4): `approval_status=approved_for_scheduled_run` is honored only after QA passes; review-required campaigns remain blocked by `meta_schedule.js --publish` before any Meta call. Verified 2026-06-25 with unit tests, approved/review plan dry-runs, and fail-closed publish-gate smoke. | ✅ complete |
| X9 — Selective `stop-slop` adoption: `emart-stop-slop-v1` adds soft warnings for throat-clearing, vague claims, jargon, meta-commentary, formulaic contrast, and staccato rhythm. Preserves AEO questions, useful adverbs, limited em dashes, and GMC gates. Four tests pass; gold exemplars remain mean 94.0; fixed JSONL summaries to count hard-gate failures correctly. Humanizer only—blog/social require separate review. | ✅ complete |
| X10 — Bangla blog anti-slop capacity pilot: review-only sunscreen guide saved at `workspace/audit/active/bangla-blog-stop-slop-pilot-20260624.md`. QA: 862 words, H1 1, H2 6, FAQ 3, internal links 3 (all live 200), bullets 8, numbered steps 4, maximum paragraph 59 words, zero banned-residue/medical-claim hits. No WordPress action. | ✅ complete; awaiting owner content review |
| X11 — Plain-English blog capacity pilot: initial readable draft passed prose QA but failed full business/SEO readiness due duplicate intent, no product-body links, and incomplete schema coverage. Now being converted into a rewrite/conversion package for existing post ID 94840 using current GSC and verified in-stock products; never publish as a new URL. | 🟡 revision in progress |
| X5 — SEO cron state hygiene: retained the valid 2026-06-23 GSC/state refresh and fixed `system_state.py` treating the em-dash placeholder as an active agent. | ✅ complete |
| Mobile BFF gaps: `/api/mobile/cart` and `/api/mobile/payment` return 404 | ⏸️ out of scope per owner: "EXCEPT MOBILE APP" |

### System Orchestration Audit — 2026-06-24

| ID | Priority | Item | Status |
|---|---|---|---|
| ORCH-1 | Critical | Deploy hardened: `deploy.sh` now has deploy lock (PID-based, stale-safe), `git add -u` + explicit subdirs (not blanket `-A`), lockfile diff BEFORE rsync, `.next` rollback backup on VPS build failure, workspace rsync excludes `jobs/` + state/checkpoint files, removed `git clean -fd`. | ✅ 2026-06-25 |
| ORCH-2 | High | Create one versioned runtime manifest for every Emart PM2 process and scheduled job, including cwd, timezone, owner, restart policy, resource limits, expected lifecycle, and install/reconcile commands. | ✅ docs complete 2026-06-25 in `328572a`: `workspace/content-orchestrator/docs/process-manifest.md` inventories filtered PM2, root crontab, detached/on-demand engines, and queue workers. |
| ORCH-3 | High | Video orchestration hardened: global `flock`-based worker lock (prevents overlapping ticks), retry budget (MAX_RETRIES=3 before dead-letter), `jobs/dead-letter/` lane for exhausted jobs, Telegram notification on dead-letter. Cron uses absolute paths via `ROOT = Path(__file__).resolve().parent`. Approval gate + Telegram bot already functional. | ✅ 2026-06-26 lock + retry + dead-letter |
| ORCH-4 | High | Replace presence-only monitoring with freshness/SLO monitoring: last successful run, duration, queue age, retry count, error class, commercial endpoint health, and alert recovery. Stop maintaining a hard-coded expected-stopped PM2 list. | ✅ spec complete 2026-06-25 in `328572a`: SLO table added to `workspace/content-orchestrator/docs/process-manifest.md`; implementation pending. |
| ORCH-5 | High | Credential blast radius reduced: all 12 OpenClaw scripts now load from `openclaw.env` via shared `creds.py`; no hardcoded secrets in source. **PM2 env leakage remains:** `n8n` process has OPENROUTER_API_KEY + N8N_BASIC_AUTH_PASSWORD in PM2 metadata (inherited from shell). Fix: recreate PM2 processes with explicit `filter_env` or ecosystem config at next maintenance restart. Dedicated user deferred (single-owner VPS). | 🟡 scripts fixed; PM2 env + owner key rotation pending |
| ORCH-6 | High | Complete disaster recovery: keep encrypted off-server DB/uploads backups, fail closed on dump/tar errors, verify checksums, document RPO/RTO, and perform a periodic isolated restore drill. Current archives pass gzip/tar integrity but remain on the same VPS and no restore drill was found. | 🔲 open |
| ORCH-7 | Medium | Add CI for typecheck, lint, unit/integration tests, build, dependency/security checks, deploy-script tests, and orchestration state-machine tests. Keep production deployment owner-controlled until a safer release mechanism exists. | 🔲 no GitHub workflow; storefront test coverage minimal |
| ORCH-8 | High | Standardize durable automation queue/state handling across video, social, blog, humanizer, GSC/SEO, Qdrant and future workers: one lock per worker/domain, atomic state writes, idempotency keys, retry budgets, dead-letter queues, manual replay, checkpoint schema, and append-only audit trail. ORCH-3 remains the video-specific fix; this is the shared engine contract. | ✅ contract complete 2026-06-25 in `328572a`: `workspace/content-orchestrator/docs/queue-state-contract.md`; runtime adoption pending. |

### SEO System Orchestration Audit — 2026-06-24

| ID | Priority | Item | Status |
|---|---|---|---|
| SEO-ORCH-1 | Critical | Repair SEO prioritization inputs before acting on them: run/maintain complete catalog-wide agentic scores, align tier contracts (`THIN/PARTIAL/STRONG/GOLDEN`), use a durable completed-content registry instead of inferred tiers, and normalize legacy `/product/` plus query URLs into their canonical URL before aggregating GSC metrics. | ✅ complete 2026-06-25: canonical GSC merge + durable completed-content registry added; humanizer queue reports 317 completed registry products / 97 GSC-visible completed / 402 needs work; deterministic full-catalog score now covers 3,625 products with tiers 350 GOLDEN / 2,499 STRONG / 761 PARTIAL / 15 THIN. |
| SEO-ORCH-2 | High | Replace daily overwritten `actions.json` with a durable SEO work ledger: stable action ID, canonical URL/entity, evidence snapshot, proposed change, owner, approval state, dependency, due/SLA, execution record, rollback pointer, verification state, and final outcome. Deduplicate recurring findings and stale approvals. | ✅ instantiated 2026-06-26: durable JSONL ledger at `workspace/ledgers/action-events.jsonl`, `ledger_helper.py` CLI, 30 SEO entries seeded, GSC+GA4 baselines captured via `measurement_loop.py`. |
| SEO-ORCH-3 | High | Schedule one read-only technical SEO control loop: catalog↔sitemap↔Qdrant parity and historical count deltas, representative plus rotating URL samples, metadata/schema/canonical/404/redirect-chain/query-policy/news-sitemap checks, internal-link/orphan crawl, GSC index/URL-inspection coverage, Core Web Vitals/CrUX, and last-success freshness alerts. | ✅ all components built 2026-06-28: `seo_technical_control_loop.py` (classifier + live verify), `seo_url_policy_registry.py` (38 rows validated), `qdrant_parity_report.py` (100% parity), `cwv_monitor.py` (CWV baselines: SEO 100 everywhere, LCP is perf gap on product pages), and `seo_rotating_check.py` (weekly Mon-Sat rotating checks). Baseline JSON at `workspace/audit/cwv-history/cwv-2026-06-28.json`. Add to crontab when owner approves (`30 3 * * * python3 seo_rotating_check.py`). |
| SEO-ORCH-4 | High | Build a closed-loop measurement layer joining GSC with GA4 organic landing-page engagement/conversions, catalog availability/depth signals where safe, GMC health, and change annotations. Use pre-change baselines, 7/28-day reviews, confidence thresholds, and keep/iterate/revert decisions. | ✅ operational 2026-06-26 for SEO ledger entries: `measurement_loop.py` captures GSC+GA4 baselines and evaluates review windows. Revenue/order joins remain excluded unless explicitly approved because order data is protected. |
| SEO-ORCH-5 | High | Unify content lifecycle: demand/intent and cannibalization check → brief → draft → factual/brand/claim/link/schema QA → human approval → publish → cache revalidation → sitemap/index verification → performance review. The GSC topic feed must create drafts, never hand topics to a direct-publish blog path. Include imported Woo PDP/blog HTML structural QA before rewrite proposals. | ✅ contract/gates done 2026-06-26: WA-H blog draft gate plus `workspace/content-orchestrator/docs/content-lifecycle-contract.md`; runtime adoption remains approval-first and no new direct-publish pilots are allowed. |
| SEO-ORCH-6 | Medium | Establish one versioned URL-policy registry consumed/tested by middleware, metadata, robots, sitemap, redirects and audit tools. Decide crawl/index/canonical behavior for every supported query parameter and detect drift; Googlebot currently bypasses generic robots query disallows while representative filter URLs return `index, follow` with a clean canonical. | ✅ complete 2026-06-28: all 8 rules live-verified (`workspace/seo/url-policy-registry.json`); all rules return `recommended_change: none` — middleware matches policy. `seo_rotating_check.py` Tue slot verifies registry weekly. Formal middleware test consumption is post-freeze hardening. |
| SEO-ORCH-7 | Medium | Add governed off-page/entity/AEO operations: backlink and mention inventory, outreach/GBP/social-profile/review workflow with ownership and proof, toxic/spam review, AI citation/referral monitoring, and conversion attribution. Keep all external publishing/outreach approval-first. | 🟡 spec done 2026-06-26: `workspace/content-orchestrator/docs/off-page-entity-ledger-spec.md`; outreach/entity execution remains owner-gated. |

### UI/UX System Orchestration Audit — 2026-06-25

Audit-only origin: mobile screenshots/static scans showed a polished storefront with weak experience-control systems.
These tasks do not authorize protected commerce-data changes. Before 2026-07-03, keep work to audits, contracts,
instrumentation specs, non-invasive monitoring, and owner-reviewed proposals unless the owner explicitly approves
the exact visible change.

| ID | Priority | Item | Status |
|---|---|---|---|
| UX-ORCH-1 | Critical | Create a storefront trust-data contract for all UI claims that imply “live”, “verified”, “stock”, “reviews”, “sold”, “active viewers”, or social proof. Each claim must map to a real data source, explicit fallback label, cache age, and owner-approved wording. Remove or relabel synthetic/fallback counters before scaling CRO. | ✅ complete 2026-06-25: `workspace/content-orchestrator/docs/audits/storefront-trust-data-contract-20260625.md`; deterministic fallback category/product/concern counters now carry source flags and visible labels avoid fake-live/verified/stock/sales claims; no stock/price/Woo writes. |
| UX-ORCH-2 | High | Define a UX event schema and tracking ledger for product-list view/select, search query/no-result, filter/sort use, PDP gallery/sticky CTA, wishlist/back-in-stock, chat/WhatsApp, quiz/routine, coupon/shipping/payment validation errors, and mobile overlay interactions. | ✅ instantiated 2026-06-26 through shared `workspace/ledgers/action-events.jsonl` + `ledger_helper.py`; first UX entry exists, instrumentation rollout still pending. |
| UX-ORCH-3 | High | Add a read-only visual QA matrix for mobile and desktop home, shop/category, PDP, search, journal, and key campaign slots: screenshot capture, overlay collision checks, first-screen content visibility, sticky CTA/bottom-nav/chat conflicts, and before/after diff evidence. | 🟡 matrix specified 2026-06-25 in `workspace/content-orchestrator/docs/audits/storefront-visual-safety-audit-20260625.md`; reusable screenshot harness pending |
| UX-ORCH-4 | High | Enforce design-system governance: measure and reduce raw buttons/inputs, hardcoded colors, arbitrary color classes, typography drift, and duplicated product-card/CTA patterns; prefer shared tokens/components with visual parity checks. | 🟡 drift measured 2026-06-25 in `workspace/content-orchestrator/docs/audits/storefront-visual-safety-audit-20260625.md`; enforcement/refactor pending |
| UX-ORCH-5 | High | Add frontend experience health monitoring: web-vitals/RUM, route error reporting, unhandled promise/window errors, API failure rates, hydration/runtime exceptions, and route-level last-good health. | 🔲 current error boundaries mostly log locally; choose provider/config without exposing secrets |
| UX-ORCH-6 | High | Build campaign/promotion orchestration for hero, offer rails, flash messaging, social campaign assets, and expiry: owner, source data, start/end, preview, approval, rollback, linked metric, and stale-content alerts. | 🔲 current campaign surfaces are partly hardcoded/rolling; no price/discount automation without explicit request |
| UX-ORCH-7 | Medium | Create an experiment/feature-flag registry for UX changes: hypothesis, audience, variant, holdout, metric, minimum runtime, rollback condition, owner approval, and outcome. | 🔲 no auto-randomized UI or self-optimizing changes until measurement and approval gates exist |
| UX-ORCH-8 | Medium | Add automated accessibility gates: axe/keyboard/focus/contrast checks on representative mobile/desktop journeys, with issue severity, owner-visible screenshots, and route/component ownership. | 🟡 gate specified 2026-06-25 in `workspace/content-orchestrator/docs/audits/storefront-visual-safety-audit-20260625.md`; automated runner pending |
| UX-ORCH-9 | Medium | Close the customer-feedback loop: taxonomy for UX complaints, search failures, chat misses, review/support themes, “could not find product” signals, and post-purchase friction; feed prioritized issues into the UX/SEO/action ledgers. | 🔲 approval-first for any new customer-data collection or support workflow changes |

### Claude Code Harness Gaps (2026-06-26)

Source: audit against Hamza Khalid's 5-step Claude Code setup framework.
What we HAVE: `CLAUDE.md` (rich, 2 levels), `AGENTS.md`, 7 custom `/commands`, 3 skills, 4 agents,
8 hooks (3 PreToolUse + 5 PostToolUse in settings.json), 88 memory files with MEMORY.md index, MCP in global settings.
What we're MISSING:

| ID | Gap | Why it matters | Owner | Status |
|---|---|---|---|---|
| CC-1 | **`CLAUDE.local.md`** — local overrides file (never committed) | Env-specific paths, personal prefs, VPS-only rules stay out of git; currently everything is in committed CLAUDE.md or settings.local.json | [C] | ✅ 2026-06-26 |
| CC-2 | **`.claude/rules/` directory** — modular per-topic rule files | Currently all rules are monolithic in CLAUDE.md (~5KB); splitting into focused rule files (e.g. `seo.md`, `deploy.md`, `data-safety.md`) makes them toggleable, easier to maintain, and reduces prompt bloat | [C] | ✅ 2026-06-26 |
| CC-3 | **`.claude/workflows/` directory** — repeatable multi-step blueprints | Deploy, SEO audit, content humanizer, and session flows are currently ad-hoc commands or CLAUDE.md prose; formal workflow files let Claude follow structured blueprints without repeated prompts | [C] | ✅ 2026-06-26 |

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
Full detail: `workspace/content-orchestrator/docs/audits/EMART_AUDIT_20260610.md`, `EMART_REAUDIT_R20_20260617.md`

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
