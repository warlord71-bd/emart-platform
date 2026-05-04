import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getBrands, type WooBrand } from '@/lib/woocommerce';
import brandLogoManifest from '../../../public/images/brands-e-mart/manifest.json';
import { canonicalPath } from '@/lib/canonicalUrl';
import { BrowseHubNav } from '@/components/navigation/BrowseHubNav';

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
    const l = brand.name[0].toUpperCase();
    if (!grouped[l]) grouped[l] = [];
    grouped[l].push(brand);
  });
  return grouped;
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

  return (
    <div className="min-h-screen bg-bg">
      <BrowseHubNav active="brands" />
      {/* Hero */}
      <div className="border-b border-hairline bg-card px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-1 text-3xl font-bold text-ink">Shop by Brand</h1>
          <p className="text-sm text-muted">{brands.length} available brands with products ready to shop</p>
        </div>
      </div>

      {/* Letter Index */}
      <div className="sticky top-[120px] z-40 border-b border-hairline bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-1">
          {letters.map((l) => (
            <a key={l} href={`#brand-${l}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-alt text-xs font-bold text-ink transition-colors hover:bg-accent hover:text-white">
              {l}
            </a>
          ))}
          <Link href="/shop"
            className="ml-2 flex h-8 items-center justify-center rounded-full bg-ink px-3 text-xs font-bold text-white transition-colors hover:bg-black">
            All Brands (A-Z)
          </Link>
        </div>
      </div>

      {/* Brand Sections */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {letters.map((letter) => (
          <div key={letter} id={`brand-${letter}`} className="mb-10 scroll-mt-40">
            {/* Letter Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-lg font-bold text-white">
                {letter}
              </div>
              <div className="h-px flex-1 bg-hairline" />
            </div>

            {/* Desktop: 6 columns grid | Mobile: 2 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {grouped[letter].map((brand) => {
                const logo = brandLogoBySlug.get(brand.slug.toLowerCase());
                return (
                  <Link key={brand.slug}
                    href={`/brands/${encodeURIComponent(brand.slug)}`}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-hairline bg-card p-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card">
                    <div className="relative h-12 w-full">
                      {logo ? (
                        <Image src={logo} alt={brand.name} fill sizes="160px" className="object-contain" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-extrabold text-ink/60">
                          {brand.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-semibold leading-tight text-ink transition-colors group-hover:text-accent">
                      {brand.name}
                    </div>
                    <div className="text-[11px] text-muted-2">
                      {brand.count} item{brand.count === 1 ? '' : 's'}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Bottom CTA */}
        <div className="mt-8 rounded-2xl border border-hairline bg-card p-8 text-center shadow-card">
          <div className="mb-2 text-4xl font-bold text-accent">{brands.length}</div>
          <p className="mb-4 text-sm text-muted">Available brands curated for Bangladesh</p>
          <Link href="/shop"
            className="inline-block rounded-xl bg-ink px-8 py-3 font-semibold text-white transition-colors hover:bg-black">
            Shop All Products
          </Link>
        </div>
      </div>
    </div>
  );
}
