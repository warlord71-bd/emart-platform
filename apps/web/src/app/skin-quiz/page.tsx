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
    <div className="bg-bg pb-10">
      <section className="border-b border-hairline bg-card">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center lg:py-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Routine Quiz</p>
            <h1 className="mt-1.5 text-xl font-extrabold leading-tight text-ink sm:text-2xl lg:text-4xl">
              Build your skincare routine
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Match skin type, concern, climate &amp; budget — get a real AM/PM routine.
            </p>
          </div>

          <div className="relative hidden h-40 overflow-hidden rounded-2xl lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-[#d4596e] via-[#9b4dca] to-[#3b5fc0]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">Routine builder</div>
              <div className="mt-1 text-base font-extrabold text-white">AM · PM · Weekly</div>
              <div className="mt-2 text-xs leading-5 text-white/60">Matched to Dhaka climate, skin type, and your budget.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 md:py-8">
        <div className="mx-auto max-w-6xl">
          <SkinQuizClient productPools={pools} />
        </div>
      </section>
    </div>
  );
}
