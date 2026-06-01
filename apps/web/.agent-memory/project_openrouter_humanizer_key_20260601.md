# OpenRouter Humanizer Key State - 2026-06-01

The face-cleanser humanizer dry-run attempted on 2026-06-01 failed all 20 model calls with OpenRouter `401 User not found` when using the key from `/root/.openclaw/openclaw.env`.

Implication:
- The `OPENROUTER_API_KEY` in `/root/.openclaw/openclaw.env` and `/root/.openclaw/openclaw.json` is invalid, revoked, or not attached to an active OpenRouter user.
- A different key in `/root/.openclaw/credentials/openrouter_default.json` validated successfully against OpenRouter `/api/v1/key`.
- Using the valid credentials-file key, a one-product dry-run for product `4319` succeeded and appended a valid JSONL row.
- Do not use the stale env/config key for OpenClaw/Codex humanizer runs.

Safe next step:
- Run humanizer generation with the valid credentials-file key or update `/root/.openclaw/openclaw.env` to match the active key.
- Prefer small probes or per-product retries if a 20-product batch stalls; product `3961` still has an API length error and likely needs manual/special retry.
