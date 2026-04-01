'use client';
// src/components/product/ProductCard.tsx

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, getDiscountPercent, isInStock } from '@/lib/woocommerce';
import type { WooProduct } from '@/lib/woocommerce';
import toast from 'react-hot-toast';

interface Props {
  product: WooProduct;
}

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);

  const discount = product.on_sale
    ? getDiscountPercent(product.regular_price, product.sale_price)
    : 0;

  const inStock = isInStock(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    addItem(product);
    toast.success(`${product.name.substring(0, 30)}... added to cart!`, {
      duration: 2000,
    });
  };

  return (
    <div className="group card relative overflow-hidden">

      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {discount > 0 && (
          <span className="badge-sale">-{discount}%</span>
        )}
        {product.featured && (
          <span className="badge bg-[#1a1a2e] text-white">Featured</span>
        )}
        {!inStock && (
          <span className="badge bg-gray-400 text-white">Out of Stock</span>
        )}
      </div>

      {/* Wishlist */}
      <button
        className="absolute top-2 right-2 z-10 p-1.5 bg-white rounded-full shadow
                   opacity-0 group-hover:opacity-100 transition-opacity
                   hover:text-[#e8197a]"
        aria-label="Add to wishlist"
      >
        <Heart size={16} />
      </button>

      <Link href={`/shop/${product.slug}`}>
        {/* Image */}
        <div className="product-img-wrap">
          <Image
            src={product.images[0]?.src || '/images/placeholder.jpg'}
            alt={product.images[0]?.alt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Info */}
        <div className="p-3">
          {/* Category */}
          {product.categories[0] && (
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              {product.categories[0].name}
            </span>
          )}

          {/* Name */}
          <h3 className="text-sm font-semibold text-gray-800 mt-0.5 line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          {parseFloat(product.average_rating) > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    width="12" height="12"
                    viewBox="0 0 24 24"
                    fill={i < Math.round(parseFloat(product.average_rating)) ? '#f59e0b' : '#d1d5db'}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-400">({product.rating_count})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mt-2">
            <span className="price text-base">
              {formatPrice(product.sale_price || product.price)}
            </span>
            {product.on_sale && product.regular_price && (
              <span className="price-old">
                {formatPrice(product.regular_price)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart */}
      <div className="px-3 pb-3">
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className="w-full flex items-center justify-center gap-2
                     bg-[#e8197a] text-white text-sm font-semibold
                     py-2.5 rounded-lg hover:bg-[#c01264] transition-colors
                     disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          <ShoppingCart size={16} />
          {inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
