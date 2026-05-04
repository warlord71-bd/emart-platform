# 2026-05-04 Local/VPS/Git Reconciliation

Cause pattern found: several logged commits, including the product revalidation/image-audit work, existed as dangling local Git objects while `origin/main` pointed at `079ec5a` and the VPS runtime tree stayed at `ba15ffd` with many dirty files. The live site was still okay because the VPS working tree contained the deployed source.

Safe repair rule for this state:

1. Treat `/var/www/emart-platform` as the live source to preserve.
2. Create recovery refs before touching history.
3. Reverse-sync VPS -> Local, excluding `.git`, build output, dependencies, and env files.
4. Build Local.
5. Commit the reconciled Local state.
6. Smoke-test live before pushing.
7. Only after source equivalence is verified, update VPS Git metadata without changing live files.

Never fix this class of mismatch by force-pushing, checking out an old branch on VPS, or overwriting `/var/www` from Local before comparing.
