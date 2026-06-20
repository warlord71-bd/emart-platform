# Emart Task Board
Last updated: 2026-06-20
Freeze: 2026-05-22 → 2026-07-03 (structural/nav only — content, SEO, automation OK)
**[C]** Claude · **[X]** Codex · **[O]** Owner · **[A]** Auto/OpenClaw

---

## 🤖 RUNNING AUTONOMOUSLY

| Job | Status | Notes |
|---|---|---|
| `emartweb` (PM2, :3000) | ✅ online | Next.js 14, v0.39.0 |
| `emart-presence` (PM2, :3011) | ✅ online | WebSocket, 49d uptime |
| `emart-embed` (PM2, :8077) | ✅ online | all-mpnet-base-v2 + bge-reranker-v2-m3, 2.2GB RAM |
| `emart-blog-generator` (PM2 cron) | ✅ scheduled | 3x/day via OpenRouter; stops between cron runs, last published 2026-06-20 16:00 UTC |
| `emart-checkout-monitor` (PM2 cron) | ✅ stopped | All 8 steps pass; intentionally stopped |
| `emart-competitor-prices` (PM2 cron) | ✅ restarted | Manual run completed 2026-06-20; Google Sheets updated |
| `emart-revenue-health` (PM2 cron) | ✅ stopped | Intentionally stopped |
| `emart-seo-autoscan` (PM2 cron) | ✅ stopped | Intentionally stopped |
| `emart-meta-gen` (PM2) | ✅ stopped | Job complete (1,360/1,360 metas done Jun 15) |
| GSC tracker (crontab, `30 2 * * *`) | ✅ running | `gsc_tracker.py full` — propose-only, no WC writes |
| system_state.py (crontab, `35 2 * * *`) | 🟡 patched | Health UA + expected-stopped classification fixed locally; verify next cron/live run |
| GMC sync (crontab, `0 */6 * * *`) | ✅ running | 3,529/3,618 approved |
| Python crons | ✅ running | site_health, daily_report, low_stock |

---

## 🔴 OPEN WORK — Prioritized

### Audit Findings (2026-06-20 reconciliation)

Counts reconciled: MySQL/WC REST/Qdrant/Sitemap all 3,625. URL prefix `/shop/` consistent across all 7 systems. Embed model confirmed `all-mpnet-base-v2` 768-dim.

| # | Sev | Finding | Owner | Status |
|---|---|---|---|---|
| F1 | ~~Crit~~ | ~~cmd_fix_titles() auto-writes truncated titles nightly~~ | [C] | ✅ `98ccdea` — propose/review/apply pipeline; 5 titles reverted |
| F2 | High | `emart-embed` 2.2GB RAM; reranker ~90s cold start; no fetch timeout in `tools.ts`; `maxDuration:60` < cold start | [X] | 🟡 fetch timeouts/config added; cold-start RAM still ops concern |
| F3 | High | `system_state.py`: 403 health check, agent bus misparse, stopped jobs shown as failures | [X] | ✅ verified manually: live HTTP 200; expected stopped PM2 jobs separated |
| F4 | Med | Qdrant sync: no deletion of unpublished products; watermark race; state file missing | [X] | ✅ code fixed: state file, 5-min watermark rewind, full-sync stale deletion |
| F5 | Med | `CONTENT_STANDARD.md` pa_brand says ~100% but actual is 3,589/3,625 | [X] | ✅ corrected to reconciled 2026-06-20 counts |
| F6 | Med | `SEO_MASTER.md` says both 1,084 and stale 1,161 for pa_concern; dead CSV ref | [X] | ✅ corrected active pa_concern gap text |
| F7 | Med | `QDRANT_URL` hardcoded in 3 files — no single source | [X] | ✅ shared `aiServiceConfig.ts` |
| F8 | Med | Embed/rerank URLs hardcoded in `tools.ts`, silent empty results if down | [X] | ✅ shared embed/rerank config + request timeouts |
| F9 | Low | 6 stopped PM2 processes create monitoring noise | [X] | ✅ expected-stopped PM2 jobs separated from unexpected failures |

### AI Plan — Open Items

| # | ID | Item | Owner | Status | Effort |
|---|---|---|---|---|---|
| 1 | AI-6 / P3b | Search: dynamic trending + typo correction | [X] | ✅ dynamic `search-trends.json` API fallback + typo/Bangla query expansion | Medium |
| 2 | AI-7 / P3d | Back-in-stock notification (PDP "Notify me" → MailPoet) | [X] | ✅ PDP UI + `/api/back-in-stock` → MailPoet subscribe path | Medium |
| 3 | AI-8 / P4a | Auto pa_concern: skincare-only review queue; 279 held rows, non-skincare stays blank | [X]+[O] | 🟡 review-gated; no Woo writes without owner approval | Medium |
| 4 | AI-9 / P4b | SEO scoring: full-catalog cron + Telegram alerts | [C] | ✅ existing `gsc_tracker.py full/actions` + Telegram delivery verified in code | Small |
| 5 | AI-10 / P2c | Chat: Bangla search + model routing | [X] | ✅ Bangla/typo query expansion + optional `OPENROUTER_BANGLA_MODEL` routing | Medium |
| 6 | P2d | Chat: proactive PDP suggestions | [X] | ✅ PDP nudge prompts Emart AI for matching products/routine | Small |
| 7 | P4.skin | Auto pa_skin_type for skincare products only from _emart_ingredients (rule-based) | [X] | 🟡 proposal/apply-reviewed workflow ready | Small |
| 8 | P4.ingr | Auto pa_ingredient for skincare products only from _emart_ingredients (regex) | [X] | 🟡 proposal/apply-reviewed workflow ready | Small |
| 9 | AI-OPS1 | Restart competitor price checker PM2 job | [X] | ✅ restarted; 25 checked, 9 undercuts, Sheets updated | Trivial |
| 10 | AI-OPS2 | Recreate Qdrant sync state file (next run = full resync) | [X] | ✅ `.qdrant_sync_state.json` recreated with null watermark | Trivial |
| 11 | AI-UX1 | Chat conversion audit: mobile concern chips + safe product/blog/category link rendering; no root placeholders/raw code | [X] | ✅ `70da8e9` deployed live; `/` placeholder blocked in system prompt; relative markdown links render in chat | Small |

### Live SEO/UI Audit Follow-ups (2026-06-20)

| # | Item | Owner | Status |
|---|---|---|---|
| UX-1 | Emart AI Assistant concern chips: Oily, Dry, Acne, Dark Spots, Sunscreen | [X] | ✅ live via `70da8e9` |
| UX-2 | Emart AI Assistant link safety: never use homepage/root placeholders for specific recommendations | [X] | ✅ live via `70da8e9` |
| UX-3 | Emart AI Assistant "E" logo display | [X] | ✅ already present; keep verified in chat launcher |
| SEO-1 | Product title cleanup for raw/lowercase catalog titles | [O]+[X] | 🟡 propose/review/apply only; no blind Woo title writes |
| SEO-2 | Journal internal-link cluster proposals from articles to product/category pages | [X] | 🔲 next safe automation batch |

### Content Pipeline (spec: `workspace/CONTENT_STANDARD.md`)

| Item | Status |
|---|---|
| Product onboarding proposal tool (`product_onboarding.py`) | 🟡 review-gated apply ready; no fresh LLM response can write directly |
| Hybrid humanizer: 800-1,200 word descriptions (60% auto-fill + 40% LLM) | 🟡 proposal generation added; owner review required before write-back |
| FAQ generation: 5 Q&A per product, product-specific | 🟡 proposal generation + strict 5-Q/A validation ready |
| Meta validator stale stylistic issues | ✅ clean 2026-06-20: regenerated full catalog validator, fixed final 2 rows, now 0/3,625 flagged |

### Phase 5 — Omnichannel Agent (BLOCKED)

Meta Business verification REJECTED. No `pages_messaging` or `whatsapp_business_messaging`.

| ID | Item | Status | Gate |
|---|---|---|---|
| AI-11 | WhatsApp Business API webhook | 🔲 BLOCKED | Meta verification or BSP ($30/mo) |
| AI-12 | Facebook Messenger webhook | 🔲 BLOCKED | Meta verification |
| AI-13 | Mobile app chat screen | 🔲 | AI-11/12 first |
| AI-14 | Conversation analytics | 🔲 | AI-11/12/13 live |
| AI-15 | Bangla language tuning | 🔲 | AI-10 first |

Workarounds: (1) ✅ Meta Business Agent (no-code, owner turns on), (2) 🔲 Telegram customer bot (free), (3) 🔲 WhatsApp BSP (WATI/Interakt ~$30/mo).

### Owner Items

| # | Item | Status |
|---|---|---|
| O-1 | pa_concern: review only skincare-like held rows (279); leave makeup/hair/tools/supplements blank | 🔲 |
| O-2 | `/origins/[country]` editorial: only 3/22 countries have copy | 🔲 |
| O-3 | Product comparison pages (`/compare/`) — curate 20-30 pairs | 🔲 |
| O-4 | "Best [X] in Bangladesh" topics — approve list | 🔲 |
| O-5 | Skin-type pages: confirm whether to build (4 pages max) | 🔲 |
| O-6 | Product images: 3-5 angle shots per top-100 | 🔲 |
| O-7 | Blog content velocity (generator ready, owner controls pace) | 🔲 |
| O-8 | GBP: claim/verify at Dhanmondi; fix Bangla name | 🔲 |
| O-9 | Social profile bios → link to e-mart.com.bd | 🔲 |
| O-10 | Beauty blogger/influencer outreach (5-10 BD reviewers) | 🔲 |
| O-11 | Structured review collection: target 100+ reviews in 60 days | 🔲 |
| O-12 | Reddit/LinkedIn sameAs: provide real profile URLs | 🔲 |
| O-13 | PDP 404 redirect map: 18 review-only + 52 no-match candidates | 🔲 review |
| O-14 | Google-Extended bot policy: keep allowed or block? | 🔲 decision |

### Codex — Open

| Item | Status |
|---|---|
| X2 — Impression-priority humanizer: monitor GSC, generate new JSONL batch | 🔲 |
| X3 — Mobile M0: real device checkout smoke → EAS production AAB → Play Store | ⚠️ ADB blocked |
| Mobile BFF gaps: `/api/mobile/cart` and `/api/mobile/payment` return 404 | ⏸️ out of scope per owner: "EXCEPT MOBILE APP" |

### Backlog (post-freeze Jul 3+)

- UCP/MCP commerce endpoint (gated: reviews > 200, currently ~16)
- Review sentiment analysis (gated: reviews ≥ 100)
- `getSeoDescription()` fallback: add `product.description` first-155-chars tier
- Critical CSS inlining (critters) — medium effort/risk
- `/brands` page 785KB — lazy-load logos or paginate
- GCP service account key rotation (fingerprint ce8b30ba)
- `begin_checkout` GA4/Meta event: fires before Zustand cart rehydration — needs cart/checkout fix

---

## ✅ COMPLETED — Summary

### Phase 1 — Foundation (all done)
- [x] P1.1 Reranker endpoint (`embed_service.py /rerank`)
- [x] P1.2 Reranker wired to chat (`tools.ts rerankResults`)
- [x] P1.3 Cross-sell PDP rail (pre-existing `getSimilarAndCrossSell`)
- [x] P1.4 Incremental Qdrant sync (`qdrant_product_sync.py`)
- [x] P1.5 Title review gate (`98ccdea` — propose/review/apply)

### Phase 2 — Chat Intelligence (3/5 done)
- [x] P2a Session memory — `sessionStore.ts` (Codex, 2026-06-20)
- [x] P2b Routine builder — `/routine/[step]` (Codex, 2026-06-20)
- [x] P2e Product cards + quick replies — `ChatProductCard.tsx` (Codex, 2026-06-20)

### Phase 3 — Storefront (1/3 done)
- [x] P3c Recently Viewed rail — `RecentlyViewedRail.tsx` (Codex, 2026-06-20)

### Audit Remediation R1-R20 (all closed)
R1-R19 done 2026-06-11. R12/R18 done 2026-06-17. R20 re-audit: **A+**.
Full detail: `workspace/docs/audits/EMART_AUDIT_20260610.md`, `EMART_REAUDIT_R20_20260617.md`

### Owner Items (all closed)
1-8 (MailPoet, Meta CAPI, GSC URLs, Cloudflare, GMC exclusions, images) — all resolved by 2026-06-15.
9 pa_concern: 13+57 applied, 1,084 remaining (moved to open).
10-17 (OpenClaw, "original" metas, duplicates, images L-A, R3 CF Access, stale PM2, VPS git) — all closed.

### Claude C1-C8 (all closed)
C1 blog generator, C2 sameAs, C3 SEO note, C4 GEO/AEO, C5 deploy gate + LLM docs, C6 Reddit pixel, C7 login/auth, C8 GA4 landing-page audit.

### SEO/Content (2026-06-20 session)
GSC tracker 9-command pipeline, Telegram dual delivery + 7 commands, Review schema on PDPs, CONTENT_STANDARD.md, AI_PLAN.md, URL structure audit, SERP competitor analysis.

### Prior Sessions (2026-06-17/18, 2026-06-05)
R12 ISR, R18 homepage links, R20 A+ re-audit, PDP title coverage, PDP FAQ schema, blog generator cron, revenue-health fix, LinkedIn/Reddit sameAs, homepage LCP/TBT pass, checkout hardening, FAQPage on concerns, product schema, agents.md, sunscreen copy, review form, InitiateCheckout, BHA redirects, H2s, internal links, GMC descriptions, humanizer batch, homepage perf.

---

## 🔑 Key Rules

- **WC API Key:** key_id `34` (live BFF, write-gated). Key_ids 2/3/26/32 revoked.
- **Freeze:** Structural/nav frozen until 2026-07-03. Content, data, new features, automation: OK.
- **Deploy:** Local build → commit → rsync → VPS build → pm2 restart → SEO gate → smoke → push.
- **Humanizer priority:** Always by GSC impression count, not category order.
- **GMC sync:** Always last — after all description fixes verified.
- **Title writes:** Propose-only via `gsc_tracker.py propose-titles`. Apply manually after review.
- **Protected data:** checkout, cart, payment, order, customer data, stock, price, WooCommerce DB — never touch without explicit request.
