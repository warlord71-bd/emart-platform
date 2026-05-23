import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import CollectionPageHeader from '@/components/collection/CollectionPageHeader';
import { CONCERN_DEFINITIONS, getConcernBySlug, getConcernListing } from '@/lib/concerns';
import { buildCollectionSchema } from '@/lib/collectionSchema';
import { absoluteUrl } from '@/lib/siteUrl';
import { BrowseHubNav } from '@/components/navigation/BrowseHubNav';
import {
  Sparkles, Target, Droplets, CircleDot, Sun, Star,
  Clock3, Shield, ShieldCheck, type LucideIcon,
} from 'lucide-react';
import EducationContent, { type EducationContentEntry } from '@/components/content/EducationContent';
import concernContent from '@/data/concern-content.json';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return CONCERN_DEFINITIONS.map((c) => ({ slug: c.slug }));
}

const CONCERN_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles, target: Target, droplets: Droplets,
  'circle-dot': CircleDot, sun: Sun, star: Star,
  'clock-3': Clock3, shield: Shield, 'shield-check': ShieldCheck,
};

interface Props {
  params: { slug: string };
  searchParams?: { page?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const concern = getConcernBySlug(params.slug);
  if (!concern) return { title: 'Concern Not Found' };

  const title = `${concern.label} Skincare Products in Bangladesh | Emart`;
  const description = `Shop authentic ${concern.label.toLowerCase()} skincare in Bangladesh at Emart. ${concern.description} Original products, COD and fast delivery available.`.substring(0, 155);

  return {
    title: { absolute: title },
    description,
    keywords: [
      `${concern.label} skincare Bangladesh`,
      `${concern.label.toLowerCase()} products Bangladesh`,
      `best ${concern.label.toLowerCase()} skincare Bangladesh`,
      `${concern.label.toLowerCase()} Korean skincare`,
      `authentic ${concern.label.toLowerCase()} products`,
      'Emart skincare Bangladesh',
    ],
    alternates: { canonical: absoluteUrl(`/concerns/${concern.slug}`) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/concerns/${concern.slug}`),
      images: [{ url: absoluteUrl('/images/hero-products.png'), width: 1200, height: 630, alt: `${concern.label} skincare at Emart Bangladesh` }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
  };
}

export default async function ConcernDetailPage({ params, searchParams }: Props) {
  const concern = getConcernBySlug(params.slug);
  if (!concern) notFound();

  const page = Math.max(1, parseInt(searchParams?.page || '1'));
  const { products, total, totalPages } = await getConcernListing(concern.slug, page, 24)
    .catch(() => ({ concern, products: [], total: 0, totalPages: 0 }));

  const canonicalUrl = absoluteUrl(`/concerns/${concern.slug}`);
  const description = `Shop authentic ${concern.label.toLowerCase()} skincare in Bangladesh. ${concern.description} All products original, imported directly — COD and fast delivery available.`;
  const educationContent = (concernContent as EducationContentEntry[]).find((item) => item.slug === concern.slug);

  const { breadcrumbJsonLd, collectionPageJsonLd, itemListJsonLd } = buildCollectionSchema({
    type: 'category',
    title: `${concern.label} | Emart`,
    description,
    url: canonicalUrl,
    breadcrumbs: [
      { name: 'Home', url: 'https://e-mart.com.bd' },
      { name: 'Concerns', url: 'https://e-mart.com.bd/concerns' },
      { name: concern.label, url: canonicalUrl },
    ],
    products,
    page,
  });

  const Icon = CONCERN_ICONS[concern.icon] || Sparkles;
  const iconNode = (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
      <Icon className="h-6 w-6" />
    </span>
  );

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}

      <BrowseHubNav active="concerns" />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <CollectionPageHeader
          type="category"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Concerns', href: '/concerns' },
            { label: concern.label },
          ]}
          title={concern.label}
          description={description}
          icon={iconNode}
          productCount={total}
        />

        {/* Concern switcher pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          {CONCERN_DEFINITIONS.map((c) => {
            const CIcon = CONCERN_ICONS[c.icon] || Sparkles;
            return (
              <Link
                key={c.slug}
                href={`/concerns/${c.slug}`}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  c.slug === concern.slug
                    ? 'bg-accent text-white'
                    : 'border border-hairline bg-bg-alt text-ink hover:border-accent/30 hover:bg-accent-soft hover:text-accent'
                }`}
              >
                <CIcon className="h-4 w-4" />
                {c.label}
              </Link>
            );
          })}
        </div>

        {educationContent && <EducationContent content={educationContent} />}

        {concern.categorySlug && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-hairline bg-bg-alt px-5 py-4">
            <p className="text-sm text-muted">Browse the full <span className="font-semibold text-ink">{concern.label}</span> collection</p>
            <Link
              href={`/category/${concern.categorySlug}`}
              className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              Shop all →
            </Link>
          </div>
        )}

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/concerns/${concern.slug}?page=${page - 1}`}
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
                    href={`/concerns/${concern.slug}?page=${page + 1}`}
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
            <p className="text-muted">No products found for this concern.</p>
            <Link href="/concerns" className="mt-2 block text-sm text-accent hover:underline">
              View all concerns
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
