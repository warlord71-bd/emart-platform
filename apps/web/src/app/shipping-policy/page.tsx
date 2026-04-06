import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Learn about Emart\'s shipping policies, delivery times, and shipping rates across Bangladesh.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-6">Shipping Policy</h1>

      <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Shipping Areas</h2>
          <p>
            We ship nationwide across Bangladesh. Whether you're in Dhaka, Chattogram, Khulna, or any other district,
            we deliver authentic skincare products to your doorstep.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Delivery Times</h2>
          <div className="space-y-3 mt-3">
            <div>
              <p className="font-semibold text-[#1a1a2e]">🔥 Dhaka (Inside Dhaka City)</p>
              <p>Next-day delivery available on orders placed before 6 PM</p>
            </div>
            <div>
              <p className="font-semibold text-[#1a1a2e]">📦 Greater Dhaka Area</p>
              <p>2 business days delivery</p>
            </div>
            <div>
              <p className="font-semibold text-[#1a1a2e]">🚚 Other Districts</p>
              <p>3-5 business days delivery depending on location</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Shipping Rates</h2>
          <table className="w-full text-sm border-collapse mt-3">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Area</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Shipping Cost</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Free Shipping</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-3 py-2">Dhaka City</td>
                <td className="border border-gray-200 px-3 py-2">৳60-80</td>
                <td className="border border-gray-200 px-3 py-2">৳3,000+</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-3 py-2">Surrounding Areas</td>
                <td className="border border-gray-200 px-3 py-2">৳120-200</td>
                <td className="border border-gray-200 px-3 py-2">৳3,500+</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2">Other Districts</td>
                <td className="border border-gray-200 px-3 py-2">৳150-300</td>
                <td className="border border-gray-200 px-3 py-2">৳4,000+</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Order Processing</h2>
          <p>
            <strong>Processing Time:</strong> Orders are processed and dispatched within 24 hours of confirmation.
            We prepare your order carefully to ensure it arrives safely.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Order Tracking</h2>
          <p>
            Once your order is dispatched, you'll receive a tracking number via SMS and email.
            You can track your shipment in real-time using the tracking link provided.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Packaging & Safety</h2>
          <p>
            All products are carefully packaged in protective boxes with cushioning materials.
            We ensure your skincare products arrive in perfect condition. Each order includes:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>Secure protective packaging</li>
            <li>Temperature-safe materials</li>
            <li>Quality check before dispatch</li>
            <li>Tracking information</li>
            <li>Insurance coverage</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Delayed or Lost Shipments</h2>
          <p>
            In rare cases where a shipment is delayed or lost:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>Contact us immediately with your order number</li>
            <li>We'll investigate the issue with our courier partner</li>
            <li>If the package is lost, we'll send a replacement or issue a full refund</li>
            <li>All replacements are sent at no additional cost to you</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">International Shipping</h2>
          <p>
            Currently, we do not offer international shipping. We ship only within Bangladesh.
            For international orders, please   visit our boutique or contact us for special arrangements.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Special Requests</h2>
          <p>
            If you have a special delivery request (specific time, date, or location),
            please add a note during checkout or contact us. We'll do our best to accommodate your needs.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <p className="text-sm text-blue-900">
            <strong>Delivery Issues?</strong> Contact our support team at <a href="mailto:emart.bdofficial@gmail.com" className="text-[#e8197a] hover:underline">emart.bdofficial@gmail.com</a> or call <a href="tel:+8809697597399" className="text-[#e8197a] hover:underline">+880 9697-597399</a>
          </p>
        </div>
      </div>
    </div>
  );
}
