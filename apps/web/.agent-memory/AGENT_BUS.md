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
| — | — | — | — |

---

## LAST COMPLETED (most recent per agent)

| Agent | When | What was done | Commit |
|---|---|---|---|
| Claude | 2026-06-25 | VA-1+VA-2 DONE: autonomous video orchestrator + Telegram see-and-approve gate. NEW files only (no worker.py/meta_* edits): `orchestrator.py`, `publish_approved.py`, `enqueue.py`, `reels_bot.py`. queue→building→review(gate)→approved→published; merit-based Codex escalation on QA fail; `--status` dashboard. E2E tick verified → review gate. **`reels_bot.py`** = dedicated-token Telegram bot (NOT OpenClaw's bot — two pollers conflict): posts each reel as a playable video w/ ✅Approve/❌Reject buttons. **AIRTIGHT no-auto-publish:** background publish cron REMOVED; only live cron is `orchestrator --tick */15` (builds only); the ONLY `--live` publish call is inside the Approve handler. Verified bot is the sole writer to `approved/`; worker never posts. **PENDING OWNER (to provide later): BotFather `REELS_BOT_TOKEN` → `apps/web/.env.local` (VPS) → `pm2 start reels_bot.py --name emart-reels-bot --interpreter python3` → send `/start`.** Web `/admin` page dropped (owner wants Telegram only). | `dcd17af` `3e9a7fe` |
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
