import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { getFeaturedCategories } from '@/lib/api/featured-categories';
import { CategoryCard } from './CategoryCard';

function Skeleton() {
  return (
    <div className="flex flex-col rounded-[var(--mb-radius)] border border-[var(--mb-line)] bg-white p-4">
      <div className="mb-3 aspect-[3/4] animate-pulse rounded-xl bg-[var(--mb-cream)]" />
      <div className="h-2.5 w-14 animate-pulse rounded bg-[var(--mb-line)]" />
      <div className="mt-1.5 h-3.5 w-24 animate-pulse rounded bg-[var(--mb-line)]" />
      <div className="mt-1 h-2.5 w-12 animate-pulse rounded bg-[var(--mb-line)]" />
    </div>
  );
}

export default async function ShopByCategory() {
  const categories = await getFeaturedCategories(5);

  return (
    // data-theme scopes all --mb-* CSS variables to this section
    <section data-theme="midnight-blossom" className="py-14">
      <div className="mx-auto max-w-[1280px] px-6">

        {/* ── Header ── */}
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--mb-pink)]">
              Browse
            </p>
            <h2 className="mt-1 font-display text-[34px] leading-tight text-[var(--mb-navy)]">
              Shop by category
            </h2>
          </div>
          <Link
            href="/categories"
            className="flex items-center gap-1 text-sm font-medium text-[var(--mb-pink)] hover:underline"
          >
            All categories <ArrowRight size={14} />
          </Link>
        </div>

        {/* ── Grid ──
            mobile  : horizontal scroll snap, 60vw cards
            sm      : 3-col grid
            md      : 4-col grid (cards 4 & 5 + CTA hidden, "see more" link shown)
            lg      : 6-col grid (all cards visible)
        ── */}
        <div className="
          flex gap-3 overflow-x-auto -mx-6 px-6
          snap-x snap-mandatory scroll-px-6
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0
          md:grid-cols-4
          lg:grid-cols-6
        ">
          {categories.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="min-w-[60vw] shrink-0 snap-start sm:min-w-0 sm:shrink">
                  <Skeleton />
                </div>
              ))
            : categories.map((cat, i) => (
                <div
                  key={cat.id}
                  // Cards at index ≥ 4 are hidden on md (tablet 4-col) but visible on lg
                  className={`min-w-[60vw] shrink-0 snap-start sm:min-w-0 sm:shrink${i >= 4 ? ' md:hidden lg:block' : ''}`}
                >
                  <CategoryCard category={cat} index={i} />
                </div>
              ))
          }

          {/* ── CTA card — always the 6th slot ── */}
          <div className="min-w-[60vw] shrink-0 snap-start sm:min-w-0 sm:shrink md:hidden lg:block">
            <Link
              href="/categories"
              className="group flex h-full flex-col rounded-[var(--mb-radius)] border border-[var(--mb-line)] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(27,27,47,.08)]"
            >
              <div className="relative mb-3 flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[var(--mb-navy)] to-[var(--mb-navy-2)]">
                <ArrowUpRight
                  size={28}
                  className="text-[var(--mb-gold)] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:scale-110"
                />
              </div>
              <p className="mt-0.5 font-display text-[18px] leading-snug text-[var(--mb-navy)]">
                All categories
              </p>
              <p className="mt-1 text-[11px] text-[var(--mb-ink-3)]">12,000+ products</p>
            </Link>
          </div>
        </div>

        {/* ── Tablet "see more" link — only between md and lg ── */}
        <div className="mt-3 hidden justify-end md:flex lg:hidden">
          <Link
            href="/categories"
            className="text-sm font-medium text-[var(--mb-pink)] hover:underline"
          >
            + 6 more categories →
          </Link>
        </div>

      </div>
    </section>
  );
}
