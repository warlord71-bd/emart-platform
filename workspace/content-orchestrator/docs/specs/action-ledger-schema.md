# Emart Action and Event Ledger Schema

Version: 2026-06-25-v1
Scope: unified durable schema for SEO and UX recommendations, approvals, executions, verification, measurement, and close-out.
Status: schema only. Do not create ledger entries until the owner/agent chooses a storage path and instantiation plan.

## Goals

- Replace overwritten proposal files, especially SEO `actions.json`, with durable events.
- Give SEO and UX work stable IDs, evidence, approval state, execution proof, rollback plans, and measurable outcomes.
- Keep all protected commerce areas gated: checkout, cart, payment, order, customer data, stock, price, and WooCommerce DB writes require explicit owner scope.
- Support both automated proposals and human-authored recommendations without letting either auto-apply changes.

## Recommended Storage

- Canonical ledger path, once instantiated: `workspace/ledgers/action-events.jsonl`.
- Optional indexes, generated from the ledger: `workspace/ledgers/action-index.json`, `workspace/ledgers/pending-approvals.md`, `workspace/ledgers/outcome-review.md`.
- Append-only JSONL is preferred for the canonical file. Corrections are new events referencing `supersedes` or `corrects`, not in-place edits.
- Each line is one event object. Large evidence payloads should be stored as artifact files and referenced by path/hash.

## Stable ID Format

Format:

```text
<DOMAIN>-<YYYYMMDD>-<ENTITY>-<NNN>
```

Examples:

```text
SEO-20260625-PDP-001
UX-20260625-SEARCH-001
TRUST-20260625-CATEGORY-001
CONTENT-20260625-BLOG-001
```

Rules:

- `DOMAIN` values: `SEO`, `UX`, `CONTENT`, `TRUST`, `OPS`, `SOCIAL`.
- `ENTITY` values should be short and stable: `PDP`, `CATEGORY`, `BLOG`, `SEARCH`, `FILTER`, `CHAT`, `CAMPAIGN`, `SCHEMA`, `URL`.
- IDs are never reused, even after revert or rejection.
- Follow-up work uses `parent_id` and `related_ids`.

## Status Lifecycle

Allowed statuses:

```text
proposed -> triaged -> approved -> applied -> verified -> measured -> closed
                         |           |          |           |
                         v           v          v           v
                      rejected    blocked    reverted    stale
```

Status rules:

- `proposed`: evidence and recommendation exist; no permission to act.
- `triaged`: priority, owner, blast radius, and approval need are assigned.
- `approved`: owner or delegated agent approved the exact scope.
- `applied`: execution record exists with commit/date/files or external action proof.
- `verified`: technical/business acceptance check passed.
- `measured`: post-change metric window has been evaluated.
- `closed`: final keep/revert/no-op decision recorded.
- `reverted`: rollback executed and verified.
- `blocked`: action cannot proceed without owner/external dependency.
- `rejected`: intentionally not doing it.
- `stale`: evidence expired and must be refreshed before action.

## Entry Schema

```json
{
  "schema_version": "action-ledger.v1",
  "id": "SEO-20260625-PDP-001",
  "parent_id": null,
  "related_ids": [],
  "category": "SEO",
  "sub_category": "metadata",
  "entity": {
    "type": "product",
    "id": "23112",
    "slug": "example-product",
    "canonical_url": "https://e-mart.com.bd/shop/example-product"
  },
  "status": "proposed",
  "priority": "high",
  "risk": {
    "blast_radius": "single-page",
    "protected_data": false,
    "requires_owner_approval": true,
    "freeze_safe": true
  },
  "evidence": [
    {
      "source": "gsc",
      "source_path": "workspace/seo-review/gsc-daily/2026-06-25.json",
      "captured_at": "2026-06-25T00:30:00Z",
      "summary": "High impressions, low CTR on canonical PDP",
      "metrics": {
        "clicks": 10,
        "impressions": 1000,
        "ctr": 0.01,
        "position": 3.2
      },
      "artifact_hash": null
    }
  ],
  "recommendation": {
    "summary": "Rewrite meta description to match primary query intent",
    "details": "Use owner-approved product facts only; no medical claims.",
    "proposed_files": [],
    "external_systems": [],
    "acceptance_criteria": [
      "Metadata renders with canonical shop URL",
      "No backend canonical exposure",
      "No price/stock/order/customer changes"
    ]
  },
  "owner": "[X]",
  "approval": {
    "state": "not_requested",
    "approver": null,
    "approved_at": null,
    "approval_channel": null,
    "approval_reference": null,
    "scope": null
  },
  "execution": {
    "applied_at": null,
    "agent": null,
    "commit": null,
    "files": [],
    "commands": [],
    "external_actions": [],
    "rollback_ref": null
  },
  "verification": {
    "method": null,
    "verified_at": null,
    "result": null,
    "artifacts": []
  },
  "rollback": {
    "procedure": "Restore previous file/metadata from rollback artifact or git commit.",
    "rollback_artifacts": [],
    "revert_commit": null,
    "verified_at": null
  },
  "measurement": {
    "metric": "organic_ctr",
    "baseline": {
      "window": "28d",
      "value": null,
      "captured_at": null,
      "source": null
    },
    "post_change": {
      "window": "7d",
      "value": null,
      "captured_at": null,
      "source": null
    },
    "review_date": null,
    "decision": null
  },
  "created_at": "2026-06-25T21:00:00Z",
  "updated_at": "2026-06-25T21:00:00Z",
  "created_by": "Codex",
  "notes": []
}
```

## Category Profiles

### SEO

Required evidence:

- Canonical URL and route type.
- GSC page/query metrics or technical audit evidence.
- Current metadata/schema/canonical/sitemap/indexability state when relevant.
- Data freshness timestamp.

Required verification:

- Build/lint when code changes.
- Live or local route check for canonical, metadata, robots, schema, and status code.
- GSC/SEO metric review after 7 and/or 28 days for traffic-facing changes.

Rollback:

- Git revert for code.
- Rollback JSON or previous value snapshot for content/meta data.
- Cache revalidation note when content changed.

### UX

Required evidence:

- Route/component/surface affected.
- Screenshot, event data, support/chat evidence, or audit finding.
- Device/viewport when visual or interaction-related.
- Trust-data source if claim involves live, stock, reviews, sold, viewers, verified, or social proof.

Required verification:

- Screenshot/a11y/keyboard check when visible UI changes.
- Event payload validation when analytics changes.
- No protected checkout/cart/payment/order/customer/stock/price changes unless owner-approved.

Rollback:

- Git revert or feature flag disable.
- Event schema version rollback for instrumentation.

### Content

Required evidence:

- Intent/demand source.
- Cannibalization check.
- Factual source and claim-safety review.
- Approval state for publish.

Required verification:

- Draft/review gate.
- Link/schema/factual QA.
- Published URL and cache revalidation only after approval.

Rollback:

- WordPress draft/revert post ID, previous content snapshot, or git revert for static content.

### Trust

Required evidence:

- Exact UI claim text.
- Real source or fallback source.
- Cache age and fallback wording.

Required verification:

- Screenshot or DOM/text check proving synthetic/fallback claims are visibly labeled.

Rollback:

- Remove claim or restore previous owner-approved wording.

## Event Types

The canonical ledger can store full entries or smaller event records. If event-sourcing is used, each line should have:

```json
{
  "schema_version": "action-ledger-event.v1",
  "event_id": "EVT-20260625-000001",
  "action_id": "SEO-20260625-PDP-001",
  "event_type": "status_changed",
  "from_status": "approved",
  "to_status": "applied",
  "actor": "Codex",
  "occurred_at": "2026-06-25T21:30:00Z",
  "summary": "Applied metadata copy change",
  "patch": {
    "execution.commit": "abcdef1",
    "execution.files": ["apps/web/src/app/shop/[slug]/page.tsx"]
  }
}
```

Allowed event types:

- `created`
- `evidence_added`
- `triaged`
- `approval_requested`
- `approved`
- `rejected`
- `applied`
- `verification_added`
- `measurement_added`
- `reverted`
- `blocked`
- `closed`
- `corrected`

## Approval Rules

- Owner approval is required for protected commerce-data changes, broad visible UI changes before 2026-07-03, publish actions, external outreach, automatic discounts/prices, and any uncertain claim.
- Agent approval is enough for docs/specs, report-only audits, generated local ledgers, and non-visual instrumentation schemas.
- Approval scope must name exact routes/files/surfaces and the allowed action. Broad "improve SEO" approval is not enough for writes.

## Measurement Windows

Default windows:

- SEO metadata/content: baseline 28 days; first review 7 days after index recrawl if detectable; decision review 28 days.
- Technical SEO fixes: immediate verification plus GSC/index review after 7-28 days.
- UX visible changes: immediate screenshot/a11y check; engagement/conversion review after 7 days minimum.
- Social/campaign actions: same-day publish proof; 24h and 7d engagement review.
- Trust wording changes: immediate source/wording verification; monitor conversion/support complaints over 7-14 days.

Decision values:

- `keep`
- `iterate`
- `revert`
- `inconclusive`
- `needs_more_data`

## Validation Rules

Before a ledger entry can move to `approved`, it must have:

- `id`, `category`, `entity`, `status`, `priority`, `evidence`, `recommendation`, `owner`, `risk`, and `created_at`.
- At least one evidence item with `source` and `captured_at`.
- Explicit `requires_owner_approval` decision.

Before `applied`:

- Approval must be `approved` unless the item is docs/report-only.
- Execution must include commit/file list or external action proof.
- Rollback procedure must be present.

Before `closed`:

- Verification result must be recorded.
- Measurement decision must be recorded or explicitly marked not applicable.

## Migration Plan

1. Create `workspace/ledgers/` with README and empty JSONL only after owner/agent approval.
2. Import current open SEO proposals from `workspace/seo-review/actions.json` as `proposed` entries, preserving the source path and timestamp.
3. Import UX trust contract follow-ups as `TRUST` or `UX` entries only if still open.
4. Generate read-only indexes from JSONL; never hand-edit indexes.
5. Update automation to append proposals to the ledger instead of overwriting daily action files.
