import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
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

  return {
    title: config.title,
    description: config.description,
    alternates: {
      canonical: absoluteUrl(config.href),
    },
    openGraph: {
      title: `${config.title} | Emart`,
      description: config.description,
      url: absoluteUrl(config.href),
    },
  };
}

export default async function OfferCollectionPage({ params }: OfferPageProps) {
  const config = getOfferCollectionConfig(params.slug);
  if (!config) notFound();

  const products = await getOfferCollectionProducts(config.slug as OfferCollectionSlug, 24);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className={`mb-8 overflow-hidden rounded-[28px] border border-hairline bg-gradient-to-br ${config.accent} px-5 py-6 shadow-card`}>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">{config.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">{config.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{config.description}</p>
      </section>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
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
