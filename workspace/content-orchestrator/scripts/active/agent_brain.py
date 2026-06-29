#!/usr/bin/env python3
"""
Emart Agent Brain v1.

Purpose:
- Generate one compact, repo-backed handoff brain for Codex/Claude/OpenClaw sessions.
- Reduce token burn by summarizing the coordination state without reading the whole memory stack.

Safety:
- Reads only repo coordination/task files and `git status --short`.
- Never reads .env files, credential directories, WordPress configs, or external services.
- Writes only workspace/AGENT_BRAIN.md when --write is passed.
- Does not edit AGENT_BUS.md, TASKS.md, SESSION-LOG.md, live services, or protected commerce data.
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[3]
WORKSPACE = ROOT / "workspace"
AGENT_BUS = ROOT / "apps/web/.agent-memory/AGENT_BUS.md"
TASKS = WORKSPACE / "TASKS.md"
SESSION_LOG = ROOT / "apps/web/SESSION-LOG.md"
BRAIN = WORKSPACE / "AGENT_BRAIN.md"


@dataclass
class Row:
    cells: list[str]


def read_text(path: Path, *, tail_lines: int | None = None) -> str:
    if not path.exists():
        return ""
    text = path.read_text(encoding="utf-8", errors="replace")
    if tail_lines is None:
        return text
    lines = text.splitlines()
    return "\n".join(lines[-tail_lines:])


def table_rows(section: str) -> list[Row]:
    rows: list[Row] = []
    for line in section.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|") or "---" in stripped:
            continue
        cells = [cell.strip() for cell in stripped.strip("|").split("|")]
        if cells and cells[0] not in {"Agent", "ID", "Order", "Batch", "Job", "#", "Item"}:
            rows.append(Row(cells))
    return rows


def section_between(text: str, start_heading: str, stop_prefix: str = "\n## ") -> str:
    start = text.find(start_heading)
    if start == -1:
        return ""
    body_start = start + len(start_heading)
    stop = text.find(stop_prefix, body_start)
    if stop == -1:
        return text[body_start:]
    return text[body_start:stop]


def subsection_between(text: str, start_heading: str, stop_prefix: str = "\n### ") -> str:
    start = text.find(start_heading)
    if start == -1:
        return ""
    body_start = start + len(start_heading)
    stop = text.find(stop_prefix, body_start)
    if stop == -1:
        return text[body_start:]
    return text[body_start:stop]


def git_status() -> list[str]:
    result = subprocess.run(
        ["git", "status", "--short"],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode != 0:
        return [f"!! git status failed: {result.stderr.strip()}"]
    return [line for line in result.stdout.splitlines() if line.strip()]


def summarize_git_status(lines: list[str]) -> tuple[str, list[str]]:
    if not lines:
        return "clean", []
    counts = {"modified": 0, "deleted": 0, "untracked": 0, "other": 0}
    for line in lines:
        code = line[:2]
        if "??" in code:
            counts["untracked"] += 1
        elif "D" in code:
            counts["deleted"] += 1
        elif "M" in code:
            counts["modified"] += 1
        else:
            counts["other"] += 1
    parts = [f"{value} {name}" for name, value in counts.items() if value]
    return ", ".join(parts), lines[:25]


def source_task_line(text: str, task_id: str) -> str | None:
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|") or "---" in stripped:
            continue
        cells = [cell.strip().strip("`") for cell in stripped.strip("|").split("|")]
        if cells and cells[0] == task_id:
            return line.strip()
    return None


def compact_cells(row: Row, max_cell: int = 160) -> list[str]:
    compact: list[str] = []
    for cell in row.cells:
        cell = re.sub(r"\s+", " ", cell)
        if len(cell) > max_cell:
            cell = cell[: max_cell - 1].rstrip() + "…"
        compact.append(cell)
    return compact


def markdown_table(headers: list[str], rows: Iterable[list[str]]) -> str:
    rows = list(rows)
    if not rows:
        return "_None found._"
    out = ["| " + " | ".join(headers) + " |", "| " + " | ".join("---" for _ in headers) + " |"]
    for row in rows:
        padded = row[: len(headers)] + [""] * max(0, len(headers) - len(row))
        out.append("| " + " | ".join(cell.replace("|", "\\|") for cell in padded[: len(headers)]) + " |")
    return "\n".join(out)


def build_brain() -> str:
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    bus = read_text(AGENT_BUS)
    tasks = read_text(TASKS)
    session_tail = read_text(SESSION_LOG, tail_lines=40)
    status_lines = git_status()
    status_summary, status_sample = summarize_git_status(status_lines)

    active_section = section_between(bus, "## ACTIVE WORK (who is doing what RIGHT NOW)")
    last_completed_section = section_between(bus, "## LAST COMPLETED (most recent per agent)")
    active_rows = [compact_cells(row, 180) for row in table_rows(active_section)]
    last_completed_rows = [compact_cells(row, 180) for row in table_rows(last_completed_section)[:6]]

    conflict_section = subsection_between(tasks, "### Workspace Conflict Audit")
    batch_section = subsection_between(tasks, "### Token-Efficient Session Batches")
    priority_section = subsection_between(tasks, "### Audit Remediation Priority Lane")

    conflicts = [compact_cells(row, 180) for row in table_rows(conflict_section)]
    batches = [compact_cells(row, 160) for row in table_rows(batch_section)]
    priority_rows = [compact_cells(row, 170) for row in table_rows(priority_section)]

    critical_ids = ["WA-G", "WA-H", "ORCH-1", "ORCH-5", "ORCH-8", "SEO-ORCH-1", "UX-ORCH-1"]
    critical_lines = [line for tid in critical_ids if (line := source_task_line(tasks, tid))]
    critical_rows = []
    for line in critical_lines:
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        critical_rows.append(compact_cells(Row(cells), 190))

    freeze_line = next((line for line in tasks.splitlines() if line.startswith("Freeze:")), "Freeze: unknown")
    last_updated = next((line for line in tasks.splitlines() if line.startswith("Last updated:")), "Last updated: unknown")

    mandatory_next = "Run B0 first. Because the worktree is dirty or shared, inspect AGENT_BUS + git status before selecting B1/B2/B3/B5."
    if status_summary == "clean" and not active_rows:
        mandatory_next = "Run B0 first anyway, then choose the highest-priority open batch."

    out: list[str] = []
    out.append("# Emart Agent Brain")
    out.append("")
    out.append(f"Generated: {now}")
    out.append("")
    out.append("This file is generated by `workspace/content-orchestrator/scripts/active/agent_brain.py`. It is a compact session-start brain, not a replacement for source files when editing.")
    out.append("")
    out.append("## Current guardrails")
    out.append("")
    out.append(f"- {freeze_line}")
    out.append(f"- {last_updated}")
    out.append("- Protected data remains off-limits without explicit owner request: checkout, cart, payment, order, customer data, stock, price, WooCommerce DB.")
    out.append("- Do not read or print secrets. This generator intentionally ignores `.env`, credential stores, and external services.")
    out.append("")
    out.append("## Start-here recommendation")
    out.append("")
    out.append(f"- {mandatory_next}")
    out.append("- Best default next clusters: `B1` for security/release foundation, `B3` for SEO data-control, `B5` for UI/UX trust systems.")
    out.append("- If Claude is active on VA-1/video, avoid video-engine files unless owner explicitly coordinates transfer.")
    out.append("")
    out.append("## Active work")
    out.append("")
    out.append(markdown_table(["Agent", "Started", "Task", "Files"], active_rows))
    out.append("")
    out.append("## Dirty worktree")
    out.append("")
    out.append(f"Summary: `{status_summary}`")
    out.append("")
    if status_sample:
        out.append("Sample:")
        out.append("")
        out.extend(f"- `{line}`" for line in status_sample)
        if len(status_lines) > len(status_sample):
            out.append(f"- … {len(status_lines) - len(status_sample)} more")
    else:
        out.append("_No dirty files detected._")
    out.append("")
    out.append("## Workspace conflicts")
    out.append("")
    out.append(markdown_table(["ID", "Conflict / friction", "Decision"], conflicts))
    out.append("")
    out.append("## Priority lane")
    out.append("")
    out.append(markdown_table(["Order", "Priority", "IDs", "Safe next action", "Guard"], priority_rows))
    out.append("")
    out.append("## Token-efficient batches")
    out.append("")
    out.append(markdown_table(["Batch", "Type", "Task IDs", "Read first", "Output", "Hard stop"], batches))
    out.append("")
    out.append("## Critical open rows to remember")
    out.append("")
    out.append(markdown_table(["ID/Order", "Priority/Item", "Details", "Status/Guard"], critical_rows))
    out.append("")
    out.append("## Recent completed work")
    out.append("")
    out.append(markdown_table(["Agent", "When", "What", "Commit"], last_completed_rows))
    out.append("")
    out.append("## Recent session-log tail")
    out.append("")
    out.append("```text")
    out.append(session_tail[-2500:] if session_tail else "No session log found.")
    out.append("```")
    out.append("")
    out.append("## Commands")
    out.append("")
    out.append("- Start: `python3 workspace/content-orchestrator/scripts/active/agent_start.py`")
    out.append("- Regenerate brain: `python3 workspace/content-orchestrator/scripts/active/agent_brain.py --write`")
    out.append("- Close helper: `python3 workspace/content-orchestrator/scripts/active/agent_close.py --help`")
    out.append("")
    return "\n".join(out) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the compact Emart Agent Brain.")
    parser.add_argument("--write", action="store_true", help="Write workspace/AGENT_BRAIN.md instead of printing.")
    parser.add_argument("--output", default=str(BRAIN), help="Output path for --write.")
    args = parser.parse_args()

    content = build_brain()
    if args.write:
        output = Path(args.output)
        if not output.is_absolute():
            output = ROOT / output
        output.write_text(content, encoding="utf-8")
        print(f"Wrote {output.relative_to(ROOT)}")
    else:
        print(content, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
