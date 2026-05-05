'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import type { WooProduct } from '@/lib/woocommerce';

interface HomeProductRailProps {
  products: WooProduct[];
  viewAllHref: string;
  viewAllLabel: string;
  mobileLimit?: number;
  desktopLimit?: number;
}

export function HomeProductRail({
  products,
  viewAllHref,
  viewAllLabel,
  mobileLimit = 15,
  desktopLimit = 5,
}: HomeProductRailProps) {
  const visibleProducts = products.slice(0, mobileLimit);

  return (
    <div className="relative">
      <div className="-mx-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] sm:-mx-4 sm:px-4 [&::-webkit-scrollbar]:hidden lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
        <div className="flex items-stretch gap-3 lg:grid lg:grid-cols-5 lg:gap-4">
          {visibleProducts.map((product, index) => (
            <div
              key={product.id}
              className={`w-[44vw] min-w-[148px] max-w-[196px] flex-none min-[360px]:min-w-[158px] min-[430px]:max-w-[210px] lg:w-auto lg:min-w-0 lg:max-w-none ${
                index >= desktopLimit ? 'lg:hidden' : ''
              }`}
            >
              <ProductCard product={product} />
            </div>
          ))}

          <Link
            href={viewAllHref}
            aria-label={`See more ${viewAllLabel}`}
            className="relative flex w-[42vw] min-w-[142px] max-w-[188px] flex-none flex-col justify-between overflow-hidden rounded-2xl border border-hairline bg-gradient-to-br from-accent-soft via-white to-[#f5efe7] p-3 text-left text-ink shadow-card ring-1 ring-hairline min-[360px]:min-w-[152px] min-[430px]:max-w-[202px] lg:hidden"
          >
            <span className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/10" />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white shadow-sm">
              <Sparkles size={17} />
            </span>
            <span className="relative mt-8 block">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-accent">
                More picks
              </span>
              <span className="mt-1 block text-lg font-extrabold leading-tight">
                See more
              </span>
              <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted">
                Browse all {viewAllLabel.toLowerCase()}.
              </span>
            </span>
            <span className="relative mt-4 inline-flex items-center gap-2 text-sm font-bold text-accent">
              View All →
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
                <ArrowRight size={16} />
              </span>
            </span>
          </Link>
        </div>
      </div>

      <Link
        href={viewAllHref}
        aria-label={`View All ${viewAllLabel}`}
        className="absolute -right-6 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-hairline bg-card text-ink shadow-card transition-transform hover:scale-105 lg:flex"
      >
        <ChevronRight size={24} />
      </Link>
    </div>
  );
}

export default HomeProductRail;
