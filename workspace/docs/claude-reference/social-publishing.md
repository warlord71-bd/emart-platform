# Social Publishing Reference (Meta: Facebook + Instagram)

## Credentials

All Meta publishing credentials live in `apps/web/.env.local` (both Local and VPS):

```
META_PAGE_ID=106908734057777
META_PAGE_ACCESS_TOKEN=<permanent Page token>
META_APP_SECRET=<app secret for appsecret_proof>
META_IG_USER_ID=17841426400472288
META_GRAPH_API_VERSION=v25.0
```

The token is a **permanent Page Access Token** (type: PAGE, expires_at: 0).
The old standalone `/opt/fb-poster/.env` is deprecated — credentials are now unified.

## Scripts

All in `workspace/scripts/active/`, gitignored but present on Local and VPS:

| Script | Purpose | Usage |
|--------|---------|-------|
| `meta_post.js` | Post once to FB + IG | `node meta_post.js 'caption' 'https://image-url'` |
| `meta_accounts.js` | List Pages for a User token (setup only) | `USER_ACCESS_TOKEN=EAA... node meta_accounts.js` |
| `social_publish.py` | Python alternative (dry-run default) | `python3 social_publish.py --platform both --image-url URL --caption TEXT --publish` |
| `social_image_gen.py` | Generate social images | See script header |

Campaign schedulers are created per-campaign, e.g. `meta_18_scheduler_20260623.js`.

## How to build a campaign scheduler

1. Define a `posts[]` array with `time` (ISO 8601 with +06:00), `label`, `image`, `link`, `caption`
2. Use `setTimeout` to fire each post at its scheduled time
3. Run via PM2 with `--no-autorestart`: `pm2 start scheduler.js --name campaign-name --no-autorestart`
4. Include `--validate-only` flag for pre-flight token check

Template: see `meta_18_scheduler_20260623.js`.

## Image sizes

| Platform | Ideal ratio | Ideal px |
|----------|------------|----------|
| Instagram feed | 4:5 portrait | 1080×1350 |
| Facebook photo | 1:1 square | 1200×1200 |

Current campaigns use single 4:5 images for both. Future campaigns should generate both sizes and use separate `fbImage`/`igImage` fields.

## Token renewal

Tokens expire if:
- A **User token** was used instead of a **Page token** (session-bound, ~24hr)
- The user changes their Facebook password
- The app is removed from Business Settings

### To get a new permanent Page token:

1. Generate a short-lived User Token in Graph Explorer with permissions:
   `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`
2. Exchange for long-lived User Token:
   ```
   GET /oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_TOKEN}
   ```
3. Get permanent Page Token:
   ```
   GET /me/accounts?access_token={LONG_LIVED_USER_TOKEN}
   ```
   Find the entry for PAGE_ID `106908734057777`, copy its `access_token`.
4. Verify:
   ```
   GET /debug_token?input_token={PAGE_TOKEN}&access_token={APP_ID}|{APP_SECRET}
   ```
   Confirm `type: PAGE`, `expires_at: 0`, `is_valid: true`.
5. Update `META_PAGE_ACCESS_TOKEN` in both Local and VPS `apps/web/.env.local`.

## Safety rules

- Never post without owner approval on content/timing
- Never store tokens in git-tracked files
- Test with dry-run or `--validate-only` before launching a campaign
- Delete test posts from the Page after verification
- The `META_CAPI_ACCESS_TOKEN` in `.env.local` is for Pixel/CAPI analytics — it is NOT a publishing token
