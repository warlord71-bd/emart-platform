// ═══════════════════════════════════════════
// src/app/search/page.tsx
// ═══════════════════════════════════════════
import { searchProducts } from '@/lib/woocommerce';
import { canonicalPath } from '@/lib/canonicalUrl';
import ProductCard from '@/components/product/ProductCard';
import { ProductListGrid } from '@/components/product/ProductListGrid';
import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getPaginationHref, getValidPage } from '@/lib/paginationSeo';

interface Props {
  searchParams: { q?: string; page?: string };
}

function normalizeSearchQuery(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isSkinQuizQuery(value: string) {
  const normalized = normalizeSearchQuery(value);
  if (!normalized) return false;

  if (normalized === 'quiz' || normalized === 'skin quiz' || normalized === 'skincare quiz' || normalized === 'routine quiz') {
    return true;
  }

  return normalized.includes('quiz') && (normalized.includes('skin') || normalized.includes('routine'));
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  // Keep ?q= in canonical so page-2+ of the same query collapses onto page-1.
  // All other params (page, sort, etc.) are stripped by canonicalPath.
  const canonical = searchParams.q
    ? canonicalPath('/search', { q: searchParams.q })
    : '/search';
  return {
    title: `Search: ${searchParams.q || ''} — Emart Skincare`,
    robots: { index: false, follow: true },
    alternates: { canonical },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q || '';
  const page = getValidPage(searchParams.page);

  if (!query) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-4 text-2xl font-bold text-ink">Search Products</h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            Use the search bar in the header to find a product, brand, category, or skin concern.
          </p>
        </div>
      </div>
    );
  }

  if (isSkinQuizQuery(query)) {
    redirect('/skin-quiz');
  }

  const { products, total, totalPages } = await searchProducts(query, page);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-accent">Home</Link>
        <span>/</span>
        <span className="font-medium text-ink">Search</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">
          Search: &ldquo;{query}&rdquo;
        </h1>
        <p className="mt-1 text-sm text-muted">{total} products found</p>
      </div>

      {products.length > 0 ? (
        <>
          <ProductListGrid>
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i === 0 && page === 1} />
            ))}
          </ProductListGrid>
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link href={getPaginationHref('/search', { q: query }, page - 1)} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black">Previous</Link>
              )}
              <span className="rounded-xl border border-hairline bg-bg-alt px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={getPaginationHref('/search', { q: query }, page + 1)} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black">Next</Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center">
          <div className="text-5xl mb-4">😔</div>
          <p className="text-lg text-muted">No products found for &ldquo;{query}&rdquo;</p>
          <Link href="/shop" className="btn-primary inline-block mt-4">Browse All Products</Link>
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
//     <div className="mx-auto max-w-7xl px-4 py-8">
//       <h1 className="section-title mb-2">{category.name}</h1>
//       <p className="text-gray-500 text-sm mb-6">{total} products</p>
//       <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
//         {products.map((p) => <ProductCard key={p.id} product={p} />)}
//       </div>
//     </div>
//   );
// }
