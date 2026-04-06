'use client';
// src/components/product/ProductDetail.tsx

import { useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, Heart, Share2, Shield, Truck, RotateCcw } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, getDiscountPercent, isInStock } from '@/lib/woocommerce';
import type { WooProduct } from '@/lib/woocommerce';
import toast from 'react-hot-toast';

interface Props {
  product: WooProduct;
}

export default function ProductDetail({ product }: Props) {
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const inStock = isInStock(product);
  const discount = product.on_sale
    ? getDiscountPercent(product.regular_price, product.sale_price)
    : 0;

  const handleAddToCart = () => {
    addItem(product, qty);
    openCart();
    toast.success('Added to cart!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

      {/* ── IMAGE GALLERY ── */}
      <div className="space-y-3">
        {/* Main Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
          {product.images[activeImg] ? (
            <Image
              src={product.images[activeImg].src}
              alt={product.images[activeImg].alt || product.name}
              fill
              className="object-cover object-center"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              No Image
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && (
              <span className="badge-sale text-sm px-3 py-1">-{discount}%</span>
            )}
            {!inStock && (
              <span className="badge bg-gray-500 text-white text-sm px-3 py-1">
                Out of Stock
              </span>
            )}
          </div>

          {/* Share */}
          <button
            onClick={handleShare}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow
                       hover:text-[#e8197a] transition-colors"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* Thumbnails */}
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {product.images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImg(i)}
                className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all
                           ${i === activeImg ? 'border-[#e8197a]' : 'border-transparent hover:border-gray-300'}`}
              >
                <Image src={img.src} alt={img.alt || ''} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── PRODUCT INFO ── */}
      <div className="space-y-5">

        {/* Category breadcrumb */}
        {product.categories[0] && (
          <div className="text-sm text-gray-400 font-medium uppercase tracking-wide">
            {product.categories.map((c) => c.name).join(' › ')}
          </div>
        )}

        {/* Name */}
        <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] leading-tight">
          {product.name}
        </h1>

        {/* Rating */}
        {parseFloat(product.average_rating) > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24"
                  fill={i < Math.round(parseFloat(product.average_rating)) ? '#f59e0b' : '#e5e7eb'}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {product.average_rating} ({product.rating_count} reviews)
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-extrabold text-[#e8197a]">
            {formatPrice(product.sale_price || product.price)}
          </span>
          {product.on_sale && product.regular_price && (
            <span className="text-xl text-gray-400 line-through">
              {formatPrice(product.regular_price)}
            </span>
          )}
          {discount > 0 && (
            <span className="badge-sale text-sm">Save {discount}%</span>
          )}
        </div>

        {/* Short Description */}
        {product.short_description && (
          <div
            className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: product.short_description }}
          />
        )}

        {/* Stock Status */}
        <div className={`flex items-center gap-2 text-sm font-medium ${
          inStock ? 'text-green-600' : 'text-red-500'
        }`}>
          <div className={`w-2 h-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
          {inStock
            ? product.stock_quantity
              ? `In Stock (${product.stock_quantity} left)`
              : 'In Stock'
            : 'Out of Stock'}
        </div>

        {/* Quantity + Add to Cart */}
        {inStock && (
          <div className="space-y-3">
            {/* Quantity Selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Quantity:</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 hover:bg-gray-100 transition-colors text-lg font-medium"
                >
                  −
                </button>
                <span className="px-4 py-2 font-semibold min-w-[3rem] text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-4 py-2 hover:bg-gray-100 transition-colors text-lg font-medium"
                >
                  +
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>
              <button className="p-3 border-2 border-gray-200 rounded-lg hover:border-[#e8197a]
                                 hover:text-[#e8197a] transition-colors">
                <Heart size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          {[
            { icon: Shield, label: '100% Authentic', sub: 'Genuine products' },
            { icon: Truck, label: 'Fast Delivery', sub: 'Nationwide COD' },
            { icon: RotateCcw, label: 'Easy Returns', sub: '7-day policy' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="text-center p-2">
              <Icon size={20} className="mx-auto text-[#e8197a] mb-1" />
              <div className="text-xs font-semibold text-gray-700">{label}</div>
              <div className="text-xs text-gray-400">{sub}</div>
            </div>
          ))}
        </div>

        {/* bKash/Nagad Payment Info */}
        <div className="bg-[#fce7f0] rounded-xl p-4 space-y-1">
          <p className="text-sm font-semibold text-[#1a1a2e]">💳 Payment Options</p>
          <p className="text-xs text-gray-600">
            💵 Cash on Delivery (COD) available nationwide
          </p>
          <p className="text-xs text-gray-600">
            bKash: <strong className="text-[#e2136e]">01919-797399</strong> &nbsp;|&nbsp;
            Nagad: <strong className="text-[#f26522]">01919-797399</strong>
          </p>
          <p className="text-xs text-gray-600">
            VISA / Mastercard / Rocket / Upay accepted
          </p>
        </div>

        {/* Attributes */}
        {product.attributes.length > 0 && (
          <div className="space-y-2 border-t border-gray-100 pt-4">
            {product.attributes.map((attr) => (
              <div key={attr.id} className="flex gap-2 text-sm">
                <span className="font-medium text-gray-600 min-w-[80px]">{attr.name}:</span>
                <span className="text-gray-500">{attr.options.join(', ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FULL DESCRIPTION (Full Width) ── */}
      {product.description && (
        <div className="col-span-1 lg:col-span-2 border-t border-gray-100 pt-8">
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-4">Product Description</h2>
          <div
            className="prose prose-gray max-w-none text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}
    </div>
  );
}
