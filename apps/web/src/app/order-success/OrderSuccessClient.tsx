'use client';
// src/app/order-success/page.tsx

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      {/* Success Icon */}
      <div className="mb-8">
        <CheckCircle size={80} className="mx-auto text-green-500" />
      </div>

      {/* Heading */}
      <h1 className="text-3xl font-bold text-[#1a1a2e] mb-4">
        Order Placed Successfully! 🎉
      </h1>

      <p className="text-gray-600 mb-8">
        Thank you for your order. We will contact you shortly to confirm delivery.
      </p>

      {/* Order ID */}
      {orderId && (
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center gap-2 text-gray-700 mb-2">
            <Package size={20} />
            <span className="font-medium">Order ID:</span>
          </div>
          <div className="text-2xl font-bold text-[#e8197a]">#{orderId}</div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 mb-8 text-left">
        <h2 className="font-bold text-[#1a1a2e] mb-4">What happens next?</h2>
        <ol className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-[#e8197a] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>Our team will verify your order and call you within 24 hours</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-[#e8197a] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span>We'll confirm product availability and delivery time</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-[#e8197a] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>Your order will be shipped via courier (COD available)</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-[#e8197a] text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <span>Pay when you receive your package</span>
          </li>
        </ol>
      </div>

      {/* Contact Info */}
      <div className="mb-8 text-sm text-gray-600">
        <p>Need help? Contact us:</p>
        <p className="font-semibold text-[#1a1a2e] mt-1">
          📞 01919-797399 | ✉️ support@e-mart.com.bd
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/shop"
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          Continue Shopping <ArrowRight size={18} />
        </Link>
        <Link
          href="/"
          className="px-6 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-700 hover:border-[#e8197a] hover:text-[#e8197a] transition-colors"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
