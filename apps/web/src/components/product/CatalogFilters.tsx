'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CONCERN_DEFINITIONS } from '@/lib/concerns';
import { INGREDIENT_DEFINITIONS } from '@/lib/ingredients';

type SortValue = 'newest' | 'price-asc' | 'price-desc' | 'popularity' | 'rating';
type Variant = 'mobile' | 'desktop';

interface Props {
  basePath: string;
  searchParams: Record<string, string | undefined>;
  resultCount: number;
  totalCount: number;
  showOrigin?: boolean;
  showConcern?: boolean;
  showSkinType?: boolean;
  showIngredient?: boolean;
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

const SKIN_TYPE_OPTIONS = [
  { label: 'Oily', value: 'oily' },
  { label: 'Dry', value: 'dry' },
  { label: 'Combination', value: 'combination' },
  { label: 'Sensitive', value: 'sensitive' },
  { label: 'Normal', value: 'normal' },
];

const CONCERN_OPTIONS = CONCERN_DEFINITIONS.map((c) => ({ label: c.label, value: c.slug }));
const INGREDIENT_OPTIONS = INGREDIENT_DEFINITIONS.map((i) => ({ label: i.label, value: i.slug }));
const INGREDIENT_VISIBLE_LIMIT = 8;

const CLEARABLE_KEYS = ['price', 'sort', 'in_stock', 'concern', 'skin_type', 'ingredient'];
const ACTIVE_KEYS = ['price', 'in_stock', 'concern', 'skin_type', 'ingredient'];

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
  resultCount,
  totalCount,
  showOrigin = false,
  showConcern = false,
  showSkinType = false,
  showIngredient = false,
  defaultSort = 'newest',
  variant = 'mobile',
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ingredientExpanded, setIngredientExpanded] = useState(false);
  const targetPath = basePath || pathname;

  const selectedSort = (searchParams.sort as SortValue | undefined) || defaultSort;
  const selectedSortLabel = SORT_OPTIONS.find((o) => o.value === selectedSort)?.label || 'Sort by';
  const selectedPriceLabel = PRICE_OPTIONS.find((o) => o.value === searchParams.price)?.label;
  const selectedConcernLabel = CONCERN_OPTIONS.find((o) => o.value === searchParams.concern)?.label;
  const selectedSkinTypeLabel = SKIN_TYPE_OPTIONS.find((o) => o.value === searchParams.skin_type)?.label;
  const selectedIngredientLabel = INGREDIENT_OPTIONS.find((o) => o.value === searchParams.ingredient)?.label;

  const activeCount = ACTIVE_KEYS.filter((key) => Boolean(searchParams[key])).length;
  const hasAnyActive = CLEARABLE_KEYS.some((key) => Boolean(searchParams[key]));

  const visibleIngredientOptions = ingredientExpanded
    ? INGREDIENT_OPTIONS
    : [
        ...INGREDIENT_OPTIONS.slice(0, INGREDIENT_VISIBLE_LIMIT),
        ...INGREDIENT_OPTIONS.filter(
          (i) =>
            i.value === searchParams.ingredient &&
            !INGREDIENT_OPTIONS.slice(0, INGREDIENT_VISIBLE_LIMIT).some((item) => item.value === i.value),
        ),
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

  const buttonClass = (active: boolean) =>
    `w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
      active ? 'bg-accent text-white' : 'text-muted hover:bg-accent-soft hover:text-accent'
    }`;

  const chipClass = (active: boolean) =>
    `h-10 shrink-0 rounded-lg border px-3 text-xs font-semibold transition-colors ${
      active
        ? 'border-accent bg-accent text-white'
        : 'border-hairline bg-card text-muted hover:border-accent hover:text-accent'
    }`;

  const drawerChipClass = (active: boolean) =>
    `min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
      active ? 'border-accent bg-accent text-white' : 'border-hairline bg-card text-ink-2'
    }`;

  const hasActiveChips =
    selectedConcernLabel ||
    selectedSkinTypeLabel ||
    selectedIngredientLabel ||
    selectedPriceLabel ||
    searchParams.in_stock === '1' ||
    searchParams.sort;

  if (variant === 'mobile') {
    return (
      <div className="lg:hidden -mx-4 mb-5 bg-bg">
        {/* Sticky sort + filter bar */}
        <div className="sticky top-0 z-20 border-y border-hairline bg-bg px-4 py-3">
          <div className="flex gap-3">
            <label className="relative flex-1">
              <span className="sr-only">Sort products</span>
              <select
                aria-label="Sort products"
                value={selectedSort}
                onChange={(e) => setSort(e.target.value)}
                className="h-12 w-full appearance-none rounded-lg border border-hairline bg-card px-4 pr-10 text-sm font-semibold text-ink focus:border-accent focus:outline-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    Sort by: {o.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
            </label>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="relative flex h-12 w-14 shrink-0 items-center justify-center rounded-lg border border-hairline bg-card text-ink"
              aria-label="Open filters"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12M10 20h4" />
              </svg>
              {activeCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
            <span>
              Showing {resultCount} of {totalCount} products
            </span>
            {hasAnyActive && (
              <button type="button" onClick={clearAll} className="font-semibold text-accent">
                Clear all
              </button>
            )}
          </div>

          {/* Active filter chips strip */}
          {hasActiveChips && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {selectedConcernLabel && (
                <button
                  type="button"
                  onClick={() => toggle('concern', searchParams.concern || '')}
                  className={chipClass(true)}
                >
                  {selectedConcernLabel} ×
                </button>
              )}
              {selectedSkinTypeLabel && (
                <button
                  type="button"
                  onClick={() => toggle('skin_type', searchParams.skin_type || '')}
                  className={chipClass(true)}
                >
                  {selectedSkinTypeLabel} ×
                </button>
              )}
              {selectedIngredientLabel && (
                <button
                  type="button"
                  onClick={() => toggle('ingredient', searchParams.ingredient || '')}
                  className={chipClass(true)}
                >
                  {selectedIngredientLabel} ×
                </button>
              )}
              {selectedPriceLabel && (
                <button
                  type="button"
                  onClick={() => toggle('price', searchParams.price || '')}
                  className={chipClass(true)}
                >
                  {selectedPriceLabel} ×
                </button>
              )}
              {searchParams.in_stock === '1' && (
                <button type="button" onClick={() => toggle('in_stock', '1')} className={chipClass(true)}>
                  In Stock ×
                </button>
              )}
              {searchParams.sort && (
                <button type="button" onClick={() => setSort(defaultSort)} className={chipClass(true)}>
                  {selectedSortLabel} ×
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom-sheet filter drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close filters"
              className="absolute inset-0 bg-black/50"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-card shadow-pop">
              {/* Handle */}
              <div className="flex justify-center pt-3">
                <span className="h-1.5 w-11 rounded-full bg-bg-stone" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
                <div>
                  <p className="text-lg font-bold text-ink">Filters</p>
                  <p className="text-xs text-muted">
                    Showing {resultCount} of {totalCount}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-muted hover:bg-bg-alt"
                  aria-label="Close filters"
                >
                  ×
                </button>
              </div>

              {/* Scrollable sections */}
              <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">
                {/* Concern */}
                {showConcern && (
                  <section>
                    <h3 className="mb-3 text-base font-bold text-ink">Concern</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {CONCERN_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggle('concern', option.value)}
                          className={drawerChipClass(searchParams.concern === option.value)}
                        >
                          <span className="block truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Skin Type */}
                {showSkinType && (
                  <section>
                    <h3 className="mb-3 text-base font-bold text-ink">Skin Type</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {SKIN_TYPE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggle('skin_type', option.value)}
                          className={drawerChipClass(searchParams.skin_type === option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Ingredient */}
                {showIngredient && (
                  <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-base font-bold text-ink">Ingredient</h3>
                      <button
                        type="button"
                        onClick={() => setIngredientExpanded((v) => !v)}
                        className="text-xs font-bold text-accent"
                      >
                        {ingredientExpanded ? 'Show less' : `Show all ${INGREDIENT_OPTIONS.length}`}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {visibleIngredientOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggle('ingredient', option.value)}
                          className={drawerChipClass(searchParams.ingredient === option.value)}
                        >
                          <span className="block truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Price */}
                <section>
                  <h3 className="mb-3 text-base font-bold text-ink">Price</h3>
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

                {/* Availability */}
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
              </div>

              {/* Footer actions */}
              <div className="grid grid-cols-2 gap-3 border-t border-hairline p-5">
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={!hasAnyActive}
                  className="h-12 rounded-xl border border-hairline text-sm font-bold text-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="h-12 rounded-xl bg-ink text-sm font-bold text-white"
                >
                  {activeCount > 0 ? `Show results (${activeCount})` : 'Show results'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Desktop sidebar ─────────────────────────────────────────────────────────
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
          <span className="rounded-lg bg-accent-soft px-2 py-1 text-xs font-semibold text-accent">{activeCount}</span>
        )}
      </div>

      <div className="space-y-6">
        {/* Sort */}
        <section>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink">Sort</h3>
          <select
            aria-label="Sort products"
            value={selectedSort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-card px-3 py-2 text-sm text-ink-2 focus:border-accent focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </section>

        {/* Concern */}
        {showConcern && (
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink">Concern</h3>
            <div className="space-y-1">
              {CONCERN_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle('concern', option.value)}
                  className={buttonClass(searchParams.concern === option.value)}
                >
                  <span className="block truncate">{option.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Skin Type */}
        {showSkinType && (
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink">Skin Type</h3>
            <div className="space-y-1">
              {SKIN_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle('skin_type', option.value)}
                  className={buttonClass(searchParams.skin_type === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Ingredient */}
        {showIngredient && (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink">Ingredient</h3>
              <button
                type="button"
                onClick={() => setIngredientExpanded((v) => !v)}
                className="text-xs font-bold text-accent hover:underline"
              >
                {ingredientExpanded ? 'Show less' : 'More'}
              </button>
            </div>
            <div className="space-y-1">
              {visibleIngredientOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle('ingredient', option.value)}
                  className={buttonClass(searchParams.ingredient === option.value)}
                >
                  <span className="block truncate">{option.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Origin (kept for brand/category pages that pass showOrigin) */}
        {showOrigin && (
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink">Origin</h3>
            <p className="text-xs text-muted">Use the Origins menu to browse by country.</p>
          </section>
        )}

        {/* Price */}
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

        {/* Availability */}
        <section>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink">Availability</h3>
          <button
            type="button"
            onClick={() => toggle('in_stock', '1')}
            className={buttonClass(searchParams.in_stock === '1')}
          >
            In Stock only
          </button>
        </section>

        {hasAnyActive && (
          <button
            type="button"
            onClick={clearAll}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-accent hover:bg-accent-soft"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
