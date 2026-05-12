import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import CollectionPageHeader from '@/components/collection/CollectionPageHeader';
import { INGREDIENT_DEFINITIONS, getIngredientBySlug, getIngredientListing } from '@/lib/ingredients';
import { buildCollectionSchema } from '@/lib/collectionSchema';
import { absoluteUrl } from '@/lib/siteUrl';
import { BrowseHubNav } from '@/components/navigation/BrowseHubNav';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return INGREDIENT_DEFINITIONS.map((i) => ({ slug: i.slug }));
}

interface Props {
  params: { slug: string };
  searchParams?: { page?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ingredient = getIngredientBySlug(params.slug);
  if (!ingredient) return { title: 'Ingredient Not Found' };

  return {
    title: { absolute: `${ingredient.label} Skincare Products in Bangladesh | Emart` },
    description: ingredient.metaDescription,
    alternates: { canonical: absoluteUrl(`/ingredients/${ingredient.slug}`) },
    openGraph: {
      title: `${ingredient.label} Skincare | Emart Bangladesh`,
      description: ingredient.metaDescription,
      url: absoluteUrl(`/ingredients/${ingredient.slug}`),
    },
    robots: { index: true, follow: true },
  };
}

export default async function IngredientDetailPage({ params, searchParams }: Props) {
  const ingredient = getIngredientBySlug(params.slug);
  if (!ingredient) notFound();

  const page = Math.max(1, parseInt(searchParams?.page || '1'));
  const { products, total, totalPages } = await getIngredientListing(ingredient.slug, page, 24)
    .catch(() => ({ ingredient, products: [], total: 0, totalPages: 0 }));

  const canonicalUrl = absoluteUrl(`/ingredients/${ingredient.slug}`);

  const { breadcrumbJsonLd, collectionPageJsonLd, itemListJsonLd } = buildCollectionSchema({
    type: 'category',
    title: `${ingredient.label} Skincare | Emart`,
    description: ingredient.metaDescription,
    url: canonicalUrl,
    breadcrumbs: [
      { name: 'Home', url: 'https://e-mart.com.bd' },
      { name: 'Ingredients', url: 'https://e-mart.com.bd/ingredients' },
      { name: ingredient.label, url: canonicalUrl },
    ],
    products,
    page,
  });

  const iconNode = (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-soft text-2xl">
      {ingredient.icon}
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
            { label: 'Ingredients', href: '/ingredients' },
            { label: ingredient.label },
          ]}
          title={ingredient.label}
          description={ingredient.metaDescription}
          icon={iconNode}
          productCount={total}
        />

        {/* Ingredient switcher */}
        <div className="mb-6 flex flex-wrap gap-2">
          {INGREDIENT_DEFINITIONS.map((ing) => (
            <Link
              key={ing.slug}
              href={`/ingredients/${ing.slug}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                ing.slug === ingredient.slug
                  ? 'bg-accent text-white'
                  : 'border border-hairline bg-bg-alt text-ink hover:border-accent/30 hover:bg-accent-soft hover:text-accent'
              }`}
            >
              <span>{ing.icon}</span>
              {ing.label}
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
                  <Link
                    href={`/ingredients/${ingredient.slug}?page=${page - 1}`}
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
                    href={`/ingredients/${ingredient.slug}?page=${page + 1}`}
                    className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}

            <details className="mt-14 rounded-2xl border border-hairline bg-white p-5">
              <summary className="cursor-pointer list-none text-sm font-semibold text-ink marker:hidden">
                About {ingredient.label} in skincare
                <span className="ml-2 text-accent">Read more</span>
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
                {ingredient.description} Every {ingredient.label} product at Emart is imported directly
                from the brand or authorised distributors — 100% authentic, no counterfeits. We offer
                Cash on Delivery (COD) across all 64 districts of Bangladesh.
              </p>
            </details>
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="text-muted">No products found for this ingredient.</p>
            <Link href="/ingredients" className="mt-2 block text-sm text-accent hover:underline">
              Browse all ingredients
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
