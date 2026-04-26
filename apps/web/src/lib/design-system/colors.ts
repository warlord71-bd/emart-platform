/**
 * Porcelain color system
 * Compatibility layer that keeps existing design-system imports working
 * while the web app progressively migrates to the Porcelain tokens.
 */

export const LUMIERE_COLORS = {
  // Primary Actions & CTAs
  primary: '#111111',
  primaryHover: '#000000',
  primaryLight: '#F3F1EC',

  // Secondary / Accent Actions
  secondary: '#D4596E',
  secondaryHover: '#A13F52',
  secondaryLight: '#F8E6EA',

  // Backgrounds & Neutrals
  background: '#FAFAF8',
  backgroundDark: '#F3F1EC',
  backgroundGray: '#F3F1EC',

  // Premium accents
  accent: '#C9A961',
  accentLight: '#F5ECD4',

  // Text Colors
  textPrimary: '#111111',
  textSecondary: '#6B6B6B',
  textTertiary: '#9A9A9A',

  // White & Surfaces
  white: '#FFFFFF',
  surface: '#FFFFFF',

  // Status Colors
  success: '#2E7D5B',
  error: '#B23B3B',
  warning: '#C88A2E',
  info: '#2E7D5B',

  // Skin Concern Badges
  acne: '#E4F0EA',
  acneBorder: '#2E7D5B',
  dryness: '#F8ECD6',
  drynessBorder: '#C88A2E',
  brightening: '#111111',
  brighteningText: '#FFFFFF',
  antiAging: '#F8E6EA',
  antiAgingBorder: '#D4596E',
  sensitivity: '#E4F0EA',
  sensitivityBorder: '#2E7D5B',

  // Trust & Authenticity
  authentic: '#C9A961',
  fastDelivery: '#D4596E',
  cod: '#2E7D5B',
  easyReturn: '#111111',

  // Shadows
  shadowLight: 'rgba(17, 17, 17, 0.04)',
  shadowMedium: 'rgba(17, 17, 17, 0.08)',
  shadowHeavy: 'rgba(17, 17, 17, 0.12)',

  // Borders
  borderLight: 'rgba(17, 17, 17, 0.10)',
  borderMedium: '#EDEAE3',
  borderDark: '#9A9A9A',
} as const;

export type LumiereColorKey = keyof typeof LUMIERE_COLORS;

export const LEGACY_COLOR_MAP = {
  primary: LUMIERE_COLORS.primary,
  secondary: LUMIERE_COLORS.secondary,
  accent: LUMIERE_COLORS.accent,
  error: LUMIERE_COLORS.error,
  success: LUMIERE_COLORS.success,
} as const;

export const PORCELAIN_COLORS = {
  bg: '#FAFAF8',
  bgAlt: '#F3F1EC',
  card: '#FFFFFF',
  stone: '#EDEAE3',
  ink: '#111111',
  ink2: '#2A2A2A',
  muted: '#6B6B6B',
  muted2: '#9A9A9A',
  accent: '#D4596E',
  accentSoft: '#F8E6EA',
  accentDeep: '#A13F52',
  brass: '#C9A961',
  brassSoft: '#F5ECD4',
  success: '#2E7D5B',
  successSoft: '#E4F0EA',
  warning: '#C88A2E',
  warningSoft: '#F8ECD6',
  danger: '#B23B3B',
  dangerSoft: '#F5E1E1',
  hairline: 'rgba(17, 17, 17, 0.10)',
} as const;
