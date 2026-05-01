'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface FlashPromotion {
  id: string;
  name: string;
  type: string;
  starts_at: string;
  ends_at: string;
}

interface FlashContextValue {
  promotion: FlashPromotion | null;
  endsAt: string | null;
  secondsRemaining: number;
  isLoading: boolean;
}

const FlashContext = createContext<FlashContextValue>({
  promotion: null,
  endsAt: null,
  secondsRemaining: 0,
  isLoading: true,
});

function diffSeconds(endsAt?: string | null) {
  if (!endsAt) return 0;
  const end = new Date(endsAt).getTime();
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, Math.floor((end - Date.now()) / 1000));
}

async function fetchFlashPromotion() {
  const response = await fetch('/api/promotions/active?type=flash_week', { cache: 'no-store' });
  if (!response.ok) throw new Error('Flash promotion unavailable');
  const data = await response.json();
  return Array.isArray(data.promotions) ? data.promotions[0] || null : null;
}

export function FlashProvider({
  children,
  initialPromotion = null,
}: {
  children: React.ReactNode;
  initialPromotion?: FlashPromotion | null;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['category_page.flash_promotion'],
    queryFn: fetchFlashPromotion,
    initialData: initialPromotion,
    refetchInterval: 60_000,
  });
  const promotion = data || null;
  const [secondsRemaining, setSecondsRemaining] = useState(() => diffSeconds(promotion?.ends_at));

  useEffect(() => {
    setSecondsRemaining(diffSeconds(promotion?.ends_at));
    const timer = window.setInterval(() => {
      setSecondsRemaining(diffSeconds(promotion?.ends_at));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [promotion?.ends_at]);

  const value = useMemo<FlashContextValue>(() => ({
    promotion,
    endsAt: promotion?.ends_at || null,
    secondsRemaining,
    isLoading,
  }), [isLoading, promotion, secondsRemaining]);

  return <FlashContext.Provider value={value}>{children}</FlashContext.Provider>;
}

export function useFlash() {
  return useContext(FlashContext);
}

export function splitCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

export function flashDayLabel(promotion: FlashPromotion | null): string {
  if (!promotion?.starts_at || !promotion?.ends_at) return '✦ Flash Week';
  const start = new Date(promotion.starts_at).getTime();
  const end = new Date(promotion.ends_at).getTime();
  const totalDays = Math.max(1, Math.round((end - start) / 86_400_000));
  const elapsed = Math.max(0, Math.floor((Date.now() - start) / 86_400_000));
  const day = Math.min(elapsed + 1, totalDays);
  return `✦ Flash Week · Day ${day} of ${totalDays}`;
}
