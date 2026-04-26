/**
 * Porcelain typography system
 * Compatibility export for the legacy design-system module.
 */

export const TYPOGRAPHY = {
  fonts: {
    heading: '"Playfair Display", Georgia, "Noto Serif Bengali", serif',
    body: '"DM Sans", "Hind Siliguri", system-ui, sans-serif',
    mono: '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace',
  },

  h1: {
    fontSize: '2.5rem',
    fontWeight: '500',
    lineHeight: '1.15',
    letterSpacing: '-0.01em',
    fontFamily: '"Playfair Display", Georgia, serif',
  },

  h2: {
    fontSize: '2rem',
    fontWeight: '500',
    lineHeight: '1.2',
    letterSpacing: '-0.01em',
    fontFamily: '"Playfair Display", Georgia, serif',
  },

  h3: {
    fontSize: '1.5rem',
    fontWeight: '500',
    lineHeight: '1.3',
    fontFamily: '"Playfair Display", Georgia, serif',
  },

  h4: {
    fontSize: '1.25rem',
    fontWeight: '500',
    lineHeight: '1.4',
    fontFamily: '"DM Sans", "Hind Siliguri", sans-serif',
  },

  h5: {
    fontSize: '1.125rem',
    fontWeight: '500',
    lineHeight: '1.5',
    fontFamily: '"DM Sans", "Hind Siliguri", sans-serif',
  },

  h6: {
    fontSize: '1rem',
    fontWeight: '500',
    lineHeight: '1.5',
    fontFamily: '"DM Sans", "Hind Siliguri", sans-serif',
  },

  bodyLarge: {
    fontSize: '1.125rem',
    fontWeight: '400',
    lineHeight: '1.6',
    fontFamily: '"DM Sans", "Hind Siliguri", sans-serif',
  },

  body: {
    fontSize: '1rem',
    fontWeight: '400',
    lineHeight: '1.6',
    fontFamily: '"DM Sans", "Hind Siliguri", sans-serif',
  },

  bodySmall: {
    fontSize: '0.875rem',
    fontWeight: '400',
    lineHeight: '1.5',
    fontFamily: '"DM Sans", "Hind Siliguri", sans-serif',
  },

  caption: {
    fontSize: '0.75rem',
    fontWeight: '400',
    lineHeight: '1.4',
    fontFamily: '"DM Sans", "Hind Siliguri", sans-serif',
  },

  buttonLarge: {
    fontSize: '1rem',
    fontWeight: '500',
    lineHeight: '1.4',
    fontFamily: '"DM Sans", "Hind Siliguri", sans-serif',
  },

  button: {
    fontSize: '0.9375rem',
    fontWeight: '500',
    lineHeight: '1.4',
    fontFamily: '"DM Sans", "Hind Siliguri", sans-serif',
  },

  buttonSmall: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.4',
    fontFamily: '"DM Sans", "Hind Siliguri", sans-serif',
  },

  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.5',
    fontFamily: '"DM Sans", "Hind Siliguri", sans-serif',
  },

  badge: {
    fontSize: '0.75rem',
    fontWeight: '500',
    lineHeight: '1.4',
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  },

  responsive: {
    h1Mobile: {
      fontSize: '1.75rem',
      fontWeight: '500',
      lineHeight: '1.15',
      fontFamily: '"Playfair Display", Georgia, serif',
    },
    h2Mobile: {
      fontSize: '1.5rem',
      fontWeight: '500',
      lineHeight: '1.2',
      fontFamily: '"Playfair Display", Georgia, serif',
    },
  },
} as const;

export const TAILWIND_TYPOGRAPHY = {
  extend: {
    fontFamily: {
      display: ['"Playfair Display"', 'Georgia', 'serif'],
      body: ['"DM Sans"', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
      mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      serif: ['"Playfair Display"', 'Georgia', 'serif'],
      sans: ['"DM Sans"', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1.4' }],
      sm: ['0.875rem', { lineHeight: '1.5' }],
      base: ['1rem', { lineHeight: '1.6' }],
      lg: ['1.125rem', { lineHeight: '1.6' }],
      xl: ['1.25rem', { lineHeight: '1.5' }],
      '2xl': ['1.5rem', { lineHeight: '1.3' }],
      '3xl': ['2rem', { lineHeight: '1.2' }],
      '4xl': ['2.5rem', { lineHeight: '1.15' }],
    },
  },
};
