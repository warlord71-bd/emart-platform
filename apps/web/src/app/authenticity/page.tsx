import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authenticity Promise',
  description: 'How Emart Skincare Bangladesh protects customers with genuine products, careful sourcing, and order support.',
};

const checks = [
  {
    title: 'Trusted Sourcing',
    text: 'Products are selected through known suppliers and brand channels so customers receive genuine skincare, not uncertain stock.',
  },
  {
    title: 'Batch And Packaging Review',
    text: 'Packaging, labels, seals, dates, and product condition are checked before items move into customer orders.',
  },
  {
    title: 'Careful Storage',
    text: 'Items are handled with attention to heat, light, leakage risk, and shelf condition before dispatch.',
  },
  {
    title: 'Support After Delivery',
    text: 'If something looks wrong, the team reviews the order, product photos, and delivery condition with the customer.',
  },
];

const warningSigns = [
  'Price that looks too low compared with the normal market range',
  'Packaging differences without brand explanation',
  'No visible importer, batch, expiry, or manufacturing information where expected',
  'Seller cannot explain product source or after-sale support',
];

export default function AuthenticityPage() {
  return (
    <main className="bg-bg">
      <section className="border-b border-hairline bg-card">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">Genuine Products Only</p>
          <h1 className="mb-4 text-3xl font-extrabold text-ink md:text-4xl">Authenticity Promise</h1>
          <p className="max-w-3xl leading-7 text-muted">
            Skincare touches your face, your routine, and your confidence. Every order deserves genuine products,
            careful handling, and clear help when questions come up.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checks.map((item) => (
            <div key={item.title} className="rounded-2xl border border-hairline bg-card p-5 shadow-card">
              <h2 className="mb-2 text-lg font-bold text-ink">{item.title}</h2>
              <p className="text-sm leading-6 text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent-soft">Shop Smarter</p>
            <h2 className="text-2xl font-bold text-white mb-4">How To Spot Risk Before Buying</h2>
            <p className="leading-7 text-white/72">
              Counterfeit beauty products often look convincing online. A careful check before purchase protects your
              skin, your money, and your routine.
            </p>
          </div>

          <ul className="space-y-3">
            {warningSigns.map((sign) => (
              <li key={sign} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                {sign}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.85fr] gap-8">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-ink">When You Receive Your Order</h2>
            <div className="space-y-4 leading-7 text-muted">
              <p>
                Check the product before opening it fully. If the packaging is damaged, the seal looks unusual, or the
                item does not match your order, contact the team with your order number and clear photos.
              </p>
              <p>
                The team reviews authenticity and delivery concerns case by case. This keeps support fair and protects
                customers from avoidable skincare risk.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-card p-5 shadow-card">
            <h3 className="mb-3 text-lg font-bold text-ink">Need Verification Help?</h3>
            <p className="mb-5 text-sm leading-6 text-muted">
              Send product photos, order details, and your concern. The support team will help you review it.
            </p>
            <Link href="/contact" className="btn-primary inline-flex">
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
