# 2026-05-01 VPS Reconciliation State

Local `/root/emart-platform` and `origin/main` are clean at `61ca7be`.

VPS `/var/www/emart-platform` reports git HEAD `95e24f1` and a dirty tree because later Local/Git work was copied into the runtime tree while VPS git metadata stayed old. Do not interpret the old VPS HEAD as meaning the header/category work is missing.

Verified matching between Local and VPS source:
- `apps/web/src/components/layout/Header.tsx`
- `apps/web/src/lib/category-navigation.ts`
- `apps/web/src/lib/categories/liveData.ts`
- `apps/web/src/app/categories/page.tsx`

Remaining source differences found:
- VPS `apps/web/src/components/home/HeroCarousel.tsx` has an extra live-rendered tagline line: `Global Beauty. Local Trust.` This file is used by the live homepage and should be preserved into Local/Git before broad sync/reconcile.
- VPS `apps/web/src/components/home/CategoryIllustration.tsx` is unused residue. Live/home/category cards import `apps/web/src/components/category/CategoryIllustration.tsx` instead.

Safe next step: copy/preserve the live hero tagline into Local, build/commit, then reconcile VPS carefully. Do not blindly overwrite VPS until this live-used hero difference is handled.
