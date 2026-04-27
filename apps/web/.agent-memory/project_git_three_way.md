---
name: Three-way git layout (Local + VPS + Repo)
description: How Local /root, VPS /var/www, and origin GitHub repo relate; single-branch model after 2026-04-26 reconciliation; Local→VPS→Repo workflow
type: project
originSessionId: 897a3d49-6d5e-4da0-8802-309f793d8a47
---
After the 2026-04-26 reconciliation, the project lives in three places ON A SINGLE BRANCH (`main`).

**Trees, all on `main` at HEAD `10c546e` as verified by Codex and Claude Code on 2026-04-26:**
- `/root/emart-platform` — Local. Has 3 git remotes: `origin` (canonical, GitHub `warlord71-bd/emart-platform`), plus legacy `mobile` (emartappup) and `web` (emartweb) — be careful with `git push` to use `origin` only.
- `/var/www/emart-platform` — VPS. The running site at https://e-mart.com.bd/. pm2 process `emartweb` reads from `/var/www/emart-platform/apps/web/.next/`.
- `origin` — GitHub remote `main` branch.

**One branch:** `codex/ui-0417` was deleted everywhere on 2026-04-26 after `main` was reset to its tip. Any future cross-machine work belongs on `main`.

**User's workflow direction (per 2026-04-26 instruction):**
1. Edit on Local `/root/emart-platform`.
2. rsync changed files Local → VPS.
3. Build + pm2 restart on VPS to verify.
4. Commit + push from Local to `origin/main`.
5. VPS stays clean — no direct edits there going forward.

**How to apply:**
- For new edits: work on Local main. Don't edit VPS files directly anymore.
- After Local edits build clean, rsync the touched files to `/var/www/emart-platform/apps/web/...` and run `pm2 restart emartweb`.
- Commit on Local main, push `origin main`.
- If a hotfix is unavoidable on VPS directly: scope it to specific files, then back-port to Local with rsync VPS→Local before committing.

**Hard-won lesson (2026-04-26 close call):**
Switching VPS git branch (e.g. `git checkout main` from `codex/ui-0417`) WILL change file contents in the working tree if the branches' trees differ — even when both branches "should" be at the same commit. It happened: VPS local `main` was at an old `23752d7` commit (predated reconciliation), and `git checkout main` swapped 3 critical files (`ProductInfo.tsx`, `brands/page.tsx`, `lib/woocommerce.ts`) for older versions before I could fast-forward. Live site survived only because pm2 was still running the old `.next` build (no rebuild had been triggered).

**Rule:** Never run `git checkout <branch>` on VPS without first verifying `git rev-parse <branch>` equals the desired commit. If they differ, do `git fetch && git reset --hard origin/main` BEFORE any `pm2 restart`. Build/restart triggers a rebuild from current sources — wrong sources = broken site.

**Pre-restart safety check on VPS:**
```
git -C /var/www/emart-platform rev-parse HEAD          # what's checked out
git -C /var/www/emart-platform diff HEAD --stat | wc -l # working-tree drift
```
Only `pm2 restart emartweb` after both are clean.
