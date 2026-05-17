'use client';

import { useState, useEffect, useCallback } from 'react';

interface WooOrderSummary {
  id: number;
  status: string;
  date_created: string;
  total: string;
  payment_method: string;
  billing: { first_name: string; last_name: string; phone: string; address_1: string; city: string };
  shipping: { first_name: string; last_name: string; address_1: string; city: string };
  line_items: { name: string; quantity: number }[];
  meta_data: { key: string; value: string }[];
}

const TOKEN_KEY = 'emart_dispatch_token';

export default function DispatchPage() {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [orders, setOrders] = useState<WooOrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dispatching, setDispatching] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, { ok: boolean; msg: string }>>({});

  // Pathao-specific inputs
  const [pathaoStore, setPathaoStore] = useState('52776');
  const [pathaoCity, setPathaoCity] = useState('1');
  const [pathaoZone, setPathaoZone] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
  };

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/admin/orders?token=${token}&status=processing&per_page=50`,
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchOrders();
  }, [token, fetchOrders]);

  const getCourierMeta = (order: WooOrderSummary) => {
    const courier = order.meta_data?.find((m) => m.key === '_emart_courier_name')?.value;
    const tracking = order.meta_data?.find((m) => m.key === '_emart_tracking_code')?.value;
    return courier ? `${courier}: ${tracking}` : null;
  };

  const dispatchPathao = async (order: WooOrderSummary) => {
    if (!pathaoZone) { alert('Enter Pathao zone ID first'); return; }
    setDispatching((p) => ({ ...p, [order.id]: 'pathao' }));
    try {
      const res = await fetch(`/api/pathao/order?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          woo_order_id: order.id,
          store_id: Number(pathaoStore),
          recipient_city: Number(pathaoCity),
          recipient_zone: Number(pathaoZone),
        }),
      });
      const data = await res.json();
      setResults((p) => ({
        ...p,
        [order.id]: {
          ok: res.ok,
          msg: res.ok
            ? `Pathao: ${data.consignment_id} (${data.order_status})`
            : data.error || 'Failed',
        },
      }));
      if (res.ok) fetchOrders();
    } finally {
      setDispatching((p) => { const n = { ...p }; delete n[order.id]; return n; });
    }
  };

  const dispatchPackzy = async (order: WooOrderSummary) => {
    setDispatching((p) => ({ ...p, [order.id]: 'packzy' }));
    try {
      const res = await fetch(`/api/packzy/order?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ woo_order_id: order.id }),
      });
      const data = await res.json();
      setResults((p) => ({
        ...p,
        [order.id]: {
          ok: res.ok,
          msg: res.ok
            ? `Steadfast/Packzy: ${data.tracking_code}`
            : data.error || 'Failed',
        },
      }));
      if (res.ok) fetchOrders();
    } finally {
      setDispatching((p) => { const n = { ...p }; delete n[order.id]; return n; });
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow max-w-sm w-full">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <h1 className="text-xl font-bold">Emart Admin</h1>
          </div>
          <p className="text-sm text-gray-500 mb-4">Sign in to access Courier Dispatch</p>
          <div className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Username"
              required
              autoComplete="username"
              className="w-full border rounded px-3 py-2 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full border rounded px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {loginError && (
            <p className="text-sm text-red-600 mb-3">{loginError}</p>
          )}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-rose-600 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loginLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Courier Dispatch</h1>
          <div className="flex gap-2">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="bg-gray-800 text-white rounded px-4 py-2 text-sm"
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            <button
              onClick={handleLogout}
              className="border border-gray-300 text-gray-600 rounded px-4 py-2 text-sm hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Pathao settings */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Pathao Store ID</label>
            <input
              className="border rounded px-2 py-1 text-sm w-32"
              value={pathaoStore}
              onChange={(e) => setPathaoStore(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">City ID (1=Dhaka)</label>
            <input
              className="border rounded px-2 py-1 text-sm w-24"
              value={pathaoCity}
              onChange={(e) => setPathaoCity(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Zone ID (required)</label>
            <input
              className="border rounded px-2 py-1 text-sm w-28"
              placeholder="e.g. 34"
              value={pathaoZone}
              onChange={(e) => setPathaoZone(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-400 self-end">
            Get zone IDs from Pathao merchant portal
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {orders.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-12">No processing orders found.</div>
        )}

        <div className="space-y-3">
          {orders.map((order) => {
            const courier = getCourierMeta(order);
            const result = results[order.id];
            const busy = !!dispatching[order.id];
            const shipping = order.shipping?.address_1 ? order.shipping : order.billing;
            const recipientName = [shipping.first_name, shipping.last_name].filter(Boolean).join(' ');

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">#{order.id}</span>
                    <span className="text-xs bg-amber-100 text-amber-800 rounded px-2 py-0.5">
                      {order.payment_method === 'cod' ? 'COD' : 'Prepaid'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(order.date_created).toLocaleDateString('en-BD')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 font-medium">{recipientName}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {order.billing.phone} · {shipping.address_1}, {shipping.city}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(order.line_items || [])
                      .slice(0, 2)
                      .map((i) => `${i.name} ×${i.quantity}`)
                      .join(', ')}
                    {order.line_items?.length > 2 ? ` +${order.line_items.length - 2} more` : ''}
                  </div>
                  <div className="text-sm font-semibold text-rose-700 mt-1">৳{order.total}</div>
                </div>

                <div className="flex flex-col gap-2 min-w-[200px]">
                  {courier ? (
                    <div className="text-xs bg-green-50 text-green-800 rounded px-3 py-2 font-medium">
                      ✓ {courier}
                    </div>
                  ) : result ? (
                    <div
                      className={`text-xs rounded px-3 py-2 font-medium ${
                        result.ok
                          ? 'bg-green-50 text-green-800'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {result.ok ? '✓' : '✗'} {result.msg}
                    </div>
                  ) : (
                    <>
                      <button
                        disabled={busy}
                        onClick={() => dispatchPathao(order)}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded px-3 py-2"
                      >
                        {busy && dispatching[order.id] === 'pathao'
                          ? 'Creating…'
                          : 'Dispatch via Pathao'}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => dispatchPackzy(order)}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded px-3 py-2"
                      >
                        {busy && dispatching[order.id] === 'packzy'
                          ? 'Creating…'
                          : 'Dispatch via Steadfast'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
