import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import CollectionPageHeader from '@/components/collection/CollectionPageHeader';
import CatalogFilters from '@/components/product/CatalogFilters';
import { ProductListGrid } from '@/components/product/ProductListGrid';
import { INGREDIENT_DEFINITIONS, getIngredientBySlug, getIngredientListing } from '@/lib/ingredients';
import { buildCollectionSchema } from '@/lib/collectionSchema';
import { absoluteUrl } from '@/lib/siteUrl';
import { BrowseHubNav } from '@/components/navigation/BrowseHubNav';
import EducationContent, { type EducationContentEntry } from '@/components/content/EducationContent';
import ingredientContent from '@/data/ingredient-content.json';
import {
  getPaginatedCanonical,
  getPaginatedTitle,
  getPaginationHref,
  getValidPage,
} from '@/lib/paginationSeo';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return INGREDIENT_DEFINITIONS.map((i) => ({ slug: i.slug }));
}

interface Props {
  params: { slug: string };
  searchParams?: { page?: string; sort?: string; price?: string; in_stock?: string };
}

const PRICE_MAP = {
  under500: { min_price: undefined, max_price: '500' },
  '500-1000': { min_price: '500', max_price: '1000' },
  '1000-2000': { min_price: '1000', max_price: '2000' },
  '2000plus': { min_price: '2000', max_price: undefined },
} satisfies Record<string, { min_price?: string; max_price?: string }>;

const SORT_MAP = {
  newest: { orderby: 'date', order: 'desc' },
  'price-asc': { orderby: 'price', order: 'asc' },
  'price-desc': { orderby: 'price', order: 'desc' },
  popularity: { orderby: 'popularity', order: 'desc' },
  rating: { orderby: 'rating', order: 'desc' },
} satisfies Record<string, { orderby: 'date' | 'price' | 'popularity' | 'rating' | 'title'; order: 'asc' | 'desc' }>;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const ingredient = getIngredientBySlug(params.slug);
  if (!ingredient) return { title: 'Ingredient Not Found' };

  const page = getValidPage(searchParams?.page);
  const canonical = getPaginatedCanonical(`/ingredients/${ingredient.slug}`, page);
  const title = getPaginatedTitle(`${ingredient.label} Skincare Products in Bangladesh | Emart`, page);

  return {
    title: { absolute: title },
    description: ingredient.metaDescription,
    keywords: [
      `${ingredient.label} skincare Bangladesh`,
      `${ingredient.label.toLowerCase()} products Bangladesh`,
      `best ${ingredient.label.toLowerCase()} skincare`,
      `${ingredient.label.toLowerCase()} Korean skincare Bangladesh`,
      'authentic skincare Bangladesh',
      'Emart skincare Bangladesh',
    ],
    alternates: { canonical },
    openGraph: {
      title,
      description: ingredient.metaDescription,
      url: canonical,
      images: [{ url: absoluteUrl('/images/hero-products.png'), width: 1200, height: 630, alt: `${ingredient.label} skincare products at Emart Bangladesh` }],
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

export default async function IngredientDetailPage({ params, searchParams }: Props) {
  const ingredient = getIngredientBySlug(params.slug);
  if (!ingredient) notFound();

  const page = getValidPage(searchParams?.page);
  const extras: { orderby?: 'date'|'price'|'popularity'|'rating'|'title'; order?: 'asc'|'desc'; min_price?: string; max_price?: string; stock_status?: 'instock'|'outofstock'|'onbackorder' } = {};
  const sortKey = searchParams?.sort as keyof typeof SORT_MAP | undefined;
  if (sortKey && sortKey in SORT_MAP) Object.assign(extras, SORT_MAP[sortKey]);
  const priceKey = searchParams?.price as keyof typeof PRICE_MAP | undefined;
  if (priceKey && priceKey in PRICE_MAP) { const p = PRICE_MAP[priceKey]; if (p.min_price) extras.min_price = p.min_price; if (p.max_price) extras.max_price = p.max_price; }
  if (searchParams?.in_stock === '1') extras.stock_status = 'instock';
  const { products, total, totalPages } = await getIngredientListing(ingredient.slug, page, 24, extras)
    .catch(() => ({ ingredient, products: [], total: 0, totalPages: 0 }));
  const searchParamsRecord: Record<string, string | undefined> = {
    page: searchParams?.page, sort: searchParams?.sort, price: searchParams?.price, in_stock: searchParams?.in_stock,
  };

  const canonicalUrl = getPaginatedCanonical(`/ingredients/${ingredient.slug}`, page);
  const educationContent = (ingredientContent as EducationContentEntry[]).find((item) => item.slug === ingredient.slug);

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

  const faqJsonLd = educationContent?.faq?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: educationContent.faq.map((item: { q: string; a: string }) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }
    : null;

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <BrowseHubNav active="ingredients" />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <CollectionPageHeader
          type="ingredient"
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
        <div className="-mx-4 mb-6 flex flex-nowrap gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {INGREDIENT_DEFINITIONS.map((ing) => (
            <Link
              key={ing.slug}
              href={`/ingredients/${ing.slug}`}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
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

        {educationContent && <EducationContent content={educationContent} />}

        {/* Mobile filters */}
        <div className="mb-4 lg:hidden">
          <CatalogFilters basePath={`/ingredients/${ingredient.slug}`} searchParams={searchParamsRecord} resultCount={products.length} totalCount={total} defaultSort="popularity" variant="mobile" />
        </div>

        <div className="flex gap-6">
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <CatalogFilters basePath={`/ingredients/${ingredient.slug}`} searchParams={searchParamsRecord} resultCount={products.length} totalCount={total} defaultSort="popularity" variant="desktop" />
          </aside>

          <div className="flex-1">
            {products.length > 0 ? (
              <>
                <ProductListGrid>
                  {products.map((product, i) => (
                    <ProductCard key={product.id} product={product} priority={i === 0 && page === 1} />
                  ))}
                </ProductListGrid>

                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    {page > 1 && (
                      <Link href={getPaginationHref(`/ingredients/${ingredient.slug}`, searchParamsRecord, page - 1)} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black">Previous</Link>
                    )}
                    <span className="rounded-xl border border-hairline bg-bg-alt px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
                    {page < totalPages && (
                      <Link href={getPaginationHref(`/ingredients/${ingredient.slug}`, searchParamsRecord, page + 1)} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black">Next</Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center">
                <p className="text-muted">No products found for this ingredient.</p>
                <Link href="/ingredients" className="mt-2 block text-sm text-accent hover:underline">Browse all ingredients</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
