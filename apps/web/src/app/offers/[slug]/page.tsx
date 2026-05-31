import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CollectionPageHeader from '@/components/collection/CollectionPageHeader';
import ProductCard from '@/components/product/ProductCard';
import { ProductListGrid } from '@/components/product/ProductListGrid';
import {
  getOfferCollectionConfig,
  getOfferCollectionProducts,
} from '@/lib/offerCollections';
import type { OfferCollectionSlug } from '@/lib/offerCollectionConfig';
import { absoluteUrl } from '@/lib/siteUrl';

export const revalidate = 1800;

interface OfferPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: OfferPageProps): Promise<Metadata> {
  const config = getOfferCollectionConfig(params.slug);
  if (!config) return {};
  const title = config.seoTitle || `${config.title} Skincare Deals in Bangladesh | Emart`;
  const description = config.seoDescription || config.description;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: absoluteUrl(config.href),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(config.href),
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function OfferCollectionPage({ params }: OfferPageProps) {
  const config = getOfferCollectionConfig(params.slug);
  if (!config) notFound();

  const products = await getOfferCollectionProducts(config.slug as OfferCollectionSlug, 24);
  const description = config.seoDescription || config.description;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Offers', item: absoluteUrl('/offers') },
      { '@type': 'ListItem', position: 3, name: config.title, item: absoluteUrl(config.href) },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: config.seoTitle || `${config.title} Skincare Deals in Bangladesh`,
    description,
    url: absoluteUrl(config.href),
    ...(products.length > 0
      ? {
          // Use ItemList/ListItem instead of Product to avoid GSC warning:
          // "offers, review, or aggregateRating should be specified"
          // Product @type requires price/review data which isn't available here
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: products.length,
            itemListElement: products.slice(0, 10).map((product, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: product.name,
              url: absoluteUrl(`/shop/${product.slug}`),
            })),
          },
        }
      : {}),
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />

      <CollectionPageHeader
        type="offer"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Offers', href: '/offers' },
          { label: config.title },
        ]}
        title={config.title}
        description={config.description}
        productCount={products.length}
      />

      {products.length > 0 ? (
        <ProductListGrid>
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i === 0} />
          ))}
        </ProductListGrid>
      ) : (
        <div className="rounded-2xl border border-hairline bg-card px-6 py-12 text-center shadow-card">
          <div className="text-4xl">🛍️</div>
          <h2 className="mt-4 text-xl font-bold text-ink">This collection is being filled</h2>
          <p className="mt-2 text-sm text-muted">
            More products will be added here shortly. You can still browse the main shop in the meantime.
          </p>
          <a href="/shop" className="mt-5 inline-flex rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-black">
            Browse Shop
          </a>
        </div>
      )}
    </main>
  );
}
