# Emart Archive Index

Master catalog of archived files for Claude and Codex. When a future job needs something from an old script or audit, check here first.

---

## Stale Workspace Docs → `/root/.attic-2026-05-07/emart-platform/workspace-stale-docs/`

| File | What it was |
|------|-------------|
| `DEPLOY-FIX-INSTRUCTIONS.md` | Apr-26 nginx static serving fix steps (deploy issue resolved) |
| `DEPLOY-PLAN-2026-05-02.md` | May-02 deploy plan for that sprint (completed) |
| `FIX-SUMMARY.md` | Summary of Apr-26 nginx/deploy fixes applied to VPS |
| `SETUP.md` | Initial VPS + Next.js setup notes (one-time, done) |
| `UI-UX-SEO-AUDIT.md` | 27KB Apr-26 UI/UX/SEO audit snapshot (superseded by SEO_TODO.md) |
| `VS_CODE_SSH.md` | VS Code Remote-SSH connection setup guide |
| `emart-phase1-foundation-seo.md` | 38KB Apr-30 Phase 1 SEO foundation plan (implemented) |
| `nginx-emart.conf` | Nginx config reference copy (live copy in /etc/nginx) |
| `nginx-skbd-gone-products.conf` | 220KB nginx redirect map for gone SkincaresBD products (applied) |
| `nginx/emart-vps.conf` | Old nginx VPS config (superseded) |

---

## Completed Scripts → `workspace/scripts/archive/`

| File | What it did |
|------|-------------|
| `apply-brand-origin.php` | Assigned `pa_origin` by brand; run 2026-05-05 (3,641 products) |
| `apply-clean-brand-matches.php` | Applied clean brand name matches to WooCommerce meta |
| `apply-product-brand-exact-map.mjs` | Exact brand→product mapping apply pass |
| `apply-user-manual-brand-mappings.php` | Applied user-corrected manual brand mappings |
| `apply-xlsx-brand-corrections.php` | Applied brand corrections from user-reviewed XLSX |
| `brand-origin-dry-run.mjs` | Dry-run for brand→origin assignment (pre-apply preview) |
| `brand-source-unification-dry-run.mjs` | Dry-run for unifying brand sources across products |
| `bulk_fixer_google2026.py` | Python bulk fixer for Google/GMC product feed data |
| `catalog_audit.py` | Python catalog audit (price/image/brand completeness) |
| `catalog_fixer_v2.py` | Python catalog fixer v2 |
| `comprehensive-fix.sh` | Apr-24 one-shot comprehensive VPS fix script |
| `diagnose-issues.sh` | Apr-24 diagnostic script for VPS/deploy issues |
| `emart-safe-audit.sh` | Apr-25 safe read-only audit of live VPS state |
| `fix-image-urls.sh` | One-off script to fix image URL paths in WooCommerce |
| `fix-images.sh` | One-off image fix script |
| `fix-static-serving.sh` | Apr-26 nginx static file serving fix |
| `fix-vps-deployment.py` | Python script for VPS deployment fix |
| `link-images-to-products.sql` | SQL to link orphaned images to products |
| `phase2_seo.py` | Python Phase 2 SEO tasks script |
| `setup-vps-config.sh` | One-time VPS config setup (nginx/pm2/env) |
| `sync-product-images.php` | PHP script to sync product images into WooCommerce |
| `cerave-update-from-xlsx.js` | CeraVe product data update from user XLSX (run 2026-05-07) |

---

## Completed Audit Data → `workspace/audit/archive/`

| File | What it was |
|------|-------------|
| `cat_audit_summary_20260507.json` | Category audit summary JSON from 2026-05-07 run |
| `cleanup-pass-1-2-20260504.md` | Notes from cleanup passes 1+2 on 2026-05-04 |
| `concern-assignments.json` | Concern tag assignment data (pa_concern applied) |
| `tkm-concern-progress.json` | 36KB TKM concern assignment progress tracker |

---

## Active Scripts → `workspace/scripts/active/`

| File | Purpose |
|------|---------|
| `sync-local-to-vps.sh` | Sync Local→VPS deploy utility |
| `verify-deployment.sh` | Verify deployment health (http checks) |
| `emart-seo-backend-smoke.sh` | SEO backend smoke test (Woo/Next.js routes) |
| `product-image-brand-size-audit.mjs` | Audit product images by brand/size (image work ongoing) |
| `build-open-image-review-audit.mjs` | Build open image review audit report |
| `targeted-product-image-ocr.mjs` | OCR-based image text extraction for audit |
| `audit-seo-index-bloat.sh` | Audit SEO index bloat (orphan/thin pages) |

---

## Active Docs (workspace root — always up to date)

| File | Purpose |
|------|---------|
| `SEO_TODO.md` | Live SEO task list — read before any SEO work |
| `BRAND_GUIDE.md` | Brand invariants and naming rules |
| `CLOUDFLARE_CACHE_RULES.md` | Cloudflare cache rule specs (dashboard-only, not auto-applied) |

---

## Active Reference Docs (workspace/docs/)

| File | Purpose |
|------|---------|
| `gsc-final-indexing-action-plan.md` | GSC indexing action plan — final steps for index coverage |
| `mobile-build-notes.md` | Mobile app build/release notes |
| `theme-contract.md` | Frontend theme design contract / token definitions |
