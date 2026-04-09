/**
 * Lumière K-Beauty Typography System
 * Premium fonts for elegant, readable e-commerce experience
 */

export const TYPOGRAPHY = {
  fonts: {
    heading: '"Noto Serif", serif', // Elegant, authoritative, editorial
    body: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', // Legible, modern
  },

  // Heading Styles
  h1: {
    fontSize: '2.5rem', // 40px
    fontWeight: '700',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
    fontFamily: '"Noto Serif", serif',
  },

  h2: {
    fontSize: '2rem', // 32px
    fontWeight: '600',
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
    fontFamily: '"Noto Serif", serif',
  },

  h3: {
    fontSize: '1.5rem', // 24px
    fontWeight: '600',
    lineHeight: '1.4',
    fontFamily: '"Noto Serif", serif',
  },

  h4: {
    fontSize: '1.25rem', // 20px
    fontWeight: '600',
    lineHeight: '1.5',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },

  h5: {
    fontSize: '1.125rem', // 18px
    fontWeight: '600',
    lineHeight: '1.5',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },

  h6: {
    fontSize: '1rem', // 16px
    fontWeight: '600',
    lineHeight: '1.5',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },

  // Body Styles
  bodyLarge: {
    fontSize: '1.125rem', // 18px
    fontWeight: '400',
    lineHeight: '1.6',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },

  body: {
    fontSize: '1rem', // 16px
    fontWeight: '400',
    lineHeight: '1.6',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },

  bodySmall: {
    fontSize: '0.875rem', // 14px
    fontWeight: '400',
    lineHeight: '1.5',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },

  caption: {
    fontSize: '0.75rem', // 12px
    fontWeight: '400',
    lineHeight: '1.4',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },

  // Special Styles
  buttonLarge: {
    fontSize: '1rem', // 16px
    fontWeight: '600',
    lineHeight: '1.5',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },

  button: {
    fontSize: '0.9375rem', // 15px
    fontWeight: '600',
    lineHeight: '1.4',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },

  buttonSmall: {
    fontSize: '0.875rem', // 14px
    fontWeight: '600',
    lineHeight: '1.4',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },

  label: {
    fontSize: '0.875rem', // 14px
    fontWeight: '500',
    lineHeight: '1.5',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },

  badge: {
    fontSize: '0.75rem', // 12px
    fontWeight: '600',
    lineHeight: '1.4',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },

  // Responsive Typography
  responsive: {
    h1Mobile: {
      fontSize: '1.75rem', // 28px
      fontWeight: '700',
      lineHeight: '1.2',
      fontFamily: '"Noto Serif", serif',
    },
    h2Mobile: {
      fontSize: '1.5rem', // 24px
      fontWeight: '600',
      lineHeight: '1.3',
      fontFamily: '"Noto Serif", serif',
    },
  },
} as const;

/**
 * Tailwind CSS typography plugin configuration
 * Add to tailwind.config.ts for seamless integration
 */
export const TAILWIND_TYPOGRAPHY = {
  extend: {
    fontFamily: {
      serif: ['"Noto Serif"', 'serif'],
      sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1.4' }],
      sm: ['0.875rem', { lineHeight: '1.5' }],
      base: ['1rem', { lineHeight: '1.6' }],
      lg: ['1.125rem', { lineHeight: '1.6' }],
      xl: ['1.25rem', { lineHeight: '1.5' }],
      '2xl': ['1.5rem', { lineHeight: '1.4' }],
      '3xl': ['2rem', { lineHeight: '1.3' }],
      '4xl': ['2.5rem', { lineHeight: '1.2' }],
    },
  },
};
