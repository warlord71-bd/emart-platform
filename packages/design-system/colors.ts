/**
 * Lumière K-Beauty — Unified Design System
 * Shared across Web (Next.js), Mobile (React Native), and Admin
 */

export const LUMIERE_COLORS = {
  // Primary Actions & CTA
  primary: '#F24E5E',        // Blush Rose - Main buttons, urgent actions
  primaryHover: '#E63A49',
  primaryLight: '#FADADC',

  // Secondary Actions & Badges
  secondary: '#3D8762',      // Sage Green - Badges, secondary CTAs
  secondaryHover: '#2F6B50',
  secondaryLight: '#E8F5E9',

  // Luxury & Premium Ratings
  accent: '#D4A017',         // Gold - Ratings, luxury indicators
  accentLight: '#F4E4C3',

  // Backgrounds
  background: '#FAF9F7',     // Warm White - Premium feel
  backgroundDark: '#F5F1ED',
  backgroundGray: '#F9F8F6',

  // Text Colors
  textPrimary: '#1a1a2e',    // Dark - Headings, primary text
  textSecondary: '#666666',  // Gray - Descriptions, metadata
  textTertiary: '#999999',   // Light Gray - Disabled states
  textWhite: '#FFFFFF',

  // Status & Functional
  success: '#3D8762',        // Green
  error: '#E63A49',          // Red
  warning: '#D4A017',        // Gold
  info: '#3D8762',           // Green

  // Surfaces & Cards
  surface: '#FFFFFF',
  surfaceAlt: '#FAF9F7',

  // Borders
  borderLight: '#E8E8E8',
  borderMedium: '#D0D0D0',

  // Skin Concern Badges
  acne: '#E8F5E9',
  dryness: '#F5F1ED',
  brightening: '#2d2d4d',
  antiaging: '#FADADC',
  sensitivity: '#E8F5E9',

  // Trust Badges
  authentic: '#3D8762',
  fastDelivery: '#F24E5E',
  cod: '#3D8762',
  easyReturn: '#F24E5E',

  // Shadows
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.1)',
  shadowHeavy: 'rgba(0, 0, 0, 0.15)',
} as const;

export const LUMIERE_TYPOGRAPHY = {
  // Font families
  fontHeading: '"Noto Serif"',      // Elegant, authoritative
  fontBody: '"Plus Jakarta Sans"',  // Modern, legible

  // Sizes (in pixels - convert to rem/sp as needed)
  h1: 40,
  h2: 32,
  h3: 24,
  h4: 20,
  h5: 18,
  h6: 16,
  bodyLarge: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,

  // Weights
  weightRegular: 400,
  weightMedium: 500,
  weightSemibold: 600,
  weightBold: 700,
  weightExtrabold: 800,
} as const;

export const LUMIERE_SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export default LUMIERE_COLORS;
