import type { Metadata } from 'next';
import { COMPANY } from '@/lib/companyProfile';

export const metadata: Metadata = {
  title: { absolute: 'Return Policy | eMart Skincare Bangladesh' },
  description: '7-day return and exchange policy for new, unused and unopened skincare products. Customer is responsible for return courier cost.',
  alternates: { canonical: 'https://e-mart.com.bd/return-policy' },
  robots: { index: true, follow: true },
};

export default function ReturnPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink">Return & Refund Policy</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-muted prose-headings:text-ink prose-strong:text-ink prose-li:text-muted">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Overview</h2>
          <p>
            Emart Skincare Bangladesh accepts returns for defective and non-defective products within 7 days
            from delivery, as long as the product meets the condition requirements below.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">7-Day Return Window</h2>
          <p>
            You can request a return or exchange within 7 days from delivery. Exchanges are accepted within
            the same 7-day window.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Return Eligibility</h2>
          <p>Products can be returned if:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>Return is requested within 7 days of delivery</li>
            <li>Product is new, unused, and unopened</li>
            <li>Original seal, packaging, and boxes are intact</li>
            <li>Product is not damaged due to customer mishandling</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Defective or Damaged Products</h2>
          <p>
            If you receive a damaged, defective, or incorrect product, please contact us immediately.
            Our support team will help inspect the case and guide the return or exchange process.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">How to Initiate a Return</h2>
          <ol className="mt-2 list-decimal list-inside space-y-2">
            <li>Contact our customer service at <a href={`mailto:${COMPANY.supportEmail}`} className="text-accent hover:underline">{COMPANY.supportEmail}</a></li>
            <li>Provide your order number and reason for return</li>
            <li>We will share the return address for mail/courier return</li>
            <li>Customer is responsible for the return courier or label cost</li>
            <li>Pack the product securely and send it back to us</li>
            <li>Once received and inspected, we will process your refund within 5 days</li>
          </ol>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Refund Timeline</h2>
          <p>
            <strong>Processing Time:</strong> 5 days after inspection<br />
            <strong>Return courier/label:</strong> Customer responsibility<br />
            <strong>Restocking fee:</strong> No cost
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Non-Returnable Items</h2>
          <p>The following items cannot be returned:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>Used or opened products (except for defects)</li>
            <li>Products damaged due to customer mishandling</li>
            <li>Items returned after 7 days</li>
            <li>Products without original seal or packaging intact</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Exchange Policy</h2>
          <p>
            If you'd like to exchange a product for a different size, variant, or item,
            you can do so within 7 days. Contact us with your order number and the item you'd like to exchange.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-hairline bg-card p-4 shadow-card">
          <p className="text-sm text-ink-2">
            <strong>Questions?</strong> Contact our return support team at <a href={`mailto:${COMPANY.supportEmail}`} className="text-accent hover:underline">{COMPANY.supportEmail}</a> or call <a href={`tel:${COMPANY.phones.primaryHref}`} className="text-accent hover:underline">{COMPANY.phones.primary}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
