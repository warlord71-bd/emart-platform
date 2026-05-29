'use client';
// src/app/order-success/page.tsx

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, User } from 'lucide-react';
import { COMPANY } from '@/lib/companyProfile';
import { META_PIXEL_PURCHASE_STORAGE_KEY, parseMetaPixelValue, trackMetaEvent } from '@/lib/metaPixel';
import { trackGA4, GA4_STICKY_VARIANT_KEY } from '@/lib/ga4';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!orderId) return;

    const rawPayload = sessionStorage.getItem(META_PIXEL_PURCHASE_STORAGE_KEY);
    if (!rawPayload) return;

    try {
      const payload = JSON.parse(rawPayload);
      const value = parseMetaPixelValue(payload?.value);

      if (payload?.orderId === orderId && value) {
        trackMetaEvent('Purchase', {
          content_ids: Array.isArray(payload.content_ids) ? payload.content_ids.map(String) : undefined,
          content_type: 'product',
          currency: 'BDT',
          value,
          contents: Array.isArray(payload.contents)
            ? payload.contents.map((item: any) => ({
                id: String(item.id),
                quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
                item_price: parseMetaPixelValue(item.item_price),
              }))
            : undefined,
          num_items: Number(payload.num_items) > 0 ? Number(payload.num_items) : undefined,
        }, payload?.eventID ? { eventID: String(payload.eventID) } : undefined);
      }
    } catch {
      // Ignore malformed stored tracking payloads; checkout success must never fail because of analytics.
    } finally {
      sessionStorage.removeItem(META_PIXEL_PURCHASE_STORAGE_KEY);
    }

    // GA4 purchase — includes sticky bar variant for funnel attribution
    let stickyVariant: string | undefined;
    try { stickyVariant = sessionStorage.getItem(GA4_STICKY_VARIANT_KEY) ?? undefined; } catch { /* private mode */ }
    trackGA4('purchase', {
      transaction_id: orderId,
      ...(stickyVariant ? { flag_variant: stickyVariant } : {}),
    });
    try { sessionStorage.removeItem(GA4_STICKY_VARIANT_KEY); } catch { /* ok */ }
  }, [orderId]);

  if (!mounted) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      {/* Success Icon */}
      <div className="mb-8">
        <CheckCircle size={80} className="mx-auto text-green-500" />
      </div>

      {/* Heading */}
      <h1 className="mb-4 text-3xl font-bold text-ink">
        Order Submitted Successfully
      </h1>

      <p className="mb-8 text-muted">
        Your order has been received and saved in our system. Please keep your order ID for confirmation and tracking.
      </p>

      {/* Order ID */}
      {orderId && (
        <div className="mb-8 rounded-xl bg-bg-alt p-6">
          <div className="mb-2 flex items-center justify-center gap-2 text-ink-2">
            <Package size={20} />
            <span className="font-medium">Order ID:</span>
          </div>
          <div className="text-2xl font-bold text-accent">#{orderId}</div>
        </div>
      )}

      {/* Next Steps */}
      <div className="mb-8 rounded-xl border border-hairline bg-card p-6 text-left shadow-card">
        <h2 className="mb-4 font-bold text-ink">What happens next?</h2>
        <ol className="space-y-3 text-sm text-muted">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">1</span>
            <span>Our team will verify your submitted order and call you within 24 hours</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">2</span>
            <span>We'll confirm product availability and delivery time</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">3</span>
            <span>Your order will be shipped via courier (COD available)</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">4</span>
            <span>Pay when you receive your package</span>
          </li>
        </ol>
      </div>

      <div className="mb-8 rounded-xl border border-accent/20 bg-accent-soft/50 p-6 text-left">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-white p-2 text-accent shadow-sm">
            <User size={18} />
          </div>
          <div>
            <h2 className="font-bold text-ink">Keep this order in your account</h2>
            <p className="mt-2 text-sm text-muted">
              Use the same email address from checkout on My Account. If that address is Gmail, Continue with Google will pick up the same customer profile and keep your order history together.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="mb-8 text-sm text-muted">
        <p>Need help? Contact us:</p>
        <p className="mt-1 font-semibold text-ink">
          📞 {COMPANY.phones.primary} | ✉️ {COMPANY.supportEmail}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/account"
          className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-accent px-6 py-3 font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
        >
          My Account <User size={18} />
        </Link>
        <Link
          href="/shop"
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          Continue Shopping <ArrowRight size={18} />
        </Link>
        <Link
          href="/"
          className="rounded-lg border-2 border-hairline px-6 py-3 font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
