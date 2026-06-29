import re, os, sys

config = open('/var/www/wordpress/wp-config.php').read()
m = re.search(r"define\(\s*'DB_PASSWORD',\s*'([^']*)'\s*\)", config)
os.environ['EMART_DB_PASSWORD'] = m.group(1)

sys.argv = ['meta_validator.py'] + sys.argv[1:]
sys.path.insert(0, os.path.dirname(__file__))
exec(open(os.path.join(os.path.dirname(__file__), 'meta_validator.py')).read())
