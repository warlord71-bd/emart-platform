---
name: ai-agent-briefing
description: Briefing for building AI customer support agent — infrastructure state, API keys, architecture, safety rules
metadata:
  type: project
---

# AI Customer Agent Briefing (2026-06-19)

## Qdrant Vector DB — READY
- Container: `hgc-qdrant` at `127.0.0.1:6333` (healthy, 512MB limit, auto-restart)
- Collection: `emart_products` — 3,625 products, 768-dim `all-mpnet-base-v2` embeddings
- API key env var: `QDRANT_API_KEY` (in both Local + VPS `.env.local`)
- Weekly sync cron: Sundays 5am via `workspace/scripts/active/qdrant_sync_run.sh`

## Existing search utilities — USE THESE
- `lib/qdrantSearch.ts` → `searchByText(query, limit)` — payload text search on name/brand/category/origin. No embedding needed. Fast.
- `lib/qdrant.ts` → `getSimilarProducts(productId, limit)` — vector similarity for "show me similar" requests
- `/api/search/semantic` — POST endpoint accepting `{ vector: number[], limit }` (only if you have a pre-computed embedding)
- `/api/search?q=...` — existing keyword+Qdrant hybrid search (already live)

## LLM access
- OpenRouter key: stored in `/root/.openclaw/credentials/openrouter_default.json` and `.env.local`
- Recommended model: `deepseek/deepseek-chat-v3.1` (paid, reliable). Free models had ~6% defect rate.
- OpenRouter base URL: `https://openrouter.ai/api/v1`

## Architecture — DO THIS
- Build as Next.js API route: `/api/chat` (POST)
- Client widget: lightweight React component, no heavy deps
- Use `searchByText()` from `lib/qdrantSearch.ts` for product lookup — no real-time embedding needed
- Product links must be `/shop/{slug}` format
- Currency: ৳ (BDT), format with `lib/formatters.ts` → `formatBDT()`

## WhatsApp numbers — DO NOT MERGE
- Sales/signup: `8801717082135`
- Support/payment: `8801919797399`

## Safety — MANDATORY
- Agent is READ-ONLY: recommend products, answer skincare questions, show prices/links
- NEVER create orders, modify cart, change prices, access customer data, modify stock
- NEVER expose WooCommerce API keys to the client
- Rate-limit `/api/chat` — Nginx already has `/api/*` rate buckets
- Don't store chat history server-side for v1 — client-side sessionStorage is fine

## Brand voice
- Friendly, knowledgeable skincare advisor — not salesy or pushy
- Brand: "Emart" (never "E-Mart", "EMart BD", "eMart")
- Full: "Emart Skincare Bangladesh"
- Mention "100% authentic" when relevant
- Delivery: COD available, bKash/Nagad, Dhaka 1-2 days, outside 3-5 days
- Free shipping over ৳3,000

## System prompt template for the LLM
```
You are Emart's skincare assistant. You help customers find authentic skincare products from e-mart.com.bd.

Rules:
- Recommend products from the provided search results only — never invent products
- Include product name, price in ৳, and link (/shop/slug)
- Be concise: 2-3 product recommendations max per response
- If unsure about a product detail, say so — don't guess
- Mention "100% authentic" and delivery info when asked
- You cannot place orders, check order status, or process payments
- For order help, direct to WhatsApp: 01919797399

Respond in the same language the customer uses (English or Bangla).
```

## What NOT to build
- No separate Python/Node microservice — Next.js API route is enough
- No real-time query embedding — `searchByText()` handles it
- No database for chat history v1 — sessionStorage on client
- No streaming for v1 — simple request/response is fine to start

## Known issues to fix (found during testing 2026-06-19)
1. **ChatMessages.tsx line 33** — `{m.content}` renders plain text. URLs show as raw text, not clickable links. Need to parse markdown links `[text](url)`, bold `**text**`, and raw URLs into React elements.
2. **Raw URLs** — LLM outputs `https://e-mart.com.bd/shop/slug` as plain text. Convert to `<a href="/shop/slug">` (strip domain for internal links).
3. **Visual search button removed** — was a non-functional stub, removed in `34295e5`. Only voice search remains.
