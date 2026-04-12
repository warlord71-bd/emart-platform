// ═══════════════════════════════════════════════════════════════════
// src/app/category/[slug]/page.tsx
// Category page with pagination
// ═══════════════════════════════════════════════════════════════════

import { getCategoryBySlug, getProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
  searchParams: { page?: string; sort?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) return { title: 'Category Not Found' };
  return {
    title: `${cat.name} — Korean & Japanese Skincare Bangladesh`,
    description: `Shop ${cat.name} products. Authentic Korean & Japanese skincare. COD available.`,
  };
}

export const revalidate = 3600;

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const page = parseInt(searchParams.page || '1');
  const perPage = 20;
  const sort = (searchParams.sort || 'popularity') as 'popularity' | 'date' | 'price' | 'rating';

  const { products = [], total = 0, totalPages = 0 } = await getProducts({
    category: category.id.toString(),
    page,
    per_page: perPage,
    orderby: sort,
    order: 'desc',
  });

  // Generate page numbers for pagination
  const visiblePages = 5;
  let startPage = Math.max(1, page - Math.floor(visiblePages / 2));
  let endPage = Math.min(totalPages, startPage + visiblePages - 1);
  if (endPage - startPage < visiblePages - 1) {
    startPage = Math.max(1, endPage - visiblePages + 1);
  }

  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Category Header */}
      <div className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1a1a2e]">
                {category.name}
              </h1>
              <p className="text-gray-500 text-sm mt-2">
                {total > 0 ? `Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} of ${total} products` : 'No products found'}
              </p>
            </div>

            {/* Sort Links */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-sm font-medium text-gray-700 hidden sm:block">Sort:</label>
              <div className="flex gap-1">
                {(['popularity', 'date', 'rating', 'price'] as const).map((sortOption) => (
                  <a
                    key={sortOption}
                    href={`/category/${params.slug}?sort=${sortOption}`}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      sort === sortOption
                        ? 'bg-[#e8197a] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sortOption === 'popularity' && 'Popular'}
                    {sortOption === 'date' && 'Newest'}
                    {sortOption === 'rating' && 'Top Rated'}
                    {sortOption === 'price' && 'Price'}
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
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-8">
                {/* Previous Button */}
                {page > 1 && (
                  <a
                    href={`/category/${params.slug}?page=${page - 1}${sort !== 'popularity' ? `&sort=${sort}` : ''}`}
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
                        href={`/category/${params.slug}?page=1${sort !== 'popularity' ? `&sort=${sort}` : ''}`}
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
                      href={`/category/${params.slug}?page=${p}${sort !== 'popularity' ? `&sort=${sort}` : ''}`}
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
                        href={`/category/${params.slug}?page=${totalPages}${sort !== 'popularity' ? `&sort=${sort}` : ''}`}
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
                    href={`/category/${params.slug}?page=${page + 1}${sort !== 'popularity' ? `&sort=${sort}` : ''}`}
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
            <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">No Products in This Category</h2>
            <p className="text-gray-500 mb-6">This category doesn't have any products yet.</p>
            <a
              href="/shop"
              className="inline-block px-6 py-3 bg-[#e8197a] text-white font-semibold rounded-lg hover:bg-[#c01264] transition-colors"
            >
              Browse All Products
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
