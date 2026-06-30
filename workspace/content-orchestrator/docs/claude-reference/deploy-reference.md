---
title: Deploy Reference — Shell Function
updated: 2026-06-30
---

Adapt paths/build commands per project; keep the order intact.
See repo-local `CLAUDE.md` / `AGENTS.md` for Emart's active safety rules. The older
cross-project `/root/CLAUDE.md` explains the general VPS philosophy, but this file
and `/root/emart-platform/deploy.sh` are the Emart implementation source.

## Emart deploy — use the one-command wrapper

```bash
/root/emart-platform/deploy.sh "your commit message"
```

This is the current, safe entrypoint: it stages tracked changes with `git add -u` plus
explicit paths (never blanket `-A`), builds, rsyncs, restarts `emartweb`, smoke-tests, and
only pushes to `origin main` if the smoke test passes. Pass `--no-commit` to rerun
idempotently without creating a new commit.

### Manual fallback (only if `deploy.sh` is broken)

Review `git status --short` and stage only the current job's files before this
fallback. Do not use broad `git add -A` in a dirty shared tree.

```bash
deploy() {
  set -e
  cd /root/emart-platform/apps/web
  npm run build                                                        # 2. local build
  cd /root/emart-platform
  git status --short                                                   # 3a. review current tree
  git add <files-for-this-job>                                         # 3b. stage exact files only
  git commit -m "${1:-deploy}" || true                                 # 3c. commit
  rsync -av --delete \
    --exclude='.git' --exclude='node_modules' --exclude='.next' \
    --exclude='public/audit' --exclude='*.tsbuildinfo' \
    apps/web/ /var/www/emart-platform/apps/web/                        # 4. rsync
  cd /var/www/emart-platform/apps/web
  npm run build                                                        # 5. VPS build
  pm2 restart emartweb                                                 # 6. restart
  sleep 3
  curl -fsS -o /dev/null -w "live: %{http_code}\n" https://e-mart.com.bd/ \
    || { echo "smoke FAILED — NOT pushing"; return 1; }               # 7. smoke
  cd /root/emart-platform
  git push origin main                                                 # 8. push
}
```

## Generic template (other projects on this VPS)

```bash
deploy() {
  set -e
  local LOCAL=/root/<project>
  local VPS=/var/www/<project>
  local APP=apps/web
  local URL=https://example.com/
  local PM2_NAME=<process-name>

  cd "$LOCAL/$APP"
  npm run build
  cd "$LOCAL"
  git status --short                                                    # review current tree
  git add <files-for-this-job>                                          # stage exact files only
  git commit -m "${1:-deploy}" || true
  rsync -av --delete \
    --exclude='.git' --exclude='node_modules' --exclude='.next' \
    --exclude='public/audit' --exclude='*.tsbuildinfo' \
    "$APP/" "$VPS/$APP/"
  cd "$VPS/$APP"
  npm run build
  pm2 restart "$PM2_NAME"
  sleep 3
  curl -fsS -o /dev/null -w "live: %{http_code}\n" "$URL" \
    || { echo "smoke test FAILED — NOT pushing to repo"; return 1; }
  cd "$LOCAL"
  git push origin main
}
```
