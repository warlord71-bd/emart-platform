import { getProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import CatalogFilters from '@/components/product/CatalogFilters';
import type { Metadata } from 'next';
import { canonicalPath } from '@/lib/canonicalUrl';
import { absoluteUrl } from '@/lib/siteUrl';
import { buildUrl } from '@/lib/url-utils';

export function generateMetadata({ searchParams }: { searchParams?: SalePageProps['searchParams'] }): Metadata {
  return {
    title: { absolute: 'Sale — Authentic Skincare Deals in Bangladesh | Emart' },
    description: 'Save on authentic Korean, Japanese & global skincare in Bangladesh. Real discounts on original serums, sunscreens and more. COD, fast delivery.',
    alternates: { canonical: canonicalPath('/sale', searchParams) },
  };
}

export const revalidate = 1800;

interface SalePageProps {
  searchParams: {
    page?: string;
    price?: string;
    sort?: string;
    in_stock?: string;
    concern?: string;
    skin_type?: string;
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

export default async function SalePage({ searchParams }: SalePageProps) {
  const page = parseInt(searchParams.page || '1');

  const priceParams = searchParams.price && searchParams.price in PRICE_MAP
    ? PRICE_MAP[searchParams.price as PriceValue]
    : undefined;

  const sortParams = searchParams.sort && searchParams.sort in SORT_MAP
    ? SORT_MAP[searchParams.sort as SortValue]
    : SORT_MAP.popularity;

  const { products, total, totalPages } = await getProducts({
    page,
    per_page: 20,
    on_sale: true,
    orderby: sortParams.orderby,
    order: sortParams.order,
    min_price: priceParams?.min_price,
    max_price: priceParams?.max_price,
    stock_status: searchParams.in_stock === '1' ? 'instock' : undefined,
  });

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Sale', item: absoluteUrl('/sale') },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Sale — Authentic Skincare Deals in Bangladesh',
    description: 'Real discounts on authentic Korean, Japanese and global skincare at Emart Skincare Bangladesh.',
    url: absoluteUrl('/sale'),
    ...(products.length > 0 ? {
      hasPart: products.slice(0, 10).map((p: any) => ({
        '@type': 'Product',
        name: p.name,
        url: absoluteUrl(`/shop/${p.slug}`),
      })),
    } : {}),
  };

  const searchParamsRecord: Record<string, string | undefined> = {
    page: searchParams.page,
    price: searchParams.price,
    sort: searchParams.sort,
    in_stock: searchParams.in_stock,
    concern: searchParams.concern,
    skin_type: searchParams.skin_type,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />

      {/* Header */}
      <div className="mb-6 border-b border-hairline pb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Limited Time</p>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Sale</h1>
        <p className="mt-1 text-sm text-muted">{total} products on sale</p>
      </div>

      {/* Mobile filters */}
      <div className="mb-4 lg:hidden">
        <CatalogFilters
          basePath="/sale"
          searchParams={searchParamsRecord}
          resultCount={products.length}
          totalCount={total}
          showConcern
          showSkinType
          defaultSort="popularity"
          variant="mobile"
        />
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <CatalogFilters
            basePath="/sale"
            searchParams={searchParamsRecord}
            resultCount={products.length}
            totalCount={total}
            showConcern
            showSkinType
            defaultSort="popularity"
            variant="desktop"
          />
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <a href={buildUrl('/sale', { ...searchParamsRecord, page: page - 1 })} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black">Previous</a>
                  )}
                  <span className="rounded-xl border border-hairline bg-bg-alt px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
                  {page < totalPages && (
                    <a href={buildUrl('/sale', { ...searchParamsRecord, page: page + 1 })} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black">Next</a>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-muted-2">
              <p className="text-lg font-medium text-ink">No sale items right now</p>
              <a href="/shop" className="mt-2 block text-accent hover:underline">
                Browse all products
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
