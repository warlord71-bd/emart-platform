# Emart Facebook / Instagram Publishing

Script:

```bash
python3 workspace/content-orchestrator/scripts/active/social_publish.py
```

## Required Meta Setup

The current `.env.local` has Meta Pixel/CAPI credentials only. Publishing needs a **Page access token**, not the Pixel/CAPI token.

Add these to a private VPS env file or `apps/web/.env.local`:

```bash
META_GRAPH_VERSION=v23.0
META_PAGE_ID=your_facebook_page_id
META_PAGE_ACCESS_TOKEN=your_page_access_token
META_IG_USER_ID=your_instagram_business_account_id
```

Required permissions/scopes for the token:

- `pages_manage_posts`
- `pages_read_engagement`
- `instagram_content_publish` for Instagram

The Facebook Page must be connected to the Instagram professional/business account.

## Dry Run

Dry-run is the default and never publishes:

```bash
python3 workspace/content-orchestrator/scripts/active/social_publish.py \
  --platform facebook \
  --image workspace/content-orchestrator/generated-assets/emart-aestura-promo.png \
  --caption "Repair. Hydrate. Glow. Available at Emart Skincare Bangladesh. Shop authentic K-beauty at e-mart.com.bd"
```

## Publish To Facebook

Facebook can upload a local image directly:

```bash
python3 workspace/content-orchestrator/scripts/active/social_publish.py \
  --platform facebook \
  --image workspace/content-orchestrator/generated-assets/emart-aestura-promo.png \
  --caption "Repair. Hydrate. Glow. Available at Emart Skincare Bangladesh. Shop authentic K-beauty at e-mart.com.bd" \
  --publish
```

## Publish To Instagram

Instagram requires a public HTTPS image URL:

```bash
python3 workspace/content-orchestrator/scripts/active/social_publish.py \
  --platform instagram \
  --image-url https://e-mart.com.bd/path/to/public-image.png \
  --caption "Repair. Hydrate. Glow. Available at Emart Skincare Bangladesh. Shop authentic K-beauty at e-mart.com.bd" \
  --publish
```

Use `--platform both` when the same public image URL should go to both Facebook and Instagram.

## Safety

- The script never publishes unless `--publish` is passed.
- Do not commit Meta access tokens.
- Review image and caption manually before publishing.
- Keep generated social assets separate from product catalog images unless owner approves replacing catalog media.
