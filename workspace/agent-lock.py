#!/usr/bin/env python3
"""
Agent file-level lock helper — prevents Claude/Codex/OpenClaw from colliding on shared files.

Usage:
  python3 workspace/agent-lock.py acquire <filepath> <agent> "<task>"
  python3 workspace/agent-lock.py release <filepath> <agent>
  python3 workspace/agent-lock.py check   <filepath>
  python3 workspace/agent-lock.py list
  python3 workspace/agent-lock.py cleanup          # removes stale locks (>4h)

Exit codes:
  acquire → 0 = lock granted, 1 = blocked
  check   → 0 = free,         1 = locked
"""

import sys
import json
import os
from datetime import datetime, timezone
from pathlib import Path

LOCKS_DIR = Path(__file__).parent / ".locks"
STALE_HOURS = 4


def _lock_path(filepath: str) -> Path:
    LOCKS_DIR.mkdir(exist_ok=True)
    key = str(filepath).lstrip("/").replace("/", "__").replace("\\", "__")
    return LOCKS_DIR / f"{key}.working"


def acquire(filepath: str, agent: str, task: str) -> bool:
    lp = _lock_path(filepath)
    if lp.exists():
        try:
            data = json.loads(lp.read_text())
            started = datetime.fromisoformat(data["started"])
            age_h = (datetime.now(timezone.utc) - started).total_seconds() / 3600
            if age_h < STALE_HOURS:
                print(f"BLOCKED: {filepath} locked by {data['agent']} since {data['started']}")
                print(f"  Task: {data['task']}")
                return False
            # stale lock — take over silently
        except Exception:
            pass  # corrupt lock file — take over

    lp.write_text(json.dumps({
        "agent": agent,
        "filepath": filepath,
        "task": task,
        "started": datetime.now(timezone.utc).isoformat(),
        "pid": os.getpid()
    }, indent=2))
    print(f"ACQUIRED: {filepath} → {agent}")
    return True


def release(filepath: str, agent: str) -> None:
    lp = _lock_path(filepath)
    if not lp.exists():
        print(f"No lock on {filepath}")
        return
    try:
        data = json.loads(lp.read_text())
        if data["agent"] != agent:
            print(f"WARN: lock owned by {data['agent']}, not {agent} — not released")
            return
    except Exception:
        pass
    lp.unlink()
    print(f"RELEASED: {filepath}")


def check(filepath: str) -> dict | None:
    lp = _lock_path(filepath)
    if not lp.exists():
        return None
    try:
        return json.loads(lp.read_text())
    except Exception:
        return None


def list_locks() -> None:
    LOCKS_DIR.mkdir(exist_ok=True)
    locks = []
    for f in sorted(LOCKS_DIR.glob("*.working")):
        try:
            locks.append(json.loads(f.read_text()))
        except Exception:
            locks.append({"filepath": str(f), "agent": "?", "task": "corrupt", "started": "?"})
    if not locks:
        print("No active locks.")
        return
    for lk in locks:
        print(f"  [{lk['agent']}] {lk['filepath']}")
        print(f"    task:    {lk['task']}")
        print(f"    started: {lk['started']}")


def cleanup() -> int:
    LOCKS_DIR.mkdir(exist_ok=True)
    removed = 0
    for f in LOCKS_DIR.glob("*.working"):
        try:
            data = json.loads(f.read_text())
            started = datetime.fromisoformat(data["started"])
            age_h = (datetime.now(timezone.utc) - started).total_seconds() / 3600
            if age_h >= STALE_HOURS:
                f.unlink()
                removed += 1
                print(f"  cleaned: {data['filepath']} ({data['agent']}, {age_h:.1f}h ago)")
        except Exception:
            f.unlink()
            removed += 1
    if removed == 0:
        print("No stale locks.")
    else:
        print(f"Cleaned {removed} stale lock(s).")
    return removed


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "acquire":
        if len(sys.argv) < 5:
            print("Usage: acquire <filepath> <agent> <task>")
            sys.exit(1)
        ok = acquire(sys.argv[2], sys.argv[3], " ".join(sys.argv[4:]))
        sys.exit(0 if ok else 1)

    elif cmd == "release":
        if len(sys.argv) < 4:
            print("Usage: release <filepath> <agent>")
            sys.exit(1)
        release(sys.argv[2], sys.argv[3])

    elif cmd == "check":
        if len(sys.argv) < 3:
            print("Usage: check <filepath>")
            sys.exit(1)
        info = check(sys.argv[2])
        if info:
            print(json.dumps(info, indent=2))
            sys.exit(1)
        else:
            print(f"free: {sys.argv[2]}")
            sys.exit(0)

    elif cmd == "list":
        list_locks()

    elif cmd == "cleanup":
        cleanup()

    else:
        print(__doc__)
        sys.exit(1)
