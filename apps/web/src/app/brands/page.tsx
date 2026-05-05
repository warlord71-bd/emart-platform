import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getBrands, type WooBrand } from '@/lib/woocommerce';
import brandLogoManifest from '../../../public/images/brands-e-mart/manifest.json';
import { canonicalPath } from '@/lib/canonicalUrl';
import { BrowseHubNav } from '@/components/navigation/BrowseHubNav';
import { Search, Sparkles, Tags } from 'lucide-react';

const brandLogoBySlug = new Map<string, string>();
for (const entry of brandLogoManifest as Array<{ slug: string; logo: string | null }>) {
  if (entry.logo) brandLogoBySlug.set(entry.slug.toLowerCase(), entry.logo);
}

export function generateMetadata({ searchParams }: { searchParams?: { brand?: string; page?: string } }): Metadata {
  return {
    title: 'Shop By Brands | Emart Skincare Bangladesh',
    description: 'Browse all available beauty brands at Emart Skincare Bangladesh.',
    alternates: { canonical: canonicalPath('/brands', searchParams) },
  };
}

export const revalidate = 1800;

function groupByLetter(brands: WooBrand[]) {
  const grouped: Record<string, WooBrand[]> = {};
  brands.forEach((brand) => {
    const first = brand.name.trim()[0]?.toUpperCase() || '#';
    const l = /^[A-Z0-9&]$/.test(first) ? first : '#';
    if (!grouped[l]) grouped[l] = [];
    grouped[l].push(brand);
  });
  return grouped;
}

function BrandLogo({ brand, className = 'h-9 w-16' }: { brand: WooBrand; className?: string }) {
  const logo = brandLogoBySlug.get(brand.slug.toLowerCase());

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {logo ? (
        <Image src={logo} alt={brand.name} fill sizes="96px" className="object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-md bg-bg-alt text-sm font-black text-ink/55">
          {brand.name.trim().charAt(0).toUpperCase() || '#'}
        </div>
      )}
    </div>
  );
}

function BrandRow({ brand }: { brand: WooBrand }) {
  return (
    <Link
      href={`/brands/${encodeURIComponent(brand.slug)}`}
      className="group flex min-w-0 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent-soft"
    >
      <BrandLogo brand={brand} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-ink group-hover:text-accent">{brand.name}</span>
        <span className="text-xs text-muted">{brand.count} item{brand.count === 1 ? '' : 's'}</span>
      </span>
    </Link>
  );
}

export default async function BrandsPage({
  searchParams,
}: {
  searchParams?: { brand?: string; page?: string };
}) {
  const selectedBrandSlug = searchParams?.brand?.trim() || '';
  const page = parseInt(searchParams?.page || '1');

  if (selectedBrandSlug) {
    permanentRedirect(`/brands/${encodeURIComponent(selectedBrandSlug)}${page > 1 ? `?page=${page}` : ''}`);
  }

  let wcBrands: WooBrand[] = [];
  try {
    wcBrands = await getBrands({ orderby: 'name', order: 'asc' });
  } catch {
    // WordPress API unreachable — show an empty brand list rather than noisy legacy attributes.
  }
  const brands = wcBrands.sort((a, b) => a.name.localeCompare(b.name));
  const grouped = groupByLetter(brands);
  const letters = Object.keys(grouped).sort();
  const featuredBrands = brands.slice().sort((a, b) => b.count - a.count).slice(0, 12);
  const totalProducts = brands.reduce((sum, brand) => sum + (brand.count || 0), 0);

  return (
    <div className="min-h-screen bg-bg pb-10">
      <BrowseHubNav active="brands" />

      <header className="border-b border-hairline bg-card px-4 py-6">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-hairline bg-bg px-3 py-1 text-xs font-bold uppercase text-accent">
              <Tags className="h-3.5 w-3.5" />
              Brand directory
            </div>
            <h1 className="text-3xl font-black text-ink sm:text-4xl">Shop by Brand</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {brands.length} active brands and {totalProducts.toLocaleString()} listed products, arranged for fast scanning.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
            <div className="rounded-lg border border-hairline bg-bg px-3 py-3">
              <div className="text-xl font-black text-ink">{brands.length}</div>
              <div className="mt-0.5 text-[11px] font-semibold uppercase text-muted">Brands</div>
            </div>
            <div className="rounded-lg border border-hairline bg-bg px-3 py-3">
              <div className="text-xl font-black text-ink">{letters.length}</div>
              <div className="mt-0.5 text-[11px] font-semibold uppercase text-muted">Groups</div>
            </div>
            <Link href="/shop" className="rounded-lg bg-ink px-3 py-3 text-white transition-colors hover:bg-black">
              <Search className="mx-auto h-5 w-5" />
              <div className="mt-1 text-[11px] font-bold uppercase">Shop</div>
            </Link>
          </div>
        </div>
      </header>

      {featuredBrands.length > 0 && (
        <section className="border-b border-hairline bg-white px-4 py-4">
          <div className="mx-auto max-w-7xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-ink">
              <Sparkles className="h-4 w-4 text-accent" />
              Most stocked brands
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {featuredBrands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/brands/${encodeURIComponent(brand.slug)}`}
                  className="group flex min-w-0 items-center gap-3 rounded-lg border border-hairline bg-bg px-3 py-2 transition-all hover:border-accent/40 hover:bg-card hover:shadow-sm"
                >
                  <BrandLogo brand={brand} className="h-8 w-12" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-black text-ink group-hover:text-accent">{brand.name}</span>
                    <span className="text-[11px] text-muted">{brand.count} item{brand.count === 1 ? '' : 's'}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="sticky top-[120px] z-40 border-b border-hairline bg-white/95 px-4 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto pb-1">
          {letters.map((l) => (
            <a key={l} href={`#brand-${l}`}
              className="flex h-8 min-w-8 items-center justify-center rounded-md bg-bg-alt px-2 text-xs font-black text-ink transition-colors hover:bg-accent hover:text-white">
              {l}
            </a>
          ))}
          <Link href="/shop"
            className="ml-1 flex h-8 min-w-max items-center justify-center rounded-md bg-ink px-3 text-xs font-bold text-white transition-colors hover:bg-black">
            All Products
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {letters.map((letter) => (
          <section
            key={letter}
            id={`brand-${letter}`}
            className="scroll-mt-40 overflow-hidden rounded-lg border border-hairline bg-card shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-hairline bg-bg px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-base font-black text-white">
                {letter}
              </div>
              <div className="text-xs font-bold text-muted">
                {grouped[letter].length} brand{grouped[letter].length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-hairline sm:grid-cols-2 sm:divide-x sm:divide-y-0 md:grid-cols-1 md:divide-x-0 md:divide-y xl:grid-cols-1">
              {grouped[letter].slice(0, 3).map((brand) => (
                <BrandRow key={brand.slug} brand={brand} />
              ))}
            </div>
            {grouped[letter].length > 3 && (
              <details className="group border-t border-hairline">
                <summary className="flex cursor-pointer list-none items-center justify-between bg-bg px-3 py-2 text-xs font-black text-accent transition-colors hover:bg-accent-soft [&::-webkit-details-marker]:hidden">
                  <span>Show more</span>
                  <span className="text-muted group-open:hidden">+{grouped[letter].length - 3}</span>
                  <span className="hidden text-muted group-open:inline">Show less</span>
                </summary>
                <div className="grid grid-cols-1 divide-y divide-hairline sm:grid-cols-2 sm:divide-x sm:divide-y-0 md:grid-cols-1 md:divide-x-0 md:divide-y xl:grid-cols-1">
                  {grouped[letter].slice(3).map((brand) => (
                    <BrandRow key={brand.slug} brand={brand} />
                  ))}
                </div>
              </details>
            )}
          </section>
        ))}
        </div>

        <div className="mt-6 rounded-lg border border-hairline bg-card p-6 text-center shadow-card">
          <div className="mb-2 text-4xl font-bold text-accent">{brands.length}</div>
          <p className="mb-4 text-sm text-muted">Available brands curated for Bangladesh</p>
          <Link href="/shop"
            className="inline-block rounded-lg bg-ink px-8 py-3 font-semibold text-white transition-colors hover:bg-black">
            Shop All Products
          </Link>
        </div>
      </main>
    </div>
  );
}
