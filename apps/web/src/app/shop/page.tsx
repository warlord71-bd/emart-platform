import { formatCatalogProductCount, getAllProductIdsByBrand, getBrandBySlug, getCatalogProductCount, getCategoryBySlug, getOriginTermBySlug, getProducts } from '@/lib/woocommerce';
import CatalogFilters from '@/components/product/CatalogFilters';
import { ProductListGrid } from '@/components/product/ProductListGrid';
import ProductCard from '@/components/product/ProductCard';
import { NumberedPagination } from '@/components/common/NumberedPagination';
import Link from 'next/link';
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/siteUrl';
import { safeJsonLd } from '@/lib/sanitizeHtml';
import { getOriginByCountry } from '@/lib/origin-navigation';
import { getConcernBySlug } from '@/lib/concerns';
import { getIngredientBySlug } from '@/lib/ingredients';
import {
  getPaginatedCanonical,
  getPaginatedTitle,
  getValidPage,
} from '@/lib/paginationSeo';

const SHOP_BASE_TITLE = 'Emart Skincare Shop Bangladesh | Korean & Global Beauty';

// Filter/sort params are stripped from canonical URLs. Only true catalog pagination
// (/shop?page=N) is self-canonical so product-list pages stay crawlable without
// opening duplicate indexable filter combinations.
export async function generateMetadata({ searchParams }: { searchParams?: ShopPageProps['searchParams'] }): Promise<Metadata> {
  const page = getValidPage(searchParams?.page);
  const canonical = getPaginatedCanonical('/shop', page);
  const title = getPaginatedTitle(SHOP_BASE_TITLE, page);
  const count = await getCatalogProductCount().catch(() => 0);
  const countLabel = formatCatalogProductCount(count);
  const countPrefix = countLabel ? `${countLabel} ` : '';
  const description = `Emart Skincare Bangladesh — shop ${countPrefix}authentic Korean, Japanese & global beauty products. Serums, sunscreens, moisturizers, toners & more. Original products, COD, fast delivery nationwide.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      siteName: 'Emart Skincare Bangladesh',
      title,
      description,
      url: canonical,
      images: [{ url: 'https://e-mart.com.bd/images/hero-products.png', width: 1200, height: 630, alt: 'Emart Skincare Shop Bangladesh' }],
    },
  };
}

export const revalidate = 1800;

// Skin types that have a matching Woo concern category → use category filter (precise)
// Others fall back to text search with popularity sort
const SKIN_TYPE_CATEGORY: Record<string, string> = {
  oily: 'pores-oil-control',       // products for oily/congested skin
  dry: 'dryness-hydration',        // products for dry/dehydrated skin
};
const SKIN_TYPE_SEARCH: Record<string, string> = {
  sensitive: 'sensitive',
  combination: 'combination',
  normal: 'normal',
};

interface ShopPageProps {
  searchParams: {
    page?: string;
    category?: string;
    sort?: string;
    search?: string;
    brand?: string;
    price?: string;
    in_stock?: string;
    origin?: string;
    concern?: string;
    skin_type?: string;
    ingredient?: string;
  };
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
} satisfies Record<string, {
  orderby: 'date' | 'price' | 'popularity' | 'rating' | 'title';
  order: 'asc' | 'desc';
}>;

type PriceValue = keyof typeof PRICE_MAP;
type SortValue = keyof typeof SORT_MAP;

function getPriceParams(value?: string) {
  return value && value in PRICE_MAP ? PRICE_MAP[value as PriceValue] : undefined;
}

function getSortParams(value?: string) {
  return value && value in SORT_MAP ? SORT_MAP[value as SortValue] : SORT_MAP.newest;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const page = getValidPage(searchParams.page);
  const activeBrand = searchParams.brand ? await getBrandBySlug(searchParams.brand) : null;
  const activeBrandProductIds = activeBrand ? await getAllProductIdsByBrand(activeBrand.id) : [];
  const activeOrigin = getOriginByCountry(searchParams.origin);
  const activeOriginTerm = activeOrigin ? await getOriginTermBySlug(activeOrigin.country) : null;
  const activeSearch = searchParams.search || '';
  const priceParams = getPriceParams(searchParams.price);
  const sortParams = getSortParams(searchParams.sort);

  // Resolve concern → WooCommerce category or search
  const activeConcern = searchParams.concern ? getConcernBySlug(searchParams.concern) : null;
  let concernCategoryId: string | undefined;
  let concernSearch: string | undefined;
  if (activeConcern) {
    if (activeConcern.categorySlug) {
      const cat = await getCategoryBySlug(activeConcern.categorySlug);
      if (cat?.id) {
        concernCategoryId = String(cat.id);
      } else {
        concernSearch = activeConcern.searchQuery;
      }
    } else {
      concernSearch = activeConcern.searchQuery;
    }
  }

  // Ingredient → keyword search with popularity sort.
  // WooCommerce product tags matching ingredient slugs (vitamin-c, niacinamide…) don't exist yet.
  // Keyword search + popularity sort surfaces the most-purchased products containing the
  // ingredient name, which are the actual dedicated ingredient products.
  const activeIngredient = searchParams.ingredient ? getIngredientBySlug(searchParams.ingredient) : null;
  const ingredientSearch = activeIngredient?.searchKeywords[0];

  // Skin type: map to Woo category when available (oily/dry), else text search (sensitive/combination)
  const skinTypeCategorySlug = searchParams.skin_type ? SKIN_TYPE_CATEGORY[searchParams.skin_type] : undefined;
  const skinTypeSearch = searchParams.skin_type && !skinTypeCategorySlug
    ? SKIN_TYPE_SEARCH[searchParams.skin_type]
    : undefined;

  let skinTypeCategoryId: string | undefined;
  if (skinTypeCategorySlug) {
    const skinCat = await getCategoryBySlug(skinTypeCategorySlug);
    if (skinCat?.id) skinTypeCategoryId = String(skinCat.id);
  }

  // Search: concern search > ingredient > skin_type search > explicit user search
  const effectiveSearch = concernSearch ?? ingredientSearch ?? skinTypeSearch ?? activeSearch;

  // Category: concern > skin_type category > explicit category param
  const effectiveCategory = concernCategoryId ?? skinTypeCategoryId ?? searchParams.category ?? '';

  // Any active filter (concern, search-driven, ingredient, skin_type) should default to
  // popularity sort so the most-purchased relevant products surface first, not newest arrivals.
  const isFilterActive = Boolean(activeConcern || skinTypeSearch || skinTypeCategoryId || concernSearch || ingredientSearch);
  const effectiveSortParams = isFilterActive && !searchParams.sort
    ? { orderby: 'popularity' as const, order: 'desc' as const }
    : sortParams;

  // Fetch extra products when concern filter is active so we can exclude hair/body items.
  // Hair/body category slugs confirmed from this store's WooCommerce category navigation.
  const NON_SKINCARE_SLUGS = new Set([
    'hair-care', 'shampoos', 'hair-conditioners', 'hair-treatments', 'hair-oil',
    'hair-styling-products', 'body-lotion', 'body-wash', 'body-oil', 'body-care',
  ]);

  const fetchPerPage = activeConcern ? 48 : 24;
  const { products: rawProducts = [], total = 0 } = await getProducts({
    page,
    per_page: fetchPerPage,
    search: effectiveSearch || undefined,
    include: activeBrand ? activeBrandProductIds.join(',') || '0' : undefined,
    category: effectiveCategory,
    ...effectiveSortParams,
    ...priceParams,
    stock_status: searchParams.in_stock === '1' ? 'instock' : undefined,
    attribute: activeOriginTerm ? 'pa_origin' : undefined,
    attribute_term: activeOriginTerm ? String(activeOriginTerm.id) : undefined,
  });

  // When concern filter is active, exclude hair/body products (they may share concern categories).
  const products = activeConcern
    ? rawProducts.filter(p => !p.categories.some(c => NON_SKINCARE_SLUGS.has(c.slug))).slice(0, 24)
    : rawProducts;

  // Recalculate page count from skincare-filtered total (approximate when concern active).
  const skincareTotal = activeConcern ? Math.max(products.length, total - Math.round(total * 0.15)) : total;
  const totalPages = Math.ceil(skincareTotal / 24);

  const title = activeBrand ? activeBrand.name
    : activeConcern ? activeConcern.label
    : activeIngredient ? activeIngredient.label
    : activeOrigin ? `${activeOrigin.label} Products`
    : activeSearch ? `Search: ${activeSearch}`
    : 'Shop Skincare Online in Bangladesh';
  const hasPrimaryFilter = Boolean(activeBrand || activeConcern || activeIngredient || activeOrigin || activeSearch);
  const shopDescription = hasPrimaryFilter
    ? `Browse ${title.toLowerCase()} at Emart Skincare Bangladesh with authentic products, COD, bKash, Nagad and delivery across Bangladesh.`
    : 'Shop authentic Korean, Japanese and global skincare online in Bangladesh at Emart. Find original cleansers, toners, serums, moisturizers, sunscreens, hair care and cosmetics with COD, bKash, Nagad and nationwide delivery.';
  const canonicalUrl = getPaginatedCanonical('/shop', page);
  const shopBreadcrumbUrl = absoluteUrl('/shop');
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${shopBreadcrumbUrl}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: shopBreadcrumbUrl },
    ],
  };
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonicalUrl}#collection`,
    name: title,
    description: shopDescription,
    url: canonicalUrl,
    breadcrumb: { '@id': `${shopBreadcrumbUrl}#breadcrumb` },
    isPartOf: { '@id': `${absoluteUrl('/')}#website` },
  };
  const itemListJsonLd = products.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${canonicalUrl}#products`,
    name: `${title} product list`,
    url: canonicalUrl,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((product: any, index: number) => ({
      '@type': 'ListItem',
      position: (page - 1) * 24 + index + 1,
      name: product.name,
      url: absoluteUrl(`/shop/${product.slug}`),
      image: product.images?.[0]?.src || undefined,
    })),
  } : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionPageJsonLd) }} />
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }} />
      )}
      <div className="mb-6 flex flex-col gap-3 border-b border-hairline pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted">{total} products found</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{shopDescription}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/categories" className="font-semibold text-ink transition-colors hover:text-accent">
            Browse categories
          </Link>
          {hasPrimaryFilter && (
            <Link href="/shop" className="font-semibold text-accent hover:underline">
              Clear filter
            </Link>
          )}
        </div>
      </div>

      <CatalogFilters
        basePath="/shop"
        searchParams={searchParams}
        resultCount={products.length}
        totalCount={total}
        showConcern
        showSkinType
        showIngredient
        defaultSort="newest"
        variant={process.env.NEXT_PUBLIC_FF_NAV_CONSOLIDATE === 'true' ? 'mobile-consolidated' : 'mobile'}
      />

      <div className="flex gap-6">
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <CatalogFilters
            basePath="/shop"
            searchParams={searchParams}
            resultCount={products.length}
            totalCount={total}
            showConcern
            showSkinType
            showIngredient
            defaultSort="newest"
            variant="desktop"
          />
        </aside>

        <div className="flex-1">
          {products.length > 0 ? (
            <>
              <ProductListGrid>
                {products.map((product: any, i: number) => (
                  <ProductCard key={product.id} product={product} priority={i === 0 && page === 1} />
                ))}
              </ProductListGrid>
              <NumberedPagination
                basePath="/shop"
                currentPage={page}
                totalPages={totalPages}
                searchParams={searchParams}
              />
            </>
          ) : (
            <div className="py-20 text-center text-muted-2">
              <p className="text-lg text-ink">No products found</p>
              {activeIngredient && (
                <p className="mt-2 text-sm text-muted">
                  Try the{' '}
                  <Link href={`/ingredients/${activeIngredient.slug}`} className="text-accent hover:underline">
                    {activeIngredient.label} ingredient page
                  </Link>
                </p>
              )}
              <Link href="/shop" className="mt-3 block text-accent hover:underline">
                Clear filters
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
