import { Suspense } from 'react';
import type { Metadata } from 'next';
import { canonicalPath } from '@/lib/canonicalUrl';
import {
  getActiveFlashPromotion,
  getActiveSessions,
  getCategoryPulses,
  getConcernSummaries,
  getFeaturedReviews,
  getFlashProducts,
  getRecentPurchases,
  getTrendingProducts,
} from '@/lib/categories/liveData';
import { FlashProvider } from '@/lib/realtime/flash-context';
import LiveTickerBar from '@/components/categories/LiveTickerBar';
import FlashWeekHero from '@/components/categories/FlashWeekHero';
import TrustStrip from '@/components/categories/TrustStrip';
import CategoryChips from '@/components/categories/CategoryChips';
import PopularCategoriesGrid from '@/components/categories/PopularCategoriesGrid';
import FlashDealsRow from '@/components/categories/FlashDealsRow';
import ConcernGrid from '@/components/categories/ConcernGrid';
import CustomerWall from '@/components/categories/CustomerWall';

export function generateMetadata({ searchParams }: { searchParams?: Record<string, string | string[]> }): Metadata {
  return {
    title: { absolute: 'Live Beauty Categories | Emart Skincare Bangladesh' },
    description: 'Browse Emart categories by live shopper activity, flash deals, trending products, verified reviews, and skin concerns in Bangladesh.',
    alternates: { canonical: canonicalPath('/categories', searchParams) },
  };
}

export const revalidate = 60;

function SectionSkeleton({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <div className={tone === 'dark' ? 'bg-[var(--mb-navy)] py-8' : 'py-8'}>
      <div className="mb-container">
        <div className={tone === 'dark' ? 'h-48 animate-pulse rounded-[var(--mb-radius)] bg-white/10' : 'h-48 animate-pulse rounded-[var(--mb-radius)] bg-[var(--mb-pink-bg)]'} />
      </div>
    </div>
  );
}

export default async function CategoriesPage() {
  const [
    popularCategories,
    trendingProducts,
    flashProducts,
    concerns,
    reviews,
    activeSessions,
    recentPurchases,
  ] = await Promise.all([
    getCategoryPulses(8),
    getTrendingProducts(4),
    getFlashProducts(5),
    getConcernSummaries(4),
    getFeaturedReviews(3),
    getActiveSessions(),
    getRecentPurchases(10),
  ]);
  const promotion = getActiveFlashPromotion();

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://e-mart.com.bd/' },
          { '@type': 'ListItem', position: 2, name: 'Categories', item: 'https://e-mart.com.bd/categories' },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Live Popular Categories',
        itemListElement: popularCategories.map((category, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: category.name,
          url: `https://e-mart.com.bd/category/${category.slug}`,
        })),
      },
    ],
  };

  return (
    <main data-theme="midnight-blossom" className="mb-shell min-h-screen pb-16 sm:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <FlashProvider initialPromotion={promotion}>
        <Suspense fallback={<SectionSkeleton />}>
          <LiveTickerBar initialPresence={activeSessions} initialPurchases={recentPurchases} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton tone="dark" />}>
          <FlashWeekHero initialTrending={trendingProducts} />
        </Suspense>
        <TrustStrip />
        <CategoryChips initialCategories={popularCategories} />
        <Suspense fallback={<SectionSkeleton />}>
          <PopularCategoriesGrid initialCategories={popularCategories} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <FlashDealsRow initialProducts={flashProducts} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <ConcernGrid initialConcerns={concerns} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton tone="dark" />}>
          <CustomerWall initialReviews={reviews} />
        </Suspense>
      </FlashProvider>
    </main>
  );
}
