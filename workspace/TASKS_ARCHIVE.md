# Emart Task Board Archive

Fully-closed sections moved out of `workspace/TASKS.md` to keep the active board
readable every session. Only sections where every item was ✅ at time of archival
are moved here — nothing with open items gets archived. See `ARCHIVE_INDEX.md`
for the broader archive map.

---

### Blog Enhancement

| ID | Task | Owner | Status |
|---|---|---|---|
| BLOG-1 | **Blog posts should include a generated featured image** relevant to the topic. Use `social_image_gen.py` or similar compositor to produce a branded blog hero image (topic text + product visual + Emart template). Image spec to be standardized later by owner. | [C] | ✅ 2026-06-28 — `blog_hero_gen.py` built: renders branded 1200×630 OG images via creative engine (blog_og format), auto-detects badge from title, picks product by category, uploads to WP + sets as featured image. Backfill mode (`--backfill --limit N`) for existing posts. 5 test images verified. |

---

### Fresh SEO Gap Action Queue — 2026-06-26

Source: `workspace/audit/active/seo-gap-audit-20260626.md` and `workspace/audit/active/seo-gap-taskboard-proposals-20260626.md`.
Verified with live GSC API, live GA4 API, 4,205 sitemap URLs, 66 static crawl pages, 14 rendered Playwright pages,
and owner-provided GSC Page Indexing screenshot counts. These rows are review/prioritization tasks only; they do not
authorize automatic title rewrites, content rewrites, route changes, sitemap changes, WordPress/Woo writes, deploys, or PM2 restarts.

| Rank | ID | Maps to | Priority | Finding | Safe next action | Status |
|---|---|---|---|---|---|---|
| 1 | SEO-GAP-4 | SEO-ORCH-3, SEO-ORCH-6 | 🔴 highest SEO technical | All 38 URL-policy rows now live-verified (2026-06-26): concern query→301 to clean path (page param stripped), origin query→301, pagination→200 with self-canonical. 0 drift, 0 unmatched. Registry updated to `all-verified` version. One finding: concern redirects strip `?page=N`. | No route/canonical changes needed; concern page-param stripping is documented for future review. | ✅ 2026-06-26 all-verified |
| 2 | SEO-GAP-1 | SEO-ORCH-4, SEO-ORCH-2, SEO-5 | 🟠 high commercial upside | 7 click-gap URLs analyzed with per-page GSC query data + GA4 engagement join. Full proposals at `workspace/audit/active/seo-gap1-ctr-click-gap-proposals-20260626.md`. 3 actionable title/meta candidates (CeraVe, SKIN1004, Medicube), 2 content-depth gaps (SEO-4/5), 2 no-action. All 30 entries (8 fresh + 22 imported stale) in durable ledger with live baselines captured. | Owner reviews 3 title/meta proposals; SEO-4/5 handle content gaps. | ✅ 2026-06-26 proposals + baselines done |
| 3 | SEO-GAP-3 | SEO-ORCH-2, SEO-ORCH-4, SEO-ORCH-5 | 🟠 high measurement/content quality | 44 usefulness-flagged URLs triaged: 4 genuine concerns (Category A), 10+ false positives (PDP scan behavior, utility pages). Category A routes to existing tasks: SEO-3/4/5 for content depth, brands backlog for `/brands`. Full triage at `workspace/audit/archive/2026-06-30-active-cleanup/seo-gap3-usefulness-triage-20260626.md`. | Category A URLs backfilled into action ledger; no new content rewrites needed. | ✅ 2026-06-26 triage done |

---

### SEO — Striking-Distance Command (2026-06-24)

**Why:** Pages ranking 11-20 have the highest ROI for page-1 promotion — Google already trusts them enough to show on page 2, so small on-page improvements (H1 alignment, inbound internal links, content depth on the answering section) consistently push them to page 1. The GSC tracker scores position 11-20 at only 0.8 weight because the system was built for CTR optimization on existing top-10 winners, not for page-2→page-1 promotion. A dedicated `striking-distance` command surfaces these pages sorted by impressions with their top queries, so the team can act on them without manual JSON filtering. Today: 185 pages sit in position 11-20.

| ID | Item | Owner | Status |
|---|---|---|---|
| SD-1 | Add `striking-distance` subcommand to `gsc_tracker.py` — filter pos 11-20, sort by impressions, show top query per page | [C] | ✅ 2026-06-24 — 185 pages surfaced; run `python3 gsc_tracker.py striking-distance` |

---

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
