#!/usr/bin/env python3
"""
Gemini video QA for finished reels.

Uploads a short MP4 to Gemini, asks for a structured creative/compliance review, and writes JSON.
If no GEMINI_API_KEY is present, this exits 2 so the worker can mark QA as skipped.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "lib"))
import gemini_client  # noqa: E402


def extract_json(text: str) -> dict:
    text = re.sub(r"```(?:json)?", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        return json.loads(text[start:end + 1])
    raise ValueError("No JSON object found in Gemini QA response")


def prompt(product: str, caption: str) -> str:
    return (
        "Review this vertical skincare ecommerce reel for Emart Skincare Bangladesh.\n"
        f"Product/context: {product or 'unknown'}\n"
        f"Planned caption: {caption or 'unknown'}\n\n"
        "Check: product visibility, text readability, pacing, professional look, Bangladeshi beauty-market fit, "
        "COD/ordering clarity, and ad-policy safety. Flag medical/curative claims, personal-hardship targeting, "
        "identity/belief targeting, broken Bengali text rendering, cropped product labels, or unreadable overlays.\n"
        "Return ONLY valid minified JSON with keys: "
        '{"status":"pass|warn|fail","score":0-100,"summary":"one sentence",'
        '"strengths":["..."],"issues":["..."],"fixes":["..."],"publishable":true|false}'
    )


def run(video: str, product: str, caption: str) -> dict:
    if not gemini_client.api_key():
        raise RuntimeError("GEMINI_API_KEY missing")
    raw = gemini_client.interaction_with_file(video, prompt(product, caption), media_type="video", timeout=240)
    data = extract_json(raw)
    data.setdefault("status", "warn")
    data.setdefault("score", 0)
    data.setdefault("summary", "")
    data.setdefault("strengths", [])
    data.setdefault("issues", [])
    data.setdefault("fixes", [])
    data.setdefault("publishable", data.get("status") == "pass")
    data["_provider"] = "gemini"
    return data


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--product", default="")
    ap.add_argument("--caption", default="")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    if not gemini_client.api_key():
        print("GEMINI_API_KEY missing; QA skipped", file=sys.stderr)
        raise SystemExit(2)
    data = run(a.video, a.product, a.caption)
    Path(a.out).write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(a.out)


if __name__ == "__main__":
    main()
