'use client';

import { useState, type FormEvent } from 'react';

export default function SignupTabs() {
  const [tab, setTab] = useState<'whatsapp' | 'email'>('whatsapp');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="bg-bg px-4 py-8">
      <div className="mx-auto max-w-6xl rounded-lg border border-hairline bg-bg-alt p-6">
        <div className="mb-5 flex gap-2 border-b border-hairline lg:hidden">
          <button
            type="button"
            onClick={() => setTab('whatsapp')}
            className={`-mb-px flex-1 pb-3 text-sm font-bold transition-colors ${
              tab === 'whatsapp' ? 'border-b-2 border-accent text-ink' : 'text-gray-600 hover:text-ink'
            }`}
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setTab('email')}
            className={`-mb-px flex-1 pb-3 text-sm font-bold transition-colors ${
              tab === 'email' ? 'border-b-2 border-accent text-ink' : 'text-gray-600 hover:text-ink'
            }`}
          >
            Email
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className={`${tab === 'whatsapp' ? 'flex' : 'hidden'} flex-col gap-4 lg:flex lg:border-r lg:border-hairline lg:pr-8`}>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-accent">WhatsApp list</div>
              <div className="mt-2 text-xl font-extrabold text-ink lg:text-2xl">Join 20,000 on our WhatsApp list — first access to sales</div>
              <div className="mt-2 text-sm leading-6 text-gray-600">We text 2x/month max · no spam</div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="signup-whatsapp-phone"
                name="phone"
                type="tel"
                placeholder="01XXXXXXXXX"
                className="h-12 flex-1 rounded-lg border border-hairline bg-white px-4 text-sm font-medium text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              <a
                href="https://wa.me/8801717082135"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-[#25D366] px-5 text-sm font-bold text-white hover:bg-[#1fb457]"
              >
                Subscribe
              </a>
            </div>
          </div>

          <div className={`${tab === 'email' ? 'flex' : 'hidden'} flex-col gap-4 lg:flex`}>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Email newsletter</div>
              <div className="mt-2 text-xl font-extrabold text-ink lg:text-2xl">Subscribe by email for exclusive offers</div>
              <div className="mt-2 text-sm leading-6 text-gray-600">Weekly picks · unsubscribe anytime</div>
            </div>
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={status === 'loading' || status === 'success'}
                className="h-12 flex-1 rounded-lg border border-hairline bg-white px-4 text-sm font-medium text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={status === 'loading' || status === 'success' || !email}
                className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-5 text-sm font-bold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
              >
                {status === 'loading' ? 'Subscribing…' : status === 'success' ? 'Subscribed ✓' : 'Subscribe'}
              </button>
            </form>
            {status === 'error' && (
              <div className="text-xs font-medium text-red-600">Something went wrong. Please try again.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
