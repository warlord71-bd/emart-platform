#!/usr/bin/env python3
"""
Safe session-close helper for Emart agents.

V1 intentionally does not auto-edit AGENT_BUS, TASKS, or SESSION-LOG. It prints
reviewable blocks and can refresh workspace/AGENT_BRAIN.md after the human/agent
applies the chosen bookkeeping edits.
"""

from __future__ import annotations

import argparse
import datetime as dt
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import agent_brain  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Print safe session-close bookkeeping blocks.")
    parser.add_argument("--agent", default="Codex", help="Agent name for generated blocks.")
    parser.add_argument("--title", required=False, default="session close", help="Short session title.")
    parser.add_argument("--did", action="append", default=[], help="Completed item; repeat as needed.")
    parser.add_argument("--guardrail", action="append", default=[], help="Guardrail/safety note; repeat as needed.")
    parser.add_argument("--next", default="", help="Recommended next step, if any.")
    parser.add_argument("--commit", default="pending", help="Commit/ref field for AGENT_BUS LAST COMPLETED.")
    parser.add_argument("--write-brain", action="store_true", help="Refresh workspace/AGENT_BRAIN.md.")
    args = parser.parse_args()

    today = dt.date.today().isoformat()
    did = args.did or ["No implementation summary provided."]
    guardrails = args.guardrail or ["No live/protected-data changes unless explicitly stated."]
    next_step = args.next or "Start next session with B0 and choose one cluster only."

    print("## Proposed SESSION-LOG block")
    print("")
    print(f"## {today} ({args.agent} - {args.title})")
    for item in did:
        print(f"- Did: {item}")
    for item in guardrails:
        print(f"- Guardrail: {item}")
    print(f"- Next: {next_step}")
    print("")
    print("## Proposed AGENT_BUS LAST COMPLETED row")
    print("")
    summary = "; ".join(did)
    if len(summary) > 220:
        summary = summary[:219].rstrip() + "…"
    print(f"| {args.agent} | {today} | {summary} | {args.commit} |")

    if args.write_brain:
        content = agent_brain.build_brain()
        agent_brain.BRAIN.write_text(content, encoding="utf-8")
        print("")
        print(f"Refreshed {agent_brain.BRAIN.relative_to(agent_brain.ROOT)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
