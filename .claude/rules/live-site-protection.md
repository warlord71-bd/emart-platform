---
description: Live site and deploy safety — site first, code second
---

Never damage `https://e-mart.com.bd` — site first, code second.

Deploy order: Local edit -> build -> commit -> rsync -> VPS build -> `pm2 restart emartweb` -> smoke test -> push.
Never push `origin/main` before smoke test passes.
Hotfix on VPS: reverse-sync VPS -> Local before committing. Never commit from VPS directly.

**VPS runtime tree (`/var/www/emart-platform`) is git-free by design (since 2026-07-01).**
It holds ONLY `apps/web` and `apps/presence-server` — no `workspace/`, no dotfiles, no docs.
`deploy.sh` rsyncs `apps/web` only; do not add `workspace/` or root-level files back to the
rsync targets. `.deployed-rev` (written by `deploy.sh` after smoke passes) is the sole
provenance marker — there is no VPS git history to reset or compare against.

- No `git add -A` on a dirty Local tree without reviewing the staged list first
- Do not restart `emartweb` from unknown source state
- Never force-push without user approval; use `--force-with-lease` if authorized
- Never skip hooks (`--no-verify`) without user approval
- Cleanup: move files to `/root/.attic-YYYY-MM-DD/` — never delete unless user explicitly asks
