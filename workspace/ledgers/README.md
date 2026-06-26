# Emart Action & Event Ledger

Schema: `workspace/docs/action-ledger-schema.md` (v1, 2026-06-25)
Instantiated: 2026-06-26

## Files

- `action-events.jsonl` — canonical append-only ledger (one JSON object per line)
- `ledger_helper.py` — CLI to add, query, update, and generate reports from the ledger
- `pending-approvals.md` — auto-generated from ledger (read-only)

## Rules

- Append-only: corrections are new events with `supersedes`/`corrects`, not edits.
- IDs are never reused.
- Protected commerce data (checkout/cart/payment/order/customer/stock/price/Woo DB) entries require explicit owner approval scope.
- Generated indexes are derived from the JSONL; never hand-edit them.
