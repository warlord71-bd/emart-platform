import { CONCERN_DEFINITIONS } from '@/lib/concerns';

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
  { name: 'K-Beauty', slugCandidates: ['k-beauty-j-beauty', 'korean-beauty', 'korean-skincare'], fallbackSlug: 'k-beauty-j-beauty', href: '/origins?country=korea' },
  { name: 'J-Beauty', slugCandidates: ['j-beauty', 'japanese-beauty', 'japanese-skincare'], fallbackSlug: 'japanese-beauty', href: '/origins?country=japan' },
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
      { name: 'Personal Hygiene', slug: 'personal-hygiene' },
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
      { name: 'Personal Hygiene', slug: 'personal-hygiene' },
    ],
  },
];

export const MENU_CATEGORY_GROUPS = CATEGORY_NAV_SECTIONS;

export const ORIGIN_NAV_ITEMS: OriginNavItem[] = [
  { name: 'K-Beauty', slug: 'korea', country: 'korea', flag: 'KR', href: '/origins?country=korea', description: 'Korean skincare and makeup picks.' },
  { name: 'J-Beauty', slug: 'japan', country: 'japan', flag: 'JP', href: '/origins?country=japan', description: 'Japanese beauty and sunscreen finds.' },
  { name: 'USA Beauty', slug: 'usa', country: 'usa', flag: 'US', href: '/origins?country=usa' },
  { name: 'UK Beauty', slug: 'uk', country: 'uk', flag: 'UK', href: '/origins?country=uk' },
  { name: 'French Beauty', slug: 'france', country: 'france', flag: 'FR', href: '/origins?country=france' },
  { name: 'Indian Beauty', slug: 'india', country: 'india', flag: 'IN', href: '/origins?country=india' },
  { name: 'Thai Beauty', slug: 'thailand', country: 'thailand', flag: 'TH', href: '/origins?country=thailand' },
  { name: 'Other Global Beauty', slug: 'other', country: 'other', flag: 'GL', href: '/origins?country=other' },
];

const toCategoryItem = (item: MenuCategoryItem): MenuCategoryItem => ({
  ...item,
  href: item.href || `/category/${item.slug}`,
});

export const UNIFIED_BROWSE_TREE: NavigationGroup[] = [
  {
    label: 'SHOP BY CATEGORY',
    href: '/categories',
    tone: 'text-accent',
    panelClassName: 'w-[min(1040px,calc(100vw-2rem))]',
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
    panelClassName: 'w-[640px]',
    sections: [
      {
        title: 'K-Beauty & J-Beauty',
        items: ORIGIN_NAV_ITEMS.slice(0, 2),
      },
      {
        title: 'Western Beauty',
        items: ORIGIN_NAV_ITEMS.filter((item) => ['usa', 'uk', 'france'].includes(item.country)),
      },
      {
        title: 'More origins',
        items: ORIGIN_NAV_ITEMS.filter((item) => ['india', 'thailand', 'other'].includes(item.country)),
      },
    ],
  },
];

export const DRAWER_NAV_GROUPS = UNIFIED_BROWSE_TREE;
