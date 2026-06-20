Sync Local → VPS without committing or pushing. Use this for quick live previews.

Steps:
1. Run local build: `cd /root/emart-platform/apps/web && npm run build`
2. If build passes, rsync source to VPS:
   ```
   rsync -av --delete --exclude=.git --exclude=node_modules --exclude=.next --exclude='*.tsbuildinfo' --exclude=.env.local /root/emart-platform/apps/web/src/ /var/www/emart-platform/apps/web/src/
   ```
3. Also sync these if changed: `next.config.js`, `tailwind.config.ts`, `package.json`
4. Run VPS build: `cd /var/www/emart-platform/apps/web && npm run build`
5. Restart: `pm2 restart emartweb`
6. Smoke test: `curl -fsS -o /dev/null -w "live: %{http_code}\n" https://e-mart.com.bd/`
7. Report result. Remind me to commit + push if the change looks good.
