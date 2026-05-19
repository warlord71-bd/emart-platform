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
import { getOriginEditorial } from '@/lib/origin-editorial';

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

  const editorial = getOriginEditorial(params.country);
  const canonical = absoluteUrl(`/origins/${origin.country}`);
  const description = editorial
    ? `${editorial.whySection.body.slice(0, 130)}… Authentic products with COD across Bangladesh.`
    : `Shop authentic ${origin.label} beauty and skincare in Bangladesh from Emart. ${origin.story} COD available, fast nationwide delivery.`;

  return {
    title: { absolute: `${origin.label} Beauty & Skincare Products in Bangladesh | Emart` },
    description,
    alternates: { canonical },
    openGraph: {
      title: `${origin.label} Beauty Products in Bangladesh | Emart`,
      description,
      url: canonical,
      images: [{ url: absoluteUrl('/images/hero-products.png'), width: 1200, height: 630 }],
    },
  };
}

export default async function OriginCountryPage({ params, searchParams }: Props) {
  const origin = getOriginByCountry(params.country);
  if (!origin) notFound();

  const editorial = getOriginEditorial(params.country);
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

        {/* Editorial content — only renders for countries with defined editorial */}
        {editorial && (
          <div className="mx-auto mt-16 max-w-3xl space-y-10 border-t border-hairline pt-12">
            {/* Why section */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-ink">{editorial.whySection.heading}</h2>
              <p className="text-sm leading-7 text-muted-2">{editorial.whySection.body}</p>
            </section>

            {/* Key trends */}
            {editorial.keyTrends.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold text-ink">Key Skincare Trends from {origin.label}</h2>
                <div className="space-y-4">
                  {editorial.keyTrends.map((trend, i) => (
                    <div key={i} className="rounded-xl border border-hairline bg-card p-4">
                      <p className="text-sm font-bold text-ink">{trend.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-2">{trend.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Popular brands */}
            {editorial.popularBrands.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold text-ink">Popular {origin.label} Brands at Emart</h2>
                <div className="flex flex-wrap gap-2">
                  {editorial.popularBrands.map((brand) => (
                    <Link
                      key={brand.slug}
                      href={`/brands/${brand.slug}`}
                      className="rounded-full border border-accent/30 bg-accent-soft px-4 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-white transition-colors"
                    >
                      {brand.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Bangladesh context */}
            <section className="rounded-2xl border-l-4 border-accent bg-accent-soft/30 p-6">
              <h2 className="mb-3 text-xl font-bold text-ink">{origin.label} Skincare in Bangladesh</h2>
              <p className="text-sm leading-7 text-muted-2">{editorial.bangladeshContext}</p>
            </section>

            {/* FAQ */}
            {editorial.faq.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold text-ink">Frequently Asked Questions</h2>
                {editorial.faq.length > 0 && (
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                      __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: editorial.faq.map((item) => ({
                          '@type': 'Question',
                          name: item.q,
                          acceptedAnswer: { '@type': 'Answer', text: item.a },
                        })),
                      }),
                    }}
                  />
                )}
                <div className="space-y-4">
                  {editorial.faq.map((item, i) => (
                    <details key={i} className="group rounded-xl border border-hairline bg-card p-5 shadow-sm">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-ink group-open:text-accent">
                        {item.q}
                      </summary>
                      <p className="mt-3 text-sm leading-7 text-muted-2">{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
