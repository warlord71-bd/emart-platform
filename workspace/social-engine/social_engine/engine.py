#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
from pathlib import Path
from typing import Any

try:
    from PIL import Image
except Exception:  # pragma: no cover - CLI still works without image checks.
    Image = None


ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
SITE = "https://e-mart.com.bd"
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


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return re.sub(r"-+", "-", cleaned) or "post"


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
        return {"blocked_product_ids": set(), "blocked_slugs": set(), "dates": []}
    history = read_json(path)
    current = dt.date.fromisoformat(current_date)
    blocked_ids: set[str] = set()
    blocked_slugs: set[str] = set()
    used_dates: list[str] = []
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
            for item in entry.get("items", []):
                if item.get("product_id") is not None:
                    blocked_ids.add(str(item["product_id"]))
                if item.get("slug"):
                    blocked_slugs.add(item["slug"])
    return {"blocked_product_ids": blocked_ids, "blocked_slugs": blocked_slugs, "dates": used_dates}


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
        "items": normalized_items,
        "engine": {"name": "emart-social-engine", "version": 1},
    }


def qa_campaign(campaign: dict[str, Any], config: dict[str, Any], history: dict[str, Any]) -> dict[str, Any]:
    lookback_dates = history.get("dates", [])
    blocked_ids = history.get("blocked_product_ids", set())
    blocked_slugs = history.get("blocked_slugs", set())
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    seen_slugs: set[str] = set()
    slots: list[dt.datetime] = []
    expected = config.get("platform_rules", {})

    for item in campaign["items"]:
        ref = f"{item['index']:02d} {item['title']}"
        pid = str(item.get("product_id", ""))
        slug = item.get("slug", "")
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

    status = "pass" if not errors else "blocked"
    return {
        "status": status,
        "summary": f"{len(errors)} error(s), {len(warnings)} warning(s)",
        "errors": errors,
        "warnings": warnings,
        "approval_required": True,
    }


def markdown_review(campaign: dict[str, Any], qa: dict[str, Any]) -> str:
    lines = [
        f"# Social Campaign Review: {campaign['name']}",
        "",
        f"- Date: {campaign['date']}",
        f"- Platforms: {', '.join(campaign['platforms'])}",
        f"- QA: {qa['status']} ({qa['summary']})",
        "- Approval: required before live publishing",
        "",
        "## Posts",
        "",
    ]
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
    posts = []
    for item in campaign["items"]:
        if platform not in item["platform_posts"]:
            continue
        post = item["platform_posts"][platform]
        posts.append({
            "time": item["slot"],
            "label": f"{platform.upper()} {item['index']:02d} {item['title']}",
            "image": post["image_url"],
            "link": post.get("link"),
            "caption": post["caption"],
        })
    body = f"""#!/usr/bin/env node
/*
Generated by Emart Social Engine v1.
Review the source campaign + QA report before starting with PM2.
*/
const posts = {json.dumps(posts, indent=2, ensure_ascii=False)};

console.log('Generated scheduler preview for {campaign["name"]} / {platform}');
for (const post of posts) {{
  console.log(`${{post.time}} | ${{post.label}} | ${{post.image}}`);
}}
console.log('Use campaign-plan.json with the production Meta scheduler adapter after owner approval.');
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
    history = load_history(args.history, campaign["date"], config.get("defaults", {}).get("repeat_lookback_days", 2))
    qa = qa_campaign(campaign, config, history)

    out_dir = args.out or ROOT / "output" / campaign["date"] / campaign["id"]
    out_dir.mkdir(parents=True, exist_ok=True)
    write_json(out_dir / "campaign-plan.json", campaign)
    write_json(out_dir / "qa-report.json", qa)
    (out_dir / "review.md").write_text(markdown_review(campaign, qa))
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
    else:
        print("[social-engine] publish gate: review_required")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Emart Social Engine v1")
    sub = parser.add_subparsers(dest="command", required=True)
    plan_parser = sub.add_parser("plan", help="Create a reviewable campaign pack")
    plan_parser.add_argument("--campaign", type=Path, required=True)
    plan_parser.add_argument("--config", type=Path, default=ROOT / "config" / "defaults.json")
    plan_parser.add_argument("--history", type=Path, default=ROOT / "history" / "published-products.json")
    plan_parser.add_argument("--out", type=Path)
    plan_parser.set_defaults(func=plan)
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
