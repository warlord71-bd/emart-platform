# Presence WebSocket Service

- Date: 2026-05-02
- Live service: PM2 process `emart-presence`
- Runtime path: `/var/www/emart-platform/apps/presence-server`
- Local source path: `/root/emart-platform/apps/presence-server`
- Local bind: `127.0.0.1:3011`
- Public route: `wss://e-mart.com.bd/ws/presence`
- Health route: `https://e-mart.com.bd/presence-healthz`

Use same-origin `wss://e-mart.com.bd/ws/presence`, not `wss://api.e-mart.com.bd/ws/presence`.
`api.e-mart.com.bd` did not resolve during setup, while same-origin WSS reuses the existing Emart SSL and Cloudflare/Nginx path.

Frontend behavior:
- `NEXT_PUBLIC_WS_PRESENCE_URL=wss://e-mart.com.bd/ws/presence`
- Category presence appends `?category_id=<id>`.
- `/ws/orders` is not opened unless `NEXT_PUBLIC_WS_ORDERS_URL` is set.
- Polling fallback at `/api/analytics/active-sessions` remains active every 30s.
