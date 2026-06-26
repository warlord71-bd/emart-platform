# Customer Feedback Taxonomy Spec (UX-ORCH-9)

Version: 2026-06-26-v1
Status: **spec** — approval-first for any new customer data collection.

## Goal
Classify and route customer feedback signals into UX/SEO/action ledgers without unsafe customer data collection. The taxonomy makes feedback actionable without storing PII.

## Feedback Channels (existing, no new collection)

| Channel | Current State | Signal Type |
|---|---|---|
| On-site chat (Emart AI) | Active, 334 AI sessions/14d | Search queries, product questions, "could not find" signals |
| WhatsApp (sales + support) | Active, 2 numbers | Order issues, product questions, payment problems |
| Product reviews | ~16 on-site reviews | Product satisfaction, quality issues |
| Google Reviews | Not tracked | Store trust, delivery satisfaction |
| Facebook/Instagram comments | Active, comment permission blocked | Product interest, brand sentiment |
| GA4 search queries | Active, tracked in analytics | Search intent, no-result queries |
| 404 pages | Tracked in GSC + GA4 | Broken links, outdated bookmarks |

## Taxonomy Categories

### Product Discovery
- `SEARCH_NO_RESULT`: user searched but found nothing (chat or on-site search)
- `SEARCH_WRONG_RESULT`: user found irrelevant products
- `PRODUCT_NOT_AVAILABLE`: user asked for a product we don't carry
- `PRODUCT_OUT_OF_STOCK`: user wanted a product that's out of stock
- `CATEGORY_NAVIGATION_FAIL`: user couldn't find the right category

### Purchase Friction
- `PRICE_CONCERN`: user mentioned price as a barrier
- `PAYMENT_ISSUE`: bKash/Nagad/COD confusion or failure
- `DELIVERY_CONCERN`: shipping time, cost, or area coverage
- `CHECKOUT_ERROR`: technical error during checkout
- `TRUST_CONCERN`: authenticity, return policy, or legitimacy questions

### Content Quality
- `PRODUCT_INFO_MISSING`: user asked for information not on the PDP
- `PRODUCT_INFO_WRONG`: user reported incorrect product information
- `CONTENT_UNCLEAR`: user couldn't understand product description or guide
- `IMAGE_ISSUE`: missing, wrong, or low-quality product images

### Post-Purchase
- `DELIVERY_DELAY`: order took longer than expected
- `WRONG_PRODUCT`: received different product than ordered
- `QUALITY_ISSUE`: product quality didn't match expectation
- `RETURN_REQUEST`: wants to return/exchange

## Integration with Action Ledgers

Each feedback category maps to an action domain:
- `SEARCH_*` → SEO action ledger (content gaps, search optimization)
- `PRODUCT_NOT_AVAILABLE` → Catalog expansion ledger (owner decision)
- `PURCHASE_*` → UX action ledger (checkout/payment flow improvements)
- `CONTENT_*` → Content action ledger (PDP/guide improvements)
- `POST_PURCHASE` → Operations (not in scope for SEO/UX ledgers)

## Data Safety Rules
- **Never store PII** (name, phone, email, address) in the feedback taxonomy
- **Aggregate only:** store category counts and anonymized examples, not full conversations
- **No new data collection forms** without owner approval
- **Chat logs stay in chat:** the taxonomy extracts signals, not transcripts
- **Review content is public:** can be tracked as-is

## Implementation
- Script: `workspace/scripts/active/feedback_classifier.py`
- Input: chat session summaries (anonymized), search no-result logs, review text
- Output: `workspace/seo/feedback-signals.jsonl` (category, count, example, date)
- Monthly summary report for owner review
- Feeds into action ledger for high-frequency issues

## Current Blockers
- On-site chat doesn't export session summaries (would need a logging endpoint)
- WhatsApp conversations are manual (no API access — Phase 5 blocked)
- Review volume too low for statistical analysis (16 reviews)
- **Start with:** GA4 search queries (no-result rate) + 404 tracking (already available)
