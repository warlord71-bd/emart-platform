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
Host:     localhost
DB name:  emart_live
User:     emart_user
Password: Emart@123456
Table prefix: wp4h_
```

Python connection:
```python
import mysql.connector
conn = mysql.connector.connect(
    host='localhost', database='emart_live',
    user='emart_user', password='Emart@123456'
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
  p.ID, p.post_title, p.post_content,
  MAX(CASE WHEN pm.meta_key = '_emart_ingredients' THEN pm.meta_value END) as ingredients,
  MAX(CASE WHEN pm.meta_key = '_emart_how_to_use' THEN pm.meta_value END) as how_to_use,
  MAX(CASE WHEN pm.meta_key = '_rank_math_description' THEN pm.meta_value END) as meta_desc,
  MAX(CASE WHEN pm.meta_key = '_rank_math_focus_keyword' THEN pm.meta_value END) as focus_keyword,
  MAX(CASE WHEN pm.meta_key = '_regular_price' THEN pm.meta_value END) as regular_price,
  MAX(CASE WHEN pm.meta_key = '_price' THEN pm.meta_value END) as price,
  MAX(CASE WHEN pm.meta_key = '_sku' THEN pm.meta_value END) as sku,
  MAX(CASE WHEN pm.meta_key = '_stock_status' THEN pm.meta_value END) as stock_status,
  MAX(CASE WHEN pm.meta_key = 'total_sales' THEN pm.meta_value END) as total_sales
FROM wp4h_posts p
JOIN wp4h_postmeta pm ON pm.post_id = p.ID
WHERE p.post_type = 'product' AND p.post_status = 'publish'
GROUP BY p.ID, p.post_title, p.post_content;
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

**Do NOT scrape:** Routine Builder, Related Products, FAQ tab, Reviews, pairing suggestions.

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
    """Build the disclaimer div to append at the end of post_content."""
    if not disclaimer_text and not product:
        # Minimal safe default when no scrape data available
        return """<div class="product-disclaimer">
<p><strong>Before Use:</strong> Patch test recommended — apply a small amount to your inner wrist and wait 24 hours before full use, especially for sensitive skin.</p>
<p><strong>Storage:</strong> Store in a cool, dry place away from direct sunlight. Keep out of reach of children. Check expiry date printed on the packaging before use.</p>
</div>"""

    fields = parse_disclaimer(disclaimer_text, product)
    return f"""<div class="product-disclaimer">
<p><strong>Before Use:</strong> Patch test recommended — apply a small amount to your inner wrist or behind the ear and wait 24 hours before full use, especially if you have sensitive or reactive skin.</p>
<p><strong>Shelf Life &amp; Storage:</strong> {fields['shelf_life_text']}. Store in a cool, dry place away from direct sunlight. Keep out of reach of children.</p>
<p><strong>Packaging:</strong> {fields['packaging_text']}. Expiry date printed on {fields['packaging_location']}.</p>
</div>"""
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

def score_emart_faq_quality(faq_raw: str) -> str:
    """
    Returns 'good', 'poor', or 'empty'.
    'good'  → keep Emart FAQ, do not overwrite
    'poor'  → replace with Skinnora FAQ (rewritten)
    'empty' → write Skinnora FAQ (rewritten)
    """
    if not faq_raw or len(faq_raw.strip()) < 50:
        return "empty"

    import json, re
    try:
        items = json.loads(faq_raw) if faq_raw.startswith("[") else []
    except Exception:
        items = []

    if not items:
        return "poor"

    # Count questions that are product-specific vs generic delivery/payment
    product_specific = 0
    generic_count = 0
    for item in items:
        q = (item.get("question") or item.get("q") or "").lower()
        a = (item.get("answer") or item.get("a") or "")
        if any(sig in q for sig in FAQ_GENERIC_SIGNALS):
            generic_count += 1
        elif len(a) > 60:
            product_specific += 1

    if product_specific >= 3:
        return "good"      # 3+ product-specific Q&As with real answers → keep
    if product_specific >= 1:
        return "poor"      # Some content but mostly generic → replace
    return "poor"          # All generic or all short → replace
```

When FAQ quality is `poor` or `empty` and Skinnora has FAQ items:

1. Filter out any Skinnora FAQ questions about delivery, payment, returns, or shipping — Emart's FAQ policy (per project rules) covers only product-focused questions
2. Rewrite remaining questions and answers in Emart's voice — do not copy verbatim
3. Add Bangladesh context where natural (e.g., "Is this safe for use in Dhaka's humid climate?")
4. Format output as JSON matching Emart's `_emart_product_faq` structure:

```python
def rewrite_faq_for_emart(faq_items: list[dict], product: dict, client) -> str:
    """
    Takes Skinnora FAQ items, filters delivery/payment questions,
    rewrites remaining in Emart's voice with Bangladesh context.
    Returns JSON string for _emart_product_faq.
    """
    # Filter out delivery/payment/shipping questions
    delivery_signals = [
        "delivery", "shipping", "return", "refund", "payment", "cash on delivery",
        "cod", "bkash", "order", "track", "dispatch", "courier"
    ]
    product_faqs = [
        item for item in faq_items
        if not any(sig in (item.get("q") or "").lower() for sig in delivery_signals)
    ]

    if not product_faqs:
        return ""   # Nothing usable — caller keeps existing FAQ

    faq_text = "\n".join(
        f"Q: {item['q']}\nA: {item['a']}" for item in product_faqs[:5]
    )

    prompt = f"""Rewrite these FAQ items for {product['title']} sold at Emart Skincare Bangladesh.
Rules:
- Rewrite each question and answer in original words — do not copy verbatim
- Keep answers product-specific (ingredients, usage, skin type suitability)
- Add Bangladesh context to one answer where it fits naturally (humidity, skin type common in BD)
- Do NOT include questions about delivery, payment, returns, or COD
- Maximum 5 Q&A pairs
- Return ONLY a JSON array: [{{"q": "...", "a": "..."}}, ...]

Source FAQ to rewrite:
{faq_text}"""

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800,
        temperature=0.5,
        response_format={"type": "json_object"}
    )
    import json
    raw = response.choices[0].message.content.strip()
    parsed = json.loads(raw)
    # Handle both {"faqs": [...]} and [...] response shapes
    if isinstance(parsed, list):
        return json.dumps(parsed, ensure_ascii=False)
    if isinstance(parsed, dict):
        for key in ("faqs", "faq", "items", "questions"):
            if key in parsed and isinstance(parsed[key], list):
                return json.dumps(parsed[key], ensure_ascii=False)
    return ""
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

```html
<h2>{product_title}</h2>
<p>{opening_hook}</p>
<h3>Key Benefits</h3>
<ul>
  <li>{benefit_1}</li>
  <li>{benefit_2}</li>
  <li>{benefit_3}</li>
  [up to 6 bullets, each must be specific to THIS product]
</ul>
<h3>Who It's For</h3>
<p>{target_audience_paragraph}</p>
{how_to_use_section_if_available}
<p>{closing_trust_line}</p>
```

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
| Default (none of the above apply) | `Imported from [origin] — price in Bangladesh at Emart, COD available.` |

The "price in Bangladesh" phrase stays in every meta. Everything around it changes per product.

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

### 5.6 Validation in code

```python
def validate_meta_desc(meta: str, product: dict, seen_second_clauses: set) -> list[str]:
    """
    Returns list of errors. Empty list = pass.
    seen_second_clauses: set of second clause strings already used this run
                         (pass across all products to catch duplicates)
    """
    errors = []
    m = meta.strip()
    m_lower = m.lower()

    # Length
    if len(m) < 130:
        errors.append(f"too short: {len(m)} chars (min 130)")
    if len(m) > 160:
        errors.append(f"too long: {len(m)} chars (max 160)")

    # Banned patterns
    if m_lower.startswith("buy "):
        errors.append("starts with 'Buy'")
    if "৳" in m:
        errors.append("contains ৳ price symbol — remove price number")
    if "original " in m_lower and any(
        cat.lower() in m_lower for cat in product.get("categories", [])
    ):
        errors.append("contains 'Original [Category]' filler")

    # Required: price in Bangladesh keyword
    if not any(p in m_lower for p in ["price in bangladesh", "price at emart"]):
        errors.append("MISSING 'price in Bangladesh' keyword phrase — required for search volume")

    # Required: Emart brand
    if "emart" not in m_lower:
        errors.append("missing 'Emart'")

    # Duplicate second clause check
    # Split on ". " or " — " to isolate second clause
    parts = re.split(r'\.\s+|\s+—\s+', m, maxsplit=1)
    if len(parts) == 2:
        second = parts[1].strip().lower()
        if second in seen_second_clauses:
            errors.append(f"duplicate second clause already used: '{second[:60]}'")
        else:
            seen_second_clauses.add(second)

    return errors
```

Usage across the batch:
```python
seen_second_clauses = set()   # shared across all products in the run

for product in products_to_enrich:
    generated = generate_product_description(product, ...)
    meta_errors = validate_meta_desc(
        generated['meta_desc'], product, seen_second_clauses
    )
    if meta_errors:
        # Retry generation once with explicit instruction to fix the errors
        # If retry still fails → write to validation_failures.csv, skip
        ...
```

---

## 6. Execution plan — step by step

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
new_content_html,
old_ingredients (first 100 chars),
new_ingredients_html (Path A only — blank if skipped),
old_faq_quality (good/poor/empty),
new_faq_json (blank if old was 'good' or no Skinnora FAQ available),
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
if row.get('new_faq_json'):
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
            (row['new_faq_json'], row['post_id'])
        )
    else:
        cursor.execute(
            "INSERT INTO wp4h_postmeta (post_id, meta_key, meta_value) "
            "VALUES (%s, '_emart_product_faq', %s)",
            (row['post_id'], row['new_faq_json'])
        )
```

Log each row with timestamp. Output apply report: `workspace/audit/active/content-humanizer-applied-YYYYMMDD.csv`

### Step 6: Revalidate Next.js cache

After all DB writes:
```bash
curl -s -X POST https://e-mart.com.bd/api/revalidate \
  -H "x-revalidate-secret: $REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tag":"products"}'
```

Then also revalidate the homepage:
```bash
curl -s -X POST https://e-mart.com.bd/api/revalidate \
  -H "x-revalidate-secret: $REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"path":"/"}'
```

Log revalidation response. If it fails, note it — the ISR will serve stale content for up to 1hr, but it won't break anything.

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

OUTPUT FORMAT — return ONLY valid JSON, no markdown fences, no extra text:
{"content_html": "<h2>...</h2><p>...</p><h3>Key Benefits</h3><ul>...</ul><h3>Who It's For</h3><p>...</p><p>...</p>", "meta_desc": "130-160 char plain text"}"""


def build_user_prompt(
    product: dict,
    siblings: list[dict],
    skinnora_data: dict | None = None   # Path A only; None for Path B
) -> str:
    sibling_names = [s['title'] for s in siblings if s['id'] != product['id']]
    sibling_context = ""
    if sibling_names:
        lines = "\n".join(f"- {n}" for n in sibling_names[:5])
        sibling_context = f"\n\nSibling products in the same brand line (differentiate from these):\n{lines}"

    # Path A: include Skinnora content as research reference
    skinnora_section = ""
    if skinnora_data:
        benefits_text = "\n".join(f"  - {b}" for b in skinnora_data.get("benefits", [])[:6])
        skinnora_section = f"""
COMPETITOR RESEARCH REFERENCE (skinnora.com — inspiration only, do NOT copy text):
Their description: {skinnora_data.get('description_plain', '')[:400]}
Their key benefits:
{benefits_text}
Their ingredients note: {skinnora_data.get('ingredients_plain', '')[:300]}

Use this as a quality/depth reference. Your output must be ORIGINAL — different sentences,
different structure, written for Bangladeshi shoppers at Emart.
Skinnora has zero Bangladesh context. You must add that entirely from scratch.
Do NOT copy any sentence verbatim. Do NOT adopt their pairing suggestions without verifying
they are ingredient-safe per the compatibility rules in rule 6 below.
"""

    return f"""Write a product description for this Emart product.

Product: {product['title']}
Brand: {product['brand']}
Country of origin: {product['origin']}
Skin/hair concerns: {', '.join(product['concerns'])}
Category: {', '.join(product['categories'])}
Stock: {product['stock_status']}
Total sales: {product['total_sales']}

Ingredients (from Emart data):
{product.get('ingredients_html') or 'Not available — infer from product title and brand knowledge'}

How to use (from Emart data):
{product.get('how_to_use_html') or 'Not available — write appropriate steps for this product type'}
{sibling_context}
{skinnora_section}
Mandatory output rules:
1. Key Benefits format: "Benefit Label — Ingredient/mechanism explanation" (em dash, not colon)
2. Opening paragraph: name the key differentiating ingredient within the first 2 sentences
3. Sibling differentiation: if siblings listed, state explicitly what THIS variant does differently
4. Bangladesh context: weave in one signal — humidity/climate, import authenticity, or COD
5. Who It's For: name one skin/hair type that should AVOID this product
6. Pairing sentence in body (second paragraph): safe pairings ONLY —
   NEVER pair Vitamin C with AHA/BHA/PHA | NEVER pair retinol with acids or Vitamin C |
   NEVER pair benzoyl peroxide with retinol or Vitamin C | NEVER pair copper peptides with acids
   Safe defaults: ceramide moisturiser, hyaluronic acid serum, SPF sunscreen, niacinamide serum
7. Closing line: authenticity/import claim, COD availability, or safe pairing tip
8. meta_desc: 130-160 chars, starts with specific product claim, NOT with word "Buy", no price"""


def generate_product_description(
    product: dict,
    siblings: list[dict],
    skinnora_data: dict | None = None,
    retries: int = 3
) -> dict:
    """Returns {content_html, meta_desc} or raises after retries."""
    prompt = build_user_prompt(product, siblings, skinnora_data)
    last_error = None

    for attempt in range(retries):
        try:
            response = client.chat.completions.create(
                model="deepseek-chat",  # DeepSeek-V3/V4 alias — update to "deepseek-v4" if released
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
            print(f"  Attempt {attempt+1} failed for product {product['id']}: {e}. Waiting {wait}s.")
            time.sleep(wait)

    raise RuntimeError(f"Failed after {retries} attempts for product {product['id']}: {last_error}")
```

### 7.4 Rate limiting for free tier

DeepSeek free tier limits: **~60 requests per minute, ~500K tokens per day**.

With ~3,500 products to enrich, process in daily batches of ~400 products (safe under token limit).

```python
import time

BATCH_SIZE = 20          # products per batch
SLEEP_BETWEEN_BATCHES = 3  # seconds — stays well under 60 RPM

def process_brand_group(products: list[dict], all_products_by_brand: dict):
    results = []
    for i in range(0, len(products), BATCH_SIZE):
        batch = products[i:i + BATCH_SIZE]
        for product in batch:
            siblings = all_products_by_brand.get(product['brand'], [])
            try:
                generated = generate_product_description(product, siblings)
                results.append({**product, **generated, 'status': 'ok'})
            except Exception as e:
                results.append({**product, 'content_html': '', 'meta_desc': '', 'status': f'error: {e}'})
        print(f"  Batch {i//BATCH_SIZE + 1} done. Sleeping {SLEEP_BETWEEN_BATCHES}s.")
        time.sleep(SLEEP_BETWEEN_BATCHES)
    return results
```

### 7.5 Model name note

- Current stable alias: `"deepseek-chat"` (maps to the latest DeepSeek-V3 or V4 automatically)
- If DeepSeek releases an explicit `"deepseek-v4"` model ID, update the `model=` line
- Check the current model list at: https://platform.deepseek.com/api-docs
- Do NOT use `deepseek-reasoner` (DeepSeek-R1) — it is a reasoning model and will be slow and expensive for this batch use case; `deepseek-chat` is the right choice

### 7.6 Token budget estimate

- ~3,500 products × ~800 tokens average (prompt + completion) = ~2.8M tokens
- DeepSeek free tier: 500K tokens/day → run across **6 days** in daily batches
- Alternatively: upgrade to DeepSeek paid tier (~$0.14/1M tokens input, ~$0.28/1M output) for ~$1 total to do it all at once
- Either way: **$0 on free tier** if spread across 6 days

---

## 8. Quality validation before DB write

Before writing any generated content to DB, validate each item:

```python
def validate_generated_content(product: dict, generated: dict) -> list[str]:
    """Returns list of validation errors. Empty list = pass."""
    errors = []
    content = generated['content_html']
    meta = generated['meta_desc']
    plain = strip_html(content)

    # Content checks
    if len(plain) < 300:
        errors.append("content too short (< 300 chars)")
    if product['brand'].lower() not in plain.lower():
        errors.append("brand name missing from content")
    if meta.lower().startswith('buy '):
        errors.append("meta_desc starts with 'Buy'")
    if len(meta) < 130 or len(meta) > 160:
        errors.append(f"meta_desc length {len(meta)} not in 130-160")
    if '৳' in meta:
        errors.append("price in meta_desc (must be removed)")

    # Banned word check
    banned = ['delve','seamlessly','leverage','revolutionize','game-changer',
              'cutting-edge','Furthermore','Moreover','In conclusion','In summary',
              'multifaceted','meticulous','unparalleled','best-in-class',
              'tapestry','realm of','embark','testament to']
    for word in banned:
        if word.lower() in plain.lower() or word.lower() in meta.lower():
            errors.append(f"banned word found: '{word}'")

    return errors
```

Items that fail validation are written to a `validation_failures.csv` for manual review. Do not skip them silently.

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
- Product slugs / URLs (post_name field)
- Product images
- Product categories structure
- `_rank_math_focus_keyword` (leave as-is)
- Products with `total_sales > 20` — these are performing products; flag them in the CSV but skip enrichment unless explicitly approved

High-sales products (total_sales > 20) need manual review — do not auto-enrich them.

---

## 11. Files to create

```
workspace/scripts/active/content_humanizer_audit.py     ← Step 1 script
workspace/scripts/active/content_humanizer_generate.py  ← Step 2 script
workspace/scripts/active/content_humanizer_apply.py     ← Step 5 script
workspace/audit/active/content-humanizer-scores-YYYYMMDD.csv       ← Step 1 output
workspace/audit/active/content-humanizer-generated-YYYYMMDD.csv    ← Step 2 output (for review)
workspace/audit/active/content-humanizer-rollback-YYYYMMDD.json    ← Step 4 output
workspace/audit/active/content-humanizer-applied-YYYYMMDD.csv      ← Step 5 output
workspace/audit/active/content-humanizer-validation-failures.csv   ← Validation errors
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
