import { getOriginTermCounts, getProductsByOriginTermSlug } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/siteUrl';
import { BrowseHubNav } from '@/components/navigation/BrowseHubNav';
import { getOriginByCountry, ORIGIN_DEFINITIONS } from '@/lib/origin-navigation';

const PRODUCTS_PER_PAGE = 24;

export async function generateMetadata({ searchParams }: { searchParams: { country?: string; page?: string } }): Promise<Metadata> {
  const origin = getOriginByCountry(searchParams.country);
  const isQueryView = Boolean(searchParams.country || searchParams.page);

  return {
    title: origin ? `${origin.label} Products | Emart` : 'Shop By Origin | Emart',
    description: origin ? origin.desc : 'Shop authentic beauty products by country of origin',
    alternates: {
      canonical: absoluteUrl('/origins'),
    },
    robots: isQueryView
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export const revalidate = 3600;

interface OriginsPageProps {
  searchParams: { country?: string; page?: string; };
}

export default async function OriginsPage({ searchParams }: OriginsPageProps) {
  const page = parseInt(searchParams.page || '1');
  const selectedOrigin = getOriginByCountry(searchParams.country);
  const originCounts = await getOriginTermCounts();
  const definedOriginTotal = ORIGIN_DEFINITIONS.reduce((sum, origin) => sum + (originCounts[origin.country] || 0), 0);

  const { products = [], totalPages = 1, total = 0 } = selectedOrigin
    ? await getProductsByOriginTermSlug(selectedOrigin.country, page, PRODUCTS_PER_PAGE)
    : { products: [], totalPages: 1, total: 0 };

  if (!searchParams.country) {
    return (
      <div>
        <BrowseHubNav active="origins" />
        <div className="border-b border-hairline bg-card">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-normal text-accent">Brand-level origin map</p>
              <h1 className="mt-1 text-3xl font-extrabold leading-tight text-ink md:text-4xl">Shop By Origin</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Browse authentic skincare by country of origin. Products here use the cleaned WooCommerce
                <span className="font-semibold text-ink"> pa_origin</span> attribute assigned from verified brand origins.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 md:w-[360px]">
              <div className="rounded-lg border border-hairline bg-white px-3 py-2">
                <div className="text-lg font-extrabold text-ink">{definedOriginTotal.toLocaleString()}</div>
                <div className="text-[11px] font-semibold uppercase tracking-normal text-muted">Mapped items</div>
              </div>
              <div className="rounded-lg border border-hairline bg-white px-3 py-2">
                <div className="text-lg font-extrabold text-ink">{ORIGIN_DEFINITIONS.length}</div>
                <div className="text-[11px] font-semibold uppercase tracking-normal text-muted">Origins</div>
              </div>
              <div className="col-span-2 rounded-lg border border-hairline bg-white px-3 py-2 sm:col-span-1">
                <div className="text-lg font-extrabold text-ink">Brand first</div>
                <div className="text-[11px] font-semibold uppercase tracking-normal text-muted">Policy</div>
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
                  href={`/origins?country=${origin.country}`}
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
                    <span className="text-xs font-extrabold text-[var(--origin-deep)]">View</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BrowseHubNav active="origins" />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-2 flex items-center gap-3">
          <Link href="/origins" className="text-sm text-muted transition-colors hover:text-accent">Origins</Link>
          <span className="text-muted-2">/</span>
          <span className="text-sm font-medium text-ink">{selectedOrigin?.flag} {selectedOrigin?.label}</span>
        </div>
        <div
          className="mb-6 rounded-lg border border-hairline bg-card p-4 shadow-sm md:flex md:items-center md:justify-between md:gap-6"
          style={{
            ['--origin-soft' as string]: selectedOrigin ? `oklch(0.94 0.06 ${selectedOrigin.hue})` : undefined,
          }}
        >
          <div className="flex gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[var(--origin-soft)] text-3xl">
              {selectedOrigin?.flag}
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-normal text-accent">{selectedOrigin?.code}</p>
              <h1 className="mt-1 text-3xl font-extrabold leading-tight text-ink">{selectedOrigin?.label} Products</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{selectedOrigin?.story}</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-hairline bg-white px-4 py-3 text-sm md:mt-0 md:w-36">
            <div className="text-2xl font-extrabold text-ink">{total.toLocaleString()}</div>
            <div className="text-[11px] font-bold uppercase tracking-normal text-muted">Products</div>
          </div>
        </div>
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
                <Link href={`/origins?country=${searchParams.country}&page=${page - 1}`}
                  className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black">Previous</Link>
              )}
              <span className="rounded-xl border border-hairline bg-bg-alt px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/origins?country=${searchParams.country}&page=${page + 1}`}
                  className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black">Next</Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center text-muted-2">
          <p className="text-lg text-ink">No products found for this origin</p>
          <Link href="/origins" className="mt-2 block text-accent hover:underline">View All →</Link>
        </div>
      )}
      </div>
    </div>
  );
}
