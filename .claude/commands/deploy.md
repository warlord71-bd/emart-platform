Run the full deploy sequence for emart-platform.

Steps:
1. Run `cd /root/emart-platform/apps/web && npm run build` — fail fast if build breaks
2. Show `git -C /root/emart-platform status --short` and `git -C /root/emart-platform diff --stat` so I can review what will be committed
3. Ask me for a commit message (or suggest one based on recent changes)
4. Commit, then run `bash /root/emart-platform/deploy.sh --no-commit` (since we already committed)
5. Report the smoke test result and whether push succeeded

If any step fails, stop and report — do NOT push to origin.
