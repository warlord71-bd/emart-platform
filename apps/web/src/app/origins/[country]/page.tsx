import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getProductsByOriginTermSlug } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import { absoluteUrl } from '@/lib/siteUrl';
import { BrowseHubNav } from '@/components/navigation/BrowseHubNav';
import { getOriginByCountry } from '@/lib/origin-navigation';
import CollectionPageHeader from '@/components/collection/CollectionPageHeader';
import { buildCollectionSchema } from '@/lib/collectionSchema';

export const revalidate = 3600;
export const dynamicParams = true;

const PRODUCTS_PER_PAGE = 24;

interface Props {
  params: { country: string };
  searchParams: { page?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const origin = getOriginByCountry(params.country);
  if (!origin) return { title: 'Origin Not Found' };

  const canonical = absoluteUrl(`/origins/${origin.country}`);
  return {
    title: { absolute: `${origin.label} Beauty & Skincare Products in Bangladesh | Emart` },
    description: `Shop authentic ${origin.label} beauty and skincare in Bangladesh from Emart. ${origin.story} COD available, fast nationwide delivery.`,
    alternates: { canonical },
    openGraph: {
      title: `${origin.label} Beauty Products in Bangladesh | Emart`,
      description: `Authentic ${origin.label} skincare and beauty products. ${origin.story}`,
      url: canonical,
      images: [{ url: absoluteUrl('/images/hero-products.png'), width: 1200, height: 630 }],
    },
  };
}

export default async function OriginCountryPage({ params, searchParams }: Props) {
  const origin = getOriginByCountry(params.country);
  if (!origin) notFound();

  const page = Math.max(1, parseInt(searchParams.page || '1'));
  const { products = [], totalPages = 1, total = 0 } = await getProductsByOriginTermSlug(
    origin.country,
    page,
    PRODUCTS_PER_PAGE,
  );

  const canonical = absoluteUrl(`/origins/${origin.country}`);
  const title = `${origin.label} Beauty Products`;

  const { breadcrumbJsonLd, collectionPageJsonLd, itemListJsonLd } = buildCollectionSchema({
    type: 'origin',
    title: `${title} | Emart`,
    description: `Authentic ${origin.label} skincare and beauty products in Bangladesh. ${origin.story}`,
    url: canonical,
    breadcrumbs: [
      { name: 'Home', url: absoluteUrl('/') },
      { name: 'Origins', url: absoluteUrl('/origins') },
      { name: origin.label, url: canonical },
    ],
    products: products as Array<{ name: string; slug: string }>,
    page,
  });

  const flagIcon = (
    <span
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-3xl"
      style={{ background: `oklch(0.94 0.06 ${origin.hue})` }}
    >
      {origin.flag}
    </span>
  );

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}

      <BrowseHubNav active="origins" />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <CollectionPageHeader
          type="origin"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Origins', href: '/origins' },
            { label: origin.label },
          ]}
          title={title}
          description={`${origin.story} Shop authentic ${origin.label} beauty and skincare products in Bangladesh with Cash on Delivery and fast nationwide delivery.`}
          icon={flagIcon}
          productCount={total}
        />

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product: any, i: number) => (
                <ProductCard key={product.id} product={product} priority={i === 0 && page === 1} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/origins/${origin.country}?page=${page - 1}`}
                    className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
                  >
                    Previous
                  </Link>
                )}
                <span className="rounded-xl border border-hairline bg-bg-alt px-4 py-2 text-sm text-muted">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/origins/${origin.country}?page=${page + 1}`}
                    className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="text-muted">No products found for this origin.</p>
            <Link href="/origins" className="mt-2 block text-sm text-accent hover:underline">
              View all origins
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
