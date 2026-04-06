// ═══════════════════════════════════════════
// src/app/search/page.tsx
// ═══════════════════════════════════════════
import { searchProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import type { Metadata } from 'next';

interface Props {
  searchParams: { q?: string; page?: string };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return {
    title: `Search: ${searchParams.q || ''} — Emart Skincare`,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q || '';
  const page = parseInt(searchParams.page || '1');

  if (!query) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Search Products</h1>
        <p className="text-gray-500 mt-2">Enter a product name, brand, or category</p>
      </div>
    );
  }

  const { products, total, totalPages } = await searchProducts(query, page);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a2e]">
          Search: &ldquo;{query}&rdquo;
        </h1>
        <p className="text-gray-500 text-sm mt-1">{total} products found</p>
      </div>

      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/search?q=${encodeURIComponent(query)}&page=${p}`}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold border
                              ${p === page ? 'bg-[#e8197a] text-white border-[#e8197a]' : 'border-gray-200 hover:border-[#e8197a]'}`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">😔</div>
          <p className="text-gray-500 text-lg">No products found for &ldquo;{query}&rdquo;</p>
          <a href="/shop" className="btn-primary inline-block mt-4">Browse All Products</a>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// src/app/category/[slug]/page.tsx
// ═══════════════════════════════════════════
// import { getCategoryBySlug, getProducts } from '@/lib/woocommerce';
// import ProductCard from '@/components/product/ProductCard';
// import { notFound } from 'next/navigation';
//
// export const revalidate = 3600;
//
// export default async function CategoryPage({ params }: { params: { slug: string } }) {
//   const category = await getCategoryBySlug(params.slug);
//   if (!category) notFound();
//
//   const { products, total } = await getProducts({
//     category: category.id.toString(),
//     per_page: 20,
//   });
//
//   return (
//     <div className="max-w-6xl mx-auto px-4 py-8">
//       <h1 className="section-title mb-2">{category.name}</h1>
//       <p className="text-gray-500 text-sm mb-6">{total} products</p>
//       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
//         {products.map((p) => <ProductCard key={p.id} product={p} />)}
//       </div>
//     </div>
//   );
// }
