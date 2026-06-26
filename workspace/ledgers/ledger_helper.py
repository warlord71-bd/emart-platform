#!/usr/bin/env python3
"""Emart action ledger CLI — append, query, update, report."""
import argparse, json, sys, os, datetime as dt
from pathlib import Path

LEDGER = Path(__file__).parent / "action-events.jsonl"
PENDING_MD = Path(__file__).parent / "pending-approvals.md"
SCHEMA_VERSION = "action-ledger.v1"

def _now():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")

def _read_all():
    if not LEDGER.exists():
        return []
    entries = []
    for line in LEDGER.read_text().splitlines():
        line = line.strip()
        if line:
            entries.append(json.loads(line))
    return entries

def _append(entry):
    with LEDGER.open("a") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

def _next_seq(entries, domain, entity, date_str):
    prefix = f"{domain}-{date_str}-{entity}-"
    existing = [e["id"] for e in entries if e.get("id","").startswith(prefix)]
    if not existing:
        return 1
    nums = [int(eid.split("-")[-1]) for eid in existing]
    return max(nums) + 1

def cmd_add(args):
    entries = _read_all()
    date_str = dt.date.today().strftime("%Y%m%d")
    seq = _next_seq(entries, args.domain, args.entity, date_str)
    action_id = f"{args.domain}-{date_str}-{args.entity}-{seq:03d}"

    entry = {
        "schema_version": SCHEMA_VERSION,
        "id": action_id,
        "parent_id": args.parent or None,
        "related_ids": args.related.split(",") if args.related else [],
        "category": args.domain,
        "sub_category": args.sub_category or "",
        "entity": {
            "type": args.entity_type or "",
            "slug": args.slug or "",
            "canonical_url": args.url or ""
        },
        "status": "proposed",
        "priority": args.priority or "medium",
        "risk": {
            "blast_radius": args.blast_radius or "single-page",
            "protected_data": False,
            "requires_owner_approval": True,
            "freeze_safe": True
        },
        "evidence": [{
            "source": args.evidence_source or "audit",
            "captured_at": _now(),
            "summary": args.summary or ""
        }],
        "recommendation": {
            "summary": args.recommendation or "",
            "proposed_files": [],
            "acceptance_criteria": []
        },
        "owner": args.owner or "[C]",
        "approval": {"state": "not_requested"},
        "execution": {},
        "verification": {},
        "measurement": {
            "metric": args.metric or "organic_ctr",
            "baseline": {"window": "28d"},
            "post_change": {"window": "7d"}
        },
        "created_at": _now(),
        "updated_at": _now(),
        "created_by": args.created_by or "Claude",
        "notes": [args.note] if args.note else []
    }
    _append(entry)
    print(f"Added: {action_id}")
    return action_id

def cmd_update_status(args):
    entries = _read_all()
    found = False
    updated = []
    for e in entries:
        if e["id"] == args.id:
            old_status = e["status"]
            e["status"] = args.status
            e["updated_at"] = _now()
            if args.note:
                e.setdefault("notes", []).append(f"[{_now()}] {args.note}")
            if args.commit:
                e.setdefault("execution", {})["commit"] = args.commit
                e["execution"]["applied_at"] = _now()
                e["execution"]["agent"] = args.agent or "Claude"
            found = True
            print(f"Updated {args.id}: {old_status} -> {args.status}")
        updated.append(e)
    if not found:
        print(f"ID {args.id} not found", file=sys.stderr)
        sys.exit(1)
    LEDGER.write_text("\n".join(json.dumps(e, ensure_ascii=False) for e in updated) + "\n")

def cmd_list(args):
    entries = _read_all()
    if args.status:
        entries = [e for e in entries if e["status"] == args.status]
    if args.domain:
        entries = [e for e in entries if e["category"] == args.domain]
    for e in entries:
        entity_slug = e.get("entity", {}).get("slug", "")
        rec = e.get("recommendation", {}).get("summary", "")[:60]
        print(f'{e["id"]:30s} {e["status"]:12s} {e["priority"]:8s} {entity_slug:40s} {rec}')
    print(f"\nTotal: {len(entries)}")

def cmd_pending(args):
    entries = _read_all()
    pending = [e for e in entries if e["status"] in ("proposed", "triaged")]
    lines = ["# Pending Approvals", f"\nGenerated: {_now()}", f"Total pending: {len(pending)}\n"]
    for e in pending:
        entity = e.get("entity", {})
        rec = e.get("recommendation", {}).get("summary", "")
        evidence = e.get("evidence", [{}])[0].get("summary", "")
        lines.append(f"## {e['id']} ({e['priority']})")
        lines.append(f"- **Status:** {e['status']}")
        lines.append(f"- **URL:** {entity.get('canonical_url', entity.get('slug', ''))}")
        lines.append(f"- **Evidence:** {evidence}")
        lines.append(f"- **Recommendation:** {rec}")
        lines.append(f"- **Owner:** {e.get('owner', '?')}")
        lines.append("")
    PENDING_MD.write_text("\n".join(lines))
    print(f"Wrote {PENDING_MD} ({len(pending)} entries)")

def cmd_import_actions(args):
    """Import existing SEO actions.json proposals into ledger."""
    actions_path = Path(args.file)
    if not actions_path.exists():
        print(f"File not found: {actions_path}", file=sys.stderr)
        sys.exit(1)
    with open(actions_path) as f:
        actions = json.load(f)
    entries = _read_all()
    date_str = dt.date.today().strftime("%Y%m%d")
    imported = 0
    for a in actions:
        entity_type = "product" if "/shop/" in a.get("url","") else "page"
        slug = a.get("url","").split("/")[-1] if a.get("url") else a.get("slug","")
        domain = "SEO"
        entity_key = "PDP" if entity_type == "product" else "URL"
        seq = _next_seq(entries, domain, entity_key, date_str)
        entry = {
            "schema_version": SCHEMA_VERSION,
            "id": f"{domain}-{date_str}-{entity_key}-{seq:03d}",
            "parent_id": None,
            "related_ids": [],
            "category": domain,
            "sub_category": a.get("type", "metadata"),
            "entity": {
                "type": entity_type,
                "slug": slug,
                "canonical_url": a.get("url", "")
            },
            "status": "proposed",
            "priority": a.get("priority", "medium"),
            "risk": {
                "blast_radius": "single-page",
                "protected_data": False,
                "requires_owner_approval": True,
                "freeze_safe": True
            },
            "evidence": [{
                "source": "gsc_tracker_actions",
                "source_path": str(actions_path),
                "captured_at": a.get("date", _now()),
                "summary": a.get("reason", a.get("action", "")),
                "metrics": a.get("metrics", {})
            }],
            "recommendation": {
                "summary": a.get("action", ""),
                "proposed_files": [],
                "acceptance_criteria": []
            },
            "owner": "[C]",
            "approval": {"state": "not_requested"},
            "execution": {},
            "verification": {},
            "measurement": {"metric": "organic_ctr", "baseline": {"window": "28d"}, "post_change": {"window": "7d"}},
            "created_at": _now(),
            "updated_at": _now(),
            "created_by": "import",
            "notes": [f"Imported from {actions_path.name}"]
        }
        _append(entry)
        entries.append(entry)
        imported += 1
    print(f"Imported {imported} entries from {actions_path.name}")

def main():
    p = argparse.ArgumentParser(description="Emart action ledger CLI")
    sub = p.add_subparsers(dest="cmd")

    add_p = sub.add_parser("add")
    add_p.add_argument("--domain", required=True, help="SEO|UX|CONTENT|TRUST|OPS|SOCIAL")
    add_p.add_argument("--entity", required=True, help="PDP|CATEGORY|BLOG|URL|SEARCH|CAMPAIGN etc.")
    add_p.add_argument("--entity-type", help="product|page|component|route")
    add_p.add_argument("--slug", help="URL slug or identifier")
    add_p.add_argument("--url", help="canonical URL")
    add_p.add_argument("--summary", help="evidence summary")
    add_p.add_argument("--recommendation", help="proposed action")
    add_p.add_argument("--priority", default="medium")
    add_p.add_argument("--owner", default="[C]")
    add_p.add_argument("--parent")
    add_p.add_argument("--related")
    add_p.add_argument("--evidence-source", default="audit")
    add_p.add_argument("--sub-category", default="")
    add_p.add_argument("--metric", default="organic_ctr")
    add_p.add_argument("--blast-radius", default="single-page")
    add_p.add_argument("--note")
    add_p.add_argument("--created-by", default="Claude")

    upd_p = sub.add_parser("update-status")
    upd_p.add_argument("--id", required=True)
    upd_p.add_argument("--status", required=True)
    upd_p.add_argument("--note")
    upd_p.add_argument("--commit")
    upd_p.add_argument("--agent")

    list_p = sub.add_parser("list")
    list_p.add_argument("--status")
    list_p.add_argument("--domain")

    sub.add_parser("pending")

    imp_p = sub.add_parser("import-actions")
    imp_p.add_argument("--file", required=True)

    args = p.parse_args()
    if args.cmd == "add":
        cmd_add(args)
    elif args.cmd == "update-status":
        cmd_update_status(args)
    elif args.cmd == "list":
        cmd_list(args)
    elif args.cmd == "pending":
        cmd_pending(args)
    elif args.cmd == "import-actions":
        cmd_import_actions(args)
    else:
        p.print_help()

if __name__ == "__main__":
    main()
