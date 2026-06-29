import re, os, sys, json

config = open('/var/www/wordpress/wp-config.php').read()
m = re.search(r"define\(\s*'DB_PASSWORD',\s*'([^']*)'\s*\)", config)
os.environ['EMART_DB_PASSWORD'] = m.group(1)

key = json.load(open('/root/.openclaw/credentials/openrouter_default.json'))
os.environ['OPENROUTER_API_KEY'] = key['apiKey']

sys.argv = ['meta_generator.py'] + sys.argv[1:]
sys.path.insert(0, os.path.dirname(__file__))
exec(open(os.path.join(os.path.dirname(__file__), 'meta_generator.py')).read())
