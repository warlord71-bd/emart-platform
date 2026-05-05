import { getCategoryBySlug, getProducts } from '@/lib/woocommerce';
import CatalogFilters from '@/components/product/CatalogFilters';
import ProductCard from '@/components/product/ProductCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getCategorySeo } from '@/lib/seo';

interface Props {
  params: { slug: string };
  searchParams: {
    page?: string;
    price?: string;
    sort?: string;
    in_stock?: string;
    origin?: string;
    skin_type?: string;
    hair_type?: string;
    finish?: string;
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
  return value && value in SORT_MAP ? SORT_MAP[value as SortValue] : SORT_MAP.popularity;
}

function getPageHref(basePath: string, searchParams: Props['searchParams'], targetPage: number) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  params.set('page', String(targetPage));
  return `${basePath}?${params.toString()}`;
}

function detectContext(category: { slug: string; name: string }): 'skincare' | 'hair' | 'makeup' | undefined {
  const value = `${category.slug} ${category.name}`.toLowerCase();

  if (/hair|shampoo|conditioner/.test(value)) return 'hair';
  if (/makeup|lipstick|mascara|foundation|finish/.test(value)) return 'makeup';
  if (/skin|cleanser|toner|serum|moisturiz|sunscreen|mask|acne|face/.test(value)) return 'skincare';

  return undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) return { title: 'Category Not Found' };

  const seo = await getCategorySeo(params.slug, cat.name);

  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: seo.canonical },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.canonical,
      ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
  };
}

export const revalidate = 3600;

function getCategoryIntro(name: string, slug: string, description: string): string {
  if (description) return description.replace(/<[^>]+>/g, '').substring(0, 500);

  const intros: Record<string, string> = {
    sunscreen: `Protect your skin every day with our range of authentic sunscreens, available in Bangladesh with fast delivery. From lightweight Korean SPF formulas to dermatologist-recommended options like La Roche-Posay and CeraVe, we carry the best sun protection products for Bangladesh's climate. Whether you need a matte finish for oily skin or a hydrating formula for dry skin, our sunscreen collection covers all skin types. All products are 100% original, imported directly — no fakes, no copies.`,
    'korean-skincare': `Discover authentic Korean skincare in Bangladesh at Emart — your home for original K-Beauty products. From COSRX snail mucin to Some By Mi AHA BHA toner, we carry the Korean skincare brands customers ask for most. Our collection covers cleansers, toners, serums, moisturizers, and sunscreens with fast delivery across Bangladesh and Cash on Delivery available.`,
    serum: `Targeted serums to address your biggest skin concerns — from brightening and anti-aging to acne control and deep hydration. Explore authentic serums from COSRX, The Ordinary, Laneige, and more, all available in Bangladesh with fast delivery. Whether you're dealing with dark spots, fine lines, or dehydration, our serum collection has the right solution for your skin.`,
    moisturizer: `Lock in hydration and strengthen your skin barrier with our curated range of authentic moisturizers. From lightweight Korean gel creams to rich derma moisturizers like CeraVe and La Roche-Posay, find the perfect moisturizer for your skin type. All products are 100% original, available in Bangladesh with fast delivery and COD.`,
    cleanser: `Start your skincare routine right with authentic cleansers from Korea, Japan, and global derma brands. From low-pH gel cleansers to creamy foam washes, our cleanser collection suits all skin types — oily, dry, sensitive, and combination. Shop original COSRX, Cetaphil, CeraVe, and more with fast Bangladesh delivery.`,
    toner: `Hydrate, balance, and prep your skin with authentic toners and essences from the best Korean and global skincare brands. Our toner collection includes hydrating toners, exfoliating toners, and ferment essences — all 100% original and available in Bangladesh with COD.`,
    'face-mask': `Treat your skin to a weekly boost with authentic sheet masks, wash-off masks, and sleeping masks. From Korean sheet mask favourites like Innisfree to clay masks and hydrogel options, our face mask collection covers every skin need. All original products, fast Bangladesh delivery.`,
    acne: `Combat breakouts with clinically tested, authentic acne skincare products. Shop COSRX, Some By Mi, La Roche-Posay Effaclar, and other proven acne solutions available in Bangladesh. From spot treatments and BHA exfoliants to oil-control moisturizers, find your complete acne routine at Emart.`,
  };

  const key = Object.keys(intros).find(k => slug.includes(k) || name.toLowerCase().includes(k));
  if (key) return intros[key];

  return `Shop authentic ${name} products at Emart Skincare Bangladesh. We carry original ${name} products from Korea, Japan, and other global beauty brands, delivered across Bangladesh with careful support and Cash on Delivery available.`;
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const page = parseInt(searchParams.page || '1');
  const priceParams = getPriceParams(searchParams.price);
  const sortParams = getSortParams(searchParams.sort);
  const context = detectContext(category);
  const { products, total, totalPages } = await getProducts({
    category: category.id.toString(),
    per_page: 24,
    page,
    ...sortParams,
    ...priceParams,
    stock_status: searchParams.in_stock === '1' ? 'instock' : undefined,
  });

  const rawDescription = 'description' in category ? (category as any).description || '' : '';
  const introText = getCategoryIntro(category.name, params.slug, rawDescription);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://e-mart.com.bd' },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://e-mart.com.bd/shop' },
      { '@type': 'ListItem', position: 3, name: category.name, item: `https://e-mart.com.bd/category/${category.slug}` },
    ],
  };

  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} — Emart`,
    description: introText.substring(0, 200),
    url: `https://e-mart.com.bd/category/${category.slug}`,
    breadcrumb: breadcrumbJsonLd,
  };

  const itemListJsonLd = products.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category.name,
    url: `https://e-mart.com.bd/category/${category.slug}`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: (page - 1) * 24 + i + 1,
      name: p.name,
      url: `https://e-mart.com.bd/shop/${p.slug}`,
    })),
  } : null;

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />
      {itemListJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />}

      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* BREADCRUMB */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted">
          <Link href="/" className="transition-colors hover:text-accent">Home</Link>
          <span>/</span>
          <Link href="/shop" className="transition-colors hover:text-accent">Shop</Link>
          <span>/</span>
          <span className="text-ink">{category.name}</span>
        </nav>

        {/* CATEGORY HEADER */}
        <section className="mb-5 border-b border-hairline pb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Category
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-bold leading-tight text-ink sm:text-3xl">
                {category.name}
              </h1>
              <p className="mt-2 max-w-3xl overflow-hidden text-sm leading-6 text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                {introText}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted">
              <span className="rounded-full border border-hairline bg-bg-alt px-3 py-1.5">{total} products</span>
              <span className="rounded-full border border-hairline bg-bg-alt px-3 py-1.5">Authentic</span>
              <span className="rounded-full border border-hairline bg-bg-alt px-3 py-1.5">COD</span>
            </div>
          </div>
        </section>

        <CatalogFilters
          basePath={`/category/${params.slug}`}
          searchParams={searchParams}
          context={context}
          resultCount={products.length}
          totalCount={total}
          showOrigin
          defaultSort="popularity"
          variant="mobile"
        />

        <div className="flex gap-6">
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <CatalogFilters
              basePath={`/category/${params.slug}`}
              searchParams={searchParams}
              context={context}
              resultCount={products.length}
              totalCount={total}
              showOrigin
              defaultSort="popularity"
              variant="desktop"
            />
          </aside>

          <div className="flex-1">
            {/* PRODUCT GRID */}
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {products.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    {page > 1 && (
                      <Link
                        href={getPageHref(`/category/${params.slug}`, searchParams, page - 1)}
                        className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
                      >
                        Previous
                      </Link>
                    )}
                    <span className="rounded-xl border border-hairline bg-bg-alt px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
                    {page < totalPages && (
                      <Link
                        href={getPageHref(`/category/${params.slug}`, searchParams, page + 1)}
                        className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                )}

                {/* CATEGORY BUYING GUIDE */}
                <details className="mt-14 rounded-2xl border border-hairline bg-card p-5 shadow-card">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-ink marker:hidden">
                    Buying guide for {category.name}
                    <span className="ml-2 text-accent">Read more</span>
                  </summary>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
                    Emart is Bangladesh&apos;s trusted source for authentic {category.name} products. Every product is imported directly from the brand or authorised distributors — no counterfeits, no grey market. We offer Cash on Delivery (COD) across Bangladesh, with fast delivery inside Dhaka (1–2 days) and nationwide (3–5 days). Free delivery on orders above ৳3,000.
                  </p>
                </details>
              </>
            ) : (
              <div className="py-20 text-center text-muted-2">
                <p className="text-ink">No products in this category yet.</p>
                <Link href="/shop" className="mt-2 block text-accent hover:underline">Browse All Products</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
