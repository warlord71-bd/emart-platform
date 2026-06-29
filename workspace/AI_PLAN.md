# Emart AI + SEO Unified Execution Plan

**Created:** 2026-06-20
**Owner:** Warlord (approval) + Claude/Codex (execution)
**Freeze:** structural/nav until 2026-07-03 — backend, automation, API, chat = OK

---

## Current Infrastructure

| Layer | State | Health |
|---|---|---|
| Qdrant | 3,625 products, 768d all-mpnet-base-v2, Docker | ✅ green |
| Embed sidecar | PM2 `emart-embed`, port 8077, `/embed` + `/health` | ✅ running |
| Chat agent | `/api/chat` → OpenRouter (Nemotron free), 7 tools | ✅ running |
| Chat widget | 3 components, basic markdown | ✅ live |
| SEO pipeline | `gsc_tracker.py` — 8 commands, nightly cron, Telegram | ✅ running |
| SEO scoring | `internal_seo_tool.py` — agentic scores, content gaps | ✅ ready |
| Blog generator | PM2 cron 3x/day, OpenRouter free models | ✅ running |
| Humanizer | 64 products done, queue system built | ✅ ready |
| VPS | 12GB RAM (5.3GB free), 6 CPU, Docker + PM2 | ✅ stable |

---

## Unified Execution Phases

### PHASE 1 — Foundation (this session)

| # | Task | What | Effort | Freeze-safe |
|---|---|---|---|---|
| 1.1 | Reranker endpoint | Add `/rerank` to embed_service.py using bge-reranker-v2-m3 | Small | ✅ |
| 1.2 | Wire reranker into chat | tools.ts searchProducts → rerank before returning | Small | ✅ |
| 1.3 | Cross-sell rail on PDP | Wire existing `getSimilarAndCrossSell()` to visible PDP section | Small | ⚠️ UI |
| 1.4 | Incremental Qdrant sync | qdrant_product_sync.py tracks date_modified, only re-embeds changed | Small | ✅ |
| 1.5 | SEO auto-title-fix | nightly cron writes `_rank_math_title` for top 5 CTR-gap products | Small | ✅ |

### PHASE 2 — Chat Intelligence (next session)

| # | Task | What | Effort | Freeze-safe |
|---|---|---|---|---|
| 2.1 | Session memory | Server-side session store (in-memory Map + TTL) for chat context | Medium | ✅ |
| 2.2 | Rich chat messages | Product cards (image+price+link), quick-reply buttons, typing indicator | Medium | ✅ |
| 2.3 | Routine builder tool | New tool: skin type + concerns → AM/PM routine with Emart products | Medium | ✅ |
| 2.4 | Bangla model routing | Detect Bangla → route to deepseek-chat-v3.1 for quality responses | Small | ✅ |

### PHASE 3 — Storefront Intelligence (post-freeze, after 2026-07-03)

| # | Task | What | Effort | Freeze-safe |
|---|---|---|---|---|
| 3.1 | Smart search autocomplete | Category/brand suggestions, "did you mean?", trending searches | Medium | ⚠️ UI |
| 3.2 | "For You" homepage rail | localStorage recent views → Qdrant similar → personalized rail | Small | ⚠️ UI |
| 3.3 | Back-in-stock alerts | Email capture on OOS PDPs → notify on restock via MailPoet | Medium | ⚠️ UI |
| 3.4 | Proactive chat suggestions | PDP idle → widget surfaces cross-sell from Qdrant | Small | ✅ |

### PHASE 4 — Internal Ops Intelligence (parallel, any session)

| # | Task | What | Effort | Freeze-safe |
|---|---|---|---|---|
| 4.1 | Auto pa_concern tagging | Reranker + LLM classify 1,084 untagged products, >0.85 confidence | Medium | ✅ |
| 4.2 | SEO auto-humanize | nightly: top 3 humanizer-queue → generate → validate → write to Woo | Medium | ✅ |
| 4.3 | Pricing intelligence | competitor_price_checker → structured JSON + Telegram alert | Small | ✅ |
| 4.4 | Review sentiment | When 100+ reviews: classify + flag negatives to Telegram | Small | ✅ |
| 4.5 | FAQ quality regen | Regenerate templated FAQs for top 50 priority-queue products | Medium | ✅ |

### SEO ONGOING (already automated)

| Task | Status | Schedule |
|---|---|---|
| GSC pull + scoring + actions | ✅ Running | Cron 2:30 AM |
| Blog generation | ✅ Running | PM2 3x/day |
| Telegram daily report | ✅ Running | With GSC cron |
| Humanizer queue | ✅ Running | With GSC cron |
| Search trends (Google + YouTube) | Manual trigger | Before content sprints |
| On-page SEO scoring | Manual trigger | Weekly |

### Phase 5 — Omnichannel Agent (BLOCKED on Meta Business verification)

| # | Task | What | Effort | Gate |
|---|---|---|---|---|
| 5.1 | WhatsApp Business API | Webhook → AI agent → reply via WhatsApp | Medium | Meta Business verified |
| 5.2 | Facebook Messenger | Webhook → AI agent → reply via Messenger | Medium | Meta Business verified |
| 5.3 | Mobile app chat screen | Expo chat UI → `/api/chat` | Medium | 5.1/5.2 done |
| 5.4 | Conversation analytics | Track volumes, resolution, escalation, popular queries | Small | 5.1-5.3 live |
| 5.5 | Bangla language tuning | Qdrant aliases, prompt variants, model routing | Medium | AI-10 done |

**Owner must do first:** Verify HG Corporation at business.facebook.com → create Meta App → add WhatsApp + Messenger → share App ID + token.

### EXTERNAL SEO (owner-only, not automatable)

| Task | Priority |
|---|---|
| E1: BD directory submissions | Medium |
| E2: Google Business Profile | HIGH |
| E3: Product image expansion | Medium |
| E4: Social backlinks | Low |
| E5: Blogger outreach | Medium |
| E6: Review collection emails | Medium |

---

## Dependency Chain

```
P1.1 Reranker ──→ P1.2 Wire to chat ──→ P2.3 Routine builder
                                     ──→ P4.1 Auto pa_concern
                                     ──→ P3.1 Smart search

P1.4 Incremental sync ──→ P3.3 Back-in-stock alerts

P1.5 Auto title fix ──→ P4.2 Auto humanize ──→ P4.5 FAQ regen

P2.1 Session memory ──→ P2.3 Routine builder
                    ──→ P2.4 Bangla routing

P2.2 Rich messages ──→ P3.4 Proactive suggestions

P2 (all chat features) ──→ P5.1 WhatsApp webhook (same agent brain)
                        ──→ P5.2 Messenger webhook (same agent brain)
                        ──→ P5.3 Mobile app chat (same /api/chat)

P5.1 + P5.2 + P5.3 ──→ P5.4 Conversation analytics
P2.4 Bangla routing ──→ P5.5 Bangla tuning across all channels

BLOCKER: P5.1 + P5.2 require Meta Business verification (owner action)
```

---

## Standards for ALL AI-generated content

```
- First sentence = direct answer (what this product is, what it does)
- 150+ words for descriptions, 5 Q&A for FAQ
- Include: brand, origin, 2-3 key ingredients, skin type, "Bangladesh", "COD"
- Localized: mention Dhaka humidity/monsoon/climate where natural
- No generic AI filler ("In the world of...", "Are you looking for...")
- No medical claims, no price in descriptions
- Use DeepSeek v3.1 paid for customer-facing text
- Free models OK for internal classification/scoring only
- Quality gate: generate → validate → write (never skip validation)
- After any Woo write: revalidate ISR cache + submit IndexNow
```

---

## Quick Reference Commands

```bash
# SEO pipeline
python3 workspace/seo-review/gsc_tracker.py full          # nightly auto
python3 workspace/seo-review/gsc_tracker.py search-trends  # before content sprint
python3 workspace/seo-review/tg_commands.py report         # CLI report
python3 workspace/seo-review/tg_commands.py --tg report    # send to Telegram

# On-page scoring
python3 workspace/seo-review/internal_seo_tool.py          # weekly

# Qdrant
python3 workspace/content-orchestrator/scripts/active/qdrant_product_sync.py    # weekly full sync

# Chat agent test
curl -X POST https://e-mart.com.bd/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"best sunscreen for oily skin"}]}'
```
