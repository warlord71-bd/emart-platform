'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useCategoryPageI18n } from './categoryPageI18n';

interface TrendingProduct {
  id: number;
  name: string;
  slug: string;
  brand: string;
  growth_rate: number;
  stock_remaining: number;
}

async function fetchTrending() {
  const response = await fetch('/api/products/trending?window=6h&limit=4&include=growth_rate,stock_remaining', { cache: 'no-store' });
  if (!response.ok) throw new Error('Trending unavailable');
  return response.json();
}

export default function TrendingLeaderboard({ initialProducts = [] }: { initialProducts?: TrendingProduct[] }) {
  const { t, n } = useCategoryPageI18n();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['category_page.trending'],
    queryFn: fetchTrending,
    initialData: { products: initialProducts },
    refetchInterval: 60_000,
  });
  const products: TrendingProduct[] = Array.isArray(data?.products) ? data.products : [];

  return (
    <div className="h-full rounded-[var(--mb-radius)] border border-white/10 bg-white/[0.06] p-4 text-white sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">{t('trendingNow')}</p>
        <span className="rounded-md bg-[#FFE5E5] px-2 py-1 text-[10px] font-bold text-[var(--mb-danger)]">LIVE</span>
      </div>
      {isError ? <p className="text-sm text-white/60">Trending products are unavailable right now.</p> : null}
      {isLoading && products.length === 0 ? <div className="h-48 animate-pulse rounded-[var(--mb-radius)] bg-[var(--mb-pink-bg)]" /> : null}
      <div>
        {products.slice(0, 4).map((product, index) => (
          <Link
            key={product.id}
            href={`/shop/${product.slug}`}
            className={`grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/10 py-3 transition hover:bg-white/[0.04] ${index === 3 ? 'hidden sm:grid' : ''}`}
          >
            <span className="font-[var(--font-display)] text-xl font-semibold text-[var(--mb-gold)]">0{index + 1}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-white">{product.name}</span>
              <span className="block truncate text-[10px] uppercase tracking-[0.08em] text-white/55">{product.brand}</span>
            </span>
            <span className="text-right text-xs font-bold">
              <span className={product.stock_remaining < 15 ? 'block text-[#FF8B8B]' : 'block text-[var(--mb-pink-soft)]'}>↑ {n(product.growth_rate)}%</span>
              <span className="text-white/50">
                {n(product.stock_remaining)} left
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
