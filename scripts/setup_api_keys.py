#!/usr/bin/env python3
"""
Emart VPS Setup Script
- Reads WordPress config for DB credentials + table prefix
- Generates correct WooCommerce API keys (HMAC-SHA256 with 'wc-api')
- Inserts keys into MySQL
- Tests the API
- Writes .env.local
- Rebuilds Next.js and restarts PM2
"""

import subprocess
import re
import hmac
import hashlib
import secrets
import os
import sys
import json

# ── Paths ──────────────────────────────────────────────────────────────────
WP_CONFIG   = '/var/www/wordpress/wp-config.php'
ENV_LOCAL   = '/var/www/emart-platform/apps/web/.env.local'
WEB_DIR     = '/var/www/emart-platform/apps/web'

# ── Step 1: Parse wp-config.php ────────────────────────────────────────────
print('\n[1/6] Reading WordPress config...')

def parse_wp_config(path):
    with open(path) as f:
        content = f.read()
    def get(key):
        m = re.search(rf"define\(\s*['\"]?{key}['\"]?\s*,\s*['\"]([^'\"]+)['\"]", content)
        return m.group(1) if m else ''
    prefix_m = re.search(r"\$table_prefix\s*=\s*['\"]([^'\"]+)['\"]", content)
    return {
        'db_name':   get('DB_NAME'),
        'db_user':   get('DB_USER'),
        'db_pass':   get('DB_PASSWORD'),
        'db_host':   get('DB_HOST'),
        'prefix':    prefix_m.group(1) if prefix_m else 'wp_',
    }

wp = parse_wp_config(WP_CONFIG)
print(f"  DB: {wp['db_name']} on {wp['db_host']}, prefix: {wp['prefix']}")

# ── Step 2: MySQL helper (uses CLI — no python packages needed) ────────────
print('\n[2/6] Setting up MySQL connection...')

def mysql(sql):
    """Run SQL via mysql CLI, return stdout."""
    result = subprocess.run(
        ['mysql', '-u', wp['db_user'], f"-p{wp['db_pass']}", wp['db_name'],
         '-sNe', sql],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        err = result.stderr.replace('mysql: [Warning] Using a password on the command line interface can be insecure.\n', '')
        if err.strip():
            print(f'  SQL error: {err.strip()}')
    return result.stdout.strip()

# Quick connectivity test
test = mysql("SELECT 1")
if test != '1':
    print('  Cannot connect to MySQL. Check credentials.')
    sys.exit(1)
print('  Connected.')

# ── Step 3: Get admin user ID ───────────────────────────────────────────────
print('\n[3/6] Finding admin user...')
table_users = f"{wp['prefix']}users"
table_meta  = f"{wp['prefix']}usermeta"
table_keys  = f"{wp['prefix']}woocommerce_api_keys"

# Find user with administrator role
out = mysql(f"""
    SELECT u.ID, u.user_login
    FROM {table_users} u
    JOIN {table_meta} m ON u.ID = m.user_id
    WHERE m.meta_key = '{wp['prefix']}capabilities'
      AND m.meta_value LIKE '%administrator%'
    LIMIT 1
""")
if not out:
    out = mysql(f"SELECT ID, user_login FROM {table_users} ORDER BY ID LIMIT 1")
if not out:
    print('  No users found in DB.')
    sys.exit(1)

parts = out.split('\t')
admin_id, admin_login = parts[0], parts[1]
print(f"  Admin: ID={admin_id}, login={admin_login}")

# ── Step 4: Generate correct WooCommerce API keys ──────────────────────────
print('\n[4/6] Generating API keys...')

raw_ck = 'ck_' + secrets.token_hex(20)
raw_cs = 'cs_' + secrets.token_hex(20)

# WooCommerce uses: hash_hmac('sha256', $consumer_key, 'wc-api')
hashed_ck = hmac.new(b'wc-api', raw_ck.encode(), hashlib.sha256).hexdigest()

print(f"  consumer_key:    {raw_ck}")
print(f"  consumer_secret: {raw_cs}")
print(f"  stored hash:     {hashed_ck[:20]}...")

# Remove old entries with same description, insert new
mysql(f"DELETE FROM {table_keys} WHERE description = 'Next.js Frontend'")
mysql(f"""
    INSERT INTO {table_keys}
        (user_id, description, permissions, consumer_key, consumer_secret, truncated_key)
    VALUES ({admin_id}, 'Next.js Frontend', 'read_write',
            '{hashed_ck}', '{raw_cs}', '{raw_ck[-7:]}')
""")
# Verify insert
check = mysql(f"SELECT COUNT(*) FROM {table_keys} WHERE description='Next.js Frontend'")
if check == '1':
    print('  Keys inserted into DB.')
else:
    print(f'  Insert may have failed (count={check}). Check errors above.')
    sys.exit(1)

# ── Step 5: Test the API ────────────────────────────────────────────────────
print('\n[5/6] Testing WooCommerce API...')
try:
    import urllib.request
    import urllib.parse
    url = f"http://127.0.0.1/wp-json/wc/v3/products?per_page=1&consumer_key={raw_ck}&consumer_secret={raw_cs}"
    with urllib.request.urlopen(url, timeout=10) as resp:
        data = json.loads(resp.read())
        if isinstance(data, list):
            print(f"  ✓ API works! Got {len(data)} product(s).")
            if data:
                print(f"  First product: {data[0].get('name', 'N/A')}")
        else:
            print(f"  Response: {json.dumps(data)[:200]}")
except Exception as e:
    print(f"  ✗ API test failed: {e}")
    print("  Check nginx logs: tail -20 /var/log/nginx/error.log")
    sys.exit(1)

# ── Step 6: Write .env.local ────────────────────────────────────────────────
print('\n[6/6] Writing .env.local...')
env_content = f"""NEXT_PUBLIC_WOO_URL=http://127.0.0.1
WOO_CONSUMER_KEY={raw_ck}
WOO_CONSUMER_SECRET={raw_cs}
NEXTAUTH_SECRET=emart_bd_secret_2026
NEXTAUTH_URL=http://5.189.188.229
"""
with open(ENV_LOCAL, 'w') as f:
    f.write(env_content)
print(f"  Written to {ENV_LOCAL}")

# ── Done ────────────────────────────────────────────────────────────────────
print('\n✓ API keys configured. Now run:')
print(f'  cd {WEB_DIR} && npm run build && pm2 restart emartweb')
