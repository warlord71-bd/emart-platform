'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { flashDayLabel, useFlash } from '@/lib/realtime/flash-context';
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
  const { secondsRemaining, promotion } = useFlash();
  const { t } = useCategoryPageI18n();

  return (
    <section className="bg-[var(--mb-navy)] text-white">
      <div className="mb-container grid gap-6 py-8 sm:py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-center">
        <div>
          <p className="inline-flex rounded-md bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--mb-pink-soft)]">
            {flashDayLabel(promotion)}
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            {t('heroTitlePrefix')} <span className="text-[var(--mb-gold)]">{t('heroTitleHighlight')}</span><br className="hidden sm:block" /> {t('heroTitleSuffix')}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/78 sm:text-base">
            {t('heroLead')}
          </p>
          <div className="mt-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--mb-pink-soft)]">{t('flashEnds')}</p>
            <CountdownTiles seconds={secondsRemaining} />
          </div>
          <Link
            href="/sale"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--mb-pink)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--mb-gold)]"
          >
            {t('shopDeals')} <ArrowRight size={16} />
          </Link>
        </div>
        <TrendingLeaderboard initialProducts={initialTrending} />
      </div>
    </section>
  );
}
