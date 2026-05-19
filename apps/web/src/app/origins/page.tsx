import { getOriginTermCounts, getProductsByOriginTermSlug } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/siteUrl';
import { BrowseHubNav } from '@/components/navigation/BrowseHubNav';
import { getOriginByCountry, ORIGIN_DEFINITIONS } from '@/lib/origin-navigation';
import CollectionPageHeader from '@/components/collection/CollectionPageHeader';
import { buildCollectionSchema } from '@/lib/collectionSchema';

const PRODUCTS_PER_PAGE = 24;

export async function generateMetadata({ searchParams }: { searchParams: { country?: string; page?: string } }): Promise<Metadata> {
  const origin = getOriginByCountry(searchParams.country);

  if (!origin) {
    return {
      title: { absolute: 'Shop By Origin | Emart' },
      description: 'Browse authentic Korean, Japanese, French and global skincare by country of origin at Emart Bangladesh.',
      alternates: { canonical: absoluteUrl('/origins') },
    };
  }

  return {
    title: { absolute: `${origin.label} Skincare Products in Bangladesh | Emart` },
    description: `${origin.desc} Shop authentic ${origin.label} beauty products in Bangladesh with COD and fast delivery.`,
    alternates: { canonical: absoluteUrl(`/origins/${origin.country}`) },
    robots: { index: true, follow: true },
  };
}

export const revalidate = 3600;

interface OriginsPageProps {
  searchParams: { country?: string; page?: string };
}

export default async function OriginsPage({ searchParams }: OriginsPageProps) {
  const page = Math.max(1, parseInt(searchParams.page || '1'));
  const selectedOrigin = getOriginByCountry(searchParams.country);
  const originCounts = await getOriginTermCounts();
  const definedOriginTotal = ORIGIN_DEFINITIONS.reduce((sum, o) => sum + (originCounts[o.country] || 0), 0);

  const { products = [], totalPages = 1, total = 0 } = selectedOrigin
    ? await getProductsByOriginTermSlug(selectedOrigin.country, page, PRODUCTS_PER_PAGE)
    : { products: [], totalPages: 1, total: 0 };

  /* ── Index page (no country selected) ── */
  if (!searchParams.country) {
    return (
      <div>
        <BrowseHubNav active="origins" />
        <div className="border-b border-hairline bg-card">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Brand-level origin map</p>
              <h1 className="mt-1 text-3xl font-extrabold leading-tight text-ink md:text-4xl">Shop By Origin</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Browse authentic skincare by country of origin — mapped from verified brand origins across our full catalog.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 md:w-[360px]">
              <div className="rounded-lg border border-hairline bg-white px-3 py-2">
                <div className="text-lg font-extrabold text-ink">{definedOriginTotal.toLocaleString()}</div>
                <div className="text-[11px] font-semibold uppercase tracking-normal text-muted">Products mapped</div>
              </div>
              <div className="rounded-lg border border-hairline bg-white px-3 py-2">
                <div className="text-lg font-extrabold text-ink">{ORIGIN_DEFINITIONS.length}</div>
                <div className="text-[11px] font-semibold uppercase tracking-normal text-muted">Origins</div>
              </div>
              <div className="col-span-2 rounded-lg border border-hairline bg-white px-3 py-2 sm:col-span-1">
                <div className="text-lg font-extrabold text-ink">100% Authentic</div>
                <div className="text-[11px] font-semibold uppercase tracking-normal text-muted">Guarantee</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-ink">Countries</h2>
            <span className="text-xs font-bold uppercase tracking-normal text-muted">
              {definedOriginTotal.toLocaleString()} items
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {ORIGIN_DEFINITIONS.map((origin) => {
              const itemCount = originCounts[origin.country] || 0;
              return (
                <Link
                  key={origin.country}
                  href={`/origins/${origin.country}`}
                  className="group flex min-h-[164px] flex-col rounded-lg border border-hairline bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card"
                  style={{
                    ['--origin-soft' as string]: `oklch(0.94 0.06 ${origin.hue})`,
                    ['--origin-deep' as string]: `oklch(0.42 0.14 ${origin.hue})`,
                  }}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--origin-soft)] text-xl">
                        {origin.flag}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold text-ink">{origin.label}</div>
                        <div className="text-[11px] font-bold uppercase tracking-normal text-muted">{origin.code}</div>
                      </div>
                    </div>
                  </div>
                  <p className="line-clamp-3 text-xs leading-5 text-muted">{origin.story}</p>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-xs font-bold text-muted">{itemCount.toLocaleString()} items</span>
                    <span className="text-xs font-extrabold text-[var(--origin-deep)]">View →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ── Country listing page ── */
  const canonicalUrl = absoluteUrl(`/origins/${selectedOrigin?.country ?? searchParams.country}`);
  const originTitle = `${selectedOrigin?.label ?? searchParams.country} Products`;
  const originDesc = selectedOrigin?.desc ?? `Authentic ${selectedOrigin?.label ?? ''} skincare products available in Bangladesh.`;

  const { breadcrumbJsonLd, collectionPageJsonLd, itemListJsonLd } = buildCollectionSchema({
    type: 'origin',
    title: `${originTitle} | Emart`,
    description: originDesc,
    url: canonicalUrl,
    breadcrumbs: [
      { name: 'Home', url: 'https://e-mart.com.bd' },
      { name: 'Origins', url: 'https://e-mart.com.bd/origins' },
      { name: selectedOrigin?.label ?? '', url: canonicalUrl },
    ],
    products: products as Array<{ name: string; slug: string }>,
    page,
  });

  const flagIcon = selectedOrigin ? (
    <span
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-3xl"
      style={{ background: `oklch(0.94 0.06 ${selectedOrigin.hue})` }}
    >
      {selectedOrigin.flag}
    </span>
  ) : undefined;

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
            { label: selectedOrigin?.label ?? '' },
          ]}
          title={originTitle}
          description={originDesc}
          icon={flagIcon}
          productCount={total}
        />

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/origins?country=${searchParams.country}&page=${page - 1}`}
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
                    href={`/origins?country=${searchParams.country}&page=${page + 1}`}
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
