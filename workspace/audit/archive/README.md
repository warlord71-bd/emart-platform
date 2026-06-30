# Archived Audit Workspace

Use this folder for completed audit outputs that should stay near the project for short-term reference.

Large raw exports and old generated batches should be quarantined in `/root/.attic-YYYY-MM-DD/emart-platform/` instead of Git.

## 2026-06-30 active cleanup

Claude cleaned `workspace/audit/active/` (280 items, 139M, accumulated since 2026-05-14) down to 19 items with a genuine open owner decision or work dated today. Classification was cross-referenced against `workspace/TASKS.md` and `workspace/SEO_MASTER.md` open-task status, not guessed. Full move-by-move manifest: `workspace/audit/archive/active-cleanup-manifest-20260630.md`.

- **85 items → here** (`archive/2026-06-30-active-cleanup/`): completed task deliverables small enough to keep as short-term reference — duplicate/image audits, GMC D5/D6 closure artifacts and rollback files, meta-validator closure files, SEO batch-A markdown proposals (SEO-1/2/3/4/5/6/7), D8 brand-content audit (D8 fully deployed), pa-concern rollback/summary files, the `creative-usecase-samples-20260626/` sample pack (superseded by the persona standard doc), and the approved `social-bilingual-18-20260630/` pack (campaign already live via PM2, see below).
- **176 items → `/root/.attic-2026-06-30/emart-platform/workspace-audit-active-cleanup/`**: large raw exports and generated batches — lighthouse HTML/JSON reports, onboarding run dumps, `meta-generator-*` run logs (06-10 to 06-15, job already complete per memory), `gmc-step1/2`/`gmc-policy` 06-05 run artifacts, `pa-concern-qdrant` raw CSVs, Appetize/Playwright mobile screenshots, the `blog-heroes/` local test renders (live hero images are uploaded straight to WP by `blog_hero_gen.py`, not served from here), and superseded reel-campaign draft iterations (`social-reel-approval-20260628`, `-20260629-fresh`, `reel-approval-20260629-v6`, `social-reel-approval-20260630-brand-fresh-product-base` v1-v6) that were rejected or replaced by the final `-after-approval` pack kept in `active/`.
- **Verified before moving:** the live PM2 social schedulers (`emart-social-fb-20260630-bilingual`, `emart-social-ig-20260630-bilingual`) read their campaign plan from `workspace/content-orchestrator/social-engine/output/2026-06-30/...`, not from anything under `workspace/audit/active/` — moving the audit copies does not touch the running campaign.
- 21 files that were git-tracked under `active/` (mostly `creative-usecase-samples-20260626/*`, plus `cwv-baseline-20260628.md` and the `meta-validator-*-20260620` trio) were untracked via `git rm --cached` before the physical move, matching the 2026-05-11 precedent below — files stay on disk, just out of git index since `archive/*` is gitignored.

## 2026-05-11 active cleanup

Codex moved completed active reports into this archive folder and moved completed
one-off scripts into `workspace/scripts/archive/` to reduce VS Code/workspace
noise without deleting data. Full local manifest:
`workspace/audit/archive/active-cleanup-manifest-20260511.md`.

Moved report groups:
- Facebook catalog audit and image-fetch verification outputs.
- Facebook pixel event audit report.
- Completed slug cleanup outputs.
- Completed The Derma Co origin correction dry-run/apply outputs.

Kept active:
- Week 2 SEO/product SEO audit files.
- SKU and brand-size owner-review CSVs.
- `pa_origin` gap dry-run.
- The Derma Co meta review and Baidu Qianfan handoff.

## 2026-05-11 The Derma Co meta copy cleanup

Codex completed the Baidu Qianfan handoff for The Derma Co stale origin copy.
Woo/WordPress DB updates were applied only to published products with
`product_brand=the-derma-co`.

Result:
- 43 published The Derma Co products checked.
- 30 `post_content` rows updated for English stale Korea/Korean/K-beauty wording.
- 5 additional `post_content` rows updated for Bengali stale Korea/Korean wording.
- 0 stale The Derma Co visible-copy matches after verification.
- 0 stale The Derma Co SEO meta matches after verification.
- 43 The Derma Co products still have `pa_origin=India`.

Archived local trace files:
- `baidu-qianfan-the-derma-co-meta-instructions-20260510.md`
- `the-derma-co-meta-review-20260510.csv`
- `the-derma-co-meta-copy-dry-run-20260511-200213.csv`
- `the-derma-co-meta-copy-apply-20260511-200236.csv`
- `the-derma-co-meta-copy-dry-run-20260511-201403.csv`
- `the-derma-co-meta-copy-apply-20260511-201420.csv`
- `the-derma-co-meta-copy-dry-run-20260511-200159.csv` was a failed no-change dry-run kept for traceability.

Archived one-off script:
- `workspace/scripts/archive/fix-the-derma-co-meta-copy.php`
