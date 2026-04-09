'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { WooProduct } from '@/lib/woocommerce';
import { getDiscountPercent, formatPrice } from '@/lib/woocommerce';

interface ProductInfoProps {
  product: WooProduct;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const discountPercent = getDiscountPercent(product.regular_price, product.sale_price);
  const isOnSale = product.on_sale && product.sale_price;

  const handleAddToCart = () => {
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  // Extract brand name from categories or attributes
  const brandName = product.categories?.[0]?.name || 'Emart';

  return (
    <div className="space-y-6">
      {/* NEW Badge */}
      {product.featured && (
        <div className="flex gap-2">
          <span className="inline-block bg-black text-white text-xs font-semibold px-3 py-1 rounded">
            NEW
          </span>
        </div>
      )}

      {/* Brand & Product Info */}
      <div className="border-b pb-4">
        <p className="text-sm text-lumiere-text-secondary mb-1">Brand</p>
        <p className="font-semibold text-lumiere-text-primary">{brandName}</p>
      </div>

      {/* Made in & Size */}
      <div className="grid grid-cols-2 gap-4 pb-4 border-b">
        <div>
          <p className="text-xs text-lumiere-text-secondary mb-1">MADE IN</p>
          <p className="font-medium text-sm text-lumiere-text-primary">South Korea</p>
        </div>
        <div>
          <p className="text-xs text-lumiere-text-secondary mb-1">SIZE</p>
          <p className="font-medium text-sm text-lumiere-text-primary">
            {product.short_description || '150ml'}
          </p>
        </div>
      </div>

      {/* Product Title */}
      <h1 className="text-2xl md:text-3xl font-serif font-bold text-lumiere-text-primary">
        {product.name}
      </h1>

      {/* Rating & Stock */}
      <div className="flex flex-col gap-3">
        {product.average_rating && (
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {'⭐'.repeat(Math.round(parseFloat(product.average_rating)))}
            </span>
            <span className="text-sm text-lumiere-text-secondary">
              ({product.rating_count} reviews)
            </span>
          </div>
        )}

        {/* Stock Status */}
        <div>
          {product.stock_status === 'instock' ? (
            <div className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded">
              ✓ PRODUCT IN STOCK
            </div>
          ) : (
            <div className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded">
              OUT OF STOCK
            </div>
          )}
        </div>
      </div>

      {/* Price Section */}
      <div className="space-y-2 py-4 border-y-2 border-gray-200">
        {isOnSale ? (
          <>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-lumiere-primary">
                {formatPrice(product.sale_price)}
              </span>
              <span className="text-lg text-lumiere-text-secondary line-through">
                {formatPrice(product.regular_price)}
              </span>
            </div>
            <div className="inline-block bg-lumiere-primary text-white text-xs font-semibold px-2 py-1 rounded">
              SAVE {discountPercent}%
            </div>
          </>
        ) : (
          <span className="text-3xl font-bold text-lumiere-primary">
            {formatPrice(product.price)}
          </span>
        )}
      </div>

      {/* Quantity & Add to Cart */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Qty:</span>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100"
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 text-center border-0 focus:ring-0"
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100"
            >
              +
            </button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="w-full bg-lumiere-primary hover:bg-lumiere-primary-hover text-white font-semibold py-3 rounded-lg transition-all duration-300"
        >
          {isAdded ? '✓ Added to Cart' : 'ADD TO CART'}
        </button>

        {/* Wishlist & Share */}
        <div className="flex gap-4 justify-center">
          <button className="flex items-center gap-2 text-lumiere-primary hover:text-lumiere-primary-hover font-medium">
            ♡ Add to Wishlist
          </button>
          <span className="text-gray-300">|</span>
          <button className="flex items-center gap-2 text-lumiere-primary hover:text-lumiere-primary-hover font-medium">
            📤 Share
          </button>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="bg-blue-50 rounded-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-blue-900">📍 Delivery Information</p>
        <div className="text-sm text-blue-800 space-y-1">
          <p>✓ Dhaka: Next Day Delivery</p>
          <p>✓ Nationwide: 2-5 Days</p>
          <p>✓ COD Available</p>
        </div>
      </div>
    </div>
  );
};
