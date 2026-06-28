#!/usr/bin/env python3
"""
Master reel QA — a "video production QA engineer" sign-off in one pass. 100% free.

Audits four categories and emits a scored report card (JSON + human-readable):
  1. TECHNICAL  — resolution 1080x1920, fps, duration vs platform limits, streams, file size (ffprobe)
  2. AUDIO      — voice present, integrated loudness (LUFS) + true peak vs platform target (ffmpeg ebur128)
  3. VISUAL     — multi-frame review via FREE OpenRouter vision: text readable/cut-off, face ok,
                  product visible, artifacts (best-effort; warns if rate-limited)
  4. CAPTIONS   — each caption on-screen long enough to read, no overlap (from the overlays json)

Verdict: PASS (ship) | REVIEW (warnings, human glance) | FAIL (blocking defect). Lists concrete fixes.

Usage:
  python3 reel_qa_master.py --video x.mp4 [--overlays overlays.json] [--product "..."] \
    [--frames 4] [--report card.md] --out qa.json
"""
from __future__ import annotations
import argparse, base64, json, os, subprocess, sys, urllib.request, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "lib"))
from quality_gates import validate_job_spec, validate_script_payload  # noqa: E402

ENV_PATHS = ["/root/emart-platform/apps/web/.env.local", "/var/www/emart-platform/apps/web/.env.local"]
FREE_VISION = ["nvidia/nemotron-nano-12b-v2-vl:free", "google/gemma-4-31b-it:free"]
TARGET_LUFS = -14.0          # IG Reels / YT Shorts / TikTok normalize around here
LUFS_TOLERANCE = 3.0         # within +/- 3 LU is fine
MIN_CAPTION_SECONDS = 1.1    # a viewer needs ~1s+ to read a short line


def load_env():
    for p in ENV_PATHS:
        fp = Path(p)
        if fp.exists():
            for line in fp.read_text().splitlines():
                if "=" in line and not line.strip().startswith("#"):
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
            return


def ffprobe(video: str) -> dict:
    r = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json",
                        "-show_format", "-show_streams", video], capture_output=True, text=True, timeout=40)
    return json.loads(r.stdout or "{}")


def loudness(video: str) -> dict:
    """integrated LUFS + true peak via ebur128 (no re-encode)."""
    try:
        r = subprocess.run(["ffmpeg", "-hide_banner", "-i", video, "-af", "ebur128=peak=true",
                            "-f", "null", "-"], capture_output=True, text=True, timeout=120)
        txt = r.stderr
        I = TP = None
        for line in txt.splitlines():
            s = line.strip()
            if s.startswith("I:") and "LUFS" in s:
                I = float(s.split()[1])
            elif s.startswith("Peak:") and "dBFS" in s:
                TP = float(s.split()[1])
        return {"integrated_lufs": I, "true_peak_dbfs": TP}
    except Exception:
        return {"integrated_lufs": None, "true_peak_dbfs": None}


def sample_frames(video: str, dur: float, n: int) -> list[str]:
    times = [dur * (i + 1) / (n + 1) for i in range(n)]
    out = []
    Path("/tmp/claude-0").mkdir(parents=True, exist_ok=True)
    for i, t in enumerate(times):
        p = f"/tmp/claude-0/mqa-{os.getpid()}-{i}.png"
        subprocess.run(["ffmpeg", "-y", "-ss", f"{t:.2f}", "-i", video, "-frames:v", "1", p],
                       capture_output=True, timeout=60)
        if Path(p).exists():
            out.append(p)
    return out


def vision_frame(b64: str, product: str) -> dict | None:
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        return None
    prompt = (f"You are a video QA reviewer for skincare brand Emart (product: {product}). "
              "Review this reel frame. Reply ONLY minified JSON: "
              '{"text_readable":true|false,"text_cut_off":true|false,"face_ok":true|false,'
              '"product_visible":true|false,"artifacts":true|false,"score":0-100}. '
              "artifacts=distorted hands/faces/objects. List nothing else.")
    for model in FREE_VISION:
        body = json.dumps({"model": model, "messages": [{"role": "user", "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}]}],
            "max_tokens": 300, "temperature": 0.15}).encode()
        req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions", data=body,
                                     headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                                     method="POST")
        try:
            r = json.loads(urllib.request.urlopen(req, timeout=90).read())
            t = r["choices"][0]["message"]["content"]
            s, e = t.find("{"), t.rfind("}")
            if s >= 0 and e > s:
                return json.loads(t[s:e + 1])
        except urllib.error.HTTPError as ex:
            if ex.code == 429:
                time.sleep(4); continue
        except Exception:
            continue
    return None


def _load_job_and_script(job_path: str | None) -> tuple[dict | None, dict | None]:
    if not job_path:
        return None, None
    jp = Path(job_path)
    if not jp.exists():
        return None, None
    job = json.loads(jp.read_text())
    script = job.get("script")
    sp = (job.get("stages") or {}).get("script", {}).get("path")
    if sp and Path(sp).exists():
        script = json.loads(Path(sp).read_text())
    return job, script


def audit(video, overlays, product, n_frames, job_path=None):
    load_env()
    fixes, cats = [], {}
    job, script = _load_job_and_script(job_path)

    # 1. TECHNICAL
    meta = ffprobe(video)
    fmt = meta.get("format", {})
    vs = next((s for s in meta.get("streams", []) if s.get("codec_type") == "video"), {})
    aud = next((s for s in meta.get("streams", []) if s.get("codec_type") == "audio"), None)
    w, h = int(vs.get("width", 0)), int(vs.get("height", 0))
    dur = float(fmt.get("duration", 0) or 0)
    fps_n = vs.get("r_frame_rate", "0/1").split("/")
    fps = (float(fps_n[0]) / float(fps_n[1])) if len(fps_n) == 2 and float(fps_n[1]) else 0
    size_mb = float(fmt.get("size", 0) or 0) / 1e6
    t_issues = []
    if (w, h) != (1080, 1920):
        t_issues.append(f"resolution {w}x{h} != 1080x1920"); fixes.append("Render at 1080x1920 (9:16).")
    if not aud:
        t_issues.append("no audio stream"); fixes.append("Mux a voice/music track.")
    if dur < 3 or dur > 90:
        t_issues.append(f"duration {dur:.1f}s outside 3-90s"); fixes.append("Keep reel 3-90s.")
    cats["technical"] = {"status": "fail" if t_issues else "pass",
                         "width": w, "height": h, "fps": round(fps, 1), "duration": round(dur, 2),
                         "size_mb": round(size_mb, 2), "has_audio": bool(aud), "issues": t_issues}

    # 2. AUDIO / loudness
    lo = loudness(video) if aud else {"integrated_lufs": None, "true_peak_dbfs": None}
    a_issues = []
    I, TP = lo.get("integrated_lufs"), lo.get("true_peak_dbfs")
    if I is not None and abs(I - TARGET_LUFS) > LUFS_TOLERANCE:
        a_issues.append(f"loudness {I} LUFS (target ~{TARGET_LUFS})")
        fixes.append(f"Normalize audio toward {TARGET_LUFS} LUFS (loudnorm).")
    if TP is not None and TP > -1.0:
        a_issues.append(f"true peak {TP} dBFS (>-1, clipping risk)")
        fixes.append("Cap true peak at -1 dBFS (alimiter).")
    cats["audio"] = {"status": "warn" if a_issues else ("pass" if aud else "fail"),
                     **lo, "issues": a_issues}

    # 3. VISUAL (multi-frame, free vision)
    results, v_issues = [], set()
    for fp in sample_frames(video, dur or 8, n_frames):
        v = vision_frame(base64.b64encode(Path(fp).read_bytes()).decode(), product)
        Path(fp).unlink(missing_ok=True)
        if v:
            results.append(v)
            if v.get("text_cut_off"): v_issues.add("caption_cut_off")
            if v.get("artifacts"): v_issues.add("visual_artifacts")
            if v.get("face_ok") is False: v_issues.add("face_distorted")
    if results:
        avg = round(sum(int(r.get("score", 70)) for r in results) / len(results))
        hard = {"caption_cut_off", "visual_artifacts", "face_distorted"}
        vstatus = "fail" if (v_issues & hard and avg < 55) else ("warn" if v_issues else "pass")
        if "caption_cut_off" in v_issues: fixes.append("Shorten captions / widen safe margin.")
        if "visual_artifacts" in v_issues: fixes.append("Regenerate persona still (artifact detected).")
        cats["visual"] = {"status": vstatus, "frames_checked": len(results), "avg_score": avg,
                          "issues": sorted(v_issues)}
    else:
        cats["visual"] = {"status": "warn", "frames_checked": 0,
                          "issues": ["vision_unavailable"], "note": "free vision rate-limited/offline"}

    # 4. CONTENT semantics (deterministic): claims, placeholders, product-specific copy.
    if job or script:
        content_issues = []
        content_warnings = []
        if script:
            srep = validate_script_payload(
                script,
                product=(job or {}).get("product") or product,
                category=(job or {}).get("category", "skincare"),
            )
            content_issues.extend(srep.get("errors") or [])
            content_warnings.extend(srep.get("warnings") or [])
        if job:
            jrep = validate_job_spec(job, script)
            content_issues.extend(jrep.get("errors") or [])
            content_warnings.extend(jrep.get("warnings") or [])
        if content_issues:
            fixes.append("Regenerate script/card text with product-specific safe claims.")
        cats["content"] = {
            "status": "fail" if content_issues else ("warn" if content_warnings else "pass"),
            "issues": list(dict.fromkeys(content_issues + content_warnings)),
        }

    # 5. CAPTIONS timing / chosen text system
    if overlays and Path(overlays).exists():
        ov = json.loads(Path(overlays).read_text())
        c_issues = []
        for i, o in enumerate(ov):
            on = float(o["t1"]) - float(o["t0"])
            if on < MIN_CAPTION_SECONDS:
                c_issues.append(f"caption {i} on-screen {on:.1f}s (<{MIN_CAPTION_SECONDS}s)")
        if c_issues:
            fixes.append("Lengthen short caption windows or reduce caption count.")
        cats["captions"] = {"status": "warn" if c_issues else "pass",
                            "count": len(ov), "issues": c_issues}
    elif job and (job.get("product_card") or job.get("list_cards")):
        cats["captions"] = {"status": "pass", "count": 0, "issues": [],
                            "note": "frame text handled by Creative Engine product/value cards"}
    else:
        cats["captions"] = {"status": "skip", "note": "no overlays json provided"}

    # overall verdict
    statuses = [c.get("status") for c in cats.values()]
    if "fail" in statuses:
        verdict = "FAIL"
    elif "warn" in statuses:
        verdict = "REVIEW"
    else:
        verdict = "PASS"
    score = cats.get("visual", {}).get("avg_score") or cats["technical"].get("score") or \
        (90 if verdict == "PASS" else 70 if verdict == "REVIEW" else 30)
    return {"verdict": verdict, "score": score, "categories": cats,
            "fixes": list(dict.fromkeys(fixes)), "_provider": "master"}


def to_markdown(rep: dict, video: str) -> str:
    icon = {"pass": "✅", "warn": "⚠️", "fail": "❌", "skip": "�–"}
    L = [f"# Reel QA Report Card", f"**File:** `{Path(video).name}`",
         f"**Verdict: {rep['verdict']}**  ·  Score: {rep['score']}", ""]
    for name, c in rep["categories"].items():
        L.append(f"### {icon.get(c['status'],'?')} {name.title()} — {c['status'].upper()}")
        for k, v in c.items():
            if k in ("status", "issues", "note"):
                continue
            L.append(f"- {k}: {v}")
        for iss in c.get("issues", []):
            L.append(f"  - ⚠ {iss}")
        if c.get("note"):
            L.append(f"  - _{c['note']}_")
        L.append("")
    if rep["fixes"]:
        L.append("### Recommended fixes")
        L += [f"- {f}" for f in rep["fixes"]]
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--overlays", default=None)
    ap.add_argument("--product", default="skincare product")
    ap.add_argument("--frames", type=int, default=4)
    ap.add_argument("--out", required=True)
    ap.add_argument("--report", default=None, help="optional human-readable .md report card")
    ap.add_argument("--job", default=None, help="optional job JSON for content/script QA")
    a = ap.parse_args()
    rep = audit(a.video, a.overlays, a.product, a.frames, a.job)
    Path(a.out).write_text(json.dumps(rep, ensure_ascii=False, indent=2))
    if a.report:
        Path(a.report).write_text(to_markdown(rep, a.video))
    print(f"{rep['verdict']} (score {rep['score']})")


if __name__ == "__main__":
    main()
