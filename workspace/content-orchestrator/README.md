# Content Orchestrator

The strategy brain above Emart's generation engines. Decides **what content to make, from which
demand signal, toward which sale**, and dispatches native job specs to the existing engines, parked
at the existing approval gates. It never posts and never writes Woo. The only local asset it may
create directly is a gated model-shot verification/composite under `generated-assets/model-shots/`.

This is also the **one-roof** folder for the content engines:

```text
workspace/content-orchestrator/
  creative-engine/  # real folder
  social-engine/    # real folder
  video-engine/     # real folder
  scripts/          # real folder
  docs/             # real folder
  generated-assets/ # real folder
  social-calendar/  # real folder
  design-changes/   # real folder
  engine_registry.json
  VISUAL_PIPELINE_RULES.md
```

The engine folders and shared stores physically live here. Root-level shortcut links were removed
so the workspace does not show duplicate engine/content entries.

Full model: `workspace/content-orchestrator/docs/claude-reference/content-orchestrator.md`

## Quick start

```bash
python3 orchestrator.py themes                            # strategy taxonomy (12 selling themes)
python3 orchestrator.py engines                           # unified engine roof/ownership map
python3 orchestrator.py plan --date 2026-06-27 --days 7   # content calendar (dry-run)
python3 orchestrator.py dispatch PLAN-20260627-7d        # native engine job specs (dry-run, gated)
python3 orchestrator.py status                            # dashboard

# manual / owner-triggered one-off — push a specific product or topic into any theme on demand
python3 orchestrator.py manual --theme fast_selling --product-id 23112 \
        --name "The Ordinary Niacinamide" --channels facebook,instagram
python3 orchestrator.py manual --theme free_giveaway --name "Eid Bundle" --no-dispatch
python3 orchestrator.py manual --theme influencer_reco \
        --name "Medicube PDRN Pink Peptide Serum 30ml" \
        --product-image workspace/audit/active/reel-approval-20260629-v6/product-cutouts/01-medicube-pdrn-pink-peptide-serum-30ml-cutout.png \
        --formats model_holding_real_product,hero_vertical,scene_value,scene_brand_end \
        --generator video

# self-improving loop — re-weight themes from measured outcomes
python3 orchestrator.py learn                             # writes theme_weights.json (planner consumes)
python3 orchestrator.py learn --llm                       # + advisory LLM tuning reflection
```

`--llm` (on `plan`/`manual`/`learn`) enriches with hooks/captions/angles via `brain.py`, which reuses
the humanizer's OpenRouter free-model chain (no new secret). Hermes: `OPENROUTER_MODEL=...`.
OpenClaw local: `OPENCLAW_BASE_URL=...`. The brain degrades to off if unavailable.

`manual` bypasses the cadence but **never** the approval gate; it builds a one-item plan and
dispatches it straight to native, gated job specs. Override `--channels`/`--formats`/`--generator`
per push; theme guards (real reviews only, no fabricated urgency, GMC/persona rules) still apply.
Use `--product-image` for exact-product visual jobs so model-shot requests have a real source image.

`--live-signals` enables read-only Woo/GSC demand resolution. Default is cached files + placeholders.

## Files

- `themes.json` — the 12-theme strategy taxonomy (signal → format → channel → generator → gate → metric → cadence).
- `orchestrator.py` — planner + dispatcher + status.
- `model_shot.py` — model-holding-real-product request/composite service; outputs stay owner-gated.
- `plans/` , `dispatch/` — generated runtime state (gitignored).

## Gates (publishing stays in the existing engines)

- **campaign** → Social Engine plan → owner approve → `meta_schedule.js --publish`
- **campaign (video)** → Video Engine `--tick` builds → `reels_bot.py` Telegram Approve = only publisher
- **model-shot** → `model_shot.py` emits/fulfills product-in-hand assets → owner visual approval
- **content** → content-lifecycle-contract: brief → `blog_generator.py --draft` → QA → owner approve
- **owner** → money/giveaway/price decisions need direct owner sign-off before any asset is built
