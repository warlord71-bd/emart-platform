#!/usr/bin/env python3
"""
Fix WordPress siteurl & home options so VPS admin login works.
Run on VPS: python3 scripts/fix_wp_siteurl.py
"""
import subprocess
import re

WP_CONFIG    = "/var/www/wordpress/wp-config.php"
TABLE_PREFIX = "wp4h_"
NEW_URL      = "http://5.189.188.229"   # VPS IP — change if you have a domain later

def get_db_config():
    config = {}
    try:
        content = open(WP_CONFIG).read()
        for key in ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST']:
            m = re.search(r"define\(\s*['\"]%s['\"]\s*,\s*['\"]([^'\"]+)['\"]" % key, content)
            if m:
                config[key] = m.group(1)
    except Exception as e:
        print(f"Cannot read wp-config.php: {e}")
    return config

db      = get_db_config()
DB_NAME = db.get('DB_NAME', 'emart_live')
DB_USER = db.get('DB_USER', 'emart_user')
DB_PASS = db.get('DB_PASSWORD', 'Emart@123456')
DB_HOST = db.get('DB_HOST', 'localhost')

def mysql(sql):
    cmd = ['mysql', '-u', DB_USER, f'-p{DB_PASS}', '-h', DB_HOST,
           DB_NAME, '-N', '-B', '--skip-column-names', '-e', sql]
    result = subprocess.run(cmd, capture_output=True, text=True)
    stderr = result.stderr.strip()
    real_errors = [l for l in stderr.splitlines() if 'ERROR' in l and 'Warning' not in l]
    if real_errors:
        raise Exception('\n'.join(real_errors))
    return result.stdout.strip()

print("=" * 50)
print("WordPress Siteurl Fix")
print("=" * 50)

# Show current values
print("\nCurrent values:")
for opt in ['siteurl', 'home']:
    val = mysql(f"SELECT option_value FROM {TABLE_PREFIX}options WHERE option_name='{opt}' LIMIT 1")
    print(f"  {opt}: {val}")

# Update to VPS IP
print(f"\nUpdating to: {NEW_URL}")
for opt in ['siteurl', 'home']:
    mysql(f"UPDATE {TABLE_PREFIX}options SET option_value='{NEW_URL}' WHERE option_name='{opt}'")

# Confirm
print("\nUpdated values:")
for opt in ['siteurl', 'home']:
    val = mysql(f"SELECT option_value FROM {TABLE_PREFIX}options WHERE option_name='{opt}' LIMIT 1")
    print(f"  {opt}: {val}")

print(f"""
✅ Done! Now login at:
   http://5.189.188.229/wp-admin

⚠️  If you later point a domain, run this again with NEW_URL = 'https://yourdomain.com'
""")
