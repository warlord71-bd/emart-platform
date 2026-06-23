---
name: social-publishing-system-20260623
description: Unified Meta FB+IG social publishing — credentials, scripts, scheduler template, token renewal, image sizing
metadata:
  type: project
---

Meta social publishing unified on 2026-06-23.

## Credentials
All in `apps/web/.env.local` (both Local and VPS):
- `META_PAGE_ID` — Emart Skincare Bangladesh page
- `META_PAGE_ACCESS_TOKEN` — permanent Page token (type PAGE, expires_at 0)
- `META_APP_SECRET` — for appsecret_proof
- `META_IG_USER_ID` — linked Instagram Business account
- `META_GRAPH_API_VERSION` — currently v25.0

Note: `META_CAPI_ACCESS_TOKEN` is for Pixel/CAPI analytics, NOT publishing.

## Scripts (workspace/scripts/active/)
- `meta_post.js` — single post to FB + IG
- `meta_accounts.js` — list Pages for User token (setup utility)
- `social_publish.py` — Python alternative
- Campaign schedulers: per-campaign, e.g. `meta_18_scheduler_20260623.js`

## Reference doc
`workspace/docs/claude-reference/social-publishing.md` — full token renewal, image sizes, safety rules.

## Known issue
Single 4:5 images used for both platforms. Future campaigns should generate 4:5 (IG) + 1:1 (FB). See [[feedback-social-image-sizes]].

## Deprecated
`/opt/fb-poster/` standalone tool still exists but credentials are no longer maintained there. All agents should use the unified `apps/web/.env.local` + `workspace/scripts/active/meta_*.js`.
