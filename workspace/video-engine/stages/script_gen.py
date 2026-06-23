#!/usr/bin/env python3
"""
Reel script generator — turns a product + persona + language into a structured reel script
using the existing OpenRouter key (free/near-zero text tier). Output drives timed on-screen
captions, the platform caption, hashtags, and (later) the voiceover.

Language is a per-job DIAL: en | bn (Bangla) | banglish (Bangla script + English skincare terms).

Output JSON:
  { hook, benefits[3], cta, caption, hashtags[], voiceover }

Usage:
  python3 script_gen.py --product "COSRX Salicylic Cleanser" --category cleanser \
    --persona influencer --language banglish --price 950 --out script.json
Robust: strict JSON prompt + extraction; falls back to a safe template if the model misbehaves,
so the loop never hard-fails on the text stage.
"""
from __future__ import annotations
import argparse, json, os, re, sys, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "lib"))
import gemini_client  # noqa: E402

ENV_PATHS = [
    Path("/root/emart-platform/apps/web/.env.local"),
    Path("/var/www/emart-platform/apps/web/.env.local"),
]

DEFAULT_OPENROUTER_MODELS = [
    # Free Google-family models currently available on OpenRouter.
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    # Existing local default; useful if Gemma is rate-limited.
    "nvidia/nemotron-3-super-120b-a12b:free",
    "openai/gpt-oss-120b:free",
]


def load_env():
    for p in ENV_PATHS:
        if p.exists():
            for line in p.read_text().splitlines():
                if "=" in line and not line.strip().startswith("#"):
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
            return


LANG_RULES = {
    "en": "Write in natural English.",
    "bn": "Write in natural Bangla (Bengali script). Keep brand and ingredient names in English.",
    "banglish": "Write in Bangla (Bengali script) but keep skincare/ingredient/brand terms in English — "
                "the natural code-switching real Bangladeshi beauty creators use.",
}

PERSONA_RULES = {
    "dr": "Tone: a warm, trustworthy skin expert explaining simply. Educational, calm, credible.",
    "influencer": "Tone: a relatable young Bangladeshi beauty creator. Friendly, honest, energetic.",
    "hijabi": "Tone: a modest, gentle Bangladeshi creator. Warm, respectful, down-to-earth.",
}


def build_prompt(product, category, persona, language, price):
    return (
        f"You are scripting a short vertical skincare reel for Emart Skincare Bangladesh.\n"
        f"Product: {product}\nCategory: {category}\nPrice: BDT {price}\n"
        f"{PERSONA_RULES.get(persona, PERSONA_RULES['influencer'])}\n"
        f"{LANG_RULES.get(language, LANG_RULES['banglish'])}\n\n"
        "Rules: NO medical/curative claims; use 'helps/looks/appears'. Mention COD (cash on delivery). "
        "On-screen lines must be SHORT (max 5 words each). Be specific to the product.\n"
        "IMPORTANT for hook/benefits/cta (these are burned onto video): use ROMANIZED Banglish "
        "(Latin letters, e.g. 'Skin thake naram-komol') — Bengali SCRIPT does NOT shape correctly on "
        "video. The 'caption' and 'voiceover' fields SHOULD use natural Bangla script (platforms render "
        "those natively).\n\n"
        "Return ONLY valid minified JSON, no markdown, with exactly these keys:\n"
        '{"hook":"<=5 words","benefits":["<=5 words","<=5 words","<=5 words"],'
        '"cta":"<=5 words","caption":"2-3 sentence platform caption","hashtags":["#tag", "..."],'
        '"voiceover":"30-40 word spoken script"}'
    )


def openrouter_models() -> list[str]:
    configured = os.environ.get("OPENROUTER_SCRIPT_MODELS") or os.environ.get("OPENROUTER_MODEL", "")
    models = [m.strip() for m in configured.split(",") if m.strip()]
    for model in DEFAULT_OPENROUTER_MODELS:
        if model not in models:
            models.append(model)
    return models


def call_openrouter_model(prompt, model):
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise RuntimeError("OPENROUTER_API_KEY missing")
    body = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": "You output only valid minified JSON. No prose, no markdown."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 2800,
        "temperature": 0.6,
    }).encode()
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions", data=body,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST")
    with urllib.request.urlopen(req, timeout=90) as r:
        data = json.loads(r.read())
    return data["choices"][0]["message"]["content"]


def call_openrouter(prompt):
    errors = []
    for model in openrouter_models():
        try:
            return call_openrouter_model(prompt, model), model
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:300]
            errors.append(f"{model}: HTTP {exc.code} {detail}")
            # Try the next free model for rate limits, missing models, and provider failures.
            if exc.code not in (400, 401, 402, 404, 408, 409, 429, 500, 502, 503, 504):
                break
        except Exception as exc:
            errors.append(f"{model}: {exc}")
    raise RuntimeError("OpenRouter models failed: " + " | ".join(errors[:4]))


def call_gemini(prompt):
    return gemini_client.interaction_text(
        prompt,
        system_instruction="You output only valid minified JSON. No prose, no markdown.",
        temperature=0.5,
    )


def extract_json(text):
    # Reasoning models emit prose then JSON. Scan ALL balanced {...} blocks and
    # return the LAST one that parses and has the expected shape.
    text = re.sub(r"```(?:json)?", "", text)
    candidates = []
    depth = start = 0
    for i, ch in enumerate(text):
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            if depth > 0:
                depth -= 1
                if depth == 0:
                    candidates.append(text[start:i + 1])
    required = ("hook", "benefits", "cta", "caption")
    best, best_score = None, -1
    for blob in candidates:
        try:
            obj = json.loads(blob)
        except json.JSONDecodeError:
            continue
        if not isinstance(obj, dict) or "hook" not in obj:
            continue
        # score: how many required keys + caption length (favors the real, complete answer over fragments)
        score = sum(1 for k in required if obj.get(k)) * 1000 + len(str(obj.get("caption", "")))
        if score > best_score:
            best, best_score = obj, score
    return best


def fallback(product, price):
    return {
        "hook": "Glow starts here",
        "benefits": ["Gentle daily care", "Authentic K-Beauty", "Cash on delivery"],
        "cta": "Shop at Emart",
        "caption": f"{product} — authentic at Emart Skincare Bangladesh. Cash on Delivery across Bangladesh. "
                   f"Only BDT {price}.",
        "hashtags": ["#EmartSkincare", "#KBeautyBangladesh", "#SkincareBD"],
        "voiceover": f"{product}. Authentic, gentle, and effective for your daily routine. "
                     f"Available now at Emart with cash on delivery across Bangladesh.",
    }


def generate(product, category, persona, language, price, provider="auto"):
    prompt = build_prompt(product, category, persona, language, price)
    providers = []
    if provider in ("auto", "openrouter"):
        providers.append(("openrouter", call_openrouter))
    # Direct Google Gemini is intentionally explicit-only. The free/default path is OpenRouter.
    if provider == "gemini" and gemini_client.api_key():
        providers.append(("gemini", call_gemini))
    if provider == "gemini" and not gemini_client.api_key():
        sys.stderr.write("script_gen gemini skipped: GEMINI_API_KEY missing\n")

    for name, fn in providers:
        try:
            result = fn(prompt)
            if isinstance(result, tuple):
                raw, used_model = result
            else:
                raw, used_model = result, None
            data = extract_json(raw)
            if data and all(k in data for k in ("hook", "benefits", "cta", "caption")):
                data.setdefault("hashtags", ["#EmartSkincare"])
                data.setdefault("voiceover", data["caption"])
                data["benefits"] = (data.get("benefits") or [])[:3] or ["Gentle daily care"]
                data["_provider"] = name
                if used_model:
                    data["_model"] = used_model
                return data
        except Exception as e:
            sys.stderr.write(f"script_gen {name} failed: {e}\n")

    try:
        data = fallback(product, price)
        data["_provider"] = "template"
        return data
    except Exception as e:
        sys.stderr.write(f"script_gen template failed: {e}\n")
        raise


def main():
    load_env()
    ap = argparse.ArgumentParser()
    ap.add_argument("--product", required=True)
    ap.add_argument("--category", default="skincare")
    ap.add_argument("--persona", default="influencer", choices=("dr", "influencer", "hijabi"))
    ap.add_argument("--language", default="banglish", choices=("en", "bn", "banglish"))
    ap.add_argument("--price", default="")
    ap.add_argument("--provider", default="auto", choices=("auto", "gemini", "openrouter", "template"))
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    data = fallback(a.product, a.price) if a.provider == "template" else \
        generate(a.product, a.category, a.persona, a.language, a.price, provider=a.provider)
    Path(a.out).write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(a.out)


if __name__ == "__main__":
    main()
