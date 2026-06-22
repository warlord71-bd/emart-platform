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
| (none) | | | |

---

## LAST COMPLETED (most recent per agent)

| Agent | When | What was done | Commit |
|---|---|---|---|
| Claude | 2026-06-22 | Workspace sync+commit+push, OpenRouter free model fix (chat 402→200), chat minimize button, VPS git alignment | `6ce5c4b`, `5a94f1e`, `5d079a8` |
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
