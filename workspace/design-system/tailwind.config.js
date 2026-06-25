/** Emart Design System — Tailwind theme.
 *  Merge the `theme.extend` block into your tailwind.config.js. */
module.exports = {
  theme: {
    extend: {
      colors: {
        bg:      { DEFAULT: '#FAFAF8', alt: '#F3F1EC', stone: '#EDEAE3' },
        ink:     { DEFAULT: '#111111', 2: '#2A2A2A' },
        muted:   { DEFAULT: '#6B6B6B', 2: '#5F5F5F' },
        accent:  { DEFAULT: '#9f1239', soft: '#FCE7F0', deep: '#83122f' },
        brass:   { DEFAULT: '#d4a248', soft: '#F5ECD4' },
        success: { DEFAULT: '#2E7D5B', soft: '#E4F0EA' },
        warning: { DEFAULT: '#C88A2E', soft: '#F8ECD6' },
        danger:  { DEFAULT: '#B23B3B', soft: '#F5E1E1' },
        hairline: 'rgba(17,17,17,0.10)',
      },
      fontFamily: {
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { pill: '999px' },
      boxShadow: {
        card: '0 1px 2px rgba(17,17,17,0.04), 0 8px 24px rgba(17,17,17,0.06)',
        pop:  '0 20px 48px rgba(17,17,17,0.12)',
      },
    },
  },
};
