'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { WooProduct } from '@/lib/woocommerce';

type FlashProduct = Pick<WooProduct, 'id' | 'slug' | 'name' | 'images' | 'price' | 'sale_price' | 'regular_price' | 'stock_quantity'>;

interface BrandLogo {
  id: number;
  name: string;
  slug: string;
  logo: string;
}

interface BlogPostSummary {
  id: number;
  title: string;
  excerpt: string;
  href: string;
  date: string;
}

const RecentlyViewedRail = dynamic(() => import('@/components/home/RecentlyViewedRail'), { ssr: false });
const FlashSaleBanner = dynamic(() => import('@/components/home/FlashSaleBanner'), { ssr: false });
const ProductGridSection = dynamic(
  () => import('@/components/home/HomepageSections').then((m) => m.ProductGridSection),
  { ssr: false },
);
const ConcernTilesSection = dynamic(
  () => import('@/components/home/HomepageSections').then((m) => m.ConcernTilesSection),
  { ssr: false },
);
const SkinGuideSection = dynamic(
  () => import('@/components/home/HomepageSections').then((m) => m.SkinGuideSection),
  { ssr: false },
);
const IngredientTilesSection = dynamic(
  () => import('@/components/home/HomepageSections').then((m) => m.IngredientTilesSection),
  { ssr: false },
);
const RoutineTeaserSection = dynamic(
  () => import('@/components/home/HomepageSections').then((m) => m.RoutineTeaserSection),
  { ssr: false },
);
const AuthenticityStorySection = dynamic(
  () => import('@/components/home/HomepageSections').then((m) => m.AuthenticityStorySection),
  { ssr: false },
);
const BrandLogoGridSection = dynamic(
  () => import('@/components/home/HomepageSections').then((m) => m.BrandLogoGridSection),
  { ssr: false },
);
const CustomerVoiceSection = dynamic(
  () => import('@/components/home/HomepageSections').then((m) => m.CustomerVoiceSection),
  { ssr: false },
);
const SkinQuizCTA = dynamic(
  () => import('@/components/home/HomepageSections').then((m) => m.SkinQuizCTA),
  { ssr: false },
);
const OriginStoryBlock = dynamic(
  () => import('@/components/home/HomepageSections').then((m) => m.OriginStoryBlock),
  { ssr: false },
);
const BlogTeaserSection = dynamic(
  () => import('@/components/home/HomepageSections').then((m) => m.BlogTeaserSection),
  { ssr: false },
);
const TrustStrip = dynamic(() => import('@/components/common/TrustStrip'), { ssr: false });

function DeferredSection({ children, minHeight = 0 }: { children: ReactNode; minHeight?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || active) return undefined;

    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    const requestIdle = 'requestIdleCallback' in window
      ? window.requestIdleCallback.bind(window)
      : undefined;
    const cancelIdle = 'cancelIdleCallback' in window
      ? window.cancelIdleCallback.bind(window)
      : undefined;
    const activate = () => setActive(true);

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            observer.disconnect();
            activate();
          }
        },
        { rootMargin: '900px 0px' },
      );
      observer.observe(node);

      if (requestIdle) {
        idleId = requestIdle(activate, { timeout: 3500 });
      } else {
        timerId = globalThis.setTimeout(activate, 3500);
      }

      return () => {
        observer.disconnect();
        if (idleId && cancelIdle) cancelIdle(idleId);
        if (timerId) globalThis.clearTimeout(timerId);
      };
    }

    timerId = globalThis.setTimeout(activate, 1200);
    return () => {
      if (timerId) globalThis.clearTimeout(timerId);
    };
  }, [active]);

  return (
    <div ref={ref} style={!active && minHeight ? { minHeight } : undefined}>
      {active ? children : null}
    </div>
  );
}

export default function HomepageDeferredSections({
  saleProducts,
  bestSellers,
  newArrivals,
  brandLogos,
  blogPosts,
}: {
  saleProducts: FlashProduct[];
  bestSellers: WooProduct[];
  newArrivals: WooProduct[];
  brandLogos: BrandLogo[];
  blogPosts: BlogPostSummary[];
}) {
  return (
    <>
      <DeferredSection>
        <RecentlyViewedRail />
      </DeferredSection>

      <DeferredSection minHeight={260}>
        <FlashSaleBanner products={saleProducts} />
      </DeferredSection>

      <DeferredSection minHeight={390}>
        <ProductGridSection
          title="Best sellers"
          eyebrow="Customer favourites"
          products={bestSellers}
          badge="Best Seller"
          viewAllHref="/shop?sort=popularity"
          viewAllLabel="View All"
          metaPrefix="Refill in"
          mobileLimit={4}
          desktopLimit={4}
        />
      </DeferredSection>

      <DeferredSection minHeight={390}>
        <ProductGridSection
          title="New arrivals"
          eyebrow="Just in this week"
          products={newArrivals}
          badge="New"
          viewAllHref="/new-arrivals"
          viewAllLabel="View All"
          metaPrefix="Restock in"
          mobileLimit={4}
          desktopLimit={4}
        />
      </DeferredSection>

      <DeferredSection minHeight={260}>
        <ConcernTilesSection />
        <SkinGuideSection />
        <IngredientTilesSection />
        <RoutineTeaserSection />
      </DeferredSection>

      <DeferredSection minHeight={620}>
        <AuthenticityStorySection />
        <BrandLogoGridSection brands={brandLogos} />
      </DeferredSection>

      <DeferredSection minHeight={420}>
        <CustomerVoiceSection />
        <SkinQuizCTA />
        <OriginStoryBlock />
      </DeferredSection>

      <DeferredSection minHeight={280}>
        <BlogTeaserSection posts={blogPosts} />
        <TrustStrip />
      </DeferredSection>
    </>
  );
}
