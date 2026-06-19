#!/usr/bin/env python3
"""Review-only SEO suggestions from Qdrant product vectors.

Standalone internal tool. It reads Qdrant + the mpnet sidecar and writes only
JSONL review files in workspace/seo-review/.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import signal
import ssl
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


# ===== CONFIG: single source of truth =====
PRIMARY_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free"
FALLBACK_MODEL = "deepseek/deepseek-chat-v3.1"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_REFERER = "https://e-mart.com.bd"
OPENROUTER_TITLE = "Emart Internal SEO Review Tool"

EMBED_URL = "http://127.0.0.1:8077/embed"
EMBED_DIM = 768
EMBED_PM2_NAMES = ("emart-embed", "emart-mpnet-sidecar", "mpnet-sidecar", "emart-embedder", "mpnet-embedder")

QDRANT_URL = "http://127.0.0.1:6333"
QDRANT_COLLECTION = "emart_products"
QDRANT_DIM = 768

WC_API_BASE = "https://127.0.0.1/wp-json/wc/v3"
WC_HOST_HEADER = "e-mart.com.bd"

OUTPUT_DIR = Path("workspace/seo-review")
INTERNAL_LINKS_FILE = OUTPUT_DIR / "internal-links.jsonl"
CONTENT_GAPS_FILE = OUTPUT_DIR / "content-gaps.jsonl"
DUPLICATE_FLAGS_FILE = OUTPUT_DIR / "duplicate-flags.jsonl"
AGENTIC_SCORE_FILE = OUTPUT_DIR / "agentic-score.jsonl"

LLM_MIN_INTERVAL_SECONDS = 3.2  # <= ~18.75/minute
LLM_TIMEOUT_SECONDS = 30
LLM_PRODUCT_BATCH_SIZE = 5
SEARCH_LIMIT = 48
NEIGHBOR_LIMIT = 8
DUPLICATE_THRESHOLD = 0.965
STRONG_THRESHOLD = 0.54
TIGHT_SCORE = 0.54
CONTENT_STRONG_AVG_SCORE = 0.60
CONTENT_NO_PAGE_AVG_SCORE = 0.57
CONTENT_MIN_TIGHT_PRODUCTS = 6

AGENTIC_WEIGHTS = {
    "locked_title": 8,
    "description_150_words_not_templated": 8,
    "gtin_or_identifier_exists_false": 12,
    "mpn_or_brand_product_id": 6,
    "offer_price_valid_until": 6,
    "concern_tags": 8,
    "key_ingredients": 6,
    "skin_type_or_use_case": 5,
    "size_volume": 4,
    "origin_country": 4,
    "brand": 3,
    "real_qna": 12,
    "related_substitute_links": 10,
    "routine_compatibility_care": 8,
}

ACTIVE_THEMES = [
    "serums ampoules essences",
    "face cleansers cleansing foam",
    "toners mists hydrating toner",
    "face masks wash off mask sheet mask",
    "sunscreen spf sun cream",
    "eye care eye cream",
    "spot treatment acne care",
    "toner pads exfoliating pads",
    "night cream sleeping mask",
    "cream moisturizer barrier repair",
    "skincare kit set routine combo",
    "shampoos hair fall dandruff",
    "hair conditioners",
    "hair treatments hair mask",
    "hair oil",
    "body lotion dry skin",
    "body wash shower gel",
    "hand care hand cream",
    "foundation makeup base",
    "lipstick tint lip makeup",
    "lip balm care",
    "mascara eyeliner eye makeup",
    "makeup remover cleansing balm",
    "fragrances perfume body mist",
    "korean beauty k-beauty",
    "japanese beauty j-beauty",
    "beauty supplements collagen",
    "soothing gel aloe vera",
    "acne blemish care",
    "anti aging repair wrinkle",
    "dryness hydration hyaluronic acid",
    "pores oil control niacinamide",
    "melasma pigmentation brightening",
    "sensitivity soothing barrier",
]

KNOWN_ROUTE_THEMES = {
    "serums ampoules essences",
    "face cleansers cleansing foam",
    "toners mists hydrating toner",
    "face masks wash off mask sheet mask",
    "sunscreen spf sun cream",
    "eye care eye cream",
    "spot treatment acne care",
    "toner pads exfoliating pads",
    "night cream sleeping mask",
    "cream moisturizer barrier repair",
    "skincare kit set routine combo",
    "shampoos hair fall dandruff",
    "hair conditioners",
    "hair treatments hair mask",
    "hair oil",
    "body lotion dry skin",
    "body wash shower gel",
    "hand care hand cream",
    "foundation makeup base",
    "lipstick tint lip makeup",
    "lip balm care",
    "mascara eyeliner eye makeup",
    "makeup remover cleansing balm",
    "fragrances perfume body mist",
    "korean beauty k-beauty",
    "japanese beauty j-beauty",
    "beauty supplements collagen",
    "soothing gel aloe vera",
    "acne blemish care",
    "anti aging repair wrinkle",
    "dryness hydration hyaluronic acid",
    "pores oil control niacinamide",
    "melasma pigmentation brightening",
    "sensitivity soothing barrier",
}

NO_PAGE_PROBE_THEMES = [
    "niacinamide serum oil control",
    "hyaluronic acid hydration serum",
    "ceramide moisturizer barrier repair",
    "vitamin c brightening serum",
    "salicylic acid bha acne cleanser",
    "snail mucin essence",
    "centella cica soothing skincare",
    "retinol anti aging serum",
    "rice toner glass skin",
    "mugwort calming mask",
    "azelaic acid redness acne",
    "collagen firming skincare",
]
# ===== END CONFIG =====


class StopRun(RuntimeError):
    pass


def hard_timeout(seconds: int, label: str, fn):
    def raise_timeout(_signum, _frame):
        raise TimeoutError(f"{label} exceeded {seconds}s")

    previous = signal.signal(signal.SIGALRM, raise_timeout)
    signal.setitimer(signal.ITIMER_REAL, seconds)
    try:
        return fn()
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)
        signal.signal(signal.SIGALRM, previous)


_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE


@dataclass
class RunState:
    model: str = PRIMARY_MODEL
    model_note: str = "primary"
    fallback_used: bool = False
    sidecar_status: str = "not checked"
    collection_dim: int | None = None
    llm_calls: int = 0
    rate_events: list[str] | None = None


def req_json(method: str, url: str, body: Any | None = None, headers: dict[str, str] | None = None, timeout: int = 60) -> Any:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    merged = {"Content-Type": "application/json", "Accept": "application/json", "Connection": "close"}
    if headers:
        merged.update(headers)
    request = Request(url, data=data, method=method, headers=merged)
    context = _ssl_ctx if url.startswith("https://127.0.0.1/") else None
    with urlopen(request, timeout=timeout, context=context) as response:
        raw = response.read().decode("utf-8")
        return json.loads(raw) if raw else {}


def qdrant_headers() -> dict[str, str]:
    key = os.environ.get("QDRANT_API_KEY", "")
    if not key:
        raise StopRun("QDRANT_API_KEY is not set")
    return {"api-key": key}


def qdrant(method: str, path: str, body: Any | None = None) -> Any:
    return req_json(method, f"{QDRANT_URL}{path}", body=body, headers=qdrant_headers())


def wc_credentials() -> tuple[str, str]:
    key = os.environ.get("WC_CONSUMER_KEY") or os.environ.get("WOO_CONSUMER_KEY", "")
    secret = os.environ.get("WC_CONSUMER_SECRET") or os.environ.get("WOO_CONSUMER_SECRET", "")
    if not key or not secret:
        raise StopRun("WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET are required for read-only Job E scoring")
    return key, secret


def wc_get(endpoint: str, params: dict[str, Any] | None = None) -> Any:
    key, secret = wc_credentials()
    query = {"consumer_key": key, "consumer_secret": secret}
    if params:
        query.update(params)
    url = f"{WC_API_BASE}/{endpoint}?{urlencode(query)}"
    return req_json("GET", url, headers={"Host": WC_HOST_HEADER}, timeout=60)


def openrouter_headers() -> dict[str, str]:
    key = os.environ.get("OPENROUTER_API_KEY", "")
    if not key:
        raise StopRun("OPENROUTER_API_KEY is not set")
    return {
        "Authorization": f"Bearer {key}",
        "HTTP-Referer": OPENROUTER_REFERER,
        "X-Title": OPENROUTER_TITLE,
    }


def chat_call(model: str, messages: list[dict[str, str]], max_tokens: int = 600, temperature: float = 0.15) -> dict[str, Any]:
    return hard_timeout(
        LLM_TIMEOUT_SECONDS + 5,
        f"OpenRouter {model}",
        lambda: req_json(
            "POST",
            OPENROUTER_URL,
            body={"model": model, "messages": messages, "max_tokens": max_tokens, "temperature": temperature},
            headers=openrouter_headers(),
            timeout=LLM_TIMEOUT_SECONDS,
        ),
    )


def preflight_model(state: RunState) -> None:
    test_messages = [{"role": "user", "content": "Reply with exactly: ok"}]
    try:
        chat_call(PRIMARY_MODEL, test_messages, max_tokens=1, temperature=0)
        state.model = PRIMARY_MODEL
        state.model_note = "primary resolved by 1-token test"
        return
    except Exception as exc:
        state.fallback_used = True
        state.rate_events = state.rate_events or []
        state.rate_events.append(f"primary model test failed: {type(exc).__name__}")
    try:
        chat_call(FALLBACK_MODEL, test_messages, max_tokens=1, temperature=0)
    except Exception as exc:
        raise StopRun(f"Fallback model {FALLBACK_MODEL} failed model test: {type(exc).__name__}") from exc
    state.model = FALLBACK_MODEL
    state.model_note = "fallback used because primary failed/unavailable"


def start_sidecar_if_known() -> bool:
    for name in EMBED_PM2_NAMES:
        check = subprocess.run(["pm2", "describe", name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if check.returncode == 0:
            subprocess.run(["pm2", "start", name], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(4)
            return True
    return False


def embed_text(text: str) -> list[float]:
    response = req_json("POST", EMBED_URL, body={"text": text}, timeout=60)
    vector = response.get("embedding") or response.get("vector") or response.get("data")
    if isinstance(vector, dict):
        vector = vector.get("embedding") or vector.get("vector")
    if not isinstance(vector, list):
        raise StopRun("mpnet sidecar response did not contain a vector")
    if len(vector) != EMBED_DIM:
        raise StopRun(f"mpnet sidecar returned {len(vector)} dims, expected {EMBED_DIM}")
    return [float(v) for v in vector]


def preflight_sidecar(state: RunState) -> None:
    try:
        embed_text("test")
        state.sidecar_status = "running"
        return
    except (URLError, ConnectionError, TimeoutError, StopRun):
        if start_sidecar_if_known():
            embed_text("test")
            state.sidecar_status = "started via PM2"
            return
        state.sidecar_status = "down; no known PM2 sidecar process found"
        raise StopRun(state.sidecar_status)


def preflight_qdrant(state: RunState) -> None:
    info = qdrant("GET", f"/collections/{QDRANT_COLLECTION}")
    result = info.get("result", {})
    config = result.get("config", {})
    vectors = config.get("params", {}).get("vectors", {})
    size = vectors.get("size")
    if size is None and isinstance(vectors, dict):
        first = next((v for v in vectors.values() if isinstance(v, dict) and "size" in v), {})
        size = first.get("size")
    state.collection_dim = int(size or 0)
    if state.collection_dim != QDRANT_DIM:
        raise StopRun(f"Qdrant collection dim is {state.collection_dim}, expected {QDRANT_DIM}")


def scroll_products(limit: int) -> list[dict[str, Any]]:
    body = {"limit": limit, "with_payload": True, "with_vector": True}
    data = qdrant("POST", f"/collections/{QDRANT_COLLECTION}/points/scroll", body)
    return data.get("result", {}).get("points", [])


def vector_search(vector: list[float], limit: int = SEARCH_LIMIT, query_filter: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    body: dict[str, Any] = {"vector": vector, "limit": limit, "with_payload": True}
    if query_filter:
        body["filter"] = query_filter
    try:
        data = qdrant("POST", f"/collections/{QDRANT_COLLECTION}/points/search", body)
    except HTTPError:
        body = {"query": vector, "limit": limit, "with_payload": True}
        if query_filter:
            body["filter"] = query_filter
        data = qdrant("POST", f"/collections/{QDRANT_COLLECTION}/points/query", body)
    result = data.get("result", [])
    if isinstance(result, dict):
        return result.get("points", [])
    return result


def product(payload: dict[str, Any], score: float | None = None) -> dict[str, Any]:
    return {
        "slug": payload.get("slug", ""),
        "name": payload.get("name", ""),
        "brand": payload.get("brand", ""),
        "category": payload.get("category", ""),
        "origin": payload.get("origin", ""),
        "score": score,
        "short_desc": payload.get("short_description", "") or payload.get("description", ""),
    }


def strip_html(raw: str) -> str:
    text = re.sub(r"<script\b[^>]*>.*?</script>", " ", raw or "", flags=re.I | re.S)
    text = re.sub(r"<style\b[^>]*>.*?</style>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    return html.unescape(re.sub(r"\s+", " ", text)).strip()


def meta_map(woo: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for item in woo.get("meta_data", []) or []:
        key = item.get("key")
        if key:
            out[str(key)] = item.get("value")
    return out


def attr_options(woo: dict[str, Any], *slugs: str) -> list[str]:
    wanted = {slug.lower() for slug in slugs}
    values: list[str] = []
    for attr in woo.get("attributes", []) or []:
        slug = str(attr.get("slug") or attr.get("name") or "").lower()
        if slug in wanted:
            values.extend(str(v).strip() for v in attr.get("options", []) if str(v).strip())
    return values


def meta_text(meta: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = meta.get(key)
        if isinstance(value, str) and value.strip():
            return strip_html(value)
        if isinstance(value, (int, float)) and value:
            return str(value)
        if isinstance(value, (list, dict)) and value:
            return json.dumps(value, ensure_ascii=False)
    return ""


def parse_faq(value: Any) -> Any:
    if not value:
        return None
    if isinstance(value, (list, dict)):
        return value
    if isinstance(value, str):
        cleaned = value.strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return strip_html(cleaned)
    return None


def enrich_payload_from_woo(qdrant_payload: dict[str, Any], woo: dict[str, Any]) -> dict[str, Any]:
    meta = meta_map(woo)
    categories = woo.get("categories", []) or []
    cat_names = [str(c.get("name", "")).strip() for c in categories if c.get("name")]
    cat_slugs = [str(c.get("slug", "")).strip() for c in categories if c.get("slug")]
    brand = (attr_options(woo, "pa_brand", "brand") or [qdrant_payload.get("brand", "")])[0]
    origin = (attr_options(woo, "pa_origin", "origin", "country") or [qdrant_payload.get("origin", "")])[0]
    concerns = attr_options(woo, "pa_concern", "concern")
    ingredients = attr_options(woo, "pa_ingredients", "pa_ingredient", "ingredients")
    ingredient_meta = meta_text(meta, "_emart_ingredients", "ingredients", "_ingredients", "_product_ingredients")
    if ingredient_meta:
        ingredients.extend(v.strip() for v in re.split(r"[,|;]", ingredient_meta) if v.strip())
    skin_types = attr_options(woo, "pa_skin-type", "pa_skin_type", "skin-type", "skin_type")
    how_to_use = meta_text(meta, "_emart_how_to_use", "how_to_use", "_how_to_use")
    desc = strip_html(str(woo.get("description") or ""))
    short_desc = strip_html(str(woo.get("short_description") or ""))
    faq = parse_faq(meta.get("_emart_product_faq") or meta.get("product_faq") or meta.get("_faq"))
    gtin = meta_text(meta, "_wc_gla_gtin", "gtin", "_gtin", "ean", "_alg_ean", "barcode", "_barcode")
    identifier_exists = meta.get("_wc_gla_identifier_exists", meta.get("identifier_exists"))
    return {
        **qdrant_payload,
        "id": woo.get("id") or qdrant_payload.get("product_id"),
        "product_id": woo.get("id") or qdrant_payload.get("product_id"),
        "name": woo.get("name") or qdrant_payload.get("name", ""),
        "slug": woo.get("slug") or qdrant_payload.get("slug", ""),
        "sku": woo.get("sku") or qdrant_payload.get("sku", ""),
        "brand": brand,
        "origin": origin,
        "category": ", ".join(cat_names) or qdrant_payload.get("category", ""),
        "category_slugs": cat_slugs,
        "description": desc,
        "short_description": short_desc,
        "regular_price_bdt": woo.get("regular_price") or qdrant_payload.get("regular_price_bdt"),
        "price_bdt": woo.get("price") or qdrant_payload.get("price_bdt"),
        "stock_status": woo.get("stock_status") or qdrant_payload.get("stock_status"),
        "permalink": woo.get("permalink") or qdrant_payload.get("permalink"),
        "concerns": concerns,
        "ingredients": ingredients,
        "skin_types": skin_types,
        "how_to_use": how_to_use,
        "faqs": faq,
        "gtin": gtin,
        "identifier_exists": identifier_exists,
        "mpn": meta_text(meta, "mpn", "_mpn", "_wc_gla_mpn"),
        "seo_title": meta_text(meta, "rank_math_title", "_rank_math_title", "_yoast_wpseo_title"),
        "priceValidUntil": meta_text(meta, "priceValidUntil", "price_valid_until", "_price_valid_until"),
        "page_price_bdt": woo.get("price"),
        "feed_price_bdt": meta_text(meta, "_wc_gla_price", "feed_price_bdt"),
        "page_availability": woo.get("stock_status"),
        "feed_availability": meta_text(meta, "_wc_gla_availability", "feed_availability"),
    }


def tokens(text: str) -> set[str]:
    stop = {"and", "for", "the", "with", "care", "beauty", "skincare", "products", "product"}
    return {t for t in re.findall(r"[a-z0-9]+", text.lower()) if len(t) > 2 and t not in stop}


def compatible(source: dict[str, Any], candidate: dict[str, Any]) -> bool:
    source_cat = tokens(source.get("category", ""))
    cand_cat = tokens(candidate.get("category", ""))
    if not source_cat or not cand_cat:
        return True
    if source_cat & cand_cat:
        return True
    source_text = " ".join([source.get("name", ""), source.get("category", "")]).lower()
    cand_text = " ".join([candidate.get("name", ""), candidate.get("category", "")]).lower()
    skincare_words = {"acne", "blemish", "hydration", "dryness", "pores", "oil", "melasma", "brightening", "sensitivity", "serum", "cleanser", "toner", "sunscreen", "cream", "moisturizer"}
    hair_words = {"shampoo", "conditioner", "hair", "dandruff"}
    makeup_words = {"lip", "foundation", "mascara", "eyeliner", "makeup"}
    for bucket in (skincare_words, hair_words, makeup_words):
        if (tokens(source_text) & bucket) and (tokens(cand_text) & bucket):
            return True
    return False


def dedupe_key(a: str, b: str) -> tuple[str, str]:
    return tuple(sorted([a, b]))


SIZE_RE = re.compile(r"\b\d+(?:\.\d+)?\s?(?:ml|g|gm|gram|kg|oz|fl oz|pcs|pads|sheets|tablets|capsules)\b", re.I)
SHADE_RE = re.compile(r"\b(?:nc|nw)\s*[-:]?\s*\d{1,3}\b", re.I)


def normalized_base_name(name: str) -> str:
    cleaned = SHADE_RE.sub(" ", name.lower())
    cleaned = SIZE_RE.sub(" ", cleaned)
    cleaned = re.sub(r"\([^)]*\)", " ", cleaned)
    cleaned = re.sub(r"[^a-z0-9]+", " ", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


def size_value(name: str) -> str:
    match = SIZE_RE.search(name)
    return match.group(0).lower().replace(" ", "") if match else ""


def shade_value(name: str) -> str:
    match = SHADE_RE.search(name)
    return re.sub(r"[^a-z0-9]", "", match.group(0).lower()) if match else ""


def duplicate_note(source: dict[str, Any], candidate: dict[str, Any]) -> tuple[str, str]:
    same_base = normalized_base_name(source.get("name", "")) == normalized_base_name(candidate.get("name", ""))
    source_shade = shade_value(source.get("name", ""))
    candidate_shade = shade_value(candidate.get("name", ""))
    if same_base and source_shade != candidate_shade and (source_shade or candidate_shade):
        return "SHADE_VARIANT", "Near-identical embedding but product shade differs; legitimate cosmetic shade variant, not duplicate."
    source_size = size_value(source.get("name", ""))
    candidate_size = size_value(candidate.get("name", ""))
    if same_base and source_size and candidate_size and source_size != candidate_size:
        return "SIZE_VARIANT", "Near-identical embedding but base product differs by size/volume; review as legitimate size variant, not duplicate."
    return "POSSIBLE_DUPLICATE", "Near-identical embedding; review for duplicate/templated description or same product relist."


def candidate_neighbors(point: dict[str, Any], duplicate_pairs: dict[tuple[str, str], dict[str, Any]]) -> list[dict[str, Any]]:
    payload = point.get("payload", {})
    src = product(payload)
    vector = point.get("vector")
    if isinstance(vector, dict):
        vector = next(iter(vector.values()))
    if not isinstance(vector, list):
        return []
    same_category_filter = None
    category = payload.get("category")
    if category:
        same_category_filter = {"must": [{"key": "category", "match": {"value": category}}]}
    results = vector_search(vector, SEARCH_LIMIT, same_category_filter)
    if len(results) < NEIGHBOR_LIMIT + 1:
        results = vector_search(vector, SEARCH_LIMIT, None)
    neighbors: list[dict[str, Any]] = []
    for item in results:
        cand = product(item.get("payload", {}), float(item.get("score", 0) or 0))
        if not cand["slug"] or cand["slug"] == src["slug"]:
            continue
        if cand["score"] and cand["score"] >= DUPLICATE_THRESHOLD:
            duplicate_type, note = duplicate_note(src, cand)
            if duplicate_type == "SHADE_VARIANT":
                continue
            duplicate_pairs[dedupe_key(src["slug"], cand["slug"])] = {
                "product_a_slug": src["slug"],
                "product_b_slug": cand["slug"],
                "similarity": round(cand["score"], 6),
                "duplicate_type": duplicate_type,
                "note": note,
            }
            continue
        if compatible(src, cand):
            neighbors.append(cand)
        if len(neighbors) >= NEIGHBOR_LIMIT:
            break
    return neighbors


def parse_json_array(text: str) -> Any:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    match = re.search(r"(\[.*\]|\{.*\})", cleaned, flags=re.S)
    if match:
        cleaned = match.group(1)
    return json.loads(cleaned)


def fallback_link_reason(source: dict[str, Any], candidate: dict[str, Any]) -> str:
    if source.get("brand") and source.get("brand") == candidate.get("brand"):
        return f"Same {source['brand']} line; useful alternative for comparison."
    source_terms = tokens(source.get("category", ""))
    candidate_terms = tokens(candidate.get("category", ""))
    overlap = sorted(source_terms & candidate_terms)
    if overlap:
        return f"Shared {overlap[0]} category/concern; relevant shopper comparison."
    return "Related routine/product-type match from vector similarity."


def repair_json_with_llm(state: RunState, bad_content: str, schema_hint: str) -> Any:
    repaired = llm_with_fallback(state, [
        {"role": "system", "content": "Repair malformed JSON. Return valid JSON only, no prose."},
        {"role": "user", "content": json.dumps({"schema": schema_hint, "malformed": bad_content}, ensure_ascii=False)},
    ], max_tokens=1400)
    return parse_json_array(repaired)


def llm_select_links(state: RunState, batch: list[dict[str, Any]]) -> list[dict[str, Any]]:
    prompt = {
        "task": "For each source product, select 4-5 genuinely useful internal product links from candidates. Reasons must be one short Bangla-English line. Use only candidate slugs. Never invent slugs.",
        "output": "Return JSON array: [{source_slug, suggested_links:[{slug,name,reason}]}]",
        "products": batch,
    }
    content = llm_with_fallback(state, [
        {"role": "system", "content": "You are an Emart skincare SEO reviewer. Return valid JSON only."},
        {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)},
    ], max_tokens=1800)
    try:
        data = parse_json_array(content)
    except (json.JSONDecodeError, TypeError, AttributeError) as exc:
        try:
            data = repair_json_with_llm(state, str(content), "[{source_slug, suggested_links:[{slug,name,reason}]}]")
            return data if isinstance(data, list) else []
        except Exception:
            pass
        state.rate_events = state.rate_events or []
        state.rate_events.append(f"link JSON parse failed: {exc}; used deterministic candidate fallback")
        return [
            {
                "source_slug": item["source"]["slug"],
                "suggested_links": [
                    {
                        "slug": candidate["slug"],
                        "name": candidate["name"],
                        "reason": fallback_link_reason(item["source"], candidate),
                    }
                    for candidate in item["candidates"][:5]
                ],
            }
            for item in batch
        ]
    return data if isinstance(data, list) else []


def llm_gap_recs(state: RunState, gaps: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not gaps:
        return []
    prompt = {
        "task": "Draft 2-3 sentence Bangla-English rationale for what page to create and which anchor products to use. Keep recommendations practical for Emart Bangladesh.",
        "output": "Return JSON array: [{theme,recommendation}]",
        "themes": gaps,
    }
    content = llm_with_fallback(state, [
        {"role": "system", "content": "You are an Emart SEO strategist. Return valid JSON only."},
        {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)},
    ], max_tokens=2200)
    try:
        data = parse_json_array(content)
    except (json.JSONDecodeError, TypeError, AttributeError) as exc:
        try:
            data = repair_json_with_llm(state, str(content), "[{theme,recommendation}]")
            return data if isinstance(data, list) else []
        except Exception:
            pass
        state.rate_events = state.rate_events or []
        state.rate_events.append(f"gap JSON parse failed: {exc}; used deterministic recommendation fallback")
        return [
            {
                "theme": gap["theme"],
                "recommendation": f"{gap['theme']} has enough clustered catalog evidence for review. Anchor the page/listicle around {', '.join(gap.get('anchor_products', [])[:3])} and keep it buyer-focused for Bangladesh search intent.",
            }
            for gap in gaps
        ]
    return data if isinstance(data, list) else []


def llm_with_fallback(state: RunState, messages: list[dict[str, str]], max_tokens: int) -> str:
    if getattr(state, "llm_disabled", False):
        return ""
    if not hasattr(llm_with_fallback, "last_call"):
        llm_with_fallback.last_call = 0.0  # type: ignore[attr-defined]
    elapsed = time.monotonic() - llm_with_fallback.last_call  # type: ignore[attr-defined]
    if elapsed < LLM_MIN_INTERVAL_SECONDS:
        time.sleep(LLM_MIN_INTERVAL_SECONDS - elapsed)
    try:
        response = chat_call(state.model, messages, max_tokens=max_tokens)
    except Exception as exc:
        state.rate_events = state.rate_events or []
        state.rate_events.append(f"{state.model} call failed: {type(exc).__name__}; retried fallback")
        state.model = FALLBACK_MODEL
        state.fallback_used = True
        try:
            response = chat_call(FALLBACK_MODEL, messages, max_tokens=max_tokens)
        except Exception as fallback_exc:
            state.rate_events.append(f"{FALLBACK_MODEL} call failed: {type(fallback_exc).__name__}; disabled LLM for deterministic fallback")
            setattr(state, "llm_disabled", True)
            return ""
    finally:
        llm_with_fallback.last_call = time.monotonic()  # type: ignore[attr-defined]
    state.llm_calls += 1
    choice = response.get("choices", [{}])[0]
    msg = choice.get("message", {})
    return msg.get("content", "")


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    assert path.parent == OUTPUT_DIR
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def job_internal_links(state: RunState, points: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[tuple[str, str], dict[str, Any]]]:
    duplicate_pairs: dict[tuple[str, str], dict[str, Any]] = {}
    prepared: list[dict[str, Any]] = []
    for point in points:
        src = product(point.get("payload", {}))
        neighbors = candidate_neighbors(point, duplicate_pairs)
        prepared.append({"source": src, "candidates": neighbors})

    output: list[dict[str, Any]] = []
    for i in range(0, len(prepared), LLM_PRODUCT_BATCH_SIZE):
        batch = prepared[i:i + LLM_PRODUCT_BATCH_SIZE]
        selected = llm_select_links(state, batch)
        by_slug = {row.get("source_slug"): row for row in selected if isinstance(row, dict)}
        for item in batch:
            src = item["source"]
            candidate_slugs = {c["slug"]: c for c in item["candidates"]}
            row = by_slug.get(src["slug"], {})
            links = []
            for link in row.get("suggested_links", []) if isinstance(row, dict) else []:
                slug = link.get("slug")
                if slug in candidate_slugs:
                    links.append({
                        "slug": slug,
                        "name": candidate_slugs[slug]["name"],
                        "reason": str(link.get("reason", ""))[:220],
                    })
            output.append({"source_slug": src["slug"], "source_name": src["name"], "suggested_links": links[:5]})
    return output, duplicate_pairs


def job_content_gaps(state: RunState) -> list[dict[str, Any]]:
    theme_rows: list[dict[str, Any]] = []
    themes = ACTIVE_THEMES + NO_PAGE_PROBE_THEMES
    for theme in themes:
        vector = embed_text(theme)
        results = vector_search(vector, 12, None)
        tight = [r for r in results if float(r.get("score", 0) or 0) >= TIGHT_SCORE]
        anchors = [r.get("payload", {}).get("slug", "") for r in results[:6] if r.get("payload", {}).get("slug")]
        count = len(tight)
        has_page = theme in KNOWN_ROUTE_THEMES
        avg_score = sum(float(r.get("score", 0) or 0) for r in results[:8]) / max(1, min(8, len(results)))
        top_score = float(results[0].get("score", 0) or 0) if results else 0.0
        tightness = top_score - avg_score
        if count >= CONTENT_MIN_TIGHT_PRODUCTS and avg_score >= CONTENT_STRONG_AVG_SCORE and tightness <= 0.12:
            coverage = "STRONG"
        elif count > 0:
            coverage = "WEAK"
        else:
            coverage = "NO_MATCH"
        if count >= CONTENT_MIN_TIGHT_PRODUCTS and avg_score >= CONTENT_NO_PAGE_AVG_SCORE and not has_page:
            coverage = "NO_PAGE"
        theme_rows.append({
            "theme": theme,
            "coverage_class": coverage,
            "product_count": count,
            "anchor_products": anchors,
            "recommendation": "",
            "avg_similarity": round(avg_score, 4),
            "tightness": round(tightness, 4),
        })
    rec_targets = [
        {"theme": row["theme"], "coverage_class": row["coverage_class"], "anchor_products": row["anchor_products"]}
        for row in theme_rows
        if row["coverage_class"] in {"STRONG", "NO_PAGE"}
    ]
    recs = {r.get("theme"): r.get("recommendation", "") for r in llm_gap_recs(state, rec_targets)}
    for row in theme_rows:
        row["recommendation"] = recs.get(row["theme"], "")
        if row["coverage_class"] in {"STRONG", "NO_PAGE"} and not row["recommendation"]:
            anchors = ", ".join(row["anchor_products"][:3])
            row["recommendation"] = f"{row['theme']} has a tight product cluster; review a dedicated buyer page/listicle anchored by {anchors}."
    return theme_rows


def text_value(payload: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, (int, float)) and value:
            return str(value)
    return ""


def list_value(payload: dict[str, Any], *keys: str) -> list[str]:
    values: list[str] = []
    for key in keys:
        value = payload.get(key)
        if isinstance(value, list):
            values.extend(str(v).strip() for v in value if str(v).strip())
        elif isinstance(value, str) and value.strip():
            values.extend(v.strip() for v in re.split(r"[,|;]", value) if v.strip())
    return values


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def looks_templated(text: str) -> bool:
    lowered = re.sub(r"\s+", " ", text.lower()).strip()
    if not lowered:
        return True
    template_bits = [
        "apply as directed",
        "this product type",
        "premium quality",
        "original product",
        "buy online in bangladesh",
        "cash on delivery",
        "suitable for all skin types",
    ]
    return any(bit in lowered for bit in template_bits)


def has_size(name: str, payload: dict[str, Any]) -> bool:
    if text_value(payload, "size", "volume", "attribute_size", "pa_size"):
        return True
    return bool(re.search(r"\b\d+(?:\.\d+)?\s?(ml|g|gm|gram|kg|oz|fl oz|pcs|pads|sheets|tablets|capsules)\b", name.lower()))


def has_concern(payload: dict[str, Any]) -> bool:
    explicit = list_value(payload, "concern_tags", "concerns", "pa_concern")
    if explicit:
        return True
    concern_words = {
        "acne", "blemish", "anti-aging", "anti aging", "hydration", "dryness", "pores",
        "oil control", "melasma", "brightening", "wrinkle", "sensitivity", "dandruff",
    }
    category = text_value(payload, "category").lower()
    return any(word in category for word in concern_words)


def has_use_case(payload: dict[str, Any]) -> bool:
    values = list_value(payload, "skin_type", "skin_types", "use_case", "suitable_for", "how_to_use")
    if values:
        return True
    category = text_value(payload, "category").lower()
    return any(word in category for word in ("dry", "oily", "sensitive", "acne", "baby", "hair", "lip", "eye"))


def has_routine_info(payload: dict[str, Any]) -> bool:
    text = " ".join([
        text_value(payload, "routine", "compatibility", "care_info", "how_to_use"),
        text_value(payload, "short_description", "description"),
    ]).lower()
    return any(word in text for word in ("routine", "after cleansing", "before moisturizer", "use with", "pair", "compatible", "how to use"))


def has_real_qna(payload: dict[str, Any]) -> bool:
    qna = payload.get("faqs") or payload.get("faq") or payload.get("qna")
    if not qna:
        return False
    text = json.dumps(qna, ensure_ascii=False) if not isinstance(qna, str) else qna
    if word_count(text) < 60 or looks_templated(text):
        return False
    return True


def has_identifier(payload: dict[str, Any]) -> bool:
    gtin = text_value(payload, "gtin", "ean", "upc", "isbn", "barcode")
    if gtin and re.search(r"\d{8,14}", gtin):
        return True
    identifier_exists = payload.get("identifier_exists")
    if isinstance(identifier_exists, bool):
        return identifier_exists is False
    if isinstance(identifier_exists, str):
        return identifier_exists.strip().lower() in {"false", "no", "0"}
    return False


def has_mpn_or_brand_product_id(payload: dict[str, Any]) -> bool:
    if text_value(payload, "mpn", "manufacturer_part_number"):
        return True
    return bool(text_value(payload, "brand") and text_value(payload, "product_id", "id"))


def has_offer_price_valid_until(payload: dict[str, Any]) -> bool:
    price = payload.get("price_bdt") or payload.get("price")
    valid_until = text_value(payload, "priceValidUntil", "price_valid_until", "offer_price_valid_until")
    return bool(price and valid_until)


def title_locked(payload: dict[str, Any]) -> bool:
    title = text_value(payload, "seo_title", "title")
    name = text_value(payload, "name")
    if not name:
        return False
    expected = f"{name} Price in Bangladesh | Emart"
    if title:
        return title == expected
    return len(expected) <= 70


def consistency_flags(payload: dict[str, Any]) -> list[str]:
    flags: list[str] = []
    page_price = payload.get("page_price_bdt")
    feed_price = payload.get("feed_price_bdt")
    if page_price not in (None, "") and feed_price not in (None, "") and str(page_price) != str(feed_price):
        flags.append("CRITICAL_PRICE_MISMATCH")
    page_availability = text_value(payload, "page_availability")
    feed_availability = text_value(payload, "feed_availability")
    if page_availability and feed_availability and page_availability != feed_availability:
        flags.append("CRITICAL_AVAILABILITY_MISMATCH")
    return flags


def tier_for(score: int) -> str:
    if score >= 95:
        return "GOLDEN"
    if score >= 75:
        return "STRONG"
    if score >= 50:
        return "PARTIAL"
    return "THIN"


def agentic_score_row(point: dict[str, Any], links_by_slug: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    payload = point.get("payload", {})
    slug = text_value(payload, "slug")
    name = text_value(payload, "name")
    desc = text_value(payload, "description", "short_description")
    links = links_by_slug.get(slug, [])
    checks = {
        "locked_title": title_locked(payload),
        "description_150_words_not_templated": word_count(desc) > 150 and not looks_templated(desc),
        "gtin_or_identifier_exists_false": has_identifier(payload),
        "mpn_or_brand_product_id": has_mpn_or_brand_product_id(payload),
        "offer_price_valid_until": has_offer_price_valid_until(payload),
        "concern_tags": has_concern(payload),
        "key_ingredients": bool(list_value(payload, "ingredients", "key_ingredients", "ingredient_tags")),
        "skin_type_or_use_case": has_use_case(payload),
        "size_volume": has_size(name, payload),
        "origin_country": bool(text_value(payload, "origin", "country")),
        "brand": bool(text_value(payload, "brand")),
        "real_qna": has_real_qna(payload),
        "related_substitute_links": len(links) >= 4,
        "routine_compatibility_care": has_routine_info(payload),
    }
    missing = [field for field, present in checks.items() if not present]
    score = sum(AGENTIC_WEIGHTS[field] for field, present in checks.items() if present)
    critical = consistency_flags(payload)
    if critical:
        missing.extend(critical)
    highest = max(missing, key=lambda field: AGENTIC_WEIGHTS.get(field, 1000 if field.startswith("CRITICAL") else 0), default="")
    note_parts = []
    if not desc:
        note_parts.append("Woo description was missing or too short for agentic-shopping readiness.")
    if not has_real_qna(payload):
        note_parts.append("No real product Q&A found in Woo enrichment; FAQ quality needs manual/product-data review.")
    if not has_identifier(payload):
        note_parts.append("Missing GTIN or explicit identifier_exists:false, the strongest agentic matching gap.")
    if critical:
        note_parts.append("CRITICAL consistency mismatch present; fix before agentic shopping exposure.")
    if payload.get("woo_read_error"):
        note_parts.append(f"Woo read failed for enrichment: {payload['woo_read_error']}.")
    return {
        "slug": slug,
        "score": score,
        "tier": tier_for(score),
        "missing_fields": missing,
        "highest_value_fix": highest,
        "llm_note": " ".join(note_parts) or "Core Qdrant fields look usable; review missing structured fields before marking golden.",
    }


def job_agentic_score(points: list[dict[str, Any]], links: list[dict[str, Any]]) -> list[dict[str, Any]]:
    links_by_slug = {
        row.get("source_slug", ""): row.get("suggested_links", [])
        for row in links
        if isinstance(row.get("suggested_links"), list)
    }
    enriched_points: list[dict[str, Any]] = []
    for point in points:
        payload = point.get("payload", {})
        product_id = payload.get("product_id")
        if product_id:
            try:
                woo = wc_get(f"products/{product_id}")
                payload = enrich_payload_from_woo(payload, woo)
            except Exception as exc:
                payload = {**payload, "woo_read_error": type(exc).__name__}
        enriched_points.append({**point, "payload": payload})
    rows = [agentic_score_row(point, links_by_slug) for point in enriched_points]
    rows.sort(key=lambda row: (row["score"], row["slug"]))
    return rows


def samples(paths: list[Path], n: int = 2) -> dict[str, list[Any]]:
    out: dict[str, list[Any]] = {}
    for path in paths:
        rows = []
        if path.exists():
            with path.open(encoding="utf-8") as handle:
                for _, line in zip(range(n), handle):
                    rows.append(json.loads(line))
        out[path.name] = rows
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=20)
    args = parser.parse_args()

    state = RunState(rate_events=[])
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    try:
        preflight_model(state)
        preflight_sidecar(state)
        preflight_qdrant(state)
        points = scroll_products(args.limit)
        links, duplicate_pairs = job_internal_links(state, points)
        gaps = job_content_gaps(state)
        duplicates = list(duplicate_pairs.values())
        agentic_scores = job_agentic_score(points, links)
        write_jsonl(INTERNAL_LINKS_FILE, links)
        write_jsonl(CONTENT_GAPS_FILE, gaps)
        write_jsonl(DUPLICATE_FLAGS_FILE, duplicates)
        write_jsonl(AGENTIC_SCORE_FILE, agentic_scores)
    except StopRun as exc:
        report = {
            "status": "stopped",
            "reason": str(exc),
            "model": state.model,
            "model_note": state.model_note,
            "sidecar_status": state.sidecar_status,
            "collection_dim": state.collection_dim,
        }
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 2

    report = {
        "status": "sample complete; owner review required before full run",
        "limit": args.limit,
        "model": state.model,
        "model_note": state.model_note,
        "sidecar_status": state.sidecar_status,
        "collection_dim": state.collection_dim,
        "llm_calls": state.llm_calls,
        "throttle": f"{LLM_MIN_INTERVAL_SECONDS}s between calls",
        "rate_events": state.rate_events,
        "counts": {
            INTERNAL_LINKS_FILE.name: len(links),
            CONTENT_GAPS_FILE.name: len(gaps),
            DUPLICATE_FLAGS_FILE.name: len(duplicates),
            AGENTIC_SCORE_FILE.name: len(agentic_scores),
        },
        "samples": samples([INTERNAL_LINKS_FILE, CONTENT_GAPS_FILE, DUPLICATE_FLAGS_FILE, AGENTIC_SCORE_FILE]),
        "writes": [str(INTERNAL_LINKS_FILE), str(CONTENT_GAPS_FILE), str(DUPLICATE_FLAGS_FILE), str(AGENTIC_SCORE_FILE)],
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
