'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { CategoryIllustration } from '@/components/category/CategoryIllustration';
import { useCategoryPageI18n } from './categoryPageI18n';

interface CategoryPulse {
  id: number;
  name: string;
  slug: string;
  product_count: number;
  trend_pct: number;
  active_viewers: number;
  is_hot: boolean;
  icon_url?: string;
}

async function fetchPopular() {
  const response = await fetch('/api/categories/popular?limit=8&window=7d&include=product_count,trend_pct,active_viewers,is_hot', { cache: 'no-store' });
  if (!response.ok) throw new Error('Popular categories unavailable');
  return response.json();
}

export default function PopularCategoriesGrid({ initialCategories = [] }: { initialCategories?: CategoryPulse[] }) {
  const { t, n } = useCategoryPageI18n();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['category_page.popular_categories'],
    queryFn: fetchPopular,
    initialData: { categories: initialCategories },
    refetchInterval: 60_000,
  });
  const categories: CategoryPulse[] = Array.isArray(data?.categories) ? data.categories : [];

  return (
    <section id="popular" className="scroll-mt-32 py-8 sm:py-10">
      <div className="mb-container">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--mb-pink)]">{t('popularEyebrow')}</p>
            <h2 className="mt-1 text-3xl font-semibold text-[var(--mb-ink)]">{t('popularTitle')}</h2>
          </div>
          <Link href="/shop" className="hidden text-sm font-bold text-[var(--mb-pink)] sm:inline">{t('seeAll')}</Link>
        </div>
        {isError ? <p className="mb-card p-4 text-sm text-[var(--mb-ink-3)]">Popular categories are unavailable right now.</p> : null}
        {isLoading && categories.length === 0 ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-[var(--mb-radius)] bg-[var(--mb-pink-bg)]" />)}</div> : null}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className={`mb-card group min-h-40 p-4 transition hover:-translate-y-0.5 hover:border-[var(--mb-pink-soft)] ${index > 3 ? 'hidden sm:block' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-[var(--mb-pink-bg)] text-sm font-extrabold text-[var(--mb-pink)]">
                  {category.icon_url ? (
                    <Image src={category.icon_url} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <span className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full">
                      <CategoryIllustration slug={category.slug} uid={category.id} />
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2">
                  {category.is_hot ? <span className="rounded-full bg-[var(--mb-pink)] px-2 py-1 text-[10px] font-bold text-white">HOT</span> : null}
                  <ArrowUpRight size={16} className="text-[var(--mb-ink-3)] group-hover:text-[var(--mb-pink)]" />
                </span>
              </div>
              <h3 className="mt-4 line-clamp-1 text-lg font-semibold text-[var(--mb-ink)]">{category.name}</h3>
              <p className="text-xs font-medium text-[var(--mb-ink-3)]">{n(category.product_count)} {t('products')}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--mb-line)]">
                <div className="h-full rounded-full bg-gradient-to-r from-[var(--mb-pink)] to-[var(--mb-gold)]" style={{ width: `${Math.min(100, Math.max(0, category.trend_pct))}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs font-bold">
                <span className={category.trend_pct >= 0 ? 'text-[var(--mb-success)]' : 'text-[var(--mb-danger)]'}>↑ {n(category.trend_pct)}% this week</span>
                <span className="text-[var(--mb-ink-3)]">🟢 {n(category.active_viewers)} {t('viewing')}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
