# Agent Bus — Live Coordination

**What this file is:** Single source of truth for what every agent is doing RIGHT NOW.
Every agent (Claude, Codex, OpenClaw) MUST read this before starting work and update it while working.

**Rules:**
1. **Session start:** Read this file. Check ACTIVE WORK. If your planned work overlaps, STOP and pick something else.
2. **Before editing files:** Add your entry to ACTIVE WORK with the files you'll touch.
3. **Session end:** Move your entry from ACTIVE WORK to LAST COMPLETED. Update TASKS.md.
4. **Crash/disconnect:** Stale entries older than 4 hours can be cleared by the next agent.

---

## ACTIVE WORK (who is doing what RIGHT NOW)

<!-- Format: | Agent | Started | Task | Files touching | -->
| Agent | Started | Task | Files |
|---|---|---|---|
| Codex | 2026-07-01 | Clean generated model-shot/owner-quality residue and stop generated assets from recurring as git dirt | `workspace/content-orchestrator/.gitignore`, `workspace/content-orchestrator/generated-assets/`, `workspace/content-orchestrator/model_shot.py`, `workspace/ledgers/action-events.jsonl`, session/task notes |

---

## LAST COMPLETED (most recent per agent)

| Agent | When | What was done | Commit |
|---|---|---|---|
| Codex | 2026-07-01 | Committed CO-9/CO-10 after re-running the logged verification suite; confirmed generated model-shot/owner-quality assets plus `model_shot.py` and the action ledger are separate active/generated state and left them unstaged. Closed INFRA-7 in OpenClaw skills: `wp_auto_publisher.py` confirmed dead/superseded by draft-gated `blog_generator.py`, and the humanizer skill now reads `EMART_DB_PASSWORD` from env/`.env.local` instead of embedding a plaintext literal. | `dd18759`, `5e2a2f0` |
| Claude | 2026-07-01 | **OpenClaw skill path audit** — found my earlier 360° audit missed `/root/.openclaw/skills/` entirely (outside the git repo, a third agent's own files). Fixed the same stale `/var/www/emart-platform/workspace/scripts/active/...` bug in `emart-competitor-prices`, `emart-humanizer`, `emart-meta-gen` SKILL.md files, and the matching doc in `process-manifest.md`. Logged 2 unfixed findings as `INFRA-7`: `emart-auto-publisher/SKILL.md` references a script (`wp_auto_publisher.py`) that doesn't exist anywhere, and `emart-humanizer/SKILL.md` has a plaintext DB password hardcoded — both need an owner call, not a guess. Did not touch any of Codex's in-progress CO-9/CO-10 files. | `412beac` |
| Codex | 2026-07-01 | Audited Content Orchestrator architecture/logic tree after CO-9 and fixed remaining contract drift: true owner/content/campaign gate propagation into content-pack social/video jobs, static-only frame contracts, Hermes reel QA readback, remote product-image URL handoff, and generated Meta scheduler fallbacks away from the retired `/var/www/.../workspace` tree. Added architecture audit note and CO-10 task-board closeout. Verified py_compile, node syntax, video quality-gate tests, Social Engine tests, in-memory pack smoke, and dry-run owner-gated dispatch. No publish/deploy/Woo writes. | `dd18759` |
| Codex | 2026-07-01 | Implemented CO-9 high-quality social/reel production lane: added canonical `content_pack.py` + content-pack contract, wired Content Orchestrator dispatch, daily reel producer, and Hermes enqueue/reel pipeline to the same rich product/script/voice/frame/QA/cost/approval schema, and fixed stopped PM2 cron cwd paths away from retired `/var/www/.../workspace`. Verified py_compile, video quality-gate tests, Social Engine tests, Hermes import, content-pack smoke, daily-producer smoke, and dry-run gated dispatch smoke. No publish/deploy/Woo writes. | `dd18759` |
| Claude | 2026-07-01 | **USEO-11 humanizer session.** Reframed the backlog: cross-referenced 2,868 unflagged products against `workspace/seo-review/agentic-score.jsonl` tiers → real humanizer-fit skincare backlog is **139 PARTIAL (mostly 0-sales long-tail)**, not "3,503" (core/bestsellers already done; the rest STRONG/GOLDEN avg 83). Wrote priority run lists (`impression-priority/active/priority-queue-{,skincare-fit-,haircare-makeup-}20260701.json`). Hand-wrote batch19 (5 priority PDPs: BoJ Revive, Numbuzin No.2 PDRN, Skin1004 Centella Ampoule, Medicube Collagen Jelly, Anua Heartleaf) — applied+revalidated+live. Fixed GMC hard-fail 74259 ("prescription"→"professional-strength"). Flagged **183 organic passes** via `residue_lint.lint()` over live content (holdout excluded, reversible marker `organic-pass-20260701`). Hardened `batch_topsellers.py` gate (require `<ul>/<ol>` + em-dash≤2.2/100w + 500-750w + em-dash auto-repair). Launched detached gated engine run (`run_detached.sh 15`). **Blocker: paid OpenRouter exhausted (30/30.2), free models 429-throttled → automated generation stalls; small top-up = fast path.** Cleanser 148-rework owner-deferred. | this commit |
| Claude | 2026-07-01 | **360° workspace audit + full fix pass (why-do-issues-keep-recurring investigation).** Root cause across the board: fixes kept addressing symptoms, not the mechanism regenerating them. Fixed: (1) 3 real `.gitignore` bugs — bare `*.html` was silently blocking future edits to Hermes's real Flask templates + a real social-post template from ever being trackable; `apps/web/SESSION-LOG.md` had a stale ignore rule contradicting actual cross-agent practice (this file is read/appended by every agent every session); `*.env.*` unintentionally matched `.env.example` templates. (2) Untracked 231 files that were tracked-before-ignore-rule-existed (124 social images, 97 social-calendar dated samples, hermes.db, 6 audit reports, 3 video job JSONs) — all kept on disk, just stopped showing as false-dirty forever. (3) Added forward-looking ignore rule for `social-calendar/20*/` dated samples (personas/ reusable assets correctly excluded from this). (4) Deleted the `vps` git remote — pointed at `/var/www/emart-platform`, which I made git-free earlier the same session; would have failed on next fetch/push. (5) Deleted 6 confirmed-safe branches (0 unique commits or confirmed-superseded content) — **6 more with real unmerged work (4 from 2026-06-26 post-freeze-board scope, 2 old substantial ones) intentionally left untouched per owner decision**, plus all remote branches. (6) Split TASKS.md: 4 fully-closed sections → new `TASKS_ARCHIVE.md`; most remaining sections have genuine mixed open/closed items and were left intact. (7) Reconciled SEO_MASTER.md's stale date stamps after verifying no real SEO-fact drift occurred. (8) Archived 3 orphaned memory files (confirmed superseded by newer indexed ones) with clear pointer notes. (9) Removed 1 duplicate promo image. Live site smoke-tested clean throughout every step; both July 1 social schedulers unaffected. | `810319e`, `de3715e` |
| Claude | 2026-07-01 | **VPS architecture fix — permanently retired the duplicate `/var/www/emart-platform/workspace` tree** that caused recurring "VPS git is N commits behind" drift audits. Root cause: `deploy.sh` was rsyncing `workspace/` + root-level docs to VPS on every deploy even though every cron/PM2 job already ran exclusively from `/root/emart-platform/workspace` — so an unused 1.1GB copy kept reappearing after every cleanup. Fixed `deploy.sh` to rsync `apps/web` only (matches the already-correct documented manual fallback). Archived `/var/www/emart-platform`'s `.git`, `workspace/`, `services/`, `packages/`, `apps/mobile/`, and all root-level dotfiles/docs to `/root/.attic-2026-07-01/var-www-emart-platform-retired/` (1.9GB). VPS runtime tree is now exactly: `apps/web/`, `apps/presence-server/`, `.deployed-rev` — nothing else, by design. Updated `drift_check.py` to treat VPS as git-free. Fixed 16 scripts (Python/JS/bash) that hardcoded `/var/www/emart-platform/...` paths (mostly `.env.local` lookups) to resolve their own repo root dynamically instead — 2 were real latent bugs (broken/missing fallback), 1 was a misdirected file path. **Note for Codex/other agents:** the two July 1 FB+IG social scheduler PM2 processes (`emart-social-fb-20260701-mixed`, `emart-social-ig-20260701-mixed`) were stopped and restarted pointing at `/root` instead of the now-archived `/var/www` copy — same campaign-plan.json, same result-ledger, zero posts had fired yet (idempotency keys + absolute time slots made this a safe no-op restart). Checkout-adjacent files (`checkout_monitor.js`, `checkout_monitor_run.sh`, `revenue_health_check.sh`) had ONLY their path resolution fixed (read-only monitoring/smoke-test scripts, no checkout/cart/payment logic touched) since the directories they depended on were moved. Live site smoke-tested clean throughout (homepage/shop/PDP/static assets/presence all 200). | `df742f0` + pending |
| Claude | 2026-07-01 | Audit + cleanup: rejected 10 stale video reels (review queue empty), archived 8 manual/preview job files to attic, deleted 5 PM2 stale-path entries (emart-seo-autoscan/meta-gen/checkout-monitor/competitor-prices/revenue-health) + pm2 save, fixed TASKS.md video orchestrator cadence (*/15 → 0 */2 * * *). | `198fdae` + this commit |
| Codex | 2026-07-01 | Built and scheduled July 1 mixed Bangla-English 18-post FB+IG campaign for requested brands; rendered/synced 36 assets, verified live media URL, passed Social Engine QA, and started PM2 schedulers for 08:20-21:40 BDT. | `74fae34` |
| Codex | 2026-06-30 | Implemented durable Local/VPS/origin drift controls: deploy revision marker, non-destructive deploy metadata check, read-only drift checker, PM2 expired campaign cleanup, and updated process/session/task/memory docs. | `cf993bc` |
| Claude | 2026-06-30 | docs reorg + 360° legacy path sweep. (1) `content-orchestrator/docs/` reorganized: 34 loose files → specs/guides/owner-actions/audits/archive; all references updated; seo-migration-forensic-readonly.mjs hardcoded path fixed. (2) ecosystem.config.cjs: 6 cwd entries repointed to content-orchestrator (5× scripts/active, 1× video-engine). (3) Crontab: 5 broken entries fixed (checkout_monitor, qdrant_sync, cleanup_chromium, video orchestrator, daily_producer). VPS ecosystem synced. WA-I closed. | `d8d7d89` `471ca1c` `571ff19` |
| Codex | 2026-06-30 | Closed remaining context/deploy-reference inconsistencies, refreshed agent brain, and updated session closeout docs. | `dc8d154` |
| Codex | 2026-06-30 | Pinned recent Codex completion rows to concrete commit hashes after later commits moved `HEAD`. | `f396ff1` |
| Codex | 2026-06-30 | Added automatic social/video done-history cleanup: completed published/rejected records archive into category-wise logical history, hot job folders stay clear, and runtime history ledgers are no longer tracked. | `ad16668` |
| Codex | 2026-06-30 | Cleaned accidental empty `workspace/workspace` tree by moving it to the dated attic and fixed active helper scripts whose repo-root calculation could recreate nested `workspace/workspace` paths. | `2347d58` |
| Codex | 2026-06-30 | Dropped third-party review-collection direction and converted active review work to a pending native magic-link flow backed by Woo/Next schema. | `2347d58` |
| Codex | 2026-06-30 | Audited 3,624 published products against 374 Next redirects; fixed stale Medipeel/APLB live product redirects plus La Roche/Nature/Round Lab legacy product aliases; deployed and passed live SEO/AEO gate. | `81dd4ce` |
| Codex | 2026-06-30 | Restored live Paula's Choice 2% BHA 30ml PDP route by removing stale `/shop` redirect and sending duplicate `-2` slug to the canonical product; deployed, smoke-tested, and passed SEO/AEO gate. | `8c0be6e` |
| Codex | 2026-06-29 | Built and scheduled Jun 30 bilingual 18-post FB+IG campaign using yesterday's brand mix but new products; verified current prices/offers, rendered FB 1:1 + IG 4:5 assets, passed Social Engine QA, synced live public images, and started PM2 schedulers for 08:00-22:10 BDT. | `51e3d8e` |
| Codex | 2026-06-29 | Finished remaining Content Orchestrator real-product model-shot pipeline, preserved source cutout/request/metadata/fulfilled Medicube asset, verified syntax/status/social/video quality gates, and left owner-review gate/no-publish guardrails intact. | `1c55ecf` |
| Claude | 2026-06-28 | Full session: (1) SEO sweep — CWV baselines, SEO-ORCH-3/6 closed, D6 documented, GROW-1 map (4,055+ pages/8 clusters/32 gaps). (2) BLOG-1 blog hero gen done. (3) CO-5 orchestrator tick + crontab done. (4) Hermes agent dashboard built — 22 engines, unified Hermes⚡+OpenClaw🐾 lanes, AI brain, model switcher, mobile UI, job tracking, follow-up conversations. PM2 + Nginx + auth. (5) Agent-task-routing doc. (6) Cleaned 10 stale PM2 processes. | uncommitted |
| Codex | 2026-06-26 | Closed `USEO-8` source-of-truth state after verifying commit `b294337` already added Tier-2 category guides + FAQ schema for 7 categories. Updated `TASKS.md`, `SEO_MASTER.md`, session log, and verified lint/build. | `a3f5467` |
| Codex | 2026-06-26 | Reconciled `workspace/SEO_MASTER.md` and `workspace/TASKS.md` as SEO source-of-truth docs: added ownership standard, current SEO execution mirror, SEO-22 wave mirror, owner-row aliases, schema map corrections, and aligned stale task statuses for SEO-ORCH, D8, SEO-2/4/5, and UX ledger consistency. | `91936aa` |
| Codex | 2026-06-26 | Added SEO-22 execution plan to `workspace/TASKS.md` and completed Wave 1: category-aware blog post guide labels, semantic H2 coverage for `/brands`/`/sale`/`/new-arrivals`, scannable education content rendering, safe ingredient FAQ JSON-LD, and plain-text FAQ schema answers for ingredient/concern education. | `e2642cf` |
| Claude | 2026-06-26 | Built Content Orchestrator — strategy brain above all generation engines (`workspace/content-orchestrator/`). 12-theme selling taxonomy (`themes.json`: fast-selling, clearance, new-arrivals, giveaway, reviews, influencer, ingredients, trending, innovation, doctor-reco, cosmetics, color-cosmetics) mapping demand-signal→format→channel→generator→gate→metric→cadence. `orchestrator.py` planner+dispatcher+status: reads real demand from `social-engine/performance/latest.json` + GSC striking-distance, builds dated content calendar, emits NATIVE job specs (social campaign JSON `approval_status=draft`, video queue `status=pending`, content/SEO briefs `proposed`) parked at existing campaign/content/owner gates. Dry-run default; never publishes, never writes Woo. Reuses Creative/Social/Video/blog/SEO; flags slug→id + 4 live Woo resolvers as next wiring. Added `manual` (owner-triggered one-off into any theme, still gated), `learn` (self-improving loop: scores themes from action-ledger outcomes → `theme_weights.json` per_run multiplier the planner consumes; cadence stays owner-gated), and `brain.py` (optional LLM angle/caption + tuning reflection reusing humanizer's OpenRouter free chain — no new secret; Hermes via `OPENROUTER_MODEL`, OpenClaw via `OPENCLAW_BASE_URL`). `--llm` verified live (real hook generated). Model doc `docs/claude-reference/content-orchestrator.md`. THEN built CO-2/3/4: `woo.py` 4 live read-only Woo resolvers (new-arrivals, clearance=real `on_sale` only, category slug→id, pa_concern) reusing Social Engine `woo_get`; slug→product_id resolution; `dispatch --ledger` writes one action-ledger entry per item with `sub_category=theme` feeding the learn loop. Verified live: 8/8 real candidates, clearance items confirmed genuinely on-sale, learn groups ledger entries by theme. Tasks CO-1..CO-7 (CO-1/2/3/4/6 ✅). New isolated files, uncommitted in shared dirty tree. | uncommitted |
| Codex | 2026-06-26 | Created Creative Engine use-case sample pack and corrected persona standard: product-first, Codex product-in-hand/beside-face preferred, model-only fallback allowed only while holding-shot generation is pending, white/tile overlay rejected. Worker logic updated accordingly. | uncommitted |
| Codex | 2026-06-26 | Added Creative Engine high-density rendering: default 2x Chromium capture with Lanczos downsampling to official platform dimensions, `render_scale` request/result contract, CLI/social shim flag, and QA reporting. Verified final 1080x1920 render pass. | uncommitted |
| Codex | 2026-06-26 | Added Creative Engine product container-shape classification and dynamic product-image framing for tall bottles/droppers, tubes, jars, compacts, sheet packs, boxes, pouches, and general products. Verified classifier and sample renders. | uncommitted |
| Codex | 2026-06-26 | Full Creative Asset Engine migration: shared renderer now supports FB 1:1, IG 4:5, vertical product hero, value card, brand end card, and blog OG. Video worker calls Creative Engine directly; legacy video card scripts are shims; HyperFrames is frame-only for product/value/brand scenes. Smoke rendered `creative-migration-smoke.mp4` with local QA 96/pass. | uncommitted |
| Claude | 2026-06-26 | Batch A SEO proposals: SEO-7 structural QA report, SEO-2 journal internal-link cluster proposals (50 blog posts × 0 internal links = critical gap), SEO-4 buying guide gap proposals (5 Tier 1 + 7 Tier 2 categories), SEO-5 contextual link + FAQ proposals for existing and new guides, SEO-1 title cleanup (pipeline clean, no targets), D8 brand page content coverage audit (387 pages × generic 1-sentence description). 6 artifact files created under workspace/audit/active/. | uncommitted artifacts |
| Claude | 2026-06-26 | Freeze-safe Waves 1-8: SEO-GAP-4 all-verified, SEO-GAP-1/3 proposals+baselines, ledger instantiated (30 entries), measurement loop, content/campaign contracts, ORCH-3 lock/retry/dead-letter, ORCH-6 DR plan+backup integrity, ORCH-7 CI, SEO-3 category map, SEO-6 scanability audit, D6/D8/BLOG-1 proposals, growth/visual/feedback specs. | pending commit |
| Claude | 2026-06-26 | HyperFrames video engine integration: HTML composition renderer with GSAP animations, Phase 3 validated, final HQ reel sent to Telegram. | `1226833` |
| Codex | 2026-06-26 | SEO-GAP-4 control-loop classifier + live verifier + URL-policy registry (SEO-ORCH-3/6). SEO-GAP-1/3/4 task board proposals. Fresh read-only SEO data-gap audit runner. | `ea359b5` |
| Codex | 2026-06-25 | X8a GA4 performance loop closed. X8c approval-status verified. VID-6/WSC-9 hyperframes classified (now formalized). Priority 7 visual safety audit. Priority 5+6 runtime docs/ledger schema. | `4a7ef3e` `271bb02` `817f310` |
| Claude | 2026-06-25 | ORCH-5 ecosystem.config.cjs, WA-D/WA-H/VID-2/VID-3/VID-5 closed. | `97f9618` |
| Codex | 2026-06-25 | Priority 5+6 docs/specs: updated versioned PM2/cron/detached/worker process manifest with freshness SLOs, created durable queue/state contract, and designed unified SEO/UX action-event ledger schema. TASKS marks ORCH-2/4/8 docs complete and SEO-ORCH-2/UX-ORCH-2 schema designed with ledger instantiation pending. | `328572a` |
| Codex | 2026-06-25 | Closed owner-assigned Codex leg: SEO-ORCH-1 full-catalog deterministic agentic scoring (3,625 products, aligned tiers), X8a Social Engine Meta/GSC/GMC performance import with picker smoke, and UX-ORCH-1 visible trust-source/fallback relabeling. GA4 product-level export remains the only X8a input gap. | `d7dc9c0` |
| Codex | 2026-06-25 | B0 coordination reconciliation: current tracked tree checked; only generated Social Engine runtime state was hanging, now ignored via `workspace/social-engine/.gitignore`. Rule clarified: old `pending` rows are historical only; live ownership comes from ACTIVE WORK + `git status --short`. | reconciliation commit |
| Claude | 2026-06-25 | Reel quality + consistency overhaul (owner iterations): brand-themed cards w/ real logo + dual price; loudness hard-gate + fresh-build enqueue; caption-window fix; voiceover Bangla-phonetic pronunciation; **canonical reusable Emart model** (`personas/emart-model/clean-portrait.png`, Codex face-matched) + free `presenter_card.py` composite fallback; standard 5-frame layout (clean model→model+product→product→value→brand, ONE face). COSRX + Dr.Althea reels delivered to Telegram. Local=Git=VPS reconciled, session closed. | `0bbd1f1` `0958ddf` |
| Codex | 2026-06-25 | Fulfilled video bridge image request `emart-model__clean-portrait-reusable`: generated product-free reusable Emart model portrait from `reference-holding.png`, saved 1080x1920 asset to `workspace/video-engine/personas/emart-model/clean-portrait.png`, and verified bridge queue is empty. | `0bbd1f1` |
| Codex | 2026-06-25 | UX-ORCH-1 trust-data contract audit: inventoried storefront live/verified/stock/review/sold/viewer/social-proof claims; created `workspace/content-orchestrator/docs/audits/storefront-trust-data-contract-20260625.md`; marked board as contract done with visible relabeling/source flags pending. | `b6f4836` |
| Claude | 2026-06-25 | Priority lane 1-3: (1) WA-G+ORCH-5 credential security — 12 OpenClaw scripts migrated to `creds.py`/`openclaw.env`, IDENTITY.md scrubbed, WC key updated to key_id 34, WC localhost Host+XFP fix, all crons verified. (2) ORCH-1 deploy hardening — deploy lock, selective staging, lockfile-before-rsync, .next rollback, runtime-state exclusions. (3) SEO-ORCH-1 canonical URL merge — `/product/`→`/shop/` normalization + weighted metric merge in GSC tracker; completed-content registry wired into nightly `cmd_full()`; humanizer queue now correct (317 registry, 97 GSC-excluded, 402 remaining). **Next session: Task 4 UX-ORCH-1 trust audit.** | `673cadf` `818065b` |
| Codex | 2026-06-25 | SEO-ORCH-1 registry leg: added durable humanizer completed-content registry from `_emart_humanized`, switched humanizer queue completion logic from inferred agentic tiers to canonical paths, and verified queue counts are no longer zero. | `818065b` |
| Codex | 2026-06-25 | Social Engine upgrade + June 25 review pack: product picker/history hook/performance-score input/IG 4:5 variants/contact sheet/design-source QA plus 18 generated assets (10 pipeline + 8 Codex AI-background composites). No publish/deploy. | `e8dd6dd` |
| Claude | 2026-06-25 | VA-3 quality fixes (owner rejected a reel: silent + dummy product, yet scored 96). Root cause: enqueue reused a stale checkpointed silent reel + only ffprobe gated. Fixes: `enqueue.py` strips stale stages → always fresh build; `orchestrator.py` API-free loudness HARD-gate (<-40 LUFS auto-reject) + forces qa_provider=master. **`worker.py` caption-window fix (captions confined to photo frames, no longer painting over value/brand cards) is LIVE but LEFT UNCOMMITTED in the shared dirty tree — `worker.py` also carries Codex's uncommitted publisher edit (`META_PUBLISH`/`--job`); @Codex please fold both hunks into your worker.py commit.** Rebuilt clean COSRX demo (real model+product via Codex social-calendar asset, -14.5 LUFS, clean cards) → delivered to owner Telegram for judgement. | `724704a` |
| Claude | 2026-06-25 | VA-1+VA-2 DONE: autonomous video orchestrator + Telegram see-and-approve gate. NEW files only (no worker.py/meta_* edits): `orchestrator.py`, `publish_approved.py`, `enqueue.py`, `reels_bot.py`. queue→building→review(gate)→approved→published; merit-based Codex escalation on QA fail; `--status` dashboard. E2E tick verified → review gate. **`reels_bot.py`** = dedicated-token Telegram bot (NOT OpenClaw's bot — two pollers conflict): posts each reel as a playable video w/ ✅Approve/❌Reject buttons. **AIRTIGHT no-auto-publish:** background publish cron REMOVED; only live cron is `orchestrator --tick */15` (builds only); the ONLY `--live` publish call is inside the Approve handler. Verified bot is the sole writer to `approved/`; worker never posts. **PENDING OWNER (to provide later): BotFather `REELS_BOT_TOKEN` → `apps/web/.env.local` (VPS) → `pm2 start reels_bot.py --name emart-reels-bot --interpreter python3` → send `/start`.** Web `/admin` page dropped (owner wants Telegram only). | `dcd17af` `3e9a7fe` |
| Codex | 2026-06-25 | Committed finished Codex clusters and left only Claude/video files dirty; safety backup saved under `workspace/agent-safety-backups/20260624-222852/` | `dcd17af`, `847baf2`, `961fc7a`, `c88b84c`, `20a1c50` |
| Codex | 2026-06-25 | Built Agent Brain v1: `agent_brain.py`, `agent_start.py`, `agent_close.py`, generated `workspace/AGENT_BRAIN.md`, and wired B0 to the quick-start command; read-only/no-secret/no-live-service design | pending (shared dirty tree) |
| Codex | 2026-06-25 | Closed audit-governance session: added freeze-safe ORCH/SEO/UX priority lane, UX-ORCH tasks, ORCH-8, workspace conflict audit WSC-1–WSC-7, and token-efficient session batches B0–B8; no code/live/protected-commerce changes | pending (task-board/session-log only; shared dirty tree) |
| Codex | 2026-06-24 | Fulfilled 1/1 Codex image order; completed WA-B/A/C: local-only Meta dependencies and unified token source, one queue/plan-driven dry-run publisher, generated SEO state untracked; VPS read-only Meta validation passed | pending (shared dirty tree) |
| Codex | 2026-06-24 | Produced QA-checked 827-word plain-English blog pilot and recorded minimal English-in-Bangla language preference | pending |
| Codex | 2026-06-24 | Produced and QA-checked unpublished 862-word Bangla blog pilot; recorded Hermes credential and publish-gate blockers as WA-G/WA-H | pending |
| Codex | 2026-06-24 | Added tested `emart-stop-slop-v1` soft humanizer lint layer; preserved Emart AEO voice; fixed hard-gate pass summary | pending |
| Codex | 2026-06-24 | Deduplicated page-structure audit; added only SEO-6 education scanability and SEO-7 imported-content structural QA | pending |
| Codex | 2026-06-24 | Added SEO-3–SEO-5 category coverage, buying-guide, internal-link, and useful-FAQ tasks from live/source audit | pending |
| Codex | 2026-06-24 | Added GROW-1–GROW-5 authority/distribution backlog with safe SEO and community-marketing guardrails | pending |
| Claude | 2026-06-24 | Video engine: bn-BD voiceover (edge-tts) + ducked music + −14 LUFS loudnorm; native-Bangla browser caption overlays w/ fades; ALL 3 persona libraries populated; value/bullet + branded end cards; blurred-fill for branded frames; master QA (technical+loudness+multi-frame vision+captions) report card; crop-pan motion fix; automated Codex image handoff (codex_bridge: emit→list→fulfill→consume, idempotent). **WA-E (silent reels + empty persona libs) VERIFIED RESOLVED — close it.** Staying OUT of WA-A/B/C (Codex/live-publishing). WA-D (scripts/active archival) is mine but DEFERRED until Codex finishes the meta_* publishers there. | `workspace/video-engine/**` (untouched by Codex) |
| Codex | 2026-06-24 | Built Phase 0 video engine, switched default scripts to OpenRouter free Gemma, added local reel QA, generated Beauty of Joseon sample reel | pending |
| Claude | 2026-06-23 | PDP nudge fix, WhatsApp escalation link, Recently Viewed move, social_image_gen seed fix, SPF record fix, register 500 fix, checkout/email verification, TikTok API setup guide, Codex work synced | `5b5461d`, `c3dd2f6` |
| Codex | 2026-06-20 14:34 | C5 deploy gate closed, pa_concern 57 applied, whole-catalog concern audit (124 critical) | `7742191`, `6057a58`, `2876565` |
| Codex | 2026-06-20 ~13:00 | Cosmetic shade variant exclusion, internal review hardening, blog gap noise filter | `fed8cd5`, `bd3c822` |

---

## CONFLICT ZONES (files that multiple agents commonly touch)

These files need extra care — check git diff before editing:

```
workspace/TASKS.md              ← both Claude and Codex update this
workspace/SEO_MASTER.md         ← both Claude and Codex update this  
apps/web/SESSION-LOG.md         ← all agents append to this
apps/web/.agent-memory/MEMORY.md ← all agents read/write
workspace/seo-review/*.json     ← gsc_tracker writes, agents read
apps/web/src/lib/seo/product.ts ← SEO schema changes
apps/web/src/app/shop/[slug]/page.tsx ← PDP changes
workspace/content-orchestrator/scripts/active/meta_*  ← HOT (2026-06-24): Codex fixing WA-B/A publishers + scheduler; Claude holds WA-D archival here until done
```

**Before editing a conflict zone file:**
1. `git diff HEAD -- <file>` — check if someone else changed it
2. `tail -5 apps/web/SESSION-LOG.md` — check latest agent activity
3. If modified since you last read it, re-read before editing

---

## HOW TO USE THIS FROM EACH AGENT

### Claude Code (this agent)
```
Session start:  cat apps/web/.agent-memory/AGENT_BUS.md
Before work:    Edit ACTIVE WORK table with your task
Session end:    Move to LAST COMPLETED, append SESSION-LOG.md
```

### Codex
```
Session start:  Read apps/web/.agent-memory/AGENT_BUS.md
Before work:    Edit ACTIVE WORK table with your task
Session end:    Move to LAST COMPLETED, append SESSION-LOG.md
```

### OpenClaw
```
Reads:          apps/web/.agent-memory/AGENT_BUS.md (via workspace)
Cannot edit:    Limited write access — logs to SESSION-LOG.md only
```

---

## TASK OWNERSHIP RULES

To prevent two agents working on the same thing:

| Task type | Default owner | Why |
|---|---|---|
| Code changes (Next.js/React) | Claude | Needs build+deploy+smoke test |
| WooCommerce data (meta, taxonomy) | Codex | Better at batch DB operations |
| Schema/SEO code changes | Claude | Needs type-check + build |
| Content generation (humanizer/FAQ) | Codex | Long-running batch scripts |
| Blog generation | OpenClaw/PM2 | Automated cron |
| SEO pipeline (GSC/trends) | Automated cron | Runs at 2:30 AM |
| System monitoring | OpenClaw | site_health, daily_report |
| Deploy (rsync/pm2/push) | Claude | Needs full deploy sequence |

If you need to do something outside your default ownership, check AGENT_BUS first.
