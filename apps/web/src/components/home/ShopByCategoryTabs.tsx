'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { WooProduct } from '@/lib/woocommerce';

interface Category {
  name: string;
  slug: string;
  emoji: string;
}

interface Props {
  categories: Category[];
  initialProducts: WooProduct[];
}

function ProductCard({ product }: { product: WooProduct }) {
  const price = product.sale_price || product.price;
  const hasDiscount = product.on_sale && product.regular_price && product.sale_price;
  const discount = hasDiscount
    ? Math.round((1 - parseFloat(product.sale_price) / parseFloat(product.regular_price)) * 100)
    : 0;
  const img = product.images?.[0]?.src;

  return (
    <Link
      href={`/${product.slug}`}
      className="flex-shrink-0 w-44 bg-white rounded-xl border border-gray-100 hover:border-[#e8197a] hover:shadow-md transition-all overflow-hidden group"
    >
      <div className="relative aspect-square bg-gray-50">
        {img ? (
          <Image src={img} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="176px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🧴</div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-[#e8197a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-medium text-gray-700 line-clamp-2 leading-tight mb-1">{product.name}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-[#e8197a]">৳{parseFloat(price).toLocaleString()}</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">৳{parseFloat(product.regular_price).toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ShopByCategoryTabs({ categories, initialProducts }: Props) {
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug || '');
  const [products, setProducts] = useState<WooProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const cache = useRef<Record<string, WooProduct[]>>({});

  // Cache initial products
  useEffect(() => {
    if (categories[0]?.slug) {
      cache.current[categories[0].slug] = initialProducts;
    }
  }, [categories, initialProducts]);

  async function switchCategory(slug: string) {
    if (slug === activeSlug) return;
    setActiveSlug(slug);

    if (cache.current[slug]) {
      setProducts(cache.current[slug]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/category-products?slug=${slug}&limit=10`);
      const data: WooProduct[] = await res.json();
      cache.current[slug] = data;
      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Category Tab Pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => switchCategory(cat.slug)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap
              ${activeSlug === cat.slug
                ? 'bg-[#1a1a2e] text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#e8197a] hover:text-[#e8197a]'
              }`}
          >
            <span>{cat.emoji}</span>
            {cat.name}
          </button>
        ))}
        <Link
          href="/shop"
          className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold bg-[#e8197a] text-white hover:bg-[#c8156a] transition-all whitespace-nowrap"
        >
          All Products →
        </Link>
      </div>

      {/* Products Horizontal Scroll */}
      <div className="relative mt-4">
        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-44 h-64 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
            <Link
              href={`/category/${activeSlug}`}
              className="flex-shrink-0 w-32 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 hover:border-[#e8197a] text-gray-400 hover:text-[#e8197a] transition-all text-sm font-medium gap-2"
            >
              <span className="text-2xl">→</span>
              See All
            </Link>
          </div>
        ) : (
          <p className="text-gray-400 text-sm py-8 text-center">No products found</p>
        )}
      </div>
    </div>
  );
}
