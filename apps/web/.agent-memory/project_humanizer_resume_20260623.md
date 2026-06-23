---
name: project-humanizer-resume-20260623
description: Long-form product humanizer state + how to resume hand-writing top-seller descriptions
metadata: 
  node_type: memory
  type: project
  originSessionId: 3eaa0496-6a88-4cae-bf60-e4905d433e56
---

Long-form product humanizer (800-word rich PDP descriptions) is a MANUAL, proposal-gated process — NOT scheduled (no cron/PM2). [[project_product_content_humanizer_20260601]]

**State as of 2026-06-23 (PM update):** `_emart_humanized` flag = **108** products. Claude hand-wrote batches 17 (5) + 18 (5) this session — top-sales serum/sunscreen/cream/lotion/eye-cream (Tiam, CosRx Snail 92, Beauty of Joseon, MediPeel, Simple, Axis-Y, Mary & May, APLB, Jigott, Dr Althea). All applied to DB + ISR revalidated. Fixed a live GMC slip: product 57702 had "miracle" (even negated trips scanners) → reworded + re-applied. (Earlier counts this/prior day: 275 figure was a different flag snapshot; trust the live `SELECT COUNT(*)` = 108.) Priority brands per owner: medicube, anua, dr althea, cosrx, numbuzin, skin1004, carenel, 3w clinic, dabo, axis-y, the ordinary, cerave.

**Handoff to Hermes (2026-06-23):** owner will generate the REST via the **Hermes agent** on an open OpenRouter model, NOT by hand. Built a reusable content-class package for this — see [[project_humanizer_engine_20260623]]. Batch scripts 17/18 live at `workspace/humanizer/impression-priority/selfwrite_batch17.py` / `18.py`.

**Quality bar (owner-set):** full-length (~500-750 words), top-notch human-expert voice, UNIQUE per product (no shared template — vary openings/structure/headings), GMC-safe (never "treats/cures/heals/prescription/clinically proven/miracle"). Skip cleansers (already humanized). Focus serum/sunscreen/cream top sellers.

**How to resume:**
1. Targets = top `total_sales` products, title matching serum|sunscreen|cream|essence|ampoule|moistur|lotion|toner, EXCLUDING cleans/wash/foam/shampoo/soap/scrub/mask/lip/hair/powder/cushion/patch/sheet/kit/combo/set, not already `_emart_humanized`, not in GSC holdout (212 slugs in `workspace/audit/active/baseline-snapshot-2026-05-31.json` key `holdout_slugs`), not in script HOLDOUT {2591,2611,4064}.
2. Write descriptions in a `selfwrite_batchN.py` under `workspace/humanizer/impression-priority/`, importing `humanizer_impression_priority as H` and calling `H.apply_to_db(pid, html + H.DISCLAIMER)`.
3. Set env `EMART_DB_PASSWORD` (from `/var/www/wordpress/wp-config.php`).
4. After each batch: POST `/api/revalidate` with `x-revalidate-secret` header + `{"tag":"products"}`; then commit+push the script.
5. ~110 serum/sunscreen/cream top sellers still remain.

**Reversibility:** rollback snapshots at `workspace/humanizer/impression-priority/active/rollback-topsellers-20260623.json` (309 products' original post_content).

**Note:** OpenRouter is OUT OF CREDITS (402) — bulk model runs need a top-up; free models (nvidia nemotron-120b:free, google gemma-4-31b:free) work but lower quality than hand-written. `batch_topsellers.py` is the GMC-safe model-based driver if credits are topped up. [[project_openrouter_humanizer_key_20260601]]
