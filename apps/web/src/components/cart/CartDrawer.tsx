'use client';
// src/components/cart/CartDrawer.tsx

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/woocommerce';
import { formatBDT } from '@/lib/formatters';
import { FREE_DELIVERY_THRESHOLD } from '@/lib/commerce-config';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalItems, totalPrice } =
    useCartStore();
  const cartTotal = Math.max(0, Number(totalPrice()) || 0);
  const freeDeliveryRemaining = Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal);
  const freeDeliveryProgress = Math.min(100, Math.round((cartTotal / FREE_DELIVERY_THRESHOLD) * 100));

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeCart]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm animate-slide-in flex-col bg-white shadow-pop">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline p-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-accent" />
            <h2 className="font-bold text-ink">
              My Cart ({totalItems()})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="rounded-full p-2 transition-colors hover:bg-bg-alt"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <button
                onClick={closeCart}
                className="mt-4 font-semibold text-accent hover:underline"
              >
                Continue Shopping →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 border-b border-hairline pb-4">
                  {/* Image */}
                  <Link href={`/shop/${item.slug}`} onClick={closeCart}>
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-bg-alt">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/shop/${item.slug}`}
                      onClick={closeCart}
                      className="line-clamp-2 text-sm font-medium text-ink-2 hover:text-accent"
                    >
                      {item.name}
                    </Link>
                    <div className="mt-1 text-sm font-bold text-accent">
                      {formatPrice(item.price)}
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-hairline transition-colors hover:border-accent hover:text-accent"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-hairline transition-colors hover:border-accent hover:text-accent"
                      >
                        <Plus size={12} />
                      </button>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-hairline bg-bg-alt p-4">
            <div className="mb-3 rounded-lg border border-accent/10 bg-accent-soft px-3 py-3 text-xs text-muted">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-semibold text-ink">
                  {freeDeliveryRemaining > 0
                    ? `${formatBDT(freeDeliveryRemaining)} away from free delivery`
                    : 'You unlocked free delivery'}
                </span>
                <span className="shrink-0 font-bold text-accent">{freeDeliveryProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${freeDeliveryProgress}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-gray-700">Subtotal</span>
              <span className="text-lg font-bold text-accent">
                {formatPrice(String(cartTotal))}
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="w-full btn-primary text-center block"
            >
              Proceed to Checkout →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
