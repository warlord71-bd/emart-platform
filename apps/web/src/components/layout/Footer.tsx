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
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/emartbd.official',
    color: '#1877f2',
    emoji: '📘',
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/8801919797399',
    color: '#25d366',
    emoji: '💬',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/emartbd',
    color: '#E4405F',
    emoji: '📷',
  },
];

export default function Footer() {
  const PAYMENT_METHODS = [
    { name: 'bKash', emoji: '📱', color: 'text-pink-600' },
    { name: 'Nagad', emoji: '💳', color: 'text-orange-600' },
    { name: 'Visa', emoji: '💳', color: 'text-blue-600' },
    { name: 'COD', emoji: '💵', color: 'text-green-600' },
  ];

  return (
    <footer className="bg-white border-t border-gray-100">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand Column */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image src="http://5.189.188.229/wp-content/uploads/2026/03/logo.png" alt="Emart" width={44} height={44} className="rounded-xl" />
              <div>
                <div className="font-extrabold text-[#1a1a2e]">Emart Skincare</div>
                <div className="text-[#e8197a] text-xs font-bold tracking-widest uppercase">Bangladesh</div>
              </div>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Bangladesh's #1 destination for authentic Korean & Japanese skincare.
              Every product 100% genuine.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg hover:scale-110 transition-transform"
                  style={{ background: s.color }}
                  title={s.label}
                >
                  {s.emoji}
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

      {/* Payment Methods Strip */}
      <div className="border-t border-gray-100 bg-white py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Payment Methods */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">We Accept:</span>
              <div className="flex flex-wrap gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <div
                    key={method.name}
                    className="flex items-center justify-center w-14 h-10 border-2 border-gray-200 rounded-lg hover:border-[#e8197a] transition-colors bg-gray-50"
                  >
                    <div className={`text-lg font-bold ${method.color}`}>
                      {method.emoji} {method.name === 'bKash' || method.name === 'Nagad' ? method.name.substring(0, 2) : method.emoji}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="flex gap-4 text-xs text-gray-500">
              <span>🚚 Free ৳1,499+</span>
              <span>⚡ Dhaka Next Day</span>
              <span>🇧🇩 Nationwide</span>
            </div>
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
