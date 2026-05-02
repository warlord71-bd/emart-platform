# 2026-05-02 Other-Agent Bug Check

- A GPT/OpenRouter/Codex pass added `eslint@^10.3.0`, `eslint-config-next@^16.2.4`, and `apps/web/.eslintrc.json` to the Next 14 app.
- This made `next build` print `ESLint: Invalid Options: Unknown options: useEslintrc, extensions`.
- Fix applied locally: removed those devDependency additions by restoring `package.json`/`package-lock.json` via npm pruning and deleted the stray `.eslintrc.json`.
- Local `npm run build` now completes without the ESLint invalid-options warning.
- The generated `BUG-REPORT-2026-05-02.md` appears based on stale PM2 error logs. The PM2 error log mtime remained `2026-05-02 20:32:37 +0200` during later smoke checks, and public `/shop`, `/sitemap.xml`, `/graphql`, and known brand `/brands/cosrx` behaved as expected.
- Stale/risky other-agent files were moved to `/root/.attic-2026-05-02/other-agent-bugcheck/`: `BUG-REPORT-2026-05-02.md`, `DEPLOY-PLAN-2026-05-02.md`, and nested `apps/web/.vscode/extensions.json`.
- `workspace/scripts/setup-vps-config.sh` is now intentionally disabled because the old script wrote secrets to the wrong `/var/www/wordpress/...` path.
- Optional VS Code sync helper files were removed rather than kept, because broad one-click Local -> VPS sync is unnecessary risk for this live production repo.
