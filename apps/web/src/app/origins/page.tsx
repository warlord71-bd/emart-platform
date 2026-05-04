import { getAllProductIdsByBrand, getBrandBySlug, getCategoryBySlug, getProducts, type WooProduct } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/siteUrl';
import { BrowseHubNav } from '@/components/navigation/BrowseHubNav';

type Origin = {
  country: string;
  label: string;
  flag: string;
  desc: string;
  tag?: string;
  categorySlug?: string;
  brandSlugs?: string[];
};

const ORIGINS = [
  { country: 'korea', label: 'Korean Beauty', flag: '🇰🇷', tag: 'korean-beauty', categorySlug: 'korean-beauty', desc: 'Authentic K-Beauty from Korea' },
  { country: 'japan', label: 'Japanese Beauty', flag: '🇯🇵', tag: 'japanese-beauty', categorySlug: 'japanese-beauty', desc: 'Premium J-Beauty from Japan' },
  {
    country: 'usa',
    label: 'USA Beauty',
    flag: '🇺🇸',
    desc: 'American skincare, body care, and makeup brands',
    brandSlugs: ['cerave', 'neutrogena', 'maybelline', 'cetaphil', 'bath-body-works', 'aveeno', 'clean-clear', 'palmers', 'l-a-girl', 'wet-n-wild'],
  },
  {
    country: 'uk',
    label: 'UK Beauty',
    flag: '🇬🇧',
    desc: 'British skincare, haircare, and makeup brands',
    brandSlugs: ['the-body-shop', 'the-inkey-list', 'simple', 'boots', 'technic-cosmetics', 'w7-candy-blush', 'revolution', 'rimmel-london-scandaleyes'],
  },
  {
    country: 'france',
    label: 'French Beauty',
    flag: '🇫🇷',
    desc: 'French pharmacy and luxury skincare brands',
    brandSlugs: ['la-roche-posay', 'bioderma', 'avene', 'garnier', 'loreal', 'loreal-paris', 'embryolisse', 'caudalie'],
  },
  {
    country: 'india',
    label: 'Indian Beauty',
    flag: '🇮🇳',
    desc: 'Indian skincare, haircare, and makeup brands',
    brandSlugs: ['the-derma-co', 'dot-key', 'mamaearth', 'minimalist', 'insight', 'swiss-beauty-matte', 'lakme-sun-expert', 'aqualogica-glow-jello', 'wishcare'],
  },
  {
    country: 'thailand',
    label: 'Thai Beauty',
    flag: '🇹🇭',
    desc: 'Thai beauty and personal care finds',
    brandSlugs: ['mistine-goat-milk', 'kodomo-baby-bath'],
  },
  {
    country: 'other',
    label: 'Other Global Beauty',
    flag: '🌍',
    desc: 'More authentic beauty products from other origins',
    brandSlugs: ['nivea', 'eucerin', 'ponds', 'vaseline', 'dove', 'sunsilk', 'tresemme-keratin-smooth', 'freeman'],
  },
] satisfies Origin[];

const ORIGIN_SECTIONS = [
  {
    title: 'K-Beauty & J-Beauty',
    description: 'Korea and Japan stay separate so shoppers can browse them cleanly.',
    countries: ['korea', 'japan'],
  },
  {
    title: 'Western Beauty',
    description: 'USA, UK, and French brands only. Korean and Japanese products are not mixed here.',
    countries: ['usa', 'uk', 'france'],
  },
  {
    title: 'South & Southeast Asia',
    description: 'Indian and Thai beauty picks from the current catalog.',
    countries: ['india', 'thailand'],
  },
  {
    title: 'More Origins',
    description: 'Everything else we can map confidently from current brand data.',
    countries: ['other'],
  },
];

const PRODUCTS_PER_PAGE = 24;

function sortProductsByDate(products: WooProduct[]) {
  return [...products].sort((a, b) => {
    const bTime = Date.parse(b.date_modified || '');
    const aTime = Date.parse(a.date_modified || '');
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
}

async function getBrandMappedProducts(origin: Origin, page: number) {
  const brands = await Promise.all((origin.brandSlugs || []).map((slug) => getBrandBySlug(slug)));
  const brandIds = [...new Set(brands.filter(Boolean).map((brand) => brand!.id))];

  if (brandIds.length === 0) {
    return { products: [], totalPages: 1, total: 0 };
  }

  const brandProductIdGroups = await Promise.all(brandIds.map((brandId) => getAllProductIdsByBrand(brandId)));
  const brandProductIds = [...new Set(brandProductIdGroups.flat())];
  if (!brandProductIds.length) {
    return { products: [], totalPages: 1, total: 0 };
  }

  const brandResults = await Promise.all(chunk(brandProductIds, 100).map((ids) => getProducts({
    page: 1,
    per_page: 100,
    include: ids.join(','),
    orderby: 'date',
    order: 'desc',
  })));

  const productMap = new Map<number, WooProduct>();
  brandResults.forEach(({ products }) => {
    products.forEach((product) => productMap.set(product.id, product));
  });

  const allProducts = sortProductsByDate(Array.from(productMap.values()));
  const total = allProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));
  const start = (page - 1) * PRODUCTS_PER_PAGE;

  return {
    products: allProducts.slice(start, start + PRODUCTS_PER_PAGE),
    totalPages,
    total,
  };
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

async function getProductsForOrigin(origin: Origin, page: number) {
  if (origin.categorySlug) {
    const category = await getCategoryBySlug(origin.categorySlug);
    if (category) {
      return getProducts({
        page,
        per_page: PRODUCTS_PER_PAGE,
        orderby: 'date',
        order: 'desc',
        category: String(category.id),
      });
    }
  }

  if (origin.brandSlugs?.length) {
    return getBrandMappedProducts(origin, page);
  }

  if (origin.tag) {
    return getProducts({
      page,
      per_page: PRODUCTS_PER_PAGE,
      orderby: 'date',
      order: 'desc',
      tag: origin.tag,
    });
  }

  return { products: [], totalPages: 1, total: 0 };
}

export async function generateMetadata({ searchParams }: { searchParams: { country?: string; page?: string } }): Promise<Metadata> {
  const origin = ORIGINS.find(o => o.country === searchParams.country);
  const isQueryView = Boolean(searchParams.country || searchParams.page);

  return {
    title: origin ? `${origin.label} Products | Emart` : 'Shop By Origin | Emart',
    description: origin ? origin.desc : 'Shop authentic beauty products by country of origin',
    alternates: {
      canonical: absoluteUrl('/origins'),
    },
    robots: isQueryView
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export const revalidate = 3600;

interface OriginsPageProps {
  searchParams: { country?: string; page?: string; };
}

export default async function OriginsPage({ searchParams }: OriginsPageProps) {
  const page = parseInt(searchParams.page || '1');
  const selectedOrigin = ORIGINS.find(o => o.country === searchParams.country);

  const { products = [], totalPages = 1, total = 0 } = selectedOrigin
    ? await getProductsForOrigin(selectedOrigin, page)
    : { products: [], totalPages: 1, total: 0 };

  if (!searchParams.country) {
    return (
      <div>
        <BrowseHubNav active="origins" />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8 rounded-2xl border border-hairline bg-card px-5 py-5 shadow-card">
            <h1 className="mb-2 text-3xl font-bold text-ink">Shop By Origin</h1>
            <p className="text-sm text-muted">Authentic beauty products from around the world</p>
          </div>
          <div className="grid gap-8">
            {ORIGIN_SECTIONS.map((section) => (
              <section key={section.title}>
                <div className="mb-3">
                  <h2 className="text-xl font-bold text-ink">{section.title}</h2>
                  <p className="mt-1 text-sm text-muted">{section.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {section.countries.map((country) => {
                    const origin = ORIGINS.find((item) => item.country === country);
                    if (!origin) return null;

                    return (
                      <Link key={origin.country} href={`/origins?country=${origin.country}`}
                        className="flex flex-col items-center rounded-2xl border border-hairline bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card">
                        <span className="text-4xl mb-3">{origin.flag}</span>
                        <span className="text-center text-sm font-semibold text-ink">{origin.label}</span>
                        <span className="mt-2 text-center text-xs leading-5 text-muted">{origin.desc}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BrowseHubNav active="origins" />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/origins" className="text-sm text-muted transition-colors hover:text-accent">Origins</Link>
          <span className="text-muted-2">/</span>
          <span className="text-sm font-medium text-ink">{selectedOrigin?.flag} {selectedOrigin?.label}</span>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-ink">{selectedOrigin?.flag} {selectedOrigin?.label}</h1>
        <p className="mb-8 text-sm text-muted">{total} products</p>
      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link href={`/origins?country=${searchParams.country}&page=${page - 1}`}
                  className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black">Previous</Link>
              )}
              <span className="rounded-xl border border-hairline bg-bg-alt px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/origins?country=${searchParams.country}&page=${page + 1}`}
                  className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black">Next</Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center text-muted-2">
          <p className="text-lg text-ink">No products found for this origin</p>
          <Link href="/origins" className="mt-2 block text-accent hover:underline">View all origins</Link>
        </div>
      )}
      </div>
    </div>
  );
}
