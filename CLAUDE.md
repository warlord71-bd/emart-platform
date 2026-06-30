# Emart Agent Instructions

Written for Claude, Codex, GPT-style agents, and human developers. Follow as project policy.

## Stack & Commands
- **Next.js 14, React 18, Tailwind 3, TypeScript** — stack frozen until 2026-07-03
- App root: `apps/web` | Build: `cd apps/web && npm run build`
- PM2 process: `emartweb` | Live: `https://e-mart.com.bd`
- Local: `/root/emart-platform` | VPS runtime: `/var/www/emart-platform`
- Repo: `origin/main` — push ONLY after live smoke test passes
- WC API key: key_id `50` ("Emart BFF Live auto-recovered 2026-06-07 17:45") in `.env.local`
- Currency: ৳ BDT | Payments: COD, bKash, Nagad | Market: mobile-first Bangladesh

## Safety & Architecture (auto-loaded from `.claude/rules/`)
Rules are modular files in `.claude/rules/` — always loaded or glob-scoped:
- `brand-identity.md` — brand names, invalid variants, WhatsApp numbers
- `live-site-protection.md` — deploy order, VPS safety, cleanup policy
- `seo-architecture.md` — headless SEO, routing, execution order (glob-scoped to routes/metadata)
- `data-safety.md` — protected commerce data, WC keys, secrets policy

## Session Protocol (all agents)
- **Start:** `cat apps/web/.agent-memory/AGENT_BUS.md` + `cat apps/web/.agent-memory/MEMORY.md` + `tail -50 apps/web/SESSION-LOG.md` + `cat workspace/TASKS.md` + `git log --oneline -10` + `git status --short`
- **Before work:** Check AGENT_BUS.md ACTIVE WORK — if your task overlaps, pick something else. Add your entry to ACTIVE WORK.
- **End:** Move entry from ACTIVE to LAST COMPLETED in AGENT_BUS.md. Append block to `SESSION-LOG.md`. Update `workspace/TASKS.md`.
- For Claude: memory also auto-syncs via `/root/.claude/projects/-root-emart-platform/memory/`
- **Multi-agent coordination:** `apps/web/.agent-memory/AGENT_BUS.md` is the live bus. Read it first, always.

## Live Business Rules
- Newsletter: `/api/newsletter/subscribe` → `/wp-json/emart/v1/subscribe` → MailPoet
- Do not enable a second polling service on the same Telegram bot token while OpenClaw is polling
- Old files to ignore: `AGENTS.coding.md`, `AGENTS.design.md`, `AGENTS.seo.md` — retired

## Workflows (in `.claude/workflows/`)
Repeatable multi-step blueprints — read when starting a matching task:
- `deploy.md` — full deploy sequence with rollback and hotfix paths
- `seo-audit.md` — live SEO health check, regression detection, gap identification
- `content-review.md` — content humanizer/blog/meta review pipeline

## Token Efficiency
Search before reading. Read only files needed for this task. Report only changes made and risks found.
Key SEO search targets: `canonical` · `generateMetadata` · `sitemap` · `robots` · `notFound` · `NEXT_PUBLIC_SITE_URL` · `middleware`

## Reference (load only when the task needs it)
- [SEO Master](workspace/SEO_MASTER.md) — full SEO gap tracker, canonical/sitemap/schema rules
- [OpenClaw](workspace/content-orchestrator/docs/claude-reference/openclaw.md) — VPS inspection, Telegram, safety rules, OpenRouter key
- [Deploy function](workspace/content-orchestrator/docs/claude-reference/deploy-reference.md) — full rsync/pm2 reference script
- [Social publishing](workspace/content-orchestrator/docs/claude-reference/social-publishing.md) — Meta FB+IG posting, credentials, scheduler template, token renewal
- [Brand guide](workspace/BRAND_GUIDE.md) — copy tone, product naming, brand story
- [Category taxonomy](workspace/content-orchestrator/docs/category-taxonomy-status.md) — active/redirected/backend-only categories
- [Task board](workspace/TASKS.md) — open work, priority order, freeze scope
- [Agent memory](apps/web/.agent-memory/MEMORY.md) — durable facts, preferences, project state
