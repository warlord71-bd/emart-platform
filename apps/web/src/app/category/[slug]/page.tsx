import { Suspense } from 'react';
import { getCategoryBySlug, getProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import SortControl from '@/components/product/SortControl';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
  searchParams: {
    page?: string;
    orderby?: string;
    order?: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) return { title: 'Category Not Found' };
  return {
    title: `${cat.name} — Korean & Japanese Skincare Bangladesh`,
    description: `Shop ${cat.name} products. Authentic Korean & Japanese skincare in Bangladesh. COD available, fast delivery.`,
  };
}

export const revalidate = 3600;

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const page = parseInt(searchParams.page || '1');

  const { products, total, totalPages } = await getProducts({
    category: category.id.toString(),
    page,
    per_page: 20,
    orderby: (searchParams.orderby || 'popularity') as 'date' | 'price' | 'popularity' | 'rating' | 'title',
    order: (searchParams.order || 'desc') as 'asc' | 'desc',
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-[#e8197a]">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#e8197a]">Shop</Link>
        <span>/</span>
        <span className="text-[#1a1a2e] font-medium">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e]">{category.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{total} products found</p>
        </div>
        <Suspense fallback={<div className="h-10 w-36 bg-gray-100 rounded-lg animate-pulse" />}>
          <SortControl currentOrderby={searchParams.orderby} currentOrder={searchParams.order} />
        </Suspense>
      </div>

      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/category/${params.slug}?page=${p}${searchParams.orderby ? `&orderby=${searchParams.orderby}` : ''}${searchParams.order ? `&order=${searchParams.order}` : ''}`}
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
          <div className="text-5xl mb-4">🛍️</div>
          <p className="text-lg font-medium">No products in this category yet.</p>
          <Link href="/shop" className="text-[#e8197a] hover:underline mt-2 block">
            Browse All Products
          </Link>
        </div>
      )}
    </div>
  );
}
