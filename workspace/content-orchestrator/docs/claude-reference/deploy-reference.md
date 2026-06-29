---
title: Deploy Reference — Shell Function
updated: 2026-06-09
---

Adapt paths/build commands per project; keep the order intact.
See `/root/CLAUDE.md` for the canonical numbered sequence and why-order rationale.

## Emart-specific deploy (actual paths)

```bash
deploy() {
  set -e
  cd /root/emart-platform/apps/web
  npm run build                                                        # 2. local build
  cd /root/emart-platform
  git add -A && git commit -m "${1:-deploy}" || true                   # 3. commit
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

Or use the one-command wrapper already in the project:
```bash
/root/emart-platform/deploy.sh "your commit message"
```

## Generic template

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
  git add -A && git commit -m "${1:-deploy}" || true
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
