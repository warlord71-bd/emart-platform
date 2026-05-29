# Atomic Upgrade Spec Review — 2026-05-29

`CLAUDE-atomic-upgrade.md` is tracked and describes a future branch-only atomic design refactor for Home, PDP, and URL/SEO code.

Current decision:

- Treat it as a future refactor spec, not an instruction to change `main` during the 2026-05-22 to 2026-07-03 SEO stability freeze.
- If used, work only on `feat/atomic-refactor`.
- Phase A must be pure refactor with byte/visual parity: no customer-visible UI, route, URL, redirect, sitemap, navigation, or metadata behavior changes.
- Phase B visual/UX changes must stay behind disabled `NEXT_PUBLIC_FF_*` flags.
- No production PM2 restart or deploy for this spec without explicit owner instruction.

Important correction:

- The spec says Next.js 15, but the current web app uses Next.js `^14.0.0` in `apps/web/package.json`.

Related live verification from the same session:

- Pinterest `p:domain_verify=39735e3185a8389cc1a41436b6068ad5` is already present in `apps/web/src/app/layout.tsx` and live homepage `<head>`.
- Do not add duplicate Pinterest verification tags; owner should select Pinterest's "Add HTML tag" method and verify exact domain `e-mart.com.bd` / `https://e-mart.com.bd`.
