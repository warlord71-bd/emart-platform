# Emart Disaster Recovery Runbook

Last verified: 2026-06-26 — full DB restore test passed (224 tables, all row counts matched).

## 0. Retrieve Backups from Cloudflare R2 (if local disk is lost)

```bash
# Install rclone on new server
curl -s https://rclone.org/install.sh | sudo bash

# Configure (replace account_id, keys from Cloudflare R2 dashboard)
rclone config create r2 s3 \
  provider Cloudflare \
  access_key_id YOUR_ACCESS_KEY_ID \
  secret_access_key YOUR_SECRET_ACCESS_KEY \
  endpoint https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com \
  acl private

# Download all backups
mkdir -p /root/emart-backups
rclone sync r2:emart-backups /root/emart-backups --progress
```

## 1. Database Restore

```bash
# List available backups (newest first)
ls -lt /root/emart-backups/daily/db-*.sql.gz | head -7
ls -lt /root/emart-backups/weekly/db-*.sql.gz | head -4
ls -lt /root/emart-backups/monthly/db-*.sql.gz | head -3

# Verify backup integrity before restoring
gzip -t /root/emart-backups/daily/db-YYYY-MM-DD.sql.gz && echo "OK" || echo "CORRUPT"

# Restore into emart_live (CAUTION: replaces all data)
mysql -u root -p'Emart@123456' -e "DROP DATABASE IF EXISTS emart_live; CREATE DATABASE emart_live;"
gunzip -c /root/emart-backups/daily/db-YYYY-MM-DD.sql.gz | mysql -u root -p'Emart@123456' emart_live

# Verify restore
mysql -u root -p'Emart@123456' -e "SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema='emart_live';"
# Expected: 224 tables
```

## 2. Restore Uploads (Media)

```bash
# Weekly uploads backup (Sundays only)
ls -lt /root/emart-backups/weekly/uploads-*.tar.gz | head
tar -xzf /root/emart-backups/weekly/uploads-YYYY-MM-DD.tar.gz -C /var/www/wordpress/wp-content/
chown -R www-data:www-data /var/www/wordpress/wp-content/uploads/
```

## 3. Restore Environment Secrets

```bash
# .env.local is encrypted with the machine-id as passphrase
openssl enc -d -aes-256-cbc -pbkdf2 \
  -in /root/emart-backups/config/env-local-YYYY-MM-DD.enc \
  -out /var/www/emart-platform/apps/web/.env.local \
  -pass pass:"$(cat /etc/machine-id)"
chmod 600 /var/www/emart-platform/apps/web/.env.local

# If machine-id has changed (new server), you must know the OLD machine-id
# or regenerate all API keys from provider dashboards.
```

## 4. Restore Nginx Config

```bash
cp -a /root/emart-backups/config/nginx-YYYY-MM-DD/* /etc/nginx/
nginx -t && systemctl reload nginx
```

## 5. Restore Crontab

```bash
crontab /root/emart-backups/config/crontab-root-YYYY-MM-DD.txt
crontab -l  # verify
```

## 6. Restore mu-plugins (Custom WP Endpoints)

```bash
cp -a /root/emart-backups/config/mu-plugins-YYYY-MM-DD/* /var/www/wordpress/wp-content/mu-plugins/
```

## 7. Rebuild & Start Application

```bash
# Clone if on a fresh server
git clone git@github.com:warlord71-bd/emart-platform.git /var/www/emart-platform
cd /var/www/emart-platform/apps/web

# Install and build
npm ci
npm run build

# Start PM2 processes
pm2 start /var/www/emart-platform/ecosystem.config.cjs
pm2 save
pm2 startup  # wire systemd

# Verify
curl -sf https://e-mart.com.bd | head -1
pm2 list
```

## 8. Post-Restore Checklist

- [ ] Site loads: `curl -I https://e-mart.com.bd` → 200
- [ ] Products load: `curl -sf https://e-mart.com.bd/shop | grep -c 'product'`
- [ ] WC API works: check a product API call
- [ ] Cron jobs running: `crontab -l | wc -l`
- [ ] PM2 processes online: `pm2 list`
- [ ] Nginx serving: `systemctl status nginx`
- [ ] PHP-FPM running: `systemctl status php*-fpm`
- [ ] SSL valid: `echo | openssl s_client -connect e-mart.com.bd:443 2>/dev/null | grep 'Verify return code'`

## Backup Locations

| What | Path | Schedule | Retention |
|------|------|----------|-----------|
| DB dump | `/root/emart-backups/daily/` | Daily 21:00 | 7 daily, 4 weekly, 3 monthly |
| Uploads | `/root/emart-backups/weekly/` | Sunday 21:00 | 2 weekly |
| Nginx config | `/root/emart-backups/config/nginx-*/` | Daily 21:00 | Latest |
| Crontab | `/root/emart-backups/config/crontab-*` | Daily 21:00 | Latest |
| .env.local (enc) | `/root/emart-backups/config/env-local-*.enc` | Daily 21:00 | Latest |
| mu-plugins | `/root/emart-backups/config/mu-plugins-*/` | Daily 21:00 | Latest |
| Packages list | `/root/emart-backups/config/packages-*` | Daily 21:00 | Latest |
| **Off-server copy** | **Cloudflare R2 `emart-backups` bucket** | **Daily 21:00** | **Mirrors local** |

## Key Credentials (if .env.local is lost)

Regenerate from these provider dashboards:
- WooCommerce API key: WP Admin → WooCommerce → Settings → REST API (key_id 34)
- Meta/Facebook tokens: Meta Business Suite → Settings → Access Tokens
- Telegram bot: @BotFather on Telegram
- OpenRouter: openrouter.ai dashboard
- NextAuth secret: generate new with `openssl rand -base64 32`
