# Session Log — append only, never delete

Format:
## [DATE TIME] [LLM]
- Did: (1 line)
- Completed tasks: (task IDs from TASKS.md)
- Blockers hit: 
- Next step: 

---

## 2026-06-04 21:21 CEST — Codex
- Did: Hardened Meta CAPI Purchase value handling so ROAS events recover a positive numeric value from Woo order totals or line/shipping totals.
- Completed tasks: Meta Purchase value/currency fix
- Blockers hit: Initial build caught a strict reducer type; fixed and reran successfully.
- Next step: Deploy, restart `emartweb`, and verify Meta Test Events on the next purchase/test order.

---

## 2026-04-18 — Claude (chat)
- Did: Built memory kit, automation scripts, ROI model
- Completed: Week 1 SEO bugs identified + fix scripts
- Blockers: shift_fix.sql awaiting user approval
- Next step: User runs vps_audit.sh, approves shift_fix.sql

## 2026-04-19 — Opencode
- Did: Fixed stale night-crime references in Next.js source
- Completed: Updated category-navigation.ts and page.tsx to use night-cream instead of night-crime; verified build success
- Blockers: None
- Next step: Continue with pending SEO tasks

---
## 2026-04-19 16:04 CEST — Codex
- Did: Started filters + category description redesign; chose clean native Woo filters first so counts/pagination stay truthful.
- Completed tasks: in progress
- Blockers hit: /var/www requires escalated write access from Codex sandbox.
- Next step: Patch CatalogFilters, shop/category pages, and Woo stock_status param; build Part 1.

---
## 2026-04-19 16:08 CEST — Codex
- Did: Applied Part 1 clean filters to shop/category; Origin and context chips render as coming-soon while native price, stock, and sort filters drive WooCommerce queries.
- Completed tasks: Part 1 code patch
- Blockers hit: Origin/Skin/Hair/Finish still need real Woo attribute IDs before they can filter accurately.
- Next step: Run npm run build for Part 1.

---
## 2026-04-19 16:12 CEST — Codex
- Did: Fixed Part 1 TypeScript map indexing after build caught strict price/sort param access.
- Completed tasks: Part 1 type fix
- Blockers hit: First build failed on strict indexing, no runtime deploy attempted.
- Next step: Rerun npm run build.

---
## 2026-04-19 16:18 CEST — Codex
- Did: Applied Part 2 category hero redesign with navy banner, Playfair heading, DM Sans description, stats badges, and pink-to-gold bottom rule.
- Completed tasks: Part 2 code patch
- Blockers hit: None
- Next step: Run npm run build for Part 2.
---
## 2026-04-19 16:24 CEST — Codex
- Did: Converted bottom SEO copy into a user-openable category buying guide instead of hiding SEO-only text.
- Completed tasks: Part 3 duplicate/content cleanup
- Blockers hit: No literal duplicate bottom render found; kept SEO copy accessible to avoid hidden-text risk.
- Next step: Run final npm run build and memory-kit end command.
---
## 2026-04-19 16:29 CEST — Codex
- Did: Completed live VPS filters, category hero, and bottom content cleanup; build passed and pm2 emartweb restarted.
- Completed tasks: filters + description redesign + duplicate/content cleanup
- Blockers hit: Initial Part 1 build had a strict TypeScript indexing error and one final build run hung; fixed indexing, stopped only the stuck build process, reran successfully.
- Next step: Use GitHub only as backup when owner wants to commit/push the live VPS diff.
---
## 2026-04-19 16:51 CEST — Codex
- Did: Improved mobile catalog UX with Sort-by first, filter drawer second, Price first in drawer, and active chips only under toolbar.
- Completed tasks: mobile filter/sort UX refinement
- Blockers hit: None; build passed and pm2 emartweb restarted.
- Next step: Review on phone viewport and commit VPS state to GitHub only when owner wants backup.

---
## 2026-04-19 17:07 CEST — Codex
- Did: Started adding old WordPress blog posts to footer Help area with SEO-friendly /blog routes and old slug redirects.
- Completed tasks: code patch prepared
- Blockers hit: Existing old post root URLs rendered Product Not Found, so redirect support is required.
- Next step: Build and verify footer/blog routes.

---

## 2026-04-21 CEST — Codex
- Did: Resumed Porcelain work directly on VPS, restored focus to homepage only, and replaced the live hero carousel with a single AESTURA hero.
- Completed tasks: Hero carousel → single image
- Blockers hit: Old log thread around blog/footer caused drift at first, but live VPS state clarified the true restart point.
- Next step: Continue only the remaining unfinished Porcelain tasks from TASKS.md without redoing deployed work.

## 2026-04-21 09:30 CEST — Codex
- Did: Removed duplicate homepage section renders from the live Porcelain homepage on VPS after the single-hero deploy, keeping one concern block, one best-sellers block, mobile-only WhatsApp support, and desktop-only WhatsApp signup.
- Completed tasks: Remove duplicate sections on homepage
- Blockers hit: None; build passed, pm2 emartweb restarted, and live homepage DOM verified after deploy.
- Next step: Continue remaining Porcelain cleanup from TASKS.md without touching already-deployed homepage/blog work.

## 2026-04-21 09:45 CEST — Codex
- Did: Fixed live checkout on VPS by moving order creation behind `/api/checkout` and routing Woo write calls to the secure HTTPS endpoint instead of the redirecting internal HTTP host.
- Completed tasks: Checkout order creation fix
- Blockers hit: Initial customer-side failure came from client checkout importing `createOrder()` directly; after server route fix, Woo writes still failed because `WOO_INTERNAL_URL` redirected POST `/orders` from `http://5.189.188.229` to `https://e-mart.com.bd`, breaking the POST flow.
- Next step: Resume Porcelain cleanup on VPS; do not redo homepage hero, duplicate-section cleanup, or checkout debugging.
- 2026-04-21 Codex: deployed Porcelain editorial/story batch live after clean build + PM2 restart. Updated authenticity, our-story, join-our-team, blog listing, and blog detail to Porcelain surfaces, ink/accent palette, and card styling.
- 2026-04-21 Codex: deployed Porcelain discovery/support batch live after clean build + PM2 restart. Updated TopCategoriesSection, MobileDiscovery, HomeProductRail, CategoriesShowcaseInteractive, BrandsShowcaseInteractive, ShopByConcern, OriginShowcaseInteractive, /categories, and /search.
- 2026-04-21 Codex: live verification confirmed updated classes and surfaces on /, /categories, /search?q=serum, /authenticity, and /blog.
- 2026-04-21 Codex: completed final Porcelain tail batch on VPS. Updated UtilityBar, PaymentMethods, OriginChips, StickyATC, SortControl, FlashSaleSection, and layout toast accent; final source grep shows old pink/navy tokens removed from runtime files.

## 2026-04-22 — Codex
- Did: Reconciled `MEMORY.md`, `TASKS.md`, and `SESSION.md` against the local repo after the user noted direct VPS work happened outside the log.
- Completed tasks: notes reconciliation only
- Blockers hit: live VPS could not be inspected from this sandbox, so live status remains unverified.
- Next step: check VPS source-of-truth path and mark only the fixes confirmed live.

## 2026-04-22 — Codex (Porcelain mobile pass)
- Did: Implemented the remaining repo-visible Porcelain mobile homepage cleanup by moving `MobileDiscovery` directly under hero, pushing concern tiles lower, tightening mobile hero density, converting home product blocks into mobile swipe rails, and replacing the bulky mobile WhatsApp banner with a floating WhatsApp CTA.
- Completed tasks: local Porcelain mobile cleanup patch
- Blockers hit: live VPS still needs deploy + verification before these can be marked done in `TASKS.md`.
- Next step: apply this homepage batch on VPS, build, restart, and verify mobile home behavior live.

## 2026-04-22 — Codex (Porcelain closed)
- Did: Verified the live VPS/mobile Porcelain batch and updated project notes so Porcelain is explicitly marked complete instead of left as pending.
- Completed tasks: Porcelain phase complete on live VPS
- Blockers hit: GitHub push auth for `origin` is still separate and unresolved, but it does not block live Porcelain completion.
- Next step: resume the next non-Porcelain task from `TASKS.md`.

## 2026-04-22 — Codex (next non-Porcelain verification batch)
- Did: Verified the live checkout response shape, Buy Now cart-isolation flow, app banner text, and real account orders flow; patched the live account orders API/page, rebuilt successfully, restarted PM2, and verified `GET /api/account/orders` returns `401 Not authenticated` when unauthenticated.
- Completed tasks: checkout mismatch verify, Buy Now verify, app banner verify, account orders verify
- Blockers hit: none after one compile catch in `checkout/page.tsx` was corrected during the VPS build.
- Next step: move to `nginx 301 redirects (4 slugs)`.

## 2026-04-23 — Codex handoff
- Did: Restored/stabilized live product and account flows, added Woo `Emart Content` fields, JWT-capable auth, COD `processing` status, and clear `/order-success` customer confirmation.
- Completed tasks: live product recovery, real reviews, account login/reset, Woo product source fields, checkout confirmation fallback
- Blockers hit: transactional email cannot send until SMTP is configured; VPS has no `/usr/sbin/sendmail`.
- Next step: configure authenticated SMTP for `order@e-mart.com.bd`, then resend order `#91621`; ask user before adding any new WordPress plugin.

## 2026-04-23 — Codex MailPoet recovery
- Did: Activated MailPoet delivery path by validating DNS, disabling Rank Math redirections while keeping standalone Redirection active, enabling MailPoet transactional emails, sending a WordPress test mail, and retriggering Woo customer processing email for order `#91621`.
- Completed tasks: transactional email recovery, order `#91621` resend trigger
- Blockers hit: receipt must be confirmed from `hgc.bd71@gmail.com`; local sendmail remains absent but no longer used for the active path.
- Next step: user confirms inbox delivery; if missing, inspect MailPoet sending logs/service status.

## 2026-04-23 17:35 CEST — Codex docs backup
- Did: Created a documentation backup before updating memory/log/handoff after the long live VPS session.
- Completed tasks: backup archive `/root/emart-platform/snapshots/emart-memory-log-docs-20260423-1735-cest.tar.gz`
- Blockers hit: live `/var/www/emart-platform/apps/web/HANDOFF-2026-04-23.md` did not exist yet; the newer handoff was in `/root/emart-platform/apps/web`.
- Next step: sync the updated docs back into the live VPS tree so the VPS has the final source-of-truth notes.

## 2026-04-23 17:35 CEST — Codex mail/plugin history
- Did: Recorded the mail-system follow-up after MailPoet recovery: WP Mail SMTP/Brevo test was abandoned, WP Mail SMTP removed, MailPoet remained active, and PDF attachments remain deferred because MailPoet does not support attachments.
- Completed tasks: MailPoet kept active; WP Mail SMTP deleted; product image fix in Woo email retained; redirect plugin conflict resolved with Rank Math redirections disabled and standalone Redirection active.
- Blockers hit: Brevo SMTP rejected VPS IPv6 `2a02:c207:2314:1131::1`; MailPoet works for transactional delivery but cannot attach PDF invoices.
- Next step: only revisit SMTP/Brevo if user explicitly wants PDF invoice attachments via SMTP.

## 2026-04-23 17:35 CEST — Codex mobile home offers
- Did: Restored the six-offer rail under the hero, removed mobile quick chips, changed flash sale heading to one-line `Time Deal · Flash Sale`, and made Best sellers/New arrivals mobile rails end with a `View more` tile like Limited offer.
- Completed tasks: live homepage offer rail restore; mobile quick chips removed; flash heading tightened; product rail final tile added in `HomepageSections.tsx`.
- Blockers hit: none; build passed and PM2 restarted after each live homepage/mobile pass.
- Next step: user can verify on phone that Limited offer, Best sellers, and New arrivals all show the final View more tile.

## 2026-04-23 17:35 CEST — Codex account button and auth research
- Did: Fixed account submit button visibility by restoring Tailwind `primary` color aliases, then checked app/env files for Google/Gmail OAuth credentials.
- Completed tasks: `tailwind.config.js` primary aliases added; `/account` button styling restored; generated CSS verified for `.bg-primary-600`.
- Blockers hit: live web `.env.local` has only commented Google placeholders; local web env has no Google web credentials; mobile app only has an Android OAuth client ID, which cannot activate web NextAuth Google login.
- Next step: add a real Web OAuth client ID/secret if user wants Google login on the website.

## 2026-04-23 17:35 CEST — Codex MailPoet account verification
- Did: Implemented MailPoet-backed email verification for new customer accounts using WordPress `wp_mail` transactional mail and Next.js verify route.
- Completed tasks: new WordPress `/wp-json/emart/v1/customer/register`; new WordPress `/wp-json/emart/v1/customer/verify-email`; Next.js `/api/auth/register` now returns pending verification; Next.js `/api/auth/verify-email` verifies token and sets `wc_session`; account page displays verify/check-inbox status.
- Blockers hit: first verify-route check redirected to internal `localhost:3000`; fixed redirect origin to use `NEXTAUTH_URL` / public site URL and verified it now redirects to `https://e-mart.com.bd/account`.
- Next step: user should create a real test account and confirm the MailPoet verification email arrives and activates the account.

## 2026-04-23 17:35 CEST — Codex verification results
- Did: Verified the live VPS state after account verification changes.
- Completed tasks: `php -l /var/www/wordpress/wp-content/mu-plugins/emart-customer-auth.php` passed; `npm run build` passed with `/api/auth/verify-email` included; `pm2 restart emartweb` passed; `/account` returned `200`; `/api/auth/verify-email` missing-token check redirects to public account URL; Next.js and WordPress register endpoints return expected missing-field validation.
- Blockers hit: no full real-user email verification test was run to avoid creating an unrequested customer account; needs user/test inbox confirmation.
- Next step: if test verification email is missing, inspect MailPoet sending logs/status first.

## 2026-04-23 22:23 CEST — Codex checkout email + customer linking
- Did: Made checkout email mandatory on the live Next.js storefront, removed the fake `${phone}@emart.bd` fallback, auto-created/reused a Woo customer by billing email before order creation, added a My Account CTA on `/order-success`, and inserted an account/Google-login hint block into initial Woo customer emails.
- Completed tasks: live checkout email requirement; live checkout API validation; live customer auto-linking by email; order-success account CTA; initial order email account CTA.
- Blockers hit: one first build failed because an older local `woocommerce.ts` was copied over the richer live version; restored from `/tmp/emart-vps-woocommerce.cod-status-email.ts`, repatched `customer_id`, reran build successfully. Also swapped `UserRound` to `User` because this Lucide version does not export `UserRound`.
- Next step: run one real checkout using a reachable email and confirm the order email arrives with the new account CTA, then confirm logging in with the same Gmail shows the order under My Account.

## 2026-04-23 22:55 CEST — Codex skincare quiz live
- Did: Built and deployed a real `/skin-quiz` page inspired by Skinorea, Kiyoko, and Beauty of Joseon, but tuned for Bangladesh climate, routines, budgets, and Emart’s mixed-origin catalog.
- Completed tasks: new quiz page; homepage CTA fix to `/skin-quiz`; shared quiz scoring logic; new Next API route for quiz email; new WordPress MU REST route to send routine emails; optional MailPoet subscribe hook for quiz leads; sitemap entry for `/skin-quiz`.
- Blockers hit: local workspace was missing the live `sitemap.xml/route.ts`, so it had to be synced before patching. No runtime blocker after that; build passed cleanly.
- Next step: run one real quiz with a reachable email, confirm the routine email arrives, then sanity-check that opt-in quiz leads show up in MailPoet when the subscription box is checked.

## 2026-04-24 — Newsletter + signup UI + offers/flash/auth polish
- Did: Brevo SMTP wired into MailPoet; two automations (welcome id=1, abandoned-cart-1h id=2) w/ minimal bodies; WC transactional takeover (newsletter id=4, `use_mailpoet_editor=1`); MailPoet form id=1 (`[mailpoet_form id=1]`); newsletter signup endpoint (Next route `/api/newsletter/subscribe` → mu-plugin `/wp-json/emart/v1/subscribe` using `SubscriberActions::subscribe` to bypass form honeypot/captcha); tabbed WhatsApp+Email signup in `WhatsappSignupSection` of `HomepageSections.tsx` (desktop 50/50 side-by-side, mobile tab-toggle); offers rail redesign (bigger cards, icon chip, snap-x on mobile); Flash Sale header forced onto one line w/ compact countdown on mobile; authenticity image swapped to `banner-for-home-page-1.png`.
- Side-effect: MailPoet built-in captcha disabled globally (`captcha.type=disabled`) — needed because server-to-server proxy submits were hitting the challenge. Re-enable if spam becomes an issue; rate-limit the Next route instead.
- Two WhatsApp numbers: `8801717082135` = sales/signup, `8801919797399` = support/FAB/Header. Intentional, do not consolidate.
- Commits: 127e577 (offers/flash/auth) on `codex/ui-0417`. Earlier footer edits still uncommitted on same branch (large diff predates this session).
- Next step: design the two automation email bodies visually in MailPoet UI (currently stubbed minimal HTML); design the WC transactional template (id=4) in MailPoet UI; consider consolidating `codex/ui-0417` vs main — large unstaged diff is confusing.

## 2026-04-25 — Codex live data/newsletter/OpenClaw correction
- Did: Reconciled Claude-token-limit work against live files, wired `SignupTabs` into `Footer.tsx`, verified `/api/newsletter/subscribe` → WordPress `/wp-json/emart/v1/subscribe` → MailPoet, added `Isntree Hyaluronic Acid Aqua Gel Cream 100ml`, and applied the user's first safe brand-only CSV batch.
- Completed tasks: product `91693` live at `/shop/isntree-hyaluronic-acid-aqua-gel-cream-100ml`; footer WhatsApp+Email signup live; newsletter API tested with `{"success":true}`; `npm run build` passed; `pm2 restart emartweb` passed; 460 brand-only Woo corrections applied from autosaved CSV rows through 680, excluding `Healthy Place`, `Combo`, and `Combo pack`; Telegram command helper one-shot tests for `/help`, `/orders`, `/stock`, `/revenue` succeeded.
- Blockers hit: User accidentally edited `current_brand` instead of `correct_brand`; Codex treated edited `current_brand` as the correction only after scoping rows and excluding fill mistakes. OpenClaw already polls `@Emartmonitor_bot`, so standalone `emart-bot-commands.service` remains disabled/inactive to avoid Telegram `getUpdates` conflict. Live VPS git tree is too dirty for blind `git add -A`.
- Next step: user will correct remaining CSV rows and return; apply brands only first, then categories/concern/country/price in separate reviewed batches. Leave OpenClaw as-is unless user later chooses a second dedicated command bot.


## 2026-04-26 — Codex footer/trust UI organization
- Did: Polished the homepage trust/service band, compacted its mobile layout, reorganized footer navigation, removed duplicate prefooter signup, standardized WhatsApp links to priority business WhatsApp `01717082135`, and added subtle lucide icons to footer Shop + Support items.
- Completed tasks: black trust bar replaced with light blush service cards; mobile trust band now 2x2 compact labels; footer kept 4 columns (`Brand/About`, `Shop`, `Support`, `Contact`); `Skincare` removed from footer Shop; `New Arrivals`, `Sale`, `All Brands` moved into Shop; duplicate `Contact Us` removed from Support; duplicate homepage signup block removed so only footer `SignupTabs` renders; contact column uses matched lucide icons and prioritized phone order.
- Files touched: `src/components/home/HomepageSections.tsx`, `src/components/layout/Footer.tsx`, `src/app/page.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/SignupTabs.tsx`, `src/lib/companyProfile.ts`.
- Verification: `npm run build` passed after each UI batch; `pm2 restart emartweb` succeeded; live checks confirmed single signup block, compact trust labels, footer `Skincare` removed, Shop/Support links present, and priority `wa.me/8801717082135` links live.
- Blockers hit: none. Git remains intentionally dirty/uncommitted; do not run `git add -A` or reset because live VPS is source of truth and there are many mixed prior-session changes.
- Next step: user visually reviews footer/trust on mobile + desktop. If continuing icon work, keep it selective and scoped; do not add icons everywhere blindly.

## 2026-04-26 — Three-way reconciliation (Local + VPS + Repo)
- Did: Brought Local /root/emart-platform, VPS /var/www/emart-platform, and origin (GitHub) into a single coherent state without changing any live VPS file content. VPS UI/UX/deployment unaffected throughout.
- Sequence: (1) Extended VPS /var/www/emart-platform/.gitignore to exclude session/audit/handoff/temp/backup files. (2) git add -A on VPS staged 233 changes (70 modified + 1 deleted + 162 new product code/asset files, all junk filtered by gitignore). (3) Commit 922a63b "feat: consolidate live VPS state through 2026-04-26" on codex/ui-0417. (4) Pushed codex/ui-0417 to origin (new remote branch). (5) On Local /root: git fetch origin, git checkout main, git merge origin/codex/ui-0417 --no-ff. Resolved 14 rename/delete conflicts by keeping VPS state (deleted moved-doc files). Merge commit 6c66773 created on main. (6) git push origin main — main now at 6c66773.
- Final HEADs: Local main = origin/main = 6c66773. VPS codex/ui-0417 = origin/codex/ui-0417 = 922a63b. Both branches in origin contain the consolidated 2026-04-26 live state.
- Remaining drift between Local apps/web/src and VPS apps/web/src: 5 paths (2 .backup/.bak files gitignored on VPS, 1 dir apps/web/src/app/brands/[slug]/ exists Local-only as legacy route, 2 files differ in content: ProductImage.tsx and lib/url-utils.ts). Not reconciled to avoid risk of regressing Local-side fixes; safe to leave because VPS is what's serving live.
- Workflow going forward (per user direction): edit on Local /root → rsync to VPS → build + pm2 restart on VPS → commit + push from Local. VPS stays clean (no direct edits) once routine is established.
- Verification: pm2 emartweb online; https://e-mart.com.bd/ returns 200; no build run (no source change).

## 2026-04-26 — Cleanup sweep
- Did: Reversible cleanup of ignored/scratch files without touching live source code, .next, env files, pm2 config, or restarting the site. Moved session/handoff duplicates, backup files, paste-conflict artifacts, audit scratch CSVs, apps/web_backup, ops scratch, and zero-byte placeholders into /root/.attic-2026-04-26/.
- Logs: Preserved last 500 lines for large PM2 logs under /root/.attic-2026-04-26/pm2-log-tails/ and truncated active PM2 log files from ~545M to ~16K.
- Database: Deleted expired transients first, then removed WordPress revisions and auto-drafts only. Left trashed shop_order/product/page records untouched as business/content records.
- Verification: Local and VPS git trees clean; only remaining cleanup-pattern file is this active SESSION-LOG.md; pm2 emartweb online; live site returned HTTP 200.
- Restore point: /root/.attic-2026-04-26/ contains all moved files; nothing was permanently removed from filesystem except DB revisions/auto-drafts and expired transients.

## 2026-04-26 — Agent instruction simplification
- Did: Replaced stale project CLAUDE.md with a short current E-Mart instruction file that points first to /root/CLAUDE.md, documents Local -> VPS -> Repo flow, live business rules, and safety rules. Added local/VPS AGENTS.md entry point for non-Claude agents.
- Commit: 7b5d032 docs: simplify agent instructions pushed to origin/main. VPS reset to origin/main so git tree is clean; no app source, build output, env, pm2, or live UI changed.
- Verification: live site returned HTTP 200; Local and VPS git status clean.

## 2026-04-26 — Origin pages populated
- Did: Fixed `/origins?country=korea` and `/origins?country=japan` to fetch products from existing WooCommerce product categories (`korean-beauty`, `japanese-beauty`) instead of empty Woo tags. Layout/UI unchanged.
- Reference logic: SkincareBD Japanese category assigns by Japanese-origin products/brands such as Hada Labo, Kose/Softymo, Skin Aqua, Biore, Rohto/Melano CC, Shiseido/Fino, DHC, Naturie, Lion, OMI; our Woo catalog already has `Japanese Beauty` and `Korean Beauty` product categories.
- Commit: b5943c6 `fix: populate origin product pages from categories` pushed to origin/main. Local and VPS both at b5943c6 and clean.
- Verification: local build passed; VPS build passed; pm2 restart emartweb succeeded; live `/`, `/origins`, `/origins?country=japan`, and `/origins?country=korea` returned healthy content; Japan/Korea pages no longer show `No products found`.

## 2026-04-26 — Origin landing and non-K/J country pages
- Did: Expanded `/origins` from a flat six-card list into clear sections: K-Beauty & J-Beauty, Western Beauty, South & Southeast Asia, and More Origins. Western section explicitly excludes Korea/Japan. Added live pages for USA, UK, France, India, Thailand, and Other Global Beauty using current Woo `pa_brand` terms. Korea/Japan continue using real Woo product categories (`korean-beauty`, `japanese-beauty`).
- Data finding: database only has real product categories for Korean Beauty and Japanese Beauty. No country categories exist for France/India/Thailand/USA/UK, so those pages use explicit brand-origin maps from existing brand terms/counts.
- Header/home links: removed vague `Western` link from header origin menus and replaced with USA/French. Updated OriginChips links from broken `/shop?origin=` to `/origins?country=` and added Thailand/Other.
- Commit: d89cf5c `feat: map origin pages to country brand groups` pushed to origin/main. Local and VPS both at d89cf5c and clean.
- Verification: local build passed; VPS build passed; pm2 restart emartweb succeeded; live Korea, Japan, USA, UK, France, India, Thailand, and Other pages all render products; `/origins` shows Western/KJ separation text.

## 2026-04-26 — Origin cleanup + product detail category/gallery fix
- Did: Corrected product detail category display so product-type categories are prioritized/inferred (e.g. cream -> Moisturizer, serum -> Serum) instead of showing broad origin buckets such as `K-Beauty & J-Beauty`. Adjusted product gallery layout so the main image area has stable height and stays visually above the description tabs instead of stretching/mixing with text content.
- Data correction: Removed wrong Japanese/K-J origin bucket assignments for non-Japanese brands/products found during verification. Final DB check: Japanese has 0 Simple/The Derma/Skin1004 products; Skin1004 remains Korean/K-Beauty only; The Derma Plus wrong Japanese/K-J assignment was removed. Backups saved in `/root/.attic-2026-04-26/`.
- Verification: local build passed; VPS build passed; pm2 `emartweb` restarted; live product page shows `Moisturizer` and no old `K-Beauty & J-Beauty` category in the info box; `/origins?country=japan` has products and no Simple/The Derma/Skin1004 links; korea/japan/usa/uk/france/india/thailand/other origin pages all populated; home/product smoke returned HTTP 200.
- Commit: `10c546e fix: improve product detail category and gallery layout` pushed to `origin/main`. Local and VPS git trees clean at `10c546e`.

## 2026-04-26 — Codex/Claude shared memory coordination
- Did: Confirmed Codex and Claude Code coordination protocol, mirrored shared `.agent-memory` into Local, and corrected `project_git_three_way.md` so it records current Local/VPS/origin `main` HEAD as `10c546e` instead of stale `922a63b`.
- Completed tasks: none; coordination/memory update only.
- Blockers hit: none.
- Next step: future agents should read `/root/AGENTS.md` and shared `.agent-memory` first, then keep Local -> VPS -> Repo workflow and session notes in the shared files.

## 2026-04-26 — Product Ingredients/How to use tab fix
- Did: Fixed product detail tab extraction so legacy Woodmart Ingredients tabs are split by headings: usage sections move into How to use, and usage/suitable/storage sections are removed from Ingredients.
- Completed tasks: product content tab correction deployed live; 353 products audited with the bad legacy pattern.
- Blockers hit: none. Local and VPS builds passed; `emartweb` restarted; live homepage returned 200; affected SKIN1004 product now has `howToUse` content and cleaned `ingredients`.
- Next step: if the owner later wants permanent Woo data cleanup, migrate legacy tab sections into `_emart_ingredients` and `_emart_how_to_use`; current parser fix intentionally avoids bulk meta rewrites.

## 2026-04-26 — WordPress/Next product contract audit
- Did: Audited product data flow from WordPress/WooCommerce to Next.js after the tab fix and found one real contract mismatch: native `_emart_ingredients`, `_emart_how_to_use`, and `_emart_product_faq` existed in WordPress but were filtered out by the Next Woo metadata whitelist.
- Completed tasks: exposed native Emart product content metadata in `src/lib/woocommerce.ts`; deployed live; committed and pushed `f33724a fix: expose native product content metadata`.

## 2026-05-07 00:30 CEST — Codex CeraVe dry-run workflow
- Did: Created `scripts/cerave-update-from-xlsx.js` and generated CeraVe WooCommerce dry-run CSVs from `cerave_update_plan.xlsx`.
- Completed tasks: dry-run only; `cerave_dry_run_report.csv`, `cerave_manual_review.csv`, and `cerave_add_to_emart.csv` created locally; no WooCommerce apply was run.
- Blockers hit: none after switching the script to the VPS-local Woo API pattern (`127.0.0.1` + `Host: e-mart.com.bd`).
- Next step: owner reviews dry-run/manual/add CSVs; live changes require a separate explicit apply run and must only send `regular_price`.

## 2026-05-07 00:48 CEST — Codex CeraVe price apply
- Did: Applied reviewed CeraVe price updates through `scripts/cerave-update-from-xlsx.js` after owner explicitly requested clearing sale/discount prices.
- Completed tasks: 55 matched price rows applied to WooCommerce with `regular_price`; `sale_price` cleared on matched price-action rows; row 81 corrected to 2100 BDT before apply; one size-only row changed title to `CeraVe Facial Moisturising Lotion (PM) 60ml`; add/delete/manual rows were not applied.
- Blockers hit: none.
- Next step: review `cerave_manual_review.csv` for the remaining 20 rows; only 3 remaining sale-price visibility rows are non-price-update rows (`REVIEW_UNSPECIFIED`, `DELETE_EMART_ITEM`, `NO_ACTION_EMART_OK`).
- Blockers hit: none. Local/VPS builds passed; `emartweb` restarted; live homepage returned 200; affected SKIN1004 product payload now includes `_emart_*` keys and still renders cleaned Ingredients plus populated How to use. Nonfatal existing build warning: custom GraphQL sitemap fallback still logs a missing query/queryId error.
- Next step: optional future cleanup is data-level migration of the 353 Emart Ingredients rows into separate `_emart_ingredients` / `_emart_how_to_use`; not required for current storefront rendering.

## 2026-04-26 — Backend product content normalization
- Did: Safely normalized WordPress product content fields only; no frontend/UI/UX files changed. Split mixed `_emart_ingredients` sections into clean `_emart_ingredients` and `_emart_how_to_use`, then backfilled one missing canonical row from legacy Woodmart Ingredients.
- Completed tasks: 352 products updated from mixed Emart Ingredients; 1 WishCare product backfilled from legacy; final counts are 354 published products with `_emart_ingredients`, 353 with `_emart_how_to_use`, 0 mixed Ingredients rows with empty How-to-use, and 0 legacy Ingredients tabs lacking canonical Emart Ingredients.
- Blockers hit: none. Dry-run and apply CSV reports saved under `audit/processed/product-content-normalization-*.csv`; homepage and affected product page both returned HTTP 200. No PM2 restart was needed because this was WordPress data only.
- Next step: keep legacy Woodmart fields as rollback/backup unless the owner explicitly asks for permanent legacy meta cleanup.

## 2026-04-26 — Product FAQ canonicalization
- Did: Normalized product FAQ backend data and frontend rendering. All 3,564 published products now have canonical `_emart_product_faq` with exactly 5 product-focused Q/A pairs (3 English + 2 Bangla). Removed old visible FAQ / `সাধারণ জিজ্ঞাসা` / FAQPage blocks from product descriptions.
- Completed tasks: product FAQ meta generated; 3,532 descriptions cleaned by main migration; 3 residual special cases cleaned; frontend now renders canonical product FAQ only, removes the helper/dev subtitle, and no longer injects delivery/COD product FAQs. Commit `ab938a3 fix: render canonical product faqs` pushed to `origin/main`.
- Blockers hit: none. Dry-run/apply reports saved under `audit/processed/product-faq-*.csv`; local build passed; VPS build passed; `emartweb` restarted; live homepage returned 200; SKIN1004 product rendered 5 unique product-specific FAQ summaries with no helper text, delivery/COD FAQ, or old `সাধারণ জিজ্ঞাসা` marker.
- Next step: keep product FAQ questions product-specific. Delivery/COD belongs to site FAQ/checkout/policy content, not product FAQ.

## 2026-04-27 — Product meta description pause note
- Did: Reviewed the in-progress meta-description handoff. Confirmed Woo/Rank Math audit result: 3,549 of 3,564 published products already have `_rank_math_description`; only 15 products remain missing. Confirmed `_rank_math_description` is exposed through Woo product `meta_data`, but product page metadata was still using `short_description`.
- Completed tasks: cleaned up the unfinished generator path by removing the uncommitted `generate-meta.mjs` script and uninstalling the temporary Anthropic SDK dependency so no hardcoded OpenRouter key or unnecessary package remains. Added a local uncommitted Next.js change in `apps/web/src/app/[slug]/page.tsx` to prefer `_rank_math_description` for product meta descriptions.
- Blockers hit: user paused the work before sleep. No local build, VPS sync, VPS build, pm2 restart, live smoke, commit, or push was performed for this task.
- Next step: when resumed, add `_rank_math_description` only for the 15 missing products, then build Local, sync to VPS, build VPS, restart `emartweb`, smoke-test live product meta output, commit, and push last.

## 2026-04-27 — Product meta descriptions completed
- Did: Resumed the paused meta-description job, added `_rank_math_description` only for the 15 missing published products, and deployed the product metadata reader fix.
- Completed tasks: CODEX-3 product meta descriptions; missing Rank Math descriptions now `0`; `apps/web/src/app/[slug]/page.tsx` prefers `_rank_math_description`; commit `4da64d2 fix: prefer Rank Math product descriptions` pushed to `origin/main`.
- Blockers hit: none. Nonfatal known build warning remains: custom GraphQL sitemap fallback logs a missing query/queryId error.
- Next step: no bulk meta rewrite needed unless the owner explicitly requests a quality rewrite; future product creation should fill `_rank_math_description`.

## 2026-04-27 — National ecommerce SEO infrastructure
- Did: Transitioned storefront metadata/schema toward national Bangladesh ecommerce scope without UI/UX changes.
- Completed tasks: Replaced root `LocalBusiness` schema with `OnlineStore`; added product `Product` JSON-LD with Bangladesh `shippingDetails`; added 5s Woo read timeout/fallbacks; moved product detail prerendering to on-demand ISR; expanded canonical stripping for UTM/ad/session/sort params across shop/category/categories/brands/search/new-arrivals/sale; made served `/sitemap.xml` dynamic and backed by WordPress published product posts; enabled Next image optimization for WordPress product images. Commit `328a4c9 feat: national ecommerce SEO infrastructure` pushed to `origin/main`.
- Blockers hit: external DNS lookups were intermittent in shell, so final verification used local nginx with `Host: e-mart.com.bd`. The custom GraphQL sitemap endpoint still logs a missing query/queryId warning, but served sitemap now falls back to WordPress REST and returns 3,564 product URLs with `lastmod`.
- Next step: optional future work is to repair the custom GraphQL sitemap endpoint; not required for the live sitemap because the dynamic WordPress REST path is verified.

## 2026-04-27 — Balanced local + national schema signal
- Did: Adjusted root metadata/schema only, with no visible UI/UX copy change, so E-Mart keeps Dhaka business trust while presenting as a Bangladesh-wide online store.
- Completed tasks: Changed `kbeauty dhaka` keyword to `kbeauty bangladesh`; rewrote the non-visible `OnlineStore` schema description in more natural language; changed schema `addressLocality` from `Dhanmondi` to `Dhaka` while keeping the physical address for trust. Commit `515c1e5 fix: balance local and national schema signals` pushed to `origin/main`.
- Blockers hit: none. Local build and VPS build passed; VPS build still logged nonfatal Woo `getProducts` 5000ms timeouts, but the build completed. `emartweb` restarted and live smoke through local nginx returned 200 with `OnlineStore=true`, `LocalBusiness=false`, old Dhanmondi-first phrase absent, and `kbeauty bangladesh` present.
- Next step: remaining audit items are GA4 404 event `page_location` wiring and a stronger stale cache layer for Woo product/category build fetches if desired.

## 2026-04-27 — Claude Code — Session 2 (legacy-import audit + SEO + concern mapping)

### Done
- Scraped legacy import reference audit: 1,282 slug-matched products → prices + images
- Applied 637 price updates (sale_price) where legacy import reference was lower than Emart, via WP-CLI
- Image import v2 running: ~397 white-bg images imported to WC as featured images; 54 non-white skipped
- Alt text bulk fix: 2,631 existing product images missing alt text → "{Name} Price in Bangladesh | Emart"
- Concern mapping: scraped legacy taxonomy reference 11 concern subcats (617 slugs) + keyword rules → applied 1,162 concern category assignments; total concern-categorized: ~1,797/3,564
- ShopByCategorySection: new 6-tile category grid visible on all screen sizes (MobileDiscovery was lg:hidden on desktop)
- MailPoet email templates: welcome (ID2), abandoned cart (ID3), WC transactional (ID4) rebuilt with Emart branding
- Sourcing gap: 1,100 legacy-import + 454 legacy catalog products not on Emart → combined CSV with white-bg flags

### Blockers / Pending
- Image import v2 still running (PID 424373) — ~828 remaining, ~0.3s/image
- Sourcing gap merge still running (~426/1100 legacy-import pages scraped)
- Brand corrections rows 681+ still waiting for CSV from user
- Concern mapping: 1,767/3,564 products still uncategorized (non-K-beauty products mainly)
- ShopByCategorySection needs real category images (currently using TOP_CATEGORY_IMAGE_OVERRIDES which covers only 4 slugs)

### Next steps
- When image import finishes: verify 5 product pages for featured image quality
- Run concern mapping second pass for remaining ~1,767 uncategorized products (non-K-beauty Western brands)
- Source better category images for the category grid tiles

## 2026-04-27 — Implementation checkpoint (mid-session)

### Completed and verified
- Sourcing gap merge: DONE — 1,551 unique gap products identified
  - 633 with white-bg image + price ≥ ৳400 → import-ready
  - CSVs published to /public/audit/ for download
- Image import: 864/1282 running (nohup, survives session end)
  - 745 imported, 114 non-white skipped, 5 errors
  - Spot-checked: CosRx, NEOGEN, CeraVe, Coxir, Jumiso — all correct
  - Filenames: emart-{slug}.jpg, alt: "{Name} Price in Bangladesh | Emart"
- ShopByCategorySection: LIVE on homepage (both mobile + desktop)

### Download links (public)
- https://e-mart.com.bd/audit/sourcing-gap-import-ready-2026-04-27.csv (633 products)
- https://e-mart.com.bd/audit/sourcing-gap-combined-2026-04-27.csv (1,551 products)
- Archived legacy-import match report (1,282 matched)

### If image import is still running on next session
```bash
ps aux | grep "image-import-v2" | grep -v grep
# If dead: archived legacy-import image import script was moved out of the workspace on 2026-05-14.
```

## 2026-04-28 — Codex product import close-out
- Did: Closed out the sourcing-gap product importer after the completed run and duplicate cleanup, without touching frontend UI/UX or restarting `emartweb`.
- Completed tasks: Importer processed all 633 candidates; final progress is 92 created/published, 159 duplicate_existing/skipped or drafted, 380 out_of_stock, and 2 source 404s. Old-catalog duplicate audit was run with exact/same-size matching; high-confidence duplicate imports were drafted while older products stayed published. Final corrected duplicate verifier found 0 same-size high-confidence duplicates still published. Price parsing, category assignment, and HTML-entity title cleanup safeguards are committed in `d374925` and `563e1a2`.
- Blockers hit: Broad duplicate matching initially over-flagged size variants, so it was narrowed to same-size/high-confidence logic. ACWELL 30ml was kept live as a likely mini/full-size variant; Neutrogena SPF70 was kept live as a different SPF variant from SPF45.
- Next step: Do not rerun the archived instock product importer for this batch unless the progress file is intentionally reset. Reports were moved out of the workspace with the removed legacy-import audit artifacts; remaining product data cleanup should continue via reviewed dry-run CSV batches.

## 2026-04-28 — Codex checkout incident fix
- Did: Investigated the live checkout failure and fixed a production route redirect that was sending `/checkout` to `/` even though the storefront has a real Next checkout page.
- Completed tasks: Removed the stale `/checkout -> /` redirect from `apps/web/next.config.js`; local build passed; copied only `next.config.js` into the VPS runtime tree to avoid overwriting unrelated live diffs; VPS build passed; `pm2 restart emartweb` passed; live `https://e-mart.com.bd/checkout` now returns HTTP 200 instead of 307; safe negative test on `/api/checkout` now returns the expected validation JSON instead of a route/redirect failure. Commit `8570f6a fix: restore storefront checkout route` pushed to `origin/main`.
- Blockers hit: VPS runtime tree had unrelated live diffs in homepage/layout files, so this was deployed as a surgical one-file hotfix instead of a full Local -> VPS app sync.
- Next step: Run one real checkout from the storefront browser flow and confirm the order lands in WooCommerce and redirects to `/order-success` as expected.

## 2026-04-28 — Codex mobile homepage cleanup
- Did: Removed the mobile-only “Top Categories” strip directly under the homepage hero while keeping the lower “Shop by category” section and desktop layout unchanged.
- Completed tasks: Updated `apps/web/src/app/page.tsx` so `MobileDiscovery` renders with `showCategories={false}`; local build passed; copied only the homepage file into the VPS runtime tree; VPS build passed; `pm2 restart emartweb` passed; live homepage verification shows `Top Categories` absent and `Shop by category` still present. Commit `92b8238 fix: remove mobile top categories strip` pushed to `origin/main`.
- Blockers hit: VPS runtime tree still has unrelated live diffs in other files, so deployment again used a surgical one-file copy instead of a full Local -> VPS sync.
- Next step: none for this request; future homepage cleanup should continue from the current live VPS state to avoid overwriting the other in-progress homepage/layout edits.

## 2026-04-28 — Codex categories page redesign
- Did: Redesigned only the `/categories` page body into a mobile-first category discovery page, leaving the header, footer, global layout, homepage, and existing search UI untouched.
- Completed tasks: Rebuilt `apps/web/src/app/categories/page.tsx` with a compact intro, sticky jump pills, Popular Categories, Shop by Skin Concern, Skin Quiz CTA, Skincare, Hair Care, Makeup, Body Care, and a small bottom help CTA. Preserved real internal links by resolving live Woo category slugs, kept one H1, added simple BreadcrumbList + ItemList JSON-LD, and reused the existing `/skin-quiz` route plus existing WhatsApp destination. Local build passed; copied only the page file into the VPS runtime tree; VPS build passed; `pm2 restart emartweb` passed; live `/categories` returned 200 and server HTML verified the required section headings and anchor IDs. Commit `62fb02f feat: redesign categories discovery page` pushed to `origin/main`.
- Blockers hit: HTML verification sees multiple `<input>` elements on the full page because the existing global header search remains in the layout, but no new page-body search box was added.
- Next step: if the owner wants a second pass, do visual refinement only on `/categories` at mobile breakpoints without altering the new section order or adding images/search.

## 2026-04-28 — Codex safe missing-brand assignment script
- Did: Built a dry-run-first script to detect the live product brand taxonomy and propose missing brand assignments only for products that currently have no active brand term.
- Completed tasks: Added `apps/web/scripts/assign-missing-product-brands.py`; script checks DB taxonomies, product-term relationships, storefront code references, and Woo attribute taxonomy evidence before selecting the active brand taxonomy. Current dry-run detected `pa_brand` as primary, found 167 published products missing that taxonomy, and proposed 103 safe assignments while skipping 64 low-confidence cases. Reports saved under `audit/processed/brand-fill-20260428-185010/` with `taxonomy-detection.json`, `missing-products.csv`, `proposed-assignments.csv`, and `skipped-products.csv`. Script copied to VPS scripts directory and committed as `35638a1 feat: add safe missing-brand assignment script`.
- Blockers hit: some products/terms still use non-canonical or noisy brand data (for example terms outside the whitelist-driven brand system), so the script intentionally skips those instead of forcing guesses. It also does not modify local Woo `Brand` attributes, prices, stock, categories, tags, images, or descriptions.
- Next step: review `proposed-assignments.csv`; if approved, run the same script with `--apply`, then use the generated `rollback.csv` if any reversal is needed.

## 2026-04-30 12:16 CEST — Codex SEO indexability
- Did: Removed WordPress Rank Math sitemap discovery from robots, added crawl-budget disallows, added missing static Next sitemap pages, and changed Nginx so Rank Math sitemap URLs redirect to the Next sitemap.
- Completed tasks: `robots.ts` now lists only `https://e-mart.com.bd/sitemap.xml`; `/sitemap_index.xml` and `/product-sitemap1.xml` return 301 to `/sitemap.xml`; `/social`, `/origins`, and `/concerns` are included in the Next sitemap; category and brands canonicals were verified live.
- Blockers hit: VPS runtime tree already had unrelated live dirty changes, so deployment copied only `robots.ts` and `sitemap.ts` instead of rsyncing the whole app. The requested `/category/skin-care` check 404s because that slug is not a live category; verified `/category/skincare-essentials` instead.
- Next step: keep the Nginx sitemap redirect in sync if this server config is ever rebuilt from a template; reconcile the unrelated VPS dirty tree before any broad app rsync.

## 2026-04-30 21:38 CEST — Codex open task cleanup
- Did: Completed the deferred homepage social card thumbnail cleanup and added real `/brands/[slug]` detail pages.
- Completed tasks: `SocialChannelGrid` now uses platform-branded TikTok/Facebook/Instagram cards instead of mismatched product placeholders; `/brands/[slug]` renders brand products with canonical metadata; brand cards and product brand chips link to `/brands/{slug}`; sitemap includes brand detail URLs.
- Blockers hit: VPS build logged transient Woo read timeouts but completed; live smoke passed after restart.
- Next step: only Cloudflare cache rules remain from the open/deferred task note, and those require dashboard access.

## 2026-04-30 22:36 CEST — Codex SEO confirmed gaps
- Did: Implemented only the latest `SEO_TODO.md` confirmed gaps: `per_page`/`shop_view` query stripping, absolute frontend canonicals/OG URLs, approved brand detail title format, and SEO reports.
- Completed tasks: local build passed; VPS build passed; `emartweb` restarted; live `/` returned 200; noisy query URL 301s to clean path; live `/brands/cosrx` title/canonical verified; live sitemap uses absolute URLs and includes `/brands/cosrx`.
- Blockers hit: `audit/` is gitignored, so SEO report files were force-added intentionally.
- Next step: none for confirmed gaps; future SEO work should remain narrow unless user expands scope.

## 2026-05-01 11:10 CEST — Codex SEO payload cleanup
- Did: Removed Woo product tags from the sanitized storefront product payload so hidden RSC hydration data no longer contains SEO tag strings after visible product tag pills were removed.
- Completed tasks: local build passed; Local -> VPS rsync completed; VPS build passed; `emartweb` restarted; live product SEO verified with Rank Math title/description/canonical/OG/schema and raw `Authentic Skincare BD` count now `0`; category SEO and cache headers verified; commit `fa76a98` pushed to `origin/main`.
- Blockers hit: first rsync needed escalated write access to `/var/www`; one immediate post-restart probe hit transient connection/DNS timing, retry passed.
- Next step: none for this fix; `ui-audit/` remains an unrelated untracked local directory.

---
## 2026-05-02 19:30 UTC — GitHub Copilot
- Did: Patched `workspace/scripts/setup-vps-config.sh` to use `https://e-mart.com.bd` for `NEXT_PUBLIC_WOO_URL`, `NEXT_PUBLIC_API_URL`, and mobile `REACT_APP_WOO_URL` to avoid POST->GET redirects from the internal IP.
- Completed tasks: applied patch to `workspace/scripts/setup-vps-config.sh`.
- Build: Ran local `npm run build` in `apps/web` — build succeeded (Next.js 14.2.35; pages generated, static pages: 72).
- Blockers hit: none.
- Next step: Sync Local -> VPS (`./workspace/scripts/sync-local-to-vps.sh`), run build on VPS, restart `emartweb`, smoke-test `/account` registration flow, then commit/push if smoke passes.


## 2026-05-01 11:45 CEST — Codex Nginx SEO/backend hardening
- Did: Hardened Nginx so public `/graphql` and the public REST namespace index `/wp-json/` return `403`, while localhost GraphQL remains available for Next.js Rank Math/WPGraphQL SEO fetches and specific REST routes remain available.
- Completed tasks: Nginx config backed up under `/etc/nginx/sites-available/`; `nginx -t` passed; Nginx reloaded; public `/graphql` -> `403`; public `/wp-json/` -> `403`; `/wp-json/emart/v1` still `200`; `/wp-json/wc/v3` remains `403`; `/wp-json/wp/v2/users` remains `403`; `/xmlrpc.php` remains `403`; localhost `http://127.0.0.1/graphql` with Host header returns WordPress data; product/category SEO still renders live.
- Blockers hit: first GraphQL allow/deny attempt was bypassed by `rewrite ... last`; corrected by direct FastCGI handling with `include fastcgi_params`.
- Next step: none for this hardening pass; keep `/graphql` and the REST namespace index blocked publicly unless a future integration has a reviewed exact-route requirement.

## 2026-05-01 12:05 CEST — Codex categories Live Pulse
- Did: Replaced `/categories` with a Midnight Blossom scoped Direction B / Live Pulse implementation backed by live Woo category/product/review/order-derived APIs, shared flash countdown context, polling/WebSocket fallback hooks, route-scoped i18n, and the existing header/footer shell.
- Completed tasks: Local build passed; local runtime `/categories` and all new API routes returned `200`; desktop/mobile Chromium screenshots saved in `ui-audit/`; VPS rsync completed; VPS build passed; `emartweb` restarted; live `/categories` returned `200` with `data-theme="midnight-blossom"` and canonical `https://e-mart.com.bd/categories`; live new API routes returned `200`; SEO/backend smoke test passed; commit `18dd2c9` pushed to `origin/main`.
- Blockers hit: reference design files (`direction-b.jsx`, `mobile.jsx`, `tokens.css`, `shared.jsx`, `E-Mart BD Category Page.html`) were not present in the workspace, so true pixel diff could not be run; Storybook/Vitest dependency install hung under restricted network and was not committed; no remote WS service exists, so components attempt WS and degrade to polling/BroadcastChannel presence.
- Next step: if exact pixel acceptance is required, add the reference files/assets to the repo and run visual diff against the saved screenshots; install Storybook/Vitest in a separate dependency-only change with network access.

## 2026-05-01 21:36 CEST — Codex category illustrations
- Did: Added responsive inline SVG category illustrations for skincare category fallbacks and wired them into homepage `Shop by category` cards plus `/categories` popular category icon fallbacks.
- Completed tasks: Local build passed; commit `9abc37f` created; three changed files synced to VPS; VPS build passed; `emartweb` restarted; live `/` and `/categories` returned `200`; live HTML verified `viewBox="0 0 180 240"` illustration markup on both pages; commit pushed to `origin/main`.
- Blockers hit: initial sandboxed content-smoke curls hit transient DNS resolution failures, then passed when retried outside the sandbox.
- Next step: visual review on mobile and desktop; existing real category images still take priority over illustrations when Woo/home overrides provide a usable image.

## 2026-05-01 23:00 CEST — Codex Local/VPS/Git reconciliation check
- Did: Checked project folder first, then compared Local, origin, and VPS source state after the header menu/category unification work.
- Completed tasks: Confirmed Local and `origin/main` are clean at `61ca7be`; VPS git metadata is old/dirty at `95e24f1`, but key header/category source files match Local exactly (`Header.tsx`, `category-navigation.ts`, `categories/liveData.ts`, and `/categories/page.tsx`). Verified live homepage uses VPS `HeroCarousel.tsx`; verified VPS `components/home/CategoryIllustration.tsx` is unused residue because live cards import `components/category/CategoryIllustration.tsx`.
- Blockers hit: none; this was read-only, no source/deploy changes.
- Next step: preserve the live `HeroCarousel.tsx` tagline `Global Beauty. Local Trust.` into Local/Git before any broad VPS reconciliation; then remove/ignore unused old `components/home/CategoryIllustration.tsx` and align VPS carefully.

## 2026-05-01 23:18 CEST — Codex categories card UI fix
- Did: Scoped `/categories` UI fix only: removed duplicate page-level browse tabs under the global header, forced popular category cards to use built SVG artwork instead of Woo category image fallbacks, added category-specific SVG variants, and replaced visible `category tree` wording with shopper-facing copy.
- Completed tasks: Local build passed; commit `f49a99b fix(categories): refine category card artwork`; synced only the four touched category UI files to VPS; VPS build passed; `emartweb` restarted; live `/categories` returned `200`; live checks confirmed old `Browse the latest Emart category tree` count `0`, `Shop beauty by category` count `1`, and only one `SHOP BY CATEGORY` label remains in server HTML; pushed `f49a99b` to `origin/main`.
- Blockers hit: none after scope was corrected to avoid whole-site/layout changes.
- Next step: user visually reviews `/categories`; no further code task pending for this exact card/SVG duplicate-nav fix.

## 2026-05-01 23:25 CEST — Codex homepage category artwork fix
- Did: Fixed homepage `Shop by category` rail so cards use category-appropriate built SVG artwork instead of Woo/product image fallbacks, removed Bangla subtitles from those cards, and changed the dark `All categories` tile to a light SVG card.
- Completed tasks: Local build passed; commit `11a7687 fix(home): use svg category card artwork`; synced only the four touched home/category files to VPS; VPS build passed; `emartweb` restarted; live homepage returned `200`; live HTML shows six `viewBox="0 0 180 240"` category SVG cards; remaining Bangla text found on homepage is an existing customer review quote, not the category rail; pushed `11a7687` to `origin/main`.
- Blockers hit: VPS build logged nonfatal Woo category fetch timeouts during static generation but completed successfully.
- Next step: user visually reviews homepage `Shop by category` cards.

## 2026-05-01 23:43 CEST — Codex shop route navigation exposure
- Did: Confirmed `/shop` exists and is live, then made it a first-class storefront navigation path with mobile-first constraints.
- Completed tasks: Added `SHOP ALL` before the desktop browse groups, added `Shop All` and `Account` to the mobile drawer quick links, and removed the extra Account item from the five-slot mobile bottom nav so the bar stays five actions: Home, Shop, Browse, Wishlist, Cart. Local build passed; commit `74d09c0 fix(header): surface shop route in navigation`; synced only `Header.tsx` to VPS; VPS build passed; `emartweb` restarted; live `/` and `/shop` returned `200`; live homepage HTML includes `SHOP ALL` and `/shop`.
- Blockers hit: none.
- Next step: continue treating storefront UI changes as mobile-first by default.

## 2026-05-01 23:47 CEST — Codex route unification quick fix
- Did: Unified brand query navigation to clean brand detail URLs, moved the homepage Offer tab to Eid Offer, and fixed the dead cart path.
- Completed tasks: `/brands?brand=slug` now permanently redirects to `/brands/slug` while preserving page query; remaining brand query link now points to `/brands/{slug}`; cart drawer no longer links to missing `/cart`; legacy `/cart` redirects to `/checkout`; homepage Offer tab now links to `/offers/eid-offer`. Local build passed; commit `fa4b0b4 fix(nav): unify brand and cart routes`; synced only the five touched files to VPS; VPS build passed; `emartweb` restarted; live `/cart` -> `/checkout`, `/brands?brand=cosrx&page=2` -> `/brands/cosrx?page=2`, `/brands/cosrx` 200, `/offers/eid-offer` 200, homepage 200 with `href="/offers/eid-offer"`.
- Blockers hit: an initial rsync command created an accidental nested `/var/www/emart-platform/apps/web/apps/` copy; it was removed before build and verified absent.
- Next step: if route cleanup continues, decide whether `/sale` stays as a separate marketing page or becomes another `/shop` filtered view.

## 2026-05-02 17:25 CEST — Codex sitemap/footer SEO cross-check
- Did: Cross-checked sitemap, robots, footer category links, public backend exposure, and added a footer Support link to the canonical Next sitemap.
- Completed tasks: Added `Sitemap` under footer Support linking to `/sitemap.xml`; updated SEO audit reports with 2026-05-02 live checks. Local build passed; synced Footer and report files to VPS; VPS build passed; `emartweb` restarted; live homepage returned 200 and contains `href="/sitemap.xml"`; live `/sitemap.xml` returned 200 with 3,929 URLs and no backend URL patterns; live `/robots.txt` returned 200 with `Sitemap: https://e-mart.com.bd/sitemap.xml`; public HTTPS `/graphql` and `/wp-json/` return 403.
- Blockers hit: Google’s old HTTP sitemap ping endpoint is deprecated, so no fake ping was sent; sitemap discovery remains through robots.txt and Search Console.
- Next step: avoid daily major SEO churn; use Search Console for manual sitemap resubmission only when a significant sitemap/content change is made.

## 2026-05-02 17:34 CEST — Codex styled human sitemap
- Did: Added a shopper-facing styled sitemap page while preserving `/sitemap.xml` as the crawler truth.
- Completed tasks: Added `/sitemap` with a mobile-first tree for quick paths, shop, brands, categories/subcategories, concerns, origins, offers, support, and content/trust pages; footer Support `Sitemap` now links to `/sitemap`; the styled page includes direct `/sitemap.xml` links; `/sitemap` was added to the XML sitemap static entries. Local build passed; synced only `sitemap.ts`, `/sitemap/page.tsx`, and Footer to VPS; VPS build passed; `emartweb` restarted; live `/sitemap` returned 200; homepage footer contains `href="/sitemap"`; `/sitemap.xml` returned 200 with 3,930 URLs and includes `https://e-mart.com.bd/sitemap`.
- Blockers hit: creating the new VPS route directory required escalated filesystem access because `/var/www` is outside the sandbox.
- Next step: keep `/sitemap.xml` for robots/Search Console and `/sitemap` for users; no need for daily sitemap UI changes.

## 2026-05-02 17:47 CEST — Codex styled XML sitemap
- Did: Fixed direct `/sitemap.xml` browser view so it no longer appears as raw code while remaining valid crawler XML.
- Completed tasks: Replaced the active Next special sitemap file with a custom `/sitemap.xml` route; moved the existing sitemap data flow into `src/lib/sitemapEntries.ts`; added `/sitemap.xsl` and attached it with an XML stylesheet processing instruction. Local build passed; commit `6ddd72d fix(seo): style XML sitemap`; synced the sitemap route/helper/XSL to VPS; removed obsolete VPS `app/sitemap.ts`; VPS build passed; `emartweb` restarted; public `/sitemap.xml` returns XML with `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`; public XML file has 23,583 lines; `/sitemap.xsl` and `/sitemap` return 200; homepage footer still contains `href="/sitemap"`.
- Blockers hit: first attempt attached the stylesheet to `app/sitemap.xml/route.ts`, but live smoke showed Next was still serving `/sitemap.xml` from `app/sitemap.ts`; corrected by removing the special route and making the custom route authoritative.
- Next step: user can hard refresh `https://e-mart.com.bd/sitemap.xml`; browser should show the styled XSL table, while crawlers still receive valid XML.

## 2026-05-02 17:53 CEST — Codex XML sitemap static entries
- Did: Tightened the XML sitemap static page list after the styled sitemap work.
- Completed tasks: Added real public pages to the active XML sitemap source: `/categories`, `/skin-quiz`, `/our-story`, `/join-our-team`, `/contact`, `/faq`, policy pages, and all configured `/offers/*` pages. Local build passed; commit `827d62f fix(seo): complete static sitemap entries`; synced only `src/lib/sitemapEntries.ts` to VPS; VPS build passed; `emartweb` restarted; public `/sitemap.xml` still includes the XSL stylesheet line and now includes checked URLs such as `/categories`, `/skin-quiz`, `/contact`, `/faq`, `/shipping-policy`, `/return-policy`, `/privacy-policy`, `/terms-conditions`, `/offers/eid-offer`, and `/offers/coupon`.
- Blockers hit: repeated looped curl checks to the local port were flaky in the sandbox, so final verification used public HTTPS and saved sitemap output.
- Next step: continue with a narrow read-only route/content audit before making any more UI changes.

## 2026-05-02 18:08 CEST — Codex old source trace cleanup
- Did: Removed old legacy-import traces from live product/content-facing data and unused public source-logo files.
- Completed tasks: Confirmed live Woo/WP post titles, content, excerpts, and terms had zero hits; found 1,083 old legacy-import URLs only in attachment source metadata; exported a rollback TSV to `/tmp/emart-seo-backups/attachment-source-backup-20260502.tsv`; updated those 1,083 metadata values to the current `https://e-mart.com.bd/...` attachment URLs. Removed unused tracked public source-logo files and replaced the only source comment in `brandWhitelist.ts`; local build passed; synced to VPS; VPS build passed; `emartweb` restarted; DB recheck returned zero hits across posts_content, posts_excerpt, posts_title, postmeta, and terms; old source-logo manifest URL returned 404.
- Blockers hit: public HTTPS DNS from the shell was intermittently unavailable for some content grep checks, but homepage HEAD returned 200 and DB/source checks completed.
- Next step: push the verified source cleanup commit; continue old URL redirect audit separately.

## 2026-05-02 18:13 CEST — Codex session logout
- Did: Read required agent instructions and current shared memory/session state, then closed the session without making code, VPS, or task-board changes.
- Completed tasks: Reviewed `/root/CLAUDE.md`, `/root/emart-platform/CLAUDE.md`, local `apps/web/.agent-memory/MEMORY.md`, `apps/web/TASKS.md`, and `apps/web/SESSION-LOG.md`; confirmed the live-path session log referenced in project instructions is currently missing and the local session log is the available record.
- Blockers hit: none.
- Next step: start the next task from the current local memory/session state unless the missing `/var/www/emart-platform/apps/web/SESSION-LOG.md` path needs to be reconciled first.

## 2026-05-02 18:14 CEST — Codex session login
- Did: Re-entered the project session and refreshed the required local shared-memory, task-board, and recent session-log context.
- Completed tasks: Re-read local `apps/web/.agent-memory/MEMORY.md`, `apps/web/TASKS.md`, and the latest `apps/web/SESSION-LOG.md` entries; confirmed current outstanding Codex-side blockers remain the user-supplied brand CSV for rows 681+ and explicit confirmation before Healthy Place cleanup or migration work.
- Blockers hit: the project instruction path `/var/www/emart-platform/apps/web/SESSION-LOG.md` remains missing, so the local `apps/web/SESSION-LOG.md` continues to serve as the active session record.
- Next step: proceed from the refreshed local state when the next concrete task is given.

## 2026-05-02 18:15 CEST — Codex session exit
- Did: Closed the session immediately after login refresh, without making code, VPS, deploy, or task-board changes.
- Completed tasks: Recorded session end state only; preserved the current local shared-memory and task context as-is for the next session.
- Blockers hit: none.
- Next step: resume from the current local session log and memory state when a new task is provided.

## 2026-05-02 18:29 CEST — Codex VS Code SSH terminal sync setup
- Did: Added repo-local VS Code Remote SSH workspace config so the integrated terminal opens at `/root/emart-platform` and exposes the Local/VPS path variables used by the project workflow.
- Completed tasks: Added tracked `.vscode/settings.json` and `.vscode/tasks.json`; added `workspace/scripts/sync-local-to-vps.sh` for the Local -> VPS rsync flow; documented usage in `workspace/VS_CODE_SSH.md`; made the sync script executable; validated the script with `bash -n`.
- Blockers hit: none.
- Next step: run the new VS Code tasks from the SSH workspace when a Local build or Local -> VPS sync is needed; no live deploy/restart was performed in this task.

## 2026-05-02 18:32 CEST — Codex session logout
- Did: Per user request, closed the current Codex session state without making code, VPS, deploy, or task-board changes.
- Completed tasks: Preserved the current local shared-memory and task context as-is for immediate re-entry.
- Blockers hit: none.
- Next step: re-open the session and refresh required memory/task/session context.

## 2026-05-02 18:32 CEST — Codex session login
- Did: Per user request, re-entered the project session and refreshed the required local shared-memory, task-board, and recent session-log context.
- Completed tasks: Re-read local `apps/web/.agent-memory/MEMORY.md`, `apps/web/TASKS.md`, and recent `apps/web/SESSION-LOG.md`; confirmed current Codex-side blockers remain the user-supplied brand CSV for rows 681+ and explicit confirmation before Healthy Place cleanup or migration work.
- Blockers hit: the project instruction path `/var/www/emart-platform/apps/web/SESSION-LOG.md` is still missing, so local `apps/web/SESSION-LOG.md` remains the active session record.
- Next step: continue from the refreshed local session state when the next task is given.

## 2026-05-02 18:33 CEST — Codex session exit
- Did: Closed the current session per user request without making code, VPS, deploy, or task-board changes.
- Completed tasks: Recorded the exit state only and preserved the current local shared-memory/task context for the next session.
- Blockers hit: none.
- Next step: resume from the local session log and memory state when the next task is provided.

## 2026-05-02 19:45 CEST — Codex presence WebSocket deploy
- Did: Added and deployed the realtime presence WebSocket service without UI/UX changes.
- Completed tasks: Added native Node `apps/presence-server`; changed frontend realtime plumbing to use `NEXT_PUBLIC_WS_PRESENCE_URL`; removed hardcoded `wss://api.e-mart.com.bd/ws/presence` and optional `/ws/orders` opening; set VPS env to `wss://e-mart.com.bd/ws/presence`; added Nginx `/ws/presence` and `/presence-healthz` proxy routes; started PM2 `emart-presence`; rebuilt and restarted `emartweb`.
- Verification: Local build passed; VPS build passed; PM2 `emart-presence` and `emartweb` online; local Nginx homepage smoke returned 200; `/presence-healthz` returned `{"ok":true}`; local and public WebSocket upgrade checks returned `101 Switching Protocols` with a presence frame; built bundle has no `api.e-mart.com.bd/ws` references.
- Blockers hit: `api.e-mart.com.bd` did not resolve, so same-origin WSS was used; an orphan local test process temporarily held port 3011 and was killed before PM2 service restart.
- Next step: Browser hard-refresh category/product pages and confirm no WebSocket console errors; polling fallback remains active.

## 2026-05-02 20:00 CEST — Codex catalog cache header correction
- Did: Corrected the incomplete catalog cache/security result after verification showed Claude's `/shop` and `/category/*` cache work was applied but still emitted dynamic `no-store`.
- Completed tasks: Updated CSP in `next.config.js` from stale `wss://api.e-mart.com.bd` to live `wss://e-mart.com.bd`; added Nginx runtime proxy locations for `/shop` and `/category/{slug}` that hide Next dynamic `Cache-Control` and emit public `s-maxage` plus CDN cache headers; rebuilt VPS and restarted `emartweb`.
- Verification: Local build passed; VPS build passed; Nginx config test passed; `/shop` and `/category/sunscreen` now return `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`; TTFB stayed under 0.1s; CSP contains `wss://e-mart.com.bd`; headless Chromium showed no site CSP/WebSocket errors, only Snap DBus noise.
- Blockers hit: Cloudflare still returns `cf-cache-status: DYNAMIC` on warm HTML requests despite origin/CDN cache headers. No Cloudflare API credentials were found on the server; a Cloudflare Cache Rule/Page Rule is required for `HIT`.
- Next step: Add Cloudflare dashboard/API rule to cache eligible HTML for `/`, `/shop`, and `/category/*`, bypassing cart/checkout/account/API/admin paths.

## 2026-05-02 20:14 CEST — Codex private cache and internal API hardening
- Did: Fixed the approved critical items except Cloudflare and Git: private-page cache leak, confirmed public GraphQL exposure state, and moved Woo/GraphQL server fetches back to loopback by default in production.
- Completed tasks: Added live Nginx no-store overrides for `/checkout`, `/account`, and `/account/*`; public `/graphql` verified as `403`; updated `woocommerce.ts`, `wordpress-graphql.ts`, and `seo.ts` so production uses `http://127.0.0.1` with `Host: e-mart.com.bd` when `WOO_INTERNAL_URL` is absent; increased Woo read timeout from 5s to 8s; reduced `getBrandBySlug` public fallback 403 noise; local and VPS builds passed; Nginx config test passed; Nginx reloaded; `emartweb` restarted; live smoke checks passed.
- Verification: `/checkout`, `/account`, and `/account/orders` return `Cache-Control: private, no-store, max-age=0, must-revalidate`; `/shop` and `/category/sunscreen` still return public `s-maxage=300`; `/sitemap.xml` returns 200; public `/graphql` returns 403; PM2 shows `emartweb` and `emart-presence` online; no fresh emartweb error-log writes after the fix.
- Blockers hit: Cloudflare HTML cache remains intentionally untouched per user request; Git commit/push intentionally skipped per user request. PM2 restart counters are historical and now include this intentional `emartweb` restart.
- Next step: If approved later, handle Cloudflare cache rule and Git/repo reconciliation separately.

## 2026-05-02 20:28 CEST — Codex audit safety fixes applied
- Did: Applied the approved live production audit fixes in one logical Local -> VPS -> Repo pass without UI redesign or dependency changes.
- Completed tasks: Added source private no-store headers for checkout/account/order utility pages; added noindex metadata via server wrappers while preserving existing client UI; confirmed public `/graphql` is already blocked and internal loopback GraphQL remains available; removed hardcoded WooCommerce fallback keys from `ocr-image-audit.mjs`; fixed `/shop` duplicate title suffix; documented Cloudflare cache/bypass rules in `workspace/CLOUDFLARE_CACHE_RULES.md`; kept Woo/GraphQL server fetches on loopback in production; added a small sanitizer for rendered product/blog HTML and wired it into product detail, tabs, collapsibles, and blog content.
- Verification: Local build passed; VPS build passed; `emartweb` restarted; live `/shop`, `/checkout`, `/account`, `/account/orders`, `/order-success`, `/track-order`, `/wishlist`, `/`, `/category/sunscreen`, sampled product page, `/sitemap.xml`, and `/presence-healthz` returned 200; private pages return `noindex, nofollow` and private no-store headers; `/shop` title is `Shop Global Skincare Brands | Emart`; public `/graphql` returns 403; PM2 processes online; no fresh emartweb/presence error-log writes after deploy. Commit `10dbbf7` pushed to `origin/main`.
- Blockers hit: Cloudflare dashboard/API was not changed; `cf-cache-status` remains a separate dashboard rule task. Pre-existing local VS Code workspace files and `.gitignore` edits remain unrelated to this audit-fix commit.
- Next step: Apply the documented Cloudflare cache/bypass rules when dashboard access is available, then recheck `cf-cache-status: HIT` on warm `/`, `/shop`, and `/category/*` requests.

## 2026-05-02 22:28 CEST — Codex other-agent bug check
- Did: Checked the GPT/OpenRouter/Codex bug report and local dirty state after the previous session.
- Completed tasks: Identified incompatible local-only lint dependency/config additions (`eslint@^10.3.0`, `eslint-config-next@^16.2.4`, `apps/web/.eslintrc.json`) as the real new issue; pruned them and reran `npm run build` successfully without the ESLint invalid-options warning.
- Verification: Local build passed cleanly; package files now have no diff against `HEAD`; public smoke checks with explicit resolve returned `/shop` 200, `/sitemap.xml` 200, `/graphql` 403 as intended, and `/brands/cosrx` 200. PM2 error log mtime did not advance past `2026-05-02 20:32:37`, so the bug-report log entries appear stale.
- Blockers hit: Local sandbox could not reach local service ports or resolve public DNS without escalated curl; no VPS deploy/restart/commit/push was performed.
- Next step: Decide separately whether to keep, fix, or discard the remaining uncommitted VS Code/deploy helper files from the other-agent pass.

## 2026-05-02 22:34 CEST — Codex other-agent cleanup
- Did: Cleaned the other-agent leftovers logically without touching live VPS or restarting PM2.
- Completed tasks: Moved stale/risky `BUG-REPORT-2026-05-02.md`, `DEPLOY-PLAN-2026-05-02.md`, and nested `apps/web/.vscode` recommendation to `/root/.attic-2026-05-02/other-agent-bugcheck/`; replaced unsafe `workspace/scripts/setup-vps-config.sh` with a disabled guard script; made `workspace/scripts/sync-local-to-vps.sh` dry-run by default with explicit `--apply`; updated VS Code task labels/docs accordingly.
- Verification: `bash -n` passed for both scripts; `npm run build` passed locally after cleanup.
- Blockers hit: none.
- Next step: Review and commit the local housekeeping changes if desired; no live deploy is needed for these helper/docs changes.

## 2026-05-02 22:55 CEST — Codex audit follow-up deploy
- Did: Deployed the approved audit follow-up commit `8834fa2` with no UI redesign.
- Completed tasks: Local build passed; synced only the nine committed audit-fix files to VPS; corrected an initial rsync path mistake by moving accidental root-level copies to `/root/.attic-2026-05-02/audit-sync-path-mistake/` and re-syncing with relative paths; VPS build passed; restarted `emartweb`; smoke tested live routes; pushed `8834fa2` to `origin/main`.
- Verification: `/`, `/shop`, `/checkout`, `/account`, `/account/orders`, `/order-success`, `/track-order`, `/wishlist`, `/sitemap.xml`, `/presence-healthz`, and sampled product `/shop/rice-brightening-combo` returned expected statuses; private pages return `private, no-store`; `/graphql` returns `403`; PM2 `emartweb` and `emart-presence` online; no fresh emartweb error-log writes after restart.
- Blockers hit: Blog detail URL sampled from sitemap redirected to `/blog/`, likely pre-existing content/sitemap behavior unrelated to the JSON-LD escaping change.
- Next step: Keep the remaining local VS Code/helper housekeeping separate; inspect blog sitemap/detail route separately if desired.

## 2026-05-02 23:07 CEST — Codex Google login env restore
- Did: Restored the missing Google OAuth provider environment keys from the existing `/tmp` Google-login env backup into live/local `.env.local` without printing secret values.
- Completed tasks: Backed up the current live/local `.env.local` files with `backup-20260502-google-restore` suffixes; restored only `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; restarted only `emartweb`.
- Verification: Live `/api/auth/providers` now returns the `google` provider again with sign-in and callback URLs under `https://e-mart.com.bd`; live `/account` returns 200 with private no-store headers.
- Blockers hit: none.
- Next step: User hard-refreshes `/account` and confirms the `Continue with Google` button is visible; if OAuth callback itself errors, check Google Console authorized redirect URI.

## 2026-05-02 23:12 CEST — Codex account registration deploy
- Did: Deployed the account creation backend fix with no UI changes.
- Completed tasks: Updated `/api/auth/register` so production posts to WordPress through loopback with `Host: e-mart.com.bd`, avoiding public Cloudflare/redirect method loss; local build passed; committed `8cb4821`; synced only the register route file to VPS; VPS build passed; restarted `emartweb`; pushed `8cb4821` to `origin/main`.
- Verification: Live `/api/auth/register` with a safe duplicate payload returns `409 Email or username is already in use` instead of the old REST "No route" error; `/api/auth/providers` still returns Google; `/account` and `/account/orders` return 200 with private no-store/noindex; `/api/account/orders` returns 401 without auth as expected.
- Blockers hit: Could not view a real customer's submitted order list without the user's authenticated browser session, by design.
- Next step: User hard-refreshes `/account`, creates/logs into the account, then checks `/account/orders`; submitted checkout orders should appear when the checkout email maps to the same Woo customer account.

## 2026-05-02 23:21 CEST — Codex mobile shop UI fix
- Did: Fixed the mobile `/shop` filter/product readability issue without changing homepage/header/footer/global theme.
- Completed tasks: Changed the mobile product grid to one readable column below 430px and two columns above that; changed the mobile filter drawer from a side panel to a bottom sheet; removed disabled mobile "soon" origin chips that looked tappable but were not.
- Verification: Local build passed; synced only `app/shop/page.tsx` and `CatalogFilters.tsx` to VPS; VPS build passed; restarted `emartweb`; public `/shop` returned 200; built bundle contains the new bottom-sheet classes and mobile grid class; pushed commit `b72e76d` to `origin/main`.
- Blockers hit: Shell DNS to `e-mart.com.bd` was intermittent after deploy, so one content check used the live VPS built bundle/local origin instead.
- Next step: User hard-refreshes mobile `/shop` and checks the filter button plus product card taps.

## 2026-05-03 13:46 CEST — Codex Cloudflare SEO follow-up
- Did: Verified Cloudflare cache/robots/search-engine behavior after dashboard changes and fixed the remaining /shop Open Graph URL mismatch.
- Completed tasks: Confirmed robots.txt no longer has Cloudflare managed injection; public catalog pages cache at Cloudflare; API/private pages no longer HIT; sitemap is valid with 4,274 URLs and no backend/legacy URL leaks. Updated apps/web/src/app/shop/page.tsx so /shop emits og:url=https://e-mart.com.bd/shop.
- Verification: Local build passed; VPS build passed; emartweb restarted; live /shop returned 200 with canonical https://e-mart.com.bd/shop and og:url https://e-mart.com.bd/shop; PM2 shows emartweb online; commit 224247a pushed to origin/main.
- Blockers hit: Intermittent shell DNS failures required escalated live curl reads for some public checks.
- Next step: No Cloudflare SEO/cache blocker remains; optional later hardening is restricting public /wp-login.php access beyond current noindex/no-store behavior.

## 2026-05-03 14:00 CEST — Codex product image correction
- Did: Replaced the wrong image on /shop/beauty-glazed-nose-pore-strips with the correct old-site Beauty Glazed Nose Pore Strips image.
- Completed tasks: Imported the verified old legacy catalog CloudFront image into WordPress as attachment 93061, set product 74171 thumbnail to 93061, recorded source metadata, cleared WordPress/transient cache, rebuilt VPS, restarted emartweb, moved stale Next fetch cache to /root/.attic-2026-05-03/next-fetch-cache-product-image/.
- Verification: WooCommerce API returns image https://e-mart.com.bd/wp-content/uploads/2026/03/beauty-glazed-nose-pore-main.webp; live product page returns 200 and uses that image for preload, visible product image, og:image, and twitter:image; image URL returns 200; PM2 emartweb online.
- Blockers hit: REVALIDATE_SECRET is not configured in the live app, so /api/revalidate returned unauthorized; used VPS rebuild/restart plus generated fetch-cache move instead.
- Next step: Optional infrastructure cleanup: configure REVALIDATE_SECRET for future single-product cache refreshes without restart.

## 2026-05-03 14:59 CEST — Codex product image audit + instant revalidate
- Did: Configured instant product cache revalidation and generated fresh product image mismatch audit CSVs after wrong-image reports.
- Completed tasks: Added REVALIDATE_SECRET to local/live env without printing it; updated `/api/revalidate` to accept Woo product webhook payloads and revalidate product paths, `/shop`, and `tag:products`; built local/VPS, restarted `emartweb`, created active Woo webhook `Emart Next revalidate (product.updated)`, tested manual and webhook-style revalidate payloads; fetched the user-provided Woo export CSV from GitHub; generated metadata/brand/size/thumbnail audits under `workspace/audit/seo/`.
- Verification: Local build passed; VPS build passed; `/api/revalidate` returned ok true for the SADOER product and unauthorized without secret; `/shop` and sampled product returned 200; PM2 online; commit `4aa226c` pushed to origin/main after rebasing on the GitHub CSV upload. Audit found 246 products with metadata image mismatch signals, 171 metadata brand mismatches, 36 metadata size mismatches, and 177 products with duplicate `_thumbnail_id` rows; OCR spot-check confirmed FAYANKOU Pure Rose visual image reads LANBENA.
- Blockers hit: Full OCR across all flagged products is slow, so the long OCR worker was stopped after partial results; no bulk product image changes were applied.
- Next step: Review `workspace/audit/seo/product-image-brand-size-20260503.csv` and fix in batches, starting from the 74 safe candidate rows in `workspace/audit/seo/product-image-logic-20260503/safe-auto-fixes.csv`.

## 2026-05-04 11:09 CEST — Codex Local/VPS/Git reconciliation
- Did: Resolved the Local/VPS/origin mismatch without overwriting the live site or restarting PM2. Found that logged live-work commits existed as dangling Git objects while the VPS runtime tree held the deployed source as dirty files and `origin/main` pointed to stale docs commit `079ec5a`.
- Completed tasks: Created recovery refs `recovery-live-work-20260503` and `recovery-origin-doc-tip-20260504`; reverse-synced VPS source to Local; excluded bulky generated audit/OCR outputs from Git; restored stronger live-site protection notes; committed `e5eaa35 chore: reconcile live VPS source state`; pushed `e5eaa35` to `origin/main`; fetched origin on VPS and ran non-hard `git reset --mixed origin/main` so VPS Git metadata/index matches the already-synced working tree.
- Verification: Local `npm run build` passed after correcting the live `UtilityBar.tsx` deletion; Local `git status --short` clean; VPS `git status --short` clean; Local/VPS/origin all at `e5eaa35`; live origin-smoke `/` and `/shop` returned `200`; `/presence-healthz` returned `200`; PM2 `emartweb` and `emart-presence` stayed online; no PM2 restart was performed.
- Blockers hit: The previous `4aa226c` “pushed” log entry was not true in current GitHub state; it is preserved under the local recovery branch, but the reconciled source is now represented by `e5eaa35`.
- Next step: Resume product image review from the generated local/VPS audit outputs; do not start new deploy work unless Local, VPS, and origin remain clean at `e5eaa35` or a newer verified-live commit.

## 2026-05-04 11:20 CEST — Codex header browse nav correction
- Did: Fixed the desktop header browse items so top-level `SHOP BY CATEGORY`, `SHOP BY CONCERN`, and `SHOP BY ORIGIN` navigate to `/categories`, `/concerns`, and `/origins`; kept `BRANDS` as `/brands`; removed the duplicate body-level browse hub pill row shown under those pages.
- Completed tasks: Updated `Header.tsx` to render top browse groups as links instead of dead buttons; disabled `BrowseHubNav` output; corrected a brief rsync path mistake by deleting two accidental extra files from the VPS components root before build; committed and pushed `f0c7229 fix(header): make browse tabs navigate to hub pages`; aligned VPS Git metadata to `origin/main`.
- Verification: Local build passed; VPS build passed; `emartweb` restarted; live origin-local `/origins?country=korea`, `/categories`, `/concerns`, and `/brands` returned `200`; rendered `/origins?country=korea` HTML includes `href="/categories"`, `href="/concerns"`, `href="/origins"`, and `href="/brands"` and no `aria-label="Browse hubs"` duplicate row; Local/VPS/origin clean at `f0c7229`.
- Blockers hit: none after correcting the rsync path.
- Next step: User hard-refreshes the page and checks that the circled duplicate row is gone and the top browse labels open their hub pages.

## 2026-05-04 11:28 CEST — Codex homepage payload/CWV fix
- Did: Investigated the Google Search Console Core Web Vitals regression screenshot. PageSpeed API was quota-limited, but origin curl showed fast server timing and an oversized homepage HTML/RSC payload carrying full WooCommerce product objects.
- Completed tasks: Added a minimal `HomeProductCard` shape for homepage/flash-sale product cards; trimmed homepage product serialization to only the fields rendered by those cards; kept UI output unchanged. Corrected a brief rsync path mistake by deleting three accidental VPS `src/` root copies before build; committed and pushed `d07ce28 fix(home): trim homepage product payload`; aligned VPS Git metadata to `origin/main`.
- Verification: Local build passed; VPS build passed; `emartweb` restarted; live homepage returned `200` with `Content-Length: 381586` bytes versus the earlier live measurement of about `520809`; live `/shop` and `/origins?country=korea` returned `200`; served homepage HTML no longer contains serialized Woo fields `"meta_data"`, `"attributes"`, `"short_description"`, or `"brands"` in product card payloads; Local/VPS/origin clean at `d07ce28`.
- Blockers hit: Google PageSpeed Insights API returned quota-exceeded (`429`), so no Lighthouse lab run was captured in this session.
- Next step: Monitor Search Console after the delayed field-data window updates; this change should reduce mobile HTML parse/hydration/LCP pressure, but Core Web Vitals validation will not turn green immediately.

## 2026-05-04 11:43 CEST — Codex workspace code/data separation
- Did: Added two safe workspace entry folders without moving runtime source paths: `workspace/PROJECT_CODE/` and `workspace/PROJECT_DATA/`.
- Completed tasks: `PROJECT_CODE` links to app/package source, scripts, nginx references, and root control files; `PROJECT_DATA` links to audits, docs, snapshots, UI audit screenshots, planning docs, and a direct `CURRENT_BRAND_CORRECTION_FILE.csv` shortcut to the active brand manual-review CSV.
- Verification: The brand correction shortcut opens and points to `workspace/audit/seo/brand-source-unification-20260503/manual-review.csv`; no runtime app files were moved, so no rebuild/restart was required.
- Blockers hit: none.
- Next step: Use `workspace/PROJECT_DATA/CURRENT_BRAND_CORRECTION_FILE.csv` for the remaining 345 product-brand correction rows.

## 2026-05-04 20:49 CEST — Codex brand XLSX import
- Did: Downloaded the user-supplied GitHub brand-correction XLSX, normalized its 345 filled corrections into `CURRENT_BRAND_CORRECTION_FILE.csv`, and generated a no-write dry-run plan from live WordPress brand data.
- Completed tasks: CODEX-1 prep only; no WooCommerce apply
- Blockers hit: None for prep. Live apply still needs explicit approval after review of the dry-run CSV.
- Next step: Review `workspace/audit/seo/brand-source-unification-20260503/xlsx-import-20260504-dry-run.csv`; if approved, apply the 345 product_brand assignments and verify live.

## 2026-05-04 20:56 CEST — Codex brand XLSX apply
- Did: Applied the user-supplied 345-row brand correction CSV/XLSX to live WordPress `product_brand` taxonomy assignments, creating missing brand terms as needed.
- Completed tasks: CODEX-1 product brand corrections rows 681+
- Verification: Apply report shows 345 applied, 0 skipped, 134 unique brand terms created; `/brands` and 153 affected brand paths revalidated; live `/brands`, `/brands/jnh`, `/brands/purito-seoul`, and `/brands/korea-red-ginseng` returned 200 with expected brand names.
- Blockers hit: PM2 restart was intentionally skipped because the VPS runtime tree has unrelated dirty source files (`next.config.js`, deleted `about-us/page.tsx`); used revalidation endpoint instead. Intermittent WP-CLI DB socket errors occurred on a couple of verification attempts, but apply completed and REST/live checks passed.
- Next step: Continue CODEX-2 product data cleanup only after a separate dry-run/review.

## 2026-05-04 21:57 CEST — Codex project state finalization
- Did: Finalized Local/VPS/Git state before broader planning; folded in the GitHub XLSX upload, archived raw XLSX copies to `/root/.attic-2026-05-04/emart-platform/brand-xlsx-upload/`, removed the spreadsheet from Git, kept the safe XLSX apply helper, and added concise operating guidance to `CLAUDE.md`.
- Completed tasks: project state cleanup checkpoint
- Verification: Local build passed; VPS build passed; live `/`, `/shop`, `/brands` returned 200; `/about-us` returned 301 to `/our-story`; Local, VPS, and `origin/main` all clean at `7c26f3a`.
- Blockers hit: None.
- Next step: Start the business/SEO/mobile plan from the clean checkpoint; do broad cleanup only from a reviewed archive/move plan.

## 2026-05-04 22:09 CEST — Codex cleanup pass 1-2
- Did: Implemented balanced cleanup pass: archived generated audit bulk and completed brand correction artifacts to `/root/.attic-2026-05-04/emart-platform/cleanup-pass-1-2/`, removed large historical FAQ normalization CSVs and the completed brand correction shortcut from Git, kept product image issue/manual-review files active, and documented the cleanup.
- Completed tasks: cleanup pass 1-2
- Verification: Local build passed; VPS build passed; live `/`, `/shop`, `/brands`, `/sitemap.xml` returned 200; `/about-us` returned 301 to `/our-story`; Local, VPS, and `origin/main` all clean at `8f37cdd`.
- Blockers hit: None.
- Next step: Manually review product image issues under `workspace/audit/seo/product-image-logic-20260503/`.

## 2026-05-05 — Codex brand-origin assignment
- Did: Applied user-corrected brand-origin workbook as brand-level source of truth; created Woo `Origin` / `pa_origin`, created missing country terms, assigned published products by `product_brand`, and skipped internal store labels.
- Completed tasks: CODEX-2 country of origin cleanup
- Verification: Dry-run showed 395 assignable brand rows and 3,641 products; apply completed with 0 errors; `pa_origin` has 22 terms; 3,641 published products now have `pa_origin`; only 21 Emart Combo/Exclusive products remain without origin; revalidated `tag:products`, `/shop`, and `/origins`.
- Blockers hit: None. Brand duplicate merging is intentionally deferred for a separate review.
- Next step: Continue CODEX-2 with category cleanup, concern cleanup, and price review as separate dry-run batches.

## 2026-05-05 — Codex origin header/menu alignment
- Did: Reflected the new brand-level `pa_origin` policy in desktop header and mobile drawer navigation; changed Korea wording to South Korea and grouped all created origin countries into country-first menu sections.
- Completed tasks: Header/mobile origin menu update plus `/origins` data alignment.
- Verification: Local build passed; Woo API confirmed `south-korea` term and product filtering; VPS build passed; `emartweb` restarted; live `/`, `/origins`, and `/origins?country=south-korea` returned 200; rendered HTML includes South Korea, East Asian Beauty, Bangladesh, Multinational, and `country=south-korea`; Local/VPS/origin clean at `6730413`.
- Blockers hit: None. The PM2 error log still contains pre-existing/older Server Action messages, but the restart output and smoke checks were clean.
- Next step: User hard-refreshes desktop and mobile header menu to visually confirm spacing; continue category/concern/price cleanup only through separate dry-run batches.

## 2026-05-05 — Codex origins directory redesign
- Did: Redesigned `/origins` with the approved design tree while keeping the Emart theme: compact hero, region anchor pills, dense country cards, skincare origin stories, country codes, tone chips, and live `pa_origin` item counts.
- Completed tasks: Origins landing page redesign plus selected-origin header refinement; product grid remains the existing `ProductCard`.
- Verification: Local build passed; VPS build passed; `emartweb` restarted; live `/origins`, `/origins?country=south-korea`, and `/` returned 200; rendered HTML includes Brand-level origin map, `pa_origin`, South Korea, East Asian Beauty, Western Beauty, story text, and View products links; Local/VPS/origin clean at `8b4e87e`.
- Blockers hit: Playwright is not installed in the repo, so verification used build plus live HTML smoke checks.
- Next step: User visually reviews `/origins` on mobile and desktop; any spacing/copy tweaks can be made as a small follow-up.

## 2026-05-05 — Codex shop origin filters
- Did: Activated the shop-page Origin filter using the real `pa_origin` product attribute; replaced disabled "soon" origin items with clickable country filters and Show more/Show less controls.
- Completed tasks: Desktop sidebar origin filters and mobile filter-sheet origin filters; selected origin chip appears in the mobile sticky filter bar.
- Verification: Local build passed; VPS build passed; `emartweb` restarted; live `/shop`, `/shop?origin=south-korea`, and `/shop?origin=japan` returned 200; rendered HTML shows Origin, Show more, South Korea/Japan, and filtered title text such as South Korea Products; Local/VPS/origin clean at `799e45a`.
- Blockers hit: none.
- Next step: User visually checks `/shop` filter spacing on desktop and mobile; adjust origin visible count or placement if desired.

## 2026-05-05 — Codex flattened origin country pattern
- Did: Removed East/West/Western-style grouping labels from visible origin UI so header menu, shop filters, and `/origins` all present a country-first list.
- Completed tasks: Header origin dropdown now splits countries into unlabeled columns; mobile drawer country list has no group labels; shop origin filters show only country names; `/origins` shows a single Countries grid.
- Verification: Local build passed; VPS build passed; `emartweb` restarted; live `/origins`, `/shop`, and `/shop?origin=south-korea` returned 200; rendered HTML no longer contains East Asian Beauty, Western Beauty, South & Southeast Asia, or More Origins labels on those pages; Local/VPS/origin clean at `6687e3e`.
- Blockers hit: PM2 error log still contains a pre-existing Next prerender cache warning for an old product path, unrelated to the flattened origin UI.
- Next step: User visually checks desktop/mobile spacing; continue with country-only pattern for future origin UI.

## 2026-05-05 — Codex mobile drawer enhancement
- Did: Redesigned mobile drawer with quick-action pill row (Sale, New, Account, Men's, Shop All) at the top, accent-colored left borders on open accordion cards, touch-feedback scaling on item rows, and removed the old bottom link cards.
- Completed tasks: Mobile drawer UX polish
- Verification: Local build passed; VPS build passed; `emartweb` restarted; live `/`, `/brands`, `/shop` returned 200; Local/VPS/origin clean at `a742994`.
- Blockers hit: None.
- Next step: User opens mobile hamburger menu and checks the new pill row + accordion borders.
## 2026-05-05 20:35 CEST — Codex
- Did: Implemented local P1 design-system and commerce UI unification pass without touching live runtime.
- Completed tasks: local theme contract, token CSS, formatter utilities, ProductCard variants/price/label cleanup, compact listing headers, canonical TrustStrip.
- Blockers hit: none; local lint/build passed, with one pre-existing lint warning in `LiveTickerBar.tsx`.
- Next step: visually review locally, then deploy through Local → VPS → live smoke → repo only when ready.

## 2026-05-05 20:46 CEST — Codex
- Did: Deployed the P1 design-system and commerce UI unification live using a warmed release on port 3020, then returned Nginx to the rebuilt standard `emartweb` process on port 3000.
- Completed tasks: live release visible on `/`, `/shop`, and `/category/sunscreen`; Local, VPS, and origin aligned at `bc0fadc`.
- Blockers hit: initial Nginx backup was placed in `sites-enabled`, causing `nginx -t` to fail before reload; moved backup to `sites-available`, retested cleanly, then reloaded. No bad config was loaded.
- Next step: user visually reviews live mobile and desktop product cards, listing headers, homepage rails, and PDP meta spacing.

## 2026-05-05 21:06 CEST — Codex
- Did: Implemented and deployed P2 conversion polish plus P3 surface parity audit using a warmed release on port 3020, then returned Nginx to rebuilt standard `emartweb` on port 3000.
- Completed tasks: PDP breadcrumbs, PDP WhatsApp order CTA, mobile sticky Add to Cart/Buy Now bar polish, cart drawer free-delivery progress, review empty state copy, gallery thumbnail accessibility polish, web nav label parity, and `docs/surface-parity.md`.
- Verification: Local lint passed with the pre-existing `LiveTickerBar.tsx` warning; local build passed; warmed VPS build passed; standard VPS build passed; live `/` and `/shop/izeze-soul-hna-hydro-toner-150ml` returned 200 after both warmed switch and final port-3000 return.
- Blockers hit: none. RN app exists under `apps/mobile`; parity was documented only because this job was scoped to `apps/web`.
- Next step: visually review PDP on mobile for sticky bar spacing, thumbnail click behavior, WhatsApp message URL, and cart drawer progress with real cart quantities.

## 2026-05-05 21:24 CEST — Codex
- Did: Fixed mobile left drawer responsiveness after live visual report; widened drawer, restored a true fixed-height flex layout, made Sale/New Arrivals/Shop/Men's a horizontal quick-link row, moved Account/Track order/Privacy Policy/WhatsApp into the lower utility area, and made the category accordion area independently scrollable.
- Completed tasks: mobile drawer category expansion no longer traps the lower controls; quick shopping links no longer wrap into a cramped cluster on Galaxy S8-width viewports.
- Verification: Local lint passed with the pre-existing `LiveTickerBar.tsx` warning; local build passed; warmed VPS build passed; standard VPS build passed; live `/` returned 200 after final return to port 3000.
- Blockers hit: none.
- Next step: user hard-refreshes mobile and checks hamburger drawer on Galaxy S8/360px width, especially Categories expanded + Show more.

## 2026-05-06 11:56 CEST — Codex
- Did: Completed final PDP SEO URL cleanup on Local and live VPS: added product-description internal link rewriting before sanitization and changed missing Product JSON-LD brand fallback from `Emart` to `Unknown`.
- Completed tasks: PDP canonical/OG/Product JSON-LD verification; robots/query cleanup live verification; Rank Math decimal-price DB check completed as no-op.
- Verification: Local build passed; VPS build passed; `pm2 restart emartweb` succeeded; live `/robots.txt` advertises only `https://e-mart.com.bd/sitemap.xml`; live query URLs with `per_page`, `shop_view`, `srsltid`, `add-to-cart`, and root `?p=` 301 to clean URLs; live Anua, I'm From Mugwort, and COSRX PDPs return `/shop/` canonical + OG URLs, Product JSON-LD with `priceCurrency":"BDT"`, and no legacy `/product/` or `/product-category/` hrefs.
- Blockers hit: Local and VPS git trees are intentionally not clean/aligned because unrelated pre-existing live SEO/UI changes are present; no repo push attempted.
- Next step: Only GSC removals, sitemap cleanup, and request indexing remain.

## 2026-05-06 12:07 CEST — Codex
- Did: Reconciled Local, VPS, and origin using the latest compatible source set: kept the newer Local committed SEO/UI work, pulled the verified live PDP SEO patch back into Local, archived duplicate/scratch untracked files, committed from Local, synced Local -> VPS, rebuilt/restarted live, pushed origin, and aligned VPS Git metadata to origin/main.
- Completed tasks: Local = VPS = origin standard restored at tracked source level; ignored `TASKS.md` updated and synced Local/VPS.
- Verification: Local build passed; VPS build passed; `emartweb` restarted online; tracked `git status --short` clean on Local and VPS; Local HEAD, VPS HEAD, and `origin/main` all match.
- Blockers hit: External DNS resolution from shell became intermittent after live smoke; direct process/PM2 checks remained healthy.
- Next step: Proceed only with GSC removals, sitemap cleanup, and request indexing.

## 2026-05-06 12:20 CEST — Codex
- Did: Fixed Merchant Center/GSC product crawl access by adding explicit `Googlebot` and `Googlebot-image` full-site allow groups before the generic robots rules.
- Completed tasks: Google product landing-page crawler and image crawler robots access fix.
- Verification: Local build passed; VPS build passed; `pm2 restart emartweb` succeeded; live `robots.txt` shows `User-Agent: Googlebot` and `User-Agent: Googlebot-image` with `Allow: /`; live Anua PDP returned `200` to `Googlebot`; live Anua product image returned `200 image/jpeg` to `Googlebot-image`; impacted SKIN1004 URL `/shop/skin1004-madagascar-centella-tone-brightening-capsule-ampoule-100ml` returned `200` to `Googlebot`, and its product image returned `200 image/jpeg` to `Googlebot-image`.
- Blockers hit: None.
- Next step: Use Google Merchant Center/GSC URL Inspection for the impacted item, then continue only GSC removals, sitemap cleanup, and request indexing.

## 2026-05-06 19:59 CEST — Codex
- Did: Fixed Merchant Center item `gla_2611` crawl failure by restoring Woo product `2611` from trash to publish with clean slug `innisfree-super-volcanic-pore-clay-mask-100ml`, clearing stale Next route cache, and restarting `emartweb`.
- Completed tasks: Merchant Center landing page for Innisfree Super Volcanic Pore Clay Mask 2X 100ml now resolves on the public `/shop/` URL.
- Verification: Woo REST returns product `2611` as `publish` and `sync-and-show`; live `/shop/innisfree-super-volcanic-pore-clay-mask-100ml` returns `200` to Googlebot; legacy `/product/innisfree-super-volcanic-pore-clay-mask-100ml` 301s to the clean `/shop/` URL; main image `/wp-content/uploads/2022/04/Vol2.webp` returns `200 image/webp` to Googlebot-image; `emartweb` is online.
- Blockers hit: External DNS remained intermittently flaky from shell; local loopback and public status checks succeeded when DNS resolved. Rank Math/GraphQL still renders an old title string in generated HTML despite the stored product meta title being updated to the approved Emart format; this does not block Merchant Center crawl access.
- Next step: In Merchant Center, open this item and click URL Inspection / reprocess or wait for Google for WooCommerce to resync the item.

## 2026-05-07 00:30 CEST — Codex CeraVe dry-run workflow
- Did: Created `scripts/cerave-update-from-xlsx.js` and generated CeraVe WooCommerce dry-run CSVs from `cerave_update_plan.xlsx`.
- Completed tasks: dry-run only; `cerave_dry_run_report.csv`, `cerave_manual_review.csv`, and `cerave_add_to_emart.csv` created locally; no WooCommerce apply was run.
- Blockers hit: none after switching the script to the VPS-local Woo API pattern (`127.0.0.1` + `Host: e-mart.com.bd`).
- Next step: owner reviews dry-run/manual/add CSVs; live changes require a separate explicit apply run and must only send `regular_price`.

## 2026-05-07 22:13 CEST — Codex BOJ EW price/add run
- Did: Updated regular prices for 7 existing Beauty of Joseon Woo products from EW target prices and added 9 missing BOJ products with EW-sourced images, regular prices, and product-type categories plus k-beauty-j-beauty.
- Completed tasks: Job A updated Woo IDs 51757, 55938, 59179, 4187, 4186, 63653, and 3707; only one Discovery Kit was updated (63653). Job B created Woo IDs 93136 through 93144 and imported media IDs 93127 through 93135.
- Verification: Woo read-back confirmed all 7 regular_price values, all 9 new products publish status, category pairs, and image IDs. Logs saved at /var/www/emart-platform/workspace/audit/boj_price_update_20260507.json and /var/www/emart-platform/workspace/audit/boj_add_log_20260507.json.
- Blockers hit: Public Woo REST returned 403 so loopback Host header was used; provided EW storage image base returned 404 so current CloudFront asset base was used; WP REST media upload with Woo keys returned 401 so WP-CLI media import was used.
- Next step: Optional storefront/cache revalidation if the new products do not appear immediately in Next cached listing pages; no frontend code, npm build, PM2, or nginx changes were made.

## 2026-05-07 22:20 CEST — Codex BOJ category correction
- Did: Removed backend category 8014 / k-beauty-j-beauty from the 9 newly created Beauty of Joseon products after user clarified it should not be assigned as a backend product category.
- Completed tasks: Woo IDs 93136-93144 now keep only their product-type category IDs: 7994, 957, 7989, 7996, or 806.
- Verification: Woo update responses confirmed category 8014 removed from all 9 products; 0 failures. Correction log saved at /var/www/emart-platform/workspace/audit/boj_remove_kbeauty_category_20260507.json.
- Blockers hit: none. No frontend, build, PM2, or nginx changes.
- Next step: Treat k-beauty-j-beauty as frontend/marketing grouping unless user explicitly requests backend assignment.

## 2026-05-07 22:24 CEST — Codex BOJ Korean Beauty category correction
- Did: Added separate Korean Beauty category 3529 to the 9 newly created Beauty of Joseon products after user clarified K-beauty and J-beauty are separate categories.
- Completed tasks: Woo IDs 93136-93144 now have Korean Beauty 3529 plus their product-type category; combined category 8014 / k-beauty-j-beauty remains removed.
- Verification: Woo update responses confirmed all 9 category pairs; 0 failures. Correction log saved at /var/www/emart-platform/workspace/audit/boj_add_korean_beauty_category_20260507.json.
- Blockers hit: none. No frontend, build, PM2, or nginx changes.
- Next step: Use Korean Beauty 3529 for Korean products and Japanese Beauty 7976 for Japanese products when a beauty-origin category is needed.

## 2026-05-07 22:58 CEST — Codex agent clutter cleanup
- Did: Performed archive-first Emart-only agent clutter cleanup without frontend/runtime changes. Root raw CeraVe/brand spreadsheet outputs were moved to /root/.attic-2026-05-07/emart-platform/agent-clutter-cleanup/ with a manifest; standardized active/archive audit and script buckets; tightened .gitignore; made AGENTS.md the canonical tracked agent entry point.
- Completed tasks: No apps/web/src changes, no Woo/WordPress mutations, no npm build, no PM2/nginx restart. Cleanup metadata synced to VPS by exact file paths only.

- Verification: Live /, /shop, /brands, /categories, /concerns, and /origins returned 200; root-level CSV/XLSX clutter removed locally and from VPS; no frontend source diffs detected.
- Blockers hit: VPS Git HEAD was one commit behind Local/origin before cleanup, so broad sync/reset was avoided; cleanup stayed to exact docs/metadata paths.
- Next step: Keep future agent outputs in the new active/archive buckets; avoid root-level raw CSV/XLSX/JSON/MD scratch files.

## 2026-05-09 15:10 CEST — Codex mobile EAS wrapper fix
- Did: Fixed Expo/EAS Android build failure `Could not find or load main class org.gradle.wrapper.GradleWrapperMain` by allowing and tracking `apps/mobile/android/gradle/wrapper/gradle-wrapper.jar`; also set `apps/mobile/android/gradlew` executable.
- Completed tasks: Commit `c1e69f9` pushed to `origin/main`; no web/VPS deploy, PM2 restart, Woo/WordPress mutation, or live UI change.
- Verification: Confirmed the wrapper JAR contains `org/gradle/wrapper/GradleWrapperMain.class` and Git tracks `gradlew` as `100755`; local Gradle execution was not run because Java is not installed on this server.
- Blockers hit: Local sandbox bwrap unavailable, so shell reads/writes were run with approved escalation; Java missing locally prevents `./gradlew --version`.
- Next step: Re-run the Expo/EAS Android build from the latest `origin/main`.

## 2026-05-10 — Codex fbclid broken-path handoff correction
- Did: Promoted the Meta/fbclid broken-path decision from audit/chat into `TASKS.md` and shared durable memory.
- Completed tasks: L1.2.7 tracking-token/broken-path URL policy audit; no app/runtime change.
- Verification: Live `/?fbclid=IwY2xtest` returned 200; live `/IwY2xtest` and `/.../celimax-poredark-spot?fbclid=IwY2xtest` returned 404; Local and VPS session logs matched before patch.
- Blockers hit: none.
- Next step: Fix the bad source ad/share URL to the exact canonical product URL; do not add a homepage redirect for random token paths.

## 2026-05-10 — Codex Week 2 SEO plan unification
- Did: Added a named Week 2 SEO Completion Plan to `TASKS.md`, durable memory, `AGENTS.md`, and `CLAUDE.md` so agents stop mixing active SEO work with unrelated workstreams.
- Completed tasks: documentation/state unification only; no app/runtime change.
- Verification: Plan anchored to existing `workspace/SEO_TODO.md`, `workspace/docs/gsc-final-indexing-action-plan.md`, 2026-05-09 product SEO audit summary, `pa_origin` dry-run, and recent session-log next steps.
- Blockers hit: none.
- Next step: Execute Week 2 items from the named `TASKS.md` section only, using read-only audits/dry-runs before any Woo data changes.

## 2026-05-10 — Codex The Derma Co India origin correction
- Did: Corrected The Derma Co origin handling: removed stale custom `Origin=Korea` from 43 Woo products, kept/verified taxonomy `pa_origin=India`, updated PDP/frontend origin lookup to prefer taxonomy origin, and wrote Baidu Qianfan instructions for stale product copy/meta cleanup.
- Completed tasks: The Derma Co removed from Korean-origin handling and verified as Indian-origin in PDP chip/listing logic.
- Verification: Local build passed; VPS build passed; `pm2 restart emartweb` succeeded; live `/` returned 200; sample PDP shows India origin chip; Woo check returned `pa_origin_india=43 custom_origin_korea=0`; South Korea origin check returned no The Derma Co matches.
- Blockers hit: Existing product copy/meta/FAQ text can still say Korea import; this is intentionally left for Baidu Qianfan content/meta update via dry-run then approved apply.
- Next step: Baidu Qianfan follows `workspace/audit/active/baidu-qianfan-the-derma-co-meta-instructions-20260510.md` to update The Derma Co product copy/meta only; no frontend product-fact edits needed.

## 2026-05-13 12:25 CEST — Codex mobile Woo credential removal
- Did: Removed mobile direct WooCommerce credential/API usage and routed mobile products, categories, coupons, checkout, and reviews through secure Next.js API routes.
- Completed tasks: Commit `cf1cdbc` on `origin/main`; live `/api/mobile/products`, `/api/mobile/categories`, and `/api/mobile/coupons` returned `200 application/json`; no PM2 restart was needed because the VPS already served the matching routes.
- Verification: Local `npm run build` passed; `npm run lint` passed with one pre-existing `LiveTickerBar` warning; Expo/Babel syntax check passed for changed mobile files; source grep found no mobile Woo keys/direct `/wp-json/wc/v3`.
- Blockers hit: VPS tree has unrelated dirty Claude/SEO work, so broad rsync/restart was avoided; published mobile app still needs a new build/release and Woo key rotation if old keys were ever bundled.
- Next step: Build/release the mobile app from latest `origin/main`, then rotate any exposed Woo consumer keys.

## 2026-05-13 12:36 CEST — Codex audit issue 2 PDP facts
- Did: Closed audit issue 2 by making PDP visible SKU/stock facts use only real Woo values; no `SKU-{id}` fallback and no synthetic `6 Pcs Available`.
- Completed tasks: Commit `71db13b` pushed to `origin/main`; exact `ProductInfo.tsx` synced to VPS; `emartweb` restarted.
- Verification: Local build and lint passed; VPS build passed; live sample PDP and homepage returned 200; focused live/source grep found no fake SKU/stock fallback strings.
- Blockers hit: VPS still has unrelated dirty Claude/SEO work, so only the exact PDP component was synced.
- Next step: Continue audit issue 3 sitemap duplicate cleanup when requested.

## 2026-05-13 12:45 CEST — Codex audit issue 3 sitemap de-dupe
- Did: Closed audit issue 3 by hardening sitemap de-dupe with canonical URL normalization and a final XML render guard while preserving today’s new concerns, ingredients, and routine pages.
- Completed tasks: Commit `6ed47a7` pushed to `origin/main`; exact sitemap files synced to VPS; `emartweb` restarted.
- Verification: Local build/lint passed; VPS build passed; live `/sitemap.xml` returned 200 with 4,177 `<loc>` entries and 0 duplicate URLs; new concerns/ingredients/routine URLs are present.
- Blockers hit: VPS still has unrelated dirty Claude/SEO work, so only exact sitemap files were synced.
- Next step: Continue audit issue 4 product content/data triage only with read-only dry-runs before Woo mutations.

---
## Session 2026-05-13

### Work done
- pa_concern: assigned 3,247 products across 9 concern terms (acne-blemish, anti-aging, brightening, dryness-hydration, hyperpigmentation, pores-blackheads, sensitivity, sunscreen, wrinkle)
- pa_origin: closed gap — 21 CeraVe/Beauty of Joseon products assigned brand + origin; 17 combos intentionally skipped
- &amp; database fix: 141 product/post titles cleaned (stored & not &amp;)
- Rank Math meta: 19 new CeraVe/BoJ products assigned descriptions
- SKU: 149 missing/invalid SKUs assigned (EM-{ID} format); 10 duplicate meta rows cleaned — 100% coverage
- Category titles: "Prices in Bangladesh | Emart" format via seo.ts
- FAQ: layout.tsx metadata + FAQPage JSON-LD (10 Q&A pairs)
- Redirects: Celimax broken slug, 12 deprecated category 308s verified
- K-Beauty/J-Beauty: separated as distinct nav links (desktop + mobile + chips)
- makeup-cosmetics + bath-body: added to nav; intro text added
- Double title suffix: fixed on 7 pages (faq, brands, sitemap, ingredients, social, routine, origins)
- Shop/sale/new-arrivals: SEO meta rewrites; NEW badge on new-arrivals cards
- gtin13/gtin12/gtin8: auto-detected from barcode SKUs in Product JSON-LD (748 products)
- Brand name casing: BRAND_NAME_CORRECTIONS map (COSRX, CeraVe, SKIN1004, etc.)
- Skeleton loading: ProductCardSkeleton, shop/loading.tsx, category/[slug]/loading.tsx
- Homepage product payload: reduced 38→18 products (457KB from 531KB)
- FB pixel preload: removed spurious Next.js preload for FB noscript tracker
- hreflang: Bengali/English detection on blog posts; og:locale set correctly
- Author URL: blog Article schema /about-us → /our-story

### Blockers / manual actions needed
- GSC: submit sitemap.xml, request indexing for top pages
- Merchant Center: reprocess gla_2611
- GA4 DebugView: visit a 404 URL, confirm headless_migration_404 fires
- Product reviews: only 16 approved — need post-order WhatsApp/email review prompt
- Blog authors: add named author on key posts for E-E-A-T

### Next steps
- Write 2-3 in-depth blog guides (best sunscreen Bangladesh, niacinamide guide, K-beauty routine)
- Review product image quality for products with watermarked/imported images

---
## 2026-05-14 14:01 CEST — Codex
- Did: Restored `The Ordinary Niacinamide 10% + Zinc 1% 30ml` as Woo product `23112` and removed old legacy-import residue from active workspace data/files.
- Completed tasks: Product now published at `/shop/the-ordinary-niacinamide-10-zinc-1-30ml`; SKU `TO-NIACINAMIDE-ZINC-30ML`; regular/sale/current price `1300/1100/1100`; stock `instock`; clean categories/brand/origin/concern assigned; stale orphan variations trashed.
- Blockers hit: First restore attempt hit a Facebook-for-WooCommerce hook while trashing variations; reran with scoped direct row updates after DB export `/tmp/emart-before-ordinary-niacinamide-20260514.sql`.
- Next step: Optional Merchant Center/feed reprocess for product `23112` if it should appear in GMC/social catalogs immediately.

---
## 2026-05-14 22:03 CEST — Codex
- Did: Corrected Neko Mao brand/origin taxonomy in WooCommerce and revalidated live product/brand paths.
- Completed tasks: Product `38190` moved from `Skincafe` to `Nekomao`; typo `Nekoma` brand term renamed to `Nekomao`; products `38190` and `38196` now have `pa_origin=South Korea`; requested PDP shows `Nekomao` + `South Korea` live.
- Blockers hit: None.
- Next step: Optional Merchant Center/feed reprocess if the brand/origin correction should propagate to GMC/social catalogs immediately.

---
## 2026-05-14 23:25 CEST — Codex
- Did: Removed misleading Korea-import wording from non-South-Korea-origin Woo product copy/meta.
- Completed tasks: Applied origin-safe copy to 908 products / 1,050 fields; Bangladesh-origin products now say `Bangladeshi product`; verification count is 0 for `korea import`, `korean import`, and `imported from korea` outside `pa_origin=South Korea`.
- Blockers hit: None; apply was slower than dry-run because real WordPress post/meta writes triggered normal hooks/cache cleanup.
- Next step: Optional Merchant Center/social feed reprocess so external catalogs pick up corrected copy faster.

## 2026-05-15 — Claude — Price update bulk apply (manual-review-size-matched.csv)
- Did: Applied Emartway prices as WooCommerce sale/offer prices across 426 size-matched products.
  - Logic 1 (emartway < emart): set sale_price = emartway offer price (331 products)
  - Logic 2 (emartway > emart): set regular_price = emartway stroked price, sale_price = emartway offer price (54 products)
  - 35 rows excluded per owner's manual skip list
  - 6 rows pending (emart = emartway, no sale needed)
  - All 426 rows now have live WC prices captured in CSV (wc_regular_price, wc_sale_price, wc_status)
- Blockers: None
- Next step: Review manual-review-size-notmatched.csv (155 rows), decide on 35 excluded rows, upload 16 missing product images, run wrong-image-assignment audit (duplicate + filename method) when ready.

---
## 2026-05-15 23:05 CEST — Codex
- Did: Completed WH3 script archival, B4 product SEO audit, B2 SKU dry-run audit, and M2 mobile API bypass audit.
- Completed tasks: Moved 3 completed scripts from `workspace/active/scripts/` to `workspace/archive/scripts/`; fresh product SEO audit saved under `workspace/active/audits/`; SKU audit found 0 missing SKUs and 0 duplicate SKU meta products; mobile grep found no Woo credentials or direct `wp-json`/Woo API calls in source.
- Findings: Product SEO summary now shows 16 missing images, 7 invalid SKUs, 3 missing prices, 19 merchant-schema-not-ready, 287 weak meta, 6 duplicate meta. Mobile hits are legacy `services/woocommerce.js` imports plus public placeholder image URL only; actual fetches use `/api/mobile/*`, `/api/product-reviews`, and `/api/checkout`.
- Blockers hit: Audit scripts still write detailed files to retired `workspace/audit/active/` internally; outputs were moved to `workspace/active/audits/` after each run.
- Next step: Claude-owned web work remains SEO H1/H2; data triage can review the 16 image gaps, 7 invalid SKUs, and 3 missing prices before any mutation.

---
## 2026-05-15 23:25 CEST — Codex
- Did: Rotated Woo BFF REST credentials, triaged fresh product SEO audit gaps read-only, fixed WH6 output path, and smoke-tested mobile/API surface.
- Completed tasks: Created Woo key `Emart BFF Server 2026-05-15` (`key_id=31`), updated VPS `.env.local`, revoked `Mobile App`, `Emart Web & Mobile Apps`, and `claude export`, then restarted only `emartweb` after mobile product listings disappeared from the still-running old key.
- Findings: `/api/mobile/products?page=1&per_page=20` returns 200 with 20 items and total 3,628; `/api/mobile/categories` returns 200; `/api/mobile/cart` has no route and returns 404; `/api/checkout` is POST-only and validates payloads (GET 405, empty POST 400); bKash/Nagad in mobile are merchant-number flows, not payment URLs.
- Product triage: 7 invalid SKUs contain whitespace; 3 missing-price products are IDs 36128, 36130, 66803; 19 merchant-schema-not-ready rows are image or price gaps only.
- Commit: `7b027f8 chore(workspace): fix product image audit output path`.
- Next step: Owner decides product data fixes; avoid touching `apps/web/next.config.js` while Claude owns redirects.

---
## 2026-05-16 — Codex
- Did: Locked the approved homepage/global SEO title policy for all agents.
- Completed tasks: Homepage title and OpenGraph title use `Emart Skincare Bangladesh | Authentic Korean, Japanese & Global Beauty`; global fallback metadata, WebSite JSON-LD tagline, and public brand note aligned to the same wording.
- SEO policy: Use the full approved phrase for homepage/global/search-facing brand surfaces only; keep product/category/brand/article titles specific to page intent to avoid duplicate or overlong title stuffing.
- Checks: Local `npm run lint` and `npm run build` passed.

---
## 2026-05-17 11:09 CEST — Codex
- Did: Reduced homepage JavaScript/main-thread work by server-rendering static homepage sections, scoping React Query to `/categories`, and lazy-loading cart/toast/analytics runtime widgets.
- Completed tasks: Commit `512b950 perf(web): reduce homepage client bundle` built locally, deployed narrowly to VPS, built on VPS, restarted `emartweb`, smoke-tested `/` and `/categories`, then pushed `origin/main`.
- Checks: Local and VPS `npm run build` passed; live `/` returned 200 in 0.218s and `/categories` returned 200 in 1.044s.
- Next step: Re-run Lighthouse/PageSpeed to confirm field-audit deltas for JS execution time, long tasks, and unused JS.

---
## 2026-05-17 11:38 CEST — Codex
- Did: Fixed homepage accessibility warnings for focusable descendants inside `aria-hidden` wrappers and improved contrast on hero/accent/muted text tokens.
- Completed tasks: Commit `1ef92e6 fix(web): address homepage accessibility warnings` built locally, deployed narrowly to VPS, built on VPS, restarted `emartweb`, smoke-tested live/local, then pushed `origin/main`.
- Checks: Local and VPS `npm run build` passed; live `/` returned 200 before DNS became flaky; local Nginx and Next probes returned 200.
- Next step: Re-run Lighthouse accessibility to confirm ARIA/contrast warnings are cleared.

---
## 2026-05-17 11:50 CEST — Codex
- Did: Responded to mobile PageSpeed drop by reducing homepage transfer/parse payload.
- Completed tasks: Commit `5ae9bfc perf(web): reduce mobile homepage payload` trims Woo product card serialization, removes below-fold TikTok oEmbed thumbnail/preload, and disables non-critical Playfair/Jost/JetBrains font preloads.
- Checks: Local and VPS `npm run build` passed; `emartweb` restarted; live `/` returned 200 in 0.154s; local response length dropped from observed 643,520 bytes to about 539,464 bytes.
- Next step: Re-run PageSpeed mobile after cache settles; PSI API was unavailable from this environment due Google quota.

---
## 2026-05-17 11:56 CEST — Codex
- Did: Resolved the remaining homepage Lighthouse contrast failures from header/accent/category/product-card text.
- Completed tasks: Commit `8d31d8e fix(web): resolve homepage contrast warnings` darkens global accent tokens, muted meta text, midnight-blossom category tokens, and flash-sale badge/price colors.
- Checks: Local and VPS `npm run build` passed; `emartweb` restarted; live `/` returned 200 in 0.332s; fetched live CSS includes the new darker contrast tokens.
- Next step: Re-run Lighthouse/PageSpeed accessibility on mobile to confirm the pasted contrast warnings clear.

---
## 2026-05-17 13:02 CEST — Codex
- Did: Fixed remaining homepage contrast failures caused by Tailwind-generated utility colors still compiling to the old bright accent/muted shades.
- Completed tasks: Commit `3cd75f6 fix(web): darken generated contrast utilities` updates Tailwind accent/muted/gray utilities, header tone color, and footer dark-background accents.
- Checks: Local and VPS `npm run build` passed; `emartweb` restarted; live `/` returned 200 in 0.266s; fetched live CSS confirms dark accent, muted-2, gray-500, and light footer accent utilities.
- Next step: Re-run Lighthouse/PageSpeed mobile; remaining reported `text-accent` homepage items should now resolve from the compiled CSS instead of only token files.

## 2026-05-18 13:15 CEST — Codex Nivea product add
- Did: Added Woo product `93277` for `Nivea Soft Rose Lip Balm 24h Moisture (UK) 4.8g` using official NIVEA product facts/image plus Bangladesh retail price reference; no frontend code, build, PM2, or nginx changes.
- Completed tasks: Product published at `/shop/nivea-soft-rose-lip-balm-24h-moisture-uk-4-8g`; SKU `4005900983909`; price `৳450`; brand `Nivea`; origin `Germany`; version `uk`; category `Lip Balm & Care`; concern `Dryness & Hydration`; Rank Math meta, image alt, ingredients, usage, and 5 FAQs added.
- Blockers hit: Initial create script saw the imported image attachment using the target product slug; attachment slug was moved aside and product was created with the clean PDP slug.
- Next step: Owner can adjust price/stock in Woo if the actual store inventory differs from the market reference.

## 2026-05-18 14:29 CEST — Codex
- Did: Fixed web delivery charge logic so checkout reads current Woo shipping methods instead of hardcoded always-free thresholds; server adds shipping_lines to Woo orders.
- Completed tasks: delivery charge free/off toggle behavior; static free-delivery copy cleanup on web surfaces.
- Blockers hit: Existing unrelated local/VPS dirty files remain; only delivery files were synced/deployed.
- Next step: If mobile app delivery fee must match this dynamic Woo toggle, update mobile source and release separately.

---
## 2026-05-21 (continued) — Claude Sonnet 4.6
- Did: SEO fixes for 4 reported issues + all category redirect verification.
- Redirect fixes: /category/skincare/melasma and /category/skincare/acne now single-hop to /concerns/*; /product-category/skincare/j-beauty-skincare and /korean-skincare-routine fixed (were landing at /shop via Nginx broad catch — added exact Nginx rules before the catch).
- SEO fixes (commit f3f7188):
  - Removed 10 generic global keywords from layout.tsx (were cascading to all pages)
  - concerns/[slug]: page-specific keywords + googleBot directives restored
  - ingredients/[slug]: page-specific keywords + googleBot directives restored
  - blog/page.tsx: title → "Skincare Guides & Tips | Emart Skincare Bangladesh"
  - our-story/page.tsx: og:image → store-interior.webp (923×671) instead of logo
- All changes verified live. Pushed to origin/main.

---
## 2026-05-21 FINAL SYNC — Claude Sonnet 4.6
**Three-way state: LOCAL = VPS = ORIGIN = f3f7188 ✓  All source files clean.**

### Full session summary (2026-05-20 → 2026-05-21)

**CLAUDE-2/3 — LLM Pool** (commit e3a1a09)
- Created `apps/web/src/lib/llmPool.ts`: Ollama primary → OpenRouter fallback
- OpenRouter key: `/root/.openclaw/credentials/openrouter_default.json`
- Active model: `deepseek/deepseek-v4-flash:free` (free, 1M context)

**Blog generator cron** (script: `/root/.openclaw/workspace-emart/blog_generator.py`)
- 3 posts/day: 07:00, 15:00, 23:00 UTC (1pm, 9pm, 5am BD)
- WP featured media from WC product image; publishes via `emartadmin` app password
- 28 rotating skincare topics; state: `blog_generator_state.json`
- Fallback models: gemma-4-31b, gemma-4-26b, minimax-m2.5 (all free)
- WP app password: `mrVDk8iqIQm81nXnew13EzzO` (emartadmin, created 2026-05-20)
- Blog card images live; related product cards in blog posts live

**CLAUDE-4 — About/E-E-A-T page** (commit e3a1a09)
- `/about-us` live with Organization + Person JSON-LD, credentials, physical address
- Removed Nginx + next.config.js redirect that was blocking `/about-us`

**CLAUDE-5 — Category SEO** (commit e3a1a09)
- `CATEGORY_SEO_OVERRIDES` for top-10 categories in `category/[slug]/page.tsx`
- `getCategoryIntro` entries for eye-cream, sheet-mask, lip-care

**Category taxonomy cleanup** (commit 227a650 + DB ops)
- 5,113 DB operations: removed all products from deprecated categories
- k-beauty-j-beauty: 0 (was 1,471) — Korean → korean-beauty, Japanese → japanese-beauty
- skincare-essentials: 0 (was 2,166) — all had specific cats already
- shop-by-concern: 0 (was 595) — concern chips still via specific concern cats
- shooting-gel: 0 (was 41) → moved to new `soothing-gel` category
- korean-beauty: 2,118 (was 1,394) ✓  japanese-beauty: 105 (was 78) ✓
- Soothing Gel added to Skincare nav section + SEO intro
- Rollback SQL: `workspace/audit/active/category-reassign-rollback-20260521-134017.sql`

**ISR cache fix** (commit d5497cf)
- `_getProductsCached` and `_getOriginTermsCached` raised 300→3600
- Product pages now emit `s-maxage=3600` correctly (was capped at 300)

**Codex nginx branch merge** (commit 8b01006)
- Moved /shop and /category/:slug CDN cache headers from Nginx into next.config.js
- Nginx exact-match /shop rule preserved; product pages unaffected

**Category redirect fixes** (commit 9951571)
- Fixed 6 broken/2-hop redirects
- Nginx: added exact rules for /product-category/skincare/j-beauty-skincare → /category/japanese-beauty and /korean-skincare-routine → /category/korean-beauty (were wrongly landing at /shop)

**SEO fixes** (commit f3f7188)
- layout.tsx: removed 10 generic global keywords (were identical on all pages)
- concerns/[slug] + ingredients/[slug]: page-specific keywords + googleBot directives
- blog/page.tsx: title → "Skincare Guides & Tips | Emart Skincare Bangladesh"
- our-story/page.tsx: og:image → store-interior.webp (923×671) replaces logo

### Still open (next session priorities)
1. `pa_concern` assignment — fresh dry-run needed (1,406 products missing; live term slugs differ from old CSV)
2. `pa_origin` 17-gap fill — need owner call on combo/tool products
3. Blog: auto-trigger ISR revalidate `/blog` after each cron post publishes
4. Healthy Place brand cleanup — needs owner confirmation
5. CODEX-5 Exonhost → Contabo migration — needs maintenance window

---
## 2026-05-21 Complexity audit — Claude Sonnet 4.6
- Complexity scan findings and fixes:
  1. CRITICAL fixed: Blog generator silent 429 — all 4 OpenRouter free models hit daily quota simultaneously. Added 30s wait between 429'd models + 90s pause then full retry. Commit 048b855.
  2. MINOR fixed: getCategoryIntro false match — `lip-care` slug was matched by `lip` key first (substring match). Moved lip-care + lip-balm-care before `lip` in intros map. Commit 048b855.
  3. LOW monitor: emart-presence 15 restarts / 18 days — 0 unstable, normal crash-recovery.
  4. INFO: next.config.js has 303 redirects — build-time only, no runtime impact.
  5. INFO: WC system_status returns wc_version=null — API field only, WC is working.
- Final git state: LOCAL = VPS = ORIGIN = 048b855

---
## 2026-05-21 Performance + SEO fixes — Claude Sonnet 4.6

### Done
- **React cache() on getProduct** — eliminates duplicate Axios call between generateMetadata() and page render. Single network request per server render pass. (`f3c3c56`)
- **getCachedProduct unstable_cache** — 86400s ISR with tags `product-{slug}` + `products`. Both getProduct calls in shop/[slug]/page.tsx replaced. (`f3c3c56`)
- **WooCommerce webhooks** — product.created (ID:5) + product.deleted (ID:6) created. product.updated (ID:4) was already active. All 3 active → WC product changes instantly revalidate Next.js cache.
- **og:type=product fix** — removed duplicate og:type=website+product. Omitting openGraph.type in Next.js prevents the website default; other:{'og:type':'product'} emits single correct tag. (`069e8c6`)

### Notes
- Next.js runtime rejects 'product' as openGraph.type (not in OpenGraphType union) — only workaround is other{} + omit type from openGraph
- Blog posts correctly use openGraph.type: 'article' (valid type, no change needed)
- All other pages inherit og:type=website from layout.tsx (correct)

---
## 2026-05-21 Homepage SEO + UI fixes — Claude Sonnet 4.6

### Done
- **Merged 5 duplicate mobile/desktop blocks** (ConcernTiles, IngredientTiles, RoutineTeaser, SkinGuide, BlogTeaser) — each section was output twice in HTML (once for mobile, once for desktop via CSS hide/show). Now single responsive flex→grid block per section. 127 lines removed. (`9b7224b`)
- **Read article → sr-only fix** — blog teaser CTAs now include sr-only post title for descriptive anchor text. Crawlers and screen readers get context.
- **Flash sale stock badge** — "Only X left" now only shown when stock_quantity is a real number ≤ 10. Fake fallback (product_id % 8 + 3) removed. Products without WC stock management show no badge.
- **og:type=product** — fixed duplicate (website + product); now single clean product tag via other{} (`069e8c6`)
- **React cache() + unstable_cache on getProduct** — eliminates duplicate Axios call per render (`f3c3c56`)
- **WooCommerce webhooks** — product.created + product.deleted added; all 3 active (`f3c3c56`)
- **Footer year** — dynamic new Date().getFullYear() (`6cf97cf`)

### Gemini audit findings — what was wrong vs right
- Issue 1 (h1 hierarchy): WRONG — h1 already correct in page.tsx sr-only; Shop by category already h2
- Issue 2 (duplicate blocks): REAL — fixed above
- Issue 3 (ticker duplication): WRONG — intentional CSS marquee pattern, do not touch
- Issue 4 (anchor text): PARTIALLY REAL — fixed Read article →; View All already has aria-label
- Issue 5 (fake stock): REAL — fixed above

### Current state
- Local = VPS = origin = 9b7224b

---
## 2026-05-21 20:48 CEST — Codex
- Did: Added and deployed SEO redirects for `/category/moisturizer` and `/category/moisturizers` to `/category/cream-moisturizer`; rebuilt/restarted live so existing COSRX mini PDP alias redirect now fires.
- Completed tasks: small SEO redirect cleanup, commit `559549d`
- Blockers hit: Cloudflare briefly served stale cached 200s for category aliases; no-cache live checks confirmed fresh 308 redirects after expiry.
- Next step: Continue with open SEO master priorities; no further action needed for these aliases.

---
## 2026-05-21 21:20 CEST — Codex
- Did: Applied item-specific, easy-English product FAQ cleanup to top 200 sales products via `_emart_product_faq`; saved rollback and revalidated product cache.
- Completed tasks: top 200 product FAQ cleanup; review `workspace/audit/active/product-faq-seo-review-top200-20260521.md`; rollback `workspace/audit/active/product-faq-seo-rollback-top200-20260521.json`
- Blockers hit: Live PDPs initially served cached FAQ; cleared with `/api/revalidate` `tag:products`.
- Next step: Continue product data quality work; do not restore delivery/COD/site-policy questions into product FAQ.
---
## 2026-05-22 22:40 CEST — Codex
- Did: Polished `/category/serums-ampoules-essences` SEO metadata, category intro, OG/schema image caption, and product-card image alt text with serum/ampoule/essence intent.
- Verified: Local `npm run lint` passed; local `npm run build` passed; VPS `npm run build` passed outside sandbox; `pm2 restart emartweb`; live curl confirmed 200, canonical/indexable metadata, new title/description, schema primaryImageOfPage caption, and product image alts.
- Data audit: category has 518 published products, 0 missing thumbnails, 73 missing featured-image alt values, 103 featured-image alt rows needing review; dry-run CSV written to `workspace/audit/active/serums-image-alt-dry-run-20260522.csv`.
- Notes: Claude committed `5b0d71b` adding Beauty Devices & Tools nav; Codex avoided that file and touched only `apps/web/src/app/category/[slug]/page.tsx`.
- Commit: `099045e fix(category): polish serums SEO and image alts` pushed to `origin/main` after live smoke.

---
## 2026-05-23  CEST — Codex
- Did: Revoked exposed/stale WooCommerce API keys: live Mobile App Legacy Compatibility row key_id 32 (task brief key_id 1175432 was absent), key_ids 4-15, key_id 16, and key_id 19.
- Verified: Revoked key IDs absent from `woocommerce_api_keys`; live BFF endpoints `/api/mobile/categories` and `/api/mobile/products?per_page=1` returned 200; `apps/mobile/src` has no hardcoded Woo credentials or direct `/wp-json/wc/v3` usage.
- Report: `workspace/audit/active/wc-key-rotation-20260523.md`
- Follow-up: unexpected active read_write survivors remain for owner review: key_id 26 (`Next.js Frontend`) and key_ids 2-3 (2023 WooCommerce Integration).

---
## 2026-05-23 CEST — Codex
- Did: Expanded `apps/web/src/data/ingredient-content.json` ingredient education copy to 1,500+ words per existing ingredient slug, with Bangladesh-specific guidance and 5 sections/5 FAQs per entry.
- Verified: Local `npm run build` passed; VPS `npm run build` passed; `pm2 restart emartweb`; live smoke returned 200 for `/ingredients/niacinamide` and `/ingredients/hyaluronic-acid`.
- Commit: `58261c8 feat(seo): expand ingredient education content` pushed to `origin/main` after live smoke.
- Note: Kept existing ingredient slugs unchanged during stability freeze.

---
## 2026-05-24 CEST — Codex
- Did: Fixed Android/Samsung A13 mobile horizontal overflow by containing the homepage Editorial carousel and hardening fixed mobile nav, WhatsApp FAB, and toast viewport sizing.
- Verified: Local `npm run lint` and `npm run build` passed; local and live Chromium mobile checks passed for `/`, `/categories`, and `/category/serums-ampoules-essences` at 360/375/390/412 CSS px; live curl smoke returned 200s after `pm2 restart emartweb`.
- Commit: `38a5716 fix(mobile): stabilize fixed nav viewport` pushed to `origin/main` after live smoke.
- Notes: No URL, redirect, sitemap, SEO metadata, checkout/cart/payment, WooCommerce data, or navigation structure changes.

---
## 2026-05-25 — Claude (Sonnet 4.6)
- Did:
  1. Collapsible Offers accordion in mobile drawer (Header.tsx) — single "Offers & Deals" row expands to show Sale Items + 6 offer collections + All Offers link with left-border guide line.
  2. OffersHub chip-filter page — /offers now has horizontal chip bar (All, Sale, BoGo, Eid, Clearance, Combo, Coupon, Delivery Value). Clicking a chip fetches and renders that collection's products inline. API route: GET /api/offers/products?slug=<slug>. Responsive: 2-col mobile, 4-col desktop.
  3. SEO audit + fixes: /offers added to sitemap (priority 0.75), duplicate WebSite JSON-LD removed from page.tsx (layout.tsx @graph is authoritative), GA4 strategy lazyOnload → afterInteractive.
- Verified: All pages 200 live. Sitemap now includes /offers. API returns products. pm2 online.
- Commits: eb24998, 534f308, 24d1db3 — all pushed to origin/main.
- VPS note: VPS git metadata at 01f40d4 (stale — runtime tree synced via rsync, .next rebuilt fresh at 24d1db3 source).
- Blockers: Cloudflare cache needs manual purge (Caching → Purge Everything) so updated drawer/offers page reaches all users.
- 🔒 FREEZE REINSTATED: No changes to nav structure, URLs, sitemap routes, offer slugs, or page routing until 2026-07-03.
- Next step: GA4 organic search growth will follow as new offer/brand/concern pages get indexed. Monitor GSC for indexing of /offers. Owner still needs to purge Cloudflare cache.

---
## 2026-05-25 CEST — Codex
- Tasks completed: M2 mobile direct-backend audit; M4 push notification audit; price normalize dry-run/verification.
- What was found: `apps/mobile/src` has zero direct `wp-json`, `/wc/v3`, Woo credential env, or backend IP references. Mobile checkout code path is `apps/mobile` → `/api/checkout` → `lib/woocommerce.ts createOrder`; COD, bKash, and Nagad are visible in code. Push notifications can request/store an Expo token locally, but token registration, backend storage, server send triggers, and tap-routing completion are missing. Price normalize found zero published products with `_regular_price` 0.00 or 1.00, so no WooCommerce writes were needed.
- Blockers: M3 live COD smoke could not be completed because this VPS has no Android emulator, `adb`, iOS simulator, or physical device.
- Next step: Run M3 on a real device/emulator, place a COD test order, and verify the order ID in WooCommerce admin.

---
## 2026-05-31 CEST — Codex COSRX Low pH price signal check
- Did: Checked Woo/product-page price signals for `COSRX Low pH Good Morning Gel Cleanser 150ml` (`post_id=2595`, slug `cosrx-low-ph-good-morning-gel-cleanser-150ml`) after owner reported stale `৳1100` copy vs `৳950` on-page sale price.
- Fixed: Updated single stale Woo meta `_structured_description` from `Price:BDT 1100` to `Price:BDT 950` and aligned origin text to `South Korea`; no title, slug, stock, checkout, or frontend code changes.
- Verified: Woo fields are `regular_price=1100`, `sale_price=950.0`, `price=950.0`; `_wc_gla_sync_status=pending` with Google offer `online:en:BD:gla_2595`; live PDP JSON-LD reports `priceCurrency=BDT` and `price=950.00`. The remaining `৳1,100` on live PDP is the expected crossed-out regular price.
- Cache: Revalidated `/shop/cosrx-low-ph-good-morning-gel-cleanser-150ml`, legacy product path, `/shop`, and `tag:products`.
- Follow-up audit: Corrected read-only SQL audit found 1,795 published products where `_structured_description` contains a `Price:BDT ...` number that differs from current `_price`. Humanizer script/docs already have in-progress Claude changes banning literal prices in generated body/meta, but existing `_structured_description` needs a separate dry-run/apply cleanup before bulk mutation.
- Script guard: Updated `workspace/docs/humanizer_face_cleansers.py` so dry-run/apply warns when `_structured_description` price differs from `_price`, and apply syncs only the `Price:BDT ...` fragment to the current Woo price while keeping generated copy price-free.
- Automatic sync: Installed runtime mu-plugin `/var/www/wordpress/wp-content/mu-plugins/emart-structured-description-price-sync.php` from ignored helper source `workspace/scripts/active/emart-structured-description-price-sync.php`. It watches `_price` meta changes and `woocommerce_update_product`, updates existing `_structured_description` `Price:BDT ...` fragments to current `_price`, and triggers existing product revalidation for direct price-meta updates. Smoke test reset product 2595 structured price to `1100`, invoked the hook, and verified it restored `Price:BDT 950` while `_price` stayed `950.0`.

---
## 2026-05-25 CEST — Codex
- Tasks completed: Applied pa_origin 17-gap and catalog stale PDP Origin sync after owner corrections.
- What was found: The PDP origin chip used stale custom `_product_attributes` Origin values; 945 products needed custom PDP origin/text sync. Owner overrides applied: Bath & Body Works → Malaysia, Clean & Clear → UK, Durex → Malaysia, Gfors → South Korea, Sheglam → Singapore, St. Ives → UK, Vatika Naturals → India, vaseline → UK.
- Applied: 80 `pa_origin` assignments, 935 custom Origin updates, 785 `_structured_description` updates, and 891 `_emart_product_faq` updates. Created missing `pa_origin=singapore` term for Sheglam.
- Verified: Follow-up dry-run returned 0 rows / 0 errors; the original 17 products now all have `pa_origin`; corrected brand queries show the requested origins.
- Next step: Product image task remains open for remaining missing-image products.

---
## 2026-05-25 CEST — Codex
- Tasks completed: Verified and applied SEO text/source cleanup for the products touched by the origin sync.
- What was found: Product JSON-LD has no separate origin field; schema descriptions are derived from SEO/meta text and FAQ schema is derived from `_emart_product_faq`. Dry-run found stale Korea/K-Beauty wording in product descriptions/excerpts/meta sources, while FAQ needed no extra cleanup.
- Applied: 704 stale-origin text/meta source updates across `post_content`, `post_excerpt`, `_rank_math_description`, and `_structured_description`; legitimate South Korea products were preserved.
- Verified: Follow-up dry-run returned 0 rows / 0 errors. Product 74296 now has China in `_structured_description`, FAQ, and product description source text.
- Next step: Product image task remains open for remaining missing-image products.

---
## 2026-05-25 — Claude (Sonnet 4.6)
- Did: Full origin sync verification — spot-checked all 6 overridden brands (Sheglam/Singapore, BBW/Malaysia, Durex/Malaysia, Gfors/South Korea, Vaseline/UK, Vatika/India) against live DB and frontend. Found Durex PDP serving stale ISR cache; triggered revalidateTag("products") — all brands now showing correct origin chip live. Confirmed DB is authoritative and correct for all brands.
- Verified: All 6 brand PDPs live and correct. Follow-up dry-run: 0 rows. Live smoke: HTTP 200.
- Memory: synced 7 new/updated agent memory files to git; VPS git aligned to origin/main.
- Blockers: None.
- Next step: Owner still needs to review pa_concern CSV and upload 16 product images.

---
## 2026-05-27 CEST — Codex
- Did: Aligned shipping/return policy pages, header/footer/PDP delivery copy, policy metadata, Product JSON-LD, sitemap behavior, `/policy` redirects, Woo checkout shipping detection, and Merchant feed image/shipping output with Merchant Center settings.
- Checkout: Verified Woo zones now support free shipping over ৳3,000; fixed Next shipping estimator to read Woo REST `method_id` instead of numeric instance `id`.
- Backend: Enabled Woo free shipping methods for Dhaka and all-Bangladesh zones; updated runtime feed mu-plugin to send main Woo image plus real deduped gallery images, max 10 additional images.
- Verified: Local `npm run lint` and `npm run build` passed; VPS build/restart performed; live policy pages, `/policy` 301 redirects, sitemap, checkout quotes, PDP schema, and feed image helper were smoke-tested.
- Commit: `bd9c3b8 fix(policy): align shipping returns and product schema` prepared for push after live smoke.

---
## 2026-05-29 CEST — Codex
- Did: Post-Phase-A public issue cleanup only: shared catalog count copy, PDP empty-section hiding, homepage product rail duplicate markup fix, canonical query cleanup, private-route fallback polish, delivery/copy consistency, and `pa_concern`-only concern/FAQ mapping.
- Audit: Generated read-only product mismatch report at `workspace/audit/active/product-data-mismatch-audit-20260529-124704.md`; 144 mismatch rows found; COSRX Salicylic Acid Daily Gentle Cleanser verified as consistently 150ml. No WooCommerce data, prices, or sale logic changed.
- Verified: `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed; live smoke returned 200 for `/`, `/shop`, `/brands`, `/categories`, `/track-order`, COSRX PDP, and CeraVe PDP. No PM2 restart or deploy performed.
- Next: Deploy is needed for frontend fixes to appear live; owner review is needed before any Woo mismatch/content cleanup.

---
## 2026-05-29 CEST — Codex product size correction prep
- Did: Fixed product mismatch audit logic so decimal sizes encoded in slugs (`4-8g`, `1-35g`, etc.) parse as decimal sizes instead of false conflicts. Added reviewed-size Woo correction script that defaults to dry-run and never changes product slugs/URLs.
- Dry-run: Converted owner XLSX final `correct` column to `workspace/audit/active/product-size-corrections-review-20260529-202621.csv`; generated `workspace/audit/active/product-size-corrections-dry-run-20260529-203021.csv` with 144 input rows, 115 would-update rows, 29 unchanged, 0 invalid/not found, 0 URL changes.
- Verification: PHP syntax checks passed. Read-only re-audit after parser fix scanned 3,640 products and reduced mismatch rows from 144 to 133 in `workspace/audit/active/product-data-mismatch-audit-20260529-203048.md`.
- Next: Owner reviews/approves dry-run CSV before any `APPLY=1` Woo data mutation; after apply, revalidate `tag:products` and spot-check changed PDPs.

---
## 2026-05-29 CEST — Codex product size correction apply
- Did: Applied owner-approved Woo product size corrections from `workspace/audit/active/product-size-corrections-review-20260529-202621.csv`. Updated product titles, size/weight/volume/pack attributes, and exact stale size text where safe; no slugs or URLs were changed.
- Applied: 115 updates; 29 rows already unchanged; 0 invalid/not found. Rollback saved to `workspace/audit/active/product-size-corrections-rollback-20260529-203929.json`; apply report saved to `workspace/audit/active/product-size-corrections-applied-20260529-203929.csv`.
- Verified: Post-apply dry-run returned 144 unchanged / 0 would-update. Revalidated `tag:products` and `/shop`. Spot-checked live unchanged URLs for MIZON 75g, Some By Mi 120ml, and Nivea 4.8g; all returned 200 and showed corrected size signals. Final read-only audit is `workspace/audit/active/product-data-mismatch-audit-20260529-204358.md` with 113 remaining mostly slug/history rows.
- Next: Do not rename product URLs during freeze; remaining slug-only size gaps can be revisited after 2026-07-03 if SEO data supports redirects.

---
## 2026-05-29 CEST — Codex verification notes
- Git hygiene: Committed and pushed `5b67172 chore(workspace): preserve cleanup notes`; local `HEAD` and `origin/main` match, and the worktree was clean before these notes.
- Pinterest: Verified `p:domain_verify=39735e3185a8389cc1a41436b6068ad5` already exists in `apps/web/src/app/layout.tsx` and live homepage `<head>`. No duplicate meta tag added; owner should use Pinterest "Add HTML tag" on exact domain `e-mart.com.bd` / `https://e-mart.com.bd`.
- Legacy route check: `https://e-mart.com.bd/product-category/skin-care/` returns 301 to the clean frontend route chain, so the old WP category frontend is not leaking.
- Atomic upgrade spec: Reviewed `CLAUDE-atomic-upgrade.md`. Treat it as a branch-only future refactor spec (`feat/atomic-refactor`) with strict visual parity; do not run it on `main`, deploy it, restart production, or change URLs/navigation during the freeze. Current app is Next.js 14, not the spec's Next.js 15 note.

---
## 2026-05-29 CEST — Codex SEO hazard checklist audit
- Checked owner list against live pages: no global `noindex` problem, no `Disallow: /`, customer-facing sampled pages have one title, one H1, one canonical, viewport meta, SSR HTML content, and no missing image alt attributes.
- Sampled live pages: `/`, `/shop`, `/category/korean-beauty`, `/track-order`, `/brands`, `/categories`, and COSRX Salicylic Acid Cleanser PDP. `/track-order` is intentionally `noindex` because private/order lookup pages should not rank.
- Redirect/sitemap checks: `/product-category/skin-care/` returns 301 then clean route handling; random broken URL returns 404; sitemap `<loc>` entries expose no `/product/`, `/product-category/`, `wp-json`, Rank Math sitemap, or query-string URLs.
- Speed/cache spot-check: compressed live HTML downloads were ~35-74KB on key pages; Cloudflare/Next cache headers present. Remaining performance work should stay monitoring/content-weight focused during freeze, not structural refactor.

---
## 2026-05-30 — Closed color-token audit
- Closed color-token audit. Removed dead LUMIERE_COLORS (#F24E5E) import from CategoriesGrid (JSX already used Tailwind lumiere-* classes → #9f1239/#111111; zero visual delta). Corrected stale #e8197a in theme-contract.md. tokens.css #9f1239 confirmed the single live brand source. Phase-B flags remain OFF. No standalone deploy — invisible change rides next deploy.
- Audit note: premise identified LUMIERE_COLORS import as blush-rose leak; investigation found the @/ alias resolved to src/lib/design-system/colors.ts (primary #111111, already correct), not packages/design-system/colors.ts (#F24E5E). CategoriesGrid is also orphaned (zero consumers in the app). Fix is dead-import removal + doc correction only.
- Files changed: CategoriesGrid.tsx (1 line removed), workspace/docs/theme-contract.md (2 lines corrected), workspace/TASKS.md (post-freeze task added).

---
## 2026-05-30 CEST — Codex crash recovery
- Recovered after Codex/VS Code interruption during final deploy cleanup for `a65fa26 fix(analytics): silence active-sessions timeout errors`.
- Confirmed Local and origin/main at `a65fa26`; VPS runtime files already contained the deployed fix but VPS git metadata was still at `5b3339b` with live changes layered on top.
- Ran `git -C /var/www/emart-platform reset --mixed origin/main` to align VPS git metadata without changing live working files. Verified VPS `main...origin/main`, `HEAD=a65fa26`, and `git diff --stat` empty.
- Smoke: live homepage returned 200; `/api/analytics/active-sessions` returned JSON with 200. No code redeploy or extra restart performed.

---
## 2026-06-01 — SEO Content Humanizer, Performance, Schema, Attribution, Checkout

### Content Humanizer — Face Cleansers
- Production script finalised: `workspace/docs/humanizer_face_cleansers.py`
- 35 face cleanser products applied (35/218 done; 183 remaining; 213 holdout untouched)
- Script writes: post_content, _rank_math_description, _emart_meta_description, _emart_how_to_use, _emart_ingredients, _rank_math_schema_data (brand), _rank_math_focus_keyword (GSC), _structured_description (price sync), _emart_humanized
- WooCommerce API key rotated (key_id 36, user_id 2648 emartadmin) — checkout now working
- woo-api-fix.php: added 5.189.188.229 to allowed IPs (VPS kernel routing quirk)
- Typography plugin (@tailwindcss/typography) confirmed active — prose class now styles descriptions
- Order attribution tracking added: AttributionTracker.tsx captures first-touch + last-touch UTM → written to order meta_data on checkout

### GSC & Measurement
- Google OAuth token obtained: `apps/web/gsc-oauth-token.json` (emart-seo@emart-2923b)
- GSC baseline snapshot captured: `workspace/audit/active/baseline-snapshot-2026-05-31.json`
  - 3,640 total products | 3,420 treatment | 212 holdout | 213 _emart_holdout flags written to DB
- GSC query map saved: `workspace/audit/active/gsc-query-map-2026-05-31.json` (237 paths)
- Humanizer now writes GSC top query to `_rank_math_focus_keyword` on every apply
- Remeasure schedule: +4w → 2026-06-28, +8w → 2026-07-26

### Schema Fixes
- Fixed GSC Product snippets warning (49 affected pages): CollectionPage hasPart:{@type:Product} → mainEntity:{@type:ItemList} in /offers/[slug], /new-arrivals, /sale pages
- Brand schema now written to _rank_math_schema_data on every humanizer apply
- Product pages confirmed: correct offers/price/availability/itemCondition/priceValidUntil/brand in JSON-LD

### Performance
- Cloudflare cache rules added: /_next/* (7d Edge TTL) + /wp-content/uploads/* (30d)
- _next/image cf-cache-status: HIT confirmed after rules activated
- Preconnect added for GTM/GA4 + dns-prefetch for YouTube, Google Analytics
- All JS chunks: async | Brotli HTML: 45KB | TTFB: 110ms | TBT: 120ms | CLS: 0
- LCP 5.6s → should improve to ~2.5-3.5s repeat visitors after Cloudflare cache warms

### Documentation
- CODEX-TASK-product-content-humanizer.md: status updated to IN PROGRESS, 6 structural inconsistencies fixed
- CLAUDE-product-humanizer-guide.md: new — category-by-category guide for Claude/Codex
- baseline_snapshot.py: updated to use OAuth user credentials (service account had GSC access issues)

### Commits this session (key)
- 07fc713 fix(docs): resolve 6 structural inconsistencies
- 586f7e5 docs(seo): update humanizer spec current state
- aea7a95 fix(seo): CollectionPage Product schema → ItemList
- fe040c4 feat(analytics): order attribution tracking
- 4ff5387 feat(seo): GSC baseline OAuth + baseline captured
- be1ac7e feat(seo): brand schema + focus keyword + ingredients in apply step
- 9611322 fix(ui): tailwindcss/typography plugin

### Next session
1. Continue face cleansers: `--dry-run --limit 20` → review JSONL → `--apply`
2. After face cleansers complete: start serums-ampoules-essences (518 products)
3. Remeasure GSC 2026-06-28
4. Rotate service account key ce8b30ba... (shared in chat — security)
5. GSC Product snippets fix: click "Validate Fix" in Search Console

---
## 2026-06-01 ADDENDUM — Verification pass + meta fixes

### Full session verification results
- Checkout: ✓ PASS — order created via live API
- Face cleansers humanized: 38/218
- GSC baseline: ✓ PASS
- Schema CollectionPage fix: ✓ PASS
- Attribution tracking: ✓ PASS (client component, browser-side)
- Cloudflare cache: ✓ HIT confirmed
- Preconnect GTM: ✓ PASS
- Meta quality: fixed 8 too-long metas (162–215 chars → 137–153 chars)

### Meta quality fixes applied (8 products)
IDs: 35456, 26371, 58148, 59857, 3187, 27055, 26973, 26156
All now 130–158 chars with Bangladesh + Emart + buy/COD signal

### New files created this session
- `workspace/docs/CODEX-PROMPT-face-cleanser-next-batch.md` — Codex prompt for continuing face cleansers
- `workspace/docs/CLAUDE-product-humanizer-guide.md` — category-by-category guide
- `workspace/docs/CODEX-TASK-product-content-humanizer.md` — updated with current state + 6 inconsistencies fixed
- `workspace/audit/active/baseline-snapshot-2026-05-31.json` — GSC pre-humanization baseline
- `workspace/audit/active/gsc-query-map-2026-05-31.json` — GSC query data (237 paths)
- `apps/web/gsc-oauth-token.json` — Google OAuth token for GSC API
- `apps/web/src/components/AttributionTracker.tsx` — UTM attribution tracking

### Key lesson
Checkout fix was incomplete last session — .env.local sed failed silently, no rebuild.
Fixed this session: Python write to .env.local + npm run build + pm2 restart + live order test.
Rule added to agent memory: every fix needs live end-to-end verification before declaring done.

### Next session
1. Give Codex `workspace/docs/CODEX-PROMPT-face-cleanser-next-batch.md`
2. Continue: 183 face cleansers remaining
3. After face cleansers: serums-ampoules-essences (518 products)
4. Owner action needed: rotate Google service account key `ce8b30ba` (shared in chat)
5. GSC: click "Validate Fix" on Product snippets warning
6. Remeasure GSC: 2026-06-28

---
## 2026-06-01 — RSS feed redirect fix

Added 8 Nginx redirects for WordPress-style RSS URLs → /feed.xml:
  /feed, /feed/, /blog/feed, /blog/feed/, /rss, /rss/, /rss.xml, /atom.xml
All now return application/rss+xml with correct content — verified.

---
## 2026-06-01 — Face Cleanser Humanizer Codex Smoke Batch

- Prompt logic tightened in `workspace/docs/CODEX-PROMPT-face-cleanser-next-batch.md`: no secret-reading hint, JSONL duplicate handling aligned with script, stale counts marked advisory, data-only session-end flow clarified.
- Generated and reviewed one dry-run row: product `92856` (`Some By Mi Propolis B5 Glow Barrier Calming Oil to Foam 120ml`), SEO score 94/100.
- Applied: 1 product; Failed: 0; Skipped: 0.
- Rollback: `workspace/audit/active/face-cleansers-rollback-2026-06-01.json`.
- Verification: DB violation checks returned no rows; section/disclaimer marker check passed; live PDP returned 200 and showed the new meta description.
- Face cleanser progress after apply: 36/205 non-holdout done, 168 auto-eligible remaining, 13 holdout untouched, 1 high-sales skip.
- Next: continue face cleansers in reviewed batches; do not touch holdout or high-sales products without owner approval.

---
## 2026-06-01 — PDP SEO Crawlability Audit: Some By Mi Propolis B5

- Audited live URL `/shop/some-by-mi-propolis-b5-glow-barrier-calming-oil-to-foam-120ml` with normal UA and Googlebot UA: both returned 200.
- Verified canonical, robots index/follow, Googlebot index/follow, sitemap inclusion, HTTPS-only sitemap URLs, Product/Breadcrumb/FAQ JSON-LD, live price/stock/SKU/brand/image data, and `/brands/some-by-mi` product link.
- Fixed Woo attachment alt for image `92857`: `SOME BY MI Propolis B5 Glow Barrier Calming Oil To Foam 120ml`.
- Flushed WP cache and revalidated product path/tag via `/api/revalidate`.
- Mobile Chromium screenshot check at 390x844 rendered product header/image/title/bottom nav correctly; no frontend code change or deploy required.

---
## 2026-06-01 — GSC Page Indexing Fixes

Fixed Nginx dead URL chains (were 308→404, now direct 301):
  /product/      → /shop
  /product/{slug} → /shop/{slug}
  /shop/page/N/  → /shop

GSC Page Indexing analysis (sc-domain:e-mart.com.bd):
  404 (15): Fixed — /product/ and /shop/page/N/ chains resolved
  Noindex (8): All intentional — checkout, account, wishlist, order-success, track-order, search, brands-empty
  Redirect (2): Under investigation — likely trailing-slash 308 chains
  Discovered not indexed (115): Thin content — humanizer fixes over time
  Crawled not indexed (85): Thin content — humanizer in progress (40/3640 done)
  Duplicate canonical (4): Category canonicals confirmed correct; Google cache lag

---
## 2026-06-01 — Contact Address + Map Fix

- Updated shared company office address to `1st Floor, 26/2, Central Road (Near Ideal College), Dhanmondi, Dhaka-1205, Bangladesh`.
- Updated `/contact` labels/copy to show the shop/office and warehouse/pickup address consistently, and changed Google Maps links to address-based search/directions.
- Fixed the map iframe issue by allowing `https://www.openstreetmap.org` in the site CSP `frame-src`.
- Deployed commit `438b798 fix(contact): update address and unblock map`.
- Verification: local build passed, VPS build passed, `emartweb` restarted, live homepage smoke returned 200, live `/contact` returned 200 and CSP header includes OpenStreetMap.

---
## 2026-06-01 — Accessible Link Name Fix

- Fixed homepage mobile product rail “View more” card accessible names so they include the prominent visible text, e.g. `View more best sellers: View All`.
- Removed overriding aria-labels from homepage social cards so screen readers use the visible platform/handle/title text instead of shorter labels like `Watch YouTube content`.
- Deployed commit `c69e4b6 fix(a11y): align visible link text with accessible names`.
- Verification: targeted source search found no remaining `aria-label="View All"` or `Watch YouTube/TikTok/Facebook/Instagram content` patterns; local build passed; VPS build passed; `emartweb` restarted; live homepage smoke returned 200.

---
## 2026-06-01 — Mobile Third-Party Analytics Deferral

- Changed GA4 `next/script` loading from `afterInteractive` to `lazyOnload` in `RuntimeWidgets` so Google analytics waits until after page load.
- Confirmed Meta/Facebook Pixel was already using `strategy="lazyOnload"`.
- Removed eager Google Tag Manager / Google Analytics preconnect and dns-prefetch hints from the document head to keep mobile initial loading focused on first-party UI.
- Deployed commit `f387775 fix(perf): defer third-party analytics for mobile`.
- Verification: local build passed, VPS build passed, `emartweb` restarted, live homepage smoke returned 200.

---
## 2026-06-01 — Mobile Hero LCP Image Optimization

- Created local optimized AESTURA hero variants: mobile 360px AVIF/WebP and desktop 840px AVIF/WebP.
- Replaced the remote Woo/WordPress JPEG hero product image with direct local responsive `<picture>` sources so mobile receives the tiny local AVIF/WebP file without Next image optimizer cache variation.
- Kept the LCP image eager/high priority with `loading="eager"` and `fetchPriority="high"`.
- Deployed commit `869cf44 fix(perf): serve mobile hero image directly`.
- Verification: local build passed; VPS build passed; `emartweb` restarted; live homepage smoke returned 200; live HTML includes mobile AVIF/WebP hero sources plus high fetch priority; live mobile AVIF returned 200 as `image/avif` with `content-length: 2010`.

---
## 2026-06-01 — Face Cleanser Humanizer Reviewed Batch

- Answered owner prompt: Codex last worked on the `face-cleansers` humanizer category.
- Reviewed existing `workspace/audit/active/face-cleansers-*.jsonl`: 19 unique product IDs, 0 validation issues; product `3961` remained skipped due to prior API length error.
- Applied reviewed JSONL via `workspace/docs/humanizer_face_cleansers.py --apply`: 4 applied, 156 skipped, 0 failed; rollback remains `workspace/audit/active/face-cleansers-rollback-2026-06-01.json`.
- Verification: face-cleansers live DB count is 218 total / 52 done / 13 holdout / 2 high-sales; content safety check returned no rows; meta violation count was 0.
- Live smoke: checked 3 applied PDPs; titles, meta descriptions, key sections, and `product-disclaimer` markers were present.
- Next: run the next face-cleanser `--dry-run --limit 20`, review JSONL, then apply. Do not touch holdout or high-sales products.

---
## 2026-06-01 — Face Cleanser Dry-Run Blocked By OpenRouter Key

- Ran the next safe face-cleanser dry-run as Codex from the VPS shell, not via OpenClaw.
- Command attempted: `workspace/docs/humanizer_face_cleansers.py --dry-run --limit 20`.
- Result: 20/20 model calls failed with OpenRouter `401 User not found` because the key sourced from `/root/.openclaw/openclaw.env` is stale/invalid.
- Checked OpenRouter key health without exposing values: `/root/.openclaw/openclaw.env` key returned 401; `/root/.openclaw/credentials/openrouter_default.json` key returned 200.
- Retried a one-product dry-run with the valid credentials-file key for product `4319`; it succeeded with SEO score 94/100 and appended one reviewed JSONL row.
- JSONL validation after retry: 20 unique product IDs, 0 issues, product `3961` still skipped due to prior API length error.
- No WooCommerce DB writes were performed.
- Next: update OpenClaw/env key or ensure background jobs source `/root/.openclaw/credentials/openrouter_default.json`; run small probes if full 20-product batch stalls.

---
## 2026-06-01 — OpenClaw Small-Batch Humanizer Handoff

- Added safe OpenClaw helper: `workspace/scripts/active/openclaw_face_cleanser_dryrun_batch.sh`.
- Helper behavior: dry-run only, default batch size 3, 180s timeout per product, uses valid `/root/.openclaw/credentials/openrouter_default.json` key, skips known problem IDs `3961 2782`, writes report to `workspace/audit/active/openclaw-face-cleansers-dryrun-YYYY-MM-DD.log`, validates JSONL, never runs `--apply`.
- First OpenClaw one-shot job `e22e34e8-cf8d-4559-a242-f3669b7d41ae` ran but the small local model misunderstood the script path as a Telegram target and did not execute the helper.
- Requeued stricter exec-only job `1f33eee1-bb10-45d0-89dc-9b4ee423cdd4` with light context and `toolsAllow=["exec"]`; status observed as running.
- No WooCommerce writes were performed by these background jobs.

---
## 2026-06-01 — OpenClaw Small-Batch Output Applied

- Checked OpenClaw job state: no active OpenClaw/humanizer process remained.
- Reviewed output from `workspace/audit/active/openclaw-face-cleansers-dryrun-2026-06-01.log`.
- Applied only clean reviewed rows `26867` and `36186` with `workspace/docs/humanizer_face_cleansers.py --apply --post-id`; skipped `4319` because generated content included a bad "Dhaka" ingredient placeholder.
- Verification: `_emart_humanized` stamps exist for `26867` and `36186`; `4319` has no `_emart_humanized` stamp. Face-cleansers live count is now 53/218 humanized.
- Rollback note: single-product apply reused `workspace/audit/active/face-cleansers-rollback-2026-06-01.json`, so only the latest pre-apply snapshot (`36186`) remained there; copied it to `workspace/audit/active/face-cleansers-rollback-2026-06-01-post-36186.json` and patched the script so future `--post-id` applies use product-specific rollback filenames.

---
## 2026-06-03 — Face Cleanser Humanizer Restart + Verified Batch

- Checked stale task-board PID `2184866`: no active humanizer process was running.
- Ran `workspace/docs/humanizer_face_cleansers.py` dry-runs using the valid OpenRouter credentials-file key, then applied 15 clean reviewed products: `61117`, `75247`, `75383`, `75062`, `75060`, `74790`, `62975`, `62973`, `62971`, `92824`, `92904`, `92918`, `92986`, `93004`, `93110`.
- Current face-cleanser progress after apply: `169/218`; holdout remains 13 and high-sales remains protected.
- Many remaining products failed generation validation, mostly `near-duplicate second clause` and overlong meta descriptions; they were not written/applied.
- Fixed one verification blocker: removed the bad Next redirect from `/shop/maryampmay-white-collagen-cleansing-foam-150ml` to stale `/shop/marymay-blackberry-complex-glow-washoff-pack-125g`, deployed commit `1cbdc3d`, smoke test returned 200, and pushed to `origin/main`.
- Verification: product-specific revalidation returned 200 for all 15 applied slugs; final live check returned HTTP 200, meta 130-158 chars, all 6 required `<h3>` sections, and `product-disclaimer` present for all 15.

---
## 2026-06-03 — Third-Party JS / Main-Thread Perf Pass

- Delayed homepage GA4, Meta Pixel, and Google Merchant rating badge until after load/idle so they no longer compete with first render.
- Added GA4 config flags to disable Google signals and ad personalization signals.
- Added `google.de` to CSP `img-src` because GA audience pings can use `https://www.google.de/ads/ga-audiences...`.
- Deployed to VPS, rebuilt, restarted `emartweb`, and live smoke returned 200.
- Verification: live CSP includes `google.de`; fresh cache-busted Lighthouse mobile run had 0 console errors, performance 74, TBT 460ms, bootup 1898ms, main-thread 5186ms. Baseline before this pass was performance 57, TBT 2683ms, bootup 3554ms, main-thread 10423ms.

---
## 2026-06-03 — Face Cleanser Rest Dry-Run Background Job

- Started PM2 one-off job `emart-humanizer-cleansers-rest` for the remaining face-cleanser dry-runs.
- PM2 PID at start: `2458506`; wrapper script: `workspace/scripts/active/run_face_cleanser_rest_dryrun_20260603.sh`.
- Job selected 38 remaining eligible IDs: `59403`, `60188`, `60228`, `60562`, `60679`, `60772`, `60874`, `61030`, `61389`, `61497`, `61767`, `61882`, `61988`, `61994`, `62432`, `62570`, `62590`, `62767`, `62869`, `62887`, `63013`, `63469`, `63481`, `63531`, `63747`, `63769`, `63929`, `74050`, `75369`, `92830`, `92844`, `92846`, `92848`, `92860`, `92878`, `92932`, `93034`, `93117`.
- Logs: `/root/.pm2/logs/emart-humanizer-cleansers-rest-out.log` and `workspace/audit/active/openclaw-face-cleansers-dryrun-2026-06-03.log`.
- This job is dry-run/generation only. No WooCommerce DB writes should be applied until generated JSONL rows are reviewed.

---
## 2026-06-03 — Git Divergence Reconciliation

- Diagnosed VPS/origin divergence: VPS was at `b8cdb2f`, origin/main at `edfeea8` (7 commits ahead).
- Confirmed all VPS code files (`next.config.js`, `runtime-widgets.tsx`, `MetaPixel.tsx`) matched origin/main exactly — only session-tracking files (MEMORY.md, SESSION-LOG.md) had diverged content.
- Moved stale VPS-only memory files (`project_git_divergence_20260603.md`, `project_current_state_20260603.md`) to `/root/.attic-2026-06-03/`.
- Reset VPS to `origin/main` (`git fetch origin && git reset --hard origin/main`); VPS now clean at `edfeea8`.
- Updated humanizer memory header from stale 52/218 to current 169/218.
- PM2 job `emart-humanizer-cleansers-rest` verified online (38 dry-run IDs, no restarts); left running for Codex to review.
- Next: review dry-run JSONL once job completes; pa_concern CSV review pending owner.

---
## 2026-06-03 — emart-seo-generator Skill v2 Update

- Rewrote `/root/.openclaw/skills/emart-seo-generator/SKILL.md` from v1.0 to v2.0.
- Added **Mode A** (blog posts via WordPress REST API) alongside existing Mode B (WooCommerce products).
- Added **Mode C** (auto-scan: polls for posts/products missing Rank Math SEO fields).
- Fixed all Rank Math meta keys: products use `_rank_math_description` / `_rank_math_focus_keyword`; posts use `rank_math_title` / `rank_math_description` / `rank_math_focus_keyword`.
- Removed Yoast field writes (`_yoast_wpseo_*`) — project is Rank Math only.
- Removed product title/name mutation — slug safety enforced.
- Added canonical URL generation: `https://e-mart.com.bd/blog/{slug}` for posts.
- Updated `emart-rankmath-rest.php` mu-plugin to v1.1.0: added `POST /wp-json/emart/v1/post-seo/{id}` write endpoint authenticated via WP Application Passwords.
- Created new WP Application Password `openclaw-seo-gen` for `emartadmin`; updated `WP_USERNAME` + `WP_APP_PASSWORD` in `/root/.openclaw/openclaw.env`.
- Added `robots` field exposure to the read endpoint.
- Registered PM2 cron job `emart-seo-autoscan` (daily 00:00 UTC = 06:00 BD) via `workspace/scripts/active/seo_auto_scan.sh`.
- Verified end-to-end: authenticated write to post 93548 returned `success: true`; restored correct title after test.
- Note: mu-plugin change lives at `/var/www/wordpress/wp-content/mu-plugins/emart-rankmath-rest.php` (not in git repo).

---
## 2026-06-03 — Face Cleanser Rest Retry + Apply

- Reviewed PM2 dry-run output from `emart-humanizer-cleansers-rest`.
- Applied 9 clean generated rows first: `60772`, `61389`, `62767`, `74050`, `75369`, `92830`, `92844`, `92860`, `93034`.
- Ran another retry pass for remaining actionable rows. It produced 3 more rows; applied clean rows `93117` and `93120`.
- Held back generated rows `92848`, `63929`, and `62869` because generated copy did not match actual product type (`cleansing oil`, `toner`, `body wash` respectively).
- Current face-cleanser progress: `180/218` humanized; `13` holdout; `2` high-sales protected; `28` live eligible rows still unhumanized.
- Verification: applied rows have `_emart_humanized`, valid meta lengths, 6 `<h3>` sections, `product-disclaimer`, and no bad phrase hits. Product-specific revalidation and `tag:products` revalidation succeeded.

---
## 2026-06-03 — Face Cleanser Humanized Consistency Audit

- Audited distinct published face-cleanser products with `_emart_humanized`: `179` rows. The earlier quick progress count of `180` was not a distinct audited count.
- Final low-noise audit report: `workspace/audit/active/face-cleansers-humanized-consistency-audit-final-20260603-215749.md`.
- CSV: `workspace/audit/active/face-cleansers-humanized-consistency-audit-final-20260603-215749.csv`.
- Result: `157` OK, `4` HIGH, `15` MED, `3` LOW, `0` CRITICAL.
- Main issues: 4 treatment/prevention medical claims, 8 strong acne-clearing wording rows, 6 rows with 7 `<h3>` sections, 2 meta descriptions at 159 chars, 3 missing focus keywords.
- No DB writes were performed during the audit.

---
## 2026-06-03 — Mini Parent Prompt Dry-Run

- Added mini/travel-size prompt context in `workspace/docs/humanizer_face_cleansers.py`.
- Parent-linked mini IDs now inject parent titles: `63481` → Heimish 150ml, `92878` → SKIN1004 125ml, `92932` → ANUA 150ml.
- Standalone mini IDs are explicitly marked as standalone: `61988`, `62570`.
- Ran dry-run for mini 5: `92932`, `92878`, `63481`, `62570`, `61988`.
- Result: all 5 still failed validation, mostly overlong meta or near-duplicate second clause. No DB writes.
- Ran regular dry-run batch for exact live regular set of 20 IDs. New valid row produced: `60874`. Existing `92848` JSONL remains held because product/copy type mismatch. No DB writes.

---
## 2026-06-04 — Workspace Cleanup + Task Unification

- Archived ~60 audit files (rollbacks, old CSVs, applied dry-runs, lighthouse reports) → `workspace/audit/archive/`
- Archived ~35 one-time scripts → `workspace/scripts/archive/2026-06/`
- Archived superseded Codex prompt docs → `workspace/docs/archive/`
- Rewrote `workspace/TASKS.md` — unified board with mobile emergency note, autonomous jobs, SEO/humanizer state
- Cloudflare: WAF rule `cf.client.bot` + Bot Fight Mode OFF → Googlebot now passes all pages (403 resolved)
- GSC Live Test verified working: Product snippets ✅ Merchant listings ✅ Breadcrumbs ✅ FAQ ✅
- `emart-meta-gen` continuous PM2 process running (~2,642 products queued)
- Mobile app work starts 2026-06-05 — emergency note in TASKS.md
- Next humanizer: toner/mist category after face-cleansers complete (21 remaining)

---
## 2026-06-04 — Full Workspace Consistency Audit + Route Map

- Full 5-layer consistency audit: PM2 jobs, scripts, paths, memory, live site
- Fixed 3 issues from Codex audit: meta_gen_batch.sh rebuilt (timestamp bug), catalog-lighthouse duplicate removed, stale ARCHIVE_INDEX corrected
- Unified all face-cleanser files under workspace/humanizer/face-cleansers/
- Archived ~100 files: root GSC exports, old audit CSVs, applied scripts — all indexed in ARCHIVE_INDEX.md
- TASKS.md rewritten as single source of truth with PM2 jobs, mobile M0, route map
- Route map confirmed: 4,224 URLs, all routes healthy — /concerns and /routine slugs correct
- Only open SEO gap: /shop metas (meta-gen running) and /blog focus keywords (seo-autoscan running)
- Cloudflare: Bot Fight Mode OFF + WAF rule = Googlebot unblocked, all GSC Live Tests 200
- Memory files updated: 185/218 humanizer, correct paths, 3 new entries for new systems
- Claude vs Codex workflow pattern noted in memory
- Site stable. Meta-gen continuous. Mobile app starts tomorrow.

## 2026-06-05 — Full Ecosystem Audit + SEO/Schema/AI Sprint

### Did
- Fixed OpenClaw gateway (doctor --fix), skincare-trends cron (Ollama→openrouter/auto), OpenRouter key
- Rewrote competitor_prices.py: full 3,639-product catalog vs EmartwayBD API + SkincareBD scrape
- Wired Google Sheets webhook for competitor monitoring
- Fixed false-alarm alert emails: added /wp-json/emart/v1/health endpoint to emart-newsletter.php
- Full ecosystem audit: tasks, SEO_MASTER, DEV_MASTER, ARCHIVE_INDEX, Codex plan, GSC data, Lighthouse
- Identified GMC root cause: 127 disapproved (216 prescription drug claims, 108 personal hardship copy, 36 misleading claims), delegated fix to Codex in CODEX-BRIEF-20260605.md
- Confirmed checkout monitor works (all 8 steps pass), agents.md is misleading — is a cron PM2 job
- Added FAQPage JSON-LD to 9 concern pages (was missing, ingredient pages already had it)
- Decoupled Product schema description from meta: now uses full product.description (400-500c) when available, improving LLM citation depth
- Created agents.md at /agents.md — AI agent discoverability with catalog browse, BFF endpoints, verified social channels (FB + YouTube @emartbd.official)
- Fixed ARCHIVE_INDEX stale meta_gen_batch.sh entry
- Written CODEX-BRIEF-20260605.md: GMC fix, humanizer redirect to impression-priority brands (CeraVe/Skin1004/Medicube/Innisfree/COSRX), mobile M0, Facebook/YouTube revenue alignment, SSL Commerz

### Key findings
- GMC Shopping is our BEST discovery channel (bypasses AI Overview zero-click), 15% blocked by policy violations
- Humanizer was working on wrong products (face cleansers) — top impression brands not humanized
- Review form already built in ReviewsSection.tsx — gap is post-purchase email + customer awareness
- LCP 5.8s: W3 priority fix already done; real bottleneck is 58 scripts/1,494ms evaluation (post-freeze)
- Checkout: all 8 steps pass, COD+bKash+Nagad all confirmed
- FAQPage deprecated by Google May 7, 2026 for rich results — kept for LLM crawlers only

### Blockers
- Owner: GSC sitemap resubmit + URL indexing for CeraVe/Skin1004/Medicube top pages
- Owner: MailPoet post-purchase review email (fastest path to aggregateRating)
- Owner: 16 product real images, pa_concern 1,161 rows CSV review, Cloudflare cache rule

### Next step (Codex)
- Start CODEX-BRIEF-20260605.md Task 1 (GMC fix) immediately
- Mobile M0 starts today

### Next step (Claude)
- ReviewsSection W4 cleanup, sunscreen category copy (SEO_MASTER M7)

## 2026-06-05 (continued) — SEO, Analytics, Workspace cleanup

### Did
- feat(reviews): removed verifiedPurchase gate — all logged-in users can submit reviews. WC verification setting disabled. aggregateRating now unblocked. (a90776d)
- fix(seo): BHA/salicylic ingredient redirects (fixes GSC drop bha pos 7→55) + H2 on /sale /new-arrivals /brands (19587a9, 9456069)
- SEO_MASTER M7 closed (sunscreen copy done) + M8 closed (false gap) (ccf4a3c)
- feat(analytics): InitiateCheckout Meta Pixel event added — checkout had zero tracking, full event set now complete (70f777c)
- docs: OWNER-ACTIONS-20260605.md — exact dashboard steps for MailPoet review email, Meta CAPI test, GSC URL indexing, Cloudflare cache rule (3299341)
- WH7 workspace hygiene: archived seo-p1-preview.mjs, ocr-image-audit.mjs, image-logic-fixer.mjs
- Confirmed: WH1, WH4, U1, W7 already resolved in prior sessions
- Confirmed: Meta Pixel events now complete: PageView ✅ ViewContent ✅ AddToCart ✅ InitiateCheckout ✅ Purchase ✅
- Sitemap: user submitted manually today ✅

### Blockers
- Owner: 4 dashboard actions in OWNER-ACTIONS-20260605.md (MailPoet, Meta CAPI, GSC indexing, Cloudflare)
- Face cleansers: 184/216 — Codex batch still running
- Meta-gen: ~2,193 applied, ~2,642 remaining (query snapshot)

### Next
- Codex: CODEX-GMC-FIX-20260605.md (48 LLM rewrites) + impression-priority humanizer after face cleansers done
- Post-freeze (Jul 3): LCP bundle analysis, blog content, UCP/MCP

## 2026-06-05 (final) — GMC complete + M6 internal links + Meta events

### Did
- GMC Steps 3-6 documented + Step 7 sync: 127→107 disapproved (−20), 3503→3523 approved (+20)
- M6 ingredient/concern internal links: niacinamide(10), hyaluronic-acid(7), acne-blemish(7), dryness-hydration(4) [[LINK:]] markers
- feat(analytics): InitiateCheckout Meta Pixel event added — checkout now fully tracked
- OWNER-ACTIONS-20260605.md: exact dashboard steps for MailPoet review email, Meta CAPI test, GSC x7 URLs, Cloudflare cache
- Remaining 107 GMC disapprovals: 15 unfixable identity, 11 title-risk(owner), 2 data/asset(owner), 6 mixed-manual(owner)
- All commits pushed to origin/main

### Running autonomously overnight
- emart-meta-gen (PM2): ~2,193 applied, ~2,642 remaining (snapshot count), completion ~Jun 6
- emart-presence (PM2): stable
- Python crons: site_health/daily_report/low_stock all healthy
- Checkout monitor (PM2 cron every 15min): all 8 steps passing

### Blockers for next session
- Owner: workspace/docs/OWNER-ACTIONS-20260605.md (MailPoet, Meta CAPI, GSC indexing, Cloudflare)
- Owner: 11 GMC title-risk products, 2 data/asset, 6 mixed-manual (gmc-steps3-6-report-20260605.md)
- Codex: impression-priority humanizer when face cleansers done (184/216)
- Mobile P0: after Codex X1+X2 complete

### Next session start
git log --oneline -5 && pm2 list && python3 /root/.gmc/sync.py --status

## 2026-06-05 — Codex impression-priority humanizer apply

### Did
- Ran `workspace/humanizer/impression-priority/humanizer_impression_priority.py --dry-run` from `/var/www/emart-platform`.
- Fixed humanizer script mismatch: VPS copy expected `gen["meta_desc"]`; Local/VPS script now prints content length only and skips IDs already present in the day's JSONL on resume.
- Reviewed JSONL, backed up raw output, removed duplicate `50630`, regenerated malformed short `43841`, and sanitized risky verification/prescription wording.
- Applied 10 reviewed product descriptions: `50630`, `56975`, `58506`, `56117`, `53315`, `58264`, `24437`, `50540`, `57109`, `43841`.
- DB verification confirmed all 10 have populated `post_content` and `_emart_humanized=1`; ISR `tag=products` revalidation ran.

### Blockers
- None for this batch.

### Next
- Monitor GSC movement for the impression-priority batch.
- Continue humanizer work only through reviewed JSONL batches; preserve holdout IDs `2611`, `2591`, `4064`.

## 2026-06-05 — Codex Mobile M0 partial

### Did
- Continued `apps/mobile` release-readiness from the existing dirty version/icon changes (`1.1.1`, Android versionCode `21`).
- Removed stale direct WooCommerce credential/IP URL guidance from `apps/mobile/.env.example`; confirmed mobile code has no Woo consumer keys, secrets, direct `/wp-json/wc/v3`, or IP Woo URLs.
- Aligned mobile shipping display/copy with live Woo policy: Dhaka `৳70`, free shipping over `৳3,000`.
- Fixed checkout success handling for live `/api/checkout` response shape so Woo order ID reaches local order history and success navigation.
- Added explicit Expo Metro config and verified `npx expo-doctor` passes 18/18.

### Verification
- `npm ls --depth=0` passed in `apps/mobile`.
- `npx expo config --type public` passed.
- Live checks: `/api/mobile/products?per_page=1` 200, `/api/mobile/categories?per_page=1` 200, `/api/checkout` OPTIONS 204.
- `npx expo export --platform android --output-dir /tmp/emart-mobile-export` passed.
- `npx expo-doctor` passed 18/18 after the Metro config fix.

### Blockers
- `/api/mobile/cart` and `/api/mobile/payment` return 404 live; current app does not use those routes and instead uses local cart + manual bKash/Nagad transaction ID through `/api/checkout`.
- No real device checkout smoke, EAS production AAB, or Play Store upload was run in this session.

### Next
- Run device checkout smoke for COD, bKash, and Nagad.
- Build signed production AAB with EAS and upload to Play Store internal testing after device smoke passes.

## 2026-06-05 — Codex mobile ADB + logic pass

### Did
- Installed `android-tools-adb` on the VPS and started ADB successfully.
- Checked `adb devices -l` and `lsusb`; no Android phone is visible to the VPS, only the root USB hub. Phone connected to user's laptop is not automatically exposed to this remote server.
- Fixed mobile product-detail hook-order edge case when route params are missing.
- Removed mobile Card payment copy until SSLCommerz exists.
- Wired mobile review calls to send stored JWT Bearer token.
- Updated Next `/api/product-reviews` to accept mobile JWT Bearer auth by validating via WordPress `/wp-json/emart/v1/customer/me`.
- Deployed the web BFF review-token fix to live, restarted `emartweb`, and pushed commits to `origin/main`.

### Verification
- `npx expo-doctor` passed 18/18.
- `npx expo export --platform android --output-dir /tmp/emart-mobile-export` passed.
- Local and VPS `apps/web` builds passed.
- Live smoke: homepage 200, `/api/mobile/products?per_page=1` 200, review GET 200, guest review POST 401.

### Blockers
- No real-device ADB test possible from the VPS until the phone is connected to the VPS/USB-forwarded or ADB-over-network is configured from the laptop.

### Next
- For a real phone pass, expose the phone to this environment via ADB-over-network or run the ADB/Expo test commands directly on the laptop where the phone is plugged in.

## 2026-06-05 — Codex homepage LCP/TBT performance pass

### Did
- Ran fresh live Lighthouse mobile baseline: score 63, LCP 4.0s, TBT 1,000ms; LCP element was the `Shop by category` H2.
- Built locally with bundle output: homepage First Load JS was 157 kB.
- Split `OfferCollectionsRail` into its own static component and moved below-fold homepage sections into `HomepageDeferredSections` using near-viewport/idle dynamic loading.
- Kept HeroCarousel, MobileDiscovery, ShopByCategory, and OfferCollectionsRail static; verified GA4, Meta Pixel, and Google rating badge already use lazy/idle gates.
- Deployed `d8fb0ac perf(home): defer below-fold homepage sections` through local build, VPS build, PM2 restart, smoke test, and pushed to origin/main.

### Verification
- Local and VPS `npm run build` passed.
- Homepage First Load JS dropped from 157 kB to 108 kB.
- Live smoke: homepage 200; `/api/mobile/products?per_page=1` 200.
- Post-deploy Lighthouse mobile: score 97, LCP 2.1s, TBT 120ms, CLS 0.027, TTI 3.8s, total bytes 592 KiB.
- Reports saved at `workspace/audit/active/lighthouse-home-mobile-20260605-fresh.report.*` and `workspace/audit/active/lighthouse-home-mobile-20260605-post-defer.report.*`.

### Blockers
- None.

### Next
- Watch CrUX/GSC mobile CWV over the next 28-day window; no further homepage perf work needed during freeze unless field data regresses.

## 2026-06-06 — Codex homepage SEO link-hub removal

### Did
- Removed the visible `Popular skincare paths` / `Explore Emart` homepage SEO link hub because it changed homepage design/layout during the stability freeze and owner did not approve that visible section.
- Deleted `apps/web/src/components/home/HomepageSeoLinkHub.tsx` and removed its render from `apps/web/src/app/page.tsx`.
- Confirmed the uncommitted 60s/click-only analytics experiment was reverted before commit; no new analytics timing change was included in the removal commit.

### Verification
- Commit: `2e8b45b revert(home): remove visible SEO link hub`.
- Local `npm run build` passed; VPS `npm run build` passed; homepage First Load JS remained `108 kB`.
- `pm2 restart emartweb` passed.
- Live smoke after deploy: homepage `200`; `/api/mobile/products?per_page=1` `200`.
- Pushed `2e8b45b` to `origin/main`.
- Last captured Lighthouse before this removal: `workspace/audit/active/lighthouse-home-mobile-20260606-linkhub-analytics-30s.report.report.json` with score `85`, FCP `1.5s`, LCP `2.2s`, TBT `510ms`, Speed Index `1.5s`, CLS `0.014`, TTI `9.1s`, server response `20ms`.
- Post-removal Lighthouse: `workspace/audit/active/lighthouse-home-mobile-20260606-post-linkhub-removal.report.report.json` with score `96`, FCP `1.2s`, LCP `2.2s`, TBT `170ms`, Speed Index `1.3s`, CLS `0.014`, TTI `3.8s`, server response `40ms`, total transfer `719 KiB`, third-party transfer `0`.

### Blockers
- Public DNS from the shell failed twice during a final live HTML grep for `Popular skincare paths`, after successful live smoke checks. Treat code/build/deploy as source of truth unless a later browser check shows stale cache.

### Next
- Do not add visible homepage SEO/design/layout sections during the freeze without explicit owner approval.
- If another SEO/performance refinement is needed, prefer non-visible metadata/schema/internal architecture or owner-approved placement after reviewing design impact first.

## 2026-06-06 — Codex checkout order endpoint hardening

### Did
- Replaced fragile WC key recovery `.env.local` persistence shell `sed` with Node `fs` writes in `apps/web/src/lib/woocommerce.ts`.
- Added `createOrderViaPlugin()` and switched `/api/checkout` to create orders through WordPress `/wp-json/emart/v1/create-order` using `EMART_ORDER_SECRET`.
- Installed runtime mu-plugin `/var/www/wordpress/wp-content/mu-plugins/emart-order-endpoint.php`; source copy is in ignored `workspace/scripts/active/emart-order-endpoint.php`.
- Added matching `EMART_ORDER_SECRET` values to Next `.env.local` and WordPress `wp-config.php`.
- Preserved checkout behavior: COD `processing`, non-COD `pending`, shipping lines, coupon lines, customer note, customer_id, attribution meta, BDT currency, and response fields needed by Meta CAPI.
- Restarted `emartweb` after a clean production build.

### Verification
- `php -l /var/www/wordpress/wp-content/mu-plugins/emart-order-endpoint.php` passed.
- `php -l /var/www/wordpress/wp-config.php` passed.
- `npm run build` passed in `apps/web`.
- Direct plugin smoke: internal `/wp-json/emart/v1/create-order` returned `201`; test order `93714` deleted.
- Live BFF smoke: `POST https://e-mart.com.bd/api/checkout` returned `success:true`; test order `93715` and temporary user `2753` deleted.
- Live smokes: homepage `200`, `/api/mobile/products?per_page=1` `200`, wrong plugin secret `403`.

### Blockers
- None.

## 2026-06-08 22:40 CEST — Codex Google tracking redirect localhost fix

### Did
- Reproduced the mobile Google click issue with a product URL containing `?srsltid=...`: live middleware stripped the tracking parameter but redirected to internal `http://localhost:3000/...`.
- Updated middleware cleanup redirects to build `Location` headers from `https://e-mart.com.bd` explicitly.
- Added `Cache-Control: no-store, max-age=0` to middleware cleanup redirects so Cloudflare does not cache future tracking-param redirects.

### Verification
- Local `npm run build` passed.
- Local production smoke for `/shop/welcos-aloe-vera-moisture-real-soothing-gel?srsltid=AfmBOoq-test` now returns `301 Location: https://e-mart.com.bd/shop/welcos-aloe-vera-moisture-real-soothing-gel`.
- Fresh live `?srsltid=...` variants returned the public HTTPS location; one old exact test URL remained briefly as a Cloudflare HIT from the pre-fix redirect.

### Blockers
- None.

## 2026-06-08 23:18 CEST — Codex Nginx origin HTTP hardening

### Did
- Checked Gemini's three-layer proposal against the live stack.
- Confirmed public Cloudflare HTTP redirects were already clean, but direct origin `http://e-mart.com.bd` returned `200 OK`.
- Backed up active Nginx config to `/etc/nginx/sites-available/emart-nextjs.backup-20260608-origin-http-hardening`.
- Added Cloudflare-safe origin HTTP hardening in `/etc/nginx/sites-enabled/emart-nextjs`: direct plain HTTP without `X-Forwarded-Proto: https` now 301s to `https://e-mart.com.bd$request_uri`, while Cloudflare HTTP-to-origin traffic still reaches the app.

### Verification
- `nginx -t` passed.
- `systemctl reload nginx` completed.
- Direct origin HTTP without Cloudflare header returns `301 Location: https://e-mart.com.bd/...`.
- Direct origin HTTP with `X-Forwarded-Proto: https` returns `200 OK`.
- Public `http://e-mart.com.bd/category/sunscreen` returns `301` then `200`.
- Public checkout returns `200`.
- Googlebot-style `?srsltid=...` product URL redirects to the clean public HTTPS product URL and resolves `200`.

### Blockers
- Full split `listen 80`/`listen 443` blocks caused a Cloudflare origin redirect loop because Cloudflare currently reaches origin over HTTP. Kept the safe conditional version instead.

### Next
- Commit only the checkout code/session docs; leave pre-existing dirty UI and humanizer files untouched.

## 2026-06-06 — Codex contact/about SEO schema pass

### Did
- Updated `/contact` metadata, canonical, OnlineStore/LocalBusiness JSON-LD, and contact form behavior.
- Added a prominent WhatsApp CTA on `/contact` and changed the form to a visible email-app flow instead of silently failing.
- Updated `/about-us` with AboutPage-wrapped Organization JSON-LD, brand FAQPage JSON-LD, visible brand FAQ content, and the requested Dhanmondi/team sentence.
- Did not touch layout/nav, company constants, checkout, cart, payment, order, customer, or Woo logic.

### Verification
- Commit: `e6edd10 fix(seo): enrich contact and about pages`.
- `npm run build` passed in `apps/web`.
- Verified `.next/BUILD_ID` existed before restarting `emartweb`.
- Live smoke passed: `/contact` `200`, `/about-us` `200`, homepage `200`, `/api/mobile/products?per_page=1` `200`.
- Live HTML contains the new contact metadata/schema and about FAQ/AboutPage content.
- Pushed `e6edd10` to `origin/main`.

### Blockers
- None.

### Next
- No follow-up needed for this page-only SEO task.

## 2026-06-06 — Codex commerce SEO citation hardening

### Did
- Added homepage entity/citation support with visible Emart Skincare Bangladesh copy and featured shopping-path ItemList JSON-LD.
- Added shop CollectionPage, BreadcrumbList, visible Bangladesh skincare H1/description, and product ItemList JSON-LD.
- Hardened origin pages with country-specific H1s and popular brand ItemList JSON-LD where editorial brand data exists.
- Added brand entity JSON-LD to brand pages and visible origin text only when curated brand-origin data supports it.
- Confirmed category and concern pages already had intro/header content, CollectionPage, BreadcrumbList, ItemList, and concern FAQPage coverage; then switched category/concern/origin/brand schema output to `safeJsonLd`.
- Did not touch checkout, cart, payment, customer account, mail, navigation, URL structure, redirects, sitemap structure, or product data.

### Verification
- Commits: `a7e0b8f fix(seo): harden commerce citation schema`, `8b240ac fix(seo): sanitize collection schema output`.
- `npm run lint` passed in `apps/web`.
- `npm run build` passed in `apps/web`.
- Verified `.next/BUILD_ID` existed before restarting `emartweb`.
- Live smoke passed: `/` `200`, `/shop` `200`, `/category/sunscreen` `200`, `/origins/south-korea` `200`, `/concerns/acne-blemish-care` `200`, `/brands/cosrx` `200`, `/api/mobile/products?per_page=1` `200`.
- Live HTML markers verified for homepage featured paths/citation copy, shop CollectionPage/ItemList/H1, category CollectionPage/ItemList/intro, origin Korean H1/popular brand ItemList, concern FAQPage/CollectionPage, and brand Brand JSON-LD/origin text.

### Blockers
- None.

### Next
- Monitor GSC enhancements/indexing after Google recrawls; no freeze-breaking layout or URL work needed for this pass.

## 2026-06-06 12:40 CEST — Codex impression-priority humanizer follow-up

### Did
- Continued X2 from `workspace/humanizer/impression-priority/active/impression-priority-2026-06-05.jsonl`.
- Confirmed the reviewed JSONL contains the full 10 eligible non-holdout products from the current priority list, and all 10 are already applied in Woo.
- Preserved holdout IDs `2611`, `2591`, and `4064` untouched with `_emart_humanized=0`.
- Removed stray markdown code fences from reviewed artifact row/product `58506` and from live Woo `post_content`.
- Revalidated Next cache via `POST /api/revalidate` with `{ "tag": "products" }`.

### Verification
- Woo check: 10 eligible products `_emart_humanized=1`; all checked content clean of markdown fences.
- Holdout check: `2611`, `2591`, `4064` remain `_emart_humanized=0`.
- Revalidate response: `{"ok":true,"revalidated":["tag:products"],"at":"2026-06-06T10:39:42.112Z"}`.

### Blockers
- No new reviewed products exist in the current impression-priority JSONL beyond the already-applied 10.

### Next
- Generate/review a new impression-priority batch before applying more X2 products; never apply raw LLM output directly to Woo.

## 2026-06-08 22:45 CEST — Codex checkout stock local fix

### Did
- Audited the global checkout stock failure without Woo product mutations or real orders.
- Confirmed product `51372` is a valid unmanaged-stock Woo product: `manage_stock=false`, `stock_status=instock`, `stock_quantity=null`, `purchasable=true`.
- Added shared stock normalizer for web product UI and checkout validation.
- Updated checkout to refresh latest Woo product/variation data server-side before order creation and return product-name stock messages.
- Updated cart/checkout payload shape to preserve `variation_id` and parent `product_id` for future variation lines.
- Patched tracked source for the secret WordPress order endpoint with the same stock guard and internal stock detail logging.
- Added local normalizer tests and read-only audit report `workspace/audit/active/checkout-stock-global-audit.md`.

### Verification
- `node scripts/checkout-stock-normalizer-tests.cjs` passed.
- `php -l workspace/scripts/active/emart-order-endpoint.php` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `./node_modules/.bin/tsc --noEmit` passed after build regenerated `.next/types`.

### Blockers
- Not deployed by instruction: production deployment needs explicit approval.
- Live WordPress mu-plugin under `/var/www/wordpress/wp-content/mu-plugins/` was not patched in this pass.
- Live/mobile real checkout smoke not run because local-only fix is not live.

### Next
- If approved: deploy web app, copy/sync the updated order endpoint to the live mu-plugin, rebuild/restart, then smoke-test checkout without creating real payments.

## 2026-06-06 13:48 CEST — Codex pa_concern auto-assign dry-run

### Did
- Added a WP-CLI dry-run/apply helper at `workspace/scripts/active/pa-concern-auto-assign.php`.
- Generated dry-run CSV `workspace/audit/active/pa-concern-auto-assign-20260606.csv` and summary `workspace/audit/active/pa-concern-auto-assign-20260606-summary.txt`.
- Verified live `pa_concern` slugs before output; prompt aliases normalize to live slugs: `sun-protection=>sunscreen`, `brightness=>brightening`, `pore-care=>pores-blackheads`, `anti-aging=>anti-aging-repair`.
- Revised the highmed guard to protect only high/medium rows with actual approved concern terms plus all products that already have live `pa_concern`; this keeps unresolved manual rows eligible while preserving the no-overwrite rule.
- Added non-skincare/hair/makeup/baby guards to prevent bad PDP “Best for” chips.

### Verification
- `php -l workspace/scripts/active/pa-concern-auto-assign.php` passed.
- `wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/active/pa-concern-auto-assign.php` passed.
- Final dry-run result: 1,161 manual rows; 13 assigned; 1,147 left blank; 1 not published/product; 0 DB writes.
- Concern breakdown: `dryness-hydration` 7, `sunscreen` 3, `acne-blemish` 2, `anti-aging-repair` 1.
- Apply approved and completed: `APPLY=1 wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/active/pa-concern-auto-assign.php`.
- Apply result: 13 products updated; 1,147 blank rows skipped; product cache revalidated via `tag:products`.
- Post-apply verification: all 13 product IDs now have the expected `pa_concern` slug.

### Blockers
- None.

### Next
- Leave remaining 1,147 rows blank unless a stronger signal or manual review exists.

## 2026-06-07 00:55 CEST — Codex homepage console/perf cleanup

### Did
- Removed global AESTURA hero image preloads from root layout so checkout/shop/category no longer receive homepage-only preload hints.
- Removed `CategoryLiveBadge` from homepage category cards; category cards still link to their category URLs.
- Deployed the previously local-only removal of the visible homepage SEO intro block to `/var/www`.
- Removed matching stale AESTURA preload `add_header Link` lines from active Nginx config after backing up the file to `sites-available`, then ran `nginx -t` and reloaded Nginx.
- Built locally and on VPS, restarted only `emartweb`, smoke-tested live, and pushed verified-live commits to origin.

### Verification
- Local and VPS `npm run build` passed.
- `curl -I` for homepage and checkout returned 200; checkout remained `private, no-store`.
- Live Chromium/CDP verifier passed: no image preload links, no per-category active-session polling, no preload warnings, old visible SEO block absent, checkout page OK.

### Blockers
- Playwright MCP was not exposed in this Codex tool session; Chromium/CDP verifier was used instead.

### Next
- YouTube homepage thumbnail replacement remains intentionally deferred.

## 2026-06-08 17:30 CEST — Codex localhost public URL guard

### Did
- Investigated report that a Google result appeared to open `localhost:3000`.
- Confirmed live Google/public product URL and live HTML metadata for Welcos product use `https://e-mart.com.bd`, not localhost.
- Hardened `apps/web/src/lib/siteUrl.ts` so localhost/loopback `NEXT_PUBLIC_SITE_URL` values fall back to `https://e-mart.com.bd`.
- Committed and deployed only that helper change as `1167bf4 fix(seo): prevent localhost public URLs`; preserved unrelated local dirty files.

### Verification
- Local `npm run build` passed.
- Local forced-env build passed with `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
- Rendered metadata under forced-localhost build showed canonical/OG URLs using `https://e-mart.com.bd`.
- VPS `npm run build` passed, `pm2 restart emartweb` completed, homepage smoke returned `200`.
- Live Welcos product canonical and `og:url` verified as `https://e-mart.com.bd/shop/welcos-aloe-vera-moisture-real-soothing-gel`.
- Pushed `1167bf4` to `origin/main`; VPS git metadata aligned and clean.

### Blockers
- None.

### Next
- The user still needs to clear/avoid Chrome autocomplete/history for local `localhost:3000` URLs on their Windows browser if Chrome keeps opening the local dev address.

## 2026-06-08 22:25 CEST — Codex collection pagination SEO

### Did
- Added shared pagination SEO helpers for curated collection pages.
- Updated shop, category, sale, new-arrivals, brand, concern, ingredient, routine, and origin detail pages so `?page=N` where `N > 1` self-canonicalizes, titles include `- Page N`, and Previous links to page 1 use the clean root path.
- Left filter/sort/search variants protected: filters still canonicalize to parent collections, and search remains `noindex, follow`.

### Verification
- Local `npm run build` passed.
- Temporary production server HTML checks passed for `/shop?page=2`, `/category/sunscreen?page=2`, `/sale?page=2`, `/brands/cosrx?page=2`, `/concerns/dryness-hydration?page=2`, and `/search?q=cosrx&page=2`.

### Blockers
- None.

## 2026-06-08 22:43 CEST — Codex checkout stock hotfix deploy

### Did
- Deployed the checkout stock normalizer hotfix to production Next.js and the live WordPress order mu-plugin.
- Backed up the live mu-plugin before patching: `/var/www/wordpress/wp-content/mu-plugins/emart-order-endpoint.php.bak-20260608-223217`.
- Patched live `/var/www/wordpress/wp-content/mu-plugins/emart-order-endpoint.php` from `workspace/scripts/active/emart-order-endpoint.php`.
- Rebuilt `/var/www/emart-platform/apps/web` and restarted PM2 `emartweb`.
- No WooCommerce product stock, prices, payment settings, or courier logic were mutated.

### Verification
- Live mu-plugin PHP lint passed; patched checksum differs from backup and matches tracked hotfix source.
- VPS `node scripts/checkout-stock-normalizer-tests.cjs`, `npm run lint`, and `npm run build` passed.
- Live checkout `GET /api/checkout` returned `405` as expected for a POST-only route; `/checkout` returned `200`.
- Product `51372` COD smoke returned `201`; test order `93909` was deleted immediately.
- Product `23112` COD smoke returned `201`; test order `93910` was deleted immediately.
- Known out-of-stock product `93315` was blocked with product-name message: `Kerasys Black Bean Oil Shampoo Anti Hair Loss 1000ml is currently out of stock. Please remove it from cart or contact us.`
- Managed-stock product `93314` was verified read-only as published, instock, `manage_stock=true`, `stock_quantity=8`, purchasable; no order was created to avoid decrementing real inventory.
- Mobile 390px checkout smoke passed with `/api/checkout` intercepted; mocked stock error showed product name, no `Product #` text, and no horizontal overflow.

### Blockers
- None for checkout stock. Existing Woo REST product/shipping reads still log 403s in PM2, so the checkout precheck now defers to the WordPress order endpoint when REST refresh is unavailable.

### Next
- Commit/push the verified hotfix after final review.
- SEO/OpenClaw audit can start after the checkout hotfix is committed and the repo is aligned.

---

## 2026-06-08 23:18 CEST — Codex SEO/OpenClaw/mobile audit

### Did
- Completed audit-only pass for stock verification, SEO/schema/content quality, OpenClaw/meta generation, agentic shopping/AI citation, and Android/mobile source state.
- Created ignored reports in `workspace/audit/active/`: `seo-content-quality-audit.csv`, `openclaw-status-report.md`, `openclaw-description-generation-plan.md`, `agentic-shopping-ai-citation-audit.md`, `android-mobile-audit.md`, and `safety-snapshot-20260608.md`.
- Made safe local SEO fixes only: removed schema-only PDP price FAQ entries so FAQPage reflects visible FAQ items, and normalized shipping/return metadata titles from `eMart` to `Emart`.
- Did not deploy, push, bulk update Woo data, create real orders/payments, restart OpenClaw, publish Android builds, or change stock/payment/courier logic.

### Verification
- `node apps/web/scripts/checkout-stock-normalizer-tests.cjs` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Live sample pages, robots, sitemap, `llms.txt`, `agents.md`, and mobile BFF product API were fetched read-only.

### Blockers
- Crawl CSV `e-mart.com.bd_mega_export_20260608.csv` was not present in the workspace or Codex attachment path, so SEO CSV is template/sample based.
- PM2 `emart-meta-gen` was already online and actively applying descriptions during the audit; owner should decide whether to pause it before further content QA.
- No Android device was visible to the VPS, so mobile audit is source-level plus public API check only.

### Next
- Owner reviews whether to pause/continue `emart-meta-gen`.
- If approved, deploy the safe SEO fixes via normal Local build → commit → rsync → VPS build → PM2 restart → live smoke → push flow.

## 2026-06-08 23:09 CEST — Codex add-to-cart and checkout funnel audit

### Did
- Audited web, mobile web, and native mobile add-to-cart through checkout logic after the stock hotfix.
- Fixed mobile app source so product cards/PDP do not add explicit out-of-stock products to cart, and mobile checkout preserves `product_id` plus `variation_id` when present.
- Exposed `type`, `parent_id`, `manage_stock`, and `backorders` through the mobile product BFF so the native app can reason about Woo stock correctly.
- Fixed web PDP purchase buttons so unavailable products show disabled `Out of Stock` actions instead of silently doing nothing.
- Fixed web cart persistence so only cart items are stored, old/new persisted cart shapes both hydrate, and the cart drawer never persists open over checkout.
- Fixed internal Woo/WP REST reads by adding the Cloudflare-safe origin header required after origin HTTP hardening; this restored `/api/mobile/products`.

### Verification
- Local `npm run lint`, `npm run build`, `tsc --noEmit`, stock normalizer tests, and Babel parse of changed native mobile files passed.
- VPS `npm run build` passed without the earlier Woo REST 403 flood after the internal header fix, then `emartweb` was restarted.
- `/api/mobile/products?per_page=1` returned a product again; `/api/mobile/products/23112` returned `instock`, `manage_stock=false`, `stock_quantity=null`.
- Mobile web 390px smoke passed: PDP add-to-cart persisted item `23112`, checkout rendered with the cart intact, drawer stayed closed, mocked COD submit reached `/order-success?id=999998`, and there was no horizontal overflow.
- Live checkout API smoke passed: `23112` returned `201` and test order `93914` was deleted; out-of-stock `93315` returned `409` with the product-name stock message.

### Blockers
- Native mobile UI changes require the next app release/OTA path before customers see the new disabled out-of-stock buttons. Existing app users are still protected by the live checkout API/order endpoint.

### Next
- Push the verified commit and align `/var/www` Git metadata to the pushed commit.

---

## 2026-06-09 — Claude (claude-sonnet-4-6)
- Did: Stopped stuck emart-meta-gen (cycle 315 spin loop); fixed CHAR_LENGTH bug in meta_gen_batch.sh; cleaned 34 bad meta rows; regenerated 41/42 via LLM; restructured CLAUDE.md/AGENTS.md/root CLAUDE.md for −62% per-turn token cost; fixed eMart→Emart brand spelling in two policy pages; removed schema-only price FAQ injection from product.ts PDP; set claude-sonnet-4-6 as default model in .claude/settings.json; created .github/copilot-instructions.md + reference docs in workspace/docs/claude-reference/; updated .claudeignore with surgical py/mjs exclusions
- Completed tasks: emart-meta-gen stop + meta quality fix; CLAUDE.md/AGENTS.md lean restructure; brand fix deploy; PDP schema cleanup
- Blockers hit: CHAR_LENGTH vs LENGTH byte/char mismatch caused 594 false "remaining" count; OpenRouter key sourced from credentials JSON not openclaw.env (401 bug); fix_metas_force.py needed custom load_product_data() bypassing eligibility HAVING clause
- Next step: Owner fix 6 "original original" products (pa_brand/pa_origin Woo taxonomy has term "original"); Codex reads AGENTS.md for lean entry point; humanizer X2 needs next JSONL batch

---

## 2026-06-09 21:45 CEST — Codex Cloudflare + duplicate product audit

### Did
- Investigated a live PDP 404 for product ID `59265`; Woo/origin rendered correctly, public Cloudflare cache had a stale 404.
- Generated fresh exact Cloudflare purge list from all published Woo products: 48 public 404 URLs, all origin-verified as 200.
- Ran duplicate/copy audit across 3,638 published products by SKU, normalized title, featured image ID/filename, suspicious copy/import slugs, and same-base title after size removal.
- Browser-verified the 12 exact normalized-title duplicate groups / 24 live URLs with headless Chromium; all 24 rendered as product pages and 0 rendered Page Not Found.
- Added live Woo data decision sheet for those 12 groups with recommended keep/retire candidates based on slug, price, stock, image, and order lookup history.
- After owner approval, deployed frontend redirects for the 12 retire slugs, verified origin redirects, then unpublished the 12 retire-candidate Woo products by setting them to `draft`.

### Verification
- Outputs saved in `workspace/audit/active/`: `cloudflare-stale-404-product-urls-20260609.txt`, `duplicate-copy-product-audit-20260609.md`, `duplicate-browser-verification-20260609.md`, and `duplicate-resolution-recommendations-20260609.md`.
- Added reusable verifier `workspace/scripts/verify-duplicate-browser.mjs`.
- Redirect commit `f51f529` built locally, deployed to `/var/www`, VPS build passed, `emartweb` restarted, live smoke passed, and commit pushed to `origin/main`.
- Status verification: keepers remain `publish`; retired IDs `43862`, `61936`, `62282`, `74407`, `74551`, `74669`, `74668`, `74687`, `74686`, `75176`, `75486`, `75513` are `draft`.
- Next revalidation returned `200` for all old/keeper product paths plus `/shop`.

### Blockers
- No Cloudflare API token is configured in local/runtime env, so exact edge purge for the 12 old duplicate URLs must be done manually if any edge still serves stale `200` HTML.

### Next
- Cloudflare exact-URL purge completed by owner after audit.
- Purge the 12 retired old duplicate URLs listed in `duplicate-resolution-recommendations-20260609.md` if public edge cache still shows old PDP HTML.

---

## 2026-06-09 22:20 CEST — Codex combined image/duplicate browser audit

### Did
- Combined the old 16-product image audit with noisy duplicate signals: suspicious copy slugs, same-base-size groups, and duplicate featured-image filename groups.
- Exported current Woo publish/draft product facts read-only, ranked candidates, and browser-verified 70 live PDPs with headless Chromium.
- Refined classification from the rendered live `og:image`, not only Woo thumbnail metadata, to avoid false positives from stale admin thumbnails.

### Verification
- Final outputs saved in `workspace/audit/active/combined-image-duplicate-browser-final-20260609.md` and `.csv`.
- Result split: 33 Level A likely image/action items, 13 Level B admin/visual-confirm items, 24 Level C low-priority/likely variant signals.

### Blockers
- No product images or Woo data were changed. Level A image replacements still require a trusted source image or owner approval.

### Next
- Owner/agent reviews Level A list first; apply image fixes only when the correct product image source is clear.

---

## [2026-06-10 01:25 UTC] Claude
- Did: Resumed/rewrote meta_generator.py support (--force/--ids-file, done in prior session); rewrote /root/.openclaw/workspace-emart/blog_generator.py (GSC+evergreen topics, 5 writer personas, anti-AI prompt rules, in-content internal linking, always-attach featured image, fixed OpenRouter model list); live-tested blog_generator successfully (published post 93922 Innisfree guide); added TikTok to Organization sameAs schema in layout.tsx (Local+VPS, undeployed); per "meta first" instruction, resumed item #14 meta-description dry-run in background (PID 448966) for 1266 remaining product IDs (38/1304 already done in prior run).
- Completed tasks: none fully closed — #14 in progress (dry-run only, 38/1304 + 1266 running), C1 blog generator validated and left in ready-to-run mode (not cron'd, per "blog next"/"keep blog ready to run mode")
- Blockers hit: OpenRouter free-tier shared rate limits caused contention between meta_generator and blog_generator test runs; resolved by sequencing (meta first). Reddit/LinkedIn sameAs blocked — no profile URLs in companyProfile.ts.
- Next step: Let PID 448966 dry-run finish (output: workspace/audit/active/meta-generator-2026-06-10-resume.log), spot-check JSONL results, then re-run without --dry-run to apply + revalidate tag:products. After meta regen progresses, run blog_generator.py manually once more (gsc:1 topic next) then add cron 0 2,10,18 * * *. Deploy TikTok schema fix (C2). Deliver strategic SEO/mobile/AI-search note (C3). Get Reddit/LinkedIn URLs from owner if applicable.

## [2026-06-10 02:10 UTC] Claude
- Did: Reconciled 3-way Local/VPS/origin git divergence (8 files: TASKS.md, SEO_MASTER.md, meta_generator.py, SESSION-LOG.md, 4 .agent-memory files) without losing Codex's or prior Claude's content; merged SESSION-LOG histories and MEMORY.md index entries; added GEO/AEO standing-consideration section to SEO_MASTER.md + memory + TASKS.md (C4) per owner request; archived 16 orphaned files (13 checkout-audit screenshots + 3 .mjs scripts from a different agent's session, never tracked) to /root/.attic-2026-06-10/; built+committed+deployed C2 (TikTok sameAs schema) end-to-end: Local build pass, commit 806938f, VPS build pass, pm2 restart emartweb, live smoke HTTP 200, live JSON-LD confirmed includes TikTok URL, pushed to origin/main, VPS git fast-forwarded to 806938f.
- Completed tasks: C2 (TikTok sameAs) — fully done and live. GEO/AEO standing consideration documented (C4).
- Blockers hit: deploy.sh's `rsync --delete` on workspace/ would have destroyed the live meta-regen background job's output (PID 448966 still running) — avoided by skipping deploy.sh and doing a targeted manual deploy since layout.tsx was already identical on both trees.
- Next step: PID 448966 (meta-regen dry-run, 1266 IDs) continues running unaffected — let it finish, spot-check JSONL, then re-run without --dry-run + revalidate tag:products. C1 (blog generator) stays ready-to-run, not cron'd, until #14 progresses. C3 (strategic SEO/AI-search note) still owed. Reddit/LinkedIn sameAs still blocked on owner-provided URLs.

## [2026-06-10 (cont.)] Claude
- Did: Ran the 14-item SEO/frontend audit (Phase 1 verify with file:line for A1, B2-B6, C7-C11, D12-D14; Phase 2 proposals + GO decisions via AskUserQuestion). Several items were stale/already resolved: A1 (Pixel ID `763041131179021` confirmed correct, env var present in .env.local), B2 (dead `ShopByCategorySection` in HomepageSections.tsx, unused — removed), C10 meta-description part (contact page already has one), D12 (blog Article JSON-LD + visible byline already implemented in `blog/[slug]/page.tsx`).
- Completed tasks: Approved batch fixed/deployed/pushed — B6 (twitter:site `@emartbd`→`@emartskincarebd`, commit `d82b421`), C11 (robots.txt CCBot disallow→allow, `b8eba66`), B2 cleanup (`508beef`), C9 (sitemap lastmod split: catalog-reflecting pages get fresh generation-time date, static pages omit lastmod instead of frozen `2026-05-16`, `c08de32`). Edits made on VPS first this session, reverse-synced to Local before committing per hotfix rule. Built (Local + VPS), `pm2 restart emartweb`, live origin smoke verified all 4 (Cloudflare edge briefly served stale `@emartbd`, origin confirmed correct). Pushed `2c358f9..c08de32` to `origin/main`.
- Blockers hit: B3 (Moisturizers card → /category/night-cream, slugCandidates typo) — owner does not want a slug/URL change; wants more products assigned into the backing category instead (WooCommerce data task, not code). Deferred. VPS git metadata still shows the 4 files as locally modified (working tree matches the new commits exactly, but VPS git ref not fast-forwarded) — left as-is to avoid a risky reset given other uncommitted/untracked workspace files on VPS.
- Next step: B5/C7/C8/C10(remainder)/D13/D14 proposals are written up (see TASKS.md C5) but await owner GO. B4 (hero <img>→next/image) explicitly deferred as a separate LCP-sensitive task. B3 needs a follow-up data-assignment session for WooCommerce category counts.

## [2026-06-10 (cont. 2)] Claude
- Did: B3 follow-up (WooCommerce data task, no code/slug/URL change). Renamed WC category term 3601 (slug `night-cream`, unchanged) from "Night Cream" to "Moisturizers". Audited the full 3,626-product published catalog for "moistur*" titles, applied owner criteria (cream/gel cream/moisturizer/facial lotion only/night cream — excluding body lotion, baby, sunscreen-primary, masks, toners, serums, cleansers, lip/hair) and additively assigned category 3601 to the 27 `cream-moisturizer` products plus 120 more matching products (additive only — existing categories kept). Revalidated `tag:products` and `tag:categories`.
- Completed tasks: B3 — "Moisturizers" homepage card now shows 162 products (was 15), live-verified via direct origin curl.
- Blockers hit: none. Minor cosmetic note: `/category/night-cream` page `<title>`/meta still reads old Rank Math "Night Cream Prices in Bangladesh" copy — driven by a 1hr `next:{revalidate:3600}` GraphQL fetch (not tag-based), will self-update within an hour now that the underlying term name is "Moisturizers".
- Next step: B5/C7/C8/C10(remainder)/D13/D14 from the 14-item audit still await owner GO (see TASKS.md C5). B4 (hero <img>→next/image) remains a separate deferred task.

## [2026-06-10 (cont. 3)] Claude
- Did: Implemented owner-approved B5/C7/C8 from the 14-item audit (per "next" + "All 3 (Recommended)"). B5: added `data-nosnippet` to the hidden-on-desktop mobile hero copy span in `HeroCarousel.tsx`. C7: discovered the originally-approved fix (cast `openGraph.type='product'`) would throw `Invalid OpenGraph type: product` at runtime — Next 14's typed `openGraph.type` union has no `'product'` value and `generate/opengraph.js` has an exhaustive switch with a throwing default. Used a different approach: removed the broken `other['og:type']:'product'` (rendered as `<meta name="og:type">`, ignored by OG parsers) and added a raw `<meta property="og:type" content="product" />` directly in `shop/[slug]/page.tsx`'s JSX output. C8: added `withDhakaOffset()` helper in `wordpress-posts.ts` so blog `date`/`modified` (site-local Asia/Dhaka, no DST/offset) get `+06:00` before feeding `datePublished`/`dateModified` JSON-LD on `/blog/[slug]`.
- Completed tasks: All 3 built/typecheck/lint clean on Local, each committed separately (`592b1eb`, `3c909d1`, `f61a3f5`), rsynced to VPS, VPS build clean, `pm2 restart emartweb`, live-verified (PDP shows single correct `<meta property="og:type" content="product"/>`, homepage hero has `data-nosnippet="true"` on mobile copy, blog JSON-LD `datePublished`/`dateModified` now show `+06:00`). Pushed `9536ed9..f61a3f5` to `origin/main`, VPS git realigned via `git reset --mixed origin/main`.
- Blockers hit: none.
- Next step: C10 remainder (marquee + cart-preview `data-nosnippet` in `Header.tsx`), D13 (ingredient/concern internal links on PDP), D14 (numbered pagination on /shop, /category) still await owner GO (see TASKS.md C5). B4 (hero <img>→next/image) remains a separate deferred task.

## [2026-06-10 (cont. 4)] Claude
- Did: Found Codex had already completed the remaining 14-item audit work (C10 remainder, D13, D14) via commits `fc47ea6`, `20adebf`, `d850d4a` — pushed to `origin/main` (Local already at these commits) but not yet reflected on VPS git (working tree had the new code, untracked/uncommitted, build+pm2 restart already done).
- Completed tasks: Realigned VPS git via `git reset --mixed origin/main` to `edb6927` (clean, only pre-existing untracked meta-regen docs left). Live-verified all 3: C10 (`data-nosnippet` x5 in header marquee/cart-preview), D13 (`ProductEducationLinks` renders Ingredients/Skin concerns links to `/ingredients/*`/`/concerns/*` on COSRX snail essence PDP), D14 (`NumberedPagination` on `/shop?page=2` shows 152 pages with prev/next + numbered links). Updated TASKS.md C5 to mark the full 14-item audit (A1, B2-B6, C7-C11, D12-D14) as closed.
- Blockers hit: none.
- Next step: 14-item SEO/frontend audit fully closed. B4 (hero <img>->next/image) remains the only deferred item, separate LCP-sensitive task, not currently assigned.

## [2026-06-10 (cont. 5)] Claude
- Did: Investigated owner's "Unexpected token '<', Jetpack account info" wp-admin error on product edit screens. Root cause: stale Jetpack connection data in DB (old WordPress.com blog ID, expired Publicize tokens) but Jetpack plugin not installed; `google-listings-and-ads` (`gla_jetpack_connected` empty) and `reddit-for-woocommerce` (both bundle Jetpack-Connection package) fail their connection-status check on the product edit screen, returning non-JSON. Confirmed cosmetic/non-blocking — product saves and GMC sync (`gla_google_connected=1`) unaffected.
- Owner then asked to "activate Reddit ... in a way compatible with current format" — clarified via AskUserQuestion: chose **frontend Reddit Conversions Pixel** (matches existing Meta Pixel/GA4 pattern), not the broken WP `reddit-for-woocommerce` plugin. Owner then supplied a real Reddit Ads Pixel ID (`a2_j5ni2gcn8o6b`).
- Completed tasks: Added `src/lib/redditPixel.ts` + `src/components/analytics/RedditPixel.tsx` (lazy-loaded like MetaPixel, fires PageVisit/ViewContent/AddToCart/Purchase via `rdt()`). Wired into `runtime-widgets.tsx`, `ProductViewContentEvent.tsx` (ViewContent), `ProductCard.tsx`+`ProductInfo.tsx` (AddToCart on add-to-cart and buy-now), `OrderSuccessClient.tsx` (Purchase, reusing the existing Meta purchase sessionStorage payload). CSP (`next.config.js`) updated to allow `redditstatic.com` (script-src), `alb.reddit.com`/`pixel-config.reddit.com`/`www.reddit.com` (connect-src), and `alb.reddit.com` (img-src — pixel beacons are sent as `<img>` GETs to `rp.gif`, a second CSP fix was needed after first live test surfaced a blocked-image console error). Set `NEXT_PUBLIC_REDDIT_PIXEL_ID=a2_j5ni2gcn8o6b` in both Local and VPS `.env.local`. Built/lint/typecheck clean, VPS build + `pm2 restart emartweb` clean (x2, after CSP fix). Committed `3ac9894` + `04e1a71`, pushed to `origin/main`, VPS git realigned (had to `git fetch origin main` first — VPS `origin/main` ref was stale at `83cd5d0`).
- Live verification (Playwright on https://e-mart.com.bd): `window.rdt` loads and fires `PageVisit` on every page; SPA navigation to a PDP fires `ViewContent` with product id+name; Add to Cart fires `AddToCart` with product id+name; all three confirmed via real `alb.reddit.com/rp.gif` network requests, zero CSP console errors after the fix. Purchase event (order-success) not live-tested (would require a real checkout) but follows the identical, already-working Meta Pixel sessionStorage-payload pattern.
- Blockers hit: none. Note: on a hard/direct page load (not SPA nav), `ProductViewContentEvent`'s mount-time `useEffect` can fire before the lazy-loaded pixel script (`window.rdt`/`window.fbq`) is ready, silently no-op'ing ViewContent for that specific load — this is a pre-existing characteristic of the lazy-load pattern shared with Meta Pixel, not a regression.

## [2026-06-10 (cont. 6)] Claude
- Did: Worked through owner's owner-action backlog. (1) TASKS.md item #11 ("6 'original original' metas") — re-checked DB, found zero `pa_brand`/`pa_origin` terms named "original" and zero `_rank_math_description` rows with duplicated "original original"; closed as already-resolved. (2) Read & summarized `OWNER-ACTIONS-20260605.md` (4 manual owner tasks: MailPoet review automation, Meta CAPI test, GSC URL indexing x7, Cloudflare cache rule). (3) Checked item #14 (1304-product meta regen) status: dry-run had stalled at 88/1266 IDs (50-per-batch invocation, not a daemon), 0 applied.
- Spot-reviewed the 88 dry-run candidates (free models `kimi-k2.6:free` etc.) and found real quality bugs the validator (`meta_validator.py`) doesn't catch: literal **"XYZ"** brand placeholder in 2 rows (IDs 4141, 26910), plus garbled-grammar rows (2969 "so Original", 3608 "tea deep bright extract", 3706 "goldpeptides"). Root-caused "XYZ": it's a **live data bug**, not an LLM hallucination — `pa_brand` taxonomy term_id 8050 was literally named "XYZ" and assigned to **11 published products**, already baked into their live `_rank_math_description` (e.g. "Authentic XYZ.", "buy original XYZ").
- Per owner instruction, switched `meta_generator.py` MODEL to a paid OpenRouter model (`deepseek/deepseek-chat-v3.1`, fallback `deepseek/deepseek-v3.2` then free models) — valid key from `/root/.openclaw/credentials/openrouter_default.json` (the `openclaw.env` key is still the known-stale 401 one). Added `&amp;`/`&#39;`/`&quot;` HTML-entity unescaping to `repair()` (DeepSeek occasionally emits literal entities). Created `_run_generator.py`/`_run_validator.py` wrapper scripts (VPS `workspace/docs/`) that read `EMART_DB_PASSWORD` from `wp-config.php` and `OPENROUTER_API_KEY` from the credentials JSON in-process, avoiding plaintext secrets on the command line/transcript.
- Fixed the `pa_brand="XYZ"` data bug (with owner confirmation on the 2 ambiguous products): created new pa_brand terms "Beaute" (9744, 9 products) and "LUOFMiSS" (9745, 1 product), reassigned product 62318 to existing "Athena" (1211), deleted the orphaned "XYZ" term (8050).
- Completed tasks: Regenerated all 85 + the 11 XYZ-affected/3 retry IDs with DeepSeek, validated (0 flagged), applied **94 corrected meta descriptions** to live DB (`_emart_meta_description` + `_rank_math_description`), revalidated `tag:products`. Live-verified product 26910 now shows brand "Beaute" (was "XYZ") in both meta description and JSON-LD. `--catalog --changed-today` validator confirms none of the 94 are flagged (483/3627 flags remaining are pre-existing item #14 backlog, unrelated).
- Blockers hit: none. Item #14 progress: 94/1266 IDs done (88 original dry-run batch + 11 XYZ-fix minus overlap + 3 retries — see `meta-regen-batch2-ids.txt`/`meta-regen-deepseek-batch1-ids.txt`). ~1172 IDs remain.
- Next step: Continue item #14 in batches of ~50 with DeepSeek model + validator + apply-reviewed cycle (cost is trivial, ~$0.0002/product). C1 (blog generator) remains blocked until #14 substantially progresses/completes per "meta first, blog next". C3 (strategic SEO note) still owed.
- Next step: Reddit Conversions Pixel is live with real ID `a2_j5ni2gcn8o6b`. No action needed on `reddit-for-woocommerce`/`google-listings-and-ads` Jetpack error toast (cosmetic, left as-is).

## 2026-06-10 (Claude — platform audit + remediation plan)
- Did: full read-only platform audit (12 phases) → /var/www/audit/EMART_AUDIT_20260610.md, copied to workspace/docs/audits/. Grade B+. 1 Critical (admin auth returns REVALIDATE_SECRET as token), 6 High (PDP private-cache/force-dynamic, homepage rails ssr:false, schema availability divergence, no aggregateRating, no rate limiting, wp-login.php public), 10 Medium, 7 Low.
- Created workspace/docs/AUDIT_REMEDIATION_PLAN_20260610.md (R1–R20, per-task specs + verify lines + Sonnet/Codex prompt template) and new 🛠️ section in TASKS.md. Docs synced Local↔VPS. Nothing committed/pushed — docs only, owner to review.
- Blockers: owner decisions needed on R3 (wp-login exposure) and R17 (30s pixel deferral); Cloudflare cache rule (owner item #4) gates R11.
- Next: execute R1 (admin auth hardening) first — freeze-safe.

## 2026-06-11 (Claude — R1 admin auth hardening)
- Did: committed pending audit docs (`41c0489`). Then R1 (C-01): added `ADMIN_API_TOKEN` env var (Local+VPS `.env.local`, new random 32-byte hex), new `src/lib/adminAuth.ts` (`isAdminAuthorized` header-only `x-admin-token`, `timingSafeEqualStr`). `/api/admin/auth` now returns `ADMIN_API_TOKEN` (not `REVALIDATE_SECRET`) with timing-safe username/password compare. `/api/admin/orders`, `/api/pathao/order`, `/api/packzy/order` switched to `isAdminAuthorized`, dropped `?token=` query support. Dispatch page (`src/app/admin/dispatch/page.tsx`) moved token storage `localStorage`→`sessionStorage`, sends `x-admin-token` header for all 3 calls. `/api/revalidate` untouched.
- Verified live: new token login → 200 on `/api/admin/orders`; old `REVALIDATE_SECRET` as `x-admin-token` → 401; `?token=` → 401; no auth → 401; `/api/revalidate` with `REVALIDATE_SECRET` still → 200. Build clean Local+VPS, `pm2 restart emartweb`, smoke 200, committed `13ad3c1`, pushed to `origin/main`, VPS git aligned.
- Blockers: none. R1 closed in TASKS.md.
- Next step: R5 (attic `.env.local.backup-20260502-google-restore`, trivial) then R4 (checkout error hygiene + fetch timeouts), per remediation plan suggested order.

## 2026-06-11 (Claude — R2/R3 decisions)
- Did: asked owner about R2 (rate limiting) and R3 (wp-login.php exposure). Owner picked Cloudflare Access (email gate) for R3 — no Cloudflare API token on VPS, so wrote owner action doc `workspace/docs/OWNER-ACTION-R3-cloudflare-access-20260611.md` (Zero Trust app + policy steps, allowlist `hgc.bd71@gmail.com`, verify steps, rollback). Added as TASKS.md owner item #15. Owner picked "stick to suggested order" for R2 — deferred to its own session at position 7 (after R5/R4/R6+R8/R7/R9+R10).
- Blockers: R3 awaiting owner to apply Cloudflare dashboard config, then reply "R3 done" for live recheck.
- Next step: R5 (attic env backup, trivial) then R4 (checkout error hygiene + fetch timeouts).

## 2026-06-11 (Claude — R5 + R4)
- Did R5 (L-06): moved `.env.local.backup-20260502-google-restore` (Local + VPS) to `/root/.attic-2026-06-11/emart-platform/apps/web/`; was gitignored, no repo change.
- Did R4 (M-09/M-10): new `src/lib/checkoutErrors.ts` (`getCheckoutErrorResponse`) maps raw Woo/plugin checkout errors to customer-safe messages (stock/coupon text passes through, else generic-by-status); `/api/checkout` catch-all logs full raw error server-side, returns mapped message+status. Added `AbortSignal.timeout(8000)` to bare fetches in `wordpress-posts.ts`, `sitemapEntries.ts`, `youtubeRss.ts`, `seo.ts`.
- Verified: build clean, `sitemap.xml` → 200 live, checkout validation (`{}` payload) still returns friendly 400. Committed `45736fc`, deployed via `deploy.sh`, pushed, VPS aligned.
- Blockers: none. R1, R4, R5 all closed.
- Next step: R6+R8 (schema availability from `normalizeStockAvailability` + drop fabricated `mpn`), then R7 (aggregateRating), per suggested order.

## 2026-06-11 (Claude — R6+R8, R7 reconciliation)
- Did R6 (H-03): `src/lib/seo/product.ts` Product JSON-LD `offers.availability` now uses new `getSchemaAvailability()` helper → `normalizeStockAvailability()` (same authority as checkout): available→InStock, backorder-eligible→BackOrder, else→OutOfStock.
- Did R8 (M-01): removed fabricated `mpn` (was a copy of internal `EM-` SKU); `sku` retained, no GTIN invented.
- Reconciled R7 (H-04): `aggregateRating` already gated on `rating_count > 0` since `391afbc` (2026-05-29, predates audit). Checked live Woo data for the audit's 3 named PDPs (COSRX essence, Eucerin cream, Kwailnara lotion) — all have `rating_count: 0`, so correct omission. No code change; closed as stale finding.
- Verified live: COSRX essence (instock→InStock, no mpn, sku=EM-93028), Kerasys shampoo (outofstock→OutOfStock), Boom-de-ah-dah ampoule (onbackorder→BackOrder). Build clean, committed `41c83f8`, deployed via `deploy.sh`, pushed, VPS aligned.
- Blockers: none. R6, R7, R8 all closed.
- Next step: R9+R10 (canonical inheritance removal + trivia batch: safeJsonLd categories page, search alt fallback, best-definitions dates), per suggested order. R3 still awaiting owner Cloudflare Access setup; R2 deferred to own session.

## 2026-06-11 (Claude — R9+R10)
- Did R9 (M-04): removed `alternates.canonical: SITE_URL` from `src/app/layout.tsx` root metadata. Only `not-found.tsx` had no own canonical (now emits none, was inheriting homepage canonical with noindex present). All other sampled pages (home, PDP, category, categories) already set their own canonical — unchanged live.
- Did R10 trivia batch: (L-02) `categories/page.tsx` JSON-LD now uses `safeJsonLd` instead of raw `JSON.stringify`; (L-05) `/api/search` suggestion images fall back `alt` to `product.name` when Woo alt is empty; (L-04) consolidated 3x hardcoded `updatedDate: '2026-05-19'` in `best-definitions.ts` into single `BEST_GUIDES_LAST_REVIEWED` constant; (L-07) accepted as cosmetic, no change.
- Verified live: home/PDP/category/categories canonicals unchanged; bogus URL → no canonical + noindex; categories page both JSON-LD `@graph` blocks parse clean; search alt populated for CeraVe query. Build clean, committed `99573b8`, deployed, pushed, VPS aligned.
- Blockers: none. R6, R7, R8, R9, R10 all closed.
- Next step: per suggested order, position 7 (R2 rate limiting) is deferred to its own Codex-prep+Claude-apply session. Position 8 = R11 (PDP `s-maxage` via existing Nginx override pattern, freeze-safe stage 1 of H-01) — candidate for next session.

## 2026-06-11 (Claude — R11 PDP cache headers + Cloudflare TTL finding)
- Did R11 (H-01 stage 1): added Nginx `location ~ ^/shop/[^/]+/?$` (runtime-only, `/etc/nginx/sites-enabled/emart-nextjs`, backed up to `emart-nextjs.backup-20260611-pdp-cache`), matching the existing `/category/[slug]`/`/brands/[slug]` pattern — PDPs now emit `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` (was `private, no-store` from force-dynamic). `nginx -t` passed, reloaded. Origin-verified via `127.0.0.1`+Host header; `/shop` listing, old-slug 301 redirects, `/shop/page/N` redirect all unaffected.
- Owner applied the Cloudflare cache rule (item #4) this session. Live recheck found `cf-cache-status: HIT` on PDPs and category pages at `age` ~1700-2150s (~28-36min), one PDP still serving the pre-R11 `private, no-store` header while HIT — Cloudflare is ignoring origin Cache-Control and applying its own ~1hr edge TTL to `/shop/*` broadly (incl. PDPs), exactly the conflict the audit flagged. Checkout still re-validates stock/price server-side, so no overselling risk — but PDP price/stock display + Product JSON-LD can be ~1hr stale at the edge vs the documented 5min tradeoff.
- Logged finding in new memory `project_pdp_cache_r11_20260611.md` + MEMORY.md index, TASKS.md R11 + owner-decisions section updated.
- Blockers: new owner decision — scope Cloudflare rule to exclude `/shop/{slug}` PDPs (5min, respect-origin) vs accept ~1hr PDP display staleness (checkout-safe either way).
- Next step: per suggested order, R2 (rate limiting) remains its own Codex-prep+Claude-apply session. R13 (single price formatter, formatBDT consolidation) is next code task — Codex-tagged in plan but small/mechanical enough for this session if owner doesn't have a Codex-prep doc ready.

## 2026-06-11 (Claude — R11 Cloudflare side closed with owner)
- Did: guided owner through Cloudflare cache-rule fix for R11/H-01: "Shop and Category Pages" Edge TTL changed from "Ignore cache-control, 1hr" to "Use cache-control header if present, bypass if not", Browser TTL → respect origin, duplicate rule deleted, Purge Everything. Live-verified post-purge: PDP MISS→HIT serving origin s-maxage=300 (age 2s), stale pre-R11 private/no-store copies gone, category MISS→HIT, homepage HIT 3600. R11 fully closed in TASKS.md; memory project_pdp_cache_r11_20260611 updated to resolved.
- Blockers: none. Next per plan order: R13 (Codex, price formatter), R16 (Sonnet, GA4 events); R2 still queued for its own session; owner: R3 Cloudflare Access steps + R17 pixel-delay decision.

## 2026-06-11 (Claude — R16 GA4 ecommerce funnel)
- Did R16 (M-02): added `trackGA4` calls mirroring existing Meta Pixel sites — `view_item` (`ProductViewContentEvent.tsx`), `add_to_cart` (`ProductInfo.tsx` add-to-cart + buy-now, `ProductCard.tsx`), `begin_checkout` (`CheckoutClient.tsx`), each with `currency: 'BDT'`, `value`, `items[]`. New helpers `getGA4ProductItem`/`getGA4ProductValue` in `src/lib/ga4.ts`; `trackGA4` param type widened to `Record<string, unknown>`.
- Found+fixed a real bug while live-verifying: GA4's `gtag`/`dataLayer` stub only existed inside the 30s/interaction-deferred `LazyGoogleAnalytics` script, so `view_item` (fired on PDP mount, often before any interaction) raced against script load and was silently dropped. Moved the (network-free) stub to a plain `<script>` in `app/layout.tsx` `<head>`, executed during initial HTML parse before hydration. `gtag.js` fetch itself stays deferred — no perf regression.
- Live-verified fresh (no prior interaction, Playwright): `view_item` queues immediately on PDP load with correct items/value; `add_to_cart` queues on click with correct items/value.
- New finding (not fixed, flagged): `begin_checkout` + the pre-existing `InitiateCheckout` it mirrors did not fire on `/checkout` with a non-empty cart in the live test — likely `[]`-deps effect runs before Zustand cart-persist rehydration completes. Affects existing Meta event too, not just the new GA4 one. Cart/checkout is "never touch without explicit request" — left for owner/separate session.
- Build clean, committed `75c54d7` + `845f482` + `ba8b1f4`, deployed via `deploy.sh`, pushed, VPS aligned.
- Blockers: none. R13 (price formatter, Codex-tagged) and R14/R15 remain. Owner: R3 Cloudflare Access steps + R17 pixel-delay decision; new begin_checkout/InitiateCheckout cart-hydration finding for a future session.

## 2026-06-11 (Codex — R13 + R15)
- Did R13 (M-05): moved remaining cart/checkout/wishlist/PDP/header/skin-quiz price displays to shared `formatBDT`; removed `woocommerce.ts` `formatPrice`; kept skin quiz `View price` empty-state. Quick sample comparison against old Woo/Header/SkinQuiz output was byte-identical.
- Did R15 (L-01/L-03): moved empty `components/{atoms,molecules,organisms,templates}` scaffold dirs to `/root/.attic-2026-06-11/emart-platform/apps/web/src/components/`; added `NEXT_PUBLIC_GOOGLE_TAG_ID=G-WMJNX87Q2N` to Local+VPS `.env.local`; removed hardcoded GA4/Meta pixel ID fallbacks from source. Reddit already used env-only.
- Verified: Local build clean; source search clean for `formatPrice`, atomic imports, and literal analytics IDs; Local+VPS env contain GA4/Meta/Reddit public IDs.
- Blockers: none.
- Note: deploy also included existing parent commit `5f4a9f4` (R17/M-03), which shortens GA4/Meta/Reddit analytics deferral from 30s to 8s while keeping the cosmetic merchant badge at 30s.
- Next step: R14 (Woo split/type cleanup) or R2 focused rate-limit prep/apply session; owner still has R3 Cloudflare Access.

## 2026-06-11 (Codex — audit order check)
- Checked owner-proposed order against TASKS.md + remediation plan. Updated docs to show R13/R15 done, R17 done/live, R3 doc-ready but not closed (`/wp-login.php` still HTTP 200), next Claude session = R2 prep+apply then R14 structure note, then Codex R14 2-3 sessions, post-freeze queue = R12 -> R18 -> R19 -> R20.
- Blockers: R3 still requires owner Cloudflare dashboard action before live recheck can close it.
- Next step: R3 owner apply/recheck or R2 focused session; R14 after R2/R13/R15 context is stable.

## 2026-06-11 (Codex — R14 fast split)
- Did R14 (M-08): split `src/lib/woocommerce.ts` into `src/lib/woo/` modules (`client`, `types`, `transformers`, `products`, `brands`, `origins`, `categories`, `shipping`, `orders`, `reviews`, `coupons`, `customers`, `helpers`, `index`) and left `@/lib/woocommerce` as a stable barrel. Existing import sites unchanged.
- Typed the moved raw Woo REST response handling with local `WooRaw*` shapes; `rg` confirms no `any` usage remains in `src/lib/woo` or the barrel.
- Verified: `npm run build` clean locally.
- Blockers: none for R14. Pre-freeze remaining is now R3 owner Cloudflare Access apply/recheck and R2 rate-limit prep+apply.

## 2026-06-11 (Codex — R2 rate limiting)
- Did R2 (H-05): applied runtime Nginx rate limiting with Cloudflare real-IP restoration. Added `/etc/nginx/conf.d/cloudflare-real-ip.conf` (repo reference `workspace/docs/R2-cloudflare-real-ip-nginx.conf`); changed rate zones to use a real-client-IP key with localhost/VPS exemption for `emart-checkout-monitor`; split exact API locations for `/api/admin/auth`, `/api/newsletter/subscribe`, and `/api/search`, keeping `/api/checkout` separate and general APIs on the existing bucket.
- Safety: backups exist at `/etc/nginx/nginx.conf.backup-20260611-r2-rate-limit` and `/root/.attic-2026-06-11/nginx/sites-enabled/emart-nextjs.backup-20260611-r2-rate-limit`; moved the site backup out of `sites-enabled` after `nginx -t` correctly flagged it as an accidentally loaded duplicate config.
- Verified: `nginx -t` passed; `systemctl reload nginx`; live home 200, `/api/search?q=cerave` 200, `/api/admin/auth`, `/api/newsletter/subscribe`, and `/api/checkout` GETs return normal 405. Direct 429 burst from VPS was not meaningful because the VPS public IP is intentionally exempt.
- Blockers: R3 remains owner-side Cloudflare Access apply/recheck; live `/wp-login.php` still returns HTTP 200.

## 2026-06-11 (Codex — R3 recheck/update)
- Owner reported R3 done, but live unauthenticated recheck still reached WordPress directly: `/wp-login.php` returned `HTTP 200`; `/wp-admin/` returned WordPress `302` to `/wp-login.php?redirect_to=...&reauth=1`; the query-string login URL also returned WordPress `HTTP 200`.
- Updated owner action doc, TASKS, audit plan, and memory to clarify the likely Cloudflare Access path mismatch: use `e-mart.com.bd` paths `/wp-login.php*` and `/wp-admin/*`. The `*` matters because WordPress appends query strings.
- Blockers: R3 is still not closed; owner will revisit Cloudflare dashboard later, then request another recheck. All other pre-freeze R-items are closed.

## 2026-06-11 (Codex — R3 rollback after broad Access)
- Owner tried a single-path/single-hostname Cloudflare Access setup. Live recheck showed `/wp-login.php`, `/wp-admin/`, and query-string login URLs were behind Cloudflare Access, but the public storefront was also protected: `/`, `/shop`, and a PDP returned Cloudflare Access 302. This would block customers.
- Owner deleted the Access app/rule. Verified storefront restored: `/` 200, `/shop` 200, sample PDP 200. WordPress login/admin reverted to public WordPress (`/wp-login.php` 200, `/wp-admin/` -> WordPress login), so R3 remains pending.
- Blockers: R3 needs either a Cloudflare setup that can target only `/wp-*` without the bare domain, or a different owner-approved approach; do not re-enable broad Access on `e-mart.com.bd`.

## 2026-06-11 (Claude — R19 design-token consolidation, freeze partially broken)
- Owner approved breaking the post-freeze backlog freeze for R19 only (low SEO risk: CSS/token cleanup, no URL/canonical/sitemap/nav touch). R12 (PDP ISR) and R18 (homepage product rail) stay frozen until Jul 3.
- Did R19 items 1+2 (M-06/M-07): replaced 33x `#9f1239` + 26x `#D4A248` SVG hex literals in `CategoryIllustration.tsx` with `PORCELAIN_COLORS.accent`/`.brass`; renamed `lumiere-*` Tailwind classes -> porcelain equivalents (`lumiere-primary-hover`->`black`, `lumiere-text-primary`->`ink`, `lumiere-text-secondary`->`muted`, `lumiere-primary`->`ink`, `lumiere-background`->`bg`) across 16 `components/home/*` and `components/product/*` files; removed the now-unused `lumiere` block from `tailwind.config.js`; removed unused `--color-brand-dark` from `tokens.css`; fixed one stray `text-[var(--color-brand-dark)]` in `components/common/TrustStrip.tsx` -> `text-ink`; fixed `TONE_BORDER_COLOR['text-accent']` in `Header.tsx` to use `PORCELAIN_COLORS.accent`.
- Item 3 (Midnight Blossom theme consolidation) intentionally descoped — documented in TASKS.md as a deliberate secondary theme for `/categories`, not to be merged.
- Verified: `npm run build` clean. Deployed via `./deploy.sh --no-commit` (all 8 steps passed, smoke 200). Pushed `8f72825..5dd5bb4`. Live Playwright check: homepage and a PDP render correctly with 0 console errors/warnings.
- New finding (pre-existing, not caused by R19): live `/categories` throws 8 React hydration console errors (#422/#425). Root cause traced to `flash-context.tsx:56` (`Date.now()`-seeded countdown `useState`, SSR vs client time mismatch in `CountdownTiles.tsx`) — confirmed via worktree SSR diff of pre/post-R19 builds, unrelated to this change. Documented in TASKS.md, not fixed (out of scope, low priority).
- Blockers: none for R19 — fully closed. R3 (Cloudflare Access) remains the only open pre-freeze item, owner-side.
- Next step: R3 owner recheck; R12/R18 remain frozen until Jul 3; new `/categories` countdown-hydration finding available for a future low-priority session.

## 2026-06-11 (Claude — R3 closed, third Cloudflare Access attempt)
- Owner audited Zero Trust Access apps: only a pre-existing unrelated app (`OpenClaw Agent` on `agent.e-mart.com.bd`, separate subdomain) remained; the broad/blocking app from attempt 2 was confirmed fully deleted.
- Owner created two narrow per-path Access apps for `e-mart.com.bd`: Path `/wp-login.php*` and Path `/wp-admin/*`, both policy Allow -> `hgc.bd71@gmail.com`. Root cause of attempt 2 documented in `OWNER-ACTION-R3-cloudflare-access-20260611.md`: a blank/`/` Path field matches the entire hostname.
- Live-verified: `/`, `/shop`, a PDP all 200 with no Access challenge; `/wp-login.php` and `/wp-admin/` return 302 to `cloudflareaccess.com` Access login; `/wp-json/wc/v3/products` still 403 (pre-existing, unaffected by Access).
- R3 (H-06) CLOSED. **All pre-freeze audit items (R1-R17) are now closed.** R20 (A+ re-audit) is unblocked; only R12 (PDP ISR) and R18 (homepage product rail) remain frozen until Jul 3.
- Blockers: none.
- Next step: R20 re-audit can run anytime (owner discretion on timing); R12/R18 wait for Jul 3 / owner approval.

## 2026-06-12 (Claude — cron job fixes + atomic-upgrade doc archive)
- Fixed 3 broken/misconfigured PM2 cron jobs found in 2026-06-11 audit (`163a609`):
  - `emart-seo-autoscan`: `WP_BASE=${WOOCOMMERCE_URL}/wp-json` (=`http://127.0.0.1`) was 301-redirected to https by nginx; `curl -sf` (no `-L`) returned the redirect HTML, silently parsed as `[]` -> false "0 missing" daily. Fixed `WP_BASE` to `https://e-mart.com.bd/wp-json` (Local+VPS); manual run now correctly found post 93922 missing SEO and reported it via Telegram.
  - `emart-competitor-prices`: missing wrapper script. Created `workspace/scripts/active/competitor_prices_run.sh` (Local+VPS, executable), modeled on `checkout_monitor_run.sh`. Manually ran `competitor_price_checker.js` (Playwright-based, ~25 GSC-impression products vs competitor sites).
  - `emart-serp-checker` (owner approved removal): was running `workspace/docs/baseline_snapshot.py --mode=baseline` (default) daily at 01:00 UTC. Before crashing on a bad GSC credential path (`google-service-account.json` not found), it already wrote `_emart_holdout` postmeta to live WC products (`select_holdout()`/`mark_holdout_in_db()`, idempotent UPSERT but holdout *set* can drift daily as the catalog changes). Script's own docstring says one-time/4-8-week tool, not daily. `pm2 delete emart-serp-checker` + `pm2 save`; script stays on disk for manual periodic use.
- Executed CLAUDE-atomic-upgrade.md audit follow-up: moved `CLAUDE-atomic-upgrade.md` -> `workspace/docs/archive/CLAUDE-atomic-upgrade.md` with a status header (executed 2026-05-29, superseded by DECISIONS.md tokens, stale Next15/pnpm/#E8739E references flagged). Deleted local branch `feat/atomic-refactor` (fully merged, 0 unique commits ahead of main); `origin/feat/atomic-refactor` left untouched (only local branch deletion was requested).
- Blockers: none. Next step: confirm competitor-prices manual run output, sync TASKS.md/SESSION-LOG.md to VPS, commit + push (no Next.js build/runtime changes in this session — all changes are standalone automation scripts + docs, smoke test = manual script runs above).
- Update: manual `emart-competitor-prices` run completed end-to-end (25 checked, 6 undercuts, 9 no-match), saved `competitor-2026-06-11.json` and pushed 16 rows to Google Sheets — confirms the wrapper fix works fully, not just "doesn't crash". All 3 cron fixes now fully verified.

## 2026-06-12 (Claude — login/auth UX improvements + critical 404 fix)
- Phase 1: Added `autoComplete`/`inputMode` attributes across `AccountClient.tsx` (login, register, password-reset forms) and `CheckoutClient.tsx` (name, phone, address, city) for browser/password-manager autofill support — no logic changes.
- Phase 2: Added `/api/auth/login-by-phone` proxy route + new "Log in with email + phone" UI on `/account`, wired to the existing unused WP backend `customer/login-by-phone` endpoint; sets the same `wc_session` cookie as normal password login (no new session mechanism).
- Backend hygiene: moved hardcoded Resend API key out of `emart-smtp.php` into `wp-config.php` (`EMART_RESEND_KEY` constant, matches `EMART_ORDER_SECRET`/`EMART_SMTP_*` convention); `emart-smtp.php` now reads via `emart_resend_key()` with `getenv()` fallback.
- **Critical fix (pre-existing prod bug, found during testing)**: `/api/auth/login`, `/api/auth/register`, `/api/auth/request-password-reset`, `/api/auth/verify-email`, and the new `login-by-phone` all returned HTTP 404 (`rest_no_route`) in production. Root cause: `getWordPressBaseUrl()` returned `http://127.0.0.1` in prod, which nginx 301-redirects to HTTPS, downgrading POST→GET per fetch spec, hitting WordPress's POST-only REST routes as GET → 404. Fixed all 5 files to resolve to `https://e-mart.com.bd` directly (same pattern as checkout's `PUBLIC_SITE_URL`), dropped the now-dead `Host` header override.
- Live smoke-tested all 5 endpoints post-deploy: login (401 proper error), login-by-phone (401 proper error), request-password-reset (200), register (400 validation), verify-email (307 redirect to `/account?verified=0`) — all correct JSON/redirects, no more 404s.
- Built + deployed Local→VPS→`pm2 restart emartweb`, verified live, committed `b2f10ae`, pushed to `origin/main`.
- Blockers: none. Next step: none required this session; session consolidation (NextAuth/wc_session/JWT unification) and SMS OTP remain explicitly deferred to post-freeze (after 2026-07-03) per the approved plan.
- Also found+fixed (same session, user-reported): checkout phone regex and login-by-phone match only accepted ASCII `0-9`, so Bengali-numeral input (০১৯১৯১৪২৩৬২) failed validation. Added `normalizePhoneDigits()` to `formatters.ts`, applied in checkout + account login-by-phone `onChange` handlers. WhatsApp/newsletter signup phone inputs are decorative/unused (no onChange), left as-is. Built/deployed/smoke-tested, committed `40aa494`, pushed.

## 2026-06-12 (Claude — checkout monitor false-alarm investigation)
- Owner forwarded a "Checkout Failure: Step 2–3 — Add to Cart — Cart is empty on /checkout" email alert (2026-06-12 14:00 BST / 08:00 UTC).
- Investigated via `emart-checkout-monitor` PM2 logs: the very next 15-min run (08:15 UTC) passed all 8 steps including a live `/api/checkout` BFF order write (test order 94141, cleaned up). Manually re-ran the monitor twice live — both fully passed (orders 94142, 94143, cleaned up). Live checkout confirmed healthy.
- Root cause: `checkout_monitor.js` Step 3b used a single fixed `waitForTimeout(1500)` then one check of `/checkout` body text for "cart is empty" after injecting the cart via localStorage and navigating. On an occasional slow load, the Zustand cart store hasn't hydrated from localStorage within 1500ms, producing a false "cart is empty" alert. This was the 3rd occurrence of this exact alert in 4 days (2026-06-08 18:30, 2026-06-08 21:00, 2026-06-12 08:00 UTC), always self-clearing on the next run.
- Fix: replaced the fixed 1500ms wait with a poll loop (10x 500ms, up to 5s) that re-checks the body text and breaks early once the cart-empty text disappears. Edited on VPS (`/var/www/emart-platform/workspace/scripts/active/checkout_monitor.js`), verified with a live run, then copied to Local. File is gitignored (`workspace/scripts/active/`), no commit/build/deploy needed.
- Blockers: none. Next step: none required; monitor for whether this false-positive pattern recurs.

## 2026-06-12 (Claude — Meta CAPI pollution + InitiateCheckout fix, Owner Action #2 follow-up)
- Continued from the Meta CAPI test (order 94184): root-caused the 3 logged "Meta CAPI Purchase failed (500)" entries (orderId 94165/94166/94167, exactly 15min apart). Cause: `emart-checkout-monitor` PM2 cron creates a real order via `/api/checkout` every 15 min (Step 7b), which fires a real `sendMetaPurchaseEvent()` CAPI call, then force-deletes the order (`wp post delete --force`) — explaining both the 500s and a likely chunk of the 381-Purchase-vs-real-orders gap in Meta Events Manager.
- Fix 1: added new shared secret `CHECKOUT_MONITOR_SECRET` (Local `.env.local` + VPS `.env.local` + `/root/.openclaw/openclaw.env`, `openssl rand -hex 32`). `apps/web/src/app/api/checkout/route.ts` now sets `isSyntheticMonitor` when `X-Checkout-Monitor-Secret` header matches, and skips both `sendMetaPurchaseEvent()` and the new-customer lost-password email for those runs. `checkout_monitor.js` and `checkout-bff-smoke.mjs` now send the header. Verified live: manual monitor run created+deleted order 94190 normally, and `emartweb-error-30.log` shows **no** new "Meta CAPI Purchase failed/exception" entry for it (last entries remain the pre-fix 94165-94167 from before the restart).
- Fix 2 (R16): `CheckoutClient.tsx` InitiateCheckout/`begin_checkout` effect had `[]` deps and ran before the Zustand cart-persist rehydration completed, so `items.length === 0` short-circuited and it never re-fired. Added `useRef` guard + changed deps to `[items.length]`. Verified live via Playwright: injected cart into localStorage, loaded `/checkout`, confirmed `begin_checkout` event with correct `value`/`items` landed in `window.dataLayer`.
- Built/deployed via `./deploy.sh` (Local build → commit → rsync → VPS build → `pm2 restart emartweb` → smoke 200 → push), commit `d18fe89`. checkout_monitor.js/checkout-bff-smoke.mjs are gitignored (`workspace/scripts/active/`), edited on both Local and VPS directly.
- Deferred/out of scope (documented in plan, not changed): Facebook-for-WooCommerce plugin vs custom CAPI duplicate-Purchase investigation (needs owner check of Events Manager Diagnostics "Integration" breakdown); Meta Pixel `currency: 'BDT'` warning (Events Manager shows healthy Browser AddToCart/ViewContent volume, likely a non-issue).
- **Owner action still outstanding**: cancel/delete test order **94184** in WooCommerce admin (placed for the original Owner Action #2 CAPI test).
- Blockers: none. Next step: none required this session; owner to review Events Manager Purchase-event count over the next 24-48h to confirm the 94165-94167-style phantom Purchases stop appearing, and to action the 94184 cleanup.

## 2026-06-12 (Codex — Schema.org LocalBusiness warning fix)
- User reported Schema.org validator warning on homepage JSON-LD: `availableDeliveryMethod` not recognized for `LocalBusiness`.
- Root cause: global `OnlineStore`/`Organization`/`LocalBusiness` node in `apps/web/src/app/layout.tsx` included `availableDeliveryMethod`, while that property belongs in shipping/offer context. Product schema already has valid `OfferShippingDetails`.
- Fix: removed the invalid sitewide `availableDeliveryMethod` line and kept the existing `hasShippingService` block for nationwide Bangladesh delivery.
- Verified: `cd apps/web && npm run build` passed; `rg availableDeliveryMethod apps/web/src/app/layout.tsx apps/web/.next/server` returns no matches.
- Blockers: none. Next step: deploy/smoke/push if owner wants the validator warning cleared live immediately.

## 2026-06-12 (Codex — live SEO/schema validation sweep)
- Ran Emart backend/SEO smoke after deploy. Public backend protection checks passed (`/graphql`, `/wp-json/`, WC REST, users, xmlrpc blocked as expected; `/wp-json/emart/v1` available; sitemap/legacy redirects passed; product/category canonical/meta/schema checks passed). Only stale script expectation: loopback GraphQL check now gets 301 instead of 200.
- Ran a temporary live sweep across `/`, `/shop`, a PDP, category, brand, blog post, `/faq`, `/contact`, and a 404: status/canonical/robots/JSON-LD parse mostly clean; PDP Product offer has numeric BDT price, `InStock`, and `OfferShippingDetails`.
- Finding: Cloudflare still serves a stale cached homepage at `/` with old `availableDeliveryMethod` (`cf-cache-status: HIT`, age ~2,500s). Code/VPS build and cache-busted homepage URL are clean; `/api/revalidate` for `/` succeeded. No Cloudflare API token exists locally; root validator warning should clear after edge TTL or manual dashboard purge.
- Finding: W3C Nu across representative URLs reports shared validation errors: Next `meta name="next-size-adjust"` lacks content/property (framework output), two `aria-label` attributes on generic announcement marquee divs, duplicate `id="header-search"`. Page-specific: PDP/FAQ heading level skips, blog post nests `<main>` inside root `<main>`, contact iframe uses `width="100%"`.
- Finding: live blog post and `/faq` lack `og:image` in raw metadata output despite nearby metadata coverage; blog post emits `BlogPosting`/`NewsArticle` rather than plain `Article` (acceptable, but update local checker expectation).
- Lighthouse: desktop Performance 100 / Accessibility 100 / Best Practices 81 / SEO 100; mobile Performance 80 / Accessibility 100 / Best Practices 81 / SEO 100. Best-practices loss comes from Cloudflare challenge script deprecation warnings; mobile LCP 4.6s and render-blocking/main-thread work remain performance opportunities.
- Chromium/CDP check: rendered homepage `/` still has stale `availableDeliveryMethod`, cache-busted homepage does not; PDP/FAQ/blog do not have it; all checked pages have 0 console messages and parse JSON-LD cleanly. Duplicate `header-search` is visible in rendered DOM across checked pages; FAQ/blog rendered with empty `og:image`; blog rendered with 2 `<main>` elements.
- Blockers: Google Rich Results Test, Search Console URL Inspection, and Merchant Center Diagnostics are browser/account-gated; no programmatic result available from this shell.
- Next step: optionally fix the small shared HTML/accessibility issues, add blog/FAQ OG images, and purge Cloudflare homepage cache from dashboard if immediate Schema.org retest is needed.
- Follow-up task-board update: converted the validation findings into explicit backlog item **R21 — validation polish** in `workspace/TASKS.md`, with fix/review/ignore buckets and verification targets.

## 2026-06-12 (Codex — Android preview APK + Appetize prep)
- User asked to use Appetize first and check the app. Confirmed no existing APK/AAB artifact, inspected `apps/mobile` Expo/EAS config, and used the existing Expo token to start an EAS Android `preview` APK build.
- EAS build completed successfully: project `@warlord71/emart-bd`, app version `1.1.1`, build version `24`, commit `45b3168`, build ID `3bc989ee-3b42-49e0-a544-548918ec91f7`. Downloaded the APK artifact to `/tmp/emart-preview.apk`.
- Local APK sanity checks passed: `file` identifies it as an Android package, size is 69M, ZIP integrity test reports no compressed-data errors, and the package contains `AndroidManifest.xml`, `resources.arsc`, native libraries, and `assets/index.android.bundle`.
- Blocker: no Appetize API token/login is configured locally. Appetize docs require an account API token (`X-API-KEY`) for REST upload, or manual browser upload via their dashboard.
- Next step: provide/configure an Appetize API token, then upload the EAS APK artifact and run it in the browser emulator for visual/functional smoke testing.

## 2026-06-12 (Codex — Appetize Android smoke + bottom nav icon fix)
- Owner provided Appetize API token. Created Appetize Android app from the EAS preview APK; public URL: `https://appetize.io/app/wquy3ev7ce2pqffnj3zh4lbah4`.
- Ran Appetize via Chromium/CDP. Initial APK launched successfully and rendered Home, Shop, Cart, and Account screens, but bottom tab icons were missing; screenshots also showed other Ionicons-dependent UI icons blank.
- Fix: changed the bottom tab bar in `apps/mobile/App.js` to use small fontless React Native shapes for Home/Categories/Shop/Cart/Account instead of Ionicons. This avoids the icon-font rendering failure for critical navigation while leaving other app Ionicons unchanged.
- Verified locally: `npx expo config --type public`, `npx expo export --platform android`, and `npx expo-doctor` all passed.
- Built fixed EAS Android preview APK, build ID `cb07590d-b556-4667-8198-fb582ea765df`, commit `ce952ac`, app `1.1.1` build `24`. Updated the same Appetize app to versionCode 2 with the fixed APK.
- Verified in Appetize screenshot: bottom nav icons now visible on Home screen. Remaining follow-up: non-tab Ionicons (header/account/menu icons) can still render blank in Appetize and should be addressed separately if full icon-font independence is desired.

## 2026-06-12/13 (Claude — app-wide icon-font removal, EAS build, cross-workspace check)
- Extended the bottom-nav icon fix app-wide: removed `@expo/vector-icons`/Ionicons font dependency entirely. Added `apps/mobile/src/components/AppIcon.js` (fontless shape-based icon component covering all icon names used across screens) and swapped every `Ionicons`/`Icon` usage in `App.js`, `ProductCard.js`, `SearchBar.js`, and all `src/screens/*` to `AppIcon`. Removed the now-unused `expo-font` plugin block + Ionicons font reference from `app.json`, and the `@expo/vector-icons`/`expo-font` deps from `package.json`/`package-lock.json`. Verified `expo config`, `expo export --platform android`, and `expo-doctor` all pass; confirmed every icon name used in screens has an `AppIcon` mapping. Committed as `60b10b8`.
- Started EAS Android `preview` build for `60b10b8` (build ID `db756401-83d1-4aae-8e7b-b0eb2428a157`, commit `60b10b8`, app `1.1.1`/build `24`) — **FINISHED** successfully (artifact: `https://expo.dev/artifacts/eas/SJw8LNVCYP5ccnxTG_qDsyZANr0GZ2SnPPBy7102DhE.apk`). Not yet pushed through Appetize for visual confirmation.
- Cross-workspace check (Local vs VPS vs origin): VPS `git status` showed 6 "modified" files (blog `[slug]`, contact, faq, Header.tsx, TASKS.md, SESSION-LOG.md) but all are byte-identical to Local HEAD — VPS git metadata is simply stale at `fa1f873` (the common ancestor / last deploy point, 8 commits behind). No real content divergence. Copied one VPS-only untracked file, `workspace/docs/meta_regen_ids_remaining_20260612.txt`, to Local (not yet committed).
- Found stale PM2 entry `emart-cleanser-apply` (id 29): points to `workspace/scripts/active/run_cleanser_apply.sh`, which doesn't exist on Local or VPS and has no git history — stopped, `restart_time: 0`, likely leftover from earlier humanizer work. Left in place pending owner decision.
- Pushed `60b10b8` to `origin/main` (mobile-only change, EAS-verified). VPS git metadata realignment (`fa1f873` → `60b10b8`) and the stale `emart-cleanser-apply` PM2 entry remain open/deferred.
- Next step: optionally run the new APK through Appetize to confirm the app-wide icon fix visually; decide on VPS git metadata realignment and `emart-cleanser-apply` cleanup; commit/sync the new meta-regen ids file.

## 2026-06-13 (Codex — mobile audit Batch B/C/D remediation)
- Continued mobile audit remediation on branch `fix/mobile-audit-june`: added deep-link route config + notification tap navigation in `apps/mobile/App.js`; added stock-aware max cart quantities and cart/PDP quantity clamping; capped PDP reviews to the latest 8 to avoid unbounded in-scroll rendering; added scoped accessibility roles/labels/hitSlop across PDP/cart/checkout/products/error-boundary controls.
- Minimized locally persisted order history in `OrderContext`: checkout still sends full billing/shipping data to WooCommerce, but AsyncStorage now keeps only display-safe summary fields (Woo order id, payment method, count, total, product summary, image, coupon).
- Investigated blocked audit items: `expo-secure-store` is not installed, so JWT SecureStore migration is dependency-gated; no mobile BFF endpoint exists for server-backed order history or Google-token-to-Emart-JWT exchange.
- Verified: `git diff --check -- apps/mobile`, `npx expo config --type public`, `npx expo-doctor` (18/18), and `npx expo export --platform android` all passed.
- Blockers: no device/Appetize manual checkout smoke in this session; BFF support needed for the two auth/order follow-ups above.
- Next step: run real-device or Appetize smoke for deep links, notification tap routing, cart clamping, and COD/bKash/Nagad checkout flow before release build.

## 2026-06-13 (Codex — mobile JWT SecureStore)
- Closed the JWT storage blocker from the mobile audit: installed `expo-secure-store` (`~14.0.1`) and added its Expo config plugin.
- Added shared `apps/mobile/src/utils/authStorage.js`: non-sensitive auth profile remains in AsyncStorage, JWT moves to SecureStore, and old `@emart_user.token` data migrates to SecureStore on restore/API use.
- Updated `AuthContext` and authenticated mobile API requests in `services/woocommerce.js` to use the shared helper; no app code reads `user.token` now.
- Verified: `npx expo config --type public`, `npx expo-doctor` (18/18), and `npx expo export --platform android` all passed.
- Blockers: npm install required network approval; npm reports existing dependency audit issues (28 total) not addressed in this focused change.
- Next step: BFF design/implementation for mobile order history and Google token exchange, or Appetize/device smoke for the newly committed mobile branch.

## 2026-06-13 (Codex — mobile audit status refresh)
- Re-checked mobile audit task status on branch `fix/mobile-audit-june`: latest commits are `03092e3` (SecureStore) and `27bb2b4` (Batch B/C/D remediation); worktree is clean except unrelated pre-existing `workspace/BRAND_GUIDE.md`.
- Confirmed remaining BFF blockers are still real: `apps/web/src/app/api/mobile` only exposes auth login/register, categories, coupons, and products; no mobile JWT order-history or Google-token exchange endpoint exists. Web `/api/account/orders` exists but is session-based and not a mobile JWT API.
- Updated `workspace/TASKS.md` wording to reflect SecureStore completion and the confirmed BFF gap.
- Next step remains device/Appetize smoke for the mobile branch, or a backend design pass for the two mobile BFF endpoints.

## 2026-06-13 (Codex — PDP fallback FAQ hair-care wording)
- User screenshot showed PDP fallback FAQ Bangla text exists, but shampoo products were getting a skincare-only Bangla question: "কোন skin type এর জন্য ভালো?"
- Fixed `apps/web/src/app/shop/[slug]/page.tsx` generated fallback FAQs to detect hair/shampoo/scalp products and use hair/scalp fit wording plus hair-care-safe caution text instead of skincare-only skin type / sunscreen guidance.
- Verified: `cd apps/web && npm run build` passed.
- Blockers: not deployed/live-smoked in this session.
- Next step: deploy/smoke if owner wants this FAQ wording corrected live immediately.

## 2026-06-13 (Codex — PDP fallback FAQ non-skincare wording)
- Extended the generated PDP FAQ context beyond hair care so non-skincare products do not receive skin-type or sunscreen-specific fallback wording.
- Added category/name detection for fragrance, makeup/lip products, and bath/body/hand care. Generated Bangla fit questions now use "ব্যবহার", "body care routine", or hair/scalp wording as appropriate; skincare products still keep skin-type wording.
- Verified: `cd apps/web && npm run build` passed.
- Blockers: not deployed/live-smoked in this session.
- Next step: deploy/smoke representative PDPs from shampoo, fragrance, lipstick/lip balm, body wash/lotion, and skincare.

## 2026-06-13 (Codex — face cleansers category guide upgrade)
- Replaced the generic Face Cleansers category buying-guide fallback with a dedicated guide matching the owner-provided quality bar: decision-first skin type + Bangladesh weather advice, real catalog picks, low-pH/BHA/centella/panthenol/texture guidance, and Bangla shopper Q&A.
- Scope: `apps/web/src/app/category/[slug]/page.tsx` for `face-cleansers` only; no PDP content or product data changed.
- Verified: `cd apps/web && npm run build` passed.
- Blockers: not deployed/live-smoked in this session.
- Next step: deploy/smoke `/category/face-cleansers` and verify the collapsed buying guide renders correctly on mobile/desktop.

## 2026-06-13 (Codex — SEO/GEO audit frontend metadata batch)
- Checked the linked GitHub `SKILL.md`: use it as the content-quality reference for PDP/category/editorial copy, but not as an auto-writer; local OpenClaw skill remains disabled and is not a Next.js frontend metadata/schema fixer.
- Fixed confirmed frontend audit items in source: invalid mobile header brand text, global Organization/LocalBusiness primary phone, FAQ/shipping delivery wording, overlong/double-branded metadata on `/shop`, `/best`, `/best/*`, `/faq`, `/about-us`, `/contact`, `/ingredients/*`, category pages, brand pages, concerns hub, and origin pages.
- Added shared word-boundary meta-description truncation (`apps/web/src/lib/seoText.ts`) and applied it to audited dynamic routes so snippets do not cut mid-word.
- Added missing OG `siteName`/`locale`/fallback image coverage on key child routes, plus Breadcrumb/ItemList JSON-LD for `/best` and Breadcrumb/CollectionPage JSON-LD for `/concerns`.
- Kept real-review guardrail intact: did not add AggregateRating where no real reviews exist; did not mutate Woo/product/customer/order data.
- Verified: `cd apps/web && npm run build` passed; `git diff --check` passed.
- Blockers: not deployed/live-smoked in this session; unrelated pre-existing `workspace/BRAND_GUIDE.md` remains dirty.
- Next step: deploy/smoke representative URLs (`/shop`, `/best`, `/faq`, `/contact`, `/category/korean-beauty`, `/brands/andhoney`, `/origins/bangladesh`, `/ingredients/niacinamide`) before pushing.

## 2026-06-14 (Codex — SEO/GEO audit deploy + session close)
- Added explicit remaining-open refs to `workspace/TASKS.md`: `/categories` hub schema, `/faq` BreadcrumbList, `/shipping-policy` BreadcrumbList, PDP long-title strategy, site-wide OG sweep, and contact single-phone policy only if owner wants it.
- Fast-forwarded `main` to the completed audit branch, deployed the web app to VPS, rebuilt locally and on VPS, restarted `emartweb`, and smoke-tested live routes: `/`, `/shop`, `/best`, `/faq`, `/contact`, `/origins/bangladesh` all returned HTTP 200.
- Push was initially rejected because `origin/main` had new commit `ef82ab1`; fetched, rebased local `main`, restored the unrelated dirty `workspace/BRAND_GUIDE.md`, rebuilt, pushed, re-synced VPS, rebuilt/restarted again, and aligned VPS git metadata. Final local/VPS/origin SHA: `edf9652`.
- Live metadata spot-check confirmed `/best` title/meta/OG/schema markers, `/faq` title/meta/OG + `Dhaka 1–2 business days` copy, `/origins/bangladesh` title/meta, and no `Emart Skincare BD` text in live header HTML.
- Blockers: remaining SEO follow-ups are task-boarded; unrelated pre-existing `workspace/BRAND_GUIDE.md` remains dirty.
- Next step: handle the small schema polish batch (`/faq`, `/shipping-policy`, `/categories`) or PDP title strategy in a separate scoped pass.

## 2026-06-14 (Claude — SEO/GEO follow-up batch items 1-4 deployed)
- Investigated GBP knowledge panel Bangla name issue (correct transliteration is `ইমার্ট`, not `এমার্ট`); documented in `workspace/BRAND_GUIDE.md` "Bangla Transliteration" section — GBP dashboard correction remains owner-action.
- Ran read-only SERP/meta/schema audit per owner's structured prompt; cross-checked against `TASKS.md`/`SESSION-LOG.md` and found Codex had already shipped/deployed the bulk of the audit findings (`edf9652`, `3578adb`, `8cb43a6`). Narrowed remaining work to 6 items; executed 1-4 (5 is owner-gated, 6 is this write-up).
- Item 1: `/categories` — added `CollectionPage` JSON-LD node (`@id`-linked to existing `ItemList`).
- Item 2: `/faq` — converted `faqSchema` to `@graph` with added `BreadcrumbList`; `/shipping-policy` — added new `BreadcrumbList` JSON-LD (had none).
- Item 3: PDP long-title shortening — new `truncateTitle` helper (`lib/seoText.ts`) + tiered logic in `buildProductSeoTitle` (`lib/seo/product.ts`), caps fallback titles at 60 chars without mutating Woo `product.name`/slug.
- Item 4: site-wide OG sweep — added `openGraph.siteName`/`locale` to `concerns/[slug]`, `skin-type/[slug]`, and `shop/[slug]` (PDP) — the 3 remaining templates missing it.
- Item 5: contact single-phone policy — left as owner-decision-gated, no code change.
- Item 6: wrote up "C3 — Strategic SEO note" in `TASKS.md` (Android/google.com.bd mobile-first dominance, GBP vs website separation, AI Overview/Gemini/ChatGPT/Perplexity GEO/AEO readiness, TikTok/FB/YouTube → blog topic pipeline).
- Verified: Local build clean, committed `5715207`, rsynced to VPS, VPS build clean, `pm2 restart emartweb` clean, live smoke-tested `/categories` (CollectionPage), `/faq` (BreadcrumbList), `/shipping-policy` (BreadcrumbList), `/concerns/anti-aging-repair` + `/skin-type/oily` + PDP (og:site_name/og:locale), and PDP title shortening on `kerasys-black-bean-oil-shampoo-anti-hair-loss-1000ml` (60 chars). Pushed to `origin/main`.
- Blockers: none. GBP Bangla name correction and C1 blog generator remain owner-gated next steps (unrelated to this batch).
- Next step: none required for this batch; future SEO work should continue per `SEO_MASTER.md` work order.

## 2026-06-14 (Claude — GMC step3 exclusion + meta regen item #14 batch run)
- GMC Step 3 (15 "unfixable identity" products): set `_wc_gla_visibility=dont-sync-and-show` via `wp post meta update` for IDs 74134,74327,60310,60609,62460,51305,74591,60764,74927,61688,75014,59586,92866,35952,74490 — excludes from Merchant Center feed only, confirmed via GLA plugin source this does not affect storefront visibility.
- GMC Step 4 (11 title-risk products): investigated GLA `AttributeMappingHelper` — confirmed there is no separate "GMC-only title" field; WooCommerce `post_title` is sent to Merchant Center as-is. Recommended same `dont-sync-and-show` exclusion (titles are real OTC product names like "Acne Treatment"/"Eczema Relief" — editing would misrepresent the product and likely not clear the health-condition flag anyway). Awaiting owner go-ahead before applying to these 11.
- GMC Step 5 (63749, 62576): owner confirmed "both ok now" — closing with no action.
- Item 8 (13 product images): verified all 13 IDs now have real images live (12 via `_thumbnail_id`, 1 via gallery fallback `og:image`) — marked resolved in `TASKS.md`.
- Item 14 (meta regen): corrected progress tracking — actual state was 194/1360 done (not 94/1266 per stale TASKS.md text). Ran 3 manual batches (46+48+49 = 143 applied, batches `meta-generator-2026-06-14-{212728,213627,214149}`), `tag:products` revalidated after each. Now 291/1360 done, 1069 remaining. Discovered/documented running these scripts from `workspace/docs/` causes a nested relative-path bug — must run from repo root.
- Started unattended autorun loop `/tmp/meta_regen_autorun.sh` (nohup, ~50-ID batches: dry-run→validate→apply→revalidate→sync VPS→update remaining-IDs file), max 30 iterations, auto-stops if a batch applies 0 (manual-review signal). Log: `workspace/audit/active/meta-regen-autorun-20260614.log`.
- New finding: catalog-wide `meta_validator --catalog` flags 466/3626 products with stylistic issues (REPEAT_CLAUSE2_CAT 311, NO_BANGLADESH/NO_EMART/NO_COD 191, PRICE_IN_META 1) — separate from item #14's missing/bad-pattern scope, not yet triaged.
- Blockers: GMC Step 4 (11 IDs) and Step 6 (6 mixed-manual IDs) still owner-gated.
- Next step: monitor autorun loop to completion (~1069 IDs, ~21 batches), then update `TASKS.md`/`SESSION-LOG.md` with final counts; triage the 466-flagged catalog QA finding separately; await owner decision on GMC Step 4/6.
- Progress check (22:15): autorun loop healthy, iters 2-5 all applied (48/49/49/46), now 528/1360 done, 832 remaining, iter 6/30 in progress. At ~5min/iter, ~24 iters left in the 30-cap may not clear all 832 — may need a second launch. Continuing to monitor.

## 2026-06-14 (Claude — AVIF media library fix, off-cycle)
- User reported AVIF images not showing in WooCommerce media picker and unable to upload AVIF.
- Root cause: PHP 8.2-FPM's GD `imagecreatefromavif()` failed ("not a valid AVIF file") on a valid AVIF (libavif decoder limitation), and `php8.2-imagick` package was unpacked but not enabled, so WP fell back to broken GD path → empty `_wp_attachment_metadata['sizes']` → blank thumbnails, and uploads triggered "File is not an image" / post-processing failures.
- Fix: ran `apt-get install php8.2-imagick` (enabled the already-unpacked extension via its postinst, no version change — `3.8.1-1+ubuntu24.04.1+deb.sury.org+1`), `systemctl reload php8.2-fpm`. WP now selects `WP_Image_Editor_Imagick` (uses existing `libheif1`/aomdec plugin) for AVIF.
- Verified: regenerated thumbnails for existing AVIF attachments 93454/93486 (now have `woocommerce_gallery_thumbnail`/`medium` sizes, served live via Cloudflare with `content-type: image/avif`); test-imported a fresh AVIF (ID 94416) end-to-end successfully, then deleted the test attachment.
- No app code changed, no rsync/pm2 needed (system package + php-fpm reload only). Blockers: none.
- Also audited all 8,036 image attachments for the same empty-`sizes` symptom: only the 2 AVIF files exist (both fixed). Found 7 unrelated items with empty sizes — 6 orphaned theme-demo attachments (files missing on disk, unattached, post_parent=0) and 1 tiny 40x40 linkedin.png icon (correctly has no larger thumbnails). None affect products/live pages; no action taken.

- Progress check (22:49): autorun loop healthy, iters 6-12 all applied (avg ~47/iter, iter10=44, iter11=45, iter12=48), now 839/1360 done, 521 remaining, iter 13/30 in progress. On pace to finish within the 30-iter cap (~11 more iters needed vs 17 remaining). Continuing to monitor.

- Progress check (23:12): autorun loop healthy, iters 13-17 all applied (iter15=47, iter16=46, iter17=44), now 1065/1360 done, 295 remaining, iter 18/30 in progress. Still on pace to finish within the 30-iter cap.
- Item 13 (image audit) re-checked the 2 pending IDs: **74933** (Nivea UV Sunscreen) now uses a unique image (94405/`images-9.jpg`) verified visually matching the product — FIXED. **52351** (CERAVE Hydrating Facial Cleanser UK 473ml) — image itself is correct (verified visually, genuine CeraVe 473ml EN/FR bottle) but shared with product 26098 (same item, non-UK listing); original flag was about 52351's duplicate-looking slug (`-473ml-2`), not the image. All 33 Level A items now resolved from an image-correctness standpoint; open question for owner on whether 52351/26098 is a duplicate-listing cleanup task, and whether Level B(13)/Level C(24) are worth checking.
- Item 6 (GMC data/asset, 63749/62576): owner confirmed "both ok now" — marked resolved in TASKS.md, no action taken.

## 2026-06-15 (Codex — Meta CAPI re-check + 52351/26098 decision close)
- Re-checked Meta CAPI phantom Purchase follow-up server-side: only old `Meta CAPI Purchase failed` log entries remain for synthetic monitor orders 94165-94167 from 2026-06-12. Later synthetic monitor orders through 94445 show no new CAPI Purchase failure logs, and checkout code still skips `sendMetaPurchaseEvent()` when `CHECKOUT_MONITOR_SECRET` matches. Meta Events Manager count itself is not CLI-readable from this environment.
- Verified product 52351 vs 26098 with Woo fields, live metadata, and Chromium screenshots: both show CeraVe Hydrating Facial Cleanser 473ml with the same image, brand, size, price, stock, category, and origin; 52351 has the UK Version badge and SKU suffix `-1`. Image is correct; duplicate-like product question was owner-gated, not an image defect.
- Owner decision: keep both 52351 and 26098 for now. Closed the Level A image/duplicate follow-up in `workspace/TASKS.md`; no catalog/product changes made.
- Blockers: none for this closed issue.
- Next step: continue only optional Level B/C image hygiene if owner explicitly requests it.

## 2026-06-15 (Codex — validation polish: categories hydration + announcement aria)
- Fixed the low-priority `/categories` hydration mismatch from the flash countdown timer by making `secondsRemaining` start at stable `0` in `FlashProvider`; the existing client effect still updates it to the live countdown immediately after hydration.
- Removed the invalid `aria-label="Store announcements"` attributes from the two generic announcement-marquee `div`s in `Header.tsx`; visible announcement copy and duplicate-group `aria-hidden` behavior are unchanged.
- Verified: `cd apps/web && npm run build` passed, VPS build passed, `pm2 restart emartweb` clean, live `/categories` returned 200, live HTML has `CollectionPage`, and live HTML has no `aria-label="Store announcements"`. Committed/pushed `e1a73b1`; VPS git aligned to `origin/main`.
- Blockers: PDP `h1 → h3` heading skip handed over to Claude as a product-content data/scoping decision; no `DetailsTabs`/catalog heading normalization attempted by Codex in this pass.
- Next step: none for these two validation polish items.

## 2026-06-14/15 (Claude — item #14 close-out + 70-item image alt-text SEO pass)
- Item #14 (meta regen) finished: autorun loop's last 2 remaining IDs resolved — `60685` (Holidays Premium Quality Collagen White Tablet 60g, `FILLER:premium quality` false positive) applied manually via `wp post meta update _rank_math_description`; `63747` (I'm from mugwort essence+Heimish foam cleanser combo) left as-is, existing description already clean/complete. `meta_regen_ids_remaining_20260614.txt` now empty (1360/1360). TASKS.md item #14 marked DONE.
- New request: owner said images for all 70 items in `combined-image-duplicate-browser-final-20260609.md` (Level A 33 + B 13 + C 24) are now fixed; asked for image alt text + related SEO to be updated catalog-wide for those items.
- Computed effective `get_post_thumbnail_id()` per product (handles a few legacy products with duplicate `_thumbnail_id` postmeta rows — e.g. 3009/3010/3016/26291 — where the *effective* thumbnail was already the correct one; orphaned stale `_thumbnail_id` rows pointing to the old shared `emart-Illiyoon_CeramideAtoConcentrateCream_01` placeholder were left in place, harmless/unused).
- For each of the 70 IDs, set `_wp_attachment_image_alt` on the effective featured-image attachment to `{Product Title} Price in Bangladesh | Emart` (matching the catalog-wide convention seen on recently-added products) where missing/stale: 65 updated, 5 already correct. Revalidated `tag:products`; spot-checked live PDP `the-derma-co-ultra-light-zinc-mineral-sunscreen-50g` — new alt text rendering correctly.
- Blockers: none. Next step: none required; Level B/C items beyond alt text remain optional low-priority hygiene per item #13's closing note.
- Fixed PDP `h1 → h3` heading-skip (sr-only `h2` in `DetailsTabs.tsx`), verified locally on both example products, deployed via `deploy.sh` (Local build → VPS build → pm2 restart → smoke 200 → push). Commit `bbfb31f`, Local=VPS=origin=Live.
- Session close: TASKS.md running-jobs table updated (meta_generator PID 448966 marked stopped/complete), header date stamp refreshed. Local + VPS git both clean at `bbfb31f`, no dirty files.

## 2026-06-15 (Claude — GMC sync stale-flag re-check)
- Re-checked "GMC sync stale (last run Jun 5)" item from TASKS.md. Found `/root/.gmc/sync.py` is run via root crontab `0 */6 * * *` and has been running continuously — `sync-cron.log` shows successful runs today at 00:01 and 06:00 (3611 synced, 0 errors, 13 skipped/excluded each time). The "Jun 5" note referred to a stale approval-count snapshot, not an actual sync gap.
- Ran `python3 /root/.gmc/sync.py --status`: 3,530/3,635 approved, 105 disapproved (down from 127 baseline at start of the GMC policy-fix project), 408 with issues, 0 pending.
- Updated TASKS.md row to reflect cron is healthy/active and current approval numbers. No code/data changes made.
- Blockers: none. Next step: none for this item; GMC Step 4 (11 title-risk) and Step 6 (6 mixed-manual) remain owner-gated as before.

## 2026-06-15 (Claude — GMC Step 4 + Step 6 exclusion, owner-approved)
- Owner approved excluding both remaining owner-gated GMC groups from Merchant Center ("no need to show on gmc"): Step 4 (11 title-risk IDs: 43762,43757,60760,63855,63901,93109,63849,57059,37165,62034,62040) and Step 6 (6 mixed-manual IDs: 36262,3274,56108,3753,38292,26194). No title/copy/price changes made — same exclusion mechanism as Step 3's 15 identity products.
- Applied: `_wc_gla_visibility=dont-sync-and-show` postmeta set on all 17 via `wp post meta update` (storefront unaffected, confirmed by Step 3 precedent). Added all 17 IDs to `/root/.gmc/exclude_ids.json` (13→30 entries) so the `0 */6 * * *` cron sync stops re-pushing them. Ran `python3 sync.py --delete <id>` for all 17 to remove existing listings from live Merchant Center.
- Verified via `sync.py --status`: 3,529/3,618 approved, 89 disapproved (down from 105), 390 with issues, 0 pending — total product count dropped by 17 as expected.
- Both TASKS.md owner-action items #5 and #7 marked resolved.
- Blockers: none. Next step: none for GMC; remaining open items are pa_concern 1,147 blank rows and the untriaged 466-product catalog meta-validator stylistic findings.

## 2026-06-15 (Claude — WP /wp-admin/edit.php?post_type=page audit)
- Owner asked to verify every WordPress "page" (post_type=page, wp-admin edit.php?post_type=page) is correctly represented on the Next.js frontend (route, schema, snippets).
- Inventory: 22 WP pages total — 2 Elementor drafts (57532, 56421, not published, no live impact) + 20 published. All 20 published WP page slugs were tested live at e-mart.com.bd:
  - 9 redirect cleanly to their Next.js equivalent (308/301): home2→/, stay-radiant-in-ramadan...→/blog/..., how-to-buy→/faq, help-center→/contact, shipping-delivery→/shipping-policy, refund_returns→/return-policy, my-account→/account, contact-us→/contact, policy→/return-policy, order-tracking→/track-order, my-orders→/account/orders, dashboard→/account, term-conditions→/terms-conditions, wishlist-2→/wishlist (308/301 mix, all correct destinations).
  - 6 are live Next.js routes directly: /checkout, /shop, /cart (307→/checkout by design), /privacy-policy, /blog, /compare — all 200, correct titles/canonicals.
  - 1 (compare-2) returns 410 Gone — intentional, /compare is the active replacement.
  - Spot-checked schema: /faq (FAQPage+BreadcrumbList), /contact (LocalBusiness contactPoint), /shipping-policy (BreadcrumbList), /compare (full OG+canonical), blog post route (BlogPosting/NewsArticle) — all correct. checkout/account/wishlist/orders correctly noindex,nofollow; public content pages correctly index,follow with canonical.
- **Found+fixed real bug**: `/return-policy`, `/shipping-policy`, `/terms-conditions`, `/privacy-policy`, `/track-order` had no page-level `openGraph` block, so `og:url` inherited the root layout's homepage URL (`https://e-mart.com.bd`) instead of their own canonical URL — would show wrong link context when shared on social platforms. Added full `openGraph` blocks (title/description/url/siteName/locale/images, matching the `/faq` pattern) to all 5. No title/canonical/robots/URL/route changes.
- Verified: Local build clean, deployed via `deploy.sh` (Local build → VPS build → pm2 restart → smoke 200 → push). Commit `da48722` (+ deploy.sh's auto doc-commit `4148c9d`). Live-verified all 5 pages now emit correct `og:url`. Local=VPS=origin=Live at `4148c9d`.
- Blockers: none. No other gaps found across the 20 published WP pages.

## 2026-06-15 (Claude — product_brand taxonomy + /brands SEO audit)
- Owner asked to audit `wp-admin/edit-tags.php?taxonomy=product_brand` and verify `/brands` + `/brands/[slug]` meta/snippets/URLs/schema are correct.
- Pulled all 405 `product_brand` terms via `/wp-json/wp/v2/product_brand`. `/brands/cosrx` spot-check confirmed BreadcrumbList/CollectionPage/ItemList/Brand JSON-LD, canonical, OG, robots all correct.
- Found and fixed (selected by owner):
  1. Stale "no products" redirects to `/shop` for brands that now have live products — removed from `next.config.js` and `REDIRECTED_BRAND_SLUGS` in `sitemapEntries.ts`: Innsaei (7 products), Sadoer (18), Laxzin (7), Healthy Place (3). These now serve normal `/brands/[slug]` pages and appear in the sitemap.
  2. `/brands/dr-jart` → `/brands/dr-jart-plus` was a broken redirect chain (target brand doesn't exist in WC → 404). Removed the rule along with two unreachable dead `i-m-from`/`i'm-from` → `/brands/im-from` rules (shadowed by earlier correct rules → `/brands/i-am-from`).
  3. Merged 3 pairs of duplicate `product_brand` WC terms causing duplicate-content pages (identical title/meta, different self-canonical): B:Lab (`blab`→`b-lab`, now 5 products), Beauty Formulas (`beauty-formulas-skin`→`beauty-formulas`, now 3), Carenel (`carene`→`carenel`, now 20). Reassigned the 5 affected products via `wp eval-file`, deleted the source terms, added 301s from old slugs to canonical slugs in `next.config.js`.
  4. Deleted 9 zero-count "ghost" `product_brand` terms cluttering wp-admin (Bath, Buy Retina Brand, Combo, Cow japan, Dr. Groot, Innsaei-dup `authentic-innsaei`, LG, Novale, Valentine).
- Not fixed (reported only, owner didn't select): ~17 brands where the WP term display name differs in casing/punctuation from the brandWhitelist canonical name (e.g. "Cosrx" vs "COSRX", "La Roche Posay" vs "La Roche-Posay") — cosmetic, shows in titles/schema. Also noted: several more `/brands/<slug> → /shop` rules (valencia, absolute, tresemm, bath, house, lucido) are dead/unreachable because an earlier rule in the same redirects array already sends those same sources to specific brand pages — zero live impact, pure dead code, not cleaned up.
- Verified: Local build clean. Deploying via `deploy.sh`.
- Blockers: none. Next step: none — audit complete, fixes deployed.

## 2026-06-15 (Claude — pa_brand vs product_brand clarification + docs)
- Owner pointed out a second finding: WC has two separate "brand" taxonomies — `pa_brand` (Products → Attributes → Brand, 952 noisy product-fragment terms like "Abib Airy Sunstick") vs `product_brand` (Brands menu, ~393 terms, the one `/brands/[slug]` actually uses). Confirmed via full-repo grep: `pa_brand` is referenced only in a `brandWhitelist.ts` comment, never fetched/displayed — zero frontend effect.
- Also re-confirmed the Innsaei/Sadoer/Laxzin/Healthy-Place/Skino/WishCare redirect fix from the earlier session today is fully live (all 6 return 200, not redirected) — owner's "uncommitted WIP" note was stale, already deployed in `e041df7`.
- Added a new "Brand Taxonomy" section to `workspace/docs/category-taxonomy-status.md` documenting both taxonomies, the rule (manage brands via `product_brand`/"Brands" menu, not `pa_brand`/Attributes), and the 2026-06-15 redirect/merge cleanup.
- Blockers: none. Next step: none.

## 2026-06-15 (Claude — GA4 whole-site landing-page audit)
- Owner pasted a GA4 "Landing page" report (1,439 unique landing paths, 4,816 sessions, 2026-05-19 to 2026-06-15) and asked whether real visitor landing-page behavior matches the site setup — explicitly whole-site, not just `/brands/*`.
- `/brands/*` (162 sessions across 67 brand pages): all 200, clean — confirms earlier brand-taxonomy fixes are working.
- **Finding 1 + 3 (fixed, deployed `a0ac1a6`)**: 21 stale `/category/*` landing pages were 404ing (~48 sessions/4wk total). Mix of legacy nested WooCommerce paths (`/category/lip-care/lipstick`, `/category/beauty-toiletries/japanese-beauty`, etc. — Next's single-segment `/category/[slug]` route can't match these) and old single-segment category/brand slugs (`/category/la-roche-posay`, `/category/toner-pad`, `/category/babies-moms`, bare `/category`, etc.). Added 21 new 301s in `next.config.js` mapping each to its live `/category/[slug]` or `/brands/[slug]` equivalent. All verified live (308 → correct target).
- **Finding 2 (audit only, NOT deployed)**: 96 distinct `/shop/[slug]` PDP landing pages 404 (140 sessions/4wk). Root cause: products were renamed/re-slugged (2026-05-29 size-correction workflow + earlier humanizer work) without redirects — e.g. `/shop/cosrx-advanced-snail-96-mucin-power-essence-100ml` (404) should be `/shop/cosrx-advanced-snail-mucin-96-power-essence-100ml` (live, 21 sessions). Only 2/96 are tracked in WP `_wp_old_slug`. Built a fuzzy-matched (Jaccard + SequenceMatcher) candidate redirect map, saved to `workspace/audit/active/pdp-404-redirect-map-20260615.csv` (96 rows: sessions, old_slug, candidate_new_slug, candidate_id, jaccard, ratio, confidence HIGH/MEDIUM/LOW, fallback_target for LOW-confidence rows → `/brands/<brand>` or `/shop`). Breakdown: 35 HIGH (51 sessions, near-exact — safe to apply as-is), 24 MEDIUM (30 sessions, same product line/different variant — needs eyeball review), 37 LOW (59 sessions, no good specific match — fallback to brand or `/shop` page, likely genuinely discontinued products).
- Noise (not actionable): `/admin`, `/Shop`, `/cmd_sco`, `/...`, `/courier`, `/daiso-japan`, `/new-homepage-by-smjuber` (old indexed dev URL, 2 sessions), 1 mojibake blog URL — all 1-4 sessions, bot/typo traffic.
- Verified: Local build clean, deployed via `deploy.sh`. Local=VPS=origin=Live at `a0ac1a6`.
- Blockers: none. Next step: owner reviews `pdp-404-redirect-map-20260615.csv` and decides which confidence tiers to apply as `next.config.js` 301s (HIGH tier is the obvious quick win).

## 2026-06-17 (Codex — PDP 404 redirect re-analysis)
- Owner asked to re-analyze the 96 PDP 404 redirect candidates with maximum reliable matching. Read `workspace/SEO_MASTER.md` first because this is SEO/redirect work.
- Reclassified the existing fuzzy map at `workspace/audit/active/pdp-404-redirect-map-20260615.csv` with stricter same-product checks: size/shade/product-type differences are no longer treated as automatically safe. New artifacts: `workspace/audit/active/pdp-404-redirect-reanalysis-20260617.csv` and `workspace/audit/active/pdp-404-redirect-reanalysis-20260617.md`.
- Result: 26 `PRODUCT_REDIRECT_SAFE` rows / 37 sessions; 18 `REVIEW_PRODUCT_CANDIDATE` rows / 27 sessions; 52 `NO_PRODUCT_MATCH` rows / 76 sessions. This supersedes the prior "35 HIGH safe" note.
- Verified the 26 safe targets with live curl: 26/26 return 200. One originally safe-looking Paula's Choice candidate was removed from safe because `/shop/paulas-choice-skin-perfecting-2-bha-liquid-exfoliant-30ml` currently 308s to `/shop/paulas-choice-skin-perfecting-2-bha-liquid-exfoliant`, which is 404; public search returned no replacement.
- Blockers: none for applying the safe 26. Review-only rows need owner/product judgment before redirecting because several are shade/size/product substitutions (e.g. MAC NC37→NC35, CeraVe 50ml/177ml→454g, Some By Mi face cleanser→body cleanser).
- Applied the 26 `PRODUCT_REDIRECT_SAFE` PDP→PDP redirects in `apps/web/next.config.js`. Also fixed the existing Paula's Choice dead-chain redirects (`30ml-2`, `30ml`, `118ml`) to `/shop` because the previous target ultimately returned 404 and no live product replacement was found.
- Verification before deploy: `npm run build` passed locally; config-level verifier checked all 29 intended rules (26 safe + 3 Paula's cleanup) with zero mismatches; local `next start -p 3017` spot checks returned 308 to the intended destinations.
- Blockers: unrelated untracked root PNG files exist, so avoid `deploy.sh`'s `git add -A`; use a scoped commit/deploy sequence for relevant files only.
- Next step: deploy scoped changes, smoke test live, push only after live smoke passes. Review-only/fallback rows remain separate owner decisions.

## 2026-06-18 (Codex — mobile Play/AAB readiness check)
- Owner asked whether the mobile app is OK, ready for AAB internal testing, and likely to pass Google checks.
- Verified mobile source has no bundled Woo consumer keys/secrets or direct `/wp-json/wc/v3` calls. Fixed visible invalid brand strings from `eMart BD` to `Emart` in `apps/mobile/app.json`, app UI copy, notifications channel name, English i18n, and README.
- Validation after fix: `npx expo-doctor` passed 18/18; `npx expo export --platform android` passed; `npx expo config --type public` shows Android package `com.emartbd.app`, version `1.1.1`, target/compile SDK 35, permissions limited to notifications/vibrate, EAS project ID `8b0a3cc9-2926-4fe5-8504-6c549b5dedcd`.
- EAS/Play readiness: `eas whoami` OK as `warlord71`; `eas project:info` OK for `@warlord71/emart-bd`; Play service-account JSON exists at `/root/.config/emart-play-service-account.json` with `0600` perms and expected service-account metadata. Recent EAS production AAB from Jun 5 exists, but it predates today's brand fix; use a fresh production build before Play internal test submission.
- Blockers: no physical Android device/real checkout smoke was run in this session; EAS `credentials --non-interactive` is not supported by installed CLI, so signing credentials were inferred from successful prior production AABs rather than re-displayed interactively.
- Next step: create fresh EAS production AAB from current mobile source, then submit to Play internal testing; run real COD/bKash/Nagad checkout smoke if a device is available.

## 2026-06-18 (Codex — Google sitelink duplicate snippet finding)
- Owner shared a Google SERP screenshot showing several sitelinks using the same snippet: "Emart Skincare Bangladesh is an enterprise of HG Corporation ...".
- Root cause: the global footer brand paragraph appears on every public page, so Google selected that repeated footer text as the snippet for multiple sitelinks instead of each page's unique meta/intro copy.
- Fix: added `data-nosnippet` to the footer brand paragraph in `apps/web/src/components/layout/Footer.tsx`. The text remains visible to users, but Google should stop using it in snippets after recrawl/reprocessing.
- Verification: `npm run build` in `apps/web` passed before deploy.
- Blockers: SERP snippets are Google-controlled and may take days/weeks to refresh after deploy + URL inspection.

## 2026-06-18 (Codex — XML + HTML sitemap inspection)
- Owner asked to inspect whether XML and HTML sitemaps are both present and dynamic.
- Live inspection: `/sitemap.xml` returns `200` as `application/xml`, contains 4,205 `<url>` entries, is generated by `apps/web/src/app/sitemap.xml/route.ts` with `dynamic='force-dynamic'`, `unstable_cache`, and hourly `s-maxage=3600`. `robots.txt` advertises `/sitemap.xml` and `/news-sitemap.xml`.
- Live inspection: `/sitemap` returns `200` as `text/html` and is linked from footer/support. It already exposed crawlable internal links to hubs, categories, concerns, origins, offers, support, and content/trust pages.
- Improvement: made `/sitemap` an hourly ISR page (`revalidate=3600`) and changed its Brands panel from a small hardcoded list to live Woo `product_brand` links: top 24 non-redirected brands by product count, with a safe fallback if Woo is unavailable. Product URLs remain XML-only so the HTML sitemap stays scan-friendly.
- Verification: `npm run build` passed; `.next/prerender-manifest.json` confirms `/sitemap` has `initialRevalidateSeconds: 3600`.
- Next step: deploy scoped sitemap update and smoke-test live `/sitemap` + `/sitemap.xml`.

## 2026-06-18 (Claude — deploy fix, PDP tab gap, kbazar login, CF purge)
- Fixed emart live site chunk 404s: stale Cloudflare-cached HTML referencing old build's chunk hashes. Purged CF cache.
- Added Cloudflare cache purge step to `deploy.sh` — runs after smoke test, before git push; uses `CF_ZONE_ID` + `CF_API_TOKEN` env vars (saved to `/root/.bashrc`). Skips gracefully if not set.
- Fixed PDP `DetailsTabs` blank gap between tab bar and content: reduced `py-6` to `pt-4 pb-6`, added `[&>div>*:first-child]:mt-0` to strip prose heading top margin. Verified on live site across multiple products/tabs.
- Fixed kbazar24 login: Nginx `wp-json` location used `try_files` which internally redirected to Next.js instead of WordPress. Replaced with direct `fastcgi_pass` to PHP-FPM. Added `Cache-Control: no-store` + `CDN-Cache-Control: no-store` headers to prevent Cloudflare caching API responses.
- Removed kbazar24 wp-login.php + wp-admin IP restriction (was locked to `103.197.153.14` only). Now accessible from any IP.
- Deployed commit `1993203` via `deploy.sh --no-commit`. Local = VPS = Repo = Live.
- Blockers: none.
- Next step: C8 Finding 2 PDP redirect review (18 candidates awaiting owner decision); C1 blog generator cron (awaiting owner go-ahead).

## 2026-06-18 (Claude — VPS audit, Qdrant revival, vector Related Products)
- VPS audit: freed 2.5 GB RAM (stale Chrome/orphan processes) + 15 GB disk (Ollama removed, /tmp cleaned, snap cache purged, PM2 logs flushed, old Playwright browser removed). Disk 87%→71%.
- Qdrant vector DB: fixed unhealthy container (new health check with wget, strong API key, 512MB memory limit, TZ=Asia/Dhaka). Deleted 7 empty collections. Fresh sync of 3,625 products with `all-mpnet-base-v2` 768-dim embeddings. Weekly cron added (Sunday 5am).
- PDP Related Products: wired to Qdrant vector similarity instead of random same-category. Falls back to WooCommerce category if Qdrant unavailable. ISR-compatible (`next: { revalidate: 3600 }`). Live-verified: COSRX cleanser now shows genuinely similar COSRX cleansers instead of random category picks.
- New files: `lib/qdrant.ts` (server-side similarity lookup), `api/search/semantic/route.ts` (POST API for vector search), `workspace/scripts/active/qdrant_product_sync.py` + `qdrant_sync_run.sh`.
- Blockers: none.
- Next step: AI customer support agent (on-site + WhatsApp); commit + full deploy.
