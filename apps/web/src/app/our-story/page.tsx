import Link from 'next/link';
import type { Metadata } from 'next';
import { COMPANY } from '@/lib/companyProfile';

export const metadata: Metadata = {
  title: 'Our Story',
  description: `The story of ${COMPANY.storeName}, founded by ${COMPANY.founderName} and built in Dhanmondi under ${COMPANY.enterpriseName}.`,
};

const milestones = [
  {
    title: 'Started With Trust',
    text: `${COMPANY.brandName} began with one practical promise: customers in Bangladesh should not have to guess whether a beauty product is real.`,
  },
  {
    title: 'Built Around Better Choices',
    text: 'Every category is shaped around real routines, common skin concerns, and brands customers ask for again and again.',
  },
  {
    title: 'Growing With The Community',
    text: 'From Dhanmondi operations to nationwide orders, the goal stays the same: authentic products, clear guidance, and careful service.',
  },
];

const values = [
  'Authentic global skincare brands',
  'Helpful product guidance before and after purchase',
  'Fair pricing with clear delivery and payment options',
  'A local team that understands Bangladesh customers',
];

export default function OurStoryPage() {
  return (
    <main className="bg-bg">
      <section className="border-b border-hairline bg-card">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">{COMPANY.storeName}</p>
          <h1 className="mb-4 text-3xl font-extrabold text-ink md:text-4xl">Our Story</h1>
          <p className="max-w-3xl leading-7 text-muted">
            Emart was created for people who love skincare but want confidence before they buy. The promise is simple:
            genuine products, thoughtful selection, and support that feels close to home.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-ink">Made For Skincare Shoppers In Bangladesh</h2>
            <div className="space-y-4 leading-7 text-muted">
              <p>
                {COMPANY.brandName} was founded by {COMPANY.founderName} as part of {COMPANY.enterpriseName} to solve a very local problem:
                customers wanted trusted global beauty products without fake-product anxiety, confusing sellers, or weak support.
              </p>
              <p>
                The business now runs from an office at {COMPANY.office.line1}, {COMPANY.office.line2}, with warehouse
                operations nearby at {COMPANY.warehouse.line1}. The team may be small, but the standard is not:
                every order should feel verified, understandable, and properly supported.
              </p>
              <p>
                Today, {COMPANY.teamSize} permanent employees keep the daily work moving across sourcing, support, checking,
                packing, and customer communication. That local operating discipline is what turns a beauty store into a trusted one.
              </p>
            </div>
          </div>

          <aside className="rounded-2xl border border-hairline bg-card p-5 shadow-card">
            <h3 className="mb-4 text-lg font-bold text-ink">What We Stand For</h3>
            <ul className="space-y-3">
              {values.map((value) => (
                <li key={value} className="flex gap-3 text-sm text-muted">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <span>{value}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-2xl font-bold text-white mb-6">How The Journey Continues</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {milestones.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm leading-6 text-white/72">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-card p-5 shadow-card md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="mb-2 text-xl font-bold text-ink">Need help choosing your routine?</h2>
            <p className="text-sm text-muted">Talk to the team before ordering, visit the office, or contact support for help.</p>
          </div>
          <Link href="/contact" className="btn-primary text-center">
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}
