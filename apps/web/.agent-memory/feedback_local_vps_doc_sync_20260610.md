---
name: feedback_local_vps_doc_sync_20260610
description: Why workspace docs/memory diverge between Local and VPS, and the rule to prevent it going forward
metadata:
  type: feedback
---

`workspace/TASKS.md`, `workspace/SEO_MASTER.md`, `apps/web/SESSION-LOG.md`, `apps/web/.agent-memory/*`, and `workspace/docs/*.py` are **separate physical files** in `/root/emart-platform` (Local) and `/var/www/emart-platform` (VPS) — there is no real-time symlink between the two trees for these paths. The only existing symlink is `/root/.claude/projects/-root-emart-platform/memory -> /var/www/.../apps/web/.agent-memory` (external to both git repos, only affects Claude's auto-memory writes which land on the VPS copy).

**Why this caused complexity (2026-06-10 incident):** I edited TASKS.md/SEO_MASTER.md/meta_generator.py only via the VPS path during a session, while Local had its own independent edits from a prior (Codex) session to TASKS.md/SESSION-LOG.md. By session end the two trees had silently diverged in different files — required a manual diff+merge+symlink-investigation to reconcile before committing. Took real-symlink-across-repos was considered but rejected: an in-repo symlink to an absolute `/var/www/...` path would be committed as a broken symlink object on any other clone.

**How to apply going forward:**
- Before editing any of TASKS.md / SEO_MASTER.md / SESSION-LOG.md / .agent-memory/* / workspace/docs/*.py, quickly check both Local and VPS copies aren't already diverged from a prior session (`diff` the specific file across both trees) — don't assume one is current.
- Prefer making these doc/script edits via ONE path consistently within a session (VPS path is fine, matches "VPS is source of truth").
- **Before committing**, always run a quick `diff`/sync pass for these specific files between Local and VPS (not just `git status` in one tree) — this is now a required step, not optional, per [[feedback_universal_deploy_sequence]].
- `apps/web/src/app/layout.tsx` and other `apps/web/src/**` code files are correctly NOT synced this casually — those go through the build/test/deploy gate before being committed (see C2 in TASKS.md for the pending TikTok schema example).
