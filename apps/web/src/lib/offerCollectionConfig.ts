export type OfferCollectionSlug =
  | 'bogo'
  | 'eid-offer'
  | 'clearance-sale'
  | 'combo'
  | 'free-delivery'
  | 'coupon';

export interface OfferCollectionConfig {
  slug: OfferCollectionSlug;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  hint: string;
  icon: 'gift' | 'moon' | 'tag' | 'boxes' | 'truck' | 'ticket';
  accent: string;
}

export const OFFER_COLLECTIONS: OfferCollectionConfig[] = [
  {
    slug: 'bogo',
    label: 'BoGo',
    eyebrow: 'Buy more, save more',
    title: 'Buy One, Get One Picks',
    description: 'Real BOGO and bundle-style products, topped up with strong combo picks while the catalog grows.',
    href: '/offers/bogo',
    hint: 'BOGO and combo-ready buys',
    icon: 'gift',
    accent: 'from-[#fff2f5] via-[#fff8fb] to-[#f9f1ff]',
  },
  {
    slug: 'eid-offer',
    label: 'Eid Offer',
    eyebrow: 'Seasonal edit',
    title: 'Eid Offer Picks',
    description: 'Seasonal sale-ready beauty picks curated from popular, featured, and promotional products.',
    href: '/offers/eid-offer',
    hint: 'Seasonal sale-ready curation',
    icon: 'moon',
    accent: 'from-[#f5f0ff] via-[#faf7ff] to-[#f4ecff]',
  },
  {
    slug: 'clearance-sale',
    label: 'Clearance Sale',
    eyebrow: 'Best markdowns',
    title: 'Clearance Sale',
    description: 'Deeper discount products sorted toward the strongest markdowns first.',
    href: '/offers/clearance-sale',
    hint: 'Sorted by deeper discounts',
    icon: 'tag',
    accent: 'from-[#fff4eb] via-[#fff8f1] to-[#fff1e6]',
  },
  {
    slug: 'combo',
    label: 'Combo',
    eyebrow: 'Better together',
    title: 'Combo Offers',
    description: 'Bundle and combo products collected into one place for easier browsing.',
    href: '/offers/combo',
    hint: 'Bundle and multi-item sets',
    icon: 'boxes',
    accent: 'from-[#eef7ff] via-[#f6fbff] to-[#edf5ff]',
  },
  {
    slug: 'free-delivery',
    label: 'Free Delivery',
    eyebrow: 'Big basket edit',
    title: 'Free Delivery Collection',
    description: 'Curated picks centered on products priced for free-delivery baskets, with combo offers above ৳3,000 kept here.',
    href: '/offers/free-delivery',
    hint: 'Built around ৳3,000+ carts',
    icon: 'truck',
    accent: 'from-[#eefaf3] via-[#f8fdf9] to-[#edf8f4]',
  },
  {
    slug: 'coupon',
    label: 'Coupon',
    eyebrow: 'Code-ready deals',
    title: 'Coupon-Ready Picks',
    description: 'A placeholder deal collection built from active sale products until more coupon-specific products are added later.',
    href: '/offers/coupon',
    hint: 'Sale picks while coupon range grows',
    icon: 'ticket',
    accent: 'from-[#fff8e8] via-[#fffdf5] to-[#fff4d6]',
  },
];
