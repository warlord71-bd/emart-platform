# Content Orchestrator Docs

Reorganized 2026-06-30 (was 34 loose files in this root). Structure now:

| Folder | What goes here | Examples |
|---|---|---|
| `specs/` | Durable contracts, schemas, plans — engine behavior agents must follow | `theme-contract.md`, `process-manifest.md`, `category-taxonomy-status.md` |
| `guides/` | How-to / operating guides and runbooks | `CLAUDE-product-humanizer-guide.md`, `RECOVERY.md`, `mobile-build-notes.md` |
| `owner-actions/` | Owner-only manual actions, kept until done | `OWNER-ACTION-R3-cloudflare-access-20260611.md` (still open) |
| `audits/` | Completed audit/report deliverables | `EMART_AUDIT_20260610.md`, `gmc-steps3-6-report-20260605.md` |
| `archive/` | Superseded/completed dated task briefs | `CODEX-GMC-FIX-20260605.md` |
| `claude-reference/` | Agent-facing operating reference for this folder's engines | `content-orchestrator.md`, `social-publishing.md` |

Root-level scripts (`meta_generator.py`, `meta_validator.py`, `_run_generator.py`, `_run_validator.py`,
`baseline_snapshot.py`, `catalog-lighthouse-fast-audit.mjs`, `R2-cloudflare-real-ip-nginx.conf`) were
left in place — `scripts/active/meta_gen_batch.sh` references `meta_generator.py`/`meta_validator.py`
by path. The `emart-meta-gen` PM2 job that runs `meta_gen_batch.sh` is complete (1,360/1,360 metas,
stopped) but kept for future incremental runs on new products.

**Known issue (not fixed by this reorg):** `ecosystem.config.cjs`'s `emart-meta-gen` entry still
points at the legacy `workspace/scripts/active/meta_gen_batch.sh` path, not
`workspace/content-orchestrator/scripts/active/meta_gen_batch.sh`. The VPS still has a full untracked
`workspace/scripts/` legacy directory (~90 files, its own active/archive/done split) that doesn't
exist on Local. Resuming this PM2 job today would run a stale duplicate. Needs an owner decision
before resuming — see `apps/web/SESSION-LOG.md` 2026-06-30 entry.

When adding a new doc here, put it in the matching folder above — don't drop loose files in `docs/`
root.
