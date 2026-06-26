# Content Orchestrator

The strategy brain above Emart's generation engines. Decides **what content to make, from which
demand signal, toward which sale**, and dispatches native job specs to the existing engines, parked
at the existing approval gates. It never generates creative, never posts, never writes Woo.

Full model: `workspace/docs/claude-reference/content-orchestrator.md`.

## Quick start

```bash
python3 orchestrator.py themes                            # strategy taxonomy (12 selling themes)
python3 orchestrator.py plan --date 2026-06-27 --days 7   # content calendar (dry-run)
python3 orchestrator.py dispatch PLAN-20260627-7d        # native engine job specs (dry-run, gated)
python3 orchestrator.py status                            # dashboard

# manual / owner-triggered one-off — push a specific product or topic into any theme on demand
python3 orchestrator.py manual --theme fast_selling --product-id 23112 \
        --name "The Ordinary Niacinamide" --channels facebook,instagram
python3 orchestrator.py manual --theme free_giveaway --name "Eid Bundle" --no-dispatch

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

`--live-signals` enables read-only Woo/GSC demand resolution. Default is cached files + placeholders.

## Files

- `themes.json` — the 12-theme strategy taxonomy (signal → format → channel → generator → gate → metric → cadence).
- `orchestrator.py` — planner + dispatcher + status.
- `plans/` , `dispatch/` — generated runtime state (gitignored).

## Gates (publishing stays in the existing engines)

- **campaign** → Social Engine plan → owner approve → `meta_schedule.js --publish`
- **campaign (video)** → Video Engine `--tick` builds → `reels_bot.py` Telegram Approve = only publisher
- **content** → content-lifecycle-contract: brief → `blog_generator.py --draft` → QA → owner approve
- **owner** → money/giveaway/price decisions need direct owner sign-off before any asset is built
