import { getAllProductIdsByBrand, getBrandBySlug, getProducts } from '@/lib/woocommerce';
import CatalogFilters from '@/components/product/CatalogFilters';
import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';
import type { Metadata } from 'next';
import { canonicalPath } from '@/lib/canonicalUrl';

// All filter/sort params are stripped — only /shop is the canonical page for this route.
export function generateMetadata({ searchParams }: { searchParams?: ShopPageProps['searchParams'] }): Metadata {
  const canonical = canonicalPath('/shop', searchParams);

  return {
    title: 'Shop Global Skincare Brands',
    description: 'Browse our collection of authentic global skincare products.',
    alternates: { canonical },
    openGraph: {
      title: 'Shop Global Skincare Brands | Emart',
      description: 'Browse our collection of authentic global skincare products.',
      url: canonical,
    },
  };
}

export const revalidate = 1800;

interface ShopPageProps {
  searchParams: {
    page?: string;
    category?: string;
    sort?: string;
    search?: string;
    brand?: string;
    price?: string;
    in_stock?: string;
    origin?: string;
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
  return value && value in SORT_MAP ? SORT_MAP[value as SortValue] : SORT_MAP.newest;
}

function getPageHref(basePath: string, searchParams: ShopPageProps['searchParams'], targetPage: number) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  params.set('page', String(targetPage));
  return `${basePath}?${params.toString()}`;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const page = parseInt(searchParams.page || '1');
  const activeBrand = searchParams.brand ? await getBrandBySlug(searchParams.brand) : null;
  const activeBrandProductIds = activeBrand ? await getAllProductIdsByBrand(activeBrand.id) : [];
  const activeSearch = searchParams.search || '';
  const priceParams = getPriceParams(searchParams.price);
  const sortParams = getSortParams(searchParams.sort);
  const { products = [], totalPages = 1, total = 0 } = await getProducts({
    page,
    per_page: 24,
    search: activeSearch,
    include: activeBrand ? activeBrandProductIds.join(',') || '0' : undefined,
    category: searchParams.category || '',
    ...sortParams,
    ...priceParams,
    stock_status: searchParams.in_stock === '1' ? 'instock' : undefined,
  });
  const title = activeBrand ? activeBrand.name : activeSearch ? `Search: ${activeSearch}` : 'All Products';
  const hasBrandOrSearch = Boolean(activeBrand || activeSearch);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 border-b border-hairline pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted">{total} products found</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/categories" className="font-semibold text-ink transition-colors hover:text-accent">
            Browse categories
          </Link>
          {hasBrandOrSearch && (
            <Link href="/shop" className="font-semibold text-accent hover:underline">
              Clear filter
            </Link>
          )}
        </div>
      </div>

      <CatalogFilters
        basePath="/shop"
        searchParams={searchParams}
        resultCount={products.length}
        totalCount={total}
        showOrigin
        defaultSort="newest"
        variant="mobile"
      />

      <div className="flex gap-6">
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <CatalogFilters
            basePath="/shop"
            searchParams={searchParams}
            resultCount={products.length}
            totalCount={total}
            showOrigin
            defaultSort="newest"
            variant="desktop"
          />
        </aside>

        <div className="flex-1">
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 min-[430px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <Link href={getPageHref('/shop', searchParams, page - 1)}
                      className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black">
                      Previous
                    </Link>
                  )}
                  <span className="rounded-xl border border-hairline bg-bg-alt px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
                  {page < totalPages && (
                    <Link href={getPageHref('/shop', searchParams, page + 1)}
                      className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black">
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-muted-2">
              <p className="text-lg text-ink">No products found</p>
              <Link href="/shop" className="mt-2 block text-accent hover:underline">
                Clear filters
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
