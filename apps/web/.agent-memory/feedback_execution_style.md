---
name: Execution style for backend/config tasks
description: How to execute tasks on this project — no mid-task approvals, report at end only, auto-pick safer option, confirm only for frontend
type: feedback
originSessionId: 897a3d49-6d5e-4da0-8802-309f793d8a47
---
For backend and configuration work on this project (WordPress/MailPoet/WooCommerce admin, WP CLI, server config, infra): execute end-to-end without mid-task approvals. Report only once, at the end of the whole task batch.

When an ambiguity arises mid-task (e.g. "which segment", "which welcome interpretation", "takeover vs new automation"), pick the safer/more reversible option and note the choice in the final report. Do not stop to ask.

Frontend changes are the exception — files under `/var/www/emart-platform/apps/web/**`, Next.js pages/components, Tailwind, design-system tokens. For those, still ask before editing.

**Why:** User explicitly set this rule on 2026-04-24 after I interrupted an execute-all-in-order run to ask about "order confirmation vs takeover" and "welcome interpretation." Stopping mid-task added two extra turns with no decision value — they had already said "No questions. Report final status only." The rule makes the execute/confirm boundary explicit: backend = just do it, frontend = still confirm.

**How to apply:**
- Backend/config tasks (WP CLI, DB writes via `wp eval-file`, server config, systemd, nginx, env vars, SMTP, plugin settings): execute fully, report at end.
- Frontend tasks (anything under `apps/web/src/`, design files, UI components, Tailwind config): confirm plan before editing.
- Mixed task: do the backend parts, stop before the frontend parts, report backend results + propose the frontend plan.
- When picking the safer option mid-task, the report must include a "Decisions taken" section listing each pick and why it was safer (more reversible, less blast radius, matches existing pattern).
