# VS Code Remote SSH

This repo now includes a workspace-level VS Code Remote SSH setup so the integrated terminal opens in `/root/emart-platform` and exposes the same Local/VPS paths used by the project workflow.

Available tasks in VS Code:

- `Emart: Local Build`
- `Emart: Sync Local To VPS`
- `Emart: VPS Build`

Open the command palette and run `Tasks: Run Task`, then choose the task you need.

The sync task uses `workspace/scripts/sync-local-to-vps.sh` and preserves the project rule:

1. Build on Local
2. Sync Local -> VPS
3. Build on VPS

It intentionally excludes `.env.local`, build output, git metadata, and local agent/session state.
