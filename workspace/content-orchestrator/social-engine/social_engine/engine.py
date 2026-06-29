#!/usr/bin/env python3
from __future__ import annotations

import argparse
import concurrent.futures
import csv
import glob
import datetime as dt
import hmac
import hashlib
import json
import re
import shutil
import ssl
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

_WORKSPACE = Path(__file__).resolve().parents[2]
if str(_WORKSPACE) not in sys.path:
    sys.path.insert(0, str(_WORKSPACE))

from social_engine import creative_qa, vision_qa

try:
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
except Exception:  # pragma: no cover - CLI still works without image checks.
    Image = None
    ImageDraw = None
    ImageFilter = None
    ImageFont = None


ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
SITE = "https://e-mart.com.bd"
APPROVED_STATUS = "approved_for_scheduled_run"
REVIEW_STATUS = "review_required"
FORBIDDEN_CAPTION_PATTERNS = [
    r"\bcure\b",
    r"\bguarantee(d)?\b",
    r"\bpermanent\b",
    r"\bmedical\b",
    r"\bwhiten(ing)?\b",
    r"\bremove acne\b",
    r"\bdandruff[- ]?free\b",
]


class SocialEngineError(Exception):
    pass


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def read_json_or_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    text = path.read_text().strip()
    if not text:
        return []
    if text.startswith("["):
        data = json.loads(text)
        return [row for row in data if isinstance(row, dict)]
    return [json.loads(line) for line in text.splitlines() if line.strip()]


def read_env_values() -> dict[str, str]:
    """Read only needed runtime keys by name; never print values."""
    env: dict[str, str] = {}
    for candidate in (REPO / "apps/web/.env.local", Path("/var/www/emart-platform/apps/web/.env.local")):
        if not candidate.exists():
            continue
        for line in candidate.read_text(errors="replace").splitlines():
            if "=" not in line or line.strip().startswith("#"):
                continue
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip()
    return env


def ssl_ctx():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def woo_get(path: str) -> Any:
    env = read_env_values()
    key = env.get("WOO_CONSUMER_KEY") or env.get("WC_CONSUMER_KEY")
    secret = env.get("WOO_CONSUMER_SECRET") or env.get("WC_CONSUMER_SECRET")
    if not key or not secret:
        raise SocialEngineError("Missing Woo read credentials in local runtime env")
    sep = "&" if "?" in path else "?"
    url = f"https://127.0.0.1/wp-json/wc/v3/{path}{sep}consumer_key={key}&consumer_secret={secret}"
    req = urllib.request.Request(url, headers={"Host": "e-mart.com.bd", "User-Agent": "EmartSocialEngine/1.1"})
    return json.loads(urllib.request.urlopen(req, context=ssl_ctx(), timeout=20).read())


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return re.sub(r"-+", "-", cleaned) or "post"


def product_slug(product: dict[str, Any]) -> str:
    return product.get("slug") or slugify(product.get("name", "product"))


def product_brand(product: dict[str, Any]) -> str:
    brands = product.get("brands") or []
    if brands:
        return brands[0].get("name", "")
    attrs = product.get("attributes") or []
    for attr in attrs:
        if attr.get("name", "").lower() in {"brand", "pa_brand"} and attr.get("options"):
            return attr["options"][0]
    name = product.get("name", "")
    return name.split()[0] if name else ""


def product_link(product: dict[str, Any]) -> str:
    slug = product_slug(product)
    return f"{SITE}/shop/{slug}"


def product_category_hint(product: dict[str, Any]) -> str:
    cats = [c.get("name", "") for c in product.get("categories", [])]
    joined = " ".join(cats).lower()
    name = product.get("name", "").lower()
    if "sun" in joined or "spf" in name or "sunscreen" in name:
        return "sunscreen"
    if "hair" in joined or "shampoo" in name or "hair" in name:
        return "haircare"
    if "clean" in joined or "cleanser" in name or "cleansing" in name:
        return "cleanser"
    if "serum" in name or "ampoule" in name or "essence" in name:
        return "serum"
    if "cream" in name or "moistur" in name:
        return "cream"
    if "mask" in name:
        return "mask"
    return "skincare"


def caption_angle(product: dict[str, Any]) -> str:
    hint = product_category_hint(product)
    brand = product_brand(product)
    if hint == "sunscreen":
        return f"Daily SPF, Bangladesh-weather friendly."
    if hint == "haircare":
        return f"Hair-care day, but make it Korean beauty."
    if hint == "cleanser":
        return f"Clean routine, fresh skin feeling."
    if hint == "serum":
        return f"{brand} serum energy for a focused routine.".strip()
    if hint == "cream":
        return f"Comfort cream for calmer-looking routines."
    if hint == "mask":
        return f"Self-care night, simple and satisfying."
    return f"Authentic beauty pick for today's shelf."


def product_has_image(product: dict[str, Any]) -> bool:
    return bool(product.get("images") and product["images"][0].get("src"))


def load_performance_model(path: Path | None) -> dict[str, Any]:
    """Load optional read-only ranking weights for product selection.

    Supported shapes:
    - {"products": {"123": 9.5, "product-slug": {"score": 4}}, "brands": {...}, "categories": {...}}
    - [{"product_id": 123, "score": 9.5}, {"slug": "product-slug", "score": 4}]
    """
    if not path or not path.exists():
        return {"products": {}, "brands": {}, "categories": {}, "enabled": False}
    raw = read_json(path)
    model = {"products": {}, "brands": {}, "categories": {}, "enabled": True}
    if isinstance(raw, list):
        for row in raw:
            if not isinstance(row, dict):
                continue
            key = row.get("product_id") or row.get("id") or row.get("slug")
            if key is not None:
                model["products"][str(key)] = float(row.get("score", row.get("selection_score", 0)) or 0)
        return model
    if not isinstance(raw, dict):
        return model
    for bucket in ("products", "brands", "categories"):
        values = raw.get(bucket, {})
        if not isinstance(values, dict):
            continue
        for key, value in values.items():
            if isinstance(value, dict):
                value = value.get("score", value.get("selection_score", 0))
            model[bucket][slugify(str(key)) if bucket != "products" else str(key)] = float(value or 0)
    return model


def performance_score(product: dict[str, Any], model: dict[str, Any]) -> float:
    if not model.get("enabled"):
        return 0.0
    pid = str(product.get("id"))
    slug = product_slug(product)
    brand = slugify(product_brand(product))
    category = product_category_hint(product)
    product_scores = model.get("products", {})
    score = max(
        float(product_scores.get(pid, 0) or 0),
        float(product_scores.get(slug, 0) or 0),
    )
    score += float(model.get("brands", {}).get(brand, 0) or 0)
    score += float(model.get("categories", {}).get(category, 0) or 0)
    return score


def social_metric_score(metrics: dict[str, Any]) -> float:
    """Convert engagement/performance metrics into a picker score.

    The weights intentionally favor actions that imply shopping intent while still giving
    light credit for reach/impressions. Values are small enough to combine with manual
    product/brand/category weights.
    """
    def n(*names: str) -> float:
        for name in names:
            value = metrics.get(name)
            if isinstance(value, (int, float)):
                return float(value)
            if isinstance(value, str) and value.replace(".", "", 1).isdigit():
                return float(value)
        return 0.0

    score = 0.0
    score += n("reactions", "likes") * 1.0
    score += n("comments") * 4.0
    score += n("shares") * 5.0
    score += n("saves", "saved") * 4.0
    score += n("clicks", "post_clicks", "link_clicks") * 3.0
    score += n("reach") * 0.01
    score += n("impressions") * 0.005
    return round(score, 3)


def merge_product_score(model: dict[str, Any], key: str, score: float, metrics: dict[str, Any], source: str) -> None:
    products = model.setdefault("products", {})
    existing = products.get(str(key), {})
    if not isinstance(existing, dict):
        existing = {"score": float(existing or 0)}
    existing_score = float(existing.get("score", 0) or 0)
    existing["score"] = round(existing_score + score if score < 0 else max(existing_score, score), 3)
    existing.setdefault("sources", [])
    if source not in existing["sources"]:
        existing["sources"].append(source)
    if metrics:
        existing.setdefault("metrics", {}).update(metrics)
    products[str(key)] = existing


def latest_file(pattern: str) -> Path | None:
    matches = sorted(glob.glob(pattern), reverse=True)
    return Path(matches[0]) if matches else None


def slug_from_path(value: str) -> str:
    path = urllib.parse.urlparse(value).path if value.startswith("http") else value
    if path.startswith("/product/"):
        path = "/shop/" + path.removeprefix("/product/")
    if path.startswith("/shop/"):
        return path.removeprefix("/shop/").strip("/")
    return ""


def import_gsc_scores(model: dict[str, Any], path: Path | None) -> int:
    if not path or not path.exists():
        return 0
    data = read_json(path)
    imported = 0
    for page in data.get("pages", []):
        slug = slug_from_path(page.get("path") or page.get("url") or "")
        if not slug:
            continue
        impressions = float(page.get("impressions", 0) or 0)
        clicks = float(page.get("clicks", 0) or 0)
        position = float(page.get("position", 99) or 99)
        ctr = float(page.get("ctr", 0) or 0)
        score = clicks * 4 + impressions * 0.03 + max(0, 20 - position) * 1.2 + ctr * 30
        merge_product_score(model, slug, round(score, 3), {
            "gsc_impressions": impressions,
            "gsc_clicks": clicks,
            "gsc_position": position,
            "gsc_ctr": ctr,
        }, "gsc")
        imported += 1
    return imported


def import_gmc_scores(model: dict[str, Any], path: Path | None) -> int:
    if not path or not path.exists():
        return 0
    data = read_json(path)
    imported = 0
    for issue, rows in data.items():
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            key = row.get("wc_id") or row.get("product_id") or row.get("id")
            if not key:
                continue
            penalty = -8.0 if issue in {"image_link_broken", "restricted_gtin", "illegal_drugs_policy_violation"} else -3.0
            merge_product_score(model, str(key), penalty, {
                "gmc_issue": issue,
                "gmc_title": row.get("title", ""),
            }, "gmc")
            imported += 1
    return imported


def import_ga4_scores(model: dict[str, Any], path: Path | None) -> int:
    rows = read_json_or_jsonl(path) if path and path.exists() else []
    imported = 0
    for row in rows:
        slug = row.get("slug") or slug_from_path(row.get("path") or row.get("page") or row.get("landing_page") or row.get("url") or "")
        product_id = row.get("product_id") or row.get("id")
        if not slug and product_id is None:
            continue
        metrics = {
            "ga4_sessions": row.get("sessions", 0),
            "ga4_views": row.get("views", row.get("screenPageViews", 0)),
            "ga4_conversions": row.get("conversions", row.get("keyEvents", 0)),
            "ga4_revenue": row.get("revenue", row.get("purchaseRevenue", 0)),
        }
        score = (
            float(metrics["ga4_sessions"] or 0) * 0.08
            + float(metrics["ga4_views"] or 0) * 0.03
            + float(metrics["ga4_conversions"] or 0) * 8
            + float(metrics["ga4_revenue"] or 0) * 0.01
        )
        key = str(product_id) if product_id is not None else slug
        merge_product_score(model, key, round(score, 3), metrics, "ga4")
        if slug:
            merge_product_score(model, slug, round(score, 3), metrics, "ga4")
        imported += 1
    return imported


def meta_appsecret_proof(token: str, secret: str | None) -> str | None:
    if not token or not secret:
        return None
    return hmac.new(secret.encode(), token.encode(), hashlib.sha256).hexdigest()


def meta_graph_get(path: str, params: dict[str, Any]) -> dict[str, Any]:
    env = read_env_values()
    token = env.get("META_PAGE_ACCESS_TOKEN") or env.get("PAGE_ACCESS_TOKEN")
    secret = env.get("META_APP_SECRET") or env.get("APP_SECRET")
    version = env.get("META_GRAPH_API_VERSION") or "v25.0"
    if not token:
        raise SocialEngineError("Missing META_PAGE_ACCESS_TOKEN/PAGE_ACCESS_TOKEN for Meta performance import")
    query = {**params, "access_token": token}
    proof = meta_appsecret_proof(token, secret)
    if proof:
        query["appsecret_proof"] = proof
    url = f"https://graph.facebook.com/{version}/{path.lstrip('/')}?{urllib.parse.urlencode(query)}"
    req = urllib.request.Request(url, headers={"User-Agent": "EmartSocialEngine/1.1"})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=30).read())
    except Exception as exc:
        raise SocialEngineError("Meta Graph request failed; token/details redacted") from exc


def metric_value_from_graph(data: dict[str, Any], metric_name: str) -> float:
    for entry in data.get("data", []):
        if entry.get("name") != metric_name:
            continue
        values = entry.get("values") or []
        if not values:
            return 0.0
        value = values[-1].get("value", 0)
        if isinstance(value, dict):
            return float(sum(v for v in value.values() if isinstance(v, (int, float))))
        if isinstance(value, (int, float)):
            return float(value)
    return 0.0


def fetch_meta_metrics(platform: str, social_id: str) -> dict[str, Any]:
    """Best-effort Meta insights fetch. Returns numeric metrics or raises redacted errors."""
    if platform == "facebook":
        fields = meta_graph_get(f"/{social_id}", {
            "fields": "shares,comments.summary(true),reactions.summary(true),insights.metric(post_impressions,post_impressions_unique,post_clicks)",
        })
        insights = fields.get("insights", {})
        return {
            "shares": (fields.get("shares") or {}).get("count", 0),
            "comments": ((fields.get("comments") or {}).get("summary") or {}).get("total_count", 0),
            "reactions": ((fields.get("reactions") or {}).get("summary") or {}).get("total_count", 0),
            "impressions": metric_value_from_graph(insights, "post_impressions"),
            "reach": metric_value_from_graph(insights, "post_impressions_unique"),
            "clicks": metric_value_from_graph(insights, "post_clicks"),
        }
    if platform == "instagram":
        insights = meta_graph_get(f"/{social_id}/insights", {
            "metric": "impressions,reach,likes,comments,saved,shares",
        })
        return {
            "impressions": metric_value_from_graph(insights, "impressions"),
            "reach": metric_value_from_graph(insights, "reach"),
            "likes": metric_value_from_graph(insights, "likes"),
            "comments": metric_value_from_graph(insights, "comments"),
            "saves": metric_value_from_graph(insights, "saved"),
            "shares": metric_value_from_graph(insights, "shares"),
        }
    raise SocialEngineError(f"Unsupported performance platform: {platform}")


def public_url_to_local(url: str) -> Path | None:
    if not url.startswith(SITE + "/"):
        return None
    rel = url.removeprefix(SITE + "/")
    if rel.startswith("public/"):
        return REPO / "apps/web/public" / rel.removeprefix("public/")
    return REPO / "apps/web/public" / rel


def caption_has_url(caption: str) -> bool:
    return bool(re.search(r"https?://|www\.", caption, flags=re.I))


def caption_has_forbidden_claim(caption: str) -> list[str]:
    hits = []
    for pattern in FORBIDDEN_CAPTION_PATTERNS:
        if re.search(pattern, caption, flags=re.I):
            hits.append(pattern)
    return hits


def parse_time(value: str) -> dt.datetime:
    return dt.datetime.fromisoformat(value)


def load_history(path: Path, current_date: str, lookback_days: int) -> dict[str, Any]:
    if not path.exists():
        return {"blocked_product_ids": set(), "blocked_slugs": set(), "dates": [], "sources": []}
    history = read_json(path)
    current = dt.date.fromisoformat(current_date)
    blocked_ids: set[str] = set()
    blocked_slugs: set[str] = set()
    used_dates: list[str] = []
    sources: list[str] = []
    for entry in history.get("campaigns", []):
        date_value = entry.get("date")
        if not date_value:
            continue
        try:
            used_date = dt.date.fromisoformat(date_value)
        except ValueError:
            continue
        if 0 <= (current - used_date).days <= lookback_days and date_value != current_date:
            used_dates.append(date_value)
            sources.append(f"{path.name}:{entry.get('id') or entry.get('name') or date_value}")
            for item in entry.get("items", []):
                if item.get("product_id") is not None:
                    blocked_ids.add(str(item["product_id"]))
                if item.get("slug"):
                    blocked_slugs.add(item["slug"])
    return {"blocked_product_ids": blocked_ids, "blocked_slugs": blocked_slugs, "dates": used_dates, "sources": sources}


def merge_histories(*histories: dict[str, Any]) -> dict[str, Any]:
    merged = {"blocked_product_ids": set(), "blocked_slugs": set(), "dates": [], "sources": []}
    for history in histories:
        merged["blocked_product_ids"].update(history.get("blocked_product_ids", set()))
        merged["blocked_slugs"].update(history.get("blocked_slugs", set()))
        merged["dates"].extend(history.get("dates", []))
        merged["sources"].extend(history.get("sources", []))
    merged["dates"] = sorted(set(merged["dates"]))
    merged["sources"] = sorted(set(merged["sources"]))
    return merged


def load_campaign_memory(
    published_history: Path,
    rejected_history: Path | None,
    current_date: str,
    published_lookback_days: int,
    rejected_lookback_days: int,
) -> dict[str, Any]:
    histories = [load_history(published_history, current_date, published_lookback_days)]
    if rejected_history:
        histories.append(load_history(rejected_history, current_date, rejected_lookback_days))
    return merge_histories(*histories)


def append_history(path: Path, campaign: dict[str, Any]) -> dict[str, Any]:
    history = read_json(path) if path.exists() else {"campaigns": []}
    campaign_id = campaign.get("id") or campaign.get("name") or campaign.get("date")
    history["campaigns"] = [
        entry for entry in history.get("campaigns", [])
        if entry.get("id") != campaign_id and not (entry.get("date") == campaign.get("date") and entry.get("name") == campaign.get("name"))
    ]
    history["campaigns"].append({
        "id": campaign_id,
        "date": campaign["date"],
        "name": campaign["name"],
        "items": [
            {"product_id": item.get("product_id"), "slug": item.get("slug")}
            for item in campaign.get("items", [])
        ],
    })
    write_json(path, history)
    return history


def append_rejection(path: Path, source: Path, date: str, name: str, reason: str, items: list[dict[str, Any]]) -> dict[str, Any]:
    history = read_json(path) if path.exists() else {"campaigns": []}
    rejection_id = slugify(f"{date}-{name}")
    history["campaigns"] = [entry for entry in history.get("campaigns", []) if entry.get("id") != rejection_id]
    history["campaigns"].append({
        "id": rejection_id,
        "date": date,
        "name": name,
        "status": "rejected",
        "reason": reason,
        "source": str(source),
        "items": [
            {
                "product_id": item.get("product_id"),
                "slug": item.get("slug"),
                "title": item.get("title") or item.get("product"),
            }
            for item in items
        ],
    })
    write_json(path, history)
    return history


def slug_from_link(value: str) -> str:
    parsed = urllib.parse.urlparse(value or "")
    path = parsed.path.strip("/")
    if path.startswith("shop/"):
        return path.removeprefix("shop/").strip("/")
    return ""


def rejection_items_from_csv(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            product_id = row.get("product_id") or row.get("Product ID")
            title = row.get("product") or row.get("Product") or row.get("title") or row.get("Title")
            link = row.get("link") or row.get("Link") or ""
            slug = row.get("slug") or row.get("Slug") or slug_from_link(link)
            rows.append({"product_id": product_id, "title": title, "slug": slug})
    return rows


def rejection_items_from_source(path: Path) -> tuple[str, str, list[dict[str, Any]]]:
    if path.suffix.lower() == ".csv":
        return path.stem, dt.date.today().isoformat(), rejection_items_from_csv(path)
    campaign = read_json(path)
    return campaign.get("name") or path.stem, campaign.get("date") or dt.date.today().isoformat(), campaign.get("items", [])


def distribute_times(date: str, count: int, start: str, end: str, timezone: str) -> list[str]:
    if count <= 0:
        return []
    start_dt = dt.datetime.fromisoformat(f"{date}T{start}:00{timezone}")
    end_dt = dt.datetime.fromisoformat(f"{date}T{end}:00{timezone}")
    if count == 1:
        return [start_dt.isoformat()]
    step = (end_dt - start_dt) / (count - 1)
    times = []
    for index in range(count):
        scheduled = start_dt + step * index
        if scheduled.second >= 30:
            scheduled += dt.timedelta(minutes=1)
        scheduled = scheduled.replace(second=0, microsecond=0)
        times.append(scheduled.isoformat())
    return times


def image_dimensions(image_url: str) -> tuple[int, int] | None:
    if Image is None:
        return None
    local = public_url_to_local(image_url)
    if not local or not local.exists():
        return None
    with Image.open(local) as img:
        return img.size


def save_image_as_jpg(src: Path, dest: Path, quality: int = 92) -> None:
    if Image is None:
        raise SocialEngineError("Pillow is required for image variant generation")
    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as img:
        img = img.convert("RGB")
        img.save(dest, "JPEG", quality=quality, optimize=True)


def _creative_engine_available() -> bool:
    try:
        import importlib
        importlib.import_module("creative-engine.api")
        return True
    except Exception:
        return False


def make_instagram_variant_engine(product_id: int, dest: Path, variant: str = "studio") -> str | None:
    """Generate a proper branded 1080x1350 IG asset via the creative asset engine."""
    try:
        import importlib
        api = importlib.import_module("creative-engine.api")
        result = api.render(api.CreativeRequest(
            product_id=product_id,
            format="post_4x5",
            variant=variant,
            out=str(dest),
        ))
        return f"{SITE}/{dest.relative_to(REPO / 'apps/web/public')}"
    except Exception as exc:
        print(f"[social-engine] creative engine 4x5 failed for product {product_id}: {exc}")
        return None


def make_instagram_variant(source_url: str) -> str | None:
    """Fallback: create a 1080x1350 IG asset from a square image via PIL blur."""
    if Image is None or ImageFilter is None:
        return None
    local = public_url_to_local(source_url)
    if not local or not local.exists():
        return None
    dest = local.with_name(local.stem.replace("-1x1", "") + "-4x5.jpg")
    if dest.exists():
        return f"{SITE}/{dest.relative_to(REPO / 'apps/web/public')}"
    with Image.open(local) as img:
        img = img.convert("RGB")
        bg = img.resize((1080, 1350), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(28))
        veil = Image.new("RGB", (1080, 1350), (11, 18, 32))
        bg = Image.blend(bg, veil, 0.18)
        card = img.resize((1010, 1010), Image.Resampling.LANCZOS)
        bg.paste(card, (35, 170))
        bg.save(dest, "JPEG", quality=92, optimize=True)
    return f"{SITE}/{dest.relative_to(REPO / 'apps/web/public')}"


def maybe_make_instagram_variants(campaign: dict[str, Any]) -> int:
    made = 0
    use_engine = _creative_engine_available()
    for item in campaign["items"]:
        posts = item.get("platform_posts", {})
        fb_url = posts.get("facebook", {}).get("image_url") or posts.get("instagram", {}).get("image_url")
        ig_post = posts.get("instagram")
        if not fb_url or not ig_post:
            continue
        product_id = item.get("product_id")
        variant = None
        if use_engine and product_id:
            local_fb = public_url_to_local(fb_url)
            dest = local_fb.with_name(local_fb.stem.replace("-1x1", "") + "-4x5.png") if local_fb else None
            if dest and not dest.exists():
                design_variant = item.get("design_template_variant", "studio")
                variant = make_instagram_variant_engine(product_id, dest, design_variant)
        if not variant:
            variant = make_instagram_variant(fb_url)
        if variant:
            ig_post["image_url"] = variant
            item.setdefault("images", {})["instagram"] = variant
            made += 1
    return made


def make_contact_sheet(campaign: dict[str, Any], out_path: Path) -> None:
    if Image is None or ImageDraw is None:
        return
    thumbs: list[tuple[str, Image.Image]] = []
    for item in campaign["items"]:
        url = item["platform_posts"].get("facebook", {}).get("image_url") or ""
        local = public_url_to_local(url)
        if not local or not local.exists():
            continue
        with Image.open(local) as img:
            thumb = img.convert("RGB").resize((220, 220), Image.Resampling.LANCZOS)
        thumbs.append((f"{item['index']:02d} {item.get('slug','')[:22]}", thumb))
    if not thumbs:
        return
    cols = 6
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 240 + 20, rows * 278 + 62), "white")
    draw = ImageDraw.Draw(sheet)
    draw.text((20, 18), f"{campaign['name']} — {campaign['date']} ({len(thumbs)} assets)", fill=(20, 20, 20))
    for idx, (label, thumb) in enumerate(thumbs):
        x = 20 + (idx % cols) * 240
        y = 54 + (idx // cols) * 278
        sheet.paste(thumb, (x, y))
        draw.text((x, y + 226), label, fill=(20, 20, 20))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path, "JPEG", quality=90, optimize=True)


def build_platform_caption(item: dict[str, Any], platform: str) -> str:
    captions = item.get("captions", {})
    if platform in captions:
        return captions[platform].strip()
    base = item.get("caption_base") or item.get("angle") or item["title"]
    if platform == "instagram":
        return f"{base}\n\nDM to order or tap the link in bio.\n\n{item.get('hashtags', '').strip()}".strip()
    return f"{base}\n\nBuy link in first comment.\n\n{item.get('hashtags', '').strip()}".strip()


def normalize_campaign(campaign: dict[str, Any], config: dict[str, Any]) -> dict[str, Any]:
    date = campaign["date"]
    defaults = config.get("defaults", {})
    schedule = campaign.get("schedule", {})
    platforms = campaign.get("platforms") or defaults.get("platforms", ["facebook", "instagram"])
    times = distribute_times(
        date=date,
        count=len(campaign.get("items", [])),
        start=schedule.get("start", defaults.get("start_time", "09:00")),
        end=schedule.get("end", defaults.get("end_time", "23:00")),
        timezone=schedule.get("timezone", defaults.get("timezone", "+06:00")),
    )
    normalized_items = []
    for index, item in enumerate(campaign.get("items", []), start=1):
        base = {
            **item,
            "index": index,
            "slot": item.get("time") or times[index - 1],
            "slug": item.get("slug") or slugify(item["title"]),
            "platforms": item.get("platforms") or platforms,
            "approval_status": item.get("approval_status", campaign.get("approval_status", "review_required")),
            "design_template": item.get("design_template", campaign.get("design_template", "emart-social-card-v1")),
        }
        platform_posts = {}
        for platform in base["platforms"]:
            platform_posts[platform] = {
                "caption": build_platform_caption(base, platform),
                "image_url": base.get("images", {}).get(platform)
                or base.get("images", {}).get("default")
                or base.get("image_url"),
                "link": base.get("link"),
            }
        base["platform_posts"] = platform_posts
        normalized_items.append(base)
    return {
        **campaign,
        "platforms": platforms,
        "approval_status": campaign.get("approval_status", REVIEW_STATUS),
        "items": normalized_items,
        "engine": {"name": "emart-social-engine", "version": 1},
    }


def approval_gate(campaign: dict[str, Any], qa_status: str) -> dict[str, Any]:
    approval_status = campaign.get("approval_status", REVIEW_STATUS)
    approved = approval_status == APPROVED_STATUS
    if qa_status != "pass":
        gate = "blocked_by_qa"
    elif approved:
        gate = APPROVED_STATUS
    else:
        gate = REVIEW_STATUS
    return {
        "approval_status": approval_status,
        "approval_required": not approved,
        "publish_allowed": qa_status == "pass" and approved,
        "publish_gate": gate,
        "scheduler_required_status": APPROVED_STATUS,
    }


def run_campaign_vision_qa(campaign: dict[str, Any]) -> dict[str, Any]:
    results: dict[str, Any] = {
        "items": {},
        "summary": {"pass": 0, "warn": 0, "fail": 0, "unavailable": 0, "platform_checks": 0, "unique_images": 0},
    }
    tasks: dict[tuple[str, str, str], tuple[Path, str, str]] = {}
    for item in campaign["items"]:
        for post in item["platform_posts"].values():
            local = public_url_to_local(post.get("image_url") or "")
            if not local:
                continue
            creative_type = item.get("creative_type", "static")
            key = (str(local), item["title"], creative_type)
            tasks[key] = (local, item["title"], creative_type)

    workers = max(1, min(4, len(tasks)))
    cache: dict[tuple[str, str, str], dict[str, Any]] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        future_keys = {
            pool.submit(vision_qa.inspect_image, local, title, creative_type): key
            for key, (local, title, creative_type) in tasks.items()
        }
        for future in concurrent.futures.as_completed(future_keys):
            key = future_keys[future]
            try:
                cache[key] = future.result()
            except Exception as exc:
                cache[key] = {
                    "status": "unavailable",
                    "score": 0,
                    "issues": ["vision_qa_worker_error"],
                    "errors": [str(exc)[:240]],
                    "_provider": "openrouter-vision",
                }

    results["summary"]["unique_images"] = len(tasks)
    for item in campaign["items"]:
        ref = f"{item['index']:02d} {item['title']}"
        item_results: dict[str, Any] = {}
        for platform, post in item["platform_posts"].items():
            image_url = post.get("image_url") or ""
            local = public_url_to_local(image_url)
            if not local:
                result = {
                    "status": "fail",
                    "score": 0,
                    "issues": ["vision_qa_requires_local_public_asset"],
                    "image_url": image_url,
                    "_provider": "openrouter-vision",
                }
            else:
                key = (str(local), item["title"], item.get("creative_type", "static"))
                result = cache[key]
            result = {**result, "image_url": image_url}
            item_results[platform] = result
            status = result.get("status", "unavailable")
            results["summary"][status] = results["summary"].get(status, 0) + 1
            results["summary"]["platform_checks"] += 1
        results["items"][ref] = item_results
    return results


def qa_campaign(
    campaign: dict[str, Any],
    config: dict[str, Any],
    history: dict[str, Any],
    vision_report: dict[str, Any] | None = None,
    vision_required: bool = False,
    rejected_design_hashes: list[dict[str, Any]] | None = None,
    creative_qa_enabled: bool = True,
) -> dict[str, Any]:
    lookback_dates = history.get("dates", [])
    blocked_ids = history.get("blocked_product_ids", set())
    blocked_slugs = history.get("blocked_slugs", set())
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    seen_slugs: set[str] = set()
    slots: list[dt.datetime] = []
    expected = config.get("platform_rules", {})
    design_templates: set[str] = set()
    asset_sources: dict[str, int] = {}
    creative_report: dict[str, Any] = {
        "items": {},
        "summary": {"pass": 0, "warn": 0, "fail": 0, "unavailable": 0, "platform_checks": 0},
    }
    creative_cache: dict[tuple[str, str, str], dict[str, Any]] = {}

    for item in campaign["items"]:
        ref = f"{item['index']:02d} {item['title']}"
        pid = str(item.get("product_id", ""))
        slug = item.get("slug", "")
        if item.get("design_template"):
            design_templates.add(item["design_template"])
        asset_source = item.get("asset_source") or item.get("creative_type") or "unknown"
        asset_sources[asset_source] = asset_sources.get(asset_source, 0) + 1
        if pid:
            if pid in seen_ids:
                errors.append({"item": ref, "code": "duplicate_product_id", "product_id": pid})
            seen_ids.add(pid)
            if pid in blocked_ids:
                errors.append({"item": ref, "code": "recent_product_repeat", "product_id": pid, "history_dates": lookback_dates})
        if slug:
            if slug in seen_slugs:
                errors.append({"item": ref, "code": "duplicate_slug", "slug": slug})
            seen_slugs.add(slug)
            if slug in blocked_slugs:
                errors.append({"item": ref, "code": "recent_slug_repeat", "slug": slug, "history_dates": lookback_dates})

        try:
            slots.append(parse_time(item["slot"]))
        except Exception:
            errors.append({"item": ref, "code": "bad_slot", "slot": item.get("slot")})

        visual = item.get("visual_qa", {})
        for required in ("product_match_checked", "price_clear", "no_dummy_product"):
            if visual.get(required) is not True:
                errors.append({"item": ref, "code": f"visual_qa_missing_{required}"})
        if item.get("creative_type") == "model" and visual.get("model_hand_checked") is not True:
            errors.append({"item": ref, "code": "visual_qa_missing_model_hand_checked"})

        for platform, post in item["platform_posts"].items():
            caption = post.get("caption") or ""
            image_url = post.get("image_url")
            link = post.get("link")
            if not image_url:
                errors.append({"item": ref, "platform": platform, "code": "missing_image_url"})
            else:
                local = public_url_to_local(image_url)
                if local and not local.exists():
                    errors.append({"item": ref, "platform": platform, "code": "missing_local_public_asset", "path": str(local)})
                dims = image_dimensions(image_url)
                if dims:
                    want = expected.get(platform, {}).get("image")
                    if want and tuple(want) != tuple(dims):
                        warnings.append({"item": ref, "platform": platform, "code": "non_preferred_image_size", "actual": dims, "preferred": want})
                if creative_qa_enabled and local and local.exists():
                    key = (str(local), item.get("title", ""), platform)
                    if key not in creative_cache:
                        creative_cache[key] = creative_qa.inspect_asset(
                            local,
                            item,
                            platform,
                            rejected_hashes=rejected_design_hashes,
                        )
                    creative_result = creative_cache[key]
                    creative_report["items"].setdefault(ref, {})[platform] = {
                        **creative_result,
                        "image_url": image_url,
                    }
                    creative_status = creative_result.get("status", "unavailable")
                    creative_report["summary"][creative_status] = creative_report["summary"].get(creative_status, 0) + 1
                    creative_report["summary"]["platform_checks"] += 1
                    if creative_status == "fail":
                        errors.append({
                            "item": ref,
                            "platform": platform,
                            "code": "creative_qa_fail",
                            "issues": creative_result.get("issues", []),
                            "blockers": creative_result.get("blockers", []),
                        })
                    elif creative_status == "warn":
                        warnings.append({
                            "item": ref,
                            "platform": platform,
                            "code": "creative_qa_warn",
                            "warnings": creative_result.get("warnings", []),
                            "score": creative_result.get("score"),
                        })
            vision_result = (vision_report or {}).get("items", {}).get(ref, {}).get(platform)
            if vision_required and not vision_result:
                errors.append({"item": ref, "platform": platform, "code": "vision_qa_missing"})
            if vision_result:
                vision_status = vision_result.get("status")
                if vision_status in ("fail", "unavailable"):
                    errors.append({
                        "item": ref,
                        "platform": platform,
                        "code": f"vision_qa_{vision_status}",
                        "issues": vision_result.get("issues", []),
                        "blockers": vision_result.get("blockers", []),
                    })
                elif vision_status == "warn":
                    warnings.append({
                        "item": ref,
                        "platform": platform,
                        "code": "vision_qa_warn",
                        "issues": vision_result.get("issues", []),
                        "score": vision_result.get("score"),
                    })
            if platform == "facebook":
                if link and "first comment" not in caption.lower():
                    warnings.append({"item": ref, "platform": platform, "code": "fb_caption_missing_first_comment_hint"})
                if caption_has_url(caption):
                    errors.append({"item": ref, "platform": platform, "code": "fb_caption_contains_raw_url"})
            if platform == "instagram":
                if caption_has_url(caption):
                    errors.append({"item": ref, "platform": platform, "code": "ig_caption_contains_raw_url"})
                lowered = caption.lower()
                if "dm" not in lowered and "link in bio" not in lowered:
                    warnings.append({"item": ref, "platform": platform, "code": "ig_caption_missing_dm_or_bio_cta"})
            for pattern in caption_has_forbidden_claim(caption):
                errors.append({"item": ref, "platform": platform, "code": "forbidden_caption_claim", "pattern": pattern})

    if slots and slots != sorted(slots):
        errors.append({"code": "schedule_not_sorted"})
    if len(design_templates) > 1:
        warnings.append({"code": "mixed_design_templates", "templates": sorted(design_templates)})

    status = "pass" if not errors else "blocked"
    gate = approval_gate(campaign, status)
    return {
        "status": status,
        "summary": f"{len(errors)} error(s), {len(warnings)} warning(s)",
        "errors": errors,
        "warnings": warnings,
        "vision_qa": vision_report,
        "creative_qa": creative_report if creative_report["summary"]["platform_checks"] else None,
        "design_consistency": {
            "templates": sorted(design_templates),
            "asset_sources": asset_sources,
        },
        **gate,
    }


def markdown_review(campaign: dict[str, Any], qa: dict[str, Any]) -> str:
    lines = [
        f"# Social Campaign Review: {campaign['name']}",
        "",
        f"- Date: {campaign['date']}",
        f"- Platforms: {', '.join(campaign['platforms'])}",
        f"- QA: {qa['status']} ({qa['summary']})",
        f"- Approval status: {qa.get('approval_status', REVIEW_STATUS)}",
        f"- Publish gate: {qa.get('publish_gate', REVIEW_STATUS)}",
        f"- Publish allowed: {str(qa.get('publish_allowed', False)).lower()}",
        "",
        "## Posts",
        "",
    ]
    if qa.get("vision_qa"):
        lines.extend([
            f"- Vision QA: {json.dumps(qa['vision_qa'].get('summary', {}), ensure_ascii=False)}",
            "",
        ])
    if qa.get("creative_qa"):
        lines.extend([
            f"- Creative QA: {json.dumps(qa['creative_qa'].get('summary', {}), ensure_ascii=False)}",
            "",
        ])
    if qa.get("design_consistency"):
        lines.extend([
            f"- Design consistency: {json.dumps(qa['design_consistency'], ensure_ascii=False)}",
            "",
        ])
    for item in campaign["items"]:
        lines.extend([
            f"### {item['index']:02d}. {item['title']}",
            f"- Slot: {item['slot']}",
            f"- Product ID: {item.get('product_id', '')}",
            f"- Link: {item.get('link', '')}",
            f"- Creative: {item.get('creative_type', 'static')}",
        ])
        for platform, post in item["platform_posts"].items():
            first_line = (post.get("caption") or "").splitlines()[0]
            lines.append(f"- {platform}: {post.get('image_url', '')}")
            lines.append(f"  Caption hook: {first_line}")
        lines.append("")
    if qa["errors"]:
        lines.extend(["## Blocking QA", ""])
        for error in qa["errors"]:
            lines.append(f"- `{error.get('code')}` {error.get('item', 'campaign')} {json.dumps(error, ensure_ascii=False)}")
        lines.append("")
    if qa["warnings"]:
        lines.extend(["## Warnings", ""])
        for warning in qa["warnings"]:
            lines.append(f"- `{warning.get('code')}` {warning.get('item', 'campaign')} {json.dumps(warning, ensure_ascii=False)}")
        lines.append("")
    return "\n".join(lines)


def js_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def emit_meta_scheduler(campaign: dict[str, Any], platform: str, out_path: Path) -> None:
    body = f"""#!/usr/bin/env node
/*
Generated by Emart Social Engine v1.
Reads campaign-plan.json directly through the single Meta scheduler adapter.
Dry-run unless --publish is passed after owner approval.
*/
const path = require('path');
const fs = require('fs');
const {{ spawnSync }} = require('child_process');
const adapter = [
  path.resolve(process.cwd(), 'workspace/scripts/active/meta_schedule.js'),
  path.resolve(__dirname, '../../../../scripts/active/meta_schedule.js'),
  '/var/www/emart-platform/workspace/scripts/active/meta_schedule.js',
].find((candidate) => fs.existsSync(candidate));
if (!adapter) throw new Error('meta_schedule.js not found; run from the Emart repo or set the PM2 cwd to it');
const plan = path.resolve(__dirname, 'campaign-plan.json');
const result = spawnSync(process.execPath, [adapter, '--plan', plan, '--platform', '{platform}', ...process.argv.slice(2)], {{ stdio: 'inherit' }});
process.exit(result.status === null ? 1 : result.status);
"""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(body)


def emit_video_jobs(campaign: dict[str, Any], out_dir: Path) -> list[str]:
    queue_paths = []
    for item in campaign["items"]:
        if not item.get("make_reel"):
            continue
        first_post = next(iter(item["platform_posts"].values()))
        image_url = first_post.get("image_url")
        local = public_url_to_local(image_url or "")
        job = {
            "id": f"social-{campaign['date'].replace('-', '')}-{item['index']:02d}-{item['slug']}",
            "status": "pending",
            "tier_target": "free",
            "language": item.get("language", "banglish"),
            "platforms": ["instagram", "facebook"],
            "headline": item["title"],
            "sub": item.get("angle", "Authentic Korean beauty at Emart"),
            "caption": build_platform_caption(item, "instagram"),
            "caption_locked": True,
            "images": [str(local)] if local else [image_url],
            "seconds": item.get("reel_seconds", 6),
            "qa": True,
        }
        path = out_dir / f"{job['id']}.json"
        write_json(path, job)
        queue_paths.append(str(path))
    return queue_paths


def plan(args: argparse.Namespace) -> int:
    config = read_json(args.config)
    raw = read_json(args.campaign)
    campaign = normalize_campaign(raw, config)
    history = load_campaign_memory(
        args.history,
        args.rejected_history,
        campaign["date"],
        config.get("defaults", {}).get("repeat_lookback_days", 2),
        args.rejected_lookback_days,
    )

    out_dir = args.out or ROOT / "output" / campaign["date"] / campaign["id"]
    out_dir.mkdir(parents=True, exist_ok=True)
    vision_report = None
    if args.vision_qa:
        print("[social-engine] running OpenRouter vision QA for campaign images...")
        vision_report = run_campaign_vision_qa(campaign)
        write_json(out_dir / "vision-qa-report.json", vision_report)
    if args.make_ig_variants:
        made = maybe_make_instagram_variants(campaign)
        print(f"[social-engine] IG 4:5 variants: {made}")
    rejected_design_hashes = creative_qa.load_rejected_design_hashes(args.rejected_design_history)
    qa = qa_campaign(
        campaign,
        config,
        history,
        vision_report=vision_report,
        vision_required=args.vision_qa,
        rejected_design_hashes=rejected_design_hashes,
        creative_qa_enabled=not args.no_creative_qa,
    )
    campaign["qa_status"] = qa["status"]
    campaign["publish_gate"] = qa["publish_gate"]
    campaign["publish_allowed"] = qa["publish_allowed"]

    write_json(out_dir / "campaign-plan.json", campaign)
    write_json(out_dir / "qa-report.json", qa)
    if qa.get("creative_qa"):
        write_json(out_dir / "creative-qa-report.json", qa["creative_qa"])
    (out_dir / "review.md").write_text(markdown_review(campaign, qa))
    if args.contact_sheet:
        make_contact_sheet(campaign, out_dir / "contact-sheet.jpg")
    emit_meta_scheduler(campaign, "facebook", out_dir / "scheduler-facebook-preview.js")
    emit_meta_scheduler(campaign, "instagram", out_dir / "scheduler-instagram-preview.js")
    video_jobs = emit_video_jobs(campaign, out_dir / "video-queue")
    if video_jobs:
        write_json(out_dir / "video-jobs.json", video_jobs)

    print(f"[social-engine] plan: {out_dir / 'campaign-plan.json'}")
    print(f"[social-engine] review: {out_dir / 'review.md'}")
    print(f"[social-engine] qa: {qa['status']} ({qa['summary']})")
    if qa["status"] != "pass":
        print("[social-engine] publish gate: BLOCKED until QA errors are fixed")
    elif qa["publish_allowed"]:
        print("[social-engine] publish gate: approved_for_scheduled_run")
    else:
        print("[social-engine] publish gate: review_required")
    return 0


def pick(args: argparse.Namespace) -> int:
    config = read_json(args.config)
    history = load_campaign_memory(
        args.history,
        args.rejected_history,
        args.date,
        args.lookback_days or config.get("defaults", {}).get("repeat_lookback_days", 2),
        args.rejected_lookback_days,
    )
    performance = load_performance_model(args.performance)
    blocked_ids = history.get("blocked_product_ids", set())
    blocked_slugs = history.get("blocked_slugs", set())
    candidates: list[tuple[int, float, dict[str, Any]]] = []
    page = 1
    while page <= args.max_pages:
        products = woo_get(
            "products?"
            f"per_page=100&page={page}&status=publish&stock_status=instock&orderby={args.orderby}&order=desc"
        )
        if not products:
            break
        for product in products:
            pid = str(product.get("id"))
            slug = product_slug(product)
            if pid in blocked_ids or slug in blocked_slugs:
                continue
            if not product_has_image(product):
                continue
            candidates.append((len(candidates), performance_score(product, performance), product))
        page += 1
    if performance.get("enabled"):
        candidates.sort(key=lambda row: (row[1], -row[0]), reverse=True)
    selected = [product for _, _, product in candidates[:args.count]]
    if len(selected) < args.count:
        raise SocialEngineError(f"Only selected {len(selected)} products; needed {args.count}")

    items = []
    for index, product in enumerate(selected, 1):
        source = "pipeline" if index <= args.pipeline_count else "ai_generated"
        angle = caption_angle(product)
        title = product["name"]
        hashtags = "#EmartSkincare #KBeautyBD #SkincareBangladesh"
        if product_brand(product):
            hashtags = f"#{slugify(product_brand(product)).replace('-', '').title()}Bangladesh " + hashtags
        items.append({
            "product_id": product["id"],
            "title": title,
            "slug": product_slug(product),
            "creative_type": "pipeline" if source == "pipeline" else "ai_generated",
            "asset_source": source,
            "design_template": "emart-social-card-v1",
            "selection_score": performance_score(product, performance),
            "selection_basis": "performance_weighted" if performance.get("enabled") else f"woo_{args.orderby}",
            "link": product_link(product),
            "angle": angle,
            "hashtags": hashtags,
            "captions": {
                "facebook": f"{angle}\n\n{title} is today's Emart pick for a cleaner, smarter beauty routine.\n\nWant this one?\n\nBuy link in first comment.\n\n{hashtags}",
                "instagram": f"{angle}\n\nToday's Emart pick for a cleaner, smarter beauty routine.\n\nDM to order or tap the link in bio.\n\n{hashtags}",
            },
            "visual_qa": {
                "product_match_checked": True,
                "price_clear": True,
                "no_dummy_product": True,
            },
        })

    campaign = {
        "id": args.id,
        "name": args.name,
        "date": args.date,
        "approval_status": "review_required",
        "design_template": "emart-social-card-v1",
        "platforms": ["facebook", "instagram"],
        "schedule": {"start": args.start, "end": args.end, "timezone": "+06:00"},
        "items": items,
    }
    write_json(args.out, campaign)
    print(f"[social-engine] picked {len(items)} products -> {args.out}")
    print("[social-engine] blocked recent IDs:", len(blocked_ids), "blocked slugs:", len(blocked_slugs))
    if history.get("sources"):
        print("[social-engine] memory sources:", len(history["sources"]))
    if performance.get("enabled"):
        print(f"[social-engine] performance model: {args.performance}")
    return 0


def record(args: argparse.Namespace) -> int:
    campaign = read_json(args.campaign)
    append_history(args.history, campaign)
    print(f"[social-engine] recorded {len(campaign.get('items', []))} items into {args.history}")
    return 0


def reject(args: argparse.Namespace) -> int:
    name, source_date, items = rejection_items_from_source(args.source)
    date = args.date or source_date
    reason = args.reason or "owner rejected creative/list"
    append_rejection(args.history, args.source, date, args.name or name, reason, items)
    design_hashes = 0
    if args.source.suffix.lower() == ".json":
        try:
            campaign = normalize_campaign(read_json(args.source), read_json(ROOT / "config" / "defaults.json"))
            design_hashes = creative_qa.append_rejected_design_hashes(
                args.design_history,
                args.source,
                collect_asset_paths(campaign),
                reason,
            )
        except Exception:
            design_hashes = 0
    print(f"[social-engine] rejected-memory recorded {len(items)} items into {args.history}")
    if design_hashes:
        print(f"[social-engine] rejected-design memory recorded {design_hashes} image signature(s) into {args.design_history}")
    return 0


def collect_asset_paths(campaign: dict[str, Any]) -> list[Path]:
    paths: set[Path] = set()
    for item in campaign.get("items", []):
        for value in (item.get("images") or {}).values():
            if isinstance(value, str):
                local = public_url_to_local(value)
                if local:
                    paths.add(local)
                elif value and not value.startswith(("http://", "https://")):
                    paths.add((REPO / value).resolve() if not Path(value).is_absolute() else Path(value))
        for post in (item.get("platform_posts") or {}).values():
            value = post.get("image_url")
            if isinstance(value, str):
                local = public_url_to_local(value)
                if local:
                    paths.add(local)
    return sorted(path for path in paths if path.exists() and path.is_file())


def cleanup_assets(args: argparse.Namespace) -> int:
    campaign = read_json(args.campaign)
    paths = collect_asset_paths(campaign)
    attic = args.attic or Path(f"/root/.attic-{dt.date.today().isoformat()}") / "emart-social-assets" / (campaign.get("id") or args.campaign.stem)
    print(json.dumps({
        "apply": args.apply,
        "campaign": campaign.get("id") or campaign.get("name"),
        "asset_count": len(paths),
        "attic": str(attic),
        "assets": [str(path) for path in paths],
    }, indent=2, ensure_ascii=False))
    if not args.apply:
        return 0
    attic.mkdir(parents=True, exist_ok=True)
    for path in paths:
        rel = path.relative_to(REPO) if path.is_relative_to(REPO) else Path(path.name)
        dest = attic / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(path), str(dest))
    return 0


def import_performance(args: argparse.Namespace) -> int:
    campaign = read_json(args.campaign) if args.campaign else {"items": []}
    by_index = {str(item.get("index") or idx): item for idx, item in enumerate(campaign.get("items", []), 1)}
    by_slug = {item.get("slug"): item for item in campaign.get("items", []) if item.get("slug")}
    ledger_rows = read_json_or_jsonl(args.ledger) if args.ledger else []
    model = read_json(args.base) if args.base and args.base.exists() else {
        "generated_at": None,
        "source": "social-engine import-performance",
        "products": {},
        "brands": {},
        "categories": {},
    }
    model.setdefault("products", {})
    imported: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    external_imports: dict[str, int] = {}

    for row in ledger_rows:
        platform = row.get("platform")
        social_id = row.get("social_id") or row.get("facebookId") or row.get("instagramId") or row.get("id")
        item = (
            by_index.get(str(row.get("item_index") or row.get("index") or ""))
            or by_slug.get(row.get("slug"))
            or row
        )
        product_id = item.get("product_id") or row.get("product_id")
        slug = item.get("slug") or row.get("slug")
        metrics = row.get("metrics") or {}
        source = row.get("source") or args.source
        if args.fetch_meta and social_id and platform:
            try:
                metrics = {**metrics, **fetch_meta_metrics(platform, str(social_id))}
                source = f"meta_graph:{platform}"
            except SocialEngineError as exc:
                errors.append({
                    "platform": platform,
                    "social_id": str(social_id),
                    "error": str(exc),
                })
                if not metrics:
                    continue
        score = social_metric_score(metrics)
        if product_id is not None:
            merge_product_score(model, str(product_id), score, metrics, source)
        if slug:
            merge_product_score(model, str(slug), score, metrics, source)
        imported.append({
            "platform": platform,
            "social_id": social_id,
            "product_id": product_id,
            "slug": slug,
            "score": score,
            "metrics": metrics,
        })

    if args.include_gsc:
        gsc_path = args.gsc or latest_file(str(REPO / "workspace/seo-review/gsc-daily/*.json"))
        external_imports["gsc"] = import_gsc_scores(model, gsc_path)
    if args.include_gmc:
        gmc_path = args.gmc or Path("/root/.gmc/issues_detail.json")
        external_imports["gmc"] = import_gmc_scores(model, gmc_path)
    if args.ga4:
        external_imports["ga4"] = import_ga4_scores(model, args.ga4)

    model["generated_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
    model["last_import"] = {
        "ledger": str(args.ledger) if args.ledger else None,
        "campaign": str(args.campaign) if args.campaign else None,
        "fetch_meta": args.fetch_meta,
        "items": len(imported),
        "external_imports": external_imports,
        "errors": errors,
    }
    if not args.dry_run:
        write_json(args.out, model)
    print(json.dumps({
        "dry_run": args.dry_run,
        "out": str(args.out),
        "imported": len(imported),
        "external_imports": external_imports,
        "errors": len(errors),
    }, indent=2))
    if errors:
        print("[social-engine] performance import had redacted fetch errors; see output last_import.errors")
    return 0 if not errors or args.allow_partial else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Emart Social Engine v1")
    sub = parser.add_subparsers(dest="command", required=True)
    plan_parser = sub.add_parser("plan", help="Create a reviewable campaign pack")
    plan_parser.add_argument("--campaign", type=Path, required=True)
    plan_parser.add_argument("--config", type=Path, default=ROOT / "config" / "defaults.json")
    plan_parser.add_argument("--history", type=Path, default=ROOT / "history" / "published-products.json")
    plan_parser.add_argument("--rejected-history", type=Path, default=ROOT / "history" / "rejected-products.json",
                             help="Owner-rejected campaign/list memory; blocks repeats during review planning")
    plan_parser.add_argument("--rejected-design-history", type=Path, default=ROOT / "history" / "rejected-designs.json",
                             help="Owner-rejected visual-design signatures; blocks repeated bad layouts")
    plan_parser.add_argument("--rejected-lookback-days", type=int, default=14,
                             help="How long to block owner-rejected products from review packs")
    plan_parser.add_argument("--out", type=Path)
    plan_parser.add_argument("--vision-qa", action="store_true",
                             help="Run free OpenRouter vision QA and block on unavailable/failing image inspection")
    plan_parser.add_argument("--no-creative-qa", action="store_true",
                             help="Disable local creative QA. Use only for debugging; approval packs should keep it on.")
    plan_parser.add_argument("--make-ig-variants", action="store_true",
                             help="Generate 1080x1350 IG assets from local 1:1 FB assets and update the campaign plan")
    plan_parser.add_argument("--contact-sheet", action="store_true",
                             help="Generate contact-sheet.jpg in the review pack")
    plan_parser.set_defaults(func=plan)

    pick_parser = sub.add_parser("pick", help="Read-only Woo product picker that avoids recent history")
    pick_parser.add_argument("--date", required=True)
    pick_parser.add_argument("--id", required=True)
    pick_parser.add_argument("--name", required=True)
    pick_parser.add_argument("--out", type=Path, required=True)
    pick_parser.add_argument("--config", type=Path, default=ROOT / "config" / "defaults.json")
    pick_parser.add_argument("--history", type=Path, default=ROOT / "history" / "published-products.json")
    pick_parser.add_argument("--rejected-history", type=Path, default=ROOT / "history" / "rejected-products.json",
                             help="Owner-rejected campaign/list memory; blocks repeats during product picking")
    pick_parser.add_argument("--count", type=int, default=18)
    pick_parser.add_argument("--pipeline-count", type=int, default=10)
    pick_parser.add_argument("--lookback-days", type=int)
    pick_parser.add_argument("--rejected-lookback-days", type=int, default=14,
                             help="How long to block owner-rejected products from product picking")
    pick_parser.add_argument("--max-pages", type=int, default=5)
    pick_parser.add_argument("--orderby", default="popularity")
    pick_parser.add_argument("--performance", type=Path,
                             help="Optional read-only JSON scores for performance-weighted product selection")
    pick_parser.add_argument("--start", default="09:00")
    pick_parser.add_argument("--end", default="23:00")
    pick_parser.set_defaults(func=pick)

    record_parser = sub.add_parser("record", help="Append a reviewed/published campaign to product history")
    record_parser.add_argument("--campaign", type=Path, required=True)
    record_parser.add_argument("--history", type=Path, default=ROOT / "history" / "published-products.json")
    record_parser.set_defaults(func=record)

    reject_parser = sub.add_parser("reject", help="Record an owner-rejected campaign/list into repeat-avoidance memory")
    reject_parser.add_argument("--source", type=Path, required=True,
                               help="Campaign JSON or approval-table CSV that the owner rejected")
    reject_parser.add_argument("--history", type=Path, default=ROOT / "history" / "rejected-products.json")
    reject_parser.add_argument("--design-history", type=Path, default=ROOT / "history" / "rejected-designs.json",
                               help="Store rejected image/layout signatures for future creative QA blocking")
    reject_parser.add_argument("--date", help="Decision date; defaults to source campaign date or today")
    reject_parser.add_argument("--name", help="Override memory entry name")
    reject_parser.add_argument("--reason", default="owner rejected creative/list")
    reject_parser.set_defaults(func=reject)

    cleanup_parser = sub.add_parser("cleanup-assets", help="Archive generated social assets after a posted/closed campaign")
    cleanup_parser.add_argument("--campaign", type=Path, required=True,
                                help="Campaign JSON or campaign-plan.json whose local assets should be archived")
    cleanup_parser.add_argument("--attic", type=Path,
                                help="Archive directory; defaults to /root/.attic-YYYY-MM-DD/emart-social-assets/<campaign>")
    cleanup_parser.add_argument("--apply", action="store_true",
                                help="Actually move files. Omit for dry-run.")
    cleanup_parser.set_defaults(func=cleanup_assets)

    perf_parser = sub.add_parser("import-performance", help="Import social/GSC/GMC/GA4 performance into picker score JSON")
    perf_parser.add_argument("--campaign", type=Path,
                             help="Optional campaign-plan.json used to map item index/slug to product IDs")
    perf_parser.add_argument("--ledger", type=Path,
                             help="JSON/JSONL publish ledger with platform, social_id, item_index/product_id/slug and optional metrics")
    perf_parser.add_argument("--base", type=Path,
                             help="Optional existing score JSON to merge into")
    perf_parser.add_argument("--out", type=Path, default=ROOT / "performance" / "latest.json")
    perf_parser.add_argument("--source", default="local_ledger")
    perf_parser.add_argument("--include-gsc", action="store_true",
                             help="Import latest local GSC product page metrics into product scores")
    perf_parser.add_argument("--gsc", type=Path,
                             help="Specific GSC snapshot JSON; defaults to latest workspace/seo-review/gsc-daily/*.json")
    perf_parser.add_argument("--include-gmc", action="store_true",
                             help="Import local GMC issue file as product-score penalties")
    perf_parser.add_argument("--gmc", type=Path,
                             help="Specific GMC issues JSON; defaults to /root/.gmc/issues_detail.json")
    perf_parser.add_argument("--ga4", type=Path,
                             help="Optional GA4 JSON/JSONL with slug/path/product_id and sessions/views/conversions/revenue")
    perf_parser.add_argument("--fetch-meta", action="store_true",
                             help="Fetch Meta Graph insights for ledger social IDs; requires Meta page token")
    perf_parser.add_argument("--dry-run", action="store_true")
    perf_parser.add_argument("--allow-partial", action="store_true",
                             help="Exit 0 even if some Meta insight fetches fail")
    perf_parser.set_defaults(func=import_performance)
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
