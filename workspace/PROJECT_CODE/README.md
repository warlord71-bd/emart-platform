# Project Code Folder

This folder is the code-side entry point for the E-Mart project.

It contains compatibility links to the runtime source and helper code:

- `apps` - web, mobile, and presence-server application source
- `packages` - shared packages
- `scripts` - operational/audit scripts
- `nginx` and `nginx-*.conf` - server config references
- `AGENTS.md`, `CLAUDE.md`, `package-lock.json`, `gitignore` - project control/config files

Do not move the real `apps/` or `packages/` directories into this folder. The live deploy/build workflow expects their existing root paths.
