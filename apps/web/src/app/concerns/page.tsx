import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CONCERN_DEFINITIONS, getConcernBySlug, getConcernHref, getConcernListing } from '@/lib/concerns';
import { Sparkles, Target, Droplets, CircleDot, Sun, Star, Clock3, Shield, ShieldCheck, type LucideIcon } from 'lucide-react';
import { BrowseHubNav } from '@/components/navigation/BrowseHubNav';

export const metadata: Metadata = {
  title: 'Shop By Concern | Emart Skincare Bangladesh',
  description: 'Find the perfect skincare products for your skin concern',
};

export const revalidate = 3600;

interface ConcernsPageProps {
  searchParams: { concern?: string; page?: string; };
}

const concernIconMap: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  target: Target,
  droplets: Droplets,
  'circle-dot': CircleDot,
  sun: Sun,
  star: Star,
  'clock-3': Clock3,
  shield: Shield,
  'shield-check': ShieldCheck,
};

export default async function ConcernsPage({ searchParams }: ConcernsPageProps) {
  const page = parseInt(searchParams.page || '1');
  const selectedConcern = getConcernBySlug(searchParams.concern);
  const { products = [], totalPages = 1, total = 0 } = selectedConcern
    ? await getConcernListing(selectedConcern.slug, page, 24)
    : { products: [], totalPages: 1, total: 0 };

  if (!searchParams.concern) {
    return (
      <div>
        <BrowseHubNav active="concerns" />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8 overflow-hidden rounded-[28px] border border-hairline bg-ink px-5 py-6 text-white shadow-card md:px-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-brass">Concern finder</p>
            <h1 className="text-3xl font-bold text-white md:text-4xl">Shop By Concern</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
              Explore one unified concern library across acne, melasma, dark spots, sensitivity, sunscreen, and more.
              Each concern listing follows the same Emart structure and product-grid experience.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {CONCERN_DEFINITIONS.map((concern) => (
                (() => {
                  const Icon = concernIconMap[concern.icon] || Sparkles;
                  return (
                    <Link
                      key={concern.slug}
                      href={getConcernHref(concern.slug)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/12"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{concern.label}</span>
                    </Link>
                  );
                })()
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-3">
            {CONCERN_DEFINITIONS.map((concern) => (
              (() => {
                const Icon = concernIconMap[concern.icon] || Sparkles;
                return (
                  <Link key={concern.slug} href={getConcernHref(concern.slug)}
                    className="rounded-2xl border border-hairline bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mb-2 text-base font-semibold text-ink">{concern.label}</div>
                    <div className="text-sm leading-6 text-muted">{concern.description}</div>
                  </Link>
                );
              })()
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedConcern) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-2xl border border-hairline bg-card px-6 py-10 text-center shadow-card">
          <h1 className="text-2xl font-bold text-ink">Concern not found</h1>
          <p className="mt-3 text-sm text-muted">That concern is not part of the current Emart concern library.</p>
          <Link href="/concerns" className="mt-5 inline-flex text-sm font-semibold text-accent hover:underline">
            View All →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BrowseHubNav active="concerns" />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-2 flex items-center gap-3">
          <Link href="/concerns" className="text-sm text-muted transition-colors hover:text-accent">Concerns</Link>
          <span className="text-muted-2">/</span>
          <span className="text-sm font-medium text-ink">{selectedConcern.label}</span>
        </div>

      <section className="mb-6 overflow-hidden rounded-[28px] border border-hairline bg-card px-5 py-6 shadow-card md:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-accent">Concern listing</p>
            {(() => {
              const Icon = concernIconMap[selectedConcern.icon] || Sparkles;
              return (
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h1 className="text-3xl font-bold text-ink md:text-4xl">{selectedConcern.label}</h1>
                </div>
              );
            })()}
            <p className="mt-3 text-sm leading-7 text-muted">{selectedConcern.description}</p>
          </div>
          <div className="rounded-2xl border border-hairline bg-bg-alt px-5 py-4">
            <span className="block text-2xl font-bold text-accent">{total}</span>
            <span className="text-sm text-muted">products matched</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {CONCERN_DEFINITIONS.map((concern) => (
            (() => {
              const Icon = concernIconMap[concern.icon] || Sparkles;
              return (
                <Link
                  key={concern.slug}
                  href={getConcernHref(concern.slug)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    concern.slug === selectedConcern.slug
                      ? 'bg-accent text-white'
                      : 'border border-hairline bg-bg-alt text-ink hover:border-accent/30 hover:bg-accent-soft hover:text-accent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{concern.label}</span>
                </Link>
              );
            })()
          ))}
        </div>
      </section>

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
                <Link href={`${getConcernHref(selectedConcern.slug)}&page=${page - 1}`}
                  className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black">Previous</Link>
              )}
              <span className="rounded-xl border border-hairline bg-bg-alt px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`${getConcernHref(selectedConcern.slug)}&page=${page + 1}`}
                  className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black">Next</Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center text-muted-2">
          <p className="text-lg text-ink">No products found for this concern</p>
          <p className="mt-2 text-sm text-muted">Try another concern from the list above or browse the full shop.</p>
          <Link href="/concerns" className="mt-2 block text-accent hover:underline">View All →</Link>
        </div>
      )}
      </div>
    </div>
  );
}
