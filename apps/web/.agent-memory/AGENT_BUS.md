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
| Claude | 2026-06-26 | HyperFrames video engine integration: installed hyperframes npm, built HTML composition renderer with GSAP animations (Ken Burns, crossfades, staggered bullet reveals, animated brand card), created `reel_hyperframes.py` Python wrapper, wired into `worker.py` as default renderer with ffmpeg fallback. Full Phase 3 validation: lint 0 errors, validate 0 errors, draft + final HQ render (1080×1920, 24fps, H.264 yuv420p, -14 LUFS, CRF 18). Fixed owner feedback: text positioning to lower third, E-MART.COM.BD uppercase, compact CTA, 6 bullets matching title, vertically centered value card. Final reel sent to Telegram. | pending |
| Codex | 2026-06-26 | Extended SEO-GAP-4 control-loop script with bounded live verifier and checked 20 P0/P1 rows. Confirmed 1 product 404, 6 query URLs redirecting to canonicals, 12 category pagination query URLs returning 200/indexable, and 1 out-of-range pagination 404/noindex. TASKS now points next to SEO-ORCH-6 URL-policy registry rows. | pending |
| Codex | 2026-06-26 | Added read-only SEO-GAP-4 technical control-loop classifier and generated JSON/CSV/Markdown reports classifying 201 sitemap/GSC/crawl drift sample rows into P0/P1/P2/P3 action classes. TASKS now marks SEO-GAP-4 / SEO-ORCH-3 first classifier done; live verification and URL-policy registry work remain pending. | pending |
| Codex | 2026-06-26 | Verified SEO-GAP-1/3/4 against the fresh audit, prioritized them logically, added a Fresh SEO Gap Action Queue to `workspace/TASKS.md`, and cross-linked them into SEO-ORCH-3/4/6 without authorizing automatic SEO or route changes. | pending |
| Codex | 2026-06-25 | Implemented read-only fresh SEO data-gap audit runner, ran live GSC+GA4+sitemap crawl+Playwright render audit, incorporated owner-provided GSC Page Indexing counts, and generated review-batched task proposals without editing TASKS.md. | pending |
| Codex | 2026-06-25 | Captured untracked `workspace/video-engine/hyperframes/` as VID-6/WSC-9: classify before staging/cleanup because it is a large local video/prototype tree with `node_modules`. | local commit |
| Codex | 2026-06-25 | Closed X8a Social Engine performance loop: added read-only GA4 product landing-page exporter, generated ignored 28-day GA4 product JSONL, merged GA4 with GSC/GMC into ignored `performance/latest.json`, and picker smoke passed with `performance_weighted` selections. | local commit |
| Codex | 2026-06-25 | Closed X8c Social Engine approval-status semantics by verification: unit test confirms approved campaigns set `publish_allowed`, approved/review plan dry-runs show the right publish gate, and `meta_schedule.js --publish` fails closed on `review_required` before any Meta call. | local commit |
| Codex | 2026-06-25 | Priority 7 read-only visual safety audit for UX-ORCH-3/4/8: created `workspace/docs/audits/storefront-visual-safety-audit-20260625.md` with overlay/dialog, design-system drift, product-card/PDP control, and a11y-gate findings; accounted for `.playwright-mcp/` historical artifacts and noted no repeatable app-owned harness/package is present. TASKS marks Priority 7 audit/spec partial. | pending |
| Claude | 2026-06-25 | ORCH-5 `ecosystem.config.cjs` (env-isolated PM2 defs), deleted 3 crash-looping dated campaign processes, archived blog_generator cred cleanup, closed WA-D/WA-H/VID-2/VID-3/VID-5 in TASKS.md. | pending |
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
