import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import CollectionPageHeader from '@/components/collection/CollectionPageHeader';
import { ROUTINE_STEPS, getRoutineStepBySlug, getRoutineListing } from '@/lib/routine';
import { buildCollectionSchema } from '@/lib/collectionSchema';
import { absoluteUrl } from '@/lib/siteUrl';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return ROUTINE_STEPS.map((s) => ({ step: s.slug }));
}

interface Props {
  params: { step: string };
  searchParams?: { page?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const step = getRoutineStepBySlug(params.step);
  if (!step) return { title: 'Routine Step Not Found' };

  return {
    title: { absolute: `${step.label} | Korean Skincare Routine Step ${step.step} | Emart` },
    description: step.metaDescription,
    alternates: { canonical: absoluteUrl(`/routine/${step.slug}`) },
    openGraph: {
      title: `${step.label} — Skincare Routine Step ${step.step} | Emart Bangladesh`,
      description: step.metaDescription,
      url: absoluteUrl(`/routine/${step.slug}`),
    },
    robots: { index: true, follow: true },
  };
}

export default async function RoutineStepPage({ params, searchParams }: Props) {
  const step = getRoutineStepBySlug(params.step);
  if (!step) notFound();

  const page = Math.max(1, parseInt(searchParams?.page || '1'));
  const { products, total, totalPages } = await getRoutineListing(step.slug, page, 24)
    .catch(() => ({ step, products: [], total: 0, totalPages: 0 }));

  const canonicalUrl = absoluteUrl(`/routine/${step.slug}`);

  const { breadcrumbJsonLd, collectionPageJsonLd, itemListJsonLd } = buildCollectionSchema({
    type: 'category',
    title: `${step.label} | Emart`,
    description: step.metaDescription,
    url: canonicalUrl,
    breadcrumbs: [
      { name: 'Home', url: 'https://e-mart.com.bd' },
      { name: 'Routine', url: 'https://e-mart.com.bd/routine' },
      { name: step.label, url: canonicalUrl },
    ],
    products,
    page,
  });

  const iconNode = (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brass-soft text-2xl">
      {step.icon}
    </span>
  );

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}

      <div className="mx-auto max-w-7xl px-4 py-8">
        <CollectionPageHeader
          type="category"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Routine', href: '/routine' },
            { label: step.label },
          ]}
          title={`Step ${step.step}: ${step.label}`}
          description={step.description}
          icon={iconNode}
          productCount={total}
        />

        {/* Routine step switcher */}
        <div className="mb-6 flex flex-wrap gap-2">
          {ROUTINE_STEPS.map((s) => (
            <Link
              key={s.slug}
              href={`/routine/${s.slug}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                s.slug === step.slug
                  ? 'bg-ink text-white'
                  : 'border border-hairline bg-bg-alt text-ink hover:border-ink/30 hover:bg-white hover:text-ink'
              }`}
            >
              <span>{s.icon}</span>
              {s.shortLabel}
            </Link>
          ))}
        </div>

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
                  <Link href={`/routine/${step.slug}?page=${page - 1}`}
                    className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black">
                    Previous
                  </Link>
                )}
                <span className="rounded-xl border border-hairline bg-bg-alt px-4 py-2 text-sm text-muted">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link href={`/routine/${step.slug}?page=${page + 1}`}
                    className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black">
                    Next
                  </Link>
                )}
              </div>
            )}

            <details className="mt-14 rounded-2xl border border-hairline bg-white p-5">
              <summary className="cursor-pointer list-none text-sm font-semibold text-ink marker:hidden">
                Why use {step.label} in your routine?
                <span className="ml-2 text-accent">Read more</span>
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
                {step.description} Every product at Emart is imported directly from the brand or
                authorised distributors — 100% authentic, no counterfeits. We offer Cash on Delivery
                (COD) across all 64 districts of Bangladesh with fast delivery.
              </p>
            </details>
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="text-muted">No products found for this step.</p>
            <Link href="/routine" className="mt-2 block text-sm text-accent hover:underline">
              Browse all routine steps
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
