// ═══════════════════════════════════════════════════════════════════
// src/app/shop/page.tsx
// Shop page with pagination, filtering, and proper product browsing
// ═══════════════════════════════════════════════════════════════════

import { getProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop Korean & Japanese Skincare | Emart BD',
  description: 'Browse our complete collection of authentic Korean and Japanese skincare products. Fast delivery, COD available.',
};

export const revalidate = 3600;

interface ShopPageProps {
  searchParams: {
    page?: string;
    category?: string;
    sort?: string;
    limit?: string;
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const page = parseInt(searchParams.page || '1');
  const perPage = parseInt(searchParams.limit || '20'); // Default 20, can be customized
  const sort = (searchParams.sort || 'date') as 'date' | 'price' | 'popularity' | 'rating';
  const category = searchParams.category || '';

  try {
    const { products = [], total = 0, totalPages = 0 } = await getProducts({
      page,
      per_page: perPage,
      category: category,
      orderby: sort,
      order: 'desc',
      status: 'publish',
    });

    // Generate page numbers for pagination
    const visiblePages = 5; // Show 5 page numbers max
    let startPage = Math.max(1, page - Math.floor(visiblePages / 2));
    let endPage = Math.min(totalPages, startPage + visiblePages - 1);
    if (endPage - startPage < visiblePages - 1) {
      startPage = Math.max(1, endPage - visiblePages + 1);
    }

    const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-100 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1a1a2e]">
                  Shop All Products
                </h1>
                <p className="text-gray-500 text-sm mt-2">
                  {total > 0 ? `Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} of ${total} products` : 'No products found'}
                </p>
              </div>

              {/* Sort Links */}
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <div className="flex gap-1">
                  {(['date', 'popularity', 'rating', 'price'] as const).map((sortOption) => (
                    <a
                      key={sortOption}
                      href={`/shop?sort=${sortOption}${category ? `&category=${category}` : ''}`}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        sort === sortOption
                          ? 'bg-[#e8197a] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {sortOption === 'date' && 'Newest'}
                      {sortOption === 'popularity' && 'Best Sellers'}
                      {sortOption === 'rating' && 'Top Rated'}
                      {sortOption === 'price' && 'Price: Low to High'}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {products.length > 0 ? (
            <>
              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-8">
                  {/* Previous Button */}
                  {page > 1 && (
                    <a
                      href={`/shop?page=${page - 1}${category ? `&category=${category}` : ''}${sort !== 'date' ? `&sort=${sort}` : ''}`}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      ← Previous
                    </a>
                  )}

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {startPage > 1 && (
                      <>
                        <a
                          href={`/shop?page=1${category ? `&category=${category}` : ''}${sort !== 'date' ? `&sort=${sort}` : ''}`}
                          className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
                        >
                          1
                        </a>
                        {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
                      </>
                    )}

                    {pageNumbers.map((p) => (
                      <a
                        key={p}
                        href={`/shop?page=${p}${category ? `&category=${category}` : ''}${sort !== 'date' ? `&sort=${sort}` : ''}`}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                          p === page
                            ? 'bg-[#e8197a] text-white border border-[#e8197a]'
                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </a>
                    ))}

                    {endPage < totalPages && (
                      <>
                        {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
                        <a
                          href={`/shop?page=${totalPages}${category ? `&category=${category}` : ''}${sort !== 'date' ? `&sort=${sort}` : ''}`}
                          className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
                        >
                          {totalPages}
                        </a>
                      </>
                    )}
                  </div>

                  {/* Next Button */}
                  {page < totalPages && (
                    <a
                      href={`/shop?page=${page + 1}${category ? `&category=${category}` : ''}${sort !== 'date' ? `&sort=${sort}` : ''}`}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Next →
                    </a>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-lg">
              <div className="text-5xl mb-4">🛍️</div>
              <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">No Products Found</h2>
              <p className="text-gray-500 mb-6">We couldn't find any products matching your criteria.</p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-[#e8197a] text-white font-semibold rounded-lg hover:bg-[#c01264] transition-colors"
              >
                Continue Shopping
              </a>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading products:', error);
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-[#1a1a2e] mb-2">Something Went Wrong</h1>
        <p className="text-gray-500 mb-6">We couldn't load the products. Please try again later.</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-[#e8197a] text-white font-semibold rounded-lg hover:bg-[#c01264] transition-colors"
        >
          Back to Home
        </a>
      </div>
    );
  }
}
