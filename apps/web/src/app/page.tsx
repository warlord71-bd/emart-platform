// src/app/page.tsx
import { getBestSellingProducts, getCategories, getNewArrivals, getProducts, getSaleProducts, type WooProduct } from '@/lib/woocommerce';
import { getWordPressPosts } from '@/lib/wordpress-posts';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { FlashSaleBanner } from '@/components/home/FlashSaleBanner';
import { MobileDiscovery } from '@/components/home/MobileDiscovery';
import dynamic from 'next/dynamic';
import ShopByCategory from '@/components/home/ShopByCategory';

const OfferCollectionsRail    = dynamic(() => import('@/components/home/HomepageSections').then(m => ({ default: m.OfferCollectionsRail })));
const ProductGridSection      = dynamic(() => import('@/components/home/HomepageSections').then(m => ({ default: m.ProductGridSection })));
const ConcernTilesSection     = dynamic(() => import('@/components/home/HomepageSections').then(m => ({ default: m.ConcernTilesSection })));
const SkinGuideSection        = dynamic(() => import('@/components/home/HomepageSections').then(m => ({ default: m.SkinGuideSection })));
const IngredientTilesSection  = dynamic(() => import('@/components/home/HomepageSections').then(m => ({ default: m.IngredientTilesSection })));
const RoutineTeaserSection    = dynamic(() => import('@/components/home/HomepageSections').then(m => ({ default: m.RoutineTeaserSection })));
const AuthenticityStorySection = dynamic(() => import('@/components/home/HomepageSections').then(m => ({ default: m.AuthenticityStorySection })));
const BrandLogoGridSection    = dynamic(() => import('@/components/home/HomepageSections').then(m => ({ default: m.BrandLogoGridSection })));
const CustomerVoiceSection    = dynamic(() => import('@/components/home/HomepageSections').then(m => ({ default: m.CustomerVoiceSection })));
const SkinQuizCTA             = dynamic(() => import('@/components/home/HomepageSections').then(m => ({ default: m.SkinQuizCTA })));
const OriginStoryBlock        = dynamic(() => import('@/components/home/HomepageSections').then(m => ({ default: m.OriginStoryBlock })));
const BlogTeaserSection       = dynamic(() => import('@/components/home/HomepageSections').then(m => ({ default: m.BlogTeaserSection })));
import TrustStrip from '@/components/common/TrustStrip';
import { HOME_TOP_CATEGORY_ORDER, TOP_CATEGORY_IMAGE_OVERRIDES } from '@/lib/category-navigation';
import brandLogoManifest from '../../public/images/brands-e-mart/manifest.json';
import type { Metadata } from 'next';
import { absoluteUrl, SITE_URL } from '@/lib/siteUrl';

const HOME_DESC = 'Shop authentic Korean, Japanese & global skincare in Bangladesh. Carefully curated beauty products, local support, fast delivery and trusted service.';

export const metadata: Metadata = {
  title: 'Emart Skincare Bangladesh | Korean & Global Beauty',
  description: HOME_DESC,
  alternates: {
    canonical: absoluteUrl('/'),
    languages: {
      'x-default': absoluteUrl('/'),
      'en-BD': absoluteUrl('/'),
    },
  },
  openGraph: {
    title: 'Emart Skincare Bangladesh | Korean & Global Beauty',
    description: HOME_DESC,
    url: absoluteUrl('/'),
    images: [{ url: absoluteUrl('/wp-content/uploads/2026/03/logo.png'), width: 600, height: 600, alt: 'Emart Skincare Bangladesh' }],
  },
};

export const revalidate = 3600;

function filterProductsWithImages(products: Awaited<ReturnType<typeof getBestSellingProducts>>) {
  return products.filter((product) => product?.id && product?.name);
}

function toHomepageCardProduct(product: WooProduct): WooProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    permalink: product.permalink || `/shop/${product.slug}`,
    sku: product.sku,
    price: product.price,
    regular_price: product.regular_price,
    sale_price: product.sale_price,
    on_sale: product.on_sale,
    purchasable: product.purchasable,
    stock_status: product.stock_status,
    stock_quantity: product.stock_quantity,
    description: '',
    short_description: '',
    images: (product.images || []).slice(0, 1).map((image) => ({
      id: image.id,
      src: image.src,
      name: image.name || product.name,
      alt: image.alt || product.name,
    })),
    categories: (product.categories || []).slice(0, 5).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
    brands: (product.brands || []).slice(0, 1).map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
    })),
    attributes: (product.attributes || []).slice(0, 6).map((attribute) => ({
      id: attribute.id,
      name: attribute.name,
      options: (attribute.options || []).slice(0, 2),
    })),
    average_rating: product.average_rating,
    rating_count: product.rating_count,
    featured: product.featured,
    emart_version: product.emart_version,
  };
}

export default async function HomePage() {
  const emptyPage = { products: [] as Awaited<ReturnType<typeof getProducts>>['products'], totalPages: 0, total: 0 };
  let [bestSelling, newArrivals, onSale, fallbackResult, blogPosts, allCategories]: [
    Awaited<ReturnType<typeof getBestSellingProducts>>,
    Awaited<ReturnType<typeof getNewArrivals>>,
    Awaited<ReturnType<typeof getSaleProducts>>,
    Awaited<ReturnType<typeof getProducts>>,
    Awaited<ReturnType<typeof getWordPressPosts>>,
    Awaited<ReturnType<typeof getCategories>>,
  ] = [[], [], [], emptyPage, [], []];

  try {
    [bestSelling, newArrivals, onSale, fallbackResult, blogPosts, allCategories] = await Promise.all([
      getBestSellingProducts(4),
      getNewArrivals(4),
      getSaleProducts(6),
      getProducts({ per_page: 4, orderby: 'popularity' }),
      getWordPressPosts({ perPage: 3 }),
      getCategories({ per_page: 100, hide_empty: true }),
    ]);
  } catch {
    // WooCommerce API unreachable (e.g. local build without VPN/tunnel) — render with empty data
  }

  const fallbackProducts = filterProductsWithImages(fallbackResult.products);
  const bestSellerProducts = filterProductsWithImages(bestSelling).slice(0, 4);
  const newArrivalProducts = filterProductsWithImages(newArrivals).slice(0, 4);
  const saleProducts = filterProductsWithImages(onSale).slice(0, 6);

  const safeBestSellers = (bestSellerProducts.length > 0 ? bestSellerProducts : fallbackProducts.slice(0, 4))
    .map(toHomepageCardProduct);
  const safeNewArrivals = (newArrivalProducts.length > 0 ? newArrivalProducts : fallbackProducts.slice(0, 4))
    .map(toHomepageCardProduct);
  const safeSaleProducts = saleProducts;
  const brandLogos = brandLogoManifest
    .filter((b): b is typeof b & { logo: string } => !b.fallback && typeof b.logo === 'string')
    .map(({ id, name, slug, logo }) => ({ id, name, slug, logo }));
  const categoriesBySlug = new Map(allCategories.map((category) => [category.slug, category]));
  const mobileDiscoveryCategories = HOME_TOP_CATEGORY_ORDER.map((item) => {
    const resolvedSlug = item.slug
      || item.slugCandidates?.find((slug) => categoriesBySlug.has(slug))
      || item.fallbackSlug
      || item.name.toLowerCase().replace(/\s+/g, '-');
    const category = categoriesBySlug.get(resolvedSlug);

    return {
      name: item.name,
      slug: resolvedSlug,
      href: item.href || `/category/${resolvedSlug}`,
      image: TOP_CATEGORY_IMAGE_OVERRIDES[resolvedSlug] || category?.image?.src,
    };
  });

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: SITE_URL,
    name: 'Emart Skincare Bangladesh',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      {/* Stable brand H1 for SEO — visually hidden, accessible to screen readers and crawlers */}
      <h1 className="sr-only">Korean & Global Skincare in Bangladesh — Emart</h1>

      <HeroCarousel />
      {/* Mobile: horizontal scroll discovery strip */}
      <MobileDiscovery categories={mobileDiscoveryCategories} showChips={false} showCategories={false} />
      <ShopByCategory />
      <OfferCollectionsRail />
      <FlashSaleBanner products={safeSaleProducts.map(({ id, slug, name, images, price, sale_price, regular_price, stock_quantity }) => ({ id, slug, name, images, price, sale_price, regular_price, stock_quantity }))} />

      <ProductGridSection
        title="Best sellers"
        eyebrow="Curated edit"
        products={safeBestSellers}
        badge="Best Seller"
        viewAllHref="/shop?sort=popularity"
        viewAllLabel="View All"
        metaPrefix="Refill in"
        mobileLimit={4}
        desktopLimit={4}
      />

      <ProductGridSection
        title="New arrivals"
        eyebrow="Just in this week"
        products={safeNewArrivals}
        badge="New"
        viewAllHref="/new-arrivals"
        viewAllLabel="View All"
        metaPrefix="Restock in"
        mobileLimit={4}
        desktopLimit={4}
      />

      <ConcernTilesSection />
      <SkinGuideSection />
      <IngredientTilesSection />
      <RoutineTeaserSection />

      <AuthenticityStorySection />
      <BrandLogoGridSection brands={brandLogos} />

      <CustomerVoiceSection />
      <SkinQuizCTA />
      <OriginStoryBlock />

      <BlogTeaserSection posts={blogPosts} />
      <TrustStrip />

    </div>
  );
}
