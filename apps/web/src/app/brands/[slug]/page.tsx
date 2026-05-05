import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/product/ProductCard';
import { getBrandBySlug, getProductsByProductBrand } from '@/lib/woocommerce';
import brandLogoManifest from '../../../../public/images/brands-e-mart/manifest.json';
import { ArrowLeft } from 'lucide-react';
import { absoluteUrl } from '@/lib/siteUrl';

export const revalidate = 1800;
export const dynamicParams = true;

const brandLogoBySlug = new Map<string, string>();
for (const entry of brandLogoManifest as Array<{ slug: string; logo: string | null }>) {
  if (entry.logo) brandLogoBySlug.set(entry.slug.toLowerCase(), entry.logo);
}

interface Props {
  params: { slug: string };
  searchParams?: { page?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brand = await getBrandBySlug(params.slug);
  if (!brand) return { title: 'Brand Not Found' };

  const logo = brandLogoBySlug.get(brand.slug.toLowerCase());
  const desc = `Buy original ${brand.name} skincare in Bangladesh at Emart. Best prices for ${brand.name} products with COD and fast nationwide delivery.`;
  const title = `${brand.name} Bangladesh | Authentic ${brand.name} Products | Emart`;

  return {
    title: { absolute: title },
    description: desc,
    alternates: { canonical: absoluteUrl(`/brands/${brand.slug}`) },
    openGraph: {
      title,
      description: desc,
      url: absoluteUrl(`/brands/${brand.slug}`),
      images: logo ? [{ url: logo }] : undefined,
    },
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const brand = await getBrandBySlug(params.slug).catch(() => null);
  if (!brand) notFound();

  const page = Math.max(1, parseInt(searchParams?.page || '1'));

  const { products, total, totalPages } = await getProductsByProductBrand(brand.id, page, 24)
    .catch(() => ({ products: [], total: 0, totalPages: 0 }));

  const logo = brandLogoBySlug.get(brand.slug.toLowerCase());

  return (
    <div className="min-h-screen bg-bg">
      {/* Brand header */}
      <div className="border-b border-hairline bg-card px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span>/</span>
            <Link href="/brands" className="hover:text-accent">Brands</Link>
            <span>/</span>
            <span className="font-semibold text-ink">{brand.name}</span>
          </nav>

          <div className="flex items-center gap-5">
            {logo && (
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-hairline bg-white p-2 shadow-sm">
                <Image src={logo} alt={brand.name} fill sizes="64px" className="object-contain" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-extrabold text-ink">{brand.name}</h1>
              <p className="mt-1 text-sm text-muted">
                {total > 0 ? `${total} product${total === 1 ? '' : 's'} available` : 'No products currently in stock'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted">No products found for this brand.</p>
            <Link href="/brands" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to all brands
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/brands/${params.slug}?page=${page - 1}`}
                    className="rounded-lg border border-hairline bg-card px-4 py-2 text-sm font-semibold text-ink hover:border-accent/30"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-sm text-muted">Page {page} of {totalPages}</span>
                {page < totalPages && (
                  <Link
                    href={`/brands/${params.slug}?page=${page + 1}`}
                    className="rounded-lg border border-hairline bg-card px-4 py-2 text-sm font-semibold text-ink hover:border-accent/30"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
