'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Star } from 'lucide-react';
import { useCategoryPageI18n } from './categoryPageI18n';

interface FeaturedReview {
  id: number;
  quote: string;
  rating: number;
  verified: boolean;
  customer_first_name: string;
  customer_city: string;
  product?: { name: string; slug: string };
}

async function fetchReviews() {
  const response = await fetch('/api/reviews/featured?limit=3&min_rating=5&verified=true&recent_days=14&include=product,customer_first_name,customer_city', { cache: 'no-store' });
  if (!response.ok) throw new Error('Reviews unavailable');
  return response.json();
}

export default function CustomerWall({ initialReviews = [] }: { initialReviews?: FeaturedReview[] }) {
  const { t } = useCategoryPageI18n();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['category_page.featured_reviews'],
    queryFn: fetchReviews,
    initialData: { reviews: initialReviews },
    refetchInterval: 300_000,
  });
  const reviews: FeaturedReview[] = Array.isArray(data?.reviews) ? data.reviews : [];

  return (
    <section className="bg-white py-8 sm:py-10">
      <div className="mb-container">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--mb-pink)]">{t('customerEyebrow')}</p>
          <h2 className="mt-1 text-3xl font-semibold text-[var(--mb-ink)]">{t('customerTitle')}</h2>
        </div>
        {isError ? <p className="mb-card p-4 text-sm text-[var(--mb-ink-3)]">Reviews are unavailable right now.</p> : null}
        {isLoading && reviews.length === 0 ? <div className="grid gap-3 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-[var(--mb-radius)] bg-[var(--mb-cream)]" />)}</div> : null}
        <div className="grid gap-3 lg:grid-cols-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-[var(--mb-radius)] bg-[var(--mb-cream)] p-5">
              <div className="mb-4 flex text-[var(--mb-gold-soft)]">
                {Array.from({ length: 5 }).map((_, index) => <Star key={index} size={15} fill={index < review.rating ? 'currentColor' : 'none'} />)}
              </div>
              <p className="font-[var(--font-display)] text-lg leading-7 text-[var(--mb-ink)]">“{review.quote}”</p>
              <div className="mt-5 flex items-center gap-2 border-t border-[var(--mb-line)] pt-4 text-sm font-bold text-[var(--mb-ink)]">
                {review.verified ? <BadgeCheck size={16} className="text-[var(--mb-success)]" /> : null}
                {review.customer_first_name} · {review.customer_city}{review.verified ? ` · ${t('verified')}` : ''}
              </div>
              {review.product ? (
                <Link href={`/shop/${review.product.slug}`} className="mt-3 block truncate text-xs font-bold text-[var(--mb-pink)]">
                  {review.product.name}
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
