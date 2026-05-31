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

The `_rank_math_description` field (max 160 chars) currently follows a rigid template:
> "Buy [product] for ৳[price] in Bangladesh. Original [category]. Fast delivery & COD available at Emart."

This pattern is flagged by Google as programmatic. Enrich it to follow this structure instead:

**Format:** `[Specific product claim, 50–80 chars]. [Why buy here / urgency / BD context, 40–60 chars].`

Good examples:
- `COSRX's 96% snail mucin essence visibly plumps and repairs skin in 2 weeks. Authentic Korean import, COD available across Bangladesh.`
- `CeraVe's SPF30 mineral tint suits medium skin tones without the white cast. Dermatologist-trusted formula — fast delivery from Emart.`
- `Kerasys Propolis Shampoo targets scalp bacteria while deeply conditioning damaged hair. South Korean import, Cash on Delivery at Emart.`

Bad (current template — do not use):
- `Buy Kerasys Propolis Damage Repair Shampoo 1000ml for ৳890 in Bangladesh. Original Korean Beauty. Fast delivery & COD available at Emart.`

Meta description rules:
- Must be 130–160 characters
- Must include the product's key differentiating benefit (not just the product name)
- Must include one of: country of origin, COD mention, "Emart", or delivery mention
- Must NOT start with "Buy"
- Must NOT use price in the meta (prices change; stale meta misleads click-through)

---

## 6. Execution plan — step by step

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
5. Write to CSV

**Run this first. Do not generate any content yet.**

### Step 2: Generate enriched descriptions (batch by brand group)

Process products grouped by `pa_brand` so that sibling variant differentiation is handled correctly. For each brand group:

1. Pull all sibling products in the group
2. Identify the variant-differentiating ingredient per product (parse from title or `_emart_ingredients`)
3. For each product needing enrichment (score ≥ 2), generate:
   - New `post_content` (HTML, using structure in Section 4.1)
   - New `_rank_math_description` (plain text, 130–160 chars, following Section 5)
4. Write generated content to a **review CSV** — do NOT write to DB yet

Review CSV columns:
```
post_id, post_title, brand, origin, concern, score,
old_content_plain_text (first 200 chars),
new_content_html,
old_meta_desc,
new_meta_desc,
change_reason
```

Output: `workspace/audit/active/content-humanizer-generated-YYYYMMDD.csv`

### Step 3: Owner review checkpoint

**STOP HERE.** Output the review CSV path. Do not proceed to Step 4 without explicit approval.

Message: "Content generated for {N} products. Review CSV at workspace/audit/active/content-humanizer-generated-YYYYMMDD.csv before I apply. Approve to proceed."

### Step 4: Generate rollback JSON

Before writing anything to the DB, capture current state:
```python
# workspace/audit/active/content-humanizer-rollback-YYYYMMDD.json
# Format: [{post_id, old_post_content, old_rank_math_description}, ...]
```

### Step 5: Apply approved content to DB

For each approved row in the review CSV:
1. UPDATE `wp4h_posts` SET `post_content` = new_content WHERE `ID` = post_id
2. UPDATE `wp4h_postmeta` SET `meta_value` = new_meta WHERE `post_id` = post_id AND `meta_key` = '_rank_math_description'
3. Log each row as applied with timestamp

Output apply report: `workspace/audit/active/content-humanizer-applied-YYYYMMDD.csv`

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


def build_user_prompt(product: dict, siblings: list[dict]) -> str:
    sibling_names = [s['title'] for s in siblings if s['id'] != product['id']]
    sibling_context = ""
    if sibling_names:
        lines = "\n".join(f"- {n}" for n in sibling_names[:5])
        sibling_context = f"\n\nSibling products in the same brand line (differentiate from these):\n{lines}"

    return f"""Write a product description for this Emart product.

Product: {product['title']}
Brand: {product['brand']}
Country of origin: {product['origin']}
Skin/hair concerns: {', '.join(product['concerns'])}
Category: {', '.join(product['categories'])}
Stock: {product['stock_status']}
Total sales: {product['total_sales']}

Ingredients (from Emart's data):
{product.get('ingredients_html') or 'Not available — infer from product title and brand knowledge'}

How to use (from Emart's data):
{product.get('how_to_use_html') or 'Not available — write appropriate steps for this product type'}
{sibling_context}

Mandatory rules for this output:
1. Opening paragraph: name the key differentiating ingredient within the first 2 sentences
2. If sibling products listed above exist, explicitly state what makes THIS variant different
3. Weave in one Bangladesh context signal (humidity/climate, authenticity/import, or COD availability)
4. Each Key Benefits bullet: start with ingredient name or benefit outcome, never start with a verb
5. Who It's For paragraph: name one skin/hair type that should AVOID or use caution with this product
6. Closing line: one of — authenticity/import claim, availability, or product pairing tip
7. meta_desc: 130-160 chars, must NOT start with 'Buy', must NOT include price (৳)"""


def generate_product_description(product: dict, siblings: list[dict], retries: int = 3) -> dict:
    """Returns {content_html, meta_desc} or raises after retries."""
    prompt = build_user_prompt(product, siblings)
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
