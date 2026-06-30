# TikTok Content Posting API — Setup Guide for Emart

## What this enables
Publish videos to Emart's TikTok account directly from the VPS, automated or manual.

---

## Step 1: Create a TikTok Developer Account

1. Go to **https://developers.tiktok.com**
2. Click **"Log in"** → sign in with your TikTok account (the one that owns the Emart page)
3. If first time: complete developer registration (name, email, company name: "Emart Skincare Bangladesh")

## Step 2: Create an App

1. Go to **"Manage apps"** → **"Create app"** (or **"Connect an app"**)
2. Fill in:
   - **App name:** `Emart Publisher`
   - **Description:** `Automated video publishing for Emart Skincare Bangladesh`
   - **App icon:** use the Emart logo
   - **Platform:** select **"Web"** (not mobile)
   - **Website URL:** `https://e-mart.com.bd`
3. Under **"Add products"**, select:
   - **Content Posting API** — this is the one that lets you upload + publish videos
   - (Optional) **Login Kit** — needed for OAuth flow
4. Click **"Submit for review"**

## Step 3: Configure OAuth Redirect

1. In your app settings, go to **"Configuration"**
2. Set **Redirect URI** to:
   ```
   https://e-mart.com.bd/api/tiktok/callback
   ```
3. Note down:
   - **Client Key** (also called App ID)
   - **Client Secret**

## Step 4: Send Me the Credentials

Once approved, give me these two values (they go in `.env.local`, never committed):
```
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
```

I will then:
1. Build the OAuth callback route (`/api/tiktok/callback`)
2. Run the one-time browser authorization (you click "Allow" once)
3. Store the refresh token on VPS
4. Build the publish script

---

## What I'll Build (after you complete steps above)

```
workspace/content-orchestrator/scripts/active/tiktok_publish.py

Usage:
  python3 tiktok_publish.py --video /path/to/video.mp4 --caption "COSRX Snail Mucin ✨ #skincare #kbeauty"
  python3 tiktok_publish.py --product-id 2591  (auto-generates caption from product data)
```

### Full pipeline (future):
```
Product ID
  → social_image_gen.py generates promo image
  → image + product photos → Seedance/AI video (when quality is ready)
  → tiktok_publish.py uploads to TikTok
  → cross-post to Instagram Reels + Facebook Reels via Meta Graph API
```

---

## API Limits to Know

| Limit | Value |
|-------|-------|
| Posts per day | ~20 |
| Video length | 1–60 seconds |
| Video format | MP4, WebM |
| Max file size | 4 GB |
| Resolution | 720p minimum recommended, 1080x1920 ideal |
| Review time | 1–3 business days for app approval |

## Scopes Needed

| Scope | Purpose |
|-------|---------|
| `video.upload` | Upload video files to TikTok |
| `video.publish` | Publish uploaded videos |
| `user.info.basic` | Read account name (for verification) |

---

## Also Useful Later (Optional APIs)

| API | What it gives you |
|-----|-------------------|
| **TikTok Commercial Content API** | Mark posts as branded/sponsored (if running paid collabs) |
| **TikTok Research API** | Trending videos/hashtags in BD market (academic access) |
| **TikTok Shop API** | Product listings + in-app checkout (when TikTok Shop launches fully in BD) |

---

## Timeline

1. **Today:** You create developer account + app (10 minutes)
2. **1-3 days:** TikTok reviews and approves your app
3. **Day app is approved:** I build the OAuth flow + publish script (same session)
4. **Same day:** First test post goes live from VPS

---

## Meta Graph API (Facebook + Instagram Reels)

You already have Meta Business Suite open. For cross-posting, I'll also need:
- A **Meta App** with `pages_manage_posts` and `instagram_content_publish` permissions
- Or: the existing Page Access Token if you already have one

We can set this up in the same session as TikTok.
