#!/usr/bin/env python3
"""
brain.py — optional LLM layer for the Content Orchestrator.

Reuses the humanizer's OpenRouter free-model chain and credentials so we add no new
secret and no new provider account:
  - key: env OPENROUTER_API_KEY, else /root/.openclaw/credentials/openrouter_default.json
  - default chain: free Gemma/Llama/Nemotron models
  - Hermes: set OPENROUTER_MODEL=nousresearch/hermes-... (used first when owner funds paid credits)
  - OpenClaw local: set OPENCLAW_BASE_URL (+ OPENCLAW_MODEL) to route through a local OpenClaw model

Two jobs:
  angle(item)      -> {hook, caption, angle, bn_hook} content brief for a dispatched item
  reflect(stats)   -> advisory tuning notes for the self-improving loop

Everything degrades gracefully: if no key / no openai lib / no network, returns None and the
orchestrator continues without LLM enrichment. The brain never publishes and never writes Woo.
"""
from __future__ import annotations
import json, os
from pathlib import Path

FREE_MODELS = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "meta-llama/llama-3.3-70b-instruct:free",
]


def _api_key() -> str:
    k = os.environ.get("OPENROUTER_API_KEY", "")
    if k:
        return k
    cred = Path("/root/.openclaw/credentials/openrouter_default.json")
    if cred.exists():
        try:
            return json.loads(cred.read_text()).get("apiKey", "")
        except Exception:
            return ""
    return ""


def _client_and_models():
    """Return (client, model_chain) or (None, None) if the LLM layer is unavailable."""
    try:
        from openai import OpenAI
    except Exception:
        return None, None
    base_url = os.environ.get("OPENCLAW_BASE_URL")  # local OpenClaw route, if configured
    if base_url:
        model = os.environ.get("OPENCLAW_MODEL", "local")
        return OpenAI(api_key=os.environ.get("OPENCLAW_API_KEY", "x"), base_url=base_url), [model]
    key = _api_key()
    if not key:
        return None, None
    env_model = os.environ.get("OPENROUTER_MODEL", "").strip()  # Hermes when funded
    chain = ([env_model] if env_model else []) + [m for m in FREE_MODELS if m != env_model]
    return OpenAI(api_key=key, base_url="https://openrouter.ai/api/v1"), chain


def _chat(messages: list[dict], max_tokens: int = 500) -> str | None:
    client, models = _client_and_models()
    if not client:
        return None
    for model in models:
        try:
            resp = client.chat.completions.create(
                model=model, messages=messages, temperature=0.6, max_tokens=max_tokens)
            return resp.choices[0].message.content.strip()
        except Exception:
            continue
    return None


def angle(item: dict) -> dict | None:
    """Generate a content angle/hook/caption brief for a planned item. Advisory only."""
    cand = item.get("candidate", {})
    sys_msg = (
        "You are Emart's beauty/skincare content strategist for Bangladesh (mobile-first). "
        "Brand voice: 'Global Beauty. Local Trust.' Simple natural Bangla, keep familiar English "
        "skincare terms. No medical/clinical claims, no fabricated urgency. Output STRICT JSON only "
        "with keys: hook, bn_hook, caption, angle."
    )
    user_msg = (
        f"Theme: {item.get('label')} (intent: {item.get('intent')}).\n"
        f"Product/topic: {cand.get('name')} (topic: {cand.get('topic')}).\n"
        f"Channels: {item.get('channels')}. Guard: {item.get('guard')}.\n"
        "Write a scroll-stopping hook (English), a Bangla hook (bn_hook), a short caption, and a "
        "one-line angle that drives the sale. JSON only."
    )
    raw = _chat([{"role": "system", "content": sys_msg}, {"role": "user", "content": user_msg}])
    if not raw:
        return None
    raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(raw)
    except Exception:
        return {"angle": raw[:280]}


def reflect(stats: list[dict]) -> str | None:
    """Given per-theme performance stats, suggest cadence/per_run tuning. Advisory only."""
    sys_msg = (
        "You are Emart's content performance analyst. Given per-theme outcome stats, recommend which "
        "themes to push harder (raise per_run / shorten cadence) and which to pull back, and why. "
        "Be concrete, 5 bullets max. Never recommend price changes or fabricated claims."
    )
    raw = _chat([{"role": "system", "content": sys_msg},
                 {"role": "user", "content": json.dumps(stats, ensure_ascii=False)}], max_tokens=400)
    return raw


def available() -> bool:
    client, _ = _client_and_models()
    return client is not None


if __name__ == "__main__":
    print("LLM brain available:", available())
