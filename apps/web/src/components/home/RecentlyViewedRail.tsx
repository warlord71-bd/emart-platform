'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatBDT } from '@/lib/formatters';

interface ViewedProduct {
  id: number;
  slug: string;
  name: string;
  price: string;
  image: string;
  brand: string;
}

const STORAGE_KEY = 'emart-recently-viewed';

export default function RecentlyViewedRail() {
  const [products, setProducts] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as ViewedProduct[];
      if (stored.length > 0) setProducts(stored.slice(0, 8));
    } catch { /* localStorage unavailable */ }
  }, []);

  if (products.length < 2) return null;

  return (
    <section className="mx-auto max-w-7xl px-3 py-8 sm:px-4 lg:px-6">
      <h2 className="section-title mb-4">Recently Viewed</h2>
      <div className="-mx-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] sm:-mx-4 sm:px-4 [&::-webkit-scrollbar]:hidden lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
        <div className="flex gap-3 lg:grid lg:grid-cols-4 lg:gap-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/shop/${p.slug}`}
              className="w-[40vw] min-w-[140px] max-w-[196px] flex-none overflow-hidden rounded-xl border border-hairline bg-card shadow-card transition-transform hover:scale-[1.02] lg:w-auto lg:min-w-0 lg:max-w-none"
            >
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  width={196}
                  height={196}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="flex aspect-square w-full items-center justify-center bg-gray-100 text-xs text-gray-400">
                  No image
                </span>
              )}
              <div className="p-2">
                <p className="line-clamp-1 text-xs font-medium text-ink">{p.name}</p>
                {p.brand && (
                  <p className="mt-0.5 text-[11px] text-muted">{p.brand}</p>
                )}
                <p className="mt-1 text-sm font-bold text-primary-500">
                  {formatBDT(p.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
