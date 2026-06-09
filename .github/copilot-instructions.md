# Emart Copilot Instructions

Stack: Next.js 14, React 18, Tailwind 3, TypeScript. App root: `apps/web`. Frozen until 2026-07-03.

**Brand:** Emart / Emart Skincare Bangladesh. Never write: E-Mart, eMart, Emart BD.

**Never touch without user approval:** checkout · cart · payment · order · stock · price · WooCommerce DB.

**SEO:** all canonical/OG/JSON-LD URLs absolute, base `https://e-mart.com.bd`. Missing product → `notFound()`.

**Deploy:** Local build → commit → rsync → VPS build → pm2 restart → smoke test → push. Never push before smoke passes.

See `CLAUDE.md` for full rules.
