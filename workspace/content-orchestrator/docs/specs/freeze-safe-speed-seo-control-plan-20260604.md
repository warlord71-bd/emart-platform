# Freeze-Safe Speed + SEO Control Plan — 2026-06-04

## Summary

This document is an operations control/review plan, not an implementation task.

The project freeze in `workspace/TASKS.md` blocks structural navigation, URL, and sitemap architecture changes. It does not ban all code or content work: content, SEO, automation, audits, monitoring, metadata, product data/images, and small bug fixes can still be allowed when they are freeze-safe.

This document applies a stricter rule only for the current paused review/control phase: review, check, and document first; do not implement changes until owner approval. After approval, freeze-safe SEO/content/automation/code changes may be executed separately if each proposed action has evidence, benefit, freeze-safety, phase fit, and a gate.

Target review file:

`workspace/content-orchestrator/docs/freeze-safe-speed-seo-control-plan-20260604.md`

## Scope

### Project freeze rule

- Structural navigation, URL, redirect, and sitemap architecture changes are frozen unless a separate critical issue is approved.
- Content, SEO, automation, audits, monitoring, metadata, product data/images, and small bug fixes can be allowed during the freeze when they do not alter frozen structure or create checkout/customer-flow risk.
- This control plan does not override the freeze definition in `workspace/TASKS.md`.

Allowed in this planning/control phase:

- Measure speed and response behavior.
- Review existing Lighthouse and audit artifacts.
- Inspect live headers and cache behavior.
- Maintain Google Search Console indexing hygiene.
- Continue existing metadata generation only through validator gates.
- Review existing product image/data audit files.
- Monitor Meta Pixel, Meta CAPI, GA4, and checkout monitor health.
- Record results, blockers, owner actions, monitoring checkpoints, and proposed freeze-safe follow-up tasks.

Not allowed in this planning/control phase without separate approval:

- No implementation/code changes during this paused review/control phase.
- No URL changes.
- No redirect changes unless a separate critical issue is approved later.
- No sitemap architecture changes.
- No navigation/header/footer redesign.
- No checkout/cart/payment/order/customer/stock/price changes.
- No schema changes.
- No fake reviews, fake ratings, fake `aggregateRating`, or unsupported trust claims.
- No WooCommerce image/data mutation.
- No Cloudflare rule changes.
- No Pixel/GA/GTM loading changes.
- No production deploy, PM2 restart, environment-variable change, or database write.

Freeze-safe content, SEO, automation, metadata, product data/image review, monitoring, and small bug fixes may be proposed after this review. Each follow-up must be approved and gated separately.

`No code changes` in this document means no implementation during the current paused review/control phase. It does not override the project freeze definition in `workspace/TASKS.md`, which allows content, SEO, automation, product data/images, and small bug fixes while blocking structural/nav/URL/sitemap changes.

## Plan Standard

Every action must pass five tests before execution:

| Test | Requirement | Failure result |
|---|---|---|
| Evidence | A measured problem exists. | Do not act; document as monitor-only. |
| Benefit | The action helps speed, indexing, CTR, crawl quality, or revenue measurement. | Deprioritize. |
| Freeze safety | No structural SEO, checkout, data, analytics, or customer-flow risk. | Move to post-freeze backlog or separate approval. |
| Phase fit | The action is either review/check work for this phase, or separately approved freeze-safe execution. | Keep it as a proposal; do not implement. |
| Gate | The next step is blocked until the current step passes. | Stop and document blocker. |

## Priority Ranking

| Priority | Area | Why it matters now | Freeze risk | Execution type |
|---|---|---|---|---|
| P1 | Baseline control table | Prevents guessing and gives a source of truth. | Low | Check-only/document-only |
| P2 | Server + Cloudflare evidence check | Confirms whether speed issue is infra/cache or not. | Low if check-only | Inspect-only |
| P3 | GSC crawl + indexing maintenance | Fastest safe search visibility improvement. | Low if valid URLs only | Owner/manual |
| P4 | Metadata continuation | Improves CTR/snippet quality without template risk. | Low if validator-gated | Existing workflow only |
| P5 | Image/data hygiene review | Improves PDP trust, image SEO, and Shopping quality. | Low if review-only | Owner-reviewed list only |
| P6 | Analytics protection | Protects ROAS and paid-ads decisions. | Low if monitor-only | Monitor-only |
| P7 | Report + decision log | Prevents repeated work and keeps freeze discipline. | Low | Documentation only |

## Step 1 — Baseline Control Table

### Goal

Document the current state before any operational action.

### Evidence to collect

- Lighthouse mobile score and key metrics.
- Lighthouse tablet score and key metrics.
- Lighthouse desktop score and key metrics.
- Live header/cache/TTFB checks.
- GSC sitemap/indexing status.
- Meta Purchase value/currency status.
- Top commercial URL sample status.

### Current artifact candidates

Confirm existence before using:

- `workspace/audit/archive/lighthouse-home-mobile-20260604-212905.report.report.html`
- `workspace/audit/archive/lighthouse-home-tablet-20260604-2136.report.report.html`
- `workspace/audit/archive/lighthouse-home-20260604-212905.report.report.html`

If any artifact is missing from GitHub, check local/VPS workspace before marking it usable. Do not estimate scores.

### Baseline control table template

| Control area | Evidence source | Current result | Benefit score | Freeze risk | Next action | Blocker if failed | Owner/manual action |
|---|---|---:|---:|---|---|---|---|
| Lighthouse mobile | Report artifact | Pending | High | Low | Record score + LCP/CLS/TTFB | Missing report | Confirm artifact exists |
| Lighthouse tablet | Report artifact | Pending | Medium | Low | Record score + LCP/CLS/TTFB | Missing report | Confirm artifact exists |
| Lighthouse desktop | Report artifact | Pending | Medium | Low | Record score + LCP/CLS/TTFB | Missing report | Confirm artifact exists |
| Homepage headers | `curl -I /` | Pending | High | Low | Compare cache/TTFB | Bad TTFB/cache/challenge | Owner approves infra action later |
| PDP headers | `curl -I /shop/{slug}` | Pending | High | Low | Confirm product behavior | Wrong cache/canonical/status | Review before indexing |
| Category headers | `curl -I /category/{slug}` | Pending | High | Low | Confirm CDN behavior | Cache bypass/challenge | Review before action |
| GSC sitemap | Search Console | Pending | High | Low | Resubmit if clean | Sitemap error | Owner manual GSC action |
| Top commercial URLs | GSC URL Inspection | Pending | High | Low | Request indexing only if valid | Soft 404/noindex/duplicate | Owner manual GSC action |
| Meta Purchase | Meta Events Manager/test order | Pending | High | Low | Confirm numeric value + BDT | Missing/zero/duplicate purchase | Stop and investigate |
| GA4 page_view | GA4 realtime | Pending | Medium | Low | Confirm realtime page_view | No event firing | Stop and investigate |

### Gate

Baseline must be written before any operational action.

### Freeze safety

Check-only and document-only. No production behavior changes.

## Step 2 — Server + Cloudflare Evidence Check

### Goal

Decide whether speed work should focus on infrastructure/cache or move to non-server work.

### Inspect only

- Homepage response headers.
- Product detail page response headers.
- Category page response headers.
- Cloudflare cache status.
- Brotli/HTTP3 status.
- Challenge/Bot script injection.
- TTFB.

### Suggested read-only checks

Use safe `curl -I` style checks only:

- `/`
- `/shop`
- One high-value `/shop/{product-slug}` URL.
- One high-value `/category/{category-slug}` URL.
- `/checkout`
- `/account`
- `/wishlist`

Record:

- HTTP status.
- `cache-control`.
- `cdn-cache-control`.
- `cloudflare-cdn-cache-control`.
- `cf-cache-status`.
- `age`.
- `content-encoding`.
- `server-timing`.
- TTFB.
- Challenge/captcha/script signals.

### Decision logic

| Finding | Decision |
|---|---|
| Homepage TTFB/cache/challenge is bad | Fix infra first, but only through a separate approved task. |
| Public catalog pages are bypassing expected edge behavior | Document evidence; separate Cloudflare/Next approval needed. |
| Checkout/account/private pages appear public-cacheable | Stop immediately; critical safety issue. |
| TTFB is already good | Do not waste time on server; move to GSC/meta/image/analytics. |
| Cloudflare challenge appears for Googlebot or normal users | Stop and document before any indexing push. |

### Existing behavior to protect

- Private/customer routes should remain private/no-store.
- Catalog/listing routes should keep their intended CDN behavior.
- Existing SEO redirects in `next.config.js` should not be touched during freeze unless a critical issue is separately approved.

### Gate

If TTFB/cache/challenge is bad, stop and document issue before action.

### Freeze risk

Low if check-only. Any Cloudflare rule change needs separate approval.

## Step 3 — GSC Crawl + Indexing Maintenance

### Goal

Improve search visibility safely by keeping Google aware of clean, useful, commercial URLs.

### Owner/operator actions

- Re-submit `https://e-mart.com.bd/sitemap.xml` in Google Search Console.
- Inspect top commercial URLs.
- Request indexing only for URLs that pass validity checks.

### Valid indexing requirements

A URL can be submitted/requested only if it is:

- `200`.
- Canonical or correctly canonicalized.
- Indexable.
- Useful for users.
- Not blocked by robots.
- Not `noindex`.
- Not a soft 404.
- Not duplicate/thin/empty.
- Not a filtered/search/tag/tracking URL.
- Not a redirected URL.

### Suggested top commercial URL sample

| URL type | Sample count | Why |
|---|---:|---|
| Homepage | 1 | Brand/crawl entry point |
| `/shop` | 1 | Main commercial listing |
| Top product pages | 10–20 | Revenue + product search demand |
| Top brand pages | 5–10 | Branded skincare demand |
| Top category pages | 5–10 | Commercial discovery demand |
| Top concern pages | 5–10 | Intent-based skincare demand |

### Do not

- Do not request indexing for soft 404, noindex, duplicate, redirected, canonical-mismatched, or thin pages.
- Do not change redirects during freeze unless critical.
- Do not change sitemap architecture during freeze.
- Do not request indexing for URLs that still need image/data correction if the issue could reduce trust or Merchant Center quality.

### Benefit

Fastest safe search visibility improvement because it uses owner/manual GSC operations without code changes.

### Gate

Do not request indexing for any URL that fails validity checks.

### Freeze risk

Low when limited to manual GSC maintenance for valid URLs.

## Step 4 — Metadata Continuation

### Goal

Continue existing metadata workflow to improve CTR and snippet quality without changing templates or structure.

### Track

- Remaining product metas.
- Static page metas.
- Skin-type metas.
- Blog focus keyword gaps.
- Validator pass/fail count.
- Changed-today validation result.

### Inspect/track files

- `workspace/TASKS.md`
- `workspace/content-orchestrator/docs/meta_generator.py`
- `workspace/content-orchestrator/docs/meta_validator.py`

### Allowed

- Continue existing meta generation workflow.
- Validate dry-run outputs.
- Apply only validator-approved rows if the existing workflow already allows it.
- Revalidate changed rows.
- Record remaining gaps.

### Required metadata rules

- 130–158 characters where applicable.
- No price in meta descriptions.
- Must mention Bangladesh where required by current rule.
- Must mention Emart where required by current rule.
- Must mention COD/cash on delivery where required by current rule.
- No risky treatment/cure/medical claims.
- No filler phrases.
- No unsupported trust claims.
- No fake urgency.

### Gate

No bulk apply without validator pass.

If validator flags price, risky claims, repeated clause tails, invalid length, missing Bangladesh, missing Emart, missing COD, or filler language, stop that batch and review.

### Benefit

Improves CTR and search snippet quality with low freeze risk because it uses the existing dry-run → validate → apply-reviewed → revalidate process.

### Freeze risk

Low only when validator-gated. Medium/high if bulk-applied without validation.

## Step 5 — Image/Data Hygiene Review

### Goal

Prepare owner-reviewed image/data fixes that improve PDP trust, image SEO, and Shopping quality without touching WooCommerce during freeze.

### Use existing image audit files only

Potential files/artifacts:

- `workspace/audit/active/products-need-real-image.csv`
- Product image audit outputs if present.
- Any owner-approved replacement-image list.

Important note:

If `workspace/audit/active/products-need-real-image.csv` is not present in the current GitHub checkout, verify whether it exists on local/VPS workspace before using it. Treat it as an expected audit artifact, not guaranteed repo content.

### Prepare owner-reviewed list for

- Missing product images.
- Bad primary product images.
- Brand/image mismatch.
- Size/image mismatch.
- Duplicate or weak product image mapping.
- Merchant Center/image SEO weak spots.

### Review list fields

| Field | Purpose |
|---|---|
| Product ID | Avoid slug/name ambiguity |
| Product slug | Human review |
| Product title | Human review |
| Current image issue | Why it is flagged |
| Proposed source image | Replacement candidate |
| Confidence | Safe / manual review / reject |
| Owner decision | Approve / reject / needs new image |
| Mutation allowed? | Must stay `No` in this control plan |

### Gate

No Woo image mutation without dry-run/review.

### Benefit

Better PDP trust, image SEO, Shopping feed quality, and customer confidence.

### Freeze risk

Low when review-only. High if Woo media/thumbnail mutations happen without owner approval.

## Step 6 — Analytics Protection

### Goal

Protect revenue measurement and paid ads decisions while avoiding new script-loading risk.

### Monitor

- Meta Purchase has numeric `value > 0`.
- Meta Purchase currency is `BDT`.
- Pixel and CAPI dedup remain sane.
- GA4 `page_view` still fires.
- GA4 ecommerce events still appear if applicable.
- Checkout monitor remains healthy.
- Meta Events Manager has no new severe diagnostics.

### Inspect/monitor files/tools

- `apps/web/src/lib/metaCapi.ts`
- `apps/web/src/components/analytics/MetaPixel.tsx`
- Meta Events Manager.
- GA4 realtime.
- Checkout monitor output/alerts.

### Do not

- Do not change Pixel/GA loading again during pause unless tracking is proven broken.
- Do not change order-success logic.
- Do not change checkout flow.
- Do not change CAPI token/env values.
- Do not change consent/GTM placement.
- Do not remove analytics scripts to chase Lighthouse score.

### Decision logic

| Finding | Decision |
|---|---|
| Purchase `value` missing, zero, or non-numeric | Stop and investigate; separate approval needed for fix. |
| Currency is not `BDT` | Stop and investigate; separate approval needed for fix. |
| Pixel and CAPI duplicate incorrectly | Document evidence before action. |
| GA4 page_view missing | Stop and investigate before more SEO measurement. |
| Checkout monitor failing | Treat checkout health as higher priority than speed/SEO. |
| Everything healthy | Monitor only; no analytics code changes. |

### Gate

No analytics code/loading changes while development is paused unless tracking is proven broken and owner approves a separate fix.

### Benefit

Protects ROAS decisions and prevents false paid-ads conclusions.

### Freeze risk

Low if monitor-only. Medium/high if script-loading or checkout/order-success code is changed.

## Step 7 — Report + Decision Log

### Goal

Record evidence, decisions, blockers, and owner/manual actions so the project does not restart the same audit repeatedly.

### The MD/report must include

- What was checked.
- Result.
- Benefit score.
- Freeze risk.
- Next action.
- Blocker if failed.
- Owner/manual action if needed.

### Decision log template

| Date | Step | Evidence | Result | Benefit score | Freeze risk | Decision | Blocker | Owner/manual action | Next review |
|---|---|---|---|---:|---|---|---|---|---|
| 2026-06-04 | Baseline | Pending | Pending | 5 | Low | Pending | Baseline not written | Confirm artifacts | 7 days |
| 2026-06-04 | Server/Cloudflare | Pending | Pending | 5 | Low if check-only | Pending | Headers not checked | None yet | 7 days |
| 2026-06-04 | GSC | Pending | Pending | 5 | Low | Pending | GSC not reviewed | Owner GSC action | 7/14/28 days |
| 2026-06-04 | Metadata | Pending | Pending | 4 | Low if validator-gated | Continue only with validator | Validator result needed | None unless approval needed | 14 days |
| 2026-06-04 | Image/data | Pending | Pending | 4 | Low if review-only | Prepare list only | CSV/artifacts need confirmation | Owner image review | 14/28 days |
| 2026-06-04 | Analytics | Pending | Pending | 5 | Low if monitor-only | Monitor only | Needs Meta/GA evidence | Owner/test order if needed | 7 days |

### Session log rule

Only after owner review/approval, append a planning/ops entry to:

`apps/web/SESSION-LOG.md`

The session log entry must say this was a planning/ops review, not implementation.

Do not update `SESSION-LOG.md` as part of this MD creation task unless explicitly approved separately.

## Acceptance Criteria

This review MD is complete only if it clearly answers:

- What helps most right now?
- What is safe during freeze?
- What should not be touched?
- What evidence proves each step?
- What blocks the next step?
- What owner actions are needed?
- How impact is monitored after 7, 14, and 28 days?
- Which work is allowed by the project freeze but intentionally paused until review/approval?
- Why `No code changes` is a current-phase rule, not a permanent freeze rule.

The implementer must not treat `No code changes` as a permanent project-freeze rule. It means no implementation during this paused control phase only.

## Monitoring Plan

### After 7 days

Check:

- GSC sitemap status.
- GSC indexing status for requested top URLs.
- Meta Purchase value/currency health.
- GA4 realtime/page_view health.
- Checkout monitor health.
- Any Cloudflare challenge/cache anomaly.

Decision:

- If indexing improves and analytics is healthy, continue same process.
- If indexing fails due to canonical/noindex/soft 404, stop indexing requests and document pattern.
- If analytics breaks, analytics/checkout health becomes higher priority than SEO speed work.

### After 14 days

Check:

- Product meta completion progress.
- Validator failure patterns.
- Top product/category/brand impressions and CTR in GSC.
- Image/data review list owner decisions.
- Any Merchant Center/image warnings connected to product images.

Decision:

- Continue validator-gated metadata if clean.
- Prepare separate owner-approved image fix task if review list is ready.
- Do not start template/schema/navigation changes during freeze.

### After 28 days

Check:

- CTR trend for metadata-updated URLs.
- Indexing trend for submitted commercial URLs.
- Crawl/index coverage changes.
- Revenue tracking consistency from Meta/GA4.
- Whether speed/TTFB remained stable.

Decision:

- Keep safe ops running if positive.
- Move structural/template/schema/UI fixes to post-freeze backlog.
- Escalate only evidence-backed problems that affect revenue, checkout, indexing, or crawlability.

## Assumptions

- Development is paused for this control-plan phase.
- This task updates only the review MD.
- No implementation/code, URL, nav, sitemap, checkout, schema, Cloudflare, analytics loading, WooCommerce image/data, or page-template changes are made during this paused control-plan phase.
- The project freeze still allows content, SEO, automation, audits, monitoring, metadata, product data/images, and small bug fixes when separately approved and gated.
- The best near-term wins are GSC/indexing hygiene, metadata completion, Cloudflare/server verification, image/data review, and analytics protection.
- Any operational step after this document must be executed separately with its own evidence, benefit, freeze-safety check, and gate.
