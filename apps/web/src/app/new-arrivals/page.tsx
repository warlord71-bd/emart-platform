import { getProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import { ProductListGrid } from '@/components/product/ProductListGrid';
import Link from 'next/link';
import type { Metadata } from 'next';
import { canonicalPath } from '@/lib/canonicalUrl';
import { absoluteUrl } from '@/lib/siteUrl';

export function generateMetadata({ searchParams }: { searchParams?: NewArrivalsPageProps['searchParams'] }): Metadata {
  return {
    title: { absolute: 'New Arrivals — Latest Skincare in Bangladesh | Emart' },
    description: 'Discover the latest skincare arrivals in Bangladesh. New Korean, Japanese & global beauty products added weekly — serums, sunscreens and more. COD.',
    alternates: { canonical: canonicalPath('/new-arrivals', searchParams) },
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

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'New Arrivals', item: absoluteUrl('/new-arrivals') },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'New Arrivals — Latest Skincare in Bangladesh',
    description: 'New Korean, Japanese and global skincare products added weekly at Emart Skincare Bangladesh.',
    url: absoluteUrl('/new-arrivals'),
    ...(products.length > 0 ? {
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: products.length,
        itemListElement: products.slice(0, 10).map((p: any, i: number) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: p.name,
          url: absoluteUrl(`/shop/${p.slug}`),
        })),
      },
    } : {}),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <div className="mb-6 border-b border-hairline pb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">New</p>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">New Arrivals</h1>
        <p className="mt-1 text-sm text-muted">{total} new products in the last 60 days</p>
      </div>
      {products.length > 0 ? (
        <>
          <ProductListGrid>
            {products.map((product: any, i: number) => (
              <ProductCard key={product.id} product={product} badgeLabel="New" priority={i === 0 && page === 1} />
            ))}
          </ProductListGrid>
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
