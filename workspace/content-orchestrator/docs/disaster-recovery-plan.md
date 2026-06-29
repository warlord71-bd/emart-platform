# Disaster Recovery Plan (ORCH-6)

Version: 2026-06-26-v1
Status: **plan** — off-server backup and restore drill require owner action.

## Current State

### What We Have
- **Daily DB backup:** `emart-backup.sh` runs at 21:00 BDT via crontab
  - `mysqldump` → gzip → `/root/emart-backups/daily/`
  - Rotation: 7 daily, 4 weekly (Sunday), 3 monthly (1st)
- **Weekly uploads backup:** `tar.gz` of `wp-content/uploads/` (Sunday only, ~640MB)
- **Code:** git history on `origin/main` (GitHub)
- **Next.js app:** full source in git; `.next` build output is regenerated
- **PM2 config:** `ecosystem.config.cjs` in git

### What's Missing
1. **Off-server backup:** all backups are on the same VPS. A disk failure loses everything.
2. **Integrity verification:** no checksum validation after dump/tar
3. **Fail-closed dump:** script continues on dump error (uses `pipefail` but doesn't verify gz size)
4. **Restore drill:** no documented restore procedure or test
5. **RPO/RTO targets:** not defined
6. **Encrypted backup:** DB dumps contain customer data; stored unencrypted on disk

## Proposed RPO/RTO

| Component | RPO (max data loss) | RTO (max downtime) |
|---|---|---|
| WordPress DB | 24h (daily dump) | 1h (restore from backup) |
| WP uploads/images | 7d (weekly tar) | 2h (restore + verify) |
| Next.js app code | 0 (git) | 30min (clone + build + pm2) |
| PM2 process config | 0 (ecosystem.config.cjs in git) | 5min |
| OpenClaw scripts | 0 (git + openclaw.env on VPS) | 15min |
| `.env.local` secrets | N/A (manual restore from password manager) | 10min |

## Off-Server Backup Options (Owner Decision)

### Option A: rsync to a second VPS/VM ($5-10/mo)
- Cheapest. Daily rsync of backup dir to a remote server.
- Pro: full control, simple to set up
- Con: must manage another server

### Option B: S3-compatible object storage (Backblaze B2 / Wasabi / DigitalOcean Spaces)
- ~$1-3/mo for <50GB. `rclone` or `s3cmd` push after backup.
- Pro: cheap, durable, no server management
- Con: needs API key setup

### Option C: GitHub artifact / release (free tier)
- DB dumps as encrypted tarballs in a private GitHub repo release
- Pro: free, already have GitHub
- Con: 2GB release size limit, slow for uploads backup

**Recommended:** Option B (S3-compatible) for DB + Option A or B for weekly uploads.

## Integrity Improvements (Can Apply Now)

### 1. Fail-closed dump verification
Add to `emart-backup.sh` after dump:
```bash
# Verify dump is non-empty and valid gzip
if [ ! -s "$DB_FILE" ] || ! gzip -t "$DB_FILE" 2>/dev/null; then
    log "ERROR: Database backup FAILED — file empty or corrupt"
    # Alert via Telegram
    exit 1
fi
```

### 2. Checksum logging
```bash
sha256sum "$DB_FILE" >> "$BACKUP_DIR/checksums.txt"
```

### 3. Size anomaly detection
```bash
PREV_SIZE=$(stat -c %s "$BACKUP_DIR/daily/db-$(date -d yesterday +%Y-%m-%d).sql.gz" 2>/dev/null || echo 0)
CURR_SIZE=$(stat -c %s "$DB_FILE")
if [ "$CURR_SIZE" -lt $((PREV_SIZE / 2)) ]; then
    log "WARNING: Backup is <50% of yesterday's size — possible truncation"
fi
```

## Restore Procedure (Draft)

### WordPress DB Restore
```bash
# 1. Stop web services
pm2 stop emartweb

# 2. Import DB
gunzip -c /root/emart-backups/daily/db-YYYY-MM-DD.sql.gz | mysql -u root -p"$DB_PASS" emart_live

# 3. Verify
mysql -u root -p"$DB_PASS" -e "SELECT COUNT(*) FROM emart_live.wp_posts WHERE post_type='product' AND post_status='publish';"
# Expected: ~3,625

# 4. Restart
pm2 restart emartweb
```

### Full Server Rebuild
```bash
# 1. Provision new VPS (Ubuntu 22.04+, 4GB RAM min)
# 2. Install: nginx, php-fpm, mysql, node 18, python3, pm2
# 3. Clone: git clone <repo> /root/emart-platform
# 4. Restore DB from off-server backup
# 5. Restore wp-content/uploads from off-server backup
# 6. Copy .env.local secrets from password manager
# 7. Build: cd apps/web && npm ci && npm run build
# 8. Start: pm2 start ecosystem.config.cjs
# 9. Configure nginx (copy from backup or repo)
# 10. DNS: point e-mart.com.bd to new IP
# 11. Smoke test
```

## Restore Drill Schedule
- **Quarterly:** restore DB to a test database on the same VPS, verify row counts
- **Semi-annually:** full rebuild drill on a temporary VPS (destroy after verification)
- **First drill:** after off-server backup is configured (owner action)

## Owner Actions Required
1. Choose off-server backup provider (Option A, B, or C)
2. Provide API keys / access credentials for off-server storage
3. Schedule first restore drill date
