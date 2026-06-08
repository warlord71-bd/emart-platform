import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import CollectionPageHeader from '@/components/collection/CollectionPageHeader';
import CatalogFilters from '@/components/product/CatalogFilters';
import { ProductListGrid } from '@/components/product/ProductListGrid';
import { getBrandBySlug, getProductsByProductBrand } from '@/lib/woocommerce';
import { buildCollectionSchema, getBrandDescription } from '@/lib/collectionSchema';
import { absoluteUrl } from '@/lib/siteUrl';
import { safeJsonLd } from '@/lib/sanitizeHtml';
import { STORE_POLICIES } from '@/config/storePolicies';
import { findCanonicalBrand } from '@/lib/brandWhitelist';
import {
  getPaginatedCanonical,
  getPaginatedTitle,
  getPaginationHref,
  getValidPage,
} from '@/lib/paginationSeo';
import brandLogoManifest from '../../../../public/images/brands-e-mart/manifest.json';

export const revalidate = 1800;
export const dynamicParams = true;

const brandLogoBySlug = new Map<string, string>();
for (const entry of brandLogoManifest as Array<{ slug: string; logo: string | null }>) {
  if (entry.logo) brandLogoBySlug.set(entry.slug.toLowerCase(), entry.logo);
}

interface Props {
  params: { slug: string };
  searchParams?: { page?: string; sort?: string; price?: string };
}

function getBrandOriginLabel(slug: string, name: string): string | undefined {
  const canonical = findCanonicalBrand(slug) || findCanonicalBrand(name);
  if (canonical?.region === 'korean') return 'South Korea';
  return undefined;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const brand = await getBrandBySlug(params.slug);
  if (!brand) notFound();

  const logo = brandLogoBySlug.get(brand.slug.toLowerCase());
  const desc = getBrandDescription(brand.name);
  const baseTitle = `${brand.name} Bangladesh | Authentic Products | Emart`;
  const page = getValidPage(searchParams?.page);
  const canonical = getPaginatedCanonical(`/brands/${brand.slug}`, page);
  const title = getPaginatedTitle(baseTitle, page);

  return {
    title: { absolute: title },
    description: desc,
    alternates: { canonical },
    openGraph: {
      title,
      description: desc,
      url: canonical,
      images: logo ? [{ url: logo }] : undefined,
    },
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const brand = await getBrandBySlug(params.slug).catch(() => null);
  if (!brand) notFound();

  const page = getValidPage(searchParams?.page);

  const { products, total, totalPages } = await getProductsByProductBrand(brand.id, page, 24)
    .catch(() => ({ products: [], total: 0, totalPages: 0 }));

  // Empty brand page: return noindex instead of thin indexable content
  if (total === 0 && page === 1) notFound();

  const logo = brandLogoBySlug.get(brand.slug.toLowerCase());
  const originLabel = getBrandOriginLabel(brand.slug, brand.name);
  const description = originLabel
    ? `${getBrandDescription(brand.name)} ${brand.name} is represented here as a ${originLabel}-origin beauty brand.`
    : getBrandDescription(brand.name);
  const canonicalUrl = getPaginatedCanonical(`/brands/${brand.slug}`, page);

  const { breadcrumbJsonLd, collectionPageJsonLd, itemListJsonLd } = buildCollectionSchema({
    type: 'brand',
    title: `${brand.name} Bangladesh | Emart`,
    description,
    url: canonicalUrl,
    breadcrumbs: [
      { name: 'Home', url: 'https://e-mart.com.bd' },
      { name: 'Brands', url: 'https://e-mart.com.bd/brands' },
      { name: brand.name, url: canonicalUrl },
    ],
    products,
    page,
  });
  const brandJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    '@id': `${canonicalUrl}#brand`,
    name: brand.name,
    url: canonicalUrl,
    ...(logo ? { logo: absoluteUrl(logo), image: absoluteUrl(logo) } : {}),
    description,
    ...(originLabel ? { disambiguatingDescription: `${brand.name} products at Emart are listed as ${originLabel}-origin beauty products.` } : {}),
    mainEntityOfPage: canonicalUrl,
  };

  const logoIcon = logo ? (
    <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-hairline bg-white p-1.5 shadow-sm">
      <Image src={logo} alt={brand.name} fill sizes="56px" className="object-contain" />
    </div>
  ) : undefined;

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionPageJsonLd) }} />
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(brandJsonLd) }} />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <CollectionPageHeader
          type="brand"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Brands', href: '/brands' },
            { label: brand.name },
          ]}
          title={brand.name}
          description={description}
          icon={logoIcon}
          productCount={total}
        />

        <Suspense>
          <CatalogFilters
            basePath={`/brands/${params.slug}`}
            searchParams={searchParams ?? {}}
            resultCount={products.length}
            totalCount={total}
            defaultSort="popularity"
            variant="mobile"
          />
        </Suspense>

        <div className="flex gap-6">
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <Suspense>
              <CatalogFilters
                basePath={`/brands/${params.slug}`}
                searchParams={searchParams ?? {}}
                resultCount={products.length}
                totalCount={total}
                defaultSort="popularity"
                variant="desktop"
              />
            </Suspense>
          </aside>

          <div className="flex-1">
            {products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-muted">No products found for this brand.</p>
                <Link href="/brands" className="mt-2 block text-sm font-semibold text-accent hover:underline">
                  Browse all brands
                </Link>
              </div>
            ) : (
              <>
                <ProductListGrid>
                  {products.map((product, i) => (
                    <ProductCard key={product.id} product={product} priority={i === 0 && page === 1} />
                  ))}
                </ProductListGrid>

                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    {page > 1 && (
                      <Link
                        href={getPaginationHref(`/brands/${params.slug}`, searchParams, page - 1)}
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
                        href={getPaginationHref(`/brands/${params.slug}`, searchParams, page + 1)}
                        className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                )}

                <details className="mt-14 rounded-2xl border border-hairline bg-white p-5">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-ink marker:hidden">
                    About {brand.name} in Bangladesh
                    <span className="ml-2 text-accent">Read more</span>
                  </summary>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
                    Emart is Bangladesh&apos;s trusted source for authentic {brand.name} products. Every item is imported
                    directly from the brand or authorised distributors — no counterfeits, no grey market. We offer Cash
                    on Delivery (COD) across Bangladesh. {STORE_POLICIES.shipping.pdpDeliveryText}.
                    {' '}{STORE_POLICIES.shipping.checkoutFeeText}
                    {originLabel ? ` Origin: ${originLabel}.` : ''}
                  </p>
                </details>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
