"""
Single source for brand tokens — palette, fonts, paths, audio.

Every Python composition file reads from here. Node callers (HyperFrames)
read tokens.json directly. This module simply loads that same JSON.
"""
from __future__ import annotations
import base64, glob, json
from pathlib import Path

_TOKENS_PATH = Path(__file__).parent / "tokens.json"
_TOKENS: dict = json.loads(_TOKENS_PATH.read_text())

VERSION = _TOKENS["version"]

# Palette
GOLD = _TOKENS["palette"]["gold"]
ROSE = _TOKENS["palette"]["rose"]
WINE = _TOKENS["palette"]["wine"]
INK = _TOKENS["palette"]["ink"]
SOFT_ROSE = _TOKENS["palette"]["soft_rose"]
SOFT = _TOKENS["palette"]["soft"]

# Fonts
FONT = _TOKENS["fonts"]["stack_css"]
FONT_SOCIAL = _TOKENS["fonts"]["stack_social_css"]
GOOGLE_FONT_IMPORT = _TOKENS["fonts"]["google_import"]
FFMPEG_FONT = _TOKENS["fonts"]["ffmpeg_default"]
FFMPEG_BENGALI_CANDIDATES = _TOKENS["fonts"]["ffmpeg_bengali_candidates"]

# Brand copy
BRAND_NAME = _TOKENS["brand"]["name"]
BRAND_TAGLINE = _TOKENS["brand"]["tagline"]
BRAND_FOOTER = _TOKENS["brand"]["footer"]
BRAND_URL = _TOKENS["brand"]["url"]
COD_LABEL = _TOKENS["brand"]["cod_label"]
CURRENCY_SYMBOL = _TOKENS["brand"]["currency_symbol"]
CURRENCY_LABEL = _TOKENS["brand"]["currency_label"]
KICKER_DEFAULT = _TOKENS["brand"]["kicker_default"]
KICKER_BANGLA = _TOKENS["brand"]["kicker_bangla"]

# Audio
LOUDNORM = _TOKENS["audio"]["loudnorm"]

# Formats
FORMATS = _TOKENS["formats"]

# Origin flags
ORIGIN_FLAGS = _TOKENS["origin_flags"]

# Chromium
CHROMIUM_GLOB = _TOKENS["chromium_glob"]


def find_chromium() -> str:
    hits = sorted(glob.glob(CHROMIUM_GLOB))
    if not hits:
        raise SystemExit("no playwright chromium found")
    return hits[-1]


def logo_data_uri() -> str:
    for p_str in _TOKENS["logo_paths"]:
        p = Path(p_str)
        if p.exists():
            return "data:image/png;base64," + base64.b64encode(p.read_bytes()).decode()
    return ""
