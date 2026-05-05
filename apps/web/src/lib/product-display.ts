// Shared product display helpers for ProductCard eyebrow labels and breadcrumbs.
// Priority: brand → useful type category → null (hide eyebrow).

import type { WooProduct } from '@/lib/woocommerce';

/**
 * Category SLUGS that must never appear as a ProductCard eyebrow.
 */
const BLOCKED_EYEBROW_SLUGS = new Set([
  'k-beauty-j-beauty',
  'k-beauty',
  'j-beauty',
  'korean-beauty',
  'japanese-beauty',
  'beauty-personal-care',
  'skin-care',
  'skincare',
  'skincare-essentials',
  'products',
  'all-products',
  'uncategorized',
  'sale',
  'new-arrivals',
  'featured',
  'shop-by-concern',
  'health-wellbeing',
  'beauty-supplements',
]);

/**
 * Category NAMES (case-insensitive) that must never appear as a ProductCard eyebrow.
 */
const BLOCKED_EYEBROW_NAMES = new Set(
  [
    'K-BEAUTY & J-BEAUTY',
    'K-BEAUTY',
    'J-BEAUTY',
    'K Beauty',
    'J Beauty',
    'Beauty & Personal Care',
    'Skin Care',
    'Skincare',
    'Products',
    'All Products',
    'Uncategorized',
    'Sale',
    'New Arrivals',
    'Featured',
    'Shop By Concern',
    'Health & Wellbeing',
    'Beauty Supplements',
    'K-Beauty',
    'J-Beauty',
  ].map((n) => n.toLowerCase()),
);

/**
 * Useful product-type labels keyed by category slug.
 * If a product has one of these categories, that becomes the eyebrow.
 */
const PRODUCT_TYPE_LABELS: Record<string, string> = {
  sunscreen: 'Sunscreen',
  'serums-ampoules-essences': 'Serum',
  'face-cleansers': 'Cleanser',
  'toners-mists': 'Toner',
  'cream-moisturizer': 'Moisturizer',
  'night-cream': 'Moisturizer',
  'face-masks': 'Face Mask',
  'makeup-remover': 'Makeup Remover',
  'lip-balm-care': 'Lip Care',
  lips: 'Lip Care',
  'body-wash': 'Body Wash',
  'body-lotion': 'Body Lotion',
  shampoos: 'Shampoo',
  'hair-treatments': 'Hair Treatment',
  'hair-care': 'Hair Care',
  'eye-care': 'Eye Care',
  exfoliant: 'Exfoliant',
  ampoule: 'Ampoule',
  essence: 'Essence',
};

/**
 * If a category is not explicitly in PRODUCT_TYPE_LABELS but passes
 * the block-list, we still show it.  These are extra "benign" slugs
 * we can surface directly (e.g. "toner", "serum", "moisturizer").
 */
const DIRECT_PASS_THROUGH_PATTERNS = [
  /^serum/i,
  /^toner/i,
  /^cream/i,
  /^moisturizer/i,
  /^sunscreen/i,
  /^cleanser/i,
  /^mask/i,
  /^ampoule/i,
  /^essence/i,
  /^exfoliant/i,
  /^eye[- ]?care/i,
  /^lip/i,
  /^body/i,
  /^hair/i,
  /^shampoo/i,
  /^conditioner/i,
];

function isBlockedCategory(cat: { name: string; slug: string }): boolean {
  if (BLOCKED_EYEBROW_SLUGS.has(cat.slug)) return true;
  if (BLOCKED_EYEBROW_NAMES.has(cat.name.toLowerCase())) return true;

  // Also block names that contain "K-beauty" / "J-beauty" as substrings
  const lowerName = cat.name.toLowerCase();
  if (lowerName.includes('k-beauty') || lowerName.includes('j-beauty')) return true;
  if (lowerName.includes('beauty & personal')) return true;

  return false;
}

function getTypeFromName(name: string): string | null {
  const n = name.toLowerCase();
  if (/serum|ampoule|essence/.test(n)) return 'Serum';
  if (/cream|moisturi[sz]er|gel cream|lotion/.test(n)) return 'Moisturizer';
  if (/cleanser|face wash|cleansing|foam wash/.test(n)) return 'Cleanser';
  if (/toner|mist/.test(n)) return 'Toner';
  if (/sunscreen|sun cream|sun serum|spf|sun stick|sun milk/.test(n)) return 'Sunscreen';
  if (/mask|sleeping pack/.test(n)) return 'Face Mask';
  if (/shampoo/.test(n)) return 'Shampoo';
  if (/conditioner/.test(n)) return 'Conditioner';
  if (/lip/.test(n)) return 'Lip Care';
  if (/exfoliat|peeling|aha|bha/.test(n)) return 'Exfoliant';
  if (/eye/.test(n)) return 'Eye Care';
  if (/body/.test(n)) return 'Body Care';
  return null;
}

/**
 * Returns the eyebrow label for a ProductCard, or `null` to hide.
 *
 * Priority:
 *   1. Brand attribute (brands[0].name)
 *   2. Explicit product-type category match (PRODUCT_TYPE_LABELS)
 *   3. Name-based inference (getTypeFromName)
 *   4. First non-blocked category with a pass-through name
 *   5. null — hide the eyebrow line
 */
export function getProductCardEyebrow(product: WooProduct): string | null {
  // 1. Brand
  const brandName = product.brands?.[0]?.name?.trim();
  if (brandName && brandName.length > 0 && brandName.length <= 40) {
    return brandName;
  }

  // 2. Explicit type category
  for (const cat of product.categories ?? []) {
    const label = PRODUCT_TYPE_LABELS[cat.slug];
    if (label) return label;
  }

  // 3. Name-based inference
  const nameType = getTypeFromName(product.name);
  if (nameType) return nameType;

  // 4. First non-blocked category that passes a direct pattern
  for (const cat of product.categories ?? []) {
    if (isBlockedCategory(cat)) continue;
    for (const pattern of DIRECT_PASS_THROUGH_PATTERNS) {
      if (pattern.test(cat.name)) {
        return cat.name;
      }
    }
  }

  // 5. Nothing useful — hide the eyebrow
  return null;
}

/**
 * Returns the best breadcrumb parent category for the PDP.
 * Priority: explicit product-type category → first non-blocked category → null.
 * Returning null means breadcrumb falls back to: Home → Shop → Product.
 * Never returns brand (brand has its own browse path, not a product-type category).
 */
export function getCleanBreadcrumbCategory(
  product: WooProduct,
): { label: string; href: string } | null {
  // Priority 1: explicit product-type category with a clean label
  for (const cat of product.categories ?? []) {
    if (isBlockedCategory(cat)) continue;
    const label = PRODUCT_TYPE_LABELS[cat.slug];
    if (label) return { label, href: `/category/${cat.slug}` };
  }

  // Priority 2: any non-blocked category with a valid name and slug
  for (const cat of product.categories ?? []) {
    if (isBlockedCategory(cat)) continue;
    if (cat.name?.trim() && cat.slug?.trim()) {
      return { label: cat.name.trim(), href: `/category/${cat.slug}` };
    }
  }

  return null;
}
