# Campaign & Promotion Orchestration Contract (UX-ORCH-6)

Version: 2026-06-26-v1
Scope: all time-bounded promotional surfaces on e-mart.com.bd — hero banners, offer rails, flash sale messaging, social campaign assets, and seasonal/event promotions.
Status: **spec/contract** — no price/discount automation. No visible UI refactor before 2026-07-03 without explicit owner approval.

## Required Fields for Every Campaign Surface

| Field | Description | Required |
|---|---|---|
| `campaign_id` | Stable identifier (e.g., `CAMP-20260626-EID-001`) | Yes |
| `owner` | Who created/approved this campaign | Yes |
| `surface` | Where it appears: `hero`, `offer_rail`, `flash_banner`, `social_post`, `email`, `notification` | Yes |
| `source_data` | What drives it: static copy, Woo sale prices, manual product list, dynamic query | Yes |
| `start_datetime` | When it becomes visible (BDT) | Yes |
| `end_datetime` | When it stops being visible (BDT) | Yes |
| `preview_url` | How to preview before activation | Recommended |
| `approval_state` | `draft` → `approved` → `active` → `completed` → `archived` | Yes |
| `rollback_procedure` | How to remove/revert if something goes wrong | Yes |
| `linked_metric` | What success looks like: CTR, revenue, sessions, conversions | Recommended |
| `stale_alert_hours` | Hours after `end_datetime` before an automated stale-content alert fires | Default: 24 |

## Campaign Lifecycle

```
1. PLAN   → 2. CREATE   → 3. PREVIEW   → 4. APPROVE   → 5. ACTIVATE   → 6. MONITOR   → 7. DEACTIVATE   → 8. ARCHIVE
```

### 1. Plan
- Define campaign goal, audience, surfaces, date range, and success metric.
- Check for conflicts with other active campaigns on the same surface.

### 2. Create
- Build assets (social images, hero banners, copy).
- For social: use `social-engine/` plan → preview → schedule workflow.
- For hero/offer rail: code change with conditional rendering based on date range.
- **Never:** hardcode promotional content without start/end dates or an expiry mechanism.

### 3. Preview
- Social: contact sheet + review pack (existing workflow).
- Hero/banner: local dev server screenshot or DesignSync preview.
- Email: test send to owner.

### 4. Approve
- Owner reviews preview and confirms activation.
- Approval recorded in campaign manifest or action ledger.
- **No auto-activation of new campaign types** without owner seeing the preview first.

### 5. Activate
- Social: `meta_schedule.js --publish` (only after approval gate).
- Hero/banner: deploy with time-conditional rendering.
- **Never:** activate a campaign by directly editing production database or hardcoding without version control.

### 6. Monitor
- Track linked metric during campaign window.
- Alert if engagement drops below baseline or errors spike.
- Social: `meta_schedule.js --record-history` after completion.

### 7. Deactivate
- Automated: time-conditional rendering hides content after `end_datetime`.
- Manual: owner requests early termination.
- **Stale-content alert:** if a campaign surface still shows content 24h after `end_datetime`, flag it.

### 8. Archive
- Move campaign state to history (`social-engine/history/`).
- Record outcome in action ledger.
- Rotate one-shot PM2 processes and dated scripts to attic (per WA-D pattern).

## Surface-Specific Rules

### Hero Carousel
- Maximum 5 slides. Each slide has an image, headline, CTA, and link.
- Tagline on hero: preserve current approved brand tagline unless owner explicitly changes it.
- Time-conditional slides must have both start and end dates.

### Flash Sale / Offer Rail
- **Never** create automatic discounts or modify Woo sale prices without explicit owner request.
- Flash sale messaging must reflect actual Woo-enabled sale prices, not fabricated urgency.
- Source data must be a specific product list or Woo sale query, not a made-up "top deals" claim.

### Social Campaign Assets
- Follow `workspace/content-orchestrator/docs/claude-reference/social-publishing.md` reference.
- FB 1:1, IG 4:5 separate assets (per `feedback_social_image_sizes.md`).
- Campaign plan approval (`approval_status=approved_for_scheduled_run`) required before any Meta API call.
- Buying-link first comments require `pages_manage_engagement` permission (currently blocked — O-15).

### Seasonal/Event Promotions
- BD calendar events: Eid, Pohela Boishakh, Valentine's Day, Black Friday.
- Plan at least 7 days before event start.
- Deactivate within 24h of event end.

## Protected Commerce Data
- This contract does NOT authorize: automatic price changes, discount creation, stock level changes, cart/checkout behavior changes, customer data collection, or WooCommerce DB writes.
- Any campaign that requires price/discount changes must go through the owner with the exact product IDs, old prices, new prices, and date range.

## Current State (2026-06-26)
- Social Engine: review-gated plan → preview → schedule → publish pipeline exists.
- Hero: currently rolling/static; no time-conditional framework.
- Flash sale: removed 2026-05-08 (`d23c37e`); homepage fallback fixed.
- Stale-content alert: not yet automated; manual check at session start.
- Campaign manifest: not yet instantiated; use action ledger `SOCIAL-*` entries for now.
