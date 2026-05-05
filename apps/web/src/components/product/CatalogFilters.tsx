'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ORIGIN_DEFINITIONS } from '@/lib/origin-navigation';

type CatalogContext = 'skincare' | 'hair' | 'makeup';
type SortValue = 'newest' | 'price-asc' | 'price-desc' | 'popularity' | 'rating';
type Variant = 'mobile' | 'desktop';

interface Props {
  basePath: string;
  searchParams: Record<string, string | undefined>;
  context?: CatalogContext;
  resultCount: number;
  totalCount: number;
  showOrigin?: boolean;
  defaultSort?: SortValue;
  variant?: Variant;
}

const PRICE_OPTIONS = [
  { label: 'Under ৳500', value: 'under500' },
  { label: '৳500-1000', value: '500-1000' },
  { label: '৳1000-2000', value: '1000-2000' },
  { label: '৳2000+', value: '2000plus' },
];

const SORT_OPTIONS: { label: string; value: SortValue }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price Low-High', value: 'price-asc' },
  { label: 'Price High-Low', value: 'price-desc' },
  { label: 'Popularity', value: 'popularity' },
  { label: 'Rating', value: 'rating' },
];

const ORIGIN_OPTIONS = ORIGIN_DEFINITIONS.map((origin) => ({
  label: origin.label,
  value: origin.country,
}));
const ORIGIN_VISIBLE_LIMIT = 7;

const CONTEXT_OPTIONS: Record<CatalogContext, { heading: string; chips: string[] }> = {
  skincare: {
    heading: 'Skin Type',
    chips: ['Oily', 'Dry', 'Combination', 'Sensitive'],
  },
  hair: {
    heading: 'Hair Type',
    chips: ['Dry', 'Oily', 'Damaged', 'Normal'],
  },
  makeup: {
    heading: 'Finish',
    chips: ['Matte', 'Dewy', 'Natural'],
  },
};

const CLEARABLE_KEYS = ['price', 'sort', 'in_stock', 'origin', 'skin_type', 'hair_type', 'finish'];
const ACTIVE_KEYS = ['price', 'sort', 'in_stock', 'origin'];

function toUrlSearchParams(searchParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  return params;
}

export default function CatalogFilters({
  basePath,
  searchParams,
  context,
  resultCount,
  totalCount,
  showOrigin = false,
  defaultSort = 'newest',
  variant = 'mobile',
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const liveSearchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [originExpanded, setOriginExpanded] = useState(false);
  const targetPath = basePath || pathname;
  const selectedSort = (searchParams.sort as SortValue | undefined) || defaultSort;
  const selectedSortLabel = SORT_OPTIONS.find((option) => option.value === selectedSort)?.label || 'Sort by';
  const selectedPriceLabel = PRICE_OPTIONS.find((option) => option.value === searchParams.price)?.label;
  const selectedOriginLabel = ORIGIN_OPTIONS.find((option) => option.value === searchParams.origin)?.label;
  const activeCount = ACTIVE_KEYS.filter((key) => Boolean(searchParams[key])).length;
  const hasAnyActive = CLEARABLE_KEYS.some((key) => Boolean(searchParams[key]));
  // TODO: ship skin-type filter (and hair-type, finish) — hide until feature is ready
  const contextFilterEnabled = process.env.NEXT_PUBLIC_FEATURE_SKIN_TYPE_FILTER === 'true';
  const contextOptions = contextFilterEnabled && context ? CONTEXT_OPTIONS[context] : undefined;
  const visibleOriginOptions = originExpanded
    ? ORIGIN_OPTIONS
    : [
        ...ORIGIN_OPTIONS.slice(0, ORIGIN_VISIBLE_LIMIT),
        ...ORIGIN_OPTIONS.filter((origin) => (
          origin.value === searchParams.origin &&
          !ORIGIN_OPTIONS.slice(0, ORIGIN_VISIBLE_LIMIT).some((item) => item.value === origin.value)
        )),
      ];

  const pushParams = (params: URLSearchParams) => {
    params.delete('page');
    const query = params.toString();
    router.push(query ? `${targetPath}?${query}` : targetPath);
  };

  const toggle = (key: string, value: string) => {
    const params = toUrlSearchParams(searchParams);

    if (searchParams[key] === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    pushParams(params);
  };

  const setSort = (value: string) => {
    const params = toUrlSearchParams(searchParams);

    if (value === defaultSort) {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }

    pushParams(params);
  };

  const clearAll = () => {
    const params = toUrlSearchParams(searchParams);
    CLEARABLE_KEYS.forEach((key) => params.delete(key));
    params.delete('page');
    const query = params.toString();
    router.push(query ? `${targetPath}?${query}` : targetPath);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const buttonClass = (active: boolean) =>
    `w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
      active
        ? 'bg-accent text-white'
        : 'text-muted hover:bg-accent-soft hover:text-accent'
    }`;

  const chipClass = (active: boolean) =>
    `h-10 shrink-0 rounded-lg border px-3 text-xs font-semibold transition-colors ${
      active
        ? 'border-accent bg-accent text-white'
        : 'border-hairline bg-card text-muted hover:border-accent hover:text-accent'
    }`;

  const drawerChipClass = (active: boolean) =>
    `min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
      active
        ? 'border-accent bg-accent text-white'
        : 'border-hairline bg-card text-ink-2'
    }`;

  if (variant === 'mobile') {
    return (
      <div className="lg:hidden -mx-4 mb-5 bg-bg">
        <div className="sticky top-0 z-20 border-y border-hairline bg-bg/95 px-4 py-3 backdrop-blur">
          <div className="flex gap-3">
            <label className="relative flex-1">
              <span className="sr-only">Sort products</span>
              <select
                aria-label="Sort products"
                value={selectedSort}
                onChange={(event) => setSort(event.target.value)}
                className="h-12 w-full appearance-none rounded-lg border border-hairline bg-card px-4 pr-10 text-sm font-semibold text-ink focus:border-accent focus:outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort by: {option.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                ▾
              </span>
            </label>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="relative flex h-12 w-14 shrink-0 items-center justify-center rounded-lg border border-hairline bg-card text-ink"
              aria-label="Open filters"
            >
              <span className="text-xl leading-none">☷</span>
              {activeCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-lg bg-accent px-1 text-xs font-bold text-white">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
            <span>Showing {resultCount} of {totalCount} products</span>
            {hasAnyActive && (
              <button type="button" onClick={clearAll} className="font-semibold text-accent">
                Clear all
              </button>
            )}
          </div>

          {(selectedPriceLabel || selectedOriginLabel || searchParams.in_stock === '1' || searchParams.sort) && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {selectedOriginLabel && (
                <button
                  type="button"
                  onClick={() => toggle('origin', searchParams.origin || '')}
                  className={chipClass(true)}
                >
                  {selectedOriginLabel}
                </button>
              )}
              {selectedPriceLabel && (
                <button
                  type="button"
                  onClick={() => toggle('price', searchParams.price || '')}
                  className={chipClass(true)}
                >
                  {selectedPriceLabel}
                </button>
              )}
              {searchParams.in_stock === '1' && (
                <button type="button" onClick={() => toggle('in_stock', '1')} className={chipClass(true)}>
                  In Stock
                </button>
              )}
              {searchParams.sort && (
                <button type="button" onClick={() => setSort(defaultSort)} className={chipClass(true)}>
                  {selectedSortLabel}
                </button>
              )}
            </div>
          )}
        </div>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close filters"
              className="absolute inset-0 bg-black/50"
              onClick={closeDrawer}
            />
            <div className="absolute inset-x-0 bottom-0 flex max-h-[82vh] flex-col rounded-t-2xl bg-card shadow-pop">
              <div className="flex justify-center pt-3">
                <span className="h-1.5 w-11 rounded-full bg-bg-stone" />
              </div>
              <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
                <div>
                  <p className="text-lg font-bold text-ink">Filter</p>
                  <p className="text-xs text-muted">Showing {resultCount} of {totalCount}</p>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl text-muted"
                  aria-label="Close filters"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">
                {showOrigin && (
                  <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-base font-bold text-ink">Origin</h3>
                      <button
                        type="button"
                        onClick={() => setOriginExpanded((value) => !value)}
                        className="text-xs font-bold text-accent"
                      >
                        {originExpanded ? 'Show less' : 'Show more'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {visibleOriginOptions.map((origin) => (
                        <button
                          key={origin.value}
                          type="button"
                          onClick={() => toggle('origin', origin.value)}
                          className={drawerChipClass(searchParams.origin === origin.value)}
                        >
                          <span className="block truncate">{origin.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <h3 className="mb-3 text-xl font-bold text-ink">Price</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {PRICE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggle('price', option.value)}
                        className={drawerChipClass(searchParams.price === option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-base font-bold text-ink">Availability</h3>
                  <button
                    type="button"
                    onClick={() => toggle('in_stock', '1')}
                    className={drawerChipClass(searchParams.in_stock === '1')}
                  >
                    In Stock only
                  </button>
                </section>

                {contextOptions && (
                  <section>
                    <h3 className="mb-3 text-base font-bold text-ink">{contextOptions.heading}</h3>
                    <p className="rounded-lg border border-hairline bg-bg-alt px-3 py-3 text-sm text-muted">
                      More filters are coming soon.
                    </p>
                  </section>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-hairline p-5">
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={!hasAnyActive}
                  className="h-12 rounded-lg border border-hairline text-sm font-bold text-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="h-12 rounded-lg bg-ink text-sm font-bold text-white"
                >
                  Apply filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="hidden lg:sticky lg:top-24 lg:block">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Filters</h2>
          <p className="mt-1 text-xs text-muted">
            Showing {resultCount} of {totalCount} products
          </p>
        </div>
        {activeCount > 0 && (
          <span className="rounded-lg bg-accent-soft px-2 py-1 text-xs font-semibold text-accent">
            {activeCount}
          </span>
        )}
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink">Price</h3>
          <div className="space-y-1">
            {PRICE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle('price', option.value)}
                className={buttonClass(searchParams.price === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink">
            Availability
          </h3>
          <button
            type="button"
            onClick={() => toggle('in_stock', '1')}
            className={buttonClass(searchParams.in_stock === '1')}
          >
            In Stock only
          </button>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink">Sort</h3>
          <select
            aria-label="Sort products"
            value={selectedSort}
            onChange={(event) => setSort(event.target.value)}
            className="w-full rounded-lg border border-hairline bg-card px-3 py-2 text-sm text-ink-2 focus:border-accent focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </section>

        {contextOptions && (
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink">
              {contextOptions.heading}
            </h3>
            <div className="space-y-1">
              {contextOptions.chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-lg px-3 py-2 text-left text-sm text-gray-400 opacity-60"
                >
                  {chip} soon
                </button>
              ))}
            </div>
          </section>
        )}

        {showOrigin && (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink">Origin</h3>
              <button
                type="button"
                onClick={() => setOriginExpanded((value) => !value)}
                className="text-xs font-bold text-accent hover:underline"
              >
                {originExpanded ? 'Show less' : 'Show more'}
              </button>
            </div>
            <div className="space-y-1">
              {visibleOriginOptions.map((origin) => (
                <button
                  key={origin.value}
                  type="button"
                  onClick={() => toggle('origin', origin.value)}
                  className={buttonClass(searchParams.origin === origin.value)}
                >
                  <span className="block truncate">{origin.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {hasAnyActive && (
          <button
            type="button"
            onClick={clearAll}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-accent hover:bg-accent-soft"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
