import Link from 'next/link';
import Image from 'next/image';
import { BadgePercent, BookOpen, Boxes, Clock3, Droplets, HeartHandshake, HelpCircle, Mail, MapPin, PackageCheck, Phone, RotateCcw, SearchCheck, ShieldCheck, Smartphone, Sparkles, SprayCan, Tags, Truck, WalletCards, type LucideIcon } from 'lucide-react';
import { COMPANY } from '@/lib/companyProfile';
import SignupTabs from './SignupTabs';

interface FooterLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

const SHOP_LINKS: FooterLink[] = [
  { label: 'Sunscreen & SPF', href: '/category/sunscreen', icon: ShieldCheck },
  { label: 'Serums & Ampoules', href: '/category/serums-ampoules-essences', icon: Droplets },
  { label: 'Hair Care', href: '/category/hair-care', icon: Sparkles },
  { label: 'Makeup', href: '/category/makeup-cosmetics', icon: SprayCan },
  { label: 'Bath & Body', href: '/category/bath-body', icon: HeartHandshake },
  { label: 'Mother & Baby', href: '/category/mother-baby-care', icon: Boxes },
  { label: 'Health & Wellness', href: '/category/health-wellbeing', icon: PackageCheck },
  { label: 'New Arrivals', href: '/new-arrivals', icon: Sparkles },
  { label: 'Sale', href: '/sale', icon: BadgePercent },
  { label: 'All Brands', href: '/brands', icon: Tags },
];

const SUPPORT_LINKS: FooterLink[] = [
  { label: 'Editorial', href: '/blog', icon: BookOpen },
  { label: 'FAQs', href: '/faq', icon: HelpCircle },
  { label: 'Sitemap', href: '/sitemap', icon: SearchCheck },
  { label: 'Shipping & Delivery', href: '/shipping-policy', icon: Truck },
  { label: 'Refund & Return Policy', href: '/return-policy', icon: RotateCcw },
  { label: 'Track My Order', href: '/track-order', icon: SearchCheck },
  { label: 'Privacy Policy', href: '/privacy-policy', icon: ShieldCheck },
];

const ABOUT_LINKS = [
  { label: 'Our Story', href: '/our-story' },
  { label: 'Authenticity', href: '/authenticity' },
  { label: 'Join Our Team', href: '/join-our-team' },
];

const SOCIALS = [
  { label: 'Facebook', href: COMPANY.social.facebook, bg: '#1877F2',
    path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
  { label: 'Instagram', href: COMPANY.social.instagram, bg: '#E4405F', ig: true },
  { label: 'YouTube', href: COMPANY.social.youtube, bg: '#FF0000', yt: true },
  { label: 'Telegram', href: COMPANY.social.telegram, bg: '#0088cc', tg: true },
  { label: 'WhatsApp', href: COMPANY.whatsappHref, bg: '#25D366', wa: true },
  { label: 'X', href: COMPANY.social.x, bg: '#000',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z' },

];

function SocialIcon({ s }: { s: typeof SOCIALS[0] }) {
  if (s.ig) return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/>
    </svg>
  );
  if (s.yt) return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
      <path d="M23 7s-.3-2-1.2-2.7c-1.1-1.2-2.4-1.2-3-1.3C16.1 3 12 3 12 3s-4.1 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.3v2c0 2.1.3 4.3.3 4.3s.3 2 1.2 2.7c1.1 1.2 2.6 1.1 3.3 1.2C7.3 21.7 12 21.7 12 21.7s4.1 0 6.8-.3c.6-.1 1.9-.1 3-1.3.9-.7 1.2-2.7 1.2-2.7s.3-2.1.3-4.3v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l6.6 3.6-6.6 3.5z"/>
    </svg>
  );
  if (s.tg) return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
    </svg>
  );
  if (s.wa) return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
      <path d={s.path || ''}/>
    </svg>
  );
}

export default async function Footer() {
  return (
    <footer className="bg-ink text-bg-alt">
      <SignupTabs />

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand Column */}
          <div className="">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image src="/logo.png" alt="Emart Skincare Bangladesh" width={44} height={44} className="rounded-xl" />
              <div>
                <div className="font-extrabold text-white">{COMPANY.brandName}</div>
                <div className="text-accent text-xs font-bold tracking-widest uppercase">Emart Skincare Bangladesh</div>
              </div>
            </Link>
            <p className="text-sm text-bg-stone/80 leading-relaxed mb-4">
              {COMPANY.storeName} is an enterprise of {COMPANY.enterpriseName}. We source authentic global beauty,
              verify every order in Dhanmondi, and support customers across Bangladesh with a local team that cares.
            </p>
            <div className="mb-4 space-y-2">
              {ABOUT_LINKS.map((l) => (
                <div key={l.href}>
                  <Link href={l.href} className="text-sm text-bg-stone/80 hover:text-accent transition-colors">
                    {l.label}
                  </Link>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs font-bold text-bg-stone/80 uppercase tracking-wide mb-3">Share Your Love</div>
              <div className="flex flex-wrap gap-2">
                {SOCIALS.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    title={s.label}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{ background: s.bg }}>
                    <SocialIcon s={s} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-widest mb-4 pb-2 border-b border-white/10">
              Shop
            </h3>
            <ul className="space-y-2">
              {SHOP_LINKS.map((l) => {
                const Icon = l.icon;
                return (
                  <li key={l.href}>
                    <Link href={l.href} className="group flex items-center gap-2 text-sm text-bg-stone/80 transition-colors hover:text-accent">
                      <Icon size={14} strokeWidth={2.2} className="shrink-0 text-accent/70 transition-colors group-hover:text-accent" />
                      <span>{l.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-widest mb-4 pb-2 border-b border-white/10">
              Support
            </h3>
            <ul className="space-y-2">
              {SUPPORT_LINKS.map((l) => {
                const Icon = l.icon;
                return (
                  <li key={l.href}>
                    <Link href={l.href} className="group flex items-center gap-2 text-sm text-bg-stone/80 transition-colors hover:text-accent">
                      <Icon size={14} strokeWidth={2.2} className="shrink-0 text-accent/70 transition-colors group-hover:text-accent" />
                      <span>{l.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-widest mb-4 pb-2 border-b border-white/10">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-bg-stone/80">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/7 text-accent">
                  <MapPin size={16} />
                </span>
                <span>{COMPANY.office.line1} {COMPANY.office.line2}<br />{COMPANY.office.area}</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/7 text-accent">
                  <Phone size={16} />
                </span>
                <span className="space-y-1">
                  <a href={`tel:${COMPANY.phones.salesHref}`} className="block font-semibold text-white hover:text-accent">{COMPANY.phones.sales}</a>
                  <a href={`tel:${COMPANY.phones.primaryHref}`} className="block hover:text-accent">{COMPANY.phones.primary}</a>
                  <a href={`tel:${COMPANY.phones.hotlineHref}`} className="block hover:text-accent">{COMPANY.phones.hotline}</a>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/15 text-[#25D366]">
                  <Smartphone size={16} />
                </span>
                <span>
                  <a href={COMPANY.whatsappHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:text-accent">WhatsApp: {COMPANY.phones.sales} — Primary business support</a>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/7 text-accent">
                  <Mail size={16} />
                </span>
                <a href={`mailto:${COMPANY.supportEmail}`} className="min-w-0 break-all hover:text-accent">{COMPANY.supportEmail}</a>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/7 text-accent">
                  <Clock3 size={16} />
                </span>
                <span>{COMPANY.officeHours}</span>
              </li>
              <li className="flex gap-3 pt-1">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/7 text-accent">
                  <WalletCards size={16} />
                </span>
                <span>
                  <span className="font-semibold text-white">bKash &amp; Nagad</span><br />
                  <span className="font-bold text-accent">{COMPANY.payment.bkash}</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Strip */}
      <div className="border-t border-white/10 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex w-full min-w-0 flex-col items-center gap-2 sm:w-auto sm:flex-row sm:gap-3">
            <span className="text-xs font-bold text-bg-stone/80 uppercase tracking-wide whitespace-nowrap">We Accept:</span>
            <Image src="/images/payment-methods.png" alt="Payment Methods" width={400} height={40}
              className="h-auto max-h-7 w-full max-w-[280px] object-contain sm:h-8 sm:w-auto sm:max-w-none" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-bg-stone/80 sm:gap-6">
            <span>🚚 Free delivery ৳3,000+</span>
            <span>⚡ Dhaka Next Day</span>
            <span>🌍 Nationwide</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-2">
          <span>© 2025 <Link href="/" className="hover:text-accent">{COMPANY.storeName}</Link>. An enterprise of {COMPANY.enterpriseName}.</span>
          <div className="flex gap-4">
            <Link href="/authenticity" className="hover:text-accent">Authenticity</Link>
            <Link href="/terms-conditions" className="hover:text-accent">Terms</Link>
            <Link href="/privacy-policy" className="hover:text-accent">Privacy</Link>
            <Link href="/return-policy" className="hover:text-accent">Returns</Link>
            <Link href="/faq" className="hover:text-accent">FAQs</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
