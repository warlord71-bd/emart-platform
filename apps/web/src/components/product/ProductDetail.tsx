'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart, Heart, Share2,
  Shield, Truck, RotateCcw,
  MapPin, Package, Tag, ChevronRight,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, getDiscountPercent, isInStock } from '@/lib/woocommerce';
import type { WooProduct } from '@/lib/woocommerce';
import toast from 'react-hot-toast';

interface Props { product: WooProduct }

const TABS = ['Description', 'Ingredients', 'How To Use'] as const;
type Tab = typeof TABS[number];

export default function ProductDetail({ product }: Props) {
  const [qty, setQty]           = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('Description');
  const [showSticky, setShowSticky] = useState(false);
  const ctaRef = useRef<HTMLButtonElement>(null);

  const addItem  = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const inStock  = isInStock(product);
  const discount = product.on_sale
    ? getDiscountPercent(product.regular_price, product.sale_price)
    : 0;

  // Show sticky CTA when main button scrolls out of view (mobile only)
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setShowSticky(!e.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Pre-extract attributes
  const getAttr = (keys: string[]) =>
    product.attributes.find((a) => keys.some((k) => a.name.toLowerCase().includes(k)));

  const brandAttr  = getAttr(['brand']);
  const originAttr = getAttr(['origin', 'made in', 'country']);
  const volumeAttr = getAttr(['volume', 'size', 'weight', 'net wt']);
  const brandVal   = brandAttr?.options[0];
  const brandSlug  = brandVal?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ?? '';

  const SKIP_ATTR = new Set(['brand', 'origin', 'made in', 'country', 'volume', 'size', 'weight', 'net wt']);

  const handleAddToCart = () => {
    addItem(product, qty);
    openCart();
    toast.success(`${product.name.slice(0, 30)}… added to cart`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product.name, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">

      {/* ══════════════ IMAGE GALLERY ══════════════ */}
      <div className="space-y-3">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
          {product.images[activeImg] ? (
            <Image
              src={product.images[activeImg].src}
              alt={product.images[activeImg].alt || product.name}
              fill className="object-cover object-center" priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No Image</div>
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <span className="badge-sale text-xs px-2.5 py-1 font-bold">-{discount}%</span>
            )}
            {!inStock && (
              <span className="bg-gray-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                Out of Stock
              </span>
            )}
          </div>

          <button
            onClick={handleShare}
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center
                       bg-white rounded-full shadow-sm hover:text-[#e8197a] transition-colors"
          >
            <Share2 size={16} />
          </button>
        </div>

        {/* Thumbnails */}
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {product.images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImg(i)}
                className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all
                            ${i === activeImg ? 'border-[#e8197a]' : 'border-transparent hover:border-gray-300'}`}
              >
                <Image src={img.src} alt={img.alt || ''} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════ PRODUCT INFO ══════════════ */}
      <div className="flex flex-col gap-4">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-gray-400 flex-wrap">
          <Link href="/" className="hover:text-[#e8197a] transition-colors">Home</Link>
          {product.categories.map((c) => (
            <>
              <ChevronRight size={12} key={`chevron-${c.id}`} className="text-gray-300" />
              <Link key={c.id} href={`/category/${c.slug}`}
                className="hover:text-[#e8197a] transition-colors capitalize">
                {c.name}
              </Link>
            </>
          ))}
          <ChevronRight size={12} className="text-gray-300" />
          <span className="text-gray-500 truncate max-w-[160px]">{product.name}</span>
        </nav>

        {/* Brand · Origin · Volume chips */}
        <div className="flex flex-wrap gap-2">
          {brandVal && (
            <Link href={`/brands/${brandSlug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                         border border-[#e8197a] text-[#e8197a] bg-pink-50
                         hover:bg-[#e8197a] hover:text-white transition-colors">
              <Tag size={11} />{brandVal}
            </Link>
          )}
          {originAttr?.options[0] && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              <MapPin size={11} />{originAttr.options[0]}
            </span>
          )}
          {volumeAttr?.options[0] && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              <Package size={11} />{volumeAttr.options[0]}
            </span>
          )}
        </div>

        {/* Name */}
        <h1 className="text-2xl md:text-[1.75rem] font-bold text-[#1a1a2e] leading-snug">
          {product.name}
        </h1>

        {/* Rating */}
        {parseFloat(product.average_rating) > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24"
                  fill={i < Math.round(parseFloat(product.average_rating)) ? '#f59e0b' : '#e5e7eb'}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500">{product.average_rating} · {product.rating_count} reviews</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-extrabold text-[#e8197a] tracking-tight">
            {formatPrice(product.sale_price || product.price)}
          </span>
          {product.on_sale && product.regular_price && (
            <span className="text-lg text-gray-400 line-through font-medium">
              {formatPrice(product.regular_price)}
            </span>
          )}
          {discount > 0 && (
            <span className="badge-sale text-xs px-2 py-0.5 font-semibold">{discount}% OFF</span>
          )}
        </div>

        {/* Short description */}
        {product.short_description && (
          <div
            className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4"
            dangerouslySetInnerHTML={{ __html: product.short_description }}
          />
        )}

        {/* SKU */}
        {product.sku && (
          <p className="text-xs text-gray-400">
            SKU:{' '}
            <span className="font-mono text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
              {product.sku}
            </span>
          </p>
        )}

        {/* Stock status */}
        <div className={`flex items-center gap-1.5 text-sm font-medium ${inStock ? 'text-emerald-600' : 'text-red-500'}`}>
          <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {inStock
            ? product.stock_quantity ? `In Stock · ${product.stock_quantity} left` : 'In Stock'
            : 'Out of Stock'}
        </div>

        {/* Qty + CTA */}
        {inStock ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-11 flex items-center justify-center text-lg font-medium hover:bg-gray-100 transition-colors">−</button>
              <span className="w-10 text-center font-semibold text-sm">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}
                className="w-10 h-11 flex items-center justify-center text-lg font-medium hover:bg-gray-100 transition-colors">+</button>
            </div>
            <button
              ref={ctaRef}
              onClick={handleAddToCart}
              className="flex-1 h-11 btn-primary flex items-center justify-center gap-2 text-sm font-semibold rounded-xl"
            >
              <ShoppingCart size={16} />Add to Cart
            </button>
            <button className="w-11 h-11 flex items-center justify-center border-2 border-gray-200 rounded-xl hover:border-[#e8197a] hover:text-[#e8197a] transition-colors">
              <Heart size={18} />
            </button>
          </div>
        ) : (
          <button disabled className="w-full h-11 rounded-xl bg-gray-200 text-gray-400 font-semibold text-sm cursor-not-allowed">
            Out of Stock
          </button>
        )}

        {/* Trust badges */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded-xl">
          {[
            { icon: Shield,    label: '100% Authentic', sub: 'Genuine products' },
            { icon: Truck,     label: 'Fast Delivery',  sub: 'Nationwide COD'  },
            { icon: RotateCcw, label: 'Easy Returns',   sub: '7-day policy'    },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center text-center p-3 gap-1">
              <Icon size={18} className="text-[#e8197a]" />
              <span className="text-[11px] font-semibold text-gray-700 leading-tight">{label}</span>
              <span className="text-[10px] text-gray-400 leading-tight">{sub}</span>
            </div>
          ))}
        </div>

        {/* Payment info */}
        <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-bold text-[#1a1a2e] uppercase tracking-wide">Payment Options</p>
          <p className="text-xs text-gray-600">Cash on Delivery (COD) — available nationwide</p>
          <p className="text-xs text-gray-600">
            bKash <strong className="text-[#e2136e]">01919-797399</strong>
            <span className="mx-2 text-gray-300">|</span>
            Nagad <strong className="text-[#f26522]">01919-797399</strong>
          </p>
          <p className="text-xs text-gray-400">VISA · Mastercard · Rocket · Upay accepted</p>
        </div>

        {/* Attribute tag cloud */}
        {(() => {
          const tags: { label: string; href?: string; type: 'concern' | 'skin' | 'other' }[] = [];
          product.attributes.forEach((attr) => {
            const key = attr.name.toLowerCase();
            if ([...SKIP_ATTR].some((k) => key.includes(k))) return;
            const isConcern = key.includes('concern');
            const isSkin    = key.includes('skin');
            attr.options.forEach((opt) => {
              tags.push({
                label: opt,
                href: isConcern || isSkin ? `/shop?search=${encodeURIComponent(opt)}` : undefined,
                type: isConcern ? 'concern' : isSkin ? 'skin' : 'other',
              });
            });
          });
          if (!tags.length) return null;
          const styles = {
            concern: 'px-3 py-1 rounded-full text-xs font-medium bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors',
            skin:    'px-3 py-1 rounded-full text-xs font-medium bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors',
            other:   'px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600',
          };
          return (
            <div className="pt-1">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map(({ label, href, type }) =>
                  href
                    ? <Link key={label} href={href} className={styles[type]}>{label}</Link>
                    : <span key={label} className={styles[type]}>{label}</span>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ══════════════ TABBED CONTENT (full width) ══════════════ */}
      <div className="col-span-1 lg:col-span-2 mt-4 border-t border-gray-100 pt-8">

        {/* Tab pills */}
        <div className="flex gap-1 border-b border-gray-100 mb-6 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px
                          ${activeTab === tab
                            ? 'border-[#e8197a] text-[#e8197a]'
                            : 'border-transparent text-gray-500 hover:text-[#1a1a2e]'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="prose prose-sm prose-gray max-w-none text-sm leading-relaxed
                        [&>h2]:text-base [&>h3]:text-sm [&>img]:rounded-xl [&>img]:mx-auto">
          {activeTab === 'Description' && product.description && (
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          )}
          {activeTab === 'Description' && !product.description && (
            <p className="text-gray-400 italic">No description available.</p>
          )}
          {activeTab === 'Ingredients' && (
            <p className="text-gray-400 italic">Ingredient list not available for this product.</p>
          )}
          {activeTab === 'How To Use' && (
            <p className="text-gray-400 italic">Usage instructions not available for this product.</p>
          )}
        </div>
      </div>
    </div>

    {/* ══════════════ STICKY MOBILE CTA ══════════════ */}
    {inStock && showSticky && (
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden
                      bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {/* safe area padding for iOS */}
        <div className="flex items-center gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 truncate">{product.name}</p>
            <p className="text-base font-extrabold text-[#e8197a] leading-tight">
              {formatPrice(product.sale_price || product.price)}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#e8197a] text-white
                       text-sm font-bold rounded-xl hover:bg-[#c01264] transition-colors"
          >
            <ShoppingCart size={15} />
            Add to Cart
          </button>
        </div>
      </div>
    )}
    </>
  );
}
