---
name: emart-workspace-audit
description: Audit the full Emart workspace, distinguish newly created work from pre-existing changes, and report release risks without modifying anything.
context: fork
agent: emart-release-auditor
---

Audit the current repository state without making changes.

1. Read the project session-start sources required by `AGENTS.md`.
2. Inspect branch/HEAD, staged, unstaged, untracked, ignored, and recent commits.
3. Group files by feature or probable owner; do not assume every dirty file belongs
   to the current request.
4. Identify newly created artifacts and explain their purpose from their content.
5. Run only read-only, proportionate validation.
6. Return release status, risks, blockers, and the safest next action.
