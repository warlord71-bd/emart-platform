import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { COMPANY } from '@/lib/companyProfile';
import { safeJsonLd } from '@/lib/sanitizeHtml';
import { absoluteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: 'About Emart Skincare Bangladesh | Authentic Beauty Since 2018',
  description:
    'Learn about Emart — Bangladesh\'s trusted source for authentic Korean, Japanese, and global skincare. Based in Dhanmondi, Dhaka. Real products, real team, real address.',
  alternates: { canonical: 'https://e-mart.com.bd/about-us' },
  openGraph: {
    title: 'About Emart Skincare Bangladesh',
    description:
      'Emart is a Dhanmondi-based skincare retailer run by a team of 7 focused on authentic global beauty for Bangladesh.',
    url: 'https://e-mart.com.bd/about-us',
    images: [{ url: 'https://e-mart.com.bd/images/hero-products.png', alt: 'Emart skincare store in Dhanmondi' }],
  },
};

const credentials = [
  {
    label: 'Trade Licence',
    value: 'Registered under DNCC, Dhaka',
  },
  {
    label: 'Business Entity',
    value: COMPANY.enterpriseName,
  },
  {
    label: 'Operations',
    value: `${COMPANY.office.area}, Bangladesh`,
  },
  {
    label: 'Team',
    value: `${COMPANY.teamSize} full-time staff`,
  },
  {
    label: 'Office Hours',
    value: COMPANY.officeHours,
  },
  {
    label: 'Support',
    value: COMPANY.supportEmail,
  },
];

const expertise = [
  {
    title: 'Sourcing Expertise',
    body:
      'Every brand on Emart is evaluated for authenticity before listing. We source directly from authorised importers and distributors — not third-party resellers or grey-market intermediaries.',
  },
  {
    title: 'Skincare Knowledge',
    body:
      'Our team reviews ingredients, safety profiles, and product formulations against published brand data. We answer customer questions before and after purchase about ingredients, skin concerns, and routines.',
  },
  {
    title: 'Bangladesh Market Focus',
    body:
      "We focus on products that suit Bangladesh's climate and the skin concerns our customers ask about most — hyperpigmentation, humidity-resilient SPF, oily skin routines, and sensitive skin formulas.",
  },
];

const trustPoints = [
  'Physical office and warehouse in Dhanmondi, Dhaka — verifiable address',
  'Cash on Delivery available nationwide — no pre-payment required to shop',
  'Returns and replacements handled directly by our own support team',
  '100% authentic products — never sourced from grey market or unreliable resellers',
  'Products displayed with accurate ingredient lists, origin, and brand attribution',
  'All product URLs verified in Google Merchant Center for accurate Shopping feed data',
];

const brandFaqs = [
  {
    question: 'Is Emart authentic?',
    answer: `${COMPANY.storeName} focuses on authentic skincare and beauty products sourced through verified supply chains, with support handled by our local team in ${COMPANY.office.area}.`,
  },
  {
    question: 'Where is Emart located in Dhaka?',
    answer: `${COMPANY.storeName} is located at ${COMPANY.office.full}.`,
  },
  {
    question: 'How do I contact Emart?',
    answer: `You can contact ${COMPANY.storeName} on WhatsApp at ${COMPANY.phones.sales}, call ${COMPANY.phones.primary}, or email ${COMPANY.supportEmail}.`,
  },
];

const organizationSchema = {
  '@type': 'Organization',
  '@id': `${absoluteUrl('/about-us')}#organization`,
  name: COMPANY.storeName,
  alternateName: COMPANY.brandName,
  url: absoluteUrl('/'),
  logo: absoluteUrl('/images/logo.png'),
  foundingDate: '2018',
  description: `${COMPANY.storeName} is a Bangladesh-based retailer of authentic Korean, Japanese, and global skincare products, operated by ${COMPANY.enterpriseName} in ${COMPANY.office.area}.`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: COMPANY.shop.streetAddress,
    addressLocality: COMPANY.shop.addressLocality,
    addressRegion: COMPANY.shop.addressRegion,
    postalCode: COMPANY.shop.postalCode,
    addressCountry: COMPANY.shop.addressCountry,
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: COMPANY.phones.primaryHref,
      contactType: 'customer support',
      email: COMPANY.supportEmail,
      areaServed: COMPANY.shop.addressCountry,
      availableLanguage: ['en', 'bn'],
    },
    {
      '@type': 'ContactPoint',
      telephone: COMPANY.phones.salesHref,
      contactType: 'sales',
      areaServed: COMPANY.shop.addressCountry,
      availableLanguage: ['en', 'bn'],
    },
  ],
  sameAs: Object.values(COMPANY.social),
};

const aboutPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${absoluteUrl('/about-us')}#about-page`,
  url: absoluteUrl('/about-us'),
  name: `About ${COMPANY.storeName}`,
  mainEntity: {
    '@id': `${absoluteUrl('/about-us')}#organization`,
  },
  about: organizationSchema,
};

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: COMPANY.founderName,
  url: COMPANY.founderUrl,
  jobTitle: 'Founder',
  worksFor: {
    '@type': 'Organization',
    name: COMPANY.storeName,
    url: absoluteUrl('/'),
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: brandFaqs.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: answer,
    },
  })),
};

export default function AboutUsPage() {
  return (
    <main className="bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(aboutPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }} />

      {/* Hero */}
      <section className="border-b border-hairline bg-card">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">{COMPANY.enterpriseName}</p>
          <h1 className="mb-4 text-3xl font-extrabold text-ink md:text-4xl">About Emart</h1>
          <p className="max-w-2xl leading-7 text-muted">
            {COMPANY.brandName} is a Dhanmondi-based skincare retailer focused on one thing: getting genuine global
            beauty products into the hands of customers in Bangladesh — without fakes, markups, or confusion.
          </p>
        </div>
      </section>

      {/* Who We Are */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-ink">Who We Are</h2>
            <div className="space-y-4 leading-7 text-muted">
              <p>
                {COMPANY.brandName} was founded by{' '}
                <a
                  href={COMPANY.founderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent hover:underline"
                >
                  {COMPANY.founderName}
                </a>{' '}
                as part of {COMPANY.enterpriseName}. The business grew from a practical observation: customers in
                Bangladesh wanted trusted Korean, Japanese, and international beauty products but had no reliable local
                source to verify authenticity and get support.
              </p>
              <p>
                Today, {COMPANY.teamSize} full-time team members run day-to-day operations — covering sourcing,
                quality checks, customer support, packing, and dispatch — from our office at{' '}
                <strong>{COMPANY.office.line1}, {COMPANY.office.area}</strong> and warehouse at{' '}
                <strong>{COMPANY.warehouse.line1}, {COMPANY.warehouse.area}</strong>.
              </p>
              <p>
                Emart has been operating from Dhanmondi, Dhaka since 2018 with a team of {COMPANY.teamSize}.
              </p>
              <p>
                We carry products from brands like COSRX, The Ordinary, La Roche-Posay, Laneige, Beauty of Joseon,
                CeraVe, Nivea, and 200+ more — all imported through authorised supply chains, not grey market or
                unverified resellers.
              </p>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="overflow-hidden rounded-2xl shadow-card">
              <Image
                src="/images/store-interior.webp"
                alt="Emart skincare store interior in Dhanmondi, Dhaka — shelves with authentic Korean and global beauty products"
                width={923}
                height={671}
                className="w-full object-cover"
              />
            </div>
          </aside>
        </div>
      </section>

      {/* Credentials */}
      <section className="border-y border-hairline bg-card">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="mb-6 text-2xl font-bold text-ink">Business Credentials</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {credentials.map((c) => (
              <div key={c.label} className="rounded-xl border border-hairline bg-bg p-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">{c.label}</p>
                <p className="text-sm font-semibold text-ink">{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-6 text-2xl font-bold text-ink">Our Expertise</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {expertise.map((e) => (
            <div key={e.title} className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
              <h3 className="mb-3 font-bold text-ink">{e.title}</h3>
              <p className="text-sm leading-6 text-muted">{e.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust signals */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="mb-6 text-2xl font-bold text-white">Why Customers Trust Us</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-white/80">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Location */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-6 text-2xl font-bold text-ink">Find Us</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
            <h3 className="mb-1 font-bold text-ink">Shop &amp; Warehouse</h3>
            <address className="not-italic text-sm text-muted leading-6">
              {COMPANY.warehouse.line1}<br />
              {COMPANY.warehouse.line2}<br />
              {COMPANY.warehouse.area}<br />
              {COMPANY.warehouse.country}
            </address>
          </div>
          <div className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
            <h3 className="mb-1 font-bold text-ink">Hours &amp; Contact</h3>
            <p className="text-sm text-muted leading-6">
              {COMPANY.officeHours}<br />
              Friday: Closed<br />
              <a href={`tel:${COMPANY.phones.hotlineHref}`} className="text-accent hover:underline">{COMPANY.phones.hotline}</a><br />
              <a href={`mailto:${COMPANY.supportEmail}`} className="text-accent hover:underline">{COMPANY.supportEmail}</a>
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">
          Office hours: <strong className="text-ink">{COMPANY.officeHours}</strong>. Walk-ins are welcome for
          collection or product queries.
        </p>
      </section>

      {/* Brand FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-6 text-2xl font-bold text-ink">Emart FAQ</h2>
        <div className="space-y-3">
          {brandFaqs.map((faq) => (
            <details key={faq.question} className="group overflow-hidden rounded-2xl border border-hairline bg-card shadow-card">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-left font-semibold text-ink transition-colors hover:bg-bg-alt [&::-webkit-details-marker]:hidden">
                <span>{faq.question}</span>
                <span className="text-accent transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="border-t border-hairline px-5 py-4 text-sm leading-6 text-muted">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-card p-6 shadow-card md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="mb-1 text-xl font-bold text-ink">Have questions before you order?</h2>
            <p className="text-sm text-muted">
              Contact our team — we help narrow down the right product for your skin before you buy.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/contact" className="btn-primary text-center">
              Contact Us
            </Link>
            <Link href="/shop" className="btn-outline text-center">
              Shop Now
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
