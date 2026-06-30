---
name: social-publishing-unified-20260623
description: "Unified Meta FB+IG publishing — creds in apps/web/.env.local, scripts in workspace/content-orchestrator/scripts/active/meta_*.js, ref doc, permanent Page token"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3d7541ad-0328-4ebb-8407-6a92ccf96760
---

Social publishing system unified 2026-06-23 so Claude, Codex, and any agent can use it.

## What changed
- Meta credentials (`META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN`, `META_APP_SECRET`, `META_IG_USER_ID`, `META_GRAPH_API_VERSION`) added to `apps/web/.env.local` on both Local and VPS
- `post.js` and `accounts.js` copied from `/opt/fb-poster/` to `workspace/content-orchestrator/scripts/active/meta_post.js` and `meta_accounts.js`
- All scripts updated to read from unified env with `META_*` prefix (falls back to old `PAGE_*` names)
- Graph API version bumped to v25.0
- Reference doc: `workspace/content-orchestrator/docs/claude-reference/social-publishing.md`
- Shared agent memory: `apps/web/.agent-memory/project_social_publishing_20260623.md`

## Token details
- Type: PAGE (permanent, expires_at=0)
- Extracted from User token via `/me/accounts` — this is the correct way to get a non-expiring Page token
- Permissions: pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish
- The same Page token works for both Facebook and Instagram publishing

## Deprecated
`/opt/fb-poster/.env` credentials no longer maintained; `/opt/fb-poster/` still has node_modules used by scheduler scripts
