# Emart Design System

Use this design system for all UI in this project. Emart is a premium skincare e-commerce
brand (Bangladesh). The aesthetic is **editorial, warm, and trustworthy**: off-white paper
backgrounds, near-black ink text, a deep rose accent, brass highlights, serif display type
paired with a clean grotesque sans.

## How to apply it
- **Tailwind projects**: copy the theme block from `tailwind.config.js` into your config.
- **Plain CSS / other stacks**: use the variables in `tokens.css`.
- **Fonts**: load DM Sans, Playfair Display, and JetBrains Mono (see "Fonts" below).
- **Components**: copy markup patterns from `components.md`. Match these — don't invent new
  card shapes, button styles, or colors.

## Core rules
- Background is paper, never pure white at page level: `bg` `#FAFAF8`. Cards are white.
- Body & UI text: **DM Sans**. Headings/hero: **Playfair Display** (serif). Prices & code
  badges: **JetBrains Mono**.
- Primary action = solid ink (near-black) pill button. Accent rose is for sale/secondary.
- Buttons and chips are fully rounded pills (`999px`). Cards use `rounded-xl`. Badges use a
  tight `4px` radius.
- Borders are hairline: `rgba(17,17,17,0.10)`.
- Prices: mono, bold ink, original price struck through in muted. Currency is ৳ (BDT Taka).
- Keep it calm. One accent color per view. Generous whitespace.

## Fonts
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
```

## Files
- `tailwind.config.js` — drop-in theme.extend (colors, fonts, radius, shadows)
- `tokens.css` — same tokens as CSS custom properties + base resets
- `components.md` — copy-paste markup for buttons, badges, product cards, chips, stock bars
