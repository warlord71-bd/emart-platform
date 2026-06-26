import { getProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import { ProductListGrid } from '@/components/product/ProductListGrid';
import Link from 'next/link';
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/siteUrl';
import {
  getPaginatedCanonical,
  getPaginatedTitle,
  getPaginationHref,
  getValidPage,
} from '@/lib/paginationSeo';

const NEW_ARRIVALS_BASE_TITLE = 'New Arrivals — Latest Skincare in Bangladesh | Emart';

export function generateMetadata({ searchParams }: { searchParams?: NewArrivalsPageProps['searchParams'] }): Metadata {
  const page = getValidPage(searchParams?.page);
  const title = getPaginatedTitle(NEW_ARRIVALS_BASE_TITLE, page);

  return {
    title: { absolute: title },
    description: 'Discover the latest skincare arrivals in Bangladesh. New Korean, Japanese & global beauty products added weekly — serums, sunscreens and more. COD.',
    alternates: { canonical: getPaginatedCanonical('/new-arrivals', page) },
    robots: { index: true, follow: true },
  };
}

export const revalidate = 1800;

interface NewArrivalsPageProps {
  searchParams: { page?: string; };
}

export default async function NewArrivalsPage({ searchParams }: NewArrivalsPageProps) {
  const page = getValidPage(searchParams.page);
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
    url: getPaginatedCanonical('/new-arrivals', page),
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
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-accent">Home</Link>
        <span>/</span>
        <span className="font-medium text-ink">New Arrivals</span>
      </nav>

      <div className="mb-6 border-b border-hairline pb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">New</p>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">New Arrivals</h1>
        <h2 className="mt-1 text-sm font-normal text-muted">{total} new Korean, Japanese &amp; global skincare products added in the last 60 days</h2>
      </div>
      <h2 className="sr-only">Latest skincare arrivals</h2>
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
                <Link href={getPaginationHref('/new-arrivals', searchParams, page - 1)}
                  className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black">
                  Previous
                </Link>
              )}
              <span className="rounded-xl border border-hairline bg-bg-alt px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={getPaginationHref('/new-arrivals', searchParams, page + 1)}
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
