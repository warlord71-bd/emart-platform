#!/usr/bin/env python3
"""
Tiny session-start command for Emart agents.

Prints a compact current-state brain without requiring agents to read the whole
memory/task/session stack. Safe defaults: read-only, no secrets, no live calls.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import agent_brain  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Start an Emart agent session with compact context.")
    parser.add_argument("--write", action="store_true", help="Also refresh workspace/AGENT_BRAIN.md.")
    parser.add_argument("--show", action="store_true", help="Print the full generated brain.")
    args = parser.parse_args()

    content = agent_brain.build_brain()
    if args.write:
        agent_brain.BRAIN.write_text(content, encoding="utf-8")
        print(f"Refreshed {agent_brain.BRAIN.relative_to(agent_brain.ROOT)}")

    if args.show:
        print(content, end="")
        return 0

    lines = content.splitlines()
    keep_prefixes = (
        "# Emart Agent Brain",
        "Generated:",
        "- Freeze:",
        "- Run B0",
        "- Best default",
        "- If Claude",
        "Summary:",
        "- ` M ",
        "- `?? ",
        "- ` D ",
        "- Start:",
        "- Regenerate",
        "- Close",
    )
    print("# Emart quick-start brain")
    print("")
    for line in lines:
        if line.startswith(keep_prefixes):
            print(line)
    print("")
    print("For the full compact brain, run: python3 workspace/content-orchestrator/scripts/active/agent_start.py --show")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
