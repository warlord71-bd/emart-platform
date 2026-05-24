'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Flame, Gift, Tag, Package, Moon, Ticket, Truck, LayoutGrid } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { ProductListGrid } from '@/components/product/ProductListGrid';
import { OFFER_COLLECTIONS, type OfferCollectionConfig } from '@/lib/offerCollectionConfig';
import type { WooProduct } from '@/lib/woocommerce';

const ICON_MAP: Record<string, string> = {
  gift: '🎁',
  moon: '🌙',
  tag: '🏷️',
  boxes: '📦',
  truck: '🚚',
  ticket: '🎟️',
};

type ChipId = 'all' | 'sale' | string;

interface Chip {
  id: ChipId;
  label: string;
  emoji: string;
  href?: string;
  slug?: string;
}

const CHIPS: Chip[] = [
  { id: 'all', label: 'All Offers', emoji: '🛍️' },
  { id: 'sale', label: 'Sale Items', emoji: '🔥', href: '/sale' },
  ...OFFER_COLLECTIONS.map((c) => ({
    id: c.slug,
    label: c.label,
    emoji: ICON_MAP[c.icon] ?? '🛍️',
    slug: c.slug,
  })),
];

function ProductSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-hairline bg-white">
      <div className="aspect-square rounded-t-2xl bg-accent-soft" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-3/4 rounded bg-accent-soft" />
        <div className="h-3 w-1/2 rounded bg-accent-soft" />
        <div className="h-4 w-1/3 rounded bg-accent-soft" />
      </div>
    </div>
  );
}

const COLLECTION_ICON_MAP: Record<string, string> = {
  gift: '🎁',
  moon: '🌙',
  tag: '🏷️',
  boxes: '📦',
  truck: '🚚',
  ticket: '🎟️',
};

function CollectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Sale — first card */}
      <Link
        href="/sale"
        className="group flex flex-col overflow-hidden rounded-[24px] border border-hairline bg-gradient-to-br from-[#fff0f0] via-[#fff5f5] to-[#ffeaea] p-5 shadow-card transition-shadow hover:shadow-md"
      >
        <span className="text-2xl">🔥</span>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">All discounts</p>
        <h2 className="mt-1 text-lg font-extrabold text-ink leading-snug group-hover:text-accent transition-colors">
          Sale Items
        </h2>
        <p className="mt-2 text-xs leading-5 text-muted flex-1">All products currently on sale with reduced prices</p>
        <span className="mt-4 inline-flex items-center text-xs font-semibold text-accent">Browse picks →</span>
      </Link>

      {OFFER_COLLECTIONS.map((offer) => (
        <Link
          key={offer.slug}
          href={offer.href}
          className={`group flex flex-col overflow-hidden rounded-[24px] border border-hairline bg-gradient-to-br ${offer.accent} p-5 shadow-card transition-shadow hover:shadow-md`}
        >
          <span className="text-2xl">{COLLECTION_ICON_MAP[offer.icon] ?? '🛍️'}</span>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{offer.eyebrow}</p>
          <h2 className="mt-1 text-lg font-extrabold text-ink leading-snug group-hover:text-accent transition-colors">
            {offer.label}
          </h2>
          <p className="mt-2 text-xs leading-5 text-muted flex-1">{offer.hint}</p>
          <span className="mt-4 inline-flex items-center text-xs font-semibold text-accent">Browse picks →</span>
        </Link>
      ))}
    </div>
  );
}

export default function OffersHub() {
  const [active, setActive] = useState<ChipId>('all');
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const selectChip = useCallback(async (chip: Chip) => {
    // Sale chip navigates — handled by Link in chip bar, but also catches here
    if (chip.id === 'sale') return;
    if (chip.id === 'all') {
      setActive('all');
      setProducts([]);
      return;
    }
    setActive(chip.id);
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/offers/products?slug=${chip.slug}`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      setError(true);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const activeConfig = OFFER_COLLECTIONS.find((c) => c.slug === active);

  return (
    <div>
      {/* Chip bar */}
      <div className="mb-6 -mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex w-max items-center gap-2 pb-1">
          {CHIPS.map((chip) => {
            const isActive = chip.id === active;
            const baseClass =
              'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap';
            const activeClass = 'bg-ink text-white shadow-sm';
            const inactiveClass =
              'border border-hairline bg-white text-ink hover:border-accent hover:text-accent';

            if (chip.id === 'sale') {
              return (
                <Link
                  key={chip.id}
                  href="/sale"
                  className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
                >
                  <span>{chip.emoji}</span>
                  <span>{chip.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => selectChip(chip)}
                className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
              >
                <span>{chip.emoji}</span>
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area */}
      {active === 'all' && <CollectionCards />}

      {active !== 'all' && active !== 'sale' && (
        <div>
          {/* Collection header when chip selected */}
          {activeConfig && (
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                  {activeConfig.eyebrow}
                </p>
                <h2 className="text-xl font-extrabold text-ink">{activeConfig.title}</h2>
              </div>
              <Link
                href={activeConfig.href}
                className="text-xs font-semibold text-accent hover:underline"
              >
                See full page →
              </Link>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="py-12 text-center text-sm text-muted">
              Could not load products. <button type="button" className="text-accent hover:underline" onClick={() => selectChip(CHIPS.find((c) => c.id === active)!)}>Try again</button>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="py-12 text-center text-sm text-muted">
              No products in this collection yet.{' '}
              <Link href="/shop" className="text-accent hover:underline">Browse shop →</Link>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <ProductListGrid>
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 4} />
              ))}
            </ProductListGrid>
          )}
        </div>
      )}
    </div>
  );
}
