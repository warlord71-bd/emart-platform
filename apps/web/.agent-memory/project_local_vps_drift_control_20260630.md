# Local/VPS/Origin Drift Control — 2026-06-30

Durable rule after the 360-degree VPS drift audit:

- `/root/emart-platform` is the source repo agents should edit and commit.
- `/var/www/emart-platform` is the storefront runtime deploy tree.
- `origin/main` is publish history after live smoke and SEO/AEO gate pass.
- Runtime git metadata in `/var/www` is advisory only; it can lag because deploys rsync built source before push.
- `deploy.sh` writes `/var/www/emart-platform/.deployed-rev` after the live smoke and SEO/AEO gate pass. Use that marker, the build ID, and live smoke evidence as deployed truth.
- `deploy.sh` no longer runs routine `git reset --hard` inside `/var/www`.
- Run `workspace/content-orchestrator/scripts/active/drift_check.py` for read-only drift triage before any deploy/restart/reconciliation decision.

Known current signals at implementation time:

- Local was clean at `0e96ed7`, ahead of origin by 9 commits.
- `/var/www` git metadata was at `78d0bf7`, but sampled live source files matched local except for the newly fixed `deploy.sh`.
- PM2 had mixed source roots: storefront from `/var/www`, newer orchestration from `/root`, and old stopped/dated entries still referencing legacy `/var/www/workspace/scripts/active`.
- One dated comment worker, `emart-social-fb-comments-20260629-v6`, was still online and expired at audit time.
- Cleanup performed: expired June 29 and June 30 one-shot social PM2 workers were deleted and `pm2 save` was run. Core services (`emartweb`, `emart-presence`, `emart-embed`, `emart-hermes`, `emart-reels-bot`) remained online.

Never solve this class of drift with a blind reset. Separate source drift, generated/runtime noise, PM2 process drift, and deploy-history drift first.
