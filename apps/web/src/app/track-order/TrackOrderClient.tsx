'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapPin, Truck, CheckCircle, Clock, Package, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface OrderStatus {
  status: string;
  status_label: string;
  date: string;
  description: string;
  icon: any;
}

interface TrackingData {
  order_id: number;
  status: string;
  status_label?: string;
  status_description?: string;
  date_created: string;
  estimated_delivery?: string;
  tracking_number?: string;
  tracking_url?: string;
  courier?: string;
  shipping_address: {
    address_1: string;
    city: string;
    postcode: string;
    country: string;
  };
  timeline: OrderStatus[];
  updates?: Array<{
    id: number;
    date: string;
    note: string;
  }>;
}

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  
  const [orderNumber, setOrderNumber] = useState(orderId || '');
  const [identity, setIdentity] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleTrackOrder = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    setSubmitted(true);

    try {
      const response = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderNumber,
          identity,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'Order not found. Please check your order details and try again.');
      }

      const iconMap: Record<string, any> = {
        pending: Clock,
        processing: Package,
        shipped: Truck,
        completed: CheckCircle,
        cancelled: AlertCircle,
      };

      setTrackingData({
        ...data,
        timeline: (data.timeline || []).map((step: OrderStatus) => ({
          ...step,
          icon: iconMap[step.status] || Package,
        })),
      });
    } catch (fetchError) {
      setTrackingData(null);
      setError(fetchError instanceof Error ? fetchError.message : 'Order not found. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      handleTrackOrder();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const getCurrentStep = (timeline: OrderStatus[]) => {
    const activeSteps = timeline.filter((item) => Boolean(item.date));
    return Math.max(activeSteps.length - 1, 0);
  };

  if (!submitted && !orderId) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Track Your Order</h1>
            <p className="mt-2 text-gray-600">Enter your order details to see the current status</p>
          </div>

          <form onSubmit={handleTrackOrder} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Order Number
              </label>
              <input
                type="text"
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g., 1001"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label htmlFor="identity" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address or Phone
              </label>
              <input
                type="text"
                id="identity"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder="your@email.com or 01XXXXXXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                Logged-in customers can open tracking directly. Guests should enter the same email or phone used on the order.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Tracking...
                </>
              ) : (
                <>
                  <MapPin className="h-5 w-5 mr-2" />
                  Track Order
                </>
              )}
            </button>
          </form>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Where to find your order number?</h3>
            <p className="text-sm text-blue-800">
              Your order number was sent to your email after purchase. You can also find it in your account under Order History.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Tracking your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => {
                setSubmitted(false);
                setError('');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return null;
  }

  const currentStep = getCurrentStep(trackingData.timeline);
  const isDelivered = trackingData.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center text-sm text-gray-500 mb-4">
            <Link href="/account/orders" className="hover:text-primary-600">Orders</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Track Order #{trackingData.order_id}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
        </div>

        {/* Order Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Order #{trackingData.order_id}</h2>
              <p className="text-gray-500 mt-1">
                Placed on {new Date(trackingData.date_created).toLocaleDateString()}
              </p>
            </div>
            <div className="mt-4 md:mt-0 text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isDelivered ? 'bg-green-100 text-green-800' :
                trackingData.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {isDelivered && <CheckCircle className="h-4 w-4 mr-1" />}
                {trackingData.status_label || trackingData.status.toUpperCase()}
              </span>
              {trackingData.tracking_number && (
                <p className="text-sm text-gray-500 mt-2">
                  Tracking: {trackingData.tracking_number}
                </p>
              )}
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200"></div>
            <div 
              className="absolute top-4 left-0 h-0.5 bg-primary-600 transition-all duration-500"
              style={{ width: `${((currentStep + 1) / trackingData.timeline.length) * 100}%` }}
            ></div>
            
            <div className="relative grid grid-cols-4 gap-4">
              {trackingData.timeline.map((step, index) => {
                const Icon = step.icon;
                const isActive = index <= currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div key={step.status} className="text-center">
                    <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isActive 
                        ? 'bg-primary-600 border-primary-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className={`mt-2 text-xs font-medium ${
                      isActive ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.status_label}
                    </p>
                    {step.date && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(step.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Status Description */}
          {trackingData.timeline[currentStep] && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-1">
                {trackingData.status_label || trackingData.timeline[currentStep].status_label}
              </h3>
              <p className="text-sm text-gray-600">
                {trackingData.status_description || trackingData.timeline[currentStep].description}
              </p>
              {trackingData.estimated_delivery && !isDelivered && (
                <p className="text-sm text-primary-600 mt-2 font-medium">
                  Estimated delivery: {new Date(trackingData.estimated_delivery).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Shipping Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary-600" />
              Shipping Address
            </h3>
            <address className="not-italic text-gray-600">
              <p>{trackingData.shipping_address.address_1}</p>
              <p>{trackingData.shipping_address.city} {trackingData.shipping_address.postcode}</p>
              <p>{trackingData.shipping_address.country}</p>
            </address>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Truck className="h-5 w-5 mr-2 text-primary-600" />
              Delivery Information
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              {trackingData.courier && (
                <p><span className="font-medium">Courier:</span> {trackingData.courier}</p>
              )}
              {trackingData.tracking_number && (
                <p><span className="font-medium">Tracking Number:</span> {trackingData.tracking_number}</p>
              )}
              {trackingData.tracking_url && (
                <p>
                  <a
                    href={trackingData.tracking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    Open courier tracking link
                  </a>
                </p>
              )}
              {trackingData.estimated_delivery && (
                <p>
                  <span className="font-medium">Estimated Delivery:</span>{' '}
                  {new Date(trackingData.estimated_delivery).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {trackingData.updates && trackingData.updates.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Latest Updates</h3>
            <div className="space-y-4">
              {trackingData.updates.map((update) => (
                <div key={update.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-gray-900">{update.note}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(update.date).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/account/orders"
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Orders
          </Link>
          <Link
            href="/contact"
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Need Help? Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
