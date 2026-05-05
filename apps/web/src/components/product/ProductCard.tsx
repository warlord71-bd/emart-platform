'use client';
// src/components/product/ProductCard.tsx

import { useState } from 'react';
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
  const [imageSrc, setImageSrc] = useState(product.images[0]?.src || '/logo.png');
  const addItem = useCartStore((s) => s.addItem);

  const discount = product.on_sale
    ? getDiscountPercent(product.regular_price, product.sale_price)
    : 0;

  const inStock = isInStock(product);
  const categoryName = product.categories?.[0]?.name;
  const rating = Number(product.average_rating || 0);
  const hasRating = rating > 0;
  const shortName = product.name.length > 34 ? `${product.name.slice(0, 34)}...` : product.name;
  const badgeItems = [
    discount > 0 ? (
      <span key="discount" className="badge-sale type-meta font-bold">-{discount}%</span>
    ) : null,
    product.featured ? (
      <span key="featured" className="badge-new type-meta font-bold">Featured</span>
    ) : null,
    !product.featured && inStock ? (
      <span key="auth" className="badge-auth">AUTHENTIC</span>
    ) : null,
    !inStock ? (
      <span key="stock" className="badge type-meta border border-black/10 bg-white/95 font-bold text-ink">
        Out of stock
      </span>
    ) : null,
  ].filter(Boolean);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    addItem(product);
    toast.success(`${shortName} added to cart`, {
      duration: 2000,
    });
  };

  const imageAlt = product.name;

  return (
    <div className="group card relative flex h-full flex-col p-2 sm:p-3">
      <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-4.5rem)] flex-wrap gap-1.5">
        {badgeItems.slice(0, 2).map((badge) => badge)}
        <div className="hidden sm:contents">
          {badgeItems.slice(2).map((badge) => badge)}
        </div>
      </div>

      <button
        className="absolute right-4 top-4 z-10 rounded-full border border-white/80 bg-white/95 p-2 text-muted shadow-card transition-all hover:border-accent/20 hover:bg-accent-soft hover:text-accent lg:opacity-0 lg:group-hover:opacity-100"
        aria-label="Add to wishlist"
      >
        <Heart size={16} />
      </button>

      <Link href={`/shop/${product.slug}`} className="flex flex-1 flex-col gap-3">
        <div className="product-img-wrap rounded-[14px]">
          <div className="absolute inset-x-0 bottom-0 z-[1] h-16 bg-gradient-to-t from-black/5 to-transparent" />
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.04]"
            quality={85}
            onError={() => setImageSrc('/logo.png')}
          />
        </div>

        <div className="flex flex-1 flex-col px-1 pb-1">
          {categoryName && (
            <span className="type-meta font-semibold uppercase tracking-[0.18em] text-muted-2">
              {categoryName}
            </span>
          )}

          <h3 className="type-product-title mt-1 line-clamp-2 min-h-[2.6rem] text-[15px] leading-snug text-ink md:text-base">
            {product.name}
          </h3>

          <div className="mt-2 flex min-h-[20px] items-center justify-between gap-2">
            {hasRating ? (
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      className={i < Math.round(rating) ? 'text-brass' : 'text-bg-stone'}
                      fill="currentColor"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <span className="type-meta text-muted-2">{product.rating_count} reviews</span>
              </div>
            ) : (
              <span className="type-meta text-muted">Hand-picked global skincare</span>
            )}
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="price type-product-price">
                  {formatPrice(product.sale_price || product.price)}
                </span>
                {product.on_sale && product.regular_price && (
                  <span className="price-old text-[12px] font-normal leading-tight md:text-[13px]">
                    {formatPrice(product.regular_price)}
                  </span>
                )}
              </div>
              {discount > 0 && (
                <div className="type-meta mt-1 text-muted">Save {discount}% today</div>
              )}
            </div>

            <div className="hidden rounded-full border border-hairline bg-bg-alt px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ink sm:flex">
              COD
            </div>
          </div>
        </div>
      </Link>

      <div className="px-1 pb-1 pt-2">
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-white transition-all hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          <ShoppingCart size={16} />
          <span className="type-button">{inStock ? 'Add to cart' : 'Out of stock'}</span>
        </button>
      </div>
    </div>
  );
}
