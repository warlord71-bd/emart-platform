// src/app/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, ShieldCheck, Truck } from 'lucide-react';
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
} from '@/components/home/HomepageSections';
import ShopByCategory from '@/components/home/ShopByCategory';
import TrustStrip from '@/components/common/TrustStrip';
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

      {/* Mobile store identity card — hidden on desktop */}
      <section className="lg:hidden border-b border-hairline bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Image
              src="/logo.png"
              alt="Emart"
              width={56}
              height={56}
              className="h-14 w-14 rounded-2xl shadow-sm"
              priority
            />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
              <BadgeCheck size={11} className="text-white" strokeWidth={3} />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-lg font-extrabold leading-none text-ink">Emart</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                <BadgeCheck size={10} />Authentic Only
              </span>
            </div>
            <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-accent">
              Emart Skincare Bangladesh
            </div>
            <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-muted">
              <span className="flex items-center gap-1"><ShieldCheck size={11} className="text-emerald-500" />40+ Global Brands</span>
              <span className="flex items-center gap-1"><Truck size={11} className="text-accent" />COD · All BD</span>
            </div>
          </div>
          <Link
            href="/shop"
            className="shrink-0 rounded-xl bg-accent px-3 py-2 text-xs font-extrabold text-white shadow-sm transition-colors hover:bg-accent/90 active:scale-95"
          >
            Shop Now
          </Link>
        </div>
      </section>

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
        desktopLimit={8}
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
