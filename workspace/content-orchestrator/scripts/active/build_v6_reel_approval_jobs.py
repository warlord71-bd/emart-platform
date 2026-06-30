#!/usr/bin/env python3
from __future__ import annotations

import csv
import importlib.util
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
AUDIT_DIR = ROOT / "workspace/audit/active/social-reel-approval-20260630-brand-fresh-product-base-v6"
OUT_DIR = ROOT / "workspace/audit/active/reel-approval-20260629-v6"
QUEUE_DIR = ROOT / "workspace/content-orchestrator/video-engine/jobs/queue"
SOCIAL_RENDERER = ROOT / "workspace/content-orchestrator/scripts/active/build_social_brand_fresh_product_base_v5.py"

SELECTED_SLOTS = [2, 3, 5, 6, 13, 17]

SCRIPT_BY_SLOT = {
    2: {
        "hook": "Pink peptide glow",
        "benefits": ["Peptide routine pick", "Soft glow finish", "COD available"],
        "cta": "Order from Emart",
        "voiceover": (
            "Medicube PDRN Pink Peptide Serum glow routine er jonno ekta clean shelf pick. "
            "Soft healthy-looking finish chaile eta dekhte paren. Original product Emart e available, COD ache."
        ),
        "caption": "Medicube PDRN Pink Peptide Serum 30ml now at Emart. Price TK 1775. COD available.",
        "hashtags": ["#MedicubeBangladesh", "#PeptideSerum", "#KBeautyBD", "#EmartSkincare"],
    },
    3: {
        "hook": "Night retinol pick",
        "benefits": ["Night routine step", "Use slowly", "COD available"],
        "cta": "Order from Emart",
        "voiceover": (
            "Medicube Deep Vita A Retinol Serum night routine e add korte chaile slow start korun. "
            "Retinol use korle daytime e sunscreen rakhben. Original product Emart e available."
        ),
        "caption": "Medicube Deep Vita A Retinol Serum 30ml now at Emart. Price TK 2300. COD available.",
        "hashtags": ["#MedicubeBangladesh", "#RetinolRoutine", "#KBeautyBD", "#EmartSkincare"],
    },
    5: {
        "hook": "Peach niacin glow",
        "benefits": ["Niacin serum pick", "Fresh glow routine", "COD available"],
        "cta": "Order from Emart",
        "voiceover": (
            "Anua Peach 70 Niacinamide Serum bright fresh glow routine er jonno popular pick. "
            "Peach plus niacin combo chaile ei bottle ta check korte paren. Emart e COD available."
        ),
        "caption": "Anua Peach 70 Niacinamide Serum 30ml now at Emart. Price TK 1936. COD available.",
        "hashtags": ["#AnuaBangladesh", "#NiacinamideSerum", "#KBeautyBD", "#EmartSkincare"],
    },
    6: {
        "hook": "Heartleaf daily lotion",
        "benefits": ["Light hydration", "Calm-feel routine", "COD available"],
        "cta": "Order from Emart",
        "voiceover": (
            "Anua Heartleaf 70 Daily Lotion daily hydration routine e lightweight feel er jonno bhalo option. "
            "Simple lotion step chaile Emart theke order korte paren. COD available."
        ),
        "caption": "Anua Heartleaf 70% Daily Lotion 200ml now at Emart. Price TK 1900. COD available.",
        "hashtags": ["#AnuaBangladesh", "#Heartleaf", "#KBeautyBD", "#EmartSkincare"],
    },
    13: {
        "hook": "PDRN gel value",
        "benefits": ["Big size gel", "Daily care shelf", "COD available"],
        "cta": "Order from Emart",
        "voiceover": (
            "Medicube PDRN Booster Gel 300ml boro size skin care gel pick. "
            "Daily shelf e value product rakhte chaile eta dekhte paren. Original product Emart e available."
        ),
        "caption": "Medicube PDRN Booster Gel 300ml now at Emart. Price TK 2100. COD available.",
        "hashtags": ["#MedicubeBangladesh", "#PDRNGel", "#KBeautyBD", "#EmartSkincare"],
    },
    17: {
        "hook": "Noni ampoule radiance",
        "benefits": ["Calming radiance", "Ampoule step", "COD available"],
        "cta": "Order from Emart",
        "voiceover": (
            "Celimax The Real Noni Energy Ampoule calming plus radiance routine er jonno fresh green bottle pick. "
            "Ampoule step add korte chaile Emart e available. COD ache."
        ),
        "caption": "Celimax The Real Noni Energy Ampoule 30ml now at Emart. Price TK 1900. COD available.",
        "hashtags": ["#CelimaxBangladesh", "#NoniAmpoule", "#KBeautyBD", "#EmartSkincare"],
    },
}


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:56]


def import_social_renderer():
    spec = importlib.util.spec_from_file_location("social_renderer_v5", SOCIAL_RENDERER)
    mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(mod)
    return mod


def category_for(product: str) -> str:
    text = product.lower()
    if "retinol" in text or "retinal" in text:
        return "retinol"
    if "lotion" in text:
        return "moisturizer"
    if "gel" in text:
        return "moisturizer"
    if "ampoule" in text or "serum" in text:
        return "serum"
    return "skincare"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cutout_dir = OUT_DIR / "product-cutouts"
    spec_dir = OUT_DIR / "jobs"
    cutout_dir.mkdir(parents=True, exist_ok=True)
    spec_dir.mkdir(parents=True, exist_ok=True)
    QUEUE_DIR.mkdir(parents=True, exist_ok=True)

    renderer = import_social_renderer()
    cmap = renderer.candidate_map()
    rows = list(csv.DictReader((AUDIT_DIR / "approval-table.csv").open(encoding="utf-8")))
    by_slot = {int(row["slot"]): row for row in rows}
    manifest = []

    for n, slot in enumerate(SELECTED_SLOTS, 1):
        row = by_slot[slot]
        source, source_note = renderer.source_image(row, cmap)
        cutout = renderer.rembg_cutout(source)
        cutout_path = cutout_dir / f"{n:02d}-{slug(row['product'])}-cutout.png"
        cutout.save(cutout_path)

        script = SCRIPT_BY_SLOT[slot]
        jid = f"2026-06-29-v6-reel-{n:02d}-{slug(row['product'])}"
        price = str(int(float(row["price_bdt"])))
        job = {
            "id": jid,
            "tier_target": "free",
            "platforms": ["facebook", "instagram"],
            "safe_zone": "ig",
            "product": row["product"],
            "product_id": int(row["product_id"]),
            "brand": row["brand"],
            "category": category_for(row["product"]),
            "price": price,
            "language": "bn",
            "seconds": 4.4,
            "renderer": "hyperframes",
            "holding_request": True,
            "holding_generation_mode": "real_product_composite",
            "holding_first": True,
            "holding_label": f"{row['brand']} pick",
            "no_hallucination_product_layer": True,
            "model_fallback": False,
            "product_card": True,
            "product_cutout": True,
            "product_image": str(cutout_path),
            "product_card_badge": "Emart Reel Pick",
            "product_card_bangla": f"{row['brand']} · TK {price} · COD available",
            "visual_captions": False,
            "music_volume": 0.10,
            "list_cards": [
                {
                    "kicker": row["brand"],
                    "title": "Why this pick",
                    "style": "numbered",
                    "bullets": script["benefits"],
                    "footer": "E-MART.COM.BD · COD available",
                }
            ],
            "brand_card": True,
            "brand_card_bangla": f"Original {row['brand']} now at Emart",
            "script": script,
            "caption": script["caption"] + "\n\n" + " ".join(script["hashtags"]),
            "caption_locked": True,
            "voiceover": True,
            "voice_required": True,
            "voice_gender": "female",
            "qa_provider": "master",
            "qa_block_on_vision": False,
            "publish": True,
            "source_static_card": {"facebook": row["fb_image"], "instagram": row["ig_image"]},
            "image_source": source_note,
        }
        spec_path = spec_dir / f"{n:02d}-{jid}.json"
        queue_path = QUEUE_DIR / f"04-{jid}.json"
        spec_path.write_text(json.dumps(job, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        queue_path.write_text(json.dumps(job, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        manifest.append({
            "slot": slot,
            "job_id": jid,
            "product": row["product"],
            "price_bdt": price,
            "cutout": str(cutout_path.relative_to(ROOT)),
            "job": str(spec_path.relative_to(ROOT)),
            "queue": str(queue_path.relative_to(ROOT)),
        })

    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(OUT_DIR)


if __name__ == "__main__":
    main()
