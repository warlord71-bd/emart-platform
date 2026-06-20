'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { isInStock } from '@/lib/woocommerce';
import toast from 'react-hot-toast';
import type { WooProduct } from '@/lib/woocommerce';
import { getVersionBadge } from '@/lib/version-display';
import { formatBDT } from '@/lib/formatters';
import { COMPANY } from '@/lib/companyProfile';
import { getMetaPixelProductParams, trackMetaEvent } from '@/lib/metaPixel';
import { getRedditPixelProductParams, trackRedditEvent } from '@/lib/redditPixel';
import { STORE_POLICIES } from '@/config/storePolicies';
import { trackGA4, getGA4ProductItem, getGA4ProductValue, GA4_STICKY_VARIANT_KEY } from '@/lib/ga4';
import BackInStockNotify from './BackInStockNotify';

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
    return formatBDT(0);
  }

  return formatBDT(savings);
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

  if (normalized.includes('korea')) return 'south-korea';
  if (normalized.includes('japan')) return 'japan';
  if (normalized.includes('india')) return 'india';
  if (normalized.includes('france')) return 'france';
  if (normalized.includes('usa') || normalized.includes('united states') || normalized.includes('america')) return 'usa';
  if (normalized.includes('uk') || normalized.includes('united kingdom') || normalized.includes('britain')) return 'uk';

  return slugify(value);
}

const CATEGORY_DISPLAY_PRIORITY: Record<string, string> = {
  sunscreen: 'Sunscreen',
  'serums-ampoules-essences': 'Serum',
  'face-cleansers': 'Cleanser',
  'toners-mists': 'Toner',
  'night-cream': 'Moisturizer',
  'cream-moisturizer': 'Moisturizer',
  'face-masks': 'Face Mask',
  'makeup-remover': 'Makeup Remover',
  'lip-balm-care': 'Lip Care',
  lips: 'Lip Care',
  'body-wash': 'Body Wash',
  'body-lotion': 'Body Lotion',
  shampoos: 'Shampoo',
  'hair-treatments': 'Hair Treatment',
  'hair-care': 'Hair Care',
};

const CATEGORY_DISPLAY_EXCLUSIONS = new Set([
  'k-beauty-j-beauty',
  'k-beauty',
  'j-beauty',
  'korean-beauty',
  'japanese-beauty',
  'skincare-essentials',
  'skin-care',
  'skincare',
  'beauty-personal-care',
  'products',
  'all-products',
  'uncategorized',
  'sale',
  'new-arrivals',
  'featured',
  'shop-by-concern',
  'health-wellbeing',
  'beauty-supplements',
]);

function getDisplayCategory(product: WooProduct): string {
  for (const [slug, label] of Object.entries(CATEGORY_DISPLAY_PRIORITY)) {
    if (product.categories?.some((category) => category.slug === slug)) {
      return label;
    }
  }

  const name = product.name.toLowerCase();
  if (/serum|ampoule|essence/.test(name)) return 'Serum';
  if (/cream|moisturi[sz]er|gel cream|lotion/.test(name)) return 'Moisturizer';
  if (/cleanser|face wash|cleansing|foam wash/.test(name)) return 'Cleanser';
  if (/toner|mist/.test(name)) return 'Toner';
  if (/sunscreen|sun cream|sun serum|spf|sun stick|sun milk/.test(name)) return 'Sunscreen';
  if (/mask|sleeping pack/.test(name)) return 'Face Mask';
  if (/shampoo/.test(name)) return 'Shampoo';
  if (/conditioner/.test(name)) return 'Conditioner';
  if (/lip/.test(name)) return 'Lip Care';

  const category = product.categories?.find((item) => !CATEGORY_DISPLAY_EXCLUSIONS.has(item.slug));
  return category?.name || '';
}

function getProductDisplayPrice(product: WooProduct): string {
  return product.sale_price || product.price || product.regular_price || '0';
}

function getVisibleSku(product: WooProduct): string | null {
  const sku = product.sku?.trim();
  return sku ? sku : null;
}

function getVisibleStockLabel(product: WooProduct): string {
  if (product.stock_status === 'outofstock') return 'Out of Stock';
  if (product.stock_status === 'onbackorder') return 'Available on Backorder';

  const stockQuantity = product.stock_quantity;
  if (typeof stockQuantity === 'number' && Number.isFinite(stockQuantity) && stockQuantity > 0) {
    return `${stockQuantity} Pcs Available`;
  }

  return 'In Stock';
}

function getWhatsAppOrderHref(product: WooProduct): string {
  const productUrl = `https://e-mart.com.bd/shop/${product.slug}`;
  const message = `Hi Emart, I want to order ${product.name}. Product link: ${productUrl}`;
  const separator = COMPANY.whatsappHref.includes('?') ? '&' : '?';

  return `${COMPANY.whatsappHref}${separator}text=${encodeURIComponent(message)}`;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const stickyViewFired = useRef(false);
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

  // Fire pdp_sticky_view once per pageview on mobile, store variant for funnel attribution
  useEffect(() => {
    if (!stickyVisible || stickyViewFired.current) return;
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 1023px)').matches) return;
    stickyViewFired.current = true;
    const variant = process.env.NEXT_PUBLIC_FF_PDP_STICKY_BUYBAR === 'true' ? 'sticky_v2' : 'sticky_v1';
    trackGA4('pdp_sticky_view', { flag_variant: variant, product_slug: product.slug });
    try { sessionStorage.setItem(GA4_STICKY_VARIANT_KEY, variant); } catch { /* quota/private-mode */ }
  }, [stickyVisible, product.slug]);

  const isOnSale = product.on_sale && product.sale_price;
  const hasVisibleRating =
    parseFloat(product.average_rating || '0') > 0 && Number(product.rating_count || 0) > 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    for (let i = 0; i < quantity; i++) { addItem(product); }
    trackMetaEvent('AddToCart', getMetaPixelProductParams(product, quantity));
    trackRedditEvent('AddToCart', getRedditPixelProductParams(product, quantity));
    trackGA4('add_to_cart', {
      currency: 'BDT',
      value: getGA4ProductValue(product, quantity),
      items: [getGA4ProductItem(product, quantity)],
    });
    setIsAdded(true);
    openCart();
    toast.success('Added to Cart');
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!inStock) return;
    clearCart();
    addItem(product, quantity);
    trackMetaEvent('AddToCart', getMetaPixelProductParams(product, quantity));
    trackRedditEvent('AddToCart', getRedditPixelProductParams(product, quantity));
    trackGA4('add_to_cart', {
      currency: 'BDT',
      value: getGA4ProductValue(product, quantity),
      items: [getGA4ProductItem(product, quantity)],
    });
    window.location.href = '/checkout';
  };

  // Extract attributes from product
  const getAttributeValue = (attrName: string, preferTaxonomy = false): string => {
    const matches = product.attributes?.filter((a) =>
      a.name.toLowerCase().includes(attrName.toLowerCase())
    ) || [];
    const attr = preferTaxonomy
      ? matches.find((a) => a.id && a.id > 0) || matches[0]
      : matches[0];
    return attr?.options?.[0] || '';
  };

  const productBrand = product.brands?.[0];
  const brandName = productBrand?.name || '';
  const brandSlug = productBrand?.slug || '';
  const showBrandChip = Boolean(productBrand);
  const madeIn = getAttributeValue('origin', true) || getAttributeValue('made in') || getAttributeValue('country') || '';
  const sizeFromAttr = getAttributeValue('size') || getAttributeValue('volume');
  const sizeFromName = !sizeFromAttr
    ? product.name.match(/(\d+(?:\.\d+)?)\s*(ml|g|oz|L|pcs?|sheets?|patches?)\b/i)
    : null;
  const size = sizeFromAttr || (sizeFromName ? `${sizeFromName[1]}${sizeFromName[2].toLowerCase()}` : null);
  const colorAttr = getAttributeValue('color') || getAttributeValue('colour') || getAttributeValue('shade');
  const flavorAttr = getAttributeValue('flavor') || getAttributeValue('flavour') || getAttributeValue('scent');
  const categoryName = getDisplayCategory(product);
  const brandHref = brandName ? `/brands/${encodeURIComponent(brandSlug)}` : '/brands';
  const originHref = madeIn ? `/origins/${getOriginCountrySlug(madeIn)}` : '/origins';
  const productDisplayPrice = getProductDisplayPrice(product);
  const whatsappOrderHref = getWhatsAppOrderHref(product);
  const visibleSku = getVisibleSku(product);
  const visibleStockLabel = getVisibleStockLabel(product);

  return (
    <div className="w-full max-w-[calc(100vw-2rem)] min-w-0 space-y-4 md:max-w-full md:space-y-6">
      {/* 3 Compact Badges - Brand | Made In | Size */}
      <div className="flex flex-wrap gap-2">
        {showBrandChip && (
          <Link
            href={brandHref}
            className="flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
            aria-label={`Shop ${brandName} products`}
          >
            {brandName}
          </Link>
        )}
        {madeIn && (
          <Link
            href={originHref}
            className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors hover:bg-blue-600 hover:text-white"
            aria-label={`Shop ${madeIn} origin products`}
          >
            {madeIn}
          </Link>
        )}
        {size && (
          <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
            {size}
          </span>
        )}
        {colorAttr && (
          <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
            {colorAttr}
          </span>
        )}
        {flavorAttr && (
          <span className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
            {flavorAttr}
          </span>
        )}
      </div>

      {/* Product Title - H1 */}
      <h1 className="w-full max-w-[20ch] whitespace-normal break-words text-2xl font-serif font-bold leading-tight text-ink [overflow-wrap:anywhere] sm:max-w-none md:text-3xl">
        {product.name}
      </h1>

      {/* Concern chips — sourced only from actual pa_concern terms. */}
      {(() => {
        const PA_CONCERN_MAP: Record<string, { label: string; href: string }> = {
          'acne-blemish':      { label: 'Acne & Blemish',       href: '/concerns/acne-blemish-care' },
          'anti-aging-repair': { label: 'Anti-Aging & Repair',  href: '/concerns/anti-aging-repair' },
          'brightening':       { label: 'Brightening',          href: '/concerns/brightening' },
          'dryness-hydration': { label: 'Dryness & Hydration',  href: '/concerns/dryness-hydration' },
          'hyperpigmentation': { label: 'Hyperpigmentation',    href: '/concerns/melasma' },
          'pores-blackheads':  { label: 'Pores & Blackheads',   href: '/concerns/pores-oil-control' },
          'sensitivity':       { label: 'Sensitivity',          href: '/concerns/sensitivity' },
          'sunscreen':         { label: 'Sunscreen',            href: '/concerns/sunscreen' },
          'wrinkle':           { label: 'Wrinkle',              href: '/concerns/wrinkle' },
        };

        let concerns: { label: string; href: string }[] = [];

        if (product.concern_terms && product.concern_terms.length > 0) {
          concerns = product.concern_terms
            .map((t) => PA_CONCERN_MAP[t.slug])
            .filter(Boolean)
            .slice(0, 5) as { label: string; href: string }[];
        }

        if (!concerns.length) return null;
        return (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Best for</p>
            <div className="flex flex-wrap gap-1.5">
              {concerns.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="inline-flex items-center rounded-full border border-accent/20 bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Version badge — shown below title, above rating */}
      {(() => {
        const vb = getVersionBadge(product.emart_version);
        return vb ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600">
            <span>{vb.flag}</span>
            <span>{vb.label}</span>
          </span>
        ) : null;
      })()}

      {/* Rating & Stock */}
      <div className="flex flex-col gap-2">
        {hasVisibleRating && (
          <div className="flex items-center gap-2">
            <span className="text-base">
              {'⭐'.repeat(Math.round(parseFloat(product.average_rating)))}
            </span>
            <span className="text-sm text-muted">
              {product.average_rating} ({product.rating_count} Reviews)
            </span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {product.stock_status === 'instock' ? (
            <div className="inline-block w-fit bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded">
              In Stock
            </div>
          ) : (
            <div className="inline-block w-fit bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded">
              Out of Stock
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
                    <span className="text-ink font-bold mt-0.5">•</span>
                    <span className="line-clamp-3">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null;
      })()}


      <div className="border-2 border-ink rounded-lg p-4 space-y-2">
        {isOnSale ? (
          <>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-ink">
                {formatBDT(product.sale_price)}
              </span>
              <span className="text-lg text-muted line-through">
                {formatBDT(product.regular_price)}
              </span>
            </div>
            <div className="inline-block bg-ink text-white text-xs font-semibold px-2 py-1 rounded">
              Save {formatSavingsAmount(product.regular_price, product.sale_price)}
            </div>
          </>
        ) : (
          <span className="text-3xl font-bold text-ink">
            {formatBDT(product.price)}
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
          disabled={!inStock}
          className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:hover:translate-y-0 md:text-base"
        >
          {!inStock ? 'Out of Stock' : isAdded ? '✓ Added' : 'Add to Cart'}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={!inStock}
          className="rounded-xl border border-hairline bg-bg-alt px-4 py-3 text-sm font-semibold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-accent-soft hover:text-accent disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:hover:translate-y-0 disabled:hover:bg-gray-100 md:text-base"
        >
          {!inStock ? 'Out of Stock' : 'Buy Now'}
        </button>
      </div>
      <a
        href={whatsappOrderHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border border-hairline bg-white px-4 py-3 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
      >
        <MessageCircle size={17} />
        Order on WhatsApp
      </a>

      {!inStock && (
        <BackInStockNotify
          productId={product.id}
          productName={product.name}
          productSlug={product.slug}
        />
      )}


      {/* Info Box - 2x2 Grid */}
      <div className="bg-blue-50 rounded-lg p-4 grid grid-cols-2 gap-4">
        {visibleSku && (
          <div>
            <p className="text-xs text-blue-600 font-semibold">SKU Code</p>
            <p className="text-sm text-blue-900 font-medium">{visibleSku}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-blue-600 font-semibold">Stock</p>
          <p className="text-sm text-blue-900 font-medium">{visibleStockLabel}</p>
        </div>
        <div>
          <p className="text-xs text-blue-600 font-semibold">Estimate Delivery</p>
          <p className="text-sm text-blue-900 font-medium">{STORE_POLICIES.shipping.pdpDeliveryText}</p>
          <p className="mt-1 text-xs text-blue-700">{STORE_POLICIES.shipping.checkoutFeeText}</p>
        </div>
        {categoryName && (
          <div>
            <p className="text-xs text-blue-600 font-semibold">Category</p>
            <p className="text-sm text-blue-900 font-medium">{categoryName}</p>
          </div>
        )}
      </div>


      {/* FF_TRUST_BILINGUAL: Bangla microcopy under trust signals — default OFF */}
      {process.env.NEXT_PUBLIC_FF_TRUST_BILINGUAL === 'true' && (
        <p className="text-xs text-muted leading-relaxed">
          <span lang="bn">আসল পণ্যের নিশ্চয়তা</span>
          {' · '}
          <span lang="bn">সারা দেশে দ্রুত ডেলিভারি</span>
          {' · '}
          <span lang="bn">হাতে পেয়ে টাকা দিন</span>
        </p>
      )}

      {/* Sticky buy bar — mobile only, appears when main ATC buttons scroll out of view */}
      {stickyVisible && inStock && (
        process.env.NEXT_PUBLIC_FF_PDP_STICKY_BUYBAR === 'true' ? (
          // FF_PDP_STICKY_BUYBAR: enhanced bar — price + savings + Add to Cart + WhatsApp
          <div className="fixed inset-x-0 bottom-[72px] z-40 border-t border-hairline bg-white px-3 py-2.5 shadow-[0_-12px_30px_rgba(17,17,17,0.10)] lg:hidden">
            <div className="mx-auto flex max-w-2xl items-center gap-2">
              {/* Price block */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-muted leading-none mb-0.5">{product.name}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-accent leading-none">
                    {formatBDT(productDisplayPrice)}
                  </span>
                  {isOnSale && product.regular_price && (
                    <span className="text-xs text-muted line-through leading-none">
                      {formatBDT(product.regular_price)}
                    </span>
                  )}
                </div>
              </div>
              {/* Add to Cart */}
              <button
                onClick={() => {
                  handleAddToCart();
                  trackGA4('pdp_sticky_atc_click', { flag_variant: 'sticky_v2', product_slug: product.slug });
                }}
                className="flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-white transition-all active:translate-y-px active:brightness-90"
              >
                <ShoppingCart size={14} />
                <span>Add to Cart</span>
              </button>
              {/* WhatsApp — BD conversion lever */}
              <a
                href={whatsappOrderHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Order on WhatsApp"
                onClick={() => trackGA4('pdp_sticky_whatsapp_click', { flag_variant: 'sticky_v2', product_slug: product.slug })}
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-hairline bg-[#25D366]/10 text-[#25D366] transition-all active:translate-y-px active:bg-[#25D366]/20"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
        ) : (
          // Fallback: existing bar (price + Add to Cart + Buy Now)
          <div className="fixed inset-x-0 bottom-[72px] z-40 border-t border-hairline bg-white px-4 py-3 shadow-[0_-12px_30px_rgba(17,17,17,0.08)] lg:hidden">
            <div className="mx-auto grid max-w-2xl grid-cols-[minmax(0,1fr)_minmax(150px,auto)] items-center gap-3 rounded-2xl border border-hairline bg-card px-3 py-3 shadow-card">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
                <p className="text-base font-bold text-accent">{formatBDT(productDisplayPrice)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    handleAddToCart();
                    trackGA4('pdp_sticky_atc_click', { flag_variant: 'sticky_v1', product_slug: product.slug });
                  }}
                  className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white transition-all active:translate-y-px active:bg-black"
                >
                  <ShoppingCart size={15} />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={() => {
                    handleBuyNow();
                    trackGA4('pdp_sticky_buynow_click', { flag_variant: 'sticky_v1', product_slug: product.slug });
                  }}
                  className="min-h-11 rounded-xl border border-hairline bg-bg-alt px-3 py-2 text-xs font-semibold text-ink transition-all active:translate-y-px active:bg-accent-soft"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
