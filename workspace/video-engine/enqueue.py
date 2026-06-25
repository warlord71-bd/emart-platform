#!/usr/bin/env python3
"""
enqueue — drop a job spec into jobs/queue/ with a priority prefix the orchestrator honours.

Filenames are `NN-<id>.json`; lower NN builds first. Use this so daily/automated producers and
humans add work the same way. The spec is any existing video-engine job JSON (see queue/*.json).

    python3 enqueue.py path/to/spec.json --priority 10     # high priority
    python3 enqueue.py path/to/spec.json                   # default priority 50
    python3 enqueue.py --status                            # show pipeline (delegates to orchestrator)
"""
from __future__ import annotations
import argparse, json, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
QUEUE = ROOT / "jobs" / "queue"


PLATFORM_SAFE_ZONES = {"facebook": "fb", "instagram": "ig", "youtube": "youtube", "tiktok": "tiktok"}


def _clean_spec(spec: dict) -> dict:
    """strip stale per-stage checkpoints + bot/escalation markers for a fresh build."""
    for k in ("stages", "_tg_sent", "_tg_msg_id", "_codex_escalated"):
        spec.pop(k, None)
    spec["status"] = "pending"
    return spec


def enqueue(spec_path: Path, prio: int) -> list[Path]:
    spec = json.loads(spec_path.read_text())
    jid = spec.get("id") or spec_path.stem
    spec.setdefault("id", jid)
    QUEUE.mkdir(parents=True, exist_ok=True)

    platforms = spec.get("platforms") or ["facebook"]
    # single-platform or explicit safe_zone → one job as before
    if len(platforms) <= 1 or spec.get("safe_zone"):
        spec = _clean_spec(spec)
        dest = QUEUE / f"{prio:02d}-{jid}.json"
        dest.write_text(json.dumps(spec, ensure_ascii=False, indent=2))
        return [dest]

    # multi-platform → split into one tuned job per platform (separate FB + IG safe zones)
    results = []
    for plat in platforms:
        pj = dict(spec)
        pj["id"] = f"{jid}-{plat[:2]}"
        pj["platforms"] = [plat]
        pj["safe_zone"] = PLATFORM_SAFE_ZONES.get(plat, "wide")
        pj = _clean_spec(pj)
        dest = QUEUE / f"{prio:02d}-{pj['id']}.json"
        dest.write_text(json.dumps(pj, ensure_ascii=False, indent=2))
        results.append(dest)
    return results


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec", nargs="?", help="path to a job JSON spec")
    ap.add_argument("--priority", type=int, default=50)
    ap.add_argument("--status", action="store_true")
    a = ap.parse_args()
    if a.status:
        subprocess.run([sys.executable, str(ROOT / "orchestrator.py"), "--status"])
        return
    if not a.spec:
        ap.error("pass a job spec path, or --status")
    dests = enqueue(Path(a.spec), a.priority)
    for d in dests:
        print(f"queued -> {d}")


if __name__ == "__main__":
    main()
