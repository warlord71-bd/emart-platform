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


def enqueue(spec_path: Path, prio: int) -> Path:
    spec = json.loads(spec_path.read_text())  # validate it parses
    jid = spec.get("id") or spec_path.stem
    spec.setdefault("id", jid)
    # force a CLEAN build: strip any stale per-stage checkpoints + bot/escalation markers so a
    # re-enqueued spec never reuses an old (e.g. silent) reel. The pipeline is idempotent only
    # WITHIN a run; across enqueues we always rebuild from the spec. NOTE: keep an intentional
    # `holding_request` from the source spec (it asks Codex for a model-holding shot) — only the
    # runtime auto-escalation marker `_codex_escalated` is transient.
    for k in ("stages", "_tg_sent", "_tg_msg_id", "_codex_escalated"):
        spec.pop(k, None)
    spec["status"] = "pending"
    QUEUE.mkdir(parents=True, exist_ok=True)
    dest = QUEUE / f"{prio:02d}-{jid}.json"
    dest.write_text(json.dumps(spec, ensure_ascii=False, indent=2))
    return dest


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
    dest = enqueue(Path(a.spec), a.priority)
    print(f"queued -> {dest}")


if __name__ == "__main__":
    main()
