import { getCategoryBySlug, getProducts, type WooProduct } from '@/lib/woocommerce';

export interface ConcernDefinition {
  slug: string;
  label: string;
  icon: string;
  description: string;
  categorySlug?: string;
  searchQuery?: string;
}

export const CONCERN_DEFINITIONS: ConcernDefinition[] = [
  {
    slug: 'anti-aging-repair',
    label: 'Anti-Aging & Repair',
    icon: 'sparkles',
    description: 'Fight signs of aging, fine lines, and barrier stress.',
    categorySlug: 'anti-aging-repair',
  },
  {
    slug: 'acne-blemish-care',
    label: 'Acne & Blemish',
    icon: 'target',
    description: 'Target breakouts, clogged pores, and post-acne marks.',
    categorySlug: 'acne-blemish-care',
  },
  {
    slug: 'dryness-hydration',
    label: 'Dryness & Hydration',
    icon: 'droplets',
    description: 'Deep moisture and barrier support for thirsty skin.',
    categorySlug: 'dryness-hydration',
  },
  {
    slug: 'pores-oil-control',
    label: 'Pores & Blackheads',
    icon: 'circle-dot',
    description: 'Target visible pores, blackheads, and uneven texture.',
    categorySlug: 'pores-oil-control',
  },
  {
    slug: 'melasma',
    label: 'Hyperpigmentation',
    icon: 'sun',
    description: 'Support more even-looking skin and fade pigmentation over time.',
    categorySlug: 'melasma',
  },
  {
    slug: 'brightening',
    label: 'Brightening',
    icon: 'star',
    description: 'Glow-focused picks for dullness and uneven tone.',
    categorySlug: 'brightening',
    searchQuery: 'brightening',
  },
  {
    slug: 'wrinkle',
    label: 'Wrinkle',
    icon: 'clock-3',
    description: 'Focus on fine lines, wrinkle care, and smoother-looking skin.',
    searchQuery: 'wrinkle',
  },
  {
    slug: 'sensitivity',
    label: 'Sensitivity',
    icon: 'shield',
    description: 'Gentle, low-irritation routines for reactive skin.',
    categorySlug: 'dryness-hydration',
    searchQuery: 'sensitive skin',
  },
  {
    slug: 'sunscreen',
    label: 'Sunscreen',
    icon: 'shield-check',
    description: 'Daily SPF essentials for Dhaka heat and everyday protection.',
    categorySlug: 'sunscreen',
  },
];

export function getConcernBySlug(slug?: string) {
  return CONCERN_DEFINITIONS.find((concern) => concern.slug === slug) || null;
}

export function getConcernHref(slug: string) {
  return `/concerns?concern=${encodeURIComponent(slug)}`;
}

export async function getConcernListing(slug: string, page = 1, perPage = 24): Promise<{
  concern: ConcernDefinition | null;
  products: WooProduct[];
  total: number;
  totalPages: number;
}> {
  const concern = getConcernBySlug(slug);
  if (!concern) {
    return { concern: null, products: [], total: 0, totalPages: 0 };
  }

  if (concern.categorySlug) {
    const category = await getCategoryBySlug(concern.categorySlug);
    if (category?.id) {
      const listing = await getProducts({
        page,
        per_page: perPage,
        category: String(category.id),
        orderby: 'popularity',
        order: 'desc',
      });

      if (listing.products.length > 0 || !concern.searchQuery) {
        return { concern, ...listing };
      }
    }
  }

  if (concern.searchQuery) {
    const listing = await getProducts({
      page,
      per_page: perPage,
      search: concern.searchQuery,
      orderby: 'popularity',
      order: 'desc',
    });

    return { concern, ...listing };
  }

  return { concern, products: [], total: 0, totalPages: 0 };
}
