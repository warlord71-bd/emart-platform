import { getCategoryBySlug, getProducts } from '@/lib/woocommerce';
import CatalogFilters from '@/components/product/CatalogFilters';
import ProductCard from '@/components/product/ProductCard';
import { ProductListGrid } from '@/components/product/ProductListGrid';
import CollectionPageHeader from '@/components/collection/CollectionPageHeader';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getCategorySeo } from '@/lib/seo';
import { absoluteUrl } from '@/lib/siteUrl';

interface Props {
  params: { slug: string };
  searchParams: {
    page?: string;
    price?: string;
    sort?: string;
    in_stock?: string;
    origin?: string;
    skin_type?: string;
    hair_type?: string;
    finish?: string;
  };
}

const PRICE_MAP = {
  under500: { min_price: undefined, max_price: '500' },
  '500-1000': { min_price: '500', max_price: '1000' },
  '1000-2000': { min_price: '1000', max_price: '2000' },
  '2000plus': { min_price: '2000', max_price: undefined },
} satisfies Record<string, { min_price?: string; max_price?: string }>;

const SORT_MAP = {
  newest: { orderby: 'date', order: 'desc' },
  'price-asc': { orderby: 'price', order: 'asc' },
  'price-desc': { orderby: 'price', order: 'desc' },
  popularity: { orderby: 'popularity', order: 'desc' },
  rating: { orderby: 'rating', order: 'desc' },
} satisfies Record<string, {
  orderby: 'date' | 'price' | 'popularity' | 'rating' | 'title';
  order: 'asc' | 'desc';
}>;

type PriceValue = keyof typeof PRICE_MAP;
type SortValue = keyof typeof SORT_MAP;

function getPriceParams(value?: string) {
  return value && value in PRICE_MAP ? PRICE_MAP[value as PriceValue] : undefined;
}

function getSortParams(value?: string) {
  return value && value in SORT_MAP ? SORT_MAP[value as SortValue] : SORT_MAP.popularity;
}

function getPageHref(basePath: string, searchParams: Props['searchParams'], targetPage: number) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  params.set('page', String(targetPage));
  return `${basePath}?${params.toString()}`;
}

function detectContext(category: { slug: string; name: string }): 'skincare' | 'hair' | 'makeup' | undefined {
  const value = `${category.slug} ${category.name}`.toLowerCase();

  if (/hair|shampoo|conditioner/.test(value)) return 'hair';
  if (/makeup|lipstick|mascara|foundation|finish/.test(value)) return 'makeup';
  if (/skin|cleanser|toner|serum|moisturiz|sunscreen|mask|acne|face/.test(value)) return 'skincare';

  return undefined;
}

const CATEGORY_OG_IMAGE_BY_KEY: Record<string, string> = {
  'face-cleansers': '/images/hero-products.png',
  'toners-mists': '/images/hero-products.png',
  sunscreen: '/images/home-categories/cosrx-sunscreen.jpg',
  'korean-beauty': '/images/home-categories/viral-kbeauty.jpg',
  'korean-skincare': '/images/home-categories/viral-kbeauty.jpg',
  'night-cream': '/images/home-categories/cosrx-snail-92-cream.png',
  'hair-care': '/images/home-categories/hair-care.jpg',
  shampoo: '/images/home-categories/hair-care.jpg',
  'makeup-cosmetics': '/images/home-categories/makeup-illus.png',
  makeup: '/images/home-categories/makeup-illus.png',
};

type QuickPick = { label: string; params: Record<string, string> };
const CATEGORY_QUICK_PICKS: Record<string, QuickPick[]> = {
  sunscreen: [
    { label: 'For oily skin',      params: { skin_type: 'oily' } },
    { label: 'For dry skin',       params: { skin_type: 'dry' } },
    { label: 'For sensitive skin', params: { skin_type: 'sensitive' } },
    { label: 'Under ৳500',         params: { price: 'under500' } },
    { label: '৳500–1000',          params: { price: '500-1000' } },
    { label: 'Newest',             params: { sort: 'newest' } },
  ],
  'face-cleansers': [
    { label: 'For oily skin',      params: { skin_type: 'oily' } },
    { label: 'For dry skin',       params: { skin_type: 'dry' } },
    { label: 'For sensitive skin', params: { skin_type: 'sensitive' } },
    { label: 'Under ৳500',         params: { price: 'under500' } },
    { label: 'Newest',             params: { sort: 'newest' } },
  ],
  'serums-ampoules-essences': [
    { label: 'For acne',           params: { concern: 'acne-blemish-care' } },
    { label: 'For brightening',    params: { concern: 'brightening' } },
    { label: 'For dry skin',       params: { skin_type: 'dry' } },
    { label: 'Niacinamide',        params: { ingredient: 'niacinamide' } },
    { label: 'Under ৳1000',        params: { price: '500-1000' } },
  ],
  'toners-mists': [
    { label: 'For oily skin',      params: { skin_type: 'oily' } },
    { label: 'For acne',           params: { concern: 'acne-blemish-care' } },
    { label: 'For brightening',    params: { concern: 'brightening' } },
    { label: 'Under ৳500',         params: { price: 'under500' } },
    { label: 'Newest',             params: { sort: 'newest' } },
  ],
  'moisturizer': [
    { label: 'For oily skin',      params: { skin_type: 'oily' } },
    { label: 'For dry skin',       params: { skin_type: 'dry' } },
    { label: 'For sensitive skin', params: { skin_type: 'sensitive' } },
    { label: 'Under ৳500',         params: { price: 'under500' } },
    { label: 'Newest',             params: { sort: 'newest' } },
  ],
};

const CATEGORY_SEO_OVERRIDES: Record<string, { title: string; description: string }> = {
  moisturizer: {
    title: 'Moisturizer Prices in Bangladesh | Emart',
    description:
      'Buy authentic moisturizers in Bangladesh at Emart. Korean gel creams, CeraVe, La Roche-Posay, and more. COD available, fast delivery.',
  },
  serum: {
    title: 'Serum Prices in Bangladesh | Emart',
    description:
      'Shop authentic serums in Bangladesh — brightening, anti-aging, acne, hydration. COSRX, The Ordinary, Laneige. Original imports, COD available.',
  },
  sunscreen: {
    title: 'Sunscreen Prices in Bangladesh | Emart',
    description:
      'Buy authentic sunscreen in Bangladesh. Korean SPF, La Roche-Posay, CeraVe — matte and hydrating formulas for Bangladesh\'s climate. COD available.',
  },
  toner: {
    title: 'Toner Prices in Bangladesh | Emart',
    description:
      'Shop authentic toners and essences in Bangladesh. Hydrating, exfoliating, and ferment toners from Korean and global brands. COD, fast delivery.',
  },
  'toners-mists': {
    title: 'Toner & Face Mist Price in Bangladesh | Emart',
    description:
      'Shop authentic toners, face mists and essences in Bangladesh. Hydrating, exfoliating and soothing Korean toners at Emart with COD.',
  },
  cleanser: {
    title: 'Cleanser Prices in Bangladesh | Emart',
    description:
      'Buy authentic face cleansers in Bangladesh — low-pH gels, foam, oil, and cream cleansers from COSRX, Cetaphil, CeraVe. COD available.',
  },
  'eye-cream': {
    title: 'Eye Cream Prices in Bangladesh | Emart',
    description:
      'Shop authentic eye creams in Bangladesh. Treat dark circles, puffiness, and fine lines with original COSRX, Laneige, Mizon eye care. COD available.',
  },
  'sheet-mask': {
    title: 'Sheet Mask Prices in Bangladesh | Emart',
    description:
      'Buy authentic sheet masks in Bangladesh. Korean hydrogel, sheet, and sleeping masks from Innisfree, COSRX, and more. Original imports, COD available.',
  },
  'lip-care': {
    title: 'Lip Care Prices in Bangladesh | Emart',
    description:
      'Shop authentic lip balms, lip tints, and lip care in Bangladesh. ROMAND, 3CE, Vaseline, Innisfree. Original imports, COD available nationwide.',
  },
  'body-lotion': {
    title: 'Body Lotion Prices in Bangladesh | Emart',
    description:
      'Buy authentic body lotions in Bangladesh. Vaseline, Nivea, CeraVe, The Derma Co — brightening, repair, and daily moisture. COD available.',
  },
  'hair-care': {
    title: 'Hair Care Prices in Bangladesh | Emart',
    description:
      'Shop authentic hair care in Bangladesh. Shampoos, conditioners, oils, and treatments from TRESemmé, WishCare, Pantene. Original imports, COD available.',
  },
  'soothing-gel': {
    title: 'Soothing Gel Prices in Bangladesh | Emart',
    description:
      'Buy authentic soothing gels in Bangladesh. Aloe vera, centella and calming gels from Nature Republic, COSRX, PaxMoly. Original imports, COD available.',
  },
};

const FACE_CLEANSERS_SEO = {
  title: 'Face Cleanser & Face Wash in Bangladesh | Emart',
  description: 'Shop authentic face cleansers and face wash in Bangladesh, including Korean low-pH gels, foam cleansers, micellar water and oil cleansers at Emart.',
  ogAlt: 'Face cleanser and face wash products available at Emart Bangladesh',
  image: {
    path: '/images/hero-products.png',
    width: 1200,
    height: 520,
  },
  keywords: [
    'face cleanser Bangladesh',
    'face wash Bangladesh',
    'Korean cleanser Bangladesh',
    'low pH cleanser Bangladesh',
    'foam cleanser Bangladesh',
    'micellar water Bangladesh',
    'oil cleanser Bangladesh',
    'authentic skincare Bangladesh',
    'Emart face cleanser',
  ],
};

const TONERS_MISTS_SEO = {
  title: 'Toner & Face Mist Price in Bangladesh | Emart',
  description: 'Shop authentic toners, face mists and essences in Bangladesh. Hydrating, exfoliating and soothing Korean toners at Emart with COD.',
  ogAlt: 'Toners, face mists and essences available at Emart Bangladesh',
  image: {
    path: '/images/hero-products.png',
    width: 1200,
    height: 520,
  },
  keywords: [
    'toner Bangladesh',
    'face mist Bangladesh',
    'Korean toner Bangladesh',
    'hydrating toner Bangladesh',
    'exfoliating toner Bangladesh',
    'essence toner Bangladesh',
    'authentic skincare Bangladesh',
    'Emart toner',
  ],
};

const SERUMS_AMPOULES_ESSENCES_SEO = {
  title: 'Serums, Ampoules & Essences Price in Bangladesh | Emart',
  description: 'Shop authentic serums, ampoules and essences in Bangladesh. Brightening, acne, anti-aging and hydration skincare at Emart with COD.',
  ogAlt: 'Serums, ampoules and essences available at Emart Bangladesh',
  image: {
    path: '/images/hero-products.png',
    width: 1200,
    height: 520,
  },
  keywords: [
    'serum Bangladesh',
    'ampoule Bangladesh',
    'essence Bangladesh',
    'Korean serum Bangladesh',
    'brightening serum Bangladesh',
    'niacinamide serum Bangladesh',
    'snail essence Bangladesh',
    'authentic skincare Bangladesh',
    'Emart serum',
  ],
};

function getCategoryOgImage(slug: string, name: string) {
  const value = `${slug} ${name}`.toLowerCase();
  const key = Object.keys(CATEGORY_OG_IMAGE_BY_KEY).find((candidate) => value.includes(candidate));
  return absoluteUrl(key ? CATEGORY_OG_IMAGE_BY_KEY[key] : '/images/hero-products.png');
}

function getCategoryOgImageMeta(slug: string, name: string, alt: string) {
  if (slug === 'face-cleansers') {
    return {
      url: absoluteUrl(FACE_CLEANSERS_SEO.image.path),
      width: FACE_CLEANSERS_SEO.image.width,
      height: FACE_CLEANSERS_SEO.image.height,
      alt,
    };
  }

  if (slug === 'toners-mists') {
    return {
      url: absoluteUrl(TONERS_MISTS_SEO.image.path),
      width: TONERS_MISTS_SEO.image.width,
      height: TONERS_MISTS_SEO.image.height,
      alt,
    };
  }

  if (slug === 'serums-ampoules-essences') {
    return {
      url: absoluteUrl(SERUMS_AMPOULES_ESSENCES_SEO.image.path),
      width: SERUMS_AMPOULES_ESSENCES_SEO.image.width,
      height: SERUMS_AMPOULES_ESSENCES_SEO.image.height,
      alt,
    };
  }

  return {
    url: getCategoryOgImage(slug, name),
    width: 1200,
    height: 630,
    alt,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) return { title: 'Category Not Found' };

  const seo = await getCategorySeo(params.slug, cat.name);
  const rawDescription = 'description' in cat ? ((cat as any).description as string || '') : '';

  // getCategoryIntro returns specific copy for known categories, or a generic template.
  // Prefer specific intro over both Rank Math and the generic Rank Math fallback.
  const introText = getCategoryIntro(cat.name, params.slug, rawDescription)
    .replace(/<[^>]+>/g, '').trim();
  const hasSpecificIntro = !introText.startsWith('Shop authentic');
  const description = (hasSpecificIntro
    ? introText.substring(0, 160)
    : seo.description) || introText.substring(0, 160);
  const isFaceCleansers = params.slug === 'face-cleansers';
  const isTonersMists = params.slug === 'toners-mists';
  const isSerumsAmpoulesEssences = params.slug === 'serums-ampoules-essences';
  const isSunscreen = params.slug === 'sunscreen';
  const slugOverride = CATEGORY_SEO_OVERRIDES[params.slug];
  const title = isFaceCleansers
      ? FACE_CLEANSERS_SEO.title
      : isTonersMists
        ? TONERS_MISTS_SEO.title
      : isSerumsAmpoulesEssences
        ? SERUMS_AMPOULES_ESSENCES_SEO.title
        : slugOverride?.title ?? seo.title;
  const metaDescription = isFaceCleansers
      ? FACE_CLEANSERS_SEO.description
      : isTonersMists
        ? TONERS_MISTS_SEO.description
      : isSerumsAmpoulesEssences
        ? SERUMS_AMPOULES_ESSENCES_SEO.description
        : slugOverride?.description ?? description;
  const imageAlt = isFaceCleansers
    ? FACE_CLEANSERS_SEO.ogAlt
    : isTonersMists
      ? TONERS_MISTS_SEO.ogAlt
      : isSerumsAmpoulesEssences
        ? SERUMS_AMPOULES_ESSENCES_SEO.ogAlt
      : `${cat.name} products at Emart`;
  const image = getCategoryOgImageMeta(params.slug, cat.name, imageAlt);

  return {
    title: { absolute: title },
    description: metaDescription,
    ...(isFaceCleansers ? { keywords: FACE_CLEANSERS_SEO.keywords } : {}),
    ...(isTonersMists ? { keywords: TONERS_MISTS_SEO.keywords } : {}),
    ...(isSerumsAmpoulesEssences ? { keywords: SERUMS_AMPOULES_ESSENCES_SEO.keywords } : {}),
    robots: Number(cat.count || 0) <= 0
      ? { index: false, follow: true }
      : { index: true, follow: true },
    alternates: { canonical: seo.canonical },
    openGraph: {
      title,
      description: metaDescription,
      url: seo.canonical,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: metaDescription,
      images: [image],
    },
  };
}

export const revalidate = 3600;

function getCategoryIntro(name: string, slug: string, description: string): string {
  if (description) return description.replace(/<[^>]+>/g, '').substring(0, 500);

  const intros: Record<string, string> = {
    'face-cleansers': `Shop authentic face cleansers and face wash in Bangladesh at Emart. This collection includes low-pH gel cleansers, gentle foam cleansers, micellar water, oil cleansers, and daily face wash options for oily, dry, sensitive, acne-prone, and combination skin. Choose Korean cleanser favourites and trusted global derma brands with verified product images, real prices in BDT, Cash on Delivery, and fast delivery across Bangladesh.`,
    'toners-mists': `Shop authentic toners, face mists, and essences in Bangladesh at Emart. This collection includes hydrating toners, exfoliating AHA/BHA toners, calming heartleaf toners, rice toners, milky toners, and refreshing facial mists from Korean and global skincare brands. Choose formulas for oily, dry, sensitive, acne-prone, and combination skin with checked product images, real BDT prices, Cash on Delivery, and delivery across Bangladesh.`,
    'serums-ampoules-essences': `Shop authentic serums, ampoules, and essences in Bangladesh at Emart. This best-selling skincare collection includes brightening serums, niacinamide serum, vitamin C serum, retinol serum, snail essence, centella ampoules, peptide serum, and hydrating essence options from Korean and global brands. Choose targeted formulas for acne marks, dark spots, pores, anti-aging, sensitivity, and dehydration with checked product images, real BDT prices, Cash on Delivery, and delivery across Bangladesh.`,
    sunscreen: `Protect your skin every day with our range of authentic sunscreens, available in Bangladesh with fast delivery. From lightweight Korean SPF formulas to dermatologist-recommended options like La Roche-Posay and CeraVe, we carry the best sun protection products for Bangladesh's climate. Whether you need a matte finish for oily skin or a hydrating formula for dry skin, our sunscreen collection covers all skin types. All products are 100% original, imported directly — no fakes, no copies.`,
    'korean-skincare': `Discover authentic Korean skincare in Bangladesh at Emart — your home for original K-Beauty products. From COSRX snail mucin to Some By Mi AHA BHA toner, we carry the Korean skincare brands customers ask for most. Our collection covers cleansers, toners, serums, moisturizers, and sunscreens with fast delivery across Bangladesh and Cash on Delivery available.`,
    serum: `Targeted serums to address your biggest skin concerns — from brightening and anti-aging to acne control and deep hydration. Explore authentic serums from COSRX, The Ordinary, Laneige, and more, all available in Bangladesh with fast delivery. Whether you're dealing with dark spots, fine lines, or dehydration, our serum collection has the right solution for your skin.`,
    moisturizer: `Lock in hydration and strengthen your skin barrier with our curated range of authentic moisturizers. From lightweight Korean gel creams to rich derma moisturizers like CeraVe and La Roche-Posay, find the perfect moisturizer for your skin type. All products are 100% original, available in Bangladesh with fast delivery and COD.`,
    cleanser: `Start your skincare routine right with authentic cleansers from Korea, Japan, and global derma brands. From low-pH gel cleansers to creamy foam washes, our cleanser collection suits all skin types — oily, dry, sensitive, and combination. Shop original COSRX, Cetaphil, CeraVe, and more with fast Bangladesh delivery.`,
    toner: `Hydrate, balance, and prep your skin with authentic toners and essences from the best Korean and global skincare brands. Our toner collection includes hydrating toners, exfoliating toners, and ferment essences — all 100% original and available in Bangladesh with COD.`,
    'face-mask': `Treat your skin to a weekly boost with authentic sheet masks, wash-off masks, and sleeping masks. From Korean sheet mask favourites like Innisfree to clay masks and hydrogel options, our face mask collection covers every skin need. All original products, fast Bangladesh delivery.`,
    acne: `Combat breakouts with clinically tested, authentic acne skincare products. Shop COSRX, Some By Mi, La Roche-Posay Effaclar, and other proven acne solutions available in Bangladesh. From spot treatments and BHA exfoliants to oil-control moisturizers, find your complete acne routine at Emart.`,
    'eye-care': `Brighten, depuff, and firm the delicate eye area with authentic eye creams, serums, and patches available in Bangladesh. From COSRX and Laneige to Mizon and Neogen, our eye care collection targets dark circles, puffiness, fine lines, and crow's feet. All 100% original, with fast Bangladesh delivery and COD.`,
    'hair-care': `Find authentic hair care in Bangladesh at Emart — shampoos, conditioners, hair oils, treatments, and serums from global and Korean brands. From WishCare and TRESemmé to Pantene and OGX, find the right hair product for your hair type. Original imports, COD available.`,
    'body-lotion': `Nourish, hydrate, and soften your skin with authentic body lotions from leading global and Korean brands. From Vaseline and Nivea to CeraVe and The Derma Co, our body lotion range covers every skin need — brightening, deep moisture, repair, and daily care. Original imports, available in Bangladesh with COD.`,
    shampoo: `Find the right shampoo for your hair in Bangladesh — from anti-dandruff and hair fall control to moisturising and scalp care formulas. Shop authentic shampoos from TRESemmé, Dove, Head & Shoulders, WishCare, and more. Original products, fast delivery, COD available across Bangladesh.`,
    'japanese-beauty': `Explore authentic Japanese beauty and skincare in Bangladesh at Emart. From Hada Labo and Shiseido to Rohto and Fancl, our J-Beauty collection brings Japan's best skincare innovations — minimalist formulas, deep hydration, and time-tested ingredients — straight to your door with fast delivery and COD.`,
    'korean-beauty': `Discover authentic Korean skincare and beauty in Bangladesh at Emart. Shop K-Beauty essentials from COSRX, Some By Mi, Beauty of Joseon, ANUA, SKIN1004, and 100+ more Korean brands. From glass skin serums to cushion compacts and SPF sticks, find genuine Korean beauty products with fast Bangladesh delivery and COD.`,
    'lip-balm-care': `Shop authentic lip balm and lip care in Bangladesh at Emart. Hydrating lip balms, tinted lip treatments, and overnight lip masks from Vaseline, Innisfree, ROMAND, Laneige, and more. Original imports, fast delivery, COD available.`,
    'lip-care': `Shop authentic lip care in Bangladesh at Emart — lip balms, lip tints, lip sleeping masks, and lip scrubs from trusted Korean and global brands. ROMAND, 3CE, Laneige, Vaseline, Innisfree, and more. Original imports, fast delivery, COD available nationwide.`,
    lip: `Shop authentic lip care, lip balms, lip tints, and lipsticks in Bangladesh. From ROMAND and 3CE to Vaseline and Innisfree, our lip collection covers colour, moisture, and care. Original Korean, Japanese, and global lip products available with fast delivery and COD across Bangladesh.`,
    'body-wash': `Cleanse and refresh with authentic body washes and shower gels in Bangladesh. From The Ordinary and CeraVe to Dove and Cetaphil, our body wash range includes hydrating, exfoliating, brightening, and sensitive skin formulas. Original imports, fast delivery, COD available.`,
    'makeup-cosmetics': `Shop authentic makeup and cosmetics in Bangladesh at Emart. From Korean cushion compacts and lip tints to global brands like M.A.C, Essence, and NYX, our makeup collection covers foundation, eyes, lips, and face products. 100% original imports with fast Bangladesh delivery and Cash on Delivery available.`,
    'bath-body': `Discover authentic bath and body care products in Bangladesh at Emart. Shop body lotions, body washes, scrubs, hand creams, and personal care essentials from global and Korean brands — Vaseline, Dove, Nivea, CeraVe, and more. Original imports, fast nationwide delivery, COD available.`,
    'soothing-gel': `Shop authentic soothing gels in Bangladesh at Emart — aloe vera gels, centella asiatica gels, and calming formulas from Korean and global brands. From Nature Republic and PaxMoly to COSRX and Weleda, our soothing gel collection suits sensitive, acne-prone, and sun-exposed skin. Original imports, fast delivery, COD available.`,
    'eye-cream': `Brighten, depuff, and firm the delicate eye area with authentic eye creams in Bangladesh. Our eye cream range covers dark circles, puffiness, fine lines, and crow's feet — with original products from COSRX, Laneige, Mizon, Neogen, and more. All 100% authentic imports, fast Bangladesh delivery, COD available.`,
    'sheet-mask': `Treat your skin to a weekly boost with authentic sheet masks in Bangladesh. From Korean hydrogel and essence sheet masks to sleeping masks and overnight packs — Innisfree, COSRX, Leaders, and more. All original imports, fast Bangladesh delivery, Cash on Delivery available.`,
  };

  const key = Object.keys(intros).find(k => slug.includes(k) || name.toLowerCase().includes(k));
  if (key) return intros[key];

  return `Shop authentic ${name} products at Emart Skincare Bangladesh. We carry original ${name} products from Korea, Japan, and other global beauty brands, delivered across Bangladesh with careful support and Cash on Delivery available.`;
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const page = parseInt(searchParams.page || '1');
  const priceParams = getPriceParams(searchParams.price);
  const sortParams = getSortParams(searchParams.sort);
  const { products, total, totalPages } = await getProducts({
    category: category.id.toString(),
    per_page: 24,
    page,
    ...sortParams,
    ...priceParams,
    stock_status: searchParams.in_stock === '1' ? 'instock' : undefined,
  });

  const rawDescription = 'description' in category ? (category as any).description || '' : '';
  const introText = getCategoryIntro(category.name, params.slug, rawDescription);
  const isSunscreen = params.slug === 'sunscreen';
  const quickPicks = CATEGORY_QUICK_PICKS[params.slug] ?? [];
  const showSkinType = quickPicks.some((p) => 'skin_type' in p.params);
  const showConcern  = quickPicks.some((p) => 'concern' in p.params);
  const showIngredient = quickPicks.some((p) => 'ingredient' in p.params);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://e-mart.com.bd' },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://e-mart.com.bd/shop' },
      { '@type': 'ListItem', position: 3, name: category.name, item: `https://e-mart.com.bd/category/${category.slug}` },
    ],
  };

  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} — Emart`,
    description: introText.substring(0, 200),
    url: `https://e-mart.com.bd/category/${category.slug}`,
    primaryImageOfPage: category.slug === 'face-cleansers'
      ? {
        '@type': 'ImageObject',
        url: absoluteUrl(FACE_CLEANSERS_SEO.image.path),
        width: FACE_CLEANSERS_SEO.image.width,
        height: FACE_CLEANSERS_SEO.image.height,
        caption: FACE_CLEANSERS_SEO.ogAlt,
      }
      : category.slug === 'toners-mists'
        ? {
          '@type': 'ImageObject',
          url: absoluteUrl(TONERS_MISTS_SEO.image.path),
          width: TONERS_MISTS_SEO.image.width,
          height: TONERS_MISTS_SEO.image.height,
          caption: TONERS_MISTS_SEO.ogAlt,
        }
        : category.slug === 'serums-ampoules-essences'
          ? {
            '@type': 'ImageObject',
            url: absoluteUrl(SERUMS_AMPOULES_ESSENCES_SEO.image.path),
            width: SERUMS_AMPOULES_ESSENCES_SEO.image.width,
            height: SERUMS_AMPOULES_ESSENCES_SEO.image.height,
            caption: SERUMS_AMPOULES_ESSENCES_SEO.ogAlt,
          }
          : undefined,
    breadcrumb: breadcrumbJsonLd,
  };

  const itemListJsonLd = products.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category.name,
    url: `https://e-mart.com.bd/category/${category.slug}`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: (page - 1) * 24 + i + 1,
      name: p.name,
      url: `https://e-mart.com.bd/shop/${p.slug}`,
      image: p.images?.[0]?.src || undefined,
    })),
  } : null;

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />
      {itemListJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />}

      <div className="mx-auto max-w-7xl px-4 py-8">

        <CollectionPageHeader
          type="category"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/shop' },
            { label: category.name },
          ]}
          title={category.name}
          description={introText}
          productCount={total}
        />

        <CatalogFilters
          basePath={`/category/${params.slug}`}
          searchParams={searchParams}
          resultCount={products.length}
          totalCount={total}
          defaultSort="popularity"
          variant="mobile"
          showSkinType={showSkinType}
          showConcern={showConcern}
          showIngredient={showIngredient}
        />

        <div className="flex gap-6">
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <CatalogFilters
              basePath={`/category/${params.slug}`}
              searchParams={searchParams}
              resultCount={products.length}
              totalCount={total}
              defaultSort="popularity"
              variant="desktop"
              showSkinType={showSkinType}
              showConcern={showConcern}
              showIngredient={showIngredient}
            />
          </aside>

          <div className="flex-1">
            {/* PRODUCT GRID */}
            {products.length > 0 ? (
              <>
                <ProductListGrid>
                  {products.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      priority={i === 0 && page === 1}
                      imageAlt={params.slug === 'face-cleansers'
                        ? `${p.name} face cleanser or face wash price in Bangladesh at Emart`
                        : params.slug === 'toners-mists'
                          ? `${p.name} toner, face mist or essence price in Bangladesh at Emart`
                          : params.slug === 'serums-ampoules-essences'
                            ? `${p.name} serum, ampoule or essence price in Bangladesh at Emart`
                          : undefined}
                    />
                  ))}
                </ProductListGrid>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    {page > 1 && (
                      <Link
                        href={getPageHref(`/category/${params.slug}`, searchParams, page - 1)}
                        className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
                      >
                        Previous
                      </Link>
                    )}
                    <span className="rounded-xl border border-hairline bg-bg-alt px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
                    {page < totalPages && (
                      <Link
                        href={getPageHref(`/category/${params.slug}`, searchParams, page + 1)}
                        className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                )}

                {/* CATEGORY BUYING GUIDE */}
                <details className="mt-14 rounded-2xl border border-hairline bg-card p-5 shadow-card">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-ink marker:hidden">
                    Buying guide for {category.name}
                    <span className="ml-2 text-accent">Read more</span>
                  </summary>
                  {isSunscreen ? (
                    <div className="mt-4 grid gap-5 text-sm leading-relaxed text-muted sm:grid-cols-2">
                      <div>
                        <h2 className="mb-1 text-sm font-semibold text-ink">Why You Need Sunscreen Every Day in Bangladesh</h2>
                        <p>Bangladesh sits close to the equator, meaning UV rays are strong year-round — not just in summer. Daily sun exposure without a broad-spectrum SPF 50+ sunscreen accelerates skin ageing, causes dark spots, and raises the risk of sunburn even on cloudy days. Applying sunscreen as the last step of your morning routine takes 30 seconds and is the single most effective anti-ageing step you can take.</p>
                      </div>
                      <div>
                        <h2 className="mb-1 text-sm font-semibold text-ink">SPF, PA Rating &amp; Broad-Spectrum — What They Mean</h2>
                        <p>SPF measures protection against UVB rays (the ones that cause sunburn). PA++++ indicates very strong protection against UVA rays (the ones that cause ageing and penetrate clouds). Look for &quot;broad-spectrum&quot; on the label — it means both UVA and UVB are covered. For Bangladesh&apos;s high UV index, choose minimum SPF 50 PA+++ or higher outdoors.</p>
                      </div>
                      <div>
                        <h2 className="mb-1 text-sm font-semibold text-ink">How to Apply Sunscreen for Full Protection</h2>
                        <p>Apply sunscreen generously 15 minutes before going outdoors — most people use too little and get only 20–40% of the stated SPF. Reapply every 2 hours when outdoors, and after swimming or sweating. Even water-resistant formulas need reapplication. For daily indoor use one morning application is usually enough, but always reapply if you spend time in direct sunlight or near windows.</p>
                      </div>
                      <div>
                        <h2 className="mb-1 text-sm font-semibold text-ink">Choosing the Right Sunscreen for Your Skin Type</h2>
                        <p>Oily and acne-prone skin does best with lightweight gel or fluid formulas — Korean sunscreens like COSRX, Beauty of Joseon, and ISNTREE offer non-greasy options that don&apos;t clog pores. Dry skin benefits from hydrating cream sunscreens. Sensitive skin can rely on mineral or hybrid formulas with zinc oxide. All sunscreens at Emart are 100% authentic imports — no fakes, no expired stock.</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
                      Emart is Bangladesh&apos;s trusted source for authentic {category.name} products. Every product is imported directly from the brand or authorised distributors — no counterfeits, no grey market. We offer Cash on Delivery (COD) across Bangladesh, with Dhaka 1–2 days and outside Dhaka 3–5 days. Final delivery fee is shown at checkout.
                    </p>
                  )}
                </details>
              </>
            ) : (
              <div className="py-20 text-center text-muted-2">
                <p className="text-ink">No products in this category yet.</p>
                <Link href="/shop" className="mt-2 block text-accent hover:underline">Browse All Products</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
