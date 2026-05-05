'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { HomeProductCard } from '@/components/home/HomepageSections';

interface FlashSaleBannerProps {
  products: HomeProductCard[];
}

function msUntilMidnight(): number {
  // Count down to midnight in Bangladesh Standard Time (UTC+6)
  const bdNow = Date.now() + 6 * 3600_000;
  const msIntoDay = bdNow % 86_400_000;
  return 86_400_000 - msIntoDay;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function splitHMS(ms: number): { h: string; m: string; s: string } {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    h: pad(Math.floor(total / 3600)),
    m: pad(Math.floor((total % 3600) / 60)),
    s: pad(total % 60),
  };
}

function discountPercent(regular: string, sale: string): number | null {
  const r = parseFloat(regular);
  const s = parseFloat(sale);
  if (!r || !s || s >= r) return null;
  return Math.round(((r - s) / r) * 100);
}

export const FlashSaleBanner: React.FC<FlashSaleBannerProps> = ({ products }) => {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => setRemaining(msUntilMidnight());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!products || products.length === 0) return null;

  const items = products.slice(0, 10);
  const time = remaining !== null ? splitHMS(remaining) : null;

  return (
    <section className="w-full bg-ink px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-nowrap items-center justify-between gap-2 sm:gap-4">
          <h2 className="inline-flex flex-nowrap items-center gap-1.5 whitespace-nowrap text-lg font-extrabold text-white sm:gap-2 sm:text-2xl lg:text-3xl">
            <span aria-hidden="true" className="shrink-0">⚡</span>
            <span className="shrink-0">Flash Sale</span>
          </h2>
          <div className="flex items-center gap-1 text-xs font-bold sm:gap-2 sm:text-sm" aria-label="Time remaining until midnight">
            <span className="hidden text-white/70 sm:inline">Ends in</span>
            <span className="text-white/70 sm:hidden">Ends</span>
            {!mounted ? (
              <span className="animate-pulse rounded bg-stone-200/20 h-5 w-24" aria-hidden="true" />
            ) : (
              time && [time.h, time.m, time.s].map((unit, i) => (
                <span key={i} className="flex items-center" suppressHydrationWarning>
                  <span className="rounded-md bg-white/12 px-1.5 py-1 font-mono text-xs tabular-nums sm:rounded-lg sm:px-3 sm:py-2 sm:text-base">
                    {unit}
                  </span>
                  {i < 2 && <span className="px-0.5 text-white/60 sm:px-1">:</span>}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max gap-4">
            {items.map((p) => {
              const img = p.images?.[0];
              const pct = discountPercent(p.regular_price, p.sale_price);
              const stockLeft = Math.max(3, Math.min(12, p.stock_quantity ?? ((p.id % 8) + 3)));
              const stockProgress = Math.min(100, Math.round((stockLeft / 12) * 100));
              return (
                <li key={p.id} className="w-[180px] shrink-0 sm:w-[210px]">
                  <Link
                    href={`/shop/${p.slug}`}
                    className="block overflow-hidden rounded-lg bg-white text-ink shadow-card transition-shadow hover:shadow-pop"
                  >
                    <div className="relative aspect-square bg-gray-50">
                      {img?.src && (
                        <Image
                          src={img.src}
                          alt={img.alt || p.name}
                          fill
                          quality={76}
                          sizes="(max-width: 640px) 180px, 210px"
                          className="object-cover"
                        />
                      )}
                      {pct !== null && (
                        <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-1 text-[11px] font-bold text-white">
                          -{pct}%
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 min-h-[2.6rem] text-sm font-bold leading-5">{p.name}</p>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-base font-extrabold text-accent">৳{p.sale_price}</span>
                        {p.regular_price && p.regular_price !== p.sale_price && (
                          <span className="text-xs text-gray-500 line-through">৳{p.regular_price}</span>
                        )}
                      </div>
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-gray-500">
                          <span>Only {stockLeft} left</span>
                          <span>{stockLeft} টি বাকি</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${stockProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
            <li className="w-[180px] shrink-0 sm:w-[210px]">
              <Link
                href="/sale"
                className="flex h-full min-h-[100%] flex-col justify-between rounded-lg border border-dashed border-white/20 bg-white/6 p-5 text-white"
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-accent-soft">View more</div>
                  <div className="mt-3 text-2xl font-extrabold">All flash deals</div>
                  <p className="mt-3 text-sm leading-7 text-white/75">
                    See the full sale edit before the timer resets tonight.
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white">
                  View all flash deals <span>→</span>
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default FlashSaleBanner;
