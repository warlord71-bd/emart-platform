'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Star } from 'lucide-react';
import { useCategoryPageI18n } from './categoryPageI18n';

interface Concern {
  id: number;
  name: string;
  slug: string;
  product_count: number;
  review_count: number;
  avg_rating: number;
  top_product?: { name: string; slug: string };
}

async function fetchConcerns() {
  const response = await fetch('/api/concerns?include=product_count,review_count,avg_rating,top_product', { cache: 'no-store' });
  if (!response.ok) throw new Error('Concerns unavailable');
  return response.json();
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5 text-[var(--mb-gold)]">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={13} fill={index < Math.round(value) ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

export default function ConcernGrid({ initialConcerns = [] }: { initialConcerns?: Concern[] }) {
  const { t, n } = useCategoryPageI18n();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['category_page.concerns'],
    queryFn: fetchConcerns,
    initialData: { concerns: initialConcerns },
    refetchInterval: 60_000,
  });
  const concerns: Concern[] = Array.isArray(data?.concerns) ? data.concerns : [];

  return (
    <section id="concerns" className="py-8 sm:py-10">
      <div className="mb-container">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--mb-gold)]">{t('concernEyebrow')}</p>
          <h2 className="mt-1 text-3xl font-semibold text-[var(--mb-ink)]">{t('concernTitle')}</h2>
        </div>
        {isError ? <p className="mb-card p-4 text-sm text-[var(--mb-ink-3)]">Concern data is unavailable right now.</p> : null}
        {isLoading && concerns.length === 0 ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-[var(--mb-radius)] bg-[var(--mb-pink-bg)]" />)}</div> : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {concerns.map((concern) => (
            <Link key={concern.id} href={`/concerns?concern=${concern.slug}`} className="mb-card group p-5 transition hover:-translate-y-0.5 hover:border-[var(--mb-pink-soft)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--mb-ink)]">{concern.name}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <StarRating value={concern.avg_rating} />
                    <span className="text-xs font-bold text-[var(--mb-ink-3)]">{n(concern.review_count)} {t('reviews')}</span>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[var(--mb-ink-3)] group-hover:text-[var(--mb-pink)]" />
              </div>
              {concern.top_product ? (
                <p className="mt-4 text-sm leading-6 text-[var(--mb-ink-2)]">
                  <span className="font-bold">{t('mostLoved')}:</span> {concern.top_product.name}
                </p>
              ) : null}
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--mb-pink)]">{n(concern.product_count)} {t('products')}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
