# Experiment & Feature Flag Registry Spec (UX-ORCH-7)

Version: 2026-06-26-v1
Status: **spec** — no auto-randomized UI or self-optimizing changes until measurement and approval gates exist.

## Goal
Track all UX experiments and feature flags with hypothesis, audience, variants, metrics, runtime, rollback, and outcome. Prevent uncontrolled A/B testing or feature rollouts without measurement.

## Registry Schema

```json
{
  "id": "EXP-20260626-001",
  "name": "PDP sticky CTA button",
  "hypothesis": "A sticky Add to Cart button on mobile PDP will increase add-to-cart rate by 10%",
  "status": "proposed",
  "owner": "[O]",
  "audience": {
    "platform": "mobile",
    "percentage": 50,
    "segment": "all"
  },
  "variants": [
    {"id": "control", "description": "Current PDP layout"},
    {"id": "treatment", "description": "Sticky bottom CTA bar on mobile"}
  ],
  "holdout": true,
  "primary_metric": "add_to_cart_rate",
  "secondary_metrics": ["time_to_add_to_cart", "scroll_depth", "conversion_rate"],
  "minimum_runtime_days": 14,
  "minimum_sample_size": 500,
  "rollback_condition": "add_to_cart_rate drops >5% or conversion_rate drops >3%",
  "rollback_procedure": "Remove feature flag, deploy control variant",
  "approval": {
    "state": "not_requested",
    "approver": null,
    "approved_at": null
  },
  "start_date": null,
  "end_date": null,
  "outcome": {
    "decision": null,
    "metric_results": {},
    "notes": ""
  },
  "created_at": "2026-06-26",
  "related_task_ids": ["UX-4"]
}
```

## Status Lifecycle
```
proposed -> approved -> running -> analyzing -> decided (keep|revert|iterate)
```

## Rules
1. **No experiment without hypothesis:** every test must state what it expects to improve and by how much.
2. **No experiment without rollback:** must be possible to revert within 1 hour.
3. **No experiment on protected data:** checkout/cart/payment/order/customer/stock/price changes are never A/B tested without explicit owner scope.
4. **Minimum runtime:** 14 days or 500 sessions in the smaller variant, whichever comes first.
5. **Owner approval:** required before any experiment goes live.
6. **No concurrent experiments on same surface:** only one experiment per UI component/page at a time.
7. **Freeze guard:** no experiments before 2026-07-03 unless owner explicitly approves the exact scope.

## Implementation
- Registry file: `workspace/experiments/registry.json` (append-only)
- Feature flags: simple `experimentFlags.ts` with server-side cookie-based assignment
- No third-party feature flag service (overkill for current scale)
- Metrics: join with GA4 events and web vitals data

## Current Experiments
None active. Candidates from task board:
- UX-4: PDP + chat trust CRO plan (sticky CTA, trust microcopy)
- Homepage hero variants (seasonal/campaign)
- Search result ranking experiments

All require approval before implementation.
