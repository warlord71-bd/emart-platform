'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type Props = {
  productId: number;
  productName: string;
  productSlug: string;
};

export default function BackInStockNotify({ productId, productName, productSlug }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/back-in-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          product_id: productId,
          product_name: productName,
          product_slug: productSlug,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || 'Could not save your request');
      }
      setDone(true);
      toast.success('We’ll email you when it comes back.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Thanks — your notification request is saved for this product.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-ink">Notify me when this is back in stock</p>
      <p className="mt-1 text-xs leading-5 text-muted">
        Enter your email and Emart will add you to the product restock alert list.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-wait disabled:bg-gray-300"
        >
          {loading ? 'Saving…' : 'Notify me'}
        </button>
      </div>
    </form>
  );
}
