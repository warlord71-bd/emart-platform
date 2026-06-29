---
name: project_meta_blog_resume_20260610
description: "Resume state for meta-description regen (#14) + blog generator readiness as of 2026-06-10 01:25 UTC"
metadata: 
  node_type: memory
  type: project
  originSessionId: 5ca2a39f-f3ba-4645-8cc7-5f618d4bf23b
---

**Meta description regen (TASKS.md #14, 1304 IDs = 781 missing + 523 bad "original" pattern):**
- `meta_generator.py` (`/var/www/emart-platform/workspace/docs/meta_generator.py`, gitignored, VPS-only) now supports `--force` and `--ids-file`.
- 38/1304 already done (dry-run, no DB writes) → `workspace/audit/active/meta-generator-2026-06-10-003216.jsonl`.
- Remaining 1266 IDs → `workspace/docs/meta_regen_ids_remaining_20260610.txt`.
- Background dry-run resumed: PID 448966, started 2026-06-10 01:22 UTC, output → `workspace/audit/active/meta-generator-2026-06-10-resume.log`. Command: `EMART_DB_PASSWORD=<from secure runtime env> OPENROUTER_API_KEY=<from /root/.openclaw/credentials/openrouter_default.json 'apiKey'> python3 workspace/docs/meta_generator.py --dry-run --force --ids-file workspace/docs/meta_regen_ids_remaining_20260610.txt`.
- **Why:** owner said "meta first" — this task takes priority over blog generation; both compete for the same OpenRouter free-tier quota.
- **How to apply:** check if PID 448966 still running / log progress at session start. Once dry-run completes, spot-check JSONL output quality, then re-run the SAME command WITHOUT `--dry-run` to write `_emart_meta_description` to DB, then revalidate `tag:products` via `/api/revalidate` (x-revalidate-secret header).

**Blog generator (TASKS.md C1) — ready to run, NOT scheduled:**
- `/root/.openclaw/workspace-emart/blog_generator.py` fully rewritten (GSC + evergreen topics, 5 writer personas round-robin, anti-AI-pattern prompt rules instead of post-hoc humanizer, in-content internal auto-linking to `/ingredients/*`/`/concerns/*`/`/category/*`, always fetches+attaches a featured product image, OpenRouter models fixed to `moonshotai/kimi-k2.6:free`, `google/gemma-4-31b-it:free`, `openai/gpt-oss-120b:free`, `google/gemma-4-26b-a4b-it:free`).
- Live-tested successfully: published post 93922 "Innisfree Skincare Guide for Bangladesh" via `openai/gpt-oss-120b:free` (kimi/gemma hit 429s first).
- State file `/root/.openclaw/workspace-emart/blog_generator_state.json`: `gsc_used_indices: [0]` (Innisfree consumed), `persona_index: 1` (next persona = `kbeauty_routine_friend`), `used_indices: [0..8]` unchanged for evergreen pool.
- **Why not running yet:** owner said "blog next" then "just keep blog as ready to run mode" — explicit sequencing, do not run again or add cron until meta regen (#14) has progressed.
- **How to apply:** once #14 has made solid progress (e.g., dry-run done + real apply started/done), run blog_generator.py manually once (will pick `gsc:1` = COSRX 6 Peptide Skin Booster Serum topic, persona `kbeauty_routine_friend`), verify schema/links on the new post, then add cron `0 2,10,18 * * *` (3x/day, per script docstring).

**Other open items from this session (also in TASKS.md C2/C3):**
- TikTok added to Organization `sameAs` in `layout.tsx` (Local + VPS, identical) — undeployed (no build/rsync/restart/commit/push yet).
- Reddit/LinkedIn `sameAs` blocked — no URLs in `companyProfile.ts`; ask owner for real profile URLs, do not fabricate.
- Owed: strategic SEO note on Android/Google search dominance + AI/LLM search surfaces + TikTok/FB/YouTube trending-topic awareness for blog topics — schema audit groundwork done but synthesis not yet written/delivered.

**The "dump" the owner asked about:** `workspace/audit/active/meta-generator-2026-06-10-003216.jsonl` (and its `-resume.log` continuation) — these are dry-run preview logs (post_id, slug, title, proposed meta_desc, length, warnings) for review BEFORE any DB write, and also let future runs skip already-completed IDs. Not a database dump; nothing applied to Woo/WP yet.
