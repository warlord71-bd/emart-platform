'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useFlash } from '@/lib/realtime/flash-context';
import { useCategoryPageI18n } from './categoryPageI18n';
import CountdownTiles from './CountdownTiles';
import TrendingLeaderboard from './TrendingLeaderboard';

interface TrendingProduct {
  id: number;
  name: string;
  slug: string;
  brand: string;
  growth_rate: number;
  stock_remaining: number;
}

export default function FlashWeekHero({ initialTrending = [] }: { initialTrending?: TrendingProduct[] }) {
  const { secondsRemaining } = useFlash();
  const { t } = useCategoryPageI18n();

  return (
    <section className="bg-[var(--mb-navy)] text-white">
      <div className="mb-container grid gap-6 py-8 sm:py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--mb-gold-soft)]">Direction B · Live Pulse</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            Flash Week beauty momentum, live.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/78 sm:text-base">
            Browse categories by real shopper activity, rising products, verified reviews, and active sale velocity.
          </p>
          <div className="mt-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--mb-pink-soft)]">{t('flashEnds')}</p>
            <CountdownTiles seconds={secondsRemaining} />
          </div>
          <Link
            href="/sale"
            className="mt-6 inline-flex items-center gap-2 rounded-[var(--mb-radius-sm)] bg-[var(--mb-pink)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--mb-gold)]"
          >
            {t('shopDeals')} <ArrowRight size={16} />
          </Link>
        </div>
        <TrendingLeaderboard initialProducts={initialTrending} />
      </div>
    </section>
  );
}
