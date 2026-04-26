'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import type { WooCategory } from '@/lib/woocommerce';

interface Props {
  categories: WooCategory[];
  searchParams: Record<string, string | undefined>;
}

export function ProductFilters({ categories, searchParams }: Props) {
  const router = useRouter();

  const apply = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`/shop?${params.toString()}`);
  };

  const applyPriceRange = (min: string, max: string) => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    if (min) params.set('min_price', min);
    else params.delete('min_price');
    if (max) params.set('max_price', max);
    else params.delete('max_price');
    params.delete('page');
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="space-y-6 rounded-2xl border border-hairline bg-card p-5 shadow-card">
      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink">
          Category
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => apply('category', '')}
            className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors
                        ${!searchParams.category ? 'bg-ink text-white' : 'text-muted hover:bg-accent-soft hover:text-accent'}`}
          >
            All Categories
          </button>
          {categories.slice(0, 15).map((cat) => (
            <button
              key={cat.id}
              onClick={() => apply('category', cat.id.toString())}
              className={`flex w-full justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors
                          ${searchParams.category === cat.id.toString()
                            ? 'bg-ink text-white'
                            : 'text-muted hover:bg-accent-soft hover:text-accent'}`}
            >
              <span>{cat.name}</span>
              {cat.count !== undefined && (
                <span className="text-xs opacity-70">({cat.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* On Sale */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink">Offers</h3>
        <button
          onClick={() => apply('on_sale', searchParams.on_sale === 'true' ? '' : 'true')}
          className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors
                      ${searchParams.on_sale === 'true' ? 'bg-ink text-white' : 'text-muted hover:bg-accent-soft hover:text-accent'}`}
        >
          🔥 On Sale Only
        </button>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink">Price</h3>
        <div className="space-y-2">
          {[
            { label: 'Under ৳500', min: '', max: '500' },
            { label: '৳500 – ৳1,000', min: '500', max: '1000' },
            { label: '৳1,000 – ৳2,000', min: '1000', max: '2000' },
            { label: 'Above ৳2,000', min: '2000', max: '' },
          ].map(({ label, min, max }) => (
            <button
              key={label}
              onClick={() => applyPriceRange(min, max)}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors
                          ${searchParams.min_price === min && searchParams.max_price === max
                            ? 'bg-ink text-white'
                            : 'text-muted hover:bg-accent-soft hover:text-accent'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear All */}
      {(searchParams.category || searchParams.on_sale || searchParams.min_price) && (
        <button
          onClick={() => router.push('/shop')}
          className="w-full text-center text-sm text-muted-2 underline transition-colors hover:text-accent"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}

export default ProductFilters;
