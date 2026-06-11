'use client';
// src/app/checkout/page.tsx

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { formatBDT } from '@/lib/formatters';
import toast from 'react-hot-toast';
import { COMPANY } from '@/lib/companyProfile';
import { META_PIXEL_PURCHASE_STORAGE_KEY, parseMetaPixelValue, trackMetaEvent } from '@/lib/metaPixel';
import { trackGA4 } from '@/lib/ga4';
import { readAttribution } from '@/components/AttributionTracker';

const DISTRICTS = [
  'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Sylhet',
  'Barisal', 'Rangpur', 'Mymensingh', 'Gazipur', 'Narayanganj',
  'Comilla', 'Narsingdi', 'Tangail', 'Bogura', 'Jessore',
];

const PAYMENT_METHODS = [
  {
    id: 'cod',
    label: 'Cash on Delivery',
    desc: 'Pay when you receive your order',
    icon: '💵',
    color: 'green',
  },
  {
    id: 'bkash',
    label: 'bKash',
    desc: `Send to: ${COMPANY.payment.bkash} (Merchant)`,
    icon: '💳',
    color: 'pink',
    number: COMPANY.payment.bkash,
  },
  {
    id: 'nagad',
    label: 'Nagad',
    desc: `Send to: ${COMPANY.payment.nagad} (Merchant)`,
    icon: '📱',
    color: 'orange',
    number: COMPANY.payment.nagad,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, totalItems, clearCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [txnId, setTxnId] = useState('');
  // Idempotency key: generated once per checkout session, prevents duplicate orders on retry
  const [idempotencyKey] = useState(
    () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  );

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address_1: '',
    address_2: '',
    city: 'Dhaka',
    postcode: '',
    note: '',
  });
  const lineItems = useMemo(() => items.map((item) => ({
    product_id: item.product_id || item.id,
    ...(item.variation_id ? { variation_id: item.variation_id } : {}),
    quantity: item.quantity,
  })), [items]);
  const cartTotal = totalPrice();
  const [shippingQuote, setShippingQuote] = useState<{
    total: number;
    isFree: boolean;
    methodTitle: string;
    freeShippingEnabled: boolean;
    freeShippingThreshold: number | null;
  } | null>(null);
  const fallbackShippingFee = form.city === 'Dhaka' ? 70 : 100;
  const shippingFee = shippingQuote ? shippingQuote.total : fallbackShippingFee;

  useEffect(() => {
    if (items.length === 0) return;
    const total = items.reduce((sum, i) => sum + parseFloat(i.price || '0') * i.quantity, 0);
    trackMetaEvent('InitiateCheckout', {
      content_ids: items.map((i) => String(i.id)),
      contents: items.map((i) => ({ id: String(i.id), quantity: i.quantity })),
      num_items: items.reduce((s, i) => s + i.quantity, 0),
      currency: 'BDT',
      value: total,
    });
    trackGA4('begin_checkout', {
      currency: 'BDT',
      value: total,
      items: items.map((i) => ({
        item_id: String(i.id),
        item_name: i.name,
        price: parseFloat(i.price || '0'),
        quantity: i.quantity,
      })),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (items.length === 0) return;

    const controller = new AbortController();
    fetch('/api/shipping/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: form.city, line_items: lineItems }),
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data?.quote) setShippingQuote(data.quote);
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.error('Shipping estimate error:', error);
      });

    return () => controller.abort();
  }, [form.city, items.length, lineItems]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const normalizedEmail = form.email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!form.phone.match(/^(\+880|880|0)1[3-9]\d{8}$/)) {
      toast.error('Please enter a valid Bangladesh phone number');
      return;
    }

    if (paymentMethod !== 'cod' && !txnId.trim()) {
      toast.error('Please enter your transaction ID');
      return;
    }

    setLoading(true);
    try {
      const metaEventId = `emart-purchase-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const billing = {
        first_name: form.first_name,
        last_name: form.last_name,
        address_1: form.address_1,
        address_2: form.address_2,
        city: form.city,
        postcode: form.postcode,
        country: 'BD',
        phone: form.phone,
        email: normalizedEmail,
      };

      const attribution = readAttribution();

      const payload = {
        payment_method: paymentMethod,
        billing,
        shipping: billing,
        line_items: lineItems,
        customer_note: [
          form.note,
          paymentMethod !== 'cod' ? `TxnID: ${txnId}` : '',
        ].filter(Boolean).join(' | '),
        meta_event_id: metaEventId,
        idempotency_key: idempotencyKey,
        attribution: {
          first_touch: attribution.first,
          last_touch:  attribution.last,
        },
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      const orderId = data?.order?.id || data?.id;

      if (!response.ok || !orderId) {
        throw new Error(data?.error || 'Order creation failed');
      }

      const orderTotal = parseMetaPixelValue(data?.order?.total) || parseMetaPixelValue(cartTotal + shippingFee);
      if (orderTotal) {
        sessionStorage.setItem(META_PIXEL_PURCHASE_STORAGE_KEY, JSON.stringify({
          orderId: String(orderId),
          value: orderTotal,
          currency: 'BDT',
          content_ids: items.map((item) => String(item.id)),
          eventID: metaEventId,
          contents: items.map((item) => ({
            id: String(item.id),
            quantity: item.quantity,
            item_price: parseMetaPixelValue(item.price),
          })),
          num_items: totalItems(),
        }));
      }

      // Store email for Google Customer Reviews survey on the order success page
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 7);
      try {
        sessionStorage.setItem('emart-gcr-order', JSON.stringify({
          orderId: String(orderId),
          email: normalizedEmail,
          deliveryDate: deliveryDate.toISOString().split('T')[0],
        }));
      } catch { /* storage unavailable */ }

      clearCart();
      toast.success('Order placed successfully! 🎉');
      router.push(`/order-success?id=${orderId}`);
    } catch (err: any) {
      const errorMessage = err?.message || 'Something went wrong. Please try again or call us.';
      toast.error(errorMessage);
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (totalItems() === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="mb-2 text-xl font-bold text-ink">Your cart is empty</h2>
        <a href="/shop" className="btn-primary inline-block mt-4">Shop Now →</a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-ink">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
              <h2 className="mb-4 text-lg font-bold text-ink">📦 Delivery Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'first_name', label: 'First Name', required: true },
                  { name: 'last_name', label: 'Last Name', required: true },
                ].map(({ name, label, required }) => (
                  <div key={name}>
                    <label className="mb-1 block text-sm font-medium text-muted">
                      {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      name={name}
                      value={(form as any)[name]}
                      onChange={handleChange}
                      required={required}
                      className="w-full rounded-lg border border-hairline bg-card px-3 py-2.5 text-sm text-ink-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                    />
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-muted">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="01XXXXXXXXX"
                    className="w-full rounded-lg border border-hairline bg-card px-3 py-2.5 text-sm text-ink-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-muted">
                    Full Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="address_1"
                    value={form.address_1}
                    onChange={handleChange}
                    required
                    placeholder="House, Road, Area"
                    className="w-full rounded-lg border border-hairline bg-card px-3 py-2.5 text-sm text-ink-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-muted">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-hairline bg-card px-3 py-2.5 text-sm text-ink-2 focus:border-accent focus:outline-none"
                  >
                    {DISTRICTS.map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-muted">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    placeholder="you@gmail.com"
                    className="w-full rounded-lg border border-hairline bg-card px-3 py-2.5 text-sm text-ink-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                  />
                  <p className="mt-1 text-xs text-muted">
                    We send order updates here. If this is your Gmail, you can use the same address with Continue with Google in My Account.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-muted">
                    Order Note (optional)
                  </label>
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Special instructions for delivery..."
                    className="w-full resize-none rounded-lg border border-hairline bg-card px-3 py-2.5 text-sm text-ink-2 focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
              <h2 className="mb-4 text-lg font-bold text-ink">💳 Payment Method</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === method.id ? 'border-accent bg-accent-soft' : 'border-hairline hover:border-accent/40'}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="mt-1 accent-accent"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-semibold text-ink">
                        <span>{method.icon}</span> {method.label}
                      </div>
                      <div className="mt-0.5 text-sm text-muted">{method.desc}</div>

                      {paymentMethod === method.id && method.id !== 'cod' && (
                        <div className="mt-3 rounded-lg border border-hairline bg-card p-3">
                          <p className="mb-2 text-xs text-muted">
                            Send money to: <strong>{method.number}</strong> (Merchant)
                            <br />
                            Then enter your Transaction ID below:
                          </p>
                          <input
                            type="text"
                            value={txnId}
                            onChange={(e) => setTxnId(e.target.value)}
                            placeholder="Transaction ID (e.g. 8N7G6K5M)"
                            className="w-full rounded-lg border border-hairline bg-card px-3 py-2 text-sm text-ink-2 focus:border-accent focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="sticky top-24 rounded-2xl border border-hairline bg-card p-6 shadow-card">
              <h2 className="mb-4 text-lg font-bold text-ink">🧾 Order Summary</h2>

              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-bg-alt">
                      <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-2 text-xs font-medium text-ink-2">{item.name}</p>
                      <p className="text-xs text-muted-2">Qty: {item.quantity}</p>
                    </div>
                    <span className="flex-shrink-0 text-sm font-bold text-accent">
                      {formatBDT(parseFloat(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-hairline pt-4">
                <div className="flex justify-between text-sm text-muted">
                  <span>Subtotal ({totalItems()} items)</span>
                  <span>{formatBDT(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted">
                  <span>Shipping</span>
                  <span className={shippingFee === 0 ? 'font-medium text-success' : ''}>
                    {shippingFee === 0 ? 'FREE 🚚' : formatBDT(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-hairline pt-2 text-base font-bold">
                  <span className="text-ink">Total</span>
                  <span className="text-lg text-accent">
                    {formatBDT(cartTotal + shippingFee)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary mt-4 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Placing Order...
                  </>
                ) : (
                  <>✅ Place Order</>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-muted-2">
                By placing order you agree to our{' '}
                <a href="/terms-conditions" className="text-accent hover:underline">Terms</a>
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
