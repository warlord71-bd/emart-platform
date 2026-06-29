# Off-Page & Entity Ledger Spec (SEO-ORCH-7)

Version: 2026-06-26-v1
Status: **spec** — all external publishing/outreach is approval-first.

## Goal
Track off-page authority signals, entity presence, and AEO/GEO standing in a governed ledger. No automated outreach or external posting without owner approval.

## Ledger Domains

### 1. Backlink & Mention Inventory
- Track known backlinks (from GSC Links report)
- Monitor brand mentions (Google Alerts, social listening)
- Flag toxic/spam links for disavow review
- Record outreach attempts and outcomes

### 2. Entity Presence
- Google Business Profile (GBP): status, verification, reviews
- Social profiles: FB, IG, YouTube, TikTok, LinkedIn, Reddit, Telegram
- Schema.org entity: Organization, Brand, LocalBusiness
- Knowledge Panel: existence, accuracy
- AI citations: ChatGPT, Google AI Overview, Bing Copilot mentions

### 3. Review Management
- Google Reviews: count, rating, response rate
- Facebook Reviews: count, rating
- Product reviews on-site: count per product, average rating
- Review collection campaigns: target, progress, channel

### 4. Off-Page Content
- Guest posts, interviews, expert contributions
- Brand mentions in press/publications
- Social content syndication (per GROW-3)

## Entry Schema
```json
{
  "id": "OFFPAGE-20260626-001",
  "type": "backlink|mention|review|entity|citation|outreach",
  "source": "url or platform name",
  "target": "e-mart.com.bd URL or brand entity",
  "status": "discovered|verified|outreach_sent|placed|disavowed|expired",
  "quality": "high|medium|low|toxic",
  "owner": "[O]",
  "discovered_at": "2026-06-26",
  "notes": ""
}
```

## Current Entity State (2026-06-26)
- **GBP:** not claimed (O-8, owner action)
- **Social profiles:** FB, IG, YouTube, TikTok, LinkedIn, Reddit, Telegram all exist
- **Schema:** Organization + LocalBusiness + Brand on relevant pages
- **Knowledge Panel:** not present (requires entity authority signals)
- **AI citations:** AI Assistant is #2 BD channel (334 sessions/14d); no tracking of external AI citations

## Approval Rules
- All outreach requires owner approval before sending
- No fake profiles, bought links, or link exchanges
- No mass posting or automated comment/forum marketing
- Guest content must be genuine and disclosed
- Review solicitation must comply with platform TOS

## Implementation
- Ledger file: `workspace/seo/off-page-ledger.jsonl`
- Quarterly review cadence with owner
- Integration with GSC Links API for backlink discovery
- Manual tracking for outreach, reviews, and entity presence updates
