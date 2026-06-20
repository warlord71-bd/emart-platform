---
name: emart-release-preflight
description: Run the Emart release gate for a precisely scoped change before production deployment or push.
disable-model-invocation: true
context: fork
agent: emart-release-auditor
---

Review the exact change the user intends to release. This skill is a gate, not a
deployment action.

1. Establish the requested file/commit scope and flag unrelated dirty changes.
2. Apply the mandatory checks in `AGENTS.md` and the deployment reference.
3. For SEO changes, read `workspace/SEO_MASTER.md` first.
4. Run appropriate non-mutating validation and describe any test that was not run.
5. Confirm the planned production copy/build/restart/smoke/push sequence.
6. Output PASS, PASS WITH CONDITIONS, or BLOCK. Never deploy or push.
