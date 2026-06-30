#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import shutil
from datetime import datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
AUDIT_DIR = ROOT / "workspace/audit/active/social-reel-approval-20260630-brand-fresh-product-base-v6"
APP_PUBLIC_DIR = ROOT / "apps/web/public/images/social/2026-06-29/brand-fresh-product-base-v6"
OUTPUT_DIR = ROOT / "workspace/content-orchestrator/social-engine/output/2026-06-29/2026-06-29-brand-fresh-product-base-v6"
PUBLIC_BASE = "https://e-mart.com.bd/public/images/social/2026-06-29/brand-fresh-product-base-v6"
BDT = timezone(timedelta(hours=6))


ANGLES = {
    1: ("Pore-care routine-e clean, fresh finish chaile ei cream ta strong shelf pick.", "pore care", "skin texture"),
    2: ("Pink peptide glow routine-e soft, healthy-looking finish er jonno.", "peptide serum", "glow routine"),
    3: ("Retinol routine-e night-care step add korte chaile Medicube pick.", "retinol", "night skincare"),
    4: ("Rice toner routine-e milky hydration feel, dry/dull skin days er jonno.", "rice toner", "hydrating toner"),
    5: ("Peach + niacin serum glow routine-e bright, fresh-looking skin support kore.", "niacin serum", "glow serum"),
    6: ("Heartleaf lotion daily hydration-e light, calm-feel routine er jonno.", "heartleaf", "daily lotion"),
    7: ("Retinol cream slow-start night routine-e simple add-on.", "retinol cream", "night routine"),
    8: ("Cica cleanser daily wash-e gentle clean-feel chaile easy pick.", "cica cleanser", "daily cleanser"),
    9: ("Propolis cream glow + comfort routine-e rich jar pick.", "propolis cream", "moisturizer"),
    10: ("Eye area care-e rose eye cream, compact daily routine pick.", "eye cream", "rose skincare"),
    11: ("Honey eye cream daily care-e budget-friendly shelf addition.", "eye cream", "honey skincare"),
    12: ("Hyaluronic eye cream under-eye routine-e hydration-focused option.", "eye cream", "hydration"),
    13: ("PDRN gel body/skin care shelf-e big-size value pick.", "pdrn gel", "skin care"),
    14: ("Heartleaf toner travel/trial routine-e compact soothing pick.", "heartleaf toner", "soothing toner"),
    15: ("Dark spot + pore-care routine-e Celimax brightening serum pick.", "brightening serum", "pore care"),
    16: ("Noni eye cream under-eye routine-e clean tube pick.", "noni eye cream", "eye care"),
    17: ("Noni ampoule calming + radiance routine-e fresh green bottle pick.", "noni ampoule", "radiance serum"),
    18: ("Tone-up sun cream daily SPF shelf-e soft pink tube pick.", "tone up sun", "sun cream"),
}


def slug_from_link(link: str) -> str:
    return link.rstrip("/").split("/")[-1]


def brand_tag(brand: str) -> str:
    return "#" + "".join(ch for ch in brand.title() if ch.isalnum()) + "Bangladesh"


def captions(row: dict[str, str]) -> tuple[str, str, str]:
    slot = int(row["slot"])
    angle, tag_one, tag_two = ANGLES[slot]
    brand = row["brand"]
    product = row["product"]
    price = int(float(row["price_bdt"]))
    hashtags = " ".join([
        brand_tag(brand),
        "#EmartSkincare",
        "#KBeautyBD",
        "#SkincareBangladesh",
        f"#{tag_one.title().replace(' ', '')}",
        f"#{tag_two.title().replace(' ', '')}",
    ])
    hook = f"Ajker {brand} shelf pick"
    fb = (
        f"{hook}: {product}\n\n"
        f"Price: TK {price}\n"
        "COD available.\n\n"
        f"{angle}\n\n"
        "Want this one? Buy link in first comment.\n\n"
        f"{hashtags}"
    )
    ig = (
        f"{hook}\n\n"
        f"{product}\n"
        f"TK {price} | COD available\n\n"
        f"{angle}\n\n"
        "DM to order or visit E-MART.COM.BD.\n\n"
        f"{hashtags}"
    )
    return fb, ig, hashtags


def main() -> None:
    rows = list(csv.DictReader((AUDIT_DIR / "approval-table.csv").open(encoding="utf-8")))
    rows.sort(key=lambda row: int(row["slot"]))
    APP_PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    start = datetime(2026, 6, 29, 8, 0, tzinfo=BDT)
    plan_items = []
    for row in rows:
        index = int(row["slot"])
        fb_src = ROOT / row["fb_image"]
        ig_src = ROOT / row["ig_image"]
        fb_dst = APP_PUBLIC_DIR / fb_src.name
        ig_dst = APP_PUBLIC_DIR / ig_src.name
        shutil.copy2(fb_src, fb_dst)
        shutil.copy2(ig_src, ig_dst)

        fb_caption, ig_caption, hashtags = captions(row)
        slot_time = start + timedelta(minutes=(index - 1) * 50)
        slug = slug_from_link(row["link"])
        fb_url = f"{PUBLIC_BASE}/{fb_dst.name}"
        ig_url = f"{PUBLIC_BASE}/{ig_dst.name}"
        item = {
            "product_id": int(row["product_id"]),
            "title": row["product"],
            "slug": slug,
            "creative_type": "owner-approved-static-card",
            "asset_source": "owner-approved-v6-product-base",
            "design_template": "brand-fresh-product-base-v6",
            "link": row["link"],
            "angle": ANGLES[index][0],
            "hashtags": hashtags,
            "captions": {"facebook": fb_caption, "instagram": ig_caption},
            "visual_qa": {
                "product_match_checked": True,
                "price_clear": True,
                "no_dummy_product": True,
                "real_product_image": True,
                "background_source": "codex-rendered wooden podium card",
                "design_consistency_checked": True,
            },
            "images": {
                "default": fb_url,
                "facebook": fb_url,
                "instagram": ig_url,
                "source_asset": str(fb_dst.relative_to(ROOT)),
                "instagram_source_asset": str(ig_dst.relative_to(ROOT)),
            },
            "product_image_source": row["image_source"],
            "background_source": "codex-rendered wooden podium card",
            "index": index,
            "slot": slot_time.isoformat(),
            "platforms": ["facebook", "instagram"],
            "approval_status": "approved_for_scheduled_run",
            "platform_posts": {
                "facebook": {"caption": fb_caption, "image_url": fb_url, "link": row["link"]},
                "instagram": {"caption": ig_caption, "image_url": ig_url, "link": row["link"]},
            },
        }
        plan_items.append(item)

    plan = {
        "id": "2026-06-29-brand-fresh-product-base-v6",
        "name": "June 29 Brand Fresh Product Base v6",
        "date": "2026-06-29",
        "approval_status": "approved_for_scheduled_run",
        "publish_gate": "approved_for_scheduled_run",
        "qa_status": "pass",
        "design_template": "brand-fresh-product-base-v6",
        "platforms": ["facebook", "instagram"],
        "schedule": {"start": "08:00", "end": "22:10", "timezone": "+06:00"},
        "items": plan_items,
    }
    (OUTPUT_DIR / "campaign-plan.json").write_text(json.dumps(plan, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    with (OUTPUT_DIR / "caption-preview.md").open("w", encoding="utf-8") as f:
        f.write("# June 29 Brand Fresh Product Base v6 Caption Preview\n\n")
        for item in plan_items:
            f.write(f"## {item['index']:02d}. {item['title']} ({item['slot']})\n\n")
            f.write("Facebook:\n\n")
            f.write(item["captions"]["facebook"] + "\n\n")
            f.write("Instagram:\n\n")
            f.write(item["captions"]["instagram"] + "\n\n")
    print(OUTPUT_DIR / "campaign-plan.json")
    print(APP_PUBLIC_DIR)


if __name__ == "__main__":
    main()
