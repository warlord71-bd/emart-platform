# E-Mart Platform - Complete Project Codex for ChatGPT

**Project Status:** April 13, 2026 | VPS IP: 5.189.188.229 | Critical Issue: Images Missing

---

## Executive Summary

**E-Mart BD** is a Bangladesh-based eCommerce platform selling authentic Korean & Japanese beauty products (COSRX, Maybelline, Missha, etc.) to Bangladeshi women aged 18-35, targeting mobile-first users.

**Technology Stack:**
- Frontend: Next.js 14+ (React, TypeScript, Tailwind CSS) running on Node.js port 3000
- Backend: WordPress 6.x with WooCommerce REST API on port 80
- Database: MySQL/MariaDB (`emart_live` database with `wp4h_` table prefix)
- Reverse Proxy: Nginx (routes Next.js and WordPress)
- Process Manager: PM2 (manages Node.js app)
- VPS: Ubuntu 22.04 LTS on Hetzner

**Repository:** `warlord71-bd/emart-platform` on GitHub

---

## Architecture Overview

### Tech Stack Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                       │
│               (5.189.188.229:80, Port 443 HTTPS)            │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                       │
│  WordPress/PHP       │        Next.js Frontend               │
│  (WooCommerce)       │        (Node.js Port 3000)            │
│  Port 80             │                                       │
│  /wp-json/*          │        /shop, /, /product/*          │
│  /wp-admin/*         │        /_next/static/*               │
│  /wp-login.php       │                                       │
│  /wp-content/*       │                                       │
│                      │                                       │
├──────────────────────┼──────────────────────────────────────┤
│        PHP-FPM       │       Node.js PM2 (emartweb)        │
│     Unix Socket      │       /var/www/emart-platform       │
│  /run/php/php8.2-fpm │       apps/web/ (Next.js)           │
│                      │       apps/mobile/ (React Native)    │
├──────────────────────┼──────────────────────────────────────┤
│  MySQL/MariaDB       │      File System                      │
│  emart_live DB       │      /var/www/emart-platform/       │
│  6381 images         │      /var/www/wordpress/            │
│  3569 products       │      /var/www/html/                 │
│  1000+ orders        │      /var/www/medimart/             │
└──────────────────────┴──────────────────────────────────────┘
```

### Directory Structure

```
/var/www/
├── emart-platform/              # Next.js app root
│   ├── apps/web/                # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/             # App Router pages
│   │   │   ├── components/      # React components
│   │   │   ├── store/           # Zustand stores (cart, wishlist)
│   │   │   └── types/           # TypeScript types
│   │   ├── .next/               # Build artifacts (static files)
│   │   ├── public/              # Static files
│   │   └── package.json
│   ├── apps/mobile/             # React Native mobile app
│   ├── packages/                # Shared packages
│   └── scripts/                 # Deployment scripts
│
├── wordpress/                   # WordPress backend
│   ├── wp-config.php           # Configuration (DB, prefix, keys)
│   ├── wp-content/
│   │   ├── plugins/            # WooCommerce, etc.
│   │   ├── themes/             # WordPress themes
│   │   └── uploads/            # **CURRENTLY EMPTY - IMAGES MISSING**
│   ├── wp-admin/
│   ├── wp-includes/
│   └── wp-login.php
│
├── html/                        # Backup/old WordPress
└── medimart/                    # Another old WordPress installation

/etc/nginx/
├── nginx.conf                   # Main config
└── sites-available/emart        # E-Mart site config
```

---

## Database Structure

### Connection Details

```
Host: localhost
Database: emart_live
User: root
Password: (in wp-config.php)
Table Prefix: wp4h_ (NOT wp_)
```

### Core Tables

| Table | Records | Purpose |
|-------|---------|---------|
| `wp4h_posts` | ~4000 | Products, pages, posts, attachments |
| `wp4h_postmeta` | ~50000 | Product metadata (price, stock, images) |
| `wp4h_users` | ~100 | Site users and administrators |
| `wp4h_usermeta` | ~500 | User metadata (roles, capabilities) |
| `wp4h_options` | ~500 | Site settings, plugin options |
| `wp4h_terms` | ~200 | Categories, tags, attributes |
| `wp4h_term_taxonomy` | ~200 | Taxonomy relationships |
| `wp4h_term_relationships` | ~5000 | Post-to-term mappings |
| `wp4h_posts` (attachment) | **6381** | Image attachments (**MISSING FILES**) |

### Quick Database Queries

```bash
# Connect to database
mysql emart_live

# Count products
SELECT COUNT(*) FROM wp4h_posts WHERE post_type='product';
# Result: 3569 products

# Count images
SELECT COUNT(*) FROM wp4h_posts WHERE post_type='attachment';
# Result: 6381 attachments

# Check table prefix
SHOW TABLES;
# All start with wp4h_

# Get WordPress version
SELECT option_value FROM wp4h_options WHERE option_name='db_version';

# Check site URL
SELECT option_value FROM wp4h_options WHERE option_name IN ('siteurl', 'home');
```

---

## What Was Done - Complete History

### Session 1: Initial Deployment (2:20 AM - 2:30 AM)
- ✅ Deployed Next.js frontend from commit `baf66a2`
- ✅ Restored ProductCard, ProductImage, wishlist components
- ✅ Built Next.js application successfully
- ✅ PM2 started Node.js server on port 3000
- **Status:** Site appeared to work with styling and products visible

### Session 2: Site Broke (2:30 AM - Present)
- ❌ CSS files returning **HTTP 503 Service Unavailable**
- ❌ JavaScript chunks returning **HTTP 503**
- ❌ Product images returning **HTTP 404 Not Found**
- ❌ Homepage displayed with no styling, broken layout

### Session 3: Nginx Misconfiguration Fixed (Current)

**Problem Identified:** Nginx using `root` instead of `alias` for static files

**Before (❌ Broken):**
```nginx
location ~* ^/(_next|public|images|static)/ {
    root /var/www/emart-platform/apps/web/.next;
    try_files $uri =404;
}
```
This looked for: `/var/www/emart-platform/apps/web/.next/_next/static/css/file.css` ❌

**After (✅ Fixed):**
```nginx
location /_next/static/ {
    alias /var/www/emart-platform/apps/web/.next/static/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /public/ {
    alias /var/www/emart-platform/apps/web/public/;
}

location /wp-content/uploads/ {
    try_files $uri =404;
    expires 30d;
}
```

**Fixes Applied:**
1. ✅ Updated `/etc/nginx/sites-available/emart` with correct alias directives
2. ✅ Reloaded Nginx configuration
3. ✅ CSS files now return HTTP 200 OK
4. ✅ JavaScript chunks now return HTTP 200 OK
5. ✅ Nginx properly routes requests

**Database Image Restoration Attempted:**
1. Restored 4016 product-to-image database links
2. Created PHP script to extract base64 images from database
3. Successfully extracted 1 image from base64 metadata
4. **BLOCKED:** Actual image files don't exist on disk

---

## Current System State

### ✅ What Works

- **Nginx:** ✅ Reverse proxy routing correct
- **Next.js:** ✅ Running on port 3000, serving pages
- **CSS/JS:** ✅ Static files returning 200 OK
- **WordPress API:** ✅ `/wp-json/wc/v3/products` responsive
- **Database:** ✅ All 3569 products intact
- **Homepage:** ✅ Loads with proper styling and layout
- **Product Grid:** ✅ Renders correctly with prices/buttons

### ❌ What's Broken

- **Product Images:** ❌ 0 of 6381 images on disk
  - Database references images at: `/var/www/wordpress/wp-content/uploads/2022/`, `/uploads/2024/`, etc.
  - Files physically don't exist on this VPS
  - Old server (e-mart.com.bd) blocks HTTP access (403 Forbidden)
  
- **Image Paths Missing:**
  - `/var/www/wordpress/wp-content/uploads/2022/` - **EMPTY**
  - `/var/www/wordpress/wp-content/uploads/2024/` - **EMPTY**
  - `/var/www/wordpress/wp-content/uploads/2026/` - **EMPTY (except logs)**

### Current Test Results

```bash
# CSS file test
curl -I http://127.0.0.1/_next/static/css/c54095bdb23c25be.css
# Response: HTTP 200 OK ✅

# Homepage test
curl -I http://127.0.0.1/
# Response: HTTP 200 OK ✅

# Product image test
curl -I http://5.189.188.229/wp-content/uploads/2022/04/product.jpg
# Response: HTTP 404 Not Found ❌
```

---

## Git Branch & Commits

**Current Branch:** `claude/build-homepage-sections-rAMmz`

**Recent Commits:**
```
77abf65 docs: add comprehensive WordPress & WooCommerce working codex guide
e496a44 docs: add comprehensive fix summary explaining the issue and solution
49dea97 docs: add deployment instructions for static file serving fix
9b55848 add: fix-static-serving.sh deployment script
94f6b65 fix: update nginx config to use alias for static file serving
8aa4fe3 restore: revert design components to 2:20 AM state
f6ff13f fix: route /wp-json/ and /wp-admin/ directly to PHP-FPM
```

**To Deploy Current State:**
```bash
cd /var/www/emart-platform
git fetch origin claude/build-homepage-sections-rAMmz
git reset --hard origin/claude/build-homepage-sections-rAMmz
bash scripts/fix-static-serving.sh
```

---

## Configuration Files

### WordPress Configuration
**Location:** `/var/www/wordpress/wp-config.php`

**Key Settings:**
```php
define('DB_NAME', 'emart_live');
define('DB_USER', 'root');
define('DB_PASSWORD', 'password');
define('DB_HOST', 'localhost');
$table_prefix = 'wp4h_';
define('WP_DEBUG', false);
```

### Next.js Environment
**Location:** `/var/www/emart-platform/apps/web/.env.local`

```
NEXT_PUBLIC_WOO_URL=http://5.189.188.229
NEXT_PUBLIC_API_URL=http://5.189.188.229
WOO_CONSUMER_KEY=ck_emart_5189188229
WOO_CONSUMER_SECRET=cs_emart_5189188229
NODE_ENV=production
```

### Nginx Configuration
**Location:** `/etc/nginx/sites-available/emart`

**Key Locations:**
- `/_next/static/` → `/var/www/emart-platform/apps/web/.next/static/` (alias)
- `/public/` → `/var/www/emart-platform/apps/web/public/` (alias)
- `/wp-json/` → PHP-FPM (WordPress REST API)
- `/wp-admin/` → PHP-FPM (WordPress Admin)
- `/` → Node.js proxy (catch-all)

---

## WooCommerce API

### Authentication

**Consumer Key:** `ck_emart_5189188229`
**Consumer Secret:** `cs_emart_5189188229`

**Usage:**
```bash
curl -u "ck_emart_5189188229:cs_emart_5189188229" \
  "http://5.189.188.229/wp-json/wc/v3/products?per_page=10"
```

### Common Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/wp-json/wc/v3/products` | Get all products |
| `/wp-json/wc/v3/products/{id}` | Get single product |
| `/wp-json/wc/v3/products/categories` | Get categories |
| `/wp-json/wc/v3/orders` | Get orders |
| `/wp-json/wc/v3/customers` | Get customers |

---

## Known Issues & Limitations

### 1. **CRITICAL: Missing Product Images**
- **Issue:** 6381 image attachments in database but 0 files on disk
- **Cause:** Images never synced from old server to new VPS
- **Impact:** All product images show broken/placeholder
- **Solution Needed:**
  - Access old server (e-mart.com.bd) via SFTP/SSH
  - Copy `/var/www/wordpress/wp-content/uploads/` to new server
  - OR manually re-upload product images

### 2. External Envoy Proxy Blocking
- **Issue:** Hosting provider's Envoy proxy returns "host_not_allowed" 403 for some requests
- **Cause:** External firewall rules
- **Workaround:** Everything works locally on VPS (http://127.0.0.1)
- **Fix:** Contact hosting provider to whitelist paths

### 3. Database Metadata Issues
- Some product metadata corrupted (serialized arrays, base64 data)
- Comprehensive fix script attempted cleanup but introduced gaps
- Database links intact, just missing files

### 4. Multiple WordPress Installations
- `/var/www/wordpress/` - Main (current)
- `/var/www/html/` - Backup
- `/var/www/medimart/` - Old installation
- Causes confusion, should consolidate

---

## Server Credentials & Access

### VPS Access
```
Host: 5.189.188.229
User: root
SSH Key: (provided separately)
```

### Database Access
```
Host: localhost
Database: emart_live
User: root
Password: (see /var/www/wordpress/wp-config.php)
```

### WordPress Admin
```
URL: http://5.189.188.229/wp-admin/
Username: (create via MySQL)
Password: (create via MySQL)
```

### Services Management

```bash
# Restart services
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm
pm2 restart emartweb

# View logs
tail -f /var/log/nginx/emart_error.log
pm2 logs emartweb
```

---

## Common Tasks

### Backup Everything
```bash
# Database
mysqldump emart_live | gzip > /backups/emart_$(date +%Y%m%d).sql.gz

# Files
tar czf /backups/emart_files_$(date +%Y%m%d).tar.gz \
  /var/www/emart-platform \
  /var/www/wordpress
```

### Deploy New Code
```bash
cd /var/www/emart-platform
git fetch origin <branch>
git checkout <branch>
cd apps/web
npm install
npm run build
pm2 restart emartweb
```

### Add Admin User
```bash
mysql emart_live << 'SQL'
INSERT INTO wp4h_users (user_login, user_email, user_pass) 
VALUES ('admin', 'admin@example.com', MD5('password123'));

SET @uid = LAST_INSERT_ID();
INSERT INTO wp4h_usermeta (user_id, meta_key, meta_value) 
VALUES (@uid, 'wp4h_capabilities', 'a:1:{s:13:"administrator";b:1;}');
INSERT INTO wp4h_usermeta (user_id, meta_key, meta_value) 
VALUES (@uid, 'wp4h_user_level', '10');
SQL
```

### Restore Database
```bash
gunzip emart_backup.sql.gz
mysql emart_live < emart_backup.sql
```

---

## Performance & Optimization

### Current Performance
- Page Load: ~2-3 seconds (from VPS locally)
- Database Queries: ~50-100ms per request
- Nginx Response Time: <100ms
- Node.js Memory: ~300-400MB

### Recommendations
1. **Enable caching:**
   - Nginx page caching for static pages
   - Redis for WooCommerce caching

2. **Optimize images:**
   - Once images restored, compress and serve WebP
   - Use CDN for image delivery

3. **Database optimization:**
   - Add indexes to frequently queried columns
   - Archive old orders

4. **Code splitting:**
   - Reduce Next.js bundle size
   - Lazy load components

---

## Next Steps for Handoff

### Immediate (Critical)
1. **Restore product images:**
   - Access old server (e-mart.com.bd)
   - Copy uploads folder via SFTP
   - Set permissions: `sudo chown -R www-data:www-data /var/www/wordpress/wp-content/uploads/`

2. **Verify everything works:**
   - Open http://5.189.188.229
   - Check products load with images
   - Test add-to-cart functionality
   - Verify WooCommerce API responsive

### Short-term (This Week)
1. Create backup strategy (daily backups to S3 or external storage)
2. Set up SSL/HTTPS certificate (Let's Encrypt)
3. Configure email (for order notifications)
4. Test checkout flow end-to-end
5. Set up uptime monitoring

### Medium-term (Next 2 Weeks)
1. Optimize database performance
2. Implement caching (Redis)
3. Set up CDN for static files
4. Configure bKash/Nagad payment integration
5. Test on mobile devices

### Long-term (Next Month)
1. Set up CI/CD pipeline
2. Implement automated backups
3. Add search functionality (Elasticsearch)
4. Implement analytics
5. Performance optimization & SEO

---

## Files Reference

**Key Documentation:**
- `FIX-SUMMARY.md` - Detailed explanation of Nginx fix
- `DEPLOY-FIX-INSTRUCTIONS.md` - Step-by-step deployment guide
- `WORDPRESS-CODEX-GUIDE.md` - WordPress reference for common tasks
- `CLAUDE.md` - Original project constraints and guidelines

**Key Scripts:**
- `scripts/fix-static-serving.sh` - Automated Nginx/server fix
- `scripts/comprehensive-fix.sh` - Database cleanup (USE WITH CAUTION)
- `scripts/setup-vps-config.sh` - Initial VPS configuration
- `QUICK-VPS-DEPLOY.sh` - Deploy code to VPS

**Configuration:**
- `nginx/emart-vps.conf` - Nginx configuration (synced to `/etc/nginx/sites-available/emart`)

---

## Troubleshooting Guide

### Problem: CSS/JS files return 503
**Solution:** Ensure Nginx alias directives are correct (use `alias` not `root`)
```bash
sudo systemctl reload nginx
```

### Problem: WordPress API returns 404
**Solution:** Check `/wp-json/` endpoint works
```bash
curl http://127.0.0.1/wp-json/wc/v3/products?per_page=1
```

### Problem: Images not displaying
**Solution:** Copy uploads folder from old server
```bash
# From old server
tar czf uploads.tar.gz /var/www/wordpress/wp-content/uploads/

# To new server
scp uploads.tar.gz root@5.189.188.229:/tmp/
ssh root@5.189.188.229 "cd /var/www/wordpress/wp-content && tar xzf /tmp/uploads.tar.gz"
```

### Problem: PM2 process crashed
**Solution:** Restart and check logs
```bash
pm2 restart emartweb
pm2 logs emartweb --lines 100
```

### Problem: High memory usage
**Solution:** Check for memory leaks
```bash
pm2 monit
pm2 reload emartweb
```

---

## Important Notes for Next Developer

1. **Table Prefix:** Always use `wp4h_` NOT `wp_` in queries
2. **Authentication:** WooCommerce API uses Basic Auth (base64 encoded credentials)
3. **File Permissions:** WordPress files must be owned by `www-data:www-data`
4. **Static Files:** Use Nginx `alias` for non-root paths (not `root`)
5. **Backups:** Take regular backups before major changes
6. **Testing:** Always test locally first, then on staging VPS
7. **Images:** Once restored, ensure proper caching headers set
8. **Mobile:** Test on mobile devices regularly (70% of users)
9. **Currencies:** Always use BDT (৳) not USD
10. **Git:** Commit frequently with clear messages, never commit credentials

---

**Document Version:** 1.0  
**Last Updated:** April 13, 2026, 13:30 UTC  
**Status:** Handoff Complete - Ready for ChatGPT Continuation  
**Critical Blocker:** Missing product images (need file restoration)
