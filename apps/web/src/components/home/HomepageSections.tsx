'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SocialChannelGrid } from '@/components/home/SocialChannelGrid';
import { ShieldCheck, Truck, WalletCards, RotateCcw, Sparkles, MessageCircle, BadgeCheck, MapPin, ArrowRight, PlayCircle, Target, Droplets, CircleDot, Sun, Star, Clock3, Shield, Gift, MoonStar, BadgePercent, Boxes, Ticket, type LucideIcon } from 'lucide-react';
import { formatPrice, getDiscountPercent, type WooProduct } from '@/lib/woocommerce';
import { CONCERN_DEFINITIONS, getConcernHref } from '@/lib/concerns';
import { OFFER_COLLECTIONS } from '@/lib/offerCollectionConfig';

interface BrandLogo {
  id: number;
  name: string;
  slug: string;
  logo: string;
}

interface BlogPostSummary {
  id: number;
  title: string;
  excerpt: string;
  href: string;
  date: string;
}

const concernIconMap: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  target: Target,
  droplets: Droplets,
  'circle-dot': CircleDot,
  sun: Sun,
  star: Star,
  'clock-3': Clock3,
  shield: Shield,
  'shield-check': ShieldCheck,
};

const offerIconMap: Record<(typeof OFFER_COLLECTIONS)[number]['icon'], LucideIcon> = {
  gift: Gift,
  moon: MoonStar,
  tag: BadgePercent,
  boxes: Boxes,
  truck: Truck,
  ticket: Ticket,
};

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: '১০০% Authentic',
    copy: 'Hand-verified batches',
  },
  {
    icon: Truck,
    title: 'Dhaka next-day',
    copy: '64 districts nationwide',
  },
  {
    icon: WalletCards,
    title: 'COD · bKash · Nagad',
    copy: 'Card accepted',
  },
  {
    icon: RotateCcw,
    title: '7-day easy return',
    copy: 'Product guarantee',
  },
];

const REVIEWS = [
  {
    name: 'RIFAT',
    location: 'DHAKA',
    product: 'COSRX Snail Mucin Essence',
    rating: '4.9',
    text: 'Bought my second bottle here. Packaging was proper and delivery came the next day.',
  },
  {
    name: 'TANIA',
    location: 'SYLHET',
    product: 'Beauty of Joseon Sunscreen',
    rating: '5.0',
    text: 'আমি সানস্ক্রিনটা নিয়ে খুবই খুশি। গরমেও হালকা লাগে, ফেক মনে হয়নি একদম।',
  },
  {
    name: 'SABA',
    location: 'CHITTAGONG',
    product: 'Anua Heartleaf Toner',
    rating: '4.8',
    text: 'Good pricing, clear expiry info, and the bottle arrived sealed.',
  },
  {
    name: 'NABIL',
    location: 'RAJSHAHI',
    product: 'Skin1004 Centella Ampoule',
    rating: '5.0',
    text: 'Customer support answered on WhatsApp before I ordered. That helped a lot.',
  },
  {
    name: 'FARIA',
    location: 'KHULNA',
    product: 'Round Lab Birch Sunscreen',
    rating: '4.9',
    text: 'Fast outside-Dhaka delivery and the product texture matched what I expected.',
  },
  {
    name: 'MIM',
    location: 'DHAKA',
    product: 'Some By Mi Miracle Toner',
    rating: '4.9',
    text: 'Verified buyer badge matters to me. Reordered again from the same listing.',
  },
];

const UGC_REELS = [
  {
    label: 'Instagram routine clips',
    href: 'https://www.instagram.com/emartbd.official/',
    platform: 'Instagram',
    image: '/images/home-categories/viral-kbeauty.jpg',
    eyebrow: 'Official Instagram',
    note: 'Daily routines, shelf shots, and quick skincare picks',
  },
  {
    label: 'YouTube Shorts spotlight',
    href: 'https://www.youtube.com/shorts/zgo8F-H3FEI',
    platform: 'YouTube',
    image: '/images/home-categories/cosrx-snail-92-cream.png',
    eyebrow: 'Featured Short',
    note: 'Product demos, unboxings, and skincare routines on YouTube',
  },
  {
    label: 'TikTok unboxing reel',
    href: 'https://www.tiktok.com/@emart_bdofficial',
    platform: 'TikTok',
    image: '/images/home-categories/cosrx-sunscreen.jpg',
    eyebrow: 'Official TikTok',
    note: 'Unboxings, texture clips, and fast product demos',
  },
];

function formatBlogDate(value: string) {
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function ProductFeatureCard({
  product,
  badge,
  meta,
}: {
  product: WooProduct;
  badge: string;
  meta: string;
}) {
  const discount = product.on_sale ? getDiscountPercent(product.regular_price, product.sale_price) : 0;

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-hairline bg-white shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-pop"
    >
      <div className="relative aspect-[4/4.4] overflow-hidden bg-bg-alt">
        <Image
          src={product.images[0]?.src || '/images/placeholder.jpg'}
          alt={product.images[0]?.alt || product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-white">{badge}</span>
          {discount > 0 && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-white">-{discount}%</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
          {product.categories[0]?.name || 'Beauty'}
        </div>
        <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-ink">{product.name}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-accent">{formatPrice(product.sale_price || product.price)}</span>
          {product.on_sale && product.regular_price && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.regular_price)}</span>
          )}
        </div>
        <div className="mt-auto pt-3 text-xs font-semibold text-gray-500">{meta}</div>
      </div>
    </Link>
  );
}

interface CategoryTile {
  name: string;
  href: string;
  image?: string;
}

export function ShopByCategorySection({ categories }: { categories: CategoryTile[] }) {
  if (!categories.length) return null;
  const tiles = categories.slice(0, 6);
  return (
    <section className="bg-bg px-4 py-6 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Browse</p>
            <h2 className="mt-1 text-2xl font-extrabold text-ink lg:text-3xl">Shop by category</h2>
          </div>
          <Link href="/categories" className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
            All categories <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tiles.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-bg-alt p-3 transition-all hover:border-accent/30 hover:bg-white hover:shadow-card"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gradient-to-br from-accent-soft via-white to-[#edf7f2] ring-1 ring-hairline sm:h-20 sm:w-20">
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="80px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-black text-accent">
                    {cat.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <span className="text-center text-xs font-bold leading-tight text-ink">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function InstantTrustBar() {
  return (
    <section className="bg-ink px-4 py-4 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 lg:grid-cols-4">
        {TRUST_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex min-h-[72px] items-center gap-3 rounded-lg bg-white/7 px-3 py-3 lg:min-h-[80px]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/12">
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold leading-5">{item.title}</div>
                <div className="text-xs leading-5 text-white/75">{item.copy}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function OfferCollectionsRail() {
  return (
    <section className="bg-bg px-4 pb-6 pt-6">
      <div className="mx-auto max-w-6xl">
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max snap-x snap-mandatory gap-4 pb-2 lg:grid lg:w-full lg:grid-cols-6 lg:gap-4 lg:snap-none">
            {OFFER_COLLECTIONS.map((item) => {
              const hintMap: Record<string, string> = {
                bogo: 'Buy 1 get 1 picks',
                'eid-offer': 'Seasonal deal edit',
                'clearance-sale': 'Extra markdowns',
                combo: 'Bundle and set offers',
                'free-delivery': 'For ৳3000+ carts',
                coupon: 'Code-ready picks',
              };
              const IconComp = offerIconMap[item.icon] ?? Sparkles;
              return (
                <Link
                  key={item.slug}
                  href={item.href}
                  className={`group relative flex min-h-[132px] w-[44vw] min-w-[156px] max-w-[200px] snap-start flex-col justify-between overflow-hidden rounded-[22px] border border-hairline bg-gradient-to-br ${item.accent} px-4 py-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-pop lg:min-h-[144px] lg:w-auto lg:max-w-none lg:px-5 lg:py-5`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_45%)]" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[5px] bg-gradient-to-r from-accent via-accent/60 to-transparent" />
                  <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-white/40 blur-2xl" />
                  <div className="relative z-[1] flex items-center justify-between gap-2">
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-accent shadow-sm">
                      Offer
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-accent shadow-sm transition-transform group-hover:scale-110">
                      <IconComp className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="relative z-[1] mt-3">
                    <div className="text-base font-black leading-5 text-ink lg:text-lg">{item.label}</div>
                    <div className="mt-1.5 max-w-[14ch] text-[12px] font-semibold leading-4 text-ink/70 lg:max-w-none">
                      {hintMap[item.slug]}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ConcernTilesSection() {
  return (
    <section className="bg-bg px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Your skin concern</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink lg:text-3xl">Shop by concern</h2>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
          <div className="flex w-max snap-x snap-mandatory gap-3 pb-1">
            {CONCERN_DEFINITIONS.map((item) => (
              (() => {
                const Icon = concernIconMap[item.icon] || Sparkles;
                return (
                  <Link
                    key={item.slug}
                    href={getConcernHref(item.slug)}
                    className="flex min-h-[72px] w-[76vw] max-w-[280px] snap-start items-center gap-3 rounded-[22px] border border-hairline bg-bg-alt px-4 py-3 transition-all hover:border-accent/30 hover:bg-white hover:shadow-card"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-ink">{item.label}</div>
                      <div className="truncate text-xs font-medium text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                );
              })()
            ))}
          </div>
        </div>
        <div className="hidden grid-cols-2 gap-3 sm:grid lg:grid-cols-3">
          {CONCERN_DEFINITIONS.map((item) => (
            (() => {
              const Icon = concernIconMap[item.icon] || Sparkles;
              return (
                <Link
                  key={item.slug}
                  href={getConcernHref(item.slug)}
                  className="flex min-h-[64px] items-center gap-3 rounded-lg border border-hairline bg-bg-alt px-3 py-3 transition-all hover:border-accent/30 hover:bg-white hover:shadow-card"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-ink">{item.label}</div>
                    <div className="truncate text-xs font-medium text-gray-500">{item.description}</div>
                  </div>
                </Link>
              );
            })()
          ))}
        </div>
      </div>
    </section>
  );
}

export function AuthenticityStorySection() {
  return (
    <section className="bg-bg-alt px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Why Bangladeshi customers stay with us</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink lg:text-3xl">Why ৫০,০০০+ Bangladeshi trust us</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['40+', 'brands hand-verified'],
            ['50,000+', 'orders delivered'],
            ['64', 'districts reached'],
            ['4.9', 'avg review'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg border border-hairline bg-white px-4 py-5 text-center shadow-card">
              <div className="text-3xl font-extrabold text-accent">{value}</div>
              <div className="mt-2 text-sm font-semibold text-ink">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-bg-alt">
            <Image
              src="https://e-mart.com.bd/wp-content/uploads/2026/04/hgjhh.png"
              alt="Hand-verified authentic K-beauty and J-beauty products at Emart"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
          </div>

          <div className="rounded-lg bg-white p-6 shadow-card">
            <h3 className="text-2xl font-extrabold text-ink">Every bottle verified</h3>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              We do not treat authenticity as a sticker. Each batch is checked for seal condition, label consistency,
              expiry clarity, and storage quality before dispatch.
            </p>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              Orders that reach Dhaka usually land the next day. Outside Dhaka, we pack with the same care and route
              to 64 districts with payment flexibility built in.
            </p>
            <div className="mt-5 rounded-lg border border-brass/25 bg-brass-soft p-4">
              <div className="text-sm font-bold text-[#7a5f1f]">Authenticity Seal</div>
              <div className="mt-1 text-sm leading-6 text-ink">১০০% অথেনটিক · ৪০+ ব্র্যান্ড যাচাইকৃত</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {[
            'Direct from global brand channels',
            'Hand-checked in Dhanmondi',
            'Shipped to your door',
          ].map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-lg bg-white px-4 py-4 shadow-card">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-extrabold text-white">
                {index + 1}
              </div>
              <div className="text-sm font-bold text-ink">{step}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductGridSection({
  title,
  eyebrow,
  products,
  badge,
  viewAllHref,
  viewAllLabel,
  metaPrefix,
  mobileLimit = 4,
  desktopLimit = 8,
}: {
  title: string;
  eyebrow?: string;
  products: WooProduct[];
  badge: string;
  viewAllHref: string;
  viewAllLabel: string;
  metaPrefix: string;
  mobileLimit?: number;
  desktopLimit?: number;
}) {
  if (!products.length) return null;

  const visible = products.slice(0, desktopLimit);
  const mobileVisible = visible.slice(0, mobileLimit);

  return (
    <section className="bg-bg px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">{eyebrow}</p>}
            <h2 className="mt-2 text-2xl font-extrabold text-ink lg:text-3xl">{title}</h2>
          </div>
          <Link href={viewAllHref} className="hidden text-sm font-bold text-accent lg:inline-flex">
            {viewAllLabel} →
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-4">
            {mobileVisible.map((product) => (
              <div key={product.id} className="w-[46vw] min-w-[172px] max-w-[220px]">
                <ProductFeatureCard
                  product={product}
                  badge={badge}
                  meta={badge === 'NEW' ? 'Just in this week' : `${product.average_rating || '4.9'}★ · ${metaPrefix} ${((product.id % 3) + 2).toString()} days`}
                />
              </div>
            ))}
            <Link
              href={viewAllHref}
              aria-label={viewAllLabel}
              className="flex w-[46vw] min-w-[172px] max-w-[220px] flex-col justify-between rounded-lg border border-dashed border-accent/30 bg-white p-5 text-ink shadow-card"
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-accent">View more</div>
                <div className="mt-3 text-xl font-extrabold leading-tight">More {title.toLowerCase()}</div>
                <p className="mt-3 text-sm leading-6 text-gray-500">
                  Browse more verified skincare picks from this edit.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-accent">
                {viewAllLabel} <span>→</span>
              </span>
            </Link>
          </div>
        </div>

        <div className="hidden grid-cols-2 gap-4 lg:grid lg:grid-cols-4">
          {visible.map((product, index) => (
            <div key={product.id} className={index >= mobileLimit ? 'hidden lg:block' : ''}>
              <ProductFeatureCard
                product={product}
                badge={badge}
                meta={badge === 'NEW' ? 'Just in this week' : `${product.average_rating || '4.9'}★ · ${metaPrefix} ${((product.id % 3) + 2).toString()} days`}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export function BrandLogoGridSection({ brands }: { brands: BrandLogo[] }) {
  const visible = brands.slice(0, 16);

  return (
    <section className="bg-bg-alt px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Forty-plus brands, hand-verified</p>
            <h2 className="mt-2 text-2xl font-extrabold text-ink lg:text-3xl">Shop by brand</h2>
          </div>
          <Link href="/brands" className="hidden text-sm font-bold text-accent lg:inline-flex">
            See all brands →
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
          <div className="flex w-max snap-x snap-mandatory gap-2.5 pb-1">
            {visible.filter((b) => b.logo).slice(0, 10).map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${encodeURIComponent(brand.slug)}`}
                title={brand.name}
                className="flex h-24 w-[32vw] min-w-[110px] snap-start items-center justify-center rounded-2xl border border-hairline bg-white p-2 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/30"
              >
                <div className="relative h-full w-full">
                  <Image src={brand.logo!} alt={brand.name} fill sizes="120px" className="object-contain" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-8 lg:grid">
          {visible.filter((b) => b.logo).map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${encodeURIComponent(brand.slug)}`}
              title={brand.name}
              className="flex h-24 items-center justify-center rounded-lg border border-hairline bg-white p-2 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/30"
            >
              <div className="relative h-full w-full">
                <Image src={brand.logo!} alt={brand.name} fill sizes="160px" className="object-contain" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CustomerVoiceSection() {
  return (
    <section className="bg-bg px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Customer voice</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink lg:text-3xl">4.9 ★ from 12,400+ verified buyers</h2>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-4">
            {REVIEWS.map((review) => (
              <article
                key={`${review.name}-${review.product}`}
                className="w-[84vw] max-w-[360px] snap-start rounded-lg border border-hairline bg-bg-alt p-5 shadow-card lg:w-[31%]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-ink">{review.name} · {review.location}</div>
                    <div className="mt-1 text-xs font-semibold text-gray-500">{review.product}</div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    Verified buyer
                  </span>
                </div>
                <div className="mt-4 text-sm leading-7 text-gray-600">{review.text}</div>
                <div className="mt-4 flex items-center gap-2 text-sm font-bold text-accent">
                  <span>{review.rating} ★</span>
                  <span className="text-gray-400">·</span>
                  <span>Verified purchase</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <SocialChannelGrid />
      </div>
    </section>
  );
}

export function SkinQuizCTA() {
  return (
    <section className="bg-bg-alt px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-lg bg-white p-6 shadow-card lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Routine quiz</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink">Not sure what to buy? Take our 60-second skin quiz</h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-gray-600">
            <span>1. Skin type</span>
            <span>2. Climate + concerns</span>
            <span>3. Routine by email</span>
          </div>
        </div>
        <Link href="/skin-quiz" className="inline-flex rounded-lg bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-black">
          Start quiz →
        </Link>
      </div>
    </section>
  );
}

export function OriginStoryBlock() {
  return (
    <section className="bg-bg px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-5 overflow-hidden rounded-lg border border-hairline bg-bg-alt lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative min-h-[260px]">
          <Image
            src="/images/home-categories/viral-kbeauty.jpg"
            alt="Emart beauty curation and store story"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain object-center"
          />
        </div>
        <div className="p-6 lg:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">A shop that began in Dhanmondi</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink lg:text-3xl">Origin story</h2>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            We started with one practical idea: make authentic global beauty easier to buy in Bangladesh without guesswork,
            fake-product anxiety, or confusing pricing.
          </p>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            That meant real sourcing, real batch checks, and clear support from a local team that understands what customers here actually ask before they order.
          </p>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            The shop grew from Dhanmondi to a nationwide customer base, but the standard stayed the same: verify first, sell second.
          </p>
          <Link href="/our-story" className="mt-5 inline-flex text-sm font-bold text-accent">
            Our story →
          </Link>
        </div>
      </div>
    </section>
  );
}

export function BlogTeaserSection({ posts }: { posts: BlogPostSummary[] }) {
  const visible = posts.slice(0, 3);
  if (!visible.length) return null;

  return (
    <section className="bg-bg px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Skincare journal · জার্নাল</p>
            <h2 className="mt-2 text-2xl font-extrabold text-ink lg:text-3xl">Editorial</h2>
          </div>
          <Link href="/blog" className="text-sm font-bold text-accent hover:underline">
            Read all articles →
          </Link>
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
          <div className="flex w-max snap-x snap-mandatory gap-4 pb-1">
            {visible.map((post) => (
              <article key={post.id} className="w-[78vw] max-w-[300px] snap-start">
                <Link
                  href={post.href}
                  className="block rounded-[22px] border border-hairline bg-bg-alt p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/30"
                >
                  <time dateTime={post.date} className="text-xs font-bold uppercase tracking-wide text-accent">
                    {formatBlogDate(post.date)}
                  </time>
                  <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-snug text-ink">{post.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-gray-600">{post.excerpt}</p>
                  <span className="mt-4 inline-block text-xs font-bold text-accent">Read article →</span>
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* Desktop: grid */}
        <div className="hidden gap-4 md:grid md:grid-cols-3">
          {visible.map((post) => (
            <article key={post.id}>
              <Link
                href={post.href}
                className="block rounded-lg border border-hairline bg-bg-alt p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/30"
              >
                <time dateTime={post.date} className="text-xs font-bold uppercase tracking-wide text-accent">
                  {formatBlogDate(post.date)}
                </time>
                <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-snug text-ink">{post.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-gray-600">{post.excerpt}</p>
                <span className="mt-4 inline-block text-xs font-bold text-accent">Read article →</span>
              </Link>
            </article>
          ))}
        </div>

        {/* Mobile: bottom CTA */}
        <div className="mt-5 text-center md:hidden">
          <Link href="/blog" className="inline-flex rounded-full border border-accent/30 px-5 py-2 text-sm font-bold text-accent hover:bg-accent-soft">
            Read all articles →
          </Link>
        </div>
      </div>
    </section>
  );
}

const SERVICE_PROMISES = [
  {
    icon: Truck,
    title: 'Same-day Dhaka',
    mobileTitle: 'Same-day Dhaka',
    copy: 'Fast Dhaka delivery when timing allows, with 2-day routing outside Dhaka.',
  },
  {
    icon: WalletCards,
    title: 'Flexible Payment',
    mobileTitle: 'bKash · COD',
    copy: 'bKash, Nagad, COD and card payments for first-time and repeat customers.',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    mobileTitle: '7-day returns',
    copy: '7-day return support with clear product guarantee steps.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Support',
    mobileTitle: 'WhatsApp help',
    copy: 'Talk directly with our skincare support team at 01717082135.',
    href: 'https://wa.me/8801717082135',
  },
];

export function ShippingPaymentReturns() {
  return (
    <section className="border-y border-[#f4d9df] bg-[#fff7f8] px-4 py-4 sm:py-9">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {SERVICE_PROMISES.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/15 bg-accent/10 text-accent sm:h-11 sm:w-11">
                  <Icon size={19} strokeWidth={2.2} className="sm:h-[22px] sm:w-[22px]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-extrabold leading-snug text-ink sm:text-sm">{item.mobileTitle || item.title}</div>
                  <div className="mt-1.5 hidden text-sm leading-6 text-gray-600 sm:block">{item.copy}</div>
                </div>
              </>
            );

            if (item.href) {
              return (
                <a
                  key={item.title}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-[72px] items-center gap-3 rounded-lg border border-hairline bg-white/85 p-3 shadow-[0_10px_22px_rgba(127,53,75,0.06)] transition-all hover:-translate-y-0.5 hover:border-accent/35 hover:bg-white sm:min-h-[128px] sm:items-start sm:gap-4 sm:p-4 sm:shadow-[0_14px_30px_rgba(127,53,75,0.07)]"
                >
                  {content}
                </a>
              );
            }

            return (
              <div
                key={item.title}
                className="flex min-h-[72px] items-center gap-3 rounded-lg border border-hairline bg-white/85 p-3 shadow-[0_10px_22px_rgba(127,53,75,0.06)] sm:min-h-[128px] sm:items-start sm:gap-4 sm:p-4 sm:shadow-[0_14px_30px_rgba(127,53,75,0.07)]"
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FloatingWhatsAppButton() {
  return (
    <a
      href="https://wa.me/8801717082135"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Emart on WhatsApp"
      className="fixed bottom-[86px] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-[0_16px_28px_rgba(37,211,102,0.28)] transition-transform hover:scale-[1.02] hover:bg-[#1fb457] lg:hidden"
    >
      <MessageCircle size={18} />
      <span>WhatsApp</span>
    </a>
  );
}

export function WhatsappSignupSection() {
  const [tab, setTab] = useState<'whatsapp' | 'email'>('whatsapp');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="bg-bg px-4 py-8">
      <div className="mx-auto max-w-6xl rounded-lg border border-hairline bg-bg-alt p-6">
        <div className="mb-5 flex gap-2 border-b border-hairline lg:hidden">
          <button
            type="button"
            onClick={() => setTab('whatsapp')}
            className={`-mb-px flex-1 pb-3 text-sm font-bold transition-colors ${
              tab === 'whatsapp' ? 'border-b-2 border-accent text-ink' : 'text-gray-600 hover:text-ink'
            }`}
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setTab('email')}
            className={`-mb-px flex-1 pb-3 text-sm font-bold transition-colors ${
              tab === 'email' ? 'border-b-2 border-accent text-ink' : 'text-gray-600 hover:text-ink'
            }`}
          >
            Email
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className={`${tab === 'whatsapp' ? 'flex' : 'hidden'} flex-col gap-4 lg:flex lg:border-r lg:border-hairline lg:pr-8`}>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-accent">WhatsApp list</div>
              <div className="mt-2 text-xl font-extrabold text-ink lg:text-2xl">Join 20,000 on our WhatsApp list — first access to sales</div>
              <div className="mt-2 text-sm leading-6 text-gray-600">We text 2x/month max · no spam</div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="homepage-whatsapp-phone"
                name="phone"
                type="tel"
                placeholder="01XXXXXXXXX"
                className="h-12 flex-1 rounded-lg border border-hairline bg-white px-4 text-sm font-medium text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              <a
                href="https://wa.me/8801717082135"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-[#25D366] px-5 text-sm font-bold text-white hover:bg-[#1fb457]"
              >
                Subscribe
              </a>
            </div>
          </div>

          <div className={`${tab === 'email' ? 'flex' : 'hidden'} flex-col gap-4 lg:flex`}>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Email newsletter</div>
              <div className="mt-2 text-xl font-extrabold text-ink lg:text-2xl">Subscribe by email for exclusive offers</div>
              <div className="mt-2 text-sm leading-6 text-gray-600">Weekly picks · unsubscribe anytime</div>
            </div>
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                id="homepage-newsletter-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={status === 'loading' || status === 'success'}
                className="h-12 flex-1 rounded-lg border border-hairline bg-white px-4 text-sm font-medium text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={status === 'loading' || status === 'success' || !email}
                className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-5 text-sm font-bold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
              >
                {status === 'loading' ? 'Subscribing…' : status === 'success' ? 'Subscribed ✓' : 'Subscribe'}
              </button>
            </form>
            {status === 'error' && (
              <div className="text-xs font-medium text-red-600">Something went wrong. Please try again.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhatsAppSupportBanner() {
  return (
    <section className="bg-white px-4 py-6 lg:hidden">
      <div className="mx-auto max-w-6xl rounded-lg bg-[#25D366] p-5 text-white shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-extrabold">Questions? WhatsApp us directly</div>
            <div className="mt-2 text-sm leading-6 text-white/90">Fast help for shade, routine, stock, and delivery questions.</div>
          </div>
          <MessageCircle size={24} />
        </div>
        <a
          href="https://wa.me/8801717082135"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-[#25D366]"
        >
          Open WhatsApp
        </a>
      </div>
    </section>
  );
}
