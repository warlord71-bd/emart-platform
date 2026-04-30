import Image from 'next/image';
import type { Metadata } from 'next';
import { getCategoryBySlug, getProducts, type WooProduct } from '@/lib/woocommerce';
import { getConcernListing } from '@/lib/concerns';
import SkinQuizClient from './SkinQuizClient';
import type { SkinConcern, SkinQuizProduct, SkinQuizProductPools } from '@/lib/skinQuiz';
import { absoluteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: 'Skincare Quiz',
  description: 'Take Emart’s skincare quiz to get a Bangladesh-friendly routine matched to your skin, climate, and budget, then receive it by email.',
  alternates: {
    canonical: absoluteUrl('/skin-quiz'),
  },
  openGraph: {
    title: 'Skincare Quiz | Emart',
    description: 'Find a routine that fits Dhaka heat, AC office days, dark spots, breakouts, and real skincare budgets in Bangladesh.',
    url: absoluteUrl('/skin-quiz'),
    images: [
      {
        url: 'https://e-mart.com.bd/images/hero-products.png',
        width: 1600,
        height: 900,
        alt: 'Emart skincare quiz and routine builder',
      },
    ],
  },
};

export const revalidate = 3600;

function toQuizProduct(product: WooProduct): SkinQuizProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    regular_price: product.regular_price,
    sale_price: product.sale_price,
    on_sale: product.on_sale,
    purchasable: product.purchasable,
    stock_status: product.stock_status,
    featured: product.featured,
    average_rating: product.average_rating,
    rating_count: product.rating_count,
    short_description: product.short_description,
    images: (product.images || []).slice(0, 1).map((image) => ({
      src: image.src,
      alt: image.alt,
      name: image.name,
    })),
    categories: (product.categories || []).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
  };
}

async function getProductsForCategorySlugCandidates(slugCandidates: string[], perPage = 10) {
  for (const slug of slugCandidates) {
    const category = await getCategoryBySlug(slug);
    if (!category?.id) continue;

    const listing = await getProducts({
      category: String(category.id),
      per_page: perPage,
      orderby: 'popularity',
      order: 'desc',
      stock_status: 'instock',
    });

    if (listing.products.length > 0) {
      return listing.products.map(toQuizProduct);
    }
  }

  return [] as SkinQuizProduct[];
}

async function getSkinQuizProductPools(): Promise<SkinQuizProductPools> {
  const concernSlugs: SkinConcern[] = [
    'acne-blemish-care',
    'pores-oil-control',
    'dryness-hydration',
    'melasma',
    'brightening',
    'sensitivity',
    'anti-aging-repair',
  ];

  const [
    cleansers,
    toners,
    serums,
    moisturizers,
    sunscreens,
    masks,
    concernEntries,
  ] = await Promise.all([
    getProductsForCategorySlugCandidates(['face-cleansers']),
    getProductsForCategorySlugCandidates(['toners-mists', 'serums-ampoules-essences']),
    getProductsForCategorySlugCandidates(['serums-ampoules-essences']),
    getProductsForCategorySlugCandidates(['night-cream', 'cream-moisturizers', 'moisturizer']),
    getProductsForCategorySlugCandidates(['sunscreen']),
    getProductsForCategorySlugCandidates(['face-masks']),
    Promise.all(
      concernSlugs.map(async (slug) => {
        const listing = await getConcernListing(slug, 1, 10);
        return [slug, listing.products.map(toQuizProduct)] as const;
      }),
    ),
  ]);

  return {
    cleansers,
    toners,
    serums,
    moisturizers,
    sunscreens,
    masks,
    concerns: Object.fromEntries(concernEntries) as SkinQuizProductPools['concerns'],
  };
}

export default async function SkinQuizPage() {
  const pools = await getSkinQuizProductPools();

  return (
    <div className="bg-bg">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-products.png"
            alt="Global skincare picks arranged for an Emart routine quiz"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#101010]/72" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,89,110,0.45),transparent_42%)]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-18 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brass">Routine Quiz</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Build a routine that actually fits Bangladesh
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82 md:text-base">
              Inspired by the best parts of Skinorea, Kiyoko, and Beauty of Joseon, but tuned for Dhaka heat,
              AC office dryness, dark-spot-prone skin, real budgets, and Emart’s full global catalog.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-white/88">
              <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2">Skin type + concern matching</span>
              <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2">Climate-aware layering</span>
              <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2">Routine by email</span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:py-10">
        <div className="mx-auto max-w-6xl">
          <SkinQuizClient productPools={pools} />
        </div>
      </section>
    </div>
  );
}
