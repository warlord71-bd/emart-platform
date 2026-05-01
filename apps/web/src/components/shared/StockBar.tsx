'use client';

import { useCategoryPageI18n } from '@/components/categories/categoryPageI18n';

export default function StockBar({
  sold,
  total,
}: {
  sold: number;
  total: number;
}) {
  const { t, n } = useCategoryPageI18n();
  const safeTotal = Math.max(1, total);
  const safeSold = Math.max(0, Math.min(sold, safeTotal));
  const pct = Math.round((safeSold / safeTotal) * 100);
  const remaining = Math.max(0, safeTotal - safeSold);
  const urgent = remaining < 10;
  const hot = pct > 80;

  return (
    <div className={urgent ? 'mb-stock-pulse rounded-[var(--mb-radius-sm)]' : ''}>
      <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[var(--mb-ink-2)]">
        <span>🔥 {n(safeSold)} {t('sold')}</span>
        <span className={urgent ? 'text-[var(--mb-danger)]' : ''}>{n(remaining)} {t('left')}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--mb-line)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: hot
              ? 'var(--mb-danger)'
              : 'linear-gradient(90deg, var(--mb-gold), var(--mb-gold-soft))',
          }}
        />
      </div>
    </div>
  );
}
