# E-Mart Agent Instructions

This project follows the universal VPS deployment law in `/root/CLAUDE.md`.
Read that file first. This file only adds E-Mart-specific context.

## Current Layout

- Local working tree: `/root/emart-platform`
- Live runtime tree: `/var/www/emart-platform`
- Web app: `apps/web`
- Live process: `pm2` process `emartweb`
- Canonical repo: GitHub remote `origin`, branch `main`
- Current rule: Local -> VPS -> Repo, with Repo push last after live smoke test

## Source Of Truth

- The running site is served from `/var/www/emart-platform/apps/web`.
- Do not restore old files from GitHub or Local over VPS without comparing first.
- Keep the current live UI/UX unless the user explicitly asks to change it.
- Before any deploy/restart, confirm the VPS tree is the intended source.

## Required Deploy Order

Use the universal verify-then-publish order from `/root/CLAUDE.md`:

1. Edit on Local.
2. Build/test on Local.
3. Commit on Local.
4. Sync Local -> VPS.
5. Build on VPS.
6. Restart `emartweb`.
7. Smoke test the live site.
8. Push `origin main` only after live verification passes.

If a hotfix is made directly on VPS, reverse-sync VPS -> Local before committing.

## E-Mart Project Facts

- Bangladesh eCommerce site for authentic K-beauty, J-beauty, and international beauty products.
- Frontend: Next.js 14+, TypeScript, Tailwind CSS.
- Backend/content source: WooCommerce + WordPress MU plugins.
- Currency: BDT with the `৳` symbol.
- Payments: Cash on Delivery, bKash, Nagad.
- Main audience: mobile-first Bangladesh shoppers.

## Live Business Rules

- Footer `SignupTabs` is the canonical WhatsApp + email signup block.
- Newsletter path: Next `/api/newsletter/subscribe` -> WordPress `/wp-json/emart/v1/subscribe` -> MailPoet.
- Sales/signup WhatsApp: `8801717082135`.
- Support/payment WhatsApp/phone may use `8801919797399`; do not merge the numbers unless the user says so.
- MailPoet is the live transactional sender path. Do not reinstall or switch SMTP unless asked.
- Telegram command helper exists, but do not enable a second polling service on the same bot token while OpenClaw is polling.

## Safety Rules

- Never commit secrets. Keep `.env.local` local to the VPS/runtime.
- Never run blind `git add -A` on a dirty runtime tree unless `.gitignore` is checked and the staged list is reviewed.
- Never force-push without explicit user approval.
- Never use `git reset --hard`, branch checkout, or rollback on VPS unless the target commit is verified first.
- Never restart `emartweb` from unknown source state.
- For cleanup, move files to `/root/.attic-YYYY-MM-DD/` instead of deleting unless the user explicitly asks for permanent deletion.

## Useful Current Memory

- Universal deploy instructions: `/root/CLAUDE.md` and `/root/AGENTS.md`.
- E-Mart session log: `/var/www/emart-platform/apps/web/SESSION-LOG.md`.
- E-Mart task/source notes, when present: `/var/www/emart-platform/apps/web/TASKS.md`, `MEMORY.md`, and `LIVE-SOURCE-OF-TRUTH.md`.
- Cleanup restore point from 2026-04-26: `/root/.attic-2026-04-26/`.

## What Not To Trust

- Old project agent files mentioning `AGENTS.coding.md`, `AGENTS.design.md`, or `AGENTS.seo.md`; those were retired to reduce complexity.
- Old docs that say to push before live verification.
- Old rollback snippets that use `git reset --hard` without checking the live source state first.

