# HP-OFFER-001 Visual Review

## Render matrix

| Variant | Mobile (390×844) | Desktop (1280×900) |
|---|---|---|
| A | `screenshots/a-mobile.png` | `screenshots/a-desktop.png` |
| B | `screenshots/b-mobile.png` | `screenshots/b-desktop.png` |
| C | `screenshots/c-mobile.png` | `screenshots/c-desktop.png` |

## Assessment

### A — Refined current rail (recommended)

- Preserves the existing mobile horizontal-scroll behavior and desktop six-card
  footprint.
- Adds clearer numbering, directional feedback, focus rings and stronger icon
  treatment without changing the content model.
- Lowest implementation and regression risk.

### B — Compact deal navigator

- Fastest to scan and clearest link affordance.
- Uses more vertical space on mobile because all six offers are stacked.
- Better suited to an offers hub than the current homepage position.

### C — Featured offer spotlight

- Strongest campaign hierarchy and most distinctive desktop composition.
- Requires a reliable business rule for which offer is featured; using the first
  configured item could promote a campaign that is not currently highest priority.
- Best only when campaign ownership and scheduling are defined.

## Validation

- Targeted ESLint: pass
- TypeScript (`tsc --noEmit`): pass
- Next.js production build: pass
- Production preview guard: generated output is the project 404 page unless
  `ENABLE_DESIGN_PREVIEWS=1`
- Browser render: pass at 390×844 and 1280×900 for all variants
- Production homepage source: unchanged

Two pre-existing `next/image` lint warnings remain in `ChatProductCard.tsx` and
`RecentlyViewedRail.tsx`; neither belongs to this design change.
