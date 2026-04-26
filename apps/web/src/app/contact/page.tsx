import type { Metadata } from 'next';
import { COMPANY } from '@/lib/companyProfile';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Contact ${COMPANY.storeName} for customer support, office help, warehouse coordination, or order questions.`,
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink">Contact Us</h1>

      <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Contact Form */}
        <div className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-ink">Send us a Message</h2>
          <form className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">Name</label>
              <input type="text" className="w-full rounded-lg border border-hairline bg-card px-3 py-2 text-ink focus:border-accent" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">Email</label>
              <input type="email" className="w-full rounded-lg border border-hairline bg-card px-3 py-2 text-ink focus:border-accent" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">Message</label>
              <textarea rows={4} className="w-full rounded-lg border border-hairline bg-card px-3 py-2 text-ink focus:border-accent" required></textarea>
            </div>
            <button type="submit" className="w-full rounded-xl bg-ink py-2.5 font-semibold text-white transition-colors hover:bg-black">
              Send Message
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-ink">Get in Touch</h2>
          <div className="space-y-4 text-sm text-muted">
            <div>
              <p className="mb-1 font-semibold text-ink">📍 Office</p>
              <p>{COMPANY.office.line1}<br />{COMPANY.office.line2}<br />{COMPANY.office.area}<br />{COMPANY.office.country}</p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-ink">📦 Warehouse</p>
              <p>{COMPANY.warehouse.line1}<br />{COMPANY.warehouse.line2}<br />{COMPANY.warehouse.area}<br />{COMPANY.warehouse.country}</p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-ink">📞 Phone</p>
              <p>
                <a href={`tel:${COMPANY.phones.primaryHref}`} className="text-accent hover:underline">{COMPANY.phones.primary}</a><br />
                <a href={`tel:${COMPANY.phones.salesHref}`} className="text-accent hover:underline">{COMPANY.phones.sales}</a><br />
                <a href={`tel:${COMPANY.phones.hotlineHref}`} className="text-accent hover:underline">{COMPANY.phones.hotline}</a>
              </p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-ink">✉️ Email</p>
              <p><a href={`mailto:${COMPANY.supportEmail}`} className="text-accent hover:underline">{COMPANY.supportEmail}</a></p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-ink">🕘 Hours</p>
              <p>{COMPANY.officeHours}<br />Friday: Closed</p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-ink">💳 Payment Methods</p>
              <p>bKash: <strong>{COMPANY.payment.bkash}</strong><br />Nagad: <strong>{COMPANY.payment.nagad}</strong><br />Cash on Delivery (COD)</p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-ink">🏢 Company</p>
              <p>{COMPANY.storeName} is an enterprise of {COMPANY.enterpriseName}, founded by <a href={COMPANY.founderUrl} className="text-accent hover:underline">{COMPANY.founderName}</a>.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
