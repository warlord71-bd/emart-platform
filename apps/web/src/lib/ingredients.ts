import { getProducts, type WooProduct } from '@/lib/woocommerce';
import { absoluteUrl } from '@/lib/siteUrl';

export interface IngredientDefinition {
  slug: string;
  label: string;
  icon: string;
  description: string;
  metaDescription: string;
  searchKeywords: string[];
}

export const INGREDIENT_DEFINITIONS: IngredientDefinition[] = [
  {
    slug: 'niacinamide',
    label: 'Niacinamide',
    icon: '✦',
    description: 'Vitamin B3 that brightens, controls oil, minimises pores, and strengthens the skin barrier.',
    metaDescription: 'Shop authentic niacinamide skincare in Bangladesh. Serums, toners, and creams with niacinamide for brightening, pore control, and oil balance — all with COD.',
    searchKeywords: ['niacinamide', 'niacin'],
  },
  {
    slug: 'hyaluronic-acid',
    label: 'Hyaluronic Acid',
    icon: '💧',
    description: 'Draws and locks in deep moisture — essential for plump, hydrated skin at every step.',
    metaDescription: 'Shop hyaluronic acid skincare products in Bangladesh. Serums, moisturisers, and essences with hyaluronic acid for deep hydration — fast delivery, COD available.',
    searchKeywords: ['hyaluronic acid', 'sodium hyaluronate'],
  },
  {
    slug: 'retinol',
    label: 'Retinol',
    icon: '⚡',
    description: 'Gold-standard anti-aging ingredient that accelerates cell turnover, fades fine lines, and smooths texture.',
    metaDescription: 'Shop retinol skincare in Bangladesh. Original retinol serums and creams from COSRX, The Ordinary, and more — fast delivery, COD available.',
    searchKeywords: ['retinol', 'retinal', 'retinoid'],
  },
  {
    slug: 'vitamin-c',
    label: 'Vitamin C',
    icon: '🍊',
    description: 'Antioxidant powerhouse for brightening dark spots, evening skin tone, and protecting against environmental damage.',
    metaDescription: 'Shop Vitamin C serums and skincare in Bangladesh. Authentic brightening products with Vitamin C for glowing, even-toned skin — COD and fast delivery.',
    searchKeywords: ['vitamin c', 'vitamin-c', 'ascorbic acid', 'ascorbyl'],
  },
  {
    slug: 'centella',
    label: 'Centella & CICA',
    icon: '🌿',
    description: 'Calming herb used in K-beauty to soothe redness, accelerate healing, and reinforce the skin barrier.',
    metaDescription: 'Shop centella and CICA skincare in Bangladesh. Soothing creams, ampoules, and toners with centella asiatica for sensitive and acne-prone skin — COD available.',
    searchKeywords: ['centella', 'cica', 'madecassoside', 'madecassica', 'tiger grass'],
  },
  {
    slug: 'snail-mucin',
    label: 'Snail Mucin',
    icon: '🐌',
    description: 'K-beauty staple rich in glycoproteins and hyaluronic acid — repairs, hydrates, and calms sensitised skin.',
    metaDescription: 'Shop snail mucin skincare in Bangladesh. Authentic COSRX snail mucin essence, serum, and cream — original imported products with COD.',
    searchKeywords: ['snail mucin', 'snail secretion', 'mucin'],
  },
  {
    slug: 'ceramide',
    label: 'Ceramide',
    icon: '🛡️',
    description: 'Lipids naturally found in skin that lock in moisture and defend against environmental stressors.',
    metaDescription: 'Shop ceramide skincare in Bangladesh. Barrier-repair moisturisers, toners, and serums with ceramide from CeraVe, COSRX, and more — COD available.',
    searchKeywords: ['ceramide'],
  },
  {
    slug: 'bha-salicylic-acid',
    label: 'BHA / Salicylic Acid',
    icon: '🔬',
    description: 'Oil-soluble exfoliant that clears clogged pores, reduces blackheads, and controls breakouts.',
    metaDescription: 'Shop BHA and salicylic acid skincare in Bangladesh. Authentic pore-clearing toners, serums, and cleansers — fast delivery, COD available.',
    searchKeywords: ['bha', 'salicylic acid', 'betaine salicylate'],
  },
  {
    slug: 'aha',
    label: 'AHA',
    icon: '✨',
    description: 'Water-soluble exfoliants (glycolic, lactic, mandelic) that resurface skin, fade pigmentation, and improve texture.',
    metaDescription: 'Shop AHA exfoliant skincare in Bangladesh. Glycolic acid toners, lactic acid serums, and peeling solutions — original products, COD available.',
    searchKeywords: ['aha', 'glycolic acid', 'lactic acid', 'mandelic acid'],
  },
  {
    slug: 'propolis',
    label: 'Propolis',
    icon: '🍯',
    description: 'Bee-derived antioxidant rich in flavonoids — calms inflammation, speeds healing, and adds a natural glow.',
    metaDescription: 'Shop propolis skincare in Bangladesh. Authentic propolis ampoules, essences, and creams from Beauty of Joseon and more — COD available.',
    searchKeywords: ['propolis'],
  },
  {
    slug: 'peptide',
    label: 'Peptides',
    icon: '🧬',
    description: 'Amino acid chains that signal skin to produce more collagen — firming, lifting, and anti-wrinkle.',
    metaDescription: 'Shop peptide skincare in Bangladesh. Anti-aging serums and moisturisers with peptides for firmer, smoother skin — original products, COD available.',
    searchKeywords: ['peptide', 'matrixyl'],
  },
  {
    slug: 'ginseng',
    label: 'Ginseng',
    icon: '🌱',
    description: 'Traditional Korean botanical with antioxidant and brightening properties — a staple in hanbang K-beauty.',
    metaDescription: 'Shop ginseng skincare in Bangladesh. Authentic Korean ginseng serums, creams, and essences from Beauty of Joseon and more — COD available.',
    searchKeywords: ['ginseng', 'ginsenoside', 'red ginseng'],
  },
  {
    slug: 'bakuchiol',
    label: 'Bakuchiol',
    icon: '🌸',
    description: 'Plant-based retinol alternative — anti-aging benefits without the irritation, safe for sensitive skin.',
    metaDescription: 'Shop bakuchiol skincare in Bangladesh. Gentle retinol-alternative serums and creams with bakuchiol — original products, COD available.',
    searchKeywords: ['bakuchiol'],
  },
  {
    slug: 'mugwort',
    label: 'Mugwort',
    icon: '🍃',
    description: 'Calming Korean herb rich in vitamins and antioxidants — soothes sensitive and acne-prone skin.',
    metaDescription: 'Shop mugwort skincare in Bangladesh. Soothing mugwort toners, serums, and masks for sensitive skin — original K-beauty products, COD available.',
    searchKeywords: ['mugwort', 'artemisia'],
  },
  {
    slug: 'collagen',
    label: 'Collagen',
    icon: '💎',
    description: 'Structural protein that plumps, firms, and restores elasticity — popular in K-beauty for mature skin.',
    metaDescription: 'Shop collagen skincare in Bangladesh. Firming and plumping collagen serums, creams, and masks — authentic products with COD and fast delivery.',
    searchKeywords: ['collagen'],
  },
];

export function getIngredientBySlug(slug?: string): IngredientDefinition | undefined {
  return INGREDIENT_DEFINITIONS.find((i) => i.slug === slug);
}

export function getIngredientHref(slug: string): string {
  return `/ingredients/${slug}`;
}

export async function getIngredientListing(
  slug: string,
  page = 1,
  perPage = 24,
): Promise<{ ingredient: IngredientDefinition | null; products: WooProduct[]; total: number; totalPages: number }> {
  const ingredient = getIngredientBySlug(slug);
  if (!ingredient) return { ingredient: null, products: [], total: 0, totalPages: 0 };

  const results = await getProducts({
    page,
    per_page: perPage,
    search: ingredient.searchKeywords[0],
    orderby: 'popularity',
    order: 'desc',
  }).catch(() => ({ products: [], total: 0, totalPages: 0 }));

  return { ingredient, ...results };
}

export const INGREDIENT_NAV_ITEMS = INGREDIENT_DEFINITIONS.map((i) => ({
  name: i.label,
  slug: i.slug,
  href: getIngredientHref(i.slug),
  description: i.description,
}));
