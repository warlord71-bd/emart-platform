#!/usr/bin/env python3
"""
Small stdlib-only Gemini Interactions API client for the video engine.

Uses REST so the engine does not need google-genai installed. The key is read from
GEMINI_API_KEY, AI_STUDIO_API_KEY, GOOGLE_AI_API_KEY, or GOOGLE_API_KEY.
"""
from __future__ import annotations

import json
import mimetypes
import os
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

import google.auth.transport.requests
from google.oauth2 import service_account

BASE_URL = "https://generativelanguage.googleapis.com"
DEFAULT_MODEL = "gemini-2.5-flash"
DEFAULT_LOCATION = "us-central1"
ENV_PATHS = [
    Path("/root/emart-platform/apps/web/.env.local"),
    Path("/var/www/emart-platform/apps/web/.env.local"),
]
SERVICE_ACCOUNT_PATHS = [
    Path("/root/.config/gemini-service-account.json"),
    Path("/root/emart-platform/apps/web/gemini-service-account.json"),
]


def _env_file_values(name: str) -> list[str]:
    values = []
    for path in ENV_PATHS:
        if not path.exists():
            continue
        for line in path.read_text().splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            if key.strip() == name:
                value = value.strip().strip('"').strip("'")
                if value:
                    values.append(value)
    return values


def load_env() -> None:
    for path in ENV_PATHS:
        if not path.exists():
            continue
        for line in path.read_text().splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            value = value.strip().strip('"').strip("'")
            if value:
                os.environ.setdefault(key.strip(), value)


def api_key() -> str | None:
    load_env()
    for name in ("GEMINI_API_KEY", "AI_STUDIO_API_KEY", "GOOGLE_AI_API_KEY", "GOOGLE_API_KEY"):
        values = [os.environ.get(name) or "", *_env_file_values(name)]
        for value in values:
            value = value.strip()
            if value:
                return value
    return None


def service_account_file() -> Path | None:
    load_env()
    for name in ("GEMINI_SERVICE_ACCOUNT_FILE", "GOOGLE_APPLICATION_CREDENTIALS"):
        value = os.environ.get(name)
        if value and Path(value).exists():
            return Path(value)
    for path in SERVICE_ACCOUNT_PATHS:
        if path.exists():
            return path
    return None


def vertex_auth() -> tuple[str, str, str]:
    keyfile = service_account_file()
    if not keyfile:
        raise RuntimeError("GEMINI_SERVICE_ACCOUNT_FILE missing")
    creds = service_account.Credentials.from_service_account_file(
        str(keyfile),
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )
    creds.refresh(google.auth.transport.requests.Request())
    project = os.environ.get("GEMINI_VERTEX_PROJECT") or getattr(creds, "project_id", None)
    if not project:
        raise RuntimeError("GEMINI_VERTEX_PROJECT missing")
    location = os.environ.get("GEMINI_VERTEX_LOCATION", DEFAULT_LOCATION)
    return creds.token, project, location


def require_key() -> str:
    key = api_key()
    if not key:
        raise RuntimeError("GEMINI_API_KEY missing")
    return key


def _request_json(url: str, payload: dict[str, Any], *, headers: dict[str, str] | None = None,
                  timeout: int = 90) -> dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", **(headers or {})},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return json.loads(res.read())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini HTTP {exc.code}: {detail[:500]}") from exc


def _collect_text(node: Any) -> list[str]:
    if isinstance(node, dict):
        out = []
        text = node.get("text")
        if isinstance(text, str):
            out.append(text)
        output_text = node.get("output_text")
        if isinstance(output_text, str):
            out.append(output_text)
        for value in node.values():
            out.extend(_collect_text(value))
        return out
    if isinstance(node, list):
        out = []
        for item in node:
            out.extend(_collect_text(item))
        return out
    return []


def interaction_text(prompt: str, *, system_instruction: str = "", model: str | None = None,
                     temperature: float = 0.4, timeout: int = 90) -> str:
    if service_account_file():
        return vertex_generate_text(
            prompt,
            system_instruction=system_instruction,
            model=model,
            temperature=temperature,
            timeout=timeout,
        )
    key = require_key()
    payload: dict[str, Any] = {
        "model": model or os.environ.get("GEMINI_MODEL", DEFAULT_MODEL),
        "input": prompt,
        "generation_config": {"temperature": temperature, "thinking_level": "low"},
    }
    if system_instruction:
        payload["system_instruction"] = system_instruction
    data = _request_json(
        f"{BASE_URL}/v1beta/interactions",
        payload,
        headers={"x-goog-api-key": key},
        timeout=timeout,
    )
    parts = [p.strip() for p in _collect_text(data) if p.strip()]
    if not parts:
        raise RuntimeError(f"Gemini response had no text: {json.dumps(data)[:500]}")
    return parts[-1]


def vertex_generate_text(prompt: str, *, system_instruction: str = "", model: str | None = None,
                         temperature: float = 0.4, timeout: int = 90) -> str:
    token, project, location = vertex_auth()
    model_name = model or os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)
    payload: dict[str, Any] = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": temperature},
    }
    if system_instruction:
        payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}
    url = (
        f"https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}"
        f"/publishers/google/models/{model_name}:generateContent"
    )
    data = _request_json(
        url,
        payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=timeout,
    )
    parts = [p.strip() for p in _collect_text(data) if p.strip()]
    if not parts:
        raise RuntimeError(f"Vertex Gemini response had no text: {json.dumps(data)[:500]}")
    return parts[-1]


def _mime_type(path: Path) -> str:
    return mimetypes.guess_type(str(path))[0] or "application/octet-stream"


def upload_file(path: str | Path, *, display_name: str = "emart-reel") -> dict[str, Any]:
    key = require_key()
    p = Path(path)
    size = p.stat().st_size
    mime = _mime_type(p)
    start = urllib.request.Request(
        f"{BASE_URL}/upload/v1beta/files",
        data=json.dumps({"file": {"display_name": display_name}}).encode("utf-8"),
        headers={
            "x-goog-api-key": key,
            "X-Goog-Upload-Protocol": "resumable",
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Header-Content-Length": str(size),
            "X-Goog-Upload-Header-Content-Type": mime,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(start, timeout=60) as res:
            upload_url = res.headers.get("x-goog-upload-url")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini upload start HTTP {exc.code}: {detail[:500]}") from exc
    if not upload_url:
        raise RuntimeError("Gemini upload did not return x-goog-upload-url")

    upload = urllib.request.Request(
        upload_url,
        data=p.read_bytes(),
        headers={
            "Content-Length": str(size),
            "X-Goog-Upload-Offset": "0",
            "X-Goog-Upload-Command": "upload, finalize",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(upload, timeout=180) as res:
            data = json.loads(res.read())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini upload finalize HTTP {exc.code}: {detail[:500]}") from exc
    file_data = data.get("file") or data
    file_data.setdefault("mime_type", mime)
    return file_data


def get_file(name: str) -> dict[str, Any]:
    key = require_key()
    req = urllib.request.Request(
        f"{BASE_URL}/v1beta/{name}",
        headers={"x-goog-api-key": key},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            return json.loads(res.read())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini file get HTTP {exc.code}: {detail[:500]}") from exc


def wait_active(name: str, *, timeout: int = 180, interval: int = 5) -> dict[str, Any]:
    deadline = time.time() + timeout
    last = {}
    while time.time() < deadline:
        last = get_file(name)
        state = str(last.get("state") or last.get("file", {}).get("state") or "").upper()
        if state == "ACTIVE":
            return last
        if state == "FAILED":
            raise RuntimeError(f"Gemini file processing failed: {json.dumps(last)[:500]}")
        time.sleep(interval)
    raise RuntimeError(f"Gemini file was not ACTIVE after {timeout}s: {json.dumps(last)[:500]}")


def interaction_with_file(path: str | Path, prompt: str, *, media_type: str = "video",
                          model: str | None = None, timeout: int = 180) -> str:
    file_data = upload_file(path, display_name=Path(path).name[:80])
    name = file_data.get("name")
    if name:
        wait_active(name, timeout=timeout)
    uri = file_data.get("uri")
    mime = file_data.get("mime_type") or file_data.get("mimeType") or _mime_type(Path(path))
    if not uri:
        raise RuntimeError(f"Gemini upload response missing uri: {json.dumps(file_data)[:500]}")
    key = require_key()
    data = _request_json(
        f"{BASE_URL}/v1beta/interactions",
        {
            "model": model or os.environ.get("GEMINI_MODEL", DEFAULT_MODEL),
            "input": [
                {"type": media_type, "uri": uri, "mime_type": mime},
                {"type": "text", "text": prompt},
            ],
            "generation_config": {"temperature": 0.2, "thinking_level": "low"},
        },
        headers={"x-goog-api-key": key},
        timeout=timeout,
    )
    parts = [p.strip() for p in _collect_text(data) if p.strip()]
    if not parts:
        raise RuntimeError(f"Gemini video response had no text: {json.dumps(data)[:500]}")
    return parts[-1]
