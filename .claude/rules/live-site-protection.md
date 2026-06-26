---
description: Live site and deploy safety — site first, code second
---

Never damage `https://e-mart.com.bd` — site first, code second.

Deploy order: Local edit -> build -> commit -> rsync -> VPS build -> `pm2 restart emartweb` -> smoke test -> push.
Never push `origin/main` before smoke test passes.
Hotfix on VPS: reverse-sync VPS -> Local before committing. Never commit from VPS directly.

- No `git reset --hard` on VPS without verifying live source state first
- No `git add -A` on a dirty VPS tree without reviewing the staged list first
- Do not restart `emartweb` from unknown source state
- Never force-push without user approval; use `--force-with-lease` if authorized
- Never skip hooks (`--no-verify`) without user approval
- Cleanup: move files to `/root/.attic-YYYY-MM-DD/` — never delete unless user explicitly asks
