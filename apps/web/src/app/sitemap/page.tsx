import Link from 'next/link';
import type { Metadata } from 'next';
import {
  BookOpen,
  Boxes,
  FileCode2,
  HeartPulse,
  HelpCircle,
  Map,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tags,
  type LucideIcon,
} from 'lucide-react';
import { CATEGORY_NAV_SECTIONS, ORIGIN_NAV_ITEMS } from '@/lib/category-navigation';
import { CONCERN_DEFINITIONS, getConcernHref } from '@/lib/concerns';
import { OFFER_COLLECTIONS } from '@/lib/offerCollectionConfig';
import { absoluteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: 'Sitemap | Emart Skincare Bangladesh',
  description: 'Browse Emart Skincare Bangladesh pages, categories, brands, concerns, offers, and support links.',
  alternates: { canonical: absoluteUrl('/sitemap') },
};

const QUICK_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop All', href: '/shop' },
  { label: 'Categories', href: '/categories' },
  { label: 'Brands', href: '/brands' },
  { label: 'Skin Quiz', href: '/skin-quiz' },
  { label: 'Track Order', href: '/track-order' },
];

const SHOP_LINKS = [
  { label: 'All Products', href: '/shop' },
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Sale', href: '/sale' },
  { label: 'Wishlist', href: '/wishlist' },
];

const SUPPORT_LINKS = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Shipping Policy', href: '/shipping-policy' },
  { label: 'Return Policy', href: '/return-policy' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms-conditions' },
  { label: 'Contact', href: '/contact' },
];

const STORY_LINKS = [
  { label: 'Our Story', href: '/our-story' },
  { label: 'Authenticity', href: '/authenticity' },
  { label: 'Editorial', href: '/blog' },
  { label: 'Social', href: '/social' },
  { label: 'Join Our Team', href: '/join-our-team' },
];

function TreePanel({
  title,
  eyebrow,
  icon: Icon,
  children,
}: {
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-hairline bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-normal text-muted-2">{eyebrow}</p>
          <h2 className="text-lg font-extrabold leading-tight text-ink">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function LinkList({ links }: { links: Array<{ label: string; href: string; description?: string }> }) {
  return (
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={`${link.href}-${link.label}`}>
          <Link
            href={link.href}
            className="group block rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-accent/20 hover:bg-accent-soft"
          >
            <span className="font-semibold text-ink transition-colors group-hover:text-accent">{link.label}</span>
            {link.description && (
              <span className="mt-1 block text-xs leading-5 text-muted">{link.description}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function HumanSitemapPage() {
  const sitemapJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Sitemap | Emart Skincare Bangladesh',
    url: absoluteUrl('/sitemap'),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: QUICK_LINKS.map((link, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: link.label,
        url: absoluteUrl(link.href),
      })),
    },
  };

  return (
    <main className="bg-bg px-4 py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sitemapJsonLd) }}
      />

      <div className="mx-auto max-w-7xl">
        <nav className="mb-5 flex items-center gap-2 text-sm text-muted">
          <Link href="/" className="transition-colors hover:text-accent">Home</Link>
          <span>/</span>
          <span className="font-semibold text-ink">Sitemap</span>
        </nav>

        <section className="mb-6 rounded-lg border border-hairline bg-ink px-5 py-6 text-white shadow-card sm:px-7">
          <p className="text-xs font-extrabold uppercase tracking-normal text-brass">Site tree</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
                Browse the Emart sitemap.
              </h1>
              <p className="mt-3 text-sm leading-7 text-white/72">
                A clean map of the shopper-facing frontend. Product URLs stay in the XML sitemap so this page remains easy to scan on mobile.
              </p>
            </div>
            <Link
              href="/sitemap.xml"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-extrabold text-ink transition-colors hover:bg-accent-soft hover:text-accent"
            >
              <FileCode2 className="h-4 w-4" />
              XML sitemap
            </Link>
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-hairline bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Map className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-extrabold uppercase tracking-normal text-ink">Quick paths</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-hairline bg-bg-alt px-3 py-3 text-center text-sm font-bold text-ink transition-colors hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <TreePanel title="Shop" eyebrow="Products" icon={ShoppingBag}>
            <LinkList links={SHOP_LINKS} />
          </TreePanel>

          <TreePanel title="Brands" eyebrow="Brand routes" icon={Tags}>
            <LinkList
              links={[
                { label: 'All Brands', href: '/brands', description: 'Browse every listed beauty brand.' },
                { label: 'COSRX', href: '/brands/cosrx' },
                { label: 'Anua', href: '/brands/anua' },
                { label: 'Beauty of Joseon', href: '/brands/beauty-of-joseon' },
                { label: 'La Roche-Posay', href: '/brands/la-roche-posay' },
              ]}
            />
          </TreePanel>

          <TreePanel title="Categories" eyebrow="Category > subcategory" icon={Boxes}>
            <div className="space-y-5">
              {CATEGORY_NAV_SECTIONS.map((section) => (
                <div key={section.anchor}>
                  <Link
                    href={`/categories#${section.anchor}`}
                    className="mb-2 inline-flex text-sm font-extrabold text-ink transition-colors hover:text-accent"
                  >
                    {section.title}
                  </Link>
                  <LinkList
                    links={section.items.map((item) => ({
                      label: item.name,
                      href: item.href || `/category/${item.slug}`,
                    }))}
                  />
                </div>
              ))}
            </div>
          </TreePanel>

          <TreePanel title="Skin Concerns" eyebrow="Concern discovery" icon={HeartPulse}>
            <LinkList
              links={[
                { label: 'All Concerns', href: '/concerns' },
                ...CONCERN_DEFINITIONS.map((concern) => ({
                  label: concern.label,
                  href: getConcernHref(concern.slug),
                  description: concern.description,
                })),
              ]}
            />
          </TreePanel>

          <TreePanel title="Origins" eyebrow="Country browsing" icon={PackageSearch}>
            <LinkList
              links={[
                { label: 'All Origins', href: '/origins' },
                ...ORIGIN_NAV_ITEMS.map((origin) => ({
                  label: origin.name,
                  href: origin.href || `/origins?country=${origin.country}`,
                  description: origin.description,
                })),
              ]}
            />
          </TreePanel>

          <TreePanel title="Offers" eyebrow="Collections" icon={Sparkles}>
            <LinkList links={OFFER_COLLECTIONS.map((offer) => ({
              label: offer.title,
              href: offer.href,
              description: offer.hint,
            }))} />
          </TreePanel>

          <TreePanel title="Support" eyebrow="Help pages" icon={HelpCircle}>
            <LinkList links={SUPPORT_LINKS} />
          </TreePanel>

          <TreePanel title="Content & Trust" eyebrow="About Emart" icon={BookOpen}>
            <LinkList links={STORY_LINKS} />
          </TreePanel>
        </div>

        <section className="mt-6 rounded-lg border border-hairline bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-ink">Search engine sitemap</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  The XML sitemap remains the canonical machine-readable source for Google and other crawlers.
                </p>
              </div>
            </div>
            <Link
              href="/sitemap.xml"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-hairline px-4 text-sm font-bold text-ink transition-colors hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
            >
              <Search className="h-4 w-4" />
              Open XML
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
