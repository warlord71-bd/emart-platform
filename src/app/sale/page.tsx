import { getProducts, getCategories } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters from '@/components/product/ProductFilters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '🔥 Sale - Best Deals on Korean & Japanese Skincare',
  description: 'Shop our exclusive sale collection. Get the best deals on authentic Korean and Japanese skincare products.',
};

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#e8197a] mb-2">🔥 Massive Sale</h1>
        <p className="text-gray-500">{total} products on sale</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <ProductFilters categories={categories} searchParams={searchParams} />
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                    <a
                      key={p}
                      href={`/sale?page=${p}`}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg
                                  text-sm font-semibold border transition-colors
                                  ${p === page
                                    ? 'bg-[#e8197a] text-white border-[#e8197a]'
                                    : 'border-gray-200 text-gray-600 hover:border-[#e8197a] hover:text-[#e8197a]'
                                  }`}
                    >
                      {p}
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-lg font-medium">No sale items right now</p>
              <a href="/shop" className="text-[#e8197a] hover:underline mt-2 block">
                Browse all products
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
