'use client';
// src/app/checkout/page.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { createOrder, formatPrice } from '@/lib/woocommerce';
import toast from 'react-hot-toast';

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
    desc: 'Send to: 01919-797399 (Merchant)',
    icon: '💳',
    color: 'pink',
    number: '01919-797399',
  },
  {
    id: 'nagad',
    label: 'Nagad',
    desc: 'Send to: 01919-797399 (Merchant)',
    icon: '📱',
    color: 'orange',
    number: '01919-797399',
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, totalItems, clearCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [txnId, setTxnId] = useState('');

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    // Validate phone
    if (!form.phone.match(/^(\+880|880|0)1[3-9]\d{8}$/)) {
      toast.error('Please enter a valid Bangladesh phone number');
      return;
    }

    // Validate bKash/Nagad transaction ID
    if (paymentMethod !== 'cod' && !txnId.trim()) {
      toast.error('Please enter your transaction ID');
      return;
    }

    setLoading(true);
    try {
      const billing = {
        first_name: form.first_name,
        last_name: form.last_name,
        address_1: form.address_1,
        address_2: form.address_2,
        city: form.city,
        postcode: form.postcode,
        country: 'BD',
        phone: form.phone,
        email: form.email || `${form.phone}@emart.bd`,
      };

      const order = await createOrder({
        payment_method: paymentMethod,
        billing,
        shipping: billing,
        line_items: items.map((i) => ({
          product_id: i.id,
          quantity: i.quantity,
        })),
        customer_note: [
          form.note,
          paymentMethod !== 'cod' ? `TxnID: ${txnId}` : '',
        ].filter(Boolean).join(' | '),
      });

      if (order) {
        clearCart();
        toast.success('Order placed successfully! 🎉');
        router.push(`/order-success?id=${order.id}`);
      } else {
        throw new Error('Order creation failed');
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again or call us.');
    } finally {
      setLoading(false);
    }
  };

  if (totalItems() === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">Your cart is empty</h2>
        <a href="/shop" className="btn-primary inline-block mt-4">Shop Now →</a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: Forms ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Shipping Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-[#1a1a2e] text-lg mb-4">📦 Delivery Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'first_name', label: 'First Name', required: true },
                  { name: 'last_name', label: 'Last Name', required: true },
                ].map(({ name, label, required }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      name={name}
                      value={(form as any)[name]}
                      onChange={handleChange}
                      required={required}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                 focus:outline-none focus:border-[#e8197a] focus:ring-2 focus:ring-[#e8197a]/20"
                    />
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="01XXXXXXXXX"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                               focus:outline-none focus:border-[#e8197a] focus:ring-2 focus:ring-[#e8197a]/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Full Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="address_1"
                    value={form.address_1}
                    onChange={handleChange}
                    required
                    placeholder="House, Road, Area"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                               focus:outline-none focus:border-[#e8197a] focus:ring-2 focus:ring-[#e8197a]/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                               focus:outline-none focus:border-[#e8197a]"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email (optional)
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="for order confirmation"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                               focus:outline-none focus:border-[#e8197a] focus:ring-2 focus:ring-[#e8197a]/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Order Note (optional)
                  </label>
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Special instructions for delivery..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                               focus:outline-none focus:border-[#e8197a] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-[#1a1a2e] text-lg mb-4">💳 Payment Method</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                               ${paymentMethod === method.id
                                 ? 'border-[#e8197a] bg-[#fce7f0]'
                                 : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="mt-1 accent-[#e8197a]"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-[#1a1a2e] flex items-center gap-2">
                        <span>{method.icon}</span> {method.label}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">{method.desc}</div>

                      {/* bKash/Nagad Transaction ID input */}
                      {paymentMethod === method.id && method.id !== 'cod' && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-600 mb-2">
                            Send money to: <strong>{method.number}</strong> (Merchant)
                            <br />
                            Then enter your Transaction ID below:
                          </p>
                          <input
                            type="text"
                            value={txnId}
                            onChange={(e) => setTxnId(e.target.value)}
                            placeholder="Transaction ID (e.g. 8N7G6K5M)"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                                       focus:outline-none focus:border-[#e8197a]"
                          />
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Order Summary ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-24">
              <h2 className="font-bold text-[#1a1a2e] text-lg mb-4">🧾 Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 line-clamp-2">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-[#e8197a] flex-shrink-0">
                      {formatPrice(String(parseFloat(item.price) * item.quantity))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({totalItems()} items)</span>
                  <span>{formatPrice(String(totalPrice()))}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className={totalPrice() >= 3000 ? 'text-green-600 font-medium' : ''}>
                    {totalPrice() >= 3000 ? 'FREE 🚚' : '৳60–120'}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2">
                  <span className="text-[#1a1a2e]">Total</span>
                  <span className="text-[#e8197a] text-lg">
                    {formatPrice(String(totalPrice() + (totalPrice() >= 3000 ? 0 : 80)))}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary mt-4 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Placing Order...
                  </>
                ) : (
                  <>✅ Place Order</>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                By placing order you agree to our{' '}
                <a href="/terms-conditions" className="text-[#e8197a] hover:underline">Terms</a>
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
