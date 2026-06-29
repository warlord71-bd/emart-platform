---
title: OpenClaw VPS Capability Reference
updated: 2026-06-09
---

OpenClaw is a VPS-side assistant capability for Emart platform inspection, testing, reporting,
and safe automation. It is NOT a replacement for the source-of-truth and deployment rules in CLAUDE.md.

## Current setup
- Gateway: `127.0.0.1:18789`
- Qdrant: requires auth
- Ollama: not running on default port
- Telegram bot: do NOT start a second polling service on the same bot token while OpenClaw is polling

## Models in use on this VPS
- Claude / Codex / GPT / Gemini / OpenRouter — reasoning, planning, code review, implementation
- OpenClaw — VPS-side visibility, process inspection, automation around the live environment

## Best use cases
- VPS health / status checks before and after deployment
- PM2 / process inspection for `emartweb`
- Smoke-test helpers after build/restart
- Log summarization: Next.js, Woo/API, newsletter, webhook, Telegram, cron issues
- SEO verification: sitemap, robots, canonical, redirects, status codes, public headers
- Dynamic sitemap verification against current Woo/API data
- Report generation for Codex/Claude tasks
- Safe read-only audits of live runtime state before code changes
- Reusable project automation that reports findings before changing files

## Before using OpenClaw
1. Verify installation, service/process state, config path, and project integration points on the VPS.
2. Check existing logs/docs before changing OpenClaw behaviour.
3. Confirm whether OpenClaw is already polling or running long-lived services.
4. Do not start a second polling service on the same Telegram bot token.
5. Do not expose secrets, bot tokens, API keys, WooCommerce keys, or `.env.local` values.
6. Do not let OpenClaw mutate checkout, cart, payment, order, customer, stock, price, or DB logic without explicit approval.

## Safety rules
- Prefer read-only inspection first.
- Prefer small explicit commands over broad automation.
- Log what OpenClaw checked or changed.
- If OpenClaw output conflicts with this repo, verify against the live VPS source of truth before editing.
- Use OpenClaw to assist testing and reporting — not to bypass review, build, smoke test, or deployment order.

## OpenRouter key location
Valid key in `/root/.openclaw/credentials/openrouter_default.json` (field: `apiKey`).
The openclaw.env file line `OPENROUTER_API_KEY=` is the same key — source that file first.
