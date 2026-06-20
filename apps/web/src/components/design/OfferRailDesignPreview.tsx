import Link from 'next/link';
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  Gift,
  MoonStar,
  Sparkles,
  Ticket,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { OFFER_COLLECTIONS } from '@/lib/offerCollectionConfig';

export type OfferRailPreviewVariant = 'a' | 'b' | 'c';

const offerIconMap: Record<(typeof OFFER_COLLECTIONS)[number]['icon'], LucideIcon> = {
  gift: Gift,
  moon: MoonStar,
  tag: BadgePercent,
  boxes: Boxes,
  truck: Truck,
  ticket: Ticket,
};

const offerHints: Record<string, string> = {
  bogo: 'Buy 1 get 1 picks',
  'eid-offer': 'Seasonal skincare deals',
  'clearance-sale': 'Extra markdowns',
  combo: 'Bundle and set offers',
  'free-delivery': 'For ৳3,000+ carts',
  coupon: 'Code-ready picks',
};

const variantMeta: Record<OfferRailPreviewVariant, { name: string; intent: string }> = {
  a: {
    name: 'A · Refined current rail',
    intent: 'Lowest-risk polish with clearer hierarchy and stronger interaction feedback.',
  },
  b: {
    name: 'B · Compact deal navigator',
    intent: 'Faster mobile scanning with compact cards and visible directional cues.',
  },
  c: {
    name: 'C · Featured offer spotlight',
    intent: 'A campaign-led layout with one prominent offer and supporting quick links.',
  },
};

function PreviewHeading({ variant }: { variant: OfferRailPreviewVariant }) {
  const meta = variantMeta[variant];

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-accent">Offer collections</div>
        <h2 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">{meta.name}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{meta.intent}</p>
      </div>
      <span className="w-fit rounded-full border border-accent/15 bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
        Preview only
      </span>
    </div>
  );
}

function VariantA() {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max snap-x snap-mandatory gap-3 lg:grid lg:w-full lg:grid-cols-6 lg:snap-none">
        {OFFER_COLLECTIONS.map((item, index) => {
          const Icon = offerIconMap[item.icon] ?? Sparkles;

          return (
            <Link
              key={item.slug}
              href={item.href}
              className={`group relative flex min-h-[146px] w-[68vw] min-w-[220px] max-w-[260px] snap-start flex-col justify-between overflow-hidden rounded-2xl border border-hairline bg-gradient-to-br ${item.accent} p-4 shadow-card transition duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:min-h-[154px] lg:w-auto lg:min-w-0`}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.95),transparent_44%)]" />
              <div className="relative flex items-start justify-between">
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-accent shadow-sm">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-accent shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <div className="relative mt-6">
                <div className="text-lg font-black leading-5 text-ink">{item.label}</div>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold text-ink/65">
                  <span>{offerHints[item.slug]}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-accent transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function VariantB() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {OFFER_COLLECTIONS.map((item) => {
        const Icon = offerIconMap[item.icon] ?? Sparkles;

        return (
          <Link
            key={item.slug}
            href={item.href}
            className="group flex min-h-[82px] items-center gap-4 rounded-2xl border border-hairline bg-white p-3 shadow-card transition duration-200 hover:border-accent/30 hover:bg-accent-soft/40 hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-accent`}>
              <Icon className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-black text-ink">{item.label}</span>
              <span className="mt-0.5 block truncate text-xs font-semibold text-muted">{offerHints[item.slug]}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-accent" aria-hidden="true" />
          </Link>
        );
      })}
    </div>
  );
}

function VariantC() {
  const [featured, ...supporting] = OFFER_COLLECTIONS;
  const FeaturedIcon = offerIconMap[featured.icon] ?? Sparkles;

  return (
    <div className="grid gap-3 lg:grid-cols-[1.15fr_1.85fr]">
      <Link
        href={featured.href}
        className={`group relative flex min-h-[224px] flex-col justify-between overflow-hidden rounded-[28px] border border-accent/15 bg-gradient-to-br ${featured.accent} p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/65 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">Featured</span>
          <FeaturedIcon className="h-10 w-10 text-accent/80 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" aria-hidden="true" />
        </div>
        <div className="relative max-w-sm">
          <h3 className="font-display text-3xl font-bold leading-tight text-ink">{featured.label}</h3>
          <p className="mt-2 text-sm font-semibold text-ink/65">{offerHints[featured.slug]}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-accent">
            Explore offer
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {supporting.map((item) => {
          const Icon = offerIconMap[item.icon] ?? Sparkles;

          return (
            <Link
              key={item.slug}
              href={item.href}
              className="group flex min-h-[104px] flex-col justify-between rounded-2xl border border-hairline bg-white p-3.5 shadow-card transition duration-200 hover:border-accent/30 hover:bg-accent-soft/30 hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-accent`}>
                <Icon className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-black leading-4 text-ink">{item.label}</span>
                <span className="mt-1 hidden text-[11px] font-semibold leading-4 text-muted sm:block">{offerHints[item.slug]}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function OfferRailDesignPreview({ variant }: { variant: OfferRailPreviewVariant }) {
  return (
    <section className="rounded-[32px] border border-hairline bg-bg p-4 shadow-card sm:p-6 lg:p-8">
      <PreviewHeading variant={variant} />
      {variant === 'a' && <VariantA />}
      {variant === 'b' && <VariantB />}
      {variant === 'c' && <VariantC />}
    </section>
  );
}
