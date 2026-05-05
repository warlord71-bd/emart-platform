'use client';

import { CreditCard, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { useCategoryPageI18n } from './categoryPageI18n';

export default function TrustStrip() {
  const { t } = useCategoryPageI18n();
  const items = [
    { icon: Truck, label: t('trustDelivery') },
    { icon: ShieldCheck, label: t('trustAuthentic') },
    { icon: RotateCcw, label: t('trustReturn') },
    { icon: CreditCard, label: t('trustPayment') },
  ];
  return (
    <section data-nosnippet className="border-y border-[var(--mb-line)] bg-[var(--mb-paper)]">
      <div className="mb-container grid grid-cols-2 gap-px py-3 sm:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 px-2 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--mb-pink-bg)] text-[var(--mb-pink)]">
                <Icon size={17} />
              </span>
              <span className="text-sm font-bold leading-tight text-[var(--mb-ink)]">{item.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
