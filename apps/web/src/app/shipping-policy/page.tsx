import type { Metadata } from 'next';
import { COMPANY } from '@/lib/companyProfile';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Learn about Emart\'s shipping policies, delivery times, and shipping rates across Bangladesh.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink">Shipping Policy</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-muted prose-headings:text-ink prose-strong:text-ink prose-li:text-muted prose-th:text-ink prose-td:text-muted">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Shipping Areas</h2>
          <p>
            We ship nationwide across Bangladesh. Whether you're in Dhaka, Chattogram, Khulna, or any other district,
            we deliver authentic skincare products to your doorstep.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Delivery Times</h2>
          <div className="space-y-3 mt-3">
            <div>
              <p className="font-semibold text-ink">🔥 Dhaka (Inside Dhaka City)</p>
              <p>Next-day delivery available on orders placed before 6 PM</p>
            </div>
            <div>
              <p className="font-semibold text-ink">📦 Greater Dhaka Area</p>
              <p>2 business days delivery</p>
            </div>
            <div>
              <p className="font-semibold text-ink">🚚 Other Districts</p>
              <p>3-5 business days delivery depending on location</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Shipping Rates</h2>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="bg-bg-alt">
                <th className="border border-hairline px-3 py-2 text-left font-semibold">Area</th>
                <th className="border border-hairline px-3 py-2 text-left font-semibold">Shipping Cost</th>
                <th className="border border-hairline px-3 py-2 text-left font-semibold">Free Shipping</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-hairline px-3 py-2">Dhaka City</td>
                <td className="border border-hairline px-3 py-2">৳60-80</td>
                <td className="border border-hairline px-3 py-2">৳3,000+</td>
              </tr>
              <tr className="bg-bg">
                <td className="border border-hairline px-3 py-2">Surrounding Areas</td>
                <td className="border border-hairline px-3 py-2">৳120-200</td>
                <td className="border border-hairline px-3 py-2">৳3,500+</td>
              </tr>
              <tr>
                <td className="border border-hairline px-3 py-2">Other Districts</td>
                <td className="border border-hairline px-3 py-2">৳150-300</td>
                <td className="border border-hairline px-3 py-2">৳4,000+</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Order Processing</h2>
          <p>
            <strong>Processing Time:</strong> Orders are processed and dispatched within 24 hours of confirmation.
            We prepare your order carefully to ensure it arrives safely.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Order Tracking</h2>
          <p>
            Once your order is dispatched, you'll receive a tracking number via SMS and email.
            You can track your shipment in real-time using the tracking link provided.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Packaging & Safety</h2>
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
          <h2 className="mb-3 text-lg font-semibold text-ink">Delayed or Lost Shipments</h2>
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
          <h2 className="mb-3 text-lg font-semibold text-ink">International Shipping</h2>
          <p>
            Currently, we do not offer international shipping. We ship only within Bangladesh.
            For international orders, please   visit our boutique or contact us for special arrangements.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Special Requests</h2>
          <p>
            If you have a special delivery request (specific time, date, or location),
            please add a note during checkout or contact us. We'll do our best to accommodate your needs.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-hairline bg-card p-4 shadow-card">
          <p className="text-sm text-ink-2">
            <strong>Delivery Issues?</strong> Contact our support team at <a href={`mailto:${COMPANY.supportEmail}`} className="text-accent hover:underline">{COMPANY.supportEmail}</a> or call <a href={`tel:${COMPANY.phones.hotlineHref}`} className="text-accent hover:underline">{COMPANY.phones.hotline}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
