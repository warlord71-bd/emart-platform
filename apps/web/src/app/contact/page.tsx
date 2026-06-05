import type { Metadata } from 'next';
import { COMPANY } from '@/lib/companyProfile';
import { absoluteUrl } from '@/lib/siteUrl';
import { safeJsonLd } from '@/lib/sanitizeHtml';

const CONTACT_ADDRESS = COMPANY.warehouse.full;
const ENCODED_CONTACT_ADDRESS = encodeURIComponent(CONTACT_ADDRESS);
const { latitude: LAT, longitude: LNG } = COMPANY.shop.geo;
const BBOX = `${LNG - 0.005},${LAT - 0.003},${LNG + 0.005},${LAT + 0.003}`;
const MAP_EMBED_URL = `https://www.openstreetmap.org/export/embed.html?bbox=${BBOX}&layer=mapnik&marker=${LAT},${LNG}`;
const GOOGLE_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${ENCODED_CONTACT_ADDRESS}`;
const GOOGLE_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${ENCODED_CONTACT_ADDRESS}`;

export const metadata: Metadata = {
  title: 'Contact Emart Skincare Bangladesh | Dhanmondi, Dhaka',
  description: 'Contact Emart — authentic skincare delivered across Bangladesh. Visit our Dhanmondi shop, WhatsApp us, or email support@e-mart.com.bd. Open Sat–Thu 9am–9pm.',
  alternates: { canonical: 'https://e-mart.com.bd/contact' },
};

const contactSchema = {
  '@context': 'https://schema.org',
  '@type': ['OnlineStore', 'LocalBusiness'],
  '@id': `${absoluteUrl('/contact')}#contact-business`,
  name: COMPANY.storeName,
  alternateName: COMPANY.brandName,
  url: absoluteUrl('/contact'),
  image: absoluteUrl('/images/logo.png'),
  logo: absoluteUrl('/images/logo.png'),
  email: COMPANY.supportEmail,
  telephone: COMPANY.phones.primaryHref,
  priceRange: 'BDT',
  address: {
    '@type': 'PostalAddress',
    streetAddress: COMPANY.shop.streetAddress,
    addressLocality: COMPANY.shop.addressLocality,
    addressRegion: COMPANY.shop.addressRegion,
    postalCode: COMPANY.shop.postalCode,
    addressCountry: COMPANY.shop.addressCountry,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: COMPANY.shop.geo.latitude,
    longitude: COMPANY.shop.geo.longitude,
  },
  areaServed: {
    '@type': 'Country',
    name: COMPANY.office.country,
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
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'https://schema.org/Saturday',
        'https://schema.org/Sunday',
        'https://schema.org/Monday',
        'https://schema.org/Tuesday',
        'https://schema.org/Wednesday',
        'https://schema.org/Thursday',
      ],
      opens: '09:00',
      closes: '21:00',
      description: COMPANY.officeHours,
    },
  ],
  sameAs: [
    COMPANY.social.facebook,
    COMPANY.social.youtube,
    COMPANY.social.instagram,
  ],
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(contactSchema) }} />
      <h1 className="mb-6 text-2xl font-bold text-ink">Contact Us</h1>

      <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Contact Form */}
        <div className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-ink">Send us a Message</h2>
          <a
            href={COMPANY.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 block w-full rounded-xl bg-[#25D366] px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-[#1fb957]"
          >
            Message us on WhatsApp for instant reply
          </a>
          <p className="mb-4 rounded-lg border border-brass/30 bg-brass-soft px-3 py-2 text-sm text-ink-2">
            The form opens your email app and sends to {COMPANY.supportEmail}. For the fastest reply, use WhatsApp.
          </p>
          <form action={`mailto:${COMPANY.supportEmail}`} method="post" encType="text/plain" className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">Name</label>
              <input type="text" name="name" className="w-full rounded-lg border border-hairline bg-card px-3 py-2 text-ink focus:border-accent" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">Email</label>
              <input type="email" name="email" className="w-full rounded-lg border border-hairline bg-card px-3 py-2 text-ink focus:border-accent" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">Message</label>
              <textarea name="message" rows={4} className="w-full rounded-lg border border-hairline bg-card px-3 py-2 text-ink focus:border-accent" required></textarea>
            </div>
            <button type="submit" className="w-full rounded-xl bg-ink py-2.5 font-semibold text-white transition-colors hover:bg-black">
              Email Support
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-ink">Get in Touch</h2>
          <div className="space-y-4 text-sm text-muted">
            <div>
              <p className="mb-1 font-semibold text-ink">📍 Shop &amp; Office</p>
              <p>{COMPANY.office.line1}<br />{COMPANY.office.line2}<br />{COMPANY.office.area}<br />{COMPANY.office.country}</p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-ink">📦 Warehouse &amp; Pickup</p>
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

      {/* Google Maps embed */}
      <div className="rounded-2xl border border-hairline bg-card shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline">
          <h2 className="text-lg font-semibold text-ink">Find Our Shop</h2>
          <p className="text-sm text-muted mt-0.5">{CONTACT_ADDRESS}</p>
        </div>
        <iframe
          title="Emart Skincare Bangladesh — Shop Location"
          src={MAP_EMBED_URL}
          width="100%"
          height="400"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full border-0 block"
        />
        <div className="px-6 py-3 flex gap-4 text-sm">
          <a
            href={GOOGLE_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline font-medium"
          >
            Open in Google Maps →
          </a>
          <a
            href={GOOGLE_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-accent hover:underline"
          >
            Get Directions
          </a>
        </div>
      </div>
    </div>
  );
}
