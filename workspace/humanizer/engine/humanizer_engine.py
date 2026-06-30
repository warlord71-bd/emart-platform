#!/usr/bin/env python3
"""
Opus Humanizer Engine — the reusable "content class"
====================================================
Codifies the Opus-4.8 product-description method so the Hermes agent can run it
on ANY OpenRouter model and get Opus-grade, GMC-safe, SEO/AEO-optimised,
AI-residue-free PDP copy for e-mart.com.bd.

This module is the single source of truth for the SYSTEM PROMPT. The companion
OPUS_STYLE_SPEC.md explains the *why*; residue_lint.py is the automated gate that
makes the pipeline self-improving.

Pipeline (see README.md):
    targets()  ->  generate(product)  ->  lint gate  ->  JSONL  ->  review  ->  apply  ->  revalidate

Env:
    OPENROUTER_API_KEY   (falls back to /root/.openclaw/credentials/openrouter_default.json)
    OPENROUTER_MODEL     (default: a strong open instruct model; override freely)
    EMART_DB_PASSWORD    (from /var/www/wordpress/wp-config.php)
    REVALIDATE_SECRET    (from apps/web/.env.local)

CLI:
    python3 humanizer_engine.py --targets 20            # list next targets
    python3 humanizer_engine.py --dry-run --limit 5     # generate+lint -> JSONL (no DB)
    python3 humanizer_engine.py --apply                 # apply PASSed rows from JSONL
    python3 humanizer_engine.py --dry-run --post-id 51962
"""
from __future__ import annotations
import argparse, json, os, random, re, subprocess, sys, time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / "impression-priority"))

import residue_lint as LINT
# Reuse the proven DB layer (fetch/brand/apply/disclaimer) — do not duplicate.
import humanizer_impression_priority as DB  # noqa: E402

PROMPT_VERSION = "opus-pdp-v1.0"

# Free-tier fallback chain (rotated on 429; paid models skipped on 402 until funded).
# Quality-ordered; all verified valid on OpenRouter 2026-06-23.
FREE_MODELS = [
    "google/gemma-4-31b-it:free",          # fast + high quality (scores 96-98 in testing)
    "google/gemma-4-26b-a4b-it:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "nvidia/nemotron-3-super-120b-a12b:free",  # strong but slow — last-resort fallback
]

def _model_chain() -> list[str]:
    """Env OPENROUTER_MODEL (if set) first, then the free fallbacks."""
    env = os.environ.get("OPENROUTER_MODEL", "").strip()
    chain = ([env] if env else []) + [m for m in FREE_MODELS if m != env]
    return chain

DEFAULT_MODEL  = (_model_chain() or ["google/gemma-4-31b-it:free"])[0]
PACE_SECONDS   = int(os.environ.get("ENGINE_PACE", "8"))  # inter-product wait (free-tier friendly)
DATE  = datetime.today().strftime("%Y-%m-%d")
OUT   = HERE / "active"
JSONL = OUT / f"engine-{DATE}.jsonl"
EXEMPLARS = HERE / "exemplars.jsonl"

# ── The authoritative Opus-4.8 system prompt (the "content class") ────────────

SYSTEM_PROMPT = """You are a senior skincare copywriter for Emart Skincare Bangladesh \
(e-mart.com.bd), a mobile-first Korean & global beauty store. You write product-detail-page \
descriptions in the voice of an experienced, honest skincare expert who lives in Dhaka. \
Your copy must rank, convert, read like a knowledgeable human wrote it, and never trip \
Google Merchant Center ad policy.

OUTPUT
- Return ONLY the HTML body. No markdown fences, no preamble, no explanation, no meta description.
- Use <p>, <h3>, <ul>/<li>, <ol>/<li> only. NEVER <h1> or <h2> (the page owns those).
- 500-750 words.

REQUIRED SHAPE (vary wording every time — no two products may read the same)
1) Opening <p> (60-100 words): name the product in full, say what category it is, the ONE core
   benefit, who it's for, and a real Bangladesh context (humidity / strong year-round UV /
   pollution / hard water / monsoon). Hook with substance, not hype.
2) Mechanism <h3> phrased as a question or a definition ("Why <ingredient>", "What <product> does",
   "Understanding <ingredient>"): 1-2 <p> explaining the HERO INGREDIENT(S) factually — what it is
   and HOW it works. Ingredient-led, not claim-led.
3) Suitability <h3> ("Best for" / "Who it suits" / "Made for" / "Ideal for"): a <ul> of 4-6
   specific skin types + concerns, then one honest caution line (who should patch-test / avoid).
4) Usage <h3> ("How to use it" / "How to apply"): an <ol> of 4-5 concrete steps with amounts,
   timing, AM/PM placement, and a sunscreen step (SPF protects every result and is non-negotiable
   under Bangladesh UV — this also cross-sells).
5) Closing <h3> ("What to expect" / "The bigger picture" / "Worth knowing"): one <p> setting
   HONEST expectations (results are gradual and consistency-driven; "no miracle") + a climate tie-in.

KEYWORD LOGIC (SEO)
- Put the focus keyword in the first sentence, in exactly one <h3>, and 3-5 times total — never stuffed.
- Weave 1-2 long-tail variants naturally: "<product type> for <concern> in Bangladesh", etc.
- Build topical depth with semantic terms: ingredient names, concerns, skin types, routine words
  (AM/PM, layering, double cleanse). Name the brand 1-2 times as an entity.

SNIPPET / AEO LOGIC (featured snippets, People-Also-Ask, answer engines)
- Right after the mechanism question heading, give a crisp 40-60 word DEFINITIONAL answer that can
  be quoted out of context ("<Product> is a <category> that <does X> using <ingredient>.").
- Lists earn list snippets; the how-to <ol> mirrors HowTo structured data; question headings win PAA.
- Every key claim must be self-contained and factual so answer engines can cite it.

SCHEMA COMPATIBILITY
- The page already emits Product + FAQ JSON-LD. Do NOT write FAQ blocks or schema. Just keep the
  structure schema-friendly: definitional sentences (FAQ-ready) and ordered steps (HowTo-ready).
- The first ~155 characters double as the meta/snippet — make them keyword-rich and compelling.

E-E-A-T (trust = off-page strength: shares, citations, links)
- Demonstrate real expertise (accurate mechanisms), experience (practical Dhaka-climate tips),
  and trust (say who it's NOT for; set honest timelines). Balanced, useful copy earns links.

GMC SAFETY — NEVER use: treats, cures, heals, prescription, clinically proven, medically proven,
miracle, anti-aging miracle, reverses aging, repairs damage, eliminates, removes wrinkles, whitens,
bleaches, 100% effective, guaranteed, permanent results, FDA-approved.
USE INSTEAD: helps, supports, works to, the appearance/look of, brightens, evens, soothes, hydrates,
calms, may. Spelling: British (moisturise, colour, fibre).

WRITE LIKE A HUMAN — BANNED (these are AI tells): delve, dive in/into, unlock, unleash, elevate,
harness the power, embark, realm, tapestry, testament to, boasts, nestled, treasure trove,
game-changer, cutting-edge, look no further, say goodbye to, "your skin will thank you",
"in today's world", "in the world of", "when it comes to", "in conclusion", "in summary", "overall",
"it's worth noting", "rest assured", "whether you're", "not only... but also", "more than just",
"a must-have", "holy grail", "secret weapon", "transform your", revolutionise, supercharge,
"level up", "to the next level", "packed with", "bursting with", "some products...", "once you try".
No exclamation marks. Use em-dashes sparingly (max ~2 per 100 words). Vary sentence length and the
way each section opens. Plain strong verbs over adjectives. Address "you / your skin" naturally,
not in every sentence."""

# ── User-message builder ──────────────────────────────────────────────────────

def _exemplars(n: int = 2) -> str:
    if not EXEMPLARS.exists():
        return ""
    rows = [json.loads(l) for l in open(EXEMPLARS) if l.strip()][:n]
    out = []
    for r in rows:
        out.append(f"### GOLD EXAMPLE — {r['title']} ({r['brand']})\n{r['content_html']}")
    return ("\n\nStudy these gold examples for VOICE, STRUCTURE, and RHYTHM. "
            "Match the quality; do NOT copy phrasing.\n\n" + "\n\n".join(out)) if out else ""

def build_messages(product: dict) -> list[dict]:
    facts = {
        "Product":      product.get("title", ""),
        "Brand":        product.get("brand", ""),
        "Origin":       product.get("origin", ""),
        "Category":     product.get("category", ""),
        "Concern":      product.get("concern", ""),
        "Skin type":    product.get("skin_type", ""),
        "Size":         product.get("size", ""),
        "Focus keyword": product.get("focus_kw", "") or product.get("title", ""),
    }
    facts_block = "\n".join(f"- {k}: {v}" for k, v in facts.items() if v)
    orig = LINT._text(product.get("content", ""))[:1400]
    ingr = LINT._text(product.get("ingredients", ""))[:900]

    user = f"""Write the PDP description for this product.

PRODUCT FACTS
{facts_block}

EXISTING COPY (mine for true facts only — its tone is poor, do not imitate it):
{orig or "(none)"}

KNOWN INGREDIENTS (use the real ones; never invent actives):
{ingr or "(not provided — describe only ingredients implied by the product name/category)"}
{_exemplars()}

Return ONLY the HTML body, following every rule in your instructions."""
    return [{"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user}]

# ── Generation ────────────────────────────────────────────────────────────────

def _api_key() -> str:
    k = os.environ.get("OPENROUTER_API_KEY", "")
    if k:
        return k
    cred = Path("/root/.openclaw/credentials/openrouter_default.json")
    if cred.exists():
        return json.loads(cred.read_text()).get("apiKey", "")
    return ""

def _clean_html(raw: str) -> str:
    s = raw.strip()
    s = re.sub(r"^```(?:html)?\s*", "", s)
    s = re.sub(r"\s*```$", "", s)
    # drop any stray H1/H2 the model emits
    s = re.sub(r"</?h[12][^>]*>", "", s, flags=re.IGNORECASE)
    return s.strip()

_INTERNAL_LINK_TARGETS: list[tuple[re.Pattern, str]] = [
    (re.compile(r'\bniacinamide\b', re.I), '/ingredients/niacinamide'),
    (re.compile(r'\bhyaluronic\s+acid\b', re.I), '/ingredients/hyaluronic-acid'),
    (re.compile(r'\bretinol\b', re.I), '/ingredients/retinol'),
    (re.compile(r'\bvitamin\s+c\b', re.I), '/ingredients/vitamin-c'),
    (re.compile(r'\bcentella(?:\s+asiatica)?\b', re.I), '/ingredients/centella'),
    (re.compile(r'\bsnail\s+mucin\b', re.I), '/ingredients/snail-mucin'),
    (re.compile(r'\bceramide(?:s)?\b', re.I), '/ingredients/ceramide'),
    (re.compile(r'\bsalicylic\s+acid\b', re.I), '/ingredients/bha-salicylic-acid'),
    (re.compile(r'\bpropolis\b', re.I), '/ingredients/propolis'),
    (re.compile(r'\bpeptide(?:s)?\b', re.I), '/ingredients/peptide'),
    (re.compile(r'\bginseng\b', re.I), '/ingredients/ginseng'),
    (re.compile(r'\bcollagen\b', re.I), '/ingredients/collagen'),
    (re.compile(r'\bmugwort\b', re.I), '/ingredients/mugwort'),
    (re.compile(r'\bbakuchiol\b', re.I), '/ingredients/bakuchiol'),
    (re.compile(r'\bSPF\b|\bsunscreen\b|\bsun\s+protection\b', re.I), '/concerns/sunscreen'),
    (re.compile(r'\bacne\b|\bblemish(?:es)?\b|\bbreakout(?:s)?\b', re.I), '/concerns/acne-blemish-care'),
    (re.compile(r'\bbright(?:ening|en)\b|\bdark\s+spot(?:s)?\b|\bhyperpigmentation\b', re.I), '/concerns/brightening'),
    (re.compile(r'\bhydrat(?:ion|ing|e)\b|\bdryness\b|\bdehydrat(?:ed|ion)\b', re.I), '/concerns/dryness-hydration'),
    (re.compile(r'\bpore(?:s)?\b|\boil\s+control\b|\bsebum\b', re.I), '/concerns/pores-oil-control'),
    (re.compile(r'\bsensitiv(?:e|ity)\b|\breactive\s+skin\b', re.I), '/concerns/sensitivity'),
    (re.compile(r'\banti[- ]?ag(?:e|ing)\b|\bwrinkle(?:s)?\b|\bfine\s+line(?:s)?\b', re.I), '/concerns/anti-aging-repair'),
]

def _inject_internal_links(html: str, max_links: int = 3) -> str:
    """Inject 2-3 contextual <a> links into PDP HTML for internal linking (USEO-7)."""
    used_hrefs: set[str] = set()
    count = 0

    for pattern, href in _INTERNAL_LINK_TARGETS:
        if count >= max_links:
            break
        if href in used_hrefs:
            continue
        m = pattern.search(html)
        if not m:
            continue
        start, end = m.start(), m.end()
        before = html[:start]
        if re.search(r'<a\b[^>]*>[^<]*$', before):
            continue
        if re.search(r'<h[3-6][^>]*>[^<]*$', before):
            continue
        matched_text = html[start:end]
        replacement = f'<a href="{href}">{matched_text}</a>'
        html = html[:start] + replacement + html[end:]
        used_hrefs.add(href)
        count += 1

    return html

def _is_429(e) -> bool:
    s = str(e).lower(); return "429" in s or "rate-limit" in s or "rate limit" in s
def _is_402(e) -> bool:
    s = str(e).lower(); return "402" in s or "insufficient credits" in s

def generate(product: dict, models: list[str] | None = None, rounds: int = 3) -> dict | None:
    """Try a chain of models over several rounds. On 429 back off + rotate; on 402 skip
    (paid model, no credits yet); keep the best-scoring draft; return on first PASS."""
    from openai import OpenAI
    key = _api_key()
    if not key:
        print("ERROR: no OpenRouter key (env or credentials file)"); sys.exit(1)
    client = OpenAI(api_key=key, base_url="https://openrouter.ai/api/v1")
    focus  = product.get("focus_kw") or product.get("title", "")
    models = models or _model_chain()
    dead   = set()          # models out of credits this run
    best   = None
    for rnd in range(rounds):
        for model in models:
            if model in dead:
                continue
            tag = model.split("/")[-1]
            try:
                resp = client.chat.completions.create(
                    model=model, messages=build_messages(product),
                    temperature=0.6, max_tokens=2400,
                )
                html = _inject_internal_links(LINT.scrub(_clean_html(resp.choices[0].message.content)))
                res  = LINT.lint(html, focus, product.get("brand",""), product.get("category",""))
                rec  = {"content_html": html, "lint": res, "model": model}
                if best is None or res["score"] > best["lint"]["score"]:
                    best = rec
                if res["pass"]:
                    return best
                print(f"    {tag}: {res['score']} FAIL {res['issues'][:2]}")
            except Exception as e:
                if _is_402(e):
                    print(f"    {tag}: 402 no credits — skipping"); dead.add(model); continue
                if _is_429(e):
                    wait = min(75, 10 * (rnd + 1)) + random.randint(0, 6)
                    print(f"    {tag}: 429 rate-limited — wait {wait}s"); time.sleep(wait); continue
                print(f"    {tag}: error {str(e)[:90]}"); time.sleep(4)
        if all(m in dead for m in models):
            print("    all models out of credits"); break
    return best

# ── Target selection (mirrors the manual humanizer's rules) ───────────────────

INCLUDE = "serum|sunscreen|cream|essence|ampoule|moistur|lotion|toner"
EXCLUDE = "cleans|wash|foam|shampoo|soap|scrub|mask|lip|hair|powder|cushion|patch|sheet|kit|combo|set"
HOLDOUT_IDS = {2611, 2591, 4064}

def _holdout_slugs() -> set[str]:
    p = Path("workspace/audit/active/baseline-snapshot-2026-05-31.json")
    if p.exists():
        return set(json.loads(p.read_text()).get("holdout_slugs", []))
    return set()

def targets(limit: int = 20) -> list[dict]:
    conn = DB.db_connect(); cur = conn.cursor(dictionary=True)
    cur.execute(f"""
        SELECT p.ID AS post_id, p.post_title AS title, p.post_name AS slug,
               p.post_content AS content,
               COALESCE(MAX(CASE WHEN pm.meta_key='total_sales' THEN CAST(pm.meta_value AS UNSIGNED) END),0) AS sales,
               MAX(CASE WHEN pm.meta_key='_rank_math_focus_keyword' THEN pm.meta_value END) AS focus_kw,
               MAX(CASE WHEN pm.meta_key='_emart_ingredients' THEN pm.meta_value END) AS ingredients,
               MAX(CASE WHEN pm.meta_key='_emart_humanized' THEN pm.meta_value END) AS humanized
        FROM {DB.PREFIX}posts p
        LEFT JOIN {DB.PREFIX}postmeta pm ON pm.post_id=p.ID
        WHERE p.post_type='product' AND p.post_status='publish'
          AND p.post_title REGEXP %s AND p.post_title NOT REGEXP %s
        GROUP BY p.ID
        HAVING (humanized IS NULL OR humanized!='1')
        ORDER BY sales DESC
        LIMIT %s
    """, (INCLUDE, EXCLUDE, max(limit * 50, 2000)))
    rows = cur.fetchall(); conn.close()
    holdout = _holdout_slugs()
    out = []
    for r in rows:
        if r["post_id"] in HOLDOUT_IDS or r["slug"] in holdout:
            continue
        r["brand"] = DB.get_brand(r["post_id"])
        for tax, field in (("pa_origin","origin"),("pa_concern","concern"),
                           ("pa_skin_type","skin_type"),("product_cat","category")):
            r[field] = _term(r["post_id"], tax)
        out.append(r)
        if len(out) >= limit:
            break
    return out

def _term(post_id: int, taxonomy: str) -> str:
    conn = DB.db_connect(); cur = conn.cursor()
    cur.execute(f"""SELECT t.name FROM {DB.PREFIX}terms t
        JOIN {DB.PREFIX}term_taxonomy tt ON tt.term_id=t.term_id
        JOIN {DB.PREFIX}term_relationships tr ON tr.term_taxonomy_id=tt.term_taxonomy_id
        WHERE tr.object_id=%s AND tt.taxonomy=%s LIMIT 1""", (post_id, taxonomy))
    r = cur.fetchone(); conn.close()
    return r[0] if r else ""

# ── Commands ──────────────────────────────────────────────────────────────────

def cmd_targets(a):
    for t in targets(a.targets):
        print(f"  {t['post_id']:>6} | sales={t['sales']:>3} | {t['brand'][:16]:<16} | {t['title'][:54]}")

def cmd_dry_run(a):
    OUT.mkdir(parents=True, exist_ok=True)
    items = targets(a.limit or 5)
    if a.post_id:
        items = [t for t in targets(500) if t["post_id"] == a.post_id]
    done = set()
    if JSONL.exists():
        for l in open(JSONL):
            if l.strip(): done.add(json.loads(l).get("post_id"))
    items = [t for t in items if t["post_id"] not in done]
    print(f"Generating {len(items)} (chain={_model_chain()}, pace={PACE_SECONDS}s, prompt={PROMPT_VERSION})")
    npass = 0
    for i, p in enumerate(items, 1):
        print(f"[{i}/{len(items)}] {p['post_id']} — {p['title'][:50]} ({p['brand']})")
        g = generate(p)
        if not g:
            print("  SKIP — generation failed"); continue
        res = g["lint"]; npass += res["pass"]
        row = {"post_id": p["post_id"], "title": p["title"], "brand": p["brand"],
               "focus_kw": p.get("focus_kw") or p["title"],
               "content_html": g["content_html"], "score": res["score"],
               "pass": res["pass"], "issues": res["issues"],
               "model": g["model"], "prompt_version": PROMPT_VERSION,
               "generated_at": datetime.now(timezone.utc).isoformat()}
        with open(JSONL, "a") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
        LINT._log({"post_id": p["post_id"], "score": res["score"], "pass": res["pass"],
                   "model": g["model"], "prompt_version": PROMPT_VERSION})
        print(f"  {'PASS' if res['pass'] else 'FAIL'} {res['score']} ({res['word_count']}w) via {g['model'].split('/')[-1]}")
        time.sleep(PACE_SECONDS)
    print(f"\n{npass}/{len(items)} PASSed -> {JSONL}\nReview FAILs, then --apply")

def cmd_apply(a):
    if not JSONL.exists():
        print(f"ERROR: {JSONL} missing — run --dry-run first"); sys.exit(1)
    rows = [json.loads(l) for l in open(JSONL) if l.strip()]
    if a.post_id: rows = [r for r in rows if r["post_id"] == a.post_id]
    if not a.force: rows = [r for r in rows if r.get("pass")]
    print(f"Applying {len(rows)} rows (force={a.force})")
    ok = 0
    for r in rows:
        html = r["content_html"].strip() + DB.DISCLAIMER
        if DB.apply_to_db(r["post_id"], html):
            print(f"  ok {r['post_id']} — {r['title'][:46]} ({r['score']})"); ok += 1
        else:
            print(f"  FAIL {r['post_id']}")
        time.sleep(0.3)
    print(f"Applied {ok}/{len(rows)}")
    if ok:
        sec = os.environ.get("REVALIDATE_SECRET", "")
        subprocess.run(["curl","-s","-o","/dev/null","-X","POST",
                        "https://e-mart.com.bd/api/revalidate?tag=products",
                        "-H","Content-Type: application/json",
                        "-H",f"x-revalidate-secret: {sec}","-d",'{"tag":"products"}'],
                       capture_output=True)
        print("ISR revalidated (tag:products)")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--targets", type=int, metavar="N")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--post-id", type=int)
    ap.add_argument("--limit", type=int)
    ap.add_argument("--force", action="store_true", help="apply even FAIL rows (after manual fix)")
    a = ap.parse_args()
    if a.targets: cmd_targets(a)
    elif a.dry_run: cmd_dry_run(a)
    elif a.apply: cmd_apply(a)
    else: ap.print_help()
