import { getCategoryBySlug, getProducts } from '@/lib/woocommerce';
import CatalogFilters from '@/components/product/CatalogFilters';
import ProductCard from '@/components/product/ProductCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getGraphQLCategoryMetadata, isWordPressGraphQLConfigured } from '@/lib/wordpress-graphql';
import { canonicalPath } from '@/lib/canonicalUrl';

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

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const graphQLCategory = isWordPressGraphQLConfigured()
    ? await getGraphQLCategoryMetadata(params.slug).catch(() => null)
    : null;
  const cat = graphQLCategory || await getCategoryBySlug(params.slug);
  if (!cat) return { title: 'Category Not Found' };

  const description = 'description' in cat && cat.description
    ? cat.description.replace(/<[^>]+>/g, '').substring(0, 160)
    : `Shop authentic ${cat.name} products in Bangladesh. Original imports, fast delivery, COD available. Best prices on ${cat.name} skincare at Emart.`;

  return {
    title: { absolute: `${cat.name} — Shop Online | Emart Skincare Bangladesh` },
    description,
    alternates: { canonical: canonicalPath(`/category/${cat.slug}`, searchParams) },
    openGraph: {
      title: `${cat.name} | Emart Skincare Bangladesh`,
      description,
      url: `https://e-mart.com.bd/category/${cat.slug}`,
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

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />

      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* BREADCRUMB */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted">
          <Link href="/" className="transition-colors hover:text-accent">Home</Link>
          <span>/</span>
          <Link href="/shop" className="transition-colors hover:text-accent">Shop</Link>
          <span>/</span>
          <span className="text-ink">{category.name}</span>
        </nav>

        {/* CATEGORY HERO */}
        <section className="relative mb-6 overflow-hidden rounded-[28px] border border-hairline bg-ink px-5 py-6 text-white shadow-card md:px-7">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-accent via-brass to-accent" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-brass">
                Category
              </p>
              <h1 className="text-[28px] font-bold leading-tight text-white">
                {category.name}
              </h1>
              <p className="mt-3 max-w-3xl overflow-hidden text-sm leading-6 text-white/72 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                {introText}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-48 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <span className="block text-lg font-bold text-white">{total}</span>
                <span className="text-xs font-medium text-white/70">Products</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <span className="block text-sm font-bold text-white">Free Delivery</span>
                <span className="text-xs font-medium text-white/70">৳3,000+</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <span className="block text-sm font-bold text-white">100% Authentic</span>
                <span className="text-xs font-medium text-white/70">Verified imports</span>
              </div>
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
