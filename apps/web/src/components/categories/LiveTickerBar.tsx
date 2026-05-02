'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import { useFlash } from '@/lib/realtime/flash-context';
import { createRealtimeConnection, getPresenceWebSocketUrl, type RealtimeMessage } from '@/lib/realtime/presence';
import { useCategoryPageI18n } from './categoryPageI18n';
import CountdownTiles from './CountdownTiles';

interface PresencePayload {
  total: number;
}

interface RecentPurchasePayload {
  customer_first_name: string;
  city: string;
  product_name: string;
}

async function fetchJson(path: string) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(path);
  return response.json();
}

export default function LiveTickerBar({
  initialPresence,
  initialPurchases = [],
}: {
  initialPresence?: PresencePayload;
  initialPurchases?: RecentPurchasePayload[];
}) {
  const { t, n } = useCategoryPageI18n();
  const { secondsRemaining } = useFlash();
  const [presenceDelta, setPresenceDelta] = useState(0);
  const presence = useQuery({
    queryKey: ['category_page.active_sessions'],
    queryFn: () => fetchJson('/api/analytics/active-sessions'),
    initialData: initialPresence,
    refetchInterval: 30_000,
  });
  const orders = useQuery({
    queryKey: ['category_page.recent_orders'],
    queryFn: () => fetchJson('/api/orders/recent?limit=10&fields=customer_first_name,city,product_name,timestamp'),
    initialData: { purchases: initialPurchases },
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const urls = [
      getPresenceWebSocketUrl(),
      process.env.NEXT_PUBLIC_WS_ORDERS_URL || null,
    ].filter((url): url is string => Boolean(url));

    return createRealtimeConnection(
      urls,
      (message: RealtimeMessage) => {
        if (message.type === 'presence') setPresenceDelta((current) => current + Number(message.delta || 0));
      },
    );
  }, []);

  const total = Math.max(0, Number(presence.data?.total || 0) + presenceDelta);
  const recent = Array.isArray(orders.data?.purchases) ? orders.data.purchases : [];
  const messages = useMemo(() => {
    const purchaseMessages = recent.slice(0, 4).map((item: RecentPurchasePayload) =>
      `${item.customer_first_name} from ${item.city} just bought ${item.product_name}`,
    );
    return [
      `${n(total)} ${t('shoppers')}`,
      ...purchaseMessages,
      `${t('flashEnds')} ${Math.floor(secondsRemaining / 3600)}h ${Math.floor((secondsRemaining % 3600) / 60)}m`,
    ];
  }, [n, recent, secondsRemaining, t, total]);

  return (
    <section className="bg-[var(--mb-navy)] text-white">
      <div className="mb-container flex min-h-11 items-center gap-3 overflow-hidden py-2">
        <div className="flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[var(--mb-gold-soft)]">
          <Zap size={14} /> LIVE
        </div>
        <div className="hidden min-w-0 flex-1 overflow-hidden sm:block">
          <div className="mb-ticker-track">
            {[0, 1].map((group) => (
              <div key={group} className="flex shrink-0 items-center gap-5 pr-5 text-sm font-medium">
                {messages.map((message, index) => (
                  <span key={`${group}-${index}`} className="whitespace-nowrap">
                    {message}<span className="ml-5 text-white/30">•</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:hidden">
          <span className="truncate text-xs font-semibold">{n(total)} {t('shoppingNow')}</span>
          <div className="scale-75 origin-right"><CountdownTiles seconds={secondsRemaining} /></div>
        </div>
      </div>
    </section>
  );
}
