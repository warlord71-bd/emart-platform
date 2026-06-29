# Emart Post-Freeze Task Board

Generated: 2026-06-26. Verified: 2026-06-26 (branch audit pass 2).
Sources: TASKS.md, SEO_MASTER.md, DEV_MASTER.md, workspace/content-orchestrator/docs/*,
CONTENT_STANDARD.md, BRAND_GUIDE.md, all local+remote branches,
codebase grep. Zero TODO/FIXME/HACK comments found in source.

> **Priority is the OWNER's decision.** P1/P2/P3 below is a draft
> heuristic only — P1 = unblocks revenue or fixes something broken/risky;
> P2 = compounds growth (SEO, content quality, authority);
> P3 = polish/nice-to-have. Override freely.

---

## DAY-ONE (July 3) — Verified staged and ready to ship

Every branch below was verified to exist via `git branch -a` on
2026-06-26. Branches marked LOCAL-ONLY must be pushed before merge.
Items 7–10 are already deployed or need only a runtime action (no merge).

| # | Task | Branch / artifact | Remote? | What to do |
|---|------|-------------------|---------|------------|
| 1 | DR runbook v2 (socket auth, wp4h_ prefix, R2 byte-match) | `chore/backup-rollback-verify` (1 commit `cee0a7a`) | LOCAL-ONLY | Push then merge |
| 2 | content_gate.py — automated PDP quality checks | `chore/content-gates` (1 commit `3133379`) | LOCAL-ONLY | Push then merge |
| 3 | Read-only drift detection harness (4 scripts) | `chore/verification-harness` (1 commit `0fe0038`) | LOCAL-ONLY | Rebase onto main first (side-effect: deletes RECOVERY.md, modifies api.py + daily_producer.py) then push + merge |
| 4 | 1,445 Bangla descriptions seed corpus (`bangla_corpus.jsonl`) | `content/bangla-archive` (1 commit `61ce4c9`) | **origin** | Merge |
| 5 | PM2 ecosystem.config.cjs env-isolated process definitions | ORCH-5 config ready on main | — | Apply clean restart at maintenance window |
| 6 | Tier-1 category guides + FAQ schema (7 categories) | Already deployed `85b15ad`+`a580709` | — | Validate live; no merge needed |
| 7 | Tier-1 brand editorial (15 brands) | Deployed `40b58df` | — | Owner may refine copy |
| 8 | HyperFrames VPS npm install | VID-6 source ready on main | — | `cd workspace/content-orchestrator/video-engine/hyperframes && npm install` |
| 9 | Reel standard v2 + product-hand reels | VID-4/VID-8 in Telegram review | — | Owner approves → publish |

### Reclassified out of DAY-ONE

| Former # | Task | Reason | New location |
|----------|------|--------|--------------|
| ~~5~~ | SEO audit metadata + face cleansers guide + PDP FAQs | **GHOST** — web commits already merged to main separately (`3578adb`, `c36fb0c`, `972201d`, `49d2fe7`). Remaining mobile commits (13) are parked by owner. Branch is massively diverged, cannot cleanly merge. | ~~fix/mobile-audit-june~~ → web work is DONE; mobile work stays in BLOCKED (X3) |
| ~~schema~~ | feat/schema-completeness | **GHOST** — branch never existed. priceValidUntil/GTIN/MPN shipped to main long ago, confirmed in SEO_MASTER "DONE". | Removed entirely |

---

## BLOCKED / OWNER-DECISION — Cannot proceed without owner action

| ID | Item | Blocker |
|----|------|---------|
| AI-11 | WhatsApp Business API webhook | Meta Business verification REJECTED |
| AI-12 | Facebook Messenger webhook | Meta Business verification REJECTED |
| AI-13 | Mobile app chat screen | Depends on AI-11/AI-12 |
| AI-14 | Conversation analytics | Depends on AI-11/AI-12/AI-13 |
| AI-15 | Bangla language tuning | Depends on AI-10 |
| O-15 | Meta Page publishing (comment permissions) | Missing `pages_manage_engagement` |
| O-16 | TikTok Developer app | Pending TikTok review |
| X3 | Mobile M0: device checkout → EAS → Play Store | Parked by owner; ADB blocked on VPS |
| MOB-BFF | Mobile BFF /api/mobile/cart + /payment 404 | Parked: "EXCEPT MOBILE APP" |
| O-5 | Skin-type pages — confirm whether to build | Owner decision |
| O-14 / L5 | Google-Extended bot policy — keep or block | Owner decision |
| INF-SECRETS | machine-id–based .env.local encryption fragility [INFERRED] | Owner must decide backup key escrow strategy |
| INF-PAY | Payment gateway integration (bKash/Nagad API) [INFERRED] | Owner-owned; COD is only live method |

---

## CLUSTER 1 — SEO & Structured Data

| ID | Task | Source | Effort | Blocked-by | Priority |
|----|------|--------|--------|------------|----------|
| USEO-7 | Fold 2–3 in-body links into humanizer Routine-Fit output | TASKS | S | Humanizer pipeline | P2 |
| USEO-8 | Tier-2 category buying guides (body-wash, shampoos, +5) | TASKS | M | Tier-1 validation | P2 |
| USEO-10 | Improve thin template FAQ answers (top 200 SKUs) | TASKS/SEO_MASTER M4 | L | — | P2 |
| USEO-12 | Category-aware blog label (not blanket "Skincare Guide") | TASKS | S | — | P3 |
| SEO-ORCH-3 | Technical SEO control loop — Qdrant parity, CWV/CrUX, rotating verification | TASKS | M | — | P2 |
| SEO-ORCH-4 | Closed-loop measurement layer (GSC+GA4+GMC+change annotations) | TASKS | L | Ledger (SEO-ORCH-2) | P2 |
| SEO-ORCH-5 | Unified content lifecycle — wire all paths through draft→QA→approve | TASKS | M | — | P1 (risk) |
| SEO-ORCH-6 | URL-policy registry — wire into middleware/metadata/robots/sitemap | TASKS | M | — | P2 |
| SEO-ORCH-7 | Off-page/entity/AEO operations ledger | TASKS | M | — | P3 |
| D6 | GMC 83 disapproved products — fix 1-by-1 by sales potential | TASKS | L | — | P1 (revenue) |
| D8 / USEO-9 | Brand editorial: 387 generic → Tier-2 (15 brands) AI-gen + review | TASKS | M | Tier-1 validation | P2 |
| L4 | H2s missing on /brands, /sale, /new-arrivals | SEO_MASTER | S | — | P3 |
| L6 | Blog content volume — competitor has 400+ articles, we have ~50 | SEO_MASTER | L | Blog generator ready | P2 |
| M6 | Ingredient + concern education refinement + FAQPage JSON-LD | SEO_MASTER | M | — | P2 |
| M9 / O-6 / E3 | Product image gallery expansion (top-100, 3–5 angles) | SEO_MASTER/TASKS | L | Owner photography | P2 (guess) |
| O-2 | /origins editorial — only 3/22 countries have copy | TASKS | M | Owner country list | P3 |
| O-3 | Product comparison pages — curate 20–30 pairs | TASKS | M | Owner pair list | P3 |
| O-4 | "Best [X] in Bangladesh" topics — approve list | TASKS | M | Owner topic list | P3 |
| O-13 | PDP 404 redirect map: 18 review + 52 no-match candidates | TASKS | S | Owner review | P2 |
| SEO-6 | Education content scanability restructure (EducationContent.tsx) | TASKS | M | — | P3 |
| QDR-DRIFT | Qdrant +1 orphan vector cleanup (3625 products vs 3624 vectors) [INFERRED] | Analysis | S | — | P3 |
| SEO-ORCH-2 | Durable SEO work ledger — instantiate JSONL + CLI | TASKS | S | — | P2 |

## CLUSTER 2 — Content (English generation, humanizer, blog)

| ID | Task | Source | Effort | Blocked-by | Priority |
|----|------|--------|--------|------------|----------|
| USEO-11 / X2 | Continue PDP humanizer (~3,503 remaining) | TASKS | L (ongoing) | OpenRouter credits | P2 |
| ENG-861 | 861 majority-Bangla products need English generation pass [INFERRED] | bangla-archive branch | L | Humanizer 5-sample validation | P2 (guess) |
| BLOG-1 | Blog featured images — branded hero per post | TASKS + spec | M | Owner template choice | P2 |
| X11 | Plain-English blog capacity pilot — revision in progress | TASKS | S | — | P3 |
| X10 | Bangla blog anti-slop pilot — owner content review | TASKS | S | Owner review | P3 |
| CO-5 | Content orchestrator `--tick` cron — owner cadence decision | TASKS | S | Owner approval | P3 |
| CO-7 | Wire Judge.me reviews + pa_ingredient resolver to orchestrator | TASKS | M | — | P3 |
| WA-H | Blog generator: verify no new pilots use direct-publish | TASKS | S | — | P1 (risk) |
| Product onboarding | Review-gated apply tool | TASKS | S | — | P3 |
| Hybrid humanizer | 800–1,200 word descriptions (60% auto + 40% LLM) | TASKS | L | Owner review | P2 |
| FAQ generation | 5 Q&A per product, top-200 first | TASKS/SEO_MASTER M4 | L | Owner top-10 review | P2 |
| O-7 | Blog content velocity — generator ready, owner controls pace | TASKS | — | Owner decision | P2 |

## CLUSTER 3 — Bangla / Bilingual Architecture

| ID | Task | Source | Effort | Blocked-by | Priority |
|----|------|--------|--------|------------|----------|
| BANGLA-SEED | bangla_corpus.jsonl (1,445 products) as Bangla-site seed [INFERRED] | content/bangla-archive branch | S (merge) | — | P2 |
| BANGLA-PARTIAL | Partial-Bangla tier (584 products, 10–50%) — keep/rewrite/drop decision [INFERRED] | bangla-archive branch | S (decision) | Owner decision | P2 (guess) |
| ENG-861 | 861 majority-Bangla products need English generation pass [INFERRED] | bangla-archive branch | L | Humanizer 5-sample | P2 |
| AI-15 | Bangla language tuning for chat | TASKS | M | AI-10 | P3 |

> Note: ENG-861 appears in both Content and Bangla clusters because it
> bridges both — the English generation is a content task driven by
> Bangla-architecture discovery.

## CLUSTER 4 — Design System & Tokens

| ID | Task | Source | Effort | Blocked-by | Priority |
|----|------|--------|--------|------------|----------|
| UX-ORCH-4 | Design-system governance — measure + reduce drift | TASKS | L | Freeze lift | P3 |
| UX-ORCH-3 | Visual QA matrix — screenshot capture harness | TASKS | M | — | P2 |
| UX-ORCH-8 | Automated accessibility gates (axe/keyboard/contrast) | TASKS | M | — | P3 |
| UX-4 | PDP + chat trust CRO plan (plan first, no code) | TASKS | M | Owner approval | P2 |
| UX-ORCH-2 | UX event schema & tracking ledger — instantiation | TASKS | S | — | P2 |
| UX-ORCH-5 | Frontend health monitoring (web vitals/RUM/error reporting) | TASKS + spec | M | Provider decision | P2 |
| UX-ORCH-6 | Campaign/promotion orchestration surfaces | TASKS + spec | M | — | P3 |
| UX-ORCH-7 | Experiment/feature-flag registry | TASKS + spec | S | — | P3 |
| UX-ORCH-9 | Customer feedback taxonomy loop | TASKS + spec | M | — | P3 |
| L2 | Critical CSS inlining (critters) | TASKS/SEO_MASTER | M | — | P3 |
| L3 | /brands page 785KB — lazy-load logos or paginate | TASKS/SEO_MASTER | S | — | P3 |

## CLUSTER 5 — Infrastructure & Recovery

| ID | Task | Source | Effort | Blocked-by | Priority |
|----|------|--------|--------|------------|----------|
| WA-G (owner) | Revoke old WP app password + old WC keys; set META_ACCESS_TOKEN | TASKS | S | Owner action | P1 (security) |
| ORCH-5 | PM2 env leak — recreate processes with ecosystem.config | TASKS | S | Next maintenance window | P1 (security) |
| ORCH-6 | Off-server backup + restore drill (Cloudflare R2 live but drill untested) | TASKS + DR plan | M | Owner action | P1 (risk) |
| ORCH-7 | CI test coverage — storefront tests minimal | TASKS | L | — | P2 |
| INF-SECRETS | machine-id–based .env.local encryption — owner decision on key escrow [INFERRED] | RECOVERY.md | S (decision) | Owner | P1 (risk) |
| INF-PM2-REBOOT | PM2 reboot-resurrect live test (pm2 save + startup verified) [INFERRED] | RECOVERY.md | S | — | P1 (risk) |
| GCP-KEY | GCP service account key rotation (ga4-reader + fingerprint ce8b30) | TASKS backlog | S | — | P2 |
| WSC-9 | HyperFrames untracked 655MB — formalize .gitignore or archive | TASKS | S | — | P3 |
| F2 | emart-embed 2.2GB RAM, reranker ~90s cold start | TASKS | M | — | P2 |
| GA4-CHECKOUT | begin_checkout event fires before Zustand cart rehydration | TASKS backlog | M | — | P2 |
| SEO-DESC | getSeoDescription() fallback: product.description first-155-chars | TASKS backlog | S | — | P3 |

## CLUSTER 6 — Launch (payment, apps, omnichannel)

| ID | Task | Source | Effort | Blocked-by | Priority |
|----|------|--------|--------|------------|----------|
| INF-PAY | Payment gateway integration: bKash/Nagad API [INFERRED] | Analysis | L | Owner decision + provider API | P1 (revenue, guess) |
| AI-11 | WhatsApp Business API webhook | TASKS | M | Meta verification BLOCKED | P1 (BLOCKED) |
| AI-12 | Facebook Messenger webhook | TASKS | M | Meta verification BLOCKED | P1 (BLOCKED) |
| AI-13 | Mobile app chat screen | TASKS | M | AI-11/AI-12 | P2 |
| AI-14 | Conversation analytics | TASKS | M | AI-11/12/13 | P3 |
| X3 | Mobile M0: device checkout → EAS → Play Store | TASKS | L | Owner reopen + ADB | P2 (parked) |
| MOB-BFF | Mobile BFF /api/mobile/cart + /payment 404 | TASKS | M | Owner reopen | P2 (parked) |
| O-15 | Meta Page token — comment permissions | TASKS | S | Meta permissions | P1 (revenue) |
| O-16 | TikTok Developer app | TASKS | S | TikTok review | P2 |
| UCP-MCP | Commerce endpoint (gated: reviews > 200) | TASKS backlog | M | Review volume | P3 |
| Review-sentiment | Review sentiment analysis (gated: ≥100 reviews) | TASKS backlog | M | Review volume | P3 |

## CLUSTER 7 — Qdrant / Vector Search

| ID | Task | Source | Effort | Blocked-by | Priority |
|----|------|--------|--------|------------|----------|
| QDR-DRIFT | Qdrant +1 orphan vector cleanup [INFERRED] | Analysis | S | — | P3 |
| SEO-ORCH-3 (Qdrant) | Qdrant↔catalog parity check in technical SEO loop | TASKS | M | — | P2 |
| F2 | emart-embed 2.2GB RAM / cold-start ops | TASKS | M | — | P2 |
| AI-6 | Dynamic search trends + typo correction | TASKS | — | — | ✅ done |
| AI-10 | Chat: Bangla search + model routing | TASKS | — | — | ✅ done |

## CLUSTER 8 — Tooling & Automation

| ID | Task | Source | Effort | Blocked-by | Priority |
|----|------|--------|--------|------------|----------|
| VID-4 | Reel standard sign-off — owner Telegram verdict | TASKS | S | Owner review | P2 |
| VID-8 | Persona/product-hand standard — v2 + generation pending | TASKS | M | Owner review + Codex gen | P2 |
| VID-6 | HyperFrames VPS install | TASKS | S | — | P2 |
| X4 | Social 24h random campaign — paused at owner review | TASKS | S | Owner review | P3 |
| X7 | AI video engine Phase 0 — publish gated | TASKS | S | Owner review | P2 |
| CO-5 | Content orchestrator cron | TASKS | S | Owner cadence decision | P3 |
| GROW-1 | GSC-led topical authority map | TASKS + spec | M | — | P1 (growth) |
| GROW-2 / E1 | Backlink/digital-PR pipeline + BD directories | TASKS/SEO_MASTER | M | Owner outreach | P2 |
| GROW-3 | Cross-platform syndication workflow | TASKS | M | Meta partial, TikTok gated | P2 |
| GROW-4 | Reddit community marketing | TASKS | M | Owner profile | P3 |
| GROW-5 | Trend/news ingestion for blog discovery | TASKS | M | After GROW-1–4 | P3 |
| O-8 / E2 | GBP: claim/verify at Dhanmondi | TASKS/SEO_MASTER | S | Owner action | P1 (entity trust) |
| O-9 / E4 | Social profile bios → link to e-mart.com.bd | TASKS/SEO_MASTER | S | Owner action | P2 |
| O-10 / E5 | Beauty blogger/influencer outreach (5–10 BD reviewers) | TASKS/SEO_MASTER | M | Owner outreach | P2 |
| O-11 / E6 | Structured review collection: 100+ in 60 days | TASKS/SEO_MASTER | M | Owner activation | P1 (trust/revenue) |
| O-12 | Reddit/LinkedIn sameAs — provide real profile URLs | TASKS | S | Owner action | P3 |

## CLUSTER 9 — Product Data Quality

| ID | Task | Source | Effort | Blocked-by | Priority |
|----|------|--------|--------|------------|----------|
| O-1 / AI-8 / C_CONCERN | pa_concern: 279 skincare-like products — owner review | TASKS/SEO_MASTER | M | Owner review | P2 |
| P4.skin | Auto pa_skin_type — proposal/apply ready | TASKS | S | Owner review | P3 |
| P4.ingr | Auto pa_ingredient — proposal/apply ready | TASKS | S | Owner review | P3 |

## CLUSTER 10 — Stack Upgrades (post-freeze, post-validation)

| ID | Task | Source | Effort | Blocked-by | Priority |
|----|------|--------|--------|------------|----------|
| STACK-NEXT | Next.js 14→15 + React 18→19 | DEV_MASTER | L | Full regression test | P3 |
| STACK-TW | Tailwind 3→4 (CSS-first config rewrite) | DEV_MASTER | L | STACK-NEXT first | P3 |
| STACK-ZUS | Zustand 4→5 (API breaking changes) | DEV_MASTER | M | STACK-NEXT first | P3 |
| STACK-AUTH | NextAuth 4→5 (session/JWT rewrite) | DEV_MASTER | L | STACK-NEXT first | P3 |
| STACK-LINT | ESLint 8→9 (flat config, Next 14 incompat.) | DEV_MASTER | M | STACK-NEXT first | P3 |
| STACK-WP | WordPress 6→7 + WooCommerce compat | DEV_MASTER | M | WooCommerce changelog | P3 |
| STACK-ICONS | lucide-react 0.x→1.x (icon rename audit) | DEV_MASTER | S | — | P3 |

---

## DEPENDENCY MAP

```
ORCH-6 (off-server backup)
  └── INF-PM2-REBOOT (pm2 reboot test) — should follow backup hardening
  └── INF-SECRETS (machine-id decision) — fragile key escrow blocks DR

ENG-861 (English generation for 861 majority-Bangla products)
  └── depends on: humanizer 5-sample validation (USEO-11 first batch)
  └── depends on: BANGLA-PARTIAL decision (keep/rewrite/drop 584)

USEO-8 (Tier-2 category guides)
  └── depends on: Tier-1 validation (already deployed, awaiting data)

D8/USEO-9 (Tier-2 brand editorial)
  └── depends on: Tier-1 brand editorial validation (deployed `40b58df`)

SEO-ORCH-4 (measurement layer)
  └── depends on: SEO-ORCH-2 (ledger instantiation)

AI-11/AI-12 (omnichannel)
  └── BLOCKED on Meta Business verification (no workaround except BSP)
  └── AI-13, AI-14, AI-15 all cascade from this

STACK-NEXT (Next.js 15)
  └── blocks: STACK-TW, STACK-ZUS, STACK-AUTH, STACK-LINT
  └── requires: full regression test suite (ORCH-7 helps)

GROW-1 (topical authority map)
  └── feeds: GROW-2 (backlinks), GROW-3 (syndication), L6 (blog volume)

content/bangla-archive (merge)
  └── enables: BANGLA-PARTIAL decision, ENG-861 generation
```

---

## TASK COUNTS

| Cluster | Count |
|---------|------:|
| SEO & Structured Data | 22 |
| Content (English gen, humanizer, blog) | 12 |
| Bangla / Bilingual Architecture | 4 |
| Design System & Tokens | 11 |
| Infrastructure & Recovery | 11 |
| Launch (payment, apps, omnichannel) | 11 |
| Qdrant / Vector Search | 3 (+ 2 done) |
| Tooling & Automation | 16 |
| Product Data Quality | 3 |
| Stack Upgrades | 7 |
| **Total unique tasks** | **100** |
| Blocked / owner-decision gate | 13 |
| DAY-ONE ready (verified) | 9 |
| Reclassified out of DAY-ONE | 2 (ghost branches) |
