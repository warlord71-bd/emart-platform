---
name: Two WhatsApp numbers are intentional, not a cleanup target
description: WhatsApp signup uses 8801717082135 (sales), WhatsApp support/FAB/Header uses 8801919797399 (support) — do not consolidate
type: project
originSessionId: 897a3d49-6d5e-4da0-8802-309f793d8a47
---
The codebase has two different WhatsApp numbers in use, and this is intentional — do not propose a refactor that collapses them into one `COMPANY.whatsappHref`.

- `wa.me/8801717082135` → sales/signup. Used by the WhatsApp "Subscribe" button in the tabbed signup block (`WhatsappSignupSection` in `apps/web/src/components/home/HomepageSections.tsx`). Matches `COMPANY.phones.salesHref` in `companyProfile.ts`.
- `wa.me/8801919797399` → support/general chat. Used by the floating WhatsApp FAB, the `WhatsAppSupportBanner`, and the Header WhatsApp link. Matches `COMPANY.whatsappHref` and `COMPANY.phones.primaryHref` in `companyProfile.ts`.

**Why:** Different people answer the two numbers — sales leads vs support questions go to different staff. Confirmed by the user on 2026-04-24 after I flagged the inconsistency.

**How to apply:** When editing a WhatsApp link, check the context. Signup / "Join list" / sales-flow CTA → `8801717082135`. Support / "Chat with us" / help CTA → `8801919797399`. Don't "fix" the hardcoded support number to use `COMPANY.whatsappHref` and don't route the signup CTA through `COMPANY.whatsappHref` either — they're deliberately split.
