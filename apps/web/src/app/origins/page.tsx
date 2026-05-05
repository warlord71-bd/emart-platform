import { getProductsByOriginTermSlug } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/siteUrl';
import { BrowseHubNav } from '@/components/navigation/BrowseHubNav';
import { getOriginByCountry, ORIGIN_DEFINITIONS, ORIGIN_SECTIONS } from '@/lib/origin-navigation';

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

  const { products = [], totalPages = 1, total = 0 } = selectedOrigin
    ? await getProductsByOriginTermSlug(selectedOrigin.country, page, PRODUCTS_PER_PAGE)
    : { products: [], totalPages: 1, total: 0 };

  if (!searchParams.country) {
    return (
      <div>
        <BrowseHubNav active="origins" />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8 rounded-2xl border border-hairline bg-card px-5 py-5 shadow-card">
            <h1 className="mb-2 text-3xl font-bold text-ink">Shop By Origin</h1>
            <p className="text-sm text-muted">Authentic beauty products from around the world</p>
          </div>
          <div className="grid gap-8">
            {ORIGIN_SECTIONS.map((section) => (
              <section key={section.title}>
                <div className="mb-3">
                  <h2 className="text-xl font-bold text-ink">{section.title}</h2>
                  <p className="mt-1 text-sm text-muted">{section.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {section.countries.map((country) => {
                    const origin = ORIGIN_DEFINITIONS.find((item) => item.country === country);
                    if (!origin) return null;

                    return (
                      <Link key={origin.country} href={`/origins?country=${origin.country}`}
                        className="flex flex-col items-center rounded-2xl border border-hairline bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card">
                        <span className="text-4xl mb-3">{origin.flag}</span>
                        <span className="text-center text-sm font-semibold text-ink">{origin.label}</span>
                        <span className="mt-2 text-center text-xs leading-5 text-muted">{origin.desc}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BrowseHubNav active="origins" />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/origins" className="text-sm text-muted transition-colors hover:text-accent">Origins</Link>
          <span className="text-muted-2">/</span>
          <span className="text-sm font-medium text-ink">{selectedOrigin?.flag} {selectedOrigin?.label}</span>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-ink">{selectedOrigin?.flag} {selectedOrigin?.label}</h1>
        <p className="mb-8 text-sm text-muted">{total} products</p>
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
          <Link href="/origins" className="mt-2 block text-accent hover:underline">View all origins</Link>
        </div>
      )}
      </div>
    </div>
  );
}
