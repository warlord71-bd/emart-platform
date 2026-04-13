# WordPress & WooCommerce Complete Reference Guide

**E-Mart Platform - Working Codex for Development**

---

## Table of Contents

1. [WordPress Basics](#wordpress-basics)
2. [Database Structure](#database-structure)
3. [WooCommerce API](#woocommerce-api)
4. [Common Tasks](#common-tasks)
5. [Troubleshooting](#troubleshooting)
6. [Server Configuration](#server-configuration)

---

## WordPress Basics

### Installation & Configuration

**WordPress Location:**
```
/var/www/wordpress/
```

**Configuration File:**
```bash
cat /var/www/wordpress/wp-config.php | grep -E "DB_|table_prefix"
```

**Key Settings:**
- Database: `emart_live`
- Table Prefix: `wp4h_` (NOT `wp_`)
- WordPress Version: Check via admin or:
  ```bash
  grep "wp_version =" /var/www/wordpress/wp-includes/version.php
  ```

### Admin Access

**Login URL:**
```
http://5.189.188.229/wp-admin/
http://5.189.188.229/wp-login.php
```

**Create New Admin User:**
```bash
mysql emart_live << 'SQL'
INSERT INTO wp4h_users (user_login, user_email, user_pass) 
VALUES ('newadmin', 'admin@example.com', MD5('password123'));

-- Get the user ID
SELECT ID FROM wp4h_users WHERE user_login='newadmin';

-- Make them admin (replace 123 with actual ID)
INSERT INTO wp4h_usermeta (user_id, meta_key, meta_value) 
VALUES (123, 'wp4h_capabilities', 'a:1:{s:13:"administrator";b:1;}');
INSERT INTO wp4h_usermeta (user_id, meta_key, meta_value) 
VALUES (123, 'wp4h_user_level', '10');
SQL
```

**Reset Admin Password:**
```bash
mysql emart_live << 'SQL'
UPDATE wp4h_users 
SET user_pass = MD5('newpassword') 
WHERE user_login = 'admin_username';
SQL
```

---

## Database Structure

### Core Tables (with wp4h_ prefix)

| Table | Purpose |
|-------|---------|
| `wp4h_posts` | Pages, posts, products, attachments |
| `wp4h_postmeta` | Post metadata (product options, images, etc.) |
| `wp4h_users` | User accounts |
| `wp4h_usermeta` | User metadata |
| `wp4h_options` | Site settings, plugin options |
| `wp4h_terms` | Categories, tags, product attributes |
| `wp4h_term_taxonomy` | Term relationships |
| `wp4h_term_relationships` | Post-to-term assignments |

### Checking Your Database

**List all tables:**
```bash
mysql emart_live -e "SHOW TABLES;"
```

**Check table prefix:**
```bash
mysql emart_live -e "SHOW TABLES LIKE '%posts';"
```

**Count records:**
```bash
mysql emart_live << 'SQL'
SELECT 
  'Posts' as type, COUNT(*) as count FROM wp4h_posts
UNION
SELECT 'Products', COUNT(*) FROM wp4h_posts WHERE post_type='product'
UNION
SELECT 'Attachments', COUNT(*) FROM wp4h_posts WHERE post_type='attachment'
UNION
SELECT 'Users', COUNT(*) FROM wp4h_users;
SQL
```

---

## WooCommerce API

### API Credentials

**Location:** `/var/www/wordpress/wp-config.php` (or .env.local)

**Typical Setup:**
```
WC_Consumer_Key: ck_emart_5189188229
WC_Consumer_Secret: cs_emart_5189188229
API_URL: http://5.189.188.229/wp-json/wc/v3
```

### Common API Endpoints

**Get All Products:**
```bash
curl -u "ck_key:cs_secret" \
  "http://5.189.188.229/wp-json/wc/v3/products?per_page=100"
```

**Get Single Product:**
```bash
curl -u "ck_key:cs_secret" \
  "http://5.189.188.229/wp-json/wc/v3/products/12345"
```

**Get Product Categories:**
```bash
curl -u "ck_key:cs_secret" \
  "http://5.189.188.229/wp-json/wc/v3/products/categories"
```

**Get Orders:**
```bash
curl -u "ck_key:cs_secret" \
  "http://5.189.188.229/wp-json/wc/v3/orders"
```

**Get Customers:**
```bash
curl -u "ck_key:cs_secret" \
  "http://5.189.188.229/wp-json/wc/v3/customers"
```

### API Authentication in Code

**Node.js/Next.js:**
```javascript
const fetchWC = async (endpoint) => {
  const auth = Buffer.from(
    `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
  ).toString('base64');
  
  const response = await fetch(
    `${process.env.WC_API_URL}${endpoint}`,
    { headers: { 'Authorization': `Basic ${auth}` } }
  );
  return response.json();
};
```

**PHP:**
```php
$consumer_key = 'ck_emart_5189188229';
$consumer_secret = 'cs_emart_5189188229';

$url = 'http://5.189.188.229/wp-json/wc/v3/products';
$auth = base64_encode($consumer_key . ':' . $consumer_secret);

$response = wp_remote_get($url, [
    'headers' => [
        'Authorization' => 'Basic ' . $auth
    ]
]);

$products = json_decode(wp_remote_retrieve_body($response));
```

---

## Common Tasks

### 1. Backup Database

```bash
# Backup emart_live database
mysqldump -u root emart_live > /tmp/emart_backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with gzip compression
mysqldump -u root emart_live | gzip > /tmp/emart_backup_$(date +%Y%m%d).sql.gz

# Restore from backup
mysql emart_live < /tmp/emart_backup_20260413.sql
```

### 2. Manage Products

**Get all products and their IDs:**
```bash
mysql emart_live -e "
SELECT ID, post_title, post_status 
FROM wp4h_posts 
WHERE post_type='product' 
ORDER BY ID DESC 
LIMIT 20;
"
```

**Get product count by status:**
```bash
mysql emart_live -e "
SELECT post_status, COUNT(*) as count 
FROM wp4h_posts 
WHERE post_type='product' 
GROUP BY post_status;
"
```

**Publish/unpublish products:**
```bash
# Publish all drafts
mysql emart_live -e "
UPDATE wp4h_posts 
SET post_status='publish' 
WHERE post_type='product' AND post_status='draft';
"

# Unpublish products with low stock
mysql emart_live -e "
UPDATE wp4h_posts p
JOIN wp4h_postmeta pm ON p.ID = pm.post_id
SET p.post_status='draft'
WHERE p.post_type='product'
AND pm.meta_key='_stock'
AND CAST(pm.meta_value AS SIGNED) < 5;
"
```

### 3. Manage Images/Attachments

**List all attachments:**
```bash
mysql emart_live -e "
SELECT ID, post_title, guid, post_parent 
FROM wp4h_posts 
WHERE post_type='attachment' 
LIMIT 20;
"
```

**Find orphaned images (not linked to products):**
```bash
mysql emart_live -e "
SELECT ID, post_title, post_parent 
FROM wp4h_posts 
WHERE post_type='attachment' AND post_parent=0;
"
```

**Link product to image:**
```bash
mysql emart_live -e "
INSERT INTO wp4h_postmeta (post_id, meta_key, meta_value) 
VALUES (PRODUCT_ID, '_thumbnail_id', IMAGE_ATTACHMENT_ID);
"
```

**Delete broken image references:**
```bash
mysql emart_live -e "
DELETE FROM wp4h_postmeta 
WHERE meta_key='_thumbnail_id' 
AND meta_value NOT IN (
  SELECT ID FROM wp4h_posts WHERE post_type='attachment'
);
"
```

### 4. Manage Categories

**List all product categories:**
```bash
mysql emart_live -e "
SELECT t.term_id, t.name, t.slug, COUNT(tr.object_id) as product_count
FROM wp4h_terms t
LEFT JOIN wp4h_term_relationships tr ON t.term_id = tr.term_taxonomy_id
LEFT JOIN wp4h_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
WHERE tt.taxonomy = 'product_cat'
GROUP BY t.term_id;
"
```

**Create new category:**
```bash
mysql emart_live << 'SQL'
-- Insert into terms table
INSERT INTO wp4h_terms (name, slug) VALUES ('New Category', 'new-category');

-- Get the term ID
SET @term_id = LAST_INSERT_ID();

-- Insert into term_taxonomy
INSERT INTO wp4h_term_taxonomy (term_id, taxonomy) VALUES (@term_id, 'product_cat');
SQL
```

### 5. Manage Orders

**Get recent orders:**
```bash
mysql emart_live -e "
SELECT ID, post_title, post_author, post_date, post_status 
FROM wp4h_posts 
WHERE post_type='shop_order' 
ORDER BY post_date DESC 
LIMIT 10;
"
```

**Get order total:**
```bash
mysql emart_live -e "
SELECT p.ID, p.post_title, pm.meta_value as total
FROM wp4h_posts p
JOIN wp4h_postmeta pm ON p.ID = pm.post_id
WHERE p.post_type='shop_order'
AND pm.meta_key='_order_total'
LIMIT 10;
"
```

### 6. Manage Users

**List all users:**
```bash
mysql emart_live -e "SELECT ID, user_login, user_email FROM wp4h_users;"
```

**Give user admin role:**
```bash
# Get user ID first
mysql emart_live -e "SELECT ID FROM wp4h_users WHERE user_login='username';"

# Then run (replace 123 with actual ID)
mysql emart_live << 'SQL'
INSERT INTO wp4h_usermeta (user_id, meta_key, meta_value) 
VALUES (123, 'wp4h_capabilities', 'a:1:{s:13:"administrator";b:1;}');
INSERT INTO wp4h_usermeta (user_id, meta_key, meta_value) 
VALUES (123, 'wp4h_user_level', '10');
SQL
```

### 7. Clear Cache/Transients

```bash
mysql emart_live -e "
DELETE FROM wp4h_options 
WHERE option_name LIKE '%transient%';
"
```

### 8. Fix Site URL

**Check current URLs:**
```bash
mysql emart_live -e "
SELECT option_name, option_value 
FROM wp4h_options 
WHERE option_name IN ('siteurl', 'home');
"
```

**Update site URL:**
```bash
mysql emart_live << 'SQL'
UPDATE wp4h_options SET option_value='http://5.189.188.229' WHERE option_name='siteurl';
UPDATE wp4h_options SET option_value='http://5.189.188.229' WHERE option_name='home';
SQL
```

---

## Troubleshooting

### 1. 404 Errors on Product Pages

**Check if product exists:**
```bash
mysql emart_live -e "
SELECT ID, post_title, post_name, post_status 
FROM wp4h_posts 
WHERE post_type='product' AND post_name='product-slug';
"
```

**Regenerate permalinks:**
- Go to WordPress Admin → Settings → Permalinks
- Click "Save Changes" (without changing anything)

Or via database:
```bash
mysql emart_live -e "
DELETE FROM wp4h_postmeta 
WHERE meta_key='_permalink';
"
```

### 2. Images Not Displaying

**Check if attachment exists:**
```bash
mysql emart_live -e "
SELECT ID, post_title, guid 
FROM wp4h_posts 
WHERE post_type='attachment' 
AND post_title LIKE '%image-name%';
"
```

**Check file permissions:**
```bash
ls -lah /var/www/wordpress/wp-content/uploads/
sudo chown -R www-data:www-data /var/www/wordpress/wp-content/uploads/
sudo chmod -R 755 /var/www/wordpress/wp-content/uploads/
```

**Verify file exists on disk:**
```bash
# From database GUID, extract path
mysql emart_live -e "
SELECT guid FROM wp4h_posts WHERE ID=ATTACHMENT_ID;
"

# Then check if file exists
ls -lh /var/www/wordpress/wp-content/uploads/YYYY/MM/filename.jpg
```

### 3. API Returning 403 or 404

**Check if REST API is enabled:**
```bash
mysql emart_live -e "
SELECT option_value FROM wp4h_options 
WHERE option_name='permalink_structure';
"
```

**Verify WooCommerce API keys:**
```bash
mysql emart_live -e "
SELECT post_title, meta_key, meta_value FROM wp4h_posts p
JOIN wp4h_postmeta pm ON p.ID = pm.post_id
WHERE post_type='shop_apikey'
LIMIT 10;
"
```

**Test API locally:**
```bash
curl -I http://127.0.0.1/wp-json/wc/v3/products
```

### 4. High Database Query Load

**Find slowest queries:**
```bash
mysql emart_live -e "SHOW PROCESSLIST;"
```

**Check for missing indexes:**
```bash
mysql emart_live -e "
SELECT t.TABLE_NAME, c.COLUMN_NAME 
FROM INFORMATION_SCHEMA.TABLES t
JOIN INFORMATION_SCHEMA.COLUMNS c ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME
WHERE t.TABLE_SCHEMA = 'emart_live'
AND c.COLUMN_NAME IN ('post_type', 'post_status', 'meta_key')
AND NOT EXISTS (
  SELECT * FROM INFORMATION_SCHEMA.STATISTICS s
  WHERE s.TABLE_NAME = t.TABLE_NAME
  AND s.COLUMN_NAME = c.COLUMN_NAME
);
"
```

### 5. WordPress Not Responding

**Check PHP-FPM status:**
```bash
sudo systemctl status php8.2-fpm
sudo systemctl restart php8.2-fpm
```

**Check Nginx configuration:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Check logs:**
```bash
sudo tail -100 /var/log/nginx/emart_error.log
sudo tail -100 /var/www/wordpress/wp-content/debug.log
```

---

## Server Configuration

### File Locations

```
WordPress Root:     /var/www/wordpress/
Config File:        /var/www/wordpress/wp-config.php
Plugins:            /var/www/wordpress/wp-content/plugins/
Themes:             /var/www/wordpress/wp-content/themes/
Uploads:            /var/www/wordpress/wp-content/uploads/
```

### Nginx Configuration

**Location:** `/etc/nginx/sites-available/emart`

**Key Sections:**
- WordPress routing: `/wp-json/`, `/wp-admin/`, `/wp-login.php`
- Static files: `/_next/static/`, `/public/`, `/wp-content/uploads/`
- Catch-all proxy: Routes to Node.js backend (port 3000)

**Reload after changes:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### PHP Configuration

**PHP Version:** 8.2

**Check PHP-FPM:**
```bash
sudo systemctl status php8.2-fpm
```

**PHP.ini location:**
```bash
php -i | grep "Loaded Configuration File"
```

**Increase upload size limit:**
```bash
sudo nano /etc/php/8.2/fpm/php.ini
# Change:
# upload_max_filesize = 256M
# post_max_size = 256M

sudo systemctl restart php8.2-fpm
```

### MySQL/MariaDB

**Connect to database:**
```bash
mysql emart_live
```

**Backup:**
```bash
mysqldump -u root emart_live | gzip > emart_live_backup.sql.gz
```

**Restore:**
```bash
gunzip emart_live_backup.sql.gz
mysql emart_live < emart_live_backup.sql
```

**Check database size:**
```bash
mysql -e "
SELECT table_schema, ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
FROM information_schema.tables
WHERE table_schema = 'emart_live'
GROUP BY table_schema;
"
```

---

## Quick Command Reference

```bash
# Restart all services
sudo systemctl restart nginx php8.2-fpm

# View logs
tail -f /var/log/nginx/emart_error.log
tail -f /var/www/wordpress/wp-content/debug.log

# Check disk space
df -h

# Check database
mysql emart_live -e "SELECT COUNT(*) FROM wp4h_posts WHERE post_type='product';"

# Backup everything
mkdir -p /backups
mysqldump -u root emart_live | gzip > /backups/emart_$(date +%Y%m%d_%H%M%S).sql.gz

# SSH into VPS
ssh root@5.189.188.229
```

---

**Last Updated:** April 2026
**Database:** emart_live
**Table Prefix:** wp4h_
**WordPress Version:** Check in admin or wp-config.php
