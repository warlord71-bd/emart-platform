import { getProducts, getCategoryBySlug, type WooProduct } from '@/lib/woocommerce';

export interface RoutineStep {
  slug: string;
  step: number;
  label: string;
  icon: string;
  shortLabel: string;
  description: string;
  metaDescription: string;
  categorySlug?: string;
  searchQuery?: string;
}

export const ROUTINE_STEPS: RoutineStep[] = [
  {
    step: 1,
    slug: 'oil-cleanser',
    label: 'Oil Cleanser & Makeup Remover',
    shortLabel: 'Oil Cleanser',
    icon: '🧴',
    description: 'Start your routine by dissolving makeup, sunscreen, and excess sebum with an oil-based cleanser. The first step of the K-beauty double cleansing method.',
    metaDescription: 'Shop oil cleansers and makeup removers in Bangladesh. First step of Korean double cleansing — removes sunscreen, makeup, and sebum. Original products, COD available.',
    categorySlug: 'makeup-remover',
  },
  {
    step: 2,
    slug: 'cleanser',
    label: 'Face Cleanser',
    shortLabel: 'Cleanser',
    icon: '💆',
    description: 'The second cleanse removes water-based impurities like sweat and dirt. Low-pH gel, foam, and cream cleansers for every skin type.',
    metaDescription: 'Shop face cleansers in Bangladesh. Low-pH gel, foam, and cream cleansers from COSRX, CeraVe, and more. Authentic, COD available across Bangladesh.',
    categorySlug: 'face-cleansers',
  },
  {
    step: 3,
    slug: 'toner',
    label: 'Toner & Essence',
    shortLabel: 'Toner',
    icon: '💧',
    description: 'Rebalance skin pH, prep for better absorption, and add the first layer of hydration. From exfoliating toners to hydrating essences.',
    metaDescription: 'Shop toners and essences in Bangladesh. Hydrating, exfoliating, and balancing toners from COSRX, Some By Mi, Anua, and more. Authentic, COD available.',
    categorySlug: 'toners-mists',
  },
  {
    step: 4,
    slug: 'treatment',
    label: 'Serum & Treatment',
    shortLabel: 'Serum',
    icon: '⚗️',
    description: 'Targeted actives — niacinamide, retinol, vitamin C, peptides — that address your specific skin concerns at a cellular level.',
    metaDescription: 'Shop serums and treatments in Bangladesh. Targeted actives from The Ordinary, COSRX, Skin1004, and more for acne, aging, brightening, and hydration. COD available.',
    categorySlug: 'serums-ampoules-essences',
  },
  {
    step: 5,
    slug: 'eye-care',
    label: 'Eye Cream & Care',
    shortLabel: 'Eye Care',
    icon: '👁️',
    description: 'Delicate eye area needs dedicated care — eye creams, serums, and patches target dark circles, puffiness, and fine lines.',
    metaDescription: 'Shop eye creams and eye care in Bangladesh. Targeted eye treatments for dark circles, fine lines, and puffiness. Authentic products, COD available.',
    categorySlug: 'eye-care',
  },
  {
    step: 6,
    slug: 'moisturiser',
    label: 'Moisturiser & Cream',
    shortLabel: 'Moisturiser',
    icon: '🫧',
    description: 'Lock in all previous layers and strengthen the skin barrier. From lightweight gel-creams to rich moisturisers for dry skin.',
    metaDescription: 'Shop moisturisers and face creams in Bangladesh. Lightweight gel-creams to rich barrier creams from CeraVe, COSRX, Laneige, and more. COD available.',
    categorySlug: 'cream-moisturizer',
  },
  {
    step: 7,
    slug: 'sunscreen',
    label: 'Sunscreen (SPF)',
    shortLabel: 'SPF',
    icon: '☀️',
    description: 'The most important step — daily SPF protects against UV damage, premature ageing, and hyperpigmentation. Non-negotiable for Bangladesh\'s climate.',
    metaDescription: 'Shop sunscreen SPF in Bangladesh. Korean, Japanese, and global sunscreens — light finish, no white cast, fast delivery. Authentic, COD available.',
    categorySlug: 'sunscreen',
  },
  {
    step: 8,
    slug: 'mask',
    label: 'Sheet Mask & Mask',
    shortLabel: 'Mask',
    icon: '🎭',
    description: 'Weekly treatment step — sheet masks, sleeping masks, and wash-off masks deliver concentrated actives for a visible skin boost.',
    metaDescription: 'Shop face masks in Bangladesh. Sheet masks, sleeping masks, and clay masks from Innisfree, COSRX, and more. Authentic K-beauty masks, COD available.',
    categorySlug: 'face-masks',
  },
  {
    step: 9,
    slug: 'lip-care',
    label: 'Lip Care',
    shortLabel: 'Lip',
    icon: '💋',
    description: 'Lip balms, lip masks, and tinted lip care that hydrate, plump, and protect. The finishing touch to your skincare routine.',
    metaDescription: 'Shop lip care products in Bangladesh. Lip balms, lip masks, and tinted lip serums for hydrated, smooth lips. Authentic products, COD available.',
    categorySlug: 'lip-balm-care',
  },
  {
    step: 10,
    slug: 'exfoliator',
    label: 'Exfoliator',
    shortLabel: 'Exfoliate',
    icon: '✨',
    description: '1–3 times per week — AHA, BHA, and PHA exfoliants resurface skin, clear clogged pores, and improve texture over time.',
    metaDescription: 'Shop exfoliators in Bangladesh. AHA, BHA, and PHA exfoliating toners, serums, and peels for smoother, clearer skin. Authentic products, COD available.',
    searchQuery: 'exfoliator AHA BHA peeling',
  },
];

export function getRoutineStepBySlug(slug?: string): RoutineStep | undefined {
  return ROUTINE_STEPS.find((s) => s.slug === slug);
}

type ListingExtras = { orderby?: 'date'|'price'|'popularity'|'rating'|'title'; order?: 'asc'|'desc'; min_price?: string; max_price?: string; stock_status?: 'instock'|'outofstock'|'onbackorder' };

export async function getRoutineListing(
  slug: string,
  page = 1,
  perPage = 24,
  extras?: ListingExtras,
): Promise<{ step: RoutineStep | null; products: WooProduct[]; total: number; totalPages: number }> {
  const step = getRoutineStepBySlug(slug);
  if (!step) return { step: null, products: [], total: 0, totalPages: 0 };

  const base = { orderby: 'popularity' as const, order: 'desc' as const, ...extras };

  if (step.categorySlug) {
    const category = await getCategoryBySlug(step.categorySlug).catch(() => null);
    if (category?.id) {
      const result = await getProducts({
        page, per_page: perPage,
        category: String(category.id),
        ...base,
      }).catch(() => ({ products: [], total: 0, totalPages: 0 }));
      if (result.products.length > 0) return { step, ...result };
    }
  }

  const result = await getProducts({
    page, per_page: perPage,
    search: step.searchQuery || step.shortLabel,
    ...base,
  }).catch(() => ({ products: [], total: 0, totalPages: 0 }));

  return { step, ...result };
}

export const ROUTINE_NAV_ITEMS = ROUTINE_STEPS.map((s) => ({
  name: `${s.step}. ${s.shortLabel}`,
  slug: s.slug,
  href: `/routine/${s.slug}`,
  description: s.description,
}));
