import Link from 'next/link';
import Image from 'next/image';

const SHOP_LINKS = [
  { label: 'All Products', href: '/shop' },
  { label: 'Face Care', href: '/category/face-care' },
  { label: 'Sunscreen & SPF', href: '/category/sunscreen' },
  { label: 'Serum & Toner', href: '/category/serum-toner' },
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

const SOCIALS = [
  { label: 'Facebook', href: 'https://www.facebook.com/emartbd.official', color: '#1877f2', icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
  { label: 'WhatsApp', href: 'https://wa.me/8801919797399', color: '#25d366', icon: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.57-.01-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z' },
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
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Bangladesh's #1 destination for authentic Korean & Japanese skincare.
              Every product 100% genuine.
            </p>
            <div className="flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                  style={{ background: s.color }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d={s.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-bold text-[#1a1a2e] text-sm uppercase tracking-wide mb-4
                           pb-2 border-b-2 border-[#e8197a] inline-block">Shop</h3>
            <ul className="space-y-2">
              {SHOP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm text-gray-500 hover:text-[#e8197a] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="font-bold text-[#1a1a2e] text-sm uppercase tracking-wide mb-4
                           pb-2 border-b-2 border-[#e8197a] inline-block">Help</h3>
            <ul className="space-y-2">
              {HELP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm text-gray-500 hover:text-[#e8197a] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-[#1a1a2e] text-sm uppercase tracking-wide mb-4
                           pb-2 border-b-2 border-[#e8197a] inline-block">Contact</h3>
            <div className="space-y-3 text-sm text-gray-500">
              <div>📍 17, Central Road (Near Ideal College)<br />Dhanmondi, Dhaka-1205</div>
              <div>
                📞 <a href="tel:+8809697597399" className="text-[#e8197a] font-semibold">+880 9697-597399</a>
              </div>
              <div>✉️ <a href="mailto:emart.bdofficial@gmail.com" className="text-[#e8197a]">emart.bdofficial@gmail.com</a></div>
              <div>🕘 Sat–Thu: 9:00 AM – 9:00 PM</div>
              <div className="pt-2">
                <div className="font-medium text-gray-600 mb-1">bKash & Nagad Merchant:</div>
                <div>bKash: <strong className="text-[#e2136e]">01919-797399</strong></div>
                <div>Nagad: <strong className="text-[#f26522]">01919-797399</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Strip */}
      <div className="border-t border-gray-100 bg-gray-50 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">We Accept:</span>
            {['bKash', 'Nagad', 'Rocket', 'VISA', 'Mastercard', 'COD'].map((p) => (
              <span key={p} className="text-xs font-bold border border-gray-300 rounded px-2 py-1 bg-white">
                {p}
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
          <p>© 2025 <a href="/" className="text-[#e8197a] font-semibold">Emart Skincare Bangladesh</a>. All rights reserved.</p>
          <div className="flex gap-4">
            {[
              { label: 'Privacy', href: '/privacy-policy' },
              { label: 'Terms', href: '/terms-conditions' },
              { label: 'Returns', href: '/return-policy' },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-[#e8197a] transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
