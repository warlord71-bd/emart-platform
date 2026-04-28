import Link from 'next/link';
import { ArrowRight, CircleDot, Droplets, LayoutGrid, Shield, ShieldCheck, Sparkles, Star, Sun, Target } from 'lucide-react';
import type { Metadata } from 'next';
import { getCategories, type WooCategory } from '@/lib/woocommerce';
import { canonicalPath } from '@/lib/canonicalUrl';
import { COMPANY } from '@/lib/companyProfile';

type CategoryCardConfig = {
  name: string;
  slugCandidates: string[];
  fallbackSlug: string;
  badge?: string;
};

type ConcernCardConfig = {
  name: string;
  href: string;
  categorySlug?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const POPULAR_CATEGORIES: CategoryCardConfig[] = [
  { name: 'Sunscreen', slugCandidates: ['sunscreen'], fallbackSlug: 'sunscreen', badge: 'SPF' },
  { name: 'Serum & Ampoule', slugCandidates: ['serums-ampoules-essences'], fallbackSlug: 'serums-ampoules-essences', badge: 'SA' },
  { name: 'Moisturizer', slugCandidates: ['cream-moisturizer', 'cream-moisturizers', 'moisturizer'], fallbackSlug: 'cream-moisturizer', badge: 'M' },
  { name: 'Face Cleanser', slugCandidates: ['face-cleansers'], fallbackSlug: 'face-cleansers', badge: 'C' },
  { name: 'Toner & Mist', slugCandidates: ['toners-mists'], fallbackSlug: 'toners-mists', badge: 'T' },
  { name: 'Face Mask', slugCandidates: ['face-masks', 'sheet-masks'], fallbackSlug: 'face-masks', badge: 'FM' },
  { name: 'Lip Care', slugCandidates: ['lip-balm-care', 'lip-care'], fallbackSlug: 'lip-balm-care', badge: 'L' },
  { name: 'Hair Treatment', slugCandidates: ['hair-treatments', 'hair-essence-serum'], fallbackSlug: 'hair-treatments', badge: 'HT' },
];

const SKINCARE_CATEGORIES: CategoryCardConfig[] = [
  { name: 'Face Cleansers', slugCandidates: ['face-cleansers'], fallbackSlug: 'face-cleansers', badge: 'C' },
  { name: 'Toners & Mists', slugCandidates: ['toners-mists'], fallbackSlug: 'toners-mists', badge: 'T' },
  { name: 'Serums & Ampoules', slugCandidates: ['serums-ampoules-essences'], fallbackSlug: 'serums-ampoules-essences', badge: 'SA' },
  { name: 'Moisturizers', slugCandidates: ['cream-moisturizer', 'cream-moisturizers', 'moisturizer'], fallbackSlug: 'cream-moisturizer', badge: 'M' },
  { name: 'Sunscreen', slugCandidates: ['sunscreen'], fallbackSlug: 'sunscreen', badge: 'SPF' },
  { name: 'Eye Care', slugCandidates: ['eye-care', 'eyes'], fallbackSlug: 'eyes', badge: 'E' },
  { name: 'Masks', slugCandidates: ['face-masks', 'sheet-masks'], fallbackSlug: 'face-masks', badge: 'MK' },
];

const HAIR_CARE_CATEGORIES: CategoryCardConfig[] = [
  { name: 'Shampoo', slugCandidates: ['shampoos', 'shampoo'], fallbackSlug: 'shampoos', badge: 'S' },
  { name: 'Conditioner', slugCandidates: ['hair-conditioners', 'conditioner'], fallbackSlug: 'hair-conditioners', badge: 'C' },
  { name: 'Treatments & Serums', slugCandidates: ['hair-treatments', 'hair-essence-serum'], fallbackSlug: 'hair-treatments', badge: 'TS' },
  { name: 'Hair Oil', slugCandidates: ['hair-oil'], fallbackSlug: 'hair-oil', badge: 'O' },
  { name: 'Hair Styling', slugCandidates: ['hair-styling-products'], fallbackSlug: 'hair-styling-products', badge: 'HS' },
];

const MAKEUP_CATEGORIES: CategoryCardConfig[] = [
  { name: 'Foundation & Primer', slugCandidates: ['foundation', 'face-primer'], fallbackSlug: 'foundation', badge: 'FP' },
  { name: 'Face Makeup', slugCandidates: ['face-makeup'], fallbackSlug: 'face-makeup', badge: 'FM' },
  { name: 'Lips', slugCandidates: ['lips', 'lipstick-tint'], fallbackSlug: 'lips', badge: 'L' },
  { name: 'Eyes', slugCandidates: ['eyes'], fallbackSlug: 'eyes', badge: 'E' },
];

const BODY_CARE_CATEGORIES: CategoryCardConfig[] = [
  { name: 'Body Lotion', slugCandidates: ['body-lotion'], fallbackSlug: 'body-lotion', badge: 'BL' },
  { name: 'Body Wash', slugCandidates: ['body-wash'], fallbackSlug: 'body-wash', badge: 'BW' },
  { name: 'Fragrance', slugCandidates: ['fragrances'], fallbackSlug: 'fragrances', badge: 'F' },
  { name: 'Personal Hygiene', slugCandidates: ['personal-hygiene'], fallbackSlug: 'personal-hygiene', badge: 'PH' },
];

const CONCERN_CATEGORIES: ConcernCardConfig[] = [
  { name: 'Acne & Blemish', href: '/concerns?concern=acne-blemish-care', categorySlug: 'acne-blemish-care', icon: Target },
  { name: 'Sensitivity', href: '/concerns?concern=sensitivity', icon: Shield },
  { name: 'Hyperpigmentation', href: '/concerns?concern=melasma', categorySlug: 'melasma', icon: Sun },
  { name: 'Pores & Blackheads', href: '/concerns?concern=pores-oil-control', categorySlug: 'pores-oil-control', icon: CircleDot },
  { name: 'Brightening', href: '/concerns?concern=brightening', categorySlug: 'brightening', icon: Star },
  { name: 'Dryness & Hydration', href: '/concerns?concern=dryness-hydration', categorySlug: 'dryness-hydration', icon: Droplets },
  { name: 'Anti-Aging & Repair', href: '/concerns?concern=anti-aging-repair', categorySlug: 'anti-aging-repair', icon: Sparkles },
  { name: 'Sunscreen', href: '/concerns?concern=sunscreen', categorySlug: 'sunscreen', icon: ShieldCheck },
];

const JUMP_PILLS = [
  { label: 'Popular', href: '#popular' },
  { label: 'Concern', href: '#concern' },
  { label: 'Quiz', href: '#quiz' },
  { label: 'Skincare', href: '#skincare' },
  { label: 'Hair', href: '#hair' },
  { label: 'Makeup', href: '#makeup' },
  { label: 'Body', href: '#body' },
];

function resolveCategory(config: CategoryCardConfig, categoriesBySlug: Map<string, WooCategory>) {
  const slug = config.slugCandidates.find((candidate) => categoriesBySlug.has(candidate)) || config.fallbackSlug;
  const category = categoriesBySlug.get(slug);
  return {
    name: config.name,
    href: `/category/${slug}`,
    count: category?.count || 0,
    badge: config.badge || config.name.slice(0, 1),
  };
}

function SectionHeader({
  title,
  eyebrow,
  description,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
}) {
  return (
    <div className="mb-4 sm:mb-5">
      {eyebrow ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent sm:text-xs">{eyebrow}</p>
      ) : null}
      <h2 className="mt-1 type-section-title text-ink">{title}</h2>
      {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
    </div>
  );
}

function CategoryGridCard({
  href,
  name,
  badge,
  count,
}: {
  href: string;
  name: string;
  badge: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[116px] flex-col rounded-[22px] border border-hairline bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 min-h-10 w-10 min-w-10 items-center justify-center rounded-full border border-hairline bg-gradient-to-br from-accent-soft via-white to-[#fbf7f1] text-[11px] font-extrabold uppercase tracking-[0.08em] text-accent">
          {badge}
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-accent" />
      </div>
      <div className="mt-5">
        <h3 className="text-sm font-extrabold leading-snug text-ink sm:text-[15px]">{name}</h3>
        <p className="mt-1 text-xs text-muted">{count ? `${count} products` : 'Browse category'}</p>
      </div>
    </Link>
  );
}

function ConcernGridCard({
  href,
  name,
  Icon,
  count,
}: {
  href: string;
  name: string;
  Icon: React.ComponentType<{ className?: string }>;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[116px] flex-col rounded-[22px] border border-hairline bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 min-h-10 w-10 min-w-10 items-center justify-center rounded-full border border-hairline bg-gradient-to-br from-accent-soft via-white to-[#fbf7f1] text-accent">
          <Icon className="h-4 w-4" />
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-accent" />
      </div>
      <div className="mt-5">
        <h3 className="text-sm font-extrabold leading-snug text-ink sm:text-[15px]">{name}</h3>
        <p className="mt-1 text-xs text-muted">{count ? `${count} products` : 'Browse concern'}</p>
      </div>
    </Link>
  );
}

export function generateMetadata({ searchParams }: { searchParams?: Record<string, string | string[]> }): Metadata {
  return {
    title: 'All Categories — Emart Skincare Bangladesh',
    description: 'Choose products by category, skin concern or beauty need on Emart’s category discovery page.',
    alternates: { canonical: canonicalPath('/categories', searchParams) },
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function CategoriesPage() {
  let allCategories: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    allCategories = await getCategories({ per_page: 100, hide_empty: true });
  } catch {
    // WooCommerce API unreachable — render page structure without live category data
  }

  const categoriesBySlug = new Map(allCategories.map((category) => [category.slug, category]));

  const popularCards = POPULAR_CATEGORIES.map((item) => resolveCategory(item, categoriesBySlug));
  const skincareCards = SKINCARE_CATEGORIES.map((item) => resolveCategory(item, categoriesBySlug));
  const hairCards = HAIR_CARE_CATEGORIES.map((item) => resolveCategory(item, categoriesBySlug));
  const makeupCards = MAKEUP_CATEGORIES.map((item) => resolveCategory(item, categoriesBySlug));
  const bodyCards = BODY_CARE_CATEGORIES.map((item) => resolveCategory(item, categoriesBySlug));
  const concernCards = CONCERN_CATEGORIES.map((item) => ({
    ...item,
    count: item.categorySlug ? categoriesBySlug.get(item.categorySlug)?.count || 0 : 0,
  }));

  const categoryCount = [
    ...skincareCards,
    ...hairCards,
    ...makeupCards,
    ...bodyCards,
    ...concernCards,
  ].length;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://e-mart.com.bd/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Categories',
            item: 'https://e-mart.com.bd/categories',
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Popular Categories',
        itemListElement: popularCards.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          url: `https://e-mart.com.bd${item.href}`,
        })),
      },
    ],
  };

  return (
    <main className="bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="border-b border-hairline bg-gradient-to-br from-accent-soft via-white to-[#fbf7f1] px-4 py-7 sm:py-9">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-3xl">
            <nav aria-label="Breadcrumb" className="text-sm text-muted">
              <ol className="flex items-center gap-2">
                <li><Link href="/" className="hover:text-accent">Home</Link></li>
                <li className="text-muted/60">/</li>
                <li className="font-semibold text-ink">Categories</li>
              </ol>
            </nav>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-hairline bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-accent shadow-sm">
              <LayoutGrid className="h-3.5 w-3.5" />
              {categoryCount} menu categories
            </div>

            <h1 className="mt-4 type-page-title text-ink">Shop All Categories</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
              Choose products by category, skin concern or beauty need.
            </p>
          </div>
        </div>
      </section>

      <section className="sticky top-[72px] z-20 border-b border-hairline bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-[1200px]">
          <nav className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Jump to category sections">
            <div className="flex w-max gap-2">
              {JUMP_PILLS.map((pill) => (
                <a
                  key={pill.href}
                  href={pill.href}
                  className="shrink-0 rounded-full border border-hairline bg-card px-4 py-2 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
                >
                  {pill.label}
                </a>
              ))}
            </div>
          </nav>
        </div>
      </section>

      <section className="px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-[1200px] space-y-10 sm:space-y-12">
          <section id="popular" className="scroll-mt-32">
            <SectionHeader
              eyebrow="Popular now"
              title="Popular Categories"
              description="Fast ways to jump into the categories most shoppers browse first."
            />
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
              {popularCards.map((item) => (
                <CategoryGridCard key={item.href} {...item} />
              ))}
            </div>
          </section>

          <section id="concern" className="scroll-mt-32">
            <SectionHeader
              eyebrow="Skin goals"
              title="Shop by Skin Concern"
              description="Start with the concern you want to treat, then narrow into the right products."
            />
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
              {concernCards.map((item) => (
                <ConcernGridCard
                  key={item.href}
                  href={item.href}
                  name={item.name}
                  Icon={item.icon}
                  count={item.count}
                />
              ))}
            </div>
          </section>

          <section id="quiz" className="scroll-mt-32">
            <div className="rounded-[28px] border border-hairline bg-gradient-to-r from-[#fff4f7] via-white to-[#f8f5ef] p-5 shadow-sm sm:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent sm:text-xs">NOT SURE?</p>
              <h2 className="mt-2 type-section-title text-ink">Take the 60-second Skin Quiz</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                Answer a few simple questions and find products for your skin type, climate and concern.
              </p>
              <div className="mt-5">
                <Link
                  href="/skin-quiz"
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-black"
                >
                  Start quiz
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          <section id="skincare" className="scroll-mt-32">
            <SectionHeader
              eyebrow="Core routine"
              title="Skincare"
              description="Cleanse, treat, hydrate, and protect with your everyday essentials."
            />
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
              {skincareCards.map((item) => (
                <CategoryGridCard key={item.href} {...item} />
              ))}
            </div>
          </section>

          <section id="hair" className="scroll-mt-32">
            <SectionHeader
              eyebrow="Hair care"
              title="Hair Care"
              description="Shampoo, conditioning, repair, oil, and styling in one place."
            />
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
              {hairCards.map((item) => (
                <CategoryGridCard key={item.href} {...item} />
              ))}
            </div>
          </section>

          <section id="makeup" className="scroll-mt-32">
            <SectionHeader
              eyebrow="Everyday makeup"
              title="Makeup"
              description="Base, face, lips, and eyes for daily wear and occasion looks."
            />
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
              {makeupCards.map((item) => (
                <CategoryGridCard key={item.href} {...item} />
              ))}
            </div>
          </section>

          <section id="body" className="scroll-mt-32">
            <SectionHeader
              eyebrow="Body care"
              title="Body Care"
              description="Body, bath, fragrance, and personal care staples for daily routines."
            />
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
              {bodyCards.map((item) => (
                <CategoryGridCard key={item.href} {...item} />
              ))}
            </div>
          </section>

          <section className="pb-2">
            <div className="rounded-[24px] border border-hairline bg-card p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
              <div>
                <p className="text-sm font-semibold text-muted">Still confused?</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                  Let us guide you to the right routine with the quiz or a quick WhatsApp chat.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 sm:mt-0">
                <Link
                  href="/skin-quiz"
                  className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-black"
                >
                  Start Skin Quiz
                </Link>
                <a
                  href={COMPANY.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-hairline bg-white px-5 py-3 text-sm font-bold text-ink transition-colors hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
                >
                  Ask on WhatsApp
                </a>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
