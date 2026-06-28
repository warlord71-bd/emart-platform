"""
Hermes LLM Brain — autonomous reasoning layer using free OpenRouter models.

When a job needs complex decisions (content writing, quality review, corrections,
multi-step planning), this module provides the "consultant" that would otherwise
require Claude Code or Codex to be online.

Usage:
    from brain import ask, plan_steps, review_output

    answer = ask("What badge should this blog post use?", context="Title: Best Face Wash...")
    steps = plan_steps("Create a reel for COSRX Snail Mucin")
    feedback = review_output("Check if this caption is GMC-safe", text=caption)
"""
from __future__ import annotations

import json, time
from pathlib import Path
from typing import Any

try:
    import urllib.request
except ImportError:
    urllib = None

CREDS_FILE = Path("/root/.openclaw/credentials/openrouter_default.json")

FREE_MODELS = [
    "google/gemma-4-31b-it:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "poolside/laguna-xs.2:free",
    "cohere/north-mini-code:free",
]

SYSTEM_PROMPT = """You are Hermes, an internal operations assistant for Emart Skincare Bangladesh (e-mart.com.bd).
You help with: content creation, product descriptions, social media captions, quality review,
SEO optimization, and multi-step job planning.

Rules:
- No medical claims (treats, cures, heals, therapeutic)
- No fake urgency or manipulative language
- Currency is BDT (৳), market is Bangladesh
- Brand name: Emart (not E-Mart, EMart BD, eMart)
- Keep answers concise and actionable
- When planning steps, output numbered steps the system can execute"""


def _get_key() -> str:
    if CREDS_FILE.exists():
        d = json.loads(CREDS_FILE.read_text())
        return d.get("apiKey", d.get("api_key", ""))
    return ""


def _call_llm(messages: list[dict], max_tokens: int = 500, model: str | None = None) -> str | None:
    key = _get_key()
    if not key:
        return None

    models = [model] if model else FREE_MODELS
    for m in models:
        try:
            payload = json.dumps({
                "model": m,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.3,
            }).encode()
            req = urllib.request.Request(
                "https://openrouter.ai/api/v1/chat/completions",
                data=payload,
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                },
            )
            resp = urllib.request.urlopen(req, timeout=60)
            d = json.loads(resp.read())
            content = d.get("choices", [{}])[0].get("message", {}).get("content", "")
            if content:
                return content
        except Exception:
            time.sleep(2)
            continue
    return None


def ask(question: str, context: str = "") -> str:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if context:
        messages.append({"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"})
    else:
        messages.append({"role": "user", "content": question})
    return _call_llm(messages) or "LLM unavailable — all free models rate-limited"


def plan_steps(task: str, available_engines: list[str] | None = None) -> str:
    engines_desc = ", ".join(available_engines) if available_engines else (
        "creative_engine (product images), blog_hero_gen (blog OG images), "
        "video_enqueue (queue reel), video_build (build reel), "
        "social_plan (FB/IG campaign), social_pick (product picker), "
        "blog_generator (draft blog post), humanizer (PDP descriptions), "
        "gmc_sync (Merchant Center), gsc_tracker (SEO data), revalidate (cache clear)"
    )
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + f"\n\nAvailable engines: {engines_desc}"},
        {"role": "user", "content": f"Break this task into executable steps using the available engines:\n\n{task}"},
    ]
    return _call_llm(messages, max_tokens=800) or "LLM unavailable"


def review_output(check: str, text: str) -> str:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Review this output and provide feedback:\n\nCheck: {check}\n\nText:\n{text}"},
    ]
    return _call_llm(messages, max_tokens=400) or "LLM unavailable"


def write_content(prompt: str, style: str = "Emart brand voice") -> str:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + f"\n\nWrite in this style: {style}"},
        {"role": "user", "content": prompt},
    ]
    return _call_llm(messages, max_tokens=1000) or "LLM unavailable"


def available() -> bool:
    return bool(_get_key())
