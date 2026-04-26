import { getProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';
import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return {
    title: 'New Arrivals - Latest Global Skincare Brands | Emart',
    description: 'Discover the newest global skincare products at Emart. Fresh arrivals every week!',
    alternates: { canonical: '/new-arrivals' },
  };
}

export const revalidate = 1800;

interface NewArrivalsPageProps {
  searchParams: { page?: string; };
}

export default async function NewArrivalsPage({ searchParams }: NewArrivalsPageProps) {
  const page = parseInt(searchParams.page || '1');
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const afterDate = sixtyDaysAgo.toISOString();

  const { products = [], totalPages = 1, total = 0 } = await getProducts({
    page,
    per_page: 24,
    orderby: 'date',
    order: 'desc',
    after: afterDate,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 rounded-2xl border border-hairline bg-card px-5 py-5 shadow-card">
        <h1 className="mb-2 text-3xl font-bold text-ink">New Arrivals</h1>
        <p className="text-sm text-muted">{total} new products in the last 60 days</p>
      </div>
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
                <Link href={`/new-arrivals?page=${page - 1}`}
                  className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black">
                  Previous
                </Link>
              )}
              <span className="rounded-xl border border-hairline bg-bg-alt px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/new-arrivals?page=${page + 1}`}
                  className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black">
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center text-muted-2">
          <p className="text-lg text-ink">No new arrivals in the last 60 days</p>
        </div>
      )}
    </div>
  );
}
