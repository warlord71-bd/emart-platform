import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Return & Refund Policy',
  description: 'Learn about Emart\'s return and refund policy. We stand behind our products with a 7-day money-back guarantee.',
};

export default function ReturnPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-6">Return & Refund Policy</h1>

      <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Overview</h2>
          <p>
            At Emart Skincare Bangladesh, we want you to be completely satisfied with your purchase.
            If you're not happy with your order for any reason, we're here to help.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">7-Day Money-Back Guarantee</h2>
          <p>
            We offer a 7-day money-back guarantee on all products. If you're unsatisfied with your purchase,
            you can return it for a full refund or exchange within 7 days of delivery.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Return Eligibility</h2>
          <p>Products can be returned if:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>Return is requested within 7 days of delivery</li>
            <li>Product is unused and unopened (in original packaging)</li>
            <li>All packaging, seals, and original boxes are intact</li>
            <li>Product is not damaged due to customer mishandling</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Defective or Damaged Products</h2>
          <p>
            If you receive a damaged, defective, or incorrect product, please contact us immediately.
            We will replace the product or issue a full refund at no cost to you.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">How to Initiate a Return</h2>
          <ol className="list-decimal list-inside space-y-2 mt-2">
            <li>Contact our customer service at <a href="mailto:emart.bdofficial@gmail.com" className="text-[#e8197a] hover:underline">emart.bdofficial@gmail.com</a></li>
            <li>Provide your order number and reason for return</li>
            <li>We'll provide you with a return shipping label/address</li>
            <li>Pack the product securely and ship it back to us</li>
            <li>Once received and inspected, we'll process your refund within 3-5 business days</li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Refund Timeline</h2>
          <p>
            <strong>Processing Time:</strong> 3-5 business days after we receive your return<br />
            <strong>Bank Transfer:</strong> 1-3 business days (depending on your bank)<br />
            <strong>bKash/Nagad:</strong> Instant refund to your account
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Non-Returnable Items</h2>
          <p>The following items cannot be returned:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>Used or opened products (except for defects)</li>
            <li>Products damaged due to customer mishandling</li>
            <li>Items returned after 7 days</li>
            <li>Products purchased on clearance or final sale</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Exchange Policy</h2>
          <p>
            If you'd like to exchange a product for a different size, variant, or item,
            you can do so within 7 days. Contact us with your order number and the item you'd like to exchange.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
          <p className="text-sm text-green-900">
            <strong>Questions?</strong> Contact our return support team at <a href="mailto:emart.bdofficial@gmail.com" className="text-[#e8197a] hover:underline">emart.bdofficial@gmail.com</a> or call <a href="tel:+8809697597399" className="text-[#e8197a] hover:underline">+880 9697-597399</a>
          </p>
        </div>
      </div>
    </div>
  );
}
