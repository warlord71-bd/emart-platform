from __future__ import annotations

import base64
import json
import mimetypes
import os
import subprocess
import time
from pathlib import Path
from typing import Any


ENV_PATHS = [
    Path("/root/emart-platform/apps/web/.env.local"),
    Path("/var/www/emart-platform/apps/web/.env.local"),
]
CREDENTIALS = Path("/root/.openclaw/credentials/openrouter_default.json")
DEFAULT_MODELS = [
    "nvidia/nemotron-nano-12b-v2-vl:free",
    "google/gemma-4-31b-it:free",
]


def load_env() -> None:
    for path in ENV_PATHS:
        if path.exists():
            for line in path.read_text().splitlines():
                stripped = line.strip()
                if not stripped or stripped.startswith("#") or "=" not in stripped:
                    continue
                key, value = stripped.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip().strip("'\""))
            break
    if not os.environ.get("OPENROUTER_API_KEY") and CREDENTIALS.exists():
        try:
            data = json.loads(CREDENTIALS.read_text())
            key = data.get("apiKey") or data.get("OPENROUTER_API_KEY")
            if key:
                os.environ["OPENROUTER_API_KEY"] = key
        except Exception:
            pass


def models() -> list[str]:
    configured = os.environ.get("OPENROUTER_VISION_MODELS", "")
    values = [item.strip() for item in configured.split(",") if item.strip()]
    for model in DEFAULT_MODELS:
        if model not in values:
            values.append(model)
    return values


def extract_json(text: str) -> dict[str, Any] | None:
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end <= start:
        return None
    try:
        return json.loads(text[start:end + 1])
    except json.JSONDecodeError:
        return None


def prompt(product_title: str, creative_type: str) -> str:
    model_rule = (
        "If a person/model appears, check that the visible product in hand or near the model is the same product, "
        "not a fake prop or second unrelated package. "
        if creative_type == "model"
        else ""
    )
    return (
        "You are a strict senior art director and social-commerce image QA reviewer for Emart Skincare Bangladesh. "
        f"Expected product: {product_title}. Creative type: {creative_type}. "
        "Inspect the image like a human buyer would before publishing. Check: "
        "1) the main visible product/package appears to match the expected product title/brand, "
        "2) price and old price are readable if present and not covered by badges/text. Bangladesh price styles such as "
        "'360 TAKA', '৳360', or a crossed-out old number count as clear when the digits are plainly visible; the price may be "
        "in a corner and does not need to be printed on the package. Set price_clear=true when no price is shown, "
        "3) no dummy/wrong extra product package is shown, "
        f"{model_rule}"
        "4) layout is not broken, clipped, crowded, or overlapping, "
        "5) one clear hero product/image is dominant unless the creative is explicitly a bundle/comparison, "
        "6) visible text looks intentional, readable, correctly spelled, and not machine-garbled, "
        "7) design feels premium enough for a skincare ecommerce brand, not cheap, random, or copied from another retailer, "
        "8) design is visually consistent with one theme instead of mixed card styles, "
        "9) there are no artifacts from old generated social cards, screenshots, watermarks, or reference-brand logos. "
        "Reply ONLY minified JSON with exactly these keys: "
        '{"product_match":true|false,"price_clear":true|false,"no_dummy_product":true|false,'
        '"model_hand_ok":true|false|null,"layout_ok":true|false,"single_clear_hero":true|false,'
        '"text_quality_ok":true|false,"premium_finish":true|false,"design_consistent":true|false,'
        '"source_artifact_free":true|false,"issues":["short issue"],'
        '"score":0-100}. '
        "Use false for uncertainty, mediocre design, or anything you would not approve for a paid social post. Do not be polite."
    )


def ask_model(image_b64: str, mime_type: str, product_title: str, creative_type: str, model: str) -> dict[str, Any]:
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise RuntimeError("OPENROUTER_API_KEY missing")
    body = json.dumps({
        "model": model,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt(product_title, creative_type)},
                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_b64}"}},
            ],
        }],
        "max_tokens": 500,
        "temperature": 0.1,
    }).encode()
    try:
        response = subprocess.run(
            [
                "curl", "--silent", "--show-error", "--fail-with-body", "--max-time", "45",
                "https://openrouter.ai/api/v1/chat/completions",
                "-H", f"Authorization: Bearer {key}",
                "-H", "Content-Type: application/json",
                "-H", "HTTP-Referer: https://e-mart.com.bd",
                "-H", "X-Title: Emart Social Engine Vision QA",
                "--data-binary", "@-",
            ],
            input=body,
            capture_output=True,
            timeout=50,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("vision request hard timeout") from exc
    if response.returncode != 0:
        detail = (response.stderr or response.stdout).decode("utf-8", errors="replace")[:240]
        raise RuntimeError(f"vision request failed ({response.returncode}): {detail}")
    data = json.loads(response.stdout)
    content = data["choices"][0]["message"]["content"]
    parsed = extract_json(content)
    if not parsed:
        raise RuntimeError("vision model returned non-JSON")
    parsed["_model"] = model
    return parsed


def inspect_image(image_path: Path, product_title: str, creative_type: str) -> dict[str, Any]:
    load_env()
    if not image_path.exists():
        return {
            "status": "fail",
            "score": 0,
            "issues": [f"image_path_missing:{image_path}"],
            "_provider": "openrouter-vision",
        }
    image_b64 = base64.b64encode(image_path.read_bytes()).decode()
    mime_type = mimetypes.guess_type(image_path.name)[0] or "image/jpeg"
    errors: list[str] = []
    for model in models():
        try:
            result = ask_model(image_b64, mime_type, product_title, creative_type, model)
            issues = [str(item)[:120] for item in result.get("issues", []) if item]
            blockers = []
            for key in (
                "product_match",
                "price_clear",
                "no_dummy_product",
                "layout_ok",
                "single_clear_hero",
                "text_quality_ok",
                "premium_finish",
                "design_consistent",
                "source_artifact_free",
            ):
                if result.get(key) is not True:
                    blockers.append(key)
            if creative_type == "model" and result.get("model_hand_ok") is not True:
                blockers.append("model_hand_ok")
            score = int(result.get("score") or 0)
            if score and score < 72 and "low_art_direction_score" not in blockers:
                blockers.append("low_art_direction_score")
            status = "fail" if blockers else ("warn" if issues or (score and score < 82) else "pass")
            return {
                **result,
                "status": status,
                "blockers": blockers,
                "issues": issues,
                "_provider": "openrouter-vision",
            }
        except Exception as exc:
            errors.append(f"{model}: {exc}")
            if "429" in str(exc):
                time.sleep(4)
            continue
    return {
        "status": "unavailable",
        "score": 0,
        "issues": ["vision_qa_unavailable"],
        "errors": errors[:4],
        "_provider": "openrouter-vision",
    }
