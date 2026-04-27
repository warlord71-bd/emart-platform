---
name: Never leave a job half-finished due to token budget
description: Estimate token cost before starting a multi-step task; if it won't fit, decline up front rather than abandoning mid-execution
type: feedback
originSessionId: 897a3d49-6d5e-4da0-8802-309f793d8a47
---
Never start a multi-step task you cannot finish within the remaining session budget. If the work won't fit, refuse it at the start with a clear "this needs N tokens / N more turns to do safely, want to split it" rather than starting and stopping halfway.

**Why:** User explicitly set this rule on 2026-04-25 after a session ended mid-batch (Footer signup tabs + commit + push) requiring a fresh resume. Half-finished states are worse than not starting — the next session has to re-derive context, the working tree is in an inconsistent state, and the user can't tell what's done vs in-flight.

**How to apply:**
- At the start of any multi-step request, estimate the work in turns (recon + edits + build + commit + push + report). If it's clearly > 30% of remaining context, surface that BEFORE picking up tools and ask whether to scope down.
- If accepted, complete every step in the batch including build verification, commit, push, deploy/restart, and final report — don't stop at any intermediate point even if the user goes quiet.
- If a partial completion is unavoidable (a tool fails, a network hangs), finish what's recoverable in the current turn and explicitly say "I left X half-done, here's how to resume" rather than implying success.
- Build/commit/deploy are part of the task — never end a session with an unbuilt edit, an uncommitted edit, or a built-but-not-deployed change unless the user explicitly said "stop before commit" or "stop before deploy."
- **When resuming after a context-window break** (i.e. I personally left work unfinished in a prior turn): do NOT silently restart the in-flight steps. First report the held state ("build passed but nothing committed/pushed/restarted yet — these N files are touched: X, Y, Z; codex may have touched others") and wait for explicit go/no-go. The user needs the chance to redirect — codex may have moved the codebase, or priorities may have changed. Auto-resuming silently is itself a form of half-finishing because it can clobber concurrent work.
