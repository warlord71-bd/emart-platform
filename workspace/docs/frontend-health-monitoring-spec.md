# Frontend Health Monitoring Spec (UX-ORCH-5)

Version: 2026-06-26-v1
Status: **spec** — provider choice and implementation pending.

## Goal
Monitor real user experience health: web vitals, route errors, unhandled exceptions, API failures, and hydration issues. Surface problems before users report them.

## Metrics to Capture

### Core Web Vitals (RUM)
- **LCP** (Largest Contentful Paint): target <2.5s
- **INP** (Interaction to Next Paint): target <200ms
- **CLS** (Cumulative Layout Shift): target <0.1
- Source: `web-vitals` npm package (already available via Next.js)

### Error Monitoring
- Unhandled promise rejections (`window.onunhandledrejection`)
- Runtime exceptions (`window.onerror`)
- Hydration mismatches (React error boundary catches)
- API failures (fetch/axios interceptor, status ≥500 or timeout)

### Route-Level Health
- Per-route error counts
- Per-route load times
- Last-good timestamp per route

## Provider Options (Owner Decision)

### Option A: Self-hosted (free, privacy-first)
- Capture events via existing `/api/` endpoint → append to local JSONL
- Dashboard: simple script reads JSONL, outputs top errors/slowest routes
- Pro: zero cost, no third-party data sharing
- Con: limited visualization, manual analysis

### Option B: Sentry (free tier: 5K events/mo)
- Next.js SDK with automatic error boundary integration
- Pro: rich error grouping, stack traces, release tracking
- Con: external service, 5K limit may hit on high-traffic days

### Option C: Vercel Analytics (if on Vercel) / PostHog (self-hosted)
- N/A for current VPS deployment (no Vercel)
- PostHog: self-hosted option, but heavy for single VPS

**Recommended:** Option A (self-hosted JSONL) for initial visibility, migrate to Sentry if error volume warrants.

## Implementation Plan

### Phase 1: Web Vitals (freeze-safe, no visible UI change)
```typescript
// apps/web/src/lib/webVitals.ts
import { onCLS, onINP, onLCP } from 'web-vitals';

function reportMetric(metric: { name: string; value: number; rating: string }) {
  if (typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon('/api/vitals', JSON.stringify(metric));
  }
}

export function initWebVitals() {
  onCLS(reportMetric);
  onINP(reportMetric);
  onLCP(reportMetric);
}
```

### Phase 2: Error boundary (freeze-safe, no visible change except on error)
- Wrap `app/layout.tsx` children with error boundary
- Log errors to `/api/errors` endpoint
- Display graceful fallback on route-level crash

### Phase 3: API monitoring
- Intercept fetch in `wooCommerceApi.ts` and BFF routes
- Log slow responses (>5s) and failures (≥500) to health endpoint

## Secret Safety
- No third-party SDK keys committed to git
- API endpoints for vitals/errors require no authentication (append-only, no PII)
- Rate-limit the endpoints to prevent abuse

## Files to Create/Modify
- `apps/web/src/lib/webVitals.ts` (new)
- `apps/web/src/app/api/vitals/route.ts` (new)
- `apps/web/src/app/api/errors/route.ts` (new)
- `apps/web/src/app/layout.tsx` (add initWebVitals call)
