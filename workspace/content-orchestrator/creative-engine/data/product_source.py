"""
THE WooCommerce product client. Nothing else fetches product data.

Extracted from social_image_gen.py — same SSL bypass, same .env.local read,
same localhost+Host-header trick for on-VPS calls.
"""
from __future__ import annotations
import json, ssl, urllib.request
from pathlib import Path


def _ssl_ctx():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def fetch_product(product_id: int) -> dict:
    env_file = Path("/var/www/emart-platform/apps/web/.env.local")
    wc_key = wc_secret = ""
    if env_file.exists():
        for line in env_file.read_text().strip().split("\n"):
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                k = k.strip()
                if k in ("WOO_CONSUMER_KEY", "WC_CONSUMER_KEY"):
                    wc_key = v.strip()
                elif k in ("WOO_CONSUMER_SECRET", "WC_CONSUMER_SECRET"):
                    wc_secret = v.strip()
    url = (f"https://127.0.0.1/wp-json/wc/v3/products/{product_id}"
           f"?consumer_key={wc_key}&consumer_secret={wc_secret}")
    req = urllib.request.Request(url, headers={"Host": "e-mart.com.bd"})
    resp = urllib.request.urlopen(req, context=_ssl_ctx(), timeout=15)
    return json.loads(resp.read())
