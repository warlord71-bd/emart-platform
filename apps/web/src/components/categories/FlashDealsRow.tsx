'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useFlash } from '@/lib/realtime/flash-context';
import StockBar from '@/components/shared/StockBar';
import { useCategoryPageI18n } from './categoryPageI18n';
import CountdownTiles from './CountdownTiles';

interface FlashProduct {
  id: number;
  name: string;
  slug: string;
  brand: string;
  image: string;
  sale_price: number;
  original_price: number;
  stock_sold: number;
  stock_total: number;
}

async function fetchDeals() {
  const response = await fetch('/api/products?promotion=flash&active=true&limit=5&sort=stock_velocity_desc&include=stock_sold,stock_total,original_price,sale_price,brand', { cache: 'no-store' });
  if (!response.ok) throw new Error('Flash deals unavailable');
  return response.json();
}

export default function FlashDealsRow({ initialProducts = [] }: { initialProducts?: FlashProduct[] }) {
  const { t, currency } = useCategoryPageI18n();
  const { secondsRemaining } = useFlash();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['category_page.flash_deals'],
    queryFn: fetchDeals,
    initialData: { products: initialProducts },
    refetchInterval: 60_000,
  });
  const products: FlashProduct[] = Array.isArray(data?.products) ? data.products : [];

  return (
    <section className="bg-[var(--mb-paper)] py-8 sm:py-10">
      <div className="mb-container">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--mb-pink)]">Stock velocity</p>
            <h2 className="mt-1 text-3xl font-semibold text-[var(--mb-ink)]">{t('flashDeals')}</h2>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--mb-ink-3)]">{t('flashEnds')}</p>
            <CountdownTiles seconds={secondsRemaining} />
          </div>
        </div>
        {isError ? <p className="mb-card p-4 text-sm text-[var(--mb-ink-3)]">Flash deals are unavailable right now.</p> : null}
        {isLoading && products.length === 0 ? <div className="h-72 animate-pulse rounded-[var(--mb-radius)] bg-[var(--mb-pink-bg)]" /> : null}
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 mb-scrollbar-none lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
          {products.map((product) => {
            const discount = product.original_price > product.sale_price
              ? Math.round((1 - product.sale_price / product.original_price) * 100)
              : 0;
            return (
              <Link key={product.id} href={`/shop/${product.slug}`} className="mb-card w-[76vw] shrink-0 snap-start overflow-hidden transition hover:-translate-y-0.5 sm:w-[260px] lg:w-auto">
                <div className="relative aspect-square bg-[var(--mb-pink-bg)]">
                  <Image src={product.image || '/logo.png'} alt={product.name} fill sizes="(max-width: 640px) 76vw, 20vw" className="object-cover" />
                  {discount > 0 ? <span className="absolute left-3 top-3 rounded-full bg-[var(--mb-danger)] px-2.5 py-1 text-xs font-bold text-white">-{discount}%</span> : null}
                </div>
                <div className="p-4">
                  <p className="truncate text-xs font-bold uppercase tracking-[0.16em] text-[var(--mb-pink)]">{product.brand}</p>
                  <h3 className="mt-1 line-clamp-2 min-h-[44px] text-sm font-bold leading-snug text-[var(--mb-ink)]">{product.name}</h3>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-lg font-extrabold text-[var(--mb-pink)]">{currency(product.sale_price)}</span>
                    {product.original_price > product.sale_price ? <span className="text-xs text-[var(--mb-ink-3)] line-through">{currency(product.original_price)}</span> : null}
                  </div>
                  <div className="mt-4">
                    <StockBar sold={product.stock_sold} total={product.stock_total} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
