# Social publishing state — 2026-06-21

- Codex generated Emart/AESTURA promo assets now tracked at `workspace/generated-assets/emart-aestura-promo.png`, `apps/web/public/emart-aestura-promo.png`, and `apps/web/public/social/emart-aestura-promo.png`; reusable prompt at `workspace/generated-assets/emart-moisturizer-imagegen-prompt.md`.
- `workspace/content-orchestrator/scripts/active/social_image_gen.py`, `social_publish.py`, and `social_publish.README.md` exist locally but are ignored by `.gitignore` (`workspace/content-orchestrator/scripts/active/*`), so future agents should verify before assuming they are committed source.
- Publishing requires real Meta Page credentials: `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN`, and Instagram business user ID. Pixel/CAPI tokens are not publishing tokens.
- A token was pasted in chat during setup; treat it as exposed and rotate before using production social posting.
- Standalone `/opt/fb-poster` was built outside the repo for Graph API posting tests; it is operationally useful but not tracked project source.
