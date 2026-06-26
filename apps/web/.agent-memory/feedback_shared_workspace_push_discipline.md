# Shared Workspace Push Discipline

When the owner asks for work to be committed, live, and pushed, remember that this environment's publish path is auto-gated. The push is not something to "hold" after verification; the gated deploy sequence pushes only after the local build, VPS build, live smoke, and SEO/AEO checks pass.

Required discipline:

- Check `git status --short` and identify which files belong to the current job.
- Stage only the current job's files or exact hunks; never use broad `git add -A` in a dirty shared tree.
- Leave unrelated modified/untracked files untouched unless the owner explicitly asks to clean them.
- Use the repo's gated deploy/push path for deployable work; do not replace it with a manual "wait because workspace is dirty" rule.
- If the gated sequence passes and pushes, treat that as verified-live. Do not re-block the task because unrelated dirty files exist.
- Report unrelated dirty files separately so the owner knows they were intentionally left alone.

If a generated artifact is part of the requested evidence or review pack, either commit it deliberately with `git add -f` when ignored, or move it to attic if the owner asks to clear generated output.
