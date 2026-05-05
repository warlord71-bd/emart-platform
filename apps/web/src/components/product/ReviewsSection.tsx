'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { WooProduct, WooProductReview } from '@/lib/woocommerce';

interface ReviewsSectionProps {
  product: WooProduct;
  initialReviews?: WooProductReview[];
}

interface ReviewState {
  reviews: WooProductReview[];
  authenticated: boolean;
  verifiedPurchase: boolean;
  alreadyReviewed: boolean;
  canReview: boolean;
}

const emptyState: ReviewState = {
  reviews: [],
  authenticated: false,
  verifiedPurchase: false,
  alreadyReviewed: false,
  canReview: false,
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-[#ff8a00]" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>{star <= Math.round(rating) ? '★' : '☆'}</span>
      ))}
    </div>
  );
}

function formatReviewDate(value: string) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function calculateAverage(reviews: WooProductReview[], fallbackAverage: string) {
  if (reviews.length > 0) {
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return sum / reviews.length;
  }

  return parseFloat(fallbackAverage || '0') || 0;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ product, initialReviews = [] }) => {
  const [state, setState] = useState<ReviewState>({
    ...emptyState,
    reviews: initialReviews,
  });
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    fetch(`/api/product-reviews?productId=${product.id}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setState({
          reviews: Array.isArray(data.reviews) ? data.reviews : initialReviews,
          authenticated: Boolean(data.authenticated),
          verifiedPurchase: Boolean(data.verifiedPurchase),
          alreadyReviewed: Boolean(data.alreadyReviewed),
          canReview: Boolean(data.canReview),
        });
      })
      .catch(() => {
        if (!active) return;
        setState((current) => ({ ...current, reviews: initialReviews }));
      });

    return () => {
      active = false;
    };
  }, [product.id, initialReviews]);

  const reviews = state.reviews;
  const totalReviews = reviews.length || product.rating_count || 0;
  const average = calculateAverage(reviews, product.average_rating);
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((item) => item.rating === star).length,
  }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus('');

    const response = await fetch('/api/product-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        rating,
        review,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.error || 'Could not submit review right now.');
      setSubmitting(false);
      return;
    }

    const nextReviews = data.review ? [data.review, ...reviews] : reviews;
    setState({
      reviews: nextReviews,
      authenticated: true,
      verifiedPurchase: true,
      alreadyReviewed: true,
      canReview: false,
    });
    setReview('');
    setRating(5);
    setStatus(data.message || 'Thanks. Your review was submitted successfully.');
    setSubmitting(false);
  };

  return (
    <section className="space-y-6 py-2" id="reviews">
      <div>
        <h2 className="font-serif text-3xl font-bold text-ink">
          Rating & Reviews ({totalReviews})
        </h2>
        <p className="mt-2 text-sm text-muted">
          Real reviews from customers who bought this product through Emart.
        </p>
      </div>

      <div className="rounded-2xl bg-[#eaf6ff] p-5 md:p-7">
        {totalReviews > 0 ? (
          <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
            <div>
              <div className="text-5xl font-bold text-ink">{average.toFixed(1)}</div>
              <div className="mt-2 text-xl">
                <StarRating rating={average} />
              </div>
              <p className="mt-2 text-sm text-muted">
                {totalReviews} verified review{totalReviews === 1 ? '' : 's'}
              </p>
            </div>

            <div className="space-y-3">
              {counts.map(({ star, count }) => {
                const width = Math.round((count / totalReviews) * 100);

                return (
                  <div key={star} className="grid grid-cols-[20px_1fr_42px] items-center gap-3 text-sm text-ink">
                    <span>{star}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-[#3498db]"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="text-right text-muted">({count})</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-1 text-sm text-muted">
            <p className="font-semibold text-ink">Be the first to review this product.</p>
            <p>Verified buyer reviews help other customers choose confidently.</p>
          </div>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.slice(0, 6).map((item) => (
            <article key={item.id} className="grid gap-3 rounded-2xl border border-hairline bg-white p-4 md:grid-cols-[220px_1fr_120px] md:items-start">
              <div>
                <p className="font-semibold text-ink">{item.reviewer || 'Verified customer'}</p>
                <p className="mt-1 text-xs text-muted">{formatReviewDate(item.date_created)}</p>
                {item.verified && (
                  <span className="mt-2 inline-flex rounded-full bg-green-100 px-2 py-1 text-[11px] font-semibold text-green-700">
                    Verified purchase
                  </span>
                )}
              </div>
              <p className="text-sm leading-7 text-muted">{item.review}</p>
              <div className="md:justify-self-end">
                <StarRating rating={item.rating} />
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-ink">Write a verified review</h3>

        {!state.authenticated && (
          <p className="mt-2 text-sm text-muted">
            Please <Link href="/account" className="font-semibold text-accent hover:underline">log in</Link> to review products you bought from Emart.
          </p>
        )}

        {state.authenticated && !state.verifiedPurchase && (
          <p className="mt-2 text-sm text-muted">
            Only customers with a completed or processing order for this product can leave a review.
          </p>
        )}

        {state.alreadyReviewed && (
          <p className="mt-2 text-sm text-green-700">You have already reviewed this product. Thank you.</p>
        )}

        {state.canReview && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">Your rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-2xl text-[#ff8a00]"
                    aria-label={`${star} star${star === 1 ? '' : 's'}`}
                  >
                    {star <= rating ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="product-review" className="mb-2 block text-sm font-semibold text-ink">
                Your review
              </label>
              <textarea
                id="product-review"
                value={review}
                onChange={(event) => setReview(event.target.value)}
                rows={4}
                required
                minLength={10}
                maxLength={2000}
                className="w-full rounded-xl border border-hairline bg-bg px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
                placeholder="Share texture, result, delivery, or skin-type experience..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>
          </form>
        )}

        {status && (
          <p className={`mt-3 text-sm ${status.toLowerCase().includes('could') || status.toLowerCase().includes('only') ? 'text-red-600' : 'text-green-700'}`}>
            {status}
          </p>
        )}
      </div>
    </section>
  );
};
