# Emart Task Board
Last updated: 2026-06-05 (end of session)
Freeze: 2026-05-22 → 2026-07-03 (structural/nav only — content, SEO, automation OK)
**[C]** Claude · **[X]** Codex · **[O]** Owner · **[A]** Auto/OpenClaw

---

## 🤖 RUNNING AUTONOMOUSLY

| Job | Status | Notes |
|---|---|---|
| `emart-meta-gen` (PM2) | ✅ running | ~2,600 remaining, completion ~Jun 6 |
| `emart-presence` (PM2) | ✅ running | WebSocket, 33d uptime |
| `emart-checkout-monitor` (PM2 cron) | ✅ all 8 steps pass | Every 15 min |
| Python crons | ✅ running | site_health, daily_report, low_stock |
| GMC sync | ✅ last run Jun 5 | 3,523/3,630 approved |

---

## 🔴 OWNER — Do these (workspace/docs/OWNER-ACTIONS-20260605.md)

1. **MailPoet review email** — WooCommerce trigger → Order Completed → 3-day delay → review email
2. **Meta CAPI test** — COD test order → Events Manager: verify Purchase value > 0 + BDT + InitiateCheckout
3. **GSC URL indexing** — 7 URLs listed in OWNER-ACTIONS doc
4. **Cloudflare cache rule** — /shop + /category, 1hr edge TTL
5. **GMC title-risk products** — 11 products in gmc-steps3-6-report-20260605.md, approve/reject title changes
6. **GMC data/asset** — 2 products missing price/image: IDs 63749, 62576
7. **GMC mixed manual** — 6 products: IDs 36262, 3274, 56108, 3753, 38292, 26194
8. **16 product images** — workspace/audit/active/products-need-real-image.csv
9. **pa_concern 1,161 rows** — workspace/audit/active/pa-concern-manual-review-20260521-174247.csv

---

## 🟡 CODEX — Next tasks

### X2 — Impression-priority humanizer (starts when face cleansers done)
- Face cleansers: 184/216 — ~32 remaining, complete soon
- Queue ready: workspace/audit/active/humanizer-impression-priority-targets-2026-06-05.csv
- Top 5: CeraVe night cream(945 imp) → Skin1004 centella(422) → Medicube vita C(355) → Innisfree clay mask(138) → COSRX snail(121)
- Same dry-run → validate → owner sample → apply workflow as face cleansers

### X3 — Mobile M0 (after X2 or in parallel)
- workspace/docs/CODEX-BRIEF-20260605.md Tasks 3-5
- App launch + Play Store + SSL Commerz

---

## 🔵 BACKLOG (post-freeze Jul 3+)

- LCP fix: 58 scripts/1,494ms evaluation — bundle analysis needed
- Blog content at scale: 51 posts vs Shajgoj 5,904
- UCP/MCP commerce endpoint: build when reviews > 200 (currently 5)
- Critical CSS (critters): DEV_MASTER W6
- Origin editorial: UK, France, Bangladesh, others — owner confirms list
- FAQ quality improvement: top 200 products have templated answers (M4)
- GCP service account key rotation: fingerprint ce8b30ba

---

## ✅ COMPLETED THIS SESSION (2026-06-05)

- FAQPage JSON-LD on 9 concern pages
- Product schema description decoupled (400-500c when humanized)
- agents.md live at /agents.md (FB: emartbd.official, YT: @emartbd.official)
- Sunscreen category copy (M7) — all missing terms added
- Review form: all logged-in users can submit (aggregateRating unblocked)
- InitiateCheckout Meta Pixel event added — full event set complete
- BHA/salicylic ingredient redirects — fixes GSC position drop
- H2 on /sale, /new-arrivals, /brands (DEV_MASTER L4)
- M6 internal links: niacinamide, hyaluronic-acid, acne-blemish-care, dryness-hydration
- SEO_MASTER M7+M8 closed, W7 scripts archived
- GMC: 53 product descriptions fixed (9 rule-based + 44 LLM) → 127→107 disapproved
- OWNER-ACTIONS-20260605.md + CODEX-GMC-FIX-20260605.md + gmc-steps3-6-report-20260605.md

---

## 🔑 Key Rules

**WC API Key:** key_id `39` ("Emart BFF Live") in `.env.local`. Never delete without updating .env.local first.
**Freeze:** Structural/nav frozen until 2026-07-03. Content, data, new features, automation: OK.
**Deploy order:** Local build → commit → rsync → VPS build → pm2 restart → smoke test → push.
**Humanizer priority:** Always by GSC impression count, not category order.
**GMC sync:** Always last — after all description fixes verified.
