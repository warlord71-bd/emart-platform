# Content Orchestrator — Internal + External Content Generation Model

**Status:** Active strategy layer, created 2026-06-26. Code at `workspace/content-orchestrator/`.
**Goal:** One brain that decides *what content to make, from which demand signal, toward which
sale*, and dispatches it to the engines we already built — parked at the approval gates we already
have. It does **not** post anything or write Woo data. It may create gated model-shot verification
assets under `generated-assets/model-shots/` when a theme explicitly asks for
`model_holding_real_product`.

## 1. Why this layer exists

By 2026-06-26 Emart already had every generation engine: Creative Engine (appearance), Social
Engine (FB/IG plans), Video Engine + HyperFrames (reels), blog generator, humanizer, SEO tooling,
GSC/GA4/GMC signal importers, action ledger, and `measurement_loop`. What was missing was the
**merchandising brain above them** — the thing that knows the owner's selling themes (fast-selling,
clearance, new arrivals, giveaway, reviews, influencer, ingredients, trending, innovation,
doctor-recommended, cosmetics, color cosmetics) and routes each to the right engine on a cadence,
toward revenue. This layer is that brain. It reuses everything below it and only improves an engine
when a real wiring gap shows.

## 2. Pipeline

```
themes.json (strategy taxonomy)
   → demand resolvers (read-only: perf scores, GSC trends, new-arrivals, reviews, categories…)
   → plan        content calendar for a date window               (dry-run, staged in plans/)
   → dispatch    native job specs per engine                      (dry-run, staged in dispatch/)
      → model_shot.py for model_holding_real_product requests      (owner-gated)
   → APPROVAL GATE  (campaign-orchestration-contract / content-lifecycle-contract / owner)
   → existing engine publishes  (social-engine · video-engine reels_bot · blog --draft)
   → action ledger + measurement_loop  (keep / iterate / revert)
```

The orchestrator stops at the gate. Publishing stays exactly where it already lives:
- **social** → Social Engine plan → owner review → `meta_schedule.js --publish`
- **video** → Video Engine `orchestrator.py --tick` builds the reel → `reels_bot.py` Telegram
  Approve is the only publisher
- **blog/SEO** → content-lifecycle-contract: brief → `blog_generator.py --draft` → QA → owner approve

## 3. Internal vs external (the split the owner asked for)

| Surface | Themes | Channels | Engines |
|---|---|---|---|
| **External** (demand → revenue) | fast_selling, clearance, new_arrivals, free_giveaway, reviews, influencer_reco, trending, cosmetics, color_cosmetics | FB, IG, TikTok*, YouTube* | Social + Video (+ Creative Engine appearance) |
| **Internal** (store ops / SEO / support) | ingredients, doctor_reco, innovation, (reviews→PDP quotes) | blog, ingredient/concern pages, AI assistant, PDP | Blog + SEO + humanizer + Creative Engine OG |

\* TikTok/YouTube channels are declared in the taxonomy but gated on app/account approval.

## 4. Theme row = the contract

Each theme in `themes.json` maps **signal → format → channel → generator → gate → metric → cadence**:

```
demand_signal   which read-only resolver feeds candidates
formats         Creative Engine formats it should render (post_1x1/4x5/hero_vertical/scene_*)
channels        where it goes (facebook/instagram/tiktok/youtube/blog/pdp/ai_assistant)
generator       social | video | blog | seo  (or combos: social+video, blog+seo+video)
gate            campaign | content | owner   (which existing contract approves it)
metric          revenue/ctr/add_to_cart/watch_time/impressions… joined later in the ledger
cadence_days    how often the theme is due
per_run         candidates pulled when due
guard           hard rules (no fake urgency, real reviews only, GMC claim safety, persona standard)
```

## 5. Demand resolvers (read-only, degrade gracefully)

| Signal | Source today | Status |
|---|---|---|
| `performance_scores` | `social-engine/performance/latest.json` (GA4+GSC+GMC+Meta join already built) | ✅ live (slug→id resolved with `--live-signals`) |
| `gsc_trending` | GSC striking-distance export | ✅ when export present |
| `reviews_native` | Approved Woo / native magic-link reviews export | wire export file |
| `new_arrivals_woo_date` | Woo `orderby=date` read-only | ✅ live with `--live-signals` |
| `clearance_woo_sale` | Woo `on_sale=true` (reflects REAL sale prices only — empty until owner enables sales) | ✅ live with `--live-signals` |
| `category_catalog` | Woo category pick (makeup/skincare filters, slug→id) | ✅ live with `--live-signals` |
| `concern_catalog` | Woo pa_concern attribute/term pick | ✅ live with `--live-signals` |
| `ingredients_catalog` | pa_ingredient / ingredient pages | TODO |
| `owner_manual` | owner defines prize/rules/dates | by design |

The four Woo resolvers live in `woo.py`, which reuses the Social Engine's read-only `woo_get` client
(one Woo client, one credential source, no writes). Each degrades to a flagged placeholder on any
error, so `--live-signals` never crashes a plan.

Resolvers that can't reach a live signal return placeholder candidates flagged
`source="placeholder"`, so a plan always runs end-to-end and shows exactly how many items have real
demand behind them vs. await wiring. This is the honest, freeze-safe default.

## 6. Commands

```bash
cd workspace/content-orchestrator
python3 orchestrator.py themes                              # show the strategy taxonomy
python3 orchestrator.py plan --date 2026-06-27 --days 7     # build a content calendar (dry-run)
python3 orchestrator.py plan --days 3 --themes fast_selling,trending
python3 orchestrator.py plan --days 7 --live-signals        # resolve real demand from read-only Woo
python3 orchestrator.py dispatch PLAN-20260627-7d [--ledger]  # native job specs (dry-run, gated); --ledger records each item
python3 orchestrator.py status                              # plans + dispatch dashboard

# manual / owner-triggered one-off (bypasses cadence, NOT the gate)
python3 orchestrator.py manual --theme fast_selling --product-id 23112 \
        --name "The Ordinary Niacinamide" --channels facebook,instagram [--llm]
python3 orchestrator.py manual --theme influencer_reco \
        --name "Medicube PDRN Pink Peptide Serum 30ml" \
        --product-image workspace/audit/active/reel-approval-20260629-v6/product-cutouts/01-medicube-pdrn-pink-peptide-serum-30ml-cutout.png \
        --formats model_holding_real_product,hero_vertical,scene_value,scene_brand_end \
        --generator video

# model-shot service status / pending handoff list
python3 model_shot.py --status
python3 model_shot.py --list

# self-improving loop — score themes from ledger outcomes → theme_weights.json
python3 orchestrator.py learn [--llm]
```

`--live-signals` lets demand resolvers make read-only Woo/GSC calls. `--llm` enriches items with an
LLM hook/caption/angle. Without them everything resolves from cached files/placeholders and skips the
model. Nothing in any mode publishes or writes commerce data. `--product-image` attaches an exact
real product source/cutout to persona/model visual jobs; without it, model-shot requests fail closed
as blocked instead of inventing packaging.

## 6c. Model-shot pipe

Themes with `model_holding_real_product` now route through `model_shot.py` during dispatch. The
service writes a machine-readable request under `generated-assets/model-shots/requests/`, a metadata
sidecar under `generated-assets/model-shots/metadata/`, and fulfilled assets under
`generated-assets/model-shots/holding/`.

The safe default is `system_composite`: Creative Engine layers the exact real product image over a
clean persona frame, with no baked-in price, COD, or Emart text. The request also carries a
`codex_imagegen` fulfillment mode for premium manual/Codex generation, but the cron never pretends
Codex ran unless a fulfilled file exists.

Video jobs created from those themes carry:

```
holding_request: true
holding_generation_mode: real_product_composite
model_fallback: false
no_hallucination_product_layer: true
holding_first: true
qa_block_on_vision: true
```

So the worker can render a clean model+real-product first frame, and if the product image is missing
or invalid, the job fails closed before a fake package can enter a reel.

## 6a. Self-improving loop

`learn` reads outcome signals from the action ledger (`workspace/ledgers/action-events.jsonl`),
tallies positive vs. negative outcomes per theme (status `verified/kept/active` vs.
`reverted/degraded`, plus `measurement.decision`), and writes `theme_weights.json` — a per-theme
volume multiplier clamped to [0.5, 2.0]. The planner reads it: `effective_per_run = per_run × weight`.
Themes that convert get pushed harder; themes that revert get pulled back. **Soft per_run weighting is
automatic; cadence changes stay owner-gated.** With no themed outcomes yet, all weights are a neutral
1.0 and the loop says so — it becomes real once dispatched items carry ledger entries (CO-4). This
closes demand → dispatch → gate → publish → **measure → re-weight → demand**.

## 6b. LLM brain (Hermes / OpenRouter free chain / OpenClaw)

`brain.py` is an optional layer that reuses the humanizer's exact OpenRouter setup — **no new secret,
no new account**:
- key: `OPENROUTER_API_KEY` env, else `/root/.openclaw/credentials/openrouter_default.json`
- default: free Gemma/Llama chain (same as the humanizer)
- **Hermes:** `OPENROUTER_MODEL=nousresearch/hermes-...` is tried first when the owner funds paid credits
- **OpenClaw local:** set `OPENCLAW_BASE_URL` (+ `OPENCLAW_MODEL`) to route through a local OpenClaw model

Two jobs: `angle(item)` → hook/bn_hook/caption/angle for a dispatched item; `reflect(stats)` →
advisory theme-tuning notes during `learn`. It degrades to None (no key/lib/network) and the
orchestrator continues without it. The brain never publishes and never writes Woo.

## 7. Safety invariants

- Dry-run by default. Dispatch writes staged JSON only; no engine is invoked to publish.
- Every dispatched job carries its gate (`approval_status=draft`, `status=pending`,
  `status=proposed`) so it cannot skip the owner.
- Model-shot outputs are verification assets until owner visual approval; no model-shot output is
  automatically published.
- No Woo writes, no price/discount creation, no fabricated urgency or testimonials.
- Persona/creator content obeys `creative-persona-standard.md`; health/doctor content obeys GMC
  healthcare-claim rules from D6.
- `plans/` and `dispatch/` are generated runtime state — gitignored, not source of truth.

## 8. Where it improves existing systems (the owner's "improve if needed")

1. **Slug→product_id resolution.** `performance/latest.json` keys some products by slug; Social/Video
   engines want numeric IDs. The `--live-signals` Woo lookup (TODO) closes this; until then candidates
   carry the slug and source flag.
2. **Single demand calendar.** Today each engine has its own ad-hoc daily producer
   (`daily_producer.py`, social `pick`). This layer gives them one shared, theme-driven calendar so
   FB, IG, reels, and blog stop being scheduled independently.
3. **Theme coverage as data.** Adding/retuning a selling angle is a `themes.json` edit, not code in
   four engines.

## 9. Next hardening

- ✅ Four `--live-signals` Woo resolvers (new arrivals, clearance, category, concern) — `woo.py`.
- ✅ Slug→product_id resolution for perf-file candidates (CO-3).
- ✅ `dispatch --ledger` records each item with `sub_category=theme` so the `learn` loop scores it (CO-4).
- ✅ `model_holding_real_product` pipe: dispatch emits model-shot requests, video jobs carry
  no-hallucination composite fields, and daily producer requests model-shot first frames when a real
  product image exists.
- Wire the native review export and a pa_ingredient resolver (remaining placeholder signals).
- Add a `--tick` cron entry (build-only, gated) once owner approves the cadence.
- When owner funds paid OpenRouter credits, set `OPENROUTER_MODEL` to Hermes for higher-quality
  angles; the free chain is the default until then.
