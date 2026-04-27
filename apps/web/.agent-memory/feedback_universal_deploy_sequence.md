---
name: Universal VPS deploy sequence (verify-then-publish)
description: Every project on this VPS uses the same Local → VPS → Repo flow with smoke test before push; canonical reference at /root/CLAUDE.md and /root/AGENTS.md
type: feedback
originSessionId: 897a3d49-6d5e-4da0-8802-309f793d8a47
---
Every project hosted on this VPS — past, present, and future — follows one
canonical release flow. Read it from `/root/CLAUDE.md` (also mirrored to
`/root/AGENTS.md` for non-Claude agents). Don't re-derive the sequence per
project, don't ask the user to confirm it, don't deviate without explicit
opt-in.

**The invariant:** GitHub `origin/main` only ever contains commits that
have been verified live on the VPS. Push is the LAST step, and only after
a smoke test passes.

**The sequence:**

```
1. Edit Local → 2. Local build → 3. Local commit →
4. rsync Local → VPS → 5. VPS build → 6. VPS restart →
7. smoke test → 8. push to Repo  (only if 7 OK)
```

**Why:** User set this rule on 2026-04-26 after a session where I almost
shipped stale source files because I switched VPS branches without
verifying. Live site only survived because pm2 hadn't been restarted. The
deploy sequence formalizes the invariant — Repo never contains code that
isn't running on the VPS — and the file at `/root/CLAUDE.md` makes it
universal so any agent (Claude, codex, cline, etc.) working on any project
under this VPS picks it up automatically without needing to be told.

**How to apply:**
- At session start, if working with deploy-able code, read `/root/CLAUDE.md`
  to refresh the rules.
- For any project on this VPS, the Local tree is wherever the developer
  edits (often `/root/<project>`), the VPS runtime tree is wherever the
  process serves from (often `/var/www/<project>`), and the Repo is `origin/main`.
- For non-web projects (Node services, Python apps, WP mu-plugins), step 5 is
  whatever the project builds with; step 7 is the appropriate health probe.
- When the user wants a "deploy" command, give them the reference shell
  function in `/root/CLAUDE.md` adapted to the project's paths/build/PM2 name.
- The hard rules (no force push without approval, no `git checkout` on VPS
  without rev-parse check, no `pm2 restart` with dirty working tree) are
  non-negotiable. Even if the user says "just push", the smoke-test guard
  protects them from a regression they'd otherwise blame the LLM for.
