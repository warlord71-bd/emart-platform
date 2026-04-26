'use client';

import { useEffect, useRef, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import type { WooProduct } from '@/lib/woocommerce';

interface StickyATCProps {
  product: WooProduct;
  triggerRef: React.RefObject<HTMLElement>;
}

export function StickyATC({ product, triggerRef }: StickyATCProps) {
  const [visible, setVisible] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [triggerRef]);

  const handleAdd = () => {
    addItem(product);
  };

  const price = Math.round(parseFloat(product.price || '0'));
  const inStock = product.stock_status === 'instock';

  if (!visible || !inStock) return null;

  return (
    <div className="fixed inset-x-0 bottom-[72px] z-40 border-t border-hairline bg-card px-4 py-3 shadow-[0_-8px_24px_rgba(31,24,22,0.12)] lg:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
          <p className="text-base font-bold text-accent">৳{price.toLocaleString('en-BD')}</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors active:bg-[#b85c73]"
        >
          <ShoppingCart size={16} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
