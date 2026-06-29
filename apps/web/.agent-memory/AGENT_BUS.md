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

---

## LAST COMPLETED (most recent per agent)

| Agent | When | What was done | Commit |
|---|---|---|---|
| Codex | 2026-06-29 | Built and scheduled Jun 30 bilingual 18-post FB+IG campaign using yesterday's brand mix but new products; verified current prices/offers, rendered FB 1:1 + IG 4:5 assets, passed Social Engine QA, synced live public images, and started PM2 schedulers for 08:00-22:10 BDT. | current commit |
| Codex | 2026-06-29 | Finished remaining Content Orchestrator real-product model-shot pipeline, preserved source cutout/request/metadata/fulfilled Medicube asset, verified syntax/status/social/video quality gates, and left owner-review gate/no-publish guardrails intact. | `1c55ecf` |
| Claude | 2026-06-28 | Full session: (1) SEO sweep — CWV baselines, SEO-ORCH-3/6 closed, D6 documented, GROW-1 map (4,055+ pages/8 clusters/32 gaps). (2) BLOG-1 blog hero gen done. (3) CO-5 orchestrator tick + crontab done. (4) Hermes agent dashboard built — 22 engines, unified Hermes⚡+OpenClaw🐾 lanes, AI brain, model switcher, mobile UI, job tracking, follow-up conversations. PM2 + Nginx + auth. (5) Agent-task-routing doc. (6) Cleaned 10 stale PM2 processes. | uncommitted |
| Codex | 2026-06-26 | Closed `USEO-8` source-of-truth state after verifying commit `b294337` already added Tier-2 category guides + FAQ schema for 7 categories. Updated `TASKS.md`, `SEO_MASTER.md`, session log, and verified lint/build. | current commit |
| Codex | 2026-06-26 | Reconciled `workspace/SEO_MASTER.md` and `workspace/TASKS.md` as SEO source-of-truth docs: added ownership standard, current SEO execution mirror, SEO-22 wave mirror, owner-row aliases, schema map corrections, and aligned stale task statuses for SEO-ORCH, D8, SEO-2/4/5, and UX ledger consistency. | current commit |
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
| Codex | 2026-06-25 | UX-ORCH-1 trust-data contract audit: inventoried storefront live/verified/stock/review/sold/viewer/social-proof claims; created `workspace/docs/audits/storefront-trust-data-contract-20260625.md`; marked board as contract done with visible relabeling/source flags pending. | `b6f4836` |
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
workspace/scripts/active/meta_*  ← HOT (2026-06-24): Codex fixing WA-B/A publishers + scheduler; Claude holds WA-D archival here until done
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
