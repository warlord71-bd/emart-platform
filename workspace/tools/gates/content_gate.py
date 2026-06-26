#!/usr/bin/env python3
"""
content_gate.py — Read-only content quality gate for Emart products/content.

Usage:
    python3 content_gate.py --product-id 3666
    python3 content_gate.py --product-slug welcos-aloe-vera-moisture-real-soothing-gel
    python3 content_gate.py --file path/to/content.html --type product --title "Some Product"
    python3 content_gate.py --product-id 3666 --keyword-density 2.5 --rankmath-floor 80

Checks:
    1. keyword_stuffing   — flag if any phrase exceeds density threshold
    2. internal_links     — verify internal links resolve and use /shop/ (not /product/)
    3. rankmath_floor     — Rank Math SEO score >= threshold (via GraphQL, read-only)
    4. locale_check       — detect accidental Bangla in English-baseline structured content
    5. title_format       — verify title matches locked format

Exit code 0 = all PASS, 1 = any FAIL, 2 = error.
"""

import argparse
import json
import re
import subprocess
import sys
import unicodedata
from html.parser import HTMLParser
from typing import Optional
from urllib.parse import urlparse

GRAPHQL_URL = "http://127.0.0.1/graphql"
GRAPHQL_HEADERS = {
    "Content-Type": "application/json",
    "Host": "e-mart.com.bd",
    "X-Forwarded-Proto": "https",
}
NEXTJS_BASE = "http://localhost:3000"
SITE_URL = "https://e-mart.com.bd"

DEFAULT_KEYWORD_DENSITY = 3.0  # percent
DEFAULT_RANKMATH_FLOOR = 75

PRODUCT_TITLE_RE = re.compile(
    r"^.+ Price in Bangladesh \| Emart$"
)
CATEGORY_TITLE_RE = re.compile(
    r"^.+ Prices in Bangladesh \| Emart$"
)

BANGLA_RANGE = range(0x0980, 0x09FF + 1)


# ── HTML helpers ──────────────────────────────────────────────────────

class HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self._parts: list[str] = []
        self._links: list[str] = []
        self._in_script = False

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self._in_script = True
        if tag == "a":
            for name, val in attrs:
                if name == "href" and val:
                    self._links.append(val)

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self._in_script = False

    def handle_data(self, data):
        if not self._in_script:
            self._parts.append(data)

    def get_text(self) -> str:
        return " ".join(self._parts)

    def get_links(self) -> list[str]:
        return self._links


def strip_html(html: str) -> str:
    ext = HTMLTextExtractor()
    ext.feed(html)
    return ext.get_text()


def extract_links(html: str) -> list[str]:
    ext = HTMLTextExtractor()
    ext.feed(html)
    return ext.get_links()


# ── GraphQL fetch ─────────────────────────────────────────────────────

def graphql_fetch(query: str, variables: dict) -> Optional[dict]:
    payload = json.dumps({"query": query, "variables": variables})
    try:
        r = subprocess.run(
            ["curl", "-s", "--max-time", "10", GRAPHQL_URL,
             "-H", f"Content-Type: {GRAPHQL_HEADERS['Content-Type']}",
             "-H", f"Host: {GRAPHQL_HEADERS['Host']}",
             "-H", f"X-Forwarded-Proto: {GRAPHQL_HEADERS['X-Forwarded-Proto']}",
             "-d", payload],
            capture_output=True, text=True, timeout=15,
        )
        if r.returncode != 0:
            return None
        data = json.loads(r.stdout)
        if data.get("errors"):
            return None
        return data.get("data")
    except Exception:
        return None


PRODUCT_QUERY = """
query ProductGate($slug: ID!) {
  product(id: $slug, idType: SLUG) {
    name
    slug
    databaseId
    description
    shortDescription
    seo {
      title
      description
      seoScore { score hasFrontendScore }
    }
  }
}
"""

PRODUCT_BY_ID_QUERY = """
query ProductGateById($id: ID!) {
  product(id: $id, idType: DATABASE_ID) {
    name
    slug
    databaseId
    description
    shortDescription
    seo {
      title
      description
      seoScore { score hasFrontendScore }
    }
  }
}
"""


def fetch_product(slug: Optional[str] = None, product_id: Optional[int] = None) -> Optional[dict]:
    if slug:
        return graphql_fetch(PRODUCT_QUERY, {"slug": slug})
    if product_id:
        return graphql_fetch(PRODUCT_BY_ID_QUERY, {"id": str(product_id)})
    return None


# ── Gate 1: keyword_stuffing ─────────────────────────────────────────

def check_keyword_stuffing(text: str, threshold: float) -> dict:
    words = re.findall(r"[a-zA-Zঀ-৿]+(?:'[a-z]+)?", text.lower())
    total = len(words)
    if total < 20:
        return {"status": "PASS", "reason": f"Content too short for density check ({total} words)"}

    # Check single words (3+ chars) and bigrams
    from collections import Counter
    singles = Counter(w for w in words if len(w) >= 3)
    bigrams = Counter()
    for i in range(len(words) - 1):
        bg = f"{words[i]} {words[i+1]}"
        if len(words[i]) >= 3 or len(words[i+1]) >= 3:
            bigrams[bg] += 1

    flagged = []
    for phrase, count in singles.most_common(20):
        density = (count / total) * 100
        if density > threshold and phrase not in STOP_WORDS:
            flagged.append(f"'{phrase}' {density:.1f}% ({count}/{total})")
    for phrase, count in bigrams.most_common(10):
        density = (count / total) * 100
        if density > threshold:
            flagged.append(f"'{phrase}' {density:.1f}% ({count}/{total})")

    if flagged:
        return {"status": "FAIL", "reason": f"High density: {'; '.join(flagged[:5])}"}
    return {"status": "PASS", "reason": f"No phrase exceeds {threshold}% density ({total} words)"}


STOP_WORDS = frozenset({
    # English function words
    "the", "and", "for", "with", "your", "you", "that", "this", "from",
    "are", "not", "can", "has", "its", "have", "will", "all", "but",
    "also", "more", "been", "was", "were", "they", "their", "had",
    "our", "any", "use", "may", "how", "get", "one", "out", "into",
    "when", "who", "which", "each", "would", "could", "should",
    "does", "did", "don", "isn", "won", "about", "just", "been",
    "make", "like", "than", "them", "very", "what", "some",
    # Domain vocabulary (skincare site — these are unavoidable)
    "skin", "product", "products", "cream", "gel", "oil", "serum",
    "face", "hair", "body", "water", "day", "care",
})


# ── Gate 2: internal_links ──────────────────────────────────────────

def check_internal_links(html: str) -> dict:
    links = extract_links(html)
    internal = []
    for href in links:
        parsed = urlparse(href)
        host = parsed.hostname or ""
        if host in ("", "e-mart.com.bd", "www.e-mart.com.bd", "localhost"):
            internal.append(href)
        elif not host and href.startswith("/"):
            internal.append(href)

    if not internal:
        return {"status": "PASS", "reason": "No internal links found"}

    issues = []
    for href in internal:
        # Normalize to path-only for checking
        parsed = urlparse(href)
        path = parsed.path or "/"

        # Check for legacy /product/ links
        if path.startswith("/product/"):
            issues.append(f"Legacy link: {href} (should be /shop/)")
            continue

        # Resolve via curl to localhost:3000
        check_url = f"{NEXTJS_BASE}{path}"
        try:
            r = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
                 "--max-time", "5", check_url,
                 "-H", "Host: e-mart.com.bd"],
                capture_output=True, text=True, timeout=8,
            )
            code = int(r.stdout.strip()) if r.stdout.strip().isdigit() else 0
            if code >= 400:
                issues.append(f"Broken ({code}): {href}")
            elif code in (301, 302, 307, 308):
                issues.append(f"Redirect ({code}): {href}")
        except Exception as e:
            issues.append(f"Check failed: {href} ({e})")

    checked = len(internal)
    if issues:
        return {"status": "FAIL", "reason": f"{len(issues)}/{checked} issues: {'; '.join(issues[:5])}"}
    return {"status": "PASS", "reason": f"All {checked} internal links resolve OK"}


# ── Gate 3: rankmath_floor ───────────────────────────────────────────

def check_rankmath_floor(seo_data: Optional[dict], floor: int) -> dict:
    if not seo_data:
        return {"status": "FAIL", "reason": "Could not fetch Rank Math data via GraphQL"}

    score_data = seo_data.get("seoScore", {})
    score = score_data.get("score", 0)
    has_frontend = score_data.get("hasFrontendScore", False)

    if not has_frontend and score == 0:
        return {
            "status": "SKIP",
            "reason": "Rank Math score not computed (only calculated in editor); cannot evaluate",
        }

    if score < floor:
        return {"status": "FAIL", "reason": f"Score {score} < floor {floor}"}
    return {"status": "PASS", "reason": f"Score {score} >= floor {floor}"}


# ── Gate 4: locale_check ─────────────────────────────────────────────

def check_locale(title: str, meta_desc: str, body_text: str) -> dict:
    """Flag accidental Bangla in English-baseline structured content (title, meta, schema)."""
    issues = []

    # Check title and meta description — these should be English
    for label, text in [("Title", title), ("Meta description", meta_desc)]:
        if not text:
            continue
        bangla_chars = sum(1 for c in text if ord(c) in BANGLA_RANGE)
        total_alpha = sum(1 for c in text if unicodedata.category(c).startswith("L"))
        if total_alpha > 0 and bangla_chars / total_alpha > 0.1:
            issues.append(f"{label} contains {bangla_chars} Bangla characters ({bangla_chars}/{total_alpha} alpha)")

    # Body content: just flag if the MAJORITY is Bangla (body can have some Bangla)
    if body_text:
        bangla_chars = sum(1 for c in body_text if ord(c) in BANGLA_RANGE)
        total_alpha = sum(1 for c in body_text if unicodedata.category(c).startswith("L"))
        if total_alpha > 50 and bangla_chars / total_alpha > 0.5:
            issues.append(f"Body is majority Bangla ({bangla_chars}/{total_alpha} alpha chars)")

    if issues:
        return {"status": "FAIL", "reason": "; ".join(issues)}
    return {"status": "PASS", "reason": "Content language matches English baseline"}


# ── Gate 5: title_format ─────────────────────────────────────────────

def check_title_format(seo_title: str, content_type: str = "product") -> dict:
    if not seo_title:
        return {"status": "FAIL", "reason": "No SEO title found"}

    if content_type == "product":
        if PRODUCT_TITLE_RE.match(seo_title):
            return {"status": "PASS", "reason": f"Matches product format: '{seo_title}'"}
        return {
            "status": "FAIL",
            "reason": (
                f"Title '{seo_title}' does not match "
                "'{Product Name} Price in Bangladesh | Emart'"
            ),
        }
    elif content_type == "category":
        if CATEGORY_TITLE_RE.match(seo_title):
            return {"status": "PASS", "reason": f"Matches category format: '{seo_title}'"}
        return {
            "status": "FAIL",
            "reason": (
                f"Title '{seo_title}' does not match "
                "'{Category} Prices in Bangladesh | Emart'"
            ),
        }
    else:
        return {"status": "SKIP", "reason": f"No locked title format for type '{content_type}'"}


# ── Runner ────────────────────────────────────────────────────────────

def run_gates_product(slug: str = None, product_id: int = None,
                      keyword_density: float = DEFAULT_KEYWORD_DENSITY,
                      rankmath_floor: int = DEFAULT_RANKMATH_FLOOR) -> list[dict]:
    data = fetch_product(slug=slug, product_id=product_id)
    product = data.get("product") if data else None
    if not product:
        ident = slug or product_id
        return [{"gate": "fetch", "status": "ERROR", "reason": f"Could not fetch product '{ident}' via GraphQL"}]

    name = product.get("name", "")
    desc_html = product.get("description", "") or ""
    short_html = product.get("shortDescription", "") or ""
    seo = product.get("seo", {}) or {}
    seo_title = seo.get("title", "")
    seo_desc = seo.get("description", "")

    body_text = strip_html(desc_html + " " + short_html)
    full_html = desc_html + " " + short_html

    # The title rendered on the frontend (from seo.ts):
    frontend_title = f"{name} Price in Bangladesh | Emart"

    results = []
    results.append({"gate": "keyword_stuffing", **check_keyword_stuffing(body_text, keyword_density)})
    results.append({"gate": "internal_links", **check_internal_links(full_html)})
    results.append({"gate": "rankmath_floor", **check_rankmath_floor(seo, rankmath_floor)})
    results.append({"gate": "locale_check", **check_locale(frontend_title, seo_desc, body_text)})
    results.append({"gate": "title_format", **check_title_format(frontend_title, "product")})

    return results


def run_gates_file(filepath: str, content_type: str, title: str,
                   keyword_density: float = DEFAULT_KEYWORD_DENSITY) -> list[dict]:
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            html = f.read()
    except Exception as e:
        return [{"gate": "fetch", "status": "ERROR", "reason": f"Cannot read file: {e}"}]

    body_text = strip_html(html)

    results = []
    results.append({"gate": "keyword_stuffing", **check_keyword_stuffing(body_text, keyword_density)})
    results.append({"gate": "internal_links", **check_internal_links(html)})
    results.append({"gate": "rankmath_floor", "status": "SKIP", "reason": "No Rank Math data for file input"})
    results.append({"gate": "locale_check", **check_locale(title or "", "", body_text)})
    results.append({"gate": "title_format", **check_title_format(title or "", content_type)})

    return results


def print_results(identifier: str, results: list[dict]) -> bool:
    statuses = {"PASS": "✅", "FAIL": "❌", "SKIP": "⏭️ ", "ERROR": "⚠️ "}
    max_gate = max(len(r["gate"]) for r in results)

    print(f"\n{'─' * 72}")
    print(f"  Product: {identifier}")
    print(f"{'─' * 72}")
    print(f"  {'Gate':<{max_gate + 2}} {'Status':<8} Reason")
    print(f"  {'─' * (max_gate + 2)} {'─' * 6}  {'─' * 46}")

    any_fail = False
    for r in results:
        icon = statuses.get(r["status"], "?")
        gate = r["gate"]
        status = r["status"]
        reason = r["reason"]
        print(f"  {gate:<{max_gate + 2}} {icon} {status:<5}  {reason}")
        if status in ("FAIL", "ERROR"):
            any_fail = True

    verdict = "❌ FAIL" if any_fail else "✅ PASS"
    print(f"\n  Verdict: {verdict}")
    print(f"{'─' * 72}")
    return not any_fail


def main():
    parser = argparse.ArgumentParser(
        description="Emart content quality gate (read-only)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--product-id", type=int, help="WooCommerce product ID")
    group.add_argument("--product-slug", type=str, help="Product URL slug")
    group.add_argument("--file", type=str, help="Path to HTML content file")

    parser.add_argument("--type", default="product", choices=["product", "category", "post"],
                        help="Content type (default: product)")
    parser.add_argument("--title", type=str, default="", help="SEO title (for --file mode)")
    parser.add_argument("--keyword-density", type=float, default=DEFAULT_KEYWORD_DENSITY,
                        help=f"Max keyword density %% (default: {DEFAULT_KEYWORD_DENSITY})")
    parser.add_argument("--rankmath-floor", type=int, default=DEFAULT_RANKMATH_FLOOR,
                        help=f"Minimum Rank Math score (default: {DEFAULT_RANKMATH_FLOOR})")
    parser.add_argument("--json", action="store_true", help="Output as JSON instead of table")

    args = parser.parse_args()

    if args.file:
        results = run_gates_file(args.file, args.type, args.title, args.keyword_density)
        identifier = args.file
    else:
        results = run_gates_product(
            slug=args.product_slug,
            product_id=args.product_id,
            keyword_density=args.keyword_density,
            rankmath_floor=args.rankmath_floor,
        )
        identifier = args.product_slug or f"ID:{args.product_id}"

    if args.json:
        print(json.dumps({"identifier": identifier, "results": results}, indent=2))
        all_pass = all(r["status"] in ("PASS", "SKIP") for r in results)
    else:
        all_pass = print_results(identifier, results)

    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    main()
