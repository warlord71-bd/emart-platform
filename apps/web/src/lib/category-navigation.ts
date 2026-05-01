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
}

export interface MenuCategoryGroup {
  title: string;
  description: string;
  anchor: string;
  items: MenuCategoryItem[];
}

export const TOP_CATEGORY_IMAGE_OVERRIDES: Record<string, string> = {
  'k-beauty-j-beauty': '/images/home-categories/viral-kbeauty.jpg',
  'night-cream': '/images/home-categories/cosrx-snail-92-cream.png',
  'sunscreen': '/images/home-categories/cosrx-sunscreen.jpg',
  'hair-care': '/images/home-categories/hair-care.jpg',
};

export const HOME_TOP_CATEGORY_ORDER: TopCategoryConfig[] = [
  { name: 'Viral Kbeauty', slugCandidates: ['k-beauty-j-beauty', 'korean-beauty'], fallbackSlug: 'k-beauty-j-beauty' },
  { name: 'Serum & Ampoule', slugCandidates: ['serums-ampoules-essences', 'toners-mists'], fallbackSlug: 'serums-ampoules-essences' },
  { name: 'Moisturizers', slugCandidates: ['night-cream', 'moisturizer', 'cream-moisturizers'], fallbackSlug: 'night-cream' },
  { name: 'Sunscreen', slugCandidates: ['sunscreen'], fallbackSlug: 'sunscreen' },
  { name: 'Cleansers', slugCandidates: ['face-cleansers'], fallbackSlug: 'face-cleansers' },
  { name: 'Hair Care', slugCandidates: ['hair-care'], fallbackSlug: 'hair-care' },
];

const concernCategoryItems = Array.from(
  new Map(
    CONCERN_DEFINITIONS
      .filter((concern) => concern.categorySlug)
      .map((concern) => [
        concern.categorySlug!,
        {
          name: concern.label,
          slug: concern.categorySlug!,
        },
      ])
  ).values()
);

export const MENU_CATEGORY_GROUPS: MenuCategoryGroup[] = [
  {
    title: 'Skincare',
    description: 'Daily face care, treatment steps, and sun protection.',
    anchor: 'skincare',
    items: [
      { name: 'Face Cleansers', slug: 'face-cleansers' },
      { name: 'Toners & Mists', slug: 'toners-mists' },
      { name: 'Serums & Ampoules', slug: 'serums-ampoules-essences' },
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
    title: 'Shop by Concern',
    description: 'Browse by skin goals and common skincare concerns.',
    anchor: 'concern',
    items: concernCategoryItems,
  },
];
