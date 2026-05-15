# Emart Attic Index

Reference for all archived files moved off the active project tree.  
Last updated: 2026-05-15

If you need a file from the attic, extract it with:
```bash
cp /root/.attic-2026-05-15/emart-archive/<filename> ./workspace/audit/active/
```

---

## `/root/.attic-2026-05-15/emart-archive/` — Completed Emart batch outputs

All idle/completed audit and backup files moved from `workspace/audit/archive/` on 2026-05-15.

### Korea Origin Work (completed 2026-05-15)

| File / Folder | What it contains |
|---------------|-----------------|
| `wrong-korea-origin-backup-20260515-180333.csv` … `183820.csv` (10 files) | WooCommerce DB backups before wrong Korea origin was corrected across 3,628 products |
| `korea-origin-intermediate-20260515/` | Intermediate dry-run and progress files from the Korea origin correction pass |
| `completed-korea-origin-20260515/` | Final apply logs and results for Korea origin correction |

### Korea Copy Work (completed 2026-05-14)

| File / Folder | What it contains |
|---------------|-----------------|
| `non-korean-korea-import-copy-backup-20260514-205029.csv` | Backup before "Korea import" copy was removed from 908 non-Korea products |
| `non-korean-korea-import-copy-backup-20260514-205241.csv` | Second pass backup |
| `completed-korea-copy-20260514/` | Final apply logs for copy cleanup |

### The Derma Co Work (completed 2026-05-10 – 2026-05-11)

| File | What it contains |
|------|-----------------|
| `the-derma-co-origin-correction-dry-run-20260510.csv` | Dry-run: correcting The Derma Co origin from Korea → India |
| `the-derma-co-origin-correction-apply-20260510.csv` | Apply results |
| `the-derma-co-meta-review-20260510.csv` | Meta/copy review for The Derma Co products |
| `the-derma-co-meta-copy-dry-run-20260511-*.csv` (3 files) | Dry-runs for meta copy corrections |
| `the-derma-co-meta-copy-apply-20260511-*.csv` (2 files) | Apply results |
| `baidu-qianfan-the-derma-co-meta-instructions-20260510.md` | Instructions sent to Baidu Qianfan agent for Derma Co meta cleanup |

### pa_ingredient / pa_skin_type Taxonomy (completed 2026-05-15)

| File | What it contains |
|------|-----------------|
| `pa-ingredient-skintype-backup-20260515-191003.csv` … `191318.csv` (5 files) | DB backups before pa_ingredient + pa_skin_type were applied to 1,110 products |

### Sale Price Work (completed 2026-05-08)

| File | What it contains |
|------|-----------------|
| `sale-price-backup-20260508-095413.csv` … `100134.csv` (5 files) | DB backups before sale prices were cleared catalog-wide |
| `emart-sale-price-backup-20260508-1150.tsv` | TSV backup of sale price data |

### Facebook / GMC Catalog Audit (completed 2026-05-09 – 2026-05-10)

| File | What it contains |
|------|-----------------|
| `facebook-catalog-audit-issues-20260509-213134.csv` | Products with issues in FB catalog feed |
| `facebook-catalog-audit-summary-20260509-213134.txt` | Summary of FB catalog audit |
| `facebook-catalog-image-fetch-issues-20260510-113649.csv` | Products where FB catalog image fetch failed |
| `facebook-catalog-image-fetch-verify-20260510-113649.txt` | Verification of image fetch results |
| `facebook-pixel-event-audit-20260509-2132.md` | Pixel event audit report |

### Page / Link Cleanup (completed 2026-05-08)

| File | What it contains |
|------|-----------------|
| `page-56433-before-product-link-cleanup-20260508.csv` | Product links on page 56433 before cleanup |
| `page-56433-before-product-link-cleanup-20260508.html` | HTML snapshot of page before cleanup |
| `page-56433-before-product-link-cleanup-20260508.meta.json` | Page meta before cleanup |
| `post-content-product-links-before-cleanup-20260508.tsv` | All post content product links before cleanup |
| `slug-clean-redirects-20260508-155101.txt` | Redirect rules generated during slug cleanup |
| `slug-clean-result-20260508-155101.csv` | Slug cleanup results |

### Duplicate Cleanup (completed 2026-05-08)

| File / Folder | What it contains |
|---------------|-----------------|
| `duplicate-cleanup-20260508/` | Duplicate product detection and cleanup outputs |

### SKU Audit Drafts (pending owner data)

| File / Folder | What it contains |
|---------------|-----------------|
| `sku-audit-20260508-drafts/` | SKU gap audit drafts — 119 products still missing SKUs, awaiting owner data |

### Design Assets (completed 2026-05-15)

| File / Folder | What it contains |
|---------------|-----------------|
| `design-assets-20260515/` | Brand/design assets archived during baseline pass |

### Old Docs and Progress Trackers

| File | What it contains |
|------|-----------------|
| `agent-clutter-cleanup-20260507.md` | May-07 agent workspace clutter cleanup notes |
| `cleanup-pass-1-2-20260504.md` | May-04 cleanup pass 1 and 2 notes |
| `cat_audit_summary_20260507.json` | Category audit summary JSON from May-07 |
| `concern-assignments.json` | Concern taxonomy assignment map used during pa_concern apply |
| `tkm-concern-progress.json` | TKM concern assignment progress tracker |
| `stale-active-20260515/` | Stale files that were in `workspace/audit/active/` at cleanup time |

---

## `/root/.attic-2026-05-15/stale-www-2026-05-15.tar.gz` — Old /var/www folders

See `workspace/VPS_RESOURCE_MAP.md` for full contents breakdown.  
Short version: old Emart app versions, old mobile app, release snapshots — all superseded. Contains `emartweb/.env.local` with old credentials — delete after PC download.

---

## How to find a file

```bash
# List everything in emart-archive
ls /root/.attic-2026-05-15/emart-archive/

# List inside a folder
ls /root/.attic-2026-05-15/emart-archive/completed-korea-origin-20260515/

# Copy one file back to active workspace
cp /root/.attic-2026-05-15/emart-archive/<file> /root/emart-platform/workspace/audit/active/

# List inside the compressed www archive
tar -tzf /root/.attic-2026-05-15/stale-www-2026-05-15.tar.gz | grep -v node_modules

# Extract one file from compressed archive
tar -xzf /root/.attic-2026-05-15/stale-www-2026-05-15.tar.gz <path-inside>
```
