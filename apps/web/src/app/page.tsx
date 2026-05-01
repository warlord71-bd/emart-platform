// src/app/page.tsx
import { getBestSellingProducts, getCategories, getNewArrivals, getProducts, getSaleProducts } from '@/lib/woocommerce';
import { getWordPressPosts } from '@/lib/wordpress-posts';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { FlashSaleBanner } from '@/components/home/FlashSaleBanner';
import { MobileDiscovery } from '@/components/home/MobileDiscovery';
import {
  ConcernTilesSection,
  OfferCollectionsRail,
  AuthenticityStorySection,
  ProductGridSection,
  BrandLogoGridSection,
  CustomerVoiceSection,
  SkinQuizCTA,
  OriginStoryBlock,
  BlogTeaserSection,
  ShippingPaymentReturns,
  ShopByCategorySection,
} from '@/components/home/HomepageSections';
import { HOME_TOP_CATEGORY_ORDER, TOP_CATEGORY_IMAGE_OVERRIDES } from '@/lib/category-navigation';
import brandLogoManifest from '../../public/images/brands-e-mart/manifest.json';
import type { Metadata } from 'next';
import { absoluteUrl, SITE_URL } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: 'Emart — Authentic Korean, Japanese & Global Skincare Bangladesh',
  description: 'Shop authentic Korean, Japanese and global skincare in Bangladesh from Emart Skincare Bangladesh. Carefully curated beauty products, local support, faster delivery and trusted service.',
  alternates: {
    canonical: absoluteUrl('/'),
  },
  openGraph: {
    title: 'Emart — Authentic Korean, Japanese & Global Skincare Bangladesh',
    description: 'Shop authentic Korean, Japanese and global skincare in Bangladesh from Emart Skincare Bangladesh. Carefully curated beauty products, local support, faster delivery and trusted service.',
    url: absoluteUrl('/'),
  },
};

export const revalidate = 3600;

function filterProductsWithImages(products: Awaited<ReturnType<typeof getBestSellingProducts>>) {
  return products.filter((product) => product?.id && product?.name);
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
      getBestSellingProducts(8),
      getNewArrivals(8),
      getSaleProducts(10),
      getProducts({ per_page: 12, orderby: 'popularity' }),
      getWordPressPosts({ perPage: 3 }),
      getCategories({ per_page: 100, hide_empty: true }),
    ]);
  } catch {
    // WooCommerce API unreachable (e.g. local build without VPN/tunnel) — render with empty data
  }

  const fallbackProducts = filterProductsWithImages(fallbackResult.products);
  const bestSellerProducts = filterProductsWithImages(bestSelling).slice(0, 8);
  const newArrivalProducts = filterProductsWithImages(newArrivals).slice(0, 8);
  const saleProducts = filterProductsWithImages(onSale).slice(0, 10);

  const safeBestSellers = bestSellerProducts.length > 0 ? bestSellerProducts : fallbackProducts.slice(0, 8);
  const safeNewArrivals = newArrivalProducts.length > 0 ? newArrivalProducts : fallbackProducts.slice(0, 8);
  const safeSaleProducts = saleProducts.length > 0 ? saleProducts : fallbackProducts.slice(0, 10);
  const brandLogos = brandLogoManifest
    .filter((b): b is typeof b & { logo: string } => !b.fallback && typeof b.logo === 'string')
    .map(({ id, name, logo }) => ({ id, name, logo }));
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

  const categoryTiles = mobileDiscoveryCategories.map((c) => ({
    name: c.name,
    href: c.href || `/category/${c.slug}`,
    image: c.image,
  }));

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
      <HeroCarousel />
      {/* Mobile: horizontal scroll discovery strip */}
      <MobileDiscovery categories={mobileDiscoveryCategories} showChips={false} showCategories={false} />
      {/* Desktop + Mobile: category grid visible at all sizes */}
      <ShopByCategorySection categories={categoryTiles} />
      <OfferCollectionsRail />
      <FlashSaleBanner products={safeSaleProducts} />

      <ProductGridSection
        title="Best sellers"
        eyebrow="Curated edit"
        products={safeBestSellers}
        badge="Best seller"
        viewAllHref="/shop?sort=popularity"
        viewAllLabel="View all"
        metaPrefix="Refill in"
        mobileLimit={4}
        desktopLimit={8}
      />

      <ProductGridSection
        title="New arrivals"
        eyebrow="Just in this week"
        products={safeNewArrivals}
        badge="NEW"
        viewAllHref="/new-arrivals"
        viewAllLabel="View all"
        metaPrefix="Restock in"
        mobileLimit={4}
        desktopLimit={4}
      />

      <ConcernTilesSection />

      <AuthenticityStorySection />
      <BrandLogoGridSection brands={brandLogos} />

      <CustomerVoiceSection />
      <SkinQuizCTA />
      <OriginStoryBlock />

      <BlogTeaserSection posts={blogPosts} />
      <ShippingPaymentReturns />

    </div>
  );
}
