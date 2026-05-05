import { CONCERN_DEFINITIONS } from '@/lib/concerns';
import { ORIGIN_DEFINITIONS } from '@/lib/origin-navigation';

export interface TopCategoryConfig {
  name: string;
  slug?: string;
  slugCandidates?: string[];
  fallbackSlug?: string;
  href?: string;
}

export interface MenuCategoryItem {
  name: string;
  slug: string;
  href?: string;
  description?: string;
}

export interface MenuCategoryGroup {
  title: string;
  description: string;
  anchor: string;
  items: MenuCategoryItem[];
}

export interface NavigationSection {
  title: string;
  items: MenuCategoryItem[];
}

export interface NavigationGroup {
  label: string;
  href: string;
  tone: string;
  panelClassName: string;
  summary?: string;
  ctaLabel?: string;
  sections: NavigationSection[];
}

export interface OriginNavItem extends MenuCategoryItem {
  country: string;
  flag: string;
}

export const TOP_CATEGORY_IMAGE_OVERRIDES: Record<string, string> = {
  'k-beauty-j-beauty': '/images/home-categories/viral-kbeauty.jpg',
  'night-cream': '/images/home-categories/cosrx-snail-92-cream.png',
  'sunscreen': '/images/home-categories/cosrx-sunscreen.jpg',
  'hair-care': '/images/home-categories/hair-care.jpg',
};

export const HOME_TOP_CATEGORY_ORDER: TopCategoryConfig[] = [
  { name: 'K-Beauty', slugCandidates: ['korean-beauty', 'k-beauty-j-beauty', 'korean-skincare'], fallbackSlug: 'korean-beauty' },
  { name: 'J-Beauty', slugCandidates: ['japanese-beauty', 'j-beauty', 'japanese-skincare'], fallbackSlug: 'japanese-beauty' },
  { name: 'Serum & Ampoule', slugCandidates: ['serums-ampoules-essences', 'toners-mists'], fallbackSlug: 'serums-ampoules-essences' },
  { name: 'Moisturizers', slugCandidates: ['night-cream', 'moisturizer', 'cream-moisturizers'], fallbackSlug: 'night-cream' },
  { name: 'Sunscreen', slugCandidates: ['sunscreen'], fallbackSlug: 'sunscreen' },
  { name: 'Cleansers', slugCandidates: ['face-cleansers'], fallbackSlug: 'face-cleansers' },
];

export const CONCERN_NAV_ITEMS: MenuCategoryItem[] = CONCERN_DEFINITIONS.map((concern) => ({
  name: concern.label,
  slug: concern.slug,
  href: `/concerns?concern=${encodeURIComponent(concern.slug)}`,
  description: concern.description,
}));

export const CATEGORY_NAV_SECTIONS: MenuCategoryGroup[] = [
  {
    title: 'Skincare',
    description: 'Daily face care, treatment steps, and sun protection.',
    anchor: 'skincare',
    items: [
      { name: 'Face Cleansers', slug: 'face-cleansers' },
      { name: 'Toners & Mists', slug: 'toners-mists' },
      { name: 'Serum & Ampoule', slug: 'serums-ampoules-essences' },
      { name: 'Sunscreen', slug: 'sunscreen' },
      { name: 'Eye Care', slug: 'eye-care' },
      { name: 'Masks', slug: 'face-masks' },
    ],
  },
  {
    title: 'Hair Care',
    description: 'Shampoo, conditioner, oils, styling, and repair treatments.',
    anchor: 'hair-care',
    items: [
      { name: 'Shampoo', slug: 'shampoos' },
      { name: 'Conditioner', slug: 'hair-conditioners' },
      { name: 'Treatments & Serums', slug: 'hair-treatments' },
      { name: 'Hair Oil', slug: 'hair-oil' },
      { name: 'Hair Styling', slug: 'hair-styling-products' },
    ],
  },
  {
    title: 'Body Care',
    description: 'Body care, fragrance, and personal hygiene essentials.',
    anchor: 'body-care',
    items: [
      { name: 'Body Lotion', slug: 'body-lotion' },
      { name: 'Body Wash', slug: 'body-wash' },
      { name: 'Fragrance', slug: 'fragrances' },
      { name: 'Hand Care', slug: 'hand-care' },
      { name: 'Body Oil', slug: 'body-oil' },
    ],
  },
  {
    title: 'Makeup',
    description: 'Face base, eye looks, lip color, and everyday cosmetics.',
    anchor: 'makeup',
    items: [
      { name: 'Foundation & Primer', slug: 'foundation' },
      { name: 'Lips', slug: 'lips' },
      { name: 'Eyes', slug: 'eyes' },
      { name: 'Face Makeup', slug: 'face-makeup' },
    ],
  },
  {
    title: 'Family & Personal',
    description: 'Men, mom and baby, and everyday personal-care routes.',
    anchor: 'family-personal',
    items: [
      { name: "Men's Care", slug: 'mens-care', href: '/search?q=mens+care' },
      { name: 'Mom & Baby', slug: 'mother-baby-care' },
      { name: 'Baby Skincare', slug: 'baby-skincare' },
      { name: 'Baby Bath & Wash', slug: 'baby-bath-wash' },
      { name: 'Diapers & Wipes', slug: 'diapers-wipes' },
      { name: 'Personal Hygiene', slug: 'personal-hygiene' },
    ],
  },
];

export const MENU_CATEGORY_GROUPS = CATEGORY_NAV_SECTIONS;

export const ORIGIN_NAV_ITEMS: OriginNavItem[] = [
  ...ORIGIN_DEFINITIONS.map((origin) => ({
    name: origin.label,
    slug: origin.country,
    country: origin.country,
    flag: origin.flag,
    href: `/origins?country=${origin.country}`,
    description: origin.desc,
  })),
];

export const BRAND_NAV_ITEMS: MenuCategoryItem[] = [
  { name: 'Dabo', slug: 'dabo', href: '/brands/dabo' },
  { name: 'COSRX', slug: 'cosrx', href: '/brands/cosrx' },
  { name: 'CeraVe', slug: 'cerave', href: '/brands/cerave' },
  { name: 'Some By Mi', slug: 'some-by-mi', href: '/brands/some-by-mi' },
  { name: 'SKIN1004', slug: 'skin1004', href: '/brands/skin1004' },
  { name: 'Neutrogena', slug: 'neutrogena', href: '/brands/neutrogena' },
  { name: 'Innisfree', slug: 'innisfree', href: '/brands/innisfree' },
  { name: 'Cos De Baha', slug: 'cos-de-baha', href: '/brands/cos-de-baha' },
  { name: 'Heimish', slug: 'heimish', href: '/brands/heimish' },
  { name: 'APLB', slug: 'aplb', href: '/brands/aplb' },
  { name: 'Anua', slug: 'anua', href: '/brands/anua' },
  { name: 'Purito Seoul', slug: 'purito-seoul', href: '/brands/purito-seoul' },
];

const toCategoryItem = (item: MenuCategoryItem): MenuCategoryItem => ({
  ...item,
  href: item.href || `/category/${item.slug}`,
});

const chunkItems = <T,>(items: T[], columns: number): T[][] => {
  const size = Math.ceil(items.length / columns);
  const chunks: T[][] = [];
  for (let index = 0; index < columns; index += 1) {
    chunks.push(items.slice(index * size, (index + 1) * size));
  }
  return chunks.filter((chunk) => chunk.length > 0);
};

export const UNIFIED_BROWSE_TREE: NavigationGroup[] = [
  {
    label: 'SHOP BY CATEGORY',
    href: '/categories',
    tone: 'text-accent',
    panelClassName: 'w-[min(1040px,calc(100vw-2rem))]',
    summary: 'Browse by product type.',
    ctaLabel: 'All categories',
    sections: CATEGORY_NAV_SECTIONS.map((section) => ({
      title: section.title,
      items: section.items.map(toCategoryItem),
    })),
  },
  {
    label: 'SHOP BY CONCERN',
    href: '/concerns',
    tone: 'text-warning',
    panelClassName: 'w-[700px]',
    summary: 'Shop by skin goals.',
    ctaLabel: 'All concerns',
    sections: [
      {
        title: 'Skin goals',
        items: CONCERN_NAV_ITEMS.slice(0, 5),
      },
      {
        title: 'More concerns',
        items: CONCERN_NAV_ITEMS.slice(5),
      },
    ],
  },
  {
    label: 'SHOP BY ORIGIN',
    href: '/origins',
    tone: 'text-brass',
    panelClassName: 'w-[780px]',
    summary: 'Shop by country of origin.',
    ctaLabel: 'All origins',
    sections: chunkItems(ORIGIN_NAV_ITEMS, 4).map((items) => ({
      title: '',
      items,
    })),
  },
  {
    label: 'BRANDS',
    href: '/brands',
    tone: 'text-cyan-600',
    panelClassName: 'w-[560px]',
    summary: 'Popular stocked brands.',
    ctaLabel: 'All brands',
    sections: [
      {
        title: 'Popular brands',
        items: BRAND_NAV_ITEMS.slice(0, 6),
      },
      {
        title: 'More brands',
        items: BRAND_NAV_ITEMS.slice(6),
      },
    ],
  },
];

export const DRAWER_NAV_GROUPS = UNIFIED_BROWSE_TREE;
