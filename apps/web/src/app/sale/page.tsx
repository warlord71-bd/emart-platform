import { getProducts, getCategories } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters from '@/components/product/ProductFilters';
import type { Metadata } from 'next';
import { canonicalPath } from '@/lib/canonicalUrl';

export function generateMetadata({ searchParams }: { searchParams?: SalePageProps['searchParams'] }): Metadata {
  return {
    title: 'Sale - Best Deals on Global Skincare Brands | Emart',
    description: 'Shop our exclusive sale collection. Get the best deals on authentic global skincare products.',
    alternates: { canonical: canonicalPath('/sale', searchParams) },
  };
}

export const revalidate = 1800;

interface SalePageProps {
  searchParams: {
    page?: string;
    min_price?: string;
    max_price?: string;
  };
}

export default async function SalePage({ searchParams }: SalePageProps) {
  const page = parseInt(searchParams.page || '1');

  const [{ products, total, totalPages }, categories] = await Promise.all([
    getProducts({
      page,
      per_page: 20,
      on_sale: true,
      orderby: 'popularity',
      order: 'desc',
      min_price: searchParams.min_price,
      max_price: searchParams.max_price,
    }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 border-b border-hairline pb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Sale</p>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Sale</h1>
        <p className="mt-1 text-sm text-muted">{total} products on sale</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <ProductFilters categories={categories} searchParams={searchParams} />
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex justify-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                    <a
                      key={p}
                      href={`/sale?page=${p}`}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl
                                  text-sm font-semibold border transition-colors
                                  ${p === page
                                    ? 'border-ink bg-ink text-white'
                                    : 'border-hairline text-muted hover:border-accent/30 hover:bg-accent-soft hover:text-accent'
                                  }`}
                    >
                      {p}
                    </a>
                  ))}
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
