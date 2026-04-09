/**
 * Lumière K-Beauty Color System
 * Premium, elegant palette for the modern Bangladeshi woman
 */

export const LUMIERE_COLORS = {
  // Primary Actions & CTAs
  primary: '#F24E5E', // Blush Rose - Main CTA, urgent actions
  primaryHover: '#E63A49',
  primaryLight: '#FADADC',

  // Secondary Actions & Badges
  secondary: '#3D8762', // Sage Green - Sustainability, badges, secondary CTAs
  secondaryHover: '#2F6B50',
  secondaryLight: '#E8F5E9',

  // Backgrounds & Neutrals
  background: '#FAF9F7', // Warm White - Premium feel, softer than pure white
  backgroundDark: '#F5F1ED', // Slightly darker for contrast
  backgroundGray: '#F9F8F6',

  // Accent
  accent: '#D4A017', // Gold - Ratings, luxury indicators
  accentLight: '#F4E4C3',

  // Text Colors
  textPrimary: '#1a1a2e', // Dark - Headings, main text
  textSecondary: '#666666', // Light Gray - Descriptions, metadata
  textTertiary: '#999999', // Lighter Gray - Disabled states

  // White & Surfaces
  white: '#FFFFFF',
  surface: '#FFFFFF', // Card backgrounds

  // Status Colors
  success: '#3D8762', // Green
  error: '#E63A49', // Red (from primary)
  warning: '#D4A017', // Gold
  info: '#3D8762', // Green

  // Skin Concern Badges (for filters)
  acne: '#E8F5E9', // Light green
  acneBorder: '#3D8762',
  dryness: '#F5F1ED', // Beige
  drynessBorder: '#D4A017',
  brightening: '#2d2d4d', // Dark
  brighteningText: '#FFFFFF',
  antiAging: '#FADADC', // Light pink
  antiAgingBorder: '#F24E5E',
  sensitivity: '#E8F5E9', // Light green
  sensitivityBorder: '#3D8762',

  // Trust & Authenticity Badges
  authentic: '#3D8762', // Green
  fastDelivery: '#F24E5E', // Red
  cod: '#3D8762', // Green
  easyReturn: '#F24E5E', // Red

  // Shadows
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.1)',
  shadowHeavy: 'rgba(0, 0, 0, 0.15)',

  // Borders
  borderLight: '#E8E8E8',
  borderMedium: '#D0D0D0',
  borderDark: '#A0A0A0',
} as const;

export type LumiereColorKey = keyof typeof LUMIERE_COLORS;

/**
 * Legacy color mapping (for existing components during transition)
 * Maps old color names to new Lumière system
 */
export const LEGACY_COLOR_MAP = {
  primary: LUMIERE_COLORS.primary, // #e8197a → #F24E5E
  secondary: LUMIERE_COLORS.secondary, // new
  accent: LUMIERE_COLORS.accent,
  error: LUMIERE_COLORS.error,
  success: LUMIERE_COLORS.success,
} as const;
