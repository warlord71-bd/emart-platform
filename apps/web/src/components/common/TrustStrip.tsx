import { Headphones, ShieldCheck, Truck, WalletCards } from 'lucide-react';

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: '100% Authentic' },
  { icon: Truck, label: 'Fast Bangladesh Delivery' },
  { icon: WalletCards, label: 'COD Available' },
  { icon: Headphones, label: 'Easy Support' },
];

export default function TrustStrip() {
  return (
    <section data-nosnippet className="border-y border-[var(--color-border-soft)] bg-[var(--color-surface-soft)] px-4 py-4">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex min-h-[64px] items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-3 shadow-[var(--shadow-soft)]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
              <Icon size={18} strokeWidth={2.25} />
            </span>
            <span className="text-[13px] font-bold leading-snug text-[var(--color-brand-dark)] sm:text-sm">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
