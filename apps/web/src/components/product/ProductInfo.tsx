'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { isInStock } from '@/lib/woocommerce';
import toast from 'react-hot-toast';
import type { WooProduct } from '@/lib/woocommerce';
import { formatPrice } from '@/lib/woocommerce';
import { AppDownloadBanner } from './AppDownloadBanner';

interface ProductInfoProps {
  product: WooProduct;
}

function removeFaqFromHtml(value: string): string {
  return value
    .replace(/<div\b[^>]*class=["'][^"']*\bemart-faq\b[^"']*["'][^>]*>[\s\S]*?<\/div>\s*/gi, '')
    .replace(/<h[1-6]\b[^>]*>\s*(?:সাধারণ\s+জিজ্ঞাসা(?:\s*\(FAQ\))?|FAQ:?|Frequently Asked Questions)\s*<\/h[1-6]>[\s\S]*$/gi, '')
    .replace(/<p>\s*```(?:html)?\s*<\/p>/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

function decodeText(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function hasBanglaText(value: string): boolean {
  return /[\u0980-\u09FF]/.test(value);
}

function getDescriptionSummaryItems(product: WooProduct): string[] {
  const source = product.short_description || product.description;

  if (!source) return [];

  const lines = removeFaqFromHtml(source)
    .replace(/<\/(p|h[1-6]|li)>/gi, '\n')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .split('\n')
    .map((line) => decodeText(line).replace(/\s+/g, ' ').trim())
    .filter((line) => line && !/^(q|a|question|answer|প্রশ্ন|উত্তর)\s*[:：]/i.test(line))
    .filter((line) => !hasBanglaText(line))
    .slice(0, 2);

  return lines.length > 0 ? lines : [
    `Buy ${product.name} in Bangladesh from Emart. Check product details, price, delivery, and COD availability before ordering.`,
  ];
}

function formatSavingsAmount(regularPrice: string, salePrice: string): string {
  const regular = parseFloat(regularPrice || '0');
  const sale = parseFloat(salePrice || '0');
  const savings = regular - sale;

  if (!Number.isFinite(savings) || savings <= 0) {
    return 'Tk 0.00';
  }

  return `Tk ${savings.toFixed(2)}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getOriginCountrySlug(value: string): string {
  const normalized = value.toLowerCase().trim();

  if (normalized.includes('korea')) return 'korea';
  if (normalized.includes('japan')) return 'japan';
  if (normalized.includes('india')) return 'india';
  if (normalized.includes('france')) return 'france';
  if (normalized.includes('usa') || normalized.includes('united states') || normalized.includes('america')) return 'usa';
  if (normalized.includes('uk') || normalized.includes('united kingdom') || normalized.includes('britain')) return 'uk';

  return slugify(value);
}

export const ProductInfo: React.FC<ProductInfoProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const openCart = useCartStore((s) => s.openCart);
  const inStock = isInStock(product);

  useEffect(() => {
    const el = buttonsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([e]) => setStickyVisible(!e.isIntersecting), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isOnSale = product.on_sale && product.sale_price;
  const hasVisibleRating =
    parseFloat(product.average_rating || '0') > 0 && Number(product.rating_count || 0) > 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    for (let i = 0; i < quantity; i++) { addItem(product); }
    setIsAdded(true);
    openCart();
    toast.success('Added to cart!');
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!inStock) return;
    clearCart();
    addItem(product, quantity);
    window.location.href = '/checkout';
  };

  // Extract attributes from product
  const getAttributeValue = (attrName: string): string => {
    const attr = product.attributes?.find((a) =>
      a.name.toLowerCase().includes(attrName.toLowerCase())
    );
    return attr?.options?.[0] || '';
  };

  const rawBrandName = getAttributeValue('brand');
  // Only show the brand chip when the product carries a real brand attribute
  // that maps to our curated whitelist. Falling back to the first category
  // name produced wrong tags like "Skincare" or "Sunscreen" appearing as a
  // brand. If we can't resolve a canonical brand, hide the chip.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { findCanonicalBrand } = require('@/lib/brandWhitelist') as typeof import('@/lib/brandWhitelist');
  const canonical = rawBrandName ? findCanonicalBrand(slugify(rawBrandName)) : undefined;
  const brandName = canonical?.name || (rawBrandName ? rawBrandName : '');
  const brandSlug = canonical?.slugs[0] || (rawBrandName ? slugify(rawBrandName) : '');
  const showBrandChip = Boolean(canonical);
  const madeIn = getAttributeValue('made in') || getAttributeValue('country') || getAttributeValue('origin') || 'South Korea';
  const size = getAttributeValue('size') || getAttributeValue('volume') || '75ml';
  const categoryName = product.categories?.[0]?.name || 'Products';
  const brandHref = brandName ? `/brands?brand=${encodeURIComponent(brandSlug)}` : '/brands';
  const originHref = madeIn ? `/origins?country=${encodeURIComponent(getOriginCountrySlug(madeIn))}` : '/origins';

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 3 Compact Badges - Brand | Made In | Size */}
      <div className="flex flex-wrap gap-2">
        {showBrandChip && (
          <Link
            href={brandHref}
            className="flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
            aria-label={`Shop ${brandName} products`}
          >
            🏷️ {brandName}
          </Link>
        )}
        <Link
          href={originHref}
          className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors hover:bg-blue-600 hover:text-white"
          aria-label={`Shop ${madeIn} origin products`}
        >
          📍 {madeIn}
        </Link>
        <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
          📦 {size}
        </span>
      </div>

      {/* Product Title - H1 */}
      <h1 className="text-2xl md:text-3xl font-serif font-bold text-lumiere-text-primary">
        {product.name}
      </h1>

      {/* Rating & Stock */}
      <div className="flex flex-col gap-2">
        {hasVisibleRating && (
          <div className="flex items-center gap-2">
            <span className="text-base">
              {'⭐'.repeat(Math.round(parseFloat(product.average_rating)))}
            </span>
            <span className="text-sm text-lumiere-text-secondary">
              {product.average_rating} ({product.rating_count} Reviews)
            </span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {product.stock_status === 'instock' ? (
            <div className="inline-block w-fit bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded">
              ✓ PRODUCT IN STOCK
            </div>
          ) : (
            <div className="inline-block w-fit bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded">
              OUT OF STOCK
            </div>
          )}
          <div className="inline-block w-fit rounded bg-[#fff4e8] px-3 py-1 text-xs font-semibold text-[#c26a00]">
            100% Authentic
          </div>
        </div>
      </div>

      {/* Product summary - prefer the real mixed-language description when present. */}
      {(() => {
        const lines = getDescriptionSummaryItems(product);

        return lines.length > 0 ? (
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-700">
              <ul className="space-y-2">
                {lines.map((line, idx) => (
                  <li key={idx} className="flex gap-2 items-start">
                    <span className="text-lumiere-primary font-bold mt-0.5">•</span>
                    <span className="line-clamp-3">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null;
      })()}


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
              Save {formatSavingsAmount(product.regular_price, product.sale_price)}
            </div>
          </>
        ) : (
          <span className="text-3xl font-bold text-lumiere-primary">
            {formatPrice(product.price)}
          </span>
        )}
      </div>


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
      <div ref={buttonsRef} className="grid grid-cols-2 gap-3">
        <button
          onClick={handleAddToCart}
          className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-black md:text-base"
        >
          {isAdded ? '✓ Added' : 'Add to Cart'}
        </button>
        <button
          onClick={handleBuyNow}
          className="rounded-xl border border-hairline bg-bg-alt px-4 py-3 text-sm font-semibold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-accent-soft hover:text-accent md:text-base"
        >
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

      {/* App Download Banner - Below Info Box */}
      <AppDownloadBanner />

      {/* Sticky ATC — mobile only, appears when buttons scroll out of view */}
      {stickyVisible && inStock && (
        <div className="fixed inset-x-0 bottom-[72px] z-40 border-t border-hairline bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(17,17,17,0.08)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-hairline bg-card px-3 py-3 shadow-card">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
              <p className="text-base font-bold text-accent">{formatPrice(product.price)}</p>
            </div>
            <button
              onClick={handleAddToCart}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition-all active:translate-y-px active:bg-black"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
