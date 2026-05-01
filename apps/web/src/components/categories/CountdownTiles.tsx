'use client';

import { splitCountdown } from '@/lib/realtime/flash-context';

export default function CountdownTiles({ seconds }: { seconds: number }) {
  const parts = splitCountdown(seconds);
  return (
    <div className="flex items-center gap-2">
      {[
        ['HH', parts.hours],
        ['MM', parts.minutes],
        ['SS', parts.seconds],
      ].map(([label, value]) => (
        <div key={label} className="grid h-14 w-16 place-items-center rounded-[var(--mb-radius-sm)] bg-[var(--mb-navy-2)] text-white shadow-inner sm:h-16 sm:w-20">
          <div className="text-center">
            <div className="font-[var(--font-display)] text-xl font-semibold leading-none sm:text-2xl">
              {String(value).padStart(2, '0')}
            </div>
            <div className="mt-1 text-[10px] font-bold tracking-[0.18em] text-[var(--mb-gold-soft)]">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
