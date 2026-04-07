import Link from 'next/link';
import Image from 'next/image';

const SHOP_LINKS = [
  { label: 'All Products', href: '/shop' },
  { label: 'Face Care', href: '/category/face-cleansers' },
  { label: 'Sunscreen & SPF', href: '/category/sunscreen' },
  { label: 'Serum & Toner', href: '/category/serums-ampoules-essences' },
  { label: 'Moisturizer', href: '/category/moisturizer' },
  { label: '🔥 Sale', href: '/sale' },
  { label: '✨ New Arrivals', href: '/new-arrivals' },
];

const HELP_LINKS = [
  { label: 'My Account', href: '/account' },
  { label: 'Track My Order', href: '/track-order' },
  { label: 'Return & Refund', href: '/return-policy' },
  { label: 'Shipping Policy', href: '/shipping-policy' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'About Us', href: '/about-us' },
];

const PAYMENT_METHODS = [
  { name: 'bKash', bg: '#E2136E', text: '#fff', short: 'b' },
  { name: 'Nagad', bg: '#F26522', text: '#fff', short: 'N' },
  { name: 'Rocket', bg: '#8B2FC9', text: '#fff', short: 'R' },
  { name: 'VISA', bg: '#1A1F71', text: '#fff', short: 'VISA' },
  { name: 'Mastercard', bg: '#EB001B', text: '#fff', short: 'MC' },
  { name: 'COD', bg: '#16a34a', text: '#fff', short: '₹' },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand Column */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image src="/images/logo.png" alt="Emart" width={44} height={44} className="rounded-xl" />
              <div>
                <div className="font-extrabold text-[#1a1a2e]">Emart Skincare</div>
                <div className="text-[#e8197a] text-xs font-bold tracking-widest uppercase">Bangladesh</div>
              </div>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Bangladesh&apos;s #1 destination for authentic Korean & Japanese skincare.
              Every product 100% genuine.
            </p>
            {/* Social Icons */}
            <div className="flex gap-2">
              {/* Facebook */}
              <a
                href="https://www.facebook.com/emartbd.official"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                style={{ background: '#1877f2' }}
                aria-label="Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* WhatsApp */}
              <a
                href="https://wa.me/8801919797399"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                style={{ background: '#25d366' }}
                aria-label="WhatsApp"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-bold text-[#1a1a2e] text-sm uppercase tracking-wide mb-4 pb-2 border-b-2 border-[#e8197a] inline-block">Shop</h3>
            <ul className="space-y-2">
              {SHOP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-[#e8197a] transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="font-bold text-[#1a1a2e] text-sm uppercase tracking-wide mb-4 pb-2 border-b-2 border-[#e8197a] inline-block">Help</h3>
            <ul className="space-y-2">
              {HELP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-[#e8197a] transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-[#1a1a2e] text-sm uppercase tracking-wide mb-4 pb-2 border-b-2 border-[#e8197a] inline-block">Contact</h3>
            <div className="space-y-3 text-sm text-gray-500">
              <div>📍 17, Central Road (Near Ideal College)<br />Dhanmondi, Dhaka-1205</div>
              <div>📞 <a href="tel:+8809697597399" className="text-[#e8197a] font-semibold">+880 9697-597399</a></div>
              <div>✉️ <a href="mailto:emart.bdofficial@gmail.com" className="text-[#e8197a]">emart.bdofficial@gmail.com</a></div>
              <div>🕘 Sat–Thu: 9:00 AM – 9:00 PM</div>
              <div className="pt-2">
                <div className="font-medium text-gray-600 mb-1">Mobile Payment:</div>
                <div>bKash: <strong className="text-[#E2136E]">01919-797399</strong></div>
                <div>Nagad: <strong className="text-[#F26522]">01919-797399</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Strip */}
      <div className="border-t border-gray-100 bg-gray-50 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mr-1">We Accept:</span>
            {PAYMENT_METHODS.map((p) => (
              <span
                key={p.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold"
                style={{ background: p.bg, color: p.text }}
              >
                {p.name}
              </span>
            ))}
          </div>
          <div className="flex gap-3 text-xs text-gray-400">
            <span>🚚 Free delivery ৳3,000+</span>
            <span>⚡ Dhaka Next Day</span>
            <span>🇧🇩 Nationwide</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#1a1a2e] text-gray-400 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <p>© 2026 <a href="/" className="text-[#e8197a] font-semibold">Emart Skincare Bangladesh</a>. All rights reserved.</p>
          <div className="flex gap-4">
            {[
              { label: 'Privacy', href: '/privacy-policy' },
              { label: 'Terms', href: '/terms-conditions' },
              { label: 'Returns', href: '/return-policy' },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-[#e8197a] transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
