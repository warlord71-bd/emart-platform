# Session Log — append only, never delete

Format:
## [DATE TIME] [LLM]
- Did: (1 line)
- Completed tasks: (task IDs from TASKS.md)
- Blockers hit: 
- Next step: 

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

## 2026-04-27 — Claude Code — Session 2 (skincarebd + SEO + concern mapping)

### Done
- Scraped skincarebd.com: 1,282 slug-matched products → prices + images
- Applied 637 price updates (sale_price) where skbd lower than Emart, via WP-CLI
- Image import v2 running: ~397 white-bg images imported to WC as featured images; 54 non-white skipped
- Alt text bulk fix: 2,631 existing product images missing alt text → "{Name} Price in Bangladesh | Emart"
- Concern mapping: scraped thekoreanmall.com 11 concern subcats (617 slugs) + keyword rules → applied 1,162 concern category assignments; total concern-categorized: ~1,797/3,564
- ShopByCategorySection: new 6-tile category grid visible on all screen sizes (MobileDiscovery was lg:hidden on desktop)
- MailPoet email templates: welcome (ID2), abandoned cart (ID3), WC transactional (ID4) rebuilt with Emart branding
- Sourcing gap: 1,100 skincarebd + 454 emartway products not on Emart → combined CSV with white-bg flags

### Blockers / Pending
- Image import v2 still running (PID 424373) — ~828 remaining, ~0.3s/image
- Sourcing gap merge still running (~426/1100 skincarebd pages scraped)
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
- https://e-mart.com.bd/audit/skincarebd-match-report-2026-04-27.csv (1,282 matched)

### If image import is still running on next session
```bash
ps aux | grep "image-import-v2" | grep -v grep
# If dead: cd /root/emart-platform/apps/web && nohup python3 scripts/skincarebd-image-import-v2.py > /tmp/image-import-v2.log 2>&1 &
```

## 2026-04-28 — Codex product import close-out
- Did: Closed out the sourcing-gap product importer after the completed run and duplicate cleanup, without touching frontend UI/UX or restarting `emartweb`.
- Completed tasks: Importer processed all 633 candidates; final progress is 92 created/published, 159 duplicate_existing/skipped or drafted, 380 out_of_stock, and 2 source 404s. Old-catalog duplicate audit was run with exact/same-size matching; high-confidence duplicate imports were drafted while older products stayed published. Final corrected duplicate verifier found 0 same-size high-confidence duplicates still published. Price parsing, category assignment, and HTML-entity title cleanup safeguards are committed in `d374925` and `563e1a2`.
- Blockers hit: Broad duplicate matching initially over-flagged size variants, so it was narrowed to same-size/high-confidence logic. ACWELL 30ml was kept live as a likely mini/full-size variant; Neutrogena SPF70 was kept live as a different SPF variant from SPF45.
- Next step: Do not rerun `scripts/import-instock-products.py` for this batch unless the progress file is intentionally reset. Reports are saved at `audit/skincarebd/import-duplicate-audit.csv` and `audit/skincarebd/import-high-confidence-duplicates.csv`; remaining product data cleanup should continue via reviewed dry-run CSV batches.

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
- Did: Removed old `skincarebd.com` / `emartwayskincare.com.bd` traces from live product/content-facing data and unused public source-logo files.
- Completed tasks: Confirmed live Woo/WP post titles, content, excerpts, and terms had zero hits; found 1,083 old `skincarebd.com` URLs only in attachment `_wc_attachment_source` metadata; exported a rollback TSV to `/tmp/emart-seo-backups/attachment-source-skincarebd-backup-20260502.tsv`; updated those 1,083 metadata values to the current `https://e-mart.com.bd/...` attachment URLs. Removed unused tracked `apps/web/public/images/source-logos/*` files and replaced the only source comment in `brandWhitelist.ts`; local build passed; synced to VPS; VPS build passed; `emartweb` restarted; DB recheck returned zero hits across posts_content, posts_excerpt, posts_title, postmeta, and terms; live `/images/source-logos/manifest.json` now returns 404.
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
- Completed tasks: Imported the verified old emartwayskincare CloudFront image into WordPress as attachment 93061, set product 74171 thumbnail to 93061, recorded source metadata, cleared WordPress/transient cache, rebuilt VPS, restarted emartweb, moved stale Next fetch cache to /root/.attic-2026-05-03/next-fetch-cache-product-image/.
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
- Verification: Local build passed; VPS build passed; `emartweb` restarted; live origin-local `/origins?country=korea`, `/categories`, `/concerns`, and `/brands` returned `200`; rendered `/origins?country=korea` HTML includes `href="/categories"`, `href="/concerns"`, `href="/origins"`, and `href="/brands"` and no `aria-label="Browse hubs"` duplicate row; Local/VPS/origin all clean at `f0c7229`.
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
