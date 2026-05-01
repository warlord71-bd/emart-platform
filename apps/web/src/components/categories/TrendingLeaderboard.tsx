'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
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
    <div className="mb-card mb-card-lg h-full p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--mb-pink)]">{t('trendingNow')}</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--mb-ink)]">Fastest-rising SKUs</h2>
        </div>
        <TrendingUp className="h-5 w-5 text-[var(--mb-gold)]" />
      </div>
      {isError ? <p className="text-sm text-[var(--mb-ink-3)]">Trending products are unavailable right now.</p> : null}
      {isLoading && products.length === 0 ? <div className="h-48 animate-pulse rounded-[var(--mb-radius)] bg-[var(--mb-pink-bg)]" /> : null}
      <div className="space-y-2">
        {products.slice(0, 4).map((product, index) => (
          <Link
            key={product.id}
            href={`/shop/${product.slug}`}
            className={`grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--mb-radius-sm)] border border-[var(--mb-line)] bg-white/70 p-3 transition hover:border-[var(--mb-pink-soft)] hover:bg-white ${index === 3 ? 'hidden sm:grid' : ''}`}
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--mb-navy)] text-xs font-bold text-white">{index + 1}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-[var(--mb-ink)]">{product.name}</span>
              <span className="block truncate text-xs text-[var(--mb-ink-3)]">{product.brand}</span>
            </span>
            <span className="text-right text-xs font-bold">
              <span className="block text-[var(--mb-success)]">↑ {n(product.growth_rate)}%</span>
              <span className={product.stock_remaining < 15 ? 'text-[var(--mb-danger)]' : 'text-[var(--mb-ink-3)]'}>
                {n(product.stock_remaining)} left
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
