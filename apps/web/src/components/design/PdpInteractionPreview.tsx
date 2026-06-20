'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Check,
  ChevronDown,
  Heart,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

type ActionState = 'idle' | 'adding' | 'added';

const product = {
  name: 'CosRx Advanced Snail 92 All In One Cream 100g',
  brand: 'COSRX',
  price: '৳1,470',
  category: 'Dryness & Hydration',
  image: '/images/home-categories/cosrx-snail-92-cream.png',
};

export default function PdpInteractionPreview() {
  const [quantity, setQuantity] = useState(1);
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [zoomed, setZoomed] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deliveryZone, setDeliveryZone] = useState<'dhaka' | 'outside'>('dhaka');

  useEffect(() => {
    if (actionState !== 'added') return;
    const timeout = window.setTimeout(() => setActionState('idle'), 2400);
    return () => window.clearTimeout(timeout);
  }, [actionState]);

  const previewAdd = () => {
    if (actionState !== 'idle') return;
    setActionState('adding');
    window.setTimeout(() => setActionState('added'), 520);
  };

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-hairline bg-white shadow-pop">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#f9d8e4]/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-[#e7defc]/60 blur-3xl" />

      <div className="relative grid lg:grid-cols-[1.02fr_0.98fr]">
        <section className="border-b border-hairline bg-gradient-to-br from-[#fff7fa] via-[#f8f4ff] to-[#eef8f4] p-4 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-black text-accent shadow-card">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Product media concept
            </span>
            <button
              type="button"
              onClick={() => setWishlisted((value) => !value)}
              aria-pressed={wishlisted}
              aria-label={wishlisted ? 'Remove from wishlist preview' : 'Add to wishlist preview'}
              className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-card transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${wishlisted ? 'border-accent bg-accent text-white' : 'border-white/80 bg-white/90 text-ink hover:-translate-y-0.5 hover:text-accent'}`}
            >
              <Heart className={`h-5 w-5 ${wishlisted ? 'fill-current' : ''}`} aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setZoomed((value) => !value)}
            aria-pressed={zoomed}
            className="group relative flex min-h-[420px] w-full items-center justify-center overflow-hidden rounded-[28px] border border-white/80 bg-white/70 shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-[560px]"
          >
            <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-full bg-ink px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
              Authentic product image
            </div>
            <div className="pointer-events-none absolute bottom-5 right-5 z-10 flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-ink shadow-card">
              {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              {zoomed ? 'Fit image' : 'Tap to inspect'}
            </div>
            <div className="pointer-events-none absolute inset-x-12 bottom-14 h-20 rounded-[50%] bg-accent/10 blur-xl" />
            <Image
              src={product.image}
              alt={product.name}
              width={800}
              height={1067}
              priority
              className={`relative h-[360px] w-auto object-contain drop-shadow-[0_30px_32px_rgba(80,30,50,0.18)] transition-transform duration-500 motion-reduce:transition-none sm:h-[500px] ${zoomed ? 'scale-[1.32]' : 'scale-100 group-hover:scale-[1.03]'}`}
            />
          </button>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white bg-white/75 px-3 py-3 text-center shadow-card">
              <ShieldCheck className="mx-auto h-5 w-5 text-accent" aria-hidden="true" />
              <p className="mt-1 text-[11px] font-bold text-ink">Verified source</p>
            </div>
            <div className="rounded-2xl border border-white bg-white/75 px-3 py-3 text-center shadow-card">
              <PackageCheck className="mx-auto h-5 w-5 text-[#8060c8]" aria-hidden="true" />
              <p className="mt-1 text-[11px] font-bold text-ink">Sealed product</p>
            </div>
            <div className="rounded-2xl border border-white bg-white/75 px-3 py-3 text-center shadow-card">
              <Truck className="mx-auto h-5 w-5 text-success" aria-hidden="true" />
              <p className="mt-1 text-[11px] font-bold text-ink">BD delivery</p>
            </div>
          </div>
        </section>

        <section className="relative flex flex-col p-5 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-black text-accent">{product.brand}</span>
            <span className="rounded-full bg-[#ece8fb] px-3 py-1.5 text-xs font-bold text-[#6246a8]">100g</span>
            <span className="rounded-full bg-success-soft px-3 py-1.5 text-xs font-bold text-success">Authenticity guaranteed</span>
          </div>

          <h1 className="mt-5 max-w-[20ch] font-display text-3xl font-bold leading-[1.08] text-ink sm:text-4xl lg:text-[42px]">
            {product.name}
          </h1>
          <p className="mt-3 text-sm font-semibold text-muted">{product.category} · Bangladesh-ready delivery</p>

          <div className="mt-6 rounded-[24px] border border-accent/15 bg-gradient-to-r from-accent-soft via-white to-[#f2edff] p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent">Current Emart price</p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
              <span className="text-4xl font-black tracking-tight text-ink">{product.price}</span>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-muted shadow-sm">No invented discount</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2" role="group" aria-label="Delivery preview zone">
            <button
              type="button"
              onClick={() => setDeliveryZone('dhaka')}
              className={`rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${deliveryZone === 'dhaka' ? 'border-accent bg-accent-soft text-accent' : 'border-hairline bg-white text-muted hover:border-accent/30'}`}
            >
              <span className="block text-xs font-black">Inside Dhaka</span>
              <span className="mt-0.5 block text-[11px] font-semibold">1–2 business days</span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryZone('outside')}
              className={`rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${deliveryZone === 'outside' ? 'border-accent bg-accent-soft text-accent' : 'border-hairline bg-white text-muted hover:border-accent/30'}`}
            >
              <span className="block text-xs font-black">Outside Dhaka</span>
              <span className="mt-0.5 block text-[11px] font-semibold">3–5 business days</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-[112px_minmax(0,1fr)] gap-3">
            <div className="flex min-h-14 items-center justify-between rounded-2xl border border-hairline bg-bg-alt p-1">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Decrease preview quantity"
                className="flex h-11 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-white hover:text-ink"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm font-black text-ink" aria-live="polite">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => value + 1)}
                aria-label="Increase preview quantity"
                className="flex h-11 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-white hover:text-ink"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={previewAdd}
              disabled={actionState === 'adding'}
              className={`relative min-h-14 overflow-hidden rounded-2xl px-4 text-sm font-black text-white shadow-card transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 active:translate-y-0.5 motion-reduce:transition-none ${actionState === 'added' ? 'bg-success' : 'bg-accent hover:-translate-y-0.5 hover:bg-accent-deep hover:shadow-pop'}`}
            >
              <span className={`flex items-center justify-center gap-2 transition ${actionState === 'adding' ? 'opacity-0' : 'opacity-100'}`}>
                {actionState === 'added' ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                {actionState === 'added' ? `Added ${quantity} — preview` : 'Preview add to cart'}
              </span>
              {actionState === 'adding' && (
                <span className="absolute inset-0 flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
                  Adding…
                </span>
              )}
            </button>
          </div>

          <div aria-live="polite" className="min-h-6 pt-2 text-center text-xs font-bold text-success">
            {actionState === 'added' ? 'Interaction demonstrated—no cart or checkout data changed.' : ''}
          </div>

          <button
            type="button"
            onClick={() => setDetailsOpen((value) => !value)}
            aria-expanded={detailsOpen}
            className="mt-2 flex w-full items-center justify-between rounded-2xl border border-hairline bg-white px-4 py-4 text-left transition hover:border-accent/30 hover:bg-accent-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="flex items-center gap-3">
              <BadgeCheck className="h-5 w-5 text-accent" />
              <span>
                <span className="block text-sm font-black text-ink">Why shop this product at Emart?</span>
                <span className="block text-xs font-semibold text-muted">Authenticity, local support and payment options</span>
              </span>
            </span>
            <ChevronDown className={`h-5 w-5 text-muted transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
          </button>

          <div className={`grid transition-all duration-300 motion-reduce:transition-none ${detailsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="grid gap-2 rounded-b-2xl border-x border-b border-hairline bg-bg px-4 py-4 text-xs font-semibold leading-5 text-muted sm:grid-cols-3">
                <span>✓ COD, bKash and Nagad</span>
                <span>✓ Bangladesh support</span>
                <span>✓ Authentic-product policy</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 px-4 text-sm font-black text-[#14833b] transition hover:-translate-y-0.5 hover:bg-[#25D366]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
          >
            <MessageCircle className="h-5 w-5" />
            Preview WhatsApp order action
          </button>
        </section>
      </div>
    </div>
  );
}
