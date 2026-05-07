# Emart Agent Entry Point

Read these in order:

1. `/root/CLAUDE.md` - universal VPS deploy law for every project.
2. `/root/emart-platform/CLAUDE.md` - Emart-specific context.
3. `/root/emart-platform/apps/web/.agent-memory/MEMORY.md` - shared durable agent memory.
4. `/var/www/emart-platform/apps/web/SESSION-LOG.md` - latest live-session history.

Current brand names:

- Short: Emart
- Full: Emart Skincare Bangladesh
- Live domain/URL: e-mart.com.bd

Core rule: edit on Local, sync to VPS, verify live, then push Repo last.

Do not change live UI/UX, restart pm2, force-push, or overwrite VPS files unless the task explicitly requires it and the source state is verified first.

Workspace hygiene:

- Durable memory goes only in `apps/web/.agent-memory/`.
- Current user-review reports go in `workspace/audit/active/`.
- Completed generated reports go in `workspace/audit/archive/` or `/root/.attic-YYYY-MM-DD/emart-platform/`.
- Reusable scripts go in `workspace/scripts/active/`; one-off historical scripts go in `workspace/scripts/archive/`.
- Do not create root-level CSV, XLSX, JSON, or scratch Markdown files.
