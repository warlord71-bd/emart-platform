'use client';

import { useCategoryPresence } from '@/lib/realtime/presence';

export function CategoryLiveBadge({ categoryId }: { categoryId: string | number }) {
  const viewers = useCategoryPresence(categoryId as number);
  if (viewers == null) return null;
  return (
    <span className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-black/35 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--mb-success)]" />
      {viewers} viewing
    </span>
  );
}
