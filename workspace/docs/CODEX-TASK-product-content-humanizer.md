# CODEX TASK: Product Content Humanizer — Full Catalog Enrichment

**Priority:** CRITICAL — organic traffic protection  
**Status:** READY TO RUN  
**Date written:** 2026-05-31  
**Safety level:** CSV review before any DB write. Full rollback JSON generated first.

---

## 0. Context — why this task exists

Google's Helpful Content system is penalizing this site for **mass-produced, template-identical product descriptions**. This is confirmed by DB audit:

- Hundreds of products (Kerasys batch, others) share word-for-word boilerplate descriptions
- 818 products contain subtle LLM-style language ("innovative formula", "transform your", "skin barrier function" used generically)
- Product descriptions do not differentiate between product variants in the same line
- Content does not reflect the specific ingredient, concern, or use case for each individual product

Google does not care whether a human or AI wrote the content. It penalizes content that:
1. Reads the same across multiple pages (template signal)
2. Adds no value a user couldn't get from the product title alone
3. Has no local/contextual anchoring
4. Lacks product-specific detail

This task fixes all four problems across the full product catalog.

---

## 1. Database access

```
Host:         localhost
DB name:      emart_live
User:         emart_user
Password:     $EMART_DB_PASSWORD  ← environment variable, never hardcoded
Table prefix: wp4h_
```

Python connection:
```python
import os, mysql.connector
conn = mysql.connector.connect(
    host='localhost', database='emart_live',
    user='emart_user',
    password=os.environ['EMART_DB_PASSWORD']   # set via export before running
)
```

---

## 2. Data available per product

For each published product in `wp4h_posts` (post_type='product', post_status='publish'), the following data is available in `wp4h_postmeta` and `wp4h_term_relationships`:

| Source | Field | Description |
|--------|-------|-------------|
| `wp4h_posts.post_title` | Title | Full product name with size |
| `wp4h_posts.post_content` | Current description | HTML — may be thin/template |
| `wp4h_postmeta._emart_ingredients` | Ingredients | HTML `<ul>` list of ingredients with descriptions |
| `wp4h_postmeta._emart_how_to_use` | Usage | HTML `<ol>` steps |
| `wp4h_postmeta._rank_math_description` | Meta description | Current SEO meta (max 160 chars) |
| `wp4h_postmeta._rank_math_focus_keyword` | Focus keyword | Primary keyword for this product |
| `wp4h_postmeta._regular_price` | Regular price | Numeric, BDT |
| `wp4h_postmeta._price` | Current price | Numeric, BDT |
| `wp4h_postmeta._sku` | SKU | e.g. EM-93028 |
| `wp4h_postmeta._stock_status` | Stock | 'instock' or 'outofstock' |
| `wp4h_postmeta.total_sales` | Sales count | Integer |
| Taxonomy `pa_brand` | Brand | e.g. "CosRx", "Kerasys", "CeraVe" |
| Taxonomy `pa_origin` | Country of origin | e.g. "South Korea", "USA", "Bangladesh" |
| Taxonomy `pa_concern` | Skin/hair concern(s) | e.g. "Dryness & Hydration", "Anti-Aging & Repair" |
| Taxonomy `product_cat` | Category | e.g. "Korean Beauty", "Serums, Ampoules & Essences" |

Query to pull all data for one product:
```sql
SELECT
  p.ID,
  p.post_title,
  p.post_name   AS slug,          -- ← required for GSC path /shop/{slug}
  p.post_content,
  p.post_modified,                -- ← required for cache-busting UPDATE
  MAX(CASE WHEN pm.meta_key = '_emart_ingredients'       THEN pm.meta_value END) as ingredients,
  MAX(CASE WHEN pm.meta_key = '_emart_how_to_use'        THEN pm.meta_value END) as how_to_use,
  MAX(CASE WHEN pm.meta_key = '_emart_product_faq'       THEN pm.meta_value END) as faq_raw,
  MAX(CASE WHEN pm.meta_key = '_rank_math_description'   THEN pm.meta_value END) as meta_desc,
  MAX(CASE WHEN pm.meta_key = '_rank_math_focus_keyword' THEN pm.meta_value END) as focus_keyword,
  MAX(CASE WHEN pm.meta_key = '_regular_price'           THEN pm.meta_value END) as regular_price,
  MAX(CASE WHEN pm.meta_key = '_price'                   THEN pm.meta_value END) as price,
  MAX(CASE WHEN pm.meta_key = '_sku'                     THEN pm.meta_value END) as sku,
  MAX(CASE WHEN pm.meta_key = '_stock_status'            THEN pm.meta_value END) as stock_status,
  MAX(CASE WHEN pm.meta_key = 'total_sales'              THEN pm.meta_value END) as total_sales
FROM wp4h_posts p
JOIN wp4h_postmeta pm ON pm.post_id = p.ID
WHERE p.post_type = 'product' AND p.post_status = 'publish'
GROUP BY p.ID, p.post_title, p.post_name, p.post_content, p.post_modified;
```

After pulling, immediately normalize every product dict (fixes field-name mismatches,
`id`/`ID`/`post_id` inconsistency, and computes plain-text for extraction):

```python
from bs4 import BeautifulSoup

def normalize_product_dict(row: dict) -> dict:
    """
    Canonical post-fetch normalization. Call once per row, right after DB pull.
    Fixes:
      - id/ID/post_id inconsistency → always 'post_id'
      - DB column aliases (ingredients, how_to_use) → prompt field names
      - Computes post_content_plain for extract_reusable_content()
      - Checks _emart_humanized timestamp for re-run guard
      - Flags high-sales skip
    """
    d = dict(row)

    # Normalize ID (SQL returns 'ID' uppercase; some dicts use 'id' or 'post_id')
    d['post_id'] = int(d.get('ID') or d.get('id') or d.get('post_id') or 0)
    d.pop('ID', None)
    d.pop('id', None)

    # Remap DB column aliases to field names used in build_user_prompt
    d['ingredients_html'] = d.pop('ingredients', None) or ''
    d['how_to_use_html']  = d.pop('how_to_use',  None) or ''
    # faq_raw keeps its name — already correct

    # Slug fallback
    d['slug'] = (d.get('slug') or d.get('post_name') or '').strip()

    # Plain-text version for extract_reusable_content and keyword gap detection
    d['post_content_plain'] = BeautifulSoup(
        d.get('post_content') or '', 'html.parser'
    ).get_text(separator=' ', strip=True)

    # Re-run guard: skip if _emart_humanized meta was written within last 30 days
    from datetime import datetime, timedelta
    humanized_ts = d.get('humanized_at')  # populated by a separate meta pull if needed
    if humanized_ts:
        try:
            ts = datetime.fromisoformat(str(humanized_ts))
            d['already_humanized'] = (datetime.utcnow() - ts) < timedelta(days=30)
        except ValueError:
            d['already_humanized'] = False
    else:
        d['already_humanized'] = False

    # High-sales skip flag
    d['skip_auto'] = int(d.get('total_sales') or 0) > 20

    return d

# Apply immediately after DB fetch:
products = [normalize_product_dict(row) for row in cursor.fetchall()]
```

Query to pull taxonomy terms for a product:
```sql
SELECT t.name, tt.taxonomy
FROM wp4h_terms t
JOIN wp4h_term_taxonomy tt ON tt.term_id = t.term_id
JOIN wp4h_term_relationships tr ON tr.term_taxonomy_id = tt.term_taxonomy_id
WHERE tr.object_id = {product_id}
  AND tt.taxonomy IN ('pa_brand','pa_origin','pa_concern','product_cat');
```

---

## 2.5 Skinnora scrape pipeline — competitor research source

Skinnora (skinnora.com) sells many of the same Korean and international beauty products as Emart. Their product descriptions are written to a higher standard than Emart's current content — structured, ingredient-specific, with Key Benefits in the correct format.

**Use Skinnora as a research reference only.** The generated output for Emart must be substantially original — not a paraphrase. Think of it as a human copywriter reading the competitor page before writing their own version. Emart's output must add things Skinnora's page doesn't have: Bangladesh climate context, variant differentiation, "who should avoid" signal, and Emart authenticity/import framing.

### 2.5.1 Robots and rate limiting — check first

```python
import requests, time
from urllib.robotparser import RobotFileParser

def check_robots():
    rp = RobotFileParser()
    rp.set_url("https://www.skinnora.com/robots.txt")
    rp.read()
    return rp.can_fetch("*", "https://www.skinnora.com/product/sample/")

# Only proceed if robots.txt allows crawling product pages
# Rate limit: 1 request every 3 seconds — do not hammer their server
CRAWL_DELAY = 3
```

If robots.txt disallows product crawling, skip the Skinnora phase entirely and fall back to Section 7 (DeepSeek with Emart product DNA only) for all products.

### 2.5.2 Discover Skinnora product URLs

```python
import requests
from bs4 import BeautifulSoup

def get_skinnora_sitemap_urls() -> list[str]:
    """Pull all product URLs from Skinnora's sitemap."""
    sitemap_index = requests.get("https://www.skinnora.com/sitemap.xml", timeout=15).text
    soup = BeautifulSoup(sitemap_index, "xml")

    product_urls = []
    for loc in soup.find_all("loc"):
        url = loc.text.strip()
        # Try product sitemap first
        if "product" in url and url.endswith(".xml"):
            sub = requests.get(url, timeout=15).text
            sub_soup = BeautifulSoup(sub, "xml")
            for sub_loc in sub_soup.find_all("loc"):
                u = sub_loc.text.strip()
                if "/product/" in u:
                    product_urls.append(u)
        elif "/product/" in url:
            product_urls.append(url)

    return list(set(product_urls))
```

Fallback if sitemap lacks product URLs: crawl `/shop/` page with pagination (`?page=1`, `?page=2`, ...) and collect all `/product/` hrefs.

### 2.5.3 Scrape each product page

Four targets only. Everything else is ignored.

| Target | Source on page | Maps to Emart field |
|--------|---------------|---------------------|
| Product title | `<h1>` | Matching only |
| Description tab | `#tab-description` | Research reference for `post_content` generation |
| Ingredients tab | `#tab-ingredients` | Written directly to `_emart_ingredients` |
| Disclaimer block | Patch test / shelf life / packaging text | Appended as disclaimer block at end of `post_content` |

**Scrape targets (updated — FAQ and pairing ARE scraped, table below corrected):**

| Target | Source on page | Maps to Emart field |
|--------|---------------|---------------------|
| Product title | `<h1>` | Matching only |
| Description tab | `#tab-description` | Research reference for `post_content` generation |
| Ingredients tab | `#tab-ingredients` | Written to `_emart_ingredients` if richer |
| FAQ tab | `#tab-faq` | Written to `_emart_product_faq` if quality poor/empty |
| Pairing sentences | Description paragraph keywords | Compatibility-checked, embedded in body |
| Disclaimer block | Patch test / shelf life / packaging text | Appended as `<aside>` at end of `post_content` |

**Do NOT scrape:** Routine Builder, Related Products, Reviews, stock/price data.

```python
from bs4 import BeautifulSoup
import re

def scrape_skinnora_product(url: str) -> dict | None:
    """
    Scrapes four targets from a Skinnora product page.
    Returns structured dict or None on failure.
    """
    try:
        resp = requests.get(url, timeout=15, headers={
            "User-Agent": "Mozilla/5.0 (compatible; research-bot/1.0)"
        })
        if resp.status_code != 200:
            return None
        soup = BeautifulSoup(resp.text, "html.parser")

        # 1. Product title (for catalog matching)
        title_el = soup.find("h1", class_=re.compile(r"product.?title|entry-title", re.I))
        title = title_el.get_text(strip=True) if title_el else ""

        # 2. Description tab — body paragraphs + Key Benefits bullets
        desc_tab = (
            soup.find("div", id="tab-description")
            or soup.find("div", class_=re.compile(r"woocommerce-Tabs-panel--description", re.I))
            or soup.find("div", class_=re.compile(r"tab-description", re.I))
        )
        description_plain = ""
        benefits = []
        if desc_tab:
            # Plain text of all paragraphs
            for p in desc_tab.find_all("p"):
                text = p.get_text(strip=True)
                if text:
                    description_plain += text + " "
            description_plain = description_plain.strip()

            # Key Benefits bullets (label — mechanism format we want)
            for li in desc_tab.select("ul li"):
                text = li.get_text(strip=True)
                if text and len(text) > 15:
                    benefits.append(text)

        # 3. Ingredients tab — full text, preserve structure
        ing_tab = (
            soup.find("div", id="tab-ingredients")
            or soup.find("div", id=re.compile(r"ingredients", re.I))
            or soup.find("div", class_=re.compile(r"woocommerce-Tabs-panel--ingredients", re.I))
        )
        ingredients_raw = ""
        if ing_tab:
            # Get all text preserving line breaks between items
            ingredients_raw = ing_tab.get_text(separator="\n", strip=True)
            # Remove tab label if repeated at top (e.g. "Ingredients\nAqua, ...")
            lines = [l.strip() for l in ingredients_raw.splitlines() if l.strip()]
            if lines and lines[0].lower() in ("ingredients", "ingredient list", "full ingredient list"):
                lines = lines[1:]
            ingredients_raw = "\n".join(lines)

        # 4. FAQ tab — Q&A pairs for quality comparison and copy-if-poor logic
        faq_items = []
        faq_tab = (
            soup.find("div", id="tab-faq")
            or soup.find("div", id=re.compile(r"faq", re.I))
            or soup.find("div", class_=re.compile(r"woocommerce-Tabs-panel--faq", re.I))
        )
        if faq_tab:
            # Try accordion/details pattern first
            for item in faq_tab.select(".faq-item, .accordion-item, details, .elementor-toggle-item"):
                q_el = item.find(["summary", "h3", "h4", "strong", "dt",
                                  ".faq-question", ".accordion-title", ".elementor-tab-title"])
                a_el = item.find(["p", "dd", ".faq-answer", ".accordion-content",
                                  ".elementor-tab-content"])
                if q_el and a_el:
                    q = q_el.get_text(strip=True)
                    a = a_el.get_text(strip=True)
                    if q and a and len(a) > 20:
                        faq_items.append({"q": q, "a": a})
            # Fallback: paired dt/dd
            if not faq_items:
                dts = faq_tab.find_all("dt")
                dds = faq_tab.find_all("dd")
                for q_el, a_el in zip(dts, dds):
                    q = q_el.get_text(strip=True)
                    a = a_el.get_text(strip=True)
                    if q and a and len(a) > 20:
                        faq_items.append({"q": q, "a": a})

        # 5. Pairing suggestions — scan description for safe-pairing sentences only
        # These are passed to the compatibility check before being used in generation.
        pairing_candidates = []
        for p in desc_tab.find_all("p") if desc_tab else []:
            text = p.get_text(strip=True)
            if any(w in text.lower() for w in
                   ["pair", "combine", "use with", "layer", "follow with",
                    "works well with", "best with", "apply after", "apply before"]):
                if len(text) > 20:
                    pairing_candidates.append(text)

        # 6. Disclaimer block — patch test warning, shelf life, packaging
        disclaimer_parts = []
        for sel in [".product-disclaimer", ".disclaimer", ".notice", ".patch-test",
                    "[class*='disclaimer']", "[class*='notice']", "[class*='warning']"]:
            el = soup.select_one(sel)
            if el:
                text = el.get_text(strip=True)
                if text and len(text) > 20:
                    disclaimer_parts.append(text)

        disclaimer_keywords = [
            "patch test", "patch-test", "shelf life", "expir", "best before",
            "store in", "keep away from", "packaging", "recyclable", "airless",
            "pump bottle", "tube", "jar", "before use", "consult a dermatologist",
            "period after opening", "pao", "manufacture"
        ]
        for tag in soup.find_all(["p", "small", "span", "li"]):
            text = tag.get_text(strip=True)
            if any(kw in text.lower() for kw in disclaimer_keywords) and len(text) > 15:
                if text not in disclaimer_parts:
                    disclaimer_parts.append(text)

        seen = set()
        unique_disclaimer = []
        for part in disclaimer_parts:
            key = part[:60].lower()
            if key not in seen:
                seen.add(key)
                unique_disclaimer.append(part)
        disclaimer_text = " ".join(unique_disclaimer).strip()

        return {
            "url": url,
            "title": title,
            "description_plain": description_plain,
            "benefits": benefits,
            "ingredients_raw": ingredients_raw,       # → _emart_ingredients (if richer)
            "faq_items": faq_items,                   # → _emart_product_faq (if Emart's is poor)
            "pairing_candidates": pairing_candidates, # → compatibility-checked before use
            "disclaimer_text": disclaimer_text,       # → disclaimer block at end of post_content
        }
    except Exception as e:
        print(f"  Scrape failed for {url}: {e}")
        return None
```

### 2.5.4 Match Skinnora products to Emart catalog

Match by normalized product title using fuzzy string matching. A match is valid when similarity ≥ 80% on the normalized title.

```python
from rapidfuzz import fuzz, process

def normalize_title(title: str) -> str:
    """Lowercase, strip size/volume, strip brand if duplicated, strip punctuation."""
    t = title.lower()
    t = re.sub(r'\d+\s*(ml|g|oz|fl oz|pcs|piece|pack|count|mg|l)\b', '', t)
    t = re.sub(r'[^\w\s]', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def match_skinnora_to_emart(
    skinnora_products: list[dict],
    emart_products: list[dict]   # [{id, title, brand, ...}]
) -> list[dict]:
    """
    Returns list of matches:
    [{emart_id, emart_title, skinnora_url, skinnora_title, match_score, skinnora_data}]
    """
    emart_normalized = {p['id']: normalize_title(p['title']) for p in emart_products}
    emart_lookup = {normalize_title(p['title']): p for p in emart_products}

    matches = []
    for s_prod in skinnora_products:
        s_norm = normalize_title(s_prod['title'])
        result = process.extractOne(
            s_norm,
            list(emart_lookup.keys()),
            scorer=fuzz.token_sort_ratio,
            score_cutoff=80
        )
        if result:
            matched_key, score, _ = result
            emart_prod = emart_lookup[matched_key]
            matches.append({
                "emart_id": emart_prod['id'],
                "emart_title": emart_prod['title'],
                "skinnora_url": s_prod['url'],
                "skinnora_title": s_prod['title'],
                "match_score": score,
                "skinnora_data": s_prod,
            })

    return matches
```

Save match results to: `workspace/audit/active/skinnora-catalog-matches-YYYYMMDD.csv`

Columns:
```
emart_id, emart_title, skinnora_url, skinnora_title, match_score
```

Review this CSV before proceeding — verify that high-scoring matches are genuine product matches, not different products with similar names (e.g., "COSRX Salicylic Acid Toner 150ml" vs "COSRX Salicylic Acid Toner 100ml" — same product, different size, should still match for content reference purposes).

### 2.5.5 Scrape run instructions

```python
# Full scrape run
product_urls = get_skinnora_sitemap_urls()
print(f"Found {len(product_urls)} product URLs on Skinnora")

skinnora_data = []
for i, url in enumerate(product_urls):
    print(f"  [{i+1}/{len(product_urls)}] {url}")
    data = scrape_skinnora_product(url)
    if data and data['title']:
        skinnora_data.append(data)
    time.sleep(CRAWL_DELAY)

# Save raw scrape
import json
with open("workspace/audit/active/skinnora-scrape-raw-YYYYMMDD.json", "w") as f:
    json.dump(skinnora_data, f, ensure_ascii=False, indent=2)

print(f"Scraped {len(skinnora_data)} products successfully")
```

Install required libs first:
```bash
pip install requests beautifulsoup4 lxml rapidfuzz
```

### 2.5.6 How scraped data maps to Emart fields

No new tabs. No frontend changes. All data goes into existing WooCommerce meta fields.

| Scraped field | Written to Emart field | Notes |
|---------------|----------------------|-------|
| `ingredients_raw` | `_emart_ingredients` | Formatted as HTML `<ul>` — replaces existing if richer; skipped if Emart already has detailed data |
| `description_plain` + `benefits` | Reference only for `post_content` generation | Not copied verbatim — used as research by DeepSeek |
| `faq_items` | `_emart_product_faq` | Copied only if Emart's current FAQ is poor — see quality check below |
| `pairing_candidates` | Embedded inside `post_content` second paragraph | Only if passes ingredient compatibility check — see pairing logic below |
| `disclaimer_text` | Appended as disclaimer block inside `post_content` | See format below |

#### Ingredients field format

Convert Skinnora's raw ingredient text into a clean HTML list for `_emart_ingredients`:

```python
def format_ingredients_html(raw: str) -> str:
    """
    Convert raw ingredient text to HTML ul list for _emart_ingredients.
    Input may be comma-separated INCI list or newline-separated items.
    """
    if not raw:
        return ""
    # If it looks like a comma-separated INCI list (e.g. "Aqua, Glycerin, Niacinamide...")
    if raw.count(",") > raw.count("\n"):
        items = [i.strip() for i in raw.split(",") if i.strip()]
    else:
        items = [i.strip() for i in raw.splitlines() if i.strip()]

    if not items:
        return ""
    li_items = "\n".join(f"<li>{item}</li>" for item in items)
    return f"<ul>\n{li_items}\n</ul>"
```

Only write to `_emart_ingredients` if:
- Skinnora's ingredient list has more items than Emart's current value, OR
- Emart's current `_emart_ingredients` is empty

Never overwrite a richer existing Emart ingredients list with a shorter scraped one.

#### Disclaimer block format — appended at end of `post_content`

This is a single `<div>` block added at the very end of the generated description HTML. It does not require any frontend changes — it renders inside the existing description tab.

```html
<div class="product-disclaimer">
  <p><strong>Before Use:</strong> Patch test recommended — apply a small amount to your inner wrist or behind the ear and wait 24 hours before full use, especially if you have sensitive or reactive skin.</p>
  <p><strong>Shelf Life &amp; Storage:</strong> {shelf_life_text}. Store in a cool, dry place away from direct sunlight. Keep out of reach of children.</p>
  <p><strong>Packaging:</strong> {packaging_text}. Expiry date printed on {packaging_location}.</p>
</div>
```

Populate `{shelf_life_text}`, `{packaging_text}`, `{packaging_location}` from the scraped `disclaimer_text`. Parse with simple keyword matching:

```python
def parse_disclaimer(disclaimer_text: str, product: dict) -> dict:
    """
    Extract structured disclaimer fields from raw scraped text.
    Falls back to safe defaults when scraped data is missing.
    """
    d = disclaimer_text.lower()

    # Shelf life
    shelf_life = "36 months from manufacture date (check batch code on packaging)"
    for pattern in [r"shelf life[:\s]+([^.]+)", r"best before[:\s]+([^.]+)",
                    r"(\d+)\s*months?\s*(from manufacture|shelf)", r"use within ([^.]+)"]:
        m = re.search(pattern, d)
        if m:
            shelf_life = m.group(1).strip().capitalize()
            break

    # Packaging type
    packaging = "See product packaging for details"
    for kw in ["pump bottle", "airless pump", "tube", "jar", "dropper", "spray bottle",
                "squeeze tube", "tub", "sachet", "ampoule"]:
        if kw in d:
            packaging = kw.capitalize()
            break

    # Where expiry is printed
    packaging_location = "the bottom or side of the packaging"
    if "bottom" in d:
        packaging_location = "the bottom of the packaging"
    elif "crimp" in d or "tube" in d:
        packaging_location = "the crimp of the tube"
    elif "box" in d or "carton" in d:
        packaging_location = "the box"

    return {
        "shelf_life_text": shelf_life,
        "packaging_text": packaging,
        "packaging_location": packaging_location,
    }


def build_disclaimer_html(disclaimer_text: str, product: dict) -> str:
    """
    Build the disclaimer block appended by the apply step — NOT by DeepSeek.
    Single owner: apply step always appends this; DeepSeek never writes it.
    Uses <aside> (semantic) not <div class="product-disclaimer">.
    """
    if not disclaimer_text:
        return (
            '<aside class="product-disclaimer">\n'
            '<p><strong>Before Use:</strong> Patch test recommended — apply a small '
            'amount to your inner wrist and wait 24 hours before full use, especially '
            'for sensitive skin.</p>\n'
            '<p><strong>Storage:</strong> Store in a cool, dry place away from direct '
            'sunlight. Keep out of reach of children. Check expiry date on packaging.</p>\n'
            '</aside>'
        )

    fields = parse_disclaimer(disclaimer_text, product)
    return (
        '<aside class="product-disclaimer">\n'
        '<p><strong>Before Use:</strong> Patch test recommended — apply a small amount '
        'to your inner wrist or behind the ear and wait 24 hours before full use, '
        'especially if you have sensitive or reactive skin.</p>\n'
        f'<p><strong>Shelf Life &amp; Storage:</strong> {fields["shelf_life_text"]}. '
        'Store in a cool, dry place away from direct sunlight. '
        'Keep out of reach of children.</p>\n'
        f'<p><strong>Packaging:</strong> {fields["packaging_text"]}. '
        f'Expiry date printed on {fields["packaging_location"]}.</p>\n'
        '</aside>'
    )
```

**Every product gets a disclaimer block** — matched (Path A) or unmatched (Path B). Unmatched products get the safe default version. This is consistent across the catalog and adds genuine trust signal to every PDP.

#### FAQ field — copy-if-poor logic

Check Emart's current `_emart_product_faq` quality before deciding whether to use Skinnora's FAQ.

```python
FAQ_GENERIC_SIGNALS = [
    "cash on delivery", "cod available", "delivery time", "shipping",
    "return policy", "how to order", "payment method", "bkash", "nagad",
    "where do you deliver", "free shipping"
]

# NOTE: score_emart_faq_quality() with JSON parsing has been removed.
# Confirmed: _emart_product_faq is plain text Q:/A: format, not JSON.
# The correct implementation is below (plain-text version only).

def score_emart_faq_quality(faq_raw: str) -> str:
    """
    Returns 'good', 'poor', or 'empty'.
    Field format: plain text Q:/A: pairs — NOT JSON.
    Verify with: SELECT meta_value FROM wp4h_postmeta
                 WHERE meta_key='_emart_product_faq' LIMIT 1;
    """
    if not faq_raw or len(faq_raw.strip()) < 50:
        return "empty"

    questions    = re.findall(r'^Q:', faq_raw, re.MULTILINE)
    answers      = re.findall(r'^A:', faq_raw, re.MULTILINE)
    if len(questions) < 2 or len(answers) < 2:
        return "poor"

    faq_lower    = faq_raw.lower()
    generic_count = sum(1 for sig in FAQ_GENERIC_SIGNALS if sig in faq_lower)
    answer_blocks = re.findall(r'A:\s*(.+?)(?=\nQ:|\Z)', faq_raw, re.DOTALL)
    deep_answers  = sum(1 for a in answer_blocks if len(a.split()) >= 30)

    if deep_answers >= 3 and generic_count == 0:
        return "good"
    return "poor"
```

When FAQ quality is `poor` or `empty` and Skinnora has FAQ items:

1. Filter out any Skinnora FAQ questions about delivery, payment, returns, or shipping
2. Rewrite remaining Q&As in Emart's voice — do not copy verbatim
3. Add Bangladesh context where natural
4. Output format is plain text `Q:/A:` — field is NOT JSON:

```python
def rewrite_faq_for_emart(faq_items: list[dict], product: dict, client) -> str:
    """
    Takes Skinnora FAQ items, filters delivery/payment questions,
    rewrites remaining in Emart's voice with Bangladesh context.

    IMPORTANT: Emart's _emart_product_faq field is plain text format:
      Q: Question text?
      A: Answer text.
      Q: Next question?
      A: Next answer.
    NOT JSON. Match this format exactly.
    Minimum answer length: 40 words (E-E-A-T expertise signal).
    """
    delivery_signals = [
        "delivery", "shipping", "return", "refund", "payment", "cash on delivery",
        "cod", "bkash", "order", "track", "dispatch", "courier"
    ]
    product_faqs = [
        item for item in faq_items
        if not any(sig in (item.get("q") or "").lower() for sig in delivery_signals)
    ]

    if not product_faqs:
        return ""

    faq_text = "\n".join(
        f"Q: {item['q']}\nA: {item['a']}" for item in product_faqs[:5]
    )

    prompt = f"""Rewrite these FAQ items for {product['title']} sold at Emart Skincare Bangladesh.

Rules:
- Rewrite each question and answer in completely original words — do not copy verbatim
- Each answer must be minimum 40 words — demonstrate genuine ingredient/usage expertise
- Include one answer with Bangladesh climate context (humidity, Dhaka skin concerns)
- One answer must include "avoid if" or "not suitable for" guidance with mechanism explanation
- Do NOT include delivery, payment, returns, COD, shipping, or order questions
- Maximum 5 Q&A pairs

Output format — plain text only, exactly this structure:
Q: [question]
A: [answer — minimum 40 words]
Q: [question]
A: [answer — minimum 40 words]

No JSON. No markdown. No numbering. Just Q: and A: pairs separated by blank lines.

Source FAQ to rewrite:
{faq_text}"""

    response = client.chat.completions.create(
        model="deepseek-v4-flash",   # pinned — deepseek-chat alias retires 2026-07-24
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
        temperature=0.5
        # No response_format json_object — plain text output
    )
    raw = response.choices[0].message.content.strip()

    # Validate: must contain at least one Q: and A: pair
    if "Q:" not in raw or "A:" not in raw:
        return ""

    # Ensure answers meet minimum word count — flag short ones
    pairs = re.split(r'\n(?=Q:)', raw)
    valid_pairs = []
    for pair in pairs:
        a_match = re.search(r'A:\s*(.+)', pair, re.DOTALL)
        if a_match:
            answer_words = len(a_match.group(1).split())
            if answer_words >= 25:   # soft minimum — flag but keep if ≥25
                valid_pairs.append(pair.strip())

    return "\n\n".join(valid_pairs) if valid_pairs else ""


def score_emart_faq_quality(faq_raw: str) -> str:
    """
    Returns 'good', 'poor', or 'empty'.
    Emart FAQ format: plain text Q:/A: pairs (NOT JSON).
    """
    if not faq_raw or len(faq_raw.strip()) < 50:
        return "empty"

    # Count Q/A pairs
    questions = re.findall(r'^Q:', faq_raw, re.MULTILINE)
    answers = re.findall(r'^A:', faq_raw, re.MULTILINE)
    if len(questions) < 2 or len(answers) < 2:
        return "poor"

    # Check for generic delivery/payment questions
    delivery_signals = [
        "cash on delivery", "cod available", "delivery time", "shipping",
        "return policy", "how to order", "payment method", "bkash", "nagad"
    ]
    faq_lower = faq_raw.lower()
    generic_count = sum(1 for sig in delivery_signals if sig in faq_lower)

    # Check answer depth — count answers with 40+ words
    answer_blocks = re.findall(r'A:\s*(.+?)(?=\nQ:|\Z)', faq_raw, re.DOTALL)
    deep_answers = sum(1 for a in answer_blocks if len(a.split()) >= 30)

    if deep_answers >= 3 and generic_count == 0:
        return "good"
    if deep_answers >= 1:
        return "poor"
    return "poor"
```

#### Pairing suggestions — compatibility-check before embedding in description

```python
# Full incompatibility map (mirrors Section 4.10 table)
INCOMPATIBLE_PAIRS = [
    ({"vitamin c", "ascorbic acid", "ascorbyl", "l-ascorbic"},
     {"aha", "glycolic", "lactic", "mandelic", "bha", "salicylic", "pha",
      "gluconolactone", "lactobionic"}),
    ({"retinol", "retinaldehyde", "tretinoin", "retinoid"},
     {"glycolic", "lactic", "mandelic", "salicylic", "aha", "bha",
      "vitamin c", "ascorbic acid"}),
    ({"benzoyl peroxide"},
     {"retinol", "retinaldehyde", "tretinoin", "vitamin c", "ascorbic acid"}),
    ({"copper peptide", "copper tripeptide"},
     {"vitamin c", "ascorbic acid", "glycolic", "lactic", "salicylic",
      "aha", "bha", "pha"}),
]

def get_product_active_ingredients(product: dict) -> set[str]:
    """Extract active ingredient keywords from product title + ingredients HTML."""
    text = (
        (product.get("title") or "") + " " +
        (product.get("ingredients_html") or "")
    ).lower()
    return set(text.split())

def is_pairing_safe(pairing_text: str, product_ingredients: set[str]) -> bool:
    """
    Returns True if the pairing sentence doesn't suggest an incompatible ingredient
    combination with the current product's active ingredients.
    """
    pairing_lower = pairing_text.lower()
    for product_group, incompatible_group in INCOMPATIBLE_PAIRS:
        # Check if current product contains something from product_group
        product_has = any(
            any(kw in ing for ing in product_ingredients)
            for kw in product_group
        )
        if not product_has:
            continue
        # Check if the pairing sentence mentions something from incompatible_group
        pairing_mentions_incompatible = any(kw in pairing_lower for kw in incompatible_group)
        if pairing_mentions_incompatible:
            return False   # Incompatible — do not use this pairing
    return True


def get_safe_pairing_reference(
    pairing_candidates: list[str],
    product_ingredients: set[str]
) -> str | None:
    """
    Returns the first safe pairing sentence, or None if all are incompatible.
    """
    for candidate in pairing_candidates:
        if is_pairing_safe(candidate, product_ingredients):
            return candidate
    return None   # All candidates failed compatibility — DeepSeek uses safe default
```

Pass the result to `build_user_prompt()`:

```python
safe_pairing_ref = get_safe_pairing_reference(
    skinnora_data.get("pairing_candidates", []),
    get_product_active_ingredients(product)
)
# safe_pairing_ref is passed into the prompt as:
# "Safe pairing reference (from competitor research — rewrite naturally):
#  {safe_pairing_ref}"
# OR omitted entirely if None, letting the humanizer rules pick a safe default
```

DeepSeek embeds the pairing as a natural sentence in the second body paragraph — not a bullet, not a closing line. If `safe_pairing_ref` is `None`, DeepSeek falls back to the safe default list (ceramide moisturiser, hyaluronic acid, SPF) per Section 4.10.

### 2.5.7 What NOT to take from Skinnora

- Do NOT copy any description sentence verbatim
- Do NOT scrape or use their Routine Builder or Related Products tabs
- Do NOT use their prices, sales count, or stock status
- Do NOT use their specific batch expiry date — Emart has different stock; use general shelf life only
- Do NOT use Skinnora FAQ questions about delivery, shipping, payment, returns, or COD
- Skinnora has NO Bangladesh context — Emart's output adds this entirely from scratch

---

## 3. Content quality scoring — what is "thin" or "template"

Score each product on these criteria. Flag products scoring 2+ for enrichment.

| Signal | Score +1 when... |
|--------|-----------------|
| Thin content | Stripped plain text < 300 characters |
| Template prefix | Description starts with same 60 chars as 3+ other products |
| No variant differentiation | Product variant keyword (e.g. "argan oil", "propolis", "vitamin C") NOT mentioned in description |
| No ingredient mention | Description has no ingredient names from `_emart_ingredients` |
| No Bangladesh context | Neither "Bangladesh", "Dhaka", "BD", "COD", "import" mentioned |
| Generic how-to-use | How-to-use section says only "Apply. Rinse." or fewer than 30 words |
| No concern reference | No `pa_concern` term appears in description |

Store scores per product in a local CSV: `workspace/audit/active/content-humanizer-scores-YYYYMMDD.csv`

Columns:
```
post_id, post_title, content_score, thin, template, no_variant, no_ingredient, no_bd_context, needs_enrichment
```

---

## 4. The Humanizer Pattern — writing rules (MANDATORY)

Every enriched description MUST follow all of these rules. These exist to produce content that:
- Cannot be identified as AI-generated by Google's detectors
- Passes the "would a real Emart staff member say this?" test
- Differentiates this product from every other product in the catalog

### 4.1 Structure (HTML output)

**Do NOT open with `<h2>{product_title}</h2>`.** The WooCommerce product template already renders the product title as `<h1>`. Repeating it as `<h2>` creates H1/H2 keyword duplication — a negative signal for Google and LLMs. Start directly with the opening paragraph.

Use `<h3>` for all section headings within the description tab. The hierarchy is: H1 (page title, WooCommerce) → H3 (description sections). No H2 inside `post_content`.

```html
<p>{opening_hook — 2-4 sentences, brand + key ingredient + one concrete detail}</p>
<p>{second paragraph — pairing sentence + Bangladesh context}</p>
<h3>Key Benefits</h3>
<ul>
  <li>{benefit_1}</li>
  <li>{benefit_2}</li>
  <li>{benefit_3}</li>
  [up to 6 bullets — each uses "Label — Mechanism" em-dash format]
</ul>
<h3>Who It's For</h3>
<p>{2-3 sentences: suits / avoid / concern reference}</p>
<h3>How to Use</h3>
<ol>
  <li>{step with timing or quantity where available}</li>
</ol>
<p>{closing trust line — one sentence}</p>
<aside class="product-disclaimer">
  <p><strong>Before Use:</strong> {patch test warning}</p>
  <p><strong>Shelf Life &amp; Storage:</strong> {shelf life text}</p>
  <p><strong>Packaging:</strong> {packaging type and expiry location}</p>
</aside>
```

Note: `<aside>` replaces `<div class="product-disclaimer">` — semantically signals supplementary content to LLMs and screen readers, reducing risk of disclaimer text being parsed as a product claim.

### 4.2 Opening hook rules

The opening hook (first paragraph) MUST:
- Mention the brand name within the first sentence
- Mention the specific variant (the distinguishing ingredient or formula name) within 2 sentences
- Be 2–4 sentences long
- NOT start with: "This product", "Introducing", "Meet", "Experience", "Discover", "Elevate"
- NOT be identical in structure to any other product's opening hook
- Include one concrete detail (texture, scent, color, concentration, format, award, or origin claim)

Good example (COSRX Snail Mucin):
> "COSRX built its reputation on one ingredient: 96% snail secretion filtrate. That's not a small amount — most snail products contain under 10%. This essence applies like water but leaves skin noticeably plumper within two weeks, which is why it's become South Korea's best-selling essence for three consecutive years."

Bad example (reject this):
> "This comprehensive skincare solution from COSRX offers a multifaceted approach to hydration. It seamlessly blends innovative ingredients to transform your skincare routine."

### 4.3 Sentence variety rules

- **Vary sentence length.** Mix short sentences (8–12 words) with longer ones (18–28 words). Never write three consecutive sentences of similar length.
- **Natural openers allowed:** Start up to 20% of sentences with "And", "But", "It", "This", or "That". This is how humans write.
- **Contractions required:** Use "it's", "you'll", "doesn't", "isn't", "that's" — not their expanded forms. Expanded forms sound formal/robotic.
- **Active voice preferred** but passive is fine occasionally: "the formula was developed to..." reads naturally.
- **Pronoun clarity rule:** After 2 consecutive "It"/"This" sentences, restate the product name or ingredient name. LLMs lose the referent otherwise. Example: "It absorbs in seconds. It doesn't pill. The snail mucin formula..." — not three "It" sentences in a row.

### 4.3a E-E-A-T signal rules (mandatory)

**Experience (first E) — required in every description:**
Include one observational detail that could only come from someone who has used or closely examined the product. Examples:
- Texture/sensory: "the pump dispenses exactly one application — no waste"
- Usage observation: "in Dhaka's July humidity, this sets matte within 15 minutes"
- Packaging detail: "the airless bottle means the last 10% is as effective as the first"
- Behaviour under conditions: "doesn't pill under SPF even on oily skin"

This is the hardest E-E-A-T signal to fake and the strongest trust signal for Google's quality raters.

**Trustworthiness — claim attribution required:**
Any third-party marketing claim MUST be attributed. Do not state it as fact.

| Type of claim | Required attribution |
|--------------|---------------------|
| Sales figures | "According to [Brand], this sells..." |
| Bestseller status | "Listed as [Brand]'s bestseller in [year]" |
| Award claims | "Winner of [award name] per [Brand]" |
| Clinical claims not on product label | "As claimed by the manufacturer" |
| "Dermatologist-tested" | Acceptable without attribution — it's on the label |
| Ingredient concentrations from INCI | No attribution needed — verifiable |

**Avoid-if mechanism rule:**
"Who It's For" must name the avoid-if skin type AND the mechanism:
- Wrong: "Not recommended for dry skin."
- Right: "Not recommended for severely dry or eczema-prone skin — the salicylic acid will increase transepidermal water loss and may irritate a compromised barrier."

### 4.4 Words and phrases BANNED (LLM tells)

Never use any of these in any generated description:

```
delve, dive deep, tapestry, realm, embark, testament, multifaceted,
seamlessly, leverage, revolutionize, game-changer, game changer,
cutting-edge, state-of-the-art, comprehensive solution, comprehensive formula,
comprehensive skincare, holistic approach, innovative formula, innovative blend,
meticulously, meticulous, unparalleled, best-in-class, top-notch,
Furthermore, Moreover, In conclusion, In summary, It is worth noting,
It's important to note, Not only that, powerhouse (as standalone adjective),
skin-loving (hyphenated filler), transform your routine, elevate your skincare,
harness the power, unlock your, unleash the, experience the power,
take your skincare to the next level, a must-have for anyone
```

### 4.5 Bangladesh anchoring (required in every description)

Every product description must include ONE of these local context signals:
- Reference to Bangladesh climate (humidity, heat, UV, pollution in Dhaka)
- Authenticity/import statement (sourced directly from origin country, not parallel imports)
- Availability context (COD available, fast delivery to Dhaka and outside Dhaka)
- Specific Bangladesh customer use case (e.g., "works well for the oily-combination skin common in humid Bangladeshi climates")

This is not a boilerplate sentence. It must be woven into the product narrative, not appended as a marketing tag.

### 4.6 Variant differentiation rule

If multiple products share the same brand and product line (e.g., Kerasys shampoos), each product's description MUST:
1. Name the key differentiating ingredient in the first paragraph (e.g., "argan oil", "propolis", "black bean")
2. Explain what that specific ingredient does that others in the line don't (e.g., "Propolis adds antibacterial action, unlike the argan oil variant which focuses purely on repair")
3. Specify which hair/skin type or concern this variant is best for, different from sibling products

### 4.7 Key Benefits bullets — rules

Format: **`Benefit Label — Ingredient/mechanism explanation sentence`** (em dash separator)

Each bullet MUST:
- Use the format: short label (2–4 words) + ` — ` + one full explanation sentence
- Label names the benefit outcome or active ingredient — never a generic adjective
- Explanation sentence names the specific ingredient responsible and what it does
- Be specific to THIS product (not generic to the category)
- 15–25 words total including label

Good bullets:
- `Brightens Uneven Tone — Tranexamic acid (5%) blocks melanin transfer at the source, fading sun spots and post-acne marks without harsh exfoliation`
- `Scalp Bacteria Control — Propolis extract targets the microorganisms that cause itching and flaking between washes`
- `Snail Mucin Repair — 96% secretion filtrate fills micro-cracks in the skin barrier and speeds healing of active acne marks`

Bad bullets (reject these patterns):
- `Moisturizes and hydrates your skin for a healthy glow` ← starts with verb, no ingredient
- `Snail mucin (96%) actively repairs the skin barrier` ← correct ingredient but missing the label format
- `Hydration Boost — This product keeps your skin moisturized all day` ← label is vague, no ingredient named

### 4.8 Who It's For section

This paragraph MUST:
- Name 1–2 specific skin/hair types this product suits
- Name 1 skin/hair type that should avoid or use with caution
- Be 2–3 sentences
- Reference the specific concern (`pa_concern` value) in natural language

Example:
> "Best suited for oily and combination skin types that struggle with post-acne marks or slow barrier recovery. If you have very dry skin, layer this under a heavier moisturizer — the watery texture absorbs fast but won't provide enough occlusion on its own. Not recommended as a standalone treatment for active, inflamed breakouts."

### 4.9 Closing trust line

One sentence. Options:
- Authenticity: "Imported directly from [origin country] — not grey-market stock."
- Availability: "Available now at Emart with Cash on Delivery across Bangladesh."
- Social proof: "One of Emart's consistently top-rated [category] products." (only if total_sales > 5)
- Pairing tip: see Section 4.10 below — pairing must pass ingredient compatibility check first.

Do not use more than one closing trust line. Do not repeat what was already said in the description.

### 4.10 "Pair with" cross-sell — compatibility rules (MANDATORY)

Include one "pairs well with" sentence in the second body paragraph (not just the closing line — embed it naturally in the text, as Skinnora does). This signals product expertise and creates an internal link opportunity.

**The pairing must be ingredient-safe.** Before suggesting any pairing, check the product's active ingredients against the incompatibility table below. If the suggested pairing triggers a conflict, suggest a different product type or omit the pairing entirely — do not suggest an incompatible combination.

#### Incompatibility table — never suggest these combinations

| If the current product contains... | Do NOT pair with products containing... | Reason |
|------------------------------------|------------------------------------------|--------|
| Vitamin C (L-ascorbic acid, ascorbyl glucoside, ascorbyl phosphate) | AHA (glycolic, lactic, mandelic acid) | Both acidic; AHA destabilises Vitamin C, causes irritation |
| Vitamin C (any form) | BHA (salicylic acid) | Same conflict as above — pH clash + irritation risk |
| Vitamin C (any form) | PHA (gluconolactone, lactobionic acid) | Same conflict — all exfoliating acids destabilise Vitamin C |
| Retinol / retinaldehyde / tretinoin | AHA (glycolic, lactic, mandelic) | Combined irritation; AHA degrades retinol stability |
| Retinol / retinoids | BHA (salicylic acid) | Over-exfoliation; pH mismatch reduces retinol efficacy |
| Retinol / retinoids | Vitamin C | Both active at different pH; together = irritation for most skin types |
| Benzoyl peroxide | Retinol / retinoids | BP oxidises retinol, rendering it ineffective |
| Benzoyl peroxide | Vitamin C | BP oxidises ascorbic acid, both become inactive |
| AHA (any) | BHA (salicylic acid) — at high %, same routine step | Risk of over-exfoliation when used together at the same step |
| AHA (any) | PHA — at high %, same routine step | Over-exfoliation when layered at the same application step |
| Copper peptides | Vitamin C | Vitamin C oxidises copper ions, inactivating the peptides |
| Copper peptides | AHA / BHA / PHA | Acidic pH inactivates copper peptide complexes |
| Niacinamide (>10%) | Vitamin C (>10%, L-ascorbic acid specifically) | At very high concentrations both, can form niacin and cause flushing; at standard 5–10% this is generally fine — flag as "use at different times of day" if both >10% |

#### Safe pairing examples by product type

| Current product type | Safe to pair with |
|---------------------|-------------------|
| Vitamin C serum | Hyaluronic acid serum, ceramide moisturiser, SPF sunscreen, peptide moisturiser |
| Retinol / retinoid | Ceramide moisturiser, hyaluronic acid, niacinamide (standard %), squalane |
| AHA toner / exfoliant | Hyaluronic acid serum, ceramide cream, SPF (morning after), niacinamide serum |
| BHA (salicylic) serum/toner | Niacinamide serum, oil-free moisturiser, SPF |
| Niacinamide serum | Almost anything — ceramide moisturiser, hyaluronic acid, SPF |
| Tranexamic acid serum | Niacinamide (compatible), hyaluronic acid, ceramide moisturiser, SPF |
| Snail mucin essence | Any moisturiser, SPF, niacinamide — very compatible ingredient |
| Benzoyl peroxide wash/spot | Oil-free moisturiser, gentle SPF; avoid actives on same step |
| Peptide serum | Hyaluronic acid, ceramide moisturiser, niacinamide; avoid Vitamin C and AHA same step |
| SPF sunscreen | Apply last — no pairing constraint, just remind to apply as final step |

#### How to write the pairing sentence

- Natural placement: second body paragraph, as a practical tip, not a promotion
- Name the specific product type or ingredient, not a vague "moisturiser"
- If Emart sells a compatible product by name, you may name it — but only if the pairing is genuinely safe per the table above
- If no safe named pairing exists, use the product category: "pairs well with a ceramide moisturiser"
- Acceptable: "For extra hydration, follow with a ceramide moisturiser — the barrier-repair ingredients work well after this serum absorbs."
- Not acceptable: "Pairs well with our Vitamin C serum for brighter results." ← if the current product contains AHA/BHA, this is a dangerous suggestion

---

## 5. Meta description humanizer rules

### 5.1 Current state (what exists in DB)

All 3,640 product meta descriptions use a single programmatic template:
> `Buy [Product Name] for ৳[price] in Bangladesh. Original [Category]. Fast delivery & COD available at Emart.`

Problems confirmed by DB audit:
- **100%** start with "Buy" — programmatic signal
- **100%** contain ৳ price — goes stale when price changes; misleads click-through
- **99.5%** share identical "Fast delivery & COD" suffix — duplicate pattern at scale
- **12.8%** exceed 160 chars — Google truncates silently

### 5.2 The search volume reality — "price in Bangladesh"

The highest-volume search pattern for Bangladeshi ecommerce is:
`[Product name] price in Bangladesh`

**This keyword phrase must stay in the meta description.** Remove the ৳ number — not the phrase.

The phrase "price in Bangladesh" or "best price in Bangladesh" or "price at Emart" hits the query. The actual number comes from Rank Math's WooCommerce Product schema (already active) which outputs:

```json
{"@type": "Offer", "price": "1370", "priceCurrency": "BDT"}
```

Google reads this and shows the live price as a rich result in the SERP below your meta description. When you update price in WooCommerce, the schema updates instantly — no stale snippet.

### 5.3 Target format

**Structure:** `[Specific product claim]. [Product-specific trust signal containing "price in Bangladesh"].`

**Both clauses must be unique to the product.** The second clause is NOT a rotation from a fixed list — it is generated from the product's own attributes. Three products from the same brand cannot share the same second clause.

### 5.4 Second clause — derive from product attributes

Pick the most compelling product-specific fact and build the second clause around it. Priority order:

| Product attribute | Second clause shape |
|------------------|-------------------|
| Known SPF value (sunscreens) | `SPF [X] protection — check price in Bangladesh at Emart.` |
| Dermatologist-tested claim | `Dermatologist-tested formula — current price in Bangladesh at Emart.` |
| Fragrance-free | `Fragrance-free, safe for daily use — see price in Bangladesh at Emart.` |
| High sales (total_sales > 20) | `One of Emart's best-selling [category] — price in Bangladesh with COD.` |
| Specific country of origin | `Authentic [South Korean / USA / Indian] import — price in Bangladesh at Emart.` |
| Specific concentration (e.g. 10% Niacinamide) | `[X]% [ingredient] — check price in Bangladesh at Emart, COD available.` |
| Sensitive skin / allergy-tested | `Suitable for sensitive skin — best price in Bangladesh at Emart.` |
| Vegan / cruelty-free | `Vegan, cruelty-free formula — see price in Bangladesh at Emart.` |
| Award-winning / cult product | `[Award / bestseller claim] — current price in Bangladesh at Emart.` |
| Default (none of the above apply) | See below — must vary by brand/origin/concern, never a fixed string. |

The "price in Bangladesh" phrase stays in every meta. Everything around it changes per product.

#### Default clause — must NOT be a fixed string (near-duplicate guard)

The default row in the table above applies to products with no premium attribute (no SPF, no
dermatologist claim, no fragrance-free, etc.). At scale this covers a large slice of the catalog
(basic shampoos, basic moisturisers, etc.). A fixed default like `"Imported from South Korea —
price in Bangladesh at Emart, COD available."` will hit the ≥82% similarity threshold against
every other South Korean default product and hard-error on all but the first.

**Default clause must be constructed from the product's unique combination of brand + origin + concern:**

```python
def build_default_second_clause(product: dict) -> str:
    """
    Constructs a default second clause that varies by product attributes
    so it clears the near-duplicate validator even without a premium signal.
    """
    brand   = (product.get('brand') or '').strip()
    origin  = (product.get('origin') or '').strip()
    concern = ((product.get('concerns') or [''])[0] or '').strip()

    if brand and origin:
        return f"{brand} from {origin} — price in Bangladesh at Emart, COD available."
    if brand and concern:
        return f"{brand} for {concern.lower()} — current price in Bangladesh at Emart."
    if origin:
        return f"Imported from {origin} — see price in Bangladesh at Emart, COD available."
    # Last resort — still includes Emart + phrase, at least has no exact repeat
    return "Authentic import — check current price in Bangladesh at Emart."
```

Pass this to DeepSeek as the default second-clause template when no premium attribute is detected,
so the model uses it as a starting point rather than inventing a generic identical string.

**Examples — every second clause is different because it reflects a different product truth:**

```
COSRX Advanced Snail 96 Mucin Essence 100ml
→ "COSRX's 96% snail mucin repairs the skin barrier and speeds healing of acne 
   marks. South Korean import — current price in Bangladesh at Emart."
   (second clause: specific origin)

CeraVe Hydrating Sunscreen SPF30 Medium Sheer Tint 50ml
→ "CeraVe's SPF30 mineral tint blends into medium skin tones without white cast, 
   with ceramides for barrier support. SPF30 protection — check price in Bangladesh at Emart."
   (second clause: SPF value)

The Ordinary Niacinamide 10% + Zinc 1% 30ml
→ "10% Niacinamide with Zinc visibly reduces pore size and balances sebum — 
   clinically studied concentrations. Dermatologist-tested — see price in Bangladesh at Emart."
   (second clause: concentration + dermatologist claim)

Kerasys Propolis Damage Repair Shampoo 1000ml
→ "Kerasys Propolis Shampoo targets scalp bacteria that cause itching while 
   conditioning heat-damaged hair from roots to ends. Price in Bangladesh at Emart, COD available."
   (second clause: default — no premium attribute available)

Some By Mi AHA BHA PHA 30 Days Miracle Toner
→ "Some By Mi's triple-acid toner combines AHA, BHA, and PHA to exfoliate, clear 
   pores, and fade blemishes over 30 days. Fragrance-free — check price in Bangladesh at Emart."
   (second clause: fragrance-free)

Missha Airy Fit Sheet Mask Shea Butter
→ "Missha's shea butter sheet mask softens and nourishes dry skin in 20 minutes — 
   no stickiness after removal. One of Emart's best-selling sheet masks — price in Bangladesh."
   (second clause: bestseller, total_sales > 20)
```

**What makes these different from each other:**
- CeraVe clause → SPF value (not origin, not bestseller, not fragrance-free)
- Ordinary clause → concentration (10%) + dermatologist
- Kerasys clause → default (no premium attribute)
- Some By Mi clause → fragrance-free
- Missha clause → bestseller signal

None of these end the same way. Google sees 3,640 distinctly different second clauses.

### 5.5 Hard rules for the generation prompt

```
MUST:
✓ Be 130–160 characters total
✓ Second clause must contain one of: "price in Bangladesh" / "price at Emart"
✓ First clause: specific product claim — ingredient, concentration, or skin benefit
✓ Second clause: derived from ONE specific product attribute (see table above)
✓ "Emart" must appear in the meta
✓ Second clause must be DIFFERENT from the previous product's second clause

MUST NOT:
✗ Start with "Buy"
✗ Contain ৳ or any price number
✗ Use "Original [Category]" — filler, not a claim
✗ Use the same second clause as any sibling product in the same brand line
✗ Use a generic fallback clause when a product-specific attribute is available
```

### 5.6 Validation in code — publish-quality gate

This validator separates **hard errors** (block publish) from **warnings** (flag for review).
It returns a `ValidationResult` dataclass, not just a list.

```python
import re
from dataclasses import dataclass, field
from rapidfuzz import fuzz   # already required for catalog matching


@dataclass
class ValidationResult:
    post_id:   int
    sku:       str
    slug:      str
    title:     str
    meta:      str
    errors:    list[str] = field(default_factory=list)   # block publish
    warnings:  list[str] = field(default_factory=list)   # flag, allow publish

    @property
    def passed(self) -> bool:
        return len(self.errors) == 0

    def summary(self) -> str:
        status = "PASS" if self.passed else "FAIL"
        lines = [f"[{status}] {self.title[:50]} (ID {self.post_id})"]
        for e in self.errors:
            lines.append(f"  ERROR:   {e}")
        for w in self.warnings:
            lines.append(f"  WARNING: {w}")
        return "\n".join(lines)


# ── Constants ──────────────────────────────────────────────────────────────

PRICE_PATTERNS = [
    r'৳',
    r'\bBDT\b',
    r'\bTk\.?\s*\d',
    r'\btaka\b',
    r'\b\d{3,5}\s*(tk|bdt|taka)\b',
    r'৳\s*[\d,]+',
]

PRICE_KW_REQUIRED = ["price in bangladesh", "price at emart"]

# Hard-banned phrases in meta descriptions
BANNED_PHRASES = [
    "perfect for all skin types",
    "suitable for all skin types",
    "for everyone",
    "one size fits all",
    "premium quality",        # vague + LLM tell
    "high quality",
    "best quality",
    "top quality",
    "world class",
    "industry leading",
]

# Filler words: warn if used more than once in a 160-char meta
FILLER_WORDS_LIMIT_1 = ["authentic", "genuine", "original", "best"]

# Phrases that are warnings (generic but not hard failures)
GENERIC_WARNING_PATTERNS = [
    r"fast delivery",
    r"quick delivery",
    r"available (now|online)",
    r"shop now",
    r"order now",
    r"get yours",
]

NEAR_DUPLICATE_THRESHOLD = 82   # rapidfuzz ratio — catches K-beauty vs Korean skincare swaps


# ── Helper ─────────────────────────────────────────────────────────────────

def _safe_str(val) -> str:
    """Return val as a stripped string, or '' if None/non-string."""
    if val is None:
        return ""
    if not isinstance(val, str):
        return str(val).strip()
    return val.strip()

def _safe_cats(product: dict) -> list[str]:
    """Extract category name strings safely from str, dict, or other types."""
    out = []
    for cat in product.get("categories", []):
        if isinstance(cat, str):
            out.append(cat.lower())
        elif isinstance(cat, dict):
            name = cat.get("name") or cat.get("slug") or ""
            if name:
                out.append(str(name).lower())
    return out


# ── Main validator ─────────────────────────────────────────────────────────

def validate_meta_desc(
    meta,                        # may be None, non-string, or str
    product: dict,
    seen_second_clauses: set,    # tracks second clauses across the batch run
) -> ValidationResult:
    """
    Publish-quality gate for generated meta descriptions.

    Hard errors → block publish, require regeneration.
    Warnings    → flag in review CSV, allow publish if owner approves.

    seen_second_clauses is only updated when the meta passes all hard errors
    (fix 2: bad metas must not contaminate the duplicate tracker).
    """
    result = ValidationResult(
        post_id = int(product.get("post_id") or product.get("ID") or 0),
        sku     = _safe_str(product.get("sku")),
        slug    = _safe_str(product.get("slug")),
        title   = _safe_str(product.get("title") or product.get("post_title")),
        meta    = _safe_str(meta),
    )
    errors   = result.errors
    warnings = result.warnings

    # ── Guard: empty or non-string (fix 1) ────────────────────────────────
    if not meta or not isinstance(meta, str) or not meta.strip():
        errors.append("meta is empty or None — generation returned no meta description")
        return result   # nothing further to check

    # ── Normalize whitespace (fix 2) ──────────────────────────────────────
    # Collapse repeated spaces/newlines so length matches what Google sees
    m = re.sub(r'\s+', ' ', meta).strip()
    m_lower = m.lower()
    result.meta = m   # store normalized version

    # ── Length (hard errors) ──────────────────────────────────────────────
    if len(m) < 130:
        errors.append(f"too short: {len(m)} chars (min 130)")
    elif len(m) < 140:
        warnings.append(f"borderline short: {len(m)} chars — aim for 145+")
    if len(m) > 160:
        errors.append(f"too long: {len(m)} chars (max 160 — Google truncates)")
    elif len(m) > 155:
        warnings.append(f"near limit: {len(m)} chars — risk truncation on some devices")

    # ── Banned opener ─────────────────────────────────────────────────────
    if m_lower.startswith("buy "):
        errors.append("starts with 'Buy' — programmatic template signal")

    # ── Price amount in meta (fix 5: comprehensive) ───────────────────────
    if any(re.search(p, m, re.I) for p in PRICE_PATTERNS):
        errors.append("contains price amount — remove ৳/BDT/Tk/taka and any numeric price")

    # ── 'Original [Category]' filler ─────────────────────────────────────
    if "original " in m_lower and any(c and c in m_lower for c in _safe_cats(product)):
        errors.append("contains 'Original [Category]' filler — replace with product claim")

    # ── Required: 'price in Bangladesh' or 'price at Emart' ──────────────
    if not any(p in m_lower for p in PRICE_KW_REQUIRED):
        errors.append(
            "MISSING keyword phrase — meta must contain "
            "'price in Bangladesh' or 'price at Emart'"
        )

    # ── Required: Emart brand mention ─────────────────────────────────────
    if "emart" not in m_lower:
        errors.append("missing 'Emart' — brand must appear in meta")

    # ── Hard-banned phrases ───────────────────────────────────────────────
    for phrase in BANNED_PHRASES:
        if phrase in m_lower:
            errors.append(f"banned filler phrase: '{phrase}'")

    # ── Filler word overuse (fix 5b) — warn if used more than once ────────
    for word in FILLER_WORDS_LIMIT_1:
        count = len(re.findall(rf'\b{re.escape(word)}\b', m_lower))
        if count > 1:
            warnings.append(
                f"'{word}' used {count}× — once is enough in 160 chars"
            )

    # ── Generic closing phrases (warning, not error) ──────────────────────
    for pat in GENERIC_WARNING_PATTERNS:
        if re.search(pat, m_lower):
            warnings.append(
                f"generic phrase detected: '{pat}' — replace with product-specific signal"
            )

    # ── Product signal check (fix 4) ──────────────────────────────────────
    # Meta must reference something specific about THIS product:
    # brand name, a key ingredient word, or the primary concern.
    brand    = _safe_str(product.get("brand")).lower()
    concerns = [_safe_str(c).lower() for c in product.get("concerns", []) if c]
    # Extract ingredient keywords from title (words > 4 chars, not stop words)
    title_words = set(
        w.lower() for w in re.findall(r'\b\w{5,}\b',
            _safe_str(product.get("title") or product.get("post_title")))
        if w.lower() not in {"about", "with", "from", "that", "this", "their", "which"}
    )
    has_product_signal = (
        (brand and brand in m_lower)
        or any(c and c in m_lower for c in concerns)
        or any(tw in m_lower for tw in title_words)
    )
    if not has_product_signal:
        errors.append(
            "no product signal — meta doesn't mention brand, concern, or any "
            "keyword from the product title; could describe any product"
        )

    # ── Second clause check (fix 3) ───────────────────────────────────────
    parts = re.split(r'\.\s+|\s+—\s+', m, maxsplit=1)
    if len(parts) < 2:
        errors.append(
            "missing second clause separator — meta must have two clauses "
            "joined by '. ' or ' — '"
        )
        # Cannot extract second clause — return without touching seen set
        return result

    second = parts[1].strip().lower()

    # ── Near-duplicate detection (fix 3 extended) ─────────────────────────
    # Catches "authentic Korean skincare" vs "authentic K-beauty skincare"
    matched_prior = None
    for prior in seen_second_clauses:
        if fuzz.ratio(second, prior) >= NEAR_DUPLICATE_THRESHOLD:
            matched_prior = prior
            break

    if matched_prior:
        errors.append(
            f"near-duplicate second clause ({fuzz.ratio(second, matched_prior):.0f}% similar "
            f"to: '{matched_prior[:60]}')"
        )

    # ── Fix 2: only register when all hard errors are absent ──────────────
    if not errors:
        seen_second_clauses.add(second)

    return result
```

#### Usage across the batch

```python
import csv, json
from datetime import datetime

seen_second_clauses: set[str] = set()
failures: list[dict] = []

for product in products_to_enrich:
    generated = generate_product_description(product, ...)
    result = validate_meta_desc(generated['meta_desc'], product, seen_second_clauses)

    if not result.passed:
        # Retry once — pass error list explicitly into prompt
        error_note = (
            f"\n\nYour previous meta description failed validation:\n"
            f"Meta: {result.meta}\n"
            f"Errors to fix:\n" + "\n".join(f"- {e}" for e in result.errors)
        )
        generated = generate_product_description(product, ...,
                                                  retry_note=error_note)
        result = validate_meta_desc(generated['meta_desc'], product,
                                    seen_second_clauses)

    if not result.passed:
        # Fix 7: log rich context for batch review
        failures.append({
            "post_id":  result.post_id,
            "sku":      result.sku,
            "slug":     result.slug,
            "title":    result.title,
            "meta":     result.meta,
            "errors":   result.errors,
            "warnings": result.warnings,
            "ts":       datetime.utcnow().isoformat(),
        })
        print(result.summary())
        continue   # skip to next product

    if result.warnings:
        print(result.summary())   # print warnings but continue

# Save failures for owner review
DATE_END = datetime.today().strftime("%Y-%m-%d")
failures_path = f"workspace/audit/active/content-humanizer-validation-failures-{DATE_END}.json"
with open(failures_path, "w") as f:
    json.dump(failures, f, ensure_ascii=False, indent=2)
print(f"\nValidation failures: {len(failures)} — see {failures_path}")
```

#### Error vs warning reference

| Check | Classification | Reason |
|-------|---------------|--------|
| Empty / None meta | ERROR | Nothing to publish |
| Too short / too long | ERROR | Google truncates or ignores |
| Starts with "Buy" | ERROR | Programmatic signal |
| Contains price amount | ERROR | Goes stale, misleads CTR |
| Missing `price in Bangladesh` phrase | ERROR | Misses highest-volume BD query |
| Missing 'Emart' | ERROR | No brand attribution |
| Banned phrase (`premium quality` etc.) | ERROR | LLM tell / filler |
| No product signal | ERROR | Could describe any product |
| Missing second clause separator | ERROR | Structure broken |
| Near-duplicate second clause (≥82%) | ERROR | Pattern signal across catalog |
| Borderline short (130–139 chars) | WARNING | Not ideal but valid |
| Near length limit (156–160 chars) | WARNING | Device truncation risk |
| Filler word used 2× | WARNING | Weakens specificity |
| Generic closing phrase | WARNING | Flag for manual polish |

---

## 6. Execution plan — step by step

### Shared config — define once, import everywhere

```python
# workspace/scripts/active/config.py
# All scripts import from here — fixes DATE_END NameError across scripts

from datetime import datetime, timedelta

DATE_END   = datetime.today().strftime("%Y-%m-%d")
DATE_START = (datetime.today() - timedelta(days=90)).strftime("%Y-%m-%d")

SITE_URL    = "https://e-mart.com.bd/"
MERCHANT_ID = "YOUR_GMC_MERCHANT_ID"   # replace with real ID from GMC dashboard URL
KEY_FILE    = "/var/www/emart-platform/apps/web/google-service-account.json"

DB_CONFIG = {
    "host":     "localhost",
    "database": "emart_live",
    "user":     "emart_user",
    "password": os.environ["EMART_DB_PASSWORD"],   # never hardcode — export before running
}
TABLE_PREFIX = "wp4h_"
```

```bash
# Set before running any script:
export EMART_DB_PASSWORD="..."
export DEEPSEEK_API_KEY="..."
export GMC_MERCHANT_ID="..."
```

All scripts: `from config import DATE_END, DATE_START, SITE_URL, MERCHANT_ID, KEY_FILE, DB_CONFIG, TABLE_PREFIX`

---

### Step 0A: GSC data pull — actual search queries per product URL

```python
# Script: workspace/scripts/active/gsc_pull.py
# Output: workspace/audit/active/gsc-query-map-YYYYMMDD.json
# Run once. Reuse across all generation runs.
```

#### Setup — Google Search Console API

```bash
pip install google-auth google-auth-httplib2 google-api-python-client
```

You need a service account JSON key with Search Console access, OR use the
existing OAuth credentials already set up for this project.

Check for existing credentials:
```bash
ls /var/www/emart-platform/apps/web/.env.local | grep GOOGLE
# Look for: GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS
```

If credentials exist, reference them. If not, create a service account in
Google Cloud Console → grant it "Search Console → Verified owners → Add user"
on `https://e-mart.com.bd/` → download JSON key.

#### Pull script

```python
import json, os
from datetime import datetime, timedelta
from googleapiclient.discovery import build
from google.oauth2 import service_account

SITE_URL = "https://e-mart.com.bd/"
KEY_FILE  = os.environ.get("GOOGLE_SERVICE_ACCOUNT_KEY",
            "/var/www/emart-platform/apps/web/google-service-account.json")
DATE_END   = datetime.today().strftime("%Y-%m-%d")
DATE_START = (datetime.today() - timedelta(days=90)).strftime("%Y-%m-%d")

def build_gsc_service():
    creds = service_account.Credentials.from_service_account_file(
        KEY_FILE,
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
    )
    return build("searchconsole", "v1", credentials=creds)

def pull_all_shop_queries(service) -> dict:
    """
    Single paginated pull with dimensions=["page","query"], filtered to /shop/
    and Bangladesh. Client-side grouping replaces ~3,500 sequential API calls.

    Previous approach (one call per page path) was ~3,500 API calls — slow,
    quota-burning, and effectively serialised by Python's request overhead.
    This approach uses a handful of paginated calls instead.
    """
    query_map: dict[str, list] = {}
    start_row = 0
    PAGE_SIZE  = 25_000   # GSC API maximum per request

    while True:
        body = {
            "startDate":  DATE_START,
            "endDate":    DATE_END,
            "dimensions": ["page", "query"],
            "dimensionFilterGroups": [{
                "filters": [
                    {
                        "dimension":  "page",
                        "operator":   "contains",
                        "expression": "/shop/"      # all product pages
                    },
                    {
                        "dimension":  "country",
                        "operator":   "equals",
                        "expression": "bgd"          # Bangladesh only
                    }
                ]
            }],
            "rowLimit":  PAGE_SIZE,
            "startRow":  start_row,
        }

        resp = service.searchanalytics().query(
            siteUrl=SITE_URL, body=body
        ).execute()

        rows = resp.get("rows", [])
        if not rows:
            break

        for row in rows:
            page_url, query = row["keys"]
            # Convert absolute URL to path: https://e-mart.com.bd/shop/slug → /shop/slug
            path = page_url.replace(SITE_URL.rstrip("/"), "")
            query_map.setdefault(path, []).append({
                "query":       query,
                "clicks":      row["clicks"],
                "impressions": row["impressions"],
                "ctr":         round(row["ctr"] * 100, 2),
                "position":    round(row["position"], 1),
            })

        if len(rows) < PAGE_SIZE:
            break   # last page
        start_row += PAGE_SIZE

    # Sort each path's queries by impressions desc, keep top 10
    for path in query_map:
        query_map[path].sort(key=lambda x: x["impressions"], reverse=True)
        query_map[path] = query_map[path][:10]

    return query_map

# Run and save
service   = build_gsc_service()
query_map = pull_all_shop_queries(service)
with open(f"workspace/audit/active/gsc-query-map-{DATE_END}.json", "w") as f:
    json.dump(query_map, f, ensure_ascii=False, indent=2)
print(f"GSC: {len(query_map)} product paths with query data")

# Priority products: ranking pos 5-20, CTR < 2% — highest opportunity
priority_gsc = []
for path, queries in query_map.items():
    for q in queries:
        if 5 <= q["position"] <= 20 and q["ctr"] < 2.0 and q["impressions"] > 50:
            priority_gsc.append({"path": path, **q})
priority_gsc.sort(key=lambda x: x["impressions"], reverse=True)
print(f"GSC: {len(priority_gsc)} high-opportunity queries (pos 5-20, CTR<2%, imp>50)")
```

#### What this data does in generation

For each product, the top 5 GSC queries are passed to DeepSeek as:

```
ACTUAL SEARCH QUERIES (real Bangladesh users, last 90 days):
  1. "cosrx snail essence price in bangladesh"  pos 4.2 · 2,400 impressions
  2. "snail mucin serum bangladesh"              pos 7.8 · 890 impressions
  3. "cosrx essence bd price"                   pos 11  · 430 impressions

Include each of these phrases ONCE naturally in the description or meta.
Do not force — work into sentences where they fit.
Do NOT repeat any phrase more than once.
```

**Keyword gap rule:** If a query appears in the GSC top 5 but is NOT present anywhere in the current `post_content` or `_rank_math_description` → it is a **confirmed keyword gap**. DeepSeek must include it in the new content. This is the highest-confidence keyword signal available — real Bangladesh users, real search data, not guessed terms.

---

### Step 0B: GMC status pull — disapproved and underperforming products

```python
# Script: workspace/scripts/active/gmc_pull.py
# Output: workspace/audit/active/gmc-status-YYYYMMDD.json
# Run once. Reuse across all generation runs.
```

#### Setup — Google Merchant Center Content API

```bash
pip install google-auth google-api-python-client
```

You need:
- Merchant Center account ID (visible in GMC dashboard URL: `merchants/XXXXXXX/`)
- Same service account JSON key as GSC, OR a separate one with GMC access
- Grant service account "Standard" access in GMC → Settings → Users

```python
import json, os
from googleapiclient.discovery import build
from google.oauth2 import service_account

MERCHANT_ID = os.environ.get("GMC_MERCHANT_ID", "YOUR_MERCHANT_ID")
KEY_FILE    = os.environ.get("GOOGLE_SERVICE_ACCOUNT_KEY",
              "/var/www/emart-platform/apps/web/google-service-account.json")

def build_gmc_service():
    creds = service_account.Credentials.from_service_account_file(
        KEY_FILE,
        scopes=["https://www.googleapis.com/auth/content"]
    )
    return build("content", "v2.1", credentials=creds)

def pull_product_statuses(service) -> dict:
    """
    Returns {woo_product_id: {"gmc_id", "status", "reasons", "title"}}
    Matches GMC products to Emart WooCommerce IDs via offer ID
    (Emart's GMC feed uses offer ID = WooCommerce product ID).
    """
    gmc_map = {}
    request = service.productstatuses().list(merchantId=MERCHANT_ID, maxResults=250)

    while request is not None:
        resp = request.execute()
        for item in resp.get("resources", []):
            # GMC offer ID format: "online:en:BD:{woo_product_id}"
            offer_id = item.get("productId", "")
            parts = offer_id.split(":")
            woo_id = parts[-1] if parts else ""

            destinations = item.get("destinationStatuses", [])
            shopping_status = "unknown"
            disapproval_reasons = []
            for dest in destinations:
                if "Shopping" in dest.get("destination", ""):
                    shopping_status = dest.get("status", "unknown")
                    for issue in item.get("itemLevelIssues", []):
                        if issue.get("destination") == dest["destination"]:
                            disapproval_reasons.append(
                                issue.get("description", issue.get("code", "unknown"))
                            )

            gmc_map[woo_id] = {
                "gmc_id":  item.get("productId"),
                "title":   item.get("title", ""),
                "status":  shopping_status,
                "reasons": disapproval_reasons,
            }

        request = service.productstatuses().list_next(request, resp)

    return gmc_map

# Run and save
service = build_gmc_service()
gmc_map = pull_product_statuses(service)

disapproved = [v for v in gmc_map.values() if v["status"] in ("disapproved", "Disapproved")]
warnings    = [v for v in gmc_map.values() if v["status"] in ("has_issues", "Has issues")]

with open(f"workspace/audit/active/gmc-status-{DATE_END}.json", "w") as f:
    json.dump(gmc_map, f, ensure_ascii=False, indent=2)

print(f"GMC: {len(gmc_map)} products · {len(disapproved)} disapproved · {len(warnings)} with warnings")
```

#### How GMC status changes the humanizer queue

| GMC status | Action |
|------------|--------|
| `disapproved` | Move to **front of queue** — unblocking Shopping is highest ROI |
| `has_issues` | High priority — fix before other products |
| `approved` | Normal priority |
| Not in GMC | Normal priority |

GMC disapproval reasons added to the generation prompt:
```
GMC STATUS: Disapproved
Reasons: "Description too short", "Missing brand in description"
Fix both issues in the generated description.
```

---

### Step 0C: Priority queue — merge all signals

After Steps 0, 0A, 0B, build a unified priority-ordered list before generating:

```python
def build_priority_queue(
    audit_scores: list[dict],    # from Step 1 audit CSV
    gsc_query_map: dict,         # from Step 0A
    gmc_status_map: dict,        # from Step 0B
    skinnora_matches: dict,      # from Step 0 scrape
) -> list[dict]:
    """
    Returns products sorted by priority score (highest first).
    Only includes products with content_score >= 2 (need enrichment).
    """
    queue = []
    for product in audit_scores:
        if product['content_score'] < 2:
            continue   # already good — skip
        if product['total_sales'] > 20:
            continue   # high-performer — owner review required, skip auto

        pid = str(product['post_id'])
        slug = product.get('slug', '')
        path = f"/shop/{slug}"

        # Priority score — higher = do first
        priority = 0

        # GMC disapproved → +100 (unblocks Shopping revenue immediately)
        gmc = gmc_status_map.get(pid, {})
        if gmc.get('status') in ('disapproved', 'Disapproved'):
            priority += 100
        elif gmc.get('status') in ('has_issues', 'Has issues'):
            priority += 50

        # GSC: high impression, low CTR, pos 5-20 → +30 (quick ranking win)
        gsc_queries = gsc_query_map.get(path, [])
        for q in gsc_queries:
            if 5 <= q['position'] <= 20 and q['ctr'] < 2.0 and q['impressions'] > 100:
                priority += 30
                break

        # GSC: has query data at all → +10 (page is indexed, has signal)
        if gsc_queries:
            priority += 10

        # Skinnora match → +20 (richer content available)
        if skinnora_matches.get(pid):
            priority += 20

        # Content score → +5 per point (worse content = more urgent)
        priority += product['content_score'] * 5

        queue.append({**product, 'priority': priority,
                      'gmc_status': gmc.get('status', 'unknown'),
                      'gmc_reasons': gmc.get('reasons', []),
                      'gsc_queries': gsc_queries,
                      'skinnora_data': skinnora_matches.get(pid)})

    queue.sort(key=lambda x: x['priority'], reverse=True)
    return queue
```

Save priority queue to: `workspace/audit/active/content-humanizer-priority-queue-YYYYMMDD.csv`

Columns:
```
post_id, post_title, priority, content_score, gmc_status, gmc_reasons,
gsc_top_query, gsc_impressions, gsc_position, gsc_ctr,
has_skinnora_match, path
```

Print top 20 highest-priority products before starting generation so owner can sanity-check the ordering.

### Step 0: Skinnora scrape and catalog match (run once before Step 1)

```python
# Script: workspace/scripts/active/skinnora_scrape.py
# Outputs:
#   workspace/audit/active/skinnora-scrape-raw-YYYYMMDD.json
#   workspace/audit/active/skinnora-catalog-matches-YYYYMMDD.csv
```

1. Check robots.txt (Section 2.5.1) — abort Skinnora phase if disallowed
2. Discover all Skinnora product URLs via sitemap (Section 2.5.2)
3. Scrape each product page with 3-second delay (Section 2.5.3)
4. Match to Emart catalog by fuzzy title (Section 2.5.4, threshold ≥ 80%)
5. Save raw scrape JSON and matches CSV
6. Print summary: `Scraped N products. Matched M to Emart catalog.`

**This step runs once. The match data is reused for all subsequent generation runs.**

### Step 1: Audit and score all products

```python
# Script: workspace/scripts/active/content_humanizer_audit.py
# Output: workspace/audit/active/content-humanizer-scores-YYYYMMDD.csv
```

For each published product:
1. Pull all data fields from Section 2
2. Pull taxonomy terms (brand, origin, concern, category)
3. Strip HTML from post_content to get plain text length
4. Score against 7 signals in Section 3
5. Flag whether a Skinnora match exists (from Step 0 matches CSV)
6. Write to CSV

Add column to scores CSV: `has_skinnora_match` (yes/no)

**Run this before generating any content.**

### Step 2: Generate enriched descriptions — two-path flow

Products split into two tracks based on Skinnora match:

```
┌─────────────────────────────────────────────────────┐
│              Products needing enrichment             │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
   has_skinnora_match=YES   has_skinnora_match=NO
         │                       │
   PATH A: Research-             PATH B: Emart-DNA
   assisted generation           only generation
   (Section 7, Track A)          (Section 7, Track B)
         │                       │
         └───────────┬───────────┘
                     │
            Review CSV → Owner approval → Apply
```

**PATH A (Skinnora match found):**
- Load Skinnora scraped content for the matched product
- Pass to DeepSeek as research reference alongside Emart's own product data
- DeepSeek writes original content INSPIRED by Skinnora's structure and depth
- Skinnora's pairing suggestions are checked against Section 4.10 compatibility table before inclusion
- Output is original — not a paraphrase of Skinnora

**PATH B (no Skinnora match):**
- Use only Emart's own data: title, brand, origin, concern, ingredients, how-to-use
- DeepSeek generates from scratch using the humanizer rules
- Same output format and quality standard as Path A

Both paths produce the same review CSV format. No difference in the apply step.

Each generated product produces three outputs:

```
new_content_html        → wp4h_posts.post_content  (description + disclaimer block at end)
new_ingredients_html    → wp4h_postmeta _emart_ingredients  (Path A only if richer than current)
new_meta_desc           → wp4h_postmeta _rank_math_description
```

Review CSV columns:
```
post_id, post_title, brand, origin, concern, score, path,
skinnora_match_url, skinnora_match_score,
old_content_plain (first 200 chars),
extraction_mode (replace_all / partial / how_to_kept / bengali_translated),
facts_preserved (count of keep_facts extracted),
new_content_html,
old_ingredients (first 100 chars),
new_ingredients_html (Path A only — blank if skipped),
old_faq_quality (good/poor/empty),
new_faq_text (blank if old was 'good' or no Skinnora FAQ available),
old_meta_desc,
new_meta_desc,
pairing_used (the safe pairing sentence used, or 'default' or 'none'),
disclaimer_source (scraped / default),
change_reason
```

Output: `workspace/audit/active/content-humanizer-generated-YYYYMMDD.csv`

### Step 3: Owner review checkpoint

**STOP HERE.** Output the review CSV path. Do not proceed to Step 4 without explicit approval.

Message: "Content generated for {N} products ({A} with Skinnora match, {B} Emart-only). Review CSV at workspace/audit/active/content-humanizer-generated-YYYYMMDD.csv before I apply. Approve to proceed."

### Step 4: Generate rollback JSON

Before writing anything to DB, capture current state for every product to be updated:

```python
# workspace/audit/active/content-humanizer-rollback-YYYYMMDD.json
# Format:
# [{
#   "post_id": 123,
#   "old_post_content": "...",
#   "old_rank_math_description": "...",
#   "old_emart_ingredients": "...",    ← only if ingredients will be updated
#   "old_emart_product_faq": "..."     ← only if FAQ will be updated
# }, ...]
```

### Step 5: Apply approved content to DB

For each approved row in the review CSV:

```python
# 1. Main description (always updated)
cursor.execute(
    "UPDATE wp4h_posts SET post_content = %s WHERE ID = %s",
    (row['new_content_html'], row['post_id'])
)
# 2. Meta description (always updated)
cursor.execute(
    "UPDATE wp4h_postmeta SET meta_value = %s "
    "WHERE post_id = %s AND meta_key = '_rank_math_description'",
    (row['new_meta_desc'], row['post_id'])
)
# 3. Ingredients — only if richer scraped version available
if row.get('new_ingredients_html'):
    cursor.execute(
        "UPDATE wp4h_postmeta SET meta_value = %s "
        "WHERE post_id = %s AND meta_key = '_emart_ingredients'",
        (row['new_ingredients_html'], row['post_id'])
    )
# 4. FAQ — only if old quality was poor/empty AND new FAQ was generated
if row.get('new_faq_text'):
    # Upsert: update if exists, insert if not
    cursor.execute(
        "SELECT meta_id FROM wp4h_postmeta "
        "WHERE post_id = %s AND meta_key = '_emart_product_faq'",
        (row['post_id'],)
    )
    existing = cursor.fetchone()
    if existing:
        cursor.execute(
            "UPDATE wp4h_postmeta SET meta_value = %s "
            "WHERE post_id = %s AND meta_key = '_emart_product_faq'",
            (row['new_faq_text'], row['post_id'])
        )
    else:
        cursor.execute(
            "INSERT INTO wp4h_postmeta (post_id, meta_key, meta_value) "
            "VALUES (%s, '_emart_product_faq', %s)",
            (row['post_id'], row['new_faq_text'])
        )
```

Log each row with timestamp. Output apply report: `workspace/audit/active/content-humanizer-applied-YYYYMMDD.csv`

### Step 5b: Update `post_modified` and flush WordPress cache (P1 fix)

Direct MySQL `UPDATE wp4h_posts` bypasses WordPress hooks — `post_modified` stays
at the old timestamp, WP object cache serves stale content to the WooCommerce REST
API, and Next.js re-fetches old descriptions after revalidation.

Add to every `post_content` UPDATE:

```python
from datetime import datetime, timezone

now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

cursor.execute(
    """UPDATE wp4h_posts
       SET post_content     = %s,
           post_modified     = %s,
           post_modified_gmt = %s
       WHERE ID = %s""",
    (row['new_content_html'], now_utc, now_utc, row['post_id'])
)
```

After each batch of 50 products, flush WordPress object cache:

```python
import subprocess

def flush_wp_cache():
    result = subprocess.run(
        ["wp", "cache", "flush", "--path=/var/www/wordpress", "--allow-root"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"  WP cache flush warning: {result.stderr.strip()}")
    else:
        print("  WP object cache flushed.")

# Call after every batch of 50 products
if batch_count % 50 == 0:
    flush_wp_cache()
```

### Step 6: Revalidate Next.js cache + llms.txt (P1 fix)

After all DB writes, run in this order:

**1. Flush WP cache one final time:**
```bash
wp cache flush --path=/var/www/wordpress --allow-root
```

**2. Revalidate Next.js ISR cache:**
```bash
curl -s -X POST https://e-mart.com.bd/api/revalidate \
  -H "x-revalidate-secret: $REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tag":"products"}'

curl -s -X POST https://e-mart.com.bd/api/revalidate \
  -H "x-revalidate-secret: $REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"path":"/"}'
```

**3. Regenerate Rank Math `llms.txt` (P1 fix — LLM indexing):**

Rank Math's `llms-txt` module generates `/llms.txt` from published content. After
bulk description updates it must be regenerated — otherwise LLMs indexing via
`llms.txt` see stale product data:

```bash
wp eval 'do_action("rank_math/llms_txt/generate");' \
  --path=/var/www/wordpress --allow-root
```

If that hook doesn't exist in your Rank Math version, trigger via REST:
```bash
curl -s -X POST https://e-mart.com.bd/wp-json/rankmath/v1/llmstxt/generate \
  -H "Authorization: Bearer $WP_APP_PASSWORD"
```

**4. Verify `llms.txt` updated:**
```bash
curl -s https://e-mart.com.bd/llms.txt | head -20
# Confirm timestamp and product content reflect new descriptions
```

Log all revalidation responses. ISR stale window is 0–60 min after revalidation — acceptable. `llms.txt` update is immediate.

---

## 7. Content generation using DeepSeek API (free tier)

Use the DeepSeek API. It is OpenAI-API-compatible, so use the `openai` Python library pointed at DeepSeek's base URL. **Cost: $0 on the free tier.**

### 7.1 Setup

```bash
pip install openai mysql-connector-python
```

Set the API key in environment before running (do NOT hardcode it):
```bash
export DEEPSEEK_API_KEY="your_deepseek_api_key_here"
```

Get a free API key at: https://platform.deepseek.com

### 7.2 Client initialisation

```python
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["DEEPSEEK_API_KEY"],
    base_url="https://api.deepseek.com"
)
```

### 7.3 Generation function

### 7.0 Current description extraction — take the good, flag the bad

Before calling DeepSeek, parse the existing `post_content` to extract any
genuinely useful content. Pass extracted facts into the prompt so DeepSeek
builds on real product knowledge rather than guessing from scratch.

```python
import re
from bs4 import BeautifulSoup

# Phrases that mark content as replaceable (not worth preserving)
REPLACE_SIGNALS = [
    # LLM openers
    r"get ready to", r"unlock the power", r"introducing", r"meet your",
    r"experience the power", r"elevate your", r"transform your routine",
    # Promotional closers
    r"don't miss out", r"order now", r"shop now", r"add to cart",
    r"upgrade your skincare", r"go-to destination",
    r"pride ourselves", r"hassle-free",
    # Price in body
    r"৳\s*[\d,]+",                  # ৳1,370 or ৳1370
    r"[\d,]+\s*taka",               # 1370 taka
    r"মাত্র ৳", r"price.*৳",        # Bengali price mentions
    # Generic "why buy from us" blocks
    r"why buy from emart", r"why choose emart",
    r"at emart, we pride", r"emart.verified",
    # Closing spam
    r"আজই অর্ডার করুন", r"এখনই অর্ডার",  # Bengali "order now"
]

KEEP_SIGNALS = [
    # Specific concentrations / percentages
    r"\d+%\s+\w+",                          # "96% snail mucin", "10% niacinamide"
    r"\d+\s*mg\b", r"\d+\s*ml\b",
    # Ingredient mechanisms (has both ingredient name + action)
    r"(glycolic|salicylic|niacinamide|retinol|hyaluronic|ceramide|peptide"
    r"|tranexamic|propolis|snail|argan|vitamin c|aha|bha|pha).{5,60}"
    r"(repair|fade|hydrat|barrier|pore|bright|firm|calm|sooth)",
    # Bangladesh-specific context (non-boilerplate)
    r"dhaka.{0,30}(pollution|humid|heat|weather|climate)",
    r"(bangladesh|bd).{0,40}(skin|hair|climate|weather)",
    # Timing / usage specifics
    r"\d+\s*(second|minute|hour|day|week)",  # "30 days", "2 weeks"
    r"every\s+(third|other|alternate)\s+(day|night)",
    # Award / sales claims
    r"best.sell", r"#1", r"bestseller", r"award",
    r"প্রতি \d+ সেকেন্ড",                    # Bengali "every X seconds"
]

def extract_reusable_content(post_content: str) -> dict:
    """
    Parse current post_content and return:
    {
      "keep_facts":    [str]  — specific facts worth preserving in rewrite
      "keep_how_to":  str    — existing How to Use steps if accurate
      "replace_all":  bool   — True if nothing is worth keeping
      "is_bengali":   bool   — True if majority of content is Bengali
      "has_price_in_body": bool
    }
    """
    soup = BeautifulSoup(post_content or "", "html.parser")
    plain = soup.get_text(separator=" ", strip=True)

    result = {
        "keep_facts": [],
        "keep_how_to": "",
        "replace_all": False,
        "is_bengali": False,
        "has_price_in_body": False,
    }

    # Detect Bengali content (Bengali Unicode block: ঀ-৿)
    bengali_chars = sum(1 for c in plain if 'ঀ' <= c <= '৿')
    result["is_bengali"] = bengali_chars > len(plain) * 0.15

    # Detect price in body
    result["has_price_in_body"] = bool(re.search(r'৳\s*[\d,]+', plain))

    # Check if entire description is boilerplate (under 200 chars meaningful content)
    meaningful = re.sub(r'\s+', ' ', re.sub(r'[^\w\s৳]', '', plain)).strip()
    if len(meaningful) < 200:
        result["replace_all"] = True
        return result

    # Extract keep-worthy sentences
    sentences = re.split(r'(?<=[.!?।])\s+', plain)
    for sentence in sentences:
        s = sentence.strip()
        if len(s) < 20:
            continue
        # Skip if contains a replace signal
        if any(re.search(sig, s, re.I) for sig in REPLACE_SIGNALS):
            continue
        # Keep if contains a high-value signal
        if any(re.search(sig, s, re.I) for sig in KEEP_SIGNALS):
            result["keep_facts"].append(s)

    # Extract How to Use section if it exists and looks accurate
    how_to_el = soup.find(["ol"], recursive=True)
    if how_to_el:
        steps = [li.get_text(strip=True) for li in how_to_el.find_all("li")]
        # Keep how-to if it has 3+ steps and any step mentions timing or amount
        if len(steps) >= 3 and any(
            re.search(r'\d+\s*(second|minute|drop|pump|pea)', s, re.I)
            for s in steps
        ):
            result["keep_how_to"] = "\n".join(f"{i+1}. {s}" for i, s in enumerate(steps))

    return result
```

Pass extracted content into the generation prompt:

```python
extracted = extract_reusable_content(product['post_content'])

existing_facts_section = ""
if extracted["keep_facts"]:
    facts = "\n".join(f"  - {f}" for f in extracted["keep_facts"][:6])
    existing_facts_section = f"""
VERIFIED FACTS FROM CURRENT DESCRIPTION (preserve these in the rewrite):
{facts}
These are accurate product-specific details already on the page.
Incorporate them naturally — do not copy the sentence verbatim,
but do not lose the factual information.
"""

existing_how_to_section = ""
if extracted["keep_how_to"] and not extracted["replace_all"]:
    existing_how_to_section = f"""
CURRENT HOW TO USE (accurate — reuse with minor wording improvements only):
{extracted['keep_how_to']}
"""

bengali_note = ""
if extracted["is_bengali"]:
    bengali_note = """
NOTE: Current description is in Bengali. Extract any factual content
(climate context, ingredient explanations, usage tips) and rewrite
everything in English. Retain the Bangladesh-specific insights.
"""
```

**Decision logic:**

| Condition | Action |
|-----------|--------|
| `replace_all = True` | Ignore current description entirely — generate from product data |
| `keep_facts` empty, `replace_all = False` | Use structure only — ignore body content |
| `keep_facts` has entries | Pass to prompt as "verified facts to preserve" |
| `keep_how_to` exists | Reuse steps with minor wording polish |
| `is_bengali = True` | Extract facts, translate context, rewrite in English |
| `has_price_in_body = True` | Remove price — do not carry into new description |

---

```python
import os, json, time
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["DEEPSEEK_API_KEY"],
    base_url="https://api.deepseek.com"
)

SYSTEM_PROMPT = """You are a senior product copywriter for Emart Skincare Bangladesh.
You write product descriptions that:
1. Are genuinely helpful to Bangladeshi shoppers
2. Differentiate each product from its siblings in the same brand line
3. Sound like they were written by a knowledgeable beauty advisor, not a content template
4. Pass Google's Helpful Content system because they add real value

Writing rules (MANDATORY — never break these):
- Vary sentence length. Mix short (8-12 word) and longer (18-28 word) sentences.
- Use contractions: it's, you'll, doesn't, isn't, that's
- Start up to 20% of sentences with And, But, It, This, or That
- Include one concrete specific detail (concentration, texture, scent, packaging fact, award, origin claim)
- Include Bangladesh context (climate, COD, import authenticity) woven naturally into the narrative
- Name the key differentiating ingredient in the first paragraph
- Explain what that specific ingredient does for this specific variant

BANNED words/phrases — never use any of these:
delve, dive deep, tapestry, realm, embark, testament, multifaceted, seamlessly, leverage,
revolutionize, game-changer, cutting-edge, state-of-the-art, comprehensive solution,
holistic approach, innovative formula, innovative blend, meticulously, unparalleled,
best-in-class, Furthermore, Moreover, In conclusion, In summary, It is worth noting,
It's important to note, powerhouse, skin-loving, transform your routine, elevate your skincare,
harness the power, unlock your potential, unleash the, experience the power

OUTPUT FORMAT — return ONLY valid JSON, no markdown fences, no extra text.
content_html MUST start with <p>, never <h2> (H1 is already on the page).
Use <h3> for all section headings inside the description.
Do NOT include a disclaimer block — the apply step appends it separately.

{"content_html": "<p>...</p><p>...</p><h3>Key Benefits</h3><ul>...</ul><h3>Who It's For</h3><p>...</p><h3>How to Use</h3><ol>...</ol><p>...</p>", "meta_desc": "130-160 char plain text"}"""


def build_user_prompt(
    product: dict,
    siblings: list[dict],
    skinnora_data: dict | None = None,
    gsc_queries: list[dict] | None = None,
    gmc_reasons: list[str] | None = None,
    safe_pairing_ref: str | None = None,
    extracted: dict | None = None,   # from extract_reusable_content()
) -> str:
    sibling_names = [s['title'] for s in siblings if s['post_id'] != product['post_id']]
    sibling_context = ""
    if sibling_names:
        lines = "\n".join(f"- {n}" for n in sibling_names[:5])
        sibling_context = f"\n\nSibling products in same brand line (differentiate from these):\n{lines}"

    # Existing description extraction
    existing_facts_section = ""
    existing_how_to_section = ""
    bengali_note = ""
    if extracted and not extracted.get("replace_all"):
        if extracted.get("keep_facts"):
            facts = "\n".join(f"  - {f}" for f in extracted["keep_facts"][:6])
            existing_facts_section = f"""
VERIFIED FACTS FROM CURRENT DESCRIPTION (preserve in rewrite — do not copy verbatim):
{facts}
"""
        if extracted.get("keep_how_to"):
            existing_how_to_section = f"""
CURRENT HOW TO USE (accurate — reuse with minor wording improvements only):
{extracted['keep_how_to']}
"""
        if extracted.get("is_bengali"):
            bengali_note = "NOTE: Current description is Bengali. Extract factual insights, rewrite everything in English.\n"

    # Skinnora research reference (Path A)
    skinnora_section = ""
    if skinnora_data:
        benefits_text = "\n".join(f"  - {b}" for b in skinnora_data.get("benefits", [])[:6])
        skinnora_section = f"""
COMPETITOR RESEARCH REFERENCE (skinnora.com — inspiration only, do NOT copy text):
Their description: {skinnora_data.get('description_plain', '')[:400]}
Their key benefits:
{benefits_text}
Their ingredients note: {skinnora_data.get('ingredients_raw', '')[:300]}
Your output must be ORIGINAL — different sentences, different structure.
Skinnora has zero Bangladesh context. Add it entirely from scratch.
"""

    # GSC keyword data — highest-confidence signal
    gsc_section = ""
    if gsc_queries:
        kw_lines = "\n".join(
            f"  {i+1}. \"{q['query']}\"  "
            f"(pos {q['position']}, {q['impressions']} impressions, {q['ctr']}% CTR)"
            for i, q in enumerate(gsc_queries[:5])
        )
        # Identify keyword gaps: queries not already present in current description
        current_plain = (product.get('post_content_plain') or '').lower()
        gaps = [q for q in gsc_queries[:5]
                if q['query'].lower() not in current_plain]
        gap_lines = "\n".join(f"  MISSING: \"{g['query']}\"" for g in gaps)

        gsc_section = f"""
REAL BANGLADESH SEARCH QUERIES (Google Search Console — last 90 days):
{kw_lines}

Keyword gaps — these queries are NOT in the current description, include them:
{gap_lines if gap_lines else "  (all top queries already present — maintain them)"}

Rules for keywords:
- Include each missing query phrase ONCE, naturally woven into a sentence
- Do not force — only add where it fits without sounding awkward
- Do not repeat any phrase more than once across description + meta
- The meta_desc MUST contain "price in Bangladesh" or "price at Emart"
"""

    # GMC disapproval fixes
    gmc_section = ""
    if gmc_reasons:
        reasons_text = ", ".join(gmc_reasons)
        gmc_section = f"""
GMC (Google Merchant Center) DISAPPROVAL REASONS: {reasons_text}
Fix these specific issues in the generated description so this product
can be approved for Google Shopping.
"""

    # Safe pairing reference
    pairing_note = ""
    if safe_pairing_ref:
        pairing_note = f"""
Safe pairing reference (competitor research — rewrite naturally, do NOT copy):
  "{safe_pairing_ref}"
"""

    return f"""Write a product description for this Emart product.

Product: {product['title']}
Brand: {product['brand']}
Country of origin: {product['origin']}
Skin/hair concerns: {', '.join(product.get('concerns', []))}
Category: {', '.join(product.get('categories', []))}
Stock: {product.get('stock_status', 'instock')}
Total sales: {product.get('total_sales', 0)}

Ingredients (from Emart data):
{product.get('ingredients_html') or 'Not available — infer from product title and brand knowledge'}

How to use (from Emart data):
{product.get('how_to_use_html') or 'Not available — write appropriate steps for this product type'}
{existing_facts_section}
{existing_how_to_section}
{bengali_note}
{sibling_context}
{skinnora_section}
{gsc_section}
{gmc_section}
{pairing_note}
Mandatory output rules:
1. Structure: NO <h2> opening — start directly with <p> opening hook (H1 already on page)
   Use <h3> for all section headings. Disclaimer in <aside> not <div>.
2. Key Benefits: "Benefit Label — Ingredient/mechanism explanation" (em dash, not colon)
3. Opening paragraph: name key differentiating ingredient within first 2 sentences
4. Sibling differentiation: explicitly state what THIS variant does differently
5. Bangladesh context: one signal — humidity/climate, authenticity, or COD — woven in naturally
6. Experience signal (E-E-A-T): one observational detail from use or examination —
   texture, pump behaviour, scent, set time, layering behaviour under SPF, packaging detail
7. Who It's For: name one skin/hair type to AVOID + the mechanism reason why
8. Claim attribution: any sales figure, bestseller, or award claim must say
   "According to [Brand]" or "As claimed by the manufacturer"
9. Pronoun clarity: after 2 "It"/"This" sentences, restate the product name
10. Pairing sentence (second paragraph): safe pairings ONLY —
    NEVER Vitamin C + AHA/BHA/PHA | NEVER retinol + acids/Vitamin C |
    NEVER benzoyl peroxide + retinol/Vitamin C | NEVER copper peptides + acids
11. Closing line: one sentence — authenticity/import claim, COD, or pairing tip
12. meta_desc: 130-160 chars · "price in Bangladesh" or "price at Emart" required ·
    second clause from product attribute · NOT "Buy" · NO ৳ price number"""


def generate_product_description(
    product: dict,
    siblings: list[dict],
    skinnora_data: dict | None = None,
    gsc_queries: list[dict] | None = None,
    gmc_reasons: list[str] | None = None,
    safe_pairing_ref: str | None = None,
    extracted: dict | None = None,   # P0 fix: was missing, causing extraction to be ignored
    retries: int = 3
) -> dict:
    """Returns {content_html, meta_desc} or raises after retries."""
    prompt = build_user_prompt(
        product, siblings, skinnora_data,
        gsc_queries, gmc_reasons, safe_pairing_ref,
        extracted   # P0 fix: now correctly passed to prompt builder
    )
    last_error = None

    for attempt in range(retries):
        try:
            response = client.chat.completions.create(
                model="deepseek-v4-flash",  # pinned — deepseek-chat alias retires 2026-07-24
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500,
                temperature=0.7,   # slight variation so sibling products don't feel identical
                response_format={"type": "json_object"}  # enforces JSON output
            )
            raw = response.choices[0].message.content.strip()
            result = json.loads(raw)
            # Minimal sanity check before returning
            if "content_html" not in result or "meta_desc" not in result:
                raise ValueError(f"Missing keys in response: {list(result.keys())}")
            return result
        except Exception as e:
            last_error = e
            wait = 5 * (attempt + 1)  # 5s, 10s, 15s back-off
            print(f"  Attempt {attempt+1} failed for product {product['post_id']}: {e}. Waiting {wait}s.")
            time.sleep(wait)

    raise RuntimeError(f"Failed after {retries} attempts for product {product['post_id']}: {last_error}")
```

### 7.4 Rate limiting for free tier

DeepSeek free tier limits: **~60 requests per minute, ~500K tokens per day**.

With ~3,500 products to enrich, process in daily batches of ~400 products (safe under token limit).

```python
import time

BATCH_SIZE = 20
SLEEP_BETWEEN_BATCHES = 3   # seconds between batches

def process_priority_queue(
    priority_queue:       list[dict],
    all_products_by_brand: dict,
    skinnora_match_map:   dict,   # {post_id_str: skinnora_data_dict}
    gsc_query_map:        dict,   # {"/shop/slug": [query_dicts]}
    gmc_status_map:       dict,   # {post_id_str: {status, reasons}}
    seen_second_clauses:  set,
) -> list[dict]:
    """
    Full orchestrator — passes ALL data sources to generate_product_description.
    Previously called process_brand_group and passed only 2 args;
    that silently discarded every Step 0/0A/0B signal.
    """
    results = []

    for i in range(0, len(priority_queue), BATCH_SIZE):
        batch = priority_queue[i:i + BATCH_SIZE]

        for product in batch:
            pid      = str(product['post_id'])
            slug     = product.get('slug', '')
            siblings = all_products_by_brand.get(product.get('brand', ''), [])

            # Gather all signal sources for this product
            skinnora_data  = skinnora_match_map.get(pid)
            gsc_queries    = gsc_query_map.get(f"/shop/{slug}", [])
            gmc_info       = gmc_status_map.get(pid, {})
            gmc_reasons    = gmc_info.get('reasons', [])
            safe_pairing   = get_safe_pairing_reference(
                (skinnora_data or {}).get('pairing_candidates', []),
                get_product_active_ingredients(product)
            )
            extracted      = extract_reusable_content(
                product.get('post_content', '')
            )

            # Re-run guard: skip if already humanized within last 30 days
            if product.get('already_humanized'):
                results.append({**product, 'status': 'skipped:already_humanized'})
                continue

            try:
                generated = generate_product_description(
                    product       = product,
                    siblings      = siblings,
                    skinnora_data = skinnora_data,
                    gsc_queries   = gsc_queries,
                    gmc_reasons   = gmc_reasons,
                    safe_pairing_ref = safe_pairing,
                    extracted     = extracted,
                )

                # Validate meta
                v_result = validate_meta_desc(
                    generated['meta_desc'], product, seen_second_clauses
                )
                if not v_result.passed:
                    # One retry with error context
                    retry_note = (
                        "\n\nYour previous meta failed validation:\n"
                        + "\n".join(f"- {e}" for e in v_result.errors)
                    )
                    generated = generate_product_description(
                        product, siblings, skinnora_data, gsc_queries,
                        gmc_reasons, safe_pairing, extracted,
                        retry_note=retry_note
                    )
                    v_result = validate_meta_desc(
                        generated['meta_desc'], product, seen_second_clauses
                    )

                results.append({
                    **product,
                    **generated,
                    'status':         'ok' if v_result.passed else 'meta_failed',
                    'meta_errors':    v_result.errors,
                    'meta_warnings':  v_result.warnings,
                    'skinnora_match': bool(skinnora_data),
                    'gsc_query_count': len(gsc_queries),
                    'gmc_status':     gmc_info.get('status', 'unknown'),
                })
            except Exception as e:
                results.append({
                    **product,
                    'content_html': '', 'meta_desc': '',
                    'status': f'error: {e}',
                })

        print(f"  Batch {i//BATCH_SIZE + 1}/{-(-len(priority_queue)//BATCH_SIZE)} done. "
              f"Sleeping {SLEEP_BETWEEN_BATCHES}s.")
        time.sleep(SLEEP_BETWEEN_BATCHES)

    return results
```

### 7.5 Model name and token budget

```
Model:   deepseek-v4-flash
         — pin the explicit version, do NOT use deepseek-chat alias.
         — deepseek-chat and deepseek-reasoner aliases retire 2026-07-24
           and will error with no fallback after that date.

Tokens:  ~3,500 products × ~800 tokens = ~2.8M tokens total
         DeepSeek gives a one-time 5M free token grant on new accounts,
         then pay-as-you-go. The entire catalog fits in ONE run on the
         free grant — no daily pacing needed.
         If the grant is already spent: ~$1 at paid tier rates.
         The previous "spread across 6 days" note was wrong — it was
         solving a constraint (500K/day quota) that does not exist.
```

Update the `model=` line in `client.chat.completions.create`:
```python
model="deepseek-v4-flash",   # pinned — do not use "deepseek-chat" alias
```

---

## 8. Quality validation before DB write

Before writing any generated content to DB, validate each item:

```python
from bs4 import BeautifulSoup

def strip_html(html: str) -> str:
    """Strip HTML tags and collapse whitespace — previously undefined, caused NameError."""
    if not html:
        return ""
    return re.sub(r'\s+', ' ',
        BeautifulSoup(html, 'html.parser').get_text(separator=' ')
    ).strip()


def validate_generated_content(product: dict, generated: dict) -> list[str]:
    """
    Returns list of hard errors. Empty list = pass.
    Mirrors the retry pattern of validate_meta_desc.
    """
    errors = []
    content = generated.get('content_html') or ''
    meta    = generated.get('meta_desc') or ''
    plain   = strip_html(content)

    # Content length
    if len(plain) < 300:
        errors.append(f"content too short: {len(plain)} chars (min 300)")

    # Brand presence — guard None (products with no pa_brand term)
    brand = (product.get('brand') or '').strip().lower()
    if brand and brand not in plain.lower():
        errors.append(f"brand name '{brand}' missing from content")

    # No <h2> opener (H1 already on page — system prompt fix)
    if re.search(r'^\s*<h2', content, re.I):
        errors.append("<h2> opener found — content must start with <p>")

    # Disclaimer must NOT be in content (apply step appends it)
    if 'product-disclaimer' in content or '<aside' in content.lower():
        errors.append("disclaimer block found in content — remove; apply step appends it")

    # Banned words
    BANNED = [
        'delve', 'seamlessly', 'leverage', 'revolutionize', 'game-changer',
        'cutting-edge', 'Furthermore', 'Moreover', 'In conclusion', 'In summary',
        'multifaceted', 'meticulous', 'unparalleled', 'best-in-class',
        'tapestry', 'realm of', 'embark', 'testament to',
        'comprehensive solution', 'innovative formula', 'holistic approach',
    ]
    for word in BANNED:
        if word.lower() in plain.lower():
            errors.append(f"banned word: '{word}'")

    return errors


def validate_and_retry_content(
    product: dict,
    generated: dict,
    generate_fn,       # callable — generate_product_description with all args bound
) -> tuple[dict, list[str]]:
    """
    Validates content; retries once with error context if it fails.
    Returns (final_generated_dict, final_errors).
    """
    errors = validate_generated_content(product, generated)
    if not errors:
        return generated, []

    retry_note = (
        "\n\nYour previous content failed validation:\n"
        + "\n".join(f"- {e}" for e in errors)
        + "\nFix all listed issues in your next response."
    )
    generated2 = generate_fn(retry_note=retry_note)
    errors2    = validate_generated_content(product, generated2)
    return generated2, errors2
```

Items that fail both attempts are written to `validation_failures.json` for manual review. Do not skip them silently.

---

## 9. Product-specific instructions by origin group

### South Korean products (majority of catalog)
- Reference "sourced from South Korea" authenticity
- Mention K-beauty specific context when relevant (10-step routine origin, glass skin, etc.)
- Avoid over-using "K-beauty" as a filler — use actual Korean formulation context

### Indian products (The Derma Co, Minimalist, etc.)
- Do NOT say "imported from Korea" or "Korean" — verified error from prior audit
- Reference "Indian dermatology-backed formula" or "clinically tested in India"
- Mention the science-first, ingredient-focused positioning of Indian brands

### USA/European products (CeraVe, Neutrogena, La Roche-Posay, etc.)
- Reference dermatologist-tested or clinically-validated claims (these brands own these claims)
- Mention fragrance-free, sensitive skin, or allergy-tested where applicable

### Bangladeshi products
- Say "locally produced in Bangladesh"
- Reference Emart's direct relationship with the brand/manufacturer if known

---

## 10. Do NOT touch

- checkout, cart, payment, order, customer, stock, price logic
- WooCommerce order meta
- Any product with `post_status != 'publish'`
- Product slugs / URLs (`post_name` field) — changing slugs breaks all existing inbound links
- Product images
- Product categories structure
- `_rank_math_focus_keyword` — leave as-is; it drives Rank Math's schema keyword output
- Products with `total_sales > 20` — flag in audit CSV as `skip_auto=True`, print count in summary, do NOT generate

High-sales products need manual review — do not auto-enrich them.

## 10a. Gradual rollout — mandatory (E-E-A-T signal)

**Do NOT apply all 3,640 products in one batch.**

Google's quality systems detect abrupt site-wide content uniformity as a bulk-generation signal — the same signal the current template content is penalised for, just in a different direction. Replacing 3,640 descriptions overnight with 3,640 descriptions that all follow the same new structure is still a pattern.

**Rollout cap: 300–400 products per week maximum.**

Priority order (from Step 0C priority queue):
1. Week 1: GMC disapproved products (unblocks Shopping revenue)
2. Week 2: GSC pos 5–20 / CTR < 2% / imp > 100 (quick ranking wins)
3. Week 3+: Remaining thin/template content, brand by brand

This pacing looks like ongoing editorial work to Google's crawlers — not a bulk replacement event.

## 10b. `pa_brand` → schema `brand` field (agentic shopping fix)

After applying descriptions, add the product's brand to Rank Math's schema `additionalProperty` for agentic shopping compatibility. Rank Math WooCommerce module does not automatically map `pa_brand` taxonomy to `"brand": {"@type": "Brand", "name": "..."}`.

Add to the apply step per product:

```python
import json

def upsert_rank_math_schema_brand(cursor, post_id: int, brand_name: str):
    """
    Adds brand to _rank_math_schema_data so JSON-LD includes:
    "brand": {"@type": "Brand", "name": "CosRx"}
    Required for agentic shopping agents to attribute products correctly.
    """
    cursor.execute(
        "SELECT meta_value FROM wp4h_postmeta "
        "WHERE post_id = %s AND meta_key = '_rank_math_schema_data'",
        (post_id,)
    )
    row = cursor.fetchone()
    if row and row[0]:
        try:
            schema = json.loads(row[0])
        except Exception:
            schema = {}
    else:
        schema = {}

    # Inject brand — Rank Math reads this during schema output
    schema.setdefault("Product", {})["brand"] = {
        "@type": "Brand",
        "name": brand_name
    }

    cursor.execute(
        "INSERT INTO wp4h_postmeta (post_id, meta_key, meta_value) "
        "VALUES (%s, '_rank_math_schema_data', %s) "
        "ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)",
        (post_id, json.dumps(schema))
    )
```

Run for every product in the apply step. Brand name comes from the `pa_brand` taxonomy pulled in Section 2.

---

## 11. Files to create

```
workspace/scripts/active/config.py                      ← shared config (DATE_END, DB, API keys)
workspace/scripts/active/skinnora_scrape.py             ← Step 0 scraper
workspace/scripts/active/gsc_pull.py                    ← Step 0A GSC data
workspace/scripts/active/gmc_pull.py                    ← Step 0B GMC status
workspace/scripts/active/content_humanizer_audit.py     ← Step 1 audit + scoring
workspace/scripts/active/content_humanizer_generate.py  ← Step 2 generation (DeepSeek)
workspace/scripts/active/content_humanizer_apply.py     ← Step 5 DB write + cache flush
workspace/audit/active/skinnora-scrape-raw-YYYYMMDD.json
workspace/audit/active/skinnora-catalog-matches-YYYYMMDD.csv
workspace/audit/active/gsc-query-map-YYYYMMDD.json
workspace/audit/active/gmc-status-YYYYMMDD.json
workspace/audit/active/content-humanizer-priority-queue-YYYYMMDD.csv
workspace/audit/active/content-humanizer-scores-YYYYMMDD.csv
workspace/audit/active/content-humanizer-generated-YYYYMMDD.csv    ← owner reviews this
workspace/audit/active/content-humanizer-rollback-YYYYMMDD.json
workspace/audit/active/content-humanizer-applied-YYYYMMDD.csv
workspace/audit/active/content-humanizer-validation-failures.csv
```

All paths relative to `/var/www/emart-platform/`.

---

## 12. Session end requirements

After completing any step, append to `/var/www/emart-platform/apps/web/SESSION-LOG.md`:

```
## YYYY-MM-DD — Content Humanizer [Step N]
- Products audited: N
- Products flagged for enrichment: N
- Products generated: N  
- Products applied: N
- Validation failures: N (see validation-failures.csv)
- Rollback: workspace/audit/active/content-humanizer-rollback-YYYYMMDD.json
- Next step: [describe next step or DONE]
```

Update `workspace/TASKS.md` to reflect progress.

---

## 13. Summary of what success looks like

After this task is complete:
- Zero products share more than 50% of their description text with a sibling product
- All flagged thin products have 300+ characters of unique, specific, human-written-feeling content
- All meta descriptions are 130–160 chars, start with a specific claim, and don't include price
- The word "seamlessly" and all other banned phrases are gone from the entire product catalog
- Google can crawl each product page and find distinct, useful content that differentiates it from every other product on the site

This directly addresses the mass-content penalty signal without changing any URLs, redirects, or site structure.
