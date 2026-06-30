---
description: Full deploy sequence — Local build, commit, rsync, VPS build, smoke, push
---

# Deploy Workflow

## Prerequisites
- All edits done on Local (`/root/emart-platform`)
- No overlapping active work on AGENT_BUS

## Steps

### 1. Local build (fail fast)
```bash
cd /root/emart-platform/apps/web && npm run build
```
Stop if build fails. Fix before proceeding.

### 2. Review changes
```bash
git -C /root/emart-platform status --short
git -C /root/emart-platform diff --stat
```
Review staged/unstaged changes. Never blind `git add -A`.

### 3. Commit
Stage specific files, write a descriptive commit message. Never commit `.env*` or secrets.

### 4. Rsync to VPS
```bash
bash /root/emart-platform/deploy.sh --no-commit
```
`deploy.sh` handles: selective rsync, lockfile check, `.next` rollback backup, runtime-state exclusions.

### 5. VPS build
Handled by `deploy.sh`. If VPS build fails, `.next` is rolled back automatically.

### 6. PM2 restart
Handled by `deploy.sh`. Only restarts after clean VPS build.

### 7. Smoke test
Verify: homepage 200, shop 200, sample PDP 200, category 200, sitemap 200, robots 200, PM2 online, no recent errors.

### 8. Push (only if smoke passes)
```bash
git push origin main
```
If smoke fails: roll back VPS, do NOT push, fix on Local from step 1.

## Hotfix (VPS-first)
1. Fix on VPS minimally
2. Smoke test
3. `rsync /var/www/emart-platform/apps/web/src/ /root/emart-platform/apps/web/src/` (VPS -> Local)
4. Commit on Local
5. Push

## Reference
Full deploy shell function: `workspace/content-orchestrator/docs/claude-reference/deploy-reference.md`
