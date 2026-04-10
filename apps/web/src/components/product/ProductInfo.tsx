'use client';

import { useState } from 'react';
import type { WooProduct } from '@/lib/woocommerce';
import { getDiscountPercent, formatPrice } from '@/lib/woocommerce';
import { AppDownloadBanner } from './AppDownloadBanner';

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

  const brandName = product.categories?.[0]?.name || 'Emart';
  const categoryName = product.categories?.[0]?.name || 'Products';
  const madeIn = 'South Korea';
  // Extract size from attributes or use default
  const size = product.attributes?.find(attr => attr.name?.toLowerCase().includes('size'))?.options?.[0] || '75ml';
  const soldQty = Math.floor(Math.random() * 100) + 50;

  return (
    <div className="space-y-6">
      {/* Brand / Made In / Size - With Icons */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-12">
        <div className="flex-1">
          <p className="text-2xl">🏢</p>
          <p className="text-xs text-lumiere-text-secondary mt-1">BRAND</p>
          <p className="font-semibold text-lumiere-text-primary">{brandName}</p>
        </div>
        <div className="flex-1">
          <p className="text-2xl">📍</p>
          <p className="text-xs text-lumiere-text-secondary mt-1">MADE IN</p>
          <p className="font-semibold text-lumiere-text-primary">{madeIn}</p>
        </div>
        <div className="flex-1">
          <p className="text-2xl">📦</p>
          <p className="text-xs text-lumiere-text-secondary mt-1">SIZE</p>
          <p className="font-semibold text-lumiere-text-primary">{size}</p>
        </div>
      </div>

      {/* Product Title - H1 */}
      <h1 className="text-2xl md:text-3xl font-serif font-bold text-lumiere-text-primary">
        {product.name}
      </h1>

      {/* Rating & Stock */}
      <div className="flex flex-col gap-2">
        {product.average_rating && (
          <div className="flex items-center gap-2">
            <span className="text-base">
              {'⭐'.repeat(Math.round(parseFloat(product.average_rating)))}
            </span>
            <span className="text-sm text-lumiere-text-secondary">
              {product.average_rating} ({product.rating_count} Reviews)
            </span>
          </div>
        )}
        {product.stock_status === 'instock' ? (
          <div className="inline-block w-fit bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded">
            ✓ PRODUCT IN STOCK
          </div>
        ) : (
          <div className="inline-block w-fit bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded">
            OUT OF STOCK
          </div>
        )}
      </div>

      {/* Price Box - Pink Border */}
      <div className="border-2 border-lumiere-primary rounded-lg p-4 space-y-2">
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
              Save {discountPercent}%
            </div>
          </>
        ) : (
          <span className="text-3xl font-bold text-lumiere-primary">
            {formatPrice(product.price)}
          </span>
        )}
      </div>

      {/* Short Description with See More */}
      {product.description && (
        <div className="space-y-2">
          <div className="text-sm text-lumiere-text-secondary">
            <ul className="space-y-1">
              {product.description.split('\n').slice(0, 2).map((line, idx) => (
                <li key={idx} className="flex gap-2">
                  <span>•</span>
                  <span>{line.replace(/<[^>]*>/g, '').substring(0, 80)}...</span>
                </li>
              ))}
            </ul>
          </div>
          <button className="text-lumiere-primary hover:underline text-sm font-medium">
            See more →
          </button>
        </div>
      )}

      {/* Quantity Selector */}
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

      {/* Buttons - Side by side, 48px+ height */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleAddToCart}
          className="bg-lumiere-text-primary hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition-all duration-300 text-sm md:text-base"
        >
          {isAdded ? '✓ Added' : 'Add to Cart'}
        </button>
        <button className="border-2 border-lumiere-text-primary text-lumiere-text-primary hover:bg-lumiere-text-primary hover:text-white font-semibold py-3 rounded-lg transition-all duration-300 text-sm md:text-base">
          Buy Now
        </button>
      </div>

      {/* Concern Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {product.tags.slice(0, 4).map((tag) => (
            <span key={tag.id} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              ✓ {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Info Box - 2x2 Grid */}
      <div className="bg-blue-50 rounded-lg p-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-blue-600 font-semibold">SKU Code</p>
          <p className="text-sm text-blue-900 font-medium">SKU-{product.id}</p>
        </div>
        <div>
          <p className="text-xs text-blue-600 font-semibold">Stock</p>
          <p className="text-sm text-blue-900 font-medium">{product.stock_quantity || 6} Pcs Available</p>
        </div>
        <div>
          <p className="text-xs text-blue-600 font-semibold">Estimate Delivery</p>
          <p className="text-sm text-blue-900 font-medium">Within 1-3 Days</p>
        </div>
        <div>
          <p className="text-xs text-blue-600 font-semibold">Category</p>
          <p className="text-sm text-blue-900 font-medium">{categoryName}</p>
        </div>
      </div>

      {/* App Download Banner */}
      <AppDownloadBanner />
    </div>
  );
};
