# Content Lifecycle Contract (SEO-ORCH-5)

Version: 2026-06-26-v1
Scope: all content published to e-mart.com.bd (blog, PDP descriptions, category guides, `/best/*`, `/compare/*`, concern/ingredient pages).
Status: **contract** — agents and automation must follow this pipeline. Direct-publish without the pipeline is not permitted.

## Pipeline Stages

```
1. DEMAND   → 2. BRIEF   → 3. DRAFT   → 4. QA   → 5. APPROVE   → 6. PUBLISH   → 7. VERIFY   → 8. MEASURE   → 9. REVIEW
```

### 1. Demand Check
- **Source:** GSC query gaps, blog topic candidates, `striking-distance` output, owner request, or editorial calendar.
- **Required checks:**
  - Cannibalization: no existing page already targets the same primary query.
  - Intent match: the query intent aligns with the content type (transactional → PDP, informational → blog/guide).
  - Volume threshold: minimum impressions or owner override.
- **Output:** topic brief ticket in action ledger (`CONTENT-*` ID, status `proposed`).

### 2. Brief
- **Contents:** primary query, supporting queries, target URL (new or existing), content type, word count range, key products to link, internal link targets, schema type, and acceptance criteria.
- **Cannibalization flag:** if an existing page ranks for the target query, the brief must specify whether to improve that page or redirect.

### 3. Draft
- **Blog:** `blog_generator.py --draft` or `--generate-only`. Saves to `blog_drafts/` for review. Never `status=publish`.
- **PDP humanizer:** humanizer engine generates JSONL reviewed batch; auto-applies only PASS rows (score ≥80, GMC-clean, residue-clean). Already gated.
- **Category guides / `/best/*` / concern / ingredient:** manual or agent-drafted in workspace; reviewed before any WordPress write.
- **Constraints:**
  - No medical claims, price guarantees, or fake urgency.
  - Follow `BRAND_GUIDE.md` tone and `CONTENT_STANDARD.md` structure.
  - No direct AI model attribution ("As an AI...").
  - Bangla content: simple natural Bangla; retain English skincare terms only when Bangla sounds forced.

### 4. QA Gates (all must pass before approval)
- **Factual:** product names, ingredients, origins, prices match current Woo data.
- **Brand:** no invalid brand name variants (see `brand-identity.md`).
- **Claims:** no unverified health claims, no "clinically proven" without source.
- **Links:** all internal links resolve (200 status); no broken/irrelevant links.
- **Schema:** JSON-LD matches content (FAQ, Product, Article as appropriate).
- **Structural:** one H1 (template-level), logical H2/H3 order, answer-first paragraphs, no oversized paragraph blocks.
- **SEO:** meta title ≤60 chars, meta description ≤155 chars, canonical URL is correct.
- **GMC:** no GMC-disapproved language patterns (healthcare claims, identity terms, personal hardship framing).
- **AI residue:** `residue_lint.py` PASS (for humanized content).

### 5. Approval
- **Owner approval required for:** new blog posts, new pages, existing page rewrites affecting >50% of content, any content touching medical/health claims.
- **Agent approval sufficient for:** minor meta description updates, structural formatting fixes, internal link additions, FAQ schema additions.
- **Approval channel:** Telegram message to owner with draft link/preview, or ledger entry with `approval.state = approved`.

### 6. Publish
- **Blog:** WordPress API with `status=publish` ONLY after approval gate passes.
- **PDP content:** Woo meta update via humanizer or manual API call, then `revalidateTag('products')`.
- **Static pages:** code change → build → deploy.sh → VPS build → pm2 restart → smoke test → push.
- **Never:** bypass approval, direct-publish from GSC topic feed, auto-publish experimental content.

### 7. Verify
- **Immediate:** confirm published URL returns 200, metadata renders correctly, schema validates, canonical is correct.
- **Index:** check GSC URL Inspection or indexing status within 48h.
- **Cache:** confirm ISR/CDN serves fresh content (not stale cached version).

### 8. Measure
- **Baseline:** captured in action ledger before change (GSC impressions/clicks/CTR/position + GA4 sessions/conversions).
- **Post-change:** `measurement_loop.py review` at 7d and 28d after publish.
- **Metrics:** organic CTR, clicks, impressions, GA4 engagement rate, bounce rate, conversions.

### 9. Review Decision
- **keep:** metrics improved or stable, content serves intent.
- **iterate:** partial improvement, refine title/content/links.
- **revert:** metrics degraded, revert to previous version.
- **stale:** evidence window expired, re-run measurement.

## Emergency Content Removal
If published content causes a live issue (GMC disapproval, legal/brand complaint, broken page):
1. Revert the content immediately (WordPress draft, git revert, or Woo meta restore).
2. Record in ledger with status `reverted` and reason.
3. Notify owner.

## Current State (2026-06-26)
- Blog generator: `--draft`/`--generate-only` gates exist (WA-H ✅).
- Humanizer: auto-apply gated by PASS score ≥80 + GMC + residue clean.
- No direct-publish path should exist for experimental/untested content.
- Action ledger: instantiated at `workspace/ledgers/action-events.jsonl`.
