'use client';

type PresenceMessage = { type: 'presence'; category_id?: number | string; delta?: number; total?: number };
type StockMessage = { type: 'stock'; product_id: number; stock_remaining?: number; delta?: number };
type OrderMessage = { type: 'order'; product_name?: string; city?: string; customer_first_name?: string };

export type RealtimeMessage = PresenceMessage | StockMessage | OrderMessage;

export function createRealtimeConnection(
  urls: string[],
  onMessage: (message: RealtimeMessage) => void,
) {
  const sockets: WebSocket[] = [];
  let closed = false;

  urls.forEach((url) => {
    try {
      const socket = new WebSocket(url);
      socket.onmessage = (event) => {
        try {
          onMessage(JSON.parse(event.data));
        } catch {
          // Ignore malformed realtime messages; polling remains the source of truth.
        }
      };
      socket.onerror = () => socket.close();
      sockets.push(socket);
    } catch {
      // WebSocket is optional. Components continue with polling.
    }
  });

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel('emart-presence');
    channel.onmessage = (event) => onMessage(event.data);
    channel.postMessage({ type: 'presence', delta: 1 });
  } catch {
    channel = null;
  }

  return () => {
    if (closed) return;
    closed = true;
    sockets.forEach((socket) => socket.close());
    try {
      channel?.postMessage({ type: 'presence', delta: -1 });
      channel?.close();
    } catch {
      // noop
    }
  };
}
