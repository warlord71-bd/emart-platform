# VPS Resource Map

Last updated: 2026-05-15  
Server: single VPS, 11GB RAM, 96GB disk  
Purpose: reference before adding any new project. Update this file when a project is added, removed, or reconfigured.

---

## Current Resource Totals

| Resource | Total | Used | Free |
|----------|-------|------|------|
| RAM | 11 GB | ~5.1 GB | ~6.6 GB available |
| Swap | 8 GB | 3.1 GB | 4.9 GB |
| Disk (`/`) | 96 GB | 63 GB | 34 GB (65% full) |
| Public ports | 80, 443 | nginx | via nginx only |

**Disk is the tightest constraint.** Stale `/var/www/` folders below account for ~2–3 GB that can be recovered after owner review.

---

## Active Projects

### 1. Emart (`e-mart.com.bd`)

| Resource | Value |
|----------|-------|
| Source (edit here) | `/root/emart-platform/` |
| Runtime | `/var/www/emart-platform/` — 1.6 GB |
| WordPress backend | `/var/www/wordpress/` — 1.2 GB |
| MySQL databases | `emart_live` (live), `emart_prod` (backup/staging) |
| PM2 processes | `emartweb` (id 1) — Next.js frontend — ~65 MB RAM |
| | `emart-presence` (id 2) — WebSocket presence server — ~68 MB RAM |
| Next.js port | 3000 (proxied by nginx) |
| Presence port | 3011 (internal, proxied via nginx `/ws/presence`) |
| Nginx config | `/etc/nginx/sites-enabled/emart-nextjs` |
| Domains | `e-mart.com.bd`, `www.e-mart.com.bd` |
| RAM footprint | ~133 MB (both PM2 processes) |

**Do not touch:** checkout, cart, payment, order, customer, stock, price logic.

---

### 2. Medimart (`medimart.com.bd`)

| Resource | Value |
|----------|-------|
| Runtime | `/var/www/medimart-web/` — 653 MB |
| WordPress backend | `/var/www/medimart/` — 193 MB |
| MySQL database | `medimart_db` |
| PM2 process | `medimartweb` (id 3) — Next.js — ~70 MB RAM |
| Next.js port | 3002 (verify — proxied by nginx) |
| Nginx config | `/etc/nginx/sites-enabled/medimart` |
| Domains | `medimart.com.bd`, `www.medimart.com.bd` |
| RAM footprint | ~70 MB |

---

### 3. n8n (automation)

| Resource | Value |
|----------|-------|
| PM2 process | `n8n` (id 0) — ~244 MB RAM |
| Port | 5678 (internal) |
| Nginx config | `/etc/nginx/sites-enabled/n8n` |
| Domain | `n8n.medimart.com.bd` |
| RAM footprint | ~244 MB |

---

## Shared Services (used by multiple projects)

| Service | Port | Notes |
|---------|------|-------|
| MySQL / MariaDB | 3306 (internal only) | Used by Emart + Medimart + WordPress |
| Redis | 6379 (internal only) | Available to any project for caching |
| Qdrant (Docker) | 6333, 6334 (internal) | Vector DB — likely for AI/OpenClaw features |
| Ollama | 11434 (internal) | Local LLM inference — OpenClaw or AI features |
| OpenClaw gateway | 18789, 18790 (internal) | VPS-side inspection/automation assistant |
| Nginx | 80, 443 (public) | Reverse proxy for all projects |
| SSH | 22 | Admin access |
| Webmin | 10000 | Server admin panel |

**Redis, Qdrant, Ollama are all available to new projects** — no installation needed. Just add the connection in the project's `.env.local`.

---

## Unknown / Stale Processes

Five `next-server` instances are running. Only two are accounted for (emartweb on 3000, medimartweb on 3002).

| Port | Status | Action needed |
|------|--------|---------------|
| 3000 | Emart — active | Keep |
| 3002 | Medimart — active | Keep |
| 3010 | Unknown next-server | Identify or kill |
| 3018 | Unknown next-server | Identify or kill |
| 3035 | Unknown next-server | Identify or kill |

Run `ss -tlnp | grep 3010` (or 3018, 3035) to see the full process path and identify which project owns each port. If orphaned, kill the process and free the RAM.

---

## Stale / Review-Needed Folders in `/var/www/`

These are not served by any active nginx config. Review before new projects arrive — they're consuming disk space.

| Folder | Size | Status | Action |
|--------|------|--------|--------|
| `/var/www/emart-platform-releases/` | 1.3 GB | Old release snapshots | Owner review → archive to `/root/.attic-YYYY-MM-DD/` or delete |
| `/var/www/emartweb/` | 715 MB | Old Emart Next.js (pre-platform) | Verify not needed → archive or delete |
| `/var/www/emart/` | 597 MB | Old Emart version | Verify not needed → archive or delete |
| `/var/www/emartappup/` | 438 MB | Unknown — possibly old Emart app | Identify → archive or delete |
| `/var/www/emartweb_config_backup/` | Unknown | Config backup | Check contents → archive or delete |
| `/var/www/html/` | 20 KB | Default nginx page | Keep or remove |

**Estimated recoverable disk: ~3 GB** after stale folder cleanup.

---

## What Is Free for New Projects

| Resource | Available |
|----------|-----------|
| RAM | ~6.6 GB (plenty for 2–4 more Next.js apps at ~70 MB each) |
| Disk | 34 GB + ~3 GB recoverable = ~37 GB |
| Ports (Next.js) | 3003–3009, 3020–3034, 3036+ (avoid 3010/3018/3035 until identified) |
| MySQL | Create a new database per project |
| Redis | Shared — use a key prefix per project to isolate namespaces |
| Nginx | Add a new config to `/etc/nginx/sites-available/` + symlink |
| PM2 | Add a new named process per project |

---

## Template: Adding a New Project

For each new project transferred from old hosting:

```
1. Folder:     /var/www/<project-name>/          ← runtime tree
               /root/<project-name>/              ← edit/commit tree
2. Port:       pick next free port (e.g. 3020)
3. PM2:        pm2 start ecosystem.config.js --name <project-name>
4. MySQL:      CREATE DATABASE <project>_db;
5. Nginx:      cp /etc/nginx/sites-available/medimart /etc/nginx/sites-available/<project>
               # edit server_name, proxy_pass port, SSL
               ln -s ... sites-enabled/
               nginx -t && nginx -s reload
6. SSL:        certbot --nginx -d <domain>
7. .env.local: /var/www/<project>/.env.local (never commit)
8. Smoke test: curl -fsS https://<domain>/ | head -5
9. Add entry to this file (VPS_RESOURCE_MAP.md)
```

---

## Emart Archive — `/root/.attic-2026-05-15/stale-www-2026-05-15.tar.gz`

Compressed 2026-05-15. 781 MB. All contents are Emart-related. Download to PC then delete from VPS when ready.

| Folder in archive | What it was | Still needed? |
|-------------------|-------------|---------------|
| `emart/scripts/` | Python SEO/catalog scripts (`phase2_seo.py`, `catalog_audit.py`, `catalog_fixer_v2.py`, `bulk_fixer_google2026.py`) | Already in `workspace/scripts/archive/` — no |
| `emart/apps/mobile/` | Old React Native/Expo mobile app (pre-BFF era) | Superseded by `apps/mobile/` — no |
| `emartweb/` | Old standalone Next.js web app (pre-platform era) | Superseded by `apps/web/` — no |
| `emartweb/.env.local` | **Old secrets/env file** — may contain old WooCommerce keys | ⚠️ Delete after downloading. Do not restore to VPS. |
| `emartweb/emart-web-final.tar.gz` | Nested archive inside archive (old final build) | No |
| `emartweb/preview-*.html` | Old UI preview HTML files | No |
| `emartappup/` | Duplicate of old mobile app + Python scripts | No |
| `emart-platform-releases/` | Three old commit snapshots (`bc0fadc`, `251fa3e`, `d8573a9`) | Redundant — git has full history — no |
| `emartweb_config_backup/` | Old nginx/config backup | No |

**To extract a specific file if needed:**
```bash
tar -xzf /root/.attic-2026-05-15/stale-www-2026-05-15.tar.gz <path-inside-archive>
# e.g.: tar -xzf ... emart/scripts/catalog_audit.py
```

**To download to PC then delete:**
```bash
# On your PC:
scp root@<vps-ip>:/root/.attic-2026-05-15/stale-www-2026-05-15.tar.gz .
# Then on VPS after confirming download:
rm /root/.attic-2026-05-15/stale-www-2026-05-15.tar.gz
```

---

## Port Allocation Reference

| Range | Owner |
|-------|-------|
| 3000 | Emart Next.js |
| 3002 | Medimart Next.js |
| 3010, 3018, 3035 | Unknown — identify before reusing |
| 3011 | Emart presence WebSocket |
| 5678 | n8n |
| 5679 | Unknown node process |
| 6333–6334 | Qdrant (Docker) |
| 6379 | Redis |
| 11434 | Ollama |
| 18789–18790 | OpenClaw |
| **3020–3034, 3036+** | **Free — use for new projects** |
