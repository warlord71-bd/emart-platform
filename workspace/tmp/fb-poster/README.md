# FB Poster

Posts to a Facebook Page and linked Instagram Business account using the official Meta Graph API only.

API version: `v19.0`

Required permissions:

- `pages_manage_posts`
- `instagram_basic`
- `instagram_content_publish`

## Setup

```bash
cd /opt/fb-poster
cp .env.example .env
npm install
```

Edit `.env`:

```bash
PAGE_ID=your_facebook_page_id
PAGE_ACCESS_TOKEN=your_page_access_token
APP_SECRET=your_meta_app_secret
```

The Instagram Business account ID is auto-fetched from:

```text
GET /{PAGE_ID}?fields=instagram_business_account
```

When `APP_SECRET` is present, every Graph API request includes `appsecret_proof`.

## Post Once

```bash
node post.js 'Your caption here' 'https://example.com/image.jpg'
```

Instagram requires a public HTTPS image URL.

## PM2

```bash
pm2 start /opt/fb-poster/post.js \
  --name emart-fb-poster \
  -- 'Your caption here' 'https://example.com/image.jpg'
```

For recurring posts, prefer cron or a wrapper script instead of keeping this one-shot script running.

## Cron Example

Post daily at 10:00 server time:

```cron
0 10 * * * cd /opt/fb-poster && /usr/bin/node post.js 'Daily Emart update' 'https://example.com/image.jpg' >> /var/log/fb-poster.log 2>&1
```

## Notes

- No browser automation is used.
- The token must be a Page access token with the required publishing permissions.
- Facebook uses `POST /{PAGE_ID}/photos` when an image URL is provided, otherwise `POST /{PAGE_ID}/feed`.
- Instagram uses `POST /{IG_USER_ID}/media` then `POST /{IG_USER_ID}/media_publish`.
