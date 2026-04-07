# Emart Production Deployment

## Why static files returned 503

Nginx was proxying `/_next/static/` requests through Node.js.  When the
Node.js process was under load or crashed, those requests timed out and nginx
returned **503 Service Unavailable** — even though the built asset files
existed on disk.

## The fix

`nginx.conf` adds a dedicated `location /_next/static/` block that uses
`alias` to serve the hashed build artefacts **directly from disk**, completely
bypassing the Node.js process.  CSS and JS chunks now load even if Node is
restarting.

---

## First-time server setup

### 1. Clone & build

```bash
cd /var/www
git clone https://github.com/warlord71-bd/emart-platform.git
cd emart-platform/apps/web
npm ci
cp .env.example .env.local   # fill in API keys
npm run build
```

### 2. Install PM2

```bash
npm install -g pm2
mkdir -p /var/log/emart
cd /var/www/emart-platform
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup   # run the printed command as root to enable on boot
```

Verify the app is running on port 3000:

```bash
pm2 status
curl -I http://127.0.0.1:3000
```

### 3. Install nginx config

```bash
sudo cp /var/www/emart-platform/deploy/nginx.conf \
        /etc/nginx/sites-available/emart

# The alias paths inside nginx.conf default to /var/www/emart-platform/...
# If your repo is elsewhere, edit the two `alias` lines before linking.

sudo ln -sf /etc/nginx/sites-available/emart \
            /etc/nginx/sites-enabled/emart

# Remove the default site if present
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t && sudo systemctl reload nginx
```

### 4. (Optional) HTTPS via Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d e-mart.com.bd -d www.e-mart.com.bd
```

Then uncomment the HTTPS server blocks at the bottom of `nginx.conf` and
reload nginx.

---

## Deploy workflow (zero-downtime)

```bash
cd /var/www/emart-platform
git pull origin main
cd apps/web
npm ci
npm run build
cd /var/www/emart-platform
pm2 reload emart-web   # graceful reload — no dropped connections
```

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Static files still 503 | Confirm `alias` path in nginx.conf matches the actual `.next/static/` directory (`ls /var/www/emart-platform/apps/web/.next/static/`) |
| All pages 502 / blank | `pm2 status` — restart if stopped: `pm2 restart emart-web` |
| App crashes in loop | `pm2 logs emart-web --lines 50` — look for missing env vars or OOM |
| Disk full | `df -h` — clear old PM2 logs: `pm2 flush` |
| Port 3000 already in use | `lsof -i :3000` — kill the stale process, then `pm2 start` |
