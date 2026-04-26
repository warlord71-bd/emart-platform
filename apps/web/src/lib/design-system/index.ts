/**
 * Porcelain design system compatibility entrypoint
 */

export * from './colors';
export * from './typography';

export { LUMIERE_COLORS as colors, PORCELAIN_COLORS } from './colors';
export { TYPOGRAPHY as typography } from './typography';

export const DESIGN = {
  colors: require('./colors').PORCELAIN_COLORS,
  typography: require('./typography').TYPOGRAPHY,

  breakpoints: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
    pill: '9999px',
  },

  shadow: {
    none: 'none',
    sm: '0 1px 2px rgba(17,17,17,0.04)',
    md: '0 1px 2px rgba(17,17,17,0.04), 0 8px 24px rgba(17,17,17,0.06)',
    lg: '0 20px 48px rgba(17,17,17,0.12)',
    xl: '0 20px 48px rgba(17,17,17,0.12)',
  },

  transition: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
};

export default DESIGN;
