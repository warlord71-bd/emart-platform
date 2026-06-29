#!/usr/bin/env python3
"""
Free visual reel QA via OpenRouter vision models (no Google / no billing).

Extracts keyframes with ffmpeg and asks a FREE multimodal model to check on-screen text
readability, product visibility, face quality, and obvious defects. Reuses the existing
OPENROUTER_API_KEY. Best-effort: on rate-limit (429) or any error it degrades gracefully
to a 'warn' (never hard-blocks the free pipeline), so the local ffprobe gate stays the
hard technical gate and this adds a soft content gate on top.

Output JSON: {status: pass|warn|fail, score, publishable, issues[], summary, _provider}

Usage:
  python3 reel_qa_openrouter.py --video x.mp4 --out qa.json [--product "..."] [--frames 3]
"""
from __future__ import annotations
import argparse, base64, json, os, subprocess, sys, time, urllib.request
from pathlib import Path

ENV_PATHS = ["/root/emart-platform/apps/web/.env.local",
             "/var/www/emart-platform/apps/web/.env.local"]
FREE_VISION = ["nvidia/nemotron-nano-12b-v2-vl:free", "google/gemma-4-31b-it:free"]


def load_env():
    for p in ENV_PATHS:
        fp = Path(p)
        if fp.exists():
            for line in fp.read_text().splitlines():
                if "=" in line and not line.strip().startswith("#"):
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
            return


def duration(video: str) -> float:
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                              "-of", "default=nw=1:nk=1", video], capture_output=True, text=True, timeout=30)
        return float(out.stdout.strip() or 0)
    except Exception:
        return 0.0


def extract_frames(video: str, n: int) -> list[str]:
    dur = duration(video) or 6.0
    times = [dur * f for f in ([0.5] if n <= 1 else [i / (n - 1) * 0.8 + 0.1 for i in range(n)])]
    paths = []
    for i, t in enumerate(times):
        out = f"/tmp/claude-0/qa-frame-{os.getpid()}-{i}.png"
        Path("/tmp/claude-0").mkdir(parents=True, exist_ok=True)
        subprocess.run(["ffmpeg", "-y", "-ss", f"{t:.2f}", "-i", video, "-frames:v", "1", out],
                       capture_output=True, timeout=60)
        if Path(out).exists():
            paths.append(out)
    return paths


def ask_vision(frame_b64: str, product: str) -> dict | None:
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        return None
    prompt = (f"You are a social-media reel QA reviewer for skincare brand Emart. Product: {product}. "
              "Look at this vertical reel frame. Reply ONLY minified JSON: "
              '{"text_readable":true|false,"text_cut_off":true|false,"face_ok":true|false,'
              '"product_visible":true|false,"issues":[],"score":0-100}. '
              'List only REAL problems in issues (empty array if none).')
    for model in FREE_VISION:
        body = json.dumps({"model": model, "messages": [{"role": "user", "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{frame_b64}"}},
        ]}], "max_tokens": 400, "temperature": 0.2}).encode()
        req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions", data=body,
                                     headers={"Authorization": f"Bearer {key}",
                                              "Content-Type": "application/json"}, method="POST")
        try:
            r = json.loads(urllib.request.urlopen(req, timeout=90).read())
            txt = r["choices"][0]["message"]["content"]
            s = txt.find("{"); e = txt.rfind("}")
            if s >= 0 and e > s:
                return json.loads(txt[s:e + 1])
        except urllib.error.HTTPError as ex:
            if ex.code == 429:
                time.sleep(4); continue  # rate-limited, try next model
        except Exception:
            continue
    return None


def run(video: str, product: str, frames: int) -> dict:
    load_env()
    results, issues = [], set()
    for fp in extract_frames(video, frames):
        b64 = base64.b64encode(Path(fp).read_bytes()).decode()
        v = ask_vision(b64, product)
        Path(fp).unlink(missing_ok=True)
        if v:
            results.append(v)
            for it in v.get("issues", []):
                if it:
                    issues.add(str(it)[:60])
            if v.get("text_cut_off"):
                issues.add("text_cut_off")
            if v.get("product_visible") is False:
                issues.add("product_not_visible")
    if not results:
        # graceful: couldn't reach a free model (rate limit / offline) -> soft warn, don't block
        return {"status": "warn", "score": 60, "publishable": True, "issues": ["vision_qa_unavailable"],
                "summary": "Free vision QA unavailable (rate-limited/offline); ffprobe gate still applies.",
                "_provider": "openrouter-vision"}
    avg = round(sum(int(r.get("score", 70)) for r in results) / len(results))
    hard = {"product_not_visible", "text_cut_off"}
    status = "fail" if (issues & hard and avg < 50) else ("warn" if issues else "pass")
    return {"status": status, "score": avg, "publishable": status != "fail",
            "issues": sorted(issues), "frames_checked": len(results),
            "summary": f"Vision QA over {len(results)} frame(s), avg {avg}.",
            "_provider": "openrouter-vision"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--product", default="skincare product")
    ap.add_argument("--frames", type=int, default=3)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    res = run(a.video, a.product, a.frames)
    Path(a.out).write_text(json.dumps(res, ensure_ascii=False, indent=2))
    print(a.out)


if __name__ == "__main__":
    main()
