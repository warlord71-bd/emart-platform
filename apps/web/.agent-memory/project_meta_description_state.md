---
name: Product meta description state
description: Rank Math product descriptions are mostly present; product pages must prefer _rank_math_description
type: project
originSessionId: codex-2026-04-27-meta-description-pause
---
As of 2026-04-27, a WP CLI audit originally found 3,564 published products and 3,549 products with non-empty `_rank_math_description`. The 15 missing published products were:

- 3878 — I'm from Mugwort Sheet Mask 23ml
- 36356 — Stives Blackhead Clearing Green Tea Scrub 170ge
- 38330 — Palmers Cocoa Butter Stretch Marks Massage Lotion 250ml
- 50673 — The Ordinary Glycolic Acid 7% Exfoliating Toner 240ml
- 60224 — Dabo Aloe Vera Calming Sun Cream 15 ml
- 60226 — Dabo Make Up No Sebum Rose Pact SPF36 PA+++ 23 Medium
- 60228 — Dabo T-Tree Cica Acne Cleansing Foam 120 ml
- 60693 — Phytotree Radiance Foundation 50 ml
- 62040 — Lion Pair Medicated Acne Care Cream 14g
- 63909 — The INKEY List Q10 Serum 30ml
- 74223 — Blaze O Skin Shower Gel On An Island 250
- 74681 — L.A. Girl Pro Matte Liquid Foundation GLM715(Porcelain) 30ml
- 75207 — Skin Cafe Silky Tresses Moisturizing Conditioner 120ml
- 75563 — WSKINLAB Stop-Aging Peptide Essence 100ml
- 91693 — Isntree Hyaluronic Acid Aqua Gel Cream 100ml

Completed state: the 15 missing products now have `_rank_math_description`; the live audit count for missing published product descriptions is `0`. `apps/web/src/lib/woocommerce.ts` already exposed `_rank_math_description` in product `meta_data`, and `apps/web/src/app/[slug]/page.tsx` now uses `getSeoDescription(product)` to prefer `_rank_math_description` and fall back to cleaned `short_description` / product name.

Deploy state: local build passed, VPS build passed, `emartweb` restarted, live home and product smoke tests returned `200`, and the Isntree product page rendered the new meta description. Commit `4da64d2 fix: prefer Rank Math product descriptions` is pushed to `origin/main`.

Safe next step: no full-catalog LLM regeneration is needed unless the user explicitly asks for a quality rewrite. For future product additions, ensure `_rank_math_description` is filled at creation time.

Security note: an unfinished Claude-generated `generate-meta.mjs` included a hardcoded OpenRouter fallback key. Codex removed the script and uninstalled `@anthropic-ai/sdk` before pausing; do not reintroduce hardcoded API keys.
